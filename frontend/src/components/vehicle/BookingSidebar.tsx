import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatGnf } from "../../lib/domain";
import type { Vehicle } from "../../lib/domain";
import type { AuthUser } from "../../types/auth";

type Props = {
  vehicle: Vehicle;
  user: AuthUser | null;
  isBooking: boolean;
  message: string;
  error: string;
  openBookingConfirm: (event: FormEvent<HTMLFormElement>) => void;
  setShowReportDialog: (show: boolean) => void;
};

export function BookingSidebar({ vehicle, user, isBooking, message, error, openBookingConfirm, setShowReportDialog }: Props) {
  const { t } = useTranslation();
  const v = vehicle as Vehicle & Record<string, unknown>;

  return (
    <aside className="h-fit space-y-4 lg:sticky lg:top-24">
      {/* Tarif location */}
      {vehicle.supportsRental && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            🚗 {t("vehicles.details.rentalWithDriver")}
          </p>
          <p className="mt-2 text-3xl font-black">
            {formatGnf(vehicle.dailyRentalPriceGnf)}
            <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t("common.perDay")}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("vehicles.details.driverIncluded")}
          </p>
          {vehicle.rentalDepositGnf ? (
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("vehicles.details.deposit")} : {formatGnf(vehicle.rentalDepositGnf)}
            </p>
          ) : null}

          {v.depositReturnPolicy && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">📋 {t("vehicles.details.depositPolicy")}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{String(v.depositReturnPolicy)}</p>
            </div>
          )}
          {v.depositHeldBy && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("vehicles.details.depositHeldBy")} : <span className="font-bold">{v.depositHeldBy === "PLATEFORME" ? t("vehicles.details.depositHeldByPlatform") : t("vehicles.details.depositHeldByOwner")}</span>
            </p>
          )}
        </div>
      )}

      {/* Tarif vente */}
      {vehicle.supportsSale && vehicle.salePriceGnf && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            💰 {t("vehicles.details.sale")}
          </p>
          <p className="mt-2 text-3xl font-black">{formatGnf(vehicle.salePriceGnf)}</p>
        </div>
      )}

      {/* Formulaire réservation */}
      {vehicle.supportsRental && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">{t("vehicles.details.bookVehicle")}</h2>
          <form onSubmit={openBookingConfirm} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                {t("vehicles.details.startDate")}
                <input
                  required
                  type="date"
                  name="startDate"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </label>
              <label className="text-sm font-semibold">
                {t("vehicles.details.endDate")}
                <input
                  required
                  type="date"
                  name="endDate"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </label>
            </div>
            <textarea
              name="notes"
              rows={3}
              placeholder={t("vehicles.details.notesPlaceholder")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            {message && (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">{message}</p>
            )}
            {error && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>
            )}
            <button
              disabled={isBooking}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isBooking ? t("vehicles.details.sending") : user ? t("vehicles.details.requestBooking") : t("vehicles.details.loginToBook")}
            </button>
          </form>
        </div>
      )}

      {/* Bouton signalement */}
      {user && (
        <button onClick={() => setShowReportDialog(true)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-800 dark:hover:text-rose-400"
        >
          🚩 {t("vehicles.details.reportListing")}
        </button>
      )}
    </aside>
  );
}
