<script>
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import MissionOffersEditor from '$lib/components/offerings/MissionOffersEditor.svelte';
  import MyProductsSection from '$lib/components/offerings/MyProductsSection.svelte';
  import { t } from '$lib/translations';

  /**
   * Provider onboarding — offerings step (PLAN_USER_OFFERINGS §4.2 / M7).
   * The same editors as /me ("missions I do" + "my products"), so anything
   * added here is immediately manageable from the profile.
   */

  let { data } = $props();
  let going = $state(false);

  function finish() {
    going = true;
    setTimeout(() => goto('/onboard/done'), 220);
  }
</script>

<svelte:head>
  <title>{$t('offerings.onboard.title')}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip
      stepIdx={5}
      totalSteps={6}
      label={$t('offerings.onboard.journey')}
    />
  {/snippet}

  <div class="content" in:fly={{ y: 24, duration: 500, opacity: 0.4 }}>
    <h1>{$t('offerings.onboard.title')}</h1>
    <p class="sub">{$t('offerings.onboard.sub')}</p>

    <div class="editors">
      <MissionOffersEditor uid={data.uid} />
      <MyProductsSection uid={data.uid} />
    </div>

    <div class="actions">
      <button class="primary" onclick={finish} disabled={going}>
        {$t('offerings.onboard.continue')}
      </button>
      <a class="skip" href="/onboard/done">{$t('offerings.onboard.skip')}</a>
    </div>
  </div>
</ScreenFrame>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    width: 100%;
    max-width: 30rem;
    margin: 0 auto;
    padding: 0.5rem 0 2rem;
  }
  h1 {
    font-size: 1.4rem;
    font-weight: 700;
    text-align: center;
  }
  .sub {
    opacity: 0.75;
    text-align: center;
    font-size: 0.9rem;
  }
  .editors {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
  .actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .primary {
    border: none;
    cursor: pointer;
    border-radius: 9999px;
    padding: 0.7rem 2.2rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(90deg, #ff0092, #ff77b0);
    box-shadow: 0 6px 20px rgba(255, 0, 146, 0.35);
  }
  .primary:disabled {
    opacity: 0.6;
  }
  .skip {
    font-size: 0.85rem;
    opacity: 0.7;
    text-decoration: underline;
    color: inherit;
  }
</style>
