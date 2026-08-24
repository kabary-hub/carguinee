import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";

function TestComponent() {
  const { isDark, toggle } = useTheme();
  return (
    <div>
      <span data-testid="theme">{isDark ? "dark" : "light"}</span>
      <button onClick={toggle}>Toggle</button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("fournit le thème clair par défaut", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("lit le thème depuis localStorage", () => {
    localStorage.setItem("carguinee_theme", "dark");
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("bascule le thème au clic", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("applique la classe dark sur documentElement", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("Toggle"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("stocke le thème dans localStorage", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("Toggle"));
    expect(localStorage.getItem("carguinee_theme")).toBe("dark");
  });

  it("lance une erreur si useTheme est utilisé hors provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<TestComponent />);
    }).toThrow("useTheme doit être utilisé dans ThemeProvider.");
    spy.mockRestore();
  });
});
