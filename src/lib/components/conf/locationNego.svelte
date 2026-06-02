<script>
  import tr from '$lib/translations/tr.json';
  import Close from '$lib/celim/close.svelte';
  import { lang } from '$lib/stores/lang.js';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';

  const und = { he: 'לא הוגדר', en: 'undefined' };
  const onlineL = { he: 'אונליין', en: 'Online' };
  const kmL = { he: 'ק״מ', en: 'km' };

  /**
   * @typedef {Object} LocationValue
   * @property {string} [location_mode]
   * @property {boolean} [isOnline]
   * @property {number|null} [lat]
   * @property {number|null} [lng]
   * @property {number|null} [radius]
   * @property {string|null} [location_hint]
   */

  /**
   * @typedef {Object} Props
   * @property {number} [stepState]
   * @property {LocationValue} [location] - original value
   * @property {any} [lebel]
   * @property {LocationValue} [locationb] - negotiated (new) value, bindable
   */

  const emptyLocation = () => ({
    location_mode: 'unspecified',
    isOnline: false,
    lat: null,
    lng: null,
    radius: 15,
    location_hint: ''
  });

  /** @type {Props} */
  let {
    stepState = 2,
    location = emptyLocation(),
    lebel = { he: 'מיקום', en: 'Location' },
    locationb = $bindable(emptyLocation())
  } = $props();

  let edit = $state(false);
  let show2 = $state(false);

  function hasPoint(loc) {
    return (
      typeof loc?.lat === 'number' &&
      Number.isFinite(loc.lat) &&
      typeof loc?.lng === 'number' &&
      Number.isFinite(loc.lng)
    );
  }

  function summary(loc) {
    if (!loc) return und[$lang];
    if (loc.location_mode === 'online') return onlineL[$lang];
    if (hasPoint(loc)) {
      const hint = loc.location_hint?.trim();
      const radius = loc.radius || 15;
      const coords = `${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}`;
      return `${hint ? hint + ' · ' : ''}${coords} · ${radius} ${kmL[$lang]}`;
    }
    if (loc.location_hint?.trim()) return loc.location_hint.trim();
    return und[$lang];
  }

  function sameLoc(a, b) {
    if (a == null || b == null) return a == b;
    return (
      (a.location_mode ?? 'unspecified') === (b.location_mode ?? 'unspecified') &&
      (a.lat ?? null) === (b.lat ?? null) &&
      (a.lng ?? null) === (b.lng ?? null) &&
      (a.radius ?? null) === (b.radius ?? null) &&
      (a.location_hint ?? '') === (b.location_hint ?? '')
    );
  }

  const changed = $derived(!sameLoc(location, locationb));
</script>

<div
  class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
>
  {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
      <h2 class="underline decoration-mturk">{lebel[$lang]}:</h2>
      <p class="text-gold">
        {#if changed}
          <span class="line-through text-barbi">{summary(location)}</span>
          <span class="text-wow">{summary(locationb)}</span>
        {:else}
          {summary(locationb)}
        {/if}
      </p>
      <button onclick={() => (edit = true)}>
        {#if changed}✏️{:else}🖍️{/if}</button
      >
      {#if changed && show2 != true}
        <button onclick={() => (show2 = true)}>📑</button>
      {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center">
          <button onclick={() => (show2 = false)}><Close /></button>
          <small class:text-right={$lang == 'he'}>{tr?.nego.original[$lang]}:</small>
          <p>{summary(location)}</p>
          <small class:text-right={$lang == 'he'} class="text-gold"
            >{tr?.nego.sugestion[$lang]}:</small
          >
          <p class="text-gold">{summary(locationb)}</p>
        </div>
      {/if}
    </div>
  {:else}
    <div dir="ltr" class="mx-auto w-full max-w-xl">
      <LocationPicker bind:value={locationb} label={lebel[$lang]} />
    </div>
    <button onclick={() => (edit = false)}>✅</button>
  {/if}
</div>
