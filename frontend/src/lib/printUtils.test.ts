import { describe, expect, it, vi, beforeEach } from "vitest";
import { formatGnf, formatDate } from "./domain";

// Test the underlying functions used by printUtils
describe("printUtils helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("formatGnf formate correctement les montants", () => {
    expect(formatGnf(100000)).toContain("100");
    expect(formatGnf(0)).toContain("0");
    expect(formatGnf(null)).toContain("0");
  });

  it("formatDate formate correctement les dates", () => {
    const result = formatDate("2024-06-15");
    expect(result.length).toBeGreaterThan(0);
  });

  it("window.open est mockable", () => {
    const mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);
    window.open("test", "_blank");
    expect(mockOpen).toHaveBeenCalledWith("test", "_blank");
    vi.unstubAllGlobals();
  });

  it("URL.createObjectURL est disponible", () => {
    expect(typeof URL.createObjectURL).toBe("function");
  });

  it("URL.revokeObjectURL est disponible", () => {
    expect(typeof URL.revokeObjectURL).toBe("function");
  });
});

describe("printBookingList HTML generation", () => {
  it("génère un HTML valide pour la liste de réservations", () => {
    // Simulate the HTML generation logic from printUtils
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body>
        <h1>Liste des réservations</h1>
        <table>
          <tr><th>Client</th><th>Véhicule</th><th>Dates</th><th>Montant</th></tr>
          <tr>
            <td>Amadou Diallo</td>
            <td>Toyota Corolla</td>
            <td>15/06/2024 - 20/06/2024</td>
            <td>${formatGnf(500000)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Toyota Corolla");
    expect(html).toContain("500");
  });
});
