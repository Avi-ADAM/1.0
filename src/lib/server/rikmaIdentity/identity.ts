/**
 * A rikma's address and look on the server (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md S0/S1).
 *
 * Written once against two runners — `read` and `write` — so the three callers
 * cannot drift apart: the proposal action (read as the service, write as the
 * member), the unanimous-vote path in voteOnDecision (same), and the restime
 * silence path in the timegrama cron (both as the service). Same rule as
 * $lib/server/archive: one implementation, several transports.
 *
 * Every value is validated again **at apply time**, not trusted from the
 * Decision row: an address can be taken by another rikma between the proposal
 * and its maturing, a name can join the reserved list, and the Decision row is
 * just JSON somebody once wrote.
 */

import { formerSlugToken, nextFormerSlugs, validateSlug, type SlugProblem } from '$lib/rikmaAddress/slug.js';
import { lookIssues, parseLook, type LookImage, type RikmaLook } from '$lib/rikmaLook/look.js';

/** Runs a qid with variables and returns the raw GraphQL response. */
export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

export interface Runners {
  /** Lookups across rikmas — always as the service. */
  read: Run;
  /** The write itself — as the member when there is one. */
  write: Run;
}

export interface RikmaIdentity {
  slug: string | null;
  formerSlugs: string | null;
  look: RikmaLook | null;
}

const gqlErrors = (res: any) => (Array.isArray(res?.errors) && res.errors.length ? res.errors : null);

/**
 * The rikma's address and look, or null when they cannot be read — which is
 * what a backend without the fields answers, and is read as "no address, the
 * classic look" by every caller.
 */
export async function readIdentity(read: Run, projectId: string): Promise<RikmaIdentity | null> {
  try {
    const res = await read('rikmaIdentityByProject', { id: String(projectId) });
    if (gqlErrors(res)) return null;
    const a = res?.data?.project?.data?.attributes;
    if (!a) return null;
    return {
      slug: typeof a.slug === 'string' && a.slug ? a.slug : null,
      formerSlugs: typeof a.formerSlugs === 'string' ? a.formerSlugs : null,
      look: parseLook(a.look)
    };
  } catch {
    return null;
  }
}

/**
 * Which rikma a slug points at: its current address, or one it used to have
 * (the route then redirects). Null when nobody has it — or it cannot be read.
 */
export async function findBySlug(
  read: Run,
  slug: string
): Promise<{ projectId: string; currentSlug: string | null; former: boolean } | null> {
  try {
    const cur = await read('rikmaProjectBySlug', { slug });
    const hit = cur?.data?.projects?.data?.[0];
    if (hit) return { projectId: String(hit.id), currentSlug: hit.attributes?.slug ?? slug, former: false };
    const old = await read('rikmaProjectByFormerSlug', { token: formerSlugToken(slug) });
    const was = old?.data?.projects?.data?.[0];
    if (was) return { projectId: String(was.id), currentSlug: was.attributes?.slug ?? null, former: true };
  } catch {
    /* unreadable → not found */
  }
  return null;
}

export type Availability =
  | { ok: true; slug: string; mine: boolean }
  | { ok: false; slug: string; reason: SlugProblem | 'taken' | 'pending' | 'unknown' };

/**
 * May `projectId` take `raw` as its address?
 *
 * - its own current or former address: yes (`mine`);
 * - another rikma's current or former address: no — an old link must keep
 *   reaching the rikma it was printed for;
 * - an address another rikma has an open proposal for: no, until that
 *   proposal closes (first to propose holds it while its members decide).
 */
export async function slugAvailability(read: Run, raw: unknown, projectId: string): Promise<Availability> {
  const v = validateSlug(raw);
  if (v.ok === false) return { ok: false, slug: v.slug, reason: v.problem };
  const slug = v.slug;
  try {
    const owner = await findBySlug(read, slug);
    if (owner) {
      return owner.projectId === String(projectId)
        ? { ok: true, slug, mine: true }
        : { ok: false, slug, reason: 'taken' };
    }
    const pending = await read('rikmaOpenAddressProposals', { slug });
    if (gqlErrors(pending)) return { ok: false, slug, reason: 'unknown' };
    const others = (pending?.data?.decisions?.data ?? []).filter(
      (d: any) => !(d.attributes?.projects?.data ?? []).some((p: any) => String(p.id) === String(projectId))
    );
    if (others.length) return { ok: false, slug, reason: 'pending' };
    return { ok: true, slug, mine: false };
  } catch {
    return { ok: false, slug, reason: 'unknown' };
  }
}

