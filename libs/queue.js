/**
 * BullMQ queue definition for audit job processing.
 *
 * The queue is used by:
 *   - API route (producer): adds jobs when user requests an audit
 *   - Worker (consumer): picks up and processes audit jobs on Railway
 */
import { Queue } from "bullmq";
import { getRedis, isRedisConfigured } from "./redis.js";

export const AUDIT_QUEUE_NAME = "audit-jobs";

let auditQueue = null;

/**
 * Get or create the audit queue instance.
 * Returns null if Redis is not configured (falls back to sync processing).
 *
 * @returns {Queue|null}
 */
export function getAuditQueue() {
    if (!isRedisConfigured()) {
        return null;
    }

    if (!auditQueue) {
        const connection = getRedis();
        auditQueue = new Queue(AUDIT_QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                removeOnComplete: { count: 100 },  // Keep last 100 completed jobs
                removeOnFail: { count: 50 },       // Keep last 50 failed jobs
                attempts: 2,                        // Retry once on failure
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
            },
        });
    }

    return auditQueue;
}
