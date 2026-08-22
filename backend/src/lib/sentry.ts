import * as Sentry from "@sentry/node";

/**
 * Initialise Sentry pour le backend.
 * Ne s'active qu'en production et si la clé DSN est définie.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn || process.env.NODE_ENV !== "production") {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
}

/**
 * Middleware Express pour capturer les erreurs avec Sentry.
 * Doit être placé APRÈS toutes les routes.
 */
export function sentryErrorHandler() {
  return Sentry.setupExpressErrorHandler(((_err: unknown, _req: unknown, res: { statusCode: number; json: (body: unknown) => void }, _next: unknown) => {
    res.statusCode = 500;
    res.json({ status: "error", message: "Erreur interne." });
  }) as Parameters<typeof Sentry.setupExpressErrorHandler>[0]);
}
