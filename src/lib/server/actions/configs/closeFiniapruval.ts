import type { ActionConfig } from '../types.js';
import { roundHours } from '$lib/timers/precision.js';
import { allSigned, roundOf, standingOrder, voterId } from '$lib/finiapruval/rounds.js';
import { isHoursApproval } from '$lib/finiapruval/kind.js';
import { resolveRate } from '$lib/timers/rate.js';
import { fileApprovedHours } from '$lib/server/finiapruval/fileApproved.js';
import { askCustomerForOverrun, capApproval } from '$lib/server/sheirut/overCap.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { tellMatured } from '$lib/server/notifications/matured.js';
import { overrunAwaitsCustomer, overrunHeldForProvider } from '$lib/server/notifications/maturedNotices.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

export const closeFiniapruvalConfig: ActionConfig = {
    key: 'closeFiniapruval',
    description: 'Add a vote to a finiapruval and close it when all members voted yes',
    graphqlOperation: async (params, context, { strapi }) => {
        const { finiapruvalId, timegramaId, vote, why } = params;
        const now = new Date();

        // Fetch finiapruval with all context needed for closing
        const finiRes = await strapi.execute('117getFiniapruvalForClose', {
            id: finiapruvalId
        }, context.jwt, context.fetch);

        const fini = finiRes?.data?.finiapruval?.data;
        if (!fini) throw new Error(`Finiapruval ${finiapruvalId} not found`);
        const fa = fini.attributes;

        if (fa.archived) return { success: true, alreadyArchived: true };

        const mba = fa.mesimabetahalich?.data;
        const mbaa = mba?.attributes;
        const memberIds: string[] = (mbaa?.project?.data?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));

        // `projectId` comes from the client; the approval's own rikma is what counts.
        if (memberIds.length > 0 && !memberIds.includes(String(context.userId))) {
            throw new Error('You must be a member of this rikma to vote on its approvals');
        }

        // Build updated vots array (existing + new vote). A vote is cast on the
        // version now on the table — the standing round (src/lib/finiapruval/rounds.ts)
        // — and every earlier vote is carried over whole: its round, reason and time
        // used to be dropped here, which would erase the negotiation.
        const existingVots = fa.vots ?? [];
        const standing = standingOrder(existingVots);
        const me = String(context.userId);
        const kept = existingVots
            // re-voting on the standing version replaces your own earlier answer to it
            .filter((v: any) => !(voterId(v) === me && roundOf(v) === standing))
            .map((v: any) => ({
                what: v.what,
                users_permissions_user: voterId(v),
                ...(v.why ? { why: v.why } : {}),
                ...(v.order != null ? { order: v.order } : {}),
                ...(v.ide != null ? { ide: v.ide } : {}),
                ...(v.zman ? { zman: v.zman } : {})
            }));
        const allVots = [
            ...kept,
            {
                what: vote === true,
                users_permissions_user: context.userId,
                ide: parseInt(me, 10),
                zman: now.toISOString(),
                order: standing,
                ...(why ? { why } : {})
            }
        ];

        // Closed only when every member has signed the version on the table. A rikma
        // whose member list could not be read falls back to the old head count.
        const allVotedYes =
            memberIds.length > 0
                ? allSigned(allVots, memberIds)
                : !allVots.some((v: any) => v.what === false) &&
                  allVots.filter((v: any) => v.what === true).length >= 1;

        if (!allVotedYes) {
            // Just record the vote, not yet closing
            await strapi.execute('118updateFiniapruvalVots', {
                id: finiapruvalId,
                vots: allVots
            }, context.jwt, context.fetch);
            return { success: true, closed: false };
        }

        // All voted yes — close based on type. Hours (a timer save, a month)
        // bank on the mission and leave it running; only a finish approval
        // closes it. An hours approval filed before `isTimerSave` existed is
        // still hours ($lib/finiapruval/kind.ts) — reading it as a finish would
        // end a running mission.
        const isTimerSave: boolean = isHoursApproval(fa);
        // Whole minutes, priced to the agora ($lib/timers/precision.ts); an approval
        // filed before that rule still carries its seconds.
        const noofhours: number = roundHours(fa.noofhours ?? 0);

        // The rate these hours were *worked* at, in the order the stamp was
        // copied: the approval carries it, the timer carries it, and only a
        // pre-stamp row falls back to the mission's value now. A vote that
        // lands after the mission was renegotiated must not re-price the work
        // it is approving (src/lib/timers/rate.ts).
        const perhour: number = resolveRate(
            fa.perhour,
            fa.timer?.data?.attributes?.rate,
            mbaa?.perhour,
        );

        const run = (qid: string, vars: Record<string, unknown>) =>
            strapi.execute(qid, vars, context.jwt, context.fetch);

        // A part of a customer's wish deal has a ceiling: what the rikma approves above the
        // price she agreed for it waits for her signature instead of going into the shares
        // (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md §3.2, $lib/server/sheirut/overCap). Every
        // other mission files whole, as always. A deal that cannot be read throws — the
        // vote fails and can be cast again, rather than billing her without her.
        const capped = await capApproval(run, mba?.id, noofhours, perhour);
        const fileNow = capped ? capped.split.inHours : noofhours;
        const heldHours = capped ? capped.split.overHours : 0;

        await fileApprovedHours(run, {
            finiapruvalId: String(finiapruvalId),
            fa,
            hours: fileNow,
            perhour,
            isTimerSave,
            writeEmptyFinal: heldHours === 0,
            now
        });

        if (capped && heldHours > 0) {
            // The rikma said its yes; the rest is the customer's to answer. The approval
            // stays open with the held hours only, every signature kept, and its clock is
            // closed — so neither a second vote nor silence can file them past her.
            await strapi.execute('386counterFiniapruval', {
                id: finiapruvalId,
                vots: allVots,
                noofhours: heldHours
            }, context.jwt, context.fetch);
            const clock = timegramaId ?? fa.timegrama?.data?.id;
            if (clock) {
                await strapi.execute('35updateTimeGrama', { id: String(clock), done: true }, context.jwt, context.fetch)
                    .catch((e: unknown) => console.warn('[closeFiniapruval] closing the clock of a held approval failed:', e));
            }
            const asked = await askCustomerForOverrun(execFromContext(context), capped.deal, capped.split, String(context.userId))
                .catch((e: unknown) => {
                    console.error('[closeFiniapruval] hours held for the customer, but the request to her was not opened:', e);
                    return { opened: false, decisionId: null };
                });
            await tellMatured(
                [
                    overrunAwaitsCustomer({
                        sheirutId: capped.deal.sheirutId,
                        missionName: capped.deal.missionName,
                        hours: heldHours,
                        amount: capped.split.overValue,
                        clientIds: capped.deal.clientIds
                    }),
                    overrunHeldForProvider({
                        projectId: capped.deal.projectId,
                        sheirutId: capped.deal.sheirutId,
                        missionName: capped.deal.missionName,
                        hours: heldHours,
                        providerId: capped.deal.providerId
                    })
                ],
                context.fetch
            ).catch((e: unknown) => console.warn('[closeFiniapruval] overrun notices failed:', e));
            return {
                success: true,
                closed: false,
                isTimerSave,
                heldForCustomer: { hours: heldHours, amount: capped.split.overValue, filed: fileNow, decisionId: asked.decisionId }
            };
        }

        // Archive finiapruval with final votes + close timegrama
        await strapi.execute('118updateFiniapruvalVots', {
            id: finiapruvalId,
            vots: allVots,
            archived: true
        }, context.jwt, context.fetch);

        if (timegramaId) {
            await strapi.execute('35updateTimeGrama', {
                id: timegramaId,
                done: true
            }, context.jwt, context.fetch);
        }

        return { success: true, closed: true, isTimerSave };
    },

    paramSchema: {
        finiapruvalId: { type: 'string', required: true, description: 'Finiapruval ID to vote on' },
        timegramaId: { type: 'string', required: false, description: 'Timegrama ID to mark done on close' },
        vote: { type: 'boolean', required: true, description: 'true = yes, false = no' },
        why: { type: 'string', required: false, description: 'Reason text (required on negative vote)' },
        projectId: { type: 'string', required: true, description: 'Project ID for auth check' }
    },

    authRules: [
        { type: 'jwt', errorMessage: 'You must be logged in to vote' },
        {
            type: 'projectMember',
            config: { projectIdParam: 'projectId' },
            errorMessage: 'You must be a member of this project to vote'
        }
    ],

    notification: {
        recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId', excludeSender: false }
        },
        templates: {
            title: { he: 'הצבעה על אישור', en: 'Approval Vote', ar: 'تصويت على الموافقة' },
            body: { he: 'הצבעה חדשה התקבלה', en: 'A new vote was received', ar: 'تم استلام تصويت جديد' }
        },
        intent: 'outcome',
        metadata: { priority: 'normal', type: 'finiapruvalVote', url: '/lev?project={{projectId}}' }
    },

    updateStrategy: {
        type: 'refetchScope', // Re-read the slice: the raw result is not in the lev store's shape (REALTIME_TRACKING B1).
        config: { dataKeys: ['fiapp', 'mtaha'] }
    },

    realtime: {
        scopes: (p) =>
            scopeList([scope('project', p.projectId), decisionScope('finiapruval', p.finiapruvalId)]),
    },
};
