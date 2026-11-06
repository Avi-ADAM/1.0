/**
 * The host's live screen during the workshop (docs/inprogress/PLAN_EVENTS_WEBINARS.md
 * §6, W4). Pure: which date is "now", and who needs a hand first.
 */

import type { RegistrationView, SessionView } from './model';
import { sessionPhase } from './sessions';

export type LiveStage = 'joinedNoAccount' | 'accountNotOnboarded' | 'onboarded' | 'notJoined';

/** The date the screen is about: the one on now, else the next, else the last that ran. */
export function pickLiveSession<T extends Pick<SessionView, 'key' | 'startsAt' | 'durationMin' | 'state'>>(
  sessions: T[],
  now: Date = new Date(),
  wanted?: string | null
): T | null {
  const live = sessions.filter((s) => s.state !== 'cancelled');
  if (wanted) {
    const w = live.find((s) => s.key === wanted);
    if (w) return w;
  }
  const on = live.find((s) => sessionPhase(s, now) === 'joinable');
  if (on) return on;
  const t = now.getTime();
  const next = live.filter((s) => Date.parse(s.startsAt) > t).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  if (next) return next;
  return live.sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))[0] ?? null;
}

export function liveStage(r: Pick<RegistrationView, 'joinedAt' | 'userId' | 'onboardingStatus'>): LiveStage {
  if (r.userId) return r.onboardingStatus === 'done' ? 'onboarded' : 'accountNotOnboarded';
  return r.joinedAt ? 'joinedNoAccount' : 'notJoined';
}

/** Who needs the host first: in the room with no account, then half-way, then done, then not here. */
const ORDER: LiveStage[] = ['joinedNoAccount', 'accountNotOnboarded', 'onboarded', 'notJoined'];

export interface LiveRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  stage: LiveStage;
  joinedAt: string | null;
  leadId: string | null;
}

export function liveRows(regs: RegistrationView[], sessionKey: string): { rows: LiveRow[]; counts: Record<LiveStage | 'total', number> } {
  const counts = { joinedNoAccount: 0, accountNotOnboarded: 0, onboarded: 0, notJoined: 0, total: 0 };
  const rows = regs
    .filter((r) => r.sessionKey === sessionKey && r.status !== 'cancelled' && r.status !== 'waitlist')
    .map((r) => {
      const stage = liveStage(r);
      counts[stage]++;
      counts.total++;
      return { id: r.id, name: r.name, email: r.email, phone: r.phone, stage, joinedAt: r.joinedAt, leadId: r.leadId };
    })
    .sort((a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage) || a.name.localeCompare(b.name));
  return { rows, counts };
}
