/**
 * What the dashboard and the network page say (docs/inprogress/PLAN_GROWTH_AGENT.md §7, §9).
 *
 * Everything here is computed from the pipeline's own records, and each
 * recommendation carries the numbers it was made from, so the operator can
 * see why. Registrations are deliberately not the headline: coverage of
 * categories and regions by ACTIVE providers is.
 */

import { CLOSED, FUNNEL, isClosed, reached, type Stage } from './stages';
import type { Confidence, ProspectSummary } from './types';
import { demandFor, type DemandSummary } from './demand';

const DAY = 24 * 60 * 60 * 1000;

export interface DashboardCounts {
  discovered: number;
  researched: number;
  awaitingProfileApproval: number;
  invitationsReady: number;
  invitationsSent: number;
  interested: number;
  registered: number;
  active: number;
  followUpsDue: number;
  closed: number;
}

export function isFollowUpDue(p: ProspectSummary, now: number): boolean {
  return !!p.followUpAt && !isClosed(p.stage) && Date.parse(p.followUpAt) <= now;
}

export function dashboardCounts(rows: ProspectSummary[], now: number): DashboardCounts {
  const c: DashboardCounts = {
    discovered: rows.length,
    researched: 0,
    awaitingProfileApproval: 0,
    invitationsReady: 0,
    invitationsSent: 0,
    interested: 0,
    registered: 0,
    active: 0,
    followUpsDue: 0,
    closed: 0
  };
  for (const p of rows) {
    if (reached(p.furthest, 'researched')) c.researched++;
    if (p.hasProfile && !p.profileApproved && !isClosed(p.stage)) c.awaitingProfileApproval++;
    if (p.stage === 'invitationReady') c.invitationsReady++;
    if (reached(p.furthest, 'invitationSent')) c.invitationsSent++;
    if (reached(p.furthest, 'interested')) c.interested++;
    if (reached(p.furthest, 'joined')) c.registered++;
    if (p.stage === 'activeProvider') c.active++;
    if (isFollowUpDue(p, now)) c.followUpsDue++;
    if (isClosed(p.stage)) c.closed++;
  }
  return c;
}

export interface FunnelStep {
  stage: Stage;
  count: number;
  /** Share of the previous step that reached this one, 0–1; null for the first. */
  fromPrevious: number | null;
}

/** Each business counts at every step it ever reached — a later decline does not erase the way there. */
export function funnel(rows: ProspectSummary[]): FunnelStep[] {
  let prev: number | null = null;
  return FUNNEL.map((stage) => {
    const count = rows.filter((p) => reached(p.furthest, stage)).length;
    const step: FunnelStep = { stage, count, fromPrevious: prev == null ? null : prev ? count / prev : 0 };
    prev = count;
    return step;
  });
}

export type NextActionKey =
  | 'research'
  | 'approveProfiles'
  | 'draftOutreach'
  | 'sendInvitations'
  | 'followUps'
  | 'interestedNotJoined'
  | 'newInCategory'
  | 'activate';

export interface NextAction {
  key: NextActionKey;
  count: number;
  /** For `newInCategory`: what was found where. */
  category?: string;
  region?: string;
  /** Where the work is: a pipeline view and/or a stage. */
  view: string;
}

