<!--
  "See your idea as a rikma" — the live demo on /vision.

  The visitor describes an idea; /api/vision-preview drafts a small sketch of
  it (a few missions with hours and rates, the resources it needs, what it
  would sell) and the share each mission would start with. The disclaimer is
  always on screen, before and after: this is a reduced taste, the site's own
  draft is fuller and editable, and nothing here is saved.

  The examples fill the box rather than calling the model, so trying one costs
  the visitor one of their few tries only when they press the button.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import Spinner from '$lib/celim/Spinner.svelte';

  const MIN = 60;
  const MAX = 1500;
  const EXAMPLES = ['ex1', 'ex2', 'ex3'];

  let text = $state('');
  let website = $state('');
  let busy = $state(false);
  /** @type {null | import('$lib/vision/preview').VisionPreview} */
  let preview = $state(null);
  /** @type {string} */
  let failure = $state('');

  let startHref = $derived(registerHref($locale, '/vision'));
  let length = $derived(text.trim().length);
  /* No currency symbol: the sketch has no rikma, so no rikma currency yet. */
  let money = $derived(new Intl.NumberFormat($locale, { maximumFractionDigits: 0 }));

  async function run() {
    if (busy || length < MIN) return;
    busy = true;
    failure = '';
    preview = null;
    try {
      const res = await fetch('/api/vision-preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, website, lang: $locale })
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) preview = data.preview;
      else failure = ['too-short', 'too-long', 'rate-limited', 'busy', 'empty'].includes(data?.reason) ? data.reason : 'failed';
    } catch {
      failure = 'failed';
    } finally {
      busy = false;
    }
  }
</script>

<div class="bg-cyan-50/70 dark:bg-surface2 border-2 border-gold rounded-2xl px-4 py-5 sm:px-5 text-start">
  <label for="vision-idea" class="block text-rose-700 dark:text-gold font-semibold text-base sm:text-sm mb-2">
    {$t('vision.demo.label')}
  </label>
  <textarea
    id="vision-idea"
    bind:value={text}
    maxlength={MAX}
    rows="5"
    placeholder={$t('vision.demo.placeholder')}
    class="w-full rounded-xl border-2 border-gold/60 bg-white dark:bg-surface px-3 py-2 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed focus:outline-none focus:border-barbi"
  ></textarea>
  <!-- Honeypot: off-screen and out of the tab order; a person never fills it. -->
  <input
    type="text"
    name="website"
    bind:value={website}
    tabindex="-1"
    autocomplete="off"
    aria-hidden="true"
    class="absolute w-px h-px opacity-0 pointer-events-none"
    style="inset-inline-start:-9999px"
  />

  <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
    <div class="flex flex-wrap gap-2">
      <span class="text-slate-700 dark:text-surfaceMuted text-sm">{$t('vision.demo.tryExample')}</span>
      {#each EXAMPLES as ex}
        <button
          type="button"
          onclick={() => (text = $t(`vision.demo.${ex}Text`))}
          class="text-sm underline decoration-barbi/40 underline-offset-4 text-barbi dark:text-gold hover:text-rose-800"
        >
          {$t(`vision.demo.${ex}`)}
        </button>
      {/each}
    </div>
    <span class="text-xs text-slate-600 dark:text-surfaceMuted" aria-live="polite">
      {length < MIN ? $t('vision.demo.minChars', { count: MIN - length }) : `${length}/${MAX}`}
    </span>
  </div>

  <button
    type="button"
    onclick={run}
    disabled={busy || length < MIN}
    class="mt-4 w-full sm:w-auto bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
  >
    {#if busy}<Spinner size="xs" color="currentColor" />{/if}
    {busy ? $t('vision.demo.working') : $t('vision.demo.run')}
  </button>

  <p class="mt-3 text-xs sm:text-[11px] text-slate-700 dark:text-surfaceMuted leading-relaxed">
    {$t('vision.demo.disclaimer')}
  </p>

  {#if failure}
    <p role="alert" class="mt-4 rounded-xl border-2 border-rose-300 bg-rose-50 dark:bg-surface px-4 py-3 text-rose-800 dark:text-surfaceInk text-sm">
      {$t(`vision.demo.err.${failure}`)}
    </p>
  {/if}

  {#if preview}
    <div class="mt-5 flex flex-col gap-4" aria-live="polite">
      {#if preview.missions.length}
        <section>
          <h3 class="text-rose-700 dark:text-gold font-semibold text-base sm:text-sm mb-2">
            {$t('vision.demo.missions')}
          </h3>
          <ul class="flex flex-col gap-2">
            {#each preview.missions as m}
              <li class="flex items-start justify-between gap-3 rounded-xl bg-white/80 dark:bg-surface border border-gold/50 px-3 py-2">
                <span class="text-slate-800 dark:text-surfaceInk text-sm">
                  {m.name}
                  {#if m.hours && m.rate}
                    <span class="block text-xs text-slate-600 dark:text-surfaceMuted">
                      {$t('vision.demo.hoursAtRate', { hours: m.hours, rate: money.format(m.rate) })}
                    </span>
                  {/if}
                </span>
                {#if m.share !== null}
                  <span class="shrink-0 font-bold text-barbi dark:text-gold text-sm">{m.share}%</span>
                {/if}
              </li>
            {/each}
          </ul>
          {#if preview.missions.some((m) => m.share !== null)}
            <p class="mt-2 text-xs text-slate-600 dark:text-surfaceMuted leading-relaxed">
              {$t('vision.demo.shareNote')}
            </p>
          {/if}
        </section>
      {/if}

      {#if preview.resources.length}
        <section>
          <h3 class="text-rose-700 dark:text-gold font-semibold text-base sm:text-sm mb-1">
            {$t('vision.demo.resources')}
          </h3>
          <p class="text-slate-800 dark:text-surfaceInk text-sm">{preview.resources.join(' · ')}</p>
        </section>
      {/if}

      {#if preview.products.length}
        <section>
          <h3 class="text-rose-700 dark:text-gold font-semibold text-base sm:text-sm mb-1">
            {$t('vision.demo.products')}
          </h3>
          <p class="text-slate-800 dark:text-surfaceInk text-sm">{preview.products.join(' · ')}</p>
        </section>
      {/if}

      <div class="rounded-xl border-2 border-gold/60 px-4 py-3">
        <p class="text-slate-800 dark:text-surfaceInk text-sm leading-relaxed mb-3">
          {preview.more > 0 ? $t('vision.demo.moreRows', { count: preview.more }) : $t('vision.demo.fuller')}
        </p>
        <div class="flex flex-wrap gap-3 items-center">
          <a
            href={startHref}
            class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-base px-5 py-2 rounded-2xl shadow transition-all"
          >
            {$t('vision.demo.continue')}
          </a>
          <a
            href="/mcp"
            class="text-barbi dark:text-gold font-semibold text-sm underline decoration-barbi/40 underline-offset-4"
          >
            {$t('vision.demo.withAgent')} {$isRtl ? '←' : '→'}
          </a>
        </div>
      </div>
    </div>
  {/if}
</div>
