/**
 * k6 Load Test — Carguinée API
 *
 * Usage:
 *   k6 run tests/performance/k6-load-test.js
 *   k6 run --vus 50 --duration 30s tests/performance/k6-load-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ── Métriques personnalisées ──────────────────────────────────────────────
const errorRate = new Rate("errors");
const requestDuration = new Trend("request_duration", true);
const loginDuration = new Trend("login_duration", true);
const vehiclesFetched = new Counter("vehicles_fetched");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// ── Configuration des scénarios ───────────────────────────────────────────
export const options = {
  scenarios: {
    // Scénario 1 : Montée en charge progressive
    ramp_up: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },   // Montée progressive
        { duration: "1m", target: 20 },     // Maintien
        { duration: "30s", target: 50 },    // Pic
        { duration: "1m", target: 50 },     // Maintien pic
        { duration: "30s", target: 0 },     // Descente
      ],
    },
  },

  thresholds: {
    http_req_duration: [
      "p(50)<500",    // 50% des requêtes < 500ms
      "p(95)<2000",   // 95% des requêtes < 2s
      "p(99)<5000",   // 99% des requêtes < 5s
    ],
    http_req_failed: ["rate<0.1"],    // < 10% d'échecs
    errors: ["rate<0.1"],
  },
};

// ── Setup : créer un utilisateur test ─────────────────────────────────────
let authToken = "";

export function setup() {
  const phone = `+224${Math.floor(Math.random() * 90000000 + 10000000)}`;

  // Register
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      firstName: "Load",
      lastName: "Test",
      phone,
      password: "LoadTest123!",
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  if (registerRes.status === 200) {
    const body = registerRes.json();
    authToken = body.data?.accessToken || "";
  }

  return { authToken, phone };
}

// ── Tests principaux ─────────────────────────────────────────────────────
export default function (data) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.authToken}`,
  };

  // ── Endpoint public : catalogue véhicules ──
  const vehiclesRes = http.get(`${BASE_URL}/api/vehicles?pageSize=20`, {
    tags: { name: "GET /api/vehicles" },
  });
  check(vehiclesRes, {
    "vehicles: status 200": (r) => r.status === 200,
    "vehicles: has data": (r) => r.json("status") === "ok",
  });
  errorRate.add(vehiclesRes.status !== 200);
  requestDuration.add(vehiclesRes.timings.duration);
  if (vehiclesRes.status === 200) vehiclesFetched.add(1);

  sleep(1);

  // ── Endpoint authentifié : profil ──
  if (data.authToken) {
    const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers,
      tags: { name: "GET /api/auth/me" },
    });
    check(profileRes, {
      "profile: status 200": (r) => r.status === 200,
    });
    errorRate.add(profileRes.status !== 200);
    requestDuration.add(profileRes.timings.duration);

    sleep(0.5);

    // ── Notifications ──
    const notifRes = http.get(`${BASE_URL}/api/notifications?pageSize=10`, {
      headers,
      tags: { name: "GET /api/notifications" },
    });
    check(notifRes, {
      "notifications: status 200": (r) => r.status === 200,
    });
    errorRate.add(notifRes.status !== 200);

    sleep(0.5);

    // ── Favoris ──
    const favRes = http.get(`${BASE_URL}/api/favorites?page=1&pageSize=20`, {
      headers,
      tags: { name: "GET /api/favorites" },
    });
    check(favRes, {
      "favorites: status 200": (r) => r.status === 200,
    });
    errorRate.add(favRes.status !== 200);
  }

  sleep(Math.random() * 2 + 0.5); // Pause réaliste 0.5-2.5s
}

// ── Rapport final ─────────────────────────────────────────────────────────
export function handleSummary(data) {
  const passed = Object.values(data.root_group.checks || {}).every(
    (c) => c.passes > 0,
  );

  return {
    stdout: JSON.stringify(
      {
        totalRequests: data.metrics.http_reqs?.values?.count || 0,
        avgDuration: `${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(0)}ms`,
        p95Duration: `${(data.metrics.http_req_duration?.values?.["p(95)"] || 0).toFixed(0)}ms`,
        errorRate: `${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(1)}%`,
        status: passed ? "✅ PASS" : "❌ FAIL",
      },
      null,
      2,
    ),
    "tests/performance/k6-report.json": JSON.stringify(data, null, 2),
  };
}
