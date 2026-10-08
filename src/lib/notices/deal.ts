/**
 * Notices from a deal (`/deals/[id]`): what on it waits for the viewer.
 *
 * Built from the views the deal page already reads — the open offers on its
 * unfilled parts (`readDealOffers`, qid 417), the open edit requests
 * (`readDealEdits`, qid 400), what is still due (`loadDealDue`) and who has
 * confirmed receiving their part (`PartsView`). Each approval is the action
 * the deal page's own button runs.
 *
 * A customer's silence is never her yes (QA C-19, CLAUDE.md "A customer's
 * deal"), so nothing here has `clockRuns` — a deadline on a deal notice is the
 * members' clock, shown for context only.
 */

import { isUrgent } from '$lib/digest/hubSummary.js';
import type { DealOffersView } from '$lib/sheirut/dealOffers.js';
import type { DealEditView } from '$lib/sheirut/dealEdit.js';
import type { PartsView } from '$lib/sheirut/partsReceived.js';
import { figuresStamp, k, terms, term, txt, type Notice } from './types';

export interface DealNoticeInput {
  viewerId: string;
  deal: { sheirutId: string; name: string; createdAt?: string | null };
  offers?: DealOffersView | null;
  edits?: DealEditView[] | null;
  /** `loadDealDue` — only what a notice reads. */
  due?: { remaining: number; customerIds: string[] } | null;
  parts?: PartsView | null;
}

export function dealNotices(input: DealNoticeInput, now: number = Date.now()): Notice[] {
  const { viewerId, deal } = input;
  const me = String(viewerId);
  const where = { kind: 'deal' as const, id: String(deal.sheirutId), name: deal.name };
  const expand = { kind: 'href' as const, href: `/deals/${deal.sheirutId}` };
  const out: Notice[] = [];

  // ── A candidate for an open part of her deal: she co-signs what she pays for ──
  const offers = input.offers;
  if (offers && offers.customerIds.map(String).includes(me)) {
    for (const offer of offers.offers) {
      for (const c of offer.candidacies) {
        if (c.signedByViewer) continue;
        const list = terms(term(offer.kind === 'resource' ? 'qty' : 'hours', c.amount), term('price', c.price));
        out.push({
          key: `deal:offer:${c.side}:${c.id}:v${c.round}`,
          subject: `candidacy:${c.side}:${c.id}`,
          source: 'deal',
          kind: 'dealOffer',
          sentence: k('notices.deal.offer', {
            who: c.candidateName,
            item: txt(offer.name) ?? k('notices.deal.somePart'),
            deal: deal.name
          }),
          detail: null,
          terms: list,
          where,
          deadline: null,
          urgent: false,
          clockRuns: false,
          approve: list.length
            ? { actionKey: 'signDealOffer', params: { side: c.side, id: c.id, expectRound: c.round }, terms: list, round: c.round }
            : null,
          expand,
          at: deal.createdAt ?? null
        });
      }
    }
  }

  // ── A request to change a part of her deal, when it raises what she pays ──
  for (const e of input.edits ?? []) {
    if (e.viewerSigned || !e.needsCustomer || !e.customersPending.map(String).includes(me)) continue;
    const list = terms(term('hours', e.standing.hm), term('rate', e.standing.price), term('raise', e.raise));
    const who = e.standing.proposedByName ?? e.providerName ?? '';
    out.push({
      key: `deal:edit:${e.decisionId}:v${e.standing.order}`,
      subject: `decision:${e.decisionId}`,
      source: 'deal',
      kind: 'dealEdit',
      sentence: k(who ? 'notices.deal.edit' : 'notices.deal.editAnon', {
        who,
        item: txt(e.missionName) ?? k('notices.deal.somePart'),
        deal: deal.name
      }),
      detail: txt(e.standing.why),
      terms: list,
      where,
      deadline: e.deadline,
      urgent: isUrgent(e.deadline, now),
      clockRuns: false,
      approve: list.length
        ? {
            actionKey: 'signDealEdit',
            params: { decisionId: e.decisionId, expectRound: e.standing.order },
            terms: list,
            round: e.standing.order
          }
        : null,
      expand,
      at: e.standing.zman
    });
  }

  // ── What she still owes. Paying happens in the world, not in a tap. ──
  const due = input.due;
  if (due && due.remaining > 0 && due.customerIds.map(String).includes(me)) {
    const list = terms(term('amount', due.remaining));
    out.push({
      key: `deal:due:${deal.sheirutId}:${figuresStamp(list)}`,
      subject: `dealDue:${deal.sheirutId}`,
      source: 'deal',
      kind: 'dealDue',
      sentence: k('notices.deal.due', { deal: deal.name }),
      detail: null,
      terms: list,
      where,
      deadline: null,
      urgent: false,
      clockRuns: false,
      approve: null,
      expand,
      at: deal.createdAt ?? null
    });
  }

  // ── A provider: has the money for your part arrived? Asked once she has paid. ──
  const parts = input.parts;
  if (parts && parts.customerPaid && parts.pending.map(String).includes(me)) {
    const mine = parts.parts.find((p) => String(p.providerId) === me);
    const list = terms(term('amount', mine?.due));
    out.push({
      key: `deal:part:${deal.sheirutId}:${figuresStamp(list)}`,
      subject: `dealPart:${deal.sheirutId}`,
      source: 'deal',
      kind: 'dealPart',
      sentence: k('notices.deal.part', { deal: deal.name }),
      detail: null,
      terms: list,
      where,
      deadline: null,
      urgent: false,
      clockRuns: false,
      // "I received it" is a statement about her own money — the amount must be on screen.
      approve: list.length
        ? {
            actionKey: 'confirmDealPartReceived',
            // No rounds here: the amount itself is what must not have moved (AMOUNT_MOVED).
            params: { sheirutId: String(deal.sheirutId), expectAmount: mine?.due },
            terms: list,
            round: null
          }
        : null,
      expand,
      at: deal.createdAt ?? null
    });
  }

  return out;
}
