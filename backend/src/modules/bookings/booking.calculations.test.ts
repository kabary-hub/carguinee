import assert from "node:assert/strict";
import test from "node:test";
import { rentalDays, rentalTotalAmount } from "./booking.calculations.js";

test("calcule le nombre de jours et le total d’une location", () => {
  const start = new Date("2026-08-20T08:00:00.000Z");
  const end = new Date("2026-08-23T08:00:00.000Z");

  assert.equal(rentalDays(start, end), 3);
  assert.equal(rentalTotalAmount(start, end, 450_000), 1_350_000);
});

test("compte au minimum une journée de location", () => {
  const date = new Date("2026-08-20T08:00:00.000Z");
  assert.equal(rentalDays(date, date), 1);
});
