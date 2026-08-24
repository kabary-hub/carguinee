import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../test-utils";
import { RegisterPage } from "./RegisterPage";
import * as AuthContext from "../contexts/AuthContext";
import i18n from "../lib/i18n";

const mockUseAuth = vi.spyOn(AuthContext, "useAuth");

describe("RegisterPage", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  function renderRegister() {
    return renderWithProviders(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
  }

  it("affiche le formulaire", () => {
    renderRegister();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("contient au moins 4 champs", () => {
    renderRegister();
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });

  it("affiche un lien vers /connexion", () => {
    renderRegister();
    const link = screen.getAllByRole("link").find(l => l.getAttribute("href") === "/connexion");
    expect(link).toBeTruthy();
  });

  it("affiche un lien retour à l'accueil", () => {
    renderRegister();
    const link = screen.getAllByRole("link").find(l => l.getAttribute("href") === "/");
    expect(link).toBeTruthy();
  });

  it("affiche le bouton thème", () => {
    renderRegister();
    expect(screen.getByRole("button", { name: /mode/i })).toBeInTheDocument();
  });

  it("affiche le bouton langue", () => {
    renderRegister();
    expect(screen.getByRole("button", { name: /french|english|français/i })).toBeInTheDocument();
  });
});
