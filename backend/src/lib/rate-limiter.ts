import rateLimit from "express-rate-limit";

/**
 * Rate limiter pour les routes d'authentification.
 * Protège contre le brute-force : 5 tentatives par tranche de 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Trop de tentatives. Réessayez dans 15 minutes.",
  },
});

/**
 * Rate limiter standard pour les routes API protégées.
 * 100 requêtes par heure par IP.
 */
export const standardLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Limite de requêtes atteinte. Réessayez plus tard.",
  },
});

/**
 * Rate limiter strict pour les actions sensibles (envoi de codes, etc.).
 * 20 requêtes par heure par IP.
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Limite atteinte pour cette action. Réessayez plus tard.",
  },
});
