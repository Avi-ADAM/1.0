/**
 * Action: a candidate takes back their own open candidacy.
 *
 * An Ask (an offer to take an open mission) or an Askm (an offer to bring an
 * open resource) is the candidate's own proposal; until the rikma signs it, or
 * silence does, it binds nobody, and the person who made it may take it back.
 * This is not a veto on anyone else's proposal — nobody else can press it.
 *
 * Archive, never delete: the row stays with `archived: true` (no `lapsedAt`, so
 * it never reads as a lapsed offer to revive). The candidacy's silence clock is
 * marked done, the members' vote card drops out of the heart and the hub (both
 * read only non-archived candidacies), and the opening stays open — the same
 * person can apply again later (applyToMission looks only for a standing Ask).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { cancelCandidacyTimegrama } from '../../nego/timegrama.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

export type WithdrawSide = 'ask' | 'askm';

export type WithdrawRefusal = 'notFound' | 'notYours' | 'alreadyClosed' | 'assignedOffer' | 'notAnOffer';

export interface WithdrawPlan {
  side: WithdrawSide;
  id: string;
  projectId: string | null;
  projectName: string;
  /** The opening the candidacy was on: open mission (ask) or open resource (askm). */
  openingId: string | null;
  openingName: string;
  candidateName: string;
}

/**
 * Pure: may `uid` withdraw this candidacy, and what does it touch. `node` is
 * the `ask` / `askm` entity from askForWithdrawal / askmForWithdrawal.
 */
export function planWithdrawal(
  node: any,
  side: WithdrawSide,
  uid: string
): WithdrawPlan | { reason: WithdrawRefusal } {
  const a = node?.attributes;
  if (!node?.id || !a) return { reason: 'notFound' };
  const ownerId = a.users_permissions_user?.data?.id;
  // The candidate themself, and nobody else — the owner comes from the row.
  if (ownerId == null || String(ownerId) !== String(uid)) return { reason: 'notYours' };
  // Already accepted, closed, lapsed or withdrawn: nothing on the table to take back.
  if (a.archived === true || a.lapsedAt) return { reason: 'alreadyClosed' };

  const project = a.project?.data;
  const opening = side === 'ask' ? a.open_mission?.data : a.open_mashaabim?.data;
  if (side === 'ask' && opening?.attributes?.isRishon === true) {
    // The rikma offered this mission to the person (an assigned offer): it is
    // answered on the card — approve, discuss or counter — not withdrawn.
    return { reason: 'assignedOffer' };
  }
  if (side === 'askm' && !opening) {
    // A self-proposal on a pending resource vote (pmash) is not an offer on an
    // open resource; it rides that vote.
    return { reason: 'notAnOffer' };
  }

  return {
    side,
    id: String(node.id),
    projectId: project?.id != null ? String(project.id) : null,
    projectName: String(project?.attributes?.projectName ?? ''),
    openingId: opening?.id != null ? String(opening.id) : null,
    openingName: String(opening?.attributes?.name ?? ''),
    candidateName: String(a.users_permissions_user?.data?.attributes?.username ?? '')
  };
}

/** Pure: the opening removed from the candidate's `askeds` list (what they asked to do). */
export function withoutAsked(askedIds: string[], openingId: string): string[] {
  return askedIds.map(String).filter((id) => id !== String(openingId));
}

