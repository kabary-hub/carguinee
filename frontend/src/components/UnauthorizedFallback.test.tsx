import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../test-utils";
import { UnauthorizedFallback } from "./UnauthorizedFallback";
import * as AuthContext from "../contexts/AuthContext";
import i18n from "../lib/i18n";

const mockUseAuth = vi.spyOn(AuthContext, "useAuth");
mockUseAuth.mockReturnValue({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
});

describe("UnauthorizedFallback", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
  });

  it("rend un composant avec du contenu", () => {
    const { container } = renderWithProviders(
      <MemoryRouter>
        <UnauthorizedFallback />
      </MemoryRouter>,
    );
    expect(container.textContent?.length).toBeGreaterThan(0);
  });

  it("contient un lien vers la connexion", () => {
    renderWithProviders(
      <MemoryRouter>
        <UnauthorizedFallback />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link");
    const loginLink = links.find(l => l.getAttribute("href") === "/connexion");
    expect(loginLink).toBeTruthy();
  });

  it("contient un paragraphe avec un message", () => {
    renderWithProviders(
      <MemoryRouter>
        <UnauthorizedFallback />
      </MemoryRouter>,
    );
    const paragraphs = screen.getAllByRole("paragraph");
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });
});
