import { describe, it, expect } from 'vitest';
import { isSocketIoRequest } from './socket-path.js';

describe('isSocketIoRequest', () => {
  it('a polling or websocket handshake belongs to socket.io', () => {
    expect(isSocketIoRequest('/socket.io/?EIO=4&transport=polling')).toBe(true);
    expect(isSocketIoRequest('/socket.io/?EIO=4&transport=websocket&sid=x')).toBe(true);
    expect(isSocketIoRequest('/socket.io')).toBe(true);
  });

  it('our own routes do not', () => {
    expect(isSocketIoRequest('/health')).toBe(false);
    expect(isSocketIoRequest('/broadcast')).toBe(false);
    expect(isSocketIoRequest('/socket.iox')).toBe(false);
    expect(isSocketIoRequest(undefined)).toBe(false);
  });
});
