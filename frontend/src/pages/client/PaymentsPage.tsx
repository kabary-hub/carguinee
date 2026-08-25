/**
 * PaymentsPage — Page Paiements (placeholder).
 * TODO: Historique des paiements, reçus, méthodes de paiement.
 */

import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";

export function PaymentsPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          {t("payments.title", { defaultValue: "Mes paiements" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("payments.subtitle", { defaultValue: "Consultez l'historique de vos transactions et reçus." })}
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("payments.comingSoon", { defaultValue: "Bientôt disponible" })}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("payments.comingSoonDesc", { defaultValue: "L'historique détaillé des paiements Orange Money et les reçus téléchargeables seront ajoutés prochainement." })}
          </p>
        </div>
      </main>
    </AppShell>
  );
}
