import { describe, expect, it, vi } from 'vitest';
import { IVORY_TOWER_DEFAULT_URL, parseTowerSpaces, rikmaTowerSpaces, towerBase } from './ivoryTower';

describe('towerBase', () => {
	it('defaults and trims the trailing slash', () => {
		expect(towerBase(undefined)).toBe(IVORY_TOWER_DEFAULT_URL);
		expect(towerBase('  ')).toBe(IVORY_TOWER_DEFAULT_URL);
		expect(towerBase('https://tower.1lev1.com/')).toBe('https://tower.1lev1.com');
	});
});

describe('parseTowerSpaces', () => {
	it('keeps well-formed rows only', () => {
		expect(
			parseTowerSpaces({
				spaces: [
					{ slug: 'ethics', title: 'Ethics', visibility: 'members', nodeCount: 4 },
					{ slug: '../evil', title: 'x' },
					{ slug: 'no-title' }
				]
			})
		).toEqual([
			{ slug: 'ethics', title: 'Ethics', visibility: 'members', nodeCount: 4 },
			{ slug: 'no-title', title: 'no-title', visibility: 'public', nodeCount: 0 }
		]);
	});

	it('is null for an answer that is not a list', () => {
		expect(parseTowerSpaces({})).toBeNull();
		expect(parseTowerSpaces(null)).toBeNull();
	});
});

describe('rikmaTowerSpaces', () => {
	it('forwards the member jwt as the Tower session cookie', async () => {
		const fetchFn = vi.fn(async () => new Response(JSON.stringify({ spaces: [] })));
		expect(await rikmaTowerSpaces('https://t', '42', 'tok', fetchFn as unknown as typeof fetch)).toEqual([]);
		const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://t/api/rikma/42/spaces');
		expect((init.headers as Record<string, string>).cookie).toBe('jwt=tok');
	});

	it('is null, not empty, when the Tower cannot be asked', async () => {
		const down = vi.fn(async () => {
			throw new Error('ECONNREFUSED');
		});
		expect(await rikmaTowerSpaces('https://t', '42', 'tok', down as unknown as typeof fetch)).toBeNull();
		const err = vi.fn(async () => new Response('nope', { status: 500 }));
		expect(await rikmaTowerSpaces('https://t', '42', 'tok', err as unknown as typeof fetch)).toBeNull();
	});
});
