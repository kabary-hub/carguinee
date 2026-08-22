import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function AccessDeniedPage() {
  const { t } = useTranslation();
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="absolute right-5 top-5 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600 dark:text-red-400">{t("accessDenied.title")}</p>
        <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-slate-100">{t("accessDenied.message")}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {t("accessDenied.description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/profil" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("accessDenied.myProfile")}
          </Link>
          <Link to="/" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500">
            {t("accessDenied.home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
