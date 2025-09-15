import axios from "axios";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ✅ 혹시라도 남아있는 전역 Authorization 헤더 제거
delete axios.defaults.headers.common["Authorization"];

createRoot(document.getElementById("root")!).render(<App />);