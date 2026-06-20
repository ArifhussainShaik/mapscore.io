// test/libs/aiVisibility.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

const askMock = vi.fn();
vi.mock("@/libs/anthropic", () => ({
  isAnthropicConfigured: () => true,
  askClaude: (...a) => askMock(...a),
}));

let checkVisibility;
beforeEach(async () => {
  ({ checkVisibility } = await import("@/libs/aiVisibility"));
  askMock.mockReset();
});

describe("checkVisibility", () => {
  it("detects a mention in the Claude answer", async () => {
    askMock.mockResolvedValue("Top plumbers include Joe's Plumbing and Ace Plumbing.");
    const results = await checkVisibility({ businessName: "Joe's Plumbing", category: "plumber", city: "Newark NJ", models: ["claude"] });
    const claude = results.find((r) => r.model === "claude");
    expect(claude.mentioned).toBe(true);
    expect(claude.query).toMatch(/plumber/);
  });

  it("reports not mentioned when absent", async () => {
    askMock.mockResolvedValue("Top plumbers include Ace Plumbing and Bolt HVAC.");
    const results = await checkVisibility({ businessName: "Joe's Plumbing", category: "plumber", city: "Newark NJ", models: ["claude"] });
    expect(results[0].mentioned).toBe(false);
  });
});
