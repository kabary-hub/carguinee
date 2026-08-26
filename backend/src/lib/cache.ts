/**
 * Cache hybride : Redis (production) + Map in-memory (dev/tests).
 *
 * Usage :
 *   const data = await cached("vehicles:list", 60_000, () => fetchExpensiveData());
 *
 * - En prod avec Redis : cache distribué entre les instances PM2
 * - En dev sans Redis : cache in-memory par processus
 * - La callback n'est exécutée que si la clé n'est pas en cache
 *
 * Invalidation :
 *   invalidateCache("vehicles") → supprime toutes les clés "vehicles:*"
 *   invalidateCache() → vide tout le cache
 */

import { isRedisConnected, getRedis } from "./redis.js";

// ── In-memory fallback ───────────────────────────────────────────────────
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memStore = new Map<string, CacheEntry<unknown>>();

// Nettoyage auto des entrées expirées (toutes les 5 min)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (now > entry.expiresAt) memStore.delete(key);
  }
}, 5 * 60 * 1000);
cleanupTimer.unref();

// ── API publique ─────────────────────────────────────────────────────────

/**
 * Récupère une valeur du cache ou l'exécute et la met en cache.
 * @param key Clé unique
 * @param ttlMs Durée de vie en millisecondes
 * @param fn Fonction à exécuter si pas en cache
 */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const ttlSec = Math.ceil(ttlMs / 1000);

  // ── Tentative Redis ──
  if (isRedisConnected()) {
    try {
      const redis = getRedis()!;
      const raw = await redis.get(`carguinee:${key}`);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Fallback vers in-memory
    }

    const value = await fn();

    try {
      const redis = getRedis()!;
      await redis.set(`carguinee:${key}`, JSON.stringify(value), "EX", ttlSec);
    } catch {
      // Ignorer l'erreur d'écriture Redis
    }

    return value;
  }

  // ── Fallback in-memory ──
  const entry = memStore.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value;
  }

  const value = await fn();
  memStore.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/**
 * Invalide une clé spécifique ou toutes les clés d'un préfixe.
 * @param prefix Préfixe à invalider. Si undefined, vide tout le cache.
 */
export async function invalidateCache(prefix?: string): Promise<void> {
  // ── Redis ──
  if (isRedisConnected()) {
    try {
      const redis = getRedis()!;
      if (!prefix) {
        // Supprimer toutes les clés carguinee:*
        const keys = await redis.keys("carguinee:*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        const keys = await redis.keys(`carguinee:${prefix}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch {
      // Ignorer
    }
  }

  // ── In-memory ──
  if (!prefix) {
    memStore.clear();
    return;
  }
  for (const key of memStore.keys()) {
    if (key.startsWith(prefix)) memStore.delete(key);
  }
}

/**
 * Récupère une valeur du cache sans l'exécuter.
 * Retourne null si absent ou expiré.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (isRedisConnected()) {
    try {
      const redis = getRedis()!;
      const raw = await redis.get(`carguinee:${key}`);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Fallback
    }
  }

  const entry = memStore.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value;
  }
  return null;
}

/**
 * Définit une valeur dans le cache.
 */
export async function setCache(key: string, value: unknown, ttlMs: number): Promise<void> {
  const ttlSec = Math.ceil(ttlMs / 1000);

  if (isRedisConnected()) {
    try {
      const redis = getRedis()!;
      await redis.set(`carguinee:${key}`, JSON.stringify(value), "EX", ttlSec);
    } catch {
      // Ignorer
    }
  }

  memStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}
