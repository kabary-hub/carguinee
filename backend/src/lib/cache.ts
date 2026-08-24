/**
 * Cache mémoire simple avec TTL pour les données publiques.
 *
 * Usage :
 *   const data = await cached("vehicles:list", 60_000, () => fetchExpensiveData());
 *
 * Le premier appel exécute la callback et met en cache.
 * Les appels suivants (dans le TTL) retournent le cache.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Nettoyage automatique toutes les 5 minutes
// .unref() empêche le timer de bloquer l'arrêt du processus (tests, shutdown)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 5 * 60 * 1000);
cleanupTimer.unref();

/**
 * Récupère une valeur du cache ou l'exécute et la met en cache.
 * @param key Clé unique
 * @param ttlMs Durée de vie en millisecondes
 * @param fn Fonction à exécuter si pas en cache
 */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value;
  }

  const value = await fn();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/** Invalide une clé spécifique ou toutes les clés d'un préfixe. */
export function invalidateCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
