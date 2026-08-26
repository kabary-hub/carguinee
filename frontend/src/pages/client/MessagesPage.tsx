import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "../../components/AppShell";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { TranslateButton } from "../../components/client/TranslateButton";
import { getHomeRouteForRole } from "../../lib/roles";

// ── Types ─────────────────────────────────────────────────────────────────────

type Conversation = {
  id: string;
  participant1: { id: string; firstName: string; lastName: string };
  participant2: { id: string; firstName: string; lastName: string };
  lastMessage: string | null;
  lastMessageAt: string;
  vehicleId: string | null;
  messages: { sender: { id: string; firstName: string }; content: string }[];
  _count?: { messages: number };
  unreadCount?: number;
};

type Message = {
  id: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: { id: string; firstName: string; lastName: string };
  receiver: { id: string; firstName: string; lastName: string };
};

// ── Helpers dates ─────────────────────────────────────────────────────────────

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function canEdit(sentAt: string): boolean {
  return Date.now() - new Date(sentAt).getTime() < 5 * 60 * 1000;
}

// ── Page principale ───────────────────────────────────────────────────────────

export function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();

  if (conversationId) {
    return <ChatWindow conversationId={conversationId} currentUserId={user.id} />;
  }

  return <ConversationList currentUserId={user.id} />;
}

// ── Liste des conversations ───────────────────────────────────────────────────

