import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, Bell, BellOff } from "lucide-react";
import SockJS from "sockjs-client";
import { Client as StompClient, IMessage } from "@stomp/stompjs";

/**
 * 그룹 채팅 (STOMP/SockJS + REST)
 * - WS 연결 시: /ws (SockJS) 로 연결하고, /topic/groups/{groupId}/chat 구독
 * - 메시지 전송: POST /api/chat/groups/{groupId}/messages (Bearer 필요)
 * - 인증: localStorage.accessToken 사용 (카카오 콜백에서 주입됨)
 * - 연결 복구: storage 이벤트로 accessToken 변경을 감지하여 자동 재연결
 */

interface GroupChatProps {
  groupId: string;
  /** 백엔드 절대 base (예: http://localhost:8080). 없으면 VITE_API_BASE → 기본값 8080 */
  apiBase?: string;
}

interface UiMessage {
  id: string;
  sender: string;
  senderId?: number;
  content: string;
  timestamp: Date;
  isMe: boolean;
  pending?: boolean;
}

type ServerChatPayload = {
  id: number;
  senderId: number;
  content: string;
  sentAt: string;
  localId?: string;
};

function getMyIdFromToken(token?: string | null): number | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64));
    if (typeof json.mid === "number") return json.mid;
    if (typeof json.mid === "string") return parseInt(json.mid, 10);
    return null;
  } catch {
    return null;
  }
}

