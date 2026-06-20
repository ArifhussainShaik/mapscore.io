import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/libs/anthropic", () => ({
  isAnthropicConfigured: () => false,
  askClaude: async () => null,
}));

let generateOutreach;
beforeEach(async () => {
  ({ generateOutreach } = await import("@/libs/outreach"));
});

describe("generateOutreach (fallback when no AI)", () => {
  it("builds a personalized email referencing the prospect's gaps", async () => {
    const prospect = {
      businessName: "Bob's HVAC",
      auditSnapshot: { score: 42, grade: "D", topGaps: ["No website linked", "Low review count"] },
    };
    const out = await generateOutreach(prospect, { agencyName: "Acme SEO" });
    expect(out.subject).toMatch(/Bob's HVAC/);
    expect(out.body).toMatch(/No website linked/);
    expect(out.body).toMatch(/Acme SEO/);
  });
});
