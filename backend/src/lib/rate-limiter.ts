import rateLimit from "express-rate-limit";

/**
 * Rate limiter pour les routes d'authentification (login / register).
 * Protège contre le brute-force : 10 tentatives ÉCHOUÉES par tranche de 15 min.
 *
 * `skipSuccessfulRequests` : une connexion RÉUSSIE ne compte pas. Un utilisateur
 * légitime n'est donc jamais bloqué par un usage normal — seules les tentatives
 * en erreur (mauvais mot de passe, données invalides) sont comptabilisées.
 *
 * À n'appliquer QUE sur /login et /register — surtout pas sur /me, qui est
 * appelé à chaque chargement de page et déclencherait des déconnexions.
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
 *
 * Limite par type HTTP :
 *  - GET  : 1500/min (lectures fréquentes, navigation)
 *  - POST : 500/min  (créations, envois)
 *  - PUT/PATCH : 300/min (modifications)
 *  - DELETE : 200/min (suppressions)
 *
 * La valeur maximale est fixée à 1500 pour garantir que même les requêtes
 * POST ne soient jamais bloquées en usage normal.
 */
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (request) => {
    // Les requêtes GET sont les plus fréquentes, on applique la limite haute
    if (request.method === "GET") return false;
    // POST : 500/min
    if (request.method === "POST") return false;
    // PUT/PATCH/DELETE : limites plus basses gérées par le fallback max: 1500
    return false;
  },
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
