/**
 * The rikma's public page loader, shared by `/project/[id]` and `/r/[slug]`
 * (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §4.5). One loader, so the two addresses
 * cannot render two different pages.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import { translateSurface, projectDetailGroups } from '$lib/server/translation/surfaces.js';
import { strapiClient } from '$lib/server/actions';
import { readIdentity } from '$lib/server/rikmaIdentity/identity.js';
import { parseLook } from '$lib/rikmaLook/look.js';
import { rikmaPath } from '$lib/rikmaAddress/rikmaUrl.js';

/** Service read — the address and the look are public, like the page itself. */
const read = (/** @type {string} */ qid, /** @type {Record<string, unknown>} */ vars) =>
  strapiClient.execute(qid, vars);

/**
 * The rikma's address and look, or the empty answer when the backend does not
 * have them (yet) — which renders the classic page at /project/<id>.
 *
 * `ready` is false when the backend could not answer at all — the look editor
 * says so instead of offering a form whose every save would fail.
 *
 * @param {string} projectId
 * @returns {Promise<{ slug: string | null, look: import('$lib/rikmaLook/look').RikmaLook | null, ready: boolean }>}
 */
export async function readRikmaIdentity(projectId) {
  const identity = await readIdentity(read, String(projectId));
  return { slug: identity?.slug ?? null, look: identity?.look ?? null, ready: identity !== null };
}

async function awaitapi(projectId, tok, fetch) {
  const isSer = tok === false;
  try {
    const data = await sendToSer({ id: projectId }, '49GetProjectById', null, null, isSer, fetch);
    return data?.data?.project?.data ?? null;
  } catch (error) {
    console.error('Error fetching project data:', error);
    return null;
  }
}

/**
 * A member may look at a proposed look before voting on it: `?lookPreview=<decisionId>`
 * renders the page in the look a `kind: 'look'` decision carries. Anyone else
 * gets the live page — the proposal is the rikma's business until it passes.
 */
async function previewLook(decisionId, projectId, projectData, uid) {
  if (!decisionId || !uid || !/^\d{1,12}$/.test(decisionId)) return undefined;
  const members = projectData?.attributes?.user_1s?.data ?? [];
  if (!members.some((/** @type {any} */ u) => String(u.id) === String(uid))) return undefined;
  try {
    const res = await read('rikmaIdentityDecision', { id: decisionId });
    const a = res?.data?.decision?.data?.attributes;
    const mine = (a?.projects?.data ?? []).some((/** @type {any} */ p) => String(p.id) === String(projectId));
    if (!a || a.kind !== 'look' || !mine) return undefined;
    return parseLook(a.newLook); // null = "back to the classic page", also worth previewing
  } catch {
    return undefined;
  }
}

/**
 * @param {{
 *   projectId: string,
 *   identity?: { slug: string | null, look: any },
 *   locals: App.Locals,
 *   fetch: typeof fetch,
 *   cookies: import('@sveltejs/kit').Cookies,
 *   url: URL,
 *   depends: (...deps: `${string}:${string}`[]) => void
 * }} event
 */
export async function loadRikmaPage({ projectId, identity, locals, fetch, cookies, url, depends }) {
  const lang = locals.lang;
  const tok = locals.tok;
  // Tag this load so a realtime vote/decision notification can re-run it
  // via invalidate(`project:${projectId}`) from the page.
  depends(`project:${projectId}`);
  const isRegisteredUser = tok != false;

  const [projectData, ident] = await Promise.all([
    awaitapi(projectId, tok, fetch),
    identity ? Promise.resolve(identity) : readRikmaIdentity(projectId)
  ]);

  // UGC translation (PLAN_UGC_TRANSLATION §7.1) — the rikma's own page: its
  // description, and the names of its open missions and products. Mission
  // names are the same strings the directory and the mission pages already
  // buy, so on a warm cache they cost this page nothing. One extra query at
  // most, never an LLM call, and a miss renders the author's words.
  const { translations, pending } = await translateSurface(
    'projectDetail',
    projectDetailGroups(projectData ? { id: projectId, attributes: projectData.attributes } : null),
    lang,
    fetch,
    cookies.get('autoTranslate')
  );

  const preview = await previewLook(url.searchParams.get('lookPreview'), projectId, projectData, locals.uid);

  return {
    projectId,
    lang,
    tok: tok == false ? false : true,
    projectData,
    isRegisteredUser,
    translations,
    pending,
    slug: ident.slug,
    look: preview !== undefined ? preview : ident.look,
    lookPreview: preview !== undefined,
    canonicalPath: rikmaPath({ id: projectId, slug: ident.slug })
  };
}
