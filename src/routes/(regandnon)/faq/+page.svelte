<script>
  import { t, isRtl } from '$lib/translations';
  import { faqPage, jsonLdBody } from '$lib/seo/jsonLd.js';

  const questionCount = 13;
  const questionKeys = Array.from({ length: questionCount }, (_, i) => i + 1);

  /* The FAQPage entity, built from the very keys the markup below renders.
     Structured data has to describe what the page actually shows, so the list
     is derived rather than kept as a second copy that could drift - and it is
     reactive because `$t` resolves per locale, so the entity is emitted in
     whatever language the page is being served in. */
  const faqLd = $derived(
    faqPage(
      questionKeys.map((i) => ({
        question: $t(`faq.q${i}`),
        // The markup turns newlines into <br>; the entity wants plain text.
        answer: $t(`faq.a${i}`).split('\n').join(' ')
      }))
    )
  );
</script>

<svelte:head>
  <title>{$t('faq.title')} · 1lev1</title>
  <!-- Was a `$locale === 'he' ? … : …` ternary, which is the inline-dictionary
       regression CLAUDE.md warns about: Arabic, Russian and Spanish visitors
       all got the English sentence. One key, five files. -->
  <meta name="description" content={$t('faq.metaDescription')} />
  <meta property="og:title" content="{$t('faq.title')} · 1lev1" />
  <meta property="og:description" content={$t('faq.metaDescription')} />
  <meta property="og:type" content="website" />
  {#if faqLd}
    {@html `<script type="application/ld+json">${jsonLdBody(faqLd)}<\/script>`}
  {/if}
</svelte:head>

<div class="faq-container" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h1>{$t('faq.title')}</h1>

  <div class="faq-list">
    {#each questionKeys as i}
      <div class="faq-item">
        <h2 class="question">{$t(`faq.q${i}`)}</h2>
        <div class="answer">{@html $t(`faq.a${i}`).split('\n').join('<br>')}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .faq-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    /* Was a hardcoded #333. The heading sits on the page background - the
       cards below set their own white surface, but this does not - and in the
       personal palette that background is --bg: #070606, in every mode. The
       result measured 1.6:1 and read as an almost invisible title, which
       axe-core flagged. --text is the token defined to flip together with
       --bg in all three palettes, so it is legible on each of them. */
    color: var(--text, #333);
    margin-bottom: 2rem;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .faq-item {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .question {
    color: #2a2a2a;
    font-size: 1.2rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .answer {
    color: #444;
    line-height: 1.6;
  }

  /* RTL specific styles */
  :global([dir='rtl']) .faq-item {
    text-align: right;
  }

  :global([dir='ltr']) .faq-item {
    text-align: left;
  }
</style>
