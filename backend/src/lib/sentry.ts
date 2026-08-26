/**
 * Sentry backend — monitoring des erreurs en production.
 * S'active uniquement si SENTRY_DSN est défini dans .env.
 * En dev : stub silencieux pour ne pas polluer les logs.
 */
import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    // Pas de DSN → stub silencieux
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    maxValueLength: 500,
    beforeSend(event) {
      // Ne pas envoyer les erreurs de health check
      if (event.request?.url?.includes("/api/health")) {
        return null;
      }
      return event;
    },
  });

  initialized = true;
}

/** Capture une erreur non catchée dans Sentry. */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}

/** Capture un message info dans Sentry (utile pour les alertes). */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

/** Flush les événements Sentry avant de quitter (pour les tests). */
export async function flushSentry(timeoutMs = 2000) {
  if (!initialized) return;
  await Sentry.flush(timeoutMs);
}