const GroupChat = ({ groupId, apiBase = "" }: GroupChatProps) => {
  // === 공통 Base URL 정규화 ===
  const httpWsBase = useMemo(() => {
    const base =
      (apiBase && apiBase.trim().length > 0 ? apiBase : (import.meta as any)?.env?.VITE_API_BASE) ||
      "http://localhost:8080";
    return String(base).replace(/\/+$/, "");
  }, [apiBase]);

  // === 상태 ===
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null); // beforeId
  const listRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<StompClient | null>(null);
  // IME(한글 등) 조합 중 Enter로 인한 중복 전송 방지
  const composingRef = useRef(false);

  // === 토큰을 state로 관리 (storage 이벤트로 갱신) ===
  const [accessToken, setAccessToken] = useState<string>(localStorage.getItem("accessToken") || "");
  const myId = useMemo(() => getMyIdFromToken(accessToken), [accessToken]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        setAccessToken(localStorage.getItem("accessToken") || "");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 스크롤 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // === WebSocket 연결 ===
  useEffect(() => {
    // 토큰 없으면 연결 시도 안 함
    if (!accessToken) {
      setConnected(false);
      return;
    }

    // SockJS 엔드포인트: 서버가 /ws 사용
    // 쿼리파라미터에도 토큰을 싣고, STOMP CONNECT 헤더에도 토큰을 싣는다.
    const wsUrl =
      `${httpWsBase}/ws` +
      `?token=${encodeURIComponent(accessToken)}` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const client = new StompClient({
      // SockJS 팩토리
      webSocketFactory: () =>
        new SockJS(wsUrl, undefined, {
          transports: ["websocket", "xhr-streaming", "xhr-polling"],
          withCredentials: true,
        }),

      // STOMP CONNECT 헤더
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
        "X-Authorization": `Bearer ${accessToken}`,
      },

      debug: () => {},
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        setConnected(true);
        const dest = `/topic/groups/${groupId}/chat`;
        // (기존 subscribe 콜백 안) 수신 처리 로직 교체
        client.subscribe(dest, (frame: IMessage) => {
          try {
            const payload: ServerChatPayload = JSON.parse(frame.body);
            const serverId = String(payload.id);
            const serverTime = new Date(payload.sentAt ?? Date.now());
            const me = getMyIdFromToken(localStorage.getItem("accessToken"));

            setMessages((prev) => {
              // A. 이미 같은 serverId 가 있으면 '갱신만' 하고 종료 (추가 X)
              const existsIdx = prev.findIndex((m) => m.id === serverId);
              if (existsIdx >= 0) {
                const copy = [...prev];
                copy[existsIdx] = { ...copy[existsIdx], timestamp: serverTime, pending: false };
                return copy;
              }

              // B. 내 낙관적 메시지(로컬)와 내용/보낸사람/시간으로 매칭 → serverId로 치환
              const optimisticIdx = prev.findIndex(
                  (m) =>
                      m.pending &&
                      m.isMe &&
                      m.content === (payload.content ?? "") &&
                      Math.abs(m.timestamp.getTime() - serverTime.getTime()) < 10_000
              );

              if (optimisticIdx >= 0) {
                const copy = [...prev];
                copy[optimisticIdx] = {
                  ...copy[optimisticIdx],
                  id: serverId,
                  timestamp: serverTime,
                  pending: false,
                  senderId: payload.senderId ?? copy[optimisticIdx].senderId,
                  sender: String(payload.senderId ?? copy[optimisticIdx].sender),
                  isMe: Number(payload.senderId) === me,
                };
                return copy;
              }

              // C. 둘 다 아니면 '새 메시지'로 추가
              return [
                ...prev,
                {
                  id: serverId,
                  sender: String(payload.senderId ?? "?"),
                  senderId: payload.senderId ?? undefined,
                  content: String(payload.content ?? ""),
                  timestamp: serverTime,
                  isMe: Number(payload.senderId) === me,
                },
              ];
            });
          } catch {
            // ignore
          }
        });
      },

      onStompError: (frame) => {
        setConnected(false);
        console.warn("[STOMP ERROR]", frame.headers["message"], frame.body);
      },

      onWebSocketClose: (e) => {
        setConnected(false);
        console.warn("[WS CLOSE]", e);
      },
    });

    stompRef.current = client;
    client.activate();

    return () => {
      try {
        client.deactivate();
      } finally {
        stompRef.current = null;
        setConnected(false);
      }
    };
  }, [groupId, accessToken, httpWsBase, myId]);

  // === 히스토리 로딩 ===
  const fetchHistory = async (initial = false) => {
    if (!accessToken) return;
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (!initial && historyCursor) params.set("beforeId", String(historyCursor));
      params.set("size", "50");

      const res = await fetch(`${httpWsBase}/api/chat/groups/${groupId}/messages?` + params.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: { messages: any[]; nextCursor: number | null } = await res.json();

      // 서버는 최신순(desc)로 보내므로, UI append/prepend 시 정렬 맞추기
      const batch: UiMessage[] = (json.messages || []).reverse().map((p) => ({
        id: String(p.id),
        sender: String(p.senderId ?? "?"),
        senderId: p.senderId ?? undefined,
        content: String(p.content ?? ""),
        timestamp: new Date(p.sentAt ?? Date.now()),
        isMe: Number(p.senderId) === myId,
      }));

      if (initial) {
        setMessages(batch);
        // 첫 로드 후 맨 아래로
        requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }));
      } else {
        // 이전 기록 prepend: 스크롤 위치 보정
        const container = listRef.current;
        const prevScrollHeight = container?.scrollHeight ?? 0;
        setMessages((prev) => [...batch, ...prev]);
        requestAnimationFrame(() => {
          if (!container) return;
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight; // 보정
        });
      }

      setHistoryCursor(json.nextCursor);
    } finally {
      setLoadingHistory(false);
    }
  };

