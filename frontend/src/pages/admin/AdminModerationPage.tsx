import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "../../components/AppShell";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import type { ApiResponse } from "../../lib/domain";
import { roleLabel } from "../../lib/roles";
import type { ReactivationRequest, ModerationUser } from "../../components/admin/moderationTypes";
import { StatusBadge, RequestDetailModal, UserDetailModal } from "../../components/admin/ModerationModals";

type Tab = "requests" | "banned";

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminModerationPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("requests");


  // Détails ligne
  const [selectedItem, setSelectedItem] = useState<ReactivationRequest | ModerationUser | null>(null);
  const [detailType, setDetailType] = useState<"request" | "user">("request");

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Modale confirmation bannir / débannir
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<{ userId: string; ban: boolean } | null>(null);

  // Modale confirmation désactiver
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // ── Chargement des données via React Query ──
  const requestsQuery = useQuery({
    queryKey: ["admin", "reactivation-requests"],
    queryFn: () =>
      apiFetch<ApiResponse<{ items: ReactivationRequest[]; pagination: { total: number } }>>(
        "/api/admin/reactivation-requests?pageSize=50&status=PENDING",
      ).then((d) => d.data.items),
  });

  const moderationQuery = useQuery({
    queryKey: ["admin", "moderation", activeTab === "banned" ? "banned" : "all"],
    queryFn: () => {
      const url = activeTab === "banned"
        ? "/api/admin/moderation?pageSize=50&filter=banned"
        : "/api/admin/moderation?pageSize=50";
      return apiFetch<ApiResponse<{ items: ModerationUser[]; pagination: { total: number } }>>(url)
        .then((d) => d.data.items);
    },
  });

  const requests = requestsQuery.data ?? [];
  const moderationUsers = moderationQuery.data ?? [];
  const loading = requestsQuery.isLoading || moderationQuery.isLoading;
  const error = (requestsQuery.error || moderationQuery.error) instanceof Error
    ? (requestsQuery.error || moderationQuery.error)!.message
    : "";

  // ── Actions ──

  const handleApproveRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/reactivation-requests/${requestId}/approve`, { method: "PATCH" });
      showToast("Compte réactivé avec succès.");
      setSelectedItem(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", "error");
    } finally { setActionLoading(false); }
  };

  const handleRejectRequest = async (reason?: string) => {
    if (!rejectingId) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/reactivation-requests/${rejectingId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason: reason }),
      });
      showToast("Demande refusée.");
      setSelectedItem(null);
      setRejectDialogOpen(false);
      setRejectingId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", "error");
    } finally { setActionLoading(false); }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ isBanned: ban }),
      });
      showToast(ban ? "Utilisateur banni." : "Utilisateur débanni.");
      setSelectedItem(null);
      setBanDialogOpen(false);
      setBanTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", "error");
    } finally { setActionLoading(false); }
  };

  const openBanDialog = (userId: string, ban: boolean) => {
    setBanTarget({ userId, ban });
    setBanDialogOpen(true);
  };

  const handleDeactivateUser = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/users/${deactivateTarget}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ isBanned: true }),
      });
      showToast("Utilisateur désactivé et banni.");
      setSelectedItem(null);
      setDeactivateDialogOpen(false);
      setDeactivateTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", "error");
    } finally { setActionLoading(false); }
  };

  // ── Helpers ──

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const bannedCount = moderationUsers.filter((u) => u.isBanned).length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          {t("admin.moderation.subtitle")}
        </p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("admin.moderation.title")}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t("admin.moderation.description")}</p>

        {error && (
          <p className="mt-5 rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>
        )}

        {/* ── Onglets ─────────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-col gap-2 border-b border-slate-200 pb-px sm:flex-row sm:items-center sm:gap-1 dark:border-slate-800">
          <div className="flex items-center gap-0.5 sm:gap-1">
            {([
              { key: "requests" as Tab, label: t("admin.moderation.tabs.requests"), count: pendingCount, color: "bg-amber-600" },
              { key: "banned" as Tab, label: t("admin.moderation.tabs.banned"), count: bannedCount, color: "bg-rose-600" },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 px-1.5 py-2 text-[11px] font-bold transition sm:px-3 sm:py-3 sm:text-sm ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 rounded-full ${tab.color} px-1.5 py-0.5 text-[10px] text-white`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Link
            to="/administration"
            className="ml-auto hidden items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 sm:flex dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ← {t("admin.moderation.backToAdmin")}
          </Link>
        </div>

        {/* ── Contenu ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
          </div>
        ) : (
          <>
            {activeTab === "requests" && (
              <RequestsTab
                requests={requests}
                actionLoading={actionLoading}
                formatDate={formatDate}
                onSelect={(req) => { setSelectedItem(req); setDetailType("request"); }}
                onApprove={handleApproveRequest}
                onReject={(id) => { setRejectingId(id); setRejectDialogOpen(true); }}
                t={t}
              />
            )}
            {activeTab === "banned" && (
              <BannedTab
                users={moderationUsers}
                actionLoading={actionLoading}
                onSelect={(user) => { setSelectedItem(user); setDetailType("user"); }}
                onBan={openBanDialog}
                t={t}
              />
            )}
          </>
        )}
      </main>

      {/* ── Modales ────────────────────────────────────────────────────── */}
      {selectedItem && detailType === "request" && (
        <RequestDetailModal
          req={selectedItem as ReactivationRequest}
          onClose={() => setSelectedItem(null)}
          onApprove={handleApproveRequest}
          onReject={(id) => { setRejectingId(id); setRejectDialogOpen(true); }}
          onBan={openBanDialog}
          formatDate={formatDate}
          t={t}
          actionLoading={actionLoading}
        />
      )}
      {selectedItem && detailType === "user" && (
        <UserDetailModal
          user={selectedItem as ModerationUser}
          onClose={() => setSelectedItem(null)}
          onBan={openBanDialog}
          onDeactivate={(userId) => { setDeactivateTarget(userId); setDeactivateDialogOpen(true); }}
          formatDate={formatDate}
          t={t}
          actionLoading={actionLoading}
        />
      )}

      <ConfirmDialog
        open={rejectDialogOpen}
        title={t("admin.moderation.rejectTitle")}
        message={t("admin.moderation.rejectMessage")}
        confirmLabel={t("admin.moderation.reject")}
        tone="rose"
        requireReason
        onConfirm={(reason) => void handleRejectRequest(reason)}
        onCancel={() => { setRejectDialogOpen(false); setRejectingId(null); }}
      />

      <ConfirmDialog
        open={banDialogOpen}
        title={banTarget?.ban ? t("admin.moderation.banConfirmTitle") : t("admin.moderation.unbanConfirmTitle")}
        message={banTarget?.ban ? t("admin.moderation.banConfirmMessage") : t("admin.moderation.unbanConfirmMessage")}
        confirmLabel={banTarget?.ban ? t("admin.moderation.ban") : t("admin.moderation.unban")}
        tone="rose"
        onConfirm={() => { if (banTarget) void handleBanUser(banTarget.userId, banTarget.ban); }}
        onCancel={() => { setBanDialogOpen(false); setBanTarget(null); }}
      />

      <ConfirmDialog
        open={deactivateDialogOpen}
        title={t("admin.moderation.deactivateConfirmTitle")}
        message={t("admin.moderation.deactivateConfirmMessage")}
        confirmLabel={t("admin.moderation.deactivate")}
        tone="rose"
        onConfirm={() => void handleDeactivateUser()}
        onCancel={() => { setDeactivateDialogOpen(false); setDeactivateTarget(null); }}
      />
    </AppShell>
  );
}

