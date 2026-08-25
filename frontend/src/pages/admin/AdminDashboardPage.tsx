import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import type { ApiResponse, Vehicle } from "../../lib/domain";

import { AdminValidationsTab } from "../../components/admin/AdminValidationsTab";
import { AdminUsersTab } from "../../components/admin/AdminUsersTab";
import { AdminBookingsTab } from "../../components/admin/AdminBookingsTab";
import { AdminReportsTab } from "../../components/admin/AdminReportsTab";
import type { AdminStats, OwnerRequest, PendingAction } from "../../components/admin/adminTypes";

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState(i18n.language?.startsWith("en") ? "en" : "fr");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "bookings" | "reports">(
    (searchParams.get("tab") as "stats" | "users" | "bookings" | "reports") || "stats"
  );
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [bookingStatusFilter, setBookingStatusFilter] = useState(searchParams.get("status") || "");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (lng: string) => setLang(lng.startsWith("en") ? "en" : "fr");
    i18n.on("languageChanged", handler);
    return () => { i18n.off("languageChanged", handler); };
  }, [i18n]);

  const getDescription = useCallback((v: Vehicle) => {
    if (lang === "en" && v.descriptionEn) return v.descriptionEn;
    if (lang === "fr" && v.descriptionFr) return v.descriptionFr;
    return v.descriptionFr || v.descriptionEn || v.description || t("admin.dashboard.noVehiclesToValidate");
  }, [lang, t]);

  /** Charge les stats + données de validation (pas les users/bookings, gérés par les onglets) */
  const load = () =>
    Promise.all([
      apiFetch<ApiResponse<AdminStats>>("/api/admin/stats"),
      apiFetch<ApiResponse<Vehicle[]>>("/api/vehicles/admin/pending"),
      apiFetch<ApiResponse<OwnerRequest[]>>("/api/owner-requests/admin/pending"),
    ])
      .then(([statsData, vehicleData, requestData]) => {
        setStats(statsData.data);
        setPendingVehicles(vehicleData.data);
        setRequests(requestData.data);
      })
      .catch((reason: Error) => setError(reason.message));

  useEffect(() => { void load(); }, []);


  const runAction = async (action: PendingAction, reason?: string) => {
    try {
      if (action.type === "vehicle-approve") {
        await apiFetch(`/api/vehicles/admin/${action.id}/approve`, { method: "PATCH" });
        showToast(t("admin.dashboard.vehiclePublished"));
      } else if (action.type === "vehicle-reject") {
        await apiFetch(`/api/vehicles/admin/${action.id}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ rejectionReason: reason }),
        });
        showToast(t("admin.dashboard.announcementRejected"));
      } else if (action.type === "owner-approve") {
        await apiFetch(`/api/owner-requests/admin/${action.id}/approve`, { method: "PATCH" });
        showToast(t("admin.dashboard.ownerRequestApproved"));
      } else {
        await apiFetch(`/api/owner-requests/admin/${action.id}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ rejectionReason: reason }),
        });
        showToast(t("admin.dashboard.ownerRequestRejected"));
      }
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("admin.dashboard.actionImpossible"), "error");
    }
  };

  const toggleUserRole = async (userId: string, newRole: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      showToast(t("admin.users.roleUpdated"));
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("admin.users.editImpossible"), "error");
    }
  };

  const toggleUserActive = async (userId: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/toggle-active`, { method: "PATCH" });
      showToast(t("admin.users.statusUpdated"));
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("admin.users.editImpossible"), "error");
    }
  };

  const actionConfig: Record<
    PendingAction["type"],
    { title: string; message: string; confirmLabel: string; tone: "emerald" | "rose"; requireReason: boolean }
  > = {
    "vehicle-approve": {
      title: t("admin.dashboard.approvePublication"),
      message: t("admin.dashboard.approvePublicationMessage"),
      confirmLabel: t("admin.dashboard.approve"),
      tone: "emerald",
      requireReason: false,
    },
    "vehicle-reject": {
      title: t("admin.dashboard.rejectPublication"),
      message: t("admin.dashboard.rejectPublicationMessage"),
      confirmLabel: t("admin.dashboard.reject"),
      tone: "rose",
      requireReason: true,
    },
    "owner-approve": {
      title: t("admin.dashboard.approveOwner"),
      message: t("admin.dashboard.approveOwnerMessage"),
      confirmLabel: t("admin.dashboard.approve"),
      tone: "emerald",
      requireReason: false,
    },
    "owner-reject": {
      title: t("admin.dashboard.rejectOwner"),
      message: t("admin.dashboard.rejectOwnerMessage"),
      confirmLabel: t("admin.dashboard.reject"),
      tone: "rose",
      requireReason: true,
    },
  };

  const totalBookings = stats
    ? Object.values(stats.bookingsByStatus).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{t("admin.dashboard.tabs.validations")}</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("admin.dashboard.title")}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t("admin.dashboard.subtitle")}</p>

        {error && (
          <p className="mt-5 rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>
        )}

        {/* ── Statistiques cliquables ─────────────────────────────────── */}
        {stats && (
          <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <button onClick={() => setActiveTab("stats")} className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${activeTab === "stats" ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-500/15" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("admin.dashboard.stats.totalVehicles")}</p>
              <p className="mt-2 text-3xl font-black">{stats.totalVehicles}</p>
            </button>
            <button onClick={() => setActiveTab("stats")} className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${stats.pendingVehicles > 0 ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-500/15" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("admin.dashboard.stats.pendingValidations")}</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{stats.pendingVehicles}</p>
            </button>
            <button onClick={() => setActiveTab("users")} className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${activeTab === "users" ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-500/15" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("admin.dashboard.stats.totalUsers")}</p>
              <p className="mt-2 text-3xl font-black">{stats.totalUsers}</p>
            </button>
            <button onClick={() => setActiveTab("bookings")} className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${activeTab === "bookings" ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-500/15" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("admin.dashboard.stats.totalBookings")}</p>
              <p className="mt-2 text-3xl font-black">{totalBookings}</p>
            </button>
          </section>
        )}

        {/* ── Onglets ─────────────────────────────────────────────────── */}
        {/* Mobile : Conversations en haut, onglets en bas */}
        <div className="mt-6 flex flex-col gap-2 border-b border-slate-200 pb-px sm:mt-8 sm:flex-row sm:items-center sm:gap-1 dark:border-slate-800">
          <Link
            to="/administration/chats"
            className="flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 sm:hidden dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            💬 Conversations
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1">
            {([
              { key: "stats", label: t("admin.dashboard.tabs.validations") },
              { key: "users", label: t("admin.dashboard.tabs.users") },
              { key: "bookings", label: t("admin.dashboard.tabs.bookings") },
              { key: "reports", label: t("admin.dashboard.tabs.reports") },
            ] as const).map((tab) => (
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
                {tab.key === "stats" && pendingVehicles.length + requests.length > 0 && (
                  <span className="ml-1 rounded-full bg-rose-600 px-1 py-0.5 text-[9px] text-white sm:ml-1.5 sm:px-1.5 sm:text-[10px]">
                    {pendingVehicles.length + requests.length}
                  </span>
                )}
                {tab.key === "reports" && stats?.pendingReports && stats.pendingReports > 0 && (
                  <span className="ml-1 rounded-full bg-amber-600 px-1 py-0.5 text-[9px] text-white sm:ml-1.5 sm:px-1.5 sm:text-[10px]">
                    {stats.pendingReports}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Link
            to="/administration/chats"
            className="hidden items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 sm:flex dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            💬 Conversations
          </Link>
          <Link
            to="/administration/moderation"
            className="hidden items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 sm:flex dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            🛡️ Modération
          </Link>
        </div>

        {/* ── Contenu des onglets ──────────────────────────────────── */}
        {activeTab === "stats" && stats && (
          <AdminValidationsTab
            stats={stats}
            pendingVehicles={pendingVehicles}
            requests={requests}
            getDescription={getDescription}
            setPendingAction={setPendingAction}
            setActiveTab={setActiveTab}
            setRoleFilter={setRoleFilter}
            setBookingStatusFilter={setBookingStatusFilter}
          />
        )}

        {activeTab === "users" && (
          <AdminUsersTab
            initialRoleFilter={roleFilter}
            toggleUserRole={toggleUserRole}
            toggleUserActive={toggleUserActive}
            onReload={load}
          />
        )}

        {activeTab === "bookings" && (
          <AdminBookingsTab initialStatusFilter={bookingStatusFilter} />
        )}

        {activeTab === "reports" && (
          <AdminReportsTab showToast={showToast} />
        )}
      </main>

      {pendingAction && (
        <ConfirmDialog
          open
          title={actionConfig[pendingAction.type].title}
          message={actionConfig[pendingAction.type].message}
          confirmLabel={actionConfig[pendingAction.type].confirmLabel}
          tone={actionConfig[pendingAction.type].tone}
          requireReason={actionConfig[pendingAction.type].requireReason}
          onConfirm={(reason) => {
            void runAction(pendingAction, reason);
            setPendingAction(null);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </AppShell>
  );
}
