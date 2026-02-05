/**
 * Socket.IO Client Store for Unified Action System
 * 
 * This store manages the Socket.IO connection to the notification server.
 * It handles authentication, reconnection, and notification events.
 * 
 * Usage:
 * ```typescript
 * import { socketClient } from '$lib/stores/socketClient';
 * 
 * // Connect (usually in +layout.svelte after user is authenticated)
 * socketClient.connect(userId, jwt);
 * 
 * // Listen for notifications
 * socketClient.onNotification((notification) => {
 *   console.log('Received notification:', notification);
 * });
 * 
 * // Disconnect
 * socketClient.disconnect();
 * ```
 */

import { writable, get } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';

/**
 * Notification payload structure from the server
 */
export interface NotificationPayload {
  actionKey?: string;
  title: { he: string; en: string; ar?: string };
  body: { he: string; en: string; ar?: string };
  metadata?: {
    icon?: string;
    url?: string;
    priority?: 'low' | 'normal' | 'high';
    forumId?: string;
    type?: string;
  };
  data?: any;
  updateStrategy?: {
    type: string;
    config?: any;
  };
}

/**
 * Socket connection state
 */
export interface SocketState {
  connected: boolean;
  authenticated: boolean;
  userId: string | null;
  error: string | null;
  reconnecting: boolean;
  reconnectAttempts: number;
}

/**
 * Notification listener callback
 */
type NotificationListener = (notification: NotificationPayload) => void;

/**
 * Socket.IO client configuration
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 1000; // Start with 1 second

/**
 * Create the socket client store
 */
