import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";
import { StatusBadge } from "../StatusBadge";
import { printVehicleList } from "../../lib/printUtils";
import type { Vehicle } from "../../lib/domain";
import { formatGnf } from "../../lib/domain";

type Props = {
  status: string;
  onClose: () => void;
};

const STATUS_I18N: Record<string, string> = {
  BROUILLON: "vehicles.status.draft",
  EN_ATTENTE_VALIDATION: "vehicles.status.pendingValidation",
  PUBLIEE: "vehicles.status.published",
  REJETEE: "vehicles.status.rejected",
  ARCHIVEE: "vehicles.status.archived",
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CITADINE: "Citadine",
  BERLINE: "Berline",
  SUV: "SUV",
  QUATRE_QUATRE: "4×4",
  UTILITAIRE: "Utilitaire",
  MINIBUS: "Minibus",
  CAMION: "Camion",
  MOTO: "Moto",
  AUTRE: "Autre",
};

export function VehicleStatusModal({ status, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminFavorites, setAdminFavorites] = useState<Record<string, boolean>>({});
  const isFr = i18n.language?.startsWith("fr");

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ publicationStatus: status, pageSize: "100" });
        const res = await apiFetch<{ status: string; data: { items: Vehicle[] } }>(
          `/api/vehicles/admin/all?${params}`,
        );
        setVehicles(res.data.items);
      } catch {
        showToast(t("admin.dashboard.loadError", { defaultValue: "Erreur de chargement." }), "error");
      } finally {
        setLoading(false);
      }
    };
    void fetchVehicles();
  }, [status, showToast, t]);

  // ── Charger les favoris admin pour les véhicules affichés ──
  useEffect(() => {
    if (vehicles.length === 0) return;
    const ids = vehicles.map((v) => v.id).join(",");
    apiFetch<{ status: string; data: Record<string, boolean> }>(`/api/favorites/check-batch?ids=${ids}`)
      .then((res) => setAdminFavorites(res.data))
      .catch(() => {});
  }, [vehicles]);

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

  const statusLabel = STATUS_I18N[status] ? t(STATUS_I18N[status]) : status;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={statusLabel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              🚗 {statusLabel}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {vehicles.length} {isFr ? "véhicule(s)" : "vehicle(s)"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("common.loading")}
          </p>
        )}

        {!loading && vehicles.length === 0 && (
          <p className="mt-10 text-center text-slate-500 dark:text-slate-400">
            {t("vehicles.noVehiclesFound")}
          </p>
        )}

        {/* Liste des véhicules */}
        {!loading && vehicles.length > 0 && (
          <div className="mt-5 space-y-3">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
              >
                {/* Photo + titre */}
                <div className="flex items-start gap-3">
                  {vehicle.photos && vehicle.photos.length > 0 && (
                    <img
                      src={vehicle.photos[0].url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-slate-900 dark:text-slate-100">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <StatusBadge value={vehicle.publicationStatus} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type}
                      {vehicle.year ? ` · ${vehicle.year}` : ""}
                      {vehicle.commune ? ` · ${vehicle.commune}` : ""}
                      {vehicle.dailyRentalPriceGnf ? ` · ${formatGnf(vehicle.dailyRentalPriceGnf)}/jour` : ""}
                    </p>
                  </div>
                </div>

                {/* Propriétaire */}
                {vehicle.owner && (
                  <div className="mt-3 rounded-lg bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      🏠 {isFr ? "Propriétaire" : "Owner"}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                      {vehicle.owner.firstName} {vehicle.owner.lastName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-600 dark:text-slate-400">
                      {vehicle.owner.phone && <span>📞 {vehicle.owner.phone}</span>}
                      {vehicle.owner.email && <span>✉️ {vehicle.owner.email}</span>}
                      {vehicle.owner.averageRating != null && (
                        <span>⭐ {vehicle.owner.averageRating.toFixed(1)}/5</span>
                      )}
                      {vehicle.owner.identityVerified && (
                        <span className="text-emerald-600 dark:text-emerald-400">✅ {isFr ? "Vérifié" : "Verified"}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {vehicle.descriptionFr && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                    {isFr ? vehicle.descriptionFr : (vehicle.descriptionEn || vehicle.descriptionFr)}
                  </p>
                )}

                {/* Raison rejet si applicable */}
                {vehicle.publicationStatus === "REJETEE" && vehicle.rejectionReason && (
                  <div className="mt-2 rounded-lg bg-rose-50 p-2 dark:bg-rose-500/10">
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                      ❌ {isFr ? "Motif du rejet" : "Rejection reason"}: {vehicle.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    to={`/vehicules/${vehicle.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    👁️ {t("admin.dashboard.viewVehicle")}
                  </Link>
                  <button
                    onClick={() => toggleFavorite(vehicle.id)}
                    className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      adminFavorites[vehicle.id]
                        ? "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
                        : "border border-slate-300 text-slate-500 hover:border-red-300 hover:text-red-500 dark:border-slate-600 dark:text-slate-400 dark:hover:border-red-800 dark:hover:text-red-400"
                    }`}
                    title={adminFavorites[vehicle.id] ? t("admin.dashboard.removeFavorite") : t("admin.dashboard.addFavorite")}
                  >
                    {adminFavorites[vehicle.id] ? "❤️" : "🤍"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => printVehicleList(vehicles, statusLabel)}
            disabled={vehicles.length === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            🖨️ {t("admin.printList")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
