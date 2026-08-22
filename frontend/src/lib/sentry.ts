import * as Sentry from "@sentry/react";

/**
 * Initialise Sentry pour le frontend.
 * Ne s'active qu'en production et si la clé DSN est définie.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn || import.meta.env.DEV) {
    // En dev, on n'initialise pas Sentry (évite le bruit)
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% des transactions
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0, // 100% des erreurs
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}
