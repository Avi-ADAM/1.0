<script>
  import { isRtl } from '$lib/translations';
  import MultiSelect from 'svelte-multiselect';
  import { skil } from '$lib/components/prPr/mi.js';
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
    selectedSkills = $bindable([]),
    placeholder = undefined,
    color = '--gold',
    autoCreate = true, // Whether to automatically create appended skills on the server
    onadd = undefined,
    onremove = undefined
  } = $props();

  let defaultPlaceholder = $derived(tr.selector.searchSkills[$lang]);
  let actualPlaceholder = $derived(placeholder || defaultPlaceholder);
  const baseUrl = import.meta.env.VITE_URL;

  // --- State ---
  let searchText = $state('');

  // Options for multiselect
  let options = $state([]);

  // Fetch from server only ONCE to get the updated localizations, then use store
  onMount(async () => {
    if ($skil && $skil.length > 0 && !$skil[0]._fresh) {
      try {
        const query = `
          query {
            skills(sort: "skillName", pagination: { limit: 1000 }) {
              data {
                id
                attributes {
                  skillName
                  ${$lang === 'he' ? 'localizations { data { attributes { skillName } } }' : ''}
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

        if (res?.data?.skills?.data) {
          let freshSkills = res.data.skills.data;
          if (freshSkills.length > 0) {
            freshSkills[0]._fresh = true; // Mark as fetched so other components won't re-fetch
          }
          skil.set(freshSkills);
        }
      } catch (e) {
        console.warn('Failed to fetch fresh localized skills:', e);
      }
    }
  });

  // Extract initial options directly from the store
  $effect(() => {
    if (!$skil) return;
    let opts = $skil
      .map((c) => {
        let name = c.attributes?.skillName || '';
        if ($lang === 'he' && c.attributes?.localizations?.data?.length > 0) {
          name = c.attributes.localizations.data[0].attributes.skillName;
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
    if (hasLocalMatches || selectedSkills.includes(val.trim())) {
      dupStatus = 'idle';
      dupMatch = null;
      return;
    }

    debounceTimer = setTimeout(async () => {
      dupStatus = 'checking';
      try {
        const result = await checkDuplicate(val.trim(), 'skills');
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
    he: { found: tr.selector.identicalSkill.he, similar: tr.selector.similarSkill.he, override: tr.ui.addAnyway.he },
    en: { found: tr.selector.identicalSkill.en, similar: tr.selector.similarSkill.en, override: tr.ui.addAnyway.en },
    ar: { found: tr.selector.identicalSkill.ar, similar: tr.selector.similarSkill.ar, override: tr.ui.addAnyway.ar }
  };

  const pct = (sim) => `${Math.round(sim * 100)}%`;

  function acceptSuggestion(match) {
    if (!selectedSkills.includes(match.label)) {
      selectedSkills = [...selectedSkills, match.label];
    }
    searchText = '';
    dupStatus = 'idle';
    dupMatch = null;
  }

  // --- Handling User Creating a New Option ---
  let previousSelected = [];

  $effect(() => {
    const currentSkills = selectedSkills || [];

    untrack(() => {
      const added = currentSkills.filter((s) => !previousSelected.includes(s));

      if (autoCreate && added.length > 0) {
        for (const item of added) {
          // If the newly added item is not in options, it's a new string the user appended
          if (!options.includes(item)) {
            createNewSkill(item);
          }
        }
      }

      previousSelected = [...currentSkills];
    });
  });

  async function createNewSkill(label) {
    const result = await validateAndCreateVocabItem(
      label,
      'skills',
      async (safeLabel) => {
        const d = new Date();
        const res = await fetch(baseUrl + '/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation {
              createSkill(data: {
                skillName: "${sanitizeUserInput(safeLabel)}",
                publishedAt: "${d.toISOString()}"
              }) {
                data {
                  id
                  attributes {
                    skillName
                    ${$lang === 'he' ? 'localizations { data { attributes { skillName } } }' : ''}
                  }
                }
              }
            }`
          })
        }).then((r) => r.json());

        const newSkill = res.data.createSkill.data;

        // Auto localize (background)
        fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'skills',
            entryId: newSkill.id,
            sourceLocale: $lang
          })
        }).catch((e) => console.warn('Localization fail:', e));

        // Update the global store so the new option appears immediately in other components
        skil.update((curr) => {
          return [...curr, newSkill];
        });

        // Add telemetry
        fetch('/api/ste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: $liUN || 'user',
            action: 'יצר כישור חדש דרך multiselect בשם:',
            det: safeLabel
          })
        }).catch((e) => console.warn('Log fail:', e));

        return { id: String(newSkill.id), label: safeLabel, translations: {} };
      },
      { overrideDuplicate: true }
    );

    // If vocab-creation rejected it as duplicate
    if (!result.success && result.reason === 'duplicate') {
      if (result.match?.label) {
        selectedSkills = selectedSkills.filter((s) => s !== label);
        if (!selectedSkills.includes(result.match.label)) {
          selectedSkills = [...selectedSkills, result.match.label];
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
  class="skill-selector-container max-w-full text-right sm:text-right"
  dir={$isRtl ? 'rtl' : 'ltr'}
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
    bind:selected={selectedSkills}
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
