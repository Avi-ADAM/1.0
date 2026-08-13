<script>
  /**
   * Shown once, on the request where hooks.server.js found an expired `jwt`
   * cookie and cleared it. Without it a long-absent member simply finds the site
   * logged out with no explanation (or, before the cookie was cleared, a 500).
   *
   * The page underneath keeps rendering its normal guest state — this only adds
   * the explanation and the way back in.
   */
  import { t } from '$lib/translations';
  import { page } from '$app/state';

  let dismissed = $state(false);

  const tf = (key, fallback) => $t(key) || fallback;

  let target = $derived(page.url.pathname.replace(/^\//, '') + page.url.search);
  let loginHref = $derived(`/login?from=${encodeURIComponent(target)}&expired=1`);
</script>

{#if !dismissed}
  <div
    class="border-b border-gold bg-black/80 px-4 py-3 text-center"
    role="status"
  >
    <p class="text-barbi text-base sm:text-lg">
      {tf('auth.expired.title', 'ההתחברות שלך פגה')}
      <span class="text-gold"
        >{tf('auth.expired.body', 'כניסה מחדש תחזיר אותך בדיוק לאן שהיית.')}</span
      >
    </p>
    <div class="mt-2 flex flex-wrap justify-center gap-2">
      <a
        href={loginHref}
        class="button-perl text-barbi hover:text-black border border-gold px-4 py-1 font-bold"
        >{tf('auth.expired.login', 'התחברות')}</a
      >
      <a
        href="/signup"
        class="text-gold hover:text-barbi hover:border-barbi border border-gold rounded px-4 py-1"
        >{tf('auth.expired.signup', 'הרשמה')}</a
      >
      <button
        onclick={() => (dismissed = true)}
        class="text-tm hover:text-barbi px-3 py-1"
        aria-label={tf('auth.expired.dismiss', 'סגירה')}>✕</button
      >
    </div>
  </div>
{/if}
