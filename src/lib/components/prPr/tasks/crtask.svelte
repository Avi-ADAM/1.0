<script>
  import { idPr } from '$lib/stores/idPr.js';
  import moment from 'moment';
  import { onMount } from 'svelte';
  let isPersonal = $state(true);
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
  import { t } from '$lib/translations';
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
   * @property {any} userMevatzeaId
   * @property {any} [userMevakeshId]
   * @property {any} mimatai
   * @property {any} adMatai
   * @property {string} [name]
   * @property {string} [teur]
   * @property {any} [selected]
   * @property {string} [link]
   * @property {(payload: { id: any; name: any; user: any; }) => void} [onDone]
   * @property {(payload: { isEdit: boolean; id: any; data: { des: any; shem: any; link: any; dateS: any; dateF: any; }; }) => void} [onAdd]
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
    onDone,
    onAdd
  } = $props();
  function find_tafkidims_id (selected){
    let arr = []
    for(let i = 0; i < selected.length; i++){
      for(let t = 0; t < proles.length; t++){
        if(proles[t].name === selected[i]){
          arr.push(proles[t].id)
        }
      }
    }
    return arr
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
                id: result.data.id,
                name: result.data.attributes.shem,
                user: result.data.attributes.my?.data?.id ?? null
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
  //TODO: validation of dateF after dateS
</script>

<div class="flex flex-col items-center justify-center">
  <h1 class="text-barbi">
    {isEdit == false ? $t('mission.crtask.heading') : $t('mission.crtask.editHeading')}
  </h1>
  <div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="textinput">
    <input name="des" bind:value={name} type="text" class="input" required />
    <label
      style:right={$lang == 'he' ? '0' : 'none'}
      style:left={$lang == 'en' ? '0' : 'none'}
      for="des"
      class="label">{$t('mission.crtask.taskName')}</label
    >
    <span class="line"></span>
  </div>
  {#if neEr == true}
    <small class="text-red-900 bg-slate-200 px-2">{$t('mission.crtask.nameRequired')}</small>
  {/if}
  <br /><span>
    <SveltyPicker
      placeholder={$t('mission.crtask.startDate')}
      inputClasses="form-control"
      format=" hh:ii dd/mm/yyyy"
      bind:value={mimatai}
    ></SveltyPicker>
  </span> <br />
  <SveltyPicker
    placeholder={$t('mission.crtask.endDate')}
    inputClasses="form-control"
    format=" hh:ii dd/mm/yyyy"
    bind:value={adMatai}
  ></SveltyPicker>
  <div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="textinput">
    <input name="des" bind:value={link} type="text" class="input" required />
    <label
      style:right={$lang == 'he' ? '0' : 'none'}
      style:left={$lang == 'en' ? '0' : 'none'}
      for="des"
      class="label">{$t('mission.crtask.relevantLink')}</label
    >
    <span class="line"></span>
  </div>
  <div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="textinput">
    <textarea name="es" bind:value={teur} type="text" class="input d" required
    ></textarea>
    <label
      style:right={$lang == 'he' ? '0' : 'none'}
      style:left={$lang == 'en' ? '0' : 'none'}
      for="es"
      class="label">{$t('mission.crtask.taskDescription')}</label
    >
    <span class="line"></span>
  </div>

  <div class="flex flex-col items-center gap-3 my-4 p-4 bg-slate-50/50 rounded-xl w-full max-w-md border border-slate-100 shadow-sm">
    <span class="text-sm font-semibold text-barbi">{$t('mission.crtask.urgencyLevel')}</span>
    <div class="flex gap-5">
      {#each urgencyOptions as option}
        <button
          type="button"
          onclick={() => hashivut = option.value}
          class="group relative flex flex-col items-center gap-1 transition-all duration-300 transform active:scale-95"
          title={option.label}
        >
          <div 
            class="w-10 h-10 rounded-xl border-2 shadow-lg transition-all duration-300 {option.color} 
            {hashivut === option.value ? 'border-barbi scale-110 ring-4 ring-barbi/20 shadow-barbi/20' : 'border-slate-200 opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 hover:scale-105'}
            {option.value === 'white' ? 'border-slate-300' : ''}"
          ></div>
          <span class="text-[10px] font-medium transition-colors {hashivut === option.value ? 'text-barbi font-bold' : 'text-slate-500'}">
            {option.label}
          </span>
          
          {#if hashivut === option.value}
            <div class="absolute -top-1 -right-1 w-4 h-4 bg-barbi text-white rounded-full flex items-center justify-center text-[8px] animate-bounce shadow-md">
              ✓
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  {#if fromMis != true}
    <h2 class="text-barbi text-center text-sm sm:text-xl">:{$t('mission.crtask.assignmentLevel')}</h2>

    <div class="flex items-center justify-center" dir="ltr">
      <label
        for="Toggle3"
        class="inline-flex items-center p-2 rounded-md cursor-pointer text-gray-800"
      >
        <input
          id="Toggle3"
          type="checkbox"
          class="hidden peer"
          bind:checked={isPersonal}
        />
        <span
          class="px-4 py-2 rounded-l-md text-barbi peer-checked:text-gray-900 bg-mturk peer-checked:bg-gold"
          >{$t('mission.crtask.roles')}</span
        >
        <span
          class="px-4 py-2 rounded-r-md peer-checked:text-barbi bg-gold peer-checked:bg-mturk"
          >{$t('mission.crtask.missionInProgress')}</span
        >
      </label>
    </div>
    {#if isPersonal == true}
      <MultiSelect
      outerDivClass="!bg-gold !text-barbi"
      inputClass="!bg-gold !text-barbi"
      liSelectedClass="!bg-barbi !text-gold"
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
      outerDivClass="!bg-gold !text-barbi"
      inputClass="!bg-gold !text-barbi"
      liSelectedClass="!bg-barbi !text-gold"
        bind:selected
        placeholder={$t('mission.crtask.chooseRole')}
        options={proles.map((pr) => pr.name)}
      />
    {/if}
  {/if}
  {#if seEr == true}
    <small class="text-red-900 bg-slate-200 px-2">{$t('mission.crtask.missionRequired')}</small>
  {/if}
  <hr class="h-2" />
  <Button onClick={sub} {loading} {success} text={{ he: $t('mission.crtask.send'), en: $t('mission.crtask.send'), ar: $t('mission.crtask.send') }} {error} />
</div>

