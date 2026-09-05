/* Live counts for /flexible-work.
 *
 * Same guard as /join and /no-boss, and it matters most here. This page is
 * read by people who have already been turned down a lot - by employers, by
 * job boards, by forms that stopped at a date of birth or a gap in a CV. An
 * empty listing is not a neutral outcome for that reader; it is one more
 * door that opened onto nothing, and they do not come back.
 *
 * So the listings render only when there is something behind them, and
 * unreachable Strapi reads as zero: the conversation carries the page, which
 * is the safe direction to fail in.
 */
export async function load({ fetch }) {
  try {
    const res = await fetch('/api/stat');
    if (!res.ok) return { stats: null };
    return { stats: await res.json() };
  } catch (e) {
    console.error('/flexible-work stats failed, offering the manual path only:', e);
    return { stats: null };
  }
}
