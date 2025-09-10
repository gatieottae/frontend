// src/lib/http.ts
import axios from "axios";

export const http = axios.create({
    baseURL: "/api",
    withCredentials: true,   // ✅ 쿠키 포함
    headers: { "Content-Type": "application/json" },
});

// --- 요청 인터셉터 ---
http.interceptors.request.use(
    (config) => {
        // 필요 시 여기에 로직 추가 (e.g. 토큰 헤더)
        return config;
    },
    (error) => Promise.reject(error),
);

// --- 응답 인터셉터 ---
http.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401: Unauthorized (인증 실패)
        if (error.response?.status === 401) {
            // 예: 로그인 페이지로 리다이렉트
            // window.location.href = "/auth/login";
        }
        // 419: Authentication Timeout (CSRF 토큰 만료 등)
        else if (error.response?.status === 419) {
            // 예: 페이지 새로고침 또는 재인증 요청
            // window.location.reload();
        }
        return Promise.reject(error);
    },
);

// --- API 함수들 ---

/**
 * GET 요청
 * @param url - 요청할 URL
 * @param params - 쿼리 파라미터
 */
export const get = async <T>(url: string, params?: object): Promise<T> => {
    const response = await http.get<T>(url, { params });
    return response.data;
};

/**
 * POST 요청
 * @param url - 요청할 URL
 * @param data - 전송할 데이터
 */
export const post = async <T>(url: string, data: object): Promise<T> => {
    const response = await http.post<T>(url, data);
    return response.data;
};

/**
 * PUT 요청
 * @param url - 요청할 URL
 * @param data - 전송할 데이터
 */
export const put = async <T>(url: string, data: object): Promise<T> => {
    const response = await http.put<T>(url, data);
    return response.data;
};

/**
 * DELETE 요청
 * @param url - 요청할 URL
 */

export const del = async (url: string): Promise<void> => {
    await http.delete(url);
};


/**
 * PATCH 요청
 * @param url - 요청할 URL
 * @param data - 전송할 데이터
 */
export const patch = async (url: string, data?: object): Promise<void> => {
    await http.patch(url, data);
};

