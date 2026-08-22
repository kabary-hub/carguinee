import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, resolvePhotoUrl } from "../lib/api";
import type { ApiResponse, Vehicle } from "../lib/domain";
import { formatGnf } from "../lib/domain";

type VehicleResult = { items: Vehicle[]; pagination: { page: number; total: number; totalPages: number } };
const types = ["CITADINE", "BERLINE", "SUV", "QUATRE_QUATRE", "UTILITAIRE", "MINIBUS", "CAMION", "MOTO"];
const communes = ["KALOUM", "DIXINN", "MATAM", "RATOMA", "MATOTO"];

export function VehiclesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const [filters, setFilters] = useState({ search: "", type: "", commune: "", mode: "", minPriceGnf: "", maxPriceGnf: "", status: initialStatus });
  const [result, setResult] = useState<VehicleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams({ pageSize: "20" });
    if (filters.search.trim()) query.set("search", filters.search.trim());
    if (filters.type) query.set("type", filters.type);
    if (filters.commune) query.set("commune", filters.commune);
    if (filters.mode) query.set(filters.mode === "location" ? "supportsRental" : "supportsSale", "true");
    if (filters.minPriceGnf) query.set("minPriceGnf", filters.minPriceGnf);
    if (filters.maxPriceGnf) query.set("maxPriceGnf", filters.maxPriceGnf);
    if (filters.status) query.set("publicationStatus", filters.status);
    setLoading(true); setError("");
    apiFetch<ApiResponse<VehicleResult>>(`/api/vehicles?${query.toString()}`).then((payload) => setResult(payload.data)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [filters]);

  const update = (field: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [field]: value }));
  const controlClass = "rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500";
  const backRoute = user?.role === "ADMIN" ? "/administration" : user?.role === "PROPRIETAIRE" ? "/proprietaire" : null;

  return <AppShell><main className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><div className="max-w-2xl">{backRoute && <button onClick={() => navigate(backRoute)} className="mb-2 flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">← {t("common.back")}</button>}<p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{t("vehicles.publicCatalog")}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t("vehicles.catalogSubtitle")}</h1><p className="mt-3 text-slate-600 dark:text-slate-400">{t("vehicles.catalogDescription")}</p></div>
        {/* Bouton filtres mobile */}
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white sm:hidden"
        >
          {t("common.filter")} <span className="text-xs">▶</span>
        </button>
        <section className={`mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${mobileFiltersOpen ? "block" : "hidden"} sm:block sm:grid-cols-4`}><input value={filters.search} onChange={(event) => update("search", event.target.value)} placeholder={t("vehicles.filters.search")} className={`${controlClass} sm:col-span-2`} /><select value={filters.type} onChange={(event) => update("type", event.target.value)} className={controlClass}><option value="">{t("vehicles.filters.allTypes")}</option>{types.map((type) => <option key={type}>{type.replaceAll("_", " ")}</option>)}</select><select value={filters.commune} onChange={(event) => update("commune", event.target.value)} className={controlClass}><option value="">{t("vehicles.filters.allCommunes")}</option>{communes.map((commune) => <option key={commune}>{commune}</option>)}</select><select value={filters.mode} onChange={(event) => update("mode", event.target.value)} className={controlClass}><option value="">{t("vehicles.filters.locationOrSale")}</option><option value="location">{t("vehicles.filters.toRent")}</option><option value="vente">{t("vehicles.filters.toSell")}</option></select><input value={filters.minPriceGnf} onChange={(event) => update("minPriceGnf", event.target.value)} type="number" min="0" placeholder={t("vehicles.filters.minPrice")} className={controlClass} /><input value={filters.maxPriceGnf} onChange={(event) => update("maxPriceGnf", event.target.value)} type="number" min="0" placeholder={t("vehicles.filters.maxPrice")} className={controlClass} /><button onClick={() => setFilters({ search: "", type: "", commune: "", mode: "", minPriceGnf: "", maxPriceGnf: "", status: "" })} className="rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">{t("vehicles.filters.reset")}</button></section><div className="mt-6 flex items-center justify-between"><p className="text-sm text-slate-500 dark:text-slate-400">{t("common.vehiclesAvailable", { count: result?.pagination.total ?? 0 })}</p></div>{loading && <p className="py-16 text-center text-slate-500 dark:text-slate-400">{t("vehicles.loadingVehicles")}</p>}{error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>}{!loading && !error && result?.items.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900"><h2 className="font-bold">{t("vehicles.noVehiclesFound")}</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("vehicles.modifyFilters")}</p></div>}<section className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">{result?.items.map((vehicle) => { const photo = vehicle.photos[0]?.url ? resolvePhotoUrl(vehicle.photos[0].url) : undefined; return <Link key={vehicle.id} to={`/vehicules/${vehicle.id}`} className="catalogue-card group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-slate-800/50"><div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-600 sm:h-52 dark:from-slate-900 dark:to-slate-700">{photo ? <img src={photo} alt={`${vehicle.brand} ${vehicle.model}`} className="vehicle-photo h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">🚗</div>}<span className="absolute bottom-3 right-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-white">{t("common.photosCount", { count: vehicle.photos.length || 1 })}</span></div><div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-black">{vehicle.brand} {vehicle.model}</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{vehicle.type.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{vehicle.commune} · {vehicle.quartier}</p>{vehicle.supportsRental && <p className="mt-3 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{t("vehicles.details.rentalWithDriver")}</p>}<div className="mt-3 flex flex-wrap gap-2">{vehicle.supportsRental && <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatGnf(vehicle.dailyRentalPriceGnf)} <span className="font-normal text-slate-500 dark:text-slate-400">{t("common.perDay")}</span></span>}{vehicle.supportsSale && <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatGnf(vehicle.salePriceGnf)}</span>}</div></div></Link>; })}</section></main></AppShell>;
}
