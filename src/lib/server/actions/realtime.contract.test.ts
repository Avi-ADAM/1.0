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
  'loadCatalog',
  'previewArchiveMembership',
]);

const LEGACY_NO_REALTIME = new Set([
  'addAskChatEntry',
  'addAskmChatEntry',
  'addDiunEntry',
  'addHalukaChatEntry',
  'applyAssistantSession',
  'approveMatanot',
  'approveMeeting',
  'archiveSpaceDoc',
  'attachEntityToProcess',
  'blockResourceDates',
  'cacheTranslations',
  'cancelResourceBooking',
  'claimAssistantSession',
  'claimGithubWork',
  'claimShiftHole',
  'clusterRatsons',
  'confirmMaagadQuorum',
  'confirmResourceBooking',
  'confirmStipendPayment',
  'counterStipendTerms',
  'createChatMessage',
  'createComplexMatanot',
  'createMaagadOffer',
  'createMashaabim',
  'createMashaabimRequest',
  'createNewMeeting',
  'createPersonalMatanot',
  'createPlanBoard',
  'createPlanBoardFromItems',
  'createPlanBoardFromText',
  'createPlanItem',
  'createProcess',
  'createResource',
  'createResourceBooking',
  'createResourceRequest',
  'createSpaceDoc',
  'createWeave',
  'createWorkWay',
  'customizeOpenMashaabim',
  'decideShiftSwap',
  'declareShiftAvailability',
  'disconnectProjectRepo',
  'dismissExternalOffer',
  'dismissNotice',
  'expandPlanBoard',
  'expireMaagadOffers',
  'githubIssueClosed',
  'githubWorkClaimable',
  'importPlanBoardRows',
  'joinMaagad',
  'joinMeeting',
  'leaveMaagad',
  'linkGithubAccount',
  'linkShiftTimer',
  'logShiftHours',
  'markPlanItemCreated',
  'markResourceDone',
  'markStipendTransferSent',
  'materializeRikmaBlueprint',
  'openMaagad',
  'proposeRikmaBlueprint',
  'proposeShiftSwap',
  'proposeStipendPledge',
  'proposeStipendProgram',
  'publishStipendFundingRequest',
  'publishUserResourceAsProduct',
  'refreshMySuggestions',
  'releaseResourceBooking',
  'releaseShiftAssignment',
  'reopenForShiftHole',
  'requestSuggestion',
  'restoreNotice',
  'reviseAssistantSession',
  'saveNoticePrefs',
  'scanProjectDirections',
  'seedPlanBoards',
  'sendAskMessage',
  'sendMeetingMessage',
  'setAssistantItems',
  'setGithubInstallationStatus',
  'setMatanotDiscovery',
  'setShiftRules',
  'setSupportPage',
  'settleStipendCycle',
  'shareRikmaPreview',
  'signMaagadOffer',
  'startAssistantSession',
  'startMeeting',
  'syncProjectRepos',
  'toggleGuideStatus',
  'toggleOnline',
  'undoAssistantRevision',
  'unlinkGithubAccount',
  'unsignMaagadOffer',
  'updatePlanBoard',
  'updatePlanItem',
  'updateProjectDetails',
  'updateResourceRequest',
  'updateSpaceDoc',
  'updateUserBasic',
  'updateUserProfilePic',
  'updateUserRelation',
  'updateWelcomeCard',
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
