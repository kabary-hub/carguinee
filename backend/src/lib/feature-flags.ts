/**
 * Feature Flags System — Carguinée
 *
 * Permet de déployer des fonctionnalités progressivement :
 * 1. Développeur → flag OFF par défaut
 * 2. Staging → flag ON pour test
 * 3. Production → activation progressive (10% → 50% → 100%)
 * 4. Kill switch → désactivation immédiate en cas de bug
 *
 * Les flags sont stockés en mémoire avec TTL pour éviter les appels DB.
 */

import { logger } from "./logger.js";

type FeatureFlag = {
  key: string;
  description: string;
  enabled: boolean;
  /** Pourcentage d'activation (0-100). null = tous ou aucun */
  rolloutPercentage: number | null;
  /** Date d'expiration (auto-disable) */
  expiresAt: Date | null;
};

// ── Flags prédéfinis ─────────────────────────────────────────────────────

const FLAGS: Record<string, FeatureFlag> = {
  "vehicle-gallery-v2": {
    key: "vehicle-gallery-v2",
    description: "Nouvelle galerie photos avec lightbox améliorée",
    enabled: false,
    rolloutPercentage: null,
    expiresAt: null,
  },
  "chat-typing-indicator": {
    key: "chat-typing-indicator",
    description: "Indicateur 'en train d'écrire' dans la messagerie",
    enabled: false,
    rolloutPercentage: null,
    expiresAt: null,
  },
  "advanced-search": {
    key: "advanced-search",
    description: "Recherche avancée avec filtres multiples",
    enabled: true,
    rolloutPercentage: 100,
    expiresAt: null,
  },
  "booking-reminders": {
    key: "booking-reminders",
    description: "Rappels automatiques avant la date de réservation",
    enabled: false,
    rolloutPercentage: null,
    expiresAt: null,
  },
  "owner-analytics": {
    key: "owner-analytics",
    description: "Tableau de bord analytique pour les propriétaires",
    enabled: false,
    rolloutPercentage: null,
    expiresAt: null,
  },
  "multi-photo-upload": {
    key: "multi-photo-upload",
    description: "Upload multiple de photos en drag & drop",
    enabled: true,
    rolloutPercentage: 100,
    expiresAt: null,
  },
  "dark-mode-v2": {
    key: "dark-mode-v2",
    description: "Mode sombre v2 avec thème personnalisable",
    enabled: true,
    rolloutPercentage: 100,
    expiresAt: null,
  },
};

// Cache en mémoire avec TTL
const cache = new Map<string, { value: boolean; expiresAt: number }>();

// ── API publique ─────────────────────────────────────────────────────────

/**
 * Vérifie si un feature flag est activé pour un utilisateur donné.
 *
 * @param flagKey - Clé du flag
 * @param userId - ID utilisateur (pour le rollout progressif)
 * @returns true si le flag est activé pour cet utilisateur
 */
export function isFeatureEnabled(flagKey: string, userId?: string): boolean {
  const flag = FLAGS[flagKey];

  if (!flag) {
    logger.warn({ flagKey }, "Feature flag inconnu");
    return false;
  }

  // Vérifier l'expiration
  if (flag.expiresAt && new Date() > flag.expiresAt) {
    return false;
  }

  // Si le flag est désactivé globalement
  if (!flag.enabled) {
    return false;
  }

  // Si pas de rollout progressif → tous voient le flag
  if (flag.rolloutPercentage === null || flag.rolloutPercentage === 100) {
    return true;
  }

  if (flag.rolloutPercentage === 0) {
    return false;
  }

  // Rollout progressif basé sur le hash de l'userId
  if (!userId) {
    return flag.rolloutPercentage >= 50; // Default: 50% si pas d'userId
  }

  const hash = simpleHash(userId + flagKey);
  const userPercentile = hash % 100;
  return userPercentile < flag.rolloutPercentage;
}

/**
 * Liste tous les flags avec leur état.
 */
export function listFeatureFlags(): FeatureFlag[] {
  return Object.values(FLAGS).map((flag) => ({
    ...flag,
    expiresAt: flag.expiresAt,
  }));
}

/**
 * Met à jour un feature flag (utilisé par l'admin).
 */
export function updateFeatureFlag(
  flagKey: string,
  updates: Partial<Pick<FeatureFlag, "enabled" | "rolloutPercentage" | "expiresAt">>,
): boolean {
  const flag = FLAGS[flagKey];
  if (!flag) return false;

  if (updates.enabled !== undefined) flag.enabled = updates.enabled;
  if (updates.rolloutPercentage !== undefined) flag.rolloutPercentage = updates.rolloutPercentage;
  if (updates.expiresAt !== undefined) flag.expiresAt = updates.expiresAt;

  // Invalider le cache
  cache.delete(flagKey);

  logger.info({ flagKey, updates }, "Feature flag mis à jour");
  return true;
}

/**
 * Crée un nouveau feature flag.
 */
export function createFeatureFlag(
  key: string,
  description: string,
  options: Partial<Pick<FeatureFlag, "enabled" | "rolloutPercentage" | "expiresAt">> = {},
): FeatureFlag {
  const flag: FeatureFlag = {
    key,
    description,
    enabled: options.enabled ?? false,
    rolloutPercentage: options.rolloutPercentage ?? null,
    expiresAt: options.expiresAt ?? null,
  };

  FLAGS[key] = flag;
  logger.info({ flagKey: key }, "Feature flag créé");
  return flag;
}

// ── Utilitaire ───────────────────────────────────────────────────────────

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
