import Redis from 'ioredis';

let redis = null;
let isConnected = false;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('Redis connected');
    });

    redis.on('error', (err) => {
      isConnected = false;
      console.warn('Redis error (falling back to no-cache):', err.message);
    });

    redis.on('close', () => {
      isConnected = false;
    });

    redis.connect().catch(() => {
      console.warn('Redis unavailable, running without cache');
    });
  }
  return redis;
}

export async function cacheGet(key) {
  try {
    const client = getRedis();
    if (!isConnected) return null;
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const client = getRedis();
    if (!isConnected) return;
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // silently fail
  }
}

export async function cacheDel(key) {
  try {
    const client = getRedis();
    if (!isConnected) return;
    await client.del(key);
  } catch {
    // silently fail
  }
}

export async function cacheIncr(key, ttlSeconds = 60) {
  try {
    const client = getRedis();
    if (!isConnected) return 0;
    const val = await client.incr(key);
    if (val === 1) {
      await client.expire(key, ttlSeconds);
    }
    return val;
  } catch {
    return 0;
  }
}

export async function rateLimitCheck(identifier, limit = 100, windowSeconds = 60) {
  const key = `ratelimit:${identifier}`;
  const count = await cacheIncr(key, windowSeconds);
  return count <= limit;
}

export function getRedisClient() {
  return getRedis();
}

export function isRedisConnected() {
  return isConnected;
}
