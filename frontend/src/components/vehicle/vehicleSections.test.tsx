/**
 * Tests de rendu pour les sections véhicule — vérifie juste qu'elles ne crashent pas.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../lib/i18n";
import { VehicleInfoSection } from "./VehicleInfoSection";
import { VehicleDocumentsSection } from "./VehicleDocumentsSection";
import { VehicleOwnerSection } from "./VehicleOwnerSection";
import { VehicleReviewsSection } from "./VehicleReviewsSection";

vi.mock("../../lib/api", () => ({
  apiFetch: vi.fn(),
  resolvePhotoUrl: (url: string) => url,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter><I18nextProvider i18n={i18n}>{children}</I18nextProvider></MemoryRouter>;
}

describe("VehicleInfoSection", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend sans crasher", () => {
    const { container } = render(
      <VehicleInfoSection vehicle={{ brand: "Toyota", model: "Corolla", type: "BERLINE", condition: "BON", year: 2022, mileageKm: 50000, color: "Blanc", seats: 5, fuelType: "Essence", transmission: "Manuelle" } as never} getDescription={(v: any) => v.descriptionFr || ""} />,
      { wrapper },
    );
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("VehicleDocumentsSection", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend sans crasher", () => {
    const { container } = render(
      <VehicleDocumentsSection vehicle={{ documentsDisponibles: ["carte grise", "assurance"] } as never} lang="fr" />,
      { wrapper },
    );
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("VehicleOwnerSection", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend sans crasher", () => {
    const { container } = render(
      <VehicleOwnerSection vehicle={{ owner: { firstName: "Mamadou", lastName: "Sow", phone: "+22412345678" } } as never} contactOwner={vi.fn()} />,
      { wrapper },
    );
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("VehicleReviewsSection", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend sans crasher", () => {
    const { container } = render(
      <VehicleReviewsSection reviews={[]} reviewsTotal={0} lang="fr" />,
      { wrapper },
    );
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});
