/**
 * Action Configuration Index
 * 
 * This file imports and registers all action configurations.
 * Actions are registered at module load time.
 */

import { registerAction } from '../registry.js';
import { updateTaskAction } from './updateTask.js';
import { approveHalukaConfig } from './approveHaluka.js';
import { createHalukaConfig } from './createHaluka.js';
import { createTosplitConfig } from './createTosplit.js';
import { createSheirutpendConfig } from './createSheirutpend.js';
import { createNewMeetingConfig } from './createNewMeeting.js';
import { approveMeetingConfig } from './approveMeeting.js';
import { toggleOnlineConfig } from './toggleOnline.js';
import { startMeetingConfig } from './startMeeting.js';
import { joinMeetingConfig } from './joinMeeting.js';
import { sendMeetingMessageConfig } from './sendMeetingMessage.js';
import { sendAskMessageConfig } from './sendAskMessage.js';
import { timerStartConfig } from './timerStart.js';
import { timerStopConfig } from './timerStop.js';
import { timerSaveConfig } from './timerSave.js';
import { timerLogUpdateConfig } from './timerLogUpdate.js';
import { approveSheirutpendConfig } from './approveSheirutpend.js';
import { rejectSheirutpendConfig } from './rejectSheirutpend.js';
import { addVoteConfig } from './addVote.js';
import { ensureSheirutForumConfig } from './ensureSheirutForum.js';
import { ensureSheirutpendForumConfig } from './ensureSheirutpendForum.js';
import { ensureRatsonProposalForumConfig } from './ensureRatsonProposalForum.js';
import { ensureVoteForumConfig } from './ensureVoteForum.js';
import { createProcessConfig } from './createProcess.js';
import { attachEntityToProcessConfig } from './attachEntityToProcess.js';
import { ensureProcessForumConfig } from './ensureProcessForum.js';
import { ensureStageForumConfig } from './ensureStageForum.js';
import { closeFiniapruvalConfig } from './closeFiniapruval.js';
import { updateProjectDetailsConfig } from './updateProjectDetails.js';
import { completeMissionConfig } from './completeMission.js';
import { chatActions } from './chat.js';
import { maagadActions } from './maagad.js';

