<script>
  import { t, locale } from '$lib/translations';

  const questionCount = 13;
  const questionKeys = Array.from({ length: questionCount }, (_, i) => i + 1);
</script>

<div class="faq-container" dir={$locale === 'en' ? 'ltr' : 'rtl'}>
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
    color: #333;
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
