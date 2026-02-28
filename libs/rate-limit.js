/**
 * Rate limiting utility using Upstash Redis
 *
 * Usage:
 * import { checkRateLimit } from "@/libs/rate-limit";
 * const { success } = await checkRateLimit(req);
 * if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimitInstance = null;

function getRatelimit() {
    if (ratelimitInstance) return ratelimitInstance;

    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn("[RateLimit] Redis not configured - using in-memory fallback (NOT FOR PRODUCTION!)");

        // In-memory fallback for development
        const Map = require("node:async_hooks").AsyncLocalStorage || global.Map;
        const cache = new Map();

        ratelimitInstance = {
            limit: async (identifier) => {
                const key = `ratelimit:${identifier}`;
                const now = Date.now();
                const windowMs = 60 * 1000; // 1 minute
                const maxRequests = 10;

                const record = cache.get(key) || { count: 0, resetTime: now + windowMs };

                if (now > record.resetTime) {
                    record.count = 0;
                    record.resetTime = now + windowMs;
                }

                record.count++;
                cache.set(key, record);

                return {
                    success: record.count <= maxRequests,
                    limit: maxRequests,
                    remaining: Math.max(0, maxRequests - record.count),
                    reset: new Date(record.resetTime)
                };
            }
        };

        return ratelimitInstance;
    }

    // Production: Use Upstash Redis
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimitInstance = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
        analytics: true,
        prefix: "mapscore",
    });

    return ratelimitInstance;
}

/**
 * Check rate limit for a request
 * @param {Request} req - Next.js request object
 * @param {string} identifier - Optional custom identifier (defaults to IP)
 * @returns {Promise<{success: boolean, limit: number, remaining: number, reset: Date}>}
 */
export async function checkRateLimit(req, identifier = null) {
    const ratelimit = getRatelimit();

    // Use custom identifier or fall back to IP address
    const id = identifier || getClientIdentifier(req);

    try {
        const result = await ratelimit.limit(id);
        return result;
    } catch (error) {
        console.error("[RateLimit] Error:", error.message);
        // On error, allow the request (fail open)
        return { success: true, limit: 10, remaining: 10, reset: new Date() };
    }
}

/**
 * Get client identifier for rate limiting
 * Uses multiple fallbacks: userId > IP > x-forwarded-for > default
 */
function getClientIdentifier(req) {
    // Try to get from headers (Vercel, Cloudflare, etc)
    const ip = req.headers.get("x-real-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.ip ||
               "anonymous";

    return ip;
}

/**
 * Higher rate limit for authenticated users
 */
export async function checkAuthenticatedRateLimit(req, userId) {
    const ratelimit = getRatelimit();

    // Authenticated users get higher limits
    const id = `user:${userId}`;

    try {
        const result = await ratelimit.limit(id);
        return result;
    } catch (error) {
        console.error("[RateLimit] Error:", error.message);
        return { success: true, limit: 50, remaining: 50, reset: new Date() };
    }
}
