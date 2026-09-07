/* Counts for /no-boss, on the server.
 *
 * The page needs them for one decision rather than for decoration: whether to
 * offer "see rikmas looking for partners" at all. Two of the four audits
 * independently warned that a landing page like this one is worse than
 * useless if it hands a convinced visitor an empty list - they leave, and the
 * one impression is spent. So the link renders only when there is something
 * behind it, and that has to be known before the HTML is sent, not after.
 *
 * Unreachable Strapi degrades to `stats: null`, which reads the same as zero
 * here: no link, and the personal-demo path carries the page on its own.
 */
export async function load({ fetch }) {
  try {
    const res = await fetch('/api/stat');
    if (!res.ok) return { stats: null };
    return { stats: await res.json() };
  } catch (e) {
    console.error('/no-boss stats failed, hiding the discovery links:', e);
    return { stats: null };
  }
}
