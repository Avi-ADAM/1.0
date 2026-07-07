// Strapi persistence for sealed envelopes (HANDOFF_DISTRIBUTED_DB T3).
//
// Mimics src/lib/server/consent/strapiMirror.ts one-to-one: Strapi is a
// MIRROR, not the authority — every call is best-effort, a down Strapi
// degrades the relay to memory-only and never blocks a push. The server
// cannot read the ciphertext inside `payload`; this collection exists only
// so the mailbox survives restarts (Vercel serverless / Docker redeploys).
//
// Backend: Strapi v4 (repo 1.0b) — collection
// api::sealed-envelope.sealed-envelope, append-only (find/findOne/create).

import { env } from '$env/dynamic/private';
import type { SealedEnvelope } from '$lib/space/e2e/seal';
import { isSealedEnvelopeShape } from '$lib/space/e2e/seal';

const BASE = (import.meta.env.VITE_URL as string | undefined) ?? 'http://127.0.0.1:1337';

function adminToken(): string {
  return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

/** The mirror is active only when the server has credentials for Strapi. */
export function sealedMirrorEnabled(): boolean {
  return Boolean(adminToken()) && env.CONSENT_MIRROR !== 'off';
}

let warned = false;
function warnOnce(what: string, e: unknown) {
  if (warned) return;
  warned = true;
  console.warn(`[relay/sealedMirror] ${what} failed — running memory-only:`, e);
}

class ReqError extends Error {
  constructor(readonly status: number, readonly body: string, message: string) {
    super(message);
    this.name = 'ReqError';
  }
}

async function req(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken()}`,
        ...init?.headers
      },
      signal: controller.signal
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new ReqError(
        res.status,
        detail,
        `${init?.method ?? 'GET'} ${path} → ${res.status}${detail ? ` — ${detail.slice(0, 500)}` : ''}`
      );
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function rowPayload(row: unknown): unknown {
  const r = row as { attributes?: { payload?: unknown }; payload?: unknown } | undefined;
  return r?.attributes?.payload ?? r?.payload;
}

function responseRows(json: unknown): unknown[] {
  const data = (json as { data?: unknown } | undefined)?.data;
  return Array.isArray(data) ? data : [];
}

function rowToSealed(row: unknown): SealedEnvelope | undefined {
  const payload = rowPayload(row);
  return isSealedEnvelopeShape(payload) ? payload : undefined;
}

export async function mirrorSaveSealed(sealed: SealedEnvelope): Promise<void> {
  if (!sealedMirrorEnabled()) return;
  try {
    await req('/sealed-envelopes', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          envelopeId: sealed.id,
          spaceId: sealed.spaceId,
          ts: String(sealed.ts),
          payload: sealed
        }
      })
    });
  } catch (e) {
    // A 400 on the unique envelopeId column = already mirrored; anything else
    // is a degraded mirror. Both are tolerable.
    warnOnce('saveSealed', e);
  }
}

export async function mirrorSealedForSpace(spaceId: string): Promise<SealedEnvelope[]> {
  if (!sealedMirrorEnabled()) return [];
  try {
    const json = await req(
      `/sealed-envelopes?filters[spaceId][$eq]=${encodeURIComponent(spaceId)}` +
      `&sort[0]=ts:asc&pagination[limit]=-1`
    );
    return responseRows(json)
      .map(rowToSealed)
      .filter((s): s is SealedEnvelope => s !== undefined);
  } catch (e) {
    warnOnce('sealedForSpace', e);
    return [];
  }
}
