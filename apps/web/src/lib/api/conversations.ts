import { authedFetch, BASE } from "./_core";
import type { ConversationDto, MessageDto } from "@mea/shared";



// ── Conversations (buyer ⇄ manufacturer messaging) ───────────────────────────

export async function fetchConversations(): Promise<ConversationDto[]> {
  const res = await authedFetch(`${BASE}/api/conversations`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load conversations");
  }
  return res.json();
}



export interface ConversationThread {
  conversation: ConversationDto;
  messages: MessageDto[];
}



export async function fetchConversation(id: string): Promise<ConversationThread> {
  const res = await authedFetch(`${BASE}/api/conversations/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load conversation");
  }
  return res.json();
}



/** Post a message (with optional inline attachments) to a conversation. */
export async function sendConversationMessage(
  conversationId: string,
  body: string,
  files?: File[],
): Promise<MessageDto> {
  const form = new FormData();
  form.append("body", body);
  for (const f of files ?? []) form.append("attachments", f);
  const res = await authedFetch(`${BASE}/api/conversations/${conversationId}/messages`, { method: "POST", body: form });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? "Failed to send message");
  }
  return res.json();
}



/** Get a short-lived signed download URL for a message attachment. */
export async function fetchConversationAttachmentUrl(
  fileId: string,
): Promise<{ url: string; originalName: string }> {
  const res = await authedFetch(`${BASE}/api/conversations/attachments/${fileId}/download`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to get attachment");
  }
  return res.json();
}
