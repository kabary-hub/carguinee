import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { useApiData } from "../../hooks/useApiData";
import { getHomeRouteForRole } from "../../lib/roles";

/**
 * Type d'une notification
 */
type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

/**
 * Type de la réponse de l'API
 */
type NotificationsResponse = {
  items: Notification[];
  unreadCount: number;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

/**
 * Icône par type de notification
 */
function resolveNotificationLink(link: string | null): string | null {
  if (!link) return null;
  // Anciens liens cassés → corriger
  if (link === "/mes-reservations") return "/reservations";
  return link;
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "BOOKING": return "📅";
    case "REVIEW": return "⭐";
    case "PRICE_DROP": return "💰";
    case "MESSAGE": return "💬";
    case "SYSTEM": return "🔔";
    default: return "📢";
  }
}

/**
 * Page des notifications
 */
export function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { data: response, loading, error, refetch } = useApiData<{ status: string; data: NotificationsResponse }>("/api/notifications");
  const notifications = response?.data.items ?? [];
  const unreadCount = response?.data.unreadCount ?? 0;
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // ── Marquer une notification comme lue ──
  const markAsRead = async (notificationId: string) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      refetch();
    } catch {
      // Erreur silencieuse
    }
  };

  // ── Tout marquer comme lu ──
  const markAllAsRead = async () => {
    try {
      await apiFetch(`/api/notifications/read-all`, { method: "PATCH" });
      refetch();
      showToast(t("notifications.markAllRead"));
    } catch {
      // Erreur silencieuse
    }
  };


  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          onClick={() => navigate(getHomeRouteForRole(user?.role ?? "CLIENT"))}
          className="flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400"
        >
          ← {t("common.back")}
        </button>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">🔔 {t("notifications.title")}</h1>
            {unreadCount > 0 && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("notifications.unreadCount", { count: unreadCount })}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
        )}

        {!loading && notifications.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-lg text-slate-500 dark:text-slate-400">{t("notifications.noNotifications")}</p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-6 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) void markAsRead(notification.id);
                  setSelectedNotification(notification);
                }}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  notification.isRead
                    ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-500/10"
                } hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${notification.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Modale de détails de notification ── */}
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedNotification(null)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getNotificationIcon(selectedNotification.type)}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {selectedNotification.type}
                    </p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {selectedNotification.title}
                    </h3>
                  </div>
                </div>
                <button onClick={() => setSelectedNotification(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  ✕
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {selectedNotification.message}
              </p>
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                {new Date(selectedNotification.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              {selectedNotification.link && (
                <button
                  onClick={() => {
                    const target = resolveNotificationLink(selectedNotification.link);
                    if (target) navigate(target);
                    setSelectedNotification(null);
                  }}
                  className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
                >
                  {t("notifications.viewDetails")}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
