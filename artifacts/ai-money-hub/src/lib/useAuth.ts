import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { createElement } from "react";
import type { ApiUser } from "./api";
import { authApi } from "./api";

type AuthState = {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: authApi.login,
  logout: authApi.logout,
  refresh: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    authApi
      .getUser()
      .then((d) => { setUser(d.user ?? null); setIsLoading(false); })
      .catch(() => { setUser(null); setIsLoading(false); });
  };

  useEffect(() => { load(); }, []);

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        login: authApi.login,
        logout: authApi.logout,
        refresh: load,
      },
    },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
