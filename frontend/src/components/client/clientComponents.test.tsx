/**
 * Tests de rendu pour les composants client — vérifie juste qu'ils ne crashent pas.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "../../lib/i18n";
import { ToastProvider } from "../../contexts/ToastContext";

vi.mock("../../lib/api", () => ({
  apiFetch: vi.fn(),
  resolvePhotoUrl: (url: string) => url,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <MemoryRouter><QueryClientProvider client={qc}><I18nextProvider i18n={i18n}><ToastProvider>{children}</ToastProvider></I18nextProvider></QueryClientProvider></MemoryRouter>;
}

import { BookingDetailsModal } from "./BookingDetailsModal";
import { ReviewForm } from "./ReviewForm";
import { RatingStars } from "./RatingStars";
import { BookingSidebar } from "../vehicle/BookingSidebar";

const mockBooking = {
  id: "b1", startDate: "2024-06-15", endDate: "2024-06-20",
  dailyRateGnf: 200000, totalAmountGnf: 1000000, depositAmountGnf: 200000,
  depositStatus: "HELD", status: "CONFIRMEE", notes: null,
  vehicle: { id: "v1", brand: "Toyota", model: "Corolla", type: "BERLINE", condition: "BON", commune: "KALOUM", quartier: "Dixinn", secteur: "Centre", supportsRental: true, supportsSale: false, dailyRentalPriceGnf: 200000, publicationStatus: "PUBLIEE", photos: [] },
  customer: { id: "u1", firstName: "Amadou", lastName: "Diallo", phone: "+22412345678", email: null },
};

const mockVehicle = {
  id: "v1", brand: "Toyota", model: "Corolla", type: "BERLINE", condition: "BON",
  commune: "KALOUM", quartier: "Dixinn", secteur: "Centre", supportsRental: true, supportsSale: false,
  dailyRentalPriceGnf: 200000, publicationStatus: "PUBLIEE", photos: [],
  owner: { id: "o1", firstName: "Mamadou", lastName: "Sow", phone: "+22412345678" },
};

describe("BookingDetailsModal", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend sans crasher", () => {
    const { container } = render(<BookingDetailsModal booking={mockBooking as never} onClose={vi.fn()} />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("ReviewForm", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend sans crasher", () => {
    const { container } = render(<ReviewForm vehicleId="v1" onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("RatingStars", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend avec des étoiles", () => {
    const { container } = render(<RatingStars rating={4} />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
  it("se rend avec 0 étoiles", () => {
    const { container } = render(<RatingStars rating={0} />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
  it("se rend avec un count", () => {
    const { container } = render(<RatingStars rating={4.5} count={12} />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("BookingSidebar", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend sans crasher", () => {
    const { container } = render(<BookingSidebar
      vehicle={mockVehicle as never}
      user={{ id: "u1", phone: "+22412345678", email: null, firstName: "Test", lastName: "User", role: "CLIENT", isActive: true, isBanned: false } as never}
      isBooking={false} message="" error=""
      openBookingConfirm={vi.fn()} setShowReportDialog={vi.fn()}
    />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});
