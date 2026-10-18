<script>
  import { idPr } from '$lib/stores/idPr.js';
  import moment from 'moment';
  import { onMount } from 'svelte';
  let isEdit = $state(false);
  onMount(() => {
    console.log(editdata);
    if (editdata != -1) {
      isEdit = true;
      teur = editdata.des;
      name = editdata.shem;
      link = editdata.link;
      mimatai = editdata.dateS;
      adMatai = editdata.dateF;
      hashivut = editdata.hashivut || 'white';
    }
    if (id > 0) {
      const bmi = bmiData.filter((t) => t.id == id);
      console.log(bmi);
      selected = [
        bmi[0].attributes.users_permissions_user.data.attributes.username +
          ' - ' +
          bmi[0].attributes.name +
          ' - ' +
          bmi[0].id
      ];
    }
  });

  let seEr = $state(false),
    neEr = $state(false);
  import MultiSelect from 'svelte-multiselect';
  import SveltyPicker from 'svelty-picker';

  import { lang } from '$lib/stores/lang.js';
  import { t, isRtl } from '$lib/translations';
  import Button from '$lib/celim/ui/button.svelte';
  import { page } from '$app/state';

  /**
   * @typedef {Object} Props
   * @property {any} [bmiData]
   * @property {any} [proles]
   * @property {any} id
   * @property {any} misid
   * @property {boolean} [fromMis]
   * @property {any} [editdata]
   * @property {any} [userMevatzeaId]
   * @property {any} [userMevakeshId]
   * @property {any} [mimatai]
   * @property {any} [adMatai]
   * @property {string} [name]
   * @property {string} [teur]
   * @property {any} [selected]
   * @property {string} [link]
   * @property {string} [hashivut]
   * @property {boolean} [isPersonal]
   * @property {boolean} [hideHeading]
   * @property {(payload: { id: any; name: any; user: any; }) => void} [onDone]
   * @property {(payload: { isEdit: boolean; id: any; data: { des: any; shem: any; link: any; dateS: any; dateF: any; hashivut: any; }; }) => void} [onAdd]
   */

  /** @type {Props} */
  let {
    bmiData = [],
    proles = [],
    id,
    misid,
    fromMis = false,
    editdata = -1,
    userMevatzeaId = $bindable(),
    userMevakeshId = $bindable(page.data.uid),
    mimatai = $bindable(),
    adMatai = $bindable(),
    name = $bindable(''),
    teur = $bindable(''),
    selected = $bindable([]),
    link = $bindable(''),
    hashivut = $bindable('white'),
    isPersonal = $bindable(true),
    hideHeading = false,
    onDone,
    onAdd
  } = $props();

  function find_tafkidims_id(selected) {
    let arr = [];
    for (let i = 0; i < selected.length; i++) {
      for (let t = 0; t < proles.length; t++) {
        if (proles[t].name === selected[i]) {
          arr.push(proles[t].id);
        }
      }
    }
    return arr;
  }

  function find_se_id(lebel) {
    let id, uid;
    for (let i = 0; i < bmiData.length; i++) {
      if (
        bmiData[i].attributes.users_permissions_user.data.attributes.username +
          ' - ' +
          bmiData[i].attributes.name +
          ' - ' +
          bmiData[i].id ==
        lebel
      ) {
        id = bmiData[i].id;
        uid = bmiData[i].attributes.users_permissions_user.data.id;
      }
    }
    return [id, uid];
  }

  let loading = $state(false);
  let success = $state(false);
  let error = $state(false);

  async function sub() {
    loading = true;
    if (fromMis == false) {
      if (selected.length < 1) {
        seEr = true;
        error = true;
        loading = false;
      } else {
        if (name.length < 1) {
          neEr = true;
          error = true;
          loading = false;
        } else {
          error = false;
          neEr = false;
          seEr = false;

          let momentx = moment(mimatai, 'HH:mm DD/MM/YYYY ');
          let momebtt = moment(adMatai, 'HH:mm DD/MM/YYYY ');

          /** @type {Record<string, any>} */
          const params = {
            projectId: $idPr,
            name,
            description: teur,
            link,
            isAssigned: isPersonal,
            hashivut
          };

          if (mimatai !== undefined && mimatai !== null) {
            params.dateS = momentx.toISOString();
          }
          if (adMatai !== undefined && adMatai !== null) {
            params.dateF = momebtt.toISOString();
          }

          if (isPersonal) {
            const ob = find_se_id(selected);
            userMevatzeaId = ob[1];
            params.assignedUserId = String(ob[1]);
            params.missionId = String(ob[0]);
          } else {
            params.tafkidims = find_tafkidims_id(selected);
          }

          try {
            const res = await fetch('/api/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ actionKey: 'createTask', params })
            });
            const result = await res.json();
            loading = false;
            if (result.success) {
              success = true;
              onDone?.({
                id: result.data?.id,
                name: result.data?.attributes?.shem ?? name,
                user: result.data?.attributes?.my?.data?.id ?? null
              });
            } else {
              error = true;
            }
          } catch (e) {
            loading = false;
            error = true;
          }
        }
      }
    } else {
      loading = false;
      success = true;
      onAdd?.({
        isEdit,
        id: misid,
        data: {
          des: teur,
          shem: name,
          link,
          dateS: mimatai,
          dateF: adMatai,
          hashivut
        }
      });
    }
  }

  const urgencyOptions = $derived([
    { value: 'white', label: $t('mission.crtask.urgencyWhite'), color: 'bg-white' },
    { value: 'green', label: $t('mission.crtask.urgencyGreen'), color: 'bg-green-500' },
    { value: 'yellow', label: $t('mission.crtask.urgencyYellow'), color: 'bg-yellow-400' },
    { value: 'red', label: $t('mission.crtask.urgencyRed'), color: 'bg-red-500' }
  ]);
