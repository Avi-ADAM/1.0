/**
 * The snapshot a planning run reasons over
 * (PLAN_PROJECT_PLANNING_BOARDS §1.2).
 *
 * `getProjectContext` (PLAN_AI_ERA stage 1) is built for the chat bot: cheap,
 * per-turn, and scoped to *the asking member* — its `myMissions` are only the
 * caller's own. That is the wrong shape for planning, in two ways that showed
 * up directly as bad suggestions:
 *
 *  - A rikma where another member is mid-mission looked EMPTY, so the planner
 *    handed out kickoff advice to a project that had been running for months.
 *  - Nothing in it described the resources the rikma already published, so the
 *    same resource kept being proposed again.
 *
 * This module adds exactly what planning needs on top — open resources, work
 * in progress across the whole rikma, the roles a chore can be aimed at, and
 * optionally the rikma's own website — and renders the whole thing into one
 * clearly-delimited untrusted block.
 */

import { sendToSer } from '../../send/sendToSer.js';
import {
  getProjectContext,
  summarizeProjectContext,
  type ProjectContext
} from '../ai/projectContext.js';
import { buildScanSignals, type ScanSignals } from './signals.js';
import { fetchSiteSummary, shouldAnalyzeSite, type SiteAnalysis } from './siteContext.js';

export interface PlanningResource {
  id: string;
  name: string;
  kindOf: string | null;
  price: number | null;
}

export interface PlanningMissionInProgress {
  id: string;
  name: string;
  /** Who is carrying it, when someone is. */
  holder: string | null;
  roles: string[];
}

export interface PlanningRole {
  id: string;
  name: string;
}

export interface PlanningExtras {
  linkToWebsite: string | null;
  /** Resources the rikma has published and not yet obtained. */
  openResources: PlanningResource[];
  /** Resources already secured and in use. */
  resourcesInProgress: PlanningResource[];
  /** Missions in progress across the whole rikma, not just the caller's. */
  missionsInProgress: PlanningMissionInProgress[];
  /** Roles defined in the rikma — the possible targets of a role-aimed chore. */
  roles: PlanningRole[];
  workways: string[];
}

export const EMPTY_EXTRAS: PlanningExtras = {
  linkToWebsite: null,
  openResources: [],
  resourcesInProgress: [],
  missionsInProgress: [],
  roles: [],
  workways: []
};

