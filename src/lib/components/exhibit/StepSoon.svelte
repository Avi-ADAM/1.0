<!--
  Stand-in for the steps not built yet (E2–E4 of PLAN_EXHIBITION_MODE), so the
  thread can already run end to end. Removed once the last step lands.
-->
<script>
  import { fade } from 'svelte/transition';
  import { t } from '$lib/translations';

  /** @type {{ sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox }} */
  let { sandbox } = $props();
</script>

<section class="soon" in:fade={{ duration: 400 }}>
  <h1 class="ex-display">{$t('exhibit.soon.title')}</h1>
  <p>{$t('exhibit.soon.sub', { step: $t(`exhibit.steps.${sandbox.step}`) })}</p>
  <div class="row">
    <button type="button" class="ex-btn ex-btn-ghost" onclick={() => sandbox.back()}>{$t('exhibit.chrome.back')}</button>
    {#if !sandbox.isLast}
      <button type="button" class="ex-btn ex-btn-primary" onclick={() => sandbox.next()}>{$t('exhibit.chrome.next')}</button>
    {/if}
  </div>
</section>

<style>
  .soon {
    place-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
  }
  h1 {
    font-size: clamp(2.6rem, 4.4vw, 5.5rem);
  }
  p {
    margin: 0;
    font-size: clamp(1.25rem, 1.7vw, 2rem);
    color: var(--ex-ink-soft);
  }
  .row {
    display: flex;
    gap: 1.25rem;
  }
</style>
