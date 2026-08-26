import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../test-utils";
import { AppShell } from "./AppShell";
import * as AuthContext from "../contexts/AuthContext";
import i18n from "../lib/i18n";

const mockUseAuth = vi.spyOn(AuthContext, "useAuth");
mockUseAuth.mockReturnValue({
  user: {
    id: "1",
    phone: "+22412345678",
    email: null,
    firstName: "Amadou",
    lastName: "Diallo",
    role: "CLIENT",
    isActive: true,
    isBanned: false,
  },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
});

describe("AppShell", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
  });

  it("rend les enfants", () => {
    renderWithProviders(
      <MemoryRouter>
        <AppShell>
          <div>Contenu test</div>
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getByText("Contenu test")).toBeInTheDocument();
  });

  it("affiche le logo CarGuinée", () => {
    renderWithProviders(
      <MemoryRouter>
        <AppShell>
          <div>test</div>
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/CarGuinée/).length).toBeGreaterThanOrEqual(1);
  });

  it("affiche un lien vers le profil", () => {
    renderWithProviders(
      <MemoryRouter>
        <AppShell>
          <div>test</div>
        </AppShell>
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link");
    const profileLink = links.find(l => l.getAttribute("href") === "/profil");
    expect(profileLink).toBeTruthy();
  });

  it("affiche un lien vers les véhicules", () => {
    renderWithProviders(
      <MemoryRouter>
        <AppShell>
          <div>test</div>
        </AppShell>
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link");
    const vehicleLink = links.find(l => l.getAttribute("href") === "/vehicules");
    expect(vehicleLink).toBeTruthy();
  });

  it("affiche la navigation", () => {
    renderWithProviders(
      <MemoryRouter>
        <AppShell>
          <div>test</div>
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });
});
