import type { Request, Response, NextFunction } from "express";

/**
 * Middleware de headers de sécurité supplémentaires.
 * Complète Helmet en ajoutant des headers spécifiques à notre app.
 */
export function securityHeaders(_request: Request, response: Response, next: NextFunction) {
  // Empêche le navigateur de deviner le Content-Type
  response.setHeader("X-Content-Type-Options", "nosniff");

  // Empêche l'incorporation dans des iframes (clickjacking)
  response.setHeader("X-Frame-Options", "DENY");

  // Protection XSS intégrée du navigateur
  response.setHeader("X-XSS-Protection", "1; mode=block");

  // Politique de referer : ne pas envoyer l'URL complète
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Politique de chargement des ressources
  response.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // inline pour PWA
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  // Cache control pour les réponses API (pas de cache par défaut)
  if (_request.path.startsWith("/api")) {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
  }

  next();
}
