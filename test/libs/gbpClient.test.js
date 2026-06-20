import { describe, it, expect } from "vitest";
import { publishPost } from "@/libs/gbpClient";

describe("publishPost", () => {
  it("returns draftOnly when the location is not managed", async () => {
    const res = await publishPost({ managed: false }, { content: "hi" });
    expect(res.draftOnly).toBe(true);
    expect(res.published).toBe(false);
  });
});
