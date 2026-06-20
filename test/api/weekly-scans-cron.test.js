import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/scanQueue", () => ({ getScanQueue: () => null })); // force sync path
const runMock = vi.fn(async () => []);
vi.mock("@/libs/scanEngine", () => ({ runLocationScan: (...a) => runMock(...a) }));

let GET;
beforeEach(async () => {
  process.env.CRON_SECRET = "secret123";
  ({ GET } = await import("@/app/api/cron/weekly-scans/route"));
  runMock.mockClear();
});

const req = (auth) =>
  new Request("http://localhost/api/cron/weekly-scans", { headers: auth ? { authorization: auth } : {} });

describe("GET /api/cron/weekly-scans", () => {
  it("401 without the cron secret", async () => {
    expect((await GET(req())).status).toBe(401);
  });

  it("runs a scan for each active location (sync fallback)", async () => {
    const orgId = new mongoose.Types.ObjectId();
    await Location.create({ orgId, businessName: "A", status: "active", tracking: { keywords: ["x"] } });
    await Location.create({ orgId, businessName: "B", status: "paused", tracking: { keywords: ["y"] } });

    const res = await GET(req("Bearer secret123"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.enqueued).toBe(1); // only the active location
    expect(runMock).toHaveBeenCalledTimes(1);
  });
});
