/**
 * Ratchet: a notification states its `intent`, it does not pick channels
 * (`./intent.ts`, docs/tbd/PLAN_REALTIME_MIGRATION.md §6).
 *
 * LEGACY_CHANNEL_LISTS is every file that still writes a `channels: [...]`
 * literal. It only shrinks: a new file with a literal fails, and a listed file
 * that no longer has one fails too — take it off the list in the same change
 * (and mark the action in docs/tbd/REALTIME_TRACKING.md).
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SCAN = ['src/lib/server', 'src/routes/api'];
const SKIP = /\.test\.|\/examples\/|^src\/lib\/server\/notifications\//;

/** `channels: [` or `channels: cond ? [` — not `channels: decision.channels` (the digest's own field). */
const LITERAL = /\bchannels\s*:\s*(\[|[^,\n]*\?\s*\[)/;

const LEGACY_CHANNEL_LISTS = new Set([
  'src/lib/server/actions/configs/acceptCounterOnAsk.ts',
  'src/lib/server/actions/configs/acceptCounterOnAskm.ts',
  'src/lib/server/actions/configs/acceptRatsonProposal.ts',
  'src/lib/server/actions/configs/acceptWishOffer.ts',
  'src/lib/server/actions/configs/addDiunEntry.ts',
  'src/lib/server/actions/configs/addHalukaChatEntry.ts',
  'src/lib/server/actions/configs/addVote.ts',
  'src/lib/server/actions/configs/applyToMission.ts',
  'src/lib/server/actions/configs/approveHaluka.ts',
  'src/lib/server/actions/configs/approveMatanot.ts',
  'src/lib/server/actions/configs/approveMeeting.ts',
  'src/lib/server/actions/configs/approveSheirutpend.ts',
  'src/lib/server/actions/configs/archiveUserResource.ts',
  'src/lib/server/actions/configs/candidateCounterOnAsk.ts',
  'src/lib/server/actions/configs/candidateCounterOnAskm.ts',
  'src/lib/server/actions/configs/chat.ts',
  'src/lib/server/actions/configs/closeFiniapruval.ts',
  'src/lib/server/actions/configs/completeMission.ts',
  'src/lib/server/actions/configs/confirmDealPartReceived.ts',
  'src/lib/server/actions/configs/confirmHaluka.ts',
  'src/lib/server/actions/configs/confirmStipendPayment.ts',
  'src/lib/server/actions/configs/counterDealEdit.ts',
  'src/lib/server/actions/configs/counterFiniapruval.ts',
  'src/lib/server/actions/configs/counterObjectChange.ts',
  'src/lib/server/actions/configs/counterOnAsk.ts',
  'src/lib/server/actions/configs/counterOnAskm.ts',
  'src/lib/server/actions/configs/counterRatsonProposal.ts',
  'src/lib/server/actions/configs/counterSaleClaim.ts',
  'src/lib/server/actions/configs/counterStipendTerms.ts',
  'src/lib/server/actions/configs/createComplexMatanot.ts',
  'src/lib/server/actions/configs/createDonationSale.ts',
  'src/lib/server/actions/configs/createMashaabimRequest.ts',
  'src/lib/server/actions/configs/createMission.ts',
  'src/lib/server/actions/configs/createNewMeeting.ts',
  'src/lib/server/actions/configs/createResource.ts',
  'src/lib/server/actions/configs/createSale.ts',
  'src/lib/server/actions/configs/createSheirutFromPending.ts',
  'src/lib/server/actions/configs/createSheirutpend.ts',
  'src/lib/server/actions/configs/createTask.ts',
  'src/lib/server/actions/configs/createTosplit.ts',
  'src/lib/server/actions/configs/customerReportRecurringSaleCycle.ts',
  'src/lib/server/actions/configs/customizeOpenMashaabim.ts',
  'src/lib/server/actions/configs/customizeOpenMission.ts',
  'src/lib/server/actions/configs/declineWishOffer.ts',
  'src/lib/server/actions/configs/directOffer.ts',
  'src/lib/server/actions/configs/dismissSelfNomination.ts',
  'src/lib/server/actions/configs/example.ts',
  'src/lib/server/actions/configs/finalizeAskAcceptance.ts',
  'src/lib/server/actions/configs/finalizeAskmAcceptance.ts',
  'src/lib/server/actions/configs/finalizeJoinAcceptance.ts',
  'src/lib/server/actions/configs/githubActions.ts',
  'src/lib/server/actions/configs/joinMeeting.ts',
  'src/lib/server/actions/configs/linkActToMission.ts',
  'src/lib/server/actions/configs/maagad.ts',
  'src/lib/server/actions/configs/markResourceDone.ts',
  'src/lib/server/actions/configs/markStipendTransferSent.ts',
  'src/lib/server/actions/configs/materializeWish.ts',
  'src/lib/server/actions/configs/nominateSelfMission.ts',
  'src/lib/server/actions/configs/nominateSelfResource.ts',
  'src/lib/server/actions/configs/offerNewProductsToWishes.ts',
  'src/lib/server/actions/configs/offerWishHelp.ts',
  'src/lib/server/actions/configs/proposeObjectArchive.ts',
  'src/lib/server/actions/configs/proposeObjectEdit.ts',
  'src/lib/server/actions/configs/proposeOnOpenMashaabim.ts',
  'src/lib/server/actions/configs/proposeOnOpenMission.ts',
  'src/lib/server/actions/configs/proposeRikmaIdentity.ts',
  'src/lib/server/actions/configs/proposeSheirut.ts',
  'src/lib/server/actions/configs/proposeStipendPledge.ts',
  'src/lib/server/actions/configs/proposeStipendProgram.ts',
  'src/lib/server/actions/configs/publishUserResourceAsProduct.ts',
  'src/lib/server/actions/configs/rejectSheirutpend.ts',
  'src/lib/server/actions/configs/reportRecurringSaleCycle.ts',
  'src/lib/server/actions/configs/requestDonation.ts',
  'src/lib/server/actions/configs/requestSheirutJoin.ts',
  'src/lib/server/actions/configs/requestSuggestion.ts',
  'src/lib/server/actions/configs/requestWishMission.ts',
  'src/lib/server/actions/configs/requestWishResource.ts',
  'src/lib/server/actions/configs/sendAskMessage.ts',
  'src/lib/server/actions/configs/sendMeetingMessage.ts',
  'src/lib/server/actions/configs/settleStipendCycle.ts',
  'src/lib/server/actions/configs/sheirutQuote.ts',
  'src/lib/server/actions/configs/shiftCardActions.ts',
  'src/lib/server/actions/configs/shiftSwapActions.ts',
  'src/lib/server/actions/configs/signDealEdit.ts',
  'src/lib/server/actions/configs/signDealOffer.ts',
  'src/lib/server/actions/configs/startMeeting.ts',
  'src/lib/server/actions/configs/submitNegoMaap.ts',
  'src/lib/server/actions/configs/submitNegoMash.ts',
  'src/lib/server/actions/configs/submitNegoMission.ts',
  'src/lib/server/actions/configs/timerLogUpdate.ts',
  'src/lib/server/actions/configs/timerSave.ts',
  'src/lib/server/actions/configs/timerStart.ts',
  'src/lib/server/actions/configs/timerStop.ts',
  'src/lib/server/actions/configs/toggleOnline.ts',
  'src/lib/server/actions/configs/updateMissionStatus.ts',
  'src/lib/server/actions/configs/updateMissionTimerState.ts',
  'src/lib/server/actions/configs/updateProjectDetails.ts',
  'src/lib/server/actions/configs/updateTask.ts',
  'src/lib/server/actions/configs/updateUserBasic.ts',
  'src/lib/server/actions/configs/updateUserProfilePic.ts',
  'src/lib/server/actions/configs/voteOnAskm.ts',
  'src/lib/server/actions/configs/voteOnDecision.ts',
  'src/lib/server/actions/configs/voteOnMaap.ts',
  'src/lib/server/actions/configs/voteOnPendm.ts',
  'src/lib/server/actions/configs/voteOnPmash.ts',
  'src/lib/server/deal/offerDeal.ts',
  'src/lib/server/sheirut/dealEdit.ts',
  'src/lib/server/wish/volunteerProposal.ts',
  'src/routes/api/guest/message/+server.js',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|js)$/.test(name)) out.push(relative(ROOT, p).split(sep).join('/'));
  }
  return out;
}

const withLiteral = SCAN.flatMap((d) => walk(join(ROOT, d)))
  .filter((f) => !SKIP.test(f))
  .filter((f) => LITERAL.test(readFileSync(join(ROOT, f), 'utf8')));

describe('notification channels come from intent', () => {
  it('no new file picks channels by hand', () => {
    const fresh = withLiteral.filter((f) => !LEGACY_CHANNEL_LISTS.has(f));
    expect(fresh, 'use notification.intent instead of channels: [...]').toEqual([]);
  });

  it('a file that moved to intent is off the legacy list', () => {
    const found = new Set(withLiteral);
    const done = [...LEGACY_CHANNEL_LISTS].filter((f) => !found.has(f));
    expect(done, 'remove these from LEGACY_CHANNEL_LISTS').toEqual([]);
  });
});
