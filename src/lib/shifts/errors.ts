/**
 * The shift actions refuse with a code, never with a sentence
 * (docs/PLAN_SHIFTS.md P11): the server does not know the member's language,
 * and a raw English message in a Hebrew card is exactly the regression the
 * i18n rules forbid. The card turns the code back into words through `$t()`.
 *
 *   shift:<code>          → shifts.error.<code>
 *   swap:<problem>        → shifts.swap.problem.<problem>   (src/lib/shifts/swap.ts)
 *   rules:<issue>:<index> → shifts.rules.issue.<issue>       (src/lib/shifts/rules.ts)
 *
 * Pure — imported by the actions and by the components alike.
 */

export const SHIFT_ERROR_CODES = [
  'notFound',
  'notYours',
  'notOnShift',
  'started',
  'notEnded',
  'notOpen',
  'notConfirmed',
  'noMission',
  'notOnMission',
  'clash',
  'wrongRoster',
  'notParty',
  'onlyProposer',
  'notYourTurn',
  'counterSame',
  'badAnswer',
  'saveFailed'
] as const;

export type ShiftErrorCode = (typeof SHIFT_ERROR_CODES)[number];

export function shiftError(code: ShiftErrorCode): Error {
  return new Error(`shift:${code}`);
}

/** The translation key for a coded refusal anywhere in `message`, or null for an uncoded one. */
export function shiftErrorKey(message: string | null | undefined): string | null {
  const m = /\b(shift|swap|rules):(\w+)/.exec(message ?? '');
  if (!m) return null;
  if (m[1] === 'swap') return `shifts.swap.problem.${m[2]}`;
  if (m[1] === 'rules') return `shifts.rules.issue.${m[2]}`;
  return (SHIFT_ERROR_CODES as readonly string[]).includes(m[2]) ? `shifts.error.${m[2]}` : null;
}

/**
 * What a card shows for a refusal: the translated code when there is one, the
 * server's own text when it is uncoded (a timer-system message), and the
 * generic fallback when there is nothing to say.
 */
export function describeShiftError(raw: string | null | undefined, t: (key: string) => string, fallback: string): string {
  const key = shiftErrorKey(raw);
  if (!key) return raw || fallback;
  const text = t(key);
  return text && text !== key ? text : fallback;
}
