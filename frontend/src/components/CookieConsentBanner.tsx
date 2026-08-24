/**
 * Bannière de consentement aux cookies (RGPD).
 *
 * Respecte les exigences :
 * - Pas de case pré-cochée
 * - Boutons « Accepter » et « Refuser » clairs
 * - Consentement stocké dans localStorage (pas de cookies tiers)
 * - Aucun outil de suivi n'est activé sans consentement explicite
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const COOKIE_CONSENT_KEY = "carguinee_cookie_consent";

export type CookieConsentValue = "accepted" | "refused" | null;

/**
 * Récupère le choix de consentement stocké.
 */
export function getCookieConsent(): CookieConsentValue {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored === "accepted" || stored === "refused") return stored;
  return null;
}

/**
 * Enregistre le choix de consentement.
 */
function setCookieConsent(value: CookieConsentValue) {
  if (value) {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } else {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  }
}

/**
 * Bannière de consentement cookies.
 * S'affiche uniquement si l'utilisateur n'a pas encore fait de choix.
 *
 * Comportement RGPD :
 * - Aucun cookie de tracking n'est posé avant consentement
* - Les cookies techniques (authentification) sont exempts de consentement
 * - Le choix est conservé et peut être modifié depuis le pied de page
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => getCookieConsent() === null);
  const { t } = useTranslation();

  const handleAccept = () => {
    setCookieConsent("accepted");
    setVisible(false);
    // Activer Matomo analytics après consentement
    import("../lib/analytics").then(({ consentAnalytics }) => consentAnalytics());
  };

  const handleRefuse = () => {
    setCookieConsent("refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95"
      role="dialog"
      aria-label={t("cookieConsent.title")}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Texte explicatif */}
        <div className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {t("cookieConsent.title")}
          </p>
          <p className="mt-1">
            {t("cookieConsent.description")}{" "}
            <Link
              to="/politique-confidentialite"
              className="font-bold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {t("cookieConsent.privacyLink")}
            </Link>
          </p>
        </div>

        {/* Boutons d'action — aucun n'est pré-sélectionné */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={handleRefuse}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("cookieConsent.refuse")}
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            {t("cookieConsent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
