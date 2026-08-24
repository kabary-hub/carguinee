import { defineConfig } from "@playwright/test";

/**
 * Config Playwright pour Carguinée.
 *
 * Utilise :
 *  - npm run test:e2e          → headless, chromium
 *  - npm run test:e2e:headed   → navigateur visible
 *  - npm run test:e2e:ui       → interface graphique Playwright
 *
 * Prérequis : backend (port 3000) + frontend (port 5173) lancés.
 * Si le backend n'est pas lancé, les tests d'inscription/connexion
 * qui appellent l'API directement seront skippés.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 1, // Séquentiel pour éviter les conflits DB
  fullyParallel: false,

  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
    // Navigation plus robuste
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
  },

  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },

  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
});
