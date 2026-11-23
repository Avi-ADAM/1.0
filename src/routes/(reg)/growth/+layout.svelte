<script lang="ts">
  import '$lib/styles/shop.css';
  import '$lib/styles/growth.css';
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';

  let { data, children } = $props();

  const NAV = [
    { key: 'overview', href: '/growth' },
    { key: 'discover', href: '/growth/discover' },
    { key: 'research', href: '/growth/pipeline?view=research' },
    { key: 'profiles', href: '/growth/pipeline?view=profiles' },
    { key: 'outreach', href: '/growth/pipeline?view=outreach' },
    { key: 'pipeline', href: '/growth/pipeline' },
    { key: 'intelligence', href: '/growth/intelligence' },
    { key: 'settings', href: '/growth/settings' }
  ] as const;

  let active = $derived.by(() => {
    const path = page.url.pathname;
    if (path.startsWith('/growth/pipeline')) {
      const v = page.url.searchParams.get('view');
      return v === 'research' || v === 'profiles' || v === 'outreach' ? v : 'pipeline';
    }
    if (path.startsWith('/growth/b/')) return 'pipeline';
    const seg = path.split('/')[2];
    return seg || 'overview';
  });
</script>

<svelte:head>
  <title>{$t('growth.title')} · 1lev1</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="shop-ui gr-shell" dir={$locale === 'he' || $locale === 'ar' ? 'rtl' : 'ltr'}>
  <header class="gr-head">
    <div>
      <h1 class="gr-title">{$t('growth.title')}</h1>
      <p class="gr-sub">{$t('growth.subtitle')}</p>
    </div>
  </header>

  {#if data.access !== 'ok'}
    <div class="sh-card gr-card" role="alert">
      <h2>{$t(`growth.access.${data.access}.title`)}</h2>
      <p>{$t(`growth.access.${data.access}.body`)}</p>
    </div>
  {:else}
    <nav class="gr-nav" aria-label={$t('growth.title')}>
      {#each NAV as n (n.key)}
        <a class="sh-pill" href={n.href} aria-current={active === n.key ? 'page' : undefined}>
          {$t(`growth.nav.${n.key}`)}
        </a>
      {/each}
    </nav>
    {@render children()}
  {/if}
</div>
