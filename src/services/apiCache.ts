/**
 * High-performance In-Memory API Cache with TTL & Stale-While-Revalidate
 * Used by Vercel-style frontend data pipelines
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  public get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const isExpired = age > entry.ttl;

    // Keep entry available for stale-while-revalidate for up to 3x TTL
    if (age > entry.ttl * 3) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      isStale: isExpired,
    };
  }

  public set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  public invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
