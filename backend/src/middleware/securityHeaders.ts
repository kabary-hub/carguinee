import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

/**
 * Middleware de headers de sécurité supplémentaires.
 * Complète Helmet en ajoutant des headers spécifiques à notre app.
 *
 * La CSP est en mode bloquant (Content-Security-Policy).
 * En cas de violation, repasser temporairement en mode report-only en
 * remplaçant « Content-Security-Policy » par « Content-Security-Policy-Report-Only ».
 *
 * Pour générer un nonce (jeton unique) pour les scripts inline :
 * le nonce est ajouté à chaque réponse pour garantir son unicité.
 */
export function securityHeaders(request: Request, response: Response, next: NextFunction) {
  // ── Génération d'un nonce unique par requête (pour scripts inline PWA) ──
  const nonce = crypto.randomBytes(16).toString("base64");
  // Rendre le nonce accessible aux vues/templates si besoin
  res_locals_nonce(response, nonce);

  // ── Headers de sécurité de base ─────────────────────────────────────────

  // Empêche le navigateur de deviner le Content-Type
  response.setHeader("X-Content-Type-Options", "nosniff");

  // Empêche l'incorporation dans des iframes (clickjacking)
  response.setHeader("X-Frame-Options", "DENY");

  // Protection XSS intégrée du navigateur (anciens navigateurs)
  response.setHeader("X-XSS-Protection", "1; mode=block");

  // Politique de referer : ne pas envoyer l'URL complète
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  //强制 HTTPS (HSTS) — activer en production avec certificat TLS
  response.setHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // ── Content Security Policy (CSP) ───────────────────────────────────────
  // En mode report-only pour identifier les violations sans bloquer.
  // Les URLs de upload (/uploads/*) sont servies par l'API backend,
  // mais le frontend les charge en cross-origin → img-src 'self' suffit.
  const cspDirectives = [
    `default-src 'self'`,
    // scripts : nonce pour inline (PWA), sinon rien d'externe
    `script-src 'self' 'nonce-${nonce}'`,
    // styles : autoriser inline pour Tailwind/dark-mode
    `style-src 'self' 'unsafe-inline'`,
    // images : self + data URI (avatars) + blob (aperçus photos)
    `img-src 'self' data: blob:`,
    // polices : self uniquement
    `font-src 'self'`,
    // requêtes API/XHR : self uniquement
    `connect-src 'self'`,
    // objets embarqués / iframes interdits
    `object-src 'none'`,
    // empêcher l'incorporation de la page dans des frames
    `frame-ancestors 'none'`,
    // restreindre la base URL
    `base-uri 'self'`,
    // restreindre les formulaires à notre domaine
    `form-action 'self'`,
  ];

  const cspValue = cspDirectives.join("; ");

  // ── CSP en mode bloquant ─────────────────────────────────────────────
  // Pour revenir en mode report-only (debug), remplacer par :
  //   "Content-Security-Policy-Report-Only"
  response.setHeader(
    "Content-Security-Policy",
    `${cspValue}; report-uri /api/csp-report; report-to csp-endpoint`,
  );

  // En-tête Reporting API v1 (compatible navigateurs modernes)
  response.setHeader(
    "Reporting-Headers",
    JSON.stringify({
      "endpoints": [{ url: "/api/csp-report", priority: 1 }],
      "group": "csp-endpoint",
      "max_age": 10886400,
    }),
  );

  // ── Cache control pour les réponses API (pas de cache par défaut) ───────
  if (request.path.startsWith("/api")) {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
  }

  next();
}

/**
 * Stocke le nonce dans res.locals pour un accès ultérieur (templates, logs).
 */
function res_locals_nonce(response: Response, nonce: string) {
  // Express 5: res.locals existe toujours
  (response as any).locals = (response as any).locals || {};
  (response as any).locals.nonce = nonce;
}

/**
 * Endpoint de réception des rapports CSP.
 * Reçoit les violations envoyées par le navigateur (mode report-only)
 * et les logge pour analyse.
 */
export function cspReportHandler(request: Request, response: Response) {
  const report = request.body;

  if (report && typeof report === "object") {
    // Format Reporting API v1
    if (report.type === "csp-violation" && report.body) {
      logger.warn(
        {
          violatedDirective: report.body.violatedDirective,
          blockedUri: report.body.blockedURI,
          sourceFile: report.body.sourceFile,
          lineNumber: report.body.lineNumber,
        },
        "[CSP] Violation détectée (report-only)",
      );
    }
    // Format ancien (Content-Security-Policy-Report-Only avec report-uri)
    else if (report["csp-report"]) {
      const r = report["csp-report"];
      logger.warn(
        {
          violatedDirective: r["violated-directive"],
          blockedUri: r["blocked-uri"],
          sourceFile: r["source-file"],
          lineNumber: r["line-number"],
        },
        "[CSP] Violation détectée (report-uri)",
      );
    }
  }

  // Le navigateur attend une réponse 200/204 pour valider la réception
  response.status(204).end();
}
