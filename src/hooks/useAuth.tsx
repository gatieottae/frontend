import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { http } from "@/lib/http";   // ✅

export interface User {
  id: string | number;
  email?: string | null;
  name?: string | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  startKakaoLogin: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshMe().catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshMe = async () => {
    try {
      setLoading(true);
      const { data } = await http.get("/auth/me"); // ✅ http 사용
      const mapped: User = {
        id: data.id ?? data.memberId ?? data.user?.id,
        email: data.email ?? data.user?.email ?? null,
        name: data.name ?? data.user?.name ?? data.nickname ?? null,
        nickname: data.nickname ?? data.user?.nickname ?? null,
        profileImageUrl: data.profileImageUrl ?? data.user?.profileImageUrl ?? null,
      };
      setUser(mapped);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const startKakaoLogin = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<{ authorizeUrl: string }>("/auth/kakao/login-url", { __skipAuth: true as any });
      window.location.href = data.authorizeUrl;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await http.post("/auth/login", { username: email, password }, { __skipAuth: true as any });
      if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      await refreshMe();
      return { error: null };
    } catch (error: any) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return { error: { message: error?.response?.data?.message || error.message } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      await http.post("/auth/signup", { email, password, name }, { __skipAuth: true as any });
      return { error: null };
    } catch (error: any) {
      return { error: { message: error?.response?.data?.message || error.message } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await http.post("/auth/logout").catch(() => {});
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setLoading(false);
    }
  };

  return (
      <AuthContext.Provider
          value={{ user, loading, signIn, signUp, signOut, startKakaoLogin, refreshMe }}
      >
        {children}
      </AuthContext.Provider>
  );
};