import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "../lib/api";
import type { AuthResponse, AuthUser, MeResponse } from "../types/auth";

type RegisterInput = {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
};

type LoginInput = {
  phone: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Connecte l'utilisateur et renvoie son profil (rôle inclus) pour rediriger ensuite. */
  login: (input: LoginInput) => Promise<AuthUser>;
  /** Inscrit l'utilisateur et renvoie son profil (rôle CLIENT par défaut). */
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    apiFetch<MeResponse>("/api/auth/me")
      .then((response) => setUser(response.data))
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(input: LoginInput): Promise<AuthUser> {
    const response = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });

    storeToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(input: RegisterInput): Promise<AuthUser> {
    const response = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });

    storeToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    clearStoredToken();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider.");
  }

  return context;
}
