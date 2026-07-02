<script>
  import axios from 'axios';
  import { fade } from 'svelte/transition';
  import { t } from '$lib/translations';

  let email = $state('');
  let sending = $state(false);
  let sent = $state(false);
  let errorMsg = $state(null);

  function onSubmit(event) {
    event.preventDefault();
    if (sending) return;
    sending = true;
    errorMsg = null;
    axios
      .post('/api/auth/forgot-password', { email })
      .then(() => {
        sent = true;
      })
      .catch((error) => {
        console.error('forgot-password failed:', error?.response || error);
        errorMsg = $t('auth.reset.error');
      })
      .finally(() => {
        sending = false;
      });
  }
</script>

<svelte:head>
  <title>{$t('auth.reset.title')}</title>
</svelte:head>

{#if !sent}
  <h1 class="auth-heading">{$t('auth.reset.heading')}</h1>
  <p class="auth-sub">{$t('auth.reset.subtitle')}</p>

  {#if errorMsg}
    <div class="auth-alert" role="alert" in:fade>{errorMsg}</div>
  {/if}

  <form class="auth-form" onsubmit={onSubmit}>
    <div class="auth-field">
      <label class="auth-label" for="reset-email"
        >{$t('auth.reset.emailLabel')}</label
      >
      <div class="auth-input-wrap">
        <span class="auth-input-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              stroke-width="1.7"
            />
            <path
              d="m3.5 7 8.5 6 8.5-6"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <input
          class="auth-input"
          id="reset-email"
          type="email"
          bind:value={email}
          placeholder={$t('auth.reset.emailPlaceholder')}
          required
          autocomplete="email"
          dir="ltr"
        />
      </div>
    </div>

    <button type="submit" class="auth-submit" disabled={!email || sending}>
      {#if sending}
        <span class="auth-spinner" aria-hidden="true"></span>
        {$t('auth.reset.sending')}
      {:else}
        {$t('auth.reset.send')}
      {/if}
    </button>

    <a class="auth-secondary" href="/login">{$t('auth.reset.backToLogin')}</a>
  </form>
{:else}
  <div class="auth-success" role="status">
    <span class="auth-success-icon" aria-hidden="true">💌</span>
    <h1 class="auth-heading" style="margin-top: 0.2rem;">
      {$t('auth.reset.successTitle')}
    </h1>
    <p class="auth-sub">{$t('auth.reset.successBody')}</p>
    <a class="auth-secondary" href="/login">{$t('auth.reset.backToLogin')}</a>
  </div>
{/if}
