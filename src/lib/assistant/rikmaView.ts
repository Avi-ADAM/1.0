/**
 * A rikma blueprint as the read-only page a preview link shows
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.4) — "this is how your partnership
 * would look on 1lev1", before anything exists.
 *
 * Pure, and deliberately a *projection*: only what a stranger holding the link
 * may see. No keys, no session id, no email of a partner, no `why` (it quotes
 * the owner's conversation), no row the owner set aside.
 */

import type { AssistantItem, AssistantState } from './types.js';

export type ViewHolder = { kind: 'me' | 'open' } | { kind: 'partner'; name: string };

export interface RikmaViewRow {
  label: string;
  text?: string;
  holder?: ViewHolder;
  hours?: number;
  ratePerHour?: number;
  price?: number;
  quantity?: number;
}

export interface RikmaViewProduct {
  label: string;
  text?: string;
  price?: number;
  onRequest: boolean;
  madeOf: string[];
}

export interface RikmaView {
  track?: string;
  name: string;
  publicDescription?: string;
  linkToWebsite?: string;
  vals: string[];
  place?: string;
  currency?: string;
  products: RikmaViewProduct[];
  missions: RikmaViewRow[];
  resources: RikmaViewRow[];
  partners: { name: string; brings: string[] }[];
  /**
   * What each side brings, valued as the rikma would value it (mission hours ×
   * rate, resources at their price) — an illustration of how shares form, not
   * a promise. Empty when nothing carries a number.
   */
  split: { who: ViewHolder; value: number; pct: number }[];
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export function blueprintToRikmaView(state: AssistantState): RikmaView {
  const f = state.fields ?? {};
  const live = state.items.filter((it) => it.status !== 'dropped');
  const byKey = new Map(live.map((it) => [it.key, it]));

  const holderOf = (it: AssistantItem): ViewHolder => {
    const h = it.spec?.holder;
    if (h === 'me') return { kind: 'me' };
    if (h === 'partner') {
      const p = byKey.get(String(it.spec?.partnerKey ?? ''));
      if (p) return { kind: 'partner', name: p.label };
    }
    return { kind: 'open' };
  };

  const row = (it: AssistantItem): RikmaViewRow => {
    const s = it.spec ?? {};
    const out: RikmaViewRow = { label: it.label, holder: holderOf(it) };
    const text = str(s.descrip);
    if (text) out.text = text;
    for (const k of ['hours', 'ratePerHour', 'price', 'quantity'] as const) {
      const v = num(s[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  };

  const products: RikmaViewProduct[] = live
    .filter((it) => it.group === 'products')
    .map((it) => {
      const s = it.spec ?? {};
      const r = (s.recipe ?? {}) as { missionKeys?: string[]; resourceKeys?: string[] };
      const price = num(s.price);
      return {
        label: it.label,
        ...(str(s.desc) ? { text: str(s.desc) } : {}),
        ...(price !== undefined ? { price } : {}),
        onRequest: price === undefined || s.pricingMode === 'quote',
        madeOf: [...(r.missionKeys ?? []), ...(r.resourceKeys ?? [])]
          .map((k) => byKey.get(k)?.label)
          .filter((x): x is string => !!x)
      };
    });

  const missionItems = live.filter((it) => it.group === 'rikmaMissions');
  const resourceItems = live.filter((it) => it.group === 'rikmaResources');

  const partners = live
    .filter((it) => it.group === 'partners')
    .map((p) => ({
      name: p.label,
      brings: [...missionItems, ...resourceItems].filter((it) => it.spec?.partnerKey === p.key).map((it) => it.label)
    }));

  // The illustration: value per side.
  const values = new Map<string, { who: ViewHolder; value: number }>();
  const add = (who: ViewHolder, value: number) => {
    if (!(value > 0)) return;
    const id = who.kind === 'partner' ? `p:${who.name}` : who.kind;
    const cur = values.get(id) ?? { who, value: 0 };
    cur.value += value;
    values.set(id, cur);
  };
  for (const it of missionItems) add(holderOf(it), (num(it.spec?.hours) ?? 0) * (num(it.spec?.ratePerHour) ?? 0));
  for (const it of resourceItems) add(holderOf(it), (num(it.spec?.price) ?? 0) * (num(it.spec?.quantity) ?? 1));
  const total = [...values.values()].reduce((s, v) => s + v.value, 0);
  const split = total > 0
    ? [...values.values()]
        .map((v) => ({ ...v, pct: Math.round((v.value / total) * 1000) / 10 }))
        .sort((a, b) => b.value - a.value)
    : [];

  const loc = (f.location ?? null) as Record<string, unknown> | null;
  return {
    ...(str(f.track) ? { track: str(f.track) } : {}),
    name: str(f.name) ?? '',
    ...(str(f.publicDescription) ? { publicDescription: str(f.publicDescription) } : {}),
    ...(str(f.linkToWebsite) && /^https?:\/\//i.test(String(f.linkToWebsite)) ? { linkToWebsite: str(f.linkToWebsite) } : {}),
    vals: Array.isArray(f.vals) ? (f.vals as unknown[]).filter((v): v is string => typeof v === 'string' && !!v.trim()) : [],
    ...(str(loc?.hint) ? { place: str(loc?.hint) } : {}),
    ...(str(f.currency) ? { currency: str(f.currency) } : {}),
    products,
    missions: missionItems.map(row),
    resources: resourceItems.map(row),
    partners,
    split
  };
}
