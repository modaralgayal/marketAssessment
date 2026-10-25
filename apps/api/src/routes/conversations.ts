import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  sendMessageSchema,
  MESSAGE_FILE_LIMIT_BYTES,
  MESSAGE_FILE_TYPES,
  type ConversationDto,
  type MessageDto,
  type ConversationParticipantDto,
  type MessageAttachmentDto,
} from "@mea/shared";

export const conversationsRouter = Router();

const messageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MESSAGE_FILE_LIMIT_BYTES },
  fileFilter: (_req, file, cb) => {
    if ((MESSAGE_FILE_TYPES as readonly string[]).includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported attachment type"));
  },
});

/** The signed-in account's participant row for a conversation, or null if not a member. */
async function assertParticipant(conversationId: string, accountId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_accountId: { conversationId, accountId } },
  });
}

function participantDto(p: any): ConversationParticipantDto {
  return {
    accountId: p.accountId,
    role: p.role,
    companyName:
      p.account?.manufacturerProfile?.companyName ?? p.account?.buyerProfile?.companyName ?? null,
    email: p.account?.email ?? undefined,
  };
}

function attachmentDto(f: any, url?: string): MessageAttachmentDto {
  return {
    id: f.id,
    originalName: f.originalName,
    contentType: f.contentType,
    ...(url ? { url } : {}),
  };
}

async function toMessageDto(m: any): Promise<MessageDto> {
  const attachments = await Promise.all(
    (m.attachments ?? []).map(async (f: any) => {
      let url: string | undefined;
      try {
        url = await storage.getSignedUrl(f.storageKey, 300);
      } catch {
        url = undefined;
      }
      return attachmentDto(f, url);
    }),
  );
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderAccountId: m.senderAccountId ?? null,
    senderRole: m.sender ? m.sender.role : null,
    kind: m.kind,
    body: m.body,
    attachments,
    createdAt: m.createdAt.toISOString(),
  };
}

async function toConversationDto(
  c: any,
  viewerAccountId: string,
  messageCount?: number,
): Promise<ConversationDto> {
  const participants: ConversationParticipantDto[] = c.participants.map(participantDto);
  const other = participants.find((p) => p.accountId !== viewerAccountId) ?? null;
  const last = c.messages?.[0];
  return {
    id: c.id,
    type: c.type,
    subject: c.subject ?? null,
    seedCardId: c.seedCardId ?? null,
    seedInquiryId: c.seedInquiryId ?? null,
    participants,
    otherParty: other,
    lastMessagePreview: last ? last.body : null,
    lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
    updatedAt: c.updatedAt.toISOString(),
    messageCount: messageCount ?? (c._count?.messages ?? 0),
  };
}

/** List the signed-in account's conversations, newest activity first. */
conversationsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { accountId: req.account!.id } } },
      orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      include: {
        participants: {
          include: { account: { include: { manufacturerProfile: true, buyerProfile: true } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    });
    return res.json(await Promise.all(conversations.map((c) => toConversationDto(c, req.account!.id))));
  } catch (err) {
    next(err);
  }
});

/** Get one conversation's messages (caller must be a participant). */
conversationsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const member = await assertParticipant(req.params.id, req.account!.id);
    if (!member) return res.status(403).json({ error: "Not a participant in this conversation" });
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          include: { account: { include: { manufacturerProfile: true, buyerProfile: true } } },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true, sender: { select: { role: true } } },
        },
      },
    });
    if (!conversation) return res.status(404).json({ error: "Not found" });
    return res.json({
      conversation: await toConversationDto(
        { ...conversation, messages: [] },
        req.account!.id,
        conversation.messages.length,
      ),
      messages: await Promise.all(conversation.messages.map(toMessageDto)),
    });
  } catch (err) {
    next(err);
  }
});

/** Post a message (with optional inline attachments) to a conversation the caller belongs to. */
conversationsRouter.post(
  "/:id/messages",
  requireAuth,
  messageUpload.array("attachments", 10),
  async (req, res, next) => {
    try {
      const member = await assertParticipant(req.params.id, req.account!.id);
      if (!member) return res.status(403).json({ error: "Not a participant in this conversation" });
      const parsed = sendMessageSchema.parse(req.body);
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const attachments = await Promise.all(
        files.map(async (f) => {
          const key = `conversations/${req.params.id}/msg-${randomUUID()}${path.extname(f.originalname).toLowerCase()}`;
          await storage.put(key, f.buffer, f.mimetype);
          return {
            storageKey: key,
            originalName: f.originalname,
            contentType: f.mimetype,
            sizeBytes: f.size,
          };
        }),
      );
      const created = await prisma.message.create({
        data: {
          conversationId: req.params.id,
          senderAccountId: req.account!.id,
          kind: "MESSAGE",
          body: parsed.body,
          attachments: attachments.length > 0 ? { create: attachments } : undefined,
        },
        include: { attachments: true, sender: { select: { role: true } } },
      });
      await prisma.conversation.update({
        where: { id: req.params.id },
        data: { lastMessageAt: new Date() },
      });
      return res.status(201).json(await toMessageDto(created));
    } catch (err) {
      next(err);
    }
  },
);

/** Download a message attachment (participant-only, resolved via the file's conversation). */
conversationsRouter.get("/attachments/:fileId/download", requireAuth, async (req, res, next) => {
  try {
    const file = await prisma.messageFile.findUnique({
      where: { id: req.params.fileId },
      include: { message: { select: { conversationId: true } } },
    });
    if (!file || !file.message) return res.status(404).json({ error: "File not found" });
    const member = await assertParticipant(file.message.conversationId, req.account!.id);
    if (!member) return res.status(403).json({ error: "Not a participant in this conversation" });
    const url = await storage.getSignedUrl(file.storageKey, 300);
    return res.json({ url, originalName: file.originalName });
  } catch (err) {
    next(err);
  }
});
