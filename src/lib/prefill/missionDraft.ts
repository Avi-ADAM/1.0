/**
 * The prefilled mission form (`/moach/<projectId>/create?action=createmission&draft=…`).
 * Why it is one opaque parameter: see ./draftCodec.ts.
 *
 * The draft carries only what the agent proposed. The act link (`fromAct`,
 * `assignActToMe`) stays a plain parameter: it is set by the site's own
 * "publish as a mission" button, never by an agent, and never holds free text.
 */

import {
  decodeDraftParam,
  draftString,
  draftStringList,
  encodeDraftParam,
  normalizeDraftHtml
} from './draftCodec';

export type MissionDraft = {
  name: string;
  descrip?: string;
  skills?: string[];
  roles?: string[];
  workways?: string[];
  nhours?: number;
  valph?: number;
};

/** Term caps match `/api/vocab/resolve`, which is where these names go next. */
const MAX = { name: 200, descrip: 50_000, term: 80, terms: 8 };

const positive = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;

/** Keep only well-typed fields, trimmed and capped. `null` when there is no name. */
export function sanitizeMissionDraft(input: unknown): MissionDraft | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;

  const name = draftString(o.name, MAX.name);
  if (!name) return null;

  const draft: MissionDraft = { name };
  const descrip = draftString(o.descrip, MAX.descrip);
  if (descrip) draft.descrip = normalizeDraftHtml(descrip);
  for (const key of ['skills', 'roles', 'workways'] as const) {
    const list = draftStringList(o[key], MAX.term, MAX.terms);
    if (list) draft[key] = list;
  }
  const nhours = positive(o.nhours);
  if (nhours != null) draft.nhours = nhours;
  const valph = positive(o.valph);
  if (valph != null) draft.valph = valph;
  return draft;
}

/** Draft → the value of the `draft` query parameter. */
export async function encodeMissionDraft(draft: MissionDraft): Promise<string> {
  const clean = sanitizeMissionDraft(draft);
  if (!clean) throw new Error('A mission draft needs a name');
  return encodeDraftParam(clean);
}

/** The `draft` query parameter → draft, or `null` if it cannot be read. Never throws. */
export async function decodeMissionDraft(param: string | null | undefined): Promise<MissionDraft | null> {
  return sanitizeMissionDraft(await decodeDraftParam(param));
}
