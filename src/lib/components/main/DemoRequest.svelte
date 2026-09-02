<!--
  Personal-demo request — the site's third path.

  Login is for people who are already in, registration for people who already
  decided. This is for the third group, which until now had nowhere to go: they
  want to understand the model before they commit to it. "Contact us" is too
  vague to be that door — it promises nothing, so nobody walks through it. A
  demo promises a specific thing in a specific amount of time, which is why the
  copy leads with "20 minutes, no commitment".

  The flow deliberately does not open a calendar on the first click:

    track → mode → (watch | form) → thanks

  Two short questions come first, so by the time we ask for contact details the
  person has already told us what the demo should be about — and the form is
  only the fields we need to make the call happen. `mode` includes the drop-in
  option, which mints a meetings-app guest link server-side so someone who
  doesn't want to fix a slot in advance still leaves with a room they can walk
  into (see `src/lib/server/demo/demoMeeting.ts`).

  Everything lands in `/api/demo`, which stores the lead and opens the
  follow-up missions in the central rikma.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { fly, fade } from 'svelte/transition';
  import { page } from '$app/stores';

  let {
    /** Two-way: the parent owns whether the dialog is showing. */
    open = $bindable(false),
    /** Where this was opened from — stored on the lead so we can tell paths apart. */
    source = 'fpage',
    /**
     * Called when someone picks "watch a recorded demo first". Without it that
     * option is hidden, since there'd be nothing to show them.
     */
    onWatchRecorded = null,
    /** Optional pre-selected track, so a caller can skip the first question. */
    initialTrack = null
  } = $props();

  const TRACKS = ['idea', 'partnership', 'provider', 'curious'];
  const MODES = ['scheduled', 'flexible', 'callback', 'recorded'];

  // A phone number in international digits (e.g. 972500000000). Unset ⇒ the
  // WhatsApp shortcut on the thank-you screen simply isn't offered.
  const WHATSAPP = import.meta.env.VITE_WHATSAPP ?? '';

  let step = $state('track');
  let track = $state(null);
  let mode = $state(null);

  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let goal = $state('');
  let preferredTime = $state('');

  let sending = $state(false);
  let error = $state('');
  let meetingLink = $state('');

  // Opening the dialog always starts a fresh conversation — reopening it after
  // a thank-you screen should ask the first question again, not show the last
  // answer. `initialTrack` lets a caller enter one step in.
  $effect(() => {
    if (open) {
      step = initialTrack ? 'mode' : 'track';
      track = initialTrack;
      mode = null;
      error = '';
      meetingLink = '';
    }
  });

  /** The recorded-demo option only exists if the parent can actually play one. */
  let modes = $derived(
    onWatchRecorded ? MODES : MODES.filter((m) => m !== 'recorded')
  );

  /** Asking "when suits you?" only makes sense for the two time-bound modes. */
  let asksTime = $derived(mode === 'scheduled' || mode === 'flexible');

  function chooseTrack(value) {
    track = value;
    step = 'mode';
  }

  function chooseMode(value) {
    mode = value;
    step = value === 'recorded' ? 'watch' : 'form';
  }

  function watchNow() {
    onWatchRecorded?.();
    open = false;
  }

  /** From the recorded-demo screen: they'd like a call after all. */
  function leaveDetailsAnyway() {
    mode = 'callback';
    step = 'form';
  }

  async function submit(e) {
    e.preventDefault();
    error = '';

    if (!name.trim()) {
      error = $t('demo.form.errName');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      error = $t('demo.form.errContact');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      error = $t('demo.form.errEmail');
      return;
    }

    sending = true;
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          track: track ?? 'curious',
          timeMode: mode ?? 'callback',
          goal: goal.trim() || null,
          preferredTime: preferredTime.trim() || null,
          lang: $locale,
          page: $page.url.pathname,
          source
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'failed');

      meetingLink = data.meetingLink ?? '';
      step = 'thanks';
    } catch (err) {
      console.error('demo request failed:', err);
      error = $t('demo.form.errSend');
    } finally {
      sending = false;
    }
  }
</script>

