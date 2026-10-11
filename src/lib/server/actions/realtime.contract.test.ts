/**
 * Ratchet: every writing action says what it changed (`ActionConfig.realtime`,
 * docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.5), so every screen that shows it can
 * follow without a reload.
 *
 * LEGACY_NO_REALTIME is every writing action that does not yet. It only
 * shrinks: a new action without `realtime` fails, and a listed action that
 * declares it fails too — take it off the list in the same change (and mark it
 * in docs/inprogress/REALTIME_TRACKING.md). READ_ONLY actions change nothing anyone
 * else sees; adding one there is a claim, so keep it honest.
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
  'getMissionForEdit',
  'getOpenSiteShareDecisions',
  'getPendmShiftPlan',
  'getPlatformProject',
  'getRikmaSplitsArchive',
  'getSheirutpendQuote',
  'getShiftWork',
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

const LEGACY_NO_REALTIME = new Set([
  'addAskChatEntry',
  'addAskmChatEntry',
  'addDiunEntry',
  'addHalukaChatEntry',
  'applyAssistantSession',
  'approveMeeting',
  'archiveSpaceDoc',
  'cacheTranslations',
  'claimAssistantSession',
  'createChatMessage',
  'createNewMeeting',
  'createPlanBoard',
  'createPlanBoardFromItems',
  'createPlanBoardFromText',
  'createPlanItem',
  'createSpaceDoc',
  'dismissExternalOffer',
  'expandPlanBoard',
  'importPlanBoardRows',
  'joinMeeting',
  'markPlanItemCreated',
  'materializeRikmaBlueprint',
  'proposeRikmaBlueprint',
  'reviseAssistantSession',
  'scanProjectDirections',
  'seedPlanBoards',
  'sendAskMessage',
  'sendMeetingMessage',
  'setAssistantItems',
  'shareRikmaPreview',
  'startAssistantSession',
  'startMeeting',
  'toggleOnline',
  'undoAssistantRevision',
  'updatePlanBoard',
  'updatePlanItem',
  'updateSpaceDoc',
]);

const all = [...actionRegistry.values()];

describe('every writing action publishes what it changed', () => {
  it('no new writing action without realtime', () => {
    const fresh = all
      .filter((c) => !c.realtime && !READ_ONLY.has(c.key) && !LEGACY_NO_REALTIME.has(c.key))
      .map((c) => c.key);
    expect(fresh, 'declare realtime.scopes (or, if it changes nothing shared, add it to READ_ONLY)').toEqual([]);
  });

  it('an action that declares realtime is off the legacy list', () => {
    const done = all.filter((c) => c.realtime && LEGACY_NO_REALTIME.has(c.key)).map((c) => c.key);
    expect(done, 'remove these from LEGACY_NO_REALTIME').toEqual([]);
  });

  it('a read-only action declares nothing', () => {
    const odd = all.filter((c) => c.realtime && READ_ONLY.has(c.key)).map((c) => c.key);
    expect(odd, 'an action that publishes changes is not read-only').toEqual([]);
  });

  it('both lists name only registered actions', () => {
    const keys = new Set(all.map((c) => c.key));
    const stale = [...READ_ONLY, ...LEGACY_NO_REALTIME].filter((k) => !keys.has(k));
    expect(stale, 'remove actions that no longer exist').toEqual([]);
  });
});
