import { Queue } from "bullmq";
import { getRedis, isRedisConfigured } from "./redis.js";

export const SCAN_QUEUE_NAME = "scan-jobs";

let scanQueue = null;
export function getScanQueue() {
  if (!isRedisConfigured()) return null;
  if (!scanQueue) {
    scanQueue = new Queue(SCAN_QUEUE_NAME, {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
      },
    });
  }
  return scanQueue;
}
