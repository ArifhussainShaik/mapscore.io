import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import Location from "@/models/Location";

// Mock auth + db-connect (mongoose is already connected by test/setup.js)
const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET, POST;
beforeEach(async () => {
  ({ GET, POST } = await import("@/app/api/locations/route"));
  sessionMock.mockReset();
});

function makeReq(body) {
  return new Request("http://localhost/api/locations", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/locations", () => {
  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("creates a location and lists it", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });

    const createRes = await POST(makeReq({ businessName: "Joe's Plumbing", googlePlaceId: "ChIJ1" }));
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.location.businessName).toBe("Joe's Plumbing");

    const listRes = await GET();
    const listed = await listRes.json();
    expect(listed.locations).toHaveLength(1);
  });

  it("blocks creation past the quota with 402", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await POST(makeReq({ businessName: "First" })); // free quota = 1
    const res = await POST(makeReq({ businessName: "Second" }));
    expect(res.status).toBe(402);
  });

  it("rejects a location with no businessName (400)", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const res = await POST(makeReq({ googlePlaceId: "x" }));
    expect(res.status).toBe(400);
  });
});
