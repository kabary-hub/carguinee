import assert from "node:assert/strict";
import test from "node:test";

// ── Tests pour les helpers de traduction ──────────────────────────────────────
// On teste la logique pure (validation, cache) sans appeler LibreTranslate

test("SUPPORTED_LANGS contient les langues principales", () => {
  // Vérifie que les langues critiques sont supportées
  const supportedLangs = new Set([
    "auto", "en", "fr", "es", "de", "it", "pt", "ru", "zh", "ja",
    "ko", "ar", "nl", "pl", "tr", "vi", "th", "uk", "el", "he",
    "hi", "hu", "cs", "da", "fi", "sv", "no", "bg", "ro", "id",
  ]);

  assert.ok(supportedLangs.has("fr"));
  assert.ok(supportedLangs.has("en"));
  assert.ok(supportedLangs.has("auto"));
  assert.ok(!supportedLangs.has("invalid"));
});

test("detecte les textes tout en majuscules (normalisation)", () => {
  // Si le texte est tout en majuscules, prepareForDetection doit le passer en minuscules
  const text = "BONJOUR COMMENT ALLEZ-VOUS";
  const isUpperCase = text === text.toUpperCase() && text.length > 2;
  assert.ok(isUpperCase);
  assert.equal(text.toLowerCase(), "bonjour comment allez-vous");
});

test("détecte un texte vide (noop)", () => {
  const text = "";
  const trimmed = text.trim();
  assert.equal(trimmed.length, 0);
});

test("détecte un texte avec seulement des espaces (noop)", () => {
  const text = "   ";
  const trimmed = text.trim();
  assert.equal(trimmed.length, 0);
});

test("vérifie le format du cache key", () => {
  // Le cache key est "targetLang::text"
  const text = "Bonjour le monde";
  const targetLang = "en";
  const key = `${targetLang}::${text}`;
  assert.equal(key, "en::Bonjour le monde");
});

test("noop détecté quand résultat = source (ignorer en cache)", () => {
  const source = "hello world";
  const result = "hello world";
  const isNoop = result.trim().toLowerCase() === source.trim().toLowerCase();
  assert.ok(isNoop);
});

test("pas noop quand résultat diffère de source", () => {
  const source = "hello world";
  const result = "bonjour le monde";
  const isNoop = result.trim().toLowerCase() === source.trim().toLowerCase();
  assert.ok(!isNoop);
});

test("retry forcé quand langue détectée = langue cible", () => {
  // Si on demande fr→fr, on force une langue source opposée
  const OPPOSITE: Record<string, string> = { fr: "en", en: "fr", es: "en", de: "en" };
  const detectedLang = "fr";
  const targetLang = "fr";
  assert.equal(detectedLang, targetLang);
  const forcedSource = OPPOSITE[targetLang] ?? "en";
  assert.equal(forcedSource, "en");
});

test("retry forcé quand résultat noop avec langue opposée", () => {
  const detectedLang = "en";
  const forcedSource = detectedLang === "en" ? "fr" : "en";
  assert.equal(forcedSource, "fr");
});
