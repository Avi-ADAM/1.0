/**
 * The customer signs a candidacy on a part of her deal (QA_CONCIERGE_E2E C-19).
 *
 * Her wish was closed with parts nobody had taken; each became an open mission / open
 * resource in the rikma and an unassigned line of her deal (`materializeWish`). Whoever
 * takes one, at whatever terms the candidacy ends on, is added to what she pays, so the
 * candidacy needs her yes on the standing round as well as the rikma's and the
 * candidate's (`computeNegoGate.clientIds`). This is that yes.
 *
 * - Only a customer of the deal the offer fills may sign (`$lib/server/deal/offerDeal`).
 * - The signature is a vote at the standing round (`order = L`), the same row a member's
 *   yes is. A counter opens a new round and asks her again.
 * - Nobody waits on a signature that is already there: when hers was the last one
 *   missing, the candidacy's clock is brought to now and the finalizer matures it on its
 *   next run. Otherwise the ordinary clock runs (silence still matures the members' side —
 *   never hers).
 * - There is no "no" to cast here. She approves, or talks it over in the deal's chat.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { loadCandidacyDeal } from '$lib/server/deal/offerDeal.js';
import { evaluateAskAcceptance } from '$lib/server/nego/askAcceptance.js';
import { computeNegoGate, normId } from '$lib/server/nego/negoGate.js';
import { ensureCandidacyTimegrama } from '$lib/server/nego/timegrama.js';
import { assertStandingRound } from '$lib/server/nego/candidacyVote.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const side = params.side === 'askm' ? 'askm' : params.side === 'ask' ? 'ask' : null;
  const id = params.id != null ? String(params.id) : '';
  if (!side || !id) throw new Error("signDealOffer: side ('ask' | 'askm') and id are required");

  const me = String(context.userId);
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);

  const deal = await loadCandidacyDeal(run, side, id);
  if (!deal) throw new Error('This candidacy is not for a part of a deal');
  if (!deal.clientIds.includes(me)) throw new Error('Only the customer of this deal can sign it');

  const nowISO = new Date().toISOString();
  let approvable = false;
  let memberIds: string[] = [];
  let pending: { members: boolean; candidate: boolean; clients: string[] };

  if (side === 'ask') {
    const res = await run('getAskNegoRounds', { id });
    const attrs = res?.data?.ask?.data?.attributes;
    if (!attrs) throw new Error(`Ask ${id} not found`);
    if (attrs.archived === true) throw new Error('This candidacy was already resolved');
    // The same merge a member's approval uses: her yes replaces any earlier row of hers at
    // this round, and the DB's rows — not a client's array — are what is written back.
    memberIds = (attrs.project?.data?.attributes?.user_1s?.data ?? []).map((m: any) => String(m.id));
    const check = evaluateAskAcceptance({ askAttributes: attrs, callerId: me, clientIds: deal.clientIds });
    assertStandingRound(params.expectRound, check.L);
    const w = await run('120addVoteToAsk', { askId: id, vots: check.vots });
    if (w?.errors?.length) throw new Error(`Could not record the signature: ${JSON.stringify(w.errors).slice(0, 300)}`);
    approvable = check.gate.approvable;
    pending = { members: !check.gate.hasPMyes, candidate: !check.gate.takerYes, clients: check.gate.clientsPending };
  } else {
    const res = await run('getAskmForFinalize', { id });
    const attrs = res?.data?.askm?.data?.attributes;
    if (!attrs) throw new Error(`Askm ${id} not found`);
    if (attrs.archived === true) throw new Error('This candidacy was already resolved');
    memberIds = (attrs.project?.data?.attributes?.user_1s?.data ?? []).map((m: any) => String(m.id));
    const rounds = (attrs.nego_mashes?.data ?? []).map((r: any) => ({
      ordern: r?.attributes?.ordern,
      proposedBy: r?.attributes?.proposedBy
    }));
    const L = rounds.reduce((max: number, r: any) => Math.max(max, Number(r?.ordern ?? 0)), 0);
    assertStandingRound(params.expectRound, L);
    const ide = Number.parseInt(me, 10);
    const vots = [
      ...(attrs.vots ?? [])
        .map((v: any) => ({
          what: v?.what === true,
          order: Number(v?.order ?? 0),
          users_permissions_user: normId(v?.users_permissions_user)
        }))
        .filter((v: any) => v.users_permissions_user !== '' && !(v.users_permissions_user === me && v.order === L)),
      { what: true, order: L, users_permissions_user: me, ide: Number.isNaN(ide) ? null : ide, zman: nowISO }
    ];
    const w = await run('133addVoteToAskm', { id, vots });
    if (w?.errors?.length) throw new Error(`Could not record the signature: ${JSON.stringify(w.errors).slice(0, 300)}`);
    const gate = computeNegoGate({
      rounds,
      vots,
      takerId: normId(attrs.users_permissions_user),
      memberIds,
      clientIds: deal.clientIds
    });
    approvable = gate.approvable;
    pending = { members: !gate.hasPMyes, candidate: !gate.takerYes, clients: gate.clientsPending };
  }

  // The clock: brought to now when nothing is left to wait for, else the usual window.
  const tgId = await ensureCandidacyTimegrama(strapi, context, { side, id });
  if (approvable && tgId) {
    await run('mrResetTimegrama', { id: tgId, date: nowISO }).catch((e: unknown) =>
      console.warn('[signDealOffer] could not bring the clock forward; it matures at the end of its window:', e)
    );
  }

  return {
    data: { side, id, signed: true, approvable, pending, offerId: deal.offerId, projectId: deal.projectId },
    // The rikma hears that the customer signed.
    recipientIds: memberIds.filter((m) => m !== me),
    updateStrategy: { type: 'none' as const }
  };
};

export const signDealOfferConfig: ActionConfig = {
  key: 'signDealOffer',
  description:
    "The customer of a deal signs a candidacy (Ask / Askm) on a part of her deal still open in the rikma: her yes at the standing round, required before it can materialize (QA C-19).",
  graphqlOperation: handler,
  paramSchema: {
    side: { type: 'string', required: true, description: "'ask' (mission) or 'askm' (resource)" },
    id: { type: 'string', required: true, description: 'Ask / Askm id' },
    expectRound: { type: 'number', required: false, description: 'The round a notice showed; ROUND_MOVED when it moved' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to sign' }],
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
    templates: {
      title: {
        he: 'הלקוחה חתמה על חלק בעסקה',
        en: 'The customer signed a part of the deal',
        ar: 'وقّعت الزبونة على جزء من الصفقة'
      },
      body: {
        he: 'הלקוחה אישרה מועמדות לחלק פתוח בעסקה שלה. כשכולם חתמו — המשימה נרשמת והעסקה גדלה בהתאם.',
        en: 'The customer approved a candidacy for an open part of her deal. Once everyone has signed, it is registered and the deal grows accordingly.',
        ar: 'وافقت الزبونة على ترشيح لجزء مفتوح من صفقتها. حين يوقّع الجميع يُسجَّل وتكبر الصفقة وفق ذلك.'
      }
    },
    channels: ['socket'],
    metadata: { type: 'dealOfferSigned', url: 'lev' }
  },
  updateStrategy: { type: 'none' }
};
