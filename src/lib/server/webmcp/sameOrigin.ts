/**
 * True when the request comes from a page of this very origin.
 * `Sec-Fetch-Site` is set by the browser and cannot be forged by page script;
 * `Origin` covers browsers that do not send it. A same-origin GET may omit
 * Origin; a POST from a browser always sends it, so a POST without either is refused.
 */
export function sameOrigin(request: Request, url: URL): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;
  const origin = request.headers.get('origin');
  if (origin) return origin.replace(/\/+$/, '') === url.origin;
  return request.method === 'GET' && site === 'same-origin';
}
