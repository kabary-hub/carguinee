import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { BookingDetailsModal } from "../../components/client/BookingDetailsModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ReviewForm } from "../../components/client/ReviewForm";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { PaymentButton } from "../../components/payment/PaymentButton";
import { formatDate, formatGnf, type ApiResponse, type Booking } from "../../lib/domain";
import { getHomeRouteForRole } from "../../lib/roles";

export function MyBookingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [startTarget, setStartTarget] = useState<Booking | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Booking | null>(null);
  const { showToast } = useToast();

  const statusFilter = searchParams.get("status") || "";
  const isOwner = user?.role === "PROPRIETAIRE" || user?.role === "ADMIN";
  const bookingsEndpoint = isOwner ? "/api/bookings/owner" : "/api/bookings/mine";

  const load = () =>
    apiFetch<ApiResponse<Booking[]>>(bookingsEndpoint)
      .then((payload) => setBookings(payload.data))
      .catch((reason: Error) => setError(reason.message));

  useEffect(() => {
    void load();
  }, [bookingsEndpoint]);

  // Ouvrir automatiquement les détails d'une réservation via query param
  const pendingBookingId = useRef<string | null>(searchParams.get("bookingId"));
  useEffect(() => {
    if (!pendingBookingId.current) return;
    if (bookings.length === 0) return;
    const found = bookings.find((b) => b.id === pendingBookingId.current);
    if (found) {
      pendingBookingId.current = null;
      setSelectedBooking(found);
      setSearchParams({}, { replace: true });
    }
  }, [bookings, setSearchParams]);

  // ── Confirmation de paiement après redirection OM ──
  const paymentStatus = searchParams.get("payment");
  useEffect(() => {
    if (paymentStatus === "success") {
      showToast(t("bookings.paymentSuccess", { defaultValue: "Paiement confirmé ! Votre réservation a été validée." }), "success");
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === "cancelled") {
      showToast(t("bookings.paymentCancelled", { defaultValue: "Paiement annulé. Vous pouvez réessayer quand vous le souhaitez." }), "info");
      setSearchParams({}, { replace: true });
    }
  }, [paymentStatus, showToast, setSearchParams, t]);

  const cancel = async () => {
    if (!cancelTarget) return;
    try {
      await apiFetch(`/api/bookings/${cancelTarget.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ANNULEE" }),
      });
      showToast(t("bookings.bookingCancelled"));
      setCancelTarget(null);
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t("bookings.cancelImpossible"), "error");
    }
  };

  const updateStatus = async (target: Booking | null, status: string, successKey: string, errorKey: string) => {
    if (!target) return;
    try {
      await apiFetch(`/api/bookings/${target.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      showToast(t(successKey));
      await load();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : t(errorKey), "error");
    }
  };



  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <button
          onClick={() => navigate(getHomeRouteForRole(user?.role ?? "CLIENT"))}
          className="flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400"
        >
          ← {t("common.back")}
        </button>
        <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          {t("bookings.clientSpace")}
        </p>
        <h1 className="mt-2 text-3xl font-black">{isOwner ? t("bookings.ownerTitle") : t("bookings.title")}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isOwner ? t("bookings.ownerSubtitle") : t("bookings.clientSubtitle")}
        </p>

        {error && (
          <p className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </p>
        )}

        {statusFilter && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {t("common.filter")} : {statusFilter}
            </p>
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-sm font-bold text-emerald-700 underline dark:text-emerald-400"
            >
              {t("common.cancel")}
            </button>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {bookings
            .filter((b) => !statusFilter || b.status === statusFilter)
            .map((booking) => (
            <article
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-black">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </h2>
                    <StatusBadge value={booking.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {t('bookings.dateRange', { startDate: formatDate(booking.startDate), endDate: formatDate(booking.endDate) })}
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {t("bookings.totalEstimated", { amount: formatGnf(booking.totalAmountGnf) })}
                  </p>
                  {booking.notes && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {t("bookings.note")} : {booking.notes}
                    </p>
                  )}
                </div>
                <div
                  className="flex items-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to={`/vehicules/${booking.vehicle.id}`}
                    className="text-sm font-bold text-emerald-700 dark:text-emerald-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("bookings.viewVehicle")}
                  </Link>
                  {/* ── Actions client ── */}
                  {booking.status === "EN_ATTENTE" && !isOwner && (
                    <>
                      {!booking.payments?.some((p) => p.status === "PAID") && (
                        <PaymentButton
                          bookingId={booking.id}
                          amount={booking.totalAmountGnf}
                          onSuccess={() => void load()}
                        />
                      )}
                      <button
                        onClick={() => setCancelTarget(booking)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                      >
                        {t("common.cancel")}
                      </button>
                    </>
                  )}
                  {/* ── Actions propriétaire ── */}
                  {booking.status === "EN_ATTENTE" && isOwner && (
                    <>
                      <button
                        onClick={() => setConfirmTarget(booking)}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        {t("bookings.confirmBooking")}
                      </button>
                      <button
                        onClick={() => setRejectTarget(booking)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                      >
                        {t("bookings.rejectBooking")}
                      </button>
                    </>
                  )}
                  {booking.status === "CONFIRMEE" && isOwner && (
                    <button
                      onClick={() => setStartTarget(booking)}
                      className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700"
                    >
                      {t("bookings.startRental")}
                    </button>
                  )}
                  {booking.status === "EN_COURS" && isOwner && (
                    <button
                      onClick={() => setCompleteTarget(booking)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      {t("bookings.completeRental")}
                    </button>
                  )}
                  {booking.status === "TERMINEE" && (
                    <button
                      onClick={() => setReviewTarget(booking)}
                      className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"
                    >
                      {t("reviews.leaveReview")}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {bookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="font-bold">{t("bookings.noBookings")}</p>
              <Link
                to="/vehicules"
                className="mt-4 inline-block text-sm font-bold text-emerald-700 dark:text-emerald-400"
              >
                {t("bookings.exploreVehicles")}
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Détails réservation */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* Confirmation annulation */}
      <ConfirmDialog
        open={cancelTarget !== null}
        title={t("bookings.cancelBookingTitle")}
        message={t("bookings.cancelBookingMessage", { brand: cancelTarget?.vehicle.brand, model: cancelTarget?.vehicle.model })}
        confirmLabel={t("bookings.cancelBookingButton")}
        tone="rose"
        onConfirm={() => void cancel()}
        onCancel={() => setCancelTarget(null)}
      />

      {/* Confirmation validation propriétaire */}
      <ConfirmDialog
        open={confirmTarget !== null}
        title={t("bookings.confirmBooking")}
        message={t("bookings.confirmBookingOwnerMessage", { brand: confirmTarget?.vehicle.brand, model: confirmTarget?.vehicle.model, customer: confirmTarget?.customer ? `${confirmTarget.customer.firstName} ${confirmTarget.customer.lastName}` : "" })}
        confirmLabel={t("common.confirm")}
        tone="emerald"
        onConfirm={() => { void updateStatus(confirmTarget, "CONFIRMEE", "bookings.bookingConfirmed", "bookings.actionImpossible"); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Confirmation rejet propriétaire */}
      <ConfirmDialog
        open={rejectTarget !== null}
        title={t("bookings.rejectBooking")}
        message={t("bookings.rejectBookingMessage", { brand: rejectTarget?.vehicle.brand, model: rejectTarget?.vehicle.model, customer: rejectTarget?.customer ? `${rejectTarget.customer.firstName} ${rejectTarget.customer.lastName}` : "" })}
        confirmLabel={t("common.reject")}
        tone="rose"
        onConfirm={() => { void updateStatus(rejectTarget, "REJETEE", "bookings.bookingRejected", "bookings.actionImpossible"); setRejectTarget(null); }}
        onCancel={() => setRejectTarget(null)}
      />

      {/* Confirmation démarrage location */}
      <ConfirmDialog
        open={startTarget !== null}
        title={t("bookings.startRental")}
        message={t("bookings.startRentalMessage", { brand: startTarget?.vehicle.brand, model: startTarget?.vehicle.model })}
        confirmLabel={t("common.confirm")}
        tone="emerald"
        onConfirm={() => { void updateStatus(startTarget, "EN_COURS", "bookings.rentalStarted", "bookings.actionImpossible"); setStartTarget(null); }}
        onCancel={() => setStartTarget(null)}
      />

      {/* Confirmation fin de location */}
      <ConfirmDialog
        open={completeTarget !== null}
        title={t("bookings.completeRental")}
        message={t("bookings.completeRentalMessage", { brand: completeTarget?.vehicle.brand, model: completeTarget?.vehicle.model })}
        confirmLabel={t("common.confirm")}
        tone="emerald"
        onConfirm={() => { void updateStatus(completeTarget, "TERMINEE", "bookings.rentalCompleted", "bookings.actionImpossible"); setCompleteTarget(null); }}
        onCancel={() => setCompleteTarget(null)}
      />

      {/* Formulaire d'avis */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg">
            <ReviewForm
              bookingId={reviewTarget.id}
              revieweeLabel={isOwner ? t("reviews.client") : t("vehicles.details.owner")}
              onSuccess={() => { setReviewTarget(null); load(); showToast(t("reviews.success")); }}
              onCancel={() => setReviewTarget(null)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
