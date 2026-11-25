/**
 * ExhibitSandbox — the whole state of one visitor's walk through /exhibit.
 *
 * In memory only: no Strapi, no /api/send, no account, no localStorage, so a
 * visitor cannot touch a real member's data and leaves nothing for the next
 * one. `reset()` is the only way back to the start, and both the home button
 * and the idle guard call it. Every figure on screen is computed here by the
 * platform's own functions from this state (docs/inprogress/PLAN_EXHIBITION_MODE.md §2.1).
 */
import { computeMissionMatchScore, type MatchResult } from '$lib/matching/scoring';
import { computeNegoGate, type NegoGateResult, type RoundLike, type VoteLike } from '$lib/nego/negoGate';
import { memberShares, type MemberSharesResult } from '$lib/revenue/memberShares';
import { splitPreview, type PreviewRow } from '$lib/revenue/splitPreview';
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

/** One part's key — a mission and a resource may share an id (`m1` / `r1` never do, but keys stay explicit). */
export const taskKey = (task: ExhibitTask) => `${task.kind}:${task.id}`;

/**
 * One partner's consent to the plan, in the platform's own shapes: the rounds
 * of a candidacy negotiation and the votes on them. `computeNegoGate` reads
 * these exactly as the cron finalizers read an Ask's — the visitor is the
 * rikma proposing, the partner is the taker of the parts proposed to them.
 */
