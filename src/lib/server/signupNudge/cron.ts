/**
 * One thank-you mail to whoever signed on the way into the site and stopped
 * before creating an account.
 *
 * Each row is claimed before its mail goes out, so a crash or a second run can
 * never send it twice: at most one mail per signature, even if that one fails.
 */
import { mintLink } from './token';
import { buildNudgeMail } from './mail';

const HOUR = 60 * 60 * 1000;
/** Time to finish signing up on their own before we say anything. */
const WAIT_MS = HOUR;
/** Past this, a "pick up where you stopped" no longer reads as one. */
const MAX_AGE_MS = 14 * 24 * HOUR;
const BATCH = 50;

export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;
type Send = (to: string, mail: { subject: string; html: string; text: string }) => Promise<{ ok: boolean }>;

export interface NudgeReport {
  skipped?: boolean;
  reason?: string;
  dry: boolean;
  candidates: number;
  sent: number;
  hasAccount: number;
  failed: number;
  /** Ids only: this report must not carry anyone's address. */
  wouldSend: string[];
}

export async function runSignupNudge({
  run,
  send,
  origin,
  dry,
  now = new Date(),
  mint = mintLink
}: {
  run: Run;
  send: Send;
  origin: string;
  dry: boolean;
  now?: Date;
  mint?: typeof mintLink;
}): Promise<NudgeReport> {
  const report: NudgeReport = { dry, candidates: 0, sent: 0, hasAccount: 0, failed: 0, wouldSend: [] };

  const found = await run('chezinsAwaitingNudge', {
    after: new Date(now.getTime() - MAX_AGE_MS).toISOString(),
    before: new Date(now.getTime() - WAIT_MS).toISOString(),
    limit: BATCH
  });
  const rows = found?.data?.chezins?.data;
  if (found?.errors || !Array.isArray(rows)) {
    return { ...report, skipped: true, reason: 'chezin nudge fields not live' };
  }
  report.candidates = rows.length;

  for (const row of rows) {
    const id = String(row.id);
    const { name, email, signupLang } = row.attributes ?? {};
    if (!email) continue;

    // The relation can be missing on an account that does exist, so the
    // address is checked as well. Unsure means no mail.
    const account = await run('chezinEmailHasAccount', { email });
    const accounts = account?.data?.usersPermissionsUsers?.data;
    if (account?.errors || !Array.isArray(accounts)) {
      report.failed++;
      continue;
    }
    const registered = accounts.length > 0;
    if (registered) report.hasAccount++;

    if (dry) {
      if (!registered) report.wouldSend.push(id);
      continue;
    }

    const claim = await run('chezinClaimNudge', { id, at: now.toISOString() });
    if (claim?.errors || !claim?.data?.updateChezin?.data?.id) {
      report.failed++;
      continue;
    }
    if (registered) continue;

    const mail = buildNudgeMail({
      name: name ?? '',
      lang: signupLang ?? null,
      continueUrl: `${origin}/signup?c=${encodeURIComponent(mint(id, 'continue'))}`,
      stopUrl: `${origin}/signup/stop-mail?t=${encodeURIComponent(mint(id, 'stop'))}`
    });
    const result = await send(email, mail);
    if (result.ok) report.sent++;
    else report.failed++;
  }
  return report;
}
