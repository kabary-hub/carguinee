import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../test-utils";
import { HomePage } from "./HomePage";
import * as AuthContext from "../contexts/AuthContext";
import i18n from "../lib/i18n";

const mockUseAuth = vi.spyOn(AuthContext, "useAuth");

function renderHomePage(isAuthenticated = false) {
  i18n.changeLanguage("fr");
  mockUseAuth.mockReturnValue({
    user: isAuthenticated
      ? { id: "1", phone: "+22412345678", email: null, firstName: "Test", lastName: "User", role: "CLIENT", isActive: true, isBanned: false }
      : null,
    isLoading: false,
    isAuthenticated,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });

  return renderWithProviders(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("affiche le logo CarGuinée", () => {
    renderHomePage();
    expect(screen.getByText(/CarGuinée/)).toBeInTheDocument();
  });

  it("contient au moins un lien", () => {
    renderHomePage();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le lien profil si authentifié", () => {
    renderHomePage(true);
    const link = screen.getAllByRole("link").find(l => l.getAttribute("href") === "/profil");
    expect(link).toBeTruthy();
  });

  it("affiche le bouton déconnexion si authentifié", () => {
    renderHomePage(true);
    expect(screen.getByRole("button", { name: /déconnexion/i })).toBeInTheDocument();
  });

  it("affiche le footer", () => {
    renderHomePage();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("contient des headings", () => {
    renderHomePage();
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("contient au moins 3 sections/cartes", () => {
    const { container } = renderHomePage();
    const cards = container.querySelectorAll("a.rounded-2xl");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});
