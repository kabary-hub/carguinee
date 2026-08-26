/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CarGuinée — Load Testing (Node.js)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   node tests/load/load-test.mjs
 *   node tests/load/load-test.mjs --vus 20 --duration 30
 * ══════════════════════════════════════════════════════════════════════════════
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const VUS = parseInt(process.argv.find((_, i, a) => a[i - 1] === "--vus") || "10");
const DURATION_SEC = parseInt(process.argv.find((_, i, a) => a[i - 1] === "--duration") || "30");

const metrics = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  latencies: [],
  byEndpoint: {},
};

let stopped = false;

function recordLatency(endpoint, latencyMs, status) {
  metrics.totalRequests++;
  if (status >= 200 && status < 400) metrics.successRequests++;
  else metrics.errorRequests++;
  metrics.latencies.push(latencyMs);
  if (!metrics.byEndpoint[endpoint]) {
    metrics.byEndpoint[endpoint] = { count: 0, errors: 0, latencies: [] };
  }
  metrics.byEndpoint[endpoint].count++;
  if (status >= 400) metrics.byEndpoint[endpoint].errors++;
  metrics.byEndpoint[endpoint].latencies.push(latencyMs);
}

async function httpGet(path, headers = {}) {
  if (stopped) return null;
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...headers },
      signal: AbortSignal.timeout(10000),
    });
    recordLatency(`GET ${path}`, Date.now() - start, res.status);
    return res;
  } catch {
    recordLatency(`GET ${path}`, Date.now() - start, 0);
    return null;
  }
}

async function httpPost(path, body, headers = {}) {
  if (stopped) return null;
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    recordLatency(`POST ${path}`, Date.now() - start, res.status);
    return res;
  } catch {
    recordLatency(`POST ${path}`, Date.now() - start, 0);
    return null;
  }
}

async function vuScenario(vuId) {
  const endTime = Date.now() + DURATION_SEC * 1000;
  let iterations = 0;

  while (!stopped && Date.now() < endTime) {
    iterations++;

    // 1. Health check
    await httpGet("/api/health");
    if (stopped) break;

    // 2. Liste véhicules
    await httpGet("/api/vehicles");
    if (stopped) break;

    // 3. Login
    const loginRes = await httpPost("/api/auth/login", {
      phone: "620980117",
      password: "12345678",
    });

    if (loginRes && loginRes.status === 200) {
      try {
        const data = await loginRes.json();
        const token = data?.data?.accessToken;
        if (token) {
          const authHeaders = { Authorization: `Bearer ${token}` };
          await httpGet("/api/auth/me", authHeaders);
          if (!stopped) await httpGet("/api/notifications", authHeaders);
          if (!stopped) await httpGet("/api/stats?period=30d", authHeaders);
        }
      } catch {}
    }

    if (!stopped) await new Promise((r) => setTimeout(r, 200));
  }
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function printReport(duration) {
  const sorted = [...metrics.latencies].sort((a, b) => a - b);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Résultats du Load Test");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log(`  ⏱️  Duration:      ${duration}s`);
  console.log(`  📊 Total requests: ${metrics.totalRequests}`);
  console.log(`  ✅ Success:        ${metrics.successRequests} (${((metrics.successRequests / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}%)`);
  console.log(`  ❌ Errors:         ${metrics.errorRequests} (${((metrics.errorRequests / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}%)`);
  console.log(`  🚀 Req/sec:        ${(metrics.totalRequests / Math.max(parseFloat(duration), 1)).toFixed(2)}`);

  if (sorted.length > 0) {
    console.log(`\n  Latence:`);
    console.log(`    Min:    ${sorted[0]}ms`);
    console.log(`    Avg:    ${(sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(0)}ms`);
    console.log(`    P50:    ${percentile(sorted, 50)}ms`);
    console.log(`    P95:    ${percentile(sorted, 95)}ms`);
    console.log(`    P99:    ${percentile(sorted, 99)}ms`);
    console.log(`    Max:    ${sorted[sorted.length - 1]}ms`);
  }

  console.log(`\n  Par endpoint:`);
  console.log(`  ${"Endpoint".padEnd(30)} ${"Reqs".padStart(6)} ${"Errors".padStart(7)} ${"Avg(ms)".padStart(8)} ${"P95(ms)".padStart(8)}`);
  console.log(`  ${"─".repeat(60)}`);

  for (const [endpoint, data] of Object.entries(metrics.byEndpoint)) {
    const epSorted = [...data.latencies].sort((a, b) => a - b);
    const avg = (data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length).toFixed(0);
    const p95 = percentile(epSorted, 95);
    console.log(`  ${endpoint.padEnd(30)} ${String(data.count).padStart(6)} ${String(data.errors).padStart(7)} ${avg.padStart(8)} ${String(p95).padStart(8)}`);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  const errorRate = (metrics.errorRequests / Math.max(metrics.totalRequests, 1)) * 100;
  const p95Val = sorted.length > 0 ? percentile(sorted, 95) : 0;

  if (errorRate < 10 && p95Val < 2000) {
    console.log("  ✅ VERDICT: PASS — Taux d'erreur < 10%, P95 < 2s");
  } else if (errorRate < 25) {
    console.log("  ⚠️  VERDICT: WARN — Performance dégradée");
  } else {
    console.log("  ❌ VERDICT: FAIL — Trop d'erreurs ou latence trop élevée");
  }
  console.log("═══════════════════════════════════════════════════════════════\n");
}

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  CarGuinée — Load Test");
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  VUs: ${VUS} | Duration: ${DURATION_SEC}s`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  const startTime = Date.now();

  // Lancer les VUs
  const vuPromises = [];
  for (let i = 0; i < VUS; i++) {
    vuPromises.push(vuScenario(i));
  }

  // Timeout → arrêter proprement
  setTimeout(() => {
    stopped = true;
  }, DURATION_SEC * 1000);

  await Promise.allSettled(vuPromises);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  printReport(duration);
}

main().catch(console.error);
