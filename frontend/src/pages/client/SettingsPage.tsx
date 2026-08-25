/**
 * SettingsPage — Page Paramètres avec réglages interactifs.
 *
 * - Thème (clair / sombre)
 * - Langue (FR / EN)
 * - Notifications (toggle)
 * - Raccourcis compte (profil, fidélité, parrainage)
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { useTheme } from "../../contexts/ThemeContext";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const isFrench = i18n.language?.startsWith("fr");

  const toggleLanguage = () => {
    const nextLang = isFrench ? "en" : "fr";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("preferredLanguage", nextLang);
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          ⚙️ {t("settings.title", { defaultValue: "Paramètres" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("settings.subtitle", { defaultValue: "Gérez vos préférences et paramètres de compte." })}
        </p>

        <div className="mt-8 space-y-6">
          {/* ── Section Thème ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("settings.appearance", { defaultValue: "Apparence" })}
            </h2>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{isDark ? "🌙" : "☀️"}</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {t("settings.darkMode", { defaultValue: "Mode sombre" })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isDark
                      ? t("settings.darkModeOn", { defaultValue: "Activé — interface sombre" })
                      : t("settings.darkModeOff", { defaultValue: "Désactivé — interface claire" })}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isDark ? "bg-emerald-600" : "bg-slate-300"
                }`}
                aria-label={t("settings.toggleTheme", { defaultValue: "Basculer le thème" })}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    isDark ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* ── Section Langue ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("settings.language", { defaultValue: "Langue" })}
            </h2>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {t("settings.languageLabel", { defaultValue: "Langue de l'interface" })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isFrench ? "Français" : "English"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleLanguage}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {isFrench ? "🇬🇧 English" : "🇫🇷 Français"}
              </button>
            </div>
          </section>

          {/* ── Section Notifications ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("settings.notifications", { defaultValue: "Notifications" })}
            </h2>
            <div className="mt-4 space-y-4">
              <NotificationToggle
                icon="📧"
                label={t("settings.emailNotif", { defaultValue: "Notifications par email" })}
                description={t("settings.emailNotifDesc", { defaultValue: "Recevoir les confirmations et mises à jour par email." })}
                defaultChecked={true}
              />
              <NotificationToggle
                icon="📱"
                label={t("settings.smsNotif", { defaultValue: "Notifications par SMS" })}
                description={t("settings.smsNotifDesc", { defaultValue: "Recevoir les alertes de réservation par SMS." })}
                defaultChecked={true}
              />
              <NotificationToggle
                icon="🔔"
                label={t("settings.pushNotif", { defaultValue: "Notifications push" })}
                description={t("settings.pushNotifDesc", { defaultValue: "Alertes en temps réel dans l'application." })}
                defaultChecked={false}
              />
              <NotificationToggle
                icon="💬"
                label={t("settings.chatNotif", { defaultValue: "Messages du chatbot" })}
                description={t("settings.chatNotifDesc", { defaultValue: "Recevoir des suggestions et astuces de l'assistant." })}
                defaultChecked={false}
              />
            </div>
          </section>

          {/* ── Section Compte ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("settings.account", { defaultValue: "Compte" })}
            </h2>
            <div className="mt-4 space-y-3">
              <SettingsLink
                to="/profil"
                icon="👤"
                label={t("settings.profile", { defaultValue: "Mon profil" })}
                description={t("settings.profileDesc", { defaultValue: "Modifier votre nom, email et photo." })}
              />
              <SettingsLink
                to="/fidelite"
                icon="⭐"
                label={t("settings.loyalty", { defaultValue: "Programme de fidélité" })}
                description={t("settings.loyaltyDesc", { defaultValue: "Consultez vos points et l'historique des gains." })}
              />
              <SettingsLink
                to="/parrainage"
                icon="🎁"
                label={t("settings.referral", { defaultValue: "Parrainage" })}
                description={t("settings.referralDesc", { defaultValue: "Invitez vos amis et gagnez des points." })}
              />
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

// ── Sous-composants ─────────────────────────────────────────────────────

function NotificationToggle({
  icon,
  label,
  description,
  defaultChecked,
}: {
  icon: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-600 dark:bg-slate-600 dark:peer-checked:bg-emerald-500" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}

function SettingsLink({
  to,
  icon,
  label,
  description,
}: {
  to: string;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm dark:bg-slate-800/60 dark:hover:bg-slate-800"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <span className="text-slate-400 dark:text-slate-500">→</span>
    </Link>
  );
}
