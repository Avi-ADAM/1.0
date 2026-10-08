import { describe, expect, it, vi } from 'vitest';
import { fetchWithConnectRetry, isConnectFailure } from './connectRetry.js';

const connectTimeout = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });
const reset = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });

describe('connectRetry', () => {
	it('recognises only failures where nothing was sent', () => {
		expect(isConnectFailure(connectTimeout())).toBe(true);
		expect(isConnectFailure(Object.assign(new Error('x'), { code: 'ECONNREFUSED' }))).toBe(true);
		expect(isConnectFailure(reset())).toBe(false); // the request may have arrived
		expect(isConnectFailure(Object.assign(new Error('t'), { name: 'AbortError' }))).toBe(false);
		expect(isConnectFailure(null)).toBe(false);
	});

	it('sends once more after a connect timeout, then returns the answer', async () => {
		const ok = { ok: true };
		const f = vi.fn().mockRejectedValueOnce(connectTimeout()).mockResolvedValueOnce(ok);
		const onRetry = vi.fn();
		await expect(fetchWithConnectRetry(f, 'u', {}, { delayMs: 0, onRetry })).resolves.toBe(ok);
		expect(f).toHaveBeenCalledTimes(2);
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('retries once only', async () => {
		const f = vi.fn().mockRejectedValue(connectTimeout());
		await expect(fetchWithConnectRetry(f, 'u', {}, { delayMs: 0 })).rejects.toThrow('fetch failed');
		expect(f).toHaveBeenCalledTimes(2);
	});

	it('never resends what may have reached the server', async () => {
		const f = vi.fn().mockRejectedValue(reset());
		await expect(fetchWithConnectRetry(f, 'u', {}, { delayMs: 0 })).rejects.toThrow();
		expect(f).toHaveBeenCalledTimes(1);
	});

	it('does not retry once the caller gave up (aborted)', async () => {
		const c = new AbortController();
		c.abort();
		const f = vi.fn().mockRejectedValue(connectTimeout());
		await expect(fetchWithConnectRetry(f, 'u', { signal: c.signal }, { delayMs: 0 })).rejects.toThrow();
		expect(f).toHaveBeenCalledTimes(1);
	});
});
