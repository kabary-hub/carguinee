/**
 * Protection CSRF via Double-Submit Cookie.
 *
 * Fonctionnement :
 *   1. Au login, un token CSRF aléatoire est placé dans un cookie lisible (non httpOnly)
 *   2. Le frontend lit ce cookie et l'envoie dans le header X-CSRF-Token
 *   3. Le middleware vérifie que les deux correspondent
 *
 * Les requêtes GET/HEAD/OPTIONS sont toujours autorisées (idempotentes).
 * Le header X-Requested-With: XMLHttpRequest est aussi accepté comme preuve d'origine.
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env.js";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "x-csrf-token";

/**
 * Génère un token CSRF et le place dans un cookie lisible par le frontend.
 */
export function setCsrfCookie(_request: Request, response: Response, next: NextFunction) {
  // Ne régénérer le token que si le cookie n'existe pas encore
  if (!_request.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    response.cookie(CSRF_COOKIE, token, {
      httpOnly: false,   // Le frontend doit pouvoir le lire
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });
  }
  next();
}

/**
 * Vérifie le token CSRF sur les mutations (POST, PUT, PATCH, DELETE).
 *
 * Accepte :
 *   - Le header X-CSRF-Token correspondant au cookie XSRF-TOKEN
 *   - OU le header X-Requested-With: XMLHttpRequest (preuve d'origine JS)
 *
 * Les requêtes GET/HEAD/OPTIONS passent toujours.
 */
export function validateCsrf(request: Request, response: Response, next: NextFunction) {
  const method = request.method.toUpperCase();

  // Les requêtes idempotentes ne nécessitent pas de CSRF
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  // En développement local (same-origin implicit), on peut assouplir
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }

  // Vérifier le double-submit cookie
  const cookieToken = request.cookies?.[CSRF_COOKIE];
  const headerToken = request.headers[CSRF_HEADER] as string | undefined;

  if (cookieToken && headerToken && cookieToken === headerToken) {
    next();
    return;
  }

  // Alternative : vérifier X-Requested-With (.envoyé par fetch/axios en cross-origin)
  const xRequestedWith = request.headers["x-requested-with"];
  if (xRequestedWith === "XMLHttpRequest" || xRequestedWith === "fetch") {
    next();
    return;
  }

  // Refuser la requête
  response.status(403).json({
    status: "error",
    message: "Token CSRF invalide ou manquant.",
  });
}

/**
 * Route pour rafraîchir le token CSRF (utile après le login).
 */
export function refreshCsrf(request: Request, response: Response) {
  const token = crypto.randomBytes(32).toString("hex");
  response.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });
  response.json({ status: "ok" });
}
