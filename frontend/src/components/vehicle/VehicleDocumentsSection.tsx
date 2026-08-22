import { useTranslation } from "react-i18next";
import { RatingStars } from "../RatingStars";

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

type Props = {
  vehicle: Record<string, unknown>;
  conditionReport: ConditionReport | null | undefined;
};

function DocumentRow({ label, status, detail }: { label: string; status: "ok" | "expired" | "missing"; detail: string }) {
  const icon = status === "ok" ? "🟢" : status === "expired" ? "🔴" : "⚪";
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function InfoBadge({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{value || "—"}</p>
    </div>
  );
}

export function VehicleDocumentsSection({ vehicle, conditionReport }: Props) {
  const { t } = useTranslation();
  const v = vehicle;

  const hasValidVisiteTechnique = v.visiteTechniqueValideJusquA && new Date(String(v.visiteTechniqueValideJusquA)) > new Date();
  const hasValidAssurance = v.assuranceValideJusquA && new Date(String(v.assuranceValideJusquA)) > new Date();
  const documentsEnRegle = v.carteGrisePresente && hasValidVisiteTechnique && hasValidAssurance;

  return (
    <div className="space-y-6">
      {/* Documents et Conformité */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black">📄 {t("vehicles.details.documentsTitle")}</h2>
        <div className="mt-4 space-y-3">
          <DocumentRow
            label={t("vehicles.details.carteGrise")}
            status={v.carteGrisePresente ? "ok" : "missing"}
            detail={v.carteGrisePresente ? t("vehicles.details.carteGrisePresent") : t("vehicles.details.carteGriseMissing")}
          />
          <DocumentRow
            label={t("vehicles.details.visiteTechnique")}
            status={hasValidVisiteTechnique ? "ok" : v.visiteTechniqueValideJusquA ? "expired" : "missing"}
            detail={
              v.visiteTechniqueValideJusquA
                ? t("vehicles.details.visiteTechniqueValid", { date: new Date(String(v.visiteTechniqueValideJusquA)).toLocaleDateString("fr-FR") })
                : t("vehicles.details.visiteTechniqueNotSet")
            }
          />
          <DocumentRow
            label={t("vehicles.details.assurance")}
            status={hasValidAssurance ? "ok" : v.assuranceValideJusquA ? "expired" : "missing"}
            detail={
              v.assuranceValideJusquA
                ? t("vehicles.details.assuranceValid", { date: new Date(String(v.assuranceValideJusquA)).toLocaleDateString("fr-FR") })
                : t("vehicles.details.assuranceNotSet")
            }
          />
        </div>

        <div className={`mt-4 rounded-xl p-3 text-center text-sm font-bold ${
          documentsEnRegle
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        }`}>
          {documentsEnRegle ? t("vehicles.details.vehicleOk") : t("vehicles.details.checkDocuments")}
        </div>
      </section>

      {/* Rapport d'état du véhicule */}
      {conditionReport && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">🔍 {t("vehicles.details.conditionReport")}</h2>
          {conditionReport.overallRating && (
            <div className="mt-3">
              <RatingStars rating={conditionReport.overallRating} size="md" />
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {conditionReport.exteriorDamage && <InfoBadge label={t("vehicles.details.carrosserie")} value={conditionReport.exteriorDamage} />}
            {conditionReport.paintQuality && <InfoBadge label={t("vehicles.details.peinture")} value={conditionReport.paintQuality} />}
            {conditionReport.engineCondition && <InfoBadge label={t("vehicles.details.moteur")} value={conditionReport.engineCondition} />}
            {conditionReport.transmissionCondition && <InfoBadge label={t("vehicles.details.transmissionLabel")} value={conditionReport.transmissionCondition} />}
            {conditionReport.tireCondition && <InfoBadge label={t("vehicles.details.pneus")} value={conditionReport.tireCondition} />}
            {conditionReport.brakeCondition && <InfoBadge label={t("vehicles.details.freins")} value={conditionReport.brakeCondition} />}
            {conditionReport.interiorCondition && <InfoBadge label={t("vehicles.details.interieur")} value={conditionReport.interiorCondition} />}
            {conditionReport.seatsCondition && <InfoBadge label={t("vehicles.details.sellerie")} value={conditionReport.seatsCondition} />}
            {conditionReport.electronicsWorking !== null && conditionReport.electronicsWorking !== undefined && (
              <InfoBadge label={t("vehicles.details.electronique")} value={conditionReport.electronicsWorking ? t("vehicles.details.electronicsOk") : t("vehicles.details.electronicsProblem")} />
            )}
          </div>
          {conditionReport.additionalNotes && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 italic">{conditionReport.additionalNotes}</p>
          )}
        </section>
      )}
    </div>
  );
}
