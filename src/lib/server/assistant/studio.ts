/**
 * Behind-the-scenes studio for a pending rikma draft before signup
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.1, §5.7).
 *
 * When a rikma is prepared for someone who has not registered yet (or before an
 * existing member claims it), two capability links exist side by side:
 *
 *   1. `previewUrl` (`/preview/rikma/<shareKey>`) — public, read-only, safe to
 *      share with anyone (partners, customers, friends); contains no private
 *      fields and automatically reflects every saved edit.
 *   2. `manageUrl` (`/preview/rikma/studio/<token>`) — behind the scenes: lets
 *      the holder of the encrypted token inspect and edit every detail of the
 *      rikma, add/remove products, missions, resources and partners, adjust
 *      hours and hourly rates, watch shares recalculate live, and proceed to
 *      sign up (or claim) and create the rikma with one click.
 *
 * Once the session is claimed into a real account (`row.userId` is set), studio
 * writes stop immediately so a previously shared link can never mutate an
 * account's draft.
 */

import { applyOps } from '$lib/assistant/applyOps.js';
import { MAX_PUBLIC_ROWS } from './prepareSignup.js';
import { loadSession, publicView, saveSession, setShare, type StrapiLike } from './session.js';
import { mintShareKey } from './shareKey.js';
import { openSignupToken } from './signupToken.js';

const SITE = 'https://www.1lev1.com';
const SHARE_DAYS = 30;

export type StudioOpenResult =
  | {
      ok: true;
      mode: 'pending';
      recipientName: string;
      hasAccount: boolean;
      signedWaitingEmail: boolean;
      previewUrl: string;
      manageUrl: string;
      nextPath: string;
      nextUrl: string;
      expiresAt: string;
      session: ReturnType<typeof publicView>;
    }
  | {
      ok: true;
      mode: 'claimed';
      sessionId: string;
      reviewPath: string;
      previewUrl: string | null;
    }
  | {
      ok: true;
      mode: 'created';
      projectId: string;
    }
  | {
      ok: false;
      reason: 'expired';
    };

export async function openStudio(
  rawToken: unknown,
  deps: { strapi: StrapiLike; fetch?: typeof fetch; now?: Date }
): Promise<StudioOpenResult> {
  const now = deps.now ?? new Date();
  const tokenStr = typeof rawToken === 'string' ? rawToken.trim() : '';
  const token = openSignupToken(tokenStr, now.getTime());
  if (!token) return { ok: false, reason: 'expired' };

  const row = await loadSession(deps.strapi, token.sid, deps.fetch).catch(() => null);
  if (!row || row.kind !== 'rikma') return { ok: false, reason: 'expired' };

  if (row.projectId) {
    return { ok: true, mode: 'created', projectId: row.projectId };
  }

  const liveShareKey =
    row.shareExpiresAt && new Date(row.shareExpiresAt).getTime() > now.getTime()
      ? mintShareKey(row.id, row.shareExpiresAt)
      : null;

  if (row.userId || row.status !== 'pending') {
    return {
      ok: true,
      mode: 'claimed',
      sessionId: row.id,
      reviewPath: `/moach/import/${row.id}`,
      previewUrl: liveShareKey ? `${SITE}/preview/rikma/${liveShareKey}` : null
    };
  }

  if (row.claimExpiresAt && new Date(row.claimExpiresAt).getTime() <= now.getTime()) {
    return { ok: false, reason: 'expired' };
  }

  const key =
    liveShareKey ??
    (await setShare(
      deps.strapi,
      row.id,
      { expiresAt: new Date(now.getTime() + SHARE_DAYS * 86_400_000).toISOString() },
      deps.fetch
    ));

  const nextPath = token.receive
    ? `/assistant/receive/${encodeURIComponent(tokenStr)}`
    : `/hascama?agent=${encodeURIComponent(tokenStr)}`;

  return {
    ok: true,
    mode: 'pending',
    recipientName: token.name,
    hasAccount: !!token.receive,
    signedWaitingEmail: !!row.chezinId,
    previewUrl: `${SITE}/preview/rikma/${key}`,
    manageUrl: `${SITE}/preview/rikma/studio/${encodeURIComponent(tokenStr)}`,
    nextPath,
    nextUrl: `${SITE}${nextPath}`,
    expiresAt: new Date(token.exp).toISOString(),
    session: publicView(row)
  };
}

export type StudioSaveResult =
  | ({
      ok: true;
      applied: number;
      rejected: unknown[];
      conflict: boolean;
    } & ReturnType<typeof publicView>)
  | {
      ok: false;
      reason: 'expired' | 'claimed' | 'tooManyRows' | 'noOps';
      message: string;
    };

export async function saveStudioOps(
  rawToken: unknown,
  expectedVersion: number,
  ops: unknown,
  deps: { strapi: StrapiLike; fetch?: typeof fetch; now?: Date }
): Promise<StudioSaveResult> {
  const now = deps.now ?? new Date();
  const token = openSignupToken(rawToken, now.getTime());
  if (!token) return { ok: false, reason: 'expired', message: 'This link has expired.' };
  if (!Array.isArray(ops) || !ops.length) {
    return { ok: false, reason: 'noOps', message: 'No changes to save.' };
  }

  const row = await loadSession(deps.strapi, token.sid, deps.fetch).catch(() => null);
  if (!row || row.kind !== 'rikma') return { ok: false, reason: 'expired', message: 'Draft not found.' };
  if (row.userId || row.status !== 'pending' || row.projectId) {
    return { ok: false, reason: 'claimed', message: 'This draft has already been claimed into an account.' };
  }
  if (row.claimExpiresAt && new Date(row.claimExpiresAt).getTime() <= now.getTime()) {
    return { ok: false, reason: 'expired', message: 'This link has expired.' };
  }

  const r = applyOps(row.state, ops, { kind: 'rikma', origin: 'manual' });
  if (r.state.items.length > MAX_PUBLIC_ROWS) {
    return {
      ok: false,
      reason: 'tooManyRows',
      message: `At most ${MAX_PUBLIC_ROWS} rows before signing up.`
    };
  }

  if (!r.applied.length) {
    return { ok: true, ...publicView(row), applied: 0, rejected: r.rejected, conflict: false };
  }

  const saved = await saveSession(
    deps.strapi,
    row,
    {
      state: r.state,
      expectedVersion: Number(expectedVersion),
      revision: {
        at: now.toISOString(),
        via: 'site',
        ops: r.applied,
        changes: r.changes
      }
    },
    deps.fetch
  );

  if ('conflict' in saved) {
    return { ok: true, ...publicView(saved.conflict), applied: 0, rejected: [], conflict: true };
  }

  if (!saved.row.shareExpiresAt || new Date(saved.row.shareExpiresAt).getTime() <= now.getTime()) {
    await setShare(
      deps.strapi,
      saved.row.id,
      { expiresAt: new Date(now.getTime() + SHARE_DAYS * 86_400_000).toISOString() },
      deps.fetch
    );
  }

  return { ok: true, ...publicView(saved.row), applied: r.applied.length, rejected: r.rejected, conflict: false };
}
