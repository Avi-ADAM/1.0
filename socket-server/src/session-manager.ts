/**
 * Session Manager - manages user sessions and socket connections
 */

export class SessionManager {
  // Map of userId -> Set of socketIds
  private userSessions: Map<string, Set<string>> = new Map();
  
  // Map of socketId -> userId for quick lookup
  private socketToUser: Map<string, string> = new Map();

  /**
   * Register a new socket connection for a user
   */
  addSession(userId: string, socketId: string): void {
    // Add to user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(socketId);
    
    // Add reverse mapping
    this.socketToUser.set(socketId, userId);
    
    console.log(`[SessionManager] User ${userId} connected with socket ${socketId}`);
    console.log(`[SessionManager] User ${userId} now has ${this.userSessions.get(userId)!.size} active session(s)`);
  }

  /**
   * Remove a socket connection
   */
  removeSession(socketId: string): void {
    const userId = this.socketToUser.get(socketId);
    
    if (userId) {
      // Remove from user sessions
      const sessions = this.userSessions.get(userId);
      if (sessions) {
        sessions.delete(socketId);
        
        // If no more sessions, remove user entry
        if (sessions.size === 0) {
          this.userSessions.delete(userId);
          console.log(`[SessionManager] User ${userId} has no more active sessions`);
        } else {
          console.log(`[SessionManager] User ${userId} still has ${sessions.size} active session(s)`);
        }
      }
      
      // Remove reverse mapping
      this.socketToUser.delete(socketId);
      
      console.log(`[SessionManager] Socket ${socketId} disconnected`);
    }
  }

  /**
   * Get all socket IDs for a user
   */
  getUserSockets(userId: string): string[] {
    const sessions = this.userSessions.get(userId);
    return sessions ? Array.from(sessions) : [];
  }

  /**
   * Get user ID for a socket
   */
  getUserId(socketId: string): string | undefined {
    return this.socketToUser.get(socketId);
  }

  /**
   * Check if a user has any active sessions
   */
  hasActiveSessions(userId: string): boolean {
    const sessions = this.userSessions.get(userId);
    return sessions ? sessions.size > 0 : false;
  }

  /**
   * Get total number of connected users
   */
  getConnectedUserCount(): number {
    return this.userSessions.size;
  }

  /**
   * Get total number of socket connections
   */
  getTotalConnectionCount(): number {
    return this.socketToUser.size;
  }

  /**
   * Get statistics
   */
  getStats(): {
    connectedUsers: number;
    totalConnections: number;
    averageConnectionsPerUser: number;
  } {
    const connectedUsers = this.getConnectedUserCount();
    const totalConnections = this.getTotalConnectionCount();
    
    return {
      connectedUsers,
      totalConnections,
      averageConnectionsPerUser: connectedUsers > 0 ? totalConnections / connectedUsers : 0
    };
  }
}
