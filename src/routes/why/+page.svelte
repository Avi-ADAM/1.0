<!--
  /why - the page behind the product.

  Everything else on the site explains what the system does. This one says why
  it is shaped that way at all: work relationships rest on consent that was
  given once, long ago, and is never re-checked; here every step is re-checked.

  Three deliberate constraints, because the subject is easy to get wrong:

  1. The claim is about the *arrangement*, never about people. Research on
     system justification is explicit that criticism aimed at a system people
     depend on hardens their defence of it - and most readers here are either
     employed or employing. So every section that names a cost also names that
     the people inside it mean well.

  2. The reader's exit is offered twice, in the hero and in `biz` ("skip this
     page", "you can ignore all of it"). That is the documented antidote to
     reactance, and it is also honest: the platform genuinely works as a plain
     management tool.

  3. Nothing is asserted in our own voice that a named source can carry
     instead. Rosenberg on request vs demand, Ellerman on inalienability,
     Anderson on private government, Gallup on the cost, Morning Star and
     Pérotin on it working anyway. Hence the `sources` block at the foot: the
     page is meant to be shared into places where claims get checked.

  The words "tikkun olam" / "repair the world" appear nowhere on purpose. The
  term is contested and religiously marked, and it would file the argument
  under a worldview instead of leaving it where it belongs - two people, one
  sentence, and what happens when the answer is no.
-->
<script>
  import { t, locale, isRtl } from '$lib/translations';

  // Same per-language register route the homepage and /uses use.
  let registerHref = $derived(
    $locale === 'he' ? '/hascama' : $locale === 'ar' ? '/aitifaqia' : '/convention'
  );

  const arrow = $derived($isRtl ? '←' : '→');

  const ANSWERS = ['a1', 'a2', 'a3'];
  const MECHANICS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
  const NOTS = ['n1', 'n2', 'n3', 'n4', 'n5'];
  const SOURCES = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
  const STATS = ['stat1', 'stat2', 'stat3'];
</script>

<svelte:head>
  <title>{$t('why.meta.title')}</title>
  <meta name="description" content={$t('why.meta.description')} />
  <meta property="og:title" content={$t('why.meta.title')} />
  <meta property="og:description" content={$t('why.meta.description')} />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="https://1lev1.com/why" />
</svelte:head>

