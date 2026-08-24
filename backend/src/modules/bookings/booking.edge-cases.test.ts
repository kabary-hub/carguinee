import assert from "node:assert/strict";
import test from "node:test";
import { rentalDays, rentalTotalAmount } from "./booking.calculations.js";

// ── rentalDays edge cases ────────────────────────────────────────────────────

test("même jour = 1 jour minimum", () => {
  const date = new Date("2026-03-15T12:00:00.000Z");
  assert.equal(rentalDays(date, date), 1);
});

test("une nuit = 1 jour", () => {
  const start = new Date("2026-03-15T18:00:00.000Z");
  const end = new Date("2026-03-16T08:00:00.000Z");
  assert.equal(rentalDays(start, end), 1);
});

test("deux nuits = 2 jours", () => {
  const start = new Date("2026-03-15T18:00:00.000Z");
  const end = new Date("2026-03-17T08:00:00.000Z");
  assert.equal(rentalDays(start, end), 2);
});

test("une semaine complète = 7 jours", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-08T00:00:00.000Z");
  assert.equal(rentalDays(start, end), 7);
});

test("mois de février non bissextile = 28 jours", () => {
  const start = new Date("2025-02-01T00:00:00.000Z");
  const end = new Date("2025-03-01T00:00:00.000Z");
  assert.equal(rentalDays(start, end), 28);
});

test("mois de février bissextile = 29 jours", () => {
  const start = new Date("2024-02-01T00:00:00.000Z");
  const end = new Date("2024-03-01T00:00:00.000Z");
  assert.equal(rentalDays(start, end), 29);
});

test("end avant start retourne 1 (minimum)", () => {
  const start = new Date("2026-03-20T00:00:00.000Z");
  const end = new Date("2026-03-15T00:00:00.000Z");
  assert.equal(rentalDays(start, end), 1);
});

// ── rentalTotalAmount edge cases ─────────────────────────────────────────────

test("tarif à zéro = total zéro", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-05T00:00:00.000Z");
  assert.equal(rentalTotalAmount(start, end, 0), 0);
});

test("1 jour × 100000 GNF = 100000 GNF", () => {
  const date = new Date("2026-06-15T10:00:00.000Z");
  assert.equal(rentalTotalAmount(date, date, 100_000), 100_000);
});

test("10 jours × 500000 GNF = 5000000 GNF", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-11T00:00:00.000Z");
  assert.equal(rentalTotalAmount(start, end, 500_000), 5_000_000);
});

test("tarif élevé = calcul correct", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-02T00:00:00.000Z");
  assert.equal(rentalTotalAmount(start, end, 5_000_000), 5_000_000);
});
