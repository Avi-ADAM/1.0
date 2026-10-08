/**
 * Action: counterRatsonProposal — QA_CONCIERGE_E2E C-9.
 *
 * The way to say "not on these terms" to a wish proposal. The provider (invited, or
 * a volunteer from the community feed) and the wisher negotiate the one slot the
 * proposal covers: hours and price. There is no absolute no — the answer to terms
 * you cannot take is the version you could, with the reason.
 *
 * A counter rewrites the proposal's covered slot (the version on the table, the one
 * both accept paths read) and appends your entry to its signature log with
 * `agree:false` — "not that one, here is mine" — and the reason. It is then the
 * other side's move: approve it (acceptWishOffer / acceptRatsonProposal) or counter
 * back. Rules: `$lib/wish/proposalRounds`.
 *
 * A counter starts (and every later one restarts) the silence clock — silence only
 * counts once the two sides are talking, never at first contact: the other side has
 * the wish's pace (48 h unless its owner chose otherwise) to answer before silence
 * approves for them (`$lib/server/wish/clock`, `matureProposal`).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  isTurnOf,
  otherParty,
  refuseCounter,
  resolveVersion,
  MAX_AMOUNT,
  MIN_NOTE,
  type CounterRefusal
} from '$lib/wish/proposalRounds.js';
import { entryInput, loadWishProposal, requireParty } from '$lib/server/wish/proposal.js';
import { armProposalClock } from '$lib/server/wish/clock.js';

const NEGOTIABLE_FROM = new Set(['suggested', 'viewed']);

const REFUSALS: Record<CounterRefusal, string> = {
  amount: `Hours must be a number between 0 and ${MAX_AMOUNT}`,
  price: `The price must be a number between 0 and ${MAX_AMOUNT}`,
  same: 'A counter has to change the hours or the price — to keep them, approve; to talk it over, use the chat',
  note: `Say why in at least ${MIN_NOTE} characters — a bare number is not a conversation`
};

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { proposalId, ratsonId, hours, price, note } = params as {
    proposalId: string;
    ratsonId: string;
    hours?: number;
    price?: number;
    note: string;
  };
  const me = String(context.userId);
  const now = new Date().toISOString();

  const p = await loadWishProposal(strapi, context, String(ratsonId), String(proposalId));
  const party = requireParty(p, me);

  const status = p.attrs.status_proposal ?? 'suggested';
  if (!NEGOTIABLE_FROM.has(status)) {
    throw new Error(`This proposal is already '${status}' — it can no longer be negotiated`);
  }
  if (!p.slot || !p.path) {
    throw new Error('Only an invitation to a slot, or a volunteer offer on a published need, can be negotiated here');
  }

  // Your move only if the other side signed last.
  if (!isTurnOf(party, p.standing)) {
    throw new Error("You already stand behind the current terms — it is the other side's turn. To talk it over, use the chat");
  }

  const proposed = { amount: hours, price };
  const refusal = refuseCounter(p.version, proposed, note);
  if (refusal) throw new Error(REFUSALS[refusal]);
  const next = resolveVersion(p.version, proposed);

  const covered =
    p.slot.kind === 'mission'
      ? {
          covered_missions: [
            { extracted_mission_idx: p.slot.idx, hours: next.amount, price: next.price }
          ]
        }
      : {
          covered_resources: [
            { extracted_resource_idx: p.slot.idx, quantity: next.amount, price: next.price }
          ]
        };

  const entry = {
    user: me,
    item_kind: p.slot.kind === 'mission' ? 'covered_mission' : 'covered_resource',
    item_idx: 0,
    agree: false,
    note: String(note).trim(),
    submittedAt: now,
    ...(next.amount != null ? { willingHours: next.amount } : {}),
    ...(next.price != null ? { willingAmount: next.price } : {}),
    // A counter is signed under the wish's terms as they stand (PLAN_DIRECT_OFFER §4.3).
    termsDigest: p.signDigest
  };

  const written = await strapi.execute(
    '387counterRatsonProposal',
    {
      id: String(proposalId),
      total_price: next.price ?? undefined,
      ...covered,
      ratson_willingness_entry: [...p.entries.map(entryInput), entry]
    },
    context.jwt,
    context.fetch
  );
  if (!written || written.errors) {
    throw new Error(`counterRatsonProposal failed: ${JSON.stringify(written?.errors ?? 'Unknown')}`);
  }

  // The other side's time to answer starts now (the wish's pace, 48 h unless its owner chose otherwise).
  await armProposalClock(strapi, context, { proposalId: String(proposalId), ratsonId: String(ratsonId) });

  // The other side: the ball is theirs.
  const toParty = otherParty(party);
  const recipients = (toParty === 'wisher' ? p.wisherIds : p.proposerIds).filter((id) => id !== me);
  if (notifier && recipients.length > 0) {
    const what = `${next.amount ?? '—'} / ${next.price ?? '—'}`;
    const text = String(note).trim();
    try {
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
          templates: {
            title: {
              he: 'הוצעה גרסה אחרת לתנאי ההצעה',
              en: 'Different terms were proposed',
              ar: 'اقتُرحت شروط أخرى'
            },
            body: {
              he: `הוצע: ${what} (שעות / מחיר). ${text} — אפשר לאשר, להציע גרסה אחרת או לדבר על זה.`,
              en: `Proposed: ${what} (hours / price). ${text} — you can approve, propose other terms or talk it over.`,
              ar: `المقترح: ${what} (ساعات / سعر). ${text} — يمكنكم الموافقة أو اقتراح شروط أخرى أو النقاش.`
            }
          },
          channels: toParty === 'wisher' ? ['socket', 'email', 'push'] : ['socket', 'push'],
          metadata: {
            type: 'ratsonProposal',
            priority: 'high',
            url: toParty === 'wisher' ? `/concierge/${ratsonId}` : '/lev'
          }
        },
        params,
        { recipientIds: recipients, data: { proposalId, ratsonId } },
        context
      );
    } catch (err) {
      console.warn('[counterRatsonProposal] notification failed (non-fatal):', err);
    }
  }

  return {
    success: true,
    data: {
      proposalId: String(proposalId),
      ratsonId: String(ratsonId),
      round: p.standing.round + 1,
      version: next,
      signedBy: party
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const counterRatsonProposalConfig: ActionConfig = {
  key: 'counterRatsonProposal',
  description:
    'Counter a wish proposal: the wisher or the provider proposes other hours/price for the one slot it covers, with a reason. Rewrites the covered slot, logs the signature, hands the turn to the other side. There is no veto.',
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true },
    hours: { type: 'number', required: false, description: 'Hours (a task) or quantity (a resource) — omit to keep' },
    price: { type: 'number', required: false, description: 'Price for the slot — omit to keep' },
    note: { type: 'string', required: true, description: 'Why — shown to the other side' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to negotiate a proposal' }],
  updateStrategy: { type: 'none' }
};
