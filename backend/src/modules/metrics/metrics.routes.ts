import { Router } from "express";
import { register } from "../../lib/metrics.js";

export const metricsRouter = Router();

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags: [Metrics]
 *     summary: Métriques Prometheus
 *     description: Endpoint pour le scraping Prometheus (pas d'auth requise)
 *     responses:
 *       200:
 *         description: Métriques au format Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
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
 * @swagger
 * /metrics/health:
 *   get:
 *     tags: [Metrics]
 *     summary: Santé du système de métriques
 *     responses:
 *       200:
 *         description: Métriques fonctionnelles
 */
metricsRouter.get("/health", (_request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});
