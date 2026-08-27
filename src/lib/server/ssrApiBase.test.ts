/**
 * The rule that decides where a server-side `/api/*` fetch actually goes.
 *
 * Getting this wrong has two failure modes worth locking down: sending a
 * request nowhere useful (a page route, an external URL), and sending the API
 * instance's own calls back out through nginx to itself.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { rewriteToApiBase } from './ssrApiBase.js';

const VERCEL = new URL('https://www.1lev1.com/lev');
const API = 'https://api.1lev1.com';

describe('rewriteToApiBase', () => {
	it('re-points a same-origin /api/* call at the API instance', () => {
		expect(rewriteToApiBase(new URL('https://www.1lev1.com/api/send'), VERCEL, API)).toBe(
			'https://api.1lev1.com/api/send'
		);
	});

	it('keeps the path and query string', () => {
		expect(
			rewriteToApiBase(
				new URL('https://www.1lev1.com/api/auth/email-confirmation?confirmation=abc'),
				VERCEL,
				API
			)
		).toBe('https://api.1lev1.com/api/auth/email-confirmation?confirmation=abc');
	});

	it('does nothing when SSR_API_BASE is unset — the default everywhere else', () => {
		expect(rewriteToApiBase(new URL('https://www.1lev1.com/api/send'), VERCEL, '')).toBeNull();
	});

	it('leaves page routes alone — only the /api surface is proxied', () => {
		expect(rewriteToApiBase(new URL('https://www.1lev1.com/lev'), VERCEL, API)).toBeNull();
		// A path that merely starts with the letters is not the API surface.
		expect(rewriteToApiBase(new URL('https://www.1lev1.com/apidocs'), VERCEL, API)).toBeNull();
	});

	it('leaves an absolute URL to somewhere else alone', () => {
		expect(
			rewriteToApiBase(new URL('https://tovmeod.1lev1.com/api/auth/local'), VERCEL, API)
		).toBeNull();
	});

	it('does not loop back on the instance that is itself the API', () => {
		const onApi = new URL('https://api.1lev1.com/api/send');
		expect(rewriteToApiBase(onApi, new URL('https://api.1lev1.com/lev'), API)).toBeNull();
	});

	it('ignores an unparseable base rather than breaking the fetch', () => {
		expect(rewriteToApiBase(new URL('https://www.1lev1.com/api/send'), VERCEL, 'not a url')).toBeNull();
	});
});
