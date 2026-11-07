/**
 * Validating an incoming lead (docs/inprogress/PLAN_LEADS.md §5.1) — the same
 * rules whether it came from a site's server, a shop page or a member typing
 * in a phone call. Pure: the caller decides whether consent is required (a
 * member recording a call is not the person filling a form).
 *
 * Everything here is someone else's text, so it is length-bounded on the way
 * in and escaped wherever it is shown (§6).
 */

import { LEAD_SOURCES, type LeadSource } from './status';
import { normalizeEmail, normalizePhone } from './dedupe';

export const LEAD_LIMITS = Object.freeze({
  name: 200,
  short: 200,
  url: 2000,
  message: 4000,
  consentText: 4000,
  externalId: 128,
  detailsBytes: 4096,
  detailsKeys: 30,
  utmValue: 200
});

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

export interface LeadInput {
  name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  city: string | null;
  address: string | null;
  message: string | null;
  details: Record<string, string | number | boolean | null> | null;
  productId: string | null;
  externalId: string | null;
  source: LeadSource;
  sourceLabel: string | null;
  sourceUrl: string | null;
  utm: Partial<Record<(typeof UTM_KEYS)[number], string>> | null;
  consentText: string | null;
  consentAt: string | null;
  lang: string | null;
}

export type LeadValidationCode = 'VALIDATION_FAILED' | 'CONSENT_REQUIRED';

export type LeadValidation =
  | { ok: true; value: LeadInput }
  | { ok: false; code: LeadValidationCode; field: string; message: string };

const fail = (field: string, message: string, code: LeadValidationCode = 'VALIDATION_FAILED'): LeadValidation => ({
  ok: false,
  code,
  field,
  message
});

/** Trimmed string or null; `undefined`/`null`/blank all mean "not given". Non-strings are a type error (`false`). */
function str(v: unknown): string | null | false {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return t === '' ? null : t;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadPayload(
  raw: unknown,
  opts: {
    requireConsent: boolean;
    defaultSource?: LeadSource;
    now?: Date;
    /** The person is reached through their 1lev1 account — a phone or an email is then optional (L4). */
    hasAccount?: boolean;
    /**
     * A member opening work for a customer who left no details at all (PLAN_OFFSITE_CLIENT) —
     * set only by startOffsiteDeal's server-side call, never by a form or the API.
     */
    allowNoContact?: boolean;
  }
): LeadValidation {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('body', 'Expected a JSON object');
  const b = raw as Record<string, unknown>;

  const out: Partial<LeadInput> = {};
  const plain: Array<[keyof LeadInput, number]> = [
    ['name', LEAD_LIMITS.name],
    ['organization', LEAD_LIMITS.short],
    ['city', LEAD_LIMITS.short],
    ['address', LEAD_LIMITS.short],
    ['message', LEAD_LIMITS.message],
    ['externalId', LEAD_LIMITS.externalId],
    ['sourceLabel', LEAD_LIMITS.short],
    ['sourceUrl', LEAD_LIMITS.url],
    ['lang', 16],
    ['productId', 32]
  ];
  for (const [field, max] of plain) {
    const v = str(b[field]);
    if (v === false) return fail(field, `${field} must be a string`);
    if (v != null && v.length > max) return fail(field, `${field} is longer than ${max} characters`);
    (out as Record<string, unknown>)[field] = v;
  }
  if (!out.name) return fail('name', 'name is required');
  if (out.productId != null && !/^\d+$/.test(out.productId)) return fail('productId', 'productId must be an id');
  if (out.sourceUrl != null && !/^https?:\/\//i.test(out.sourceUrl)) return fail('sourceUrl', 'sourceUrl must be http(s)');

  const email = str(b.email);
  if (email === false) return fail('email', 'email must be a string');
  if (email != null && (email.length > LEAD_LIMITS.short || !EMAIL_RE.test(email))) {
    return fail('email', 'email is not a valid address');
  }
  const phone = str(b.phone);
  if (phone === false) return fail('phone', 'phone must be a string');
  if (phone != null && (phone.length > 40 || !normalizePhone(phone))) return fail('phone', 'phone is not a valid number');
  if (!email && !phone && !opts.hasAccount && !opts.allowNoContact) return fail('email', 'email or phone is required');
  out.email = email ? normalizeEmail(email) : null;
  out.phone = phone;

  // details: a flat bag of primitives the source chose to send (§2.2).
  out.details = null;
  if (b.details != null) {
    if (typeof b.details !== 'object' || Array.isArray(b.details)) return fail('details', 'details must be an object');
    const entries = Object.entries(b.details as Record<string, unknown>);
    if (entries.length > LEAD_LIMITS.detailsKeys) {
      return fail('details', `details has more than ${LEAD_LIMITS.detailsKeys} keys`);
    }
    for (const [k, v] of entries) {
      if (k.length > 64) return fail('details', 'a details key is longer than 64 characters');
      if (v !== null && !['string', 'number', 'boolean'].includes(typeof v)) {
        return fail('details', `details.${k} must be a string, number, boolean or null`);
      }
    }
    if (new TextEncoder().encode(JSON.stringify(b.details)).length > LEAD_LIMITS.detailsBytes) {
      return fail('details', `details is larger than ${LEAD_LIMITS.detailsBytes} bytes`);
    }
    out.details = entries.length ? (Object.fromEntries(entries) as LeadInput['details']) : null;
  }

  out.utm = null;
  if (b.utm != null) {
    if (typeof b.utm !== 'object' || Array.isArray(b.utm)) return fail('utm', 'utm must be an object');
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = str((b.utm as Record<string, unknown>)[key]);
      if (v === false) return fail('utm', `utm.${key} must be a string`);
      if (v != null) utm[key] = v.slice(0, LEAD_LIMITS.utmValue);
    }
    out.utm = Object.keys(utm).length ? utm : null;
  }

  const source = b.source ?? opts.defaultSource ?? 'api';
  if (!(LEAD_SOURCES as readonly unknown[]).includes(source)) return fail('source', 'unknown source');
  out.source = source as LeadSource;

  // Consent: what the person agreed to and when (§1.5).
  out.consentText = null;
  out.consentAt = null;
  if (b.consent != null) {
    if (typeof b.consent !== 'object' || Array.isArray(b.consent)) return fail('consent', 'consent must be { text, at }');
    const c = b.consent as Record<string, unknown>;
    const text = str(c.text);
    if (text === false || (text != null && text.length > LEAD_LIMITS.consentText)) {
      return fail('consent', 'consent.text must be a string');
    }
    out.consentText = text;
    if (c.at != null) {
      const at = typeof c.at === 'string' ? Date.parse(c.at) : NaN;
      if (!Number.isFinite(at)) return fail('consent', 'consent.at must be an ISO date');
      const now = (opts.now ?? new Date()).getTime();
      if (at > now + 5 * 60 * 1000) return fail('consent', 'consent.at is in the future');
      out.consentAt = new Date(at).toISOString();
    }
  }
  if (opts.requireConsent && !out.consentText) {
    return fail('consent', 'consent { text, at } is required', 'CONSENT_REQUIRED');
  }
  if (out.consentText && !out.consentAt) out.consentAt = (opts.now ?? new Date()).toISOString();

  return { ok: true, value: out as LeadInput };
}
