/**
 * Notices from the hub summary's feed (`processHubSummary`): every vote that
 * waits for the member, in every rikma, from the light query the hub and the
 * daily digest already read (85 / its `$uid` twin 347).
 *
 * The heart's own notices (`lev.ts`) say more — who asks, how many hours —
 * because they are built from the heart's full items (query 83). That query is
 * the heaviest read the site has and only a browser page runs it; where there is
 * no page — the MCP tool, the chat, a push — these are the rikma's notices.
 */

import { isUrgent, needsOrderedVote, type HubFeedItem } from '$lib/digest/hubSummary.js';
import { k, txt, type Notice } from './types';
import { ANI_OF, levFocusHref, voteHref } from './links';
import { subjectNoticeFrom } from './subject';

export function hubFeedNotice(item: HubFeedItem): Notice {
  const what = txt(item.title);
  return {
    key: `lev:${item.type}:${item.id}:v0`,
    // The same subject the heart's notice for this item has, so a list that
    // holds both keeps one (`mergeNotices`, the richer one first).
    subject: subjectOf(item),
    source: 'lev',
    kind: item.type,
    sentence: k(what ? 'notices.hub.vote' : 'notices.hub.voteUntitled', {
      kind: k(`common.feedTypes.${item.type}`),
      what,
      rikma: item.projectName
    }),
    detail: null,
    terms: [],
    where: item.projectId ? { kind: 'rikma', id: String(item.projectId), name: item.projectName ?? '' } : null,
    deadline: item.deadline,
    urgent: item.urgent,
    clockRuns: !!item.deadline,
    approve: null,
    expand: {
      kind: 'lev',
      ani: item.type,
      coinlapach: String(item.id),
      href: levFocusHref(item.type, item.projectId)
    },
    at: item.createdAt
  };
}

function subjectOf(item: HubFeedItem): string {
  if (item.type === 'askedm') return `candidacy:askm:${item.id}`;
  if (item.type === 'hachla') return `decision:${item.id}`;
  return `lev:${item.type}:${item.id}`;
}

export function hubFeedNotices(feed: HubFeedItem[] | null | undefined): Notice[] {
  return (feed ?? []).map(hubFeedNotice);
}

/**
 * Mission candidacies (Ask) that wait for this member, from qid `461hubAsks` /
 * `462hubAsksFor` — the one vote kind the hub summary does not carry. Worded by
 * `subjectNoticeFrom('ask')`, so it says what the notification said: who offers,
 * for which mission, the hours and rate on the table, and when silence approves.
 *
 * The rule is the heart's (levProcessors): the standing round is the highest
 * vote order, and a member who has not voted in it still has to. Never the
 * candidate's own ask, and never one whose clock already ran out.
 */
export function hubAskNotices(raw: any, uid: string, now: number = Date.now()): Notice[] {
  const projects = raw?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
  const out: Notice[] = [];
  for (const project of projects) {
    const projectId = String(project?.id ?? '');
    const projectName = project?.attributes?.projectName ?? '';
    for (const ask of project?.attributes?.asks?.data ?? []) {
      const a = ask?.attributes ?? {};
      const id = String(ask?.id ?? '');
      if (!id || !projectId) continue;
      if (String(a.users_permissions_user?.data?.id ?? '') === String(uid)) continue;
      if (a.timegrama?.data?.attributes?.done === true) continue;
      const vots = Array.isArray(a.vots) ? a.vots : [];
      if (!needsOrderedVote(vots, 0, uid)) continue;
      const round = vots.reduce((max: number, v: any) => Math.max(max, Number(v?.order) || 0), 0);
      const worded = subjectNoticeFrom('ask', {
        project: { data: { attributes: { projectName } } },
        ask: { data: ask }
      });
      if (!worded) continue;
      out.push({
        // The heart's key for the same card (lev.ts: `lev:<ani>:<coinlapach>:v<round>`),
        // so hiding it in one place hides it in the other; a counter is a new round.
        key: `lev:${ANI_OF.ask}:asked-${id}:v${round}`,
        subject: `candidacy:ask:${id}`,
        source: 'lev',
        kind: ANI_OF.ask,
        sentence: worded.sentence,
        detail: null,
        terms: worded.terms,
        where: { kind: 'rikma', id: projectId, name: projectName },
        deadline: worded.deadline,
        urgent: isUrgent(worded.deadline, now),
        clockRuns: !!worded.deadline,
        approve: null,
        // The ask's own vote page: one item, the clock, and the place to sign,
        // discuss or counter it.
        expand: { kind: 'lev', ani: ANI_OF.ask, coinlapach: `asked-${id}`, href: voteHref(projectId, 'ask', id) },
        at: a.createdAt ?? null
      });
    }
  }
  return out;
}
