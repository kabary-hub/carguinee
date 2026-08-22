import { describe, expect, it } from "vitest";
import { getHomeRouteForRole, roleLabel } from "./roles";

describe("getHomeRouteForRole", () => {
  it("renvoie /administration pour ADMIN", () => {
    expect(getHomeRouteForRole("ADMIN")).toBe("/administration");
  });

  it("renvoie /proprietaire pour PROPRIETAIRE", () => {
    expect(getHomeRouteForRole("PROPRIETAIRE")).toBe("/proprietaire");
  });

  it("renvoie /proprietaire pour OWNER (alias de compatibilité)", () => {
    expect(getHomeRouteForRole("OWNER")).toBe("/proprietaire");
  });

  it("renvoie /vehicules pour CLIENT", () => {
    expect(getHomeRouteForRole("CLIENT")).toBe("/vehicules");
  });

  it("renvoie /vehicules pour un rôle inconnu (défaut sécurisé)", () => {
    expect(getHomeRouteForRole("INCONNU")).toBe("/vehicules");
  });
});

describe("roleLabel", () => {
  it("affiche les libellés français", () => {
    expect(roleLabel("CLIENT")).toBe("Client");
    expect(roleLabel("PROPRIETAIRE")).toBe("Propriétaire");
    expect(roleLabel("ADMIN")).toBe("Administrateur");
  });

  it("accepte OWNER comme alias", () => {
    expect(roleLabel("OWNER")).toBe("Propriétaire");
  });
});
