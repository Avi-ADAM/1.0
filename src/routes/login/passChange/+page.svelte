<script>
  import axios from 'axios';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { fade } from 'svelte/transition';
  import { t } from '$lib/translations';

  const code = page.url.searchParams.get('code');

  let password = $state('');
  let showPassword = $state(false);
  let submitting = $state(false);
  let done = $state(false);
  let errorMsg = $state(null);

  // The first three requirements are shown to the user and gate the submit
  // button; the symbol check only feeds the 4th strength bar as a bonus.
  let validations = $derived([
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[$&+,:;=?@#]/.test(password)
  ]);
  let strength = $derived(validations.filter(Boolean).length);
  let canSubmit = $derived(
    validations[0] && validations[1] && validations[2]
  );

  function onSubmit(event) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    submitting = true;
    errorMsg = null;
    const trimmed = password.trim();
    axios
      .post('/api/auth/reset-password', {
        code,
        password: trimmed,
        passwordConfirmation: trimmed
      })
      .then(() => {
        done = true;
        setTimeout(() => goto('/login'), 3000);
      })
      .catch((error) => {
        console.error('reset-password failed:', error?.response || error);
        errorMsg = error?.response?.data?.message || $t('auth.change.error');
      })
      .finally(() => {
        submitting = false;
      });
  }
</script>

<svelte:head>
  <title>{$t('auth.change.title')}</title>
</svelte:head>

{#if !done}
  <h1 class="auth-heading">{$t('auth.change.heading')}</h1>
  <p class="auth-sub">{$t('auth.change.subtitle')}</p>

  {#if errorMsg}
    <div class="auth-alert" role="alert" in:fade>{errorMsg}</div>
  {/if}

  <form class="auth-form" onsubmit={onSubmit}>
    <div class="auth-field">
      <label class="auth-label" for="new-password"
        >{$t('auth.change.passwordLabel')}</label
      >
      <div class="auth-input-wrap">
        <span class="auth-input-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect
              x="4.5"
              y="10"
              width="15"
              height="10"
              rx="2"
              stroke="currentColor"
              stroke-width="1.7"
            />
            <path
              d="M8 10V7a4 4 0 0 1 8 0v3"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <input
          class="auth-input"
          id="new-password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          bind:value={password}
          placeholder={$t('auth.change.passwordPlaceholder')}
          autocomplete="new-password"
          aria-describedby="password-reqs"
          dir="ltr"
        />
        <button
          type="button"
          class="auth-toggle"
          onclick={() => (showPassword = !showPassword)}
          aria-label={showPassword
            ? $t('auth.login.hidePassword')
            : $t('auth.login.showPassword')}
          title={showPassword
            ? $t('auth.login.hidePassword')
            : $t('auth.login.showPassword')}
        >
          {#if showPassword}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path
                d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {:else}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path
                d="M2.45703 12C3.73128 7.94291 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <div class="strength" aria-hidden="true">
      <span class="bar" class:on={strength > 0}></span>
      <span class="bar" class:on={strength > 1}></span>
      <span class="bar" class:on={strength > 2}></span>
      <span class="bar" class:on={strength > 3}></span>
    </div>

    <ul class="reqs" id="password-reqs">
      <li class:ok={validations[0]}>
        <span class="req-mark" aria-hidden="true"
          >{validations[0] ? '✓' : '•'}</span
        >
        {$t('auth.change.req1')}
      </li>
      <li class:ok={validations[1]}>
        <span class="req-mark" aria-hidden="true"
          >{validations[1] ? '✓' : '•'}</span
        >
        {$t('auth.change.req2')}
      </li>
      <li class:ok={validations[2]}>
        <span class="req-mark" aria-hidden="true"
          >{validations[2] ? '✓' : '•'}</span
        >
        {$t('auth.change.req3')}
      </li>
    </ul>

    <button type="submit" class="auth-submit" disabled={!canSubmit || submitting}>
      {#if submitting}
        <span class="auth-spinner" aria-hidden="true"></span>
        {$t('auth.change.submitting')}
      {:else}
        {$t('auth.change.submit')}
      {/if}
    </button>
  </form>
{:else}
  <div class="auth-success" role="status">
    <span class="auth-success-icon" aria-hidden="true">💗</span>
    <h1 class="auth-heading" style="margin-top: 0.2rem;">
      {$t('auth.change.successTitle')}
    </h1>
    <p class="auth-sub">{$t('auth.change.successBody')}</p>
    <a class="auth-secondary" href="/login">{$t('auth.change.goToLogin')}</a>
  </div>
{/if}

<style>
  .strength {
    display: flex;
    gap: 6px;
    margin-top: -0.2rem;
  }
  .bar {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: #f0e3ea;
    transition: background-color 350ms ease;
  }
  .bar.on:nth-child(1) {
    background: #ff7ab8;
  }
  .bar.on:nth-child(2) {
    background: #ff4da3;
  }
  .bar.on:nth-child(3) {
    background: var(--barbi-pink, #ff0092);
  }
  .bar.on:nth-child(4) {
    background: #b38728;
  }

  .reqs {
    list-style: none;
    margin: 0;
    padding: 0.75rem 0.9rem;
    background: #fffdf6;
    border: 1px solid #d9bd6f;
    box-shadow: inset 0 1px 3px rgba(179, 135, 40, 0.1);
    border-radius: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.82rem;
    color: #8a5a75;
    text-align: start;
  }
  .reqs li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 250ms ease;
  }
  .reqs li.ok {
    color: #1c8a4d;
  }
  .req-mark {
    display: inline-grid;
    place-items: center;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    background: #f0e3ea;
    color: #b99a9f;
    font-size: 0.7rem;
    font-weight: 700;
    transition:
      background-color 250ms ease,
      color 250ms ease;
  }
  li.ok .req-mark {
    background: #d8f3e3;
    color: #1c8a4d;
  }
</style>
