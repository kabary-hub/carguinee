import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { StatusBadge } from "../StatusBadge";
import { BookingDetailsModal } from "../client/BookingDetailsModal";
import { ConfirmDialog } from "../ConfirmDialog";
import { printBookingList } from "../../lib/printUtils";
import { formatDate, formatGnf, type Booking } from "../../lib/domain";

type BookingResult = {
  items: Booking[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type Props = {
  /** Filtre statut externe (optionnel, depuis les cartes du dashboard) */
  initialStatusFilter?: string;
};

const BOOKING_FILTERS = ["", "EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"];
const PAGE_SIZE = 20;

export function AdminBookingsTab({ initialStatusFilter = "" }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

const BOOKING_I18N: Record<string, string> = {
  EN_ATTENTE: "bookings.status.pending",
  CONFIRMEE: "bookings.status.confirmed",
  EN_COURS: "bookings.status.inProgress",
  TERMINEE: "bookings.status.completed",
  ANNULEE: "bookings.status.cancelled",
  REJETEE: "bookings.status.rejected",
};

  const bookingQueryKey = ["admin", "bookings", page, statusFilter];

  const { data: result, isLoading: loading } = useQuery({
    queryKey: bookingQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (statusFilter) params.set("status", statusFilter);
      return apiFetch<{ status: string; data: BookingResult }>(`/api/admin/bookings?${params}`);
    },
    select: (res) => res.data,
    placeholderData: (prev) => prev,
  });

  const bookings = result?.items ?? [];
  const pagination = result?.pagination ?? null;

  // Quand on change le filtre statut, revenir à la page 1
  const handleStatusFilter = useCallback((f: string) => {
    setStatusFilter(f);
    setPage(1);
  }, []);

  return (
    <>
    <section className="mt-6">
      {/* Filtres statut */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("admin.bookings.filterByStatus")}
        </span>
        {BOOKING_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleStatusFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              statusFilter === f
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {f ? (BOOKING_I18N[f] ? t(BOOKING_I18N[f]) : f) : t("admin.bookings.all")}
          </button>
        ))}
        <button
          onClick={() => {
            const label = statusFilter ? (BOOKING_I18N[statusFilter] ? t(BOOKING_I18N[statusFilter]) : statusFilter) : t("admin.bookings.all");
            printBookingList(bookings, label);
          }}
          disabled={bookings.length === 0}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          🖨️ {t("admin.printList")}
        </button>
        <button
          onClick={() => setShowDeleteAllConfirm(true)}
          disabled={bookings.length === 0}
          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-500/15"
        >
          🗑️ {t("admin.deleteAll")}
        </button>
      </div>

      {loading && (
        <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("common.loading")}
        </p>
      )}

      {!loading && bookings.length === 0 && (
        <p className="mt-10 text-center text-slate-500 dark:text-slate-400">
          {t("admin.bookings.noBookingsFound")}
        </p>
      )}

      {/* ── Vue cartes sur mobile ─────────────────────────────────────── */}
      {!loading && bookings.length > 0 && (
        <div className="mt-4 grid gap-3 sm:hidden">
          {bookings.map((b) => (
            <div key={b.id} onClick={() => setSelectedBooking(b)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
        </div>
      )}

      {/* ── Vue table sur desktop ─────────────────────────────────────── */}
      {!loading && bookings.length > 0 && (
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
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="cursor-pointer border-b border-slate-100 last:border-0 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  onClick={() => setSelectedBooking(b)}
                >
                  <td className="px-4 py-3 font-bold">{b.vehicle.brand} {b.vehicle.model}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.customer?.firstName} {b.customer?.lastName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.vehicle.owner?.firstName} {b.vehicle.owner?.lastName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                  <td className="px-4 py-3 font-semibold">{formatGnf(b.totalAmountGnf)}</td>
                  <td className="px-4 py-3"><StatusBadge value={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("admin.bookings.paginationInfo", { total: pagination.total, page: pagination.page, totalPages: pagination.totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              {t("common.previous")}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              {t("common.next")} →
            </button>
          </div>
        </div>
      )}
      {pagination && pagination.totalPages <= 1 && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t("admin.bookings.paginationInfo", { total: pagination.total, page: pagination.page, totalPages: pagination.totalPages })}
          </p>
      )}
    </section>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {showDeleteAllConfirm && (
        <ConfirmDialog
          open
          title={t("admin.deleteAllBookingsTitle")}
          message={t("admin.deleteAllBookingsMessage", { count: pagination?.total ?? bookings.length })}
          confirmLabel={t("admin.confirmDeleteAll")}
          tone="rose"
          requireReason
          onConfirm={async (reason) => {
            try {
              const statusParam = statusFilter ? `?status=${statusFilter}` : "";
              await apiFetch(`/api/admin/bookings${statusParam}`, {
                method: "DELETE",
                body: JSON.stringify({ reason }),
              });
              showToast(t("admin.bookingsDeleted"), "success");
              setShowDeleteAllConfirm(false);
              // Recharger la page 1
              setPage(1);
              setStatusFilter("");
            } catch {
              showToast(t("admin.deleteError"), "error");
            }
          }}
          onCancel={() => setShowDeleteAllConfirm(false)}
        />
      )}
    </>
  );
}
