import { describe, expect, it, beforeEach } from "vitest";
import { getCookieConsent } from "./CookieConsentBanner";

describe("getCookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("retourne null si aucun consentement n'est stocké", () => {
    expect(getCookieConsent()).toBeNull();
  });

  it("retourne 'accepted' si accepté", () => {
    localStorage.setItem("carguinee_cookie_consent", "accepted");
    expect(getCookieConsent()).toBe("accepted");
  });

  it("retourne 'refused' si refusé", () => {
    localStorage.setItem("carguinee_cookie_consent", "refused");
    expect(getCookieConsent()).toBe("refused");
  });

  it("retourne null pour une valeur invalide", () => {
    localStorage.setItem("carguinee_cookie_consent", "invalid");
    expect(getCookieConsent()).toBeNull();
  });

  it("retourne null pour une chaîne vide", () => {
    localStorage.setItem("carguinee_cookie_consent", "");
    expect(getCookieConsent()).toBeNull();
  });
});
