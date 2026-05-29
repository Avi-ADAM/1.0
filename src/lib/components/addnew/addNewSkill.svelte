<script>
  import Addnewro from './addNewRoleToSkill.svelte';
  import MultiSelect from 'svelte-multiselect';
  import { onMount } from 'svelte';
  import { sanitizeUserInput } from '$lib/func/uti/sanitizeUserInput.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { liUN } from '$lib/stores/liUN.js';
  import {
    checkDuplicate,
    validateAndCreateVocabItem
  } from '$lib/embed/vocab-creation';

  // ─── Props ────────────────────────────────────────────────────────────────────

  /** @type {$props} */
  let {
    roles1 = $bindable([]),
    mid = -1,
    rn = [],
    addS = $bindable(false),
    color = '--gold',
    onAddnewskill,
    onB
  } = $props();

  export const nobr = true;

  // ─── State ────────────────────────────────────────────────────────────────────

  let selected = $state([]);
  let id;
  let tafkidimslist = [];
  let skillName_value = $state('');
  let desS = $state('');
  let meData;
  let error1 = null;
  let addro = $state(false);

  // מצב בדיקת כפילות
  let dupStatus = $state('idle'); // 'idle' | 'checking' | 'found' | 'similar'
  let dupMatch = $state(null); // { id, label, similarity }
  let dupOverride = $state(false); // המשתמש בחר להתעלם מ-similar

  // מצב שמירה
  let saving = $state(false);
  let saveError = $state('');

  // ─── i18n ─────────────────────────────────────────────────────────────────────

  const placeholder = $derived(
    $lang === 'he' ? 'תפקידים קשורים' : 'Related Roles'
  );
  const cencel = { he: 'ביטול', en: 'Cancel' };
  const adds = { he: 'הוספת כישור חדש', en: 'Add new Skill' };
  const nom = {
    he: 'לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור "הוספת תפקיד חדש" שלמטה',
    en: 'Not on the list yet, add it with the "Add new role" button below'
  };
  const addn = { he: 'הוספת תפקיד חדש', en: 'Add new Role' };
  const valn = { he: 'שם הכישור', en: 'Skill name' };
  const des = { he: 'תיאור קצר', en: 'Skill short description' };
  const btnTitles = { he: 'הוספה', en: 'Add' };

  const dupMsg = {
    he: {
      found: 'כישור זהה כבר קיים:',
      similar: 'דומה מאוד לכישור קיים:',
      override: 'הוסף בכל זאת'
    },
    en: {
      found: 'An identical skill already exists:',
      similar: 'Very similar to an existing skill:',
      override: 'Add anyway'
    }
  };

  // ─── onMount: טעינת תפקידים ───────────────────────────────────────────────────

  const baseUrl = import.meta.env.VITE_URL;

  onMount(async () => {
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) return resp;
      return parseJSON(resp).then((r) => {
        throw r;
      });
    };

    try {
      const res = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query {
            tafkidims { data { id attributes {
              roleDescription
              ${$lang === 'he' ? 'localizations { data { attributes { roleDescription } } }' : ''}
            }}}
          }`
        })
      })
        .then(checkStatus)
        .then(parseJSON);

      roles1 = res.data.tafkidims.data;

      if ($lang === 'he') {
        for (let i = 0; i < roles1.length; i++) {
          if (roles1[i].attributes.localizations?.data?.length > 0) {
            roles1[i].attributes.roleDescription =
              roles1[
                i
              ].attributes.localizations.data[0].attributes.roleDescription;
          }
        }
      }

      roles1 = roles1;
    } catch (e) {
      error1 = e;
    }
  });

  // ─── בדיקת כפילות — debounced בזמן הקלדה ─────────────────────────────────────

  let debounceTimer;

  async function onSkillNameInput() {
    clearTimeout(debounceTimer);
    dupMatch = null;
    dupStatus = 'idle';
    dupOverride = false;

    if (!skillName_value || skillName_value.trim().length < 2) return;

    debounceTimer = setTimeout(async () => {
      dupStatus = 'checking';
      try {
        const result = await checkDuplicate(skillName_value.trim(), 'skills');
        console.log(result);
        if (result.isDuplicate) {
          dupMatch = result.match;
          dupStatus = result.match.similarity >= 0.92 ? 'found' : 'similar';
        } else {
          dupStatus = 'idle';
        }
      } catch {
        dupStatus = 'idle'; // שגיאה בבדיקה — נותנים להמשיך
      }
    }, 500);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function find_role_id(role_name_arr) {
    const arr = [];
    for (let j = 0; j < role_name_arr.length; j++) {
      for (let i = 0; i < roles1.length; i++) {
        if (roles1[i].attributes.roleDescription === role_name_arr[j]) {
          arr.push(roles1[i].id);
        }
      }
    }
    return arr;
  }

  function dispatchskillid(meData, id) {
    onAddnewskill?.({ id, mid, skob: meData.data.createSkill.data });
  }

  function dispatchb() {
    addS = false;
    onB?.();
  }

  function finnish(event) {
    const newValues = tafkidimslist;
    newValues.push(event.skob);
    tafkidimslist = newValues;

    const newSele = selected;
    selected.push(event.name);
    selected = newSele;

    addro = event.addro;
  }

  // ─── יצירת כישור — עם validateAndCreateVocabItem ─────────────────────────────

  async function addNewSkill() {
    saveError = '';

    // בדיקת שם כפול מקומי (הרשימה הישנה)
    if (rn.includes(skillName_value)) {
      saveError = $lang === 'he' ? 'השם כבר קיים' : 'Name already exists';
      return;
    }

    // חסום אם כפילות מדויקת ולא אושר override
    if (dupStatus === 'found') return;
    if (dupStatus === 'similar' && !dupOverride) return;

    saving = true;
    tafkidimslist = find_role_id(selected);

    const result = await validateAndCreateVocabItem(
      skillName_value.trim(),
      'skills',

      // strapiCreateFn — יוצר ב-Strapi + מפעיל תרגום אוטומטי
      async (label) => {
        const d = new Date();

        // 1. צור את הכישור ב-Strapi
        const gqlRes = await fetch(baseUrl + '/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation {
              createSkill(data: {
                skillName: "${sanitizeUserInput(label)}",
                descrip: "${sanitizeUserInput(desS)}",
                tafkidims: [${tafkidimslist}],
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

        meData = gqlRes;
        id = meData.data.createSkill.data.id;

        // 2. הפעל תרגום אוטומטי (הפונקציה הקיימת שלך)
        fetch('/api/auto-localize/strapi4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'skills',
            entryId: id,
            sourceLocale: $lang
          })
        }).catch((e) => console.warn('תרגום אוטומטי נכשל:', e));
        // fire-and-forget — לא מחכים, לא חוסמים

        // 3. לוג פעולה
        fetch('/api/ste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: $liUN,
            action: 'יצר כישור חדש בשם:',
            det: `${label} והתיאור: ${desS} והתפקידים: ${tafkidimslist.join(', ')}`
          })
        }).catch((e) => console.warn('לוג נכשל:', e));

        // החזר בפורמט שמצפה לו validateAndCreateVocabItem
        return { id: String(id), label, translations: {} };
      }
    );

    saving = false;

    if (result.success) {
      dispatchskillid(meData, id);
      addS = false;
      skillName_value = '';
      desS = '';
      selected = [];
      dupMatch = null;
      dupStatus = 'idle';
    } else if (result.reason === 'duplicate') {
      // כפילות שנתפסה ברגע השמירה (race condition נדיר)
      dupMatch = result.match;
      dupStatus = result.match.similarity >= 0.92 ? 'found' : 'similar';
    } else {
      saveError = result.message;
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const canSubmit = $derived(
    skillName_value?.trim().length > 0 &&
      dupStatus !== 'found' &&
      !(dupStatus === 'similar' && !dupOverride) &&
      dupStatus !== 'checking' &&
      !saving
  );

  const pct = (sim) => `${Math.round(sim * 100)}%`;
</script>

<div
  class="p-4"
  style="--the:{`var(${color})`};"
  dir={$lang === 'en' ? 'ltr' : 'rtl'}
>
  {#if addS === false}
    <button
      style="--the:{color};"
      class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-0.5 px-4 rounded-full"
      onclick={() => (addS = true)}>{adds[$lang]}</button
    >
  {:else}
    <div class="bg-barbi bg-opacity-10 p-4">
      <!-- כפתור ביטול -->
      <button
        title={cencel[$lang]}
        onclick={dispatchb}
        class="hover:bg-barbi text-gold hover:text-lturk font-bold py-1 px-1 rounded-full text-center"
      >
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
          />
        </svg>
      </button>

      <h1 style="font-size: 1rem; line-height: normal; color: var({color});">
        {adds[$lang]}
      </h1>

      <!-- שם כישור + בדיקת כפילות -->
      <div dir={$lang === 'en' ? 'ltr' : 'rtl'} class="textinput">
        <input
          bind:value={skillName_value}
          oninput={onSkillNameInput}
          type="text"
          class="input"
          required
        />
        <label
          style:right={$lang === 'he' ? '0' : 'none'}
          style:left={$lang === 'en' ? '0' : 'none'}
          for="name"
          class="label"
        >
          {valn[$lang]}
          {#if dupStatus === 'checking'}
            <span class="checking-dot">…</span>
          {/if}
        </label>
        <span class="line"></span>
      </div>

      <!-- כפילות מדויקת — חסום -->
      {#if dupStatus === 'found' && dupMatch}
        <div class="dup-banner dup-exact">
          <span>{dupMsg[$lang].found}</span>
          <strong>"{dupMatch.label}"</strong>
          <small>({pct(dupMatch.similarity)})</small>
        </div>
      {/if}

      <!-- דמיון גבוה — אזהרה עם אפשרות override -->
      {#if dupStatus === 'similar' && dupMatch && !dupOverride}
        <div class="dup-banner dup-similar">
          <span>{dupMsg[$lang].similar}</span>
          <strong>"{dupMatch.label}"</strong>
          <small>({pct(dupMatch.similarity)})</small>
          <button class="override-btn" onclick={() => (dupOverride = true)}>
            {dupMsg[$lang].override}
          </button>
        </div>
      {/if}

      <!-- שגיאת שמירה -->
      {#if saveError}
        <small class="text-red-600">{saveError}</small>
      {/if}

      <!-- תיאור -->
      <div dir={$lang === 'en' ? 'ltr' : 'rtl'} class="textinput">
        <input bind:value={desS} type="text" class="input" required />
        <label
          style:right={$lang === 'he' ? '0' : 'none'}
          style:left={$lang === 'en' ? '0' : 'none'}
          for="des"
          class="label">{des[$lang]}</label
        >
        <span class="line"></span>
      </div>

      <br />

      <!-- MultiSelect תפקידים -->
      <div dir={$lang === 'en' ? 'ltr' : 'rtl'}>
        <MultiSelect
          outerDivClass="!bg-gold !text-barbi"
          inputClass="!bg-gold !text-barbi"
          liSelectedClass="!bg-barbi !text-gold"
          --sms-max-width="60vw"
          bind:selected
          {placeholder}
          noMatchingOptionsMsg={nom[$lang]}
          options={roles1.map((c) => c.attributes.roleDescription)}
        />
      </div>

      <br />

      <div>
        {#if addro === false}
          <button
            onclick={() => (addro = true)}
            class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold px-1 rounded-full"
            >{addn[$lang]}</button
          >

          <br /><br />

          <!-- כפתור שמירה -->
          <div class="grid align-middle justify-center">
            <button
              onclick={addNewSkill}
              title={btnTitles[$lang]}
              disabled={!canSubmit}
              class="hover:bg-barbi hover:text-mturk text-gold font-bold py-1 px-2 rounded-full disabled:opacity-40"
            >
              {#if saving}
                <svg
                  style="width:24px;height:24px;animation:spin 0.8s linear infinite"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
                  />
                </svg>
              {:else}
                <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z"
                  />
                </svg>
              {/if}
            </button>
          </div>
        {:else}
          <br />
          <button
            title={cencel[$lang]}
            onclick={() => (addro = false)}
            class="hover:bg-barbi hover:text-mturk font-bold p-1 rounded-full"
            class:text-mturk={nobr === true}
            class:text-gold={nobr === false}
          >
            <svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg>
          </button>
          <Addnewro
            {color}
            rn={roles1.map((c) => c.roleDescription)}
            onFinnish={finnish}
          />
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .textinput {
    position: relative;
    width: 80%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--gold);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--the, var(--gold));
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  .label {
    font-size: 15px;
    position: absolute;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--the, var(--gold));
    user-select: none;
  }

  .checking-dot {
    font-size: 11px;
    opacity: 0.6;
    margin-inline-start: 4px;
  }

  .line {
    height: 2px;
    background-color: #2196f3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line {
    width: 100%;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 11px;
    color: #2196f3;
    top: 0;
  }

  .dup-banner {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 6px;
  }

  .dup-exact {
    background: rgba(192, 57, 43, 0.12);
    color: #c0392b;
  }

  .dup-similar {
    background: rgba(186, 117, 23, 0.12);
    color: #7a4f00;
  }

  .override-btn {
    background: none;
    border: 1px solid currentColor;
    border-radius: 4px;
    padding: 1px 8px;
    font-size: 12px;
    cursor: pointer;
    margin-inline-start: auto;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 600px) {
    .textinput {
      width: 100%;
    }
  }
</style>
