import { redirect, error } from '@sveltejs/kit';
import { fetchSingleDeal } from '$lib/server/deals/dealsQueries';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { NO_PIECES, readDealPieces } from '$lib/server/deal/dealPieces';
import { readDealStages } from '$lib/server/deal/dealChain';
import type { DealStageView } from '$lib/sheirut/dealChain';
import { readProgressUpdates, type DealProgressUpdate } from '$lib/sheirut/dealProgress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
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
    const [{ due, edits, offers, parts, missionIds }, stages] = result.sale
      ? await Promise.all([
          readDealPieces(run, params.id, String(uid), 'deals/[id]/+page.server'),
          readDealStages(
            (qid, vars) => sendViaProxy(fetch as any, qid, vars, { isSer: true }),
            { kind: 'deal', id: params.id },
            'deals/[id]/+page.server'
          )
        ])
      : [NO_PIECES, [] as DealStageView[]];

    // C-21, best-effort like `due`: what the providers wrote about the work when they
    // saved their timers. Read with the service token — the viewer is a party to this
    // deal (fetchSingleDeal answered), and a customer's own token cannot read timers.
    let updates: DealProgressUpdate[] = [];
    if (result.sale && missionIds.length > 0) {
      try {
        const res = await sendViaProxy(fetch as any, '420dealProgressUpdates', { missions: missionIds }, { isSer: true });
        updates = readProgressUpdates(res);
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
      offers,
      parts,
      stages,
      viewerId: String(uid),
      viewerName: un ?? ''
    };
  } catch (e: any) {
    console.error('[deals/[id]/+page.server] Failed to load deal:', e);
    throw error(500, e?.message || 'Failed to load deal');
  }
};
