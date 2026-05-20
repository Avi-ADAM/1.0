<script>
  import CvUpload from '$lib/components/main/cvupload.svelte';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';
  import Tabs from '$lib/components/onboard/Tabs.svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { t } from '$lib/translations';

  const providerTabs = $derived([
    { icon: '💡', label: $t('onboard.provider.tabs.values') },
    { icon: '🛠', label: $t('onboard.provider.tabs.skills') },
    { icon: '🎭', label: $t('onboard.provider.tabs.roles') },
    { icon: '🌿', label: $t('onboard.provider.tabs.style') }
  ]);
</script>

<svelte:head>
  <title>{$t('onboard.provider.cv_page.title')}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip
      stepIdx={4}
      totalSteps={6}
      label={$t('onboard.provider.cv_page.journey')}
    />
  {/snippet}
  {#snippet tabs()}
    <Tabs items={providerTabs} current={0} />
  {/snippet}

  <div
    class="content"
    in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}
  >
    <Plaque
      title={$t('onboard.provider.cv_page.plaque.title')}
      sub={$t('onboard.provider.cv_page.plaque.sub')}
    />

    <div class="cv-wrap" in:fly={{ y: 10, duration: 400, delay: 120 }}>
      <CvUpload />
    </div>

    <div class="tile-info">
      {$t('onboard.provider.cv_page.info')}
    </div>

    <div class="actions">
      <a href="/onboard/provider" class="btn btn-ghost"
        >{$t('onboard.provider.cv_page.back_choice')}</a
      >
      <a href="/onboard/provider/manual" class="btn btn-skip"
        >{$t('onboard.actions.skip_manual')}</a
      >
    </div>
  </div>
</ScreenFrame>

<style>
  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 4px;
  }
  .cv-wrap {
    width: 100%;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 4px;
  }
</style>
