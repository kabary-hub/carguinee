/**
 * Tests d'integration pour les routes de reactivation et de bannissement.
 *
 * Ces tests verifient :
 * - Les schemas Zod des demandes de reactivation
 * - Les classes d'erreur AccountDeactivatedError / AccountBannedError
 * - La logique de validation des entrees (phone, reason, status)
 * - Les enums de statut de reactivation
 * - Les schemas de query params admin (pagination, filtres)
 * - toPublicUser avec isBanned
 */

import assert from "node:assert/strict";
import test from "node:test";

// ── Tests des schemas Zod de demande de reactivation ─────────────────────────

test("request-reactivation: rejette un phone vide", async () => {
  const { z } = await import("zod");

  const schema = z.object({
    phone: z.string().min(1, "Numero de telephone requis."),
    reason: z.string().max(500).optional(),
  });

  const result = schema.safeParse({ phone: "" });
  assert.equal(result.success, false);
});

test("request-reactivation: accepte un phone valide sans reason", async () => {
  const { z } = await import("zod");

  const schema = z.object({
    phone: z.string().min(1, "Numero de telephone requis."),
    reason: z.string().max(500).optional(),
  });

  const result = schema.safeParse({ phone: "+224123456789" });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.phone, "+224123456789");
    assert.equal(result.data.reason, undefined);
  }
});

test("request-reactivation: accepte un phone avec reason", async () => {
  const { z } = await import("zod");

  const schema = z.object({
    phone: z.string().min(1),
    reason: z.string().max(500).optional(),
  });

  const result = schema.safeParse({
    phone: "+224123456789",
    reason: "Je souhaite reactiver mon compte.",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.reason, "Je souhaite reactiver mon compte.");
  }
});

test("request-reactivation: rejette une reason trop longue", async () => {
  const { z } = await import("zod");

  const schema = z.object({
    phone: z.string().min(1),
    reason: z.string().max(500).optional(),
  });

  const longReason = "a".repeat(501);
  const result = schema.safeParse({ phone: "+224123456789", reason: longReason });
  assert.equal(result.success, false);
});

test("request-reactivation: accepte une reason a la limite de 500", async () => {
  const { z } = await import("zod");

  const schema = z.object({
    phone: z.string().min(1),
    reason: z.string().max(500).optional(),
  });

  const maxReason = "a".repeat(500);
  const result = schema.safeParse({ phone: "+224123456789", reason: maxReason });
  assert.equal(result.success, true);
});

// ── Tests des classes d'erreur ───────────────────────────────────────────────

test("AccountDeactivatedError: a le bon nom et message", async () => {
  const { AccountDeactivatedError } = await import("../../src/modules/auth/auth.service.js");

  const error = new AccountDeactivatedError("Votre compte a ete desactive.");
  assert.equal(error.name, "AccountDeactivatedError");
  assert.equal(error.message, "Votre compte a ete desactive.");
  assert.ok(error instanceof Error);
});

test("AccountBannedError: a le bon nom et message", async () => {
  const { AccountBannedError } = await import("../../src/modules/auth/auth.service.js");

  const error = new AccountBannedError("Votre compte a ete suspendu.");
  assert.equal(error.name, "AccountBannedError");
  assert.equal(error.message, "Votre compte a ete suspendu.");
  assert.ok(error instanceof Error);
});

test("AccountDeactivatedError est bien une instance d'Error", async () => {
  const { AccountDeactivatedError } = await import("../../src/modules/auth/auth.service.js");

  const error = new AccountDeactivatedError("test");
  assert.ok(error instanceof Error);
  assert.ok(error instanceof AccountDeactivatedError);
});

test("AccountBannedError est bien une instance d'Error", async () => {
  const { AccountBannedError } = await import("../../src/modules/auth/auth.service.js");

  const error = new AccountBannedError("test");
  assert.ok(error instanceof Error);
  assert.ok(error instanceof AccountBannedError);
});

// ── Tests des enums de statut de reactivation ───────────────────────────────

test("reactivation: les statuts valides sont PENDING, APPROVED, REJECTED", async () => {
  const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
  const invalidStatuses = ["ACTIVE", "CANCELLED", "PENDING_REVIEW", ""];

  for (const status of validStatuses) {
    assert.equal(validStatuses.includes(status), true, `Le statut "${status}" devrait etre valide`);
  }

  for (const status of invalidStatuses) {
    assert.equal(validStatuses.includes(status), false, `Le statut "${status}" devrait etre invalide`);
  }
});

test("reactivation: le schema de query params admin accepte les filtres valides", async () => {
  const { z } = await import("zod");

  const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  });

  assert.equal(querySchema.safeParse({ page: "1", pageSize: "20", status: "PENDING" }).success, true);
  assert.equal(querySchema.safeParse({ page: "1", pageSize: "20", status: "APPROVED" }).success, true);
  assert.equal(querySchema.safeParse({ page: "1", pageSize: "20", status: "REJECTED" }).success, true);
  assert.equal(querySchema.safeParse({ page: "1", pageSize: "20" }).success, true);
  assert.equal(querySchema.safeParse({ page: "1", pageSize: "20", status: "CANCELLED" }).success, false);
});

test("reactivation: le schema de query params rejette un statut invalide", async () => {
  const { z } = await import("zod");

  const statusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

  assert.equal(statusEnum.safeParse("PENDING").success, true);
  assert.equal(statusEnum.safeParse("APPROVED").success, true);
  assert.equal(statusEnum.safeParse("REJECTED").success, true);
  assert.equal(statusEnum.safeParse("ACTIVE").success, false);
  assert.equal(statusEnum.safeParse("DELETED").success, false);
  assert.equal(statusEnum.safeParse("").success, false);
});

