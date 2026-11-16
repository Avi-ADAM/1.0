<script>
  import { lang } from '$lib/stores/lang.js';
  import { locale } from '$lib/translations';
  import { onMount } from 'svelte';
  let { children } = $props();

  // The language was already resolved for this request — `?lang=`, then the
  // `lang` cookie, then Accept-Language (hooks.server.js getLanguage) — and
  // the root layout set `locale` from it. This layout used to re-decide from
  // Accept-Language alone and write the answer back into the cookie, so a
  // Hebrew-browser reader who chose English came back from the agreement site
  // to a Hebrew agreement, and the cookie it had overwritten then made
  // /signup and /signup/check-email Hebrew too. Now it only mirrors the
  // resolved choice, so the next screens keep it.
  onMount(() => {
    const code = $locale || 'he';
    lang.set(code);
    document.cookie =
      `lang=${code}; path=/; SameSite=Lax; expires=` + new Date(2029, 0, 1).toUTCString();
  });
</script>

{@render children?.()}
