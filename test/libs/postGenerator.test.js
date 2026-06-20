import { describe, it, expect, beforeEach } from "vitest";
import { generatePost } from "@/libs/postGenerator";

describe("generatePost (no API key → fallback)", () => {
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY; });

  it("returns a non-empty post string using the inputs", async () => {
    const text = await generatePost({
      businessName: "Joe's Plumbing",
      type: "offer",
      topic: "20% off drain cleaning",
      tone: "friendly",
    });
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text).toMatch(/drain cleaning/i);
  });
});
