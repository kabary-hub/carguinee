import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { printUserCard, printUserList } from "../../lib/printUtils";
import type { AdminUser } from "./adminTypes";

type UserResult = {
  items: AdminUser[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type Props = {
  /** Filtre rôle externe (optionnel, depuis l'URL) */
  initialRoleFilter?: string;
  toggleUserRole: (userId: string, role: string) => void;
  toggleUserActive: (userId: string) => void;
  /** Callback pour recharger les stats du dashboard après une modification */
  onReload?: () => void;
};

const ROLE_FILTERS = ["", "CLIENT", "PROPRIETAIRE", "ADMIN"];
const PAGE_SIZE = 10;

export function AdminUsersTab({ initialRoleFilter = "", toggleUserRole, toggleUserActive, onReload }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  /** Clé de rafraîchissement — incrémentée après chaque mutation pour re-fetcher */
  const [refreshKey, setRefreshKey] = useState(0);

  const ROLE_LABELS: Record<string, string> = {
    CLIENT: t("admin.users.roleClient"),
    PROPRIETAIRE: t("admin.users.roleOwner"),
    ADMIN: t("admin.users.roleAdmin"),
  };

  const userQueryKey = ["admin", "users", page, roleFilter, refreshKey];

  const { data: result, isLoading: loading } = useQuery({
    queryKey: userQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (roleFilter) params.set("role", roleFilter);
      return apiFetch<{ status: string; data: UserResult }>(`/api/admin/users?${params}`);
    },
    select: (res) => res.data,
    placeholderData: (prev) => prev,
  });

  const users = result?.items ?? [];
  const pagination = result?.pagination ?? null;

  // Quand on change le filtre rôle, revenir à la page 1
  const handleRoleFilter = useCallback((f: string) => {
    setRoleFilter(f);
    setPage(1);
  }, []);

  /** Incrémenter le refreshKey après une mutation pour re-fetcher la liste */
  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    onReload?.();
  }, [onReload]);

  /** Ouvre la page de messagerie avec cet utilisateur */
  const handleChat = async (userId: string) => {
    try {
      const res = await apiFetch<{ status: string; data: { id: string } }>(
        "/api/messages/conversations",
        { method: "POST", body: JSON.stringify({ receiverId: userId }) },
      );
      navigate(`/messages/${res.data.id}`);
    } catch {
      showToast("Impossible d'ouvrir la conversation.", "error");
    }
  };

  return (
    <section className="mt-6">
      {/* Filtres rôle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("admin.dashboard.usersByRole")} :
        </span>
        {ROLE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleRoleFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              roleFilter === f
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {f ? ROLE_LABELS[f] ?? f : t("admin.bookings.all")}
          </button>
        ))}
        <button
          onClick={() => {
            const label = roleFilter ? (ROLE_LABELS[roleFilter] ?? roleFilter) : t("admin.bookings.all");
            printUserList(users, label);
          }}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          🖨️ {t("admin.printList")}
        </button>
      </div>

      {loading && (
        <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("common.loading")}
        </p>
      )}

      {!loading && users.length === 0 && (
        <p className="mt-10 text-center text-slate-500 dark:text-slate-400">
          Aucun utilisateur trouvé.
        </p>
      )}

      {/* ── Vue cartes sur mobile ─────────────────────────────────────── */}
      {!loading && users.length > 0 && (
        <div className="mt-4 grid gap-3 sm:hidden">
          {users.map((u) => (
            <div key={u.id} onClick={() => setSelectedUser(u)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{u.firstName} {u.lastName}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{u.phone}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{u.email || "—"}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${u.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"}`}>
                  {u.isActive ? t("admin.users.active") : t("admin.users.inactive")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{ROLE_LABELS[u.role] ?? u.role}</span>
                <select value={u.role} onChange={(e) => { toggleUserRole(u.id, e.target.value); triggerRefresh(); }} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                  <option value="CLIENT">{t("admin.users.roleClient")}</option>
                  <option value="PROPRIETAIRE">{t("admin.users.roleOwner")}</option>
                  <option value="ADMIN">{t("admin.users.roleAdmin")}</option>
                </select>
                <button onClick={() => { toggleUserActive(u.id); triggerRefresh(); }} className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-bold ${u.isActive ? "border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"}`}>
                  {u.isActive ? t("admin.users.deactivate") : t("admin.users.activate")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Vue table sur desktop ─────────────────────────────────────── */}
      {!loading && users.length > 0 && (
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("admin.users.name")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.users.phone")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.users.email")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.users.role")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.users.status")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.users.vehicles")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("admin.users.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} onClick={() => setSelectedUser(u)} className="cursor-pointer border-b border-slate-100 last:border-0 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-bold">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.phone}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email || "—"}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => { e.stopPropagation(); toggleUserRole(u.id, e.target.value); triggerRefresh(); }} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                      <option value="CLIENT">{t("admin.users.roleClient")}</option>
                      <option value="PROPRIETAIRE">{t("admin.users.roleOwner")}</option>
                      <option value="ADMIN">{t("admin.users.roleAdmin")}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"}`}>
                      {u.isActive ? t("admin.users.active") : t("admin.users.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{u._count.vehicles}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); toggleUserActive(u.id); triggerRefresh(); }} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${u.isActive ? "border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"}`}>
                      {u.isActive ? t("admin.users.deactivate") : t("admin.users.activate")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("admin.users.userCount", { count: pagination.total })} — Page {pagination.page}/{pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
      {pagination && pagination.totalPages <= 1 && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {t("admin.users.userCount", { count: pagination.total })}
        </p>
      )}

      {/* ── Sidebar détail utilisateur ──────────────────────────────── */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/50" onClick={() => setSelectedUser(null)} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Détails utilisateur</h2>
              <button onClick={() => setSelectedUser(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">✕</button>
            </div>
            <div className="flex-1 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${selectedUser.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"}`}>
                    {selectedUser.isActive ? t("admin.users.active") : t("admin.users.inactive")}
                  </span>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Informations personnelles</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: "Téléphone", value: selectedUser.phone },
                      { label: "Email", value: selectedUser.email || "—" },
                      { label: "Rôle", value: ROLE_LABELS[selectedUser.role] ?? selectedUser.role },
                      { label: "Date d'inscription", value: new Date(selectedUser.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Statistiques</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{selectedUser._count.vehicles}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Véhicules</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{selectedUser._count.rentalBookings}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Réservations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex gap-2">
                <button onClick={() => printUserCard(selectedUser)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800" title={t("admin.printCard")}>
                  🖨️
                </button>
                <button onClick={() => handleChat(selectedUser.id)} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">
                  💬 Chat
                </button>
                <button onClick={() => { toggleUserActive(selectedUser.id); triggerRefresh(); }} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${selectedUser.isActive ? "border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"}`}>
                  {selectedUser.isActive ? t("admin.users.deactivate") : t("admin.users.activate")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
