/**
 * Action: counterDealRecipe — the customer answers a bigger recipe on her product
 * (PLAN_PRODUCT_FORM_UNIFIED, phase 3).
 *
 * There is no "no": she keeps the changes she needs and leaves the rest out, with a
 * reason. Keeping none of them is the "as agreed" version. Her version opens the next
 * round with her signature on it and resets the rikma's clock, because the members
 * have not agreed to it yet.
 */

import { noticeSubject } from '$lib/notices/links';
import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchObjectChangeDecision, standingRound } from '$lib/server/archive/read.js';
import { counterObjectChange } from '$lib/server/archive/vote.js';
import { dealSignersFor, type DealSigners } from '$lib/server/sheirut/dealEdit.js';
import { bomRaise } from '$lib/shop/bomEditor.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

const MIN_NOTE = 8;

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const decisionId = String(params.decisionId ?? '');
  if (!decisionId) throw new Error('decisionId is required');
  const me = String(context.userId);
  const why = String(params.why ?? '').trim();
  if (why.length < MIN_NOTE) throw new Error(`Say why in at least ${MIN_NOTE} characters`);

  const exec = execFromContext(context);
  const current = await fetchObjectChangeDecision(exec, decisionId);
  if (!current) throw new Error('This request was not found');
  const standing = standingRound(current);
  const terms = standing.bom ?? [];
  const keep = new Set((Array.isArray(params.keep) ? params.keep : []).map(Number));
  const kept = terms.filter((_, i) => keep.has(i));
  if (kept.length === terms.length) {
    throw new Error('A counter has to change something — to accept the version, approve it');
  }

  // The price the round carries followed the recipe; what she left out comes off it.
  const saved = Math.round((bomRaise(terms) - bomRaise(kept)) * 100) / 100;
  const price = standing.price == null ? null : Math.max(0, Math.round((standing.price - saved) * 100) / 100);

  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const signersOf = dealSignersFor(run);
  let signers: DealSigners | null = null;

  const result = await counterObjectChange(exec, {
    decisionId,
    userId: me,
    round: { mode: 'keep', why, bom: kept, price },
    extraFor: async (decision) => {
      signers = (await signersOf(decision)) as DealSigners | null;
      if (!signers?.recipe || !signers.ids.includes(me)) {
        throw new Error('Only a customer of this product answers its recipe here');
      }
      return signers;
    }
  });

  const recipe = (signers as DealSigners | null)?.recipe;
  if (notifier && recipe?.projectId) {
    notifier
      .notify(
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
          templates: {
            title: { he: 'הלקוח הציע הרכב אחר', en: 'The customer proposed another recipe' },
            body: {
              he: `ל"${recipe.productName}": ${why}. השעון התאפס — אפשר לאשר, להציע שוב או לדבר על זה.`,
              en: `For "${recipe.productName}": ${why}. The clock reset — approve, propose again, or talk it over.`
            }
          },
          intent: 'consent',
          subject: () => noticeSubject('decision', decisionId, recipe.projectId, 'archObject'),
          subjectText: 'before',
          metadata: { type: 'voteUpdate', url: `/moach/${recipe.projectId}/votes/decision/${decisionId}`, priority: 'high' }
        },
        { projectId: recipe.projectId },
        { projectId: recipe.projectId, decisionId },
        context
      )
      .catch((e: unknown) => console.warn('[counterDealRecipe] notification failed:', e));
  }

  return {
    data: {
      decisionId,
      order: result.order,
      deadline: result.deadline,
      projectId: recipe?.projectId ?? null,
      sheirutId: recipe?.sheirutId ?? null,
      clientIds: (signers as DealSigners | null)?.ids ?? []
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const counterDealRecipeConfig: ActionConfig = {
  key: 'counterDealRecipe',
  description:
    "A customer of a wish product answers a proposed recipe change by keeping only the changes they need (and why). Opens the next round and resets the rikma's clock.",
  graphqlOperation: handler,
  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The editObject Decision on the product' },
    keep: { type: 'array', required: true, description: 'Indexes of the standing version’s terms to keep' },
    why: { type: 'string', required: true, description: 'Why this version' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) => scopeList([scope('project', r?.data?.projectId), decisionScope('decision', p.decisionId), scope('deal', r?.data?.sheirutId)]),
    partiesFrom: (_p, r) => r?.data?.clientIds ?? []
  }
};
