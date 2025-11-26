/**
 * Types for Socket.IO Server
 */

export interface AuthData {
  userId: string;
  jwt: string;
}

export interface NotificationPayload {
  actionKey?: string;
  title: { he: string; en: string; ar?: string };
  body: { he: string; en: string; ar?: string };
  metadata?: {
    icon?: string;
    url?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  data?: any;
}

export interface BroadcastRequest {
  userIds: string[];
  notification: NotificationPayload;
}

export interface SocketData {
  userId?: string;
}
