/**
 * parseDonationNote — reads the structured Sale `note` used for donation
 * income (PLAN_VOLUNTEER_RIKMA §2). A donation is a Sale with no linked
 * product whose note starts with the `donation` marker, mirroring the
 * site-share convention (see parseSiteShareNote.ts).
 *
 * Note format (written by buildDonationNote):
 *   donation [· from=<display name>] [· via=<manual|page|pledge>]
 *            [· msg="<dedication text>"] [· pledge=<id>]
 *
 * The amount lives on the Sale itself (`in`), never in the note.
 * `from` is the donor's public display name — its absence means the donor
 * chose to stay anonymous, so supporter walls must fall back accordingly.
 *
 * Pure and defensive: any string that does not start with the `donation`
 * marker returns null, so callers can guard with a simple `if`.
 */

export type DonationVia = 'manual' | 'page' | 'pledge';

export interface ParsedDonationNote {
  /** Donor's public display name, or null when anonymous. */
  from: string | null;
  /** How the donation arrived; null on malformed/legacy notes. */
  via: DonationVia | null;
  /** Optional dedication/message the donor attached. */
  msg: string | null;
  /** Pledge id when the donation matured from a pledge (`via=pledge`). */
  pledgeId: string | null;
  /** The untouched original note, kept for CSV export / debugging. */
  raw: string;
}

/** Marker the note always starts with. */
const MARKER = 'donation';

const VIA_VALUES: readonly DonationVia[] = ['manual', 'page', 'pledge'];

/**
 * Returns the parsed note, or null when `note` is not a donation note.
 */
export function parseDonationNote(
  note: string | null | undefined
): ParsedDonationNote | null {
  if (typeof note !== 'string') return null;
  const raw = note.trim();
  // Must be the exact marker or the marker followed by a separator — a note
  // that merely starts with the word (e.g. "donations report") is not ours.
  if (raw !== MARKER && !raw.startsWith(`${MARKER} ·`)) return null;

  const result: ParsedDonationNote = {
    from: null,
    via: null,
    msg: null,
    pledgeId: null,
    raw
  };

  // Pull the quoted msg out first — it may itself contain the ` · ` separator,
  // so extracting it before splitting keeps the split unambiguous.
  let rest = raw;
  const msgMatch = rest.match(/msg="([^"]*)"/);
  if (msgMatch) {
    result.msg = msgMatch[1];
    rest = rest.replace(msgMatch[0], '');
  }

  for (const rawPart of rest.split('·')) {
    const part = rawPart.trim();
    if (!part || part === MARKER) continue;

    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();

    switch (key) {
      case 'from':
        result.from = value || null;
        break;
      case 'via':
        result.via = (VIA_VALUES as readonly string[]).includes(value)
          ? (value as DonationVia)
          : null;
        break;
      case 'pledge':
        result.pledgeId = value || null;
        break;
      // Unknown keys are ignored so the parser tolerates future note additions.
    }
  }

  return result;
}

/** Convenience guard for template code. */
export function isDonationNote(note: string | null | undefined): boolean {
  return parseDonationNote(note) !== null;
}

/**
 * Builds the structured note `createDonationSale` should persist.
 * Quotes in the message are stripped rather than escaped — the parser's
 * regex treats `"` as a hard delimiter.
 */
export function buildDonationNote(input: {
  from?: string | null;
  via: DonationVia;
  msg?: string | null;
  pledgeId?: string | null;
}): string {
  const parts: string[] = [MARKER];
  const from = input.from?.trim();
  if (from) parts.push(`from=${from}`);
  parts.push(`via=${input.via}`);
  const msg = input.msg?.trim().replace(/"/g, "'");
  if (msg) parts.push(`msg="${msg}"`);
  if (input.pledgeId) parts.push(`pledge=${input.pledgeId}`);
  return parts.join(' · ');
}
