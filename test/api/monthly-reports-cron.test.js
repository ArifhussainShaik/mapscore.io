import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
const buildMock = vi.fn(async (loc, period) => ({ _id: new mongoose.Types.ObjectId(), shareToken: "tok", locationId: loc._id, branding: { agencyName: "Acme" } }));
vi.mock("@/libs/reportBuilder", () => ({ buildReport: (...a) => buildMock(...a) }));
vi.mock("@/libs/reportEmail", () => ({ sendReportEmail: vi.fn(async () => ({ sent: true })) }));

let GET;
beforeEach(async () => {
  process.env.CRON_SECRET = "s";
  ({ GET } = await import("@/app/api/cron/monthly-reports/route"));
  buildMock.mockClear();
});
const req = (auth) => new Request("http://localhost", { headers: auth ? { authorization: auth } : {} });

describe("GET /api/cron/monthly-reports", () => {
  it("401 without secret", async () => {
    expect((await GET(req())).status).toBe(401);
  });
  it("builds a report per active location", async () => {
    const orgId = new mongoose.Types.ObjectId();
    await Location.create({ orgId, businessName: "A", status: "active", tracking: { keywords: ["x"] } });
    await Location.create({ orgId, businessName: "B", status: "paused" });
    const res = await GET(req("Bearer s"));
    const data = await res.json();
    expect(data.generated).toBe(1);
    expect(buildMock).toHaveBeenCalledTimes(1);
  });
});
