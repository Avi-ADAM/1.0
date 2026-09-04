/* The homepage's live counters, fetched on the server.
 *
 * They used to load in `onMount` only, so the HTML a crawler is served said
 * "loading data..." and the counts that back the discovery links were zero.
 * Both the numbers and the "N open missions" links are content, so they have
 * to exist in the server-rendered markup.
 *
 * `/api/stat` stays the client's path (the panel refreshes without a reload),
 * so this reuses the endpoint through SvelteKit's `fetch` rather than
 * duplicating the Strapi query - handleFetch stamps the gate secret on it the
 * same way it would for any other server-side call.
 *
 * A failure here must never take the homepage down with it: Strapi being
 * unreachable degrades to `stats: null`, and the component falls back to the
 * client fetch it has always done.
 */
export async function load({ fetch }) {
  try {
    const res = await fetch('/api/stat');
    if (!res.ok) return { stats: null };
    return { stats: await res.json() };
  } catch (e) {
    console.error('Homepage stats SSR failed, falling back to the client:', e);
    return { stats: null };
  }
}