<article class="wrap" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="hero">
    <p class="eyebrow">{$t('why.hero.eyebrow')}</p>
    <h1>{$t('why.hero.title')}</h1>
    <p class="lede">{$t('why.hero.lede')}</p>
    <p class="note">{$t('why.hero.note')}</p>
  </header>

  <!-- 1. request vs demand -->
  <section>
    <p class="kicker">{$t('why.ask.kicker')}</p>
    <h2>{$t('why.ask.title')}</h2>
    <p>{$t('why.ask.p1')}</p>
    <p class="beat">{$t('why.ask.p2')}</p>
    <figure class="quote">
      <blockquote>{$t('why.ask.quote')}</blockquote>
      <figcaption>{$t('why.ask.cite')}</figcaption>
    </figure>
    <p>{$t('why.ask.p3')}</p>
    <p class="soft">{$t('why.ask.p4')}</p>
  </section>

  <!-- 2. consent given once -->
  <section>
    <p class="kicker">{$t('why.once.kicker')}</p>
    <h2>{$t('why.once.title')}</h2>
    <p>{$t('why.once.p1')}</p>
    <p>{$t('why.once.p2')}</p>
    <figure class="quote">
      <blockquote>{$t('why.once.quote')}</blockquote>
      <figcaption>{$t('why.once.cite')}</figcaption>
    </figure>
    <p>{$t('why.once.p3')}</p>
    <figure class="quote">
      <blockquote>{$t('why.once.quote2')}</blockquote>
      <figcaption>{$t('why.once.cite2')}</figcaption>
    </figure>
    <p>{$t('why.once.p4')}</p>
  </section>

  <!-- 3. the cost, in numbers -->
  <section class="panel">
    <p class="kicker">{$t('why.price.kicker')}</p>
    <h2>{$t('why.price.title')}</h2>
    <p>{$t('why.price.p1')}</p>
    <div class="stats">
      {#each STATS as s (s)}
        <div class="stat">
          <span class="statv">{$t(`why.price.${s}v`)}</span>
          <span class="statl">{$t(`why.price.${s}l`)}</span>
        </div>
      {/each}
    </div>
    <p class="source">{$t('why.price.source')}</p>
    <p>{$t('why.price.p2')}</p>
  </section>

  <!-- 4. negotiation instead of authority -->
  <section>
    <p class="kicker">{$t('why.other.kicker')}</p>
    <h2>{$t('why.other.title')}</h2>
    <p>{$t('why.other.p1')}</p>
    <div class="answers">
      {#each ANSWERS as a (a)}
        <div class="answer">
          <h3>{$t(`why.other.${a}t`)}</h3>
          <p>{$t(`why.other.${a}d`)}</p>
        </div>
      {/each}
    </div>
    <p class="beat">{$t('why.other.silence')}</p>
    <p>{$t('why.other.p2')}</p>
  </section>

  <!-- 5. it also works commercially -->
  <section>
    <p class="kicker">{$t('why.works.kicker')}</p>
    <h2>{$t('why.works.title')}</h2>
    <p>{$t('why.works.p1')}</p>
    <figure class="quote">
      <blockquote>{$t('why.works.quote')}</blockquote>
      <figcaption>{$t('why.works.cite')}</figcaption>
    </figure>
    <p>{$t('why.works.p2')}</p>
    <p>{$t('why.works.p3')}</p>
    <figure class="quote">
      <blockquote>{$t('why.works.quote2')}</blockquote>
      <figcaption>{$t('why.works.cite2')}</figcaption>
    </figure>
    <p>{$t('why.works.p4')}</p>
  </section>

  <!-- 6. where it lives in the product -->
  <section class="panel">
    <p class="kicker">{$t('why.how.kicker')}</p>
    <h2>{$t('why.how.title')}</h2>
    <p class="sub">{$t('why.how.sub')}</p>
    <ul class="mechanics">
      {#each MECHANICS as r (r)}
        <li>
          <h3>{$t(`why.how.${r}t`)}</h3>
          <p>{$t(`why.how.${r}d`)}</p>
        </li>
      {/each}
    </ul>
    <div class="links">
      <a href="/consensus" data-sveltekit-prefetch>
        {$t('why.how.ctaConsensus')} <span aria-hidden="true">{arrow}</span>
      </a>
      <a href="/guid" data-sveltekit-prefetch>
        {$t('why.how.ctaGuide')} <span aria-hidden="true">{arrow}</span>
      </a>
    </div>
  </section>

  <!-- 7. what this is not -->
  <section>
    <p class="kicker">{$t('why.not.kicker')}</p>
    <h2>{$t('why.not.title')}</h2>
    <ul class="nots">
      {#each NOTS as n (n)}
        <li>
          <h3>{$t(`why.not.${n}t`)}</h3>
          <p>{$t(`why.not.${n}d`)}</p>
        </li>
      {/each}
    </ul>
  </section>

  <!-- 8. explicit permission to ignore all of it -->
  <section class="aside">
    <h2>{$t('why.biz.title')}</h2>
    <p>{$t('why.biz.p1')}</p>
    <p>{$t('why.biz.p2')}</p>
  </section>

  <section class="closing">
    <h2>{$t('why.close.title')}</h2>
    <p>{$t('why.close.p1')}</p>
    <p>{$t('why.close.p2')}</p>
    <div class="ctas">
      <a class="primary" href={registerHref} data-sveltekit-prefetch>
        {$t('why.close.ctaPrimary')}
      </a>
      <a class="ghost" href="/consensus" data-sveltekit-prefetch>
        {$t('why.close.ctaSecondary')}
      </a>
      <a class="ghost" href="https://agreement.1lev1.com" target="_blank" rel="noopener">
        {$t('why.close.ctaAgreement')}
      </a>
    </div>
  </section>

  <footer class="sources">
    <h2>{$t('why.sources.title')}</h2>
    <ul>
      {#each SOURCES as s (s)}
        <li dir="ltr">{$t(`why.sources.${s}`)}</li>
      {/each}
    </ul>
  </footer>
</article>

<style>
  .wrap {
    max-width: 46rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 5rem;
    color: var(--text);
    font-size: 1.05rem;
    line-height: 1.85;
  }

  .hero {
    text-align: center;
    margin-bottom: 3rem;
  }

  .eyebrow,
  .kicker {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--barbi-pink);
  }

  h1 {
    margin: 0 0 1rem;
    font-size: clamp(1.7rem, 5vw, 2.6rem);
    font-weight: 800;
    line-height: 1.25;
    color: var(--gold);
  }

  h2 {
    margin: 0 0 1rem;
    font-size: clamp(1.25rem, 3.2vw, 1.6rem);
    font-weight: 800;
    line-height: 1.35;
    color: var(--gold);
  }

  h3 {
    margin: 0 0 0.3rem;
    font-size: 1.02rem;
    font-weight: 700;
    color: var(--text);
  }

  .lede {
    margin: 0 auto 1rem;
    max-width: 36rem;
    font-size: 1.15rem;
  }

  .note {
    margin: 0 auto;
    max-width: 34rem;
    padding: 0.75rem 1rem;
    border: 1px dashed var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
    font-size: 0.95rem;
    line-height: 1.7;
    color: var(--tm, #94a3b8);
  }

  section {
    margin-bottom: 3rem;
  }

  p {
    margin: 0 0 1.1rem;
  }

  .beat {
    font-weight: 700;
    font-size: 1.12rem;
  }

  .soft,
  .sub,
  .source {
    color: var(--tm, #94a3b8);
  }

  .sub {
    margin-top: -0.5rem;
  }

  .source {
    font-size: 0.9rem;
    margin-top: -0.4rem;
  }

  /* Pull quotes carry the page's hardest claims, so they are visually the
     loudest thing in it - the argument is meant to be readable as a chain of
     attributed statements even by someone who only skims. */
  .quote {
    margin: 1.6rem 0;
    padding: 1.1rem 1.3rem;
    border-inline-start: 4px solid var(--barbi-pink);
    border-radius: var(--radius-theme, 0.75rem);
    background: var(--s1, rgba(255, 255, 255, 0.06));
  }

  blockquote {
    margin: 0 0 0.5rem;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.65;
  }

  figcaption {
    font-size: 0.9rem;
    color: var(--tm, #94a3b8);
  }

  .panel {
    padding: 1.75rem 1.5rem 1.5rem;
    border: 2px solid var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
    background: var(--s2, rgba(255, 255, 255, 0.04));
    box-shadow: var(--shadow-theme);
  }

  .stats {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    margin: 1.4rem 0 0.9rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
  }

  .statv {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--barbi-pink);
    line-height: 1.1;
  }

  .statl {
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--tm, #94a3b8);
  }

  .answers {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    margin: 1.4rem 0;
  }

  .answer {
    padding: 1rem 1.1rem;
    border: 2px solid var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
    background: var(--s1, rgba(255, 255, 255, 0.06));
  }

  .answer p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.65;
    color: var(--tm, #94a3b8);
  }

  .mechanics,
  .nots {
    list-style: none;
    margin: 1.2rem 0;
    padding: 0;
    display: grid;
    gap: 1rem;
  }

  .mechanics li,
  .nots li {
    padding-inline-start: 1rem;
    border-inline-start: 3px solid var(--gold);
  }

  .mechanics p,
  .nots p {
    margin: 0;
    font-size: 0.98rem;
    line-height: 1.7;
    color: var(--tm, #94a3b8);
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 1.2rem;
  }

  .links a {
    font-weight: 700;
    color: var(--barbi-pink);
    text-decoration: none;
  }

  .links a:hover {
    text-decoration: underline;
  }

  .aside {
    padding: 1.4rem 1.5rem 0.4rem;
    border: 1px dashed var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
  }

  .aside h2 {
    font-size: 1.15rem;
  }

  .closing {
    text-align: center;
    padding: 2rem 1.5rem;
    border: 2px solid var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
    background: var(--s2, rgba(255, 255, 255, 0.04));
  }

  .ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    justify-content: center;
  }

  .ctas a {
    padding: 0.6rem 1.4rem;
    border-radius: 999px;
    font-weight: 700;
    text-decoration: none;
    border: 2px solid var(--gold);
  }

  .primary {
    background: var(--barbi-pink);
    color: var(--gold);
  }

  .ghost {
    color: var(--gold);
  }

  .ctas a:hover {
    filter: brightness(1.12);
  }

  .sources {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--gold);
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--tm, #94a3b8);
  }

  .sources h2 {
    font-size: 1rem;
  }

  .sources ul {
    margin: 0;
    padding-inline-start: 1.1rem;
    display: grid;
    gap: 0.5rem;
  }
</style>
