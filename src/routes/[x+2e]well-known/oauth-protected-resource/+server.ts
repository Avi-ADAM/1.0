// RFC 9728 — Protected Resource Metadata. This is the document the 401 from
// /api/mcp points at, and the first thing a client reads on discovery.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { protectedResourceMetadata } from '$lib/server/oauth/metadata.js';

const HEADERS = {
  'Cache-Control': 'public, max-age=3600',
  'Access-Control-Allow-Origin': '*'
};

export const GET: RequestHandler = async ({ url }) =>
  json(protectedResourceMetadata(url), { headers: HEADERS });

export const OPTIONS: RequestHandler = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