function ConversationList({ currentUserId }: { currentUserId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [convPage, setConvPage] = useState(1);
  const CONV_PAGE_SIZE = 10;

  useEffect(() => {
    apiFetch<{ status: string; data: Conversation[] }>("/api/messages/conversations")
      .then((response) => setConversations(response.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getOtherParticipant = (conv: Conversation) =>
    conv.participant1.id === currentUserId ? conv.participant2 : conv.participant1;

  return (
    <AppShell>
      <div className="min-h-screen px-3 pt-3 pb-20 sm:px-6 sm:pt-6 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => navigate(getHomeRouteForRole(user?.role ?? "CLIENT"))}
              className="flex-none text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <h1 className="truncate text-xl font-black sm:text-2xl">💬 {t("nav.messages")}</h1>
          </div>

          {loading && (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && conversations.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-slate-400 dark:text-slate-500">
                {t("messages.noConversations", "Aucune conversation")}
              </p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {t("favorites.contactOwnerHint", "Contactez un propriétaire pour démarrer une conversation.")}
              </p>
            </div>
          )}

          {conversations.length > 0 && (() => {
            const totalPages = Math.ceil(conversations.length / CONV_PAGE_SIZE);
            const paged = conversations.slice((convPage - 1) * CONV_PAGE_SIZE, convPage * CONV_PAGE_SIZE);
            return (
              <>
                <div className="space-y-2">
                  {paged.map((conv) => {
                    const other = getOtherParticipant(conv);
                    const lastMsg = conv.messages[0];
                    return (
                      <Link
                        key={conv.id}
                        to={`/messages/${conv.id}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:gap-4 sm:p-4"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 sm:h-10 sm:w-10 sm:text-sm dark:bg-emerald-500/15 dark:text-emerald-300">
                          {other.firstName?.[0]}{other.lastName?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {other.firstName} {other.lastName}
                            </span>
                            <div className="flex flex-shrink-0 items-center gap-1.5">
                              {(conv.unreadCount ?? 0) > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                                  {conv.unreadCount}
                                </span>
                              )}
                              <span className="whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
                                {new Date(conv.lastMessageAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                          {lastMsg && (
                            <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">
                              {lastMsg.sender.id === currentUserId ? "Vous : " : ""}
                              {lastMsg.content}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {convPage}/{totalPages} · {conversations.length} conversation(s)
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setConvPage((p) => Math.max(1, p - 1))} disabled={convPage <= 1}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
                        ← Préc.
                      </button>
                      <button onClick={() => setConvPage((p) => Math.min(totalPages, p + 1))} disabled={convPage >= totalPages}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
                        Suiv. →
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

// ── Fenêtre de chat ───────────────────────────────────────────────────────────

function ChatWindow({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const { t } = useTranslation();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [initialUnreadCount, setInitialUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiFetch<{ status: string; data: { items: Message[]; unreadCount?: number } }>(`/api/messages/conversations/${conversationId}/messages`),
  });

  const messages = data?.data.items ?? [];
  const unreadCapturedRef = useRef(false);
  if (!unreadCapturedRef.current && data?.data.unreadCount !== undefined) {
    setInitialUnreadCount(data.data.unreadCount);
    unreadCapturedRef.current = true;
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const adjustTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  useEffect(() => { if (textareaRef.current) adjustTextarea(textareaRef.current); }, [newMessage]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await apiFetch<{ status: string; data: Message }>(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      queryClient.setQueryData(["messages", conversationId], (old: any) =>
        old ? { ...old, data: { ...old.data, items: [...old.data.items, res.data] } } : old
      );
      setNewMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch { /* */ } finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
    setTimeout(() => {
      const el = document.getElementById(`edit-${msg.id}`) as HTMLTextAreaElement | null;
      el?.focus();
    }, 50);
  };

  const cancelEdit = () => { setEditingId(null); setEditContent(""); };

  const saveEdit = async (messageId: string) => {
    const content = editContent.trim();
    if (!content) return;
    try {
      const res = await apiFetch<{ status: string; data: Message }>(`/api/messages/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ content }) });
      queryClient.setQueryData(["messages", conversationId], (old: any) =>
        old ? { ...old, data: { ...old.data, items: old.data.items.map((m: Message) => m.id === messageId ? res.data : m) } } : old
      );
      cancelEdit();
    } catch { /* */ }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const messageId = deleteTargetId;
    setDeleteTargetId(null);
    try {
      const res = await apiFetch<{ status: string; data: Message }>(`/api/messages/messages/${messageId}`, { method: "DELETE" });
      queryClient.setQueryData(["messages", conversationId], (old: any) =>
        old ? { ...old, data: { ...old.data, items: old.data.items.map((m: Message) => m.id === messageId ? res.data : m) } } : old
      );
      showToast("Message supprimé.", "success");
    } catch {
      showToast("Impossible de supprimer le message.", "error");
    }
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100dvh-96px)] flex-col sm:h-[calc(100vh-96px)]">
        {/* Header */}
        <div className="flex-none border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Link
              to="/messages"
              className="flex-none text-slate-500 transition hover:text-emerald-600 dark:text-slate-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </Link>
            <h1 className="truncate text-base font-bold sm:text-lg">💬 {t("nav.messages", "Conversation")}</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2 sm:px-6">
          {isLoading && (
            <div className="space-y-2 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                  <div className="h-10 w-32 animate-pulse rounded-2xl bg-slate-200 sm:w-48 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <p className="py-16 text-center text-sm text-slate-400">
              {t("messages.noMessages", "Aucun message")}
            </p>
          )}

          {messages.map((msg, idx) => {
            const isMine = msg.sender.id === currentUserId;
            const isEditing = editingId === msg.id;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDateSep = !prevMsg || !isSameDay(prevMsg.sentAt, msg.sentAt);
            const unreadIdx = messages.length - initialUnreadCount;
            const showUnreadSep = initialUnreadCount > 0 && idx === unreadIdx;

            return (
              <div key={msg.id}>
                {showUnreadSep && (
                  <div className="flex items-center gap-2 py-2 sm:gap-3">
                    <div className="h-px flex-1 bg-emerald-400 dark:bg-emerald-600" />
                    <span className="flex-shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white sm:text-xs">
                      {initialUnreadCount} {t("messages.unreadMessages", "unread")}
                    </span>
                    <div className="h-px flex-1 bg-emerald-400 dark:bg-emerald-600" />
                  </div>
                )}
                {showDateSep && (
                  <div className="flex items-center gap-2 py-2 sm:gap-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="flex-shrink-0 text-[10px] font-semibold text-slate-400 sm:text-[11px] dark:text-slate-500">
                      {formatDateSeparator(msg.sentAt)}
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                )}
                <div className={`flex py-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                    isMine
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                  }`}>
                    {isEditing ? (
                      <div>
                        <textarea
                          id={`edit-${msg.id}`}
                          value={editContent}
                          onChange={(e) => { setEditContent(e.target.value); adjustTextarea(e.target); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id); }
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full resize-none rounded border border-emerald-300 bg-white px-2 py-1 text-sm text-black focus:ring-2 focus:ring-emerald-400 dark:border-emerald-600 dark:bg-slate-900 dark:text-white"
                          rows={1}
                          style={{ minHeight: "2rem" }}
                        />
                        <div className="mt-1 flex gap-2">
                          <button onClick={() => saveEdit(msg.id)} className="text-xs font-bold text-emerald-200 hover:text-white">
                            Enregistrer
                          </button>
                          <button onClick={cancelEdit} className="text-xs font-bold text-white/50 hover:text-white">
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    {!isEditing && (
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <span className={`text-[10px] ${isMine ? 'text-emerald-200/80' : 'text-slate-400'}`}>
                          {new Date(msg.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {msg.editedAt && " ✎"}
                        </span>
                        <div className="flex items-center">
                          {!isMine && (
                            <TranslateButton
                              text={msg.content}
                              userLang={navigator.language.split("-")[0]}
                            />
                          )}
                          {isMine && (
                            <div className="relative" ref={openMenuId === msg.id ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                className="rounded px-1 py-0.5 text-[13px] leading-none text-white/50 hover:text-white"
                              >⋮</button>
                              {openMenuId === msg.id && (
                                <div className="absolute bottom-full right-0 z-50 mb-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                  {canEdit(msg.sentAt) && (
                                    <button onClick={() => { startEdit(msg); setOpenMenuId(null); }}
                                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                                      <span>✏️</span><span>Modifier</span>
                                    </button>
                                  )}
                                  <button onClick={() => { navigator.clipboard.writeText(msg.content); setOpenMenuId(null); showToast("Copié !", "success"); }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <span>📋</span><span>Copier</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-700" />
                                  <button onClick={() => { setDeleteTargetId(msg.id); setOpenMenuId(null); }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                                    <span>🗑️</span><span>Supprimer</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-none border-t border-slate-200 p-2 sm:p-3 dark:border-slate-800">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("messages.typePlaceholder", "Écrire un message...")}
              rows={1}
              className="min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title={t("messages.confirmDeleteTitle", "Supprimer ce message ?")}
        message={t("messages.confirmDeleteMessage", "Cette action est irréversible.")}
        confirmLabel={t("common.delete", "Supprimer")}
        tone="rose"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </AppShell>
  );
}
