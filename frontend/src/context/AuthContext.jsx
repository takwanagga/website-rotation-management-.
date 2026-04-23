import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { verifyUser } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }
        const response = await verifyUser();
        if (cancelled) return;
        if (response.data?.success) {
          setUser(response.data.user);
        } else {
          setUser(null);
          localStorage.removeItem("token");
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          localStorage.removeItem("token");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((userData, token) => {
    console.log("AuthContext.login called with:", userData, token);
    setUser(userData);
    if (token) localStorage.setItem("token", token);
    console.log("Token saved to localStorage");
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  }
  return ctx;
}

export { AuthContext };
