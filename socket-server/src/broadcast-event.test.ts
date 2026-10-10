import { describe, it, expect } from 'vitest';
import { resolveBroadcastEvent } from './broadcast-event.js';

describe('resolveBroadcastEvent', () => {
  it('a request without event is a notification, as it always was', () => {
    expect(resolveBroadcastEvent(undefined)).toBe('notification');
    expect(resolveBroadcastEvent(null)).toBe('notification');
    expect(resolveBroadcastEvent('')).toBe('notification');
  });

  it('emits the two known events', () => {
    expect(resolveBroadcastEvent('notification')).toBe('notification');
    expect(resolveBroadcastEvent('rt:changed')).toBe('rt:changed');
  });

  it('refuses any other event name', () => {
    expect(resolveBroadcastEvent('disconnect')).toBeNull();
    expect(resolveBroadcastEvent('p2p:signal')).toBeNull();
    expect(resolveBroadcastEvent(42)).toBeNull();
  });
});
