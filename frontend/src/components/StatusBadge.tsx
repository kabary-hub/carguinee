import { useTranslation } from "react-i18next";

const tones: Record<string, string> = {
  PUBLIEE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  EN_ATTENTE_VALIDATION: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  BROUILLON: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
  REJETEE: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  ARCHIVEE: "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
  EN_ATTENTE: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  CONFIRMEE: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  EN_COURS: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  TERMINEE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  ANNULEE: "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
  REJETEE_BOOKING: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

const statusTranslationKeys: Record<string, string> = {
  PUBLIEE: "vehicles.status.published",
  EN_ATTENTE_VALIDATION: "vehicles.status.pendingValidation",
  BROUILLON: "vehicles.status.draft",
  REJETEE: "vehicles.status.rejected",
  ARCHIVEE: "vehicles.status.archived",
  EN_ATTENTE: "bookings.status.pending",
  CONFIRMEE: "bookings.status.confirmed",
  EN_COURS: "bookings.status.inProgress",
  TERMINEE: "bookings.status.completed",
  ANNULEE: "bookings.status.cancelled",
  REJETEE_BOOKING: "bookings.status.rejected",
};

// Texte raccourci pour mobile
const statusShortLabels: Record<string, string> = {
  EN_ATTENTE_VALIDATION: "En attente",
  PUBLIEE: "Publiée",
  BROUILLON: "Brouillon",
  REJETEE: "Rejetée",
  ARCHIVEE: "Archivée",
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

export function StatusBadge({ value }: { value: string }) {
  const { t } = useTranslation();
  const translationKey = statusTranslationKeys[value];
  const label = translationKey ? t(translationKey) : value.replaceAll("_", " ").toLowerCase();
  const shortLabel = statusShortLabels[value] ?? label;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[value] ?? "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300"}`}>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </span>
  );
}
