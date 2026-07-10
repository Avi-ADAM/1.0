<script>
  import { onMount } from 'svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { t, isRtl } from '$lib/translations';
  import Mission from '$lib/components/prPr/mission.svelte';

  /**
   * "Missions I do" — the user's priced mission offers
   * (PLAN_USER_OFFERINGS §4.1.2 / M2).
   *
   * Lists the user's mission-offers as modern cards and authors new ones with
   * the standard mission form (prPr/mission.svelte, specMode) — the form that
   * already carries hours, rate, skills/roles and template autocomplete.
   *
   * Props: { uid } — the logged-in user's id (from /me page data).
   */

  let { uid } = $props();

  let offers = $state([]);
  let missionTemplates = $state([]);
  let loading = $state(true);
  let error1 = $state(null);
  let composing = $state(false);
  let busyId = $state(null);

  onMount(load);

  async function load() {
    loading = true;
    error1 = null;
    try {
      const [offersRes, tplRes] = await Promise.all([
        sendToSer({ uid: String(uid) }, '258listMyMissionOffers', 0, 0, false, fetch),
        sendToSer({}, 'getMissionTemplates', 0, 0, false, fetch)
      ]);
      offers = offersRes?.data?.missionOffers?.data ?? [];
      missionTemplates = tplRes?.data?.missions?.data ?? [];
    } catch (e) {
      error1 = e?.message || String(e);
    }
    loading = false;
  }

  /** specMode submit → createMissionOffer (PLAN_USER_OFFERINGS §3.4). */
  async function submitSpec(spec) {
    error1 = null;
    try {
      const result = await executeAction('createMissionOffer', {
        name: spec.name,
        descrip: spec.descrip || null,
        hours: spec.hours || null,
        perhour: spec.ratePerHour || null,
        missionId: spec.templateId || null,
        location: spec.location || null
      });
      if (!result.success) {
        error1 = result.error?.message || $t('offerings.missions.save_failed');
        return;
      }
      composing = false;
      await load();
    } catch (e) {
      error1 = e?.message || String(e);
    }
  }

  async function toggleActive(offer) {
    busyId = offer.id;
    const result = await executeAction('updateMissionOffer', {
      offerId: String(offer.id),
      active: !offer.attributes.active
    });
    if (result.success) offer.attributes.active = !offer.attributes.active;
    else error1 = result.error?.message || $t('offerings.missions.save_failed');
    busyId = null;
  }

  async function archive(offer) {
    if (!confirm($t('offerings.missions.archive_confirm'))) return;
    busyId = offer.id;
    const result = await executeAction('updateMissionOffer', {
      offerId: String(offer.id),
      archived: true
    });
    if (result.success) offers = offers.filter((o) => o.id !== offer.id);
    else error1 = result.error?.message || $t('offerings.missions.save_failed');
    busyId = null;
  }

  function priceLine(a) {
    if (a.perhour > 0) return `${a.perhour} · ${$t('offerings.missions.per_hour')}`;
    if (a.price > 0) return `${a.price} · ${$t('offerings.missions.fixed_price')}`;
    return '';
  }
  function locationLine(a) {
    const loc = a.location;
    if (!loc) return '';
    if (loc.location_mode === 'online') return $t('offerings.missions.online');
    return loc.location_hint || '';
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="w-full max-w-md mx-auto rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
>
  <!-- Header -->
  <div class="px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white flex items-center justify-between gap-2">
    <div>
      <h2 class="text-lg font-bold">🛠️ {$t('offerings.missions.title')}</h2>
      <p class="text-xs opacity-80">{$t('offerings.missions.subtitle')}</p>
    </div>
    <button
      class="shrink-0 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-sm font-bold transition-colors"
      onclick={() => (composing = true)}
    >
      ➕ {$t('offerings.missions.add')}
    </button>
  </div>

  <div class="p-3 space-y-3 max-h-[24rem] overflow-y-auto">
    {#if error1}
      <p class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2">
        {error1}
      </p>
    {/if}

    {#if loading}
      <div class="flex justify-center py-4">
        <RingLoader size="40" color="#ff00ae" unit="px" duration="2s"></RingLoader>
      </div>
    {:else if offers.length === 0}
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        {$t('offerings.missions.empty')}
      </p>
    {:else}
      {#each offers as offer (offer.id)}
        <div
          class="rounded-xl border border-gray-200 dark:border-gray-600 p-3 flex items-start justify-between gap-3 {offer
            .attributes.active
            ? ''
            : 'opacity-60'}"
        >
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {offer.attributes.name ||
                offer.attributes.mission?.data?.attributes?.missionName ||
                ''}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2">
              {#if priceLine(offer.attributes)}<span>💰 {priceLine(offer.attributes)}</span>{/if}
              {#if offer.attributes.hours > 0}<span>⏱️ {offer.attributes.hours} {$t('offerings.missions.hours')}</span>{/if}
              {#if locationLine(offer.attributes)}<span>📍 {locationLine(offer.attributes)}</span>{/if}
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-1.5">
            {#if busyId === offer.id}
              <RingLoader size="20" color="#ff00ae" unit="px" duration="2s"></RingLoader>
            {:else}
              <button
                class="text-xs px-2 py-1 rounded-full border transition-colors {offer.attributes.active
                  ? 'border-green-400 text-green-600 dark:text-green-400'
                  : 'border-gray-300 text-gray-400'}"
                title={offer.attributes.active
                  ? $t('offerings.missions.active')
                  : $t('offerings.missions.paused')}
                onclick={() => toggleActive(offer)}
              >
                {offer.attributes.active
                  ? $t('offerings.missions.active')
                  : $t('offerings.missions.paused')}
              </button>
              <button
                class="text-gray-400 hover:text-red-500 transition-colors"
                title={$t('offerings.missions.archive')}
                aria-label={$t('offerings.missions.archive')}
                onclick={() => archive(offer)}
              >
                <svg style="width:18px;height:18px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                  />
                </svg>
              </button>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

{#if composing}
  <div
    class="fixed inset-0 z-[1200] bg-black/60 flex items-start justify-center overflow-y-auto p-3"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl overflow-hidden my-6">
      <div class="px-4 py-3 flex items-center justify-between bg-gradient-to-l from-barbi to-mpink text-white">
        <div>
          <span class="font-bold">{$t('offerings.missions.form_title')}</span>
          <p class="text-xs opacity-80">{$t('offerings.missions.form_note')}</p>
        </div>
        <button class="text-xl leading-none" onclick={() => (composing = false)} aria-label="✕">✕</button>
      </div>
      <div class="p-2">
        <Mission
          specMode={true}
          id={0}
          name=""
          pn={null}
          pl={null}
          restime={null}
          projectId={null}
          onPublish={null}
          {missionTemplates}
          onSpec={submitSpec}
          onClose={() => (composing = false)}
        />
      </div>
    </div>
  </div>
{/if}
