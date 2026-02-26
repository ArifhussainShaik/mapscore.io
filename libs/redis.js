/**
 * Redis connection singleton for BullMQ and caching.
 *
 * Reads REDIS_URL from environment. Falls back gracefully
 * when Redis is not configured (local dev without Redis).
 */
import Redis from "ioredis";

let redis = null;

/**
 * Check if Redis is configured.
 */
export function isRedisConfigured() {
    return !!process.env.REDIS_URL;
}

/**
 * Get or create the Redis connection singleton.
 * @returns {Redis|null}
 */
export function getRedis() {
    if (!isRedisConfigured()) {
        return null;
    }

    if (!redis) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null, // Required by BullMQ
            enableReadyCheck: false,
            retryStrategy(times) {
                const delay = Math.min(times * 200, 5000);
                return delay;
            },
        });

        redis.on("error", (err) => {
            console.error("[Redis] Connection error:", err.message);
        });

        redis.on("connect", () => {
            console.log("[Redis] Connected successfully");
        });
    }

    return redis;
}

/**
 * Close the Redis connection (for graceful shutdown).
 */
export async function closeRedis() {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