</script>

<div class="task-form w-full max-w-xl mx-auto flex flex-col gap-5 text-surfaceInk" dir={$isRtl ? 'rtl' : 'ltr'}>
  {#if !hideHeading}
    <h2 class="text-xl sm:text-2xl font-bold text-center text-barbi mb-1">
      {isEdit == false ? $t('mission.crtask.heading') : $t('mission.crtask.editHeading')}
    </h2>
  {/if}

  <!-- שם המטלה -->
  <div class="flex flex-col">
    <label for="task-name-input" class="text-sm font-semibold text-surfaceInk mb-1.5 flex items-center justify-between">
      <span>{$t('mission.crtask.taskName')} <span class="text-red-500">*</span></span>
      {#if neEr == true}
        <span class="text-xs text-red-500 font-medium">{$t('mission.crtask.nameRequired')}</span>
      {/if}
    </label>
    <input
      id="task-name-input"
      name="taskName"
      bind:value={name}
      type="text"
      placeholder={$t('mission.crtask.taskName')}
      class="task-input"
      required
    />
  </div>

  <!-- תאריכים -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="flex flex-col">
      <label for="task-start-input" class="text-sm font-semibold text-surfaceInk mb-1.5">
        {$t('mission.crtask.startDate')}
      </label>
      <div class="svelty-picker-wrap">
        <SveltyPicker
          inputId="task-start-input"
          placeholder={$t('mission.crtask.startDate')}
          inputClasses="task-input"
          format=" hh:ii dd/mm/yyyy"
          bind:value={mimatai}
        ></SveltyPicker>
      </div>
    </div>
    <div class="flex flex-col">
      <label for="task-end-input" class="text-sm font-semibold text-surfaceInk mb-1.5">
        {$t('mission.crtask.endDate')}
      </label>
      <div class="svelty-picker-wrap">
        <SveltyPicker
          inputId="task-end-input"
          placeholder={$t('mission.crtask.endDate')}
          inputClasses="task-input"
          format=" hh:ii dd/mm/yyyy"
          bind:value={adMatai}
        ></SveltyPicker>
      </div>
    </div>
  </div>

  <!-- קישור רלוונטי -->
  <div class="flex flex-col">
    <label for="task-link-input" class="text-sm font-semibold text-surfaceInk mb-1.5">
      {$t('mission.crtask.relevantLink')}
    </label>
    <input
      id="task-link-input"
      name="taskLink"
      bind:value={link}
      type="url"
      placeholder="https://..."
      class="task-input"
    />
  </div>

  <!-- תיאור המטלה -->
  <div class="flex flex-col">
    <label for="task-desc-input" class="text-sm font-semibold text-surfaceInk mb-1.5">
      {$t('mission.crtask.taskDescription')}
    </label>
    <textarea
      id="task-desc-input"
      name="taskDescription"
      bind:value={teur}
      rows="3"
      placeholder={$t('mission.crtask.taskDescription')}
      class="task-input resize-y"
    ></textarea>
  </div>

  <!-- רמת דחיפות -->
  <div class="flex flex-col items-center gap-3 p-4 bg-surface2/60 dark:bg-zinc-800/60 rounded-xl w-full border border-surfaceLine dark:border-zinc-700 shadow-sm">
    <span class="text-sm font-semibold text-surfaceInk">{$t('mission.crtask.urgencyLevel')}</span>
    <div class="flex gap-4 sm:gap-6 items-center justify-center flex-wrap">
      {#each urgencyOptions as option (option.value)}
        <button
          type="button"
          onclick={() => (hashivut = option.value)}
          class="group relative flex flex-col items-center gap-1.5 transition-all duration-200 transform active:scale-95 focus:outline-none"
          title={option.label}
        >
          <div
            class="w-10 h-10 rounded-xl border-2 shadow-sm transition-all duration-200 flex items-center justify-center {option.color} 
            {hashivut === option.value ? 'border-barbi scale-110 ring-4 ring-barbi/20 shadow-md' : 'border-zinc-300 dark:border-zinc-600 opacity-70 hover:opacity-100 hover:scale-105'}
            {option.value === 'white' ? '!border-zinc-400 dark:!border-zinc-500' : ''}"
          >
            {#if hashivut === option.value}
              <span class="text-xs font-bold {option.value === 'white' || option.value === 'yellow' ? 'text-zinc-900' : 'text-white'}">
                ✓
              </span>
            {/if}
          </div>
          <span class="text-xs font-medium transition-colors {hashivut === option.value ? 'text-barbi font-bold' : 'text-surfaceMuted'}">
            {option.label}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- שיוך מטלה -->
  {#if fromMis != true}
    <div class="flex flex-col gap-3 w-full">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-surfaceInk">{$t('mission.crtask.assignmentLevel')}</span>
        {#if seEr == true}
          <span class="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-md border border-red-200 dark:border-red-900/50">
            {$t('mission.crtask.missionRequired')}
          </span>
        {/if}
      </div>

      <!-- Segmented pill toggle -->
      <div class="p-1 bg-surface2 dark:bg-zinc-800/90 rounded-xl border border-surfaceLine dark:border-zinc-700 grid grid-cols-2 gap-1 w-full max-w-md mx-auto">
        <button
          type="button"
          onclick={() => (isPersonal = false)}
          class="py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all {isPersonal === false ? 'bg-barbi text-gold shadow-sm font-bold' : 'text-surfaceMuted hover:text-surfaceInk'}"
        >
          {$t('mission.crtask.roles')}
        </button>
        <button
          type="button"
          onclick={() => (isPersonal = true)}
          class="py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all {isPersonal === true ? 'bg-barbi text-gold shadow-sm font-bold' : 'text-surfaceMuted hover:text-surfaceInk'}"
        >
          {$t('mission.crtask.missionInProgress')}
        </button>
      </div>

      <!-- MultiSelect -->
      <div class="task-multiselect-wrap w-full">
        {#if isPersonal == true}
          <MultiSelect
            bind:selected
            maxSelect=1
            placeholder={$t('mission.crtask.chooseMission')}
            options={bmiData.map(
              (it) =>
                it.attributes.users_permissions_user.data.attributes.username +
                ' - ' +
                it.attributes.name +
                ' - ' +
                it.id
            )}
          />
        {:else}
          <MultiSelect
            bind:selected
            placeholder={$t('mission.crtask.chooseRole')}
            options={proles.map((pr) => pr.name)}
          />
        {/if}
      </div>
    </div>
  {/if}

  <div class="pt-2 flex justify-center w-full">
    <Button onClick={sub} {loading} {success} text={$t('mission.crtask.send')} {error} />
  </div>
</div>

<style>
  .task-input {
    width: 100%;
    padding: 0.625rem 1rem;
    border-radius: 0.75rem;
    background-color: var(--surface-2, #f8fafc);
    color: var(--surface-ink, #0f172a);
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.12));
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    outline: none;
  }

  .task-input:focus {
    border-color: var(--barbi-pink, #2563eb);
    box-shadow: 0 0 0 2px rgba(var(--barbi-pink-rgb, 37 99 235), 0.2);
  }

  .task-input::placeholder {
    color: var(--surface-muted, #64748b);
    opacity: 1;
  }

  /* SveltyPicker popup theme variables */
  :global(.svelty-picker-wrap) {
    position: relative;
    width: 100%;
    --sdt-bg-main: var(--surface, #ffffff);
    --sdt-color: var(--surface-ink, #0f172a);
    --sdt-table-bg: transparent;
    --sdt-header-color: var(--surface-ink, #0f172a);
    --sdt-header-btn-bg-hover: var(--surface-2, rgba(0, 0, 0, 0.05));
    --sdt-table-data-bg-hover: var(--surface-2, rgba(0, 0, 0, 0.05));
    --sdt-bg-selected: var(--barbi-pink, #2563eb);
    --sdt-color-selected: #ffffff;
    --sdt-shadow-color: rgba(0, 0, 0, 0.25);
    --sdt-table-today-indicator: var(--barbi-pink, #2563eb);
    --sdt-today-bg: var(--barbi-pink, #2563eb);
    --sdt-today-color: #ffffff;
    --sdt-clear-color: #ef4444;
  }

  :global(.svelty-picker-wrap .std-calendar-wrap) {
    background-color: var(--surface, #ffffff) !important;
    color: var(--surface-ink, #0f172a) !important;
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.15)) !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
  }

  :global(.svelty-picker-wrap .sdt-widget) {
    color: var(--surface-ink, #0f172a) !important;
  }

  /* MultiSelect theme styles */
  :global(.task-multiselect-wrap .svelte-multiselect) {
    background-color: var(--surface-2, #f8fafc) !important;
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.15)) !important;
    border-radius: 0.75rem !important;
    color: var(--surface-ink, #0f172a) !important;
    min-height: 44px !important;
    padding: 4px 10px !important;
    box-shadow: none !important;
  }

  :global(.task-multiselect-wrap .svelte-multiselect:focus-within) {
    border-color: var(--barbi-pink, #2563eb) !important;
    box-shadow: 0 0 0 2px rgba(var(--barbi-pink-rgb, 37 99 235), 0.2) !important;
  }

  :global(.task-multiselect-wrap .svelte-multiselect input) {
    color: var(--surface-ink, #0f172a) !important;
    background: transparent !important;
  }

  :global(.task-multiselect-wrap .svelte-multiselect input::placeholder) {
    color: var(--surface-muted, #64748b) !important;
    opacity: 1 !important;
  }

  :global(.task-multiselect-wrap .svelte-multiselect ul.options) {
    background-color: var(--surface, #ffffff) !important;
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.15)) !important;
    border-radius: 0.75rem !important;
    color: var(--surface-ink, #0f172a) !important;
    box-shadow: var(--shadow-theme, 0 10px 25px -5px rgba(0, 0, 0, 0.25)) !important;
    z-index: 9999 !important;
    max-height: 220px !important;
  }

  :global(.task-multiselect-wrap .svelte-multiselect ul.options li) {
    color: var(--surface-ink, #0f172a) !important;
    padding: 8px 12px !important;
    transition: background-color 0.15s ease;
  }

  :global(.task-multiselect-wrap .svelte-multiselect ul.options li:hover) {
    background-color: var(--surface-2, rgba(0, 0, 0, 0.06)) !important;
  }

  :global(.task-multiselect-wrap .svelte-multiselect ul.options li.selected) {
    background-color: var(--barbi-pink, #2563eb) !important;
    color: var(--gold, #ffffff) !important;
  }

  :global(.task-multiselect-wrap .svelte-multiselect li.selected) {
    background-color: var(--barbi-pink, #2563eb) !important;
    color: var(--gold, #ffffff) !important;
    border-radius: 0.5rem !important;
  }
</style>
