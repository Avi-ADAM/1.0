<script>
  import { t } from '$lib/translations';
  import { onMount, untrack } from 'svelte';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';

  import {
    emailValidator,
    requiredValidator
  } from '$lib/celim/validators.js';
  import { createFieldValidator } from '$lib/celim/validation.js';

  let { data, form } = $props();

  let active = $state(false);
  // Prefilled from the `email` cookie (signup / email confirmation) so the
  // returning user only types a password. The password itself is never
  // prefilled — that is the browser's password manager to offer, via the
  // autocomplete hints below.
  let email = $state(untrack(() => data?.prefillEmail ?? ''));
  let password = $state('');
  let showPassword = $state(false);
  /** @type {HTMLInputElement | undefined} */
  let passwordEl = $state();

  // Landing here from the mail link with the address already filled: the only
  // thing left to do is the password, so start there. On mount only — as an
  // $effect it would yank focus away every time the email field is edited.
  onMount(() => {
    if (email) passwordEl?.focus();
  });
  // Writable derived: tracks the form action's error, but can be cleared
  // locally when a new submit starts.
  let loginError = $derived(form?.error ?? null);
  // Already filtered by the load — see $lib/auth/redirectTarget.js.
  let redirectTo = $derived(data?.from || '');

  const [validity, validate] = createFieldValidator(
    requiredValidator(),
    emailValidator()
  );
</script>

<svelte:head>
  <title>{$t('auth.login.title')}</title>
</svelte:head>

<!-- Both headings ship and CSS picks one, for the same reason the brand mark in
     +layout.svelte does: `html.business` is stamped server-side, so a class
     branch is right on the first frame. `display:none` also drops the unused
     one from the accessibility tree, so a screen reader hears a single title. -->
<h1 class="auth-heading">
  <span class="heading-personal">{$t('auth.login.heading')}</span
  ><span class="heading-business">{$t('auth.login.headingSharp')}</span>
</h1>
<p class="auth-sub">{$t('auth.login.subtitle')}</p>

{#if data?.expired && !loginError}
  <div class="auth-note" role="status" in:fade>
    <strong>{$t('auth.expired.title')}</strong>
    {$t('auth.expired.body')}
  </div>
{/if}

{#if data?.confirmed && !loginError}
  <div class="auth-ok" role="status" in:fade>
    {$t('auth.login.emailConfirmed')}
  </div>
{/if}

{#if loginError}
  <div class="auth-alert" role="alert" in:fade>
    {loginError}
    <br />
    <a href="/login/passwordReset">{$t('auth.login.forgotPasswordLink')}</a>
  </div>
{/if}

<form
  class="auth-form"
  method="POST"
  action="?/login"
  use:enhance={() => {
    active = true;
    loginError = null;
    // Capture the intended destination before the async response arrives.
    const fallbackDest = data?.from || '/onboard';
    return async ({ result, update }) => {
      // NB: result.type === 'success' just means the action returned
      // (didn't throw / didn't call fail()). It does NOT mean the login
      // itself succeeded — the action returns { success: false, error }
      // on wrong-password etc. We must inspect result.data.success.
      if (result.type === 'success' && result.data?.success) {
        // Full browser navigation so the auth cookies set by the action
        // are definitely in the cookie jar before the next request.
        window.location.href = result.data.redirectTo || fallbackDest;
      } else {
        // Wrong password / server error — surface the message on the page.
        await update();
        active = false;
      }
    };
  }}
>
  <div class="auth-field">
    <label class="auth-label" for="email">{$t('auth.login.emailLabel')}</label>
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
        class:invalid={email && !$validity.valid}
        type="email"
        name="email"
        id="email"
        bind:value={email}
        use:validate={email}
        placeholder={$t('auth.login.emailPlaceholder')}
        aria-required="true"
        autocomplete="email"
        dir="ltr"
      />
    </div>
  </div>

  <div class="auth-field">
    <label class="auth-label" for="password"
      >{$t('auth.login.passwordLabel')}</label
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
        type={showPassword ? 'text' : 'password'}
        name="password"
        id="password"
        bind:this={passwordEl}
        bind:value={password}
        placeholder={$t('auth.login.passwordPlaceholder')}
        aria-required="true"
        autocomplete="current-password"
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

  <div class="auth-row-end">
    <a class="auth-link" href="/login/passwordReset"
      >{$t('auth.login.forgotPasswordLink')}</a
    >
  </div>

  {#if redirectTo}
    <input type="hidden" name="from" value={redirectTo} />
  {/if}

  <button
    type="submit"
    class="auth-submit"
    disabled={!$validity.valid || !password || active}
    aria-label={$t('auth.login.loginButton')}
  >
    {#if active}
      <span class="auth-spinner" aria-hidden="true"></span>
      {$t('auth.login.loggingIn')}
    {:else}
      {$t('auth.login.loginButton')}
    {/if}
  </button>

  <div class="auth-divider">{$t('auth.login.noAccount')}</div>

  <button
    type="button"
    class="auth-secondary"
    onclick={() =>
      goto(`/${data?.from ? `?from=${encodeURIComponent(data.from)}` : ``}`)}
  >
    {$t('auth.login.signupLink')}
  </button>
</form>

<style>
  /* personal keeps the warm greeting; business gets the plain one */
  .heading-business {
    display: none;
  }
  :global(html.business) .heading-personal {
    display: none;
  }
  :global(html.business) .heading-business {
    display: inline;
  }

  /* "your session expired" — an explanation, not an error and not good news */
  .auth-note {
    display: block;
    background: #fff8ec;
    border: 1px solid rgba(180, 130, 20, 0.35);
    color: #8a5a00;
    border-radius: 0.9rem;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
    line-height: 1.45;
    margin-bottom: 1.1rem;
    text-align: start;
  }
  :global(html.business) .auth-note {
    background: var(--s1);
    border-color: var(--border, var(--input));
    color: var(--tm);
    border-radius: var(--radius-theme, 0.25rem);
  }

  .auth-ok {
    display: block;
    background: #effaf1;
    border: 1px solid rgba(21, 128, 61, 0.3);
    color: #15803d;
    border-radius: 0.9rem;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
    line-height: 1.45;
    margin-bottom: 1.1rem;
    text-align: start;
  }
</style>
