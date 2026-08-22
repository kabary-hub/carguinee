import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { StatusBadge } from "../../components/StatusBadge";
import { TranslateFieldButton } from "../../components/TranslateFieldButton";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch, deleteVehiclePhoto, resolvePhotoUrl, uploadVehiclePhotos } from "../../lib/api";
import type { ApiResponse, Booking, Vehicle } from "../../lib/domain";
import { formatGnf } from "../../lib/domain";

const VEHICLE_TYPES = [
  "CITADINE", "BERLINE", "SUV", "QUATRE_QUATRE", "UTILITAIRE", "MINIBUS", "CAMION", "MOTO", "AUTRE",
];
const VEHICLE_CONDITIONS = ["OCCASION", "NEUF"];
const COMMUNES = ["KALOUM", "DIXINN", "MATAM", "RATOMA", "MATOTO"];

const MAX_PHOTOS = 8;
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VISIBLE_VEHICLES_INITIAL = 3;

function validatePhotos(selected: File[], remaining: number, t: (key: string) => string): { files: File[]; error: string | null } {
  if (selected.length === 0) return { files: [], error: t("photos.selectAtLeastOne") };
  if (selected.length > remaining) return { files: [], error: t("photos.tooManyPhotos").replace("{{remaining}}", String(remaining)) };
  if (selected.find((f) => !ALLOWED_PHOTO_TYPES.includes(f.type))) return { files: [], error: t("photos.invalidFileType") };
  if (selected.find((f) => f.size > MAX_PHOTO_SIZE_BYTES)) return { files: [], error: t("photos.fileTooLarge") };
  return { files: selected, error: null };
}

