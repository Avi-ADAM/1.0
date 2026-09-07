/* Live counts for /join.
 *
 * This page exists to send someone into a listing, so it is the page most
 * exposed to the failure the audits warned about: a convinced reader handed
 * an empty directory leaves, and the impression is spent. The counts decide
 * which half of the page renders - the listings, or the "tell us what you do
 * and we will match you by hand" path - and that has to be settled before
 * the HTML is sent.
 *
 * Unreachable Strapi degrades to `stats: null`, which reads as zero: the
 * manual path carries the page, which is the safe direction to fail in.
 */
export async function load({ fetch }) {
  try {
    const res = await fetch('/api/stat');
    if (!res.ok) return { stats: null };
    return { stats: await res.json() };
  } catch (e) {
    console.error('/join stats failed, offering the manual path only:', e);
    return { stats: null };
  }
}
