// src/lib/http.ts
import axios from "axios";

export const http = axios.create({
    baseURL: "/api",
    withCredentials: true,   // ✅ 쿠키 포함
    headers: { "Content-Type": "application/json" },
});