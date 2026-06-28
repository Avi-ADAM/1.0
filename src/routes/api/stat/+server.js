import { json, error } from '@sveltejs/kit';
import { ADMINMONTHER } from '$env/static/private';

const EP = import.meta.env.VITE_URL + '/graphql';

function normalizeToken(value) {
  return String(value ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

const QUERY = `query GetSiteStats {
  projects { meta { pagination { total } } }
  chezins  { meta { pagination { total } } }
  usersPermissionsUsers { meta { pagination { total } } }
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
    users:    body.data.usersPermissionsUsers?.meta?.pagination?.total ?? 0
  });
}
