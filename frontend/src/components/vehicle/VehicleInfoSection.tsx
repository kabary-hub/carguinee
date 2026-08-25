import { useTranslation } from "react-i18next";
import type { Vehicle } from "../../lib/domain";

type Props = {
  vehicle: Vehicle;
  getDescription: (v: Vehicle) => string;
};

function InfoBadge({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{value || "—"}</p>
    </div>
  );
}

export function VehicleInfoSection({ vehicle, getDescription }: Props) {
  const { t } = useTranslation();
  const v = vehicle as Vehicle & Record<string, unknown>;
  const equipmentList = Array.isArray(v.equipmentList) ? (v.equipmentList as string[]) : [];

  return (
    <div className="space-y-6">
      {/* Description */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black">{t("vehicles.details.description")}</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300 sm:leading-7">
          {getDescription(vehicle)}
        </p>
      </section>

      {/* Caractéristiques techniques */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black">{t("vehicles.details.technicalSpecs")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <InfoBadge label={t("vehicles.details.brand")} value={vehicle.brand} />
          <InfoBadge label={t("vehicles.details.model")} value={vehicle.model} />
          <InfoBadge label={t("vehicles.details.type")} value={vehicle.type?.replaceAll("_", " ")} />
          <InfoBadge label={t("vehicles.details.year")} value={vehicle.year} />
          <InfoBadge label={t("vehicles.details.condition")} value={vehicle.condition} />
          <InfoBadge label={t("vehicles.details.seats")} value={vehicle.seats ? `${vehicle.seats}` : null} />
          <InfoBadge label={t("vehicles.details.color")} value={vehicle.color} />
          <InfoBadge label={t("vehicles.details.mileage")} value={vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString()} km` : null} />
          {v.fuelType && <InfoBadge label={t("vehicles.details.fuelType")} value={String(v.fuelType)} />}
          {v.transmission && <InfoBadge label={t("vehicles.details.transmissionType")} value={String(v.transmission).replaceAll("_", " ")} />}
          {v.drivetrain && <InfoBadge label={t("vehicles.details.drivetrain")} value={String(v.drivetrain)} />}
          {v.horsepower && <InfoBadge label={t("vehicles.details.horsepower")} value={String(v.horsepower)} />}
          {v.engineDisplacement && <InfoBadge label={t("vehicles.details.displacement")} value={`${v.engineDisplacement} cm³`} />}
          {v.consumptionCity && <InfoBadge label={t("vehicles.details.consumptionCity")} value={`${v.consumptionCity} L/100km`} />}
          {v.consumptionHighway && <InfoBadge label={t("vehicles.details.consumptionHighway")} value={`${v.consumptionHighway} L/100km`} />}
          {v.firstRegistrationDate && <InfoBadge label={t("vehicles.details.firstRegistration")} value={new Date(String(v.firstRegistrationDate)).toLocaleDateString("fr-FR")} />}
          {v.vin && <InfoBadge label={t("vehicles.details.vinNumber")} value={String(v.vin)} />}
          {v.odometerGuaranteed !== null && v.odometerGuaranteed !== undefined && <InfoBadge label={t("vehicles.details.odometerGuaranteed")} value={v.odometerGuaranteed ? t("vehicles.details.odometerGuaranteedYes") : t("vehicles.details.odometerGuaranteedNo")} />}
        </div>

        {/* Équipements */}
        {equipmentList.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("vehicles.details.equipment")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {equipmentList.map((eq) => (
                <span key={eq} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance */}
        {(v.lastMaintenanceDate || v.nextMaintenanceDate) && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("vehicles.details.maintenance")}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {v.lastMaintenanceDate && (
                <InfoBadge label={t("vehicles.details.lastMaintenance")} value={new Date(String(v.lastMaintenanceDate)).toLocaleDateString("fr-FR")} />
              )}
              {v.nextMaintenanceDate && (
                <InfoBadge label={t("vehicles.details.nextMaintenance")} value={new Date(String(v.nextMaintenanceDate)).toLocaleDateString("fr-FR")} />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