/** The ordered to-do list for one operator — biggest unblockers first. */
export function nextActions(rows: ProspectSummary[], now: number): NextAction[] {
  const open = rows.filter((p) => !isClosed(p.stage));
  const out: NextAction[] = [];
  const push = (a: NextAction) => a.count > 0 && out.push(a);
  push({ key: 'followUps', count: open.filter((p) => isFollowUpDue(p, now)).length, view: 'followups' });
  push({
    key: 'interestedNotJoined',
    count: open.filter((p) => p.stage === 'interested' || p.stage === 'onboardingStarted').length,
    view: 'interested'
  });
  push({ key: 'sendInvitations', count: open.filter((p) => p.stage === 'invitationReady').length, view: 'outreach' });
  push({ key: 'approveProfiles', count: open.filter((p) => p.hasProfile && !p.profileApproved).length, view: 'profiles' });
  push({
    key: 'draftOutreach',
    count: open.filter((p) => p.profileApproved && !p.outreachApproved && p.stage !== 'invitationSent' && !reached(p.furthest, 'invitationSent')).length,
    view: 'outreach'
  });
  push({ key: 'research', count: open.filter((p) => !p.researchStatus).length, view: 'research' });
  push({ key: 'activate', count: open.filter((p) => p.stage === 'joined').length, view: 'joined' });
  for (const g of recentDiscoveries(rows, now, 7)) {
    out.push({ key: 'newInCategory', count: g.count, category: g.category, region: g.region ?? undefined, view: 'research' });
  }
  return out;
}

/** "3 new catering providers were discovered in the Sharon region." */
export function recentDiscoveries(rows: ProspectSummary[], now: number, days: number) {
  const since = now - days * DAY;
  const groups = new Map<string, { category: string; region: string | null; count: number }>();
  for (const p of rows) {
    if (!p.category || Date.parse(p.createdAt) < since) continue;
    const region = p.region ?? p.city ?? null;
    const k = `${p.category.toLowerCase()}|${(region ?? '').toLowerCase()}`;
    const g = groups.get(k) ?? { category: p.category, region, count: 0 };
    g.count++;
    groups.set(k, g);
  }
  return [...groups.values()].filter((g) => g.count >= 2).sort((a, b) => b.count - a.count).slice(0, 3);
}

export interface CoverageCell {
  category: string;
  region: string;
  pipeline: number;
  joined: number;
  active: number;
}

const UNKNOWN = '—';

export function coverage(rows: ProspectSummary[]): CoverageCell[] {
  const m = new Map<string, CoverageCell>();
  for (const p of rows) {
    if (p.stage === 'doNotContact') continue;
    const category = p.category?.trim() || UNKNOWN;
    const region = (p.region ?? p.city)?.trim() || UNKNOWN;
    const k = `${category.toLowerCase()}|${region.toLowerCase()}`;
    const c = m.get(k) ?? { category, region, pipeline: 0, joined: 0, active: 0 };
    c.pipeline++;
    if (reached(p.furthest, 'joined') && !CLOSED.includes(p.stage)) c.joined++;
    if (p.stage === 'activeProvider') c.active++;
    m.set(k, c);
  }
  return [...m.values()].sort((a, b) => b.active - a.active || b.pipeline - a.pipeline);
}

export interface Gap {
  kind: 'thinCategory' | 'wantedComplement';
  category: string;
  region?: string;
  active: number;
  /** For `wantedComplement`: how many researched businesses named it as a partner they would need. */
  mentions?: number;
}

/**
 * Two kinds of gap, both from our own data:
 *  - a category/region where we have prospects but at most one active provider;
 *  - a category the research keeps naming as complementary that has no active
 *    provider at all — the network asking for a neighbour it does not have.
 * Customer-demand gaps are demandGaps() in ./demand.ts (§9.2).
 */
export function gaps(rows: ProspectSummary[]): Gap[] {
  const cells = coverage(rows);
  const activeByCategory = new Map<string, number>();
  for (const c of cells) {
    const k = c.category.toLowerCase();
    activeByCategory.set(k, (activeByCategory.get(k) ?? 0) + c.active);
  }
  const thin: Gap[] = cells
    .filter((c) => c.category !== UNKNOWN && c.pipeline >= 2 && c.active <= 1)
    .map((c) => ({ kind: 'thinCategory', category: c.category, region: c.region === UNKNOWN ? undefined : c.region, active: c.active }));
  const mentions = new Map<string, { name: string; n: number }>();
  for (const p of rows) {
    if (p.stage !== 'activeProvider' && p.stage !== 'joined') continue;
    for (const comp of p.complementary) {
      const k = comp.trim().toLowerCase();
      if (!k) continue;
      const e = mentions.get(k) ?? { name: comp.trim(), n: 0 };
      e.n++;
      mentions.set(k, e);
    }
  }
  const wanted: Gap[] = [...mentions.entries()]
    .filter(([k]) => !(activeByCategory.get(k) ?? 0))
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 8)
    .map(([, e]) => ({ kind: 'wantedComplement', category: e.name, active: 0, mentions: e.n }));
  return [...wanted, ...thin].slice(0, 12);
}

