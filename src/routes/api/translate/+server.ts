/**
 * Anonymous pre-signup proxy for the "translate" (suggest-a-language) form.
 *
 * translatehe.svelte is rendered inside amana.svelte before login/signup, so
 * there is no JWT cookie to authenticate with — it used to call Strapi's
 * /graphql directly with VITE_URL, unauthenticated. This route runs the
 * mutation server-side via sendToSer's isSer path (internal secret injected
 * automatically by hooks.server.js handleFetch on this server-side fetch).
 *
 * Also called cross-origin by the agreement.1lev1.com repo (the "1-1" sister
 * site), whose tranarb.svelte/translateeng.svelte (Arabic/English variants)
 * hit Strapi's /graphql directly too — see corsHeaders below.
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
	const { amort, amorts, amortt, amortf, amorth, lang, from, notes, name, email } =
		await request.json();

	const result = await sendToSer(
		{
			amort,
			amorts,
			amortt,
			amortf,
			amorth,
			lang,
			from,
			notes,
			name,
			email,
			publishedAt: new Date().toISOString()
		},
		'282createTranslate',
		0,
		0,
		true,
		fetch
	);
	return json(result, { headers: corsHeaders });
};

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}
