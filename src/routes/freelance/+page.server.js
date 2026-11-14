/* Live counts for /freelance.
 *
 * Same guard as /no-boss and /flexible-work: the "open right now" listings
 * render only when there is something behind them. A freelancer who arrives
 * convinced and is handed an empty list concludes the partnership market is
 * a promise, not a place - so unreachable Strapi reads as zero and the
 * conversation carries the page.
 */
export async function load({ fetch }) {
  try {
    const res = await fetch('/api/stat');
    if (!res.ok) return { stats: null };
    return { stats: await res.json() };
  } catch (e) {
    console.error('/freelance stats failed, hiding the listings:', e);
    return { stats: null };
  }
}
