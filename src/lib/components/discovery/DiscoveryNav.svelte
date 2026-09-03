<script lang="ts">
  import { t } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';

  /**
   * Cross-links between the public discovery surfaces (PLAN_DISCOVERY pages):
   * the demand map, the projects directory, the products directory and the
   * open-missions list — so visitors can wander between them freely.
   */
  type Props = {
    current?: 'map' | 'projects' | 'products' | 'missions' | 'resources';
    /** Anonymous visitors also get a pill back to the public homepage. */
    isLoggedIn?: boolean;
  };
  let { current, isLoggedIn = true }: Props = $props();

  const BASE_LINKS = [
    { key: 'map', href: '/demand', icon: 'map' },
    { key: 'projects', href: '/project', icon: 'rikma' },
    { key: 'products', href: '/gift', icon: 'product' },
    { key: 'missions', href: '/availableMission', icon: 'mission' },
    { key: 'resources', href: '/availiableResorce', icon: 'resource' }
  ] as const;

  const links = $derived(
    isLoggedIn
      ? [...BASE_LINKS]
      : [{ key: 'home', href: '/', icon: 'support' } as const, ...BASE_LINKS]
  );
</script>

<nav class="discovery-nav" aria-label={$t('discover.nav_label')}>
  {#each links as link (link.key)}
    <a
      href={link.href}
      class="pill"
      class:active={current === link.key}
      aria-current={current === link.key ? 'page' : undefined}
    >
      <EntityIcon kind={link.icon} size={15} />
      <span>{$t(`discover.nav_${link.key}`)}</span>
    </a>
  {/each}
</nav>

<style>
  .discovery-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid rgba(179, 135, 40, 0.45);
    background: white;
    /* Was --stgold, which business/dark flips to #cbd5e1 for the dark surfaces
       it sits on elsewhere — but this pill's background is hard-coded white, so
       the label and its icon measured 1.47:1 there. --ramp-ink is the token for
       exactly this case: dark in every theme and every mode, because the
       surface it inks never darkens (see :root in app.postcss). */
    color: var(--ramp-ink, #16131b);
    border-radius: 9999px;
    padding: 0.35rem 0.9rem;
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
  }
  .pill:hover {
    background: var(--gold, #eee8aa);
    border-color: #b38728;
  }
  .pill.active {
    background: var(--barbi-pink, #ff0092);
    border-color: var(--barbi-pink, #ff0092);
    color: white;
    animation: gold-pulse 2.6s ease-in-out infinite;
  }
  @keyframes gold-pulse {
    0%,
    100% {
      box-shadow: 0 0 4px rgba(252, 246, 186, 0.45);
    }
    50% {
      box-shadow: 0 0 14px rgba(191, 149, 63, 0.85);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pill.active {
      animation: none;
    }
  }
</style>
