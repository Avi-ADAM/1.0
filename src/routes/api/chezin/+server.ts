/**
 * Anonymous pre-signup proxy for the "chezin" (agreement signatory) flow.
 *
 * amana.svelte (and hascama/+page.svelte) run BEFORE login/signup, so there
 * is no JWT cookie to authenticate with — they used to call Strapi's
 * /graphql directly with VITE_URL, unauthenticated.
 * This route runs the same two operations server-side via sendToSer's isSer
 * path (internal secret injected automatically by hooks.server.js handleFetch
 * on this server-side fetch), so the client never talks to Strapi directly.
 *
 * Also called cross-origin by the agreement.1lev1.com repo (the "1-1" sister
 * site), whose full-agreement flow used to hit Strapi's /graphql directly too
 * — see corsHeaders below.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendToSer } from '$lib/send/sendToSer.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://agreement.1lev1.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const POST: RequestHandler = async ({ request, fetch }) => {
  const body = await request.json();

  if (body?.action === 'list') {
    const result = await sendToSer({}, '279getChezinNames', 0, 0, true, fetch);
    return json(result, { headers: corsHeaders });
  }

  if (body?.action === 'create') {
    const { name, email, countries, publishedAt, fullAgreement } = body;
    if (!name || !email) {
      return json({ errors: [{ message: 'name and email are required' }] }, { status: 400, headers: corsHeaders });
    }
    const result = await sendToSer(
      { name, email, countries: countries ?? [], publishedAt, fullAgreement: fullAgreement === true },
      '280createChezin',
      0,
      0,
      true,
      fetch
    );
    return json(result, { headers: corsHeaders });
  }

  return json({ errors: [{ message: 'Unknown action' }] }, { status: 400, headers: corsHeaders });
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
