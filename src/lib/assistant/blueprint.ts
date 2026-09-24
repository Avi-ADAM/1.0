/**
 * Rikma blueprint — a rikma, its products, missions, resources and partners,
 * before any of it exists (docs/PLAN_AI_SIGNUP_CONCIERGE.md §4.2).
 *
 * The same shape serves three tracks: a business being imported (the products
 * are what matter — that is how the concierge finds it), an existing
 * partnership that wants to see itself on 1lev1, and an idea being broken
 * down for recruiting partners.
 *
 * An outside agent (Claude) usually builds this itself — it already read the
 * site and heard the person — and sends it through `proposeRikmaBlueprint`.
 * `BlueprintInputSchema` is the contract for that call; `blueprintToState`
 * turns it into the session's item list, where refs become keys.
 */

import { z } from 'zod';
import { LIMITS, type AssistantItem, type AssistantState, type ItemOrigin } from './types.js';

export const TRACKS = ['business', 'partnership', 'idea'] as const;
export type Track = (typeof TRACKS)[number];

/** `matanot.kindOf`. A per-person price is `total` with an unlimited quantity. */
export const PRODUCT_KINDOF = ['total', 'unlimited', 'daily', 'monthly', 'yearly'] as const;
/** What createResource / a recipe line accept. */
export const RESOURCE_KINDOF = ['total', 'monthly', 'yearly', 'perUnit', 'rent'] as const;
/** The rikma's consent clock, as the creation form (`baci.svelte`) offers it. */
export const RESTIMES = ['feh', 'sth', 'nsh', 'sevend'] as const;
export const DEFAULT_RESTIME = 'feh';

const text = (max: number) => z.string().trim().max(max);
const name = z.string().trim().min(1).max(LIMITS.label);
const ref = z.string().trim().min(1).max(40);
const money = z.number().finite().min(0).max(100_000_000);
const why = text(LIMITS.why).optional();
const holder = z.enum(['me', 'open', 'partner']).optional();

const LocationSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).max(20_000).optional(),
  isOnline: z.boolean().optional(),
  hint: text(200).optional()
});

export const BlueprintProductSchema = z.object({
  ref: ref.optional(),
  name,
  desc: text(2000).optional(),
  /** `quote` = price on request. A product with a recipe is priced from it. */
  pricingMode: z.enum(['fixed', 'quote']).optional(),
  price: money.optional(),
  currency: z.string().trim().length(3).optional(),
  kindOf: z.enum(PRODUCT_KINDOF).optional(),
  quant: z.number().int().min(1).max(1_000_000).optional(),
  unlimited: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  /** Synonyms and the needs it answers — what a wish would say, not the product's name. */
  keywords: z.array(text(60)).max(15).optional(),
  /** Missions / resources (by ref) that make one unit of this product. */
  recipe: z
    .object({
      missions: z.array(ref).max(15).optional(),
      resources: z.array(ref).max(15).optional()
    })
    .optional(),
  why
});

export const BlueprintMissionSchema = z.object({
  ref: ref.optional(),
  name,
  descrip: text(2000).optional(),
  skills: z.array(text(60)).max(10).optional(),
  roles: z.array(text(60)).max(6).optional(),
  workways: z.array(text(60)).max(6).optional(),
  hours: z.number().min(0).max(10_000).optional(),
  ratePerHour: money.optional(),
  recurring: z.boolean().optional(),
  /** me = the person importing does it · open = looking for someone · partner = see partnerRef */
  holder,
  partnerRef: ref.optional(),
  why
});

export const BlueprintResourceSchema = z.object({
  ref: ref.optional(),
  name,
  descrip: text(2000).optional(),
  kindOf: z.enum(RESOURCE_KINDOF).optional(),
  price: money.optional(),
  quantity: z.number().min(0).max(1_000_000).optional(),
  holder,
  partnerRef: ref.optional(),
  why
});

export const BlueprintPartnerSchema = z.object({
  ref: ref.optional(),
  name,
  email: z.string().trim().email().max(200).optional(),
  why
});

