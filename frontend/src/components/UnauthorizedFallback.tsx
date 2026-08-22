import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "./AppShell";

export function UnauthorizedFallback() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
          {t("errors.unauthorized")}
        </p>
        <Link to="/connexion" className="mt-4 text-sm font-bold text-emerald-700 dark:text-emerald-400">
          {t("nav.login")}
        </Link>
      </div>
    </AppShell>
  );
}
