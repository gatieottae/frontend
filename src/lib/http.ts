// src/lib/http.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

/** 내부에서 쓰는 확장 옵션 */
type HttpRequestConfig = AxiosRequestConfig & {
    __skipAuth?: boolean;   // 이 요청은 Authorization/재발급 로직을 스킵
    __retried?: boolean;    // 401 처리 후 원요청 재시도 여부 (무한루프 방지)
};

/** Authorization을 붙이지 않을 무인증 엔드포인트 */
const NO_AUTH_PATHS = ["/auth/token", "/auth/kakao/callback", "/auth/login"];

const isNoAuthPath = (url?: string) =>
    !!url && NO_AUTH_PATHS.some((p) => url.startsWith(p));

/** 동시에 여러 요청이 401일 때 refresh를 한 번만 수행하도록 보호 */
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/** 공용 axios 인스턴스 */
export const http = axios.create({
    baseURL: "/api",
    withCredentials: true,               // ✅ HttpOnly refresh 쿠키 전송
    headers: { "Content-Type": "application/json" },
});

/** 서버 응답에서 새 accessToken 추출 (바디 or 헤더) */
function extractAccessToken(res: AxiosResponse<any>): string | null {
    // 1) 바디 { accessToken: "..." }
    if (res.data?.accessToken) return res.data.accessToken as string;

    // 2) 헤더 Authorization: Bearer <token>
    const auth = (res.headers?.["authorization"] ?? res.headers?.["Authorization"]) as string | undefined;
    if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7);

    return null;
}

/** 요청 인터셉터: 보호 API에만 Authorization 부착 */
http.interceptors.request.use(
    (config: HttpRequestConfig) => {
        if (config.__skipAuth) return config;

        const path = (config.url || "").replace(/^https?:\/\/[^/]+/i, "");
        if (isNoAuthPath(path)) return config; // 무인증 엔드포인트 → 헤더 부착 금지

        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers = config.headers ?? {};
            (config.headers as any).Authorization = `Bearer ${token}`;
        }

        if (import.meta.env.DEV) {
            console.log("[HTTP]", config.method?.toUpperCase(), config.url);
            // console.log("[Authorization]", (config.headers as any).Authorization); // ⚠️ 토큰은 찍지 마세요
        }
        return config;
    },
    (error) => Promise.reject(error),
);

/** 응답 인터셉터: 401 → refresh 1회 → 원 요청 재시도 */
http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const { response, config } = error;
        const original = (config ?? {}) as HttpRequestConfig;

        const is401 = response?.status === 401;
        const isTokenEndpoint = (original.url || "").includes("/auth/token");
        const alreadyRetried = !!original.__retried;

        if (is401 && !isTokenEndpoint && !alreadyRetried) {
            try {
                if (!isRefreshing) {
                    isRefreshing = true;
                    // ✅ Authorization 없이 refresh 쿠키만으로 교환
                    refreshPromise = (async () => {
                        const res = await http.get("/auth/token", { __skipAuth: true as any });
                        const newAt = extractAccessToken(res);
                        if (newAt) localStorage.setItem("accessToken", newAt);
                        return newAt ?? null;
                    })();
                }

                const newAt = await refreshPromise!;
                isRefreshing = false;
                refreshPromise = null;

                // 재시도 설정
                original.__retried = true;
                original.headers = original.headers ?? {};
                if (newAt) (original.headers as any).Authorization = `Bearer ${newAt}`;
                else delete (original.headers as any).Authorization;

                return http(original);
            } catch (e) {
                isRefreshing = false;
                refreshPromise = null;
                localStorage.removeItem("accessToken"); // 실패 시 정리
                // window.location.href = "/login?reason=expired"; // 필요 시
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    },
);

/* =======================
 * 편의 Helper 함수들 (기존 시그니처 유지)
 * ======================= */

export const get = async <T>(url: string, params?: object): Promise<T> => {
    const response = await http.get<T>(url, { params });
    return response.data;
};

export const post = async <T>(url: string, data?: object): Promise<T> => {
    const response = await http.post<T>(url, data);
    return response.data;
};

export const put = async <T>(url: string, data?: object): Promise<T> => {
    const response = await http.put<T>(url, data);
    return response.data;
};

export const del = async (url: string): Promise<void> => {
    await http.delete(url);
};

export const patch = async (url: string, data?: object): Promise<void> => {
    await http.patch(url, data);
};