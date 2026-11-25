/**
 * ExhibitSandbox — the whole state of one visitor's walk through /exhibit.
 *
 * In memory only: no Strapi, no /api/send, no account, no localStorage, so a
 * visitor cannot touch a real member's data and leaves nothing for the next
 * one. `reset()` is the only way back to the start, and both the home button
 * and the idle guard call it. Every figure on screen is computed here by the
 * platform's own functions from this state (docs/tbd/PLAN_EXHIBITION_MODE.md §2.1).
 */
import { computeMissionMatchScore, type MatchResult } from '$lib/matching/scoring';
import { ideaFromCustomText, ideaFromPreview, ideaFromTemplate } from './fixtures/ideas';
import { closestTemplate } from './fixtures/match';
import { PEOPLE } from './fixtures/people';
import type { VisionPreview } from '$lib/vision/preview';
import type { ExhibitIdea, ExhibitTask, IdeaKey } from './types';

export const STEPS = ['welcome', 'idea', 'connection', 'partnership', 'creation'] as const;
export type StepKey = (typeof STEPS)[number];

export interface TaskMatch {
  personId: string;
  result: MatchResult;
}

export class ExhibitSandbox {
  step = $state<StepKey>('welcome');
  /** Furthest step reached — the progress thread lets the visitor jump back to any of them. */
  reached = $state(0);
  idea = $state<ExhibitIdea | null>(null);
  /** People the visitor invited into the rikma (Connection step). */
  invited = $state<string[]>([]);
  /** Bumped on every reset, so components can key their local state on it. */
  round = $state(0);

  index = $derived(STEPS.indexOf(this.step));
  isFirst = $derived(this.index === 0);
  isLast = $derived(this.index === STEPS.length - 1);
  /** Parts a person can take — missions and resources, never the product. */
  tasks = $derived<ExhibitTask[]>(this.idea ? [...this.idea.missions, ...this.idea.resources] : []);

  go(step: StepKey) {
    const i = STEPS.indexOf(step);
    if (i < 0 || i > this.reached + 1) return;
    // Nothing past the idea makes sense without one.
    if (i >= 2 && !this.idea) return;
    this.step = step;
    if (i > this.reached) this.reached = i;
  }

  next() {
    if (!this.isLast) this.go(STEPS[this.index + 1]);
  }

  back() {
    if (!this.isFirst) this.go(STEPS[this.index - 1]);
  }

  reset() {
    this.step = 'welcome';
    this.reached = 0;
    this.idea = null;
    this.invited = [];
    this.round++;
  }

  /** A ready idea. Choosing again replaces it and forgets what grew from the old one. */
  chooseTemplate(key: IdeaKey) {
    this.setIdea(ideaFromTemplate(key));
  }

  /** The visitor's own words, answered by the nearest template (no network). */
  chooseCustomLocal(text: string) {
    this.setIdea(ideaFromCustomText(text, closestTemplate(text)));
  }

  /** The visitor's own words, answered by a live assistant draft. */
  chooseCustomDraft(text: string, preview: VisionPreview) {
    this.setIdea(ideaFromPreview(preview, text));
  }

  private setIdea(idea: ExhibitIdea) {
    this.idea = idea;
    this.invited = [];
    // A new idea starts a new story: later steps are unreached again.
    this.reached = Math.min(this.reached, STEPS.indexOf('idea'));
  }

  /** Who could take this part, best first — the platform's own matching. */
  matchesForTask(task: ExhibitTask): TaskMatch[] {
    return PEOPLE.map((p) => ({
      personId: p.id,
      result: computeMissionMatchScore(
        { id: task.id, skills: task.skills, roles: [], workWays: [] },
        { skills: p.skills, roles: [], workWays: [] }
      )
    }))
      .filter((m) => m.result.qualifies)
      .sort((a, b) => b.result.rawScore - a.result.rawScore);
  }

  /** The parts this person could take, with why (the skills that matched). */
  matchesForPerson(personId: string): { task: ExhibitTask; result: MatchResult }[] {
    const p = PEOPLE.find((x) => x.id === personId);
    if (!p) return [];
    return this.tasks
      .map((task) => ({
        task,
        result: computeMissionMatchScore(
          { id: task.id, skills: task.skills, roles: [], workWays: [] },
          { skills: p.skills, roles: [], workWays: [] }
        )
      }))
      .filter((m) => m.result.qualifies);
  }
}
