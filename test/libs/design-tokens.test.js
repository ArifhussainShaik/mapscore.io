import { describe, it, expect } from "vitest";
import { getGrade, getScoreAccent, getRankBg, trendOf } from "@/libs/design-tokens";

describe("design-tokens", () => {
  it("maps scores to grades", () => {
    expect(getGrade(95)).toBe("A");
    expect(getGrade(82)).toBe("B+");
    expect(getGrade(77)).toBe("B");
    expect(getGrade(66)).toBe("C+");
    expect(getGrade(56)).toBe("C");
    expect(getGrade(45)).toBe("D");
    expect(getGrade(20)).toBe("F");
  });
  it("returns hex accents by score", () => {
    expect(getScoreAccent(95)).toBe("#22c55e");
    expect(getScoreAccent(20)).toBe("#ef4444");
  });
  it("handles null rank", () => {
    expect(getRankBg(null)).toContain("zinc-800");
    expect(getRankBg(1)).toContain("emerald-500");
  });
  it("computes trend direction", () => {
    expect(trendOf(80, 70)).toBe("up");
    expect(trendOf(60, 70)).toBe("down");
    expect(trendOf(70, 70)).toBe("flat");
  });
});
