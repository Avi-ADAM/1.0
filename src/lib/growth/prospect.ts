/**
 * Building and changing a prospect — pure, so the server actions and the
 * tests share one set of rules (docs/inprogress/PLAN_GROWTH_AGENT.md §3).
 */

import { splitList } from './csv';
import { emailKey, hostKey, identityKeys, phoneKey } from './dedupe';
import { advanceTo, furthestOf, isClosed, type Stage } from './stages';
import {
  GROWTH_LANGS,
  SOURCE_KINDS,
  type Activity,
  type GrowthLang,
  type Prospect,
  type ProspectInput,
  type ProspectSummary,
  type SourceKind,
  type SourceRef
} from './types';

export const LIMITS = { name: 120, short: 120, notes: 2000, nextAction: 300, activityText: 2000, activityKept: 300 };

export type InputRefusal = 'NAME_REQUIRED' | 'BAD_EMAIL' | 'BAD_PHONE' | 'BAD_WEBSITE' | 'BAD_SOURCE_URL';

const clip = (v: unknown, max: number): string | null => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  return s ? s.slice(0, max) : null;
};

/** http(s) only — a `javascript:` website must not become a link in the preview. */
export function safeUrl(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`);
    return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : null;
  } catch {
    return null;
  }
}

export function asLang(v: unknown, fallback: GrowthLang = 'he'): GrowthLang {
  return (GROWTH_LANGS as readonly string[]).includes(String(v)) ? (v as GrowthLang) : fallback;
}

export interface CleanInput {
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  category: string | null;
  services: string[];
  keywords: string[];
  size: string | null;
  notes: string | null;
  lang: GrowthLang;
  source: SourceRef;
}

/**
 * Validate what an operator typed or a CSV row carried. A malformed contact is
 * refused rather than dropped: a business must not lose its only way back
 * because of a typo nobody saw.
 */
export function cleanInput(
  input: ProspectInput,
  by: string | null,
  now: string,
  defaultSource: SourceKind = 'manual'
): { ok: true; value: CleanInput } | { ok: false; code: InputRefusal; field: string } {
  const name = clip(input.name, LIMITS.name);
  if (!name) return { ok: false, code: 'NAME_REQUIRED', field: 'name' };
  const rawEmail = clip(input.email, 200);
  const email = rawEmail ? emailKey(rawEmail) : null;
  if (rawEmail && !email) return { ok: false, code: 'BAD_EMAIL', field: 'email' };
  const rawPhone = clip(input.phone, 40);
  if (rawPhone && !phoneKey(rawPhone)) return { ok: false, code: 'BAD_PHONE', field: 'phone' };
  const rawSite = clip(input.website, 500);
  const website = rawSite ? safeUrl(rawSite) : null;
  if (rawSite && !website) return { ok: false, code: 'BAD_WEBSITE', field: 'website' };
  const rawSourceUrl = clip(input.sourceUrl, 500);
  const sourceUrl = rawSourceUrl ? safeUrl(rawSourceUrl) : null;
  if (rawSourceUrl && !sourceUrl) return { ok: false, code: 'BAD_SOURCE_URL', field: 'sourceUrl' };
  const kind = (SOURCE_KINDS as readonly string[]).includes(String(input.sourceKind))
    ? (input.sourceKind as SourceKind)
    : defaultSource;
  return {
    ok: true,
    value: {
      name,
      website,
      email,
      phone: rawPhone,
      country: clip(input.country, LIMITS.short),
      city: clip(input.city, LIMITS.short),
      region: clip(input.region, LIMITS.short),
      category: clip(input.category, LIMITS.short),
      services: splitList(input.services),
      keywords: splitList(input.keywords),
      size: clip(input.size, 40),
      notes: clip(input.notes, LIMITS.notes),
      lang: asLang(input.lang),
      source: { kind, label: clip(input.sourceLabel, 200), url: sourceUrl, at: now, by }
    }
  };
}

export function keysOf(c: Pick<CleanInput, 'website' | 'phone' | 'email' | 'name' | 'city'>): string[] {
  return identityKeys(c);
}

let seq = 0;
export function newId(now: string): string {
  seq = (seq + 1) % 1_000_000;
  return `${Date.parse(now).toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function activity(a: Omit<Activity, 'id'>): Activity {
  return { id: newId(a.at), ...a, text: a.text ? a.text.slice(0, LIMITS.activityText) : a.text ?? null };
}

/** Newest first, bounded: the log is a record, not an archive. */
export function withActivity(p: Prospect, a: Omit<Activity, 'id'>): Prospect {
  return { ...p, updatedAt: a.at, activity: [activity(a), ...p.activity].slice(0, LIMITS.activityKept) };
}

export function newProspect(c: CleanInput, dedupeKeys: string[], by: string | null, now: string, id = newId(now)): Prospect {
  const fieldSources: Record<string, SourceRef> = {};
  for (const f of ['website', 'email', 'phone', 'city', 'region', 'country', 'category'] as const) {
    if (c[f]) fieldSources[f] = c.source;
  }
  const p: Prospect = {
    id,
    createdAt: now,
    updatedAt: now,
    createdBy: by,
    name: c.name,
    website: c.website,
    email: c.email,
    phone: c.phone,
    country: c.country,
    city: c.city,
    region: c.region,
    category: c.category,
    services: c.services,
    keywords: c.keywords,
    size: c.size,
    notes: c.notes,
    lang: c.lang,
    sources: [c.source],
    fieldSources,
    dedupeKeys,
    stage: 'discovered',
    furthest: 'discovered',
    stageChangedAt: now,
    followUpAt: null,
    nextAction: null,
    research: null,
    profile: null,
    outreach: null,
    onboarding: null,
    activity: []
  };
  return withActivity(p, {
    at: now,
    by,
    kind: c.source.kind === 'csv' ? 'imported' : 'created',
    text: c.source.label ?? null
  });
}

/** An operator's edit: changed contact fields get the edit as their source. */
export function applyEdit(p: Prospect, c: CleanInput, dedupeKeys: string[], by: string, now: string): Prospect {
  const fieldSources = { ...p.fieldSources };
  for (const f of ['website', 'email', 'phone', 'city', 'region', 'country', 'category'] as const) {
    if (c[f] !== p[f]) {
      if (c[f]) fieldSources[f] = { ...c.source, kind: c.source.kind, at: now, by };
      else delete fieldSources[f];
    }
  }
  return withActivity(
    {
      ...p,
      name: c.name,
      website: c.website,
      email: c.email,
      phone: c.phone,
      country: c.country,
      city: c.city,
      region: c.region,
      category: c.category,
      services: c.services,
      keywords: c.keywords,
      size: c.size,
      notes: c.notes,
      lang: c.lang,
      fieldSources,
      dedupeKeys: [...new Set([...p.dedupeKeys, ...dedupeKeys])]
    },
    { at: now, by, kind: 'edited' }
  );
}

/** Set a stage and log it; the furthest stage only ever grows. */
export function setStage(p: Prospect, to: Stage, by: string | null, now: string, text?: string | null): Prospect {
  if (p.stage === to) return p;
  const moved: Prospect = { ...p, stage: to, furthest: furthestOf(p.furthest, to), stageChangedAt: now };
  // A closed door has nothing to follow up on.
  if (isClosed(to)) {
    moved.followUpAt = null;
    moved.nextAction = null;
  }
  return withActivity(moved, { at: now, by, kind: 'stage', from: p.stage, to, text: text ?? null });
}

/** The agent finished a step: move forward only, never out of a closed stage. */
export function advance(p: Prospect, to: Stage, by: string | null, now: string): Prospect {
  const next = advanceTo(p.stage, to);
  return next === p.stage ? p : setStage(p, next, by, now);
}

/**
 * "Do not contact" keeps the business's identity keys — so it is never
 * imported or researched into outreach again — and forgets how to reach it.
 */
export function forgetContact(p: Prospect): Prospect {
  const fieldSources = { ...p.fieldSources };
  delete fieldSources.email;
  delete fieldSources.phone;
  return {
    ...p,
    email: null,
    phone: null,
    fieldSources,
    research: p.research ? { ...p.research, contacts: [] } : null,
    outreach: null,
    onboarding: null
  };
}

export function summarize(p: Prospect): ProspectSummary {
  const r = p.research;
  const claims = r ? [r.summary, r.coverage, ...r.services, ...r.products].filter(Boolean) : [];
  return {
    id: p.id,
    name: p.name,
    website: p.website,
    hasEmail: !!p.email,
    hasPhone: !!p.phone,
    city: p.city,
    region: p.region,
    country: p.country,
    category: p.category,
    stage: p.stage,
    furthest: p.furthest,
    stageChangedAt: p.stageChangedAt,
    followUpAt: p.followUpAt,
    nextAction: p.nextAction,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    sourceKinds: [...new Set(p.sources.map((s) => s.kind))],
    researchStatus: r?.status ?? null,
    researchConfidence: r?.confidence ?? null,
    verifiedClaims: claims.filter((c) => c!.verified).length,
    totalClaims: claims.length,
    complementary: r?.complementary ?? [],
    profileApproved: !!p.profile?.approvedAt,
    hasProfile: !!p.profile,
    hasOutreach: !!p.outreach?.variants.length,
    outreachApproved: !!p.outreach?.approved,
    hasOnboardingLink: !!p.onboarding,
    lastActivity: p.activity[0] ?? null
  };
}

/** Websites and emails are compared by key, so `www.` or case never makes a "new" business. */
export function sameHost(a: string | null, b: string | null): boolean {
  return !!a && !!b && hostKey(a) === hostKey(b);
}

export type OwnerEvent =
  | { kind: 'claimed'; userId: string }
  | { kind: 'rikmaCreated'; userId: string; rikmaId: string };

/**
 * The owner acted on the draft we prepared (§10.2): they took it into their
 * account, or created their rikma from it. Their own act, so it is recorded
 * even on a closed stage — but a closed stage is never left automatically:
 * advance() stops there, and the operator decides. Repeats are no-ops.
 */
export function applyOwnerEvent(p: Prospect, e: OwnerEvent, now: string): Prospect {
  const o = p.onboarding;
  if (!o) return p;
  if (e.kind === 'claimed') {
    if (o.claimedAt) return p;
    const n = withActivity(
      { ...p, onboarding: { ...o, claimedAt: now, claimedBy: e.userId } },
      { at: now, by: null, kind: 'claimed', text: `#${e.userId}` }
    );
    return advance(n, 'onboardingStarted', null, now);
  }
  if (o.rikmaCreatedAt) return p;
  const n = withActivity(
    {
      ...p,
      onboarding: { ...o, claimedAt: o.claimedAt ?? now, claimedBy: o.claimedBy ?? e.userId, rikmaCreatedAt: now, rikmaId: e.rikmaId }
    },
    { at: now, by: null, kind: 'rikmaCreated', text: `#${e.rikmaId}` }
  );
  return advance(n, 'joined', null, now);
}

/** The window an active provider's sales or proposals count in (§10.4). */
export const ACTIVE_DAYS = 60;

export interface RikmaActivity {
  products: number;
  sales: number;
  proposals: number;
}

/** Active = it offers something AND someone dealt with it lately. */
export function isActiveRikma(a: RikmaActivity): boolean {
  return a.products > 0 && (a.sales > 0 || a.proposals > 0);
}

/**
 * Records an activity check of the rikma a business created (§10.4).
 * `joined` + active ⇒ `activeProvider`, by the system. The reverse is never
 * automatic: an active provider whose rikma went quiet is flagged once in the
 * log and stays where it is — the operator decides. Closed stages only store
 * the numbers.
 */
export function applyActivityCheck(p: Prospect, a: RikmaActivity, now: string, days = ACTIVE_DAYS): Prospect {
  const o = p.onboarding;
  if (!o?.rikmaId) return p;
  const active = isActiveRikma(a);
  const prev = o.activityCheck ?? null;
  const check = { checkedAt: now, days, products: a.products, sales: a.sales, proposals: a.proposals, active };
  let n: Prospect = { ...p, onboarding: { ...o, activityCheck: check } };
  const summary = `${a.products} · ${a.sales} · ${a.proposals}`;
  if (active && p.stage === 'joined') {
    n = advance(withActivity(n, { at: now, by: null, kind: 'activeDetected', text: summary }), 'activeProvider', null, now);
  } else if (!active && p.stage === 'activeProvider' && prev?.active !== false) {
    n = withActivity(n, { at: now, by: null, kind: 'inactiveDetected', text: summary });
  }
  return n;
}
