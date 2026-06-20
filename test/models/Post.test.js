import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Post from "@/models/Post";

describe("Post model", () => {
  it("defaults to draft status", async () => {
    const p = await Post.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      type: "offer",
      content: "20% off drain cleaning this week!",
    });
    expect(p.status).toBe("draft");
  });

  it("rejects an invalid status", async () => {
    await expect(
      Post.create({ locationId: new mongoose.Types.ObjectId(), type: "update", content: "x", status: "launched" })
    ).rejects.toThrow();
  });
});
