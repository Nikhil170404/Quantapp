import Redis from 'ioredis';

// Initialize Redis client with graceful fallback
const getRedisClient = () => {
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        // Stop retrying after first attempt if Redis is unavailable
        if (times > 1) return null;
        return 100;
      },
      lazyConnect: true, // Don't connect immediately
      enableOfflineQueue: false,
    });

    // Suppress error logs for connection issues
    redis.on('error', () => {
      // Silently ignore Redis connection errors
    });

    return redis;
  } catch (error) {
    console.warn('Redis client creation failed, running without cache');
    return null;
  }
};

export const redis = getRedisClient();

// Simple in-memory rate limiter fallback
class MemoryRateLimit {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async limit(identifier: string): Promise<{ success: boolean }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= this.limit) {
      return { success: false };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return { success: true };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter((t) => t > windowStart);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }
}

// Rate limiters with fallback
export const upstoxRateLimit = new MemoryRateLimit(500, 60000); // 500 req/min
export const apiRateLimit = new MemoryRateLimit(100, 60000); // 100 req/min

// Cache helpers with graceful fallback
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    // Silently fail if Redis is unavailable
    return null;
  }
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = 60
): Promise<void> {
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    // Silently fail if Redis is unavailable
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    // Silently fail if Redis is unavailable
  }
}

export async function getCachedStockData(symbol: string) {
  return getCachedData<any>(`stock:${symbol}`);
}

export async function setCachedStockData(symbol: string, data: any, ttl = 15) {
  return setCachedData(`stock:${symbol}`, data, ttl);
}
