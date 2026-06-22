import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Client from "@/models/Client";

describe("Client model", () => {
  it("creates a client with required fields", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const client = await Client.create({
      orgId,
      name: "Acme Corp",
      contactName: "Jane Smith",
      contactEmail: "jane@acme.com",
    });
    expect(client.name).toBe("Acme Corp");
    expect(client.contactName).toBe("Jane Smith");
    expect(client.contactEmail).toBe("jane@acme.com");
    expect(client.orgId.toString()).toBe(orgId.toString());
    expect(client.createdAt).toBeDefined();
  });

  it("trims name whitespace", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const client = await Client.create({ orgId, name: "  Padded Name  " });
    expect(client.name).toBe("Padded Name");
  });

  it("rejects a client without name", async () => {
    const orgId = new mongoose.Types.ObjectId();
    await expect(Client.create({ orgId })).rejects.toThrow();
  });

  it("rejects a client without orgId", async () => {
    await expect(Client.create({ name: "No Org" })).rejects.toThrow();
  });
});
