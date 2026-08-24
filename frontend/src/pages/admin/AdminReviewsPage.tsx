import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "../../components/AppShell";
import { apiFetch, resolvePhotoUrl } from "../../lib/api";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; firstName: string; lastName: string; phone: string; email: string | null };
  reviewee: { id: string; firstName: string; lastName: string };
  vehicle: { id: string; brand: string; model: string; photos: { url: string }[] } | null;
  booking: { id: string; startDate: string; endDate: string } | null;
};

type ReviewResult = {
  items: ReviewItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function AdminReviewsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | "">("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (ratingFilter !== "") params.set("rating", String(ratingFilter));
    return params.toString();
  }, [page, ratingFilter]);

  const { data: result, isLoading: loading, error } = useQuery({
    queryKey: ["admin-reviews", page, ratingFilter],
    queryFn: () => apiFetch<{ status: string; data: ReviewResult }>(`/api/admin/reviews?${buildQuery()}`),
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
            <h1 className="mt-2 text-3xl font-black">⭐ Avis</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {pagination ? `${pagination.total} avis au total` : ""}
            </p>
          </div>
          <Link
            to="/administration"
            className="text-sm font-bold text-emerald-700 dark:text-emerald-400"
          >
            ← Retour
          </Link>
        </div>

        {/* Filtres par note */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Filtrer par note :
          </span>
          {(["", 1, 2, 3, 4, 5] as const).map((f) => (
            <button
              key={String(f)}
              onClick={() => { setRatingFilter(f); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                ratingFilter === f
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {f === "" ? "Toutes" : `${f} ★`}
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
            Aucun avis trouvé.
          </p>
        )}

        {/* Liste des avis */}
        <div className="mt-6 space-y-3">
          {items.map((review) => {
            const photo = review.vehicle?.photos[0]?.url
              ? resolvePhotoUrl(review.vehicle.photos[0].url)
              : undefined;

            return (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex gap-4">
                  {/* Photo véhicule */}
                  {review.vehicle && (
                    <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-900 dark:to-slate-700">
                      {photo ? (
                        <img src={photo} alt={`${review.vehicle.brand} ${review.vehicle.model}`} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl">🚗</div>
                      )}
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {review.rating}/5
                          </span>
                        </div>
                        {review.vehicle && (
                          <Link
                            to={`/vehicules/${review.vehicle.id}`}
                            className="mt-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          >
                            {review.vehicle.brand} {review.vehicle.model}
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                        {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Commentaire */}
                    {review.comment && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Auteur → évalué */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </span>
                        {" → "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {review.reviewee.firstName} {review.reviewee.lastName}
                        </span>
                      </span>
                      <span>·</span>
                      <span>{review.reviewer.phone}</span>
                      {review.reviewer.email && <span>{review.reviewer.email}</span>}
                    </div>

                    {/* Réservation */}
                    {review.booking && (
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        Réservation du {new Date(review.booking.startDate).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(review.booking.endDate).toLocaleDateString("fr-FR")}
                      </p>
                    )}
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
