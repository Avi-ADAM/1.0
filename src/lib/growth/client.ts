/**
 * The Growth Agent screens' one way to write: an action through /api/action,
 * then a refresh of whatever the page shows.
 */

import { executeAction } from '$lib/client/actionClient';
import { invalidateAll } from '$app/navigation';

export type GrowthResult<T = any> = { ok: true; data: T } | { ok: false; code: string; details?: any };

/** Codes the screens have words for (growth.errors.*). */
export const KNOWN_ERRORS = [
  'NAME_REQUIRED',
  'BAD_EMAIL',
  'BAD_PHONE',
  'BAD_WEBSITE',
  'BAD_SOURCE_URL',
  'DUPLICATE',
  'CLOSED_DOOR',
  'REASON_REQUIRED',
  'SAME_STAGE',
  'PROFILE_NOT_APPROVED',
  'EMAIL_REQUIRED',
  'NO_PROFILE',
  'TEXT_REQUIRED',
  'BAD_DATE',
  'BAD_FIELD',
  'EMPTY_FILE',
  'FILE_TOO_LARGE',
  'NO_NAME_COLUMN',
  'RATE_LIMITED',
  'NOT_CONFIGURED',
  'NOT_FOUND',
  'self',
  'unverified'
] as const;

export async function runGrowth<T = any>(key: string, params: Record<string, unknown>, refresh = true): Promise<GrowthResult<T>> {
  try {
    const r = await executeAction(key as any, params as any);
    if (r.success) {
      if (refresh) await invalidateAll();
      return { ok: true, data: r.data as T };
    }
    // A validation refusal carries its reason in the message (`BAD_EMAIL`), anything else in the code.
    const code = r.error?.code === 'VALIDATION_FAILED' ? r.error?.message ?? 'VALIDATION_FAILED' : r.error?.code ?? 'INTERNAL_ERROR';
    return { ok: false, code, details: r.error?.details };
  } catch {
    return { ok: false, code: 'NETWORK' };
  }
}

export function errorKey(code: string): string {
  return (KNOWN_ERRORS as readonly string[]).includes(code) ? `growth.errors.${code}` : 'growth.errors.generic';
}
