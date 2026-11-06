// A2b P3 — the settings Decisions of a rikma that already took effect, for
// the client that signs them lazily (PLAN_DISTRIBUTED_EXECUTION A2b §3).
//
// The server holds no member's key, so a Decision that matured by SILENCE —
// or by a vote cast from a client that did not sign — has no project.amend
// on the chain. The first member's client that syncs the rikma reads this
// list and signs what is missing: consensus.timeout (silence only) and the
// amend. Read-only and advisory, like the timer and genesis exports.
//
// Nothing is stored for it. What a settings Decision changed is a pure
// function of the Decision's own fields ($lib/consent/specs/projectAmend),
// with two exceptions resolved from the rikma as it is now:
//   - values (vallueadd/vallueles) depends on the set at maturation. Only the
//     LATEST matured values Decision is reported, with the set the rikma has
//     now — nothing else writes it in a rikma that decides by Decision, and
//     the value is the whole set, so skipping the earlier ones loses nothing.
//   - address is reported only while it is still the rikma's slug: the
//     applier re-validates it, and a refused one was never applied.

import { decisionToAmend, identityAmend, sortedIds, type Amend } from '$lib/consent/specs/projectAmend';

export const SETTINGS_KINDS = [
  'name',
  'pubdes',
  'prides',
  'newFlink',
  'newWlink',
  'timtoM',
  'pic',
  'codeLicense',
  'vallueadd',
  'vallueles',
  'address',
  'look'
] as const;

/** How many recent matured Decisions one read covers. */
export const MATURED_PAGE = 50;

export type MaturedSetting = {
  decisionId: string;
  kind: string;
  amend: Amend;
  /** 'vote' = every member said yes; otherwise the restime clock closed it. */
  maturedBy: 'vote' | 'silence';
  /** ms — the Decision's creation (round 0 opened) */
  roundStart: number | null;
  /** ms — when it was archived, i.e. took effect (updatedAt) */
  maturedAt: number | null;
  /** ms — the timegrama deadline that silence matured it at */
  expectedEnd: number | null;
  /** members whose yes is on the Decision */
  counted: string[];
};

export function settingsDecisionsQuery(projectId: string): string {
  const q = [
    `filters[projects][id][$eq]=${projectId}`,
    'filters[archived][$eq]=true',
    ...SETTINGS_KINDS.map((k, i) => `filters[kind][$in][${i}]=${k}`),
    'fields[0]=kind',
    'fields[1]=newname',
    'fields[2]=newpubdes',
    'fields[3]=newprides',
    'fields[4]=newFlink',
    'fields[5]=newWlink',
    'fields[6]=timtoM',
    'fields[7]=newCodeLicense',
    'fields[8]=newCodeLicenseYears',
    'fields[9]=newSlug',
    'fields[10]=newLook',
    'fields[11]=createdAt',
    'fields[12]=updatedAt',
    'populate[newpic][fields][0]=name',
    'populate[valluesadd][fields][0]=valueName',
    'populate[valluesles][fields][0]=valueName',
    'populate[timegrama][fields][0]=date',
    'populate[vots][populate][users_permissions_user][fields][0]=username',
    'sort[0]=updatedAt:desc',
    `pagination[pageSize]=${MATURED_PAGE}`
  ];
  return `/api/decisions?${q.join('&')}`;
}

export function settingsProjectQuery(projectId: string): string {
  const fields = [
    'slug', 'projectName', 'publicDescription', 'descripFor', 'linkToWebsite', 'fblink', 'githublink',
    'discordlink', 'drivelink', 'twiterlink', 'watsapplink', 'restime', 'codeLicense', 'codeLicenseOpenYears', 'look'
  ];
  const q = [
    ...fields.map((f, i) => `fields[${i}]=${f}`),
    'populate[user_1s][fields][0]=username',
    'populate[vallues][fields][0]=valueName',
    'populate[profilePic][fields][0]=name'
  ];
  return `/api/projects/${projectId}?${q.join('&')}`;
}

type Row = { id?: unknown; attributes?: Record<string, any> };

const ids = (rel: any): string[] =>
  Array.isArray(rel?.data) ? rel.data.map((r: Row) => r?.id).filter((x: unknown) => x != null).map(String) : [];

const ms = (x: unknown): number | null => {
  const t = typeof x === 'string' ? Date.parse(x) : NaN;
  return Number.isFinite(t) ? t : null;
};

export function maturedSettingsFromRest(decisionsBody: unknown, projectBody: unknown): MaturedSetting[] {
  const rows = (decisionsBody as { data?: unknown })?.data;
  const project = (projectBody as { data?: Row })?.data?.attributes ?? {};
  if (!Array.isArray(rows)) return [];

  const members = ids(project.user_1s);
  const currentValues = sortedIds(ids(project.vallues));
  const slug = typeof project.slug === 'string' ? project.slug : null;

  const out: MaturedSetting[] = [];
  let valuesReported = false; // rows are newest first
  for (const row of rows as Row[]) {
    const a = row?.attributes;
    if (row?.id == null || !a) continue;
    const kind = String(a.kind ?? '');

    let amend: Amend | null;
    if (kind === 'vallueadd' || kind === 'vallueles') {
      if (valuesReported) continue;
      valuesReported = true;
      amend = { path: 'values', value: currentValues };
    } else if (kind === 'address' || kind === 'look') {
      amend = identityAmend(kind, a);
      if (kind === 'address' && amend && amend.value !== slug) continue; // refused, or since replaced
    } else {
      amend = decisionToAmend(kind, a);
    }
    if (!amend) continue;

    const yes = new Set<string>();
    for (const v of Array.isArray(a.vots) ? a.vots : []) {
      const voter = v?.users_permissions_user?.data?.id ?? v?.ide;
      if (v?.what === true && voter != null) yes.add(String(voter));
    }
    const allYes = members.length > 0 && members.every((m) => yes.has(m));

    out.push({
      decisionId: String(row.id),
      kind,
      amend,
      maturedBy: allYes ? 'vote' : 'silence',
      roundStart: ms(a.createdAt),
      maturedAt: ms(a.updatedAt),
      expectedEnd: ms(a.timegrama?.data?.attributes?.date),
      counted: sortedIds(yes)
    });
  }
  return out;
}
