/**
 * The prefilled "create a rikma" form (`/me?action=createproject&draft=…`).
 * Why it is one opaque parameter: see ./draftCodec.ts.
 */

import {
  decodeDraftParam,
  draftString,
  draftStringList,
  encodeDraftParam,
  normalizeDraftHtml
} from './draftCodec';

export { MAX_DRAFT_PARAM } from './draftCodec';
/** Kept under its original name — `details` was the first field it fixed. */
export { normalizeDraftHtml as normalizeDetailsHtml } from './draftCodec';

export const RES_IDS = ['feh', 'sth', 'nsh', 'sevend'] as const;
export const PROFIT_IDS = [
  'already',
  'week',
  'month',
  'threeM',
  'sixM',
  'oneY',
  'twoY',
  'more',
  'never'
] as const;

export type ProjectDraft = {
  name: string;
  desc?: string;
  details?: string;
  url?: string;
  vals?: string[];
  res?: (typeof RES_IDS)[number];
  profit?: (typeof PROFIT_IDS)[number];
  ont?: boolean;
};

const MAX = { name: 200, desc: 2000, details: 50_000, url: 2000, val: 100, vals: 30 };

/** Keep only well-typed fields, trimmed and capped. `null` when there is no name. */
export function sanitizeProjectDraft(input: unknown): ProjectDraft | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;

  const name = draftString(o.name, MAX.name);
  if (!name) return null;

  const draft: ProjectDraft = { name };
  const desc = draftString(o.desc, MAX.desc);
  if (desc) draft.desc = desc;
  const details = draftString(o.details, MAX.details);
  if (details) draft.details = normalizeDraftHtml(details);
  const url = draftString(o.url, MAX.url);
  if (url) draft.url = url;
  const vals = draftStringList(o.vals, MAX.val, MAX.vals);
  if (vals) draft.vals = vals;
  if ((RES_IDS as readonly unknown[]).includes(o.res)) draft.res = o.res as ProjectDraft['res'];
  if ((PROFIT_IDS as readonly unknown[]).includes(o.profit))
    draft.profit = o.profit as ProjectDraft['profit'];
  if (typeof o.ont === 'boolean') draft.ont = o.ont;
  return draft;
}

/** Draft → the value of the `draft` query parameter. */
export async function encodeProjectDraft(draft: ProjectDraft): Promise<string> {
  const clean = sanitizeProjectDraft(draft);
  if (!clean) throw new Error('A project draft needs a name');
  return encodeDraftParam(clean);
}

/** The `draft` query parameter → draft, or `null` if it cannot be read. Never throws. */
export async function decodeProjectDraft(param: string | null | undefined): Promise<ProjectDraft | null> {
  return sanitizeProjectDraft(await decodeDraftParam(param));
}
