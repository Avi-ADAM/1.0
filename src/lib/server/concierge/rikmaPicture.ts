/**
 * Which picture the rikma that a wish opens starts with.
 *
 * In order of whose choice it is:
 *   1. the customer picked one while closing the consent (`chosenId`);
 *   2. the wish carries a logo of its own (`wishLogoId`);
 *   3. otherwise one is made — the concierge medal over a word or two of the
 *      product (`$lib/concierge/rikmaAvatar`), uploaded to Strapi as the rikma's
 *      own media file.
 *
 * Never throws: a rikma without a face is a worse outcome than a missing
 * picture, but a failed upload must not stop the partnership from opening.
 */

import medalHref from '../../../../static/logo-concierge-medal.jpg?inline';
import { avatarWords, buildRikmaAvatarSvg } from '$lib/concierge/rikmaAvatar.js';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Upload one SVG to Strapi's media library; the id of the stored file. */
export async function uploadAvatarSvg(args: {
  svg: string;
  baseUrl: string;
  jwt: string;
  fetch: FetchLike;
}): Promise<string | null> {
  const form = new FormData();
  form.append(
    'files',
    new Blob([args.svg], { type: 'image/svg+xml' }),
    `rikma-concierge-${Date.now()}.svg`
  );
  const res = await args.fetch(`${args.baseUrl}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.jwt}` },
    body: form
  });
  if (!res.ok) {
    console.warn('[rikmaPicture] avatar upload failed:', res.status, await res.text().catch(() => ''));
    return null;
  }
  const out = await res.json().catch(() => null);
  const id = Array.isArray(out) ? out[0]?.id : null;
  return id != null ? String(id) : null;
}

export async function resolveRikmaPictureId(args: {
  chosenId?: string | null;
  wishLogoId?: string | null;
  wishName: string;
  baseUrl: string;
  jwt: string;
  fetch: FetchLike;
}): Promise<string | null> {
  if (args.chosenId) return String(args.chosenId);
  if (args.wishLogoId) return String(args.wishLogoId);

  try {
    const svg = buildRikmaAvatarSvg({ words: avatarWords(args.wishName), medalHref });
    return await uploadAvatarSvg({ svg, baseUrl: args.baseUrl, jwt: args.jwt, fetch: args.fetch });
  } catch (e) {
    console.warn('[rikmaPicture] could not make an avatar (non-fatal):', e);
    return null;
  }
}