export interface PartnerConsent {
  rounds: RoundLike[];
  vots: VoteLike[];
}

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
  /** Partnership step: who takes which part (`taskKey` → partner id, `ME` included). */
  assignments = $state<Record<string, string>>({});
  /** Hours a counter-proposal changed (`taskKey` → hours). */
  hoursOverride = $state<Record<string, number>>({});
  /** Per partner (never `ME`): their rounds and votes on the plan. */
  consent = $state<Record<string, PartnerConsent>>({});
  /**
   * The signed partnership, kept on 1lev1 for the visitor (§7): the preview key
   * and the signup token behind the QR. Any change to the plan forgets it — a
   * new signature means a new draft.
   */
  draft = $state<{ shareKey: string; token: string } | null>(null);

  /** The rikma's partners: the visitor first, then whoever they invited. */
  circle = $derived([ME, ...this.invited]);
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
    // What the partnership creates exists only once everyone signed it.
    if (i >= 4 && !this.allSigned) return false;
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
    this.clearPlan();
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
    this.clearPlan();
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
      // Whatever they were to take is open again.
      this.assignments = Object.fromEntries(Object.entries(this.assignments).filter(([, who]) => who !== personId));
      this.consent = {};
    this.draft = null;
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

  // ── Partnership ─────────────────────────────────────────────────────

  private clearPlan() {
    this.assignments = {};
    this.hoursOverride = {};
    this.consent = {};
    this.draft = null;
  }

  hoursOf(task: ExhibitTask): number | null {
    return this.hoursOverride[taskKey(task)] ?? task.hours;
  }

  /** What taking this part is worth: approved hours × rate, or the resource's value. */
  valueOf(task: ExhibitTask): number {
    if (task.kind === 'mission') return (this.hoursOf(task) ?? 0) * (task.rate ?? 0);
    return task.value ?? 0;
  }

  ownerOf(task: ExhibitTask): string | null {
    return this.assignments[taskKey(task)] ?? null;
  }

  /** Give a part to a partner, or (`null`, or the same partner again) leave it open. */
  assign(task: ExhibitTask, who: string | null) {
    const key = taskKey(task);
    const next = { ...this.assignments };
    if (who === null || next[key] === who || !this.circle.includes(who)) delete next[key];
    else next[key] = who;
    this.assignments = next;
    this.consent = {};
    this.draft = null;
  }

  /**
   * The assistant's first draft of who takes what: every part goes to the
   * partner whose skills fit it best (`computeMissionMatchScore`), the lighter
   * load winning a tie, biggest parts first so the load evens out. A part
   * nobody in the circle fits stays open — an open mission is how the rikma
   * finds its next partner, not a gap to paper over.
   */
  suggestAssignment() {
    const load: Record<string, number> = Object.fromEntries(this.circle.map((id) => [id, 0]));
    const next: Record<string, string> = {};
    const byValue = [...this.tasks].sort((a, b) => this.valueOf(b) - this.valueOf(a));
    for (const task of byValue) {
      let best: { id: string; score: number } | null = null;
      for (const id of this.circle) {
        const skills = id === ME ? this.mySkills : (PEOPLE.find((p) => p.id === id)?.skills ?? []);
        const r = computeMissionMatchScore(
          { id: task.id, skills: task.skills, roles: [], workWays: [] },
          { skills, roles: [], workWays: [] }
        );
        if (!r.qualifies) continue;
        if (!best || r.rawScore > best.score || (r.rawScore === best.score && load[id] < load[best.id])) {
          best = { id, score: r.rawScore };
        }
      }
      if (best) {
        next[taskKey(task)] = best.id;
        load[best.id] += this.valueOf(task);
      }
    }
    // Nobody in the circle should come out empty-handed while someone else
    // holds two parts and one of them fits them too: hand that one over.
    for (const id of this.circle) {
      if (Object.values(next).includes(id)) continue;
      const theirs = this.matchesForPerson(id)
        .filter((m) => {
          const holder = next[taskKey(m.task)];
          return holder && Object.values(next).filter((h) => h === holder).length >= 2;
        })
        .sort((a, b) => b.result.rawScore - a.result.rawScore)[0];
      if (theirs) next[taskKey(theirs.task)] = id;
    }
    this.assignments = next;
    this.consent = {};
    this.draft = null;
  }

  /** Value nobody has taken yet — it stays open for the next partner. */
  openValue = $derived(
    this.tasks.filter((t) => !this.assignments[taskKey(t)]).reduce((sum, t) => sum + this.valueOf(t), 0)
  );

  /**
   * Each partner's share, by the split page's own arithmetic (`memberShares`):
   * a mission counts as a finished mission's total, a resource as a received
   * resource's. The shares are what the plan means once it is done.
   */
  shares = $derived.by((): MemberSharesResult => memberShares(this.contributions()));

  /** The rows `memberShares` / `splitPreview` read: what each partner's done parts are worth. */
  private contributions() {
    const ref = (id: string) => ({ data: { id } });
    const assigned = this.tasks.filter((t) => this.assignments[taskKey(t)]);
    const row = (t: ExhibitTask) => ({
      attributes: { total: this.valueOf(t), users_permissions_user: ref(this.assignments[taskKey(t)]) }
    });
    return {
      users: this.circle.map((id) => ({ id, attributes: { username: id } })),
      fmiData: assigned.filter((t) => t.kind === 'mission').map(row),
      rikmashes: assigned.filter((t) => t.kind === 'resource').map(row)
    };
  }

  /**
   * "Half a year later": the first sale. A round sum, about two fifths of the
   * work the rikma did — big enough to be worth splitting, never a promise.
   */
  firstSale = $derived.by(() => {
    const done = this.tasks.filter((t) => this.assignments[taskKey(t)]).reduce((s, t) => s + this.valueOf(t), 0);
    return Math.max(2000, Math.round((done * 0.4) / 500) * 500);
  });

  /**
   * Who gets what from that sale, and who hands it to whom — the sales page's
   * own preview (`splitPreview`). The visitor holds the money ("it is with
   * me", a sovereign self-report), so every transfer starts from them.
   */
  split = $derived.by((): { revach: number; rows: PreviewRow[] } =>
    splitPreview({
      ...this.contributions(),
      sales: [{ attributes: { in: this.firstSale, splited: false, users_permissions_user: { data: { id: ME } } } }]
    })
  );

  /** The parts proposed to one partner. */
  partsOf(who: string): ExhibitTask[] {
    return this.tasks.filter((t) => this.assignments[taskKey(t)] === who);
  }

  // ── Consent ─────────────────────────────────────────────────────────

  private latest(c: PartnerConsent): number {
    return c.rounds.reduce((m, r) => Math.max(m, Number(r.ordern ?? 0)), 0);
  }

  /** Send the plan: each partner gets it, and the visitor's proposing it is their yes. */
  proposePlan() {
    this.consent = Object.fromEntries(
      this.invited.map((id) => [id, { rounds: [], vots: [{ what: true, order: 0, users_permissions_user: ME }] }])
    );
  }

  /** The partner signs the standing version. */
  partnerSigns(who: string) {
    const c = this.consent[who];
    if (!c) return;
    this.consent = { ...this.consent, [who]: { ...c, vots: [...c.vots, { what: true, order: this.latest(c), users_permissions_user: who }] } };
  }

  /** The partner counters with other hours for one of their missions — a new round. */
  partnerCounters(who: string, task: ExhibitTask, hours: number) {
    const c = this.consent[who];
    if (!c) return;
    this.hoursOverride = { ...this.hoursOverride, [taskKey(task)]: hours };
    this.consent = {
      ...this.consent,
      [who]: { ...c, rounds: [...c.rounds, { ordern: this.latest(c) + 1, proposedBy: 'candidate' }] }
    };
  }

  /** The visitor accepts the standing version. */
  iAccept(who: string) {
    const c = this.consent[who];
    if (!c) return;
    this.consent = { ...this.consent, [who]: { ...c, vots: [...c.vots, { what: true, order: this.latest(c), users_permissions_user: ME }] } };
  }

  /** The visitor counters back — a new round, proposed (and so signed) by the rikma side. */
  iCounter(who: string, task: ExhibitTask, hours: number) {
    const c = this.consent[who];
    if (!c) return;
    const next = this.latest(c) + 1;
    this.hoursOverride = { ...this.hoursOverride, [taskKey(task)]: hours };
    this.consent = {
      ...this.consent,
      [who]: {
        rounds: [...c.rounds, { ordern: next, proposedBy: 'member' }],
        vots: [...c.vots, { what: true, order: next, users_permissions_user: ME }]
      }
    };
  }

  /**
   * Has this partner and the rikma signed the same version? The platform's
   * gate, with `takerApplied: false`: the parts were proposed to them, so
   * their silence is not their yes — only their own vote or counter is.
   */
  gateFor(who: string): NegoGateResult | null {
    const c = this.consent[who];
    if (!c) return null;
    return computeNegoGate({
      rounds: c.rounds,
      vots: c.vots,
      takerId: who,
      memberIds: this.circle.filter((id) => id !== who),
      takerApplied: false
    });
  }

  allSigned = $derived(this.invited.length > 0 && this.invited.every((id) => this.gateFor(id)?.approvable));
}
