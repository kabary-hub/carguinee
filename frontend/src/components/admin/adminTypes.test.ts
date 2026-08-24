import { describe, expect, it } from "vitest";
import type { AdminUser, AdminStats } from "./adminTypes";

describe("adminTypes", () => {
  it("AdminUser type est utilisable", () => {
    const user: AdminUser = {
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
    expect(user.id).toBe("1");
    expect(user.role).toBe("CLIENT");
  });

  it("AdminStats type est utilisable", () => {
    const stats: AdminStats = {
      totalUsers: 100,
      totalVehicles: 50,
      totalBookings: 200,
      pendingValidation: 5,
      pendingReports: 3,
    };
    expect(stats.totalUsers).toBe(100);
    expect(stats.pendingValidation).toBe(5);
  });
});
