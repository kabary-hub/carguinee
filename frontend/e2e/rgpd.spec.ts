/**
 * Tests E2E pour les fonctionnalités RGPD.
 *
 * Ces tests vérifient :
 * - La bannière de consentement cookies s'affiche
 * - Les boutons Accepter/Refuser fonctionnent
 * - Les pages légales sont accessibles
 * - Le registre des traitements est accessible
 * - Le profil affiche les boutons RGPD (quand connecté)
 */

import { test, expect } from "@playwright/test";

test.describe("Bannière de consentement cookies", () => {
  test("la bannière s'affiche lors de la première visite", async ({ page }) => {
    // Supprimer le consentement stocké pour simuler une première visite
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("carguinee_cookie_consent");
    });
    await page.reload();

    // La bannière devrait être visible
    const banner = page.locator('[role="dialog"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Vérifier la présence des boutons
    await expect(page.locator("text=Accepter")).toBeVisible();
    await expect(page.locator("text=Refuser")).toBeVisible();
  });

  test("le bouton Refuser masque la bannière", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("carguinee_cookie_consent");
    });
    await page.reload();

    // Cliquer sur Refuser
    await page.click("text=Refuser");

    // La bannière devrait disparaître
    const banner = page.locator('[role="dialog"]');
    await expect(banner).not.toBeVisible({ timeout: 3000 });

    // Le consentement devrait être stocké
    const consent = await page.evaluate(() =>
      localStorage.getItem("carguinee_cookie_consent")
    );
    expect(consent).toBe("refused");
  });

  test("le bouton Accepter masque la bannière et stocke le consentement", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("carguinee_cookie_consent");
    });
    await page.reload();

    // Cliquer sur Accepter
    await page.click("text=Accepter");

    // La bannière devrait disparaître
    const banner = page.locator('[role="dialog"]');
    await expect(banner).not.toBeVisible({ timeout: 3000 });

    // Le consentement devrait être stocké
    const consent = await page.evaluate(() =>
      localStorage.getItem("carguinee_cookie_consent")
    );
    expect(consent).toBe("accepted");
  });

  test("la bannière ne s'affiche pas après un choix précédent", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("carguinee_cookie_consent", "accepted");
    });
    await page.reload();

    // La bannière ne devrait pas être visible
    const banner = page.locator('[role="dialog"]');
    await expect(banner).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Pages légales accessibles", () => {
  test("la page du registre des traitements est accessible", async ({ page }) => {
    await page.goto("/registre-traitements");

    // Le titre de la page devrait être visible
    await expect(
      page.locator("text=Registre des traitements")
    ).toBeVisible({ timeout: 10000 });
  });

  test("la page politique de confidentialité est accessible", async ({ page }) => {
    await page.goto("/politique-confidentialite");

    await expect(
      page.locator("text=Politique de Confidentialité")
    ).toBeVisible({ timeout: 10000 });
  });

  test("la page CGU est accessible", async ({ page }) => {
    await page.goto("/conditions-generales");

    await expect(
      page.locator("text=Conditions Générales")
    ).toBeVisible({ timeout: 10000 });
  });

  test("la page mentions légales est accessible", async ({ page }) => {
    await page.goto("/mentions-legales");

    await expect(
      page.locator("text=Mentions Légales")
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Liens légaux dans le pied de page", () => {
  test("le pied de page contient les liens RGPD", async ({ page }) => {
    await page.goto("/");

    // Vérifier la présence des liens dans le footer
    await expect(page.locator("footer a:text('CGU')")).toBeVisible();
    await expect(page.locator("footer a:text('Mentions légales')")).toBeVisible();
    await expect(
      page.locator("footer a:text('Politique de confidentialité')")
    ).toBeVisible();
    await expect(
      page.locator("footer a:text('Registre des traitements')")
    ).toBeVisible();
  });
});

test.describe("Page profil — boutons RGPD (non connecté)", () => {
  test("redirige vers connexion si non connecté", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForURL("**/connexion", { timeout: 10000 });
    expect(page.url()).toContain("/connexion");
  });
});
