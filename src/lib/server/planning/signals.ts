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
  /** Short, human-readable facts handed to the model as grounding. */
  facts: string[];
}

/**
 * A project is "new" when nothing has been produced yet — no open missions, no
 * products, no work in progress. Team size alone does not make a project
 * established: five members who have not created anything still need kickoff
 * advice, not optimisation advice.
 */
export function classifyProjectStage(ctx: ProjectContext): ProjectStage {
  const activity =
    (ctx.openMissions?.length ?? 0) +
    (ctx.products?.length ?? 0) +
    (ctx.myMissions?.length ?? 0);
  return activity === 0 ? 'new' : 'established';
}

/**
 * Turn a context into the signal bundle the scan prompt is grounded on.
 *
 * `facts` are phrased as neutral observations, never as instructions, and hold
 * no user-authored free text — names and descriptions stay in the delimited
 * block produced by `summarizeProjectContext`.
 */
export function buildScanSignals(ctx: ProjectContext): ScanSignals {
  const memberCount = ctx.members?.length ?? 0;
  const openMissionCount = ctx.openMissions?.length ?? 0;
  const productCount = ctx.products?.length ?? 0;
  const myMissions = ctx.myMissions ?? [];
  const myInProgressCount = myMissions.length;
  const runningTimerCount = myMissions.filter((m) => m.activeTimer?.isActive).length;
  const valueCount = ctx.values?.length ?? 0;
  const hasDescription = Boolean((ctx.description ?? '').trim());
  const stage = classifyProjectStage(ctx);

  const facts: string[] = [
    `stage=${stage}`,
    `members=${memberCount}`,
    `open_missions=${openMissionCount}`,
    `products=${productCount}`,
    `missions_in_progress=${myInProgressCount}`,
    `running_timers=${runningTimerCount}`,
    `declared_values=${valueCount}`,
    `has_public_description=${hasDescription}`
  ];

  // Observations worth surfacing explicitly — these are the hooks a good
  // direction hangs on.
  if (stage === 'established') {
    if (openMissionCount > 0) {
      facts.push(
        `${openMissionCount} mission(s) are published and still waiting for someone to take them`
      );
    }
    if (productCount === 0 && myInProgressCount > 0) {
      facts.push(
        'work is happening but the project has no product defined, so nothing can be sold yet'
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
    facts
  };
}
