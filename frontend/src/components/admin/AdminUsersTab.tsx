import { useTranslation } from "react-i18next";
import type { AdminUser } from "./adminTypes";

type Props = {
  users: AdminUser[];
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  toggleUserRole: (userId: string, role: string) => void;
  toggleUserActive: (userId: string) => void;
};

const ROLE_FILTERS = ["", "CLIENT", "PROPRIETAIRE", "ADMIN"];

export function AdminUsersTab({ users, roleFilter, setRoleFilter, toggleUserRole, toggleUserActive }: Props) {
  const { t } = useTranslation();

  const ROLE_LABELS: Record<string, string> = {
    CLIENT: t("admin.users.roleClient"),
    PROPRIETAIRE: t("admin.users.roleOwner"),
    ADMIN: t("admin.users.roleAdmin"),
  };

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("admin.dashboard.usersByRole")} :
        </span>
        {ROLE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setRoleFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              roleFilter === f
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {f ? ROLE_LABELS[f] ?? f : t("admin.bookings.all")}
          </button>
        ))}
      </div>
      {/* Vue cartes sur mobile */}
      <div className="mt-4 grid gap-3 sm:hidden">
        {users
          .filter((u) => !roleFilter || u.role === roleFilter)
          .map((u) => (
            <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                <select value={u.role} onChange={(e) => toggleUserRole(u.id, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                  <option value="CLIENT">{t("admin.users.roleClient")}</option>
                  <option value="PROPRIETAIRE">{t("admin.users.roleOwner")}</option>
                  <option value="ADMIN">{t("admin.users.roleAdmin")}</option>
                </select>
                <button onClick={() => toggleUserActive(u.id)} className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-bold ${u.isActive ? "border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"}`}>
                  {u.isActive ? t("admin.users.deactivate") : t("admin.users.activate")}
                </button>
              </div>
            </div>
          ))}
      </div>
      {/* Vue table sur desktop */}
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
            {users
              .filter((u) => !roleFilter || u.role === roleFilter)
              .map((u) => (
              <tr key={u.id} className="cursor-pointer border-b border-slate-100 last:border-0 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-bold">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.phone}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => toggleUserRole(u.id, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
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
                  <button onClick={() => toggleUserActive(u.id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${u.isActive ? "border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"}`}>
                    {u.isActive ? t("admin.users.deactivate") : t("admin.users.activate")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {t("admin.users.userCount", { count: users.length })}
      </p>
    </section>
  );
}
