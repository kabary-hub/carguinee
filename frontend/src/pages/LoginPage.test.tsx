import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../test-utils";
import { LoginPage } from "./LoginPage";
import * as AuthContext from "../contexts/AuthContext";
import i18n from "../lib/i18n";

const mockUseAuth = vi.spyOn(AuthContext, "useAuth");

describe("LoginPage", () => {
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

  function renderLogin() {
    return renderWithProviders(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
  }

  it("affiche le formulaire", () => {
    renderLogin();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("affiche le champ téléphone", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("+224...")).toBeInTheDocument();
  });

  it("contient au moins 3 boutons (theme, lang, submit)", () => {
    renderLogin();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("affiche un lien vers /inscription", () => {
    renderLogin();
    const link = screen.getAllByRole("link").find(l => l.getAttribute("href") === "/inscription");
    expect(link).toBeTruthy();
  });

  it("affiche un lien retour à l'accueil", () => {
    renderLogin();
    const link = screen.getAllByRole("link").find(l => l.getAttribute("href") === "/");
    expect(link).toBeTruthy();
  });

  it("affiche un heading principal", () => {
    renderLogin();
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le bouton thème", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /mode/i })).toBeInTheDocument();
  });

  it("affiche un message d'erreur si redirigé après bannissement", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={[{ pathname: "/connexion", state: { banned: true } }]}>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
