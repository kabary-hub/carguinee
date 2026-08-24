import { describe, expect, it } from "vitest";
import { formatGnf, formatDate } from "./domain";

describe("formatGnf", () => {
  it("formate un nombre en Francs guinéens", () => {
    const result = formatGnf(150000);
    expect(result).toContain("150");
    expect(result).toContain("000");
  });

  it("formate 0", () => {
    const result = formatGnf(0);
    expect(result).toContain("0");
  });

  it("formate null/undefined comme 0", () => {
    expect(formatGnf(null)).toContain("0");
    expect(formatGnf(undefined)).toContain("0");
  });

  it("formate un grand nombre", () => {
    const result = formatGnf(5000000);
    expect(result).toContain("5");
    expect(result).toContain("000");
  });

  it("formate un nombre décimal (arrondi)", () => {
    const result = formatGnf(12345.67);
    expect(result).toBeDefined();
  });
});

describe("formatDate", () => {
  it("formate une date ISO", () => {
    const result = formatDate("2024-06-15T10:30:00.000Z");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formate une date simple", () => {
    const result = formatDate("2024-01-01");
    expect(result).toBeDefined();
  });

  it("retourne une chaîne non vide pour toute date valide", () => {
    const result = formatDate("2023-12-25");
    expect(result.length).toBeGreaterThan(0);
  });
});
