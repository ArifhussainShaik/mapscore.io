import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import OutreachEmail from "@/models/OutreachEmail";

describe("OutreachEmail model", () => {
  it("stores a send with an unsubscribe token", async () => {
    const e = await OutreachEmail.create({
      orgId: new mongoose.Types.ObjectId(),
      prospectId: new mongoose.Types.ObjectId(),
      toEmail: "bob@example.com",
      subject: "Quick note about Bob's HVAC",
      body: "Hi Bob...",
    });
    expect(e.status).toBe("sent");
    expect(e.unsubscribeToken).toBeTruthy();
    expect(e.unsubscribed).toBe(false);
  });
});
