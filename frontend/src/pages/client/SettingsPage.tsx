/**
 * SettingsPage — Page Paramètres (placeholder).
 * TODO: Ajouter les réglages (notifications, langue, thème, etc.)
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { useAuth } from "../../contexts/AuthContext";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          {t("settings.title", { defaultValue: "Paramètres" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("settings.subtitle", { defaultValue: "Gérez vos préférences et paramètres de compte." })}
        </p>

        <div className="mt-8 space-y-4">
          <Link to="/profil" className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="font-bold">{t("settings.profile", { defaultValue: "Mon profil" })}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("settings.profileDesc", { defaultValue: "Modifier votre nom, email et photo." })}
            </p>
          </Link>
          <Link to="/fidelite" className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="font-bold">{t("settings.loyalty", { defaultValue: "Programme de fidélité" })}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("settings.loyaltyDesc", { defaultValue: "Consultez vos points et l'historique des gains." })}
            </p>
          </Link>
          <Link to="/parrainage" className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="font-bold">{t("settings.referral", { defaultValue: "Parrainage" })}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("settings.referralDesc", { defaultValue: "Invitez vos amis et gagnez des points." })}
            </p>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
