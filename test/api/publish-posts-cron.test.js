import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import Post from "@/models/Post";

vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/gbpClient", () => ({ publishPost: vi.fn(async () => ({ published: true })) }));

let GET;
beforeEach(async () => {
  process.env.CRON_SECRET = "s";
  ({ GET } = await import("@/app/api/cron/publish-posts/route"));
});
const req = (auth) => new Request("http://localhost", { headers: auth ? { authorization: auth } : {} });

describe("GET /api/cron/publish-posts", () => {
  it("401 without secret", async () => { expect((await GET(req())).status).toBe(401); });

  it("publishes due scheduled posts", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const loc = await Location.create({ orgId, businessName: "A", managed: true });
    await Post.create({ locationId: loc._id, orgId, type: "update", content: "due", status: "scheduled", scheduledFor: new Date(Date.now() - 1000) });
    await Post.create({ locationId: loc._id, orgId, type: "update", content: "future", status: "scheduled", scheduledFor: new Date(Date.now() + 1e7) });
    const res = await GET(req("Bearer s"));
    const data = await res.json();
    expect(data.published).toBe(1);
  });
});
