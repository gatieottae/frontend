// src/hooks/useNotifications.ts
import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { NotificationPayload } from "@/types/notification";
import { toast } from "sonner"; // shadcn/toast 대체 라이브러리 쓰면 교체

export function useNotifications(opts: {
    groupId?: string | number;        // 그룹 알림 구독
    myId?: string | number;           // 개인 큐 구독
    onPush?: (n: NotificationPayload) => void; // 상태에 쌓고 싶으면 전달
}) {
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        const wsUrl = `/ws?access_token=${encodeURIComponent(accessToken)}`;
        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 3000,
            connectHeaders: { Authorization: `Bearer ${accessToken}` },
            debug: () => {},
            onConnect: () => {
                const subs: string[] = [];

                if (opts.groupId) {
                    const dest = `/topic/groups/${opts.groupId}/notifications`;
                    subs.push(dest);
                    client.subscribe(dest, onMsg);
                }
                if (opts.myId) {
                    const dest = `/user/${opts.myId}/queue/notifications`;
                    subs.push(dest);
                    client.subscribe(dest, onMsg);
                }
            },
        });

        const onMsg = (frame: IMessage) => {
            try {
                const payload: NotificationPayload = JSON.parse(frame.body);
                // 토스트
                toast(payload.title || "알림", {
                    description: payload.message,
                    action: payload.link
                        ? { label: "바로가기", onClick: () => (window.location.href = payload.link!) }
                        : undefined,
                });
                // 외부 상태에도 전달하고 싶으면
                opts.onPush?.(payload);
            } catch {
                /* ignore */
            }
        };

        clientRef.current = client;
        client.activate();

        return () => {
            client.deactivate();
            clientRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opts.groupId, opts.myId]);
}