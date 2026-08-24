import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("rend un bouton avec le label de langue actuelle", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("affiche FR si la langue est française", () => {
    i18n.changeLanguage("fr");
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    );
    expect(screen.getByText("FR")).toBeInTheDocument();
  });

  it("bascule vers EN au clic", () => {
    i18n.changeLanguage("fr");
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(i18n.language).toBe("en");
  });

  it("accepte une classe CSS personnalisée", () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher className="my-custom-class" />
      </I18nextProvider>,
    );
    expect(container.querySelector(".my-custom-class")).toBeInTheDocument();
  });
});
