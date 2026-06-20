import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import ReviewRequest from "@/models/ReviewRequest";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/reviewRequest", () => ({
  sendReviewRequest: vi.fn(async () => ({ sent: true })),
  reviewLink: (pid) => `https://search.google.com/local/writereview?placeid=${pid}`,
}));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/locations/[id]/review-requests/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("POST /api/locations/[id]/review-requests", () => {
  it("creates + sends a review request for an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe", googlePlaceId: "ChIJ_joe" });
    const res = await POST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ recipientEmail: "cust@example.com" }) }),
      ctx(loc._id.toString())
    );
    expect(res.status).toBe(201);
    const saved = await ReviewRequest.find({ locationId: loc._id });
    expect(saved).toHaveLength(1);
    expect(saved[0].status).toBe("sent");
  });
});
