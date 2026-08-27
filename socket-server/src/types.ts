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
  /**
   * Meetings whose guest rooms should also receive this notification.
   *
   * Registered participants are reached by user id above. A guest has no user
   * id at all — they are identified only by the signed invitation that names
   * one meeting — so they are reached through `meeting:<id>` instead. Guests
   * are the only members of those rooms, which is why nobody gets the
   * notification twice.
   */
  meetingIds?: string[];
}

/** A verified meeting guest attached to a socket. */
export interface GuestSocketIdentity {
  meetingId: string;
  displayName: string;
  /** The meetings app's own session id, echoed back on auth_success. */
  sessionId: string | null;
}

export interface SocketData {
  userId?: string;
  guest?: GuestSocketIdentity;
}
