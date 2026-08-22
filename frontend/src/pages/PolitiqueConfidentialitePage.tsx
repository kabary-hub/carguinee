import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";

export function PolitiqueConfidentialitePage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/" className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
          {t("common.backToHome")}
        </Link>

        <h1 className="mt-6 text-3xl font-black">{t("confidentialite.title")}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("common.lastUpdated")} : {t("confidentialite.lastUpdated")}
        </p>

        <div className="prose prose-slate dark:prose-invert mt-8 space-y-8 text-sm leading-7 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section1Title")}</h2>
            <p>{t("confidentialite.section1P1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section2Title")}</h2>
            <p>{t("confidentialite.section2Intro")}</p>
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>{t("confidentialite.section2Item1Label")} :</strong> {t("confidentialite.section2Item1")}</li>
                <li><strong>{t("confidentialite.section2Item2Label")} :</strong> {t("confidentialite.section2Item2")}</li>
                <li><strong>{t("confidentialite.section2Item3Label")} :</strong> {t("confidentialite.section2Item3")}</li>
                <li><strong>{t("confidentialite.section2Item4Label")} :</strong> {t("confidentialite.section2Item4")}</li>
                <li><strong>{t("confidentialite.section2Item5Label")} :</strong> {t("confidentialite.section2Item5")}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section3Title")}</h2>
            <p>{t("confidentialite.section3Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("confidentialite.section3Item1")}</li>
              <li>{t("confidentialite.section3Item2")}</li>
              <li>{t("confidentialite.section3Item3")}</li>
              <li>{t("confidentialite.section3Item4")}</li>
              <li>{t("confidentialite.section3Item5")}</li>
              <li>{t("confidentialite.section3Item6")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section4Title")}</h2>
            <p>{t("confidentialite.section4Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("confidentialite.section4Item1")}</li>
              <li>{t("confidentialite.section4Item2")}</li>
              <li>{t("confidentialite.section4Item3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section5Title")}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{t("confidentialite.section5Item1Label")} :</strong> {t("confidentialite.section5Item1")}</li>
              <li><strong>{t("confidentialite.section5Item2Label")} :</strong> {t("confidentialite.section5Item2")}</li>
              <li><strong>{t("confidentialite.section5Item3Label")} :</strong> {t("confidentialite.section5Item3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section6Title")}</h2>
            <p>{t("confidentialite.section6Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("confidentialite.section6Item1")}</li>
              <li>{t("confidentialite.section6Item2")}</li>
              <li>{t("confidentialite.section6Item3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section7Title")}</h2>
            <p>{t("confidentialite.section7Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{t("confidentialite.section7Item1Label")} :</strong> {t("confidentialite.section7Item1")}</li>
              <li><strong>{t("confidentialite.section7Item2Label")} :</strong> {t("confidentialite.section7Item2")}</li>
              <li><strong>{t("confidentialite.section7Item3Label")} :</strong> {t("confidentialite.section7Item3")}</li>
              <li><strong>{t("confidentialite.section7Item4Label")} :</strong> {t("confidentialite.section7Item4")}</li>
              <li><strong>{t("confidentialite.section7Item5Label")} :</strong> {t("confidentialite.section7Item5")}</li>
            </ul>
            <p>
              {t("confidentialite.section7Contact")}{" "}
              <a href="mailto:privacy@carguinee.com" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                privacy@carguinee.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section8Title")}</h2>
            <p>{t("confidentialite.section8P1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("confidentialite.section9Title")}</h2>
            <p>
              {t("confidentialite.section9P1")}{" "}
              <a href="mailto:privacy@carguinee.com" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                privacy@carguinee.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