const RASTER = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);

/**
 * Replace each image's url with the one Strapi reports for its upload id, and
 * drop any that is not a raster image (an SVG can carry script). What the
 * client sent as a url is never kept.
 */
export async function resolveLookImages(read: Run, look: RikmaLook): Promise<RikmaLook> {
  const resolve = async (img: LookImage | null): Promise<LookImage | null> => {
    if (!img) return null;
    try {
      const res = await read('rikmaUploadFile', { id: img.id });
      const a = res?.data?.uploadFile?.data?.attributes;
      if (!a?.url || !RASTER.has(String(a.mime))) return null;
      return { id: String(img.id), url: String(a.url) };
    } catch {
      return null;
    }
  };
  return { ...look, media: { ...look.media, cover: await resolve(look.media.cover) } };
}

export class IdentityError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

/**
 * A look as it may be stored: parsed, free of issues, images re-resolved.
 * `null` in → null out (back to the classic page).
 */
export async function prepareLook(read: Run, input: unknown): Promise<RikmaLook | null> {
  if (input === null) return null;
  const parsed = parseLook(input);
  if (!parsed) throw new IdentityError('lookInvalid', 'The look could not be read');
  const issues = lookIssues(parsed);
  if (issues.length) throw new IdentityError(`look:${issues[0]}`, `The look is incomplete: ${issues.join(', ')}`);
  return resolveLookImages(read, parsed);
}

export interface IdentityChange {
  /** A new address. Omitted = unchanged. */
  slug?: string;
  /** A new look, or null for the classic page. Omitted = unchanged. */
  look?: unknown;
}

/**
 * Apply an approved change. Re-validates everything; throws `IdentityError`
 * when the address is no longer available.
 */
export async function applyRikmaIdentity(
  { read, write }: Runners,
  projectId: string,
  change: IdentityChange
): Promise<{ slug: string | null; look: RikmaLook | null; changed: boolean }> {
  const current = await readIdentity(read, projectId);
  if (!current) throw new IdentityError('unreadable', 'The rikma’s address could not be read');

  const vars: Record<string, unknown> = { id: String(projectId) };
  let slug = current.slug;
  let look = current.look;

  if (change.slug !== undefined) {
    const avail = await slugAvailability(read, change.slug, projectId);
    if (avail.ok === false) throw new IdentityError(`slug:${avail.reason}`, `The address is not available (${avail.reason})`);
    if (avail.slug !== current.slug) {
      slug = avail.slug;
      vars.slug = slug;
      vars.formerSlugs = nextFormerSlugs(current.formerSlugs, current.slug, slug);
    }
  }

  if (change.look !== undefined) {
    look = await prepareLook(read, change.look);
    vars.look = look;
  }

  if (Object.keys(vars).length === 1) return { slug, look, changed: false };

  const res = await write('rikmaUpdateIdentity', vars);
  const errors = gqlErrors(res);
  if (errors) throw new IdentityError('writeFailed', `Strapi refused the update: ${JSON.stringify(errors).slice(0, 300)}`);
  return { slug, look, changed: true };
}

/**
 * Apply the address or look a Decision carries — the matured-proposal path.
 * The row is read here (not from the caller's decision query) because the
 * shared decision queries do not select the new fields.
 */
export async function applyIdentityDecision(
  runners: Runners,
  decisionId: string,
  projectId: string
): Promise<{ applied: boolean; kind: string | null }> {
  const res = await runners.read('rikmaIdentityDecision', { id: String(decisionId) });
  const a = res?.data?.decision?.data?.attributes;
  if (!a) throw new IdentityError('decisionUnreadable', `Decision ${decisionId} could not be read`);
  const onProject = (a.projects?.data ?? []).some((p: any) => String(p.id) === String(projectId));
  if (!onProject) throw new IdentityError('wrongProject', `Decision ${decisionId} is not this rikma's`);

  if (a.kind === 'address') {
    if (!a.newSlug) return { applied: false, kind: a.kind };
    await applyRikmaIdentity(runners, projectId, { slug: a.newSlug });
    return { applied: true, kind: a.kind };
  }
  if (a.kind === 'look') {
    // A stored null means "back to the classic page".
    await applyRikmaIdentity(runners, projectId, { look: a.newLook ?? null });
    return { applied: true, kind: a.kind };
  }
  return { applied: false, kind: a.kind ?? null };
}
