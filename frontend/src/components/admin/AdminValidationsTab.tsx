import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "../StatusBadge";
import type { AdminStats, Vehicle, OwnerRequest, PendingAction } from "./adminTypes";
import { formatGnf } from "../../lib/domain";

type Props = {
  stats: AdminStats;
  pendingVehicles: Vehicle[];
  requests: OwnerRequest[];
  getDescription: (v: Vehicle) => string;
  setPendingAction: (action: PendingAction) => void;
  setActiveTab: (tab: "stats" | "users" | "bookings" | "reports") => void;
  setBookingFilter: (filter: string) => void;
};

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE_VALIDATION: "En attente",
  PUBLIEE: "Publiée",
  REJETEE: "Rejetée",
  ARCHIVEE: "Archivée",
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Client",
  PROPRIETAIRE: "Propriétaire",
  ADMIN: "Admin",
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
  REJETEE: "Rejetée",
};

export function AdminValidationsTab({
  stats,
  pendingVehicles,
  requests,
  getDescription,
  setPendingAction,
  setActiveTab,
  setBookingFilter,
}: Props) {
  const { t } = useTranslation();
  const totalBookings = Object.values(stats.bookingsByStatus).reduce((s, v) => s + v, 0);

  return (
    <>
      {/* Répartitions */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("admin.dashboard.vehiclesByStatus")}
          </h2>
          <div className="mt-3 space-y-1">
            {Object.entries(stats.vehiclesByStatus).map(([status, count]) => (
              <Link
                key={status}
                to={`/vehicules?status=${status}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  {STATUS_LABELS[status] ?? status}
                </span>
                <span className="font-bold">{count}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("admin.dashboard.usersByRole")}
          </h2>
          <div className="mt-3 space-y-1">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <Link
                key={role}
                to={`/administration?tab=users&role=${role}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  {ROLE_LABELS[role] ?? role}
                </span>
                <span className="font-bold">{count}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("admin.dashboard.bookingsByStatus")}
          </h2>
          <div className="mt-3 space-y-1">
            {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
              <button
                key={status}
                onClick={() => { setActiveTab("bookings"); setBookingFilter(status); }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  {BOOKING_STATUS_LABELS[status] ?? status}
                </span>
                <span className="font-bold">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats avancées V2 */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.totalRevenue !== undefined && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">💰 {t("admin.dashboard.stats.totalRevenue")}</p>
            <p className="mt-2 text-lg font-black break-all text-emerald-600 sm:text-2xl dark:text-emerald-400">
              {formatGnf(stats.totalRevenue)}
            </p>
          </div>
        )}
        {stats.activeVehicles !== undefined && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">🚗 {t("admin.dashboard.stats.activeVehicles")}</p>
            <p className="mt-2 text-2xl font-black">{stats.activeVehicles}</p>
          </div>
        )}
        {stats.totalFavorites !== undefined && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">❤️ {t("admin.dashboard.stats.favorites")}</p>
            <p className="mt-2 text-2xl font-black">{stats.totalFavorites}</p>
          </div>
        )}
        {stats.totalReviews !== undefined && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">⭐ {t("admin.dashboard.stats.reviews")}</p>
            <p className="mt-2 text-2xl font-black">{stats.totalReviews}</p>
          </div>
        )}
      </section>

      {/* Véhicules à valider */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-base font-black sm:text-lg">
            {t("admin.dashboard.vehiclesToValidate")} <span className="text-slate-400 dark:text-slate-500">({pendingVehicles.length})</span>
          </h2>
          <div className="mt-4 space-y-3">
            {pendingVehicles.map((vehicle) => (
              <article key={vehicle.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black">{vehicle.brand} {vehicle.model}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {vehicle.owner?.firstName} {vehicle.owner?.lastName} · {vehicle.commune}
                    </p>
                  </div>
                  <StatusBadge value={vehicle.publicationStatus} />
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {getDescription(vehicle)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setPendingAction({ type: "vehicle-approve", id: vehicle.id })} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
                    {t("admin.dashboard.approve")}
                  </button>
                  <button onClick={() => setPendingAction({ type: "vehicle-reject", id: vehicle.id })} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300">
                    {t("admin.dashboard.reject")}
                  </button>
                  <Link to={`/vehicules/${vehicle.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    {t("admin.dashboard.viewVehicle")}
                  </Link>
                </div>
              </article>
            ))}
            {pendingVehicles.length === 0 && (
              <p className="rounded-xl bg-slate-100 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {t("admin.dashboard.noVehiclesToValidate")}
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base font-black sm:text-lg">
            {t("admin.dashboard.ownerRequests")} <span className="text-slate-400 dark:text-slate-500">({requests.length})</span>
          </h2>
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-black">{request.user.firstName} {request.user.lastName}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {request.user.phone}{request.user.email ? ` · ${request.user.email}` : ""}
                </p>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                  {request.motivation || t("admin.dashboard.noMotivation")}
                </p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setPendingAction({ type: "owner-approve", id: request.id })} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
                    {t("admin.dashboard.approve")}
                  </button>
                  <button onClick={() => setPendingAction({ type: "owner-reject", id: request.id })} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300">
                    {t("admin.dashboard.reject")}
                  </button>
                </div>
              </article>
            ))}
            {requests.length === 0 && (
              <p className="rounded-xl bg-slate-100 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {t("admin.dashboard.noOwnerRequests")}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