export interface PriorityReason {
  key: 'gap' | 'complements' | 'demand' | 'quality' | 'contact' | 'lowConfidence' | 'noResearch';
  value?: number | string;
}

const CONF: Record<Confidence, number> = { high: 1, medium: 0.6, low: 0.25 };

/**
 * Who to work on first. A transparent sum, with the reasons that produced it:
 * filling a gap beats adding the tenth caterer, a business that completes the
 * active network beats one that does not, and well-sourced information beats
 * a guess.
 */
export function priority(
  p: ProspectSummary,
  rows: ProspectSummary[],
  /** Open concierge wishes (§9.2): customers already asking for what this business does, where it works. */
  demand?: DemandSummary | null
): { score: number; reasons: PriorityReason[] } {
  const reasons: PriorityReason[] = [];
  let score = 0;
  const cat = p.category?.trim().toLowerCase();
  if (cat) {
    const active = rows.filter((r) => r.stage === 'activeProvider' && r.category?.trim().toLowerCase() === cat).length;
    if (active <= 1) {
      score += 30;
      reasons.push({ key: 'gap', value: active });
    }
    const wanted = rows.filter(
      (r) => (r.stage === 'activeProvider' || r.stage === 'joined') && r.complementary.some((c) => c.trim().toLowerCase() === cat)
    ).length;
    if (wanted) {
      score += Math.min(30, wanted * 10);
      reasons.push({ key: 'complements', value: wanted });
    }
  }
  const asked = demandFor(p, demand);
  if (asked.open) {
    // An unanswered wish weighs double: nobody in the network could answer it.
    score += Math.min(25, (asked.open + asked.unanswered) * 5);
    reasons.push({ key: 'demand', value: asked.open });
  }
  if (p.researchConfidence) {
    const ratio = p.totalClaims ? p.verifiedClaims / p.totalClaims : 0;
    score += Math.round(25 * (0.5 * CONF[p.researchConfidence] + 0.5 * ratio));
    reasons.push({ key: p.researchConfidence === 'low' ? 'lowConfidence' : 'quality', value: Math.round(ratio * 100) });
  } else {
    reasons.push({ key: 'noResearch' });
  }
  if (p.hasEmail || p.hasPhone) {
    score += 15;
    reasons.push({ key: 'contact' });
  }
  return { score: Math.min(100, score), reasons };
}

/** Pipeline views the sidebar and the next-action links name. */
export const VIEWS = ['all', 'research', 'profiles', 'outreach', 'followups', 'interested', 'joined', 'closed'] as const;
export type View = (typeof VIEWS)[number];

export function inView(p: ProspectSummary, view: View, now: number): boolean {
  switch (view) {
    case 'research':
      return !isClosed(p.stage) && (!p.researchStatus || p.stage === 'researching' || p.researchStatus === 'failed');
    case 'profiles':
      return !isClosed(p.stage) && !!p.researchStatus && !p.profileApproved;
    case 'outreach':
      return !isClosed(p.stage) && p.profileApproved && !reached(p.furthest, 'invitationSent');
    case 'followups':
      return isFollowUpDue(p, now);
    case 'interested':
      return p.stage === 'interested' || p.stage === 'onboardingStarted';
    case 'joined':
      return p.stage === 'joined' || p.stage === 'activeProvider';
    case 'closed':
      return isClosed(p.stage);
    default:
      return true;
  }
}
