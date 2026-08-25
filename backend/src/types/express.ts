/**
 * Types partagés pour l'authentification Express.
 *
 * Utilisé par :
 * - auth.middleware.ts (requireAuth, optionalAuth, requireRoles)
 * - booking.service.ts, vehicle.service.ts, review.service.ts (AuthRole)
 */

export type AuthRole = "CLIENT" | "PROPRIETAIRE" | "ADMIN";

export interface AuthContext {
  userId: string;
  phone: string;
  role: AuthRole;
}

// Augmentation du type Request d'Express pour ajouter la propriété auth
declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}
