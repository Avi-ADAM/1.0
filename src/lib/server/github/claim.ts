/**
 * A member's claim for work they did on GitHub (PLAN_CODE_RIKMA S4, §4.2).
 *
 * The claim is hours, not lines: the member states how long the PR or the
 * review took and which of their missions it belongs to, and the hours are
 * filed exactly like a timer's — onto a saved timer that carries the PR's link
 * as evidence, then through `fileHours` into the approval the rikma signs
 * (`Finiapruval`, restime, counter). Only approved hours move a share.
 *
 * Nothing the client sends is trusted beyond the numbers it is allowed to
 * choose. Re-checked here, against GitHub and Strapi:
 *  - the PR's repository is connected, and active, in *this* rikma;
 *  - the caller's linked GitHub account is the PR's author (and the PR is
 *    merged) — or one of its counted reviewers;
 *  - the mission is the caller's own, in this rikma, and still open;
 *  - the same work has not been claimed by them already.
 *
 * The timer is never the mission's active one (`activeMesimabetahalich` stays
 * empty), so a claim cannot stop or overwrite a timer the member has running.
 */

import { env } from '$env/dynamic/private';
import { githubAppConfig } from './config.js';
import { getPull, listPullReviews } from './client.js';
import { fileHours, type FileHoursResult } from '$lib/server/timers/fileHours.js';
import { resolveRate } from '$lib/timers/rate.js';
import { totalHours } from '$lib/timers/intervals.js';
import { parseSaveLinks } from '$lib/timers/saveLinks.js';
import { parseGithubRef, sameGithubRef } from '$lib/github/refs.js';
import {
  claimIntervals,
  claimNote,
  claimOfTimer,
  countedReviews,
  isValidClaimHours,
  toPull,
  type ContributionKind
} from '$lib/github/pulls.js';

type Fetch = typeof globalThis.fetch;

// Not service.ts: that module imports the action registry, and this one is
// imported by an action config — the cycle would load half a registry.
const adminToken = () => (env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');

type Strapi = { execute: (qid: string, vars: any, jwt?: string, fetch?: Fetch) => Promise<any> };

export class ClaimError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export interface ClaimInput {
  projectId: string;
  missionId: string;
  url: string;
  kind: ContributionKind;
  hours: number;
  note: string;
}

export interface ClaimContext {
  userId: string;
  jwt: string;
  fetch: Fetch;
}

/** Has this member already claimed this work? Their saved claim timers carry the head line and the link. */
export function alreadyClaimed(
  timers: any[],
  userId: string,
  kind: ContributionKind,
  pull: { owner: string; repo: string; number: number }
): boolean {
  const ref = { owner: pull.owner, repo: pull.repo, kind: 'pull' as const, number: pull.number };
  return timers.some((t) => {
    const a = t?.attributes ?? {};
    if (String(a.users_permissions_user?.data?.id) !== userId) return false;
    const claim = claimOfTimer(a.saveText, parseSaveLinks(a.saveLinks));
    const claimed = claim ? parseGithubRef(claim.url) : null;
    return !!claim && claim.kind === kind && !!claimed && sameGithubRef(claimed, ref);
  });
}

export async function claimGithubWork(
  input: ClaimInput,
  ctx: ClaimContext,
  strapi: Strapi
): Promise<FileHoursResult & { hours: number; timerId: string | null }> {
  const cfg = githubAppConfig();
  if (!cfg) throw new ClaimError('notConfigured');

  if (input.kind !== 'pull' && input.kind !== 'review') throw new ClaimError('invalid');
  if (!isValidClaimHours(input.hours)) throw new ClaimError('invalidHours');
  const ref = parseGithubRef(input.url);
  if (!ref || ref.kind !== 'pull') throw new ClaimError('invalid');

  const token = adminToken();
  const [reposRes, userRes, timersRes, missionRes] = await Promise.all([
    strapi.execute('githubProjectRepos', { pid: input.projectId }, token, ctx.fetch),
    strapi.execute('githubUserById', { uid: ctx.userId }, token, ctx.fetch),
    strapi.execute('githubProjectLinkedTimers', { pid: input.projectId }, token, ctx.fetch),
    strapi.execute('110getMissionForTimerSave', { mId: input.missionId }, ctx.jwt, ctx.fetch)
  ]);

  // The repository, connected and live in this rikma.
  const row = (reposRes?.data?.projectRepos?.data ?? [])
    .map((r: any) => r.attributes ?? {})
    .find(
      (a: any) =>
        String(a.owner).toLowerCase() === ref.owner.toLowerCase() &&
        String(a.name).toLowerCase() === ref.repo.toLowerCase()
    );
  if (!row || !row.installationId || (row.status && row.status !== 'active')) throw new ClaimError('notConnected');
  const repo = { owner: String(row.owner), name: String(row.name) };

  // Who the caller is on GitHub.
  const githubId = userRes?.data?.usersPermissionsUser?.data?.attributes?.githubId;
  if (!githubId) throw new ClaimError('notLinked');

  // The mission: theirs, here, open.
  const mission = missionRes?.data?.mesimabetahalich?.data;
  const at = mission?.attributes;
  if (
    !at ||
    String(at.project?.data?.id) !== String(input.projectId) ||
    String(at.users_permissions_user?.data?.id) !== String(ctx.userId)
  ) {
    throw new ClaimError('notYourMission');
  }

  // The work, as GitHub records it.
  const json = await getPull(cfg, String(row.installationId), repo, ref.number, ctx.fetch);
  const pull = json ? toPull(json, repo) : null;
  if (!pull) throw new ClaimError('notFound');

  let end: string;
  if (input.kind === 'pull') {
    if (pull.authorId !== String(githubId)) throw new ClaimError('notYourWork');
    if (!pull.mergedAt) throw new ClaimError('notMerged');
    end = pull.mergedAt;
  } else {
    const reviews = await listPullReviews(cfg, String(row.installationId), repo, ref.number, ctx.fetch);
    const mine = countedReviews(reviews, pull.authorId).find((r) => r.reviewerId === String(githubId));
    if (!mine) throw new ClaimError('notYourWork');
    end = mine.submittedAt || new Date().toISOString();
  }

  const timers: any[] = timersRes?.data?.timers?.data ?? [];
  if (alreadyClaimed(timers, String(ctx.userId), input.kind, pull)) throw new ClaimError('alreadyClaimed');

  // The hours, laid out as intervals that end when the work landed.
  const intervals = claimIntervals(end, input.hours);
  if (!intervals.length) throw new ClaimError('invalidHours');
  const hours = totalHours(intervals);
  const rate = resolveRate(null, at.perhour);
  const saveText = claimNote(input.kind, pull, String(input.note ?? '').slice(0, 1000));

  const created = await strapi.execute(
    'githubCreateClaimTimer',
    {
      missionId: String(input.missionId),
      userId: String(ctx.userId),
      projectId: String(input.projectId),
      start: intervals[0].start,
      rate,
      timers: intervals,
      totalHours: hours,
      saveText,
      saveLinks: pull.url
    },
    token,
    ctx.fetch
  );
  const timerId = created?.data?.createTimer?.data?.id;
  if (timerId == null) throw new ClaimError('failed');

  const filed = await fileHours({
    strapi,
    context: { userId: String(ctx.userId), jwt: ctx.jwt, fetch: ctx.fetch },
    missionId: String(input.missionId),
    at,
    hours,
    rate,
    saveText,
    files: [],
    intervals,
    timerId: String(timerId)
  });

  return { ...filed, hours, timerId: String(timerId) };
}
