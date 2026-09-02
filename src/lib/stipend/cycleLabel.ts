/**
 * How a stipend cycle says which stretch of time it is (PLAN_STIPEND §6).
 *
 * The pay and confirm cards showed an amount and a number of hours with no
 * period attached, so a recipient was asked to confirm ₪2,100 with no way to
 * tell **which month** it answered — and a funder settling two cycles in a row
 * saw two identical-looking cards (docs/FIXES.md §12).
 *
 * A stipend window is usually a whole calendar month, and then the month's own
 * name is the clearest thing to say. It stops being a whole month exactly when
 * something interesting happened — the pledge started mid-month, or a previous
 * settlement moved the watermark — and then the dates themselves are the
 * honest answer, because they are what the payment actually covers.
 *
 * Pure, and takes its locale, so the same window renders the same way in the
 * card, in the moach tab and in a test.
 */

function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** True when [start, end] covers exactly one calendar month, edge to edge. */
function isWholeMonth(start: Date, end: Date): boolean {
  if (start.getUTCDate() !== 1) return false;
  if (start.getUTCHours() !== 0 || start.getUTCMinutes() !== 0) return false;
  const nextMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );
  // The window's end is the last millisecond of the month; allow a second of
  // slack so a stored value rounded to the second still reads as whole.
  return Math.abs(nextMonth.getTime() - 1 - end.getTime()) < 1000;
}

function dayMonth(d: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC'
    }).format(d);
  } catch {
    return `${d.getUTCDate()}.${d.getUTCMonth() + 1}`;
  }
}

/**
 * The label for one cycle window. Returns '' when there is nothing to say —
 * callers render the surrounding chrome only when this is non-empty.
 */
export function cycleLabel(
  cycleStart: string | Date | null | undefined,
  cycleEnd: string | Date | null | undefined,
  locale = 'he'
): string {
  const start = toDate(cycleStart);
  const end = toDate(cycleEnd);
  if (!start && !end) return '';
  if (!start || !end) {
    const one = (start ?? end) as Date;
    return dayMonth(one, locale);
  }

  if (isWholeMonth(start, end)) {
    try {
      return new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(start);
    } catch {
      return `${start.getUTCMonth() + 1}/${start.getUTCFullYear()}`;
    }
  }

  // A partial window. `–` (en dash) rather than a hyphen: these are two dates,
  // not a compound word, and it survives an RTL run without flipping.
  return `${dayMonth(start, locale)} – ${dayMonth(end, locale)}`;
}