import { createTaskAction } from './createTask.js';
import { createResourceAction } from './createResource.js';
import { toggleMoneyReceiverConfig } from './toggleMoneyReceiver.js';
import { createSheirutHalukaConfig } from './createSheirutHaluka.js';
import { confirmSheirutHalukaConfig } from './confirmSheirutHaluka.js';
import { ensureHalukaForumConfig } from './ensureHalukaForum.js';
import { forumReadActions } from './forum.js';
import { createComplexMatanotConfig } from './createComplexMatanot.js';
import { approveMatanotConfig } from './approveMatanot.js';
import { createRatsonConfig } from './createRatson.js';
import { matchRatsonConfig } from './matchRatson.js';
import { acceptRatsonProposalConfig } from './acceptRatsonProposal.js';
import { rejectRatsonProposalConfig } from './rejectRatsonProposal.js';
import { updateRatsonExtractionConfig } from './updateRatsonExtraction.js';
import { requestSuggestionConfig } from './requestSuggestion.js';
import { requestWishMissionConfig } from './requestWishMission.js';
import { requestWishResourceConfig } from './requestWishResource.js';
import { acceptWishOfferConfig } from './acceptWishOffer.js';
import { declineWishOfferConfig } from './declineWishOffer.js';
import { materializeWishConfig } from './materializeWish.js';
import { publishWishNeedToCommunityConfig } from './publishWishNeedToCommunity.js';
import { finalizeAskAcceptanceConfig } from './finalizeAskAcceptance.js';
import { finalizeJoinAcceptanceConfig } from './finalizeJoinAcceptance.js';
import { updateWelcomeCardConfig } from './updateWelcomeCard.js';
import { createMashaabimRequestConfig } from './createMashaabimRequest.js';
import { declineSpForMashaabimConfig } from './declineSpForMashaabim.js';
import { applyToMissionConfig } from './applyToMission.js';
import { nominateSelfMissionConfig } from './nominateSelfMission.js';
import { nominateSelfResourceConfig } from './nominateSelfResource.js';
import { dismissSelfNominationConfig } from './dismissSelfNomination.js';
import { declineOpenMissionConfig } from './declineOpenMission.js';
import { declineMissionRequestConfig } from './declineMissionRequest.js';
import { finalizeAskmAcceptanceConfig } from './finalizeAskmAcceptance.js';
import { declineAskmRequestConfig } from './declineAskmRequest.js';
import { voteOnPendmConfig } from './voteOnPendm.js';
import { voteOnPmashConfig } from './voteOnPmash.js';
import { addDiunEntryConfig } from './addDiunEntry.js';
import { voteOnMaapConfig } from './voteOnMaap.js';
import { updateMissionStatusConfig } from './updateMissionStatus.js';
import { updateMissionTimerStateConfig } from './updateMissionTimerState.js';
import { confirmHalukaConfig } from './confirmHaluka.js';
import { addHalukaChatEntryConfig } from './addHalukaChatEntry.js';
import { voteOnDecisionConfig } from './voteOnDecision.js';
import { getDecisionDetailsConfig } from './getDecisionDetails.js';
import { getMissionForEditConfig } from './getMissionForEdit.js';
import { getPlatformProjectConfig } from './getPlatformProject.js';
import { createPlatformSaleConfig } from './createPlatformSale.js';
import { decideSiteShareConfig } from './decideSiteShare.js';
import { getSiteShareDecisionConfig } from './getSiteShareDecision.js';
import { getSiteShareAggregateConfig } from './getSiteShareAggregate.js';
import { getOpenSiteShareDecisionsConfig } from './getOpenSiteShareDecisions.js';
import { seedSiteShareDecisionsConfig } from './seedSiteShareDecisions.js';
import { createSiteShareTransferConfig } from './createSiteShareTransfer.js';
import { getSiteSharePayablesConfig } from './getSiteSharePayables.js';
import { getSiteShareArchiveConfig } from './getSiteShareArchive.js';
import { getRikmaSplitsArchiveConfig } from './getRikmaSplitsArchive.js';
import { createWorkWayConfig } from './createWorkWay.js';
import { createMissionConfig } from './createMission.js';
import { submitNegoMissionConfig } from './submitNegoMission.js';
import { submitNegoMashConfig } from './submitNegoMash.js';
import { submitNegoMaapConfig } from './submitNegoMaap.js';
import { proposeOnOpenMashaabimConfig } from './proposeOnOpenMashaabim.js';
import { counterOnAskmConfig } from './counterOnAskm.js';
import { proposeOnOpenMissionConfig } from './proposeOnOpenMission.js';
import { counterOnAskConfig } from './counterOnAsk.js';
import { acceptCounterOnAskmConfig } from './acceptCounterOnAskm.js';
import { acceptCounterOnAskConfig } from './acceptCounterOnAsk.js';
import { candidateCounterOnAskmConfig } from './candidateCounterOnAskm.js';
import { candidateCounterOnAskConfig } from './candidateCounterOnAsk.js';
import { customizeOpenMashaabimConfig } from './customizeOpenMashaabim.js';
import { customizeOpenMissionConfig } from './customizeOpenMission.js';
import { updateResourceRequestConfig } from './updateResourceRequest.js';
import { createResourceRequestConfig } from './createResourceRequest.js';
import { createMashaabimConfig } from './createMashaabim.js';
import { updateUserRelationConfig } from './updateUserRelation.js';
import { refreshMySuggestionsConfig } from './refreshMySuggestions.js';
import { loadCatalogConfig } from './loadCatalog.js';
import { toggleGuideStatusConfig } from './toggleGuideStatus.js';
import { createMissionTemplateConfig } from './createMissionTemplate.js';
import { offerWishHelpConfig } from './offerWishHelp.js';
import { addAskmChatEntryConfig } from './addAskmChatEntry.js';
import { addAskChatEntryConfig } from './addAskChatEntry.js';
import { createSaleConfig } from './createSale.js';
import { reportRecurringSaleCycleConfig } from './reportRecurringSaleCycle.js';
import { customerReportRecurringSaleCycleConfig } from './customerReportRecurringSaleCycle.js';
import { counterSaleClaimConfig } from './counterSaleClaim.js';
import { setSupportPageConfig } from './setSupportPage.js';
import { createDonationSaleConfig } from './createDonationSale.js';
import { requestDonationConfig } from './requestDonation.js';
import { updateUserProfilePicConfig } from './updateUserProfilePic.js';
import { updateUserBasicConfig } from './updateUserBasic.js';
import { archiveUserResourceConfig } from './archiveUserResource.js';
import { createWeaveConfig } from './createWeave.js';
import { markResourceDoneConfig } from './markResourceDone.js';
import { ensurePersonalRikmaConfig } from './ensurePersonalRikma.js';
import { publishUserResourceAsProductConfig } from './publishUserResourceAsProduct.js';
import { createMissionOfferConfig } from './createMissionOffer.js';
import { updateMissionOfferConfig } from './updateMissionOffer.js';
import { createPersonalMatanotConfig } from './createPersonalMatanot.js';
import { archivePersonalMatanotConfig } from './archivePersonalMatanot.js';


