import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("rend un champ de mot de passe", () => {
    const { container } = renderWithProviders(
      <PasswordInput value="" onChange={() => {}} />,
    );
    const input = container.querySelector("input");
    expect(input).toBeInTheDocument();
  });

  it("a un type password par défaut", () => {
    const { container } = renderWithProviders(
      <PasswordInput value="" onChange={() => {}} />,
    );
    const input = container.querySelector("input");
    expect(input?.getAttribute("type")).toBe("password");
  });

  it("a un bouton pour afficher/masquer le mot de passe", () => {
    const { container } = renderWithProviders(
      <PasswordInput value="" onChange={() => {}} />,
    );
    // Chercher un bouton dans le composant (pas le toggle visibility)
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("change le type en text au clic sur le toggle", () => {
    const { container } = renderWithProviders(
      <PasswordInput value="" onChange={() => {}} />,
    );
    const toggleBtn = container.querySelector("button");
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
    }
    const input = container.querySelector("input");
    expect(input?.getAttribute("type")).toBe("text");
  });

  it("appelle onChange quand on tape", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <PasswordInput value="" onChange={onChange} />,
    );
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "test123" } });
    expect(onChange).toHaveBeenCalledWith("test123");
  });

  it("accepte une classe CSS personnalisée", () => {
    const { container } = renderWithProviders(
      <PasswordInput value="" onChange={() => {}} className="my-class" />,
    );
    expect(container.querySelector(".my-class")).toBeInTheDocument();
  });
});
