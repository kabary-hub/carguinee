import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("rend un bouton accessible", () => {
    renderWithProviders(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /mode/i });
    expect(button).toBeInTheDocument();
  });

  it("a un aria-label décrivant le mode actuel", () => {
    renderWithProviders(<ThemeToggle />);
    const button = screen.getByRole("button");
    // En mode clair par défaut
    expect(button.getAttribute("aria-label")).toMatch(/sombre/i);
  });

  it("bascule le thème au clic", () => {
    renderWithProviders(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    // Après le clic, l'aria-label doit changer
    expect(button.getAttribute("aria-label")).toMatch(/clair/i);
  });

  it("stocke le thème dans localStorage", () => {
    renderWithProviders(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(localStorage.getItem("carguinee_theme")).toBe("dark");
  });
});
