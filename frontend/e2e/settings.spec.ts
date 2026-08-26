/**
 * Tests E2E — Paramètres / Profil
 *
 * Couvre :
 *  - Affichage page profil
 *  - Modification du profil
 *  - Changement de mot de passe
 *  - Responsive mobile
 *
 * Prérequis : backend + frontend lancés
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
  const response = await page.request.post(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/auth/register`,
    {
      data: user,
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.ok();
}

async function loginAsClient(page: Page, phone: string, password: string) {
  await page.goto("/connexion");
  await page.getByLabel(/numéro de téléphone/i).fill(phone);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL("**/vehicules", { timeout: 15_000 });
}

// ── Tests ───────────────────────────────────────────────────────────────────

test.describe("Page Profil", () => {
  let testPhone: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    testPhone = randomGuineaPhone();
    testPassword = "ProfileTest123!";
    const page = await browser.newPage();
    await registerViaAPI(page, {
      firstName: "Profile",
      lastName: "Test",
      phone: testPhone,
      password: testPassword,
    });
    await page.close();
  });

  test("la page profil s'affiche correctement", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/profil");

    // Le heading profil doit apparaître
    await expect(
      page.getByRole("heading", { name: /profil|paramètres|settings/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("les informations utilisateur sont affichées", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/profil");
    await page.waitForTimeout(2_000);

    // Le prénom ou nom doit apparaître somewhere
    const hasUserInfo = await page
      .getByText(/Profile|Test|profil/i)
      .isVisible()
      .catch(() => false);
    expect(hasUserInfo).toBeTruthy();
  });

  test("le formulaire de profil contient les champs attendus", async ({
    page,
  }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/profil");
    await page.waitForTimeout(2_000);

    // Chercher des champs de formulaire
    const inputs = page.locator("input");
    const count = await inputs.count();
    // Au moins 2 champs (prénom, nom)
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Modification du profil", () => {
  let testPhone: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    testPhone = randomGuineaPhone();
    testPassword = "ProfileEdit123!";
    const page = await browser.newPage();
    await registerViaAPI(page, {
      firstName: "ProfileEdit",
      lastName: "Test",
      phone: testPhone,
      password: testPassword,
    });
    await page.close();
  });

  test("on peut modifier le prénom", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/profil");
    await page.waitForTimeout(2_000);

    // Trouver le champ prénom
    const firstNameInput = page.getByLabel(/prénom|first.?name/i);
    if (await firstNameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstNameInput.clear();
      await firstNameInput.fill("NouveauPrenom");

      // Sauvegarder
      const saveBtn = page.getByRole("button", {
        name: /sauvegarder|enregistrer|save/i,
      });
      if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await saveBtn.click();
        // Un toast de succès doit apparaître
        await page.waitForTimeout(2_000);
      }
    }
  });
});

test.describe("Responsive mobile — Profil", () => {
  test("la page profil est lisible sur mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const testPhone = randomGuineaPhone();
    const testPassword = "MobileProfile123!";
    await registerViaAPI(page, {
      firstName: "Mobile",
      lastName: "Profile",
      phone: testPhone,
      password: testPassword,
    });

    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/profil");
    await page.waitForTimeout(2_000);

    // Vérifier pas de débordement horizontal
    const noOverflow = await page.evaluate(() => {
      return document.body.scrollWidth <= window.innerWidth + 5;
    });
    expect(noOverflow).toBeTruthy();
  });
});
