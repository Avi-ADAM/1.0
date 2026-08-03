<script>
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { enhance } from '$app/forms';
  import { t } from '$lib/translations';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';

  let { data, form } = $props();

  let sending = $state(false);

  // A successful confirmation never renders — the load redirects. What reaches
  // this page is a spent/unknown token, a link with no token at all, or Strapi
  // being unreachable.
  const title = $derived(
    data.state === 'error'
      ? $t('auth.confirm.errorTitle')
      : data.state === 'missing'
        ? $t('auth.confirm.missingTitle')
        : $t('auth.confirm.spentTitle')
  );
  const body = $derived(
    data.state === 'error'
      ? $t('auth.confirm.errorBody')
      : data.state === 'missing'
        ? $t('auth.confirm.missingBody')
        : $t('auth.confirm.spentBody')
  );
</script>

<svelte:head>
  <title>{$t('auth.confirm.pageTitle')}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip stepIdx={2} totalSteps={6} label={$t('auth.confirm.step')} />
  {/snippet}

  <div class="content" in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}>
    <div class="mark" aria-hidden="true">💌</div>

    <Plaque {title} sub={data.state === 'spent' ? $t('auth.confirm.spentSub') : ''} />

    <div class="tile-info">{body}</div>

    <a href="/login" class="btn btn-key">{$t('auth.confirm.goToLogin')}</a>

    {#if data.state !== 'error'}
      {#if form?.resent}
        <p class="resent-msg" in:fly={{ y: -4, duration: 300 }}>
          {$t('auth.confirm.resent')}
        </p>
      {:else}
        <form
          method="POST"
          action="?/resend"
          class="resend"
          use:enhance={() => {
            sending = true;
            return async ({ update }) => {
              await update({ reset: false });
              sending = false;
            };
          }}
        >
          {#if !data.email}
            <input
              class="mail-input"
              type="email"
              name="email"
              placeholder={$t('auth.confirm.emailPlaceholder')}
              autocomplete="email"
              dir="ltr"
              required
            />
          {:else}
            <input type="hidden" name="email" value={data.email} />
          {/if}
          <button class="btn btn-ghost" type="submit" disabled={sending}>
            {sending ? $t('auth.confirm.resending') : $t('auth.confirm.resend')}
          </button>
        </form>
      {/if}
    {/if}

    <div class="footer">{$t('auth.confirm.help')}</div>
  </div>
</ScreenFrame>

<style>
  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 12px 8px;
  }
  .mark {
    font-size: 3.4rem;
    filter: drop-shadow(0 4px 10px rgba(190, 24, 93, 0.35));
  }
  .resend {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .mail-input {
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid rgba(154, 107, 16, 0.35);
    font-size: 13px;
    min-width: 230px;
    text-align: center;
  }
  .resent-msg {
    font-size: 13px;
    font-weight: 700;
    color: #15803d;
    margin: 0;
  }
  .footer {
    font-size: 12px;
    color: #9a6b10;
    text-align: center;
    opacity: 0.9;
  }
</style>