// 최초 로드
  useEffect(() => {
    setHistoryCursor(null);
    setMessages([]);
    fetchHistory(true).catch(() => {});
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, accessToken]);

  // 스크롤 핸들러
  const onScrollTopLoadMore = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 60 && historyCursor) {
      fetchHistory(false);
    }
  };

  // === 알림 토글 ===
  const toggleNotifications = () => {
    if (!notificationsEnabled) {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().then((permission) => {
          setNotificationsEnabled(permission === "granted");
        });
      } else setNotificationsEnabled(true);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date) => {
    const today = new Date();
    const d = new Date(date);
    if (d.toDateString() === today.toDateString()) return "오늘";
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "어제";
    return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  };

  // === 메시지 전송(REST) ===
  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    const localId = "local-" + Date.now();
    const optimistic: UiMessage = {
      id: localId,
      sender: myId != null ? String(myId) : "me",
      senderId: myId ?? undefined,
      content: text,
      timestamp: new Date(),
      isMe: true,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    // 브라우저 알림(옵션)
    try {
      if (notificationsEnabled && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("메시지 전송", { body: text, icon: "/favicon.ico" });
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") new Notification("메시지 전송", { body: text, icon: "/favicon.ico" });
        }
      }
    } catch {
      // 알림 실패는 무시
    }

    try {
      const res = await fetch(`${httpWsBase}/api/chat/groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify({
          content: text,
          mentions: [],
          localId, // 서버가 echo 시 활용 가능
          type: "NORMAL",
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // (기존 fetch POST 후) 응답 처리 부분 교체
      const json: { id: number; sentAt: string; localId: string } = await res.json();
      const serverId = String(json.id);
      const serverTime = new Date(json.sentAt);

      setMessages((prev) => {
        let next = [...prev];

        // 1) localId 항목을 serverId 로 치환
        const idxLocal = next.findIndex((m) => m.id === json.localId);
        if (idxLocal >= 0) {
          next[idxLocal] = { ...next[idxLocal], id: serverId, timestamp: serverTime, pending: false };
        } else {
          // (리로드 등으로 local이 없을 때 보정 추가)
          next.push({
            id: serverId,
            sender: String(myId ?? "me"),
            senderId: myId ?? undefined,
            content: text,
            timestamp: serverTime,
            isMe: true,
            pending: false,
          });
        }

        // 2) 혹시 WS가 먼저 들어와 동일 serverId가 이미 있다면 하나만 남기기
        const seen = new Set<string>();
        next = next.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        return next;
      });
    } catch (e) {
      // 실패 시 optimistic 제거
      setMessages((prev) => prev.filter((m) => m.id !== localId));
      alert("메시지 전송에 실패했습니다.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // IME 조합 중(한글 입력 등)에는 Enter를 무시
    // - e.nativeEvent.isComposing: 브라우저 제공 플래그
    // - composingRef: onCompositionStart/End로 보조
    // @ts-ignore – nativeEvent typing 차이 보정
    if (e.nativeEvent?.isComposing || composingRef.current) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>그룹 채팅</span>
            <span className={`ml-2 text-xs ${connected ? "text-emerald-600" : "text-muted-foreground"}`}>
              {connected ? "WS 연결됨" : "WS 연결 안 됨"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotifications}
            className={notificationsEnabled ? "text-primary" : "text-muted-foreground"}
            title={notificationsEnabled ? "알림 끄기" : "알림 켜기"}
          >
            {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-y-hidden">
        {/* 메시지 목록 */}
        <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onScroll={onScrollTopLoadMore}
        >
          {messages.map((message, index) => {
            const showDate = index === 0 || formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);

            return (
                <div key={message.id}>
                  {showDate && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        {formatDate(message.timestamp)}
                      </div>
                  )}

                <div className={`flex items-start space-x-2 ${message.isMe ? "flex-row-reverse space-x-reverse" : ""}`}>
                  {!message.isMe && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">{message.sender?.charAt(0) ?? "?"}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-xs lg:max-w-md ${message.isMe ? "text-right" : ""}`}>
                    {!message.isMe && <div className="text-xs text-muted-foreground mb-1">사용자 {message.sender}</div>}

                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.isMe ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                      } ${message.pending ? "opacity-70" : ""}`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.timestamp)} {message.pending && <span className="ml-1">(sending)</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              placeholder="메시지를 입력하세요..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon" disabled={!accessToken}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupChat;