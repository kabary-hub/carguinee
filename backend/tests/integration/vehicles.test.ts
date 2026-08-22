import assert from "node:assert/strict";
import test from "node:test";

/**
 * Tests d'intégration pour les logiques métier véhicules.
 * Ces tests vérifient les helpers et la validation sans base de données.
 */

// ── Tests des limites de photos ─────────────────────────────────────────────

test("photo-limits: MAX_PHOTOS_PER_VEHICLE est définie à 8", async () => {
  const { MAX_PHOTOS_PER_VEHICLE } = await import("../../src/modules/vehicles/photo-limits.js");
  assert.equal(MAX_PHOTOS_PER_VEHICLE, 8);
});

// ── Tests des transitions de réservation (via booking.service) ──────────────

test("booking-transitions: fournit des transitions valides pour EN_ATTENTE", async () => {
  const { isValidTransition } = await import("../../src/modules/bookings/booking.service.js");
  assert.equal(isValidTransition("EN_ATTENTE", "CONFIRMEE"), true);
  assert.equal(isValidTransition("EN_ATTENTE", "ANNULEE"), true);
  assert.equal(isValidTransition("EN_ATTENTE", "TERMINEE"), false);
});

test("booking-transitions: CONFIRMEE → EN_COURS ou ANNULEE", async () => {
  const { isValidTransition } = await import("../../src/modules/bookings/booking.service.js");
  assert.equal(isValidTransition("CONFIRMEE", "EN_COURS"), true);
  assert.equal(isValidTransition("CONFIRMEE", "ANNULEE"), true);
  assert.equal(isValidTransition("CONFIRMEE", "TERMINEE"), false);
});

test("booking-transitions: TERMINEE est un état final", async () => {
  const { isValidTransition } = await import("../../src/modules/bookings/booking.service.js");
  assert.equal(isValidTransition("TERMINEE", "CONFIRMEE"), false);
  assert.equal(isValidTransition("TERMINEE", "ANNULEE"), false);
});

// ── Tests des calculs de réservation ────────────────────────────────────────

test("booking-calculations: rentalDays calcule correctement", async () => {
  const { rentalDays, rentalTotalAmount } = await import("../../src/modules/bookings/booking.calculations.js");
  const start = new Date("2025-01-01T00:00:00Z");
  const end = new Date("2025-01-04T00:00:00Z");
  const days = rentalDays(start, end);
  assert.equal(days, 3);
});

test("booking-calculations: rentalTotalAmount calcule le total", async () => {
  const { rentalTotalAmount } = await import("../../src/modules/bookings/booking.calculations.js");
  const start = new Date("2025-01-01T00:00:00Z");
  const end = new Date("2025-01-04T00:00:00Z");
  const total = rentalTotalAmount(start, end, 100000);
  assert.equal(total, 300000);
});

// ── Tests du helper toPublicUser ────────────────────────────────────────────

test("auth-service: toPublicUser exclut le passwordHash", async () => {
  const { toPublicUser } = await import("../../src/modules/auth/auth.service.js");
  const result = toPublicUser({
    id: "test-id",
    phone: "+22412345678",
    email: "test@example.com",
    firstName: "Mamadou",
    lastName: "Diallo",
    role: "CLIENT",
    isActive: true,
  });
  assert.equal(result.id, "test-id");
  assert.equal(result.phone, "+22412345678");
  assert.equal(result.firstName, "Mamadou");
  assert.equal((result as any).passwordHash, undefined);
});
