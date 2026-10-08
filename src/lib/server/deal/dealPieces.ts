/**
 * What a deal page shows beside the deal itself, read once in one place: what it
 * still owes (C-14), the open requests for more hours (C-14), the parts still open
 * in its rikma (C-19) and who confirmed receiving their part (C-19).
 *
 * The deal page and the deals bell (docs/inprogress/PLAN_SMART_NOTICES.md) both read
 * these, and they must read them the same way — a notice that says "waiting for
 * your signature" about an edit the page does not list would be a lie in one of
 * the two. Every piece is best-effort, as it always was on the page: a piece
 * that cannot be read is empty, never a broken page.
 */

import { loadDealDue, type LoadedDealDue, type QidRunner } from '$lib/server/sheirut/dealDue';
import { readDealEdits, type DealEditView } from '$lib/sheirut/dealEdit';
import { readDealOffers } from '$lib/server/deal/dealOffers';
import type { DealOffersView } from '$lib/sheirut/dealOffers';
import { loadParts } from '$lib/server/deal/partsReceived';
import type { PartsView } from '$lib/sheirut/partsReceived';

export interface DealPieces {
  due: LoadedDealDue | null;
  edits: DealEditView[];
  /** null when no part of the deal is open. */
  offers: DealOffersView | null;
  parts: PartsView | null;
  /** The deal's mission ids — the page reads progress updates by them. */
  missionIds: string[];
}

export const NO_PIECES: DealPieces = { due: null, edits: [], offers: null, parts: null, missionIds: [] };

export async function readDealPieces(run: QidRunner, sheirutId: string, viewerId: string, tag = 'deal'): Promise<DealPieces> {
  const warn = (what: string) => (e: unknown) => {
    console.warn(`[${tag}] could not read ${what}:`, e);
    return null;
  };

  const [due, offers, parts] = await Promise.all([
    loadDealDue(run, sheirutId).catch(warn('what the deal owes')),
    run('417dealOpenOffers', { id: sheirutId })
      .then((res) => {
        const view = readDealOffers(res, String(viewerId));
        return view.offers.length > 0 ? view : null;
      })
      .catch(warn('the open parts of the deal')),
    loadParts(run, sheirutId)
      .then((p): PartsView | null =>
        p
          ? { parts: p.parts, confirmed: p.confirmed, pending: p.pending, allConfirmed: p.allConfirmed, customerPaid: p.iTransferMoney }
          : null
      )
      .catch(warn("the providers' confirmations"))
  ]);

  const missionIds = (due?.lines ?? [])
    .filter((l: any) => l.kind === 'mission' && l.missionId)
    .map((l: any) => String(l.missionId));

  let edits: DealEditView[] = [];
  if (due && missionIds.length > 0) {
    try {
      const res = await run('400dealEdits', { missions: missionIds });
      edits = readDealEdits(res, due.lines as any, due.customerIds, String(viewerId));
    } catch (e) {
      warn('the requests for more hours')(e);
    }
  }

  return { due: due ?? null, edits, offers: offers ?? null, parts: parts ?? null, missionIds };
}
