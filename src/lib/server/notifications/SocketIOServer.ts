/**
 * SocketIOServer Client
 * 
 * Client for communicating with the standalone Socket.IO server.
 * Handles broadcasting notifications to connected users.
 */

import type { NotificationData, UserProfile } from './NotificationOrchestrator';
import type { ActionContext } from '../actions/types';

export interface BroadcastRequest {
  userIds: string[];
  notification: NotificationData;
}

export interface BroadcastResponse {
  success: boolean;
  deliveredTo: number;
  totalSockets: number;
  requestedUsers: number;
  error?: string;
}

export class SocketIOServer {
  private serverUrl: string;

  constructor(serverUrl?: string) {
    // Use environment variable or default to 127.0.0.1 to avoid ECONNREFUSED on some systems
    this.serverUrl = serverUrl || process.env.SOCKET_SERVER_URL || 'http://127.0.0.1:3001';
  }

  /**
   * Broadcast notification to multiple users
   * 
   * @param userIds - Array of user IDs to send notification to
   * @param notification - Notification data to send
   * @param context - Action context (for fetch)
   * @returns Broadcast result with delivery stats
   */
  async broadcast(
    userIds: string[],
    notification: NotificationData,
    context: ActionContext
  ): Promise<BroadcastResponse> {
    try {
      if (!userIds || userIds.length === 0) {
        console.log('[SocketIOServer] No users to broadcast to');
        return {
          success: true,
          deliveredTo: 0,
          totalSockets: 0,
          requestedUsers: 0
        };
      }

      const request: BroadcastRequest = {
        userIds,
        notification
      };

      console.log(`[SocketIOServer] Broadcasting to ${userIds.length} users`);

      const response = await context.fetch(`${this.serverUrl}/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Socket.IO server returned ${response.status}: ${errorText}`);
      }

      const result: BroadcastResponse = await response.json();

      console.log(
        `[SocketIOServer] Broadcast successful: ${result.deliveredTo}/${result.requestedUsers} users ` +
        `(${result.totalSockets} sockets)`
      );

      return result;
    } catch (error) {
      console.error('[SocketIOServer] Broadcast error:', error);

      // Return error response but don't throw
      // Socket notifications should not block the main action
      return {
        success: false,
        deliveredTo: 0,
        totalSockets: 0,
        requestedUsers: userIds.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send notification to users based on UserProfile array
   * Helper method that extracts user IDs from profiles
   */
  async broadcastToUsers(
    users: UserProfile[],
    notification: NotificationData,
    context: ActionContext
  ): Promise<BroadcastResponse> {
    const userIds = users.map(u => u.id);
    return this.broadcast(userIds, notification, context);
  }

  /**
   * Check if Socket.IO server is healthy
   */
  async healthCheck(context: ActionContext): Promise<boolean> {
    try {
      const response = await context.fetch(`${this.serverUrl}/health`, {
        method: 'GET'
      });

      return response.ok;
    } catch (error) {
      console.error('[SocketIOServer] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get Socket.IO server statistics
   */
  async getStats(context: ActionContext): Promise<any> {
    try {
      const response = await context.fetch(`${this.serverUrl}/stats`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SocketIOServer] Failed to get stats:', error);
      return null;
    }
  }
}
