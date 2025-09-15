import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "@/lib/http";       // ✅ api.ts 대신 http.ts
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
    const { refreshMe } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const search = new URLSearchParams(window.location.search);
                const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

                const urlAccess = search.get("accessToken") || hash.get("accessToken");
                const urlRefresh = search.get("refreshToken") || hash.get("refreshToken");

                if (urlAccess) localStorage.setItem("accessToken", urlAccess);
                if (urlRefresh) localStorage.setItem("refreshToken", urlRefresh);

                if (!urlAccess) {
                    // ✅ 쿠키→토큰 교환: __skipAuth 로 Authorization 완전 배제
                    try {
                        const res = await http.get("/auth/token", { __skipAuth: true as any });
                        if (res.data?.accessToken) localStorage.setItem("accessToken", res.data.accessToken);
                        if (res.data?.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);
                        if (import.meta.env.DEV) console.log("[AuthCallback] exchanged token via cookie");
                    } catch (err) {
                        if (import.meta.env.DEV) console.warn("[AuthCallback] /auth/token exchange failed", err);
                    }
                } else {
                    if (import.meta.env.DEV) console.log("[AuthCallback] token found in URL");
                }

                await refreshMe(); // 여기서 200이면 로그인 성공

                window.history.replaceState({}, "", window.location.pathname);
                navigate("/", { replace: true });
            } catch {
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