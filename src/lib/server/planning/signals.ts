/**
 * Project signals for planning (PLAN_PROJECT_PLANNING_BOARDS §1.1).
 *
 * Pure functions that read a `ProjectContext` and decide *what kind of advice
 * the project needs*. Deliberately dependency-free so the branching logic is
 * unit-testable without a model or a network.
 *
 * The whole point of tier 1 is that it is cheap: these signals come from the
 * context snapshot that was already built for the chat, so a quick scan costs
 * one short model call and no extra queries.
 */

import type { ProjectContext } from '../ai/projectContext.js';

/**
 * `new` — nothing has happened yet, so the useful advice is about *starting*:
 * define the first product, recruit a partner, turn values into actions.
 *
 * `established` — there is real history, so the useful advice is about
 * *advancing* what already exists: open missions nobody took, work with no
 * product to sell, forgotten timers.
 */
export type ProjectStage = 'new' | 'established';

export interface ScanSignals {
  stage: ProjectStage;
  projectName: string;
  memberCount: number;
  openMissionCount: number;
  productCount: number;
  myInProgressCount: number;
  runningTimerCount: number;
  valueCount: number;
  hasDescription: boolean;
  /** Rikma-wide counts, present once the planning extras were loaded. */
  openResourceCount: number;
  missionsInProgressCount: number;
  roleCount: number;
  hasWebsite: boolean;
  siteAnalyzed: boolean;
  /** Short, human-readable facts handed to the model as grounding. */
  facts: string[];
}

/**
 * Rikma-wide counts that only the planning snapshot has
 * (`planningContext.ts`). Declared structurally rather than imported so this
 * module stays dependency-free and free of an import cycle.
 */
export interface ExtraSignals {
  openResourceCount?: number;
  /** In-progress missions across the WHOLE rikma, not just the caller's. */
  missionsInProgressCount?: number;
  roleCount?: number;
  hasWebsite?: boolean;
  siteAnalyzed?: boolean;
}

/**
 * A project is "new" when nothing has been produced yet — no open missions, no
 * products, no work in progress, no resources requested. Team size alone does
 * not make a project established: five members who have not created anything
 * still need kickoff advice, not optimisation advice.
 *
 * `extra` matters: `ctx.myMissions` holds only the *asking member's* work, so a
 * rikma where somebody else is mid-mission reads as empty without it — and used
 * to be handed kickoff advice months into its life.
 */
export function classifyProjectStage(ctx: ProjectContext, extra: ExtraSignals = {}): ProjectStage {
  const activity =
    (ctx.openMissions?.length ?? 0) +
    (ctx.products?.length ?? 0) +
    (ctx.myMissions?.length ?? 0) +
    (extra.missionsInProgressCount ?? 0) +
    (extra.openResourceCount ?? 0);
  return activity === 0 ? 'new' : 'established';
}

/**
 * Turn a context into the signal bundle the scan prompt is grounded on.
 *
 * `facts` are phrased as neutral observations, never as instructions, and hold
 * no user-authored free text — names and descriptions stay in the delimited
 * block produced by `summarizeProjectContext`.
 */
export function buildScanSignals(ctx: ProjectContext, extra: ExtraSignals = {}): ScanSignals {
  const memberCount = ctx.members?.length ?? 0;
  const openMissionCount = ctx.openMissions?.length ?? 0;
  const productCount = ctx.products?.length ?? 0;
  const myMissions = ctx.myMissions ?? [];
  const myInProgressCount = myMissions.length;
  const runningTimerCount = myMissions.filter((m) => m.activeTimer?.isActive).length;
  const valueCount = ctx.values?.length ?? 0;
  const hasDescription = Boolean((ctx.description ?? '').trim());
  const openResourceCount = extra.openResourceCount ?? 0;
  const missionsInProgressCount = extra.missionsInProgressCount ?? myInProgressCount;
  const roleCount = extra.roleCount ?? 0;
  const hasWebsite = Boolean(extra.hasWebsite);
  const siteAnalyzed = Boolean(extra.siteAnalyzed);
  const stage = classifyProjectStage(ctx, extra);

  const facts: string[] = [
    `stage=${stage}`,
    `members=${memberCount}`,
    `open_missions=${openMissionCount}`,
    `open_resources=${openResourceCount}`,
    `products=${productCount}`,
    `missions_in_progress=${missionsInProgressCount}`,
    `my_missions_in_progress=${myInProgressCount}`,
    `running_timers=${runningTimerCount}`,
    `roles_defined=${roleCount}`,
    `declared_values=${valueCount}`,
    `has_public_description=${hasDescription}`,
    `has_website=${hasWebsite}`,
    `website_was_read=${siteAnalyzed}`
  ];

  // Observations worth surfacing explicitly — these are the hooks a good
  // direction hangs on.
  if (stage === 'established') {
    if (openMissionCount > 0) {
      facts.push(
        `${openMissionCount} mission(s) are published and still waiting for someone to take them`
      );
    }
    if (openResourceCount > 0) {
      facts.push(
        `${openResourceCount} resource(s) were requested and have not been supplied yet`
      );
    }
    if (productCount === 0 && missionsInProgressCount > 0) {
      facts.push(
        'work is happening but the project has no product defined, so nothing can be sold yet'
      );
    }
    if (missionsInProgressCount > 0 && roleCount > 0) {
      facts.push(
        'there are missions in progress and roles defined, so a chore (act) can be aimed at someone real instead of opening a new mission'
      );
    }
    if (memberCount <= 1) {
      facts.push('the project has a single member — it cannot share work or split revenue yet');
    }
  } else {
    if (!hasDescription) facts.push('there is no public description yet');
    if (valueCount === 0) facts.push('no values have been declared yet');
    if (memberCount <= 1) facts.push('the project has a single member');
  }

  if (!hasDescription && hasWebsite && !siteAnalyzed) {
    facts.push('the project has a website on file that was not read for this run');
  }

  return {
    stage,
    projectName: ctx.projectName ?? '',
    memberCount,
    openMissionCount,
    productCount,
    myInProgressCount,
    runningTimerCount,
    valueCount,
    hasDescription,
    openResourceCount,
    missionsInProgressCount,
    roleCount,
    hasWebsite,
    siteAnalyzed,
    facts
  };
}
