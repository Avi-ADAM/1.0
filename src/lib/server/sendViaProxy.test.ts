/**
 * The server-side clients for our own two endpoints. What matters here is the
 * request shape the proxy expects, and that a failure is reported rather than
 * swallowed into a load that renders as if it had data.
 */

import { describe, it, expect, vi } from 'vitest';
import { sendViaProxy } from './sendViaProxy.js';
import { actionViaProxy } from './actionViaProxy.js';

const ok = (body: unknown) =>
	vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

describe('sendViaProxy', () => {
	it('posts a qid to the relative /api/send — never a Strapi URL', async () => {
		const fetchFn = ok({ data: { cuntries: { data: [] } } });
		await sendViaProxy(fetchFn as any, '305loveCountryAgreement', { uid: '7' });

		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toBe('/api/send');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body)).toEqual({
			isSer: false,
			data: { queId: '305loveCountryAgreement', arg: { uid: '7' } }
		});
	});

	it('asks for the service token only when told to', async () => {
		const fetchFn = ok({ data: {} });
		await sendViaProxy(fetchFn as any, 'q', {}, { isSer: true });
		expect(JSON.parse(fetchFn.mock.calls[0][1].body).isSer).toBe(true);
	});

	it('returns the GraphQL data node', async () => {
		const fetchFn = ok({ data: { sales: { data: [{ id: '1' }] } } });
		const data = await sendViaProxy(fetchFn as any, 'q');
		expect(data).toEqual({ sales: { data: [{ id: '1' }] } });
	});

	it('throws when the proxy refuses, carrying its message', async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify({ message: 'Forbidden: kind not allowed' }), { status: 403 })
			);
		await expect(sendViaProxy(fetchFn as any, 'q')).rejects.toThrow(/403.*Forbidden/);
	});

	it('throws on a GraphQL-level error rather than returning empty data', async () => {
		const fetchFn = ok({ errors: [{ message: 'Cannot query field "nope"' }] });
		await expect(sendViaProxy(fetchFn as any, 'q')).rejects.toThrow('Cannot query field "nope"');
	});
});

describe('actionViaProxy', () => {
	it('posts an actionKey to the relative /api/action', async () => {
		const fetchFn = ok({ success: true, data: { forum: {} } });
		await actionViaProxy(fetchFn as any, 'getForumThread', { forumId: '3' });

		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toBe('/api/action');
		expect(JSON.parse(init.body)).toEqual({
			actionKey: 'getForumThread',
			params: { forumId: '3' },
			isSer: false
		});
	});

	it('passes a failed action back as a result, not an exception', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ success: false, error: { code: 'NOT_AUTHORIZED' } }), {
				status: 403
			})
		);
		const res = await actionViaProxy(fetchFn as any, 'getForumThread', {});
		expect(res.success).toBe(false);
		expect(res.error?.code).toBe('NOT_AUTHORIZED');
	});

	it('turns an unreachable proxy into a failed result', async () => {
		const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
		const res = await actionViaProxy(fetchFn as any, 'getUserForums', {});
		expect(res.success).toBe(false);
		expect(res.error?.code).toBe('PROXY_UNREACHABLE');
	});

	it('turns a non-JSON error page into a failed result', async () => {
		const fetchFn = vi.fn().mockResolvedValue(new Response('<html>502</html>', { status: 502 }));
		const res = await actionViaProxy(fetchFn as any, 'getUserForums', {});
		expect(res.success).toBe(false);
		expect(res.error?.message).toContain('502');
	});
});
