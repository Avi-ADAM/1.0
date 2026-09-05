<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import MyResourcesEditor from '$lib/components/offerings/MyResourcesEditor.svelte';
  import { t } from '$lib/translations';

  /**
   * Provider onboarding — resources step (PLAN_ONBOARDING M5).
   *
   * The things and places a member already owns and is willing to share: with
   * rikmot as a partnership investment, with customers directly, or both. Until
   * now this only existed at /me, after onboarding, which is why almost nobody
   * filled it in — and the CV's resource findings were saved as bare rows that
   * no rikma could ever match against.
   *
   * The editor is the same one the profile uses, so nothing added here has to
   * be re-entered later.
   */

  let { data } = $props();
  let going = $state(false);
  /** @type {{ name: string, descrip?: string }[]} */
  let proposed = $state([]);

  onMount(() => {
    // Resources the CV/description analysis spotted, handed over by the review
    // screen. They are suggestions only — nothing is created until the member
    // fills in the details and saves.
    try {
      const raw = sessionStorage.getItem('onboard.proposedSps');
      if (raw) proposed = JSON.parse(raw) || [];
    } catch {
      // ignore — the step simply starts with no suggestions
    }
  });

  function next() {
    going = true;
    setTimeout(() => goto('/onboard/provider/offers'), 220);
  }
</script>

<svelte:head>
  <title>{$t('onboard.provider.resources_page.title')}</title>
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
      label={$t('onboard.provider.resources_page.journey')}
    />
  {/snippet}

  <div class="content" in:fly={{ y: 24, duration: 500, opacity: 0.4 }}>
    <h1>{$t('onboard.provider.resources_page.title')}</h1>
    <p class="sub">{$t('onboard.provider.resources_page.sub')}</p>

    <ul class="modes">
      <li>
        <span class="m-ico">🔁</span>
        <span
          ><b>{$t('onboard.provider.resources_page.mode_recurring')}</b>
          {$t('onboard.provider.resources_page.mode_recurring_ex')}</span
        >
      </li>
      <li>
        <span class="m-ico">🎁</span>
        <span
          ><b>{$t('onboard.provider.resources_page.mode_once')}</b>
          {$t('onboard.provider.resources_page.mode_once_ex')}</span
        >
      </li>
      <li>
        <span class="m-ico">🗓️</span>
        <span
          ><b>{$t('onboard.provider.resources_page.mode_period')}</b>
          {$t('onboard.provider.resources_page.mode_period_ex')}</span
        >
      </li>
    </ul>

    <MyResourcesEditor uid={data.uid} {proposed} />

    <div class="actions">
      <button class="primary" onclick={next} disabled={going}>
        {$t('onboard.provider.resources_page.continue')}
      </button>
      <a class="skip" href="/onboard/provider/offers"
        >{$t('onboard.provider.resources_page.skip')}</a
      >
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
  .modes {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
    padding: 0.75rem 0.9rem;
    list-style: none;
    border-radius: 0.9rem;
    background: rgba(218, 165, 32, 0.12);
    border: 1px solid rgba(218, 165, 32, 0.3);
  }
  .modes li {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    font-size: 0.8rem;
    line-height: 1.35;
  }
  .m-ico {
    flex-shrink: 0;
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
