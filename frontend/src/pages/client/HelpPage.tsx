/**
 * HelpPage — Page Aide.
 * Affiche les questions fréquentes et ouvre le chatbot.
 */

import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { Link } from "react-router-dom";

export function HelpPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          {t("help.title", { defaultValue: "Aide & Support" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("help.subtitle", { defaultValue: "Besoin d'aide ? Consultez nos questions fréquentes ou contactez-nous." })}
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t("help.faq", { defaultValue: "Questions fréquentes" })}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="font-semibold">{t("help.q1", { defaultValue: "Comment créer un compte ?" })}</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">{t("help.a1", { defaultValue: "Cliquez sur 'Inscription' et remplissez le formulaire avec votre numéro de téléphone." })}</p>
              </li>
              <li className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="font-semibold">{t("help.q2", { defaultValue: "Comment réserver un véhicule ?" })}</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">{t("help.a2", { defaultValue: "Parcourez le catalogue, sélectionnez un véhicule, choisissez les dates et envoyez votre demande." })}</p>
              </li>
              <li className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="font-semibold">{t("help.q3", { defaultValue: "Comment payer avec Orange Money ?" })}</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">{t("help.a3", { defaultValue: "Après confirmation de votre réservation, cliquez sur 'Paiement OM' et suivez les instructions." })}</p>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-500/10">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {t("help.assistant", { defaultValue: "Assistant virtuel" })}
            </p>
            <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
              {t("help.assistantDesc", { defaultValue: "Utilisez le bouton 💬 en bas à droite de l'écran pour poser vos questions à notre assistant." })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("help.legal", { defaultValue: "Documents légaux" })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/conditions-generales" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                CGU
              </Link>
              <Link to="/mentions-legales" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                Mentions légales
              </Link>
              <Link to="/politique-confidentialite" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
