import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "../../lib/i18n";

vi.mock("../../lib/api", () => ({
  apiFetch: vi.fn().mockResolvedValue({ status: "ok", data: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } } }),
  resolvePhotoUrl: (url: string) => url,
}));
vi.mock("../../contexts/ToastContext", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({ showToast: vi.fn() }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <MemoryRouter><QueryClientProvider client={qc}><I18nextProvider i18n={i18n}>{children}</I18nextProvider></QueryClientProvider></MemoryRouter>;
}

import { AdminBookingsTab } from "../admin/AdminBookingsTab";
import { AdminUsersTab } from "../admin/AdminUsersTab";
import { AdminReportsTab } from "../admin/AdminReportsTab";
import { AdminValidationsTab } from "../admin/AdminValidationsTab";
import { StatusBadge } from "../admin/ModerationModals";
import { ReportDetailsModal } from "../admin/ReportDetailsModal";
import { VehicleStatusModal } from "../admin/VehicleStatusModal";

describe("AdminBookingsTab", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend", () => {
    const { container } = render(<AdminBookingsTab />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("AdminUsersTab", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend", () => {
    const { container } = render(<AdminUsersTab toggleUserRole={vi.fn()} toggleUserActive={vi.fn()} />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("AdminReportsTab", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend", () => {
    const { container } = render(<AdminReportsTab reports={[]} setReports={vi.fn()} showToast={vi.fn()} />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("AdminValidationsTab", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend", () => {
    const { container } = render(<AdminValidationsTab
      stats={{ totalUsers: 10, totalVehicles: 5, totalBookings: 20, pendingValidation: 3, pendingReports: 1, revenue: { total: 1000, monthly: 100 }, recentBookings: [], recentUsers: [], vehiclesByStatus: {}, usersByRole: {}, bookingsByStatus: {} } as never}
      pendingVehicles={[]} requests={[]} getDescription={() => "Test"}
      setPendingAction={vi.fn()} setActiveTab={vi.fn()} setRoleFilter={vi.fn()} setBookingStatusFilter={vi.fn()}
    />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});

describe("ReportDetailsModal", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend avec un report", () => {
    const { container } = render(<ReportDetailsModal
      report={{ id: "1", targetType: "USER", targetId: "u1", reason: "Test", status: "PENDING", reporterId: "r1", createdAt: "2024-06-15T10:00:00Z", reporter: { firstName: "Jean", lastName: "Dupont" } } as never}
      onClose={vi.fn()}
    />, { wrapper });
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
  });
});

describe("VehicleStatusModal", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });
  it("se rend avec un véhicule", () => {
    const { container } = render(<VehicleStatusModal
      vehicle={{ id: "v1", brand: "Toyota", model: "Corolla", publicationStatus: "PUBLIEE", owner: { firstName: "M", lastName: "S" } } as never}
      onClose={vi.fn()} onStatusChange={vi.fn()}
    />, { wrapper });
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
  });
});
