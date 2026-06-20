import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";
import Report from "@/models/Report";

let buildReport;
beforeEach(async () => {
  ({ buildReport } = await import("@/libs/reportBuilder"));
});

describe("buildReport", () => {
  it("builds a report snapshot with arp delta", async () => {
    const org = await Organization.create({ name: "Acme", ownerUserId: new mongoose.Types.ObjectId(), branding: { primaryColor: "#111" } });
    const loc = await Location.create({ orgId: org._id, businessName: "Joe", tracking: { keywords: ["plumber"] } });

    // older then newer scan → delta computed
    await GridScan.create({ locationId: loc._id, keyword: "plumber", metrics: { arp: 8, solv: 30 }, points: [], createdAt: new Date("2026-05-01") });
    await GridScan.create({ locationId: loc._id, keyword: "plumber", metrics: { arp: 5, solv: 55 }, points: [], createdAt: new Date("2026-06-01") });

    const report = await buildReport(loc, "2026-06");
    const kw = report.snapshot.keywords.find((k) => k.keyword === "plumber");
    expect(kw.arp).toBe(5);
    expect(kw.arpDelta).toBe(-3); // improved by 3
    expect(report.branding.agencyName).toBe("Acme");
    const saved = await Report.findById(report._id);
    expect(saved).not.toBeNull();
  });
});
