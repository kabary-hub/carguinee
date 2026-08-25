/**
 * StatsPage — Page Statistiques (placeholder).
 * TODO: Graphiques de revenus, taux d'occupation, avis reçus.
 */

import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";

export function StatsPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          {t("stats.title", { defaultValue: "Statistiques" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("stats.subtitle", { defaultValue: "Consultez vos statistiques de location et de revenus." })}
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("stats.comingSoon", { defaultValue: "Bientôt disponible" })}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("stats.comingSoonDesc", { defaultValue: "Les graphiques de revenus, taux d'occupation et analyses détaillées seront ajoutés prochainement." })}
          </p>
        </div>
      </main>
    </AppShell>
  );
}
