/**
 * Ratchet: every writing action says what it changed (`ActionConfig.realtime`,
 * docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.5), so every screen that shows it can
 * follow without a reload.
 *
 * Every writing action declares it. The legacy allowlist emptied with R4
 * (2026-10-11) and is gone, so a new action without `realtime` fails. READ_ONLY
 * actions change nothing anyone else sees; adding one there is a claim, so keep
 * it honest. An action that writes but leaves nothing for an open screen to
 * follow says so: `realtime: { scopes: () => [] }` and a comment why.
 */

import { describe, it, expect } from 'vitest';
import { actionRegistry } from './registry.js';
import './configs/index.js';

const READ_ONLY = new Set([
  'checkRikmaSlug',
  'ensureHalukaForum',
  'ensurePersonalRikma',
  'ensureProcessForum',
  'ensureProjectForum',
  'ensureRatsonProposalForum',
  'ensureSheirutForum',
  'ensureSheirutpendForum',
  'ensureStageForum',
  'ensureVoteForum',
  'fetchExternalOffers',
  'getAssistantSession',
  'getDealDue',
  'getDecisionDetails',
  'getForumThread',
  'getForumTypingTicket',
  'getMissionForEdit',
  'getOpenSiteShareDecisions',
  'getPendmShiftPlan',
  'getPlatformProject',
  'getRikmaSplitsArchive',
  'getSheirutpendQuote',
  'getShiftWork',
  'getFulfillmentWork',
  'getSiteShareAggregate',
  'getSiteShareArchive',
  'getSiteShareDecision',
  'getSiteSharePayables',
  'getStipendOverview',
  'getStipendWork',
  'getUserForums',
  // Write nothing: they exist for the notification they send.
  'githubIssueClosed',
  'githubWorkClaimable',
  'loadCatalog',
  'previewArchiveMembership',
]);

const all = [...actionRegistry.values()];

describe('every writing action publishes what it changed', () => {
  it('no new writing action without realtime', () => {
    const fresh = all
      .filter((c) => !c.realtime && !READ_ONLY.has(c.key))
      .map((c) => c.key);
    expect(fresh, 'declare realtime.scopes (or, if it changes nothing shared, add it to READ_ONLY)').toEqual([]);
  });

  it('a read-only action declares nothing', () => {
    const odd = all.filter((c) => c.realtime && READ_ONLY.has(c.key)).map((c) => c.key);
    expect(odd, 'an action that publishes changes is not read-only').toEqual([]);
  });

  it('READ_ONLY names only registered actions', () => {
    const keys = new Set(all.map((c) => c.key));
    const stale = [...READ_ONLY].filter((k) => !keys.has(k));
    expect(stale, 'remove actions that no longer exist').toEqual([]);
  });
});
