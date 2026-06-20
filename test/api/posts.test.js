import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import Post from "@/models/Post";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/postGenerator", () => ({ generatePost: async () => "Generated post copy about offers!" }));

let listPOST, itemPATCH;
beforeEach(async () => {
  listPOST = (await import("@/app/api/locations/[id]/posts/route")).POST;
  itemPATCH = (await import("@/app/api/posts/[id]/route")).PATCH;
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("post APIs", () => {
  it("generates a draft post for an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe" });
    const res = await listPOST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ type: "offer", topic: "20% off" }) }),
      ctx(loc._id.toString())
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.post.status).toBe("draft");
    expect(data.post.content).toMatch(/offers/i);
  });

  it("schedules a post via PATCH", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe" });
    const post = await Post.create({ locationId: loc._id, orgId: org._id, type: "update", content: "hi" });
    const when = new Date(Date.now() + 86400000).toISOString();
    const res = await itemPATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "scheduled", scheduledFor: when }) }),
      ctx(post._id.toString())
    );
    expect(res.status).toBe(200);
    const updated = await Post.findById(post._id);
    expect(updated.status).toBe("scheduled");
  });
});
