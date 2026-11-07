/**
 * `POST /api/leads/ask` — "ask about this product" on a public product page
 * (docs/inprogress/PLAN_LEADS.md §5.5, L4). A visitor — signed in or not —
 * leaves a name, a way to reach them and a question; the rikma that sells the
 * product gets a lead (`source: shop`, the product attached) and its task.
 *
 * Open by design, like `/api/demo`: no key, no session needed. So it carries
 * the public form's guards (§5.2): 5 an hour per address, a honeypot, consent
 * required, the product must exist and still be on sale, and the answer says
 * nothing back — not an id, not whether this person had asked before.
 *
 * `createLead` lets this through only because the context says
 * `intake: 'publicProduct'` — a field only server code can set.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import { adminToken } from '$lib/server/adminToken.js';
import { checkRateLimit } from '$lib/server/apiPublic/http.js';

const PER_IP_HOUR = 5;
const HOUR = 60 * 60 * 1000;

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
};

export const POST: RequestHandler = async ({ request, fetch, getClientAddress, locals }) => {
  let ip = 'unknown';
  try {
    ip = getClientAddress();
  } catch {
    /* no address behind some adapters — a shared bucket is still a limit */
  }
  if (!checkRateLimit(`leads:ask:${ip}`, PER_IP_HOUR, HOUR).allowed) {
    return json({ success: false, error: 'too many requests' }, { status: 429 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'invalid json' }, { status: 400 });
  }
  // The honeypot: a field no person sees.
  if (typeof body?.website === 'string' && body.website.trim()) return json({ success: true });

  const productId = String(body?.productId ?? '').trim();
  if (!/^\d+$/.test(productId)) return json({ success: false, error: 'productId required' }, { status: 400 });
  if (body?.consent !== true) return json({ success: false, error: 'consent required' }, { status: 400 });
  const consentText = str(body?.consentText, 500);
  if (!consentText) return json({ success: false, error: 'consent text required' }, { status: 400 });

  // Which rikma sells it — and is it still for sale?
  let projectId: string | null = null;
  try {
    const res = await strapiClient.execute('leadAskProduct', { id: productId }, adminToken(), fetch);
    const a = res?.data?.matanot?.data?.attributes;
    const live = a && a.archived !== true && a.lifecycle !== 'archived';
    projectId = live ? (a.projectcreates?.data?.[0]?.id != null ? String(a.projectcreates.data[0].id) : null) : null;
  } catch (e) {
    console.error('[leads/ask] product lookup failed:', e);
    return json({ success: false, error: 'try again' }, { status: 502 });
  }
  if (!projectId) return json({ success: false, error: 'no such product' }, { status: 404 });

  const lang = str(body?.lang, 8) ?? 'he';
  const result: any = await actionService.executeAction(
    'createLead',
    {
      projectId,
      productId,
      name: str(body?.name, 200),
      phone: str(body?.phone, 40),
      email: str(body?.email, 200)?.toLowerCase(),
      message: str(body?.message, 4000),
      source: 'shop',
      sourceUrl: str(body?.sourceUrl, 500),
      consent: { text: consentText, at: new Date().toISOString() },
      lang
    },
    {
      // A signed-in visitor stays who they are; a guest is nobody in particular.
      userId: locals.uid ? String(locals.uid) : '',
      jwt: adminToken(),
      lang,
      fetch,
      intake: 'publicProduct'
    }
  );
  if (!result?.success) {
    const code = result?.error?.code;
    // A field problem is the visitor's to fix; anything else is ours.
    if (code === 'VALIDATION_FAILED' || code === 'CONSENT_REQUIRED') {
      return json({ success: false, error: 'invalid', field: result.error?.details?.field ?? null }, { status: 400 });
    }
    console.error('[leads/ask] createLead failed:', result?.error);
    return json({ success: false, error: 'try again' }, { status: 502 });
  }
  // Never the person — only that one arrived (§6).
  console.log(`[leads/ask] lead for product=${productId} project=${projectId}`);
  return json({ success: true });
};
