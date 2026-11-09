<script>
  import { t, isRtl } from '$lib/translations';

  let { form } = $props();
</script>

<svelte:head>
  <title>{$t('home.amana.stopMail.title')}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="stop-page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <section class="stop-card">
    <h1 class="stop-title">{$t('home.amana.stopMail.title')}</h1>
    {#if form?.done}
      <p role="status">{$t('home.amana.stopMail.done')}</p>
    {:else}
      <p>{$t('home.amana.stopMail.body')}</p>
      <form method="POST">
        <button type="submit" class="stop-button">{$t('home.amana.stopMail.button')}</button>
      </form>
      {#if form?.invalid}
        <p class="stop-error" role="alert">{$t('home.amana.stopMail.invalid')}</p>
      {/if}
    {/if}
  </section>
</main>

<style>
  .stop-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: #f4f1ea;
    color: #1f2430;
  }

  .stop-card {
    width: 100%;
    max-width: 440px;
    padding: 28px 24px;
    background: #ffffff;
    border-radius: 12px;
  }

  .stop-title {
    margin: 0 0 12px;
    font-size: 1.4rem;
    font-weight: 700;
  }

  .stop-button {
    margin-top: 16px;
    padding: 12px 20px;
    background: #2f5d50;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
  }

  .stop-error {
    margin-top: 12px;
    color: #b42318;
  }
</style>
