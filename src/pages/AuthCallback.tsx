// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
    const { refreshMe } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                // 1) URL에서 토큰 추출 (?accessToken=... 또는 #accessToken=...)
                const search = new URLSearchParams(window.location.search);
                const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

                const urlAccess = search.get("accessToken") || hash.get("accessToken");
                const urlRefresh = search.get("refreshToken") || hash.get("refreshToken");

                if (urlAccess) localStorage.setItem("accessToken", urlAccess);
                if (urlRefresh) localStorage.setItem("refreshToken", urlRefresh);

                // 2) URL에 없으면 쿠키→토큰 교환
                if (!urlAccess) {
                    try {
                        const { data } = await api.get("/auth/token", { withCredentials: true });
                        if (data?.accessToken) {
                            localStorage.setItem("accessToken", data.accessToken);
                        }
                        if (data?.refreshToken) {
                            localStorage.setItem("refreshToken", data.refreshToken);
                        }
                        if (import.meta.env.DEV) console.log("[AuthCallback] exchanged token via cookie");
                    } catch (err) {
                        if (import.meta.env.DEV) console.warn("[AuthCallback] /auth/token exchange failed", err);
                        // 교환 실패 시에도 아래 refreshMe로 401이면 잡힘
                    }
                } else {
                    if (import.meta.env.DEV) console.log("[AuthCallback] token found in URL");
                }

                // 3) 내 프로필 하이드레이션 (여기서 401이면 로그인 실패로 간주)
                await refreshMe();

                // 4) URL 정리
                window.history.replaceState({}, "", window.location.pathname);

                // 5) 성공 → 홈
                navigate("/", { replace: true });
            } catch (e) {
                // 실패 → 로그인 페이지로
                window.history.replaceState({}, "", window.location.pathname);
                navigate("/login?reason=callback_error", { replace: true });
            }
        })();
    }, [refreshMe, navigate]);

    return (
        <div className="min-h-screen grid place-items-center bg-background">
            <div className="text-center">
                <p className="text-lg font-semibold text-foreground">로그인 처리 중...</p>
                <p className="text-sm text-muted-foreground">잠시만 기다려주세요.</p>
            </div>
        </div>
    );
};

export default AuthCallback;