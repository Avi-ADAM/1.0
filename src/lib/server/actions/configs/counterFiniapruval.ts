/**
 * Action: counterFiniapruval — QA_CONCIERGE_E2E C-15.
 *
 * The way to disagree with a finish approval. A member who does not accept the
 * hours (or the finish) put in front of them does not "reject" — there is no
 * absolute no on this platform — they propose the version they would sign:
 * different hours, with the reason. This:
 *   - moves the claim to the next round (`vots.order`) with the new hours as its
 *     standing version — signatures on the old version stop counting,
 *   - records the proposer's YES at the new round (proposing a version is agreeing
 *     to it) with what changed in `why`,
 *   - resets the silence-as-consent clock: the old timegrama is closed and a fresh
 *     one, a restime ahead, matures the version now on the table,
 *   - tells the rest of the rikma — the claimant first among them — that the claim
 *     was countered and the ball is theirs.
 *
 * "I do not credit these hours" is a counter to 0, not a veto. The rules a round
 * follows are in `$lib/finiapruval/rounds` (shared with the card and with the
 * timegrama that matures a silent claim).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { calcDeadlineMs } from './actionUtils.js';
import {
  encodeCounter,
  hasSigned,
  refuseCounter,
  roundOf,
  standingOrder,
  voterId,
  MAX_COUNTER_HOURS,
  MIN_COUNTER_NOTE
} from '$lib/finiapruval/rounds.js';

const REFUSALS = {
  hours: `Hours must be a number between 0 and ${MAX_COUNTER_HOURS}`,
  same: 'A counter has to change the hours — to keep them, approve; to talk it over, use the chat',
  note: `Say why in at least ${MIN_COUNTER_NOTE} characters — a bare number is not a conversation`
} as const;

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { finiapruvalId, projectId, hours, note } = params as {
    finiapruvalId: string;
    projectId: string;
    hours: number;
    note: string;
  };
  const me = String(context.userId);
  const now = new Date();

  const res = await strapi.execute('117getFiniapruvalForClose', { id: finiapruvalId }, context.jwt, context.fetch);
  const fa = res?.data?.finiapruval?.data?.attributes;
  if (!fa) throw new Error(`Finiapruval ${finiapruvalId} not found`);
  if (fa.archived) throw new Error('This approval is already resolved');

  // The approval's own rikma decides who may negotiate it — not the `projectId`
  // the client sent along.
  const memberIds: string[] = (fa.mesimabetahalich?.data?.attributes?.project?.data?.attributes?.user_1s?.data ?? []).map(
    (u: any) => String(u.id)
  );
  if (!memberIds.includes(me)) throw new Error('Only a member of this rikma can negotiate its approvals');

  const vots: any[] = fa.vots ?? [];
  // Your move only if you do not already stand behind the version on the table.
  if (hasSigned(vots, me)) {
    throw new Error("You already stand behind the current version — it is the others' turn. To talk it over, use the chat");
  }

  const current = Number(fa.noofhours ?? 0);
  const refusal = refuseCounter(current, hours, note);
  if (refusal) throw new Error(REFUSALS[refusal]);
  const newHours = Number(hours);

  const newOrder = standingOrder(vots) + 1;
  const proposerVote = {
    what: true,
    users_permissions_user: me,
    ide: parseInt(me, 10),
    zman: now.toISOString(),
    order: newOrder,
    why: encodeCounter({ from: current, to: newHours, note })
  };
  const allVots = [
    // every earlier vote is history, kept whole — its round, reason and time
    ...vots.map((v) => ({
      what: v.what,
      users_permissions_user: voterId(v),
      ...(v.why ? { why: v.why } : {}),
      ...(roundOf(v) > 0 ? { order: roundOf(v) } : {}),
      ...(v.ide != null ? { ide: v.ide } : {}),
      ...(v.zman ? { zman: v.zman } : {})
    })),
    proposerVote
  ];

  const written = await strapi.execute(
    '386counterFiniapruval',
    { id: String(finiapruvalId), vots: allVots, noofhours: newHours },
    context.jwt,
    context.fetch
  );
  if (!written || written.errors) {
    throw new Error(`counterFiniapruval failed: ${JSON.stringify(written?.errors ?? 'Unknown')}`);
  }

  // Reset the silence-as-consent clock: the new version gets its own restime.
  const oldClock = fa.timegrama?.data?.id;
  if (oldClock) {
    try {
      await strapi.execute('35updateTimeGrama', { id: String(oldClock), done: true }, context.jwt, context.fetch);
    } catch (err) {
      console.warn('[counterFiniapruval] closing the old timegrama failed:', err);
    }
  }
  try {
    const restime = fa.project?.data?.attributes?.restime ?? 'feh';
    await strapi.execute(
      '32createTimeGrama',
      {
        whatami: 'finiapruval',
        finiapruval: String(finiapruvalId),
        date: new Date(now.getTime() + calcDeadlineMs(restime)).toISOString()
      },
      context.jwt,
      context.fetch
    );
  } catch (err) {
    console.error('[counterFiniapruval] new timegrama failed — the version will not mature by silence:', err);
  }

  // The rest of the rikma: the ball is theirs.
  const others = memberIds.filter((id) => id !== me);
  if (notifier && others.length > 0) {
    try {
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: {
              he: 'הוצעה גרסה אחרת לאישור סיום',
              en: 'A different version of a finish approval was proposed',
              ar: 'اقتُرحت نسخة أخرى لطلب الموافقة على الإنهاء'
            },
            body: {
              he: `הוצעו ${newHours} שעות במקום ${current}: ${String(note).trim()} — אפשר לאשר, להציע גרסה אחרת או לדבר על זה. שעון התגובה אופס.`,
              en: `${newHours} hours were proposed instead of ${current}: ${String(note).trim()} — you can approve, propose another version or talk it over. The response clock was reset.`,
              ar: `اقتُرحت ${newHours} ساعات بدلاً من ${current}: ${String(note).trim()} — يمكنكم الموافقة أو اقتراح نسخة أخرى أو النقاش. أُعيد ضبط ساعة الرد.`
            }
          },
          channels: ['socket', 'push'],
          metadata: {
            type: 'finiapruvalCounter',
            url: `/lev?project=${projectId}`,
            priority: 'normal'
          }
        },
        { recipients: others, projectId, finiapruvalId },
        { data: { id: finiapruvalId } },
        context
      );
    } catch (err) {
      console.warn('[counterFiniapruval] notification failed:', err);
    }
  }

  return {
    success: true,
    data: { finiapruvalId: String(finiapruvalId), hours: newHours, from: current, order: newOrder },
    updateStrategy: { type: 'none' as const }
  };
};

export const counterFiniapruvalConfig: ActionConfig = {
  key: 'counterFiniapruval',
  description:
    "Disagree with a finish approval by proposing the version you would sign (different hours + a reason): opens the next round, records the proposer's yes, resets the restime clock and notifies the rikma. There is no veto.",
  graphqlOperation: handler,
  paramSchema: {
    finiapruvalId: { type: 'string', required: true, description: 'Finiapruval ID' },
    projectId: { type: 'string', required: true, description: 'Project ID (auth)' },
    hours: { type: 'number', required: true, description: 'The hours the proposer would sign (0 = "I do not credit these")' },
    note: { type: 'string', required: true, description: 'Why — shown to the rest of the rikma' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to negotiate an approval' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this rikma to negotiate its approvals'
    }
  ],
  updateStrategy: { type: 'none' }
};
