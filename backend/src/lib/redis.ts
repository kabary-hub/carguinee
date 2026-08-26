/**
 * Client Redis pour CarGuinée.
 *
 * En dev sans Redis : fallback in-memory silencieux.
 * En prod : cache distribué entre les instances PM2.
 */

import { Redis } from "ioredis";
import type { Redis as RedisInstance } from "ioredis";
import { logger } from "./logger.js";

let redisClient: RedisInstance | null = null;
let connected = false;

function createRedisClient(): RedisInstance | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.warn("REDIS_URL non défini — cache in-memory utilisé");
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) {
        logger.warn({ attempts: times }, "Redis: abandon de la reconnexion");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableReadyCheck: true,
    connectTimeout: 5000,
  });

  client.on("connect", () => {
    connected = true;
    logger.info("Redis connecté");
  });

  client.on("error", (err: Error) => {
    connected = false;
    logger.warn({ error: err.message }, "Redis erreur — fallback in-memory");
  });

  client.on("close", () => {
    connected = false;
  });

  return client;
}

export async function initRedis(): Promise<void> {
  redisClient = createRedisClient();
  if (redisClient) {
    try {
      await redisClient.connect();
    } catch {
      logger.warn("Redis indisponible — mode in-memory");
      redisClient = null;
    }
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
    connected = false;
  }
}

export function isRedisConnected(): boolean {
  return connected && redisClient !== null;
}

export function getRedis(): RedisInstance | null {
  return redisClient;
}
