/**
 * The /exhibit sandbox's shapes (docs/tbd/PLAN_EXHIBITION_MODE.md §2).
 *
 * Everything the kiosk shows is computed from these by the platform's own pure
 * functions — `boardsToVisionPreview`, `computeMissionMatchScore`, and later
 * `memberShares` / `splitPreview` / `computeNegoGate`. Nothing here is stored,
 * nothing is sent to Strapi.
 */

/** The fair's own small skill vocabulary. Labels live in `exhibit.skills.*`. */
export const SKILLS = [
  'design',
  'illustration',
  'painting',
  'photo',
  'video',
  'music',
  'writing',
  'community',
  'events',
  'ceramics',
  'carpentry',
  'sewing',
  'cooking',
  'marketing',
  'tech',
  'fixing',
  'teaching'
] as const;
export type SkillKey = (typeof SKILLS)[number];

export const IDEA_KEYS = ['mural', 'book', 'repair', 'fashion', 'festival', 'ceramics'] as const;
export type IdeaKey = (typeof IDEA_KEYS)[number];

export type TaskKind = 'mission' | 'resource' | 'product';

/**
 * One part of the idea someone can take. `label` is an i18n key when `i18n`
 * is true (a template), or the assistant's own words when false (an AI draft).
 */
export interface ExhibitTask {
  id: string;
  kind: TaskKind;
  label: string;
  i18n: boolean;
  /** Missions: estimated hours. */
  hours: number | null;
  /** Missions: hourly rate, ₪. */
  rate: number | null;
  /** Missions: hours × rate. Resources: what bringing it is worth. ₪. */
  value: number | null;
  /** Missions: share of the missions' total value, 0–100 (boardsToVisionPreview). */
  share: number | null;
  /** What a partner needs to take it — what the matching scores against. */
  skills: SkillKey[];
}

export interface ExhibitIdea {
  key: IdeaKey | 'custom';
  /** i18n key (template) or the visitor's own text (custom). */
  title: string;
  i18n: boolean;
  /** Where the parts came from: a ready template, or a live assistant draft. */
  source: 'template' | 'ai';
  missions: ExhibitTask[];
  resources: ExhibitTask[];
  products: ExhibitTask[];
}

export interface ExhibitPerson {
  id: string;
  skills: SkillKey[];
  /** Portrait tint, a hue in degrees — warm, natural range. */
  hue: number;
}
