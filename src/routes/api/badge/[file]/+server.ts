import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { adminToken } from '$lib/server/github/service.js';
import { badgeMessage, renderBadge } from '$lib/github/badge.js';

/**
 * GET /api/badge/<pid>.svg — a code rikma's README badge (PLAN_CODE_RIKMA S6).
 *
 * Public and anonymous: GitHub proxies README images through its camo cache,
 * which sends no cookie. It shows only what the rikma's public page already
 * shows — the number of partners and the license — and is cached for an hour
 * so a popular README does not become a Strapi load test.
 */
export const GET: RequestHandler = async ({ params, fetch }) => {
  const m = /^(\d{1,12})\.svg$/.exec(params.file);
  if (!m) throw error(404, 'Not found');

  let project: any = null;
  try {
    const res = await strapiClient.execute('badgeProject', { pid: m[1] }, adminToken(), fetch);
    project = res?.data?.project?.data ?? null;
  } catch (e) {
    console.error('[badge] project lookup failed:', e);
  }

  const svg = project
    ? renderBadge(
        '1lev1',
        badgeMessage({
          partners: project.attributes?.user_1s?.data?.length ?? 0,
          license: project.attributes?.codeLicense
        })
      )
    : renderBadge('1lev1', 'rikma not found', '#64748b');

  return new Response(svg, {
    status: project ? 200 : 404,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': project ? 'public, max-age=3600, s-maxage=3600' : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      // An SVG opened directly is a document; nothing in it may run.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'"
    }
  });
};
