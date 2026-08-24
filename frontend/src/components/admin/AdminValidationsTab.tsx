import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "../StatusBadge";
import { VehicleStatusModal } from "./VehicleStatusModal";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import type { AdminStats, OwnerRequest, PendingAction } from "./adminTypes";
import { formatGnf, type Vehicle } from "../../lib/domain";

type Props = {
  stats: AdminStats;
  pendingVehicles: Vehicle[];
  requests: OwnerRequest[];
  getDescription: (v: Vehicle) => string;
  setPendingAction: (action: PendingAction) => void;
  setActiveTab: (tab: "stats" | "users" | "bookings" | "reports") => void;
  setRoleFilter: (role: string) => void;
  setBookingStatusFilter: (status: string) => void;
};

const STATUS_I18N: Record<string, string> = {
  BROUILLON: "vehicles.status.draft",
  EN_ATTENTE_VALIDATION: "vehicles.status.pendingValidation",
  PUBLIEE: "vehicles.status.published",
  REJETEE: "vehicles.status.rejected",
  ARCHIVEE: "vehicles.status.archived",
};

const ROLE_I18N: Record<string, string> = {
  CLIENT: "admin.users.roleClient",
  PROPRIETAIRE: "admin.users.roleOwner",
  ADMIN: "admin.users.roleAdmin",
};

const BOOKING_I18N: Record<string, string> = {
  EN_ATTENTE: "bookings.status.pending",
  CONFIRMEE: "bookings.status.confirmed",
  EN_COURS: "bookings.status.inProgress",
  TERMINEE: "bookings.status.completed",
  ANNULEE: "bookings.status.cancelled",
  REJETEE: "bookings.status.rejected",
};

export function AdminValidationsTab({
  stats,
  pendingVehicles,
  requests,
  getDescription,
  setPendingAction,
  setActiveTab,
  setRoleFilter,
  setBookingStatusFilter,
}: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [selectedVehicleStatus, setSelectedVehicleStatus] = useState<string | null>(null);

  // ── Charger le statut favori pour les véhicules en attente ──
  const vehicleIds = pendingVehicles.map((v) => v.id).join(",");
  const { data: adminFavorites = {} } = useQuery({
    queryKey: ["admin", "favorites", vehicleIds],
    queryFn: () =>
      apiFetch<{ status: string; data: Record<string, boolean> }>(
        `/api/favorites/check-batch?ids=${vehicleIds}`,
      ).then((res) => res.data),
    enabled: vehicleIds.length > 0,
    staleTime: 30_000,
  });

  // ── Toggle favori admin ──
  const toggleFavorite = useCallback(async (vehicleId: string) => {
    const isFav = adminFavorites[vehicleId];
    try {
      if (isFav) {
        await apiFetch(`/api/favorites/${vehicleId}`, { method: "DELETE" });
      } else {
        await apiFetch("/api/favorites", {
          method: "POST",
          body: JSON.stringify({ vehicleId }),
        });
      }
      setAdminFavorites((prev) => ({ ...prev, [vehicleId]: !isFav }));
      showToast(isFav ? t("admin.dashboard.favoriteRemoved") : t("admin.dashboard.favoriteAdded"));
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("admin.dashboard.actionImpossible"), "error");
    }
  }, [adminFavorites, showToast, t]);

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
              <button
                key={status}
                onClick={() => setSelectedVehicleStatus(status)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  {STATUS_I18N[status] ? t(STATUS_I18N[status]) : status}
                </span>
                <span className="font-bold">{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("admin.dashboard.usersByRole")}
          </h2>
          <div className="mt-3 space-y-1">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <button
                key={role}
                onClick={() => { setActiveTab("users"); setRoleFilter(role); }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  {ROLE_I18N[role] ? t(ROLE_I18N[role]) : role}
                </span>
                <span className="font-bold">{count}</span>
              </button>
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
                onClick={() => { setActiveTab("bookings"); setBookingStatusFilter(status); }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  {BOOKING_I18N[status] ? t(BOOKING_I18N[status]) : status}
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
          <button onClick={() => setActiveTab("bookings")} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">💰 {t("admin.dashboard.stats.totalRevenue")}</p>
            <p className="mt-2 text-lg font-black break-all text-emerald-600 sm:text-2xl dark:text-emerald-400">
              {formatGnf(stats.totalRevenue)}
            </p>
          </button>
        )}
        {stats.activeVehicles !== undefined && (
          <button onClick={() => setSelectedVehicleStatus("PUBLIEE")} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">🚗 {t("admin.dashboard.stats.activeVehicles")}</p>
            <p className="mt-2 text-2xl font-black">{stats.activeVehicles}</p>
          </button>
        )}
        {stats.totalFavorites !== undefined && (
          <Link to="/administration/favoris" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">❤️ {t("admin.dashboard.stats.favorites")}</p>
            <p className="mt-2 text-2xl font-black">{stats.totalFavorites}</p>
          </Link>
        )}
        {stats.totalReviews !== undefined && (
          <Link to="/administration/avis" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">⭐ {t("admin.dashboard.stats.reviews")}</p>
            <p className="mt-2 text-2xl font-black">{stats.totalReviews}</p>
          </Link>
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
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button onClick={() => setPendingAction({ type: "vehicle-approve", id: vehicle.id })} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
                    {t("admin.dashboard.approve")}
                  </button>
                  <button onClick={() => setPendingAction({ type: "vehicle-reject", id: vehicle.id })} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300">
                    {t("admin.dashboard.reject")}
                  </button>
                  <Link to={`/vehicules/${vehicle.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    {t("admin.dashboard.viewVehicle")}
                  </Link>
                  <button
                    onClick={() => toggleFavorite(vehicle.id)}
                    className={`ml-auto rounded-lg px-3 py-2 text-sm font-bold transition ${
                      adminFavorites[vehicle.id]
                        ? "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
                        : "border border-slate-300 text-slate-500 hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-800 dark:hover:text-red-400"
                    }`}
                    title={adminFavorites[vehicle.id] ? t("admin.dashboard.removeFavorite") : t("admin.dashboard.addFavorite")}
                  >
                    {adminFavorites[vehicle.id] ? "❤️" : "🤍"}
                  </button>
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
      {/* Modal détails véhicules par statut */}
      {selectedVehicleStatus && (
        <VehicleStatusModal
          status={selectedVehicleStatus}
          onClose={() => setSelectedVehicleStatus(null)}
        />
      )}
    </>
  );
}
