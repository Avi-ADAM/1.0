/**
 * Action: signDealEdit — the customer signs a request for more hours on her deal
 * (QA_CONCIERGE_E2E C-14, $lib/sheirut/dealEdit).
 *
 * A provider who needs more hours than she agreed asks for them with an ordinary
 * `editObject` proposal on the mission; a version that raises her part waits for her
 * signature, because it is her money and her silence is not her yes. This is her "yes" to
 * the version on the table — the members sign theirs through `voteOnDecision`, and their
 * silence matures at the rikma's pace. When hers is the last signature missing, the version
 * applies and the deal's ceiling for that part follows it.
 *
 * Only a customer of the deal the mission belongs to may sign here.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { signObjectChange } from '$lib/server/archive/vote.js';
import { dealSignersFor, type DealSigners } from '$lib/server/sheirut/dealEdit.js';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const decisionId = String(params.decisionId ?? '');
  if (!decisionId) throw new Error('decisionId is required');
  const me = String(context.userId);

  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const signersOf = dealSignersFor(run);
  let signers: DealSigners | null = null;

  const outcome = await signObjectChange(execFromContext(context), decisionId, me, async (decision) => {
    signers = (await signersOf(decision)) as DealSigners | null;
    if (!signers || !signers.ids.includes(me)) {
      throw new Error('Only the customer of this deal signs its requests for more hours here');
    }
    return signers;
  }, params.expectRound);

  const deal = (signers as DealSigners | null)?.deal;
  if (notifier && deal?.projectId) {
    notifier
      .notify(
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
          templates: outcome.consensus
            ? {
                title: { he: 'הלקוחה אישרה שעות נוספות', en: 'The customer approved more hours' },
                body: {
                  he: `התנאים החדשים של "${deal.missionName}" אושרו והוחלו, והמחיר בעסקה עודכן.`,
                  en: `The new terms of "${deal.missionName}" were approved and applied; the deal's price follows them.`
                }
              }
            : {
                title: { he: 'הלקוחה חתמה על שעות נוספות', en: 'The customer signed more hours' },
                body: {
                  he: `הלקוחה חתמה על הגרסה של "${deal.missionName}". היא תוחל כשהרקמה תאשר אותה או כשהשעון ייגמר.`,
                  en: `The customer signed the version of "${deal.missionName}". It applies once the rikma approves it or its clock runs out.`
                }
              },
          channels: ['socket', 'push'],
          metadata: { type: 'voteUpdate', url: 'lev', priority: 'normal' }
        },
        { projectId: deal.projectId },
        { projectId: deal.projectId, decisionId },
        context
      )
      .catch((e: unknown) => console.warn('[signDealEdit] notification failed:', e));
  }

  return {
    data: { decisionId, order: outcome.order, consensus: outcome.consensus, awaiting: outcome.awaiting },
    updateStrategy: { type: 'none' as const }
  };
};

export const signDealEditConfig: ActionConfig = {
  key: 'signDealEdit',
  description:
    "The deal's customer signs the version on the table of a request for more hours (or another rate) on a part of her deal.",
  graphqlOperation: handler,
  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The editObject Decision on the mission' },
    expectRound: { type: 'number', required: false, description: 'The round a notice showed; ROUND_MOVED when a counter replaced it' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
