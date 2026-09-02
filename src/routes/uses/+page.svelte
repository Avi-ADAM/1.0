<!--
  /uses - "does this fit MY case?"

  Customer B asked a concrete question and the site had nowhere to send him:
  "I want a partner programme for selling fruit and vegetables". He had already
  worked out the core value on his own - "I can run a blind partnership there,
  where the system derives each person's exact worth" - and still could not
  tell whether it applied to his business. The homepage explains the mechanism
  five different ways; it never once says what it looks like for a particular
  kind of work.

  Six doors. Two of them (land, group buying) already had dedicated pages and
  only link out. The rest are explained here because nothing covered them -
  and the first is his question, answered directly.

  The framing matters more than the list: the mechanism is one, and only what
  counts as "gave" changes between cases. Otherwise this reads as six products.
-->
<script>
  import { t, locale, isRtl } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { goto } from '$app/navigation';

  // The register route is spelled per language, the same mapping the homepage
  // and header use.
  let registerHref = $derived(
    $locale === 'he' ? '/hascama' : $locale === 'ar' ? '/aitifaqia' : '/convention'
  );

  // Order is deliberate: the cases this page had to explain come first, then
  // the two that only hand off to a page of their own.
  //
  // `concierge` is the odd one and sits last of the explained group on
  // purpose. The four above it are people forming a partnership; this one is
  // a customer, who is not forming anything - they arrive with a request and
  // the rikma is built around it. It goes to /wish/new rather than /concierge,
  // because the latter is the providers' side and lives behind registration,
  // while the visitor this card is written for is not registered and does not
  // intend to be.
  /** @type {{ key: string, icon: import('$lib/celim/icons/entityIcons').EntityIconKind, href: string }[]} */
  let cases = $derived([
    { key: 'sales', icon: 'growth', href: registerHref },
    { key: 'team', icon: 'mission', href: registerHref },
    { key: 'idea', icon: 'idea', href: '/availableMission' },
    { key: 'concierge', icon: 'wish', href: '/wish/new' },
    { key: 'land', icon: 'opportunity', href: '/grow' },
    { key: 'group', icon: 'members', href: '/quorum' }
  ]);
</script>

<svelte:head>
  <title>{$t('uses.meta.title')}</title>
  <meta name="description" content={$t('uses.meta.description')} />
  <meta property="og:title" content={$t('uses.meta.title')} />
  <meta property="og:description" content={$t('uses.meta.description')} />
  <meta property="og:type" content="website" />
</svelte:head>

<div class="wrap" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="hero">
    <h1>{$t('uses.hero.title')}</h1>
    <p class="lede">{$t('uses.hero.sub')}</p>
  </header>

  <div class="cases">
    {#each cases as c (c.key)}
      <article class="case">
        <span class="icon"><EntityIcon kind={c.icon} size={26} /></span>
        <h2>{$t(`uses.cases.${c.key}.title`)}</h2>
        <p class="who">{$t(`uses.cases.${c.key}.who`)}</p>
        <p class="how">{$t(`uses.cases.${c.key}.how`)}</p>
        <a class="cta" href={c.href} data-sveltekit-prefetch>
          {$t(`uses.cases.${c.key}.cta`)}
          <span aria-hidden="true">{$isRtl ? '←' : '→'}</span>
        </a>
      </article>
    {/each}
  </div>

  <section class="closing">
    <h2>{$t('uses.closing.title')}</h2>
    <p>{$t('uses.closing.sub')}</p>
    <button type="button" onclick={() => goto('/?demo=1')}>
      {$t('uses.closing.cta')}
    </button>
  </section>
</div>

<style>
  .wrap {
    max-width: 68rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 5rem;
    color: var(--text);
  }

  .hero {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .hero h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 800;
    color: var(--text);
  }

  .lede {
    margin: 0 auto;
    max-width: 44rem;
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--tm, #94a3b8);
  }

  .cases {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  }

  .case {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.4rem;
    border: 2px solid var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
    background: var(--s1, rgba(255, 255, 255, 0.06));
    box-shadow: var(--shadow-theme);
  }

  .icon {
    display: inline-flex;
    line-height: 1;
  }

  .case h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--gold);
  }

  .who {
    margin: 0;
    font-weight: 600;
    line-height: 1.55;
    color: var(--text);
  }

  .how {
    margin: 0;
    flex: 1;
    line-height: 1.7;
    color: var(--tm, #94a3b8);
  }

  .cta {
    margin-top: 0.4rem;
    align-self: flex-start;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    background: var(--barbi-pink);
    color: var(--gold);
    font-weight: 700;
    text-decoration: none;
  }

  .cta:hover {
    filter: brightness(1.12);
  }

  .closing {
    margin-top: 2.5rem;
    padding: 1.75rem;
    text-align: center;
    border: 2px solid var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
    background: var(--s2, rgba(255, 255, 255, 0.04));
  }

  .closing h2 {
    margin: 0 0 0.5rem;
    font-size: 1.3rem;
    color: var(--gold);
  }

  .closing p {
    margin: 0 auto 1.1rem;
    max-width: 40rem;
    line-height: 1.7;
    color: var(--tm, #94a3b8);
  }

  .closing button {
    padding: 0.65rem 1.6rem;
    border: 2px solid var(--gold);
    border-radius: 999px;
    background: var(--barbi-pink);
    color: var(--gold);
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
  }

  .closing button:hover {
    filter: brightness(1.12);
  }
</style>
