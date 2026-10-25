import { z } from "zod";

export const conversationTypeSchema = z.enum(["INTEREST", "DIRECT"]);
export type ConversationType = z.infer<typeof conversationTypeSchema>;

export const messageKindSchema = z.enum(["INTEREST_NOTE", "MESSAGE", "SYSTEM"]);
export type MessageKind = z.infer<typeof messageKindSchema>;

/** A conversation participant (one buyer + one manufacturer for now). */
export interface ConversationParticipantDto {
  accountId: string;
  role: "BUYER" | "MANUFACTURER" | "ADMIN";
  companyName?: string | null;
  email?: string;
}

export interface MessageAttachmentDto {
  id: string;
  originalName: string;
  contentType: string;
  /** Short-lived signed download URL (populated when listing messages). */
  url?: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderAccountId: string | null;
  senderRole?: "BUYER" | "MANUFACTURER" | "ADMIN" | null;
  kind: MessageKind;
  body: string;
  attachments: MessageAttachmentDto[];
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  type: ConversationType;
  subject?: string | null;
  seedCardId?: string | null;
  seedInquiryId?: string | null;
  participants: ConversationParticipantDto[];
  /** The other party relative to the caller (for list display). */
  otherParty?: ConversationParticipantDto | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  updatedAt: string;
  messageCount: number;
}

/** Body for posting a message to a conversation the caller belongs to.
 *  Attachments are uploaded inline as multipart `attachments` files. */
export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message is required").max(4000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/** Allowed file types + size for message attachments (mirrors catalogue upload). */
export const MESSAGE_FILE_LIMIT_BYTES = 10 * 1024 * 1024;
export const MESSAGE_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
