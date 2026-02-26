/**
 * Redis caching layer for API responses.
 *
 * Caches DataForSEO/SERPApi results by placeId with configurable TTL.
 * Falls back to no-op when Redis is not configured.
 */
import { getRedis } from "./redis.js";

const DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {Promise<Object|null>}
 */
export async function cacheGet(key) {
    const redis = getRedis();
    if (!redis) return null;

    try {
        const value = await redis.get(`mapscore:${key}`);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.error("[Cache] Get error:", err.message);
        return null;
    }
}

/**
 * Set a cached value with TTL.
 * @param {string} key
 * @param {*} value - Will be JSON-serialized
 * @param {number} [ttlSeconds] - TTL in seconds, default 7 days
 */
export async function cacheSet(key, value, ttlSeconds = DEFAULT_TTL) {
    const redis = getRedis();
    if (!redis) return;

    try {
        await redis.set(`mapscore:${key}`, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
        console.error("[Cache] Set error:", err.message);
    }
}

/**
 * Delete a cached value.
 * @param {string} key
 */
export async function cacheDel(key) {
    const redis = getRedis();
    if (!redis) return;

    try {
        await redis.del(`mapscore:${key}`);
    } catch (err) {
        console.error("[Cache] Del error:", err.message);
    }
}
