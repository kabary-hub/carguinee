import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGuineaPhone } from "./phone.js";

// ── Formats valides ──────────────────────────────────────────────────────────

test("normalise un numéro avec préfixe +224", () => {
  assert.equal(normalizeGuineaPhone("+224123456789"), "+224123456789");
});

test("normalise un numéro avec préfixe 00224", () => {
  assert.equal(normalizeGuineaPhone("00224123456789"), "+224123456789");
});

test("normalise un numéro à 9 chiffres (format local)", () => {
  assert.equal(normalizeGuineaPhone("123456789"), "+224123456789");
});

test("supprime les espaces dans le numéro", () => {
  assert.equal(normalizeGuineaPhone("+224 123 456 789"), "+224123456789");
});

test("supprime les parenthèses et tirets", () => {
  assert.equal(normalizeGuineaPhone("+224 (123) 456-789"), "+224123456789");
});

test("supprime les points", () => {
  assert.equal(normalizeGuineaPhone("+224.123.456.789"), "+224123456789");
});

// ── Numéros invalides ────────────────────────────────────────────────────────

test("rejette un numéro +224 avec trop de chiffres", () => {
  assert.throws(() => normalizeGuineaPhone("+2241234567890"), /invalide/);
});

test("rejette un numéro +224 avec pas assez de chiffres", () => {
  assert.throws(() => normalizeGuineaPhone("+22412345"), /invalide/);
});

test("rejette un format non guinéen", () => {
  assert.throws(() => normalizeGuineaPhone("+33612345678"), /guinéen/);
});

test("rejette une chaîne vide", () => {
  assert.throws(() => normalizeGuineaPhone(""), /guinéen/);
});

test("rejette des lettres", () => {
  assert.throws(() => normalizeGuineaPhone("abcdefghij"), /guinéen/);
});
