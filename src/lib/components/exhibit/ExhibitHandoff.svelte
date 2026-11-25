<!--
  "This is the rikma you built at the fair" — the top of the preview page the
  stand's QR opens on the visitor's phone (docs/inprogress/PLAN_EXHIBITION_MODE.md §7).

  Two doors, both optional:
   - start: the agreement with the draft attached (`/hascama?agent=<token>`);
     they type their own name and email there, and signing turns the draft
     into their rikma;
   - keep it: name, email (phone if they like) and consent → a lead of the
     central rikma, and the team gets back to them.

  The token arrives in the fragment (#t=…), never in a request. It is read once,
  kept in sessionStorage for reloads, and wiped from the address bar, so
  sharing the preview with a friend shares the rikma, not the claim on it.
-->
<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/translations';
  import { sendLead, tokenFromHash } from '$lib/exhibit/handoff';

  /** @type {{ shareKey: string }} */
  let { shareKey } = $props();

  let token = $state(/** @type {string | null} */ (null));
  let ready = $state(false);
  let open = $state(false);
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let agreed = $state(false);
  let sendState = $state(/** @type {'idle' | 'sending' | 'sent' | 'error'} */ ('idle'));

  onMount(() => {
    const key = `exhibit.t.${shareKey}`;
    let stored = null;
    try {
      stored = sessionStorage.getItem(key);
    } catch {
      // private mode: the fragment is all we have
    }
    token = tokenFromHash(location.hash) ?? stored;
    if (token) {
      try {
        sessionStorage.setItem(key, token);
      } catch {
        // fine — it just will not survive a reload
      }
    }
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    ready = true;
  });

  async function send(/** @type {SubmitEvent} */ e) {
    e.preventDefault();
    if (!token || !agreed || (!email.trim() && !phone.trim()) || sendState === 'sending') return;
    sendState = 'sending';
    const ok = await sendLead({ shareKey, token }, { name: name.trim(), email: email.trim(), phone: phone.trim() }, 'phone');
    sendState = ok ? 'sent' : 'error';
  }

  const field =
    'w-full rounded-xl border-2 border-gold/50 bg-black/40 px-3 py-2.5 text-base text-white placeholder:text-gray-400 focus:border-barbi focus:outline-none';
</script>

{#if ready}
  <section class="max-w-4xl mx-auto px-4 pt-6">
    <div class="rounded-3xl border-2 border-gold/70 bg-gradient-to-br from-barbi/25 via-black/40 to-gold/15 p-5 text-center shadow-lg">
      <h1 class="text-2xl font-black text-gold">{$t('exhibit.handoff.title')}</h1>
      {#if token}
        <p class="mt-1 text-gray-100">{$t('exhibit.handoff.sub')}</p>
        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/hascama?agent={encodeURIComponent(token)}"
            class="flex flex-col items-center rounded-2xl bg-barbi px-4 py-3 text-white shadow-md transition hover:scale-[1.02]"
          >
            <span class="text-lg font-black">{$t('exhibit.handoff.start')}</span>
            <span class="text-sm opacity-90">{$t('exhibit.handoff.startSub')}</span>
          </a>
          <button
            type="button"
            class="flex flex-col items-center rounded-2xl border-2 border-gold bg-black/30 px-4 py-3 text-white transition hover:bg-gold/15"
            aria-expanded={open}
            onclick={() => (open = !open)}
          >
            <span class="text-lg font-black text-gold">{$t('exhibit.handoff.keep')}</span>
            <span class="text-sm text-gray-200">{$t('exhibit.handoff.keepSub')}</span>
          </button>
        </div>

        {#if open}
          {#if sendState === 'sent'}
            <p class="mt-4 text-lg font-bold text-gold">{$t('exhibit.handoff.sent')}</p>
          {:else}
            <form class="mt-4 flex flex-col gap-3 text-start" onsubmit={send}>
              <input class={field} bind:value={name} placeholder={$t('exhibit.handoff.name')} aria-label={$t('exhibit.handoff.name')} autocomplete="name" dir="auto" />
              <input class={field} type="email" bind:value={email} placeholder={$t('exhibit.handoff.email')} aria-label={$t('exhibit.handoff.email')} autocomplete="email" dir="ltr" />
              <input class={field} type="tel" bind:value={phone} placeholder={$t('exhibit.handoff.phone')} aria-label={$t('exhibit.handoff.phone')} autocomplete="tel" dir="ltr" />
              <label class="flex items-center gap-2 text-sm text-gray-100">
                <input type="checkbox" class="h-5 w-5 accent-barbi" bind:checked={agreed} />
                {$t('exhibit.handoff.consent')}
              </label>
              <button
                type="submit"
                class="rounded-xl bg-gold px-4 py-2.5 font-black text-black disabled:opacity-40"
                disabled={!agreed || (!email.trim() && !phone.trim()) || sendState === 'sending'}
              >
                {$t('exhibit.handoff.send')}
              </button>
              {#if sendState === 'error'}<p class="text-sm text-barbi">{$t('exhibit.handoff.error')}</p>{/if}
            </form>
          {/if}
        {/if}
      {:else}
        <p class="mt-1 text-gray-100">{$t('exhibit.handoff.expired')}</p>
      {/if}
    </div>
  </section>
{/if}
