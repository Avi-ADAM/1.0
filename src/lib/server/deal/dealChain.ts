/**
 * Read a deal's stages for the page that shows it — docs/inprogress/PLAN_DIRECT_OFFER.md §7.2 (P1).
 *
 * Call it only after the page has checked that the viewer is a party: qids 428–430 run
 * on the service token and answer for anyone. They return ids and states only, and
 * every stage's own page still decides who may open it.
 *
 * Best-effort, like every other piece of a deal page: a chain that cannot be read is
 * the page's own stage alone, never a broken page.
 */

import {
  chainFromRatson,
  chainFromSheirut,
  chainFromSheirutpend,
  chainOf,
  dealStages,
  type DealStageAt,
  type DealStageView
} from '$lib/sheirut/dealChain';
import type { QidRunner } from '$lib/server/sheirut/dealDue';

const READ = {
  wish: ['430dealChainFromRatson', chainFromRatson],
  request: ['429dealChainFromSheirutpend', chainFromSheirutpend],
  deal: ['428dealChainFromSheirut', chainFromSheirut]
} as const;

export async function readDealStages(run: QidRunner, at: DealStageAt, tag = 'deal'): Promise<DealStageView[]> {
  const [qid, parse] = READ[at.kind];
  let chain = null;
  try {
    chain = parse(await run(qid, { id: at.id }));
  } catch (e) {
    console.warn(`[${tag}] could not read the deal's stages:`, e);
  }
  return dealStages(chain ?? chainOf(at), at);
}
