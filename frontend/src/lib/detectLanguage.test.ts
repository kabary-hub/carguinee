import { describe, expect, it } from "vitest";
import { detectLanguage } from "./detectLanguage";

describe("detectLanguage", () => {
  // ── Français détecté ──────────────────────────────────────────────────────

  it("détecte le français avec des accents", () => {
    expect(detectLanguage("Voici un véhicule très élégant à vendre")).toBe("fr");
  });

  it("détecte le français avec des mots-outils", () => {
    expect(detectLanguage("Le chat est sur la table avec le chien")).toBe("fr");
  });

  it("détecte le français même en majuscules", () => {
    expect(detectLanguage("BONJOUR, COMMENT ALLEZ-VOUS AUJOURD'HUI")).toBe("fr");
  });

  it("détecte un texte 100% français", () => {
    expect(detectLanguage("Je suis très content de vous rencontrer ce matin")).toBe("fr");
  });

  it("détecte le français avec des mots comme 'c'est', 'n'est'", () => {
    expect(detectLanguage("C'est une bonne idée, n'est-ce pas ?")).toBe("fr");
  });

  // ── Anglais détecté ───────────────────────────────────────────────────────

  it("détecte l'anglais", () => {
    expect(detectLanguage("The car is available for rent today")).toBe("en");
  });

  it("détecte l'anglais technique", () => {
    expect(detectLanguage("TypeScript is a typed superset of JavaScript")).toBe("en");
  });

  it("détecte l'anglais avec des mots anglais seuls", () => {
    expect(detectLanguage("Hello world this is a test")).toBe("en");
  });

  // ── Cas limites ────────────────────────────────────────────────────────────

  it("texte vide retourne 'en' par défaut", () => {
    expect(detectLanguage("")).toBe("en");
  });

  it("un seul mot français retourne 'fr'", () => {
    expect(detectLanguage("bonjour")).toBe("fr");
  });

  it("un seul mot anglais retourne 'en'", () => {
    expect(detectLanguage("hello")).toBe("en");
  });

  it("texte mixte avec >30% français retourne 'fr'", () => {
    expect(detectLanguage("Le meeting est dans la room avec le manager")).toBe("fr");
  });

  it("texte avec des chiffres et ponctuation", () => {
    expect(detectLanguage("Le prix est de 500.000 GNF pour 3 jours")).toBe("fr");
  });

  it("texte avec caractères spéciaux", () => {
    expect(detectLanguage("Ça va bien, merci beaucoup !")).toBe("fr");
  });
});
