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
  import MultiSelect, { fuzzy_match } from 'svelte-multiselect';
  import { skil, role, valluesStore, ww } from '$lib/components/prPr/mi.js';
  import { lang } from '$lib/stores/lang.js';
  import { liUN } from '$lib/stores/liUN.js';
  import { checkDuplicate } from '$lib/embed/vocab-creation';
  import { VOCAB_KINDS } from '$lib/vocab/vocabKinds';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
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
  const STORES = { skills: skil, vallues: valluesStore, roles: role, workways: ww };
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

  // Locale-agnostic catalog membership test: matches the master name OR any
  // localization. Used to decide whether a user-added label is genuinely new
  // (and must be created) vs. an existing item picked under any language.
  function existsInCatalog(name) {
    return items.some((c) => {
      if (c.attributes?.[meta.nameField] === name) return true;
      const locs = c.attributes?.localizations?.data;
      return Array.isArray(locs) && locs.some((l) => l?.attributes?.[meta.nameField] === name);
    });
  }

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

  // The duplicate check returns the DEFAULT-locale label (e.g. English) plus the
  // Strapi id. The catalog store already holds each entry with its localizations,
  // so we resolve the match's id → the current-language name locally — no extra
  // request, and the suggestion reads the same as every other option.
  function localizedMatchName() {
    if (!dupMatch) return null;
    const hit = items.find((c) => String(c.id) === String(dupMatch.id));
    return (hit && entryName(hit)) || dupMatch.label;
  }

  // The semantically-matched existing item, surfaced INSIDE the dropdown as a
  // selectable row (instead of an outside popup). It is a real catalog entry,
  // so picking it must NOT trigger creation — see `existingPicked` below.
  let suggestionLabel = $derived.by(() => {
    if (!dupMatch || (dupStatus !== 'found' && dupStatus !== 'similar')) return null;
    const name = localizedMatchName();
    return name && !selected.includes(name) ? name : null;
  });
  // Prepend the suggestion only if the catalog doesn't already list it (a
  // semantic match isn't necessarily a substring, so it can be hidden by the
  // search filter even when present). `optionFilter` keeps it visible either way.
  let mergedOptions = $derived(
    suggestionLabel && !options.includes(suggestionLabel) ? [suggestionLabel, ...options] : options
  );

  // Existing labels the user accepted from the suggestion row — already in the
  // catalog (possibly under another locale), so never auto-create these.
  let existingPicked = new SvelteSet();

  // Keep the suggestion always visible (it's a semantic match, so it usually
  // isn't a substring of the typed text); fuzzy-match everything else as before.
  function optionFilter(opt, search) {
    if (opt === suggestionLabel) return true;
    if (!search) return true;
    return fuzzy_match(search, `${opt}`);
  }

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

  // Picking the suggested existing item from the dropdown: remember it so the
  // create effect skips it, then reset the search/duplicate state.
  //
  // NOTE: svelte-multiselect updates `selected` BEFORE invoking onadd, which
  // makes the `suggestionLabel` derived recompute to null (it excludes names
  // already in `selected`). So resolve the picked name directly from the still-
  // current dupMatch here rather than reading suggestionLabel.
  function handleAdd(data) {
    const opt = data.option;
    const picked =
      dupMatch && (dupStatus === 'found' || dupStatus === 'similar')
        ? localizedMatchName()
        : null;
    if (picked && opt === picked) {
      // User accepted the semantic suggestion → it's an existing item; never create.
      existingPicked.add(picked);
      // If the match came purely from a semantic (vector) hit, it may not be in
      // the locally-loaded catalog — add a minimal entry so downstream label→id
      // resolution (e.g. edit.svelte's find_id) can resolve it instead of
      // silently dropping the selection.
      if (dupMatch.id && !items.some((c) => String(c.id) === String(dupMatch.id))) {
        store.update((curr) => [
          ...curr,
          { id: dupMatch.id, attributes: { [meta.nameField]: picked } }
        ]);
      }
      searchText = '';
      dupStatus = 'idle';
      dupMatch = null;
    } else if (autoCreate && opt && !existsInCatalog(opt) && !existingPicked.has(opt)) {
      // A genuinely new item the user typed/appended → create it server-side.
      // Creation happens ONLY here, on an explicit user add. It must never be
      // driven off a `selected` diff: entering edit mode seeds the selection
      // with the user's existing saved items, and treating those as "added"
      // would try to re-create them, then strip them on failure — wiping the
      // whole list on a no-op open/close.
      createNew(opt);
    }
    onadd?.(data);
  }

  const dupMsg = {
    he: { found: tr.selector['identical' + meta.i18nSuffix].he, similar: tr.selector['similar' + meta.i18nSuffix].he },
    en: { found: tr.selector['identical' + meta.i18nSuffix].en, similar: tr.selector['similar' + meta.i18nSuffix].en },
    ar: { found: tr.selector['identical' + meta.i18nSuffix].ar, similar: tr.selector['similar' + meta.i18nSuffix].ar }
  };
  const pct = (sim) => `${Math.round(sim * 100)}%`;

  // --- Create on user add ---
  // (The actual trigger lives in handleAdd — see the note there on why creation
  // must not be driven off a reactive `selected` diff.)
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
    filterFunc={optionFilter}
    loading={dupStatus === 'checking'}
    bind:searchText
    bind:selected
    placeholder={actualPlaceholder}
    onadd={handleAdd}
    {onremove}
    options={mergedOptions}
  >
    {#snippet option({ option })}
      {#if suggestionLabel && option === suggestionLabel}
        <div class="dup-suggestion {dupStatus === 'found' ? 'is-exact' : 'is-similar'}">
          <svg style="width:20px;height:20px;flex:none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
          </svg>
          <span class="dup-suggestion-body">
            <span class="dup-suggestion-label">{suggestionLabel}</span>
            <small class="dup-suggestion-hint"
              >{dupMsg[$lang][dupStatus]} {pct(dupMatch.similarity)}</small
            >
          </span>
        </div>
      {:else}
        {option}
      {/if}
    {/snippet}
  </MultiSelect>
</div>

<style>
  /* The matched existing item, rendered as a row inside the dropdown.
     Solid dark fill + light text so it stays readable on the gold list. */
  .dup-suggestion {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
  }
  .dup-suggestion.is-exact {
    background: #4a0f12;
    color: #ffd9d9;
  }
  .dup-suggestion.is-similar {
    background: #3a2c05;
    color: #ffe680;
  }
  .dup-suggestion-body {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
    min-width: 0;
  }
  .dup-suggestion-label {
    font-weight: 700;
  }
  .dup-suggestion-hint {
    opacity: 0.9;
    font-size: 0.75em;
  }
</style>
