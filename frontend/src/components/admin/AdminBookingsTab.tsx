import { useTranslation } from "react-i18next";
import { StatusBadge } from "../StatusBadge";
import type { Booking } from "../../lib/domain";
import { formatDate, formatGnf } from "../../lib/domain";

type Props = {
  allBookings: Booking[];
  bookingFilter: string;
  setBookingFilter: (filter: string) => void;
  BOOKING_STATUS_LABELS: Record<string, string>;
};

const BOOKING_FILTERS = ["", "EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"];

export function AdminBookingsTab({ allBookings, bookingFilter, setBookingFilter, BOOKING_STATUS_LABELS }: Props) {
  const { t } = useTranslation();

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("admin.bookings.filterByStatus")}
        </span>
        {BOOKING_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setBookingFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              bookingFilter === f
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {f ? BOOKING_STATUS_LABELS[f] ?? f : t("admin.bookings.all")}
          </button>
        ))}
      </div>

      {/* Vue cartes sur mobile */}
      <div className="mt-4 grid gap-3 sm:hidden">
        {allBookings.map((b) => (
          <div key={b.id} onClick={() => window.open(`/vehicules/${b.vehicle.id}`, "_blank")} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{b.vehicle.brand} {b.vehicle.model}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {b.customer?.firstName} {b.customer?.lastName}
                </p>
              </div>
              <StatusBadge value={b.status} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                {formatDate(b.startDate)} → {formatDate(b.endDate)}
              </span>
              <span className="font-bold">{formatGnf(b.totalAmountGnf)}</span>
            </div>
          </div>
        ))}
        {allBookings.length === 0 && (
          <p className="rounded-xl bg-slate-100 p-5 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {t("admin.bookings.noBookingsFound")}
          </p>
        )}
      </div>

      {/* Vue table sur desktop */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("admin.bookings.colVehicle")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.bookings.colClient")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.bookings.colOwner")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.bookings.colPeriod")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.bookings.colAmount")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.bookings.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {allBookings.map((b) => (
              <tr
                key={b.id}
                className="cursor-pointer border-b border-slate-100 last:border-0 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                onClick={() => window.open(`/vehicules/${b.vehicle.id}`, "_blank")}
              >
                <td className="px-4 py-3 font-bold">{b.vehicle.brand} {b.vehicle.model}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.customer?.firstName} {b.customer?.lastName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.vehicle.owner?.firstName} {b.vehicle.owner?.lastName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                <td className="px-4 py-3 font-semibold">{formatGnf(b.totalAmountGnf)}</td>
                <td className="px-4 py-3"><StatusBadge value={b.status} /></td>
              </tr>
            ))}
            {allBookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t("admin.bookings.noBookingsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {t("admin.bookings.bookingCount", { count: allBookings.length })}
      </p>
    </section>
  );
}