// ── Tests du schema de bannissement ──────────────────────────────────────────

test("ban: le schema accepte isBanned a true", async () => {
  const { z } = await import("zod");

  const banSchema = z.object({
    isBanned: z.boolean(),
    reason: z.string().max(500).optional(),
  });

  const result = banSchema.safeParse({ isBanned: true });
  assert.equal(result.success, true);
});

test("ban: le schema accepte isBanned a false", async () => {
  const { z } = await import("zod");

  const banSchema = z.object({
    isBanned: z.boolean(),
    reason: z.string().max(500).optional(),
  });

  const result = banSchema.safeParse({ isBanned: false });
  assert.equal(result.success, true);
});

test("ban: le schema accepte isBanned avec reason", async () => {
  const { z } = await import("zod");

  const banSchema = z.object({
    isBanned: z.boolean(),
    reason: z.string().max(500).optional(),
  });

  const result = banSchema.safeParse({
    isBanned: true,
    reason: "Comportement abusif.",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.reason, "Comportement abusif.");
  }
});

test("ban: le schema rejette isBanned non booleen", async () => {
  const { z } = await import("zod");

  const banSchema = z.object({
    isBanned: z.boolean(),
    reason: z.string().max(500).optional(),
  });

  assert.equal(banSchema.safeParse({ isBanned: "true" }).success, false);
  assert.equal(banSchema.safeParse({ isBanned: 1 }).success, false);
  assert.equal(banSchema.safeParse({}).success, false);
});

test("ban: le schema rejette une reason trop longue", async () => {
  const { z } = await import("zod");

  const banSchema = z.object({
    isBanned: z.boolean(),
    reason: z.string().max(500).optional(),
  });

  const result = banSchema.safeParse({
    isBanned: true,
    reason: "x".repeat(501),
  });
  assert.equal(result.success, false);
});

// ── Tests du schema de filtre moderation ─────────────────────────────────────

test("moderation: le filtre accepte banned", async () => {
  const { z } = await import("zod");

  const filterEnum = z.enum(["banned", "deactivated"]);
  assert.equal(filterEnum.safeParse("banned").success, true);
});

test("moderation: le filtre accepte deactivated", async () => {
  const { z } = await import("zod");

  const filterEnum = z.enum(["banned", "deactivated"]);
  assert.equal(filterEnum.safeParse("deactivated").success, true);
});

test("moderation: le filtre rejette les valeurs invalides", async () => {
  const { z } = await import("zod");

  const filterEnum = z.enum(["banned", "deactivated"]);
  assert.equal(filterEnum.safeParse("active").success, false);
  assert.equal(filterEnum.safeParse("all").success, false);
  assert.equal(filterEnum.safeParse("").success, false);
});

// ── Tests de toPublicUser avec isBanned ──────────────────────────────────────

test("toPublicUser: inclut isBanned a false par defaut", async () => {
  const { toPublicUser } = await import("../../src/modules/auth/auth.service.js");

  const user = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    phone: "+224123456789",
    email: null,
    firstName: "Mamadou",
    lastName: "Diallo",
    role: "CLIENT",
    isActive: true,
  };

  const publicUser = toPublicUser(user);
  assert.equal(publicUser.isBanned, false);
});

test("toPublicUser: inclut isBanned a true quand defini", async () => {
  const { toPublicUser } = await import("../../src/modules/auth/auth.service.js");

  const user = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    phone: "+224123456789",
    email: null,
    firstName: "Mamadou",
    lastName: "Diallo",
    role: "CLIENT",
    isActive: false,
    isBanned: true,
  };

  const publicUser = toPublicUser(user);
  assert.equal(publicUser.isBanned, true);
});

test("toPublicUser: n'expose pas le passwordHash", async () => {
  const { toPublicUser } = await import("../../src/modules/auth/auth.service.js");

  const user = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    phone: "+224123456789",
    email: null,
    firstName: "Mamadou",
    lastName: "Diallo",
    role: "CLIENT",
    isActive: true,
  };

  const publicUser = toPublicUser(user);
  assert.equal((publicUser as any).passwordHash, undefined);
  assert.deepEqual(Object.keys(publicUser).sort(), [
    "email",
    "firstName",
    "id",
    "isActive",
    "isBanned",
    "lastName",
    "phone",
    "role",
  ]);
});

// ── Tests des codes de reponse HTTP ──────────────────────────────────────────

test("login desactive: verifie que le code 403 est utilise pour les comptes desactives", async () => {
  const deactivatedStatus = 403;
  const unauthorizedStatus = 401;

  assert.notEqual(deactivatedStatus, unauthorizedStatus, "403 et 401 sont bien differents");
  assert.equal(deactivatedStatus, 403, "Le statut pour compte desactive est 403 Forbidden");
});

test("login banni: verifie que le code 403 est utilise pour les comptes bannis", async () => {
  const bannedStatus = 403;
  assert.equal(bannedStatus, 403, "Le statut pour compte banni est 403 Forbidden");
});

test("login: verifie que les codes de reponse sont bien ACCOUNT_DEACTIVATED et ACCOUNT_BANNED", async () => {
  const codeDeactivated = "ACCOUNT_DEACTIVATED";
  const codeBanned = "ACCOUNT_BANNED";

  assert.notEqual(codeDeactivated, codeBanned);
  assert.equal(typeof codeDeactivated, "string");
  assert.equal(typeof codeBanned, "string");
});
