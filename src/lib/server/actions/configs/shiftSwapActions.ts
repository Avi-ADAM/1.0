/**
 * Shift swaps (docs/PLAN_SHIFTS.md §1.2, §7 step 3) — the counter to a place in
 * the roster. Bilateral: only the two members sign; nobody else is affected,
 * so nobody else is asked.
 *
 *   proposeShiftSwap — "take my Tuesday" (and optionally "I take your
 *                      Thursday"). Opens a `Decision kind:'shiftSwap'`.
 *   decideShiftSwap  — approve · counter (ask for a different place, or none)
 *                      · withdraw (the proposer's own offer only). There is no
 *                      "reject": a swap nobody answers simply lapses and the
 *                      roster stays as it was — unless silence may complete it
 *                      (`silenceMayComplete`), which the cron then does.
 */

import type { ActionConfig, ActionExecutionHandler, ActionContext } from '../types.js';
import { asUser } from '$lib/server/shifts/exec.js';
import { shiftsLive } from '$lib/server/shifts/mode.js';
import { createSwap, loadOpenSwapsFor, loadSwap, updateSwap, type SwapView } from '$lib/server/shifts/store.js';
import { applySwap, assertSwap, deadlineFor, loadSwapScene, silenceFor, SwapError, type SwapScene } from '$lib/server/shifts/swaps.js';
import { swapTurn } from '$lib/shifts/swap.js';

const skipped = (why: string) => ({ data: { skipped: true, reason: why }, updateStrategy: { type: 'none' as const } });

/** A refusal the member can act on — the problem code is what the card translates. */
function refuse(e: unknown): never {
  if (e instanceof SwapError) throw new Error(`swap:${e.problem}`);
  throw e;
}

function tell(
  notifier: any,
  context: ActionContext,
  recipient: string,
  projectId: string | null,
  title: { he: string; en: string },
  body: { he: string; en: string }
) {
  if (!notifier) return;
  notifier
    .notify(
      {
        recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
        templates: { title, body },
        channels: ['socket', 'push'],
        metadata: { type: 'shiftSwap', url: 'lev', priority: 'normal' }
      },
      { recipients: [recipient], projectId },
      {},
      context
    )
    .catch((e: unknown) => console.warn('[shiftSwap] notification failed:', e));
}

// ── proposeShiftSwap ─────────────────────────────────────────────────────────

const proposeShiftSwap: ActionExecutionHandler = async (params, context, { notifier }) => {
  if (!shiftsLive()) return skipped('SHIFTS is not on');
  const uid = String(context.userId);
  const exec = asUser(context);
  const terms = { giveId: String(params.giveAssignmentId), takeId: params.takeAssignmentId ? String(params.takeAssignmentId) : null };
  const parties = { fromUserId: uid, toUserId: String(params.toUserId) };
  const now = new Date();

  // One open offer per place: asking a second member means withdrawing the first.
  const mineOpen = await loadOpenSwapsFor(exec, uid);
  const existing = mineOpen.find((s) => s.giveId === terms.giveId && s.fromUserId === uid);
  if (existing) return { data: { swapId: existing.id, already: true }, updateStrategy: { type: 'none' } };

  let scene: SwapScene;
  try {
    scene = await loadSwapScene(exec, terms);
    assertSwap(scene, terms, parties, now);
  } catch (e) {
    refuse(e);
  }
  const silence = silenceFor(scene, terms, parties, parties.toUserId);
  const swap = await createSwap(exec, {
    name: `shiftSwap ${terms.giveId}${terms.takeId ? `↔${terms.takeId}` : ''}`,
    ...terms,
    ...parties,
    planId: scene.plan.plan.id,
    deadline: deadlineFor(scene, now),
    silence
  });

  tell(
    notifier,
    context,
    parties.toUserId,
    scene.plan.project.id,
    { he: 'הוצעה לך החלפת משמרת', en: 'You were offered a shift swap' },
    silence
      ? {
          he: 'חבר/ה ברקמה מבקש/ת שתיקח/י משמרת שסימנת שאת/ה יכול/ה להגיע אליה. אם לא תגיב/י עד המועד — ההחלפה תתבצע.',
          en: 'A member asks you to take a shift you said you can make. If you do not answer by the deadline, the swap goes ahead.'
        }
      : {
          he: 'חבר/ה ברקמה מבקש/ת להחליף איתך משמרת. ההחלפה תתבצע רק אם תאשר/י.',
          en: 'A member asks to swap a shift with you. It happens only if you approve.'
        }
  );
  return { data: { swapId: swap.id, silence, deadline: swap.deadline }, updateStrategy: { type: 'fullRefresh' } };
};

