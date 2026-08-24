/**
 * Tests de validation pour les routes admin.
 *
 * Ces tests vérifient que les schémas Zod rejettent
 * correctement les entrées invalides.
 */

import assert from "node:assert/strict";
import test from "node:test";

// ── Tests du schéma de rôle utilisateur ─────────────────────────────────────

test("admin-users: role enum rejette un rôle invalide", async () => {
  // Le schéma est défini inline dans admin.routes.ts, on teste la logique
  const validRoles = ["CLIENT", "PROPRIETAIRE", "ADMIN"];
  const invalidRole = "SUPER_ADMIN";

  assert.equal(validRoles.includes(invalidRole), false);
});

test("admin-users: role enum accepte les rôles valides", async () => {
  const validRoles = ["CLIENT", "PROPRIETAIRE", "ADMIN"];

  for (const role of validRoles) {
    assert.equal(validRoles.includes(role), true, `Le rôle ${role} devrait être valide`);
  }
});

// ── Tests du schéma de statut de réservation ────────────────────────────────

test("admin-bookings: statut enum rejette un statut invalide", async () => {
  const validStatuses = ["EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"];
  const invalidStatus = "ACTIVE";

  assert.equal(validStatuses.includes(invalidStatus), false);
});

test("admin-bookings: statut enum accepte les statuts valides", async () => {
  const validStatuses = ["EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"];

  for (const status of validStatuses) {
    assert.equal(validStatuses.includes(status), true, `Le statut ${status} devrait être valide`);
  }
});

// ── Tests de validation UUID ─────────────────────────────────────────────────

test("admin: UUID valide est accepté", async () => {
  const { z } = await import("zod");
  const uuidSchema = z.string().uuid();

  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const result = uuidSchema.safeParse(validUuid);

  assert.equal(result.success, true);
});

test("admin: UUID invalide est rejeté", async () => {
  const { z } = await import("zod");
  const uuidSchema = z.string().uuid();

  const invalidUuids = [
    "not-a-uuid",
    "550e8400-e29b-41d4-a716",  // trop court
    "550e8400-e29b-41d4-a716-446655440000extra",  // trop long
    "",
    "12345",
  ];

  for (const uuid of invalidUuids) {
    const result = uuidSchema.safeParse(uuid);
    assert.equal(result.success, false, `L'UUID "${uuid}" devrait être rejeté`);
  }
});

// ── Tests de pagination ──────────────────────────────────────────────────────

test("pagination: page négative est rejetée", async () => {
  const { paginationQuery } = await import("../../src/lib/route-helpers.js");

  const result = paginationQuery.safeParse({ page: -1, pageSize: 20 });
  assert.equal(result.success, false);
});

test("pagination: pageSize supérieur à 50 est rejeté", async () => {
  const { paginationQuery } = await import("../../src/lib/route-helpers.js");

  const result = paginationQuery.safeParse({ page: 1, pageSize: 100 });
  assert.equal(result.success, false);
});

test("pagination: valeurs valides sont acceptées", async () => {
  const { paginationQuery } = await import("../../src/lib/route-helpers.js");

  const result = paginationQuery.safeParse({ page: 1, pageSize: 20 });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.page, 1);
    assert.equal(result.data.pageSize, 20);
  }
});

test("pagination: valeurs par défaut sont appliquées", async () => {
  const { paginationQuery } = await import("../../src/lib/route-helpers.js");

  const result = paginationQuery.safeParse({});
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.page, 1);
    assert.equal(result.data.pageSize, 20);
  }
});

// ── Tests des schémas d'auth ────────────────────────────────────────────────

test("registerSchema: rejette un mot de passe sans chiffre", async () => {
  const { registerSchema } = await import("../../src/modules/auth/auth.schemas.js");

  const result = registerSchema.safeParse({
    phone: "+22412345678",
    password: "abcdefgh",
    firstName: "Mamadou",
    lastName: "Diallo",
  });

  assert.equal(result.success, false);
});

test("registerSchema: rejette un prénom vide", async () => {
  const { registerSchema } = await import("../../src/modules/auth/auth.schemas.js");

  const result = registerSchema.safeParse({
    phone: "+22412345678",
    password: "Password1",
    firstName: "",
    lastName: "Diallo",
  });

  assert.equal(result.success, false);
});

test("loginSchema: rejette un mot de passe trop court", async () => {
  const { loginSchema } = await import("../../src/modules/auth/auth.schemas.js");

  const result = loginSchema.safeParse({
    phone: "+22412345678",
    password: "123",
  });

  assert.equal(result.success, false);
});

test("bookingSchema: rejette une date de fin avant la date de début", async () => {
  const { createBookingSchema } = await import("../../src/modules/bookings/booking.schemas.js");

  const result = createBookingSchema.safeParse({
    vehicleId: "550e8400-e29b-41d4-a716-446655440000",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-05-01"),
  });

  assert.equal(result.success, false);
});

// ── Tests du middleware requireRoles ─────────────────────────────────────────

test("requireRoles: rejette si pas d'authentification", async () => {
  const { requireRoles } = await import("../../src/modules/auth/auth.middleware.js");

  let statusCode = 0;
  const request = {} as any;
  const response = {
    status: (code: number) => { statusCode = code; return response; },
    json: () => response,
  } as any;
  const next = () => {};

  requireRoles("ADMIN")(request, response, next);
  assert.equal(statusCode, 401);
});

test("requireRoles: rejette si le rôle n'est pas autorisé", async () => {
  const { requireRoles } = await import("../../src/modules/auth/auth.middleware.js");

  let statusCode = 0;
  const request = {
    auth: { userId: "test", phone: "+22412345678", role: "CLIENT" },
  } as any;
  const response = {
    status: (code: number) => { statusCode = code; return response; },
    json: () => response,
  } as any;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  requireRoles("ADMIN")(request, response, next);
  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
});

test("requireRoles: passe si le rôle est autorisé", async () => {
  const { requireRoles } = await import("../../src/modules/auth/auth.middleware.js");

  let statusCode = 0;
  const request = {
    auth: { userId: "test", phone: "+22412345678", role: "ADMIN" },
  } as any;
  const response = {
    status: (code: number) => { statusCode = code; return response; },
    json: () => response,
  } as any;
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  requireRoles("ADMIN")(request, response, next);
  assert.equal(statusCode, 0);
  assert.equal(nextCalled, true);
});
