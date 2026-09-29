/**
 * The extended agreement, signed on the long path of an agent-prepared signup
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.3).
 *
 * The agent screen, /hascama?agent=<token>, links to agreement.1lev1.com. The
 * person reads and signs the extended agreement there — which creates a
 * signatory row with `fullAgreement: true`, exactly as it does for the
 * ordinary /hascama — and comes back to the same screen with `full=<row id>`
 * to choose a password. That id arrives in a URL, so before agent-sign uses
 * the row as this signup's signature it has to be:
 *
 *   - really the extended agreement (`fullAgreement: true`);
 *   - signed with the email this signup is being made for — the email is what
 *     the person later confirms, so it is what makes the row theirs;
 *   - signed during this link's life, not an older row of the same address;
 *   - nobody's yet: no account and no prepared session hold it.
 *
 * None of this can make an agent's signature the person's: the screen accepts
 * a returned row only in the browser tab that left for the agreement site
 * (AgentSignup.svelte), and the password and the email confirmation after it
 * are still the person's alone.
 */

export interface ExtendedSignatureRow {
  email: string | null;
  fullAgreement: boolean | null;
  createdAt: string | null;
  userId: string | null;
  sessionIds: string[];
}

/** The row as `386getChezinForAgentSign` returns it, or null. */
export function extendedRowOf(res: unknown): ExtendedSignatureRow | null {
  const data = (res as any)?.data?.chezin?.data;
  const a = data?.attributes;
  if (!data?.id || !a) return null;
  return {
    email: typeof a.email === 'string' ? a.email : null,
    fullAgreement: a.fullAgreement === true,
    createdAt: typeof a.createdAt === 'string' ? a.createdAt : null,
    userId: a.users_permissions_user?.data?.id ? String(a.users_permissions_user.data.id) : null,
    sessionIds: Array.isArray(a.assistant_sessions?.data)
      ? a.assistant_sessions.data.map((s: { id: string | number }) => String(s.id))
      : []
  };
}

/**
 * Whether `row` may stand as this signup's signature.
 *
 * @param email      the email being signed up with (the form's, as submitted)
 * @param notBefore  when the link was minted — a row older than that belongs
 *                   to some earlier signing, not to this one
 */
export function extendedSignatureFits(
  row: ExtendedSignatureRow | null,
  { email, notBefore, now = Date.now() }: { email: string; notBefore: number; now?: number }
): boolean {
  if (!row || row.fullAgreement !== true) return false;
  if (row.userId || row.sessionIds.length) return false;
  const norm = (s: string) => s.trim().toLowerCase();
  if (!row.email || !email || norm(row.email) !== norm(email)) return false;
  const created = row.createdAt ? Date.parse(row.createdAt) : NaN;
  if (!Number.isFinite(created) || created < notBefore || created > now + 60_000) return false;
  return true;
}

/** A row id as it may arrive from the page: digits only, or null. */
export function extendedIdOf(value: unknown): string | null {
  const s = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  return /^\d{1,12}$/.test(s) ? s : null;
}
