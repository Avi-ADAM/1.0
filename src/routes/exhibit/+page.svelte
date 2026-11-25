<!--
  /exhibit — 1💗1 as an interactive installation for an art and makers' fair
  (docs/tbd/PLAN_EXHIBITION_MODE.md). Full screen, mouse and keyboard, he/en,
  no site header or footer (the root layout steps aside on this route), and a
  sandbox that lives in memory: nothing a visitor does reaches a real member.
-->
<script>
  import { fade } from 'svelte/transition';
  import { t } from '$lib/translations';
  import { ExhibitSandbox } from '$lib/exhibit/sandbox.svelte';
  import ExhibitShell from '$lib/components/exhibit/ExhibitShell.svelte';
  import StepWelcome from '$lib/components/exhibit/StepWelcome.svelte';
  import StepIdea from '$lib/components/exhibit/StepIdea.svelte';
  import StepConnection from '$lib/components/exhibit/StepConnection.svelte';
  import StepSoon from '$lib/components/exhibit/StepSoon.svelte';

  let { data } = $props();

  const sandbox = new ExhibitSandbox();
</script>

<svelte:head>
  <title>{$t('exhibit.meta.title')}</title>
  <meta name="robots" content="noindex, nofollow" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap"
  />
</svelte:head>

<ExhibitShell {sandbox} idleSeconds={data.idleSeconds} fullscreen={data.fullscreen}>
  {#key `${sandbox.round}:${sandbox.step}`}
    <div class="step" in:fade={{ duration: 450, delay: 150 }} out:fade={{ duration: 200 }}>
      {#if sandbox.step === 'welcome'}
        <StepWelcome {sandbox} />
      {:else if sandbox.step === 'idea'}
        <StepIdea {sandbox} aiPass={data.aiPass} />
      {:else if sandbox.step === 'connection'}
        <StepConnection {sandbox} />
      {:else}
        <StepSoon {sandbox} />
      {/if}
    </div>
  {/key}
</ExhibitShell>

<style>
  .step {
    grid-area: 1 / 1;
    display: grid;
    min-height: 0;
  }
</style>
