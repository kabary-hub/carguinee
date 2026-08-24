import { describe, expect, it } from "vitest";
import { isRouteAllowedForRole } from "./roles";

describe("isRouteAllowedForRole", () => {
  // ── Routes admin ──────────────────────────────────────────────────────────

  it("ADMIN peut accéder à /administration", () => {
    expect(isRouteAllowedForRole("/administration", "ADMIN")).toBe(true);
  });

  it("ADMIN peut accéder à /administration/chats", () => {
    expect(isRouteAllowedForRole("/administration/chats", "ADMIN")).toBe(true);
  });

  it("CLIENT ne peut PAS accéder à /administration", () => {
    expect(isRouteAllowedForRole("/administration", "CLIENT")).toBe(false);
  });

  it("PROPRIETAIRE ne peut PAS accéder à /administration", () => {
    expect(isRouteAllowedForRole("/administration", "PROPRIETAIRE")).toBe(false);
  });

  // ── Routes propriétaire ───────────────────────────────────────────────────

  it("PROPRIETAIRE peut accéder à /proprietaire", () => {
    expect(isRouteAllowedForRole("/proprietaire", "PROPRIETAIRE")).toBe(true);
  });

  it("ADMIN peut accéder à /proprietaire", () => {
    expect(isRouteAllowedForRole("/proprietaire", "ADMIN")).toBe(true);
  });

  it("OWNER peut accéder à /proprietaire (alias)", () => {
    expect(isRouteAllowedForRole("/proprietaire", "OWNER")).toBe(true);
  });

  it("CLIENT ne peut PAS accéder à /proprietaire", () => {
    expect(isRouteAllowedForRole("/proprietaire", "CLIENT")).toBe(false);
  });

  // ── Routes publiques / utilisateur ────────────────────────────────────────

  it("tout rôle peut accéder à /vehicules", () => {
    expect(isRouteAllowedForRole("/vehicules", "CLIENT")).toBe(true);
    expect(isRouteAllowedForRole("/vehicules", "ADMIN")).toBe(true);
    expect(isRouteAllowedForRole("/vehicules", "PROPRIETAIRE")).toBe(true);
  });

  it("tout rôle peut accéder à /favoris", () => {
    expect(isRouteAllowedForRole("/favoris", "CLIENT")).toBe(true);
  });

  it("tout rôle peut accéder à /messages", () => {
    expect(isRouteAllowedForRole("/messages", "CLIENT")).toBe(true);
  });

  // ── Case insensibilité ────────────────────────────────────────────────────

  it("gère les rôles en minuscules", () => {
    expect(isRouteAllowedForRole("/administration", "admin")).toBe(true);
    expect(isRouteAllowedForRole("/proprietaire", "client")).toBe(false);
  });
});