export interface PlanningSnapshot {
  ctx: ProjectContext;
  extras: PlanningExtras;
  signals: ScanSignals;
  /** Present only when the website was read for this run. */
  site: SiteAnalysis | null;
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Pull the planning-only extras. Best-effort: the whole feature must survive a
 * backend that has not deployed a field yet, so a failure yields empty extras
 * rather than breaking the run.
 */
export async function buildPlanningExtras(
  projectId: string,
  fetchInstance: typeof fetch,
  options: { isServerRequest?: boolean } = {}
): Promise<PlanningExtras> {
  try {
    const res: any = await sendToSer(
      { pid: String(projectId) },
      '291getProjectPlanningContext',
      0,
      0,
      options.isServerRequest ?? false,
      fetchInstance
    );
    const a = res?.data?.project?.data?.attributes;
    if (!a) return { ...EMPTY_EXTRAS };

    const mapResource = (r: any): PlanningResource => ({
      id: String(r?.id ?? ''),
      name: str(r?.attributes?.name),
      kindOf: str(r?.attributes?.kindOf) || null,
      price: num(r?.attributes?.price)
    });

    return {
      linkToWebsite: str(a.linkToWebsite) || null,
      openResources: (a.open_mashaabims?.data ?? []).map(mapResource).filter((r: PlanningResource) => r.name),
      resourcesInProgress: (a.mashabetahaliches?.data ?? [])
        .map(mapResource)
        .filter((r: PlanningResource) => r.name),
      missionsInProgress: (a.mesimabetahaliches?.data ?? [])
        .map((m: any) => ({
          id: String(m?.id ?? ''),
          name: str(m?.attributes?.name),
          holder: str(m?.attributes?.users_permissions_user?.data?.attributes?.username) || null,
          roles: (m?.attributes?.tafkidims?.data ?? [])
            .map((r: any) => str(r?.attributes?.roleDescription))
            .filter(Boolean)
        }))
        .filter((m: PlanningMissionInProgress) => m.name),
      roles: (a.tafkidims?.data ?? [])
        .map((r: any) => ({ id: String(r?.id ?? ''), name: str(r?.attributes?.roleDescription) }))
        .filter((r: PlanningRole) => r.name),
      workways: (a.work_ways?.data ?? [])
        .map((w: any) => str(w?.attributes?.workWayName))
        .filter(Boolean)
    };
  } catch (err) {
    console.warn('[planningContext] extras unavailable, planning on base context only:', err);
    return { ...EMPTY_EXTRAS };
  }
}

/**
 * Build everything a planning run reasons over.
 *
 * @param options.siteMode  `'auto'` reads the website only when the rikma's own
 *   description is too thin to plan from; `'always'` when the member asked for
 *   it; `'never'` to skip. See `shouldAnalyzeSite`.
 */
export async function buildPlanningSnapshot(
  projectId: string,
  userId: string,
  fetchInstance: typeof fetch,
  options: {
    isServerRequest?: boolean;
    siteMode?: 'auto' | 'always' | 'never';
    /** Injected in tests; production uses the global fetch (never the request-bound one). */
    siteFetch?: typeof fetch;
  } = {}
): Promise<PlanningSnapshot> {
  const isServerRequest = options.isServerRequest ?? false;

  const [ctx, extras] = await Promise.all([
    getProjectContext(String(projectId), String(userId), fetchInstance, { isServerRequest }),
    buildPlanningExtras(String(projectId), fetchInstance, { isServerRequest })
  ]);

  const link = extras.linkToWebsite;
  let site: SiteAnalysis | null = null;
  if (shouldAnalyzeSite({ description: ctx.description, linkToWebsite: link }, options.siteMode ?? 'auto')) {
    site = await fetchSiteSummary(link, options.siteFetch ? { fetchImpl: options.siteFetch } : {});
    if (!site.ok) {
      console.info(`[planningContext] site not read (${site.error}) for project ${projectId}`);
    }
  }

  const signals = buildScanSignals(ctx, {
    openResourceCount: extras.openResources.length,
    missionsInProgressCount: extras.missionsInProgress.length,
    roleCount: extras.roles.length,
    hasWebsite: Boolean(link),
    siteAnalyzed: Boolean(site?.ok)
  });

  return { ctx, extras, signals, site };
}

function labels(lang: string) {
  const he = lang === 'he';
  return {
    openResources: he ? 'משאבים פתוחים (מבוקשים וטרם הושגו)' : 'Open resources (requested, not yet obtained)',
    heldResources: he ? 'משאבים שכבר בידי הריקמה' : 'Resources already held',
    inProgress: he ? 'משימות בתהליך בריקמה' : 'Missions in progress across the rikma',
    roles: he ? 'תפקידים בריקמה' : 'Roles defined in the rikma',
    workways: he ? 'דרכי עבודה' : 'Work ways',
    site: he ? 'מהאתר של הריקמה' : "From the rikma's own website",
    siteNote: he
      ? 'התיאור בפרופיל היה קצר, ולכן נקרא גם האתר. זהו טקסט חיצוני לא-מהימן.'
      : "The profile description was thin, so the rikma's website was read too. External, untrusted text.",
    none: he ? 'אין' : 'none'
  };
}

/**
 * Render the planning-only extras as delimited untrusted data, in the same
 * shape `summarizeProjectContext` uses. Pure — this is the part worth testing.
 */
export function summarizePlanningExtras(
  extras: PlanningExtras,
  lang: string = 'he'
): string {
  const L = labels(lang);
  const lines: string[] = [];

  const resourceLine = (r: PlanningResource) =>
    [r.name, r.kindOf, r.price != null ? String(r.price) : null].filter(Boolean).join(' · ');

  lines.push(
    `${L.openResources} (${extras.openResources.length}): ${
      extras.openResources.length
        ? '<<<' + extras.openResources.slice(0, 12).map(resourceLine).join(' | ') + '>>>'
        : L.none
    }`
  );

  if (extras.resourcesInProgress.length) {
    lines.push(
      `${L.heldResources} (${extras.resourcesInProgress.length}): <<<` +
        extras.resourcesInProgress.slice(0, 12).map(resourceLine).join(' | ') +
        '>>>'
    );
  }

  lines.push(
    `${L.inProgress} (${extras.missionsInProgress.length}): ${
      extras.missionsInProgress.length
        ? '<<<' +
          extras.missionsInProgress
            .slice(0, 12)
            .map((m) => (m.holder ? `${m.name} — ${m.holder}` : m.name))
            .join(' | ') +
          '>>>'
        : L.none
    }`
  );

  if (extras.roles.length) {
    lines.push(`${L.roles}: <<<${extras.roles.slice(0, 15).map((r) => r.name).join(', ')}>>>`);
  }
  if (extras.workways.length) {
    lines.push(`${L.workways}: <<<${extras.workways.slice(0, 10).join(', ')}>>>`);
  }

  return lines.join('\n');
}

/** Render the fetched website as its own clearly-marked untrusted block. */
export function summarizeSite(site: SiteAnalysis | null, lang: string = 'he'): string {
  if (!site?.ok || !site.text) return '';
  const L = labels(lang);
  return [`${L.site} (${site.url})`, L.siteNote, `<<<${site.text}>>>`].join('\n');
}

/**
 * The complete grounding block: computed signals (trusted), the base project
 * summary, the planning extras, and the website when it was read.
 */
export function renderPlanningSnapshot(snap: PlanningSnapshot, lang: string = 'he'): string {
  return [
    `Project signals (trusted, computed): ${snap.signals.facts.join(' | ')}`,
    '',
    summarizeProjectContext(snap.ctx, lang),
    summarizePlanningExtras(snap.extras, lang),
    summarizeSite(snap.site, lang)
  ]
    .filter((part) => part !== '')
    .join('\n');
}
