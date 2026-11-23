/**
 * The proposed 1💗1 profile (docs/inprogress/PLAN_GROWTH_AGENT.md §5).
 *
 * Built from the research, field by field, each field saying where it came
 * from. On the owner's side it becomes a rikma blueprint (`track: business`)
 * handed to `prepareSignup` — the platform's existing way to prepare a rikma
 * for someone else — so nothing here creates a business: the owner does, by
 * claiming the draft.
 */

import { safeUrl } from './prospect';
import type { Claim, FieldOrigin, Prospect, ProfileDraft, ProfileField, Research } from './types';

const SOCIAL = /(facebook\.com|instagram\.com|linkedin\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com)/i;

const field = <T>(value: T, origin: FieldOrigin): ProfileField<T> => ({ value, origin });

/** A list field is verified only when every item in it is. */
function fromClaims(claims: Claim[]): ProfileField<string[]> {
  const value = claims.map((c) => c.text).filter(Boolean).slice(0, 15);
  return field(value, value.length && claims.every((c) => c.verified) ? 'verified' : 'suggested');
}

export function draftProfile(p: Prospect, now: string): ProfileDraft {
  const r: Research | null = p.research;
  const services = r?.services.length
    ? fromClaims(r.services)
    : field(p.services, p.services.length ? 'verified' : 'suggested');
  const site = safeUrl(p.website);
  return {
    title: field(p.name, 'verified'),
    description: r?.summary
      ? field(r.summary.text, r.summary.verified ? 'verified' : 'suggested')
      : field(p.notes ?? '', 'suggested'),
    services,
    products: r ? fromClaims(r.products) : field([], 'suggested'),
    categories: field(
      [...new Set([p.category, ...(r?.categories ?? [])].filter((c): c is string => !!c))].slice(0, 3),
      p.category && !(r?.categories.length) ? 'verified' : 'suggested'
    ),
    keywords: field([...new Set([...p.keywords, ...(r?.keywords ?? [])])].slice(0, 15), p.keywords.length && !r ? 'verified' : 'suggested'),
    coverage: r?.coverage
      ? field(r.coverage.text, r.coverage.verified ? 'verified' : 'suggested')
      : field([p.city, p.region, p.country].filter(Boolean).join(', '), 'verified'),
    website: field(site && !SOCIAL.test(site) ? site : '', 'verified'),
    social: field(
      [site, ...p.sources.map((s) => s.url)].filter((u): u is string => !!u && SOCIAL.test(u)).slice(0, 5),
      'verified'
    ),
    capabilities: field(r?.requestsFulfilled.slice(0, 8) ?? [], 'suggested'),
    approvedAt: null,
    approvedBy: null,
    updatedAt: now
  };
}

type ProfileKey = Exclude<keyof ProfileDraft, 'approvedAt' | 'approvedBy' | 'updatedAt'>;
export const PROFILE_TEXT_FIELDS = ['title', 'description', 'coverage', 'website'] as const satisfies readonly ProfileKey[];
export const PROFILE_LIST_FIELDS = ['services', 'products', 'categories', 'keywords', 'social', 'capabilities'] as const satisfies readonly ProfileKey[];

const MAX = { title: 120, description: 2000, coverage: 300, website: 500, item: 80 };

/**
 * Apply an operator's edits. A field whose value changed becomes `edited` —
 * a person looked at it and stands behind it — and any edit withdraws an
 * earlier approval, since what was approved is no longer what will be shown.
 */
export function editProfile(
  prev: ProfileDraft,
  patch: Partial<Record<ProfileKey, unknown>>,
  now: string
): { ok: true; value: ProfileDraft } | { ok: false; field: string } {
  const next: ProfileDraft = { ...prev, updatedAt: now };
  let changed = false;
  for (const k of PROFILE_TEXT_FIELDS) {
    if (patch[k] === undefined) continue;
    let v = String(patch[k] ?? '').trim().slice(0, MAX[k]);
    if (k === 'website' && v) {
      const safe = safeUrl(v);
      if (!safe) return { ok: false, field: 'website' };
      v = safe;
    }
    if (k === 'title' && !v) return { ok: false, field: 'title' };
    if (v !== prev[k].value) {
      next[k] = field(v, 'edited');
      changed = true;
    }
  }
  for (const k of PROFILE_LIST_FIELDS) {
    if (patch[k] === undefined) continue;
    const raw = Array.isArray(patch[k]) ? (patch[k] as unknown[]) : String(patch[k] ?? '').split(/[,\n]/);
    let v = raw.map((s) => String(s).trim().slice(0, MAX.item)).filter(Boolean).slice(0, 15);
    if (k === 'social') {
      v = v.map((u) => safeUrl(u)).filter((u): u is string => !!u);
    }
    if (JSON.stringify(v) !== JSON.stringify(prev[k].value)) {
      next[k] = field(v, 'edited');
      changed = true;
    }
  }
  if (changed) {
    next.approvedAt = null;
    next.approvedBy = null;
  }
  return { ok: true, value: next };
}

/** Counts for the preview's legend. */
export function originCounts(d: ProfileDraft): Record<FieldOrigin, number> {
  const out: Record<FieldOrigin, number> = { verified: 0, suggested: 0, edited: 0 };
  for (const k of [...PROFILE_TEXT_FIELDS, ...PROFILE_LIST_FIELDS]) {
    const f = d[k] as ProfileField<unknown>;
    const empty = Array.isArray(f.value) ? f.value.length === 0 : !f.value;
    if (!empty) out[f.origin]++;
  }
  return out;
}

/**
 * The rikma blueprint the owner will review (`BlueprintInputSchema`,
 * track `business`). Products are what the concierge finds a business by, so
 * every service becomes a price-on-request product; the owner sets prices.
 */
export function profileToBlueprint(d: ProfileDraft) {
  const categories = d.categories.value.slice(0, 3).map((c) => c.slice(0, 40));
  const keywords = d.keywords.value.slice(0, 15).map((k) => k.slice(0, 60));
  const offered = [...d.services.value, ...d.products.value];
  const products = [...new Set(offered)].slice(0, 20).map((name) => ({
    name: name.slice(0, 80),
    pricingMode: 'quote' as const,
    ...(keywords.length ? { keywords } : {}),
    ...(categories.length ? { categories } : {})
  }));
  return {
    fields: {
      track: 'business' as const,
      name: d.title.value.slice(0, 120),
      ...(d.description.value ? { publicDescription: d.description.value.slice(0, 2000) } : {}),
      ...(d.website.value ? { linkToWebsite: d.website.value } : {}),
      ...(d.coverage.value ? { location: { hint: d.coverage.value.slice(0, 200) } } : {})
    },
    products
  };
}
