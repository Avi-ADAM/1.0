// RFC 8414 — Authorization Server Metadata.
// Public and unauthenticated by design: a client must be able to read this
// before it has any credential at all.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authorizationServerMetadata } from '$lib/server/oauth/metadata.js';

const HEADERS = {
  'Cache-Control': 'public, max-age=3600',
  'Access-Control-Allow-Origin': '*'
};

export const GET: RequestHandler = async ({ url }) =>
  json(authorizationServerMetadata(url), { headers: HEADERS });

export const OPTIONS: RequestHandler = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
