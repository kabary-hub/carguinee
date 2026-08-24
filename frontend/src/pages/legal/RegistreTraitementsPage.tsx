/**
 * Page du Registre des Traitements de Données Personnelles.
 *
 * Conformément au RGPD (article 30), nous tenons un registre
 * interne listant tous les traitements de données effectués.
 *
 * Ce document est rendu public pour transparence.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";

/** Structure d'un traitement dans le registre */
type Traitement = {
  id: string;
  titre: string;
  donnees: string;
  finalite: string;
  baseLegale: string;
  duree: string;
  destinataires: string;
};

/** Liste des traitements de données */
const TRAITEMENTS: Traitement[] = [
  {
    id: "compte",
    titre: "Gestion du compte utilisateur",
    donnees: "Nom, prénom, téléphone, email, mot de passe (haché)",
    finalite: "Authentification et gestion du compte",
    baseLegale: "Exécution du contrat",
    duree: "Durée du compte + 30 jours",
    destinataires: "Équipe CarGuinée",
  },
  {
    id: "reservation",
    titre: "Gestion des réservations",
    donnees: "Dates, montants, statut, notes",
    finalite: "Mise en relation locataire/propriétaire",
    baseLegale: "Exécution du contrat",
    duree: "5 ans (obligations comptables)",
    destinataires: "Propriétaires concernés, comptabilité",
  },
  {
    id: "vehicule",
    titre: "Annonces de véhicules",
    donnees: "Marque, modèle, photos, prix, localisation",
    finalite: "Publication et recherche de véhicules",
    baseLegale: "Exécution du contrat",
    duree: "Durée de l'annonce",
    destinataires: "Public (annonce), propriétaire",
  },
  {
    id: "messagerie",
    titre: "Messagerie intégrée",
    donnees: "Messages texte, horodatage",
    finalite: "Communication entre utilisateurs",
    baseLegale: "Exécution du contrat",
    duree: "Durée du compte",
    destinataires: "Participants à la conversation",
  },
  {
    id: "avis",
    titre: "Système d'avis",
    donnees: "Note, commentaire",
    finalite: "Évaluation de la qualité de service",
    baseLegale: "Intérêt légitime",
    duree: "Durée du compte",
    destinataires: "Public (avis)",
  },
  {
    id: "securite",
    titre: "Sécurité et prévention",
    donnees: "Adresse IP, logs de connexion",
    finalite: "Protection contre la fraude et les abus",
    baseLegale: "Intérêt légitime",
    duree: "13 mois",
    destinataires: "Équipe technique CarGuinée",
  },
];

export function RegistreTraitementsPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="text-sm font-bold text-emerald-700 dark:text-emerald-400"
        >
          {t("common.backToHome")}
        </Link>

        <h1 className="mt-6 text-3xl font-black">
          {t("registreTraitements.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("common.lastUpdated")} : {t("registreTraitements.lastUpdated")}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t("registreTraitements.intro")}
        </p>

        {/* ── Tableau des traitements ── */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                  {t("registreTraitements.tableHeaders.traitement")}
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                  {t("registreTraitements.tableHeaders.donnees")}
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                  {t("registreTraitements.tableHeaders.finalite")}
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                  {t("registreTraitements.tableHeaders.baseLegale")}
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                  {t("registreTraitements.tableHeaders.duree")}
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                  {t("registreTraitements.tableHeaders.destinataires")}
                </th>
              </tr>
            </thead>
            <tbody>
              {TRAITEMENTS.map((treatment, index) => (
                <tr
                  key={treatment.id}
                  className={`border-b border-slate-100 dark:border-slate-800 ${
                    index % 2 === 0
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/50 dark:bg-slate-800/30"
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {t(`registreTraitements.traitements.${treatment.id}.titre`)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {t(`registreTraitements.traitements.${treatment.id}.donnees`)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {t(`registreTraitements.traitements.${treatment.id}.finalite`)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        treatment.baseLegale === "Exécution du contrat"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      }`}
                    >
                      {t(`registreTraitements.traitements.${treatment.id}.baseLegale`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {t(`registreTraitements.traitements.${treatment.id}.duree`)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {t(`registreTraitements.traitements.${treatment.id}.destinataires`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Sous-traitants ── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Sous-traitants
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Hébergement
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Les données sont hébergées sur des serveurs sécurisés. Le fournisseur
                d'hébergement agit en tant que sous-traitant technique.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Envoi d'emails
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Un service d'envoi d'emails transactionnels est utilisé pour
                l'envoi de codes de réinitialisation et de notifications.
              </p>
            </div>
          </div>
        </section>

        {/* ── Mesures de sécurité ── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Mesures de sécurité
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Hachage des mots de passe avec bcrypt (coût 12)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Chiffrement des données sensibles (AES-256-GCM)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Chiffrement des communications (HTTPS / HSTS)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Content Security Policy (CSP) — mode report-only
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Rate limiting sur toutes les routes API
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Validation stricte de toutes les entrées (Zod)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Jets d'authentification JWT avec expiration (24h)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              Headers de sécurité (Helmet + headers personnalisés)
            </li>
          </ul>
        </section>
      </main>
    </AppShell>
  );
}
