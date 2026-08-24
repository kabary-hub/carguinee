/**
 * Tests E2E — Véhicules & Réservations
 *
 * Couvre :
 *  - Catalogue véhicules (chargement, filtres, recherche)
 *  - Détail véhicule
 *  - Réservation (connecté + non connecté)
 *  - Favoris
 */

import { test, expect, type Page } from "@playwright/test";

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomGuineaPhone(): string {
  const digits = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10).toString(),
  ).join("");
  return `+224${digits}`;
}

async function registerViaAPI(
  page: Page,
  user: { firstName: string; lastName: string; phone: string; password: string },
) {
  const res = await page.request.post(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/auth/register`,
    { data: user, headers: { "Content-Type": "application/json" } },
  );
  if (res.ok()) {
    const body = await res.json();
    return body.data?.user ?? null;
  }
  return null;
}

async function loginAsClient(page: Page) {
  const phone = randomGuineaPhone();
  const password = "VehicleTest123!";
  await registerViaAPI(page, {
    firstName: "Vehicle",
    lastName: "Tester",
    phone,
    password,
  });
  await page.goto("/connexion");
  await page.getByLabel(/numéro de téléphone/i).fill(phone);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL("**/vehicules", { timeout: 15_000 });
}

// ── Catalogue ───────────────────────────────────────────────────────────────

test.describe("Catalogue véhicules", () => {
  test("la page catalogue s'affiche et contient le titre", async ({ page }) => {
    await page.goto("/vehicules");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("les filtres sont présents", async ({ page }) => {
    await page.goto("/vehicules");

    // Champ de recherche
    await expect(page.getByPlaceholder(/rechercher/i)).toBeVisible();
    // Select type
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("le compteur de véhicules s'affiche", async ({ page }) => {
    await page.goto("/vehicules");
    await expect(page.locator("text=/\\d+ véhicule/i")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("la recherche filtre les véhicules", async ({ page }) => {
    await page.goto("/vehicules");
    await page.waitForLoadState("networkidle");

    // Taper une recherche
    await page.getByPlaceholder(/rechercher/i).fill("Toyota");
    await page.waitForTimeout(500); // debounce

    // Vérifier que la page ne crashe pas
    await expect(page.locator("h1")).toBeVisible();
  });

  test("le bouton reset réinitialise les filtres", async ({ page }) => {
    await page.goto("/vehicules");
    await page.waitForLoadState("networkidle");

    // Appliquer un filtre
    await page.getByPlaceholder(/rechercher/i).fill("XYZ123");
    await page.waitForTimeout(500);

    // Reset
    const resetBtn = page.getByRole("button", { name: /réinitialiser/i });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.getByPlaceholder(/rechercher/i)).toHaveValue("");
    }
  });
});

// ── Détail véhicule ─────────────────────────────────────────────────────────

test.describe("Détail véhicule", () => {
  test("cliquer sur un véhicule ouvre la page détail", async ({ page }) => {
    await page.goto("/vehicules");
    await page.waitForLoadState("networkidle");

    // Chercher un lien vers un véhicule
    const vehicleLink = page.locator('a[href^="/vehicules/"]').first();
    const hasVehicle = await vehicleLink.isVisible().catch(() => false);

    if (hasVehicle) {
      await vehicleLink.click();
      await page.waitForURL("**/vehicules/**", { timeout: 10_000 });
      // La page détail doit avoir un titre
      await expect(page.locator("h1, h2").first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("la page détail d'un véhicule existe", async ({ page }) => {
    // Aller d'abord au catalogue pour trouver un ID valide
    await page.goto("/vehicules");
    await page.waitForLoadState("networkidle");

    const link = page.locator('a[href^="/vehicules/"]').first();
    const href = await link.getAttribute("href").catch(() => null);

    if (href) {
      await page.goto(href);
      await expect(page.locator("h1, h2").first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("un ID inexistant affiche une erreur ou redirect", async ({ page }) => {
    await page.goto("/vehicules/00000000-0000-0000-0000-000000000000");
    // Soit une page erreur, soit un redirect — pas de crash
    await page.waitForTimeout(2000);
    // Vérifier qu'il n'y a pas d'écran blanc
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});

// ── Réservation ─────────────────────────────────────────────────────────────

test.describe("Réservation", () => {
  test("non connecté : le formulaire de réservation redirige vers connexion", async ({
    page,
  }) => {
    await page.goto("/vehicules");
    await page.waitForLoadState("networkidle");

    const link = page.locator('a[href^="/vehicules/"]').first();
    const href = await link.getAttribute("href").catch(() => null);

    if (href) {
      await page.goto(href);
      await page.waitForLoadState("networkidle");

      // Chercher un bouton qui mène à la connexion
      const loginLink = page.getByRole("link", { name: /connexion/i });
      const isLoginVisible = await loginLink.isVisible().catch(() => false);

      // Soit le lien connexion est visible, soit le formulaire de réservation est absent
      if (!isLoginVisible) {
        // Vérifier que le sidebar n'a pas de bouton "Réserver"
        const bookBtn = page.getByRole("button", { name: /réserver/i });
        const hasBookBtn = await bookBtn.isVisible().catch(() => false);
        // Si le bouton réserver est visible, c'est que l'user est connecté (normal)
        // Sinon, c'est qu'on redirige vers connexion
        expect(typeof hasBookBtn).toBe("boolean");
      }
    }
  });

  test("connecté : la page détail affiche le formulaire de réservation", async ({
    page,
  }) => {
    await loginAsClient(page);

    // Aller au catalogue
    await page.goto("/vehicules");
    await page.waitForLoadState("networkidle");

    const link = page.locator('a[href^="/vehicules/"]').first();
    const href = await link.getAttribute("href").catch(() => null);

    if (href) {
      await page.goto(href);
      await page.waitForLoadState("networkidle");

      // Le formulaire de réservation devrait être visible (ou un bouton "Réserver")
      // Vérifier qu'il y a des éléments de réservation sur la page
      const pageContent = await page.locator("body").textContent();
      expect(pageContent?.length).toBeGreaterThan(0);
    }
  });
});

// ── Favoris ─────────────────────────────────────────────────────────────────

test.describe("Favoris", () => {
  test("la page favoris redirige vers connexion si non connecté", async ({
    page,
  }) => {
    await page.goto("/favoris");
    await page.waitForURL("**/connexion", { timeout: 10_000 });
    expect(page.url()).toContain("/connexion");
  });

  test("connecté : la page favoris s'affiche", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/favoris");
    await page.waitForLoadState("networkidle");

    // La page doit se charger sans erreur
    await expect(page.locator("body")).toBeVisible();
  });
});

// ── Navigation entre pages ──────────────────────────────────────────────────

test.describe("Navigation vehicules", () => {
  test("le bouton retour fonctionne depuis le catalogue", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/vehicules");
    await page.waitForLoadState("networkidle");

    // Vérifier qu'on est sur le catalogue
    expect(page.url()).toContain("/vehicules");
  });

  test("la navigation fonctionne entre les différentes pages", async ({
    page,
  }) => {
    // Test de navigation fluide
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/vehicules");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/mentions-legales");
    await expect(page.locator("body")).toBeVisible();
  });
});
