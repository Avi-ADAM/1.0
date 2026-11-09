/**
 * POST /api/chezin/continue: what the links in the signup mail do.
 *
 * Called by /signup and /signup/stop-mail on the server. It lives apart from
 * those pages because the signing key exists only on the VPS. The link is the
 * only credential here, and possessing it is possessing the mail.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendToSer } from '$lib/send/sendToSer.js';
import { openLink } from '$lib/server/signupNudge/token';

const refuse = (reason: string) => json({ ok: false, reason });

export const POST: RequestHandler = async ({ request, fetch }) => {
  const body = (await request.json().catch(() => null)) as { action?: string; t?: unknown } | null;

  if (body?.action === 'stop') {
    const id = openLink(body.t, 'stop');
    if (!id) return refuse('invalid');
    const res: any = await sendToSer({ id }, 'chezinSetNoMail', 0, 0, true, fetch);
    return res?.data?.updateChezin?.data?.id ? json({ ok: true }) : refuse('failed');
  }

  if (body?.action === 'open') {
    const id = openLink(body.t, 'continue');
    if (!id) return refuse('invalid');
    const res: any = await sendToSer({ id }, 'chezinForContinue', 0, 0, true, fetch);
    const row = res?.data?.chezin?.data?.attributes;
    if (!row?.email) return refuse('invalid');
    if (row.users_permissions_user?.data?.id) return refuse('registered');
    return json({
      ok: true,
      id,
      name: row.name ?? '',
      email: row.email,
      countries: (row.countries?.data ?? []).map((c: { id: string | number }) => String(c.id))
    });
  }

  return refuse('invalid');
};
