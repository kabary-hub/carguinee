import { useEffect, useState, useCallback, useMemo, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "../../components/AppShell";
import { VehicleGallery } from "../../components/client/VehicleGallery";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { RatingStars } from "../../components/client/RatingStars";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import type { ApiResponse, Vehicle, Booking } from "../../lib/domain";

import { VehicleInfoSection } from "../../components/vehicle/VehicleInfoSection";
import { VehicleDocumentsSection } from "../../components/vehicle/VehicleDocumentsSection";
import { VehicleOwnerSection } from "../../components/vehicle/VehicleOwnerSection";
import { VehicleReviewsSection } from "../../components/vehicle/VehicleReviewsSection";
import { BookingSidebar } from "../../components/vehicle/BookingSidebar";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  categories: Record<string, number> | null;
  createdAt: string;
  reviewer: { id: string; firstName: string; lastName: string; averageRating: number | null };
};

type ReviewsResponse = {
  items: Review[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type ConditionReport = {
  exteriorDamage: string | null;
  paintQuality: string | null;
  engineCondition: string | null;
  transmissionCondition: string | null;
  tireCondition: string | null;
  brakeCondition: string | null;
  interiorCondition: string | null;
  seatsCondition: string | null;
  electronicsWorking: boolean | null;
  overallRating: number | null;
  additionalNotes: string | null;
};

/**
 * Page de détail d'un véhicule
 * Affiche la galerie, les caractéristiques, les documents,
 * le propriétaire, les avis et le formulaire de réservation.
 */
export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [lang, setLang] = useState(i18n.language?.startsWith("en") ? "en" : "fr");
  const [message, setMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [bookingForm, setBookingForm] = useState({ startDate: "", endDate: "", notes: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    const handler = (lng: string) => setLang(lng.startsWith("en") ? "en" : "fr");
    i18n.on("languageChanged", handler);
    return () => { i18n.off("languageChanged", handler); };
  }, [i18n]);

  // ── Véhicule ──
  const vehicleQuery = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => apiFetch<ApiResponse<Vehicle>>(`/api/vehicles/${id}`),
    enabled: !!id,
  });
  const vehicle = vehicleQuery.data?.data ?? null;
  const error = vehicleQuery.error?.message ?? "";

  // ── Avis ──
  const reviewsQuery = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => apiFetch<ApiResponse<ReviewsResponse>>(`/api/reviews/vehicle/${id}`),
    enabled: !!id,
  });
  const reviews = reviewsQuery.data?.data.items ?? [];
  const reviewsTotal = reviewsQuery.data?.data.pagination.total ?? 0;

  // ── Réservations terminées (pour vérifier l'éligibilité à laisser un avis) ──
  const bookingsQuery = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: () => apiFetch<ApiResponse<Booking[]>>("/api/bookings/mine"),
    enabled: !!id && !!user,
  });
  const completedBookingId = useMemo(() => {
    const completed = bookingsQuery.data?.data.find(
      (b) => b.vehicle.id === id && b.status === "TERMINEE",
    );
    return completed?.id ?? null;
  }, [bookingsQuery.data, id]);

  // ── A déjà laissé un avis (useState + useEffect pour pouvoir le modifier via setHasAlreadyReviewed) ──
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(
    () => reviews.some((r) => r.reviewer.id === user?.id),
  );
  useEffect(() => {
    setHasAlreadyReviewed(reviews.some((r) => r.reviewer.id === user?.id));
  }, [reviews, user?.id]);

  // ── Vérification favori ──
  const favQuery = useQuery({
    queryKey: ["favorite", id],
    queryFn: () => apiFetch<{ status: string; data: { isFavorite: boolean } }>(`/api/favorites/check/${id}`),
    enabled: !!id && !!user,
  });
  const isFavorited = favQuery.data?.data.isFavorite ?? false;

  const getDescription = useCallback((v: Vehicle) => {
    if (lang === "en" && v.descriptionEn) return v.descriptionEn;
    if (lang === "fr" && v.descriptionFr) return v.descriptionFr;
    return v.descriptionFr || v.descriptionEn || v.description || t("vehicles.details.noDescription");
  }, [lang, t]);

  /**
   * Ajouter / retirer un favori
   * CORRIGÉ : utilise queryClient.invalidateQueries au lieu de setIsFavorited inexistant
   */
  const toggleFavorite = async () => {
    if (!user) { navigate("/connexion"); return; }
    try {
      if (isFavorited) {
        await apiFetch(`/api/favorites/${id}`, { method: "DELETE" });
        showToast(t("favorites.removeSuccess"));
      } else {
        await apiFetch("/api/favorites", { method: "POST", body: JSON.stringify({ vehicleId: id }) });
        showToast(t("favorites.addSuccess"));
      }
      // Invalider les requêtes pour recharger l'état du favori
      queryClient.invalidateQueries({ queryKey: ["favorite", id] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Erreur", "error");
    }
  };

  const contactOwner = async () => {
    if (!user || !vehicle?.owner) { navigate("/connexion"); return; }
    try {
      const response = await apiFetch<{ status: string; data: { id: string } }>("/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ receiverId: vehicle.owner.id, vehicleId: id }),
      });
      navigate(`/messages/${response.data.id}`);
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Erreur", "error");
    }
  };

  const openBookingConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { navigate("/connexion"); return; }
    const data = new FormData(event.currentTarget);
    setBookingForm({ startDate: String(data.get("startDate")), endDate: String(data.get("endDate")), notes: String(data.get("notes") || "") });
    setShowBookingConfirm(true);
  };

  const reserve = async () => {
    setShowBookingConfirm(false);
    setIsBooking(true);
    setMessage(""); setBookingError("");
    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ vehicleId: vehicle?.id, startDate: bookingForm.startDate, endDate: bookingForm.endDate, notes: bookingForm.notes || undefined }),
      });
      showToast(t("bookings.bookingRequestSent"));
      setMessage(t("bookings.bookingRequestSent"));
    } catch (reason) {
      setBookingError(reason instanceof Error ? reason.message : t("bookings.bookingImpossible"));
      showToast(reason instanceof Error ? reason.message : t("bookings.bookingImpossible"), "error");
    } finally {
      setIsBooking(false);
    }
  };

  if (error && !vehicle) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-12">
          <p className="rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>
          <Link to="/vehicules" className="mt-5 inline-block font-bold text-emerald-700 dark:text-emerald-400">← {t("vehicles.publicCatalog")}</Link>
        </main>
      </AppShell>
    );
  }

  if (!vehicle) {
    return (
      <AppShell>
        <p className="p-16 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
      </AppShell>
    );
  }

  const v = vehicle as Vehicle & Record<string, unknown>;
  const conditionReport = v.conditionReport as ConditionReport | null | undefined;

  const hasValidVisiteTechnique = v.visiteTechniqueValideJusquA && new Date(String(v.visiteTechniqueValideJusquA)) > new Date();
  const hasValidAssurance = v.assuranceValideJusquA && new Date(String(v.assuranceValideJusquA)) > new Date();
  const documentsEnRegle = v.carteGrisePresente && hasValidVisiteTechnique && hasValidAssurance;

  return (
    <AppShell>
      <main className={`mx-auto max-w-6xl px-4 py-6 sm:py-10 ${vehicle.adminFavorited ? "rounded-3xl border-2 border-emerald-400 bg-emerald-50/30 dark:border-emerald-600 dark:bg-emerald-500/5" : ""}`}>
        {vehicle.adminFavorited && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-sm dark:from-emerald-500/15 dark:to-green-500/15 dark:text-emerald-300">
            {t("vehicles.adminFavorite")}
          </div>
        )}
        <Link to="/vehicules" className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
          ← {t("vehicles.publicCatalog")}
        </Link>

        <div className="mt-5">
          <VehicleGallery photos={vehicle.photos} vehicleName={`${vehicle.brand} ${vehicle.model}`} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[vehicle.type?.replaceAll("_", " "), vehicle.condition, vehicle.year && String(vehicle.year), vehicle.seats && `${vehicle.seats} ${t("vehicles.details.seats")}`]
            .filter(Boolean)
            .map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{item}</span>
            ))}
          {documentsEnRegle && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{t("vehicles.details.documentsOk")}</span>}
          {v.owner?.identityVerified && <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{t("vehicles.details.verified")}</span>}
        </div>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">{vehicle.brand} {vehicle.model}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">{vehicle.commune}, {vehicle.quartier} · {vehicle.secteur}</p>

            {/* Badge mode : Location / Vente / Location & Vente */}
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {vehicle.supportsRental && vehicle.supportsSale
                ? t("vehicles.mode.rentalAndSale", { defaultValue: "Location & Vente" })
                : vehicle.supportsRental
                  ? t("vehicles.mode.rental", { defaultValue: "Location" })
                  : vehicle.supportsSale
                    ? t("vehicles.mode.sale", { defaultValue: "Vente" })
                    : null}
            </p>

            {vehicle.owner?.averageRating && <div className="mt-2"><RatingStars rating={vehicle.owner.averageRating} size="sm" count={reviewsTotal} /></div>}
          </div>
          <button onClick={toggleFavorite} className={`rounded-full border p-3 text-xl transition ${isFavorited ? "border-red-300 bg-red-50 text-red-500 dark:border-red-800 dark:bg-red-500/15 dark:text-red-400" : "border-slate-300 bg-white text-slate-400 hover:text-red-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-red-400"}`} title={isFavorited ? t("vehicles.details.removeFromFavorites") : t("vehicles.details.addToFavorites")}>
            {isFavorited ? "❤️" : "🤍"}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <VehicleInfoSection vehicle={vehicle} getDescription={getDescription} />
            <VehicleDocumentsSection vehicle={v} conditionReport={conditionReport} />
            <VehicleOwnerSection vehicle={vehicle} contactOwner={contactOwner} />
            <VehicleReviewsSection reviews={reviews} reviewsTotal={reviewsTotal} user={user} completedBookingId={completedBookingId} hasAlreadyReviewed={hasAlreadyReviewed} showReviewForm={showReviewForm} setShowReviewForm={setShowReviewForm} setHasAlreadyReviewed={setHasAlreadyReviewed} />
          </div>
          <BookingSidebar vehicle={vehicle} user={user} isBooking={isBooking} message={message} error={bookingError} openBookingConfirm={openBookingConfirm} setShowReportDialog={setShowReportDialog} />
        </div>
      </main>

      <ConfirmDialog open={showBookingConfirm} title={t("bookings.confirmBooking")} message={t("bookings.confirmBookingMessage", { brand: vehicle.brand, model: vehicle.model, startDate: bookingForm.startDate, endDate: bookingForm.endDate })} confirmLabel={t("common.confirm")} tone="emerald" onConfirm={reserve} onCancel={() => setShowBookingConfirm(false)} />

      <ConfirmDialog open={showReportDialog} title={t("vehicles.details.reportListing")} message={t("vehicles.details.reportReason")} confirmLabel={t("vehicles.details.reportButton")} tone="rose" onConfirm={async () => {
        try {
          await apiFetch("/api/reports", { method: "POST", body: JSON.stringify({ targetId: id, targetType: "VEHICLE", reason: "Contenu suspect ou inapproprié" }) });
          showToast("Signalement envoyé. Merci !");
          setShowReportDialog(false);
        } catch (reason) {
          showToast(reason instanceof Error ? reason.message : "Erreur", "error");
        }
      }} onCancel={() => setShowReportDialog(false)} />
    </AppShell>
  );
}
