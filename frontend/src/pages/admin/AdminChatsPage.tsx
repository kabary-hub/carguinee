import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminConversation = {
  id: string;
  participant1: { id: string; firstName: string; lastName: string };
  participant2: { id: string; firstName: string; lastName: string };
  lastMessage: string | null;
  lastMessageAt: string;
  vehicleId: string | null;
  messages: { sender: { id: string; firstName: string }; content: string }[];
  _count: { messages: number };
};

type AdminMessage = {
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

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

// ── Page admin chats ──────────────────────────────────────────────────────────

export function AdminChatsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // ── Variable déclarée AVANT handlePrint pour éviter le TDZ ──
  const selectedConv = selectedId ? conversations.find((c) => c.id === selectedId) : null;

  // ── Impression ciblée de la conversation sélectionnée ──
  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Conversation - CarGuinée</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1e293b; }
          h1 { font-size: 18px; font-weight: 900; margin-bottom: 4px; }
          h2 { font-size: 13px; color: #64748b; margin-bottom: 16px; font-weight: 600; }
          .msg { margin-bottom: 8px; padding: 8px 12px; border-radius: 12px; background: #f1f5f9; max-width: 85%; }
          .msg.deleted { background: #fef2f2; border: 1px solid #fecaca; }
          .sender { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px; }
          .deleted-badge { font-size: 9px; font-weight: 700; color: #dc2626; background: #fee2e2; padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
          .content { font-size: 13px; margin-top: 2px; white-space: pre-wrap; }
          .time { font-size: 10px; color: #94a3b8; margin-top: 4px; }
          .separator { text-align: center; font-size: 11px; color: #94a3b8; margin: 12px 0 8px; font-weight: 600; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <h1>💬 Conversation</h1>
        <h2>${selectedConv ? `${selectedConv.participant1.firstName} ${selectedConv.participant1.lastName} ↔ ${selectedConv.participant2.firstName} ${selectedConv.participant2.lastName}` : ''}</h2>
        ${messages.map((msg, idx) => {
          const isDeleted = msg.deletedAt !== null;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showSep = !prevMsg || !isSameDay(prevMsg.sentAt, msg.sentAt);
          const time = new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          return `${showSep ? `<div class="separator">${formatDateSeparator(msg.sentAt)}</div>` : ''}
          <div class="msg${isDeleted ? ' deleted' : ''}">
            <div>
              <span class="sender">${msg.sender.firstName} ${msg.sender.lastName}</span>
              ${isDeleted ? '<span class="deleted-badge">supprimé</span>' : ''}
            </div>
            <div class="content">${msg.content}</div>
            <div class="time">${time}${msg.editedAt ? ' (modifié)' : ''}</div>
          </div>`;
        }).join('')}
        <div class="footer">Imprimé le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — CarGuinée</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [messages, selectedConv]);

  // ── Hooks TOUJOURS appelés (même si non-admin) ──
  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    apiFetch<{ status: string; data: { items: AdminConversation[] } }>(
      "/api/messages/admin/conversations",
    )
      .then((res) => setConversations(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch<{
        status: string;
        data: { items: AdminMessage[] };
      }>(`/api/messages/admin/conversations/${convId}/messages`);
      setMessages(res.data.items);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Vérifier admin APRÈS les hooks ──
  if (!user || user.role !== "ADMIN") {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
            Accès réservé aux administrateurs.
          </p>
        </div>
      </AppShell>
    );
  }

  const getOther = (conv: AdminConversation, currentUserId: string) =>
    conv.participant1.id === currentUserId ? conv.participant2 : conv.participant1;

  // ── Vue liste ──
  if (!selectedId) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black">
              💬 {t("admin.dashboard.generalConversations")}
            </h1>
            <Link
              to="/administration"
              className="text-sm font-bold text-emerald-700 dark:text-emerald-400"
            >
              ← {t("common.back")}
            </Link>
          </div>

          {loading && (
            <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("common.loading")}
            </p>
          )}

          {!loading && conversations.length === 0 && (
            <p className="mt-16 text-center text-slate-500 dark:text-slate-400">
              Aucune conversation.
            </p>
          )}

          {conversations.length > 0 && (
            <div className="mt-6 space-y-2">
              {conversations.map((conv) => {
                const lastMsg = conv.messages[0];
                const p1 = conv.participant1;
                const p2 = conv.participant2;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold leading-none text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          <span className="flex flex-col items-center gap-0">
                            <span>{p1.firstName[0]}{p1.lastName[0]}</span>
                            <span>{p2.firstName[0]}{p2.lastName[0]}</span>
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {p1.firstName} {p1.lastName} ↔{" "}
                            {p2.firstName} {p2.lastName}
                          </p>
                          {lastMsg && (
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 max-w-md">
                              {lastMsg.sender.firstName}: {lastMsg.content}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(conv.lastMessageAt).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                          {conv._count.messages} message
                          {conv._count.messages > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </AppShell>
    );
  }

  // ── Vue lecture seule d'une conversation ──
  return (
    <AppShell>
      <main className="mx-auto flex h-[calc(100vh-200px)] max-w-3xl flex-col px-4 py-6 sm:px-6">
        {/* En-tête */}
        <div className="mb-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <button
            onClick={() => {
              setSelectedId(null);
              setMessages([]);
            }}
            className="text-sm font-bold text-emerald-700 dark:text-emerald-400"
          >
            ← Retour à la liste
          </button>
          <h1 className="mt-2 text-xl font-black">
            👁️ Conversation — Lecture seule
          </h1>
          {selectedConv && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {selectedConv.participant1.firstName}{" "}
              {selectedConv.participant1.lastName} ↔{" "}
              {selectedConv.participant2.firstName}{" "}
              {selectedConv.participant2.lastName}
            </p>
          )}
        </div>

        {/* Messages (lecture seule) */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {loadingMessages && (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("common.loading")}
            </p>
          )}

          {!loadingMessages && messages.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              Aucun message.
            </p>
          )}

          {messages.map((msg, idx) => {
            const isDeleted = msg.deletedAt !== null;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDateSeparator =
              !prevMsg || !isSameDay(prevMsg.sentAt, msg.sentAt);

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {formatDateSeparator(msg.sentAt)}
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                )}

                <div className="py-0.5">
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      isDeleted
                        ? "border border-red-300 bg-red-50 text-slate-900 dark:border-red-800 dark:bg-red-500/10 dark:text-slate-100"
                        : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {/* Nom de l'expéditeur + badge supprimé */}
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </p>
                      {isDeleted && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600 dark:bg-red-500/20 dark:text-red-400">
                          supprimé
                        </span>
                      )}
                    </div>
                    {/* Contenu (toujours visible pour l'admin) */}
                    <p className="mt-0.5 text-sm whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    {/* Métadonnées + bouton supprimer */}
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(msg.sentAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {msg.editedAt && " (modifié)"}
                      </p>
                      {!isDeleted && (
                        <button
                          onClick={() => setDeleteTargetId(msg.id)}
                          disabled={deletingMsgId === msg.id}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 dark:text-red-400"
                        >
                          {deletingMsgId === msg.id ? "..." : "🗑️"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone imprimable (cachée à l'écran) */}
        <div ref={printRef} className="hidden" />

        {/* Actions admin : supprimer un message / imprimer */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            🖨️ Imprimer
          </button>
        </div>

        {/* Pas de champ de saisie — lecture seule */}
        <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
          👁️ Lecture seule — Les administrateurs ne peuvent pas écrire dans les conversations dont ils ne sont pas membres.
        </div>
      </main>

      {/* Modale de confirmation suppression message */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Supprimer ce message ?"
        message="Cette action est irréversible. Le message sera marqué comme supprimé."
        confirmLabel="Supprimer"
        tone="rose"
        onConfirm={async () => {
          if (!deleteTargetId) return;
          const messageId = deleteTargetId;
          setDeleteTargetId(null);
          setDeletingMsgId(messageId);
          try {
            await apiFetch(`/api/messages/messages/${messageId}`, { method: "DELETE" });
            setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m));
            showToast("Message supprimé.", "success");
          } catch {
            showToast("Impossible de supprimer le message.", "error");
          } finally {
            setDeletingMsgId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </AppShell>
  );
}
