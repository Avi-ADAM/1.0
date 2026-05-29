<script>
  import { lang, langUs, doesLang } from '$lib/stores/lang.js';
  import { locale } from '$lib/translations';

  const langs = /** @type {const} */ ([
    { code: 'he', label: 'עב', dir: 'rtl' },
    { code: 'en', label: 'EN', dir: 'ltr' },
    { code: 'ar', label: 'عر', dir: 'rtl' }
  ]);

  /** @param {'he'|'en'|'ar'} code */
  function pick(code) {
    if ($locale === code) return;
    lang.set(code);
    locale.set(code);
    langUs.set(code);
    doesLang.set(true);
    document.cookie =
      `lang=${code}; path=/; expires=` + new Date(2027, 0, 1).toUTCString();
    // Update document dir so RTL/LTR layout flips immediately.
    document.documentElement.setAttribute('dir', code === 'en' ? 'ltr' : 'rtl');
    document.documentElement.setAttribute('lang', code);
  }
</script>

<div class="lang-switch" role="group" aria-label="language">
  {#each langs as l (l.code)}
    <button
      type="button"
      class="lang-btn"
      class:active={$locale === l.code}
      onclick={() => pick(l.code)}
      aria-pressed={$locale === l.code}
      title={l.code.toUpperCase()}
    >
      {l.label}
    </button>
  {/each}
</div>

<style>
  .lang-switch {
    display: inline-flex;
    gap: 3px;
    padding: 3px;
    background: rgba(255, 248, 220, 0.55);
    border: 1px solid rgba(218, 165, 32, 0.35);
    border-radius: 999px;
    backdrop-filter: blur(6px);
    font-family: 'Heebo', sans-serif;
  }
  .lang-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: #6c4a07;
    font-weight: 700;
    font-size: 12px;
    line-height: 1;
    padding: 5px 9px;
    border-radius: 999px;
    cursor: pointer;
    transition:
      background 160ms ease,
      color 160ms ease,
      transform 160ms ease;
    min-width: 30px;
  }
  .lang-btn:hover {
    background: rgba(218, 165, 32, 0.18);
  }
  .lang-btn.active {
    background: linear-gradient(135deg, #f6c34d, #c98a16);
    color: #fff;
    box-shadow: 0 1px 4px rgba(190, 24, 93, 0.18);
  }
  .lang-btn:focus-visible {
    outline: 2px solid #e91e8c;
    outline-offset: 1px;
  }
</style>
