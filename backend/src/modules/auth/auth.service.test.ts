import assert from "node:assert/strict";
import test from "node:test";
import { toPublicUser, AccountDeactivatedError, AccountBannedError } from "./auth.service.js";

// ── toPublicUser ─────────────────────────────────────────────────────────────

test("toPublicUser returns all public fields", () => {
  const user = {
    id: "uuid-1",
    phone: "+224123456789",
    email: "test@example.com",
    firstName: "Mamadou",
    lastName: "Diallo",
    role: "CLIENT",
    isActive: true,
    isBanned: false,
  };

  const result = toPublicUser(user);
  assert.equal(result.id, "uuid-1");
  assert.equal(result.phone, "+224123456789");
  assert.equal(result.email, "test@example.com");
  assert.equal(result.firstName, "Mamadou");
  assert.equal(result.lastName, "Diallo");
  assert.equal(result.role, "CLIENT");
  assert.equal(result.isActive, true);
  assert.equal(result.isBanned, false);
});

test("toPublicUser defaults isBanned to false when missing", () => {
  const user = {
    id: "uuid-2",
    phone: "+224987654321",
    email: null,
    firstName: "Fatou",
    lastName: "Camara",
    role: "ADMIN",
    isActive: false,
  };

  const result = toPublicUser(user);
  assert.equal(result.isBanned, false);
  assert.equal(result.email, null);
  assert.equal(result.isActive, false);
});

// ── Error classes ────────────────────────────────────────────────────────────

test("AccountDeactivatedError has correct name and message", () => {
  const error = new AccountDeactivatedError("Votre compte a été désactivé.");
  assert.equal(error.name, "AccountDeactivatedError");
  assert.equal(error.message, "Votre compte a été désactivé.");
  assert.ok(error instanceof Error);
});

test("AccountBannedError has correct name and message", () => {
  const error = new AccountBannedError("Votre compte a été suspendu.");
  assert.equal(error.name, "AccountBannedError");
  assert.equal(error.message, "Votre compte a été suspendu.");
  assert.ok(error instanceof Error);
});
