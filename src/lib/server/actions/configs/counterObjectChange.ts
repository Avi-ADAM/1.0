/**
 * Action: counterObjectChange (PLAN_OBJECT_ARCHIVAL — phase 2).
 *
 * The move that exists instead of a "no" button. A member who does not want an
 * object removed does not veto it — they put a different version on the table:
 *
 *   mode 'keep'    → "don't remove it, change it to this" (the archive
 *                    proposal becomes an edit proposal, same Decision)
 *   mode 'archive' → "remove it, but on these terms" (a different hours
 *                    settlement, a different effective date)
 *
 * Either way the clock resets, because the rikma is now being asked something
 * it has not yet answered.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import type { HoursOutcome, RoundMode, StandingRound } from '$lib/server/archive/apply.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { counterObjectChange } from '$lib/server/archive/vote.js';

const MODES: readonly RoundMode[] = ['archive', 'keep'];
const OUTCOMES: readonly HoursOutcome[] = ['credit', 'waive', 'transfer', 'endOfCycle'];
const KIND_OFS = ['total', 'monthly', 'yearly', 'perUnit', 'rent'];

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const decisionId = String(params.decisionId ?? '');
  if (!decisionId) throw new Error('decisionId is required');

  const mode = params.mode as RoundMode;
  if (!MODES.includes(mode)) throw new Error(`Unknown mode "${params.mode}"`);

  const hoursOutcome = params.hoursOutcome as HoursOutcome | undefined;
  if (hoursOutcome && !OUTCOMES.includes(hoursOutcome)) {
    throw new Error(`Unknown hoursOutcome "${hoursOutcome}"`);
  }
  if (hoursOutcome === 'transfer' && !params.transferToId) {
    throw new Error('transfer needs a transferToId');
  }

  const values = (params.newValues ?? {}) as Record<string, any>;
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v));

  const round: Omit<StandingRound, 'ordern'> = {
    mode,
    why: params.why ? String(params.why).trim() : null,
    name: values.name != null ? String(values.name) : null,
    descrip: values.descrip != null ? String(values.descrip) : null,
    hm: num(values.hm),
    price: num(values.price),
    kindOf: values.kindOf && KIND_OFS.includes(String(values.kindOf)) ? String(values.kindOf) : null,
    sqadualed: values.sqadualed ? String(values.sqadualed) : null,
    sqadualedf: values.sqadualedf ? String(values.sqadualedf) : null,
    hoursOutcome: hoursOutcome ?? null,
    hoursToCredit: num(params.hoursToCredit),
    transferToId: params.transferToId ? String(params.transferToId) : null,
    effectiveFrom: params.effectiveFrom ? String(params.effectiveFrom) : null,
  };

  const exec = execFromContext(context);
  const result = await counterObjectChange(exec, {
    decisionId,
    userId: String(context.userId),
    round,
  });

  if (notifier && params.projectId) {
    notifier
      .notify(
        {
          recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId', excludeSender: true },
          },
          templates: {
            title:
              mode === 'keep'
                ? { he: 'הוצעה נוסחה חליפית', en: 'Different terms proposed' }
                : { he: 'הוצעו תנאי הסרה אחרים', en: 'Different removal terms proposed' },
            body:
              mode === 'keep'
                ? {
                    he: 'חבר הציע להשאיר את האובייקט עם פרטים שונים במקום להסיר אותו. השעון התאפס - אפשר לאשר, לדייק שוב או לפתוח שיחה.',
                    en: 'A member proposed keeping the object with different terms instead of removing it. The clock reset - approve, refine again, or open a discussion.',
                  }
                : {
                    he: 'חבר דייק את תנאי ההסרה. השעון התאפס - אפשר לאשר, לדייק שוב או לפתוח שיחה.',
                    en: 'A member refined the removal terms. The clock reset - approve, refine again, or open a discussion.',
                  },
          },
          channels: ['socket', 'push'],
          metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' },
        },
        { projectId: params.projectId },
        { projectId: params.projectId, decisionId },
        context,
      )
      .catch((e: unknown) => console.warn('[counterObjectChange] notification failed:', e));
  }

  return {
    data: { ...result, mode },
    updateStrategy: { type: 'fullRefresh' as const },
  };
};

export const counterObjectChangeConfig: ActionConfig = {
  key: 'counterObjectChange',
  description:
    'Put a different version of an archive/edit proposal on the table. mode "keep" turns a removal proposal into an edit; mode "archive" refines the removal terms. Signs the new round and resets the silence clock.',
  graphqlOperation: handler,

  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The archiveObject/editObject Decision' },
    projectId: { type: 'string', required: true, description: 'Project ID (auth + notifications)' },
    mode: { type: 'string', required: true, description: "'keep' (object survives, terms change) | 'archive'" },
    newValues: { type: 'object', required: false, description: '{ name, descrip, hm, price, kindOf, sqadualed, sqadualedf }' },
    why: { type: 'string', required: false, description: 'Why this version' },
    hoursOutcome: { type: 'string', required: false, description: 'credit | waive | transfer | endOfCycle' },
    hoursToCredit: { type: 'number', required: false, description: 'Hours to settle' },
    transferToId: { type: 'string', required: false, description: 'Mesimabetahalich receiving the hours' },
    effectiveFrom: { type: 'string', required: false, description: 'When an endOfCycle archive takes effect' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to counter a proposal',
    },
  ],

  updateStrategy: { type: 'fullRefresh' },
};
