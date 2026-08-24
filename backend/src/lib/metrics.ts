import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

/**
 * Métriques Prometheus pour CarGuinée.
 * Exposées via /metrics pour Grafana / Prometheus.
 */

// ── Registry ─────────────────────────────────────────────────────────────────

export const register = new Registry();

// Métriques par défaut (CPU, mémoire, event loop)
collectDefaultMetrics({ register });

// ── Métriques HTTP ───────────────────────────────────────────────────────────

export const httpRequestCounter = new Counter({
  name: "carguinee_http_requests_total",
  help: "Nombre total de requêtes HTTP",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "carguinee_http_request_duration_seconds",
  help: "Durée des requêtes HTTP en secondes",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// ── Métriques métier ─────────────────────────────────────────────────────────

export const usersTotal = new Gauge({
  name: "carguinee_users_total",
  help: "Nombre total d'utilisateurs",
  registers: [register],
});

export const vehiclesTotal = new Gauge({
  name: "carguinee_vehicles_total",
  help: "Nombre total de véhicules",
  registers: [register],
});

export const bookingsTotal = new Gauge({
  name: "carguinee_bookings_total",
  help: "Nombre total de réservations",
  registers: [register],
});

export const reportsPending = new Gauge({
  name: "carguinee_reports_pending",
  help: "Nombre de signalements en attente",
  registers: [register],
});

// ── Métriques erreurs ────────────────────────────────────────────────────────

export const errorsCounter = new Counter({
  name: "carguinee_errors_total",
  help: "Nombre total d'erreurs",
  labelNames: ["type", "route"],
  registers: [register],
});
