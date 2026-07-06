/**
 * parseSiteShareNote — reads the structured Sale `note` that
 * `createPlatformSale.ts` writes for site-share income, and turns it back into a
 * typed object the UI can render as a readable breakdown instead of the raw
 * ` · `-delimited string.
 *
 * Note format (see createPlatformSale.ts):
 *   site-share [· <direction> · proposed=<n> · reason="<text>"] · paid=<n>
 *             [· from_project=<id>] [· halukas=<id,id,...>]
 *
 * `<direction>` is `less` (payer asked to give less) or `more` (offered more).
 * When the payer left the suggestion untouched (`as_is`) the direction, proposed
 * amount and reason are all absent — only `paid` is present.
 *
 * Pure and defensive: any string that does not start with the `site-share`
 * marker returns null, so callers can guard with a simple `if`.
 */

export type SiteShareAdjustDirection = 'less' | 'more';

export interface ParsedSiteShareNote {
  /** Amount actually recorded as income (the Sale `in`). */
  paid: number | null;
  /** Original suggested amount, present only when the payer adjusted it. */
  proposed: number | null;
  /** `less` / `more`, or null when the suggestion was taken as-is. */
  adjustDirection: SiteShareAdjustDirection | null;
  /** Free-text reason the payer gave for a `less`/`more` adjustment. */
  reason: string | null;
  /** Source rikma (project) id the income originated from. */
  fromProjectId: string | null;
  /** Ids of the cross-rikma transfer Halukas that physically moved the money. */
  halukaIds: string[];
  /** The untouched original note, kept for CSV export / debugging. */
  raw: string;
}

/** Marker the note always starts with. */
const MARKER = 'site-share';

function toNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Returns the parsed note, or null when `note` is not a site-share note.
 */
export function parseSiteShareNote(
  note: string | null | undefined
): ParsedSiteShareNote | null {
  if (typeof note !== 'string') return null;
  const raw = note.trim();
  if (!raw.startsWith(MARKER)) return null;

  const result: ParsedSiteShareNote = {
    paid: null,
    proposed: null,
    adjustDirection: null,
    reason: null,
    fromProjectId: null,
    halukaIds: [],
    raw
  };

  // Pull the quoted reason out first — it may itself contain the ` · ` separator,
  // so extracting it before splitting keeps the split unambiguous.
  let rest = raw;
  const reasonMatch = rest.match(/reason="([^"]*)"/);
  if (reasonMatch) {
    result.reason = reasonMatch[1];
    rest = rest.replace(reasonMatch[0], '');
  }

  for (const rawPart of rest.split('·')) {
    const part = rawPart.trim();
    if (!part || part === MARKER) continue;

    if (part === 'less' || part === 'more') {
      result.adjustDirection = part;
      continue;
    }

    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();

    switch (key) {
      case 'paid':
        result.paid = toNumber(value);
        break;
      case 'proposed':
        result.proposed = toNumber(value);
        break;
      case 'from_project':
        result.fromProjectId = value || null;
        break;
      case 'halukas':
        result.halukaIds = value
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        break;
      // Unknown keys are ignored so the parser tolerates future note additions.
    }
  }

  return result;
}

/** Convenience guard for template code. */
export function isSiteShareNote(note: string | null | undefined): boolean {
  return typeof note === 'string' && note.trim().startsWith(MARKER);
}
