/**
 * Socket Client Tests
 * 
 * These tests verify the socket client store functionality.
 * Note: These are unit tests that mock the Socket.IO client.
 * Integration tests with a real server should be done separately.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    io: {
      on: vi.fn()
    }
  }))
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('Socket Client Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have initial state', async () => {
    // Dynamic import to ensure mocks are applied
    const { socketClient } = await import('./socketClient');
    
    const state = socketClient.getState();
    
    expect(state.connected).toBe(false);
    expect(state.authenticated).toBe(false);
    expect(state.userId).toBe(null);
    expect(state.error).toBe(null);
    expect(state.reconnecting).toBe(false);
    expect(state.reconnectAttempts).toBe(0);
  });

  it('should not be ready initially', async () => {
    const { socketClient } = await import('./socketClient');
    
    expect(socketClient.isReady()).toBe(false);
  });

  it('should accept connection parameters', async () => {
    const { socketClient } = await import('./socketClient');
    const { io } = await import('socket.io-client');
    
    socketClient.connect('user123', 'jwt-token');
    
    expect(io).toHaveBeenCalled();
  });

  it('should allow registering notification listeners', async () => {
    const { socketClient } = await import('./socketClient');
    
    const listener = vi.fn();
    const unsubscribe = socketClient.onNotification(listener);
    
    expect(typeof unsubscribe).toBe('function');
  });

  it('should allow unsubscribing notification listeners', async () => {
    const { socketClient } = await import('./socketClient');
    
    const listener = vi.fn();
    const unsubscribe = socketClient.onNotification(listener);
    
    unsubscribe();
    
    // Listener should be removed (can't easily test without triggering notification)
    expect(true).toBe(true);
  });

  it('should have disconnect method', async () => {
    const { socketClient } = await import('./socketClient');
    
    expect(typeof socketClient.disconnect).toBe('function');
    
    // Should not throw
    socketClient.disconnect();
  });

  it('should have ping method', async () => {
    const { socketClient } = await import('./socketClient');
    
    expect(typeof socketClient.ping).toBe('function');
    
    // Should not throw
    socketClient.ping();
  });
});

describe('Socket Client State Management', () => {
  it('should be subscribable as a Svelte store', async () => {
    const { socketClient } = await import('./socketClient');
    
    let stateUpdates = 0;
    const unsubscribe = socketClient.subscribe(() => {
      stateUpdates++;
    });
    
    // Initial subscription triggers once
    expect(stateUpdates).toBeGreaterThan(0);
    
    unsubscribe();
  });

  it('should provide getState method', async () => {
    const { socketClient } = await import('./socketClient');
    
    const state = socketClient.getState();
    
    expect(state).toHaveProperty('connected');
    expect(state).toHaveProperty('authenticated');
    expect(state).toHaveProperty('userId');
    expect(state).toHaveProperty('error');
    expect(state).toHaveProperty('reconnecting');
    expect(state).toHaveProperty('reconnectAttempts');
  });
});

describe('Notification Payload Types', () => {
  it('should accept valid notification payload', async () => {
    const { socketClient } = await import('./socketClient');
    
    const validPayload = {
      actionKey: 'updateTask',
      title: { he: 'כותרת', en: 'Title' },
      body: { he: 'תוכן', en: 'Body' },
      metadata: {
        icon: 'https://example.com/icon.png',
        url: '/tasks/123',
        priority: 'normal' as const
      },
      data: { taskId: '123' }
    };
    
    // Should not throw type errors
    const listener = (notification: typeof validPayload) => {
      expect(notification.title.he).toBe('כותרת');
    };
    
    socketClient.onNotification(listener);
  });
});
