export type UserRole = "CLIENT" | "PROPRIETAIRE" | "ADMIN";

export type AuthUser = {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
};

export type AuthResponse = {
  status: "ok";
  data: {
    user: AuthUser;
    accessToken: string;
  };
};

export type MeResponse = {
  status: "ok";
  data: AuthUser;
};
