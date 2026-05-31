<script>
  import MultiSelect from 'svelte-multiselect';
  import { role } from '$lib/components/prPr/mi.js';
  import { lang } from '$lib/stores/lang.js';
  import { liUN } from '$lib/stores/liUN.js';
  import {
    checkDuplicate,
    validateAndCreateVocabItem
  } from '$lib/embed/vocab-creation';
  import { sanitizeUserInput } from '$lib/func/uti/sanitizeUserInput.svelte';
  import { onMount, untrack } from 'svelte';
  import tr from '$lib/translations/tr.json';

  // --- Props ---
  let {
    selectedRoles = $bindable([]),
    placeholder = undefined,
    color = '--gold',
    autoCreate = true, // Whether to automatically create appended roles on the server
    onadd = undefined,
    onremove = undefined
  } = $props();

  let defaultPlaceholder = $derived(tr.selector.searchRoles[$lang]);
  let actualPlaceholder = $derived(placeholder || defaultPlaceholder);
  const baseUrl = import.meta.env.VITE_URL;

  // --- State ---
  let searchText = $state('');

  // Options for multiselect
  let options = $state([]);

  // Fetch from server only ONCE to get the updated localizations, then use store
  onMount(async () => {
    const roles = $role;
    if (roles && roles.length > 0 && !roles[0]['_fresh']) {
      try {
        const query = `
          query {
            tafkidims(sort: "roleDescription", pagination: { limit: 1000 }) {
              data {
                id
                attributes {
                  roleDescription
                  ${$lang === 'he' ? 'localizations { data { attributes { roleDescription } } }' : ''}
                }
              }
            }
          }
        `;
        const res = await fetch(baseUrl + '/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        }).then((r) => r.json());

        if (res?.data?.tafkidims?.data) {
          let freshRoles = res.data.tafkidims.data;
          if (freshRoles.length > 0) {
            freshRoles[0]['_fresh'] = true; // Mark as fetched so other components won't re-fetch
          }
          role.set(freshRoles);
        }
      } catch (e) {
        console.warn('Failed to fetch fresh localized roles:', e);
      }
    }
  });

  // Extract initial options directly from the store
  $effect(() => {
    if (!$role) return;
    let opts = $role
      .map((c) => {
        let name = c.attributes?.roleDescription || '';
        if ($lang === 'he' && c.attributes?.localizations?.data?.length > 0) {
          name = c.attributes.localizations.data[0].attributes.roleDescription;
        }
        return name;
      })
      .filter(Boolean);
    options = [...new Set(opts)];
  });

  // --- Duplicate Checking & Semantics ---
  let dupStatus = $state('idle'); // 'idle' | 'checking' | 'found' | 'similar'
  let dupMatch = $state(null); // { id, label, similarity }
  let debounceTimer;

  function onSearchInput(val) {
    clearTimeout(debounceTimer);
    if (!val || val.trim().length < 2) {
      dupStatus = 'idle';
      dupMatch = null;
      return;
    }

    const searchLower = val.trim().toLowerCase();
    const hasLocalMatches = options.some((opt) =>
      opt.toLowerCase().includes(searchLower)
    );

    // Only check if it's completely new and no local string matches exist
    if (hasLocalMatches || selectedRoles.includes(val.trim())) {
      dupStatus = 'idle';
      dupMatch = null;
      return;
    }

    debounceTimer = setTimeout(async () => {
      dupStatus = 'checking';
      try {
        const result = await checkDuplicate(val.trim(), 'roles');
        if (result.isDuplicate) {
          dupMatch = result.match;
          if (result.match.similarity >= 0.92) {
            dupStatus = 'found';
          } else {
            dupStatus = 'similar';
          }
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

  // --- Messages ---
  const dupMsg = {
    he: { found: tr.selector.identicalRole.he, similar: tr.selector.similarRole.he, override: tr.ui.addAnyway.he },
    en: { found: tr.selector.identicalRole.en, similar: tr.selector.similarRole.en, override: tr.ui.addAnyway.en },
    ar: { found: tr.selector.identicalRole.ar, similar: tr.selector.similarRole.ar, override: tr.ui.addAnyway.ar }
  };

  const pct = (sim) => `${Math.round(sim * 100)}%`;

  function acceptSuggestion(match) {
    if (!selectedRoles.includes(match.label)) {
      selectedRoles = [...selectedRoles, match.label];
    }
    searchText = '';
    dupStatus = 'idle';
    dupMatch = null;
  }

  // --- Handling User Creating a New Option ---
  let previousSelected = [];

  $effect(() => {
    const currentRoles = selectedRoles || [];

    untrack(() => {
      const added = currentRoles.filter((s) => !previousSelected.includes(s));

      if (autoCreate && added.length > 0) {
        for (const item of added) {
          // If the newly added item is not in options, it's a new string the user appended
          if (!options.includes(item)) {
            createNewRole(item);
          }
        }
      }

      previousSelected = [...currentRoles];
    });
  });

  async function createNewRole(label) {
    const result = await validateAndCreateVocabItem(
      label,
      'roles',
      async (safeLabel) => {
        const d = new Date();
        const res = await fetch(baseUrl + '/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation {
              createTafkidim(data: {
                roleDescription: "${sanitizeUserInput(safeLabel)}",
                publishedAt: "${d.toISOString()}"
              }) {
                data {
                  id
                  attributes {
                    roleDescription
                    ${$lang === 'he' ? 'localizations { data { attributes { roleDescription } } }' : ''}
                  }
                }
              }
            }`
          })
        }).then((r) => r.json());

        const newRole = res.data.createTafkidim.data;

        // Auto localize (background)
        fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'tafkidims',
            entryId: newRole.id,
            sourceLocale: $lang
          })
        }).catch((e) => console.warn('Localization fail:', e));

        // Update the global store so the new option appears immediately in other components
        role.update((curr) => {
          return [...curr, newRole];
        });

        // Add telemetry
        fetch('/api/ste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: $liUN || 'user',
            action: 'יצר תפקיד חדש דרך multiselect בשם:',
            det: safeLabel
          })
        }).catch((e) => console.warn('Log fail:', e));

        return { id: String(newRole.id), label: safeLabel, translations: {} };
      },
      { overrideDuplicate: true }
    );

    // If vocab-creation rejected it as duplicate
    if (result.success === false && result['reason'] === 'duplicate') {
      const match = result['match'];
      if (match?.label) {
        selectedRoles = selectedRoles.filter((s) => s !== label);
        if (!selectedRoles.includes(match.label)) {
          selectedRoles = [...selectedRoles, match.label];
        }
      }
    }
  }

  let addnMsg = $derived({
    he: `${tr.selector.addPrefix.he} "${searchText}"`,
    en: `${tr.selector.addPrefix.en} "${searchText}"`,
    ar: `${tr.selector.addPrefix.ar} "${searchText}"`
  });
</script>

<div
  class="role-selector-container max-w-full text-right sm:text-right"
  dir={$lang === 'en' ? 'ltr' : 'rtl'}
  style="--the:var({color});"
>
  <MultiSelect
    outerDivClass="!bg-gold !text-barbi w-full"
    inputClass="!bg-gold !text-barbi w-full"
    liSelectedClass="!bg-barbi !text-gold"
    --sms-width="100%"
    createOptionMsg={searchText
      ? addnMsg[$lang]
      : $lang === 'he'
        ? '...'
        : '...'}
    allowUserOptions="append"
    bind:searchText
    bind:selected={selectedRoles}
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
        class="dup-banner {dupStatus === 'found'
          ? 'dup-exact'
          : 'dup-similar'} flex items-center justify-between w-full p-3 rounded-xl shadow-2xl border-2 z-[100] mt-1"
      >
        <div class="flex items-center gap-3">
          <svg
            style="width:24px;height:24px"
            viewBox="0 0 24 24"
            class="inline"
          >
            <path
              fill="currentColor"
              d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"
            />
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
            aria-label={tr.ui.dismiss[$lang]}
            title={tr.ui.dismiss[$lang]}
          >
            <svg style="width:20px;height:20px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
              />
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
