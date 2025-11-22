<script>
  import { locale, t } from '$lib/translations';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms'; // Import enhance for form actions
  import { page } from '$app/state'; // Import page store to access URL parameters

  let active = $state(false);
  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let redirectTo = $derived(page.url.searchParams.get('from') || ''); // Get 'from' URL parameter

  function handleclick() {
    goto('/login/passwordReset');
  }

  import {
    emailValidator,
    requiredValidator
  } from '../../lib/celim/validators.js';
  import { createFieldValidator } from '../../lib/celim/validation.js';

  let { data, form } = $props(); // Receive form data from server action

  const [validity, validate] = createFieldValidator(
    requiredValidator(),
    emailValidator()
  );

  // Handle server-side errors
  $effect(() => {
    if (form?.error) {
      loginError = form.error;
      active = false; // Deactivate loading state on error
    } else if (form?.success) {
      // If login is successful, the server will handle the redirect
      // No need for client-side goto here unless you want to handle data.from
      // For now, rely on server redirect
    }
  });

  let loginError = $state(null); // State for displaying login errors
</script>

<svelte:head>
  <title>{$t('auth.login.title')}</title>
</svelte:head>
<div class="body">
  <div class="login">
    <form
      class="fr"
      method="POST"
      action="?/login"
      use:enhance={() => {
        active = true;
        return async ({ update }) => {
          await update();
          active = false;
        };
      }}
      in:fade
    >
      <div>
        {#if loginError}
          <h1
            style="background-color: white; color:var(--barbi-pink); font-size:13px; font-weight:bold background-color: white; opacity: 0.7;"
          >
            {loginError}
          </h1>
          <button
            onclick={handleclick}
            title={$t('auth.login.forgotPassword')}
            aria-label={$t('auth.login.forgotPassword')}
            in:fade
            style=" position: fixed;
                                top: 70%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                "
          >
            <svg style="width:48px; height:48px" viewBox="0 0 24 24">
              <path
                fill="var(--barbi-pink)"
                d="M12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8H17V6A5,5 0 0,0 12,1M12,2.9C13.71,2.9 15.1,4.29 15.1,6V8H8.9V6C8.9,4.29 10.29,2.9 12,2.9M12.19,10.5C13.13,10.5 13.88,10.71 14.42,11.12C14.96,11.54 15.23,12.1 15.23,12.8C15.23,13.24 15.08,13.63 14.79,14C14.5,14.36 14.12,14.64 13.66,14.85C13.4,15 13.23,15.15 13.14,15.32C13.05,15.5 13,15.72 13,16H11C11,15.5 11.1,15.16 11.29,14.92C11.5,14.68 11.84,14.4 12.36,14.08C12.62,13.94 12.83,13.76 13,13.54C13.14,13.33 13.22,13.08 13.22,12.8C13.22,12.5 13.13,12.28 12.95,12.11C12.77,11.93 12.5,11.85 12.19,11.85C11.92,11.85 11.7,11.92 11.5,12.06C11.34,12.2 11.24,12.41 11.24,12.69H9.27C9.22,12 9.5,11.4 10.05,11.04C10.59,10.68 11.3,10.5 12.19,10.5M11,17H13V19H11V17Z"
              />
            </svg>
          </button>
        {/if}
      </div>

      <div dir="rtl">
        <input
          type="text"
          name="email"
          bind:value={email}
          class:field-danger={!$validity.valid}
          class:field-success={$validity.valid}
          use:validate={email}
          placeholder={$t('auth.login.emailPlaceholder')}
          id="email"
          aria-required="true"
          autocomplete="email"
        />
      </div>
      <div dir="rtl" class="password-container">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          bind:value={password}
          placeholder={$t('auth.login.passwordPlaceholder')}
          id="password"
          aria-required="true"
          autocomplete="current-password"
        />
        <button
          type="button"
          class="password-toggle"
          onclick={() => (showPassword = !showPassword)}
          aria-label={showPassword ? $t('auth.login.hidePassword') : $t('auth.login.showPassword')}
          title={showPassword ? $t('auth.login.hidePassword') : $t('auth.login.showPassword')}
        >
          {#if showPassword}
            <!-- Eye slash icon (hide password) -->
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {:else}
            <!-- Eye icon (show password) -->
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
      {#if redirectTo}
        <input type="hidden" name="from" value={redirectTo} />
      {/if}
      <div>
        <div class="flex flex-col align-middle justify-center">
          <button
            type="submit"
            class:active
            disabled={!$validity.valid}
            class="center hover:scale-150 bt"
            aria-label={$t('auth.login.loginButton')}
          >
            <span class="login-text">{$t('auth.login.loginButton')}</span>
          </button>
          <button
            class="text-gold bg-barbi px-1 py-1 rounded-md hover:text-barbi hover:bg-gold"
            onclick={() =>
              goto(`/${data.params ? `?from=${data.params}` : ``}`)}
            >{$t('auth.login.notRegistered')}</button
          >
        </div>
      </div>
    </form>
  </div>
  <!-- כפתור זכור אותי בפעם הבאה כדי לשמור קוקיות
ולוגאאוט שיהיה שמוחק קוקיות-->
</div>

<style>
  @media (max-width: 600px) {
    .login {
      width: 126%;
    }

    .center {
      margin: 0 auto;
    }
  }
  .active {
    cursor: wait;
    -webkit-animation: spin 17s linear infinite;
    -moz-animation: spin 17s linear infinite;
    animation: spin 17s linear infinite;
  }
  @-moz-keyframes spin {
    100% {
      -moz-transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
    }
  }
  @keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  input:focus {
    color: var(--barbi-pink);
    border: 1px solid var(--barbi-pink);
  }
  .body {
    min-height: 100vh;

    width: 100vw;
    height: 100vh;
    background: url(https://res.cloudinary.com/love1/image/upload/v1640287148/nicelove_o5pzyv.svg) !important;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    margin: 0;
    /*	background-color: var(--primary-color);
            background: linear-gradient(
                180deg,
                skyblue 28.45%,
                var(--tertiary-color) 40.35%
            );*/
  }

  .password-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-toggle {
    position: absolute;
    left: 20px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--barbi-pink);
    padding: 5px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    z-index: 1;
  }

  .password-toggle:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .password-toggle:focus {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 2px;
  }

  input {
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png) !important;
    border: 1px solid var(--gold);
    background-position: center;
    background-repeat: no-repeat;
    margin: 10px auto;
    background-size: 282px;
    min-height: 45px;
    padding: 0 20px;
    border-radius: 50px;
    color: var(--barbi-pink);
  }

  .password-container input {
    padding-left: 50px; /* Make room for the toggle button */
  }
  .center {
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640287183/coin512_ux4m6e.png);
    background-repeat: no-repeat;
    margin: 0.5em 4em;
    background-size: 100px;
    align-self: center;
    min-height: 100px;
    min-width: 100px;
    border-radius: 50%;
    cursor:
      url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg),
      auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-text {
    color: var(--barbi-pink);
    font-weight: bold;
    font-size: 16px;
    text-shadow:
      0 0 10px rgba(255, 255, 255, 0.8),
      0 0 20px rgba(255, 255, 255, 0.6),
      0 0 30px rgba(255, 255, 255, 0.4);
    z-index: 2;
    pointer-events: none;
    text-align: center;
    letter-spacing: 1px;
  }

  .login {
    cursor:
      url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg),
      auto;

    position: fixed;
    top: 50%;
    left: 50%;
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
    align-items: center;
    justify-content: center;

    transform: translate(-50%, -50%);
    min-height: 100%;
    min-width: 100%;
    border-radius: 50%;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640287109/diamond_uapr5j.png);
    background-position: center;
    background-repeat: no-repeat;

    background-size: contain;
    margin: 0 auto;
    align-self: center;
  }
  .fr {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
</style>
