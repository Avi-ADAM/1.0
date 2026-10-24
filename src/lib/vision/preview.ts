/**
 * The /vision demo's answer: a founder's idea, as a small rikma sketch.
 *
 * The model drafts the same starter boards business onboarding does
 * (`generateSeedPlan`); this turns them into the little that fits on a landing
 * page — a few missions with their hours and rates, the resources the idea
 * needs, what it would sell — and the one number that makes the point: if each
 * mission is taken by a different partner, this is the split they start with.
 *
 * Deliberately narrow. It is a taste, not the planner: the page says so, and
 * the caps here are what keep it a taste. Pure, so the endpoint and its tests
 * share it.
 */

export const MAX_PREVIEW_MISSIONS = 5;
export const MAX_PREVIEW_RESOURCES = 4;
export const MAX_PREVIEW_PRODUCTS = 3;

/** The planner's row, as much of it as the preview reads. */
export interface PreviewRowLike {
  kind: string;
  name: string;
  nhours?: number | null;
  valph?: number | null;
}

export interface PreviewBoardLike {
  items: readonly PreviewRowLike[];
}

export interface PreviewMission {
  name: string;
  hours: number | null;
  rate: number | null;
  /** hours × rate, or null when either is missing. */
  value: number | null;
  /** This mission's share of the missions' total value, 0–100; null without a value. */
  share: number | null;
}

export interface VisionPreview {
  missions: PreviewMission[];
  resources: string[];
  products: string[];
  /** Rows the planner drafted that the preview left out — "the full version has N more". */
  more: number;
}

const positive = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;

const nameOf = (v: unknown): string =>
  typeof v === 'string' ? v.trim().slice(0, 120) : '';

export function boardsToVisionPreview(boards: readonly PreviewBoardLike[]): VisionPreview {
  const rows = (boards ?? []).flatMap((b) => b?.items ?? []);
  const missions: PreviewMission[] = [];
  const resources: string[] = [];
  const products: string[] = [];
  let considered = 0;

  for (const row of rows) {
    const name = nameOf(row?.name);
    if (!name) continue;
    // Acts and notes carry no equity and are not what the page is showing.
    if (row.kind !== 'mission' && row.kind !== 'resource' && row.kind !== 'product') continue;
    considered++;
    if (row.kind === 'mission' && missions.length < MAX_PREVIEW_MISSIONS) {
      const hours = positive(row.nhours);
      const rate = positive(row.valph);
      missions.push({ name, hours, rate, value: hours && rate ? hours * rate : null, share: null });
    } else if (row.kind === 'resource' && resources.length < MAX_PREVIEW_RESOURCES) {
      resources.push(name);
    } else if (row.kind === 'product' && products.length < MAX_PREVIEW_PRODUCTS) {
      products.push(name);
    }
  }

  const total = missions.reduce((sum, m) => sum + (m.value ?? 0), 0);
  if (total > 0) {
    for (const m of missions) m.share = m.value ? Math.round((m.value / total) * 1000) / 10 : null;
  }

  const shown = missions.length + resources.length + products.length;
  return { missions, resources, products, more: Math.max(0, considered - shown) };
}

/** True when the sketch has anything to show at all. */
export function isEmptyPreview(p: VisionPreview): boolean {
  return !p.missions.length && !p.resources.length && !p.products.length;
}
