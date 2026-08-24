import type { UserRole } from "../types/auth";

/**
 * Route d'accueil après connexion selon le rôle.
 * Les valeurs sont alignées sur l'enum backend réel : CLIENT | PROPRIETAIRE | ADMIN.
 * OWNER est accepté en alias de compatibilité (libellé français : Propriétaire).
 */
export function getHomeRouteForRole(role: string): string {
  switch (role.toUpperCase()) {
    case "ADMIN":
      return "/administration";
    case "OWNER":
    case "PROPRIETAIRE":
      return "/proprietaire";
    case "CLIENT":
    default:
      return "/vehicules";
  }
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Client",
  PROPRIETAIRE: "Propriétaire",
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
};

/** Libellé français d'un rôle (affichage uniquement ; le code conserve l'enum). */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role.toUpperCase()] ?? "Utilisateur";
}

export const OWNER_ROLES: UserRole[] = ["PROPRIETAIRE"];

/** Vérifie si un rôle a accès à une route donnée. */
export function isRouteAllowedForRole(route: string, role: string): boolean {
  const r = role.toUpperCase();
  // Routes admin
  if (route.startsWith("/administration")) return r === "ADMIN";
  // Routes propriétaire
  if (route === "/proprietaire") return r === "ADMIN" || r === "PROPRIETAIRE" || r === "OWNER";
  // Toutes les autres routes sont accessibles à tout utilisateur connecté
  return true;
}