function createSocketClient() {
  // Initial state
  const initialState: SocketState = {
    connected: false,
    authenticated: false,
    userId: null,
    error: null,
    reconnecting: false,
    reconnectAttempts: 0
  };

  const { subscribe, set, update } = writable<SocketState>(initialState);

  let socket: Socket | null = null;
  let notificationListeners: NotificationListener[] = [];
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let currentUserId: string | null = null;

  /**
   * Handle update strategy from socket notification
   */
  async function handleUpdateStrategy(strategy: any, data: any): Promise<void> {
    if (!browser || !strategy) return;

    console.log('[SocketClient] Handling update strategy:', strategy.type);

    try {
      switch (strategy.type) {
        case 'fullRefresh':
          await invalidate(() => true);
          break;

        case 'partialUpdate':
          if (strategy.config?.dataKeys) {
            for (const key of strategy.config.dataKeys) {
              await invalidate(key);
            }
          }
          break;

        case 'optimistic':
          if (strategy.config?.updateFunction) {
            // Try to get update function from window
            const updateFn = (window as any).updateStrategies?.[strategy.config.updateFunction]
              || (window as any)[strategy.config.updateFunction];

            if (typeof updateFn === 'function') {
              await updateFn(data, strategy.config);
            } else {
              console.warn('[SocketClient] Update function not found:', strategy.config.updateFunction);
            }
          }
          break;

        case 'none':
          // No update needed
          break;

        default:
          console.warn('[SocketClient] Unknown update strategy:', strategy.type);
      }
    } catch (error) {
      console.error('[SocketClient] Error executing update strategy:', error);
    }
  }

  /**
   * Connect to the Socket.IO server
   * 
   * Note: Authentication is now handled server-side via cookie headers.
   * The server reads the JWT cookie automatically, so we don't need to pass it.
   */
  function connect(userId?: string, jwt?: string): void {
    if (!browser) {
      console.warn('[SocketClient] Cannot connect in SSR context');
      return;
    }

    // If userId not provided, try to get from cookie
    if (!userId && browser) {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);

      userId = userId || cookies.id;
    }

    if (!userId) {
      console.error('[SocketClient] Missing userId');
      update(state => ({ ...state, error: 'Missing user ID' }));
      return;
    }

    // Store userId (jwt is now read by server from cookies automatically)
    currentUserId = userId;
    // JWT is no longer needed for client-side auth - server reads it from cookies

    // Disconnect existing connection if any
    if (socket) {
      console.log('[SocketClient] Disconnecting existing connection');
      socket.disconnect();
    }

    console.log('[SocketClient] Connecting to', SOCKET_URL);

    // Create new socket connection with credentials enabled
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      withCredentials: true // Sends cookies automatically
    });

    // Connection established
    socket.on('connect', () => {
      console.log('[SocketClient] Connected, waiting for server authentication via cookies...');
      update(state => ({
        ...state,
        connected: true,
        reconnecting: false,
        reconnectAttempts: 0,
        error: null
      }));

      // Note: Authentication is now handled by the server via cookies
      // No need to send explicit auth event - the server reads JWT from cookie header
    });

    // Authentication successful
    socket.on('auth_success', (data: { userId: string }) => {
      console.log('[SocketClient] Authentication successful for user', data.userId);
      update(state => ({
        ...state,
        authenticated: true,
        userId: data.userId,
        error: null
      }));
    });

    // Authentication failed
    socket.on('auth_error', (data: { message: string }) => {
      console.error('[SocketClient] Authentication failed:', data.message);
      update(state => ({
        ...state,
        authenticated: false,
        error: data.message
      }));

      // Disconnect on auth failure
      if (socket) {
        socket.disconnect();
      }
    });

    // Notification received
    socket.on('notification', (notification: NotificationPayload) => {
      console.log('[SocketClient] Notification received:', notification);

      // Extract update strategy and data (check both top-level and nested in actionResult)
      const updateStrategy = (notification as any).updateStrategy || (notification as any).actionResult?.updateStrategy;
      const data = (notification as any).data || (notification as any).actionResult?.data;

      // Handle update strategy if present
      if (updateStrategy) {
        handleUpdateStrategy(updateStrategy, data)
          .catch(error => {
            console.error('[SocketClient] Error handling update strategy:', error);
          });
      }

      // Call all registered listeners
      notificationListeners.forEach(listener => {
        try {
          listener(notification);
        } catch (error) {
          console.error('[SocketClient] Error in notification listener:', error);
        }
      });
    });

    // Disconnected
    socket.on('disconnect', (reason: string) => {
      console.log('[SocketClient] Disconnected:', reason);
      update(state => ({
        ...state,
        connected: false,
        authenticated: false
      }));

      // Handle reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        scheduleReconnect();
      }
    });

    // Connection error
    socket.on('connect_error', (error: Error) => {
      console.error('[SocketClient] Connection error:', error.message);
      update(state => ({
        ...state,
        error: error.message,
        reconnecting: true
      }));
    });

    // Reconnection attempt
    socket.io.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('[SocketClient] Reconnection attempt', attemptNumber);
      update(state => ({
        ...state,
        reconnecting: true,
        reconnectAttempts: attemptNumber
      }));
    });

    // Reconnection successful
    socket.io.on('reconnect', (attemptNumber: number) => {
      console.log('[SocketClient] Reconnected after', attemptNumber, 'attempts');
      update(state => ({
        ...state,
        reconnecting: false,
        reconnectAttempts: 0,
        error: null
      }));
    });

    // Reconnection failed
    socket.io.on('reconnect_failed', () => {
      console.error('[SocketClient] Reconnection failed after max attempts');
      update(state => ({
        ...state,
        reconnecting: false,
        error: 'Failed to reconnect after multiple attempts'
      }));
    });

    // Pong response (for health checks)
    socket.on('pong', () => {
      // Connection is healthy
    });
  }

  /**
   * Schedule a manual reconnection attempt
   */
  function scheduleReconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    const state = get({ subscribe });
    if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[SocketClient] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts), 30000);
    console.log(`[SocketClient] Scheduling reconnection in ${delay}ms`);

    reconnectTimer = setTimeout(() => {
      if (currentUserId) {
        console.log('[SocketClient] Attempting manual reconnection');
        connect(currentUserId); // JWT is read from cookies automatically
      }
    }, delay);
  }

  /**
   * Disconnect from the server
   */
  function disconnect(): void {
    console.log('[SocketClient] Disconnecting');

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (socket) {
      socket.disconnect();
      socket = null;
    }

    currentUserId = null;
    notificationListeners = [];

    set(initialState);
  }

  /**
   * Register a notification listener
   * Returns an unsubscribe function
   */
  function onNotification(listener: NotificationListener): () => void {
    notificationListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = notificationListeners.indexOf(listener);
      if (index > -1) {
        notificationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Send a ping to check connection health
   */
  function ping(): void {
    if (socket && socket.connected) {
      socket.emit('ping');
    }
  }

  /**
   * Get current connection state
   */
  function getState(): SocketState {
    return get({ subscribe });
  }

  /**
   * Check if connected and authenticated
   */
  function isReady(): boolean {
    const state = get({ subscribe });
    return state.connected && state.authenticated;
  }

  return {
    subscribe,
    connect,
    disconnect,
    onNotification,
    ping,
    getState,
    isReady
  };
}

/**
 * Singleton socket client instance
 */
export const socketClient = createSocketClient();

/**
 * Auto-cleanup on page unload (browser only)
 */
if (browser) {
  window.addEventListener('beforeunload', () => {
    socketClient.disconnect();
  });
}
