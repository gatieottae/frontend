// src/types/notification.ts
export type NotificationPayload = {
    type: "MESSAGE" | "SCHEDULE" | "PAYMENT" | "GENERAL";
    groupId?: number;
    receiverId?: number;
    senderId?: number;
    title: string;
    message: string;
    sentAt: string; // ISO
    link?: string;
};