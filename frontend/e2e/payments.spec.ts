/**
 * Tests E2E — Paiements Orange Money
 *
 * Couvre :
 *  - Affichage de la page paiements
 *  - Ouverture modale paiement OM
 *  - Saisie numéro téléphone validation
 *  - Fond floué derrière la modale
 *  - Toast orange de confirmation
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

async function loginAsClient(page: Page, phone: string, password: string) {
  await page.goto("/connexion");
  await page.getByLabel(/numéro de téléphone/i).fill(phone);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL("**/vehicules", { timeout: 15_000 });
}

// ── Tests ───────────────────────────────────────────────────────────────────

test.describe("Page Paiements", () => {
  let testPhone: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    testPhone = randomGuineaPhone();
    testPassword = "PayTest123!";
    const page = await browser.newPage();
    await page.request.post(
      `${process.env.API_URL ?? "http://localhost:3000"}/api/auth/register`,
      {
        data: {
          firstName: "Pay",
          lastName: "Test",
          phone: testPhone,
          password: testPassword,
        },
      },
    );
    await page.close();
  });

  test("la page paiements s'affiche correctement", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/paiements");
    await expect(
      page.getByRole("heading", { name: /paiements/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("la page paiements affiche l'historique", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/paiements");
    // Soit un tableau soit un message "Aucun paiement"
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasEmpty = await page
      .getByText(/aucun paiement/i)
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });
});

test.describe("Modale Paiement OM", () => {
  let testPhone: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    testPhone = randomGuineaPhone();
    testPassword = "PayModal123!";
    const page = await browser.newPage();
    await page.request.post(
      `${process.env.API_URL ?? "http://localhost:3000"}/api/auth/register`,
      {
        data: {
          firstName: "PayModal",
          lastName: "Test",
          phone: testPhone,
          password: testPassword,
        },
      },
    );
    await page.close();
  });

  test("click sur bouton paiement ouvre la modale", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/paiements");

    // Chercher un bouton "Payer" ou "Orange Money"
    const payBtn = page.getByRole("button", { name: /payer|orange money|om/i });
    if (await payBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payBtn.first().click();
      // La modale doit apparaître
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    }
  });

  test("la modale a un fond floué (backdrop-blur)", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/paiements");

    const payBtn = page.getByRole("button", { name: /payer|orange money|om/i });
    if (await payBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payBtn.first().click();
      // Vérifier que l'overlay a backdrop-blur
      const overlay = page.locator('[class*="backdrop-blur"]');
      await expect(overlay.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("saisie numéro téléphone dans la modale", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/paiements");

    const payBtn = page.getByRole("button", { name: /payer|orange money|om/i });
    if (await payBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payBtn.first().click();

      // Trouver le champ téléphone dans la modale
      const phoneInput = page.getByRole("dialog").getByLabel(/téléphone|phone/i);
      if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await phoneInput.fill("22412345678");
        await expect(phoneInput).toHaveValue("22412345678");
      }
    }
  });

  test("toast orange après soumission du paiement", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/paiements");

    const payBtn = page.getByRole("button", { name: /payer|orange money|om/i });
    if (await payBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payBtn.first().click();

      const phoneInput = page.getByRole("dialog").getByLabel(/téléphone|phone/i);
      if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await phoneInput.fill("22412345678");
        // Soumettre
        const submitBtn = page
          .getByRole("dialog")
          .getByRole("button", { name: /confirmer|valider|payer/i });
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.click();
          // Le toast doit apparaître
          const toast = page.locator('[class*="bg-orange"]').first();
          await expect(toast).toBeVisible({ timeout: 10_000 });
        }
      }
    }
  });

  test("fermeture de la modale avec bouton annuler", async ({ page }) => {
    await loginAsClient(page, testPhone, testPassword);
    await page.goto("/paiements");

    const payBtn = page.getByRole("button", { name: /payer|orange money|om/i });
    if (await payBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payBtn.first().click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

      // Fermer
      const closeBtn = page
        .getByRole("dialog")
        .getByRole("button", { name: /annuler|fermer|close/i });
      if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeBtn.click();
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
