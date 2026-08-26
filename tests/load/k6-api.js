/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CarGuinée — Load Testing avec k6
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Usage :
 *   k6 run tests/load/k6-api.js
 *   k6 run --vus 50 --duration 60s tests/load/k6-api.js
 *
 * Installation :
 *   npm install -g k6
 *   # ou sur Mac : brew install k6
 * ══════════════════════════════════════════════════════════════════════════════
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ── Métriques personnalisées ──────────────────────────────────────────────
const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");

// ── Configuration ─────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: "10s", target: 10 },  // Ramp up: 0 → 10 VUs
    { duration: "30s", target: 20 },  // Montée: 10 → 20 VUs
    { duration: "60s", target: 20 },  // Plateau: 20 VUs pendant 1 min
    { duration: "10s", target: 0 },   // Ramp down: 20 → 0 VUs
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],  // 95% < 2s, 99% < 5s
    http_req_failed: ["rate<0.1"],                      // < 10% d'erreurs
    errors: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// ── Scénarios ─────────────────────────────────────────────────────────────
export default function () {
  const headers = { "Content-Type": "application/json" };

  // 1. Health check (lecture seule, pas d'auth)
  {
    const res = http.get(`${BASE_URL}/api/health`, { headers });
    check(res, {
      "health → 200": (r) => r.status === 200,
      "health → status ok": (r) => JSON.parse(r.body).status === "ok",
    });
    apiLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);
  }

  sleep(0.5);

  // 2. Liste des véhicules (lecture seule)
  {
    const res = http.get(`${BASE_URL}/api/vehicles`, { headers });
    check(res, {
      "vehicles → 200": (r) => r.status === 200,
      "vehicles → has data": (r) => {
        try { return JSON.parse(r.body).status === "ok"; } catch { return false; }
      },
    });
    apiLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);
  }

  sleep(1);

  // 3. Login (écriture, rate limité)
  {
    const payload = JSON.stringify({
      phone: "620980117",
      password: "12345678",
    });
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, { headers });
    check(res, {
      "login → 200": (r) => r.status === 200,
      "login → has token": (r) => {
        try { return !!JSON.parse(r.body).data?.accessToken; } catch { return false; }
      },
    });
    apiLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);

    // 4. Requête authentifiée (si login réussi)
    if (res.status === 200) {
      try {
        const token = JSON.parse(res.body).data.accessToken;
        const authHeaders = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };

        // Profil utilisateur
        const meRes = http.get(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
        check(meRes, {
          "me → 200": (r) => r.status === 200,
        });
        apiLatency.add(meRes.timings.duration);

        sleep(0.5);

        // Notifications
        const notifRes = http.get(`${BASE_URL}/api/notifications`, { headers: authHeaders });
        check(notifRes, {
          "notifications → 200": (r) => r.status === 200,
        });
        apiLatency.add(notifRes.timings.duration);

        sleep(0.5);

        // Stats (propriétaire/admin)
        const statsRes = http.get(`${BASE_URL}/api/stats?period=30d`, { headers: authHeaders });
        check(statsRes, {
          "stats → 200 or 403": (r) => r.status === 200 || r.status === 403,
        });
        apiLatency.add(statsRes.timings.duration);
      } catch {
        // Ignore parse errors
      }
    }
  }

  sleep(2);
}

// ── Résumé ────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "tests/load/report.json": JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const lines = [];
  lines.push("\n═══════════════════════════════════════════════════════════════");
  lines.push("  CarGuinée — Load Test Report");
  lines.push("═══════════════════════════════════════════════════════════════\n");

  const m = data.metrics;
  if (m.http_reqs) {
    lines.push(`  Total requests:  ${m.http_reqs.values.count}`);
    lines.push(`  Req/sec:          ${m.http_reqs.values.rate?.toFixed(2)}`);
  }
  if (m.http_req_duration) {
    lines.push(`  Avg latency:      ${m.http_req_duration.values.avg?.toFixed(2)}ms`);
    lines.push(`  P95 latency:      ${m.http_req_duration.values["p(95)"]?.toFixed(2)}ms`);
    lines.push(`  P99 latency:      ${m.http_req_duration.values["p(99)"]?.toFixed(2)}ms`);
  }
  if (m.http_req_failed) {
    lines.push(`  Error rate:       ${(m.http_req_failed.values.rate * 100)?.toFixed(2)}%`);
  }
  lines.push("\n═══════════════════════════════════════════════════════════════");
  return lines.join("\n");
}
