// test/models/AiVisibilityCheck.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";

describe("AiVisibilityCheck model", () => {
  it("records a mention result", async () => {
    const c = await AiVisibilityCheck.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      query: "best plumber in Newark NJ",
      model: "claude",
      mentioned: true,
      snippet: "...Joe's Plumbing is highly rated...",
    });
    expect(c.mentioned).toBe(true);
    expect(c.model).toBe("claude");
  });

  it("requires locationId, query, model", async () => {
    await expect(AiVisibilityCheck.create({ query: "x" })).rejects.toThrow();
  });
});
