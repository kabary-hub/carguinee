import { useTranslation } from "react-i18next";
import { RatingStars } from "../client/RatingStars";
import type { Vehicle } from "../../lib/domain";

type Props = {
  vehicle: Vehicle;
  contactOwner: () => void;
};

export function VehicleOwnerSection({ vehicle, contactOwner }: Props) {
  const { t } = useTranslation();
  const v = vehicle as Vehicle & Record<string, unknown>;

  if (!vehicle.owner) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-black">{t("vehicles.details.owner")}</h2>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {vehicle.owner.firstName?.[0]}{vehicle.owner.lastName?.[0]}
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {vehicle.owner.firstName} {vehicle.owner.lastName}
            {v.owner?.identityVerified && (
              <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">{t("vehicles.details.verifiedLabel")}</span>
            )}
          </p>
          {vehicle.owner.averageRating && (
            <RatingStars rating={vehicle.owner.averageRating} size="sm" />
          )}
          {vehicle.owner.phone && (
            <p className="text-sm text-slate-600 dark:text-slate-400">📞 {vehicle.owner.phone}</p>
          )}
          {vehicle.owner.email && (
            <p className="text-sm text-slate-600 dark:text-slate-400">✉️ {vehicle.owner.email}</p>
          )}
        </div>
      </div>
      <button
        onClick={contactOwner}
        className="mt-4 w-full rounded-xl border border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
      >
        💬 {t("vehicles.details.contact")}
      </button>
    </section>
  );
}
