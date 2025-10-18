/**
 * Simple in-memory cache and rate limiter
 * No Redis required!
 */

// In-memory cache store
const cache = new Map<string, { data: any; expiry: number }>();

// In-memory rate limiter
const rateLimits = new Map<string, number[]>();

/**
 * Simple rate limiter
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing requests
  const requests = rateLimits.get(identifier) || [];

  // Filter out old requests
  const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (recentRequests.length >= maxRequests) {
    return false;
  }

  // Add current request
  recentRequests.push(now);
  rateLimits.set(identifier, recentRequests);

  // Cleanup periodically
  if (Math.random() < 0.01) {
    cleanupRateLimits();
  }

  return true;
}

/**
 * Cleanup old rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now();
  const windowStart = now - 60000;

  for (const [key, timestamps] of rateLimits.entries()) {
    const recent = timestamps.filter((t) => t > windowStart);
    if (recent.length === 0) {
      rateLimits.delete(key);
    } else {
      rateLimits.set(key, recent);
    }
  }
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  // Check if expired
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Set cached data
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = 60
): Promise<void> {
  const expiry = Date.now() + (ttl * 1000);
  cache.set(key, { data, expiry });

  // Cleanup periodically
  if (Math.random() < 0.01) {
    cleanupCache();
  }
}

/**
 * Delete cached data
 */
export async function deleteCachedData(key: string): Promise<void> {
  cache.delete(key);
}

/**
 * Cleanup expired cache entries
 */
function cleanupCache() {
  const now = Date.now();

  for (const [key, value] of cache.entries()) {
    if (now > value.expiry) {
      cache.delete(key);
    }
  }
}

/**
 * Stock-specific cache helpers
 */
export async function getCachedStockData(symbol: string) {
  return getCachedData<any>(`stock:${symbol}`);
}

export async function setCachedStockData(symbol: string, data: any, ttl = 15) {
  return setCachedData(`stock:${symbol}`, data, ttl);
}

// Export for backward compatibility
export { checkRateLimit as apiRateLimit, checkRateLimit as upstoxRateLimit };
