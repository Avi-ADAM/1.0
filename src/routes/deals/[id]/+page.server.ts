import { redirect, error } from '@sveltejs/kit';
import { fetchSingleDeal } from '$lib/server/deals/dealsQueries';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { NO_PIECES, readDealPieces } from '$lib/server/deal/dealPieces';
import { readDealStages } from '$lib/server/deal/dealChain';
import type { DealStageView } from '$lib/sheirut/dealChain';
import { readProgressUpdates, type DealProgressUpdate } from '$lib/sheirut/dealProgress';
import type { PageServerLoad } from './$types';
import { rtKey } from '$lib/realtime/scopes';
import { offsiteSideOf, type OffsiteSide } from '$lib/sheirut/offsiteDeal';
import { strapiClient } from '$lib/server/actions';

export const load: PageServerLoad = async ({ params, locals, fetch, depends }) => {
  // Runs again when an action says this deal changed (PLAN_REALTIME_MIGRATION §3.4).
  depends(rtKey(`deal:${params.id}`));
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;
  const un = (locals as any).un as string | undefined;

  if (!tok || !uid) {
    throw redirect(302, '/login?from=deals/' + params.id);
  }

  try {
    const result = await fetchSingleDeal(fetch, String(uid), params.id, un);
    const run = (qid: string, vars: Record<string, unknown>) => sendViaProxy(fetch as any, qid, vars);

    // Only for someone the deal already showed itself to, each piece best-effort:
    // what the deal owes and the open requests for more hours (C-14), the parts still
    // open in its rikma and who confirmed receiving their part (C-19). The same reads
    // feed the deals bell's notices ($lib/server/deal/dealPieces).
    // And the deal's stages — the wish it was shaped in, the request that was
    // approved (PLAN_DIRECT_OFFER P1) — read on the service token for a party only.
    const [{ due, edits, recipeEdits, offers, parts, missionIds, receipt }, stages] = result.sale
      ? await Promise.all([
          readDealPieces(run, params.id, String(uid), 'deals/[id]/+page.server'),
          readDealStages(
            (qid, vars) => sendViaProxy(fetch as any, qid, vars, { isSer: true }),
            { kind: 'deal', id: params.id },
            'deals/[id]/+page.server'
          )
        ])
      : [NO_PIECES, [] as DealStageView[]];

    // A deal whose customer is not on the site (PLAN_OFFSITE_CLIENT P1): who it is for
    // and the work on its product's BOM. Only a member sees such a deal — there is no
    // customer to — and only a deal with no customer account reads it (offsiteSideOf).
    let offsite: OffsiteSide | null = null;
    if (result.sale && result.kind === 'sale' && !due) {
      try {
        // The admin client, as every lead read: a lead carries a phone and an email, and
        // the service token behind /api/send has no access to leads (Forbidden).
        const admin = (qid: string) => strapiClient.execute(qid, { sid: params.id }, undefined, fetch as any);
        const [side, own] = await Promise.all([
          admin('offsiteDealSide'),
          // Needs the API token's grant on sheirut-fulfillment; without it, the BOM lines only.
          admin('offsiteDealOwnMissions').catch((e) => {
            console.warn('[deals/[id]/+page.server] own missions of the deal are not readable:', (e as any)?.message ?? e);
            return null;
          })
        ]);
        offsite = offsiteSideOf(side, own);
      } catch (e) {
        console.warn('[deals/[id]/+page.server] could not read the off-site side:', e);
      }
    }
    const workIds = offsite ? offsite.missions.map((m) => m.id) : missionIds;

    // C-21, best-effort like `due`: what the providers wrote about the work when they
    // saved their timers. Read with the service token — the viewer is a party to this
    // deal (fetchSingleDeal answered), and a customer's own token cannot read timers.
    let updates: DealProgressUpdate[] = [];
    if (result.sale && workIds.length > 0) {
      try {
        const res = await sendViaProxy(fetch as any, '420dealProgressUpdates', { missions: workIds }, { isSer: true });
        // sendViaProxy already unwraps `data` — the reader expects it wrapped. Without
        // this the providers' notes never reached the page.
        updates = readProgressUpdates({ data: res });
      } catch (e) {
        console.warn('[deals/[id]/+page.server] could not read the progress updates:', e);
      }
    }

    return {
      sale: result.sale,
      kind: result.kind,
      due,
      updates,
      edits,
      recipeEdits,
      offers,
      parts,
      receipt,
      stages,
      offsite,
      viewerId: String(uid),
      viewerName: un ?? ''
    };
  } catch (e: any) {
    console.error('[deals/[id]/+page.server] Failed to load deal:', e);
    throw error(500, e?.message || 'Failed to load deal');
  }
};
