<!--
  /structure - "how it all connects".

  People hear "partnership platform" and cannot picture what they would be
  walking into. This page draws it: the boxes a member actually meets on the
  site (request, rikma, mission, resource, product, income, split) and the
  arrows between them, inside the frame that holds all of it - consent, the
  customer's included.

  The map tells the story from a request first, because that is the direction
  the platform prefers (work that starts from demand), and offers the dream as
  the second way in. The glossary under it says the same thing in words, for
  readers, screen readers and crawlers alike, and the page ends where the
  reader's question does: which of the four doors is mine.

  Same surface tokens and card shapes as /vision and /no-boss, so it reads as
  one of the track pages.
-->
<script>
  import { t, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import StructureMap from '$lib/components/structure/StructureMap.svelte';
  import { NODES, DOORS } from '$lib/components/structure/structureGraph.js';

  let startHref = $derived(registerHref($locale, '/structure'));

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('structure.hero.h1'), url: 'https://1lev1.com/structure' }
    ])
  );

  /** @type {{ key: string, icon: import('$lib/celim/icons/entityIcons').EntityIconKind }[]} */
  const GLOSSARY = [...NODES.map((n) => ({ key: n.key, icon: n.icon })), { key: 'consent', icon: 'signed' }];

  const card = 'bg-cyan-50/60 dark:bg-surface2 border-2 border-gold/60 rounded-xl px-4 py-3 shadow-sm text-start';
  const h2 = 'text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2 text-center';
  const lede = 'text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-center mb-4';
  const body = 'text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed';
  const h3 = 'text-rose-700 dark:text-gold font-semibold text-base sm:text-sm';
  const primary =
    'bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300';
  const link =
    'text-barbi dark:text-gold font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-rose-800 dark:hover:text-surfaceInk';
</script>

<svelte:head>
  <title>{$t('structure.meta.title')}</title>
  <meta name="description" content={$t('structure.meta.description')} />
  <meta property="og:title" content={$t('structure.meta.title')} />
  <meta property="og:description" content={$t('structure.meta.description')} />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

<main
  class="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:py-8 bg-surface text-surfaceInk"
  style="font-family:'Sababa',sans-serif;"
>
  <header class="w-full max-w-xl text-center">
    <p class="text-barbi dark:text-gold font-bold text-base sm:text-sm tracking-widest mb-2">
      {$t('structure.hero.eyebrow')}
    </p>
    <h1
      class="text-rose-700 dark:text-gold font-bold text-3xl sm:text-2xl mb-3"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('structure.hero.h1')}
    </h1>
    <p class="text-slate-800 dark:text-surfaceInk text-lg sm:text-base leading-relaxed max-w-lg mx-auto">
      {$t('structure.hero.sub')}
    </p>
  </header>

  <section class="w-full max-w-xl mt-8" aria-labelledby="st-map">
    <h2 id="st-map" class="sr-only">{$t('structure.graph.aria')}</h2>
    <StructureMap />
  </section>

  <section class="w-full max-w-2xl mt-14" aria-labelledby="st-glossary">
    <h2 id="st-glossary" class={h2}>{$t('structure.glossary.title')}</h2>
    <p class={lede}>{$t('structure.glossary.sub')}</p>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each GLOSSARY as item (item.key)}
        <div class={card}>
          <dt class="{h3} mb-1 flex items-center gap-2">
            <EntityIcon kind={item.icon} size={16} tone="brand" />
            {$t(`structure.nodes.${item.key}.label`)}
          </dt>
          <dd class={body}>{$t(`structure.nodes.${item.key}.desc`)}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section class="w-full max-w-2xl mt-14" aria-labelledby="st-doors">
    <h2 id="st-doors" class={h2}>{$t('structure.doors.title')}</h2>
    <p class={lede}>{$t('structure.doors.sub')}</p>
    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each DOORS as door (door.key)}
        <li class="{card} flex flex-col gap-2">
          <h3 class="{h3} flex items-center gap-2">
            <EntityIcon kind={door.icon} size={18} tone="brand" />
            {$t(`structure.doors.${door.key}.title`)}
          </h3>
          <p class={body}>{$t(`structure.doors.${door.key}.desc`)}</p>
          <a href={door.href} class="{link} mt-auto" data-sveltekit-prefetch
            >{$t(`structure.doors.${door.key}.cta`)}</a
          >
        </li>
      {/each}
    </ul>
  </section>

  <section class="w-full max-w-xl mt-14 mb-6 text-center">
    <h2 class={h2}>{$t('structure.cta.title')}</h2>
    <p class={lede}>{$t('structure.cta.sub')}</p>
    <a href={startHref} class={primary}>{$t('structure.cta.button')}</a>
  </section>
</main>
