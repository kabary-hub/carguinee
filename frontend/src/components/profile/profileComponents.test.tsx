import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../lib/i18n";
import { ToastProvider } from "../../contexts/ToastContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { PasswordManager } from "./PasswordManager";

vi.mock("../../lib/api", () => ({
  apiFetch: vi.fn(),
}));

describe("PasswordManager", () => {
  beforeEach(() => { i18n.changeLanguage("fr"); });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
      <ToastProvider>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </ToastProvider>
    </ThemeProvider>
  );

  it("se rend sans crasher", () => {
    const { container } = render(<PasswordManager />, { wrapper });
    expect(container.textContent?.length).toBeGreaterThan(0);
  });

  it("contient des boutons", () => {
    render(<PasswordManager />, { wrapper });
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
