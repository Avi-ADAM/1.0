/**
 * The six ready ideas, as the planner's own board rows.
 *
 * Each template is written in the shape `generateSeedPlan` returns
 * (`{ kind, name, nhours, valph }`) and goes through `boardsToVisionPreview`,
 * the function /vision runs on a live draft — so a ready idea and an assistant
 * draft reach the screen by the same road, and the shares are the platform's
 * arithmetic, not numbers typed here. Row names are i18n keys
 * (`exhibit.ideas.<key>.<id>`), resolved at render time.
 */
import { boardsToVisionPreview, type VisionPreview } from '$lib/vision/preview';
import type { ExhibitIdea, ExhibitTask, IdeaKey, SkillKey } from '../types';
import { inferSkills } from './match';

interface MissionRow {
  id: string;
  hours: number;
  rate: number;
  skills: SkillKey[];
}
interface ResourceRow {
  id: string;
  value: number;
  skills: SkillKey[];
}
interface Template {
  missions: MissionRow[];
  resources: ResourceRow[];
  products: string[];
}

export const TEMPLATES: Record<IdeaKey, Template> = {
  mural: {
    missions: [
      { id: 'm1', hours: 30, rate: 120, skills: ['design', 'illustration'] },
      { id: 'm2', hours: 60, rate: 100, skills: ['painting', 'illustration'] },
      { id: 'm3', hours: 20, rate: 90, skills: ['community', 'events'] },
      { id: 'm4', hours: 15, rate: 110, skills: ['photo', 'video'] }
    ],
    resources: [
      { id: 'r1', value: 2500, skills: ['carpentry'] },
      { id: 'r2', value: 1800, skills: ['painting'] }
    ],
    products: ['p1']
  },
  book: {
    missions: [
      { id: 'm1', hours: 40, rate: 110, skills: ['writing'] },
      { id: 'm2', hours: 70, rate: 120, skills: ['illustration', 'design'] },
      { id: 'm3', hours: 20, rate: 100, skills: ['design', 'tech'] },
      { id: 'm4', hours: 25, rate: 90, skills: ['marketing', 'events'] }
    ],
    resources: [
      { id: 'r1', value: 6000, skills: ['design'] },
      { id: 'r2', value: 1200, skills: ['events'] }
    ],
    products: ['p1']
  },
  repair: {
    missions: [
      { id: 'm1', hours: 40, rate: 100, skills: ['carpentry', 'fixing'] },
      { id: 'm2', hours: 40, rate: 110, skills: ['fixing', 'tech'] },
      { id: 'm3', hours: 30, rate: 80, skills: ['cooking'] },
      { id: 'm4', hours: 25, rate: 90, skills: ['community', 'events'] }
    ],
    resources: [
      { id: 'r1', value: 3000, skills: ['carpentry'] },
      { id: 'r2', value: 4000, skills: ['community'] }
    ],
    products: ['p1']
  },
  fashion: {
    missions: [
      { id: 'm1', hours: 50, rate: 120, skills: ['design', 'sewing'] },
      { id: 'm2', hours: 80, rate: 90, skills: ['sewing'] },
      { id: 'm3', hours: 20, rate: 120, skills: ['photo'] },
      { id: 'm4', hours: 30, rate: 100, skills: ['marketing', 'tech'] }
    ],
    resources: [
      { id: 'r1', value: 3500, skills: ['sewing'] },
      { id: 'r2', value: 800, skills: ['sewing'] }
    ],
    products: ['p1']
  },
  festival: {
    missions: [
      { id: 'm1', hours: 40, rate: 110, skills: ['music', 'events'] },
      { id: 'm2', hours: 50, rate: 100, skills: ['events', 'community'] },
      { id: 'm3', hours: 30, rate: 90, skills: ['cooking'] },
      { id: 'm4', hours: 25, rate: 100, skills: ['design', 'marketing'] }
    ],
    resources: [
      { id: 'r1', value: 4000, skills: ['music'] },
      { id: 'r2', value: 2000, skills: ['community'] }
    ],
    products: ['p1']
  },
  ceramics: {
    missions: [
      { id: 'm1', hours: 60, rate: 120, skills: ['ceramics', 'teaching'] },
      { id: 'm2', hours: 30, rate: 100, skills: ['carpentry', 'design'] },
      { id: 'm3', hours: 20, rate: 100, skills: ['photo', 'marketing'] },
      { id: 'm4', hours: 25, rate: 90, skills: ['community'] }
    ],
    resources: [
      { id: 'r1', value: 8000, skills: ['ceramics'] },
      { id: 'r2', value: 1500, skills: ['ceramics'] }
    ],
    products: ['p1']
  }
};

