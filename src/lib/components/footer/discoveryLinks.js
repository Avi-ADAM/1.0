/**
 * The five public discovery surfaces, in the order `DiscoveryNav.svelte`
 * shows them. Shared by the footer's discovery tab and by the "more" menu,
 * which hosts the same list on screens too narrow for the tab.
 *
 * Labels are `common.footer.discover_*`, never `discover.nav_*`: that
 * namespace is route-gated to the discovery pages themselves (see
 * `translations/routes.js`), so its keys render empty everywhere else — and
 * the footer renders on every route.
 */
export const DISCOVERY_LINKS = [
  { key: 'map', href: '/demand', emoji: '🗺️' },
  { key: 'projects', href: '/project', emoji: '🧶' },
  { key: 'products', href: '/gift', emoji: '🎁' },
  { key: 'missions', href: '/availableMission', emoji: '🛠️' },
  { key: 'resources', href: '/availiableResorce', emoji: '📦' }
];

/** Strips a locale prefix so `/en/project` matches the `/project` link. */
const stripLocale = (p) => p.replace(/^\/(?:he|en|ar|ru|es)(?=\/|$)/, '') || '/';

/** The discovery link the given pathname belongs to, if any. */
export function activeDiscoveryLink(pathname) {
  const p = stripLocale(pathname);
  return DISCOVERY_LINKS.find((l) => p === l.href || p.startsWith(l.href + '/'));
}
