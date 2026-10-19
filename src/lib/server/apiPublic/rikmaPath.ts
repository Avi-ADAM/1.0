/**
 * Which rikma is in the path — the API's answer to the question
 * `(regandnon)/r/[slug]/+page.server.js` already answers for the page (§5.0).
 *
 * The plan is explicit that this must not be a second implementation: the page
 * and the API have to agree on what a slug means, or the same link would open
 * one rikma's page and another rikma's catalog. So this *is* that
 * implementation — `src/routes/(regandnon)/r/[slug]/+page.server.js` calls it
 * too, through the `address` option below — built on `slugFromPath` for the
 * spelling (`/r/Bees` → `/r/bees`), `findBySlug` for a former address
 * (`formerSlugs`, which never releases), and a 404 for everything else.
 *
 * What each surface owns is only the *URL*: the API writes
 * `/api/v1/r/<slug>` **and keeps the rest of the path and the query**, because
 * `/api/v1/r/Bees/products?limit=50` must land on
 * `/api/v1/r/bees/products?limit=50`, not on the rikma profile; the page writes
 * `/r/<slug>`, falling back to `/project/<id>` for a rikma with no address.
 *
 * Two address shapes are legal and they mean the same thing (§5.0):
 *   - the slug — preferred, because it is stable and readable;
 *   - the numeric id — for a rikma that has no address yet, and for our own
 *     tooling. Its existence is proven by the query the handler runs anyway
 *     (the rikma ref), so this resolver asks Strapi nothing in that case.
 */

import { slugFromPath } from '$lib/rikmaAddress/slug.js';
import { findBySlug } from '$lib/server/rikmaIdentity/identity.js';

export type RikmaRun = (
  qid: string,
  vars: Record<string, unknown>
) => Promise<any>;

export type RikmaResolution =
  | {
      kind: 'ok';
      projectId: string;
      slug: string | null;
      canonicalPath: string;
    }
  | {
      kind: 'redirect';
      location: string;
      canonicalPath: string | null;
      reason: 'spelling' | 'former';
    }
  | { kind: 'notFound' };

/** `/api/v1/r/<slug|id>` — the one place the API's rikma prefix is spelled. */
export function apiRikmaPath(rikma: string | number): string {
  return `/api/v1/r/${rikma}`;
}

/** A rikma is addressed by its slug, and by its id only while it has none. */
const defaultAddress = (target: { slug: string | null; projectId: string }) =>
  apiRikmaPath(target.slug ?? target.projectId);

/**
 * What may follow the rikma in a redirect. Built by the routes from *validated*
 * parts (a product id is digits-only before it gets here), and re-checked here,
 * because a redirect header is an output sink: a path segment taken verbatim
 * from the URL would let `..%2f..` be reflected into `Location`.
 */
const SUFFIX_SHAPE = /^\/(?:products(?:\/\d{1,12})?|categories|options|shipping(?:\/quote)?)?$/;

export interface ResolveOptions {
  /** The raw query string, `?limit=50` — preserved across a redirect. */
  search?: string;
  /** The path below the rikma: `/products`, `/products/1842`, `/categories`. */
  suffix?: string;
  /**
   * Whether this surface is allowed to *move* the caller (a 301 to the
   * canonical address). Reads say yes: the answer is cacheable and the URL
   * should be too. Writes say no — a 301 may be replayed as a GET, and a POST
   * that never happened is a sale that never happened — so a write is answered
   * in place, under whichever rikma its path names.
   */
  move?: boolean;
  /**
   * How *this surface* writes a rikma's address. The API default is
   * `/api/v1/r/<slug|id>`; the public page passes its own shape
   * (`/r/<slug>`, or `/project/<id>` for a rikma with no address yet). Only
   * this string differs between the two callers — never the decision of which
   * rikma a path names, which is why it is an argument and not a fork.
   */
  address?: (target: { slug: string | null; projectId: string }) => string;
}

/**
 * @param raw the `{rikma}` path parameter, verbatim
 * @param run executes a qid (the same runners the identity layer uses)
 */
export async function resolveRikmaFromPath(
  raw: string,
  run: RikmaRun,
  {
    search = '',
    suffix = '',
    address = defaultAddress,
    move = true
  }: ResolveOptions = {}
): Promise<RikmaResolution> {
  const param = String(raw ?? '').trim();
  const tail = SUFFIX_SHAPE.test(suffix) ? suffix : '';
  const canMove = move !== false;
  const locationFor = (slug: string | null, projectId: string) =>
    `${address({ slug, projectId })}${tail}${search}`;

  // An id: 1–12 digits. `slugFromPath` refuses digit-only strings on purpose
  // (an id-shaped address reads like `/project/482`), so the two shapes cannot
  // collide: this branch is only reachable when the whole segment is a number.
  if (/^\d{1,12}$/.test(param)) {
    return {
      kind: 'ok',
      projectId: param,
      slug: null,
      canonicalPath: apiRikmaPath(param)
    };
  }

  const slug = slugFromPath(param);
  if (!slug) return { kind: 'notFound' };

  // One spelling per address: /r/Bees → /r/bees (the page's 301, ported).
  // A surface that may not redirect continues in place, below: `slug` is
  // already the canonical spelling of what the path asked for.
  if (slug !== param && canMove) {
    return {
      kind: 'redirect',
      location: locationFor(slug, param),
      canonicalPath: apiRikmaPath(slug),
      reason: 'spelling'
    };
  }

  const hit = await findBySlug(run, slug);
  if (!hit) return { kind: 'notFound' };

  // An address the rikma used to have keeps reaching it — the link was printed
  // once and cannot be recalled.
  if (hit.former && canMove) {
    const target = hit.currentSlug ?? hit.projectId;
    return {
      kind: 'redirect',
      location: locationFor(hit.currentSlug, hit.projectId),
      canonicalPath: apiRikmaPath(target),
      reason: 'former'
    };
  }

  const current = hit.currentSlug ?? slug;
  return {
    kind: 'ok',
    projectId: hit.projectId,
    slug: current,
    canonicalPath: apiRikmaPath(current)
  };
}
