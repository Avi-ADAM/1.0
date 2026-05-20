<script>
  import { enhance } from '$app/forms';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';

  let { form } = $props();

  let email = $state('');
  let password = $state('');
  let emailPrefilled = $state(false);
  let displayName = $state('');
  let showPassword = $state(false);
  let loading = $state(false);

  onMount(() => {
    const cookies = document.cookie.split('; ');
    const emailMatch = cookies.find((r) => r.startsWith('email='));
    if (emailMatch) {
      email = decodeURIComponent(emailMatch.split('=')[1]);
      emailPrefilled = true;
    }
    const unMatch = cookies.find((r) => r.startsWith('un='));
    if (unMatch) {
      displayName = decodeURIComponent(unMatch.split('=')[1]);
    }
  });

  let hasUppercase = $derived(/[A-Z]/.test(password));
  let hasDigit = $derived(/\d/.test(password));
  let hasSymbol = $derived(/[^A-Za-z0-9]/.test(password));
  let strength = $derived.by(() => {
    let s = 0;
    if (password.length >= 1) s++;
    if (password.length >= 8) s++;
    if (hasUppercase) s++;
    if (hasDigit || hasSymbol) s++;
    return s;
  });
  let emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  let canSubmit = $derived(emailValid && password.length >= 8 && hasUppercase);
</script>

<svelte:head>
  <title>הרשמה · 1💗1</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&family=Cinzel:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip stepIdx={1} totalSteps={6} label="שלב 1 · כניסה" />
  {/snippet}

  <div class="content" in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}>
    <Plaque
      title={displayName ? `שלום ${displayName}!` : 'שלום! יוצרים חשבון'}
      sub="רק מייל וסיסמה — הכל אחר־כך"
    />

    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          await update();
          loading = false;
        };
      }}
      class="form"
    >
      <input type="hidden" name="displayName" value={displayName} />

      <div class="field">
        <label class="field-label" for="email">📧 כתובת מייל</label>
        <div class="input-wrap" class:valid={emailValid && email.length > 0}>
          <input
            id="email"
            type="email"
            name="email"
            bind:value={email}
            placeholder="you@email.com"
            autocomplete="email"
            class="input"
            class:prefilled={emailPrefilled}
            readonly={emailPrefilled}
            dir="ltr"
          />
          {#if emailValid && email.length > 0}
            <span class="input-icon">✓</span>
          {/if}
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="password">🔑 סיסמה</label>
        <div class="input-wrap">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            bind:value={password}
            placeholder="לפחות 8 תווים + אות גדולה"
            autocomplete="new-password"
            class="input"
          />
          <button
            type="button"
            class="input-icon btn-eye"
            onmousedown={() => (showPassword = true)}
            onmouseup={() => (showPassword = false)}
            onmouseleave={() => (showPassword = false)}
            aria-label="הצג סיסמה"
          >
            {showPassword ? '🔒' : '👁'}
          </button>
        </div>

        <div class="strength-bar">
          {#each [1, 2, 3, 4] as i (i)}
            <div class="s-seg" class:lit={strength >= i} data-level={i}></div>
          {/each}
        </div>
        <div class="reqs">
          <span class:ok={password.length >= 8}>{password.length >= 8 ? '✓' : '◯'} 8 תווים</span>
          <span>·</span>
          <span class:ok={hasUppercase}>{hasUppercase ? '✓' : '◯'} אות גדולה</span>
          <span>·</span>
          <span class:ok={hasDigit}>{hasDigit ? '✓' : '◯'} מספר</span>
          <span>·</span>
          <span class:ok={hasSymbol}>{hasSymbol ? '✓' : '◯'} סימן</span>
        </div>
      </div>

      {#if form?.error}
        <p class="error-msg" in:fly={{ y: -6, duration: 300 }}>{form.error}</p>
      {/if}

      <button
        type="submit"
        class="btn btn-key submit-btn"
        disabled={!canSubmit || loading}
      >
        {#if loading}
          <span class="spin">⟳</span> רגע…
        {:else}
          <span>פתיחת 1💗1</span>
          <span style="font-size: 18px">🗝</span>
        {/if}
      </button>

      <div class="terms">
        בלחיצה אתם מסכימים ל<u>תנאים</u> ול<u>מדיניות הפרטיות</u>.<br />
        זה לוקח 15 שניות — הצעדים הבאים יחכו לכם אחרי אישור מייל.
      </div>

      <div class="footer">
        כבר יש לכם חשבון? <a href="/login" class="link">התחברות</a>
      </div>
    </form>
  </div>
</ScreenFrame>

<style>
  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 4px 8px;
  }
  .form {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .input-wrap { position: relative; }
  .input-wrap .input { padding-inline-end: 36px; }
  .input.prefilled {
    background: rgba(255, 215, 0, 0.12);
    color: #9a6b10;
    border-color: rgba(218, 165, 32, 0.55);
    cursor: default;
  }
  .input-icon {
    position: absolute;
    inset-inline-end: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.95rem;
    color: #9a6b10;
    pointer-events: none;
  }
  .btn-eye {
    background: none;
    border: none;
    cursor: pointer;
    pointer-events: all;
    padding: 2px;
  }
  .strength-bar {
    display: flex; gap: 4px; margin-top: 4px;
  }
  .s-seg {
    flex: 1; height: 4px; border-radius: 99px;
    background: rgba(218, 165, 32, 0.18);
    transition: background 0.3s;
  }
  .s-seg.lit[data-level="1"] { background: #ef4444; }
  .s-seg.lit[data-level="2"] { background: #f97316; }
  .s-seg.lit[data-level="3"] { background: linear-gradient(90deg, #02ffbb, #ffd700); }
  .s-seg.lit[data-level="4"] { background: linear-gradient(90deg, #02ffbb, #22c55e); }
  .reqs {
    display: flex; gap: 4px; flex-wrap: wrap;
    font-size: 11px; color: #7a5e00;
  }
  .reqs .ok { color: #035a3e; font-weight: 700; }
  .error-msg {
    padding: 9px 13px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    font-size: 13px;
    color: #b91c1c;
    text-align: center;
    margin: 0;
  }
  .submit-btn {
    width: 100%;
    max-width: 260px;
    align-self: center;
    margin-top: 6px;
    padding: 13px 22px;
    font-size: 16px;
  }
  .terms {
    font-size: 11.5px;
    color: #9a6b10;
    text-align: center;
    line-height: 1.55;
    margin-top: 4px;
  }
  .footer {
    text-align: center;
    font-size: 12.5px;
    color: #9a6b10;
    margin-top: 4px;
  }
  .link {
    color: var(--pink-deep, #c8155f);
    font-weight: 700;
    text-decoration: underline;
  }
  .spin { display: inline-block; animation: ssp 1s linear infinite; }
  @keyframes ssp { to { transform: rotate(360deg); } }
</style>
