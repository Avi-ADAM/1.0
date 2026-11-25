/**
 * The visitor's rikma, as a blueprint the platform already knows how to keep
 * (docs/inprogress/PLAN_EXHIBITION_MODE.md §7) — the same shape `prepareSignup` and
 * the growth agent hand over, so signing up turns it into a real rikma with
 * nothing exhibit-specific on the way.
 *
 * Two rules:
 *  - the nine people are invented, so they never travel: a part the visitor
 *    gave one of them becomes an open mission or resource — exactly the
 *    opening a real partner will fill. Only the visitor's own parts are `me`;
 *  - labels arrive already in the visitor's language (the kiosk resolves them),
 *    and the server validates the whole thing with `parseBlueprint` anyway.
 */
import { LIMITS } from '$lib/assistant/types';
import type { ExhibitIdea, ExhibitTask } from './types';

/** What the conversion needs from the sandbox — kept narrow so it stays pure. */
export interface BlueprintSource {
  idea: ExhibitIdea | null;
  ownerOf(task: ExhibitTask): string | null;
  hoursOf(task: ExhibitTask): number | null;
  valueOf(task: ExhibitTask): number;
}

const clip = (s: string, max: number) => s.trim().slice(0, max);

export function sandboxToBlueprint(
  sb: BlueprintSource,
  opts: { me: string; title: string; description?: string; label: (task: ExhibitTask) => string }
) {
  const idea = sb.idea;
  if (!idea) return null;
  const holder = (task: ExhibitTask) => (sb.ownerOf(task) === opts.me ? 'me' : 'open');
  const name = (task: ExhibitTask) => clip(opts.label(task), LIMITS.label);
  return {
    fields: {
      track: 'idea' as const,
      name: clip(opts.title, 120),
      ...(opts.description ? { publicDescription: clip(opts.description, 2000) } : {}),
      currency: 'ILS'
    },
    missions: idea.missions.map((m) => ({
      ref: m.id,
      name: name(m),
      ...(sb.hoursOf(m) ? { hours: sb.hoursOf(m)! } : {}),
      ...(m.rate ? { ratePerHour: m.rate } : {}),
      holder: holder(m)
    })),
    resources: idea.resources.map((r) => ({
      ref: r.id,
      name: name(r),
      ...(sb.valueOf(r) ? { price: sb.valueOf(r) } : {}),
      holder: holder(r)
    })),
    products: idea.products.map((p) => ({ name: name(p), pricingMode: 'quote' as const })),
    partners: []
  };
}
