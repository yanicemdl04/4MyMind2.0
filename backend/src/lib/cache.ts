import { logger } from './logger';

/**
 * Cache abstraction layer — currently uses in-memory Map.
 * Drop-in replacement for Redis when scaling:
 *   import Redis from 'ioredis';
 *   const redis = new Redis(env.REDIS_URL);
 */

const store = new Map<string, { value: string; expiresAt: number }>();

export const cache = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    store.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key: string): Promise<void> {
    store.delete(key);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of store.keys()) {
      if (regex.test(key)) store.delete(key);
    }
  },

  async flush(): Promise<void> {
    store.clear();
    logger.debug('Cache flushed');
  },
};
