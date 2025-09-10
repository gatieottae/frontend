// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // 개발 서버 설정
  server: {
    host: "::",
    port: 5173,
    strictPort: true,
    proxy: {
      // 웹소켓
      "/ws": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true, // 중요: 웹소켓 업그레이드 허용
      },
      // REST API 프록시
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // 🔌 WebSocket(STOMP) 엔드포인트 프록시
      // 백엔드의 registerStompEndpoints()에서 "/ws-stomp"로 설정했다면 이렇게 맞춰줍니다.
      "/ws-stomp": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true, // ← 꼭 필요 (WebSocket 업그레이드)
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ Vite가 번들 전에 최적화하면서 ESM으로 변환하도록 지정
  //    (간혹 해석 순서 문제를 줄여줍니다)
  optimizeDeps: {
    include: ["@stomp/stompjs", "sockjs-client"],
  },

  // ✅ SockJS가 node 환경의 전역(global)을 기대하는 경우가 있어
  //    브라우저 전역(window)로 치환해줍니다.
  define: {
    global: "window",
    // 필요 시 아래도 추가 (일부 라이브러리에서 process.env 접근 시)
    // "process.env": {}
  },
}));