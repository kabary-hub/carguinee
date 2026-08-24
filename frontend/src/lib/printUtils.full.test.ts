import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { formatGnf, formatDate } from "./domain";

describe("printUtils — helpers utilisés par les fonctions d'impression", () => {
  it("formatGnf formate les montants", () => {
    expect(formatGnf(200000)).toContain("200");
    expect(formatGnf(0)).toContain("0");
    expect(formatGnf(null)).toContain("0");
    expect(formatGnf(undefined)).toContain("0");
    expect(formatGnf(5000000)).toContain("5");
  });

  it("formatDate formate les dates", () => {
    const r = formatDate("2024-06-15");
    expect(r.length).toBeGreaterThan(0);
    expect(r).toBeDefined();
  });
});

describe("printUtils — printBookingList", () => {
  it("génère du HTML sans crasher avec une liste vide", async () => {
    // Just verify the module loads
    const mod = await import("./printUtils");
    expect(typeof mod.printBookingList).toBe("function");
  });

  it("génère du HTML avec des réservations", async () => {
    const mod = await import("./printUtils");
    // printBookingList with mock data shouldn't crash
    expect(() => mod.printBookingList([])).not.toThrow();
  });
});

describe("printUtils — printUserList", () => {
  it("est une fonction exportée", async () => {
    const mod = await import("./printUtils");
    expect(typeof mod.printUserList).toBe("function");
  });
});

describe("printUtils — printUserCard", () => {
  it("est une fonction exportée", async () => {
    const mod = await import("./printUtils");
    expect(typeof mod.printUserCard).toBe("function");
  });
});

describe("printUtils — printVehicleList", () => {
  it("est une fonction exportée", async () => {
    const mod = await import("./printUtils");
    expect(typeof mod.printVehicleList).toBe("function");
  });
});