export function OwnerDashboardPage() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const { showToast } = useToast();

  const load = () =>
    Promise.all([
      apiFetch<ApiResponse<Vehicle[]>>("/api/vehicles/mine"),
      apiFetch<ApiResponse<Booking[]>>("/api/bookings/owner"),
    ])
      .then(([vehicleData, bookingData]) => {
        setVehicles(vehicleData.data);
        setBookings(bookingData.data);
      })
      .catch((reason: Error) => setError(reason.message));

  useEffect(() => { void load(); }, []);

  // ── Création ──
  const createVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    try {
      await apiFetch("/api/vehicles", {
        method: "POST",
        body: JSON.stringify({
          type: data.get("type"),
          condition: data.get("condition"),
          brand: data.get("brand"),
          model: data.get("model"),
          year: Number(data.get("year")) || undefined,
          mileageKm: data.get("mileageKm") ? Number(data.get("mileageKm")) : undefined,
          color: data.get("color") || undefined,
          seats: data.get("seats") ? Number(data.get("seats")) : undefined,
          commune: data.get("commune"),
          quartier: data.get("quartier"),
          secteur: data.get("secteur"),
          supportsRental: true,
          dailyRentalPriceGnf: Number(data.get("price")),
          rentalDepositGnf: data.get("deposit") ? Number(data.get("deposit")) : undefined,
          descriptionFr: data.get("descriptionFr") || undefined,
          descriptionEn: data.get("descriptionEn") || undefined,
          carteGrisePresente: data.get("carteGrisePresente") === "on",
          visiteTechniqueValideJusquA: data.get("visiteTechniqueValideJusquA") || undefined,
          assuranceValideJusquA: data.get("assuranceValideJusquA") || undefined,
        }),
      });
      showToast(t("owner.vehicleForm.draftCreated"));
      event.currentTarget.reset();
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("owner.vehicleForm.creationImpossible"), "error");
    }
  };

  // ── Édition ──
  const saveEdit = async (event: FormEvent<HTMLFormElement>, vehicle: Vehicle) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    try {
      await apiFetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          type: data.get("type"),
          condition: data.get("condition"),
          brand: data.get("brand"),
          model: data.get("model"),
          year: Number(data.get("year")) || undefined,
          mileageKm: data.get("mileageKm") ? Number(data.get("mileageKm")) : undefined,
          color: data.get("color") || undefined,
          seats: data.get("seats") ? Number(data.get("seats")) : undefined,
          commune: data.get("commune"),
          quartier: data.get("quartier"),
          secteur: data.get("secteur"),
          dailyRentalPriceGnf: Number(data.get("price")),
          rentalDepositGnf: data.get("deposit") ? Number(data.get("deposit")) : undefined,
          descriptionFr: data.get("descriptionFr") || undefined,
          descriptionEn: data.get("descriptionEn") || undefined,
          carteGrisePresente: data.get("carteGrisePresente") === "on",
          visiteTechniqueValideJusquA: data.get("visiteTechniqueValideJusquA") || undefined,
          assuranceValideJusquA: data.get("assuranceValideJusquA") || undefined,
        }),
      });
      showToast(t("owner.vehicleForm.editSuccess"));
      setEditingId(null);
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("owner.vehicleForm.editImpossible"), "error");
    }
  };

  // ── Soumission avec vérification des conditions ──
  const submit = async (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return;

    // Vérifications avant soumission
    if (!vehicle.brand || !vehicle.model) {
      showToast(t("owner.vehicleForm.submitConditions.brandModelRequired"), "error");
      return;
    }
    if (!vehicle.dailyRentalPriceGnf || vehicle.dailyRentalPriceGnf <= 0) {
      showToast(t("owner.vehicleForm.submitConditions.priceRequired"), "error");
      return;
    }
    if (vehicle.photos.length < 1) {
      showToast(t("owner.vehicleForm.submitConditions.photoRequired"), "error");
      return;
    }

    try {
      await apiFetch(`/api/vehicles/${id}/submit`, { method: "PATCH" });
      showToast(t("owner.vehicleForm.submitSuccess"));
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("owner.vehicleForm.submitImpossible"), "error");
    }
  };

  // ── Suppression ──
  const deleteVehicle = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/vehicles/${deleteTarget.id}`, { method: "DELETE" });
      showToast(t("owner.vehicleForm.deleteSuccess"));
      setDeleteTarget(null);
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("owner.vehicleForm.deleteImpossible"), "error");
    }
  };

  // ── Photos ──
  const uploadPhotos = async (vehicleId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    const remaining = MAX_PHOTOS - vehicle.photos.length;
    const validation = validatePhotos(Array.from(fileList), remaining, t);
    if (validation.error) {
      setPhotoErrors((c) => ({ ...c, [vehicleId]: validation.error! }));
      return;
    }
    setUploadingId(vehicleId);
    setPhotoErrors((c) => ({ ...c, [vehicleId]: "" }));
    try {
      await uploadVehiclePhotos(vehicleId, validation.files);
      showToast(t("photos.photosAdded"));
      await load();
    } catch (reason) {
      setPhotoErrors((c) => ({ ...c, [vehicleId]: reason instanceof Error ? reason.message : t("photos.uploadImpossible") }));
    } finally {
      setUploadingId(null);
    }
  };

  const removePhoto = async (vehicle: Vehicle, photoId: string) => {
    setPhotoErrors((c) => ({ ...c, [vehicle.id]: "" }));
    try {
      await deleteVehiclePhoto(vehicle.id, photoId);
      showToast(t("photos.photoDeleted"));
      await load();
    } catch (reason) {
      setPhotoErrors((c) => ({ ...c, [vehicle.id]: reason instanceof Error ? reason.message : t("photos.deleteImpossible") }));
    }
  };

  const isEditing = (id: string) => editingId === id;

  // ── Stats ──
  const statusCounts: Record<string, number> = {};
  for (const v of vehicles) statusCounts[v.publicationStatus] = (statusCounts[v.publicationStatus] ?? 0) + 1;
  const confirmedTotalGnf = bookings.filter((b) => ["CONFIRMEE", "EN_COURS", "TERMINEE"].includes(b.status)).reduce((s, b) => s + b.totalAmountGnf, 0);
  const confirmedBookings = bookings.filter((b) => ["CONFIRMEE", "EN_COURS", "TERMINEE"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "TERMINEE");
  const pendingBookings = bookings.filter((b) => b.status === "EN_ATTENTE");

  // ── Véhicules visibles ──
  const visibleVehicles = showAllVehicles ? vehicles : vehicles.slice(0, VISIBLE_VEHICLES_INITIAL);

  const inputClass = "rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500";

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl overflow-hidden px-4 py-10 sm:px-6">
        <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          {t("nav.ownerSpace")}
        </p>
        <h1 className="mt-2 text-3xl font-black">{t("owner.dashboard.subtitle")}</h1>

        {error && (
          <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>
        )}

        {/* ── Statistiques cliquables (3 visibles) ── */}
        <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Link to="/proprietaire#vehicles" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("owner.dashboard.stats.vehicles")}</p>
            <p className="mt-2 text-3xl font-black">{vehicles.length}</p>
          </Link>
          <Link to="/proprietaire#vehicles" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("owner.dashboard.stats.pending")}</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{statusCounts["EN_ATTENTE_VALIDATION"] ?? 0}</p>
          </Link>
          <Link to="/reservations" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("owner.dashboard.stats.receivedRequests")}</p>
            <p className="mt-2 text-3xl font-black">{bookings.length}</p>
            {confirmedTotalGnf > 0 && (
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {formatGnf(confirmedTotalGnf)} {t("owner.dashboard.confirmed")}</p>
            )}
          </Link>
          <Link to="/reservations" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">📈 {t("owner.dashboard.stats.revenue")}</p>
            <p className="mt-2 text-lg font-black break-all text-emerald-600 sm:text-3xl dark:text-emerald-400">{formatGnf(confirmedTotalGnf)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{confirmedBookings.length} {t("owner.dashboard.stats.confirmedLocations")}</p>
          </Link>
        </section>

        {/* ── Graphiques ── */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Répartition des statuts de réservation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.dashboard.charts.bookingDistribution")}
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { label: t("owner.dashboard.charts.pending"), count: pendingBookings.length, color: "bg-amber-400" },
                { label: t("owner.dashboard.charts.confirmed"), count: confirmedBookings.length - completedBookings.length, color: "bg-blue-400" },
                { label: t("owner.dashboard.charts.completed"), count: completedBookings.length, color: "bg-emerald-400" },
                { label: t("owner.dashboard.charts.cancelled"), count: bookings.filter((b) => b.status === "ANNULEE").length, color: "bg-rose-400" },
              ].map((bar) => {
                const maxCount = Math.max(bookings.length, 1);
                const widthPercent = Math.round((bar.count / maxCount) * 100);
                return (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{bar.label}</span>
                      <span className="font-bold">{bar.count}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`${bar.color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.max(widthPercent, 2)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statut des véhicules */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.dashboard.charts.vehicleStatus")}
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { label: t("owner.dashboard.charts.published"), count: statusCounts["PUBLIEE"] ?? 0, color: "bg-emerald-400" },
                { label: t("owner.dashboard.charts.draft"), count: statusCounts["BROUILLON"] ?? 0, color: "bg-slate-400" },
                { label: t("owner.dashboard.charts.pendingValidation"), count: statusCounts["EN_ATTENTE_VALIDATION"] ?? 0, color: "bg-amber-400" },
                { label: t("owner.dashboard.charts.rejected"), count: statusCounts["REJETEE"] ?? 0, color: "bg-rose-400" },
              ].map((bar) => {
                const maxCount = Math.max(vehicles.length, 1);
                const widthPercent = Math.round((bar.count / maxCount) * 100);
                return (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{bar.label}</span>
                      <span className="font-bold">{bar.count}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`${bar.color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.max(widthPercent, 2)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 overflow-hidden lg:grid-cols-[0.8fr_1.2fr]">
          {/* ── Formulaire création ── */}
          <form onSubmit={createVehicle} className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black">{t("owner.dashboard.addVehicle")}</h2>
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input required name="brand" placeholder={t("owner.vehicleForm.brand")} className={inputClass} />
                <input required name="model" placeholder={t("owner.vehicleForm.model")} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select name="type" defaultValue="BERLINE" className={inputClass}>
                  {VEHICLE_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                </select>
                <select name="condition" defaultValue="OCCASION" className={inputClass}>
                  {VEHICLE_CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input name="year" type="number" min="1900" placeholder={t("owner.vehicleForm.year")} className={inputClass} />
                <input name="mileageKm" type="number" min="0" placeholder={t("owner.vehicleForm.mileage")} className={inputClass} />
                <input name="seats" type="number" min="1" placeholder={t("owner.vehicleForm.seats")} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input required name="price" type="number" min="1" placeholder={t("owner.vehicleForm.dailyPrice")} className={inputClass} />
                <input name="deposit" type="number" min="0" placeholder={t("owner.vehicleForm.deposit")} className={inputClass} />
              </div>
              <input name="color" placeholder={t("owner.vehicleForm.color")} className={inputClass} />
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">📄 {t("owner.vehicleForm.documents")}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex flex-col items-start gap-1">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("owner.vehicleForm.carteGrisePresent")}</span>
                    <input type="checkbox" name="carteGrisePresente" className="h-4 w-4 rounded border-slate-300" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("owner.vehicleForm.visiteTechniqueValidUntil")}
                    <input type="date" name="visiteTechniqueValideJusquA" className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" style={{ colorScheme: "dark" }} />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("owner.vehicleForm.assuranceValidUntil")}
                    <input type="date" name="assuranceValideJusquA" className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" style={{ colorScheme: "dark" }} />
                  </label>
                </div>
              </div>
              <select name="commune" defaultValue="RATOMA" className={inputClass}>
                {COMMUNES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required name="quartier" placeholder={t("owner.vehicleForm.quartier")} autoComplete="off" className={inputClass} />
                <input required name="secteur" placeholder={t("owner.vehicleForm.secteur")} autoComplete="off" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <textarea name="descriptionFr" placeholder={t("owner.vehicleForm.descriptionFr")} rows={3} className={inputClass} />
                  <TranslateFieldButton
                    sourceFieldName="descriptionFr"
                    targetFieldName="descriptionEn"
                    targetLang="en"
                  />
                </div>
                <div>
                  <textarea name="descriptionEn" placeholder={t("owner.vehicleForm.descriptionEn")} rows={3} className={inputClass} />
                  <TranslateFieldButton
                    sourceFieldName="descriptionEn"
                    targetFieldName="descriptionFr"
                    targetLang="fr"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("owner.vehicleForm.submitHelp")}
              </p>
              <button className="rounded-lg bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700">
                {t("owner.vehicleForm.createVehicle")}
              </button>
            </div>
          </form>

          {/* ── Liste véhicules (3 visibles + Voir plus) ── */}
          <div>
            <h2 className="text-lg font-black">{t("owner.dashboard.myVehicles")}</h2>
            <div className="mt-4 space-y-3">
              {visibleVehicles.map((vehicle) => {
                const remaining = MAX_PHOTOS - vehicle.photos.length;
                const canDelete = ["BROUILLON", "EN_ATTENTE_VALIDATION", "REJETEE"].includes(vehicle.publicationStatus);
                return (
                  <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-black">{vehicle.brand} {vehicle.model}</h3>
                        <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                          {formatGnf(vehicle.dailyRentalPriceGnf)} {t("common.perDay")} · {vehicle.condition} · {vehicle.year ?? t("common.unknownYear")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={vehicle.publicationStatus} />
                        {["BROUILLON", "REJETEE"].includes(vehicle.publicationStatus) && (
                          <button onClick={() => submit(vehicle.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700">
                            {t("common.submit")}
                          </button>
                        )}
                        <button onClick={() => setEditingId(isEditing(vehicle.id) ? null : vehicle.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                          {isEditing(vehicle.id) ? t("common.cancel") : t("common.edit")}
                        </button>
                        {vehicle.publicationStatus === "PUBLIEE" && (
                          <Link to={`/vehicules/${vehicle.id}`} className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300">
                            {t("common.view")}
                          </Link>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(vehicle)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300">
                            {t("common.delete")}
                          </button>
                        )}
                      </div>
                    </div>

                    {vehicle.rejectionReason && (
                      <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{t("confirmDialog.reasonLabel")} : {vehicle.rejectionReason}</p>
                    )}

                    {/* Photos */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <span>{t("owner.vehicleForm.photosCount", { current: vehicle.photos.length, max: MAX_PHOTOS })}</span>
                        <span className={remaining === 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}>
                          {remaining === 0 ? t("owner.vehicleForm.photoLimitReached") : t("owner.vehicleForm.photoRemaining", { count: remaining })}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${(vehicle.photos.length / MAX_PHOTOS) * 100}%` }} />
                      </div>
                      {vehicle.photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2 overflow-hidden">
                          {vehicle.photos.map((photo) => (
                            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                              <img src={resolvePhotoUrl(photo.url)} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover" />
                              <button type="button" onClick={() => removePhoto(vehicle, photo.id)} className="absolute right-1 top-1 rounded-full bg-rose-600 px-1.5 text-xs font-black text-white opacity-90 hover:bg-rose-700" title={t("common.delete")}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {remaining > 0 && (
                        <label className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-2.5 text-sm font-semibold ${uploadingId === vehicle.id ? "cursor-wait border-slate-600 text-slate-400" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/15"}`}>
                          {uploadingId === vehicle.id ? t("owner.vehicleForm.uploading") : t("owner.vehicleForm.addPhotos", { count: remaining })}
                          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={uploadingId === vehicle.id} onChange={(e) => { void uploadPhotos(vehicle.id, e.target.files); e.target.value = ""; }} />
                        </label>
                      )}
                      {photoErrors[vehicle.id] && (
                        <p className="mt-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{photoErrors[vehicle.id]}</p>
                      )}
                    </div>

                    {/* Formulaire édition */}
                    {isEditing(vehicle.id) && (
                      <form onSubmit={(e) => saveEdit(e, vehicle)} className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("owner.vehicleForm.editMode", { brand: vehicle.brand, model: vehicle.model })}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <input required name="brand" defaultValue={vehicle.brand} placeholder={t("owner.vehicleForm.brand")} className={inputClass} />
                          <input required name="model" defaultValue={vehicle.model} placeholder={t("owner.vehicleForm.model")} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <select name="type" defaultValue={vehicle.type} className={inputClass}>{VEHICLE_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
                          <select name="condition" defaultValue={vehicle.condition} className={inputClass}>{VEHICLE_CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input name="year" type="number" min="1900" defaultValue={vehicle.year ?? ""} placeholder={t("owner.vehicleForm.year")} className={inputClass} />
                          <input name="mileageKm" type="number" min="0" defaultValue={vehicle.mileageKm ?? ""} placeholder={t("owner.vehicleForm.mileage")} className={inputClass} />
                          <input name="seats" type="number" min="1" defaultValue={vehicle.seats ?? ""} placeholder={t("owner.vehicleForm.seats")} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input required name="price" type="number" min="1" defaultValue={vehicle.dailyRentalPriceGnf ?? ""} placeholder={t("owner.vehicleForm.dailyPrice")} className={inputClass} />
                          <input name="deposit" type="number" min="0" defaultValue={vehicle.rentalDepositGnf ?? ""} placeholder={t("owner.vehicleForm.deposit")} className={inputClass} />
                        </div>
                        <input name="color" defaultValue={vehicle.color ?? ""} placeholder={t("owner.vehicleForm.color")} className={inputClass} />
                        <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">📄 {t("owner.vehicleForm.documents")}</p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <label className="flex flex-col items-start gap-1">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("owner.vehicleForm.carteGrisePresent")}</span>
                              <input type="checkbox" name="carteGrisePresente" defaultChecked={!!vehicle.carteGrisePresente} className="h-4 w-4 rounded border-slate-300" />
                            </label>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {t("owner.vehicleForm.visiteTechniqueValidUntil")}
                              <input type="date" name="visiteTechniqueValideJusquA" defaultValue={vehicle.visiteTechniqueValideJusquA ? String(vehicle.visiteTechniqueValideJusquA).split("T")[0] : ""} className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" style={{ colorScheme: "dark" }} />
                            </label>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {t("owner.vehicleForm.assuranceValidUntil")}
                              <input type="date" name="assuranceValideJusquA" defaultValue={vehicle.assuranceValideJusquA ? String(vehicle.assuranceValideJusquA).split("T")[0] : ""} className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" style={{ colorScheme: "dark" }} />
                            </label>
                          </div>
                        </div>
                        <select name="commune" defaultValue={vehicle.commune} className={inputClass}>{COMMUNES.map((c) => <option key={c}>{c}</option>)}</select>
                        <div className="grid grid-cols-2 gap-3">
                          <input required name="quartier" defaultValue={vehicle.quartier} placeholder={t("owner.vehicleForm.quartier")} autoComplete="off" className={inputClass} />
                          <input required name="secteur" defaultValue={vehicle.secteur} placeholder={t("owner.vehicleForm.secteur")} autoComplete="off" className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <textarea name="descriptionFr" rows={3} defaultValue={vehicle.descriptionFr ?? vehicle.description ?? ""} placeholder={t("owner.vehicleForm.descriptionFr")} className={inputClass} />
                            <TranslateFieldButton
                              sourceFieldName="descriptionFr"
                              targetFieldName="descriptionEn"
                              targetLang="en"
                            />
                          </div>
                          <div>
                            <textarea name="descriptionEn" rows={3} defaultValue={vehicle.descriptionEn ?? ""} placeholder={t("owner.vehicleForm.descriptionEn")} className={inputClass} />
                            <TranslateFieldButton
                              sourceFieldName="descriptionEn"
                              targetFieldName="descriptionFr"
                              targetLang="fr"
                            />
                          </div>
                        </div>
                        <button className="rounded-lg bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700">{t("common.save")}</button>
                      </form>
                    )}
                  </article>
                );
              })}

              {vehicles.length === 0 && (
                <p className="rounded-xl bg-slate-100 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">{t("owner.dashboard.noVehicles")}</p>
              )}

              {vehicles.length > VISIBLE_VEHICLES_INITIAL && !showAllVehicles && (
                <button onClick={() => setShowAllVehicles(true)} className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  {t("owner.dashboard.showAll", { count: vehicles.length })}
                </button>
              )}
              {showAllVehicles && vehicles.length > VISIBLE_VEHICLES_INITIAL && (
                <button onClick={() => { setShowAllVehicles(false); }} className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  {t("owner.dashboard.reduce")}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Lien vers la page Réservations ── */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{t("owner.dashboard.receivedBookings")}</h2>
            <a href="/reservations" className="text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
              {t("owner.dashboard.viewAllBookings")}
            </a>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("owner.dashboard.bookingsCount", { count: bookings.length })}
          </p>
        </section>
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("common.delete")}
        message={`${t("common.delete")} ${deleteTarget?.brand} ${deleteTarget?.model} ?`}
        confirmLabel={t("common.delete")}
        tone="rose"
        onConfirm={() => { void deleteVehicle(); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