/** What a resource the assistant named is worth when it gave no figure. */
export const DEFAULT_RESOURCE_VALUE = 2000;

const ns = (key: IdeaKey, id: string) => `exhibit.ideas.${key}.${id}`;

function blank(kind: ExhibitTask['kind'], id: string, label: string, i18n: boolean): ExhibitTask {
  return { id, kind, label, i18n, hours: null, rate: null, value: null, share: null, skills: [] };
}

/** A ready idea, through the same preview function a live draft takes. */
export function ideaFromTemplate(key: IdeaKey): ExhibitIdea {
  const t = TEMPLATES[key];
  const preview = boardsToVisionPreview([
    {
      items: [
        ...t.missions.map((m) => ({ kind: 'mission', name: ns(key, m.id), nhours: m.hours, valph: m.rate })),
        ...t.resources.map((r) => ({ kind: 'resource', name: ns(key, r.id) })),
        ...t.products.map((p) => ({ kind: 'product', name: ns(key, p) }))
      ]
    }
  ]);

  const missionRow = new Map(t.missions.map((m) => [ns(key, m.id), m]));
  const resourceRow = new Map(t.resources.map((r) => [ns(key, r.id), r]));

  return {
    key,
    title: ns(key, 'title'),
    i18n: true,
    source: 'template',
    basedOn: key,
    missions: preview.missions.map((m) => {
      const row = missionRow.get(m.name)!;
      return { ...blank('mission', row.id, m.name, true), hours: m.hours, rate: m.rate, value: m.value, share: m.share, skills: row.skills };
    }),
    resources: preview.resources.map((name) => {
      const row = resourceRow.get(name)!;
      return { ...blank('resource', row.id, name, true), value: row.value, skills: row.skills };
    }),
    products: preview.products.map((name, i) => blank('product', `p${i + 1}`, name, true))
  };
}

/**
 * A live assistant draft (`/api/vision-preview`). The planner names parts but
 * not the skills our nine people are tagged with, so those are inferred from
 * the names; a part nobody's words fit gets `community`, which three people
 * hold — every part should light at least one thread.
 */
export function ideaFromPreview(preview: VisionPreview, text: string): ExhibitIdea {
  const skillsOf = (name: string): SkillKey[] => {
    const s = inferSkills(name);
    return s.length ? s : ['community'];
  };
  return {
    key: 'custom',
    title: text,
    i18n: false,
    source: 'ai',
    missions: preview.missions.map((m, i) => ({
      ...blank('mission', `m${i + 1}`, m.name, false),
      hours: m.hours,
      rate: m.rate,
      value: m.value,
      share: m.share,
      skills: skillsOf(m.name)
    })),
    resources: preview.resources.map((name, i) => ({
      ...blank('resource', `r${i + 1}`, name, false),
      value: DEFAULT_RESOURCE_VALUE,
      skills: skillsOf(name)
    })),
    products: preview.products.map((name, i) => blank('product', `p${i + 1}`, name, false))
  };
}

/** The visitor's own idea, answered by the nearest template's parts. */
export function ideaFromCustomText(text: string, nearest: IdeaKey): ExhibitIdea {
  return { ...ideaFromTemplate(nearest), key: 'custom', title: text, i18n: false };
}
