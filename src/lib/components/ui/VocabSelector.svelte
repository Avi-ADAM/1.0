<script>
  /**
   * Unified vocabulary selector — skills / values / roles, one component used
   * everywhere (registration, onboarding, mission & project creation, profile).
   *
   * - Reads the catalog once via /api/vocab/list and caches it in the shared
   *   store (mi.js), so other instances reuse it without re-fetching.
   * - Live semantic duplicate detection (vector embeddings) warns before a user
   *   creates something that already exists, and offers the existing item.
   * - New items are created server-side via /api/vocab/create, which moderates,
   *   indexes the vector, and notifies the owner. Translation to all locales is
   *   then fired from here. No direct Strapi access from the client.
   */
  import { isRtl } from '$lib/translations';
  import MultiSelect from 'svelte-multiselect';
  import { skil, role, valluesStore } from '$lib/components/prPr/mi.js';
  import { lang } from '$lib/stores/lang.js';
  import { liUN } from '$lib/stores/liUN.js';
  import { checkDuplicate } from '$lib/embed/vocab-creation';
  import { VOCAB_KINDS } from '$lib/vocab/vocabKinds';
  import { onMount, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import tr from '$lib/translations/tr.json';

  let {
    kind,
    selected = $bindable([]),
    placeholder = undefined,
    color = '--gold',
    autoCreate = true,
    onadd = undefined,
    onremove = undefined
  } = $props();

  const meta = VOCAB_KINDS[kind];
  const STORES = { skills: skil, vallues: valluesStore, roles: role };
  const store = STORES[kind];

  let defaultPlaceholder = $derived(tr.selector[meta.searchKey][$lang]);
  let actualPlaceholder = $derived(placeholder || defaultPlaceholder);

  // --- Catalog (subscribed from the shared store) ---
  let items = $state([]);
  $effect(() => store.subscribe((v) => (items = v || [])));

  /** Display name for an entry, preferring the he localization when in Hebrew. */
  function entryName(c) {
    let name = c.attributes?.[meta.nameField] || '';
    if ($lang === 'he' && c.attributes?.localizations?.data?.length > 0) {
      name = c.attributes.localizations.data[0].attributes[meta.nameField];
    }
    return name;
  }

  let options = $derived([...new Set(items.map(entryName).filter(Boolean))]);

  // Fetch the catalog once (through the proxy), then rely on the store.
  onMount(async () => {
    const current = get(store) || [];
    if (current.length > 0 && !current[0]?._fresh) {
      try {
        const res = await fetch(`/api/vocab/list?kind=${kind}&lang=${$lang}`).then((r) => r.json());
        if (res?.data?.length) {
          res.data[0]._fresh = true;
          store.set(res.data);
        }
      } catch (e) {
        console.warn(`[VocabSelector] failed to refresh ${kind}:`, e);
      }
    }
  });

  // --- Live duplicate detection ---
  let dupStatus = $state('idle'); // idle | checking | found | similar | dismissed
  let dupMatch = $state(null);
  let debounceTimer;
  let searchText = $state('');

  function onSearchInput(val) {
    clearTimeout(debounceTimer);
    if (!val || val.trim().length < 2) {
      dupStatus = 'idle';
      dupMatch = null;
      return;
    }
    const searchLower = val.trim().toLowerCase();
    const hasLocalMatches = options.some((opt) => opt.toLowerCase().includes(searchLower));
    if (hasLocalMatches || selected.includes(val.trim())) {
      dupStatus = 'idle';
      dupMatch = null;
      return;
    }
    debounceTimer = setTimeout(async () => {
      dupStatus = 'checking';
      try {
        const result = await checkDuplicate(val.trim(), meta.pineconeNamespace);
        if (result.isDuplicate) {
          dupMatch = result.match;
          dupStatus = result.match.similarity >= 0.92 ? 'found' : 'similar';
        } else {
          dupStatus = 'idle';
          dupMatch = null;
        }
      } catch {
        dupStatus = 'idle';
      }
    }, 500);
  }

  $effect(() => {
    onSearchInput(searchText);
  });

  function dismissDuplicate() {
    dupStatus = 'dismissed';
    dupMatch = null;
  }

  function acceptSuggestion(match) {
    if (!selected.includes(match.label)) selected = [...selected, match.label];
    searchText = '';
    dupStatus = 'idle';
    dupMatch = null;
  }

  const dupMsg = {
    he: { found: tr.selector['identical' + meta.i18nSuffix].he, similar: tr.selector['similar' + meta.i18nSuffix].he },
    en: { found: tr.selector['identical' + meta.i18nSuffix].en, similar: tr.selector['similar' + meta.i18nSuffix].en },
    ar: { found: tr.selector['identical' + meta.i18nSuffix].ar, similar: tr.selector['similar' + meta.i18nSuffix].ar }
  };
  const pct = (sim) => `${Math.round(sim * 100)}%`;

  // --- Create on append ---
  let previousSelected = [];
  $effect(() => {
    const current = selected || [];
    untrack(() => {
      const added = current.filter((s) => !previousSelected.includes(s));
      if (autoCreate && added.length > 0) {
        for (const item of added) {
          if (!options.includes(item)) createNew(item);
        }
      }
      previousSelected = [...current];
    });
  });

  async function createNew(label) {
    try {
      const res = await fetch('/api/vocab/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, label, lang: $lang, createdBy: $liUN || 'user' })
      }).then((r) => r.json());

      if (!res?.success || !res.item) throw new Error('create failed');

      // Flagged → archived for owner review: don't surface it in the UI.
      if (res.moderation?.flagged) {
        selected = selected.filter((s) => s !== label);
        return;
      }

      // Add to the shared store so it appears everywhere immediately.
      store.update((curr) => [...curr, { id: res.item.id, attributes: res.item.attributes }]);

      // Fire auto-translation (background, browser-kept so it isn't cut short).
      if (res.translate) {
        fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(res.translate)
        }).catch((e) => console.warn('Localization fail:', e));
      }
    } catch (e) {
      console.warn(`[VocabSelector] create ${kind} failed:`, e);
      selected = selected.filter((s) => s !== label);
    }
  }

  let addnMsg = $derived({
    he: `${tr.selector.addPrefix.he} "${searchText}"`,
    en: `${tr.selector.addPrefix.en} "${searchText}"`,
    ar: `${tr.selector.addPrefix.ar} "${searchText}"`
  });
