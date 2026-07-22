import { json, error } from '@sveltejs/kit';
import { ADMINMONTHER } from '$env/static/private';

import { STRAPI_GRAPHQL as EP } from '$lib/server/strapiUrl.js';

function normalizeToken(value) {
  return String(value ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

// Discovery counts use the same filters as 279demandCounts / the map qids, so
// the homepage numbers match what the discovery pages actually list.
const QUERY = `query GetSiteStats {
  projects { meta { pagination { total } } }
  chezins  { meta { pagination { total } } }
  usersPermissionsUsers { meta { pagination { total } } }
  openMissions(filters: { archived: { eq: false } }, pagination: { limit: 1 }) {
    meta { pagination { total } }
  }
  openMashaabims(filters: { archived: { eq: false } }, pagination: { limit: 1 }) {
    meta { pagination { total } }
  }
  matanots(filters: { archived: { ne: true } }, pagination: { limit: 1 }) {
    meta { pagination { total } }
  }
}`;

export async function GET() {
  const token = normalizeToken(ADMINMONTHER);
  if (!token) throw error(500, 'Server misconfiguration: ADMINMONTHER not set');

  let res;
  try {
    res = await fetch(EP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ query: QUERY })
    });
  } catch (e) {
    throw error(502, 'Cannot reach Strapi');
  }

  const body = await res.json();
  if (!body.data) throw error(502, 'Bad response from Strapi');

  return json({
    projects: body.data.projects?.meta?.pagination?.total ?? 0,
    members:  body.data.chezins?.meta?.pagination?.total ?? 0,
    users:    body.data.usersPermissionsUsers?.meta?.pagination?.total ?? 0,
    openMissions:  body.data.openMissions?.meta?.pagination?.total ?? 0,
    openResources: body.data.openMashaabims?.meta?.pagination?.total ?? 0,
    products:      body.data.matanots?.meta?.pagination?.total ?? 0
  });
}
