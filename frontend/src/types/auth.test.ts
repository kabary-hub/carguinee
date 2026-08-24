import { describe, expect, it } from "vitest";
import type { UserRole, AuthUser, AuthResponse, MeResponse } from "./auth";

describe("auth types", () => {
  it("UserRole est un type valide", () => {
    const role: UserRole = "CLIENT";
    expect(["CLIENT", "PROPRIETAIRE", "ADMIN"]).toContain(role);
  });

  it("AuthUser type est utilisable", () => {
    const user: AuthUser = {
      id: "1",
      phone: "+22412345678",
      email: null,
      firstName: "Test",
      lastName: "User",
      role: "CLIENT",
      isActive: true,
      isBanned: false,
    };
    expect(user.role).toBe("CLIENT");
    expect(user.isActive).toBe(true);
  });

  it("AuthResponse type est utilisable", () => {
    const response: AuthResponse = {
      status: "ok",
      data: {
        user: {
          id: "1",
          phone: "+22412345678",
          email: null,
          firstName: "Test",
          lastName: "User",
          role: "ADMIN",
          isActive: true,
          isBanned: false,
        },
        accessToken: "jwt-token-here",
      },
    };
    expect(response.status).toBe("ok");
    expect(response.data.user.role).toBe("ADMIN");
  });

  it("MeResponse type est utilisable", () => {
    const response: MeResponse = {
      status: "ok",
      data: {
        id: "1",
        phone: "+22412345678",
        email: null,
        firstName: "Test",
        lastName: "User",
        role: "PROPRIETAIRE",
        isActive: true,
        isBanned: false,
      },
    };
    expect(response.data.role).toBe("PROPRIETAIRE");
  });
});
