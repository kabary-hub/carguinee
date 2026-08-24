import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "../../components/AppShell";
import { apiFetch, resolvePhotoUrl } from "../../lib/api";
import { formatGnf } from "../../lib/domain";

type FavoriteItem = {
  id: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string | null; phone: string; role: string };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number | null;
    dailyRentalPriceGnf: number | null;
    salePriceGnf: number | null;
    commune: string;
    quartier: string;
    publicationStatus: string;
    photos: { url: string }[];
    owner: { id: string; firstName: string; lastName: string };
  };
};

type FavoriteResult = {
  items: FavoriteItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Client",
  PROPRIETAIRE: "Propriétaire",
  ADMIN: "Admin",
};

export function AdminFavoritesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (roleFilter) params.set("role", roleFilter);
    return params.toString();
  }, [page, roleFilter]);

  const { data: result, isLoading: loading, error } = useQuery({
    queryKey: ["admin-favorites", page, roleFilter],
    queryFn: () => apiFetch<{ status: string; data: FavoriteResult }>(`/api/admin/favorites?${buildQuery()}`),
    select: (payload) => payload.data,
  });

  const items = result?.items ?? [];
  const pagination = result?.pagination;

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-black">❤️ Favoris</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {pagination ? `${pagination.total} favori${pagination.total > 1 ? "s" : ""} au total` : ""}
            </p>
          </div>
          <Link
            to="/administration"
            className="text-sm font-bold text-emerald-700 dark:text-emerald-400"
          >
            ← Retour
          </Link>
        </div>

        {/* Filtres */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Filtrer par type :
          </span>
          {["", "CLIENT", "PROPRIETAIRE"].map((f) => (
            <button
              key={f}
              onClick={() => { setRoleFilter(f); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                roleFilter === f
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {f ? ROLE_LABELS[f] ?? f : "Tous"}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {error instanceof Error ? error.message : "Erreur lors du chargement."}
          </p>
        )}

        {loading && (
          <p className="mt-16 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("common.loading")}
          </p>
        )}

        {!loading && items.length === 0 && (
          <p className="mt-16 text-center text-slate-500 dark:text-slate-400">
            Aucun favori trouvé.
          </p>
        )}

        {/* Liste des favoris */}
        <div className="mt-6 space-y-3">
          {items.map((fav) => {
            const photo = fav.vehicle.photos[0]?.url
              ? resolvePhotoUrl(fav.vehicle.photos[0].url)
              : undefined;

            return (
              <article
                key={fav.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex gap-4">
                  {/* Photo véhicule */}
                  <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-900 dark:to-slate-700">
                    {photo ? (
                      <img src={photo} alt={`${fav.vehicle.brand} ${fav.vehicle.model}`} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">🚗</div>
                    )}
                  </div>

                  {/* Détails */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/vehicules/${fav.vehicle.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-600 dark:text-slate-100"
                        >
                          {fav.vehicle.brand} {fav.vehicle.model}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {fav.vehicle.commune} · {fav.vehicle.quartier}
                          {fav.vehicle.year ? ` · ${fav.vehicle.year}` : ""}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {fav.vehicle.dailyRentalPriceGnf && (
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatGnf(fav.vehicle.dailyRentalPriceGnf)}
                            <span className="font-normal text-slate-500 dark:text-slate-400"> /jour</span>
                          </p>
                        )}
                        {fav.vehicle.salePriceGnf && (
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatGnf(fav.vehicle.salePriceGnf)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Personne qui a ajouté le favori */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {fav.user.firstName} {fav.user.lastName}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          fav.user.role === "CLIENT"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        }`}>
                          {ROLE_LABELS[fav.user.role] ?? fav.user.role}
                        </span>
                      </span>
                      <span>{fav.user.phone}</span>
                      {fav.user.email && <span>{fav.user.email}</span>}
                    </div>

                    {/* Date d'ajout */}
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      Ajouté le {new Date(fav.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              ← Précédent
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Suivant →
            </button>
          </div>
        )}
      </main>
    </AppShell>
  );
}
