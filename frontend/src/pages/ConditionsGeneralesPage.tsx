import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";

/**
 * Page des Conditions Générales d'Utilisation (CGU)
 * Conforme aux exigences légales guinéennes
 */
export function ConditionsGeneralesPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/" className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
          {t("common.backToHome")}
        </Link>

        <h1 className="mt-6 text-3xl font-black">{t("cgu.title")}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("common.lastUpdated")} : {t("cgu.lastUpdated")}
        </p>

        <div className="prose prose-slate dark:prose-invert mt-8 space-y-8 text-sm leading-7 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article1Title")}</h2>
            <p>{t("cgu.article1P1")}</p>
            <p>{t("cgu.article1P2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article2Title")}</h2>
            <p>{t("cgu.article2P1")}</p>
            <p>{t("cgu.article2P2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article3Title")}</h2>
            <p>{t("cgu.article3Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("cgu.article3Item1")}</li>
              <li>{t("cgu.article3Item2")}</li>
              <li>{t("cgu.article3Item3")}</li>
              <li>{t("cgu.article3Item4")}</li>
              <li>{t("cgu.article3Item5")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article4Title")}</h2>
            <p>{t("cgu.article4Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("cgu.article4Item1")}</li>
              <li>{t("cgu.article4Item2")}</li>
              <li>{t("cgu.article4Item3")}</li>
              <li>{t("cgu.article4Item4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article5Title")}</h2>
            <p>{t("cgu.article5P1")}</p>
            <p>{t("cgu.article5P2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article6Title")}</h2>
            <p>{t("cgu.article6P1")}</p>
            <p>{t("cgu.article6P2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article7Title")}</h2>
            <p>{t("cgu.article7P1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("cgu.article8Title")}</h2>
            <p>{t("cgu.article8P1")}</p>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