/**
 * Register all actions
 * 
 * This function is called automatically when the module is imported.
 * It registers all action configurations with the action registry.
 */
export function registerAllActions(): void {
  // Register all actions
  registerAction(createTaskAction);
  registerAction(createResourceAction);

  registerAction(updateTaskAction);
  registerAction(approveHalukaConfig);
  registerAction(createHalukaConfig);
  registerAction(createTosplitConfig);
  registerAction(createSheirutpendConfig);
  registerAction(createNewMeetingConfig);
  registerAction(approveMeetingConfig);
  registerAction(toggleOnlineConfig);
  registerAction(startMeetingConfig);
  registerAction(joinMeetingConfig);
  registerAction(sendMeetingMessageConfig);
  registerAction(sendAskMessageConfig);

  // Timer actions
  registerAction(timerStartConfig);
  registerAction(timerStopConfig);
  registerAction(timerSaveConfig);
  registerAction(timerLogUpdateConfig);

  // Sheirutpend actions
  registerAction(approveSheirutpendConfig);
  registerAction(rejectSheirutpendConfig);
  registerAction(addVoteConfig);

  // Sheirut forum helpers
  registerAction(ensureSheirutForumConfig);
  registerAction(ensureSheirutpendForumConfig);
  registerAction(ensureRatsonProposalForumConfig);
  registerAction(ensureVoteForumConfig);
  registerAction(createProcessConfig);
  registerAction(attachEntityToProcessConfig);
  registerAction(ensureProcessForumConfig);
  registerAction(ensureStageForumConfig);
  registerAction(completeMissionConfig);

  // Finiapruval voting and closing
  registerAction(closeFiniapruvalConfig);
  registerAction(updateProjectDetailsConfig);

  // Chat actions
  chatActions.forEach(registerAction);
  maagadActions.forEach(registerAction);
  forumReadActions.forEach(registerAction);

  // Sheirut money receiver
  registerAction(toggleMoneyReceiverConfig);

  // Sheirut haluka (money transfer tracking)
  registerAction(createSheirutHalukaConfig);
  registerAction(confirmSheirutHalukaConfig);
  registerAction(ensureHalukaForumConfig);

  // Complex matanot (BOM products)
  registerAction(createComplexMatanotConfig);
  registerAction(approveMatanotConfig);

  // Mission acceptance finalizer (reqtosherut solo/allVoted cases)
  registerAction(finalizeAskAcceptanceConfig);

  // Member join finalizer (reqtojoin — adds user to project.user_1s)
  registerAction(finalizeJoinAcceptanceConfig);

  // Welcome card dismiss
  registerAction(updateWelcomeCardConfig);

  // Mashaabim (resource) request
  registerAction(createMashaabimRequestConfig);
  registerAction(declineSpForMashaabimConfig);

  // Open mission: apply / decline
  registerAction(applyToMissionConfig);
  registerAction(declineOpenMissionConfig);

  // Self-nomination (PLAN_SELF_NOMINATION): join a rikma on your own terms
  registerAction(nominateSelfMissionConfig);
  registerAction(nominateSelfResourceConfig);
  registerAction(dismissSelfNominationConfig);

  // Mission request: project-member decline / Askm accept+decline
  registerAction(declineMissionRequestConfig);
  registerAction(finalizeAskmAcceptanceConfig);
  registerAction(declineAskmRequestConfig);

  // Pendm / Pmash vote actions + discussion
  registerAction(voteOnPendmConfig);
  registerAction(voteOnPmashConfig);
  registerAction(addDiunEntryConfig);

  // Maap (resource application) vote
  registerAction(voteOnMaapConfig);

  // Mission in-progress: status slider + legacy timer save/clear
  registerAction(updateMissionStatusConfig);
  registerAction(updateMissionTimerStateConfig);

  // Haluka (money transfer) confirmation + chat
  registerAction(confirmHalukaConfig);
  registerAction(addHalukaChatEntryConfig);

  // Askm chat entry
  registerAction(addAskmChatEntryConfig);

  // Ask chat entry (reqtosherut.svelte)
  registerAction(addAskChatEntryConfig);

  // Decision (project-level vote: logo change, etc.)
  registerAction(voteOnDecisionConfig);

  // Concierge / Ratson (wish flow — PLAN_CONCIERGE)
  registerAction(createRatsonConfig);
  registerAction(matchRatsonConfig);
  registerAction(acceptRatsonProposalConfig);
  registerAction(rejectRatsonProposalConfig);
  registerAction(updateRatsonExtractionConfig);
  registerAction(requestSuggestionConfig);
  registerAction(requestWishMissionConfig);
  registerAction(requestWishResourceConfig);
  registerAction(acceptWishOfferConfig);
  registerAction(declineWishOfferConfig);
  registerAction(materializeWishConfig);
  registerAction(publishWishNeedToCommunityConfig);
  registerAction(offerWishHelpConfig);

  // Decision card display (read action — current vs. proposed values)
  registerAction(getDecisionDetailsConfig);

  // Site share — resolve the platform project and create income Sale
  registerAction(getPlatformProjectConfig);
  registerAction(createPlatformSaleConfig);
  // Site share (per-member) — record a member's decided/skipped contribution
  registerAction(decideSiteShareConfig);
  // Site share (per-member) — load a member's existing decision (prefill)
  registerAction(getSiteShareDecisionConfig);
  // Site share (per-member) — split-card aggregate (running sum + how many decided)
  registerAction(getSiteShareAggregateConfig);
  // Site share (per-member) — gate 3 reminder: a member's open (pending) decisions
  registerAction(getOpenSiteShareDecisionsConfig);
  // Site share (per-member) — seed pending decisions for a new tosplit's members
  registerAction(seedSiteShareDecisionsConfig);
  // Site share (per-member) — M4 receiving side: create the member→volunteer transfer
  registerAction(createSiteShareTransferConfig);
  // Site share (per-member) — M4: a member's committed-but-unpaid contributions
  registerAction(getSiteSharePayablesConfig);
  // Site share (per-member) — M5: standing archive for the split screen (both sides)
  registerAction(getSiteShareArchiveConfig);
  // M5: comprehensive distribution archive — all tosplits + per-member all-time totals
  registerAction(getRikmaSplitsArchiveConfig);

  // Mission creation (all 4 branches) + supporting read/create actions
  registerAction(getMissionForEditConfig);
  registerAction(createWorkWayConfig);
  registerAction(createMissionConfig);

  // Negotiation submission (pendm / openMission nego flow)
  registerAction(submitNegoMissionConfig);

  // Negotiation submission (pmash / resource nego flow)
  registerAction(submitNegoMashConfig);
  registerAction(submitNegoMaapConfig);
  registerAction(proposeOnOpenMashaabimConfig);
  registerAction(counterOnAskmConfig);
  registerAction(proposeOnOpenMissionConfig);
  registerAction(counterOnAskConfig);
  registerAction(acceptCounterOnAskmConfig);
  registerAction(acceptCounterOnAskConfig);
  registerAction(candidateCounterOnAskmConfig);
  registerAction(candidateCounterOnAskConfig);
  registerAction(customizeOpenMashaabimConfig);
  registerAction(customizeOpenMissionConfig);

  // User profile: create / update personal resource (Sp)
  registerAction(createResourceRequestConfig);
  registerAction(updateResourceRequestConfig);

  // Mashaabim template creation (addNewNeed form)
  registerAction(createMashaabimConfig);

  // User profile relation update + catalog loader (edit.svelte)
  registerAction(updateUserRelationConfig);
  registerAction(loadCatalogConfig);

  // Match-suggestion backfill/refresh for the current user (lev page)
  registerAction(refreshMySuggestionsConfig);

  // Onboarding guide visibility toggle (editBasic.svelte)
  registerAction(toggleGuideStatusConfig);

  // Standalone mission catalog entry (addNewMission.svelte)
  registerAction(createMissionTemplateConfig);

  // Sale reporting (SaleComponent — shared by gift/[id] and sales-center)
  registerAction(createSaleConfig);
  // Recurring sales (PLAN_RECURRING_SALES): monthly cycle reporting
  registerAction(reportRecurringSaleCycleConfig);
  registerAction(customerReportRecurringSaleCycleConfig);
  // Bilateral holder-consent negotiation on a saleClaim Decision
  registerAction(counterSaleClaimConfig);

  // Volunteer-rikma (PLAN_VOLUNTEER_RIKMA): support-page gate + donations
  registerAction(setSupportPageConfig);
  registerAction(createDonationSaleConfig);
  registerAction(requestDonationConfig);

  // User profile (me page): picture, basic info, resource archive
  registerAction(updateUserProfilePicConfig);
  registerAction(updateUserBasicConfig);
  registerAction(archiveUserResourceConfig);

  // Weave creation (baci.svelte — "יצירת ריקמה", reusable project creation)
  registerAction(createWeaveConfig);

  // User offerings (PLAN_USER_OFFERINGS): home rikma + publish Sp as product
  registerAction(ensurePersonalRikmaConfig);
  registerAction(publishUserResourceAsProductConfig);

  // User offerings M2: priced mission offers ("missions I do")
  registerAction(createMissionOfferConfig);
  registerAction(updateMissionOfferConfig);

  // User offerings M3: personal products (matanot origin=personal)
  registerAction(createPersonalMatanotConfig);
  registerAction(archivePersonalMatanotConfig);

  // Recurring monthly resources: close a mashabetahalich engine (mark done)
  registerAction(markResourceDoneConfig);

  // Future actions will be registered here
  // registerAction(createTaskAction);
  // etc.
}

