import type { Request, Response, NextFunction } from "express";

/**
 * Middleware de versioning API.
 * Redirige /api/v1/* vers /api/* pour compatibilité backward.
 * Les clients existants continuent de fonctionner.
 * Les nouveaux clients peuvent utiliser /api/v1/.
 */
export function apiVersioning(request: Request, response: Response, next: NextFunction) {
  // Si la requête utilise /api/v1/, on la redirige vers /api/
  if (request.path.startsWith("/api/v1/")) {
    const newPath = request.path.replace("/api/v1/", "/api/");
    // Redirect 308 (permanent) pour SEO et caching
    response.redirect(308, newPath + (request.url.includes("?") ? request.url.split("?")[1] : ""));
    return;
  }
  next();
}
