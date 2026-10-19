import type { RequestHandler } from './$types';
import { authenticateRead, etagOf, preflightResponse, respond } from '$lib/server/apiPublic/http.js';
import { districtsOf, localities, searchLocalities } from '$lib/server/places/israel.js';

/**
 * GET /api/v1/places/cities — Israel's localities with their district (נפה),
 * from the CBS list (docs/inprogress/PLAN_SHOP_SHIPPING.md §3).
 *
 * Without `q` it is the whole list (~1,300 rows, cached a day): a storefront
 * fetches it once and completes the buyer's city in the browser, with no call
 * per keystroke. With `q` it is the top matches — the shipping tab's picker.
 * Not a rikma's data, so not under `/r/{rikma}`.
 */
export const GET: RequestHandler = async ({ url, request, fetch }) => {
  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const list = await localities(fetch);
  const q = (url.searchParams.get('q') ?? '').slice(0, 60);
  const cities = q ? searchLocalities(list, q, 15) : list;
  const body = { cities, districts: q ? undefined : districtsOf(list), available: list.length > 0 };
  return respond({
    request,
    auth: authResult.auth,
    body,
    etag: etagOf({ p: 'places/cities', q, n: list.length, f: list[0]?.code ?? '' })
  });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