// ── Onglet Demandes de réactivation ──────────────────────────────────────────

function RequestsTab({
  requests,
  actionLoading,
  formatDate,
  onSelect,
  onApprove,
  onReject,
  t,
}: {
  requests: ReactivationRequest[];
  actionLoading: boolean;
  formatDate: (d: string) => string;
  onSelect: (req: ReactivationRequest) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  t: (key: string) => string;
}) {
  if (requests.length === 0) {
    return <p className="py-12 text-center text-slate-500 dark:text-slate-400">{t("admin.moderation.noRequests")}</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">{t("admin.moderation.table.user")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.phone")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.role")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.reason")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.status")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.date")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr
                key={req.id}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                onClick={() => onSelect(req)}
              >
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{req.firstName} {req.lastName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{req.phone}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {roleLabel(req.user.role)}
                  </span>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-slate-500 dark:text-slate-400">{req.reason || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(req.createdAt)}</td>
                <td className="px-4 py-3">
                  {req.status === "PENDING" && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onApprove(req.id)}
                        disabled={actionLoading}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >✓ {t("admin.moderation.approve")}</button>
                      <button
                        onClick={() => onReject(req.id)}
                        disabled={actionLoading}
                        className="rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800 dark:text-rose-400"
                      >✗ {t("admin.moderation.reject")}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Onglet Utilisateurs bannis ───────────────────────────────────────────────

function BannedTab({
  users,
  actionLoading,
  onSelect,
  onBan,
  t,
}: {
  users: ModerationUser[];
  actionLoading: boolean;
  onSelect: (user: ModerationUser) => void;
  onBan: (userId: string, ban: boolean) => void;
  t: (key: string) => string;
}) {
  if (users.length === 0) {
    return <p className="py-12 text-center text-slate-500 dark:text-slate-400">{t("admin.moderation.noBannedUsers")}</p>;
  }

  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">{t("admin.moderation.table.user")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.phone")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.role")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.badge")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.vehicles")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.bookings")}</th>
              <th className="px-4 py-3">{t("admin.moderation.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                onClick={() => onSelect(user)}
              >
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user.phone}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {roleLabel(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    🚫 {t("admin.moderation.banned")}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user._count.vehicles}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user._count.rentalBookings}</td>
                <td className="px-4 py-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onBan(user.id, false)}
                      disabled={actionLoading}
                      className="rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-400"
                    >{t("admin.moderation.unban")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
