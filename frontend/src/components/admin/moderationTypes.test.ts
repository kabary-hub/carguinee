import { describe, expect, it } from "vitest";
import type { ModerationUser, ReactivationRequest } from "./moderationTypes";

describe("moderationTypes", () => {
  it("ModerationUser type est utilisable", () => {
    const user: ModerationUser = {
      id: "1",
      phone: "+22412345678",
      email: null,
      firstName: "Test",
      lastName: "User",
      role: "CLIENT",
      isActive: true,
      isBanned: false,
      createdAt: "2024-01-01T00:00:00Z",
    };
    expect(user.isBanned).toBe(false);
  });

  it("ReactivationRequest type est utilisable", () => {
    const request: ReactivationRequest = {
      id: "1",
      userId: "2",
      phone: "+22412345678",
      firstName: "Test",
      lastName: "User",
      reason: "Je souhaite réactiver mon compte",
      status: "PENDING",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    expect(request.status).toBe("PENDING");
  });
});
