import { test, expect } from "@playwright/test";

test.describe("Navigation publique", () => {
  test("la page d'accueil se charge", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CarGuinée|CarGuinee/);
  });

  test("le catalogue véhicules est accessible", async ({ page }) => {
    await page.goto("/vehicules");
    await expect(page.locator("text=Catalogue")).toBeVisible({ timeout: 10000 });
  });

  test("la page de connexion est accessible", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator("text=Connexion")).toBeVisible({ timeout: 10000 });
  });

  test("la page d'inscription est accessible", async ({ page }) => {
    await page.goto("/inscription");
    await expect(page.locator("text=Inscription")).toBeVisible({ timeout: 10000 });
  });

  test("les pages légales sont accessibles", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page.locator("text=Mentions")).toBeVisible({ timeout: 10000 });

    await page.goto("/conditions-generales");
    await expect(page.locator("text=Conditions")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Navigation protégée", () => {
  test("redirige vers connexion si non authentifié", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForURL("**/connexion", { timeout: 10000 });
    expect(page.url()).toContain("/connexion");
  });

  test("redirige vers connexion pour favoris", async ({ page }) => {
    await page.goto("/favoris");
    await page.waitForURL("**/connexion", { timeout: 10000 });
    expect(page.url()).toContain("/connexion");
  });

  test("redirige vers connexion pour notifications", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForURL("**/connexion", { timeout: 10000 });
    expect(page.url()).toContain("/connexion");
  });
});

test.describe("Page 404", () => {
  test("affiche une page pour route inexistante", async ({ page }) => {
    const response = await page.goto("/cette-page-nexiste-pas");
    expect(response?.status()).toBe(404);
  });
});
