import assert from "node:assert/strict";
import test from "node:test";
import { isValidTransition } from "./booking.service.js";

// ── Transitions valides ──────────────────────────────────────────────────────

test("EN_ATTENTE → CONFIRMEE est valide", () => {
  assert.equal(isValidTransition("EN_ATTENTE", "CONFIRMEE"), true);
});

test("EN_ATTENTE → REJETEE est valide", () => {
  assert.equal(isValidTransition("EN_ATTENTE", "REJETEE"), true);
});

test("EN_ATTENTE → ANNULEE est valide", () => {
  assert.equal(isValidTransition("EN_ATTENTE", "ANNULEE"), true);
});

test("CONFIRMEE → EN_COURS est valide", () => {
  assert.equal(isValidTransition("CONFIRMEE", "EN_COURS"), true);
});

test("CONFIRMEE → ANNULEE est valide", () => {
  assert.equal(isValidTransition("CONFIRMEE", "ANNULEE"), true);
});

test("EN_COURS → TERMINEE est valide", () => {
  assert.equal(isValidTransition("EN_COURS", "TERMINEE"), true);
});

test("EN_COURS → ANNULEE est valide", () => {
  assert.equal(isValidTransition("EN_COURS", "ANNULEE"), true);
});

// ── Transitions invalides ────────────────────────────────────────────────────

test("EN_ATTENTE → EN_COURS est invalide", () => {
  assert.equal(isValidTransition("EN_ATTENTE", "EN_COURS"), false);
});

test("EN_ATTENTE → TERMINEE est invalide", () => {
  assert.equal(isValidTransition("EN_ATTENTE", "TERMINEE"), false);
});

test("CONFIRMEE → REJETEE est invalide", () => {
  assert.equal(isValidTransition("CONFIRMEE", "REJETEE"), false);
});

test("CONFIRMEE → TERMINEE est invalide", () => {
  assert.equal(isValidTransition("CONFIRMEE", "TERMINEE"), false);
});

test("EN_COURS → CONFIRMEE est invalide", () => {
  assert.equal(isValidTransition("EN_COURS", "CONFIRMEE"), false);
});

test("EN_COURS → REJETEE est invalide", () => {
  assert.equal(isValidTransition("EN_COURS", "REJETEE"), false);
});

// ── États terminaux ──────────────────────────────────────────────────────────

test("TERMINEE ne permet aucune transition", () => {
  assert.equal(isValidTransition("TERMINEE", "EN_ATTENTE"), false);
  assert.equal(isValidTransition("TERMINEE", "CONFIRMEE"), false);
  assert.equal(isValidTransition("TERMINEE", "EN_COURS"), false);
  assert.equal(isValidTransition("TERMINEE", "ANNULEE"), false);
  assert.equal(isValidTransition("TERMINEE", "REJETEE"), false);
});

test("ANNULEE ne permet aucune transition", () => {
  assert.equal(isValidTransition("ANNULEE", "EN_ATTENTE"), false);
  assert.equal(isValidTransition("ANNULEE", "CONFIRMEE"), false);
  assert.equal(isValidTransition("ANNULEE", "EN_COURS"), false);
  assert.equal(isValidTransition("ANNULEE", "TERMINEE"), false);
  assert.equal(isValidTransition("ANNULEE", "REJETEE"), false);
});

test("REJETEE ne permet aucune transition", () => {
  assert.equal(isValidTransition("REJETEE", "EN_ATTENTE"), false);
  assert.equal(isValidTransition("REJETEE", "CONFIRMEE"), false);
  assert.equal(isValidTransition("REJETEE", "EN_COURS"), false);
  assert.equal(isValidTransition("REJETEE", "TERMINEE"), false);
  assert.equal(isValidTransition("REJETEE", "ANNULEE"), false);
});