const REFUSAL: Record<WithdrawRefusal, string> = {
  notFound: 'The candidacy was not found',
  notYours: 'Only the candidate can withdraw their own candidacy',
  alreadyClosed: 'This candidacy is no longer open, so there is nothing to withdraw',
  assignedOffer:
    'This mission was offered to you by the rikma: answer it on the card (approve, discuss or counter) instead',
  notAnOffer: 'This proposal is part of a pending resource vote, not an offer on an open resource'
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const side: WithdrawSide = params.side === 'askm' ? 'askm' : 'ask';
  const id = String(params.id);
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);

  const res = await run(side === 'ask' ? 'askForWithdrawal' : 'askmForWithdrawal', { id });
  const node = side === 'ask' ? res?.data?.ask?.data : res?.data?.askm?.data;
  const plan = planWithdrawal(node, side, String(context.userId));
  if ('reason' in plan) {
    const { reason } = plan;
    throw new ActionError(
      reason === 'notYours' ? 'FORBIDDEN' : reason === 'notFound' ? 'NOT_FOUND' : 'NOT_WITHDRAWABLE',
      REFUSAL[reason],
      { reason }
    );
  }
  if (params.projectId && plan.projectId && String(params.projectId) !== plan.projectId) {
    throw new ActionError('VALIDATION_ERROR', 'The candidacy belongs to another rikma', { reason: 'projectMismatch' });
  }

  await run(side === 'ask' ? 'withdrawAsk' : 'withdrawAskm', { id });

  // The clock stops: silence must never approve a candidacy its author took back.
  await cancelCandidacyTimegrama(strapi, context, side, id);

  // The opening is no longer one the person "asked to do", so matching may
  // suggest it to them again. Best-effort — the withdrawal stands either way.
  if (side === 'ask' && plan.openingId) {
    try {
      const u = await run('80usersPermissionsUserWithAskeds', { id: String(context.userId) });
      const asked: string[] = (u?.data?.usersPermissionsUser?.data?.attributes?.askeds?.data ?? []).map((x: any) =>
        String(x.id)
      );
      if (asked.includes(plan.openingId)) {
        await run('81updateAskeds', { userId: String(context.userId), askedsList: withoutAsked(asked, plan.openingId) });
      }
    } catch (e) {
      console.error('[withdrawCandidacy] askeds not updated', id, e);
    }
  }

  return {
    data: {
      side,
      id,
      projectId: plan.projectId,
      openingId: plan.openingId,
      openingName: plan.openingName,
      candidateName: plan.candidateName,
      withdrawn: true
    },
    updateStrategy: { type: 'none' }
  };
};

/** One line to the members, naming who withdrew from what. */
function withdrawnTemplates(r: any) {
  const who = String(r?.data?.candidateName ?? '').trim();
  const what = String(r?.data?.openingName ?? '').trim();
  const q = (s: string) => (s ? `"${s}"` : '');
  return {
    title: {
      he: 'מועמדות נמשכה',
      en: 'Candidacy withdrawn',
      ar: 'تم سحب الترشّح',
      ru: 'Кандидатура отозвана',
      es: 'Candidatura retirada'
    },
    body: {
      he: `${who || 'המועמד/ת'} משך/ה את המועמדות ${q(what)}`.trim(),
      en: `${who || 'The candidate'} withdrew their candidacy ${what ? `for ${q(what)}` : ''}`.trim(),
      ar: `${who || 'المرشّح'} سحب ترشّحه ${what ? `لـ ${q(what)}` : ''}`.trim(),
      ru: `${who || 'Кандидат'} отозвал(а) кандидатуру ${what ? `на ${q(what)}` : ''}`.trim(),
      es: `${who || 'La persona candidata'} retiró su candidatura ${what ? `a ${q(what)}` : ''}`.trim()
    }
  };
}

export const withdrawCandidacyConfig: ActionConfig = {
  key: 'withdrawCandidacy',
  description:
    "The candidate takes back their own open candidacy: an Ask (offer to take an open mission) or an Askm (offer to bring an open resource). Archives it (never deletes), stops its silence clock, and leaves the opening open so they can apply again later. Only the candidate can do it.",
  graphqlOperation: handler,

  paramSchema: {
    side: { type: 'string', required: true, description: "'ask' (open mission) or 'askm' (open resource)" },
    id: { type: 'string', required: true, description: 'The Ask / Askm id' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID - notifications and realtime scope' }
  },

  // Who may press it — the candidate named on the row — is decided from the row
  // in the handler (planWithdrawal), never from the params.
  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: withdrawnTemplates(null),
    templatesFor: (_p, r) => withdrawnTemplates(r),
    // A vote they were asked to answer is gone; nothing is awaited of them.
    intent: 'outcome',
    metadata: { type: 'base', url: 'lev' }
  },

  updateStrategy: { type: 'none' },

  realtime: {
    scopes: (p, r) =>
      scopeList([
        scope('project', p.projectId),
        decisionScope(p.side === 'askm' ? 'askm' : 'ask', p.id),
        p.side !== 'askm' && scope('mission', r?.data?.openingId)
      ])
  }
};
