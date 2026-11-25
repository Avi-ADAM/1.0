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
import type { ExhibitIdea, ExhibitTask, IdeaKey, SkillKey } from './types';

export const STEPS = ['welcome', 'idea', 'connection', 'partnership', 'creation'] as const;
export type StepKey = (typeof STEPS)[number];

/** The visitor's own node in the rikma. */
export const ME = 'me';
/** What the visitor may say they bring — a few, so it stays a choice. */
export const MAX_MY_SKILLS = 3;
/** Beyond this the circle stops being a partnership you can picture. */
export const MAX_INVITED = 5;

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
  /** What the visitor brings — the visitor is a partner too, not a recruiter. */
  mySkills = $state<SkillKey[]>([]);
  /** Bumped on every reset, so components can key their local state on it. */
  round = $state(0);

  index = $derived(STEPS.indexOf(this.step));
  isFirst = $derived(this.index === 0);
  isLast = $derived(this.index === STEPS.length - 1);
  /** Parts a person can take — missions and resources, never the product. */
  tasks = $derived<ExhibitTask[]>(this.idea ? [...this.idea.missions, ...this.idea.resources] : []);

  /** Whether the story may move to `step` now — the keys and the progress thread both ask. */
  canGo(step: StepKey): boolean {
    const i = STEPS.indexOf(step);
    if (i < 0 || i > this.reached + 1) return false;
    // Nothing past the idea makes sense without one.
    if (i >= 2 && !this.idea) return false;
    // A partnership needs someone to be partners with.
    if (i >= 3 && this.invited.length === 0) return false;
    return true;
  }

  go(step: StepKey) {
    if (!this.canGo(step)) return;
    const i = STEPS.indexOf(step);
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
    this.mySkills = [];
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

  isInvited(personId: string): boolean {
    return this.invited.includes(personId);
  }

  /** Invite, or take the invitation back. Returns false when the circle is full. */
  toggleInvite(personId: string): boolean {
    if (this.isInvited(personId)) {
      this.invited = this.invited.filter((id) => id !== personId);
      return true;
    }
    if (this.invited.length >= MAX_INVITED || !PEOPLE.some((p) => p.id === personId)) return false;
    this.invited = [...this.invited, personId];
    return true;
  }

  /** Pick or drop something the visitor brings. Returns false when the hand is full. */
  toggleMySkill(skill: SkillKey): boolean {
    if (this.mySkills.includes(skill)) {
      this.mySkills = this.mySkills.filter((s) => s !== skill);
      return true;
    }
    if (this.mySkills.length >= MAX_MY_SKILLS) return false;
    this.mySkills = [...this.mySkills, skill];
    return true;
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

  /**
   * The parts this person could take, with why (the skills that matched).
   * `ME` is the visitor, scored with the skills they said they bring.
   */
  matchesForPerson(personId: string): { task: ExhibitTask; result: MatchResult }[] {
    const p = personId === ME ? { skills: this.mySkills } : PEOPLE.find((x) => x.id === personId);
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
