import rateLimit from "express-rate-limit";

/**
 * Rate limiter pour les routes d'authentification (login / register).
 * Protège contre le brute-force : 10 tentatives ÉCHOUÉES par tranche de 15 min.
 *
 * `skipSuccessfulRequests` : une connexion RÉUSSIE ne compte pas. Un utilisateur
 * légitime n'est donc jamais bloqué par un usage normal — seules les tentatives
 * en erreur (mauvais mot de passe, données invalides) sont comptabilisées.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Trop de tentatives échouées. Réessayez dans 15 minutes.",
  },
});

/**
 * Rate limiter standard pour les routes API protégées.
 * 1500 requêtes par minute par IP — assez pour couvrir les appels fréquents
 * du frontend (dashboard, listes, pagination).
 */
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1500,
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

/**
 * Rate limiter pour les actions write (POST/PUT/DELETE).
 * 200 requêtes par minute par IP.
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Trop de modifications. Réessayez dans une minute.",
  },
});

/**
 * Rate limiter pour le chatbot (protège contre l'abus).
 * 30 messages par minute par IP.
 */
export const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Trop de messages. Réessayez dans une minute.",
  },
});

/**
 * Rate limiter pour les uploads (protège contre l'abus stockage).
 * 20 uploads par heure par IP.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Trop d'uploads. Réessayez plus tard.",
  },
});
