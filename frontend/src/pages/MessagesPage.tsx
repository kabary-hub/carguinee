import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../lib/api";
import { TranslateButton } from "../components/TranslateButton";
import { getHomeRouteForRole } from "../lib/roles";

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

/** Formate une date pour un séparateur visuel entre groupes de messages */
function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/** Vérifie si deux dates sont dans le même jour */
function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** Vérifie si un message est encore modifiable (moins de 5 minutes) */
function canEdit(sentAt: string): boolean {
  const fiveMinMs = 5 * 60 * 1000;
  return Date.now() - new Date(sentAt).getTime() < fiveMinMs;
}

// ── Page principale ───────────────────────────────────────────────────────────

export function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();



  if (conversationId) {
    return (
      <ChatWindow conversationId={conversationId} currentUserId={user.id} />
    );
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

  useEffect(() => {
    apiFetch<{ status: string; data: Conversation[] }>(
      `/api/messages/conversations`,
    )
      .then((response) => setConversations(response.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getOtherParticipant = (conv: Conversation) =>
    conv.participant1.id === currentUserId ? conv.participant2 : conv.participant1;

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          onClick={() => navigate(getHomeRouteForRole(user?.role ?? "CLIENT"))}
          className="flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400"
        >
          ← {t("common.back")}
        </button>
        <h1 className="mt-2 text-3xl font-black">💬 {t("nav.messages")}</h1>

        {loading && (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("common.loading")}
          </p>
        )}

        {!loading && conversations.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-lg text-slate-500 dark:text-slate-400">
              {t("messages.noConversations")}
            </p>
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              {t("favorites.contactOwnerHint")}
            </p>
          </div>
        )}

        {conversations.length > 0 && (
          <div className="mt-6 space-y-2">
            {conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const lastMsg = conv.messages[0];
              return (
                <Link
                  key={conv.id}
                  to={`/messages/${conv.id}`}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {other.firstName[0]}
                    {other.lastName[0]}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {other.firstName} {other.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        {(conv.unreadCount ?? 0) > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(conv.lastMessageAt).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                      </div>
                    </div>
                    {lastMsg && (
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {lastMsg.sender.id === currentUserId ? "Vous: " : ""}
                        {lastMsg.content}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [initialUnreadCount, setInitialUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { showToast } = useToast();

  // ── Edit mode ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Delete confirmation ──
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ── Menu contextuel (trois points) ──
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // ── Charger les messages ──
  const loadMessages = useCallback(async () => {
    try {
      const response = await apiFetch<{
        status: string;
        data: { items: Message[]; unreadCount?: number };
      }>(`/api/messages/conversations/${conversationId}/messages`);
      setMessages(response.data.items);
      if (response.data.unreadCount !== undefined) {
        setInitialUnreadCount(response.data.unreadCount);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ── Scroll automatique vers le bas ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-grow textarea ──
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [newMessage]);

  // ── Envoyer un message ──
  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const response = await apiFetch<{ status: string; data: Message }>(
        `/api/messages/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ content }) },
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setSending(false);
    }
  };

  // ── Clavier : Enter = envoi, Shift+Enter = retour ligne ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Modifier un message ──
  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
    // Focus l'éditeur après le rendu
    setTimeout(() => editTextareaRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async (messageId: string) => {
    const content = editContent.trim();
    if (!content) return;

    try {
      const response = await apiFetch<{ status: string; data: Message }>(
        `/api/messages/messages/${messageId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content }),
        },
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? response.data : m)),
      );
      cancelEdit();
    } catch {
      // Erreur silencieuse
    }
  };

  // ── Supprimer un message ──
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const messageId = deleteTargetId;
    setDeleteTargetId(null);

    try {
      const response = await apiFetch<{ status: string; data: Message }>(
        `/api/messages/messages/${messageId}`,
        { method: "DELETE" },
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? response.data : m)),
      );
      showToast("Message supprimé.", "success");
    } catch {
      showToast("Impossible de supprimer le message.", "error");
    }
  };

  // ── Auto-focus edit textarea ──
  useEffect(() => {
    if (editingId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      adjustTextareaHeight(editTextareaRef.current);
    }
  }, [editingId]);

  return (
    <AppShell>
      <main className="mx-auto flex h-[calc(100vh-200px)] max-w-3xl flex-col px-4 py-6 sm:px-6">
        {/* En-tête */}
        <div className="mb-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <Link
            to="/messages"
            className="text-sm font-bold text-emerald-700 dark:text-emerald-400"
          >
            ← {t("common.back")}
          </Link>
          <h1 className="mt-2 text-xl font-black">
            💬 {t("messages.conversation")}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading && (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("common.loading")}
            </p>
          )}

          {messages.length === 0 && !loading && (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              {t("messages.noMessages")}
            </p>
          )}

          {messages.map((msg, idx) => {
            const isMine = msg.sender.id === currentUserId;
            const isEditing = editingId === msg.id;

            // Séparateur de date
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDateSeparator =
              !prevMsg || !isSameDay(prevMsg.sentAt, msg.sentAt);

            // Séparateur messages non lus
            const unreadIndex = messages.length - initialUnreadCount;
            const showUnreadSeparator = initialUnreadCount > 0 && idx === unreadIndex;

            return (
              <div key={msg.id}>
                {showUnreadSeparator && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-emerald-400 dark:bg-emerald-600" />
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white">
                      {initialUnreadCount} {t("messages.unreadMessages", "message(s) non lu(s)")}
                    </span>
                    <div className="h-px flex-1 bg-emerald-400 dark:bg-emerald-600" />
                  </div>
                )}
                {/* Séparateur date */}
                {showDateSeparator && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {formatDateSeparator(msg.sentAt)}
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                )}

                {/* Bulle message */}
                <div
                  className={`flex ${isMine ? "justify-end" : "justify-start"} py-0.5`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {/* Contenu du message */}
                    {isEditing ? (
                      <div>
                        <textarea
                          ref={editTextareaRef}
                          value={editContent}
                          onChange={(e) => {
                            setEditContent(e.target.value);
                            adjustTextareaHeight(e.target);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(msg.id);
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full resize-none rounded-lg border border-emerald-300 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-emerald-600 dark:bg-slate-900 dark:text-slate-100"
                          rows={1}
                          style={{ minHeight: "2rem" }}
                        />
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() => saveEdit(msg.id)}
                            className="text-[11px] font-bold text-emerald-200 hover:text-white"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-[11px] font-bold text-emerald-200/70 hover:text-emerald-200"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}

                    {/* Métadonnées : heure + actions */}
                    {!isEditing && (
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p
                          className={`text-[10px] ${
                            isMine
                              ? "text-emerald-200"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {new Date(msg.sentAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {msg.editedAt && " (modifié)"}
                        </p>
                        <div className="flex items-center gap-1">
                          {/* Traduire (pas sur ses propres messages) */}
                          {!isMine && (
                            <TranslateButton
                              text={msg.content}
                              userLang={navigator.language.split("-")[0]}
                            />
                          )}
                          {/* Menu trois points (ses propres messages) */}
                          {isMine && (
                            <div className="relative" ref={openMenuId === msg.id ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                className="text-[14px] leading-none text-emerald-200/60 hover:text-emerald-200 px-1"
                                title="Plus d'actions"
                              >
                                ⋮
                              </button>
                              {/* Petit menu déroulant */}
                              {openMenuId === msg.id && (
                                <div className="absolute bottom-full right-0 z-50 mb-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                  {canEdit(msg.sentAt) && (
                                    <button
                                      onClick={() => { startEdit(msg); setOpenMenuId(null); }}
                                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                      <span>✏️</span>
                                      <span>Modifier</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.content);
                                      setOpenMenuId(null);
                                      showToast("Message copié.", "success");
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                                  >
                                    <span>📋</span>
                                    <span>Copier</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-700" />
                                  <button
                                    onClick={() => { setDeleteTargetId(msg.id); setOpenMenuId(null); }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                  >
                                    <span>🗑️</span>
                                    <span>Supprimer</span>
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

        {/* Champ de saisie — textarea auto-grow */}
        <div className="mt-4 flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("messages.typePlaceholder", "Écrire un message...")}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            style={{ minHeight: "2.75rem", maxHeight: "10rem" }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {sending ? "…" : "→"}
          </button>
        </div>
      </main>

      {/* Modale de confirmation suppression */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Supprimer ce message ?"
        message="Cette action est irréversible. Le message sera marqué comme supprimé pour tous."
        confirmLabel="Supprimer"
        tone="rose"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </AppShell>
  );
}
