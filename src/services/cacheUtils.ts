/**
 * In-memory cache utility with a 5-minute TTL (Time-To-Live).
 * Optimizes Firestore reads and eliminates redundant network hops across route transitions.
 */

export const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private pending = new Map<string, Promise<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  peek<T>(key: string): T | null {
    return this.get<T>(key);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  set<T>(key: string, data: T, ttlMs: number = FIVE_MINUTES_MS): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = FIVE_MINUTES_MS,
    forceRefresh = false
  ): Promise<T> {
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const inFlight = this.pending.get(key) as Promise<T> | undefined;
      if (inFlight) {
        return inFlight;
      }
    }

    const promise = (async () => {
      try {
        const result = await fetcher();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.store.delete(key);
    this.pending.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    for (const key of this.pending.keys()) {
      if (key.startsWith(prefix)) {
        this.pending.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
    this.pending.clear();
  }
}

export const memoryCache = new InMemoryCache();
