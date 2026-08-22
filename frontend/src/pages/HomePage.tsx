import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export function HomePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    showToast(t("logout.success"));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-xl font-extrabold tracking-tight">
            Car<span className="text-emerald-600">Guinée</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/profil" className="text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400">
                  {t("nav.profile")}
                </Link>
                <button onClick={() => setShowLogoutConfirm(true)} className="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/15">
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link to="/connexion" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="bg-slate-900 px-4 py-14 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">{t("home.tagline")}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {t("home.description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/vehicules" className="rounded-xl bg-emerald-600 px-6 py-3 text-center font-semibold text-white hover:bg-emerald-700">
                {t("home.exploreVehicles")}
              </Link>
              <Link to="/connexion" className="rounded-xl border border-slate-600 px-6 py-3 text-center font-semibold text-white hover:border-slate-400">
                {t("nav.login")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <Link to={user ? "/vehicules?mode=location" : "/connexion"} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-black text-emerald-600">{t("home.location")}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t("home.locationDesc")}</p>
          </Link>
          <Link to={user ? "/vehicules?mode=vente" : "/connexion"} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-black text-emerald-600">{t("home.sale")}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t("home.saleDesc")}</p>
          </Link>
          <Link to={user ? "/vehicules" : "/connexion"} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-black text-emerald-600">{t("home.trust")}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t("home.trustDesc")}</p>
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {t("home.footer")}
      </footer>

      <ConfirmDialog
        open={showLogoutConfirm}
        title={t("logout.title")}
        message={t("logout.message")}
        confirmLabel={t("logout.confirmLabel")}
        tone="rose"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
