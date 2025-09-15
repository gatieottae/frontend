// src/components/NotificationBell.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, MessageCircle, Calendar, DollarSign, X } from "lucide-react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/hooks/useAuth";

type NotificationType = "message" | "schedule" | "payment" | "general";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  groupId?: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const memberId = useMemo(() => (user ? String(user.id) : null), [user]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 아이콘/색/시간 유틸
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "message": return <MessageCircle className="h-4 w-4" />;
      case "schedule": return <Calendar className="h-4 w-4" />;
      case "payment": return <DollarSign className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "message": return "bg-blue-500";
      case "schedule": return "bg-green-500";
      case "payment": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };
  const formatTimeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}초 전`;
    if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
    return `${Math.floor(s / 86400)}일 전`;
  };

  // STOMP 연결
  useEffect(() => {
    if (!memberId) {
      console.log("[Notif] skip connect. memberId is null (로그인 전)");
      return;
    }

    console.log("[Notif] creating SockJS to /ws-stomp");
    const sock = new SockJS("/ws-stomp"); // withCredentials 제거

    const client = new Client({
      webSocketFactory: () => sock as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        // 개발 모드에서 STOMP 상세 로그
        if (import.meta.env.DEV) console.log("[STOMP]", str);
      },
      // connectHeaders: { Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}` },
      onConnect: () => {
        console.log("[Notif] STOMP connected. subscribing…");

        const dest = `/topic/notifications/${memberId}`;
        client.subscribe(dest, (msg: IMessage) => {
          console.log("[Notif] message arrived:", msg.body);
          try {
            const payload = JSON.parse(msg.body);
            const n: Notification = {
              id: String(payload.id ?? crypto.randomUUID()),
              type: (payload.type?.toLowerCase?.() ?? "general") as NotificationType,
              title: payload.title ?? "알림",
              message: payload.message ?? payload.content ?? "",
              timestamp: new Date(payload.createdAt ?? payload.sentAt ?? Date.now()),
              read: false,
              groupId: payload.groupId ? String(payload.groupId) : undefined,
            };
            setNotifications((prev) => [n, ...prev]);
          } catch (e) {
            console.warn("[Notif] bad payload:", e, msg.body);
          }
        });

        console.log("[Notif] subscribed to /user/queue/notifications");
      },
      onStompError: (frame) => {
        console.warn("[Notif] broker error:", frame.headers["message"], frame.body);
      },
      onWebSocketClose: (e) => {
        console.log("[Notif] websocket closed:", e?.code, e?.reason);
      },
      onWebSocketError: (e) => {
        console.warn("[Notif] websocket error:", e);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        console.log("[Notif] deactivating STOMP");
        client.deactivate();
      } catch {}
      clientRef.current = null;
    };
  }, [memberId]);

  // 읽음/삭제
  const markAsRead = (id: string) =>
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllAsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const removeNotification = (id: string) =>
      setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="end">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">알림</CardTitle>
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      모두 읽음
                    </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">새 알림이 없습니다</div>
              ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                                !n.read ? "bg-muted/20" : ""
                            }`}
                            onClick={() => markAsRead(n.id)}
                        >
                          <div className="flex items-start justify-between space-x-2">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-1 rounded-full text-white ${getTypeColor(n.type)}`}>
                                {getIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{n.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(n.timestamp)}</p>
                              </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(n.id);
                                }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-primary rounded-full mt-2 ml-auto" />}
                        </div>
                    ))}
                  </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
  );
};

export default NotificationBell;