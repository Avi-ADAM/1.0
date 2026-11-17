/**
 * The socket gives up after MAX attempts — right while the server is down,
 * wrong when the attempts failed only because there was no network. These pin
 * that it starts again when the network (or a hidden tab) comes back.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

type FakeSocket = {
  handlers: Record<string, (data?: any) => void>;
  on: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  connected: boolean;
  active: boolean;
  io: { on: ReturnType<typeof vi.fn> };
};

let last: FakeSocket;

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const s: FakeSocket = {
      handlers: {},
      on: vi.fn((ev: string, h: any) => {
        s.handlers[ev] = h;
      }),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
      connected: false,
      active: false,
      io: { on: vi.fn() }
    };
    last = s;
    return s;
  })
}));

vi.mock('$app/environment', () => ({ browser: true }));

async function fresh() {
  vi.resetModules();
  const { socketClient } = await import('./socketClient');
  socketClient.connect('u1');
  return socketClient;
}

function setVisibility(v: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v });
}

describe('socketClient — back online', () => {
  beforeEach(() => {
    setVisibility('visible');
  });

  it('starts a fresh round of attempts when the network returns', async () => {
    await fresh();
    last.active = false; // gave up while offline
    window.dispatchEvent(new Event('online'));
    expect(last.disconnect).toHaveBeenCalledTimes(1);
    expect(last.connect).toHaveBeenCalledTimes(1);
  });

  it('skips the pending backoff after an online event even while still retrying', async () => {
    await fresh();
    last.active = true;
    window.dispatchEvent(new Event('online'));
    expect(last.connect).toHaveBeenCalledTimes(1);
  });

  it('a shown tab nudges only a socket that stopped trying', async () => {
    await fresh();
    last.active = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(last.connect).not.toHaveBeenCalled();

    last.active = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(last.connect).toHaveBeenCalledTimes(1);
  });

  it('leaves a live socket alone', async () => {
    await fresh();
    last.connected = true;
    window.dispatchEvent(new Event('online'));
    expect(last.connect).not.toHaveBeenCalled();
  });

  it('does not retry a session the server refused', async () => {
    await fresh();
    last.handlers['auth_error']?.({ message: 'Invalid or expired JWT' });
    last.disconnect.mockClear();
    window.dispatchEvent(new Event('online'));
    expect(last.connect).not.toHaveBeenCalled();
  });
});
