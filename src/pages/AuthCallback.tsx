import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
    const { user, loading, refreshMe } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // AuthProvider가 로드 시 이미 refreshMe를 실행하고 있을 수 있습니다.
        // 하지만 콜백 페이지에 도달하는 시점은 명시적으로 다시 호출하는 것이 안전합니다.
        refreshMe().finally(() => {
            navigate("/", { replace: true });
        });
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
