import { error, redirect } from '@sveltejs/kit';
import { isSafeLanding } from '$lib/assistant/landing.js';
import type { PageServerLoad } from './$types';

/**
 * Behind-the-scenes studio for a pending rikma draft
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.1, §5.7).
 *
 * On www this runs on Vercel, so it calls only `/api/assistant/studio` —
 * token decryption and Strapi reads live exclusively on the VPS (PLAN §1.2).
 */
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  setHeaders({
    'x-robots-tag': 'noindex, nofollow',
    'cache-control': 'private, no-store',
    'referrer-policy': 'no-referrer'
  });

  const res = await fetch(`/api/assistant/studio?t=${encodeURIComponent(params.token)}`);
  if (res.status === 429) throw error(429, 'Too many requests');
  if (res.status >= 500) throw error(502, 'Studio unavailable');

  const body = await res.json().catch(() => null);
  if (!body?.ok) {
    return { expired: true as const };
  }

  if (body.mode === 'created' && typeof body.projectId === 'string') {
    throw redirect(303, `/moach/${encodeURIComponent(body.projectId)}`);
  }

  if (body.mode === 'claimed' && typeof body.reviewPath === 'string' && isSafeLanding(body.reviewPath)) {
    throw redirect(303, body.reviewPath);
  }

  return {
    expired: false as const,
    token: params.token,
    studio: body as {
      recipientName: string;
      hasAccount: boolean;
      signedWaitingEmail: boolean;
      previewUrl: string;
      manageUrl: string;
      nextPath: string;
      nextUrl: string;
      expiresAt: string;
      session: {
        sessionId: string;
        version: number;
        projectId: string | null;
        projectName: string | null;
        fields: Record<string, any>;
        items: any[];
      };
    }
  };
};
