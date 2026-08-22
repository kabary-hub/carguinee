import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Booking } from "../../lib/domain";
import { formatDate, formatGnf } from "../../lib/domain";
import { StatusBadge } from "../StatusBadge";

type BookingDetailsModalProps = {
  booking: Booking;
  onClose: () => void;
};

function rentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function BookingDetailsModal({
  booking,
  onClose,
}: BookingDetailsModalProps) {
  const { t } = useTranslation();

  const detail = (label: string, value: React.ReactNode) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("bookings.details.vehicle")}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {booking.vehicle.brand} {booking.vehicle.model}
            </h2>
            <div className="mt-2">
              <StatusBadge value={booking.status} />
            </div>
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

        <div className="mt-5 grid grid-cols-2 gap-4">
          {detail(
            t("bookings.details.dates"),
            `${formatDate(booking.startDate)} → ${formatDate(booking.endDate)}`,
          )}
          {detail(t("bookings.details.duration"), `${rentalDays(booking.startDate, booking.endDate)} ${t("bookings.details.duration") === "Duration" ? "day(s)" : "jour(s)"}`)}
          {detail(t("bookings.details.dailyRate"), formatGnf(booking.dailyRateGnf))}
          {detail(t("bookings.details.totalAmount"), formatGnf(booking.totalAmountGnf))}
          {detail(t("bookings.details.depositAmount"), formatGnf(booking.depositAmountGnf))}
          {detail(t("bookings.details.depositStatus"), booking.depositStatus)}
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("vehicles.details.owner")}
          </p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
            {booking.customer?.firstName} {booking.customer?.lastName}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {booking.customer?.phone}
            {booking.customer?.email ? ` · ${booking.customer.email}` : ""}
          </p>
        </div>

        {booking.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("bookings.details.customerNote")}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
              {booking.notes}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            to={`/vehicules/${booking.vehicle.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("bookings.viewVehicle")}
          </Link>
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