export const proposeShiftSwapConfig: ActionConfig = {
  key: 'proposeShiftSwap',
  description: 'Offer my coming shift place to another member of the mission, optionally in exchange for one of theirs.',
  graphqlOperation: proposeShiftSwap,
  paramSchema: {
    giveAssignmentId: { type: 'string', required: true, description: 'My own coming place (rank 1)' },
    toUserId: { type: 'string', required: true, description: 'The member asked — must be on the same mission' },
    takeAssignmentId: { type: 'string', required: false, description: 'Their place I would take in exchange; omit for "just take mine"' }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'fullRefresh' }
};

// ── decideShiftSwap ──────────────────────────────────────────────────────────

const decideShiftSwap: ActionExecutionHandler = async (params, context, { notifier }) => {
  if (!shiftsLive()) return skipped('SHIFTS is not on');
  const uid = String(context.userId);
  const exec = asUser(context);
  const swap = await loadSwap(exec, String(params.decisionId));
  if (!swap) throw new Error('Swap not found');
  if (uid !== swap.fromUserId && uid !== swap.toUserId) throw new Error('Forbidden: only the two members of a swap answer it');
  if (swap.status !== 'open') return { data: { status: swap.status, already: true }, updateStrategy: { type: 'none' } };

  const parties = { fromUserId: swap.fromUserId, toUserId: swap.toUserId };
  const turn = swapTurn(parties, swap.signatures);
  const other = uid === swap.fromUserId ? swap.toUserId : swap.fromUserId;
  const now = new Date();
  const answer = String(params.answer);

  if (answer === 'withdraw') {
    if (uid !== swap.fromUserId) throw new Error('Only the member who offered a swap can withdraw it');
    await updateSwap(exec, swap, { status: 'withdrawn' });
    return { data: { status: 'withdrawn' }, updateStrategy: { type: 'fullRefresh' } };
  }

  if (turn.waitingOn !== uid) throw new Error('This swap is waiting on the other member');

  if (answer === 'approve') {
    const signatures = [...swap.signatures, { userId: uid, order: turn.round, at: now.toISOString() }];
    await updateSwap(exec, swap, { signatures });
    const result = await applySwap(exec, { ...swap, signatures }, now);
    tell(
      notifier,
      context,
      other,
      null,
      result.applied
        ? { he: 'החלפת המשמרת אושרה', en: 'The shift swap was approved' }
        : { he: 'החלפת המשמרת לא התאפשרה', en: 'The shift swap could not go ahead' },
      result.applied
        ? { he: 'הסידור עודכן בהתאם.', en: 'The roster has been updated.' }
        : { he: 'הסידור השתנה בינתיים, ולכן ההחלפה לא בוצעה.', en: 'The roster changed in the meantime, so the swap was not made.' }
    );
    return { data: { status: result.applied ? 'done' : 'lapsed', ...result }, updateStrategy: { type: 'fullRefresh' } };
  }

  if (answer === 'counter') {
    const terms = { giveId: swap.giveId ?? '', takeId: params.takeAssignmentId ? String(params.takeAssignmentId) : null };
    if (terms.takeId === swap.takeId) throw new Error('A counter must change the terms — or approve them as they are');
    let scene: SwapScene;
    try {
      scene = await loadSwapScene(exec, terms);
      assertSwap(scene, terms, parties, now);
    } catch (e) {
      refuse(e);
    }
    const signatures: SwapView['signatures'] = [...swap.signatures, { userId: uid, order: turn.round + 1, at: now.toISOString() }];
    const silence = silenceFor(scene, terms, parties, other);
    await updateSwap(exec, swap, { takeId: terms.takeId, signatures, silence, deadline: deadlineFor(scene, now) });
    tell(
      notifier,
      context,
      other,
      scene.plan.project.id,
      { he: 'הוצעה גרסה אחרת להחלפת המשמרת', en: 'A different version of the shift swap was proposed' },
      { he: 'אפשר לאשר, להציע גרסה אחרת או לשוחח.', en: 'You can approve, propose another version, or talk it over.' }
    );
    return { data: { status: 'open', round: turn.round + 1, silence }, updateStrategy: { type: 'fullRefresh' } };
  }

  throw new Error(`Unknown answer: ${answer}`);
};

export const decideShiftSwapConfig: ActionConfig = {
  key: 'decideShiftSwap',
  description: 'Answer a shift swap I am a party to: approve, counter with a different place, or withdraw my own offer.',
  graphqlOperation: decideShiftSwap,
  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The shiftSwap Decision' },
    answer: { type: 'string', required: true, description: "'approve' | 'counter' | 'withdraw'" },
    takeAssignmentId: { type: 'string', required: false, description: 'For a counter: the place to ask for instead (omit = none)' }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'fullRefresh' }
};