// Auto-register actions when module is imported
registerAllActions();

// Export individual actions for testing
export {
  updateTaskAction,
  approveHalukaConfig,
  createHalukaConfig,
  createTosplitConfig,
  approveMeetingConfig,
  toggleOnlineConfig,
  startMeetingConfig,
  joinMeetingConfig,
  sendMeetingMessageConfig,
  sendAskMessageConfig,
  timerStartConfig,
  timerStopConfig,
  timerSaveConfig,
  timerLogUpdateConfig,
  approveSheirutpendConfig,
  rejectSheirutpendConfig,
  addVoteConfig,
  ensureSheirutForumConfig,
  ensureSheirutpendForumConfig,
  ensureRatsonProposalForumConfig,
  closeFiniapruvalConfig,
  updateProjectDetailsConfig,
  createProcessConfig,
  attachEntityToProcessConfig,
  ensureProcessForumConfig,
  ensureStageForumConfig,
  completeMissionConfig,
  chatActions,
  maagadActions,
  forumReadActions,
  createComplexMatanotConfig,
  approveMatanotConfig,
  createRatsonConfig,
  matchRatsonConfig,
  acceptRatsonProposalConfig,
  rejectRatsonProposalConfig,
  finalizeJoinAcceptanceConfig,
  confirmHalukaConfig,
  addHalukaChatEntryConfig,
  voteOnDecisionConfig,
  getDecisionDetailsConfig
};
