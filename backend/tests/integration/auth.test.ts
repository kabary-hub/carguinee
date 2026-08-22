import assert from "node:assert/strict";
import test from "node:test";

/**
 * Tests d'intégration pour les routes d'authentification.
 * Ces tests vérifient la logique métier (schemas, validation, etc.)
 * sans nécessiter de base de données.
 */

// ── Tests de validation Zod ─────────────────────────────────────────────────

test("loginSchema: rejette un téléphone vide", async () => {
  const { loginSchema } = await import("../../src/modules/auth/auth.schemas.js");
  const result = loginSchema.safeParse({ phone: "", password: "12345678" });
  assert.equal(result.success, false);
});

test("loginSchema: rejette un mot de passe trop court", async () => {
  const { loginSchema } = await import("../../src/modules/auth/auth.schemas.js");
  const result = loginSchema.safeParse({ phone: "+22412345678", password: "123" });
  assert.equal(result.success, false);
});

test("loginSchema: accepte des données valides", async () => {
  const { loginSchema } = await import("../../src/modules/auth/auth.schemas.js");
  const result = loginSchema.safeParse({ phone: "+22412345678", password: "12345678" });
  assert.equal(result.success, true);
});

test("registerSchema: rejette un prénom vide", async () => {
  const { registerSchema } = await import("../../src/modules/auth/auth.schemas.js");
  const result = registerSchema.safeParse({
    phone: "+22412345678",
    password: "12345678a",
    firstName: "",
    lastName: "Diallo",
  });
  assert.equal(result.success, false);
});

test("registerSchema: rejette un mot de passe sans lettre", async () => {
  const { registerSchema } = await import("../../src/modules/auth/auth.schemas.js");
  const result = registerSchema.safeParse({
    phone: "+22412345678",
    password: "12345678",
    firstName: "Mamadou",
    lastName: "Diallo",
  });
  assert.equal(result.success, false);
});

test("registerSchema: accepte des données complètes", async () => {
  const { registerSchema } = await import("../../src/modules/auth/auth.schemas.js");
  const result = registerSchema.safeParse({
    phone: "+22412345678",
    email: "test@example.com",
    password: "Password1",
    firstName: "Mamadou",
    lastName: "Diallo",
  });
  assert.equal(result.success, true);
});

// ── Tests du helper normalizeGuineaPhone ────────────────────────────────────

test("normalizeGuineaPhone: formate un numéro guinéen 9 chiffres", async () => {
  const { normalizeGuineaPhone } = await import("../../src/modules/auth/phone.js");
  assert.equal(normalizeGuineaPhone("123456789"), "+224123456789");
  assert.equal(normalizeGuineaPhone("+224123456789"), "+224123456789");
});

test("normalizeGuineaPhone: rejette un numéro trop court", async () => {
  const { normalizeGuineaPhone } = await import("../../src/modules/auth/phone.js");
  assert.throws(() => normalizeGuineaPhone("12345678"));
});

// ── Tests du middleware requireAuth ──────────────────────────────────────────

test("requireAuth: rejette sans header Authorization", async () => {
  const { requireAuth } = await import("../../src/modules/auth/auth.middleware.js");
  let statusCode = 0;
  let responseBody = "";
  const request = { header: () => undefined } as any;
  const response = {
    status: (code: number) => { statusCode = code; return response; },
    json: (body: any) => { responseBody = JSON.stringify(body); return response; },
  } as any;
  const next = () => {};

  requireAuth(request, response, next);
  assert.equal(statusCode, 401);
  assert.ok(responseBody.includes("Jeton"));
});
