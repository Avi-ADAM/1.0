/**
 * "Publish as a mission" — turning an unplaced act into a real mission.
 *
 * An act (מטלה) is a chore inside the rikma: small, concrete, usually attached
 * to a mission someone is already running. When nobody takes one, the honest
 * next step is to make it a mission of its own so the rikma can staff it
 * through the normal consent flow, instead of leaving it in the awaiting-
 * placement lane forever.
 *
 * The act does not create the mission itself. It hands the mission form a
 * prefill and its own id, and the form's existing `?action=createmission`
 * consumer (`/moach/[projectId]/create`) does the rest — the same entry point
 * the AI's `prepareMissionTool` and the planning boards already use. When the
 * member actually presses publish, `linkActToMission` attaches the act to
 * whatever `createMission` produced (a `pendm`, an `openMission`, or a
 * `mesimabetahalich` — see `configs/createMission.ts`).
 */

import type { ActRowLike } from './actStatus.js';

/** Which relation on `Act` holds each thing `createMission` can produce. */
export const ACT_MISSION_RELATION = {
  pendm: 'pendm',
  openMission: 'open_mission',
  mesimabetahalich: 'mesimabetahaliches'
} as const;

export type CreatedMissionType = keyof typeof ACT_MISSION_RELATION;

/** `createMission` reports one of these; anything else we refuse to link. */
export function isLinkableMissionType(value: unknown): value is CreatedMissionType {
  return typeof value === 'string' && value in ACT_MISSION_RELATION;
}

/**
 * Rich text → plain text for the mission form's description field.
 *
 * `Act.des` is TipTap HTML (`richText.svelte` writes it). The mission form
 * takes a plain string and the value travels through a query string, so tags
 * would be shown to the member literally. Entities are decoded after tags are
 * stripped, so an escaped `&lt;b&gt;` in the source survives as text rather
 * than becoming a tag.
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    // Block boundaries carry meaning the tag strip would otherwise erase.
    .replace(/<\/(p|div|li|h[1-6]|blockquote)\s*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // Last, so a literal `&amp;lt;` does not decode twice into a tag.
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Role names attached to the act, in the viewer's language where available. */
export function actRoleNames(row: ActRowLike | null | undefined, locale = 'he'): string[] {
  const out: string[] = [];
  for (const role of row?.tafkidims?.data ?? []) {
    const attrs = (role as any)?.attributes ?? {};
    // Role names are authored in the default locale; Hebrew lives in
    // `localizations` (same lookup the old filter chips used).
    const localized =
      locale === 'he' ? attrs?.localizations?.data?.[0]?.attributes?.roleDescription : null;
    const name = localized || attrs?.roleDescription;
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

/**
 * The deep link that opens the mission form half-filled from this act.
 *
 * Returns a root-relative URL so `goto()` keeps the SPA navigation. `fromAct`
 * is what closes the loop: the create page reads it back and links the act to
 * the mission it just produced.
 */
export function buildPublishAsMissionUrl(
  projectId: string | number,
  row: ActRowLike & { shem?: string | null; des?: string | null },
  locale = 'he'
): string {
  const params = new URLSearchParams({ action: 'createmission' });

  const name = (row?.shem ?? '').trim();
  if (name) params.set('name', name);

  const descrip = htmlToPlainText(row?.des);
  if (descrip) params.set('descrip', descrip);

  const roles = actRoleNames(row, locale);
  if (roles.length) params.set('roles', roles.join(','));

  if (row?.id != null) params.set('fromAct', String(row.id));

  return `/moach/${projectId}/create?${params.toString()}`;
}
