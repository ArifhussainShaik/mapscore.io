import { describe, it, expect } from "vitest";
import { generateGrid } from "@/libs/grid";

describe("generateGrid", () => {
  it("returns gridSize^2 points", () => {
    const pts = generateGrid(40.7128, -74.006, 7, 5);
    expect(pts).toHaveLength(49);
    pts.forEach((p) => {
      expect(typeof p.lat).toBe("number");
      expect(typeof p.lng).toBe("number");
    });
  });

  it("centers the grid on the given coordinate", () => {
    const pts = generateGrid(40, -74, 3, 3); // 3x3, center is index 4
    const center = pts[4];
    expect(center.lat).toBeCloseTo(40, 5);
    expect(center.lng).toBeCloseTo(-74, 5);
  });

  it("spans roughly ±radius in latitude (1 deg lat ≈ 69 mi)", () => {
    const pts = generateGrid(40, -74, 3, 69); // ±69 mi ≈ ±1 deg
    const lats = pts.map((p) => p.lat);
    expect(Math.max(...lats)).toBeCloseTo(41, 1);
    expect(Math.min(...lats)).toBeCloseTo(39, 1);
  });
});
