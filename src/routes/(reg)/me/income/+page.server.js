import { redirect } from '@sveltejs/kit';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { buildIncomeSeries } from '$lib/income/buildIncomeSeries.js';

/**
 * /me/income — "how much have I actually earned here".
 *
 * The homepage graph argues that a partner's income grows from several rikmas
 * at once and keeps arriving after the work is done. This page is that graph
 * drawn from the member's own halukas, which is the only version of the claim
 * that can be checked. Everything shown is derived here, on the server, so the
 * page ships numbers rather than a query the browser could be pointed at
 * someone else.
 *
 * `uid` comes from the cookie, never from the URL, and the qid's guard in
 * `src/routes/api/send/guards.js` pins it to the caller besides.
 */

/** Flatten one Strapi haluka node into the shape buildIncomeSeries expects. */
function toPayout(node) {
  const a = node?.attributes ?? {};
  return {
    id: String(node?.id ?? ''),
    amount: a.amount,
    confirmed: a.confirmed,
    createdAt: a.createdAt,
    isSiteShare: a.isSiteShare,
    projectId: a.project?.data?.id ? String(a.project.data.id) : null,
    projectName: a.project?.data?.attributes?.projectName ?? null,
    currency: a.matbea?.data?.attributes?.simbol ?? null,
    currencyName: a.matbea?.data?.attributes?.name ?? null
  };
}

/**
 * Finished missions are here only to date the member's last work per rikma.
 * `finish` is the real end of the work; `createdAt` stands in for the rows that
 * never got one, which is the conservative choice — a later date can only make
 * *less* money count as "arrived after the work".
 */
function toWorkLog(node) {
  const a = node?.attributes ?? {};
  return {
    projectId: a.project?.data?.id ? String(a.project.data.id) : null,
    finish: a.finish ?? a.createdAt ?? null,
    hours: a.noofhours ?? null
  };
}

export async function load({ locals, fetch, depends }) {
  // A confirmed haluka or a new split changes this page, and both already
  // invalidate the profile key from the socket layer.
  depends('app:meProfile');

  const tok = locals.tok;
  const uid = locals.uid;

  // `locals.tok`/`locals.uid` are `string | false`, so a single falsy check
  // covers both the signed-out and the expired-session cases.
  if (!tok || !uid) {
    throw redirect(303, '/login');
  }

  try {
    const data = await sendViaProxy(fetch, '307myIncomeHistory', { uid: String(uid) });
    const attrs = data?.usersPermissionsUser?.data?.attributes;
    if (!attrs) throw redirect(303, '/login');

    const payouts = (attrs.halukasres?.data ?? []).map(toPayout);
    const work = (attrs.finnished_missions?.data ?? []).map(toWorkLog);

    return {
      tok: true,
      summary: buildIncomeSeries(payouts, work),
      /** Total hours the member logged, across every rikma — context for the money. */
      hoursLogged: work.reduce((sum, w) => sum + (Number(w.hours) || 0), 0),
      failed: false
    };
  } catch (err) {
    // A redirect is a control-flow throw, not a failure — let it through.
    if (err && typeof err === 'object' && 'status' in err && 'location' in err) throw err;
    console.error('[me/income] load failed', err);
    // An empty summary renders the page's own "nothing yet" state, which is the
    // wrong story to tell someone who has earned money — hence the flag.
    return {
      tok: true,
      summary: { series: [], primary: null, empty: true },
      hoursLogged: 0,
      failed: true
    };
  }
}
