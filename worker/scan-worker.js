/**
 * BullMQ Scan Worker Process — runs on Railway (separate from Vercel).
 *
 * Picks up grid-scan jobs from the Redis queue and runs the geo-grid scan
 * pipeline for a location, persisting GridScan results to MongoDB.
 *
 * Start: node worker/scan-worker.js
 * Deploy: Railway with REDIS_URL + MONGODB_URI + DataForSEO / Google Places keys
 *
 * Mirrors worker/index.js: own Redis + mongoose connections and dynamic imports
 * of shared libs (the libs use the "@/" alias, resolved the same way as the
 * existing audit worker).
 */
import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";

const QUEUE_NAME = "scan-jobs";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("[ScanWorker] Connected to MongoDB");
}

async function processScan(job) {
  const { locationId } = job.data;
  console.log(`[ScanWorker] Processing scan for location ${locationId}`);

  await connectDB();
  const Location = (await import("../models/Location.js")).default;
  const { runLocationScan } = await import("../libs/scanEngine.js");

  const location = await Location.findById(locationId);
  if (!location) {
    console.warn(`[ScanWorker] Location ${locationId} not found — skipping`);
    return { skipped: true };
  }
  const scans = await runLocationScan(location);
  return { scanned: scans.length };
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("[ScanWorker] REDIS_URL is not set — cannot start worker");
  process.exit(1);
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker(QUEUE_NAME, processScan, {
  connection,
  concurrency: 3,
});

worker.on("completed", (job, result) => {
  console.log(`[ScanWorker] Job ${job.id} completed:`, result);
});

worker.on("failed", (job, err) => {
  console.error(`[ScanWorker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[ScanWorker] Worker error:", err.message);
});

console.log(`[ScanWorker] Started. Listening for "${QUEUE_NAME}" jobs...`);

process.on("SIGTERM", async () => {
  console.log("[ScanWorker] SIGTERM received. Shutting down...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[ScanWorker] SIGINT received. Shutting down...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});