</script>

<div
  class="vocab-selector-container max-w-full text-right sm:text-right"
  dir={$isRtl ? 'rtl' : 'ltr'}
  style="--the:var({color});"
>
  <MultiSelect
    outerDivClass="!bg-gold !text-barbi w-full"
    inputClass="!bg-gold !text-barbi w-full"
    liSelectedClass="!bg-barbi !text-gold"
    --sms-width="100%"
    createOptionMsg={searchText ? addnMsg[$lang] : '...'}
    allowUserOptions="append"
    bind:searchText
    bind:selected
    placeholder={actualPlaceholder}
    {onadd}
    {onremove}
    {options}
  />

  <div class="mt-2 text-sm min-h-[30px] flex px-2 transition-all">
    {#if dupStatus === 'checking'}
      <div class="opacity-60 text-gold flex items-center">
        <span class="checking-dot">{tr.ui.searching[$lang]}</span>
      </div>
    {:else if dupMatch}
      <div
        class="dup-banner {dupStatus === 'found' ? 'dup-exact' : 'dup-similar'} flex items-center justify-between w-full p-3 rounded-xl shadow-2xl border-2 z-[100] mt-1"
      >
        <div class="flex items-center gap-3">
          <svg style="width:24px;height:24px" viewBox="0 0 24 24" class="inline">
            <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
          </svg>
          <span class="text-base font-bold"
            >{dupMsg[$lang][dupStatus]} <strong>"{dupMatch.label}"</strong>
            <small>({pct(dupMatch.similarity)})</small></span
          >
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-40 hover:scale-105 rounded-full transition-all text-gold font-bold"
            onclick={() => acceptSuggestion(dupMatch)}
          >
            {tr.ui.selectAndAdd[$lang]}
          </button>
          <button
            class="p-1 hover:bg-white hover:bg-opacity-10 rounded-full transition-all text-white font-bold"
            onclick={dismissDuplicate}
            title={tr.ui.dismiss[$lang]}
          >
            <svg style="width:20px;height:20px" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .dup-exact {
    background: #4a0f12;
    color: #ffbaba;
    border-color: #ff3333;
  }
  .dup-similar {
    background: #372905;
    color: #ffd700;
    border-color: #ffd700;
  }
  .checking-dot {
    animation: blink 1.5s infinite;
  }
  @keyframes blink {
    0% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.3;
    }
  }
</style>
