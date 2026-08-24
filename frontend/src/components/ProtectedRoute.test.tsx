import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { renderWithProviders } from "../test-utils";
import { ProtectedRoute } from "./ProtectedRoute";
import * as AuthContext from "../contexts/AuthContext";
import i18n from "../lib/i18n";

const mockUseAuth = vi.spyOn(AuthContext, "useAuth");

function renderWithRouter(
  isAuthenticated: boolean,
  role: string = "CLIENT",
) {
  i18n.changeLanguage("fr");
  mockUseAuth.mockReturnValue({
    user: isAuthenticated
      ? {
          id: "1",
          phone: "+22412345678",
          email: null,
          firstName: "Test",
          lastName: "User",
          role: role as "CLIENT" | "PROPRIETAIRE" | "ADMIN",
          isActive: true,
          isBanned: false,
        }
      : null,
    isLoading: false,
    isAuthenticated,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });

  return renderWithProviders(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/connexion" element={<div>Login Page</div>} />
        <Route path="/acces-refuse" element={<div>Access Denied</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("affiche le contenu si authentifié", () => {
    renderWithRouter(true);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirige vers /connexion si non authentifié", () => {
    renderWithRouter(false);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("autorise l'accès sans rôle spécifique", () => {
    renderWithRouter(true, "CLIENT");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("autorise l'accès admin pour un admin", () => {
    renderWithRouter(true, "ADMIN");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
