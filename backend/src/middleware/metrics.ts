import type { Request, Response, NextFunction } from "express";
import { httpRequestCounter, httpRequestDuration } from "../lib/metrics.js";

/**
 * Middleware Express qui enregistre automatiquement les métriques Prometheus
 * pour chaque requête HTTP (compteur + histogramme de latence).
 */
export function metricsMiddleware(request: Request, response: Response, next: NextFunction) {
  const startTime = Date.now();

  // Intercepter la fin de la réponse pour enregistrer les métriques
  response.on("finish", () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = request.route?.path ?? request.path;
    const method = request.method;
    const status = String(response.statusCode);

    httpRequestCounter.inc({ method, route, status });
    httpRequestDuration.observe({ method, route, status }, duration);
  });

  next();
}
