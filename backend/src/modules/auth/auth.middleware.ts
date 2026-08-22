import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AuthContext, AuthRole } from "../../types/express.js";

function isAuthRole(value: unknown): value is AuthRole {
  return value === "CLIENT" || value === "PROPRIETAIRE" || value === "ADMIN";
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({
      status: "error",
      message: "Jeton d’authentification manquant.",
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === "string" || !payload.sub || !isAuthRole(payload.role)) {
      response.status(401).json({
        status: "error",
        message: "Jeton d’authentification invalide.",
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
      message: "Jeton d’authentification invalide ou expiré.",
    });
  }
}

export function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

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
        message: "Vous n’avez pas les droits nécessaires.",
      });
      return;
    }

    next();
  };
}
