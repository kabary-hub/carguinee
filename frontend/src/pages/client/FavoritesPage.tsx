import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "../../components/AppShell";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch, resolvePhotoUrl } from "../../lib/api";
import { formatGnf } from "../../lib/domain";
import { getHomeRouteForRole } from "../../lib/roles";

/**
 * Type d'un favori retourné par l'API
 */
type FavoriteItem = {
  id: string;
  vehicleId: string;
  createdAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number | null;
    dailyRentalPriceGnf: number | null;
    commune: string;
    quartier: string;
    publicationStatus: string;
    photos: { id: string; url: string; sortOrder: number }[];
  };
};

/**
 * Page des favoris — Affiche tous les véhicules sauvegardés par l'utilisateur
 */
export function FavoritesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: response, isLoading: loading, error } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiFetch<{ status: string; data: FavoriteItem[] }>("/api/favorites"),
  });
  const favorites = response?.data ?? [];

  // ── Retirer un favori ──
  const removeFavoriteMutation = useMutation({
    mutationFn: (vehicleId: string) => apiFetch(`/api/favorites/${vehicleId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      showToast(t("favorites.removeSuccess"));
    },
    onError: (reason: Error) => {
      showToast(reason.message ?? "Erreur", "error");
    },
  });


  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <button
          onClick={() => navigate(getHomeRouteForRole(user.role))}
          className="flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400"
        >
          ← {t("common.back")}
        </button>
        <h1 className="mt-2 text-3xl font-black">❤️ {t("favorites.title")}</h1>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("common.loading")}
          </p>
        )}

        {!loading && favorites.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-lg text-slate-500 dark:text-slate-400">{t("favorites.noFavorites")}</p>      <Link to="/vehicules" className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
              {t("favorites.browseVehicles")}
            </Link>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => {
              const vehicle = fav.vehicle;
              const photo = vehicle.photos[0];
              return (
                <article
                  key={fav.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Photo */}
                  <Link to={`/vehicules/${vehicle.id}`} className="block">
                    {photo ? (
                      <img
                        src={resolvePhotoUrl(photo.url)}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                        <span className="text-4xl">🚗</span>
                      </div>
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="p-4">
                    <Link to={`/vehicules/${vehicle.id}`}>
                      <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                    </Link>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {vehicle.year && `${vehicle.year} · `}{vehicle.commune}, {vehicle.quartier}
                    </p>
                    {vehicle.dailyRentalPriceGnf && (
                      <p className="mt-2 text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {formatGnf(vehicle.dailyRentalPriceGnf)}
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("common.perDay")}</span>
                      </p>
                    )}
                  </div>

                  {/* Bouton retirer */}
                  <button
                    onClick={() => removeFavoriteMutation.mutate(vehicle.id)}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-500 shadow transition hover:bg-red-50 hover:text-red-700 dark:bg-slate-900/90"
                    title={t("vehicles.details.removeFromFavorites")}
                  >
                    ❤️
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
