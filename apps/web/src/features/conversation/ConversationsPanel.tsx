import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../lib/auth";
import {
  fetchConversations,
  fetchConversation,
  sendConversationMessage,
  fetchConversationAttachmentUrl,
  type ConversationDto,
  type MessageDto,
} from "../../lib/api";

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ConversationsPanel() {
  const { account } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const list = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 15000,
  });

  const thread = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: () => fetchConversation(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: 10000,
  });

  const send = useMutation({
    mutationFn: () => sendConversationMessage(selectedId!, draft, files),
    onSuccess: () => {
      setDraft("");
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["conversation", selectedId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const conversations = (list.data ?? []) as ConversationDto[];

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* List */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-brand-line px-4 py-3">
            <p className="text-sm font-semibold text-brand-ink">Conversations</p>
          </div>
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-brand-muted">
              No conversations yet. Express interest in a manufacturer offer to start one — your
              interest note becomes the first message.
            </p>
          ) : (
            <ul className="divide-y divide-brand-line">
              {conversations.map((c) => {
                const other = c.otherParty;
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        active ? "bg-brand-teal/10" : "hover:bg-brand-bg-alt"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/15 text-xs font-semibold text-brand-teal">
                        {initials(other?.companyName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand-ink">
                          {other?.companyName ?? "Conversation"}
                        </p>
                        <p className="truncate text-xs text-brand-muted">
                          {c.lastMessagePreview ?? "No messages yet"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-brand-muted">
                        {timeAgo(c.lastMessageAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Thread */}
      <Card>
        <CardContent className="flex h-[70vh] flex-col p-0">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-brand-muted">
              Select a conversation to view the thread.
            </div>
          ) : thread.isLoading ? (
            <p className="p-4 text-sm text-brand-muted">Loading…</p>
          ) : !thread.data ? (
            <p className="p-4 text-sm text-brand-muted">Conversation not found.</p>
          ) : (
            <>
              <div className="border-b border-brand-line px-4 py-3">
                <p className="text-sm font-semibold text-brand-ink">
                  {thread.data.conversation.otherParty?.companyName ?? "Conversation"}
                </p>
                {thread.data.conversation.subject && (
                  <p className="text-xs text-brand-muted">{thread.data.conversation.subject}</p>
                )}
              </div>

              <ThreadMessages messages={thread.data.messages} viewerId={account?.id} />

              <div className="border-t border-brand-line p-3">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="min-h-[64px] resize-none"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))}
                    className="text-xs text-brand-muted file:mr-2 file:rounded-lg file:border-0 file:bg-brand-bg-alt file:px-2 file:py-1 file:text-brand-ink"
                  />
                  {files.map((f) => (
                    <Badge key={f.name} className="bg-brand-bg-alt text-brand-muted">
                      {f.name}
                    </Badge>
                  ))}
                  <Button
                    className="ml-auto"
                    size="sm"
                    disabled={!draft.trim() || send.isPending}
                    onClick={() => send.mutate()}
                  >
                    {send.isPending ? "Sending…" : "Send"}
                  </Button>
                </div>
                {send.isError && (
                  <p className="mt-1 text-xs text-red-600">{(send.error as Error).message}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ThreadMessages({ messages, viewerId }: { messages: MessageDto[]; viewerId?: string }) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-brand-bg-alt/40 p-4">
      {messages.map((m) => {
        if (m.kind === "INTEREST_NOTE") {
          return (
            <div key={m.id} className="rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-teal">
                Interest note
              </p>
              <p className="whitespace-pre-wrap text-sm text-brand-ink">{m.body}</p>
              <MessageAttachments message={m} />
              <p className="mt-1 text-[11px] text-brand-muted">{timeAgo(m.createdAt)}</p>
            </div>
          );
        }
        if (m.kind === "SYSTEM") {
          return (
            <p key={m.id} className="text-center text-xs text-brand-muted">
              {m.body}
            </p>
          );
        }
        const isSelf = m.senderAccountId != null && m.senderAccountId === viewerId;
        return (
          <div key={m.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                isSelf
                  ? "rounded-br-sm bg-brand-teal text-white"
                  : "rounded-bl-sm bg-white text-brand-ink"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <MessageAttachments message={m} light={isSelf} />
            </div>
            <span className="sr-only">{timeAgo(m.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}

function MessageAttachments({ message, light }: { message: MessageDto; light?: boolean }) {
  if (!message.attachments?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {message.attachments.map((a) => (
        <li key={a.id}>
          <a
            onClick={async () => {
              try {
                const { url } = await fetchConversationAttachmentUrl(a.id);
                window.open(url, "_blank", "noopener");
              } catch {
                /* ignore */
              }
            }}
            className={`text-xs underline ${light ? "text-white/90" : "text-brand-teal"}`}
          >
            📎 {a.originalName}
          </a>
        </li>
      ))}
    </ul>
  );
}
