/**
 * Intégration Matomo Analytics pour Carguinée.
 *
 * RGPD-compliant :
 * - Anonymisation IP activée
 * - Pas de cookies tiers sans consentement
 * - Respect du choix CookieConsent
 *
 * Utilisation :
 *   import { initAnalytics, trackPageView, trackEvent } from "./analytics";
 *   initAnalytics();  // Dans main.tsx
 *   trackPageView();  // À chaque navigation
 */

const MATOMO_URL = import.meta.env.VITE_MATOMO_URL ?? "";
const MATOMO_SITE_ID = import.meta.env.VITE_MATOMO_SITE_ID ?? "";

/**
 * Initialise Matomo uniquement si :
 * 1. Les variables d'env sont configurées
 * 2. L'utilisateur a accepté les cookies (RGPD)
 */
export function initAnalytics(): void {
  if (!MATOMO_URL || !MATOMO_SITE_ID) {
    if (import.meta.env.DEV) {
      console.info("[Analytics] Matomo non configuré — mode dev skip");
    }
    return;
  }

  // Vérifier le consentement cookies
  const consent = localStorage.getItem("carguinee_cookie_consent");
  if (consent !== "accepted") {
    if (import.meta.env.DEV) {
      console.info("[Analytics] Pas de consentement — tracking désactivé");
    }
    return;
  }

  // Charger le script Matomo
  const script = document.createElement("script");
  script.src = `${MATOMO_URL}/matomo.js`;
  script.async = true;
  script.defer = true;

  // Configurer Matomo
  window._paq = window._paq || [];
  window._paq.push(["disableCookies"]); // Anonyme
  window._paq.push(["setTrackerUrl", `${MATOMO_URL}/matomo.php`]);
  window._paq.push(["setSiteId", MATOMO_SITE_ID]);
  window._paq.push(["trackPageView"]);
  window._paq.push(["enableLinkTracking"]);
  // Anonymisation IP (RGPD)
  window._paq.push(["setDomains", ["*.carguinee.com"]]);
  window._paq.push(["requireConsent"]);

  document.head.appendChild(script);
}

/**
 * Track un événement personnalisé.
 *
 * @param category - Catégorie (ex: "Véhicule", "Réservation")
 * @param action - Action (ex: "Voir détails", "Réserver")
 * @param name - Nom optionnel (ex: vehicle id)
 * @param value - Valeur optionnelle (ex: prix)
 */
export function trackEvent(
  category: string,
  action: string,
  name?: string,
  value?: number,
): void {
  if (typeof window._paq === "undefined") return;

  const args: (string | number)[] = ["trackEvent", category, action];
  if (name) args.push(name);
  if (value !== undefined) args.push(value);

  window._paq.push(args as never[]);
}

/**
 * Track un changement de page (SPA navigation).
 */
export function trackPageView(): void {
  if (typeof window._paq === "undefined") return;

  window._paq.push(["setCustomUrl", window.location.href]);
  window._paq.push(["setDocumentTitle", document.title]);
  window._paq.push(["trackPageView"]);
}

/**
 * Demande le consentement Matomo après acceptation des cookies.
 */
export function consentAnalytics(): void {
  if (typeof window._paq === "undefined") return;
  window._paq.push(["setConsentGiven"]);
}

// Déclarer le typage global pour _paq
declare global {
  interface Window {
    _paq?: unknown[][];
  }
}
