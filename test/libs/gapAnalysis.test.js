import { describe, it, expect } from "vitest";
import { analyzeGaps } from "@/libs/gapAnalysis";

describe("analyzeGaps", () => {
  const competitors = [
    { name: "Ace", reviewCount: 300, rating: 4.8, photoCount: 70, category: "Plumber", websiteSignals: { https: true } },
    { name: "Bolt", reviewCount: 260, rating: 4.6, photoCount: 50, category: "Plumber", websiteSignals: { https: true } },
  ];

  it("flags review + photo deficits vs competitor average", () => {
    const target = { reviewCount: 40, rating: 4.5, photoCount: 10, category: "Plumber", websiteSignals: { https: false } };
    const gaps = analyzeGaps(target, competitors);
    const titles = gaps.map((g) => g.title);
    expect(titles.some((t) => /review/i.test(t))).toBe(true);
    expect(titles.some((t) => /photo/i.test(t))).toBe(true);
    expect(titles.some((t) => /https/i.test(t))).toBe(true);
    // ordered by severity (highest impact first)
    expect(gaps[0]).toHaveProperty("severity");
  });

  it("returns no gaps when the target leads on every metric", () => {
    const target = { reviewCount: 500, rating: 4.9, photoCount: 120, category: "Plumber", websiteSignals: { https: true } };
    const gaps = analyzeGaps(target, competitors);
    expect(gaps).toHaveLength(0);
  });
});
