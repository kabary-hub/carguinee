import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../lib/i18n";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
  });

  const statuses = [
    "PUBLIEE", "EN_ATTENTE_VALIDATION", "BROUILLON", "REJETEE",
    "ARCHIVEE", "EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE",
  ];

  it.each(statuses)("rend un span pour le statut %s", (status) => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <StatusBadge value={status} />
      </I18nextProvider>,
    );
    const badge = container.querySelector("span.inline-flex");
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent?.length).toBeGreaterThan(0);
  });

  it("applique les classes CSS appropriées", () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <StatusBadge value="PUBLIEE" />
      </I18nextProvider>,
    );
    const span = container.querySelector("span.inline-flex");
    expect(span).toHaveClass("rounded-full");
    expect(span).toHaveClass("font-bold");
  });

  it("gère un statut inconnu avec un fallback", () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <StatusBadge value="UNKNOWN_STATUS" />
      </I18nextProvider>,
    );
    const span = container.querySelector("span.inline-flex");
    expect(span).toBeInTheDocument();
    expect(span?.textContent?.toLowerCase()).toContain("unknown status");
  });

  it("contient les textes desktop et mobile", () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <StatusBadge value="PUBLIEE" />
      </I18nextProvider>,
    );
    // Il y a un span desktop (hidden sm:inline) et un mobile (sm:hidden)
    const desktopText = container.querySelector(".hidden.sm\\:inline");
    const mobileText = container.querySelector(".sm\\:hidden");
    expect(desktopText).toBeInTheDocument();
    expect(mobileText).toBeInTheDocument();
  });
});
