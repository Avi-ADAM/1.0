/**
 * Action: counterDealEdit — the customer puts her own terms on a request for more hours
 * (QA_CONCIERGE_E2E C-14, $lib/sheirut/dealEdit).
 *
 * There is no "no": the answer to hours or a rate she will not pay is the hours and rate
 * she would — fewer hours, another rate, or 0 more ("as agreed"). Her version opens the
 * next round with her signature on it and resets the rikma's clock, because the members
 * have not agreed to it yet; they sign, counter in turn, or let their silence mature it.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchObjectChangeDecision, standingRound } from '$lib/server/archive/read.js';
import { counterObjectChange } from '$lib/server/archive/vote.js';
import { dealSignersFor, type DealSigners } from '$lib/server/sheirut/dealEdit.js';

/** Largest number of hours a counter may name — a typo guard, not a policy. */
const MAX_HOURS = 1000;
/** A bare number is a veto in disguise — a counter says why (as in finiapruval rounds). */
const MIN_NOTE = 8;

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const decisionId = String(params.decisionId ?? '');
  if (!decisionId) throw new Error('decisionId is required');
  const me = String(context.userId);

  const hours = num(params.hours);
  const rate = num(params.rate);
  if (Number.isNaN(hours) || Number.isNaN(rate)) throw new Error('Hours and rate must be numbers, 0 or more');
  if (hours == null && rate == null) throw new Error('Propose hours, a rate, or both');
  if (hours != null && hours > MAX_HOURS) throw new Error(`Hours must be at most ${MAX_HOURS}`);
  const why = String(params.why ?? '').trim();
  if (why.length < MIN_NOTE) throw new Error(`Say why in at least ${MIN_NOTE} characters — a bare number is not a conversation`);

  const exec = execFromContext(context);
  const current = await fetchObjectChangeDecision(exec, decisionId);
  if (!current) throw new Error('This request was not found');
  const standing = standingRound(current);
  const same = (a: number | null, b: number | null | undefined) => a == null || (b != null && Math.abs(a - Number(b)) < 1e-6);
  if (same(hours, standing.hm) && same(rate, standing.price)) {
    throw new Error('A counter has to change the terms — to accept them, approve; to talk it over, use the chat');
  }

  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const signersOf = dealSignersFor(run);
  let signers: DealSigners | null = null;

  const result = await counterObjectChange(exec, {
    decisionId,
    userId: me,
    round: { mode: 'keep', why, hm: hours, price: rate },
    extraFor: async (decision) => {
      signers = (await signersOf(decision)) as DealSigners | null;
      if (!signers || !signers.ids.includes(me)) {
        throw new Error('Only the customer of this deal counters its requests for more hours here');
      }
      return signers;
    }
  });

  const deal = (signers as DealSigners | null)?.deal;
  if (notifier && deal?.projectId) {
    const h = result.standing.hm ?? deal.missionHours;
    const r = result.standing.price ?? deal.missionRate;
    notifier
      .notify(
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
          templates: {
            title: { he: 'הלקוחה הציעה תנאים אחרים', en: 'The customer proposed other terms' },
            body: {
              he: `ל"${deal.missionName}": ${h} שעות × ${r}. השעון התאפס — אפשר לאשר, להציע שוב או לדבר על זה.`,
              en: `For "${deal.missionName}": ${h} hours × ${r}. The clock reset — approve, propose again, or talk it over.`
            }
          },
          channels: ['socket', 'push'],
          metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
        },
        { projectId: deal.projectId },
        { projectId: deal.projectId, decisionId },
        context
      )
      .catch((e: unknown) => console.warn('[counterDealEdit] notification failed:', e));
  }

  return {
    data: { decisionId, order: result.order, deadline: result.deadline },
    updateStrategy: { type: 'none' as const }
  };
};

export const counterDealEditConfig: ActionConfig = {
  key: 'counterDealEdit',
  description:
    "The deal's customer counters a request for more hours on a part of her deal with her own hours and/or rate (and why). Opens the next round and resets the rikma's clock.",
  graphqlOperation: handler,
  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The editObject Decision on the mission' },
    hours: { type: 'number', required: false, description: 'The hours she would agree to (total for the part)' },
    rate: { type: 'number', required: false, description: 'The rate per hour she would agree to' },
    why: { type: 'string', required: true, description: 'Why these terms' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
