import { Router } from "express";
import { register } from "../../lib/metrics.js";

export const metricsRouter = Router();

/**
 * Endpoint Prometheus /metrics.
 * Accessible sans authentification (pour le scraping Prometheus).
 */
metricsRouter.get("/", async (_request, response) => {
  try {
    response.setHeader("Content-Type", register.contentType);
    response.send(await register.metrics());
  } catch {
    response.status(500).send("Erreur lors de la collecte des métriques.");
  }
});

/**
 * Endpoint /metrics/health pour vérifier que les métriques fonctionnent.
 */
metricsRouter.get("/health", (_request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});