export const BlueprintInputSchema = z.object({
  fields: z.object({
    track: z.enum(TRACKS),
    name: text(120).min(1),
    publicDescription: text(2000).optional(),
    /** Who it is for. */
    descripFor: text(2000).optional(),
    // Rendered as a link on the rikma page: http(s) only — zod's url() alone
    // also accepts `javascript:`.
    linkToWebsite: z
      .string()
      .trim()
      .max(500)
      .url()
      .refine((u) => /^https?:\/\//i.test(u), 'must be an http(s) address')
      .optional(),
    vals: z.array(text(60)).max(8).optional(),
    location: LocationSchema.optional(),
    currency: z.string().trim().length(3).optional(),
    restime: z.enum(RESTIMES).optional()
  }),
  products: z.array(BlueprintProductSchema).max(30).default([]),
  missions: z.array(BlueprintMissionSchema).max(30).default([]),
  resources: z.array(BlueprintResourceSchema).max(20).default([]),
  partners: z.array(BlueprintPartnerSchema).max(10).default([])
});

export type BlueprintInput = z.infer<typeof BlueprintInputSchema>;

export interface BlueprintWarning {
  where: string;
  message: string;
}

/** Drop undefined / empty values so a spec only says what was actually said. */
function compact(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Validated blueprint → session state. Refs become keys; a ref that points at
 * nothing is dropped with a warning rather than failing the whole import — the
 * person will see the row without that link and can fix it.
 */
export function blueprintToState(
  input: BlueprintInput,
  options: { origin?: ItemOrigin } = {}
): { state: AssistantState; warnings: BlueprintWarning[] } {
  const origin = options.origin ?? 'agent';
  const warnings: BlueprintWarning[] = [];
  const items: AssistantItem[] = [];
  let n = 0;
  const nextKey = () => `i${++n}`;

  // Keys first, so products can point forward at missions/resources and
  // missions at partners, whatever order the agent listed them in.
  const refs = {
    missions: new Map<string, string>(),
    resources: new Map<string, string>(),
    partners: new Map<string, string>()
  };
  const productKeys = input.products.map(() => nextKey());
  const missionKeys = input.missions.map((m) => {
    const k = nextKey();
    if (m.ref) refs.missions.set(m.ref, k);
    return k;
  });
  const resourceKeys = input.resources.map((r) => {
    const k = nextKey();
    if (r.ref) refs.resources.set(r.ref, k);
    return k;
  });
  const partnerKeys = input.partners.map((p) => {
    const k = nextKey();
    if (p.ref) refs.partners.set(p.ref, k);
    return k;
  });

  const resolve = (map: Map<string, string>, list: string[] | undefined, where: string): string[] => {
    const out: string[] = [];
    for (const r of list ?? []) {
      const k = map.get(r);
      if (!k) warnings.push({ where, message: `unknown ref "${r}"` });
      else if (!out.includes(k)) out.push(k);
    }
    return out;
  };

  const partnerOf = (
    h: 'me' | 'open' | 'partner' | undefined,
    partnerRef: string | undefined,
    where: string
  ): { holder: 'me' | 'open' | 'partner'; partnerKey?: string } => {
    if (h !== 'partner') return { holder: h ?? 'open' };
    const k = partnerRef ? refs.partners.get(partnerRef) : undefined;
    if (!k) {
      warnings.push({ where, message: `holder "partner" without a known partnerRef — left open` });
      return { holder: 'open' };
    }
    return { holder: 'partner', partnerKey: k };
  };

  input.products.forEach((p, i) => {
    const where = `products[${i}]`;
    const recipeMissions = resolve(refs.missions, p.recipe?.missions, `${where}.recipe.missions`);
    const recipeResources = resolve(refs.resources, p.recipe?.resources, `${where}.recipe.resources`);
    const spec = compact({
      desc: p.desc,
      pricingMode: p.pricingMode ?? (p.price != null ? 'fixed' : 'quote'),
      price: p.price,
      currency: p.currency?.toUpperCase(),
      kindOf: p.kindOf,
      quant: p.quant,
      unlimited: p.unlimited,
      isOnline: p.isOnline,
      keywords: p.keywords?.filter(Boolean),
      recipe:
        recipeMissions.length || recipeResources.length
          ? { missionKeys: recipeMissions, resourceKeys: recipeResources }
          : undefined
    });
    items.push({ key: productKeys[i], group: 'products', label: p.name, status: 'proposed', origin, ...(p.why ? { why: p.why } : {}), ...(spec ? { spec } : {}) });
  });

  input.missions.forEach((m, i) => {
    const where = `missions[${i}]`;
    const spec = compact({
      descrip: m.descrip,
      skills: m.skills?.filter(Boolean),
      roles: m.roles?.filter(Boolean),
      workways: m.workways?.filter(Boolean),
      hours: m.hours,
      ratePerHour: m.ratePerHour,
      recurring: m.recurring,
      ...partnerOf(m.holder, m.partnerRef, where)
    });
    items.push({ key: missionKeys[i], group: 'rikmaMissions', label: m.name, status: 'proposed', origin, ...(m.why ? { why: m.why } : {}), ...(spec ? { spec } : {}) });
  });

  input.resources.forEach((r, i) => {
    const where = `resources[${i}]`;
    const spec = compact({
      descrip: r.descrip,
      kindOf: r.kindOf,
      price: r.price,
      quantity: r.quantity,
      ...partnerOf(r.holder, r.partnerRef, where)
    });
    items.push({ key: resourceKeys[i], group: 'rikmaResources', label: r.name, status: 'proposed', origin, ...(r.why ? { why: r.why } : {}), ...(spec ? { spec } : {}) });
  });

  input.partners.forEach((p, i) => {
    const spec = compact({ email: p.email?.toLowerCase() });
    items.push({ key: partnerKeys[i], group: 'partners', label: p.name, status: 'proposed', origin, ...(p.why ? { why: p.why } : {}), ...(spec ? { spec } : {}) });
  });

  if (items.length > LIMITS.items) {
    warnings.push({ where: 'blueprint', message: `more than ${LIMITS.items} rows — the rest were left out` });
    items.length = LIMITS.items;
  }

  const fields = compact({
    track: input.fields.track,
    name: input.fields.name,
    publicDescription: input.fields.publicDescription,
    descripFor: input.fields.descripFor,
    linkToWebsite: input.fields.linkToWebsite,
    vals: input.fields.vals?.filter(Boolean),
    location: input.fields.location ? compact(input.fields.location) : undefined,
    currency: input.fields.currency?.toUpperCase(),
    restime: input.fields.restime
  });

  return { state: { items, ...(fields ? { fields } : {}) }, warnings };
}

/** Parse untrusted input (an agent's tool call). Returns zod's issues on failure. */
export function parseBlueprint(
  raw: unknown
): { ok: true; value: BlueprintInput } | { ok: false; issues: { path: string; message: string }[] } {
  const r = BlueprintInputSchema.safeParse(raw);
  if (r.success) return { ok: true, value: r.data };
  return {
    ok: false,
    issues: r.error.issues.slice(0, 20).map((i) => ({ path: i.path.join('.'), message: i.message }))
  };
}
