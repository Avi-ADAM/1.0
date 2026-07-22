<script lang="ts">
  import { t } from '$lib/translations';

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
    { key: 'map', href: '/demand', emoji: '🗺️' },
    { key: 'projects', href: '/project', emoji: '🧶' },
    { key: 'products', href: '/gift', emoji: '🎁' },
    { key: 'missions', href: '/availableMission', emoji: '🛠️' },
    { key: 'resources', href: '/availiableResorce', emoji: '📦' }
  ] as const;

  const links = $derived(
    isLoggedIn
      ? [...BASE_LINKS]
      : [{ key: 'home', href: '/', emoji: '💗' } as const, ...BASE_LINKS]
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
      <span aria-hidden="true">{link.emoji}</span>
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
    color: var(--stgold, #574010);
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
