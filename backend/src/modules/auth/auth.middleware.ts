import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AuthContext, AuthRole } from "../../types/express.js";

function isAuthRole(value: unknown): value is AuthRole {
  return value === "CLIENT" || value === "PROPRIETAIRE" || value === "ADMIN";
}

/**
 * Extrait le token JWT depuis le header Authorization OU le cookie auth_token.
 */
function extractToken(request: Request): string | null {
  const authorization = request.header("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  // Fallback : cookie httpOnly
  const cookies = request.cookies as Record<string, string> | undefined;
  if (cookies?.auth_token) {
    return cookies.auth_token;
  }
  return null;
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = extractToken(request);

  if (!token) {
    response.status(401).json({
      status: "error",
      message: "Jeton d'authentification manquant.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === "string" || !payload.sub || !isAuthRole(payload.role)) {
      response.status(401).json({
        status: "error",
        message: "Jeton d'authentification invalide.",
      });
      return;
    }

    const auth: AuthContext = {
      userId: String(payload.sub),
      phone: typeof payload.phone === "string" ? payload.phone : "",
      role: payload.role,
    };

    request.auth = auth;
    next();
  } catch {
    response.status(401).json({
      status: "error",
      message: "Jeton d'authentification invalide ou expiré.",
    });
  }
}

export function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const token = extractToken(request);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload !== "string" && payload.sub && isAuthRole(payload.role)) {
      request.auth = {
        userId: String(payload.sub),
        phone: typeof payload.phone === "string" ? payload.phone : "",
        role: payload.role,
      };
    }
  } catch {
    // Token invalide → on continue sans auth
  }

  next();
}

export function requireRoles(...allowedRoles: AuthRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.auth) {
      response.status(401).json({
        status: "error",
        message: "Authentification requise.",
      });
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      response.status(403).json({
        status: "error",
        message: "Vous n'avez pas les droits nécessaires.",
      });
      return;
    }

    next();
  };
}
