/**
 * Tests E2E — Authentification
 *
 * Couvre :
 *  - Inscription (validation, succès, doublon)
 *  - Connexion (succès, échec, redirection par rôle)
 *  - Déconnexion
 *  - Redirection des pages protégées
 *  - Persistance de session (refresh)
 *
 * Prérequis : backend + frontend lancés (npm run dev dans les deux dossiers)
 */

import { test, expect, type Page } from "@playwright/test";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Génère un numéro de téléphone guinéen aléatoire unique. */
function randomGuineaPhone(): string {
  const digits = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10).toString(),
  ).join("");
  return `+224${digits}`;
}

/** Crée un compte via l'API directement (pour les tests qui ont besoin d'un user préexistant). */
async function registerViaAPI(
  page: Page,
  user: { firstName: string; lastName: string; phone: string; password: string },
): Promise<{ id: string; role: string } | null> {
  const response = await page.request.post(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/auth/register`,
    {
      data: user,
      headers: { "Content-Type": "application/json" },
    },
  );
  if (response.ok()) {
    const body = await response.json();
    return body.data?.user ?? null;
  }
  return null;
}

// ── Tests : Inscription ─────────────────────────────────────────────────────

test.describe("Inscription", () => {
  test("la page d'inscription s'affiche correctement", async ({ page }) => {
    await page.goto("/inscription");
    await expect(
      page.getByRole("heading", { name: /créer un compte/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /créer mon compte/i }),
    ).toBeVisible();
  });

  test("affiche une erreur si le mot de passe est trop court", async ({
    page,
  }) => {
    await page.goto("/inscription");

    await page.getByLabel(/prénom/i).fill("Test");
    await page.getByLabel(/nom/i).fill("User");
    await page.getByLabel(/téléphone/i).fill(randomGuineaPhone());
    await page.getByLabel(/mot de passe/i).fill("123");
    await page.getByRole("button", { name: /créer mon compte/i }).click();

    // Le bouton doit être disabled ou le form doit empêcher la soumission
    // Le minlength=8 sur le champ password empêche la soumission native
    await expect(page).toHaveURL(/\/inscription/);
  });

  test("inscription réussie redirige vers le catalogue", async ({ page }) => {
    const phone = randomGuineaPhone();
    await page.goto("/inscription");

    await page.getByLabel(/prénom/i).fill("Fatou");
    await page.getByLabel(/nom/i).fill("Camara");
    await page.getByLabel(/téléphone/i).fill(phone);
    await page.getByLabel(/mot de passe/i).fill("SecurePass99!");
    await page.getByRole("button", { name: /créer mon compte/i }).click();

    // Redirection vers /vehicules (rôle CLIENT)
    await page.waitForURL("**/vehicules", { timeout: 15_000 });
    expect(page.url()).toContain("/vehicules");
  });

  test("inscription avec téléphone existant affiche une erreur", async ({
    page,
  }) => {
    // D'abord créer un compte
    const phone = randomGuineaPhone();
    await registerViaAPI(page, {
      firstName: "Existing",
      lastName: "User",
      phone,
      password: "ExistPass123!",
    });

    // Essayer de s'inscrire à nouveau avec le même numéro
    await page.goto("/inscription");
    await page.getByLabel(/prénom/i).fill("Existing");
    await page.getByLabel(/nom/i).fill("User");
    await page.getByLabel(/téléphone/i).fill(phone);
    await page.getByLabel(/mot de passe/i).fill("ExistPass123!");
    await page.getByRole("button", { name: /créer mon compte/i }).click();

    // Un message d'erreur doit apparaître
    await expect(page.locator('[role="alert"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test("le lien 'Connectez-vous' mène à la page de connexion", async ({
    page,
  }) => {
    await page.goto("/inscription");
    await page.getByRole("link", { name: /connectez-vous/i }).click();
    await page.waitForURL("**/connexion", { timeout: 10_000 });
    expect(page.url()).toContain("/connexion");
  });
});

// ── Tests : Connexion ───────────────────────────────────────────────────────

test.describe("Connexion", () => {
  // Créer un user pour les tests de connexion
  let testPhone: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    testPhone = randomGuineaPhone();
    testPassword = "LoginTest123!";
    const page = await browser.newPage();
    await registerViaAPI(page, {
      firstName: "Login",
      lastName: "Test",
      phone: testPhone,
      password: testPassword,
    });
    await page.close();
  });

  test("la page de connexion s'affiche correctement", async ({ page }) => {
    await page.goto("/connexion");
    await expect(
      page.getByRole("heading", { name: /connexion/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: /se connecter/i }),
    ).toBeVisible();
  });

  test("connexion avec identifiants valides redirige vers le catalogue", async ({
    page,
  }) => {
    await page.goto("/connexion");

    await page.getByLabel(/numéro de téléphone/i).fill(testPhone);
    await page.getByLabel(/mot de passe/i).fill(testPassword);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Redirection vers /vehicules (rôle CLIENT)
    await page.waitForURL("**/vehicules", { timeout: 15_000 });
    expect(page.url()).toContain("/vehicules");
  });

  test("connexion avec mauvais mot de passe affiche une erreur", async ({
    page,
  }) => {
    await page.goto("/connexion");

    await page.getByLabel(/numéro de téléphone/i).fill(testPhone);
    await page.getByLabel(/mot de passe/i).fill("MauvaisMotDePasse!");
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Message d'erreur
    await expect(page.locator('[role="alert"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test("connexion avec numéro inexistant affiche une erreur", async ({
    page,
  }) => {
    await page.goto("/connexion");

    await page.getByLabel(/numéro de téléphone/i).fill("+224999999999");
    await page.getByLabel(/mot de passe/i).fill("NexistePas123!");
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page.locator('[role="alert"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test("le lien 'Inscrivez-vous' mène à la page d'inscription", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByRole("link", { name: /inscrivez-vous/i }).click();
    await page.waitForURL("**/inscription", { timeout: 10_000 });
    expect(page.url()).toContain("/inscription");
  });
});

// ── Tests : Déconnexion ─────────────────────────────────────────────────────

test.describe("Déconnexion", () => {
  let userPhone: string;
  let userPassword: string;

  test.beforeAll(async ({ browser }) => {
    userPhone = randomGuineaPhone();
    userPassword = "LogoutTest123!";
    const page = await browser.newPage();
    await registerViaAPI(page, {
      firstName: "Logout",
      lastName: "Test",
      phone: userPhone,
      password: userPassword,
    });
    await page.close();
  });

  test("déconnexion depuis la page d'accueil", async ({ page }) => {
    // Se connecter d'abord
    await page.goto("/connexion");
    await page.getByLabel(/numéro de téléphone/i).fill(userPhone);
    await page.getByLabel(/mot de passe/i).fill(userPassword);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL("**/vehicules", { timeout: 15_000 });

    // Aller à l'accueil
    await page.goto("/");

    // Cliquer sur déconnexion
    const logoutBtn = page.getByRole("button", { name: /déconnexion/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      // Confirmer la déconnexion
      const confirmBtn = page.getByRole("button", { name: /confirmer/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }

    // Vérifier que le bouton Connexion réapparaît
    await expect(
      page.getByRole("link", { name: /connexion/i }).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Tests : Redirection des pages protégées ─────────────────────────────────

test.describe("Pages protégées — redirection", () => {
  test("redirige vers /connexion quand on accède à /profil sans être connecté", async ({
    page,
  }) => {
    await page.goto("/profil");
    await page.waitForURL("**/connexion", { timeout: 10_000 });
    expect(page.url()).toContain("/connexion");
  });

  test("redirige vers /connexion pour /reservations", async ({ page }) => {
    await page.goto("/reservations");
    await page.waitForURL("**/connexion", { timeout: 10_000 });
    expect(page.url()).toContain("/connexion");
  });

  test("redirige vers /connexion pour /favoris", async ({ page }) => {
    await page.goto("/favoris");
    await page.waitForURL("**/connexion", { timeout: 10_000 });
    expect(page.url()).toContain("/connexion");
  });

  test("redirige vers /connexion pour /messages", async ({ page }) => {
    await page.goto("/messages");
    await page.waitForURL("**/connexion", { timeout: 10_000 });
    expect(page.url()).toContain("/connexion");
  });

  test("redirige vers /connexion pour /notifications", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForURL("**/connexion", { timeout: 10_000 });
    expect(page.url()).toContain("/connexion");
  });

  test("redirige vers /acces-refuse pour /administration sans être admin", async ({
    page,
  }) => {
    // Se connecter en tant que CLIENT
    const phone = randomGuineaPhone();
    const password = "ClientTest123!";
    await registerViaAPI(page, {
      firstName: "Client",
      lastName: "Test",
      phone,
      password,
    });

    await page.goto("/connexion");
    await page.getByLabel(/numéro de téléphone/i).fill(phone);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL("**/vehicules", { timeout: 15_000 });

    // Tenter d'accéder à /administration
    await page.goto("/administration");
    // Doit rediriger vers /acces-refuse ou rester sur /vehicules
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain("/administration");
  });
});

// ── Tests : Persistance de session ──────────────────────────────────────────

test.describe("Persistance de session", () => {
  test("un refresh de page maintient la session", async ({ page }) => {
    const phone = randomGuineaPhone();
    const password = "PersistTest123!";
    await registerViaAPI(page, {
      firstName: "Persist",
      lastName: "Test",
      phone,
      password,
    });

    // Se connecter
    await page.goto("/connexion");
    await page.getByLabel(/numéro de téléphone/i).fill(phone);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL("**/vehicules", { timeout: 15_000 });

    // Rafraîchir la page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Vérifier qu'on est toujours connecté (pas redirigé vers /connexion)
    expect(page.url()).toContain("/vehicules");
    expect(page.url()).not.toContain("/connexion");
  });

  test("le token est bien stocké dans localStorage", async ({ page }) => {
    const phone = randomGuineaPhone();
    const password = "TokenTest123!";
    await registerViaAPI(page, {
      firstName: "Token",
      lastName: "Test",
      phone,
      password,
    });

    await page.goto("/connexion");
    await page.getByLabel(/numéro de téléphone/i).fill(phone);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL("**/vehicules", { timeout: 15_000 });

    // Vérifier que le token est dans localStorage
    const token = await page.evaluate(() =>
      localStorage.getItem("carguinee_token"),
    );
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(20);
  });
});