{#if open}
  <!-- Backdrop click closes; Escape does the same from `svelte:window`, so the
       interaction is fully reachable without a pointer. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[900] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
    transition:fade={{ duration: 150 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) open = false;
    }}
    role="presentation"
  >
    <div
      dir={$isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-label={$t('demo.section.title')}
      transition:fly={{ y: 30, duration: 250 }}
      class="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-2 border-gold bg-gradient-to-br from-[#fffaf0] via-[#fdf3e3] to-[#f7ecfb] px-5 py-6 shadow-2xl"
      style="font-family:'Sababa',sans-serif;"
    >
      <button
        type="button"
        onclick={() => (open = false)}
        aria-label={$t('demo.close')}
        class="absolute top-3 {$isRtl ? 'left-3' : 'right-3'} w-8 h-8 rounded-full bg-white/70 text-barbi hover:bg-barbi hover:text-gold transition-colors flex items-center justify-center shadow"
      >
        ✕
      </button>

      {#if step === 'track'}
        <p class="text-center text-barbi font-bold text-sm tracking-widest mb-1">
          {$t('demo.reassure')}
        </p>
        <h2 class="text-rose-700 font-bold text-2xl sm:text-xl text-center mb-4">
          {$t('demo.track.title')}
        </h2>
        <div class="flex flex-col gap-2.5">
          {#each TRACKS as key (key)}
            <button
              type="button"
              onclick={() => chooseTrack(key)}
              class="w-full text-start bg-cyan-50/80 hover:bg-gold/25 border-2 border-gold/70 rounded-xl px-4 py-3 text-slate-800 text-lg sm:text-base font-semibold shadow-sm transition-colors"
            >
              {$t(`demo.track.${key}`)}
            </button>
          {/each}
        </div>

      {:else if step === 'mode'}
        <h2 class="text-rose-700 font-bold text-2xl sm:text-xl text-center mb-1">
          {$t('demo.mode.title')}
        </h2>
        <p class="text-center text-slate-700 text-base sm:text-sm mb-4">
          {$t('demo.mode.lead')}
        </p>
        <div class="flex flex-col gap-2.5">
          {#each modes as key (key)}
            <button
              type="button"
              onclick={() => chooseMode(key)}
              class="w-full text-start bg-cyan-50/80 hover:bg-gold/25 border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm transition-colors"
            >
              <span class="block text-slate-900 text-lg sm:text-base font-bold">
                {$t(`demo.mode.${key}`)}
              </span>
              <span class="block text-slate-600 text-sm">
                {$t(`demo.mode.${key}Sub`)}
              </span>
            </button>
          {/each}
        </div>
        <button
          type="button"
          onclick={() => (step = 'track')}
          class="mt-4 mx-auto block text-barbi hover:text-rose-700 text-sm underline"
        >
          {$t('demo.back')}
        </button>

      {:else if step === 'watch'}
        <h2 class="text-rose-700 font-bold text-2xl sm:text-xl text-center mb-2">
          {$t('demo.watch.title')}
        </h2>
        <p class="text-center text-slate-700 text-base sm:text-sm mb-5">
          {$t('demo.watch.desc')}
        </p>
        <button
          type="button"
          onclick={watchNow}
          class="w-full inline-flex items-center justify-center gap-2 bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg transition-colors"
        >
          <span class="text-2xl leading-none">▶</span>
          {$t('demo.watch.cta')}
        </button>
        <button
          type="button"
          onclick={leaveDetailsAnyway}
          class="mt-3 w-full bg-gold hover:bg-barbi hover:text-gold text-barbi font-bold text-lg sm:text-base px-6 py-3 rounded-2xl border-2 border-gold shadow transition-colors"
        >
          {$t('demo.watch.instead')}
        </button>
        <button
          type="button"
          onclick={() => (step = 'mode')}
          class="mt-4 mx-auto block text-barbi hover:text-rose-700 text-sm underline"
        >
          {$t('demo.back')}
        </button>

      {:else if step === 'form'}
        <h2 class="text-rose-700 font-bold text-2xl sm:text-xl text-center mb-1">
          {$t('demo.form.title')}
        </h2>
        <p class="text-center text-slate-700 text-base sm:text-sm mb-4">
          {$t('demo.form.lead')}
        </p>

        <form onsubmit={submit} class="flex flex-col gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-slate-800 font-semibold text-sm">
              {$t('demo.form.name')}
            </span>
            <input
              bind:value={name}
              type="text"
              autocomplete="name"
              required
              placeholder={$t('demo.form.namePh')}
              class="w-full rounded-xl border-2 border-gold/70 bg-white/80 px-3 py-2 text-slate-900 focus:border-barbi focus:outline-none"
            />
          </label>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="flex flex-col gap-1">
              <span class="text-slate-800 font-semibold text-sm">
                {$t('demo.form.email')}
              </span>
              <input
                bind:value={email}
                type="email"
                autocomplete="email"
                dir="ltr"
                placeholder={$t('demo.form.emailPh')}
                class="w-full rounded-xl border-2 border-gold/70 bg-white/80 px-3 py-2 text-slate-900 focus:border-barbi focus:outline-none"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-slate-800 font-semibold text-sm">
                {$t('demo.form.phone')}
              </span>
              <input
                bind:value={phone}
                type="tel"
                autocomplete="tel"
                dir="ltr"
                placeholder={$t('demo.form.phonePh')}
                class="w-full rounded-xl border-2 border-gold/70 bg-white/80 px-3 py-2 text-slate-900 focus:border-barbi focus:outline-none"
              />
            </label>
          </div>
          <p class="text-slate-600 text-xs -mt-1">{$t('demo.form.contactHint')}</p>

          {#if asksTime}
            <label class="flex flex-col gap-1">
              <span class="text-slate-800 font-semibold text-sm">
                {$t('demo.form.time')}
              </span>
              <input
                bind:value={preferredTime}
                type="text"
                placeholder={$t('demo.form.timePh')}
                class="w-full rounded-xl border-2 border-gold/70 bg-white/80 px-3 py-2 text-slate-900 focus:border-barbi focus:outline-none"
              />
            </label>
          {/if}

          <label class="flex flex-col gap-1">
            <span class="text-slate-800 font-semibold text-sm">
              {$t('demo.form.goal')}
              <span class="text-slate-500 font-normal">· {$t('demo.form.optional')}</span>
            </span>
            <textarea
              bind:value={goal}
              rows="3"
              placeholder={$t('demo.form.goalPh')}
              class="w-full rounded-xl border-2 border-gold/70 bg-white/80 px-3 py-2 text-slate-900 focus:border-barbi focus:outline-none resize-none"
            ></textarea>
          </label>

          {#if error}
            <p class="text-rose-700 bg-rose-50 border border-rose-300 rounded-xl px-3 py-2 text-sm">
              {error}
            </p>
          {/if}

          <button
            type="submit"
            disabled={sending}
            class="w-full bg-barbi hover:bg-white hover:text-barbi disabled:opacity-60 disabled:hover:bg-barbi disabled:hover:text-gold text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg transition-colors"
          >
            {sending
              ? $t('demo.form.sending')
              : mode === 'callback'
                ? $t('demo.form.submitCallback')
                : $t('demo.form.submit')}
          </button>
          <p class="text-center text-slate-600 text-xs">{$t('demo.reassure')}</p>
        </form>

        <button
          type="button"
          onclick={() => (step = 'mode')}
          class="mt-3 mx-auto block text-barbi hover:text-rose-700 text-sm underline"
        >
          {$t('demo.back')}
        </button>

      {:else if step === 'thanks'}
        <div class="text-center">
          <div class="mb-2 flex justify-center text-barbi"><EntityIcon kind="lev" size={36} /></div>
          <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-2">
            {$t('demo.thanks.title')}
          </h2>
          <p class="text-slate-800 text-base sm:text-sm leading-relaxed mb-4">
            {$t('demo.thanks.body')}
          </p>

          {#if meetingLink}
            <div class="bg-cyan-50/80 border-2 border-gold rounded-2xl px-4 py-4 mb-4 text-start">
              <p class="text-slate-800 text-base sm:text-sm mb-3">
                {$t('demo.thanks.meeting')}
              </p>
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener"
                class="block text-center bg-barbi hover:bg-white hover:text-barbi text-gold font-bold px-5 py-2.5 rounded-xl shadow transition-colors"
              >
                <EntityIcon kind="signup" size={15} /> {$t('demo.thanks.meetingCta')}
              </a>
              <p class="text-slate-600 text-xs mt-2">{$t('demo.thanks.meetingHint')}</p>
            </div>
          {/if}

          {#if WHATSAPP}
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener"
              class="block bg-[#25D366] hover:brightness-95 text-white font-bold px-5 py-2.5 rounded-xl shadow mb-3 transition-all"
            >
              {$t('demo.thanks.whatsapp')}
            </a>
          {/if}

          <p class="text-slate-700 text-sm mb-2">{$t('demo.thanks.explore')}</p>
          <a
            href="/project"
            class="inline-block bg-gold hover:bg-barbi hover:text-gold text-barbi font-bold px-5 py-2 rounded-xl border-2 border-gold shadow transition-colors"
          >
            {$t('demo.thanks.exploreCta')}
          </a>

          <button
            type="button"
            onclick={() => (open = false)}
            class="mt-4 mx-auto block text-barbi hover:text-rose-700 text-sm underline"
          >
            {$t('demo.thanks.done')}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && open) open = false;
  }}
/>
