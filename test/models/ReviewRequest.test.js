import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import ReviewRequest from "@/models/ReviewRequest";

describe("ReviewRequest model", () => {
  it("defaults status to queued", async () => {
    const r = await ReviewRequest.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      recipientEmail: "cust@example.com",
    });
    expect(r.status).toBe("queued");
    expect(r.channel).toBe("email");
  });
});
