import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import api from '@/lib/api';

// 서버가 쿠키(JWT)를 세팅/검증하고, 프론트는 /auth/me 로 현재 사용자만 조회하는 구조입니다.
// 카카오는 버튼 클릭 -> 백엔드에서 받은 authorizeUrl 로 이동 -> 콜백에서 쿠키 세팅 -> 홈으로 리다이렉트 ->
// 앱이 부팅되며 /auth/me 호출로 사용자 상태(user) 하이드레이션.

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
  // 로컬 아이디/패스워드 로그인(있다면)
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // 카카오 로그인 시작
  startKakaoLogin: () => Promise<void>;
  // 수동으로 /auth/me 재조회
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // 앱 시작 시 쿠키 기반 세션 하이드레이션
  useEffect(() => {
    // 첫 렌더에서만 한번 불러오기
    refreshMe().catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshMe = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/me'); // 200이면 로그인 상태
      // 백엔드에서 내려주는 필드 이름에 맞춰 매핑(필요 시 조정)
      const mapped: User = {
        id: data.id ?? data.memberId ?? data.user?.id,
        email: data.email ?? data.user?.email ?? null,
        name: data.name ?? data.user?.name ?? data.nickname ?? null,
        nickname: data.nickname ?? data.user?.nickname ?? null,
        profileImageUrl: data.profileImageUrl ?? data.user?.profileImageUrl ?? null,
      };
      setUser(mapped);
    } catch (e) {
      setUser(null); // 401 등은 비로그인으로 취급
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인 시작: 백엔드에서 authorizeUrl 받아 리다이렉트
  const startKakaoLogin = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ authorizeUrl: string }>('/auth/kakao/login-url');
      // 백엔드가 state를 쓰고 싶다면 여기서 붙여도 됨
      window.location.href = data.authorizeUrl;
    } finally {
      setLoading(false);
    }
  };

  // 로컬 로그인
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // ✅ 엔드포인트 변경: /auth/signin -> /auth/login
      await api.post('/auth/login', { username: email, password });
      // 로그인 시 쿠키를 심는 구조이므로, 유저 정보는 /auth/me로 다시 가져온다.
      await refreshMe();
      return { error: null };
    } catch (error: any) {
      return { error: { message: error?.response?.data?.message || error.message } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      await api.post('/auth/signup', { email, password, name });
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
      // 서버 쿠키 삭제(엔드포인트가 없으면 무시 가능)
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    startKakaoLogin,
    refreshMe,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};