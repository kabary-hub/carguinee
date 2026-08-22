import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/AppShell";

export function MentionsLegalesPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/" className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
          {t("common.backToHome")}
        </Link>

        <h1 className="mt-6 text-3xl font-black">{t("mentionsLegales.title")}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("common.lastUpdated")} : {t("mentionsLegales.lastUpdated")}
        </p>

        <div className="prose prose-slate dark:prose-invert mt-8 space-y-8 text-sm leading-7 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("mentionsLegales.editorTitle")}</h2>
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <p><strong>{t("mentionsLegales.companyName")} :</strong> CarGuinée SARL</p>
              <p><strong>{t("mentionsLegales.headquarters")} :</strong> Conakry, République de Guinée</p>
              <p><strong>{t("mentionsLegales.phone")} :</strong> +224 620 98 01 18</p>
              <p><strong>{t("mentionsLegales.email")} :</strong> contact@carguinee.com</p>
              <p><strong>{t("mentionsLegales.tradeRegister")} :</strong> Conakry</p>
              <p><strong>{t("mentionsLegales.director")} :</strong> Direction CarGuinée</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("mentionsLegales.hostingTitle")}</h2>
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <p><strong>{t("mentionsLegales.host")} :</strong> Vercel Inc.</p>
              <p><strong>{t("mentionsLegales.address")} :</strong> 349 S Brea Blvd, Brea, CA 92821, États-Unis</p>
              <p><strong>{t("mentionsLegales.website")} :</strong> https://vercel.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("mentionsLegales.ipTitle")}</h2>
            <p>{t("mentionsLegales.ipP1")}</p>
            <p>{t("mentionsLegales.ipP2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("mentionsLegales.dataTitle")}</h2>
            <p>
              {t("mentionsLegales.dataP1")}
              <Link to="/politique-confidentialite" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                {" "}{t("mentionsLegales.privacyLink")}
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("mentionsLegales.cookiesTitle")}</h2>
            <p>{t("mentionsLegales.cookiesP1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("mentionsLegales.contactTitle")}</h2>
            <p>
              {t("mentionsLegales.contactP1")}{" "}
              <a href="mailto:contact@carguinee.com" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                contact@carguinee.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
