export type AuthRole = "CLIENT" | "PROPRIETAIRE" | "ADMIN";

export type AuthContext = {
  userId: string;
  phone: string;
  role: AuthRole;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
