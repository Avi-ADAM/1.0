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

import type { HubFeedItem } from '$lib/digest/hubSummary.js';
import { k, txt, type Notice } from './types';

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
      href: `/lev?focus=${encodeURIComponent(item.type)}${item.projectId ? `&project=${encodeURIComponent(String(item.projectId))}` : ''}`
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
