<script>
  import { role, ww, skil } from '$lib/components/prPr/mi.js';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { lang } from '$lib/stores/lang';
  import { t, isRtl} from '$lib/translations';
  import Text from '../conf/text.svelte';
  import SkillSelector from '../ui/SkillSelector.svelte';
  import RoleSelector from '../ui/RoleSelector.svelte';
  import WorkwaySelector from '../ui/WorkwaySelector.svelte';
  import Number from '../conf/number.svelte';
  import DateNego from '../conf/dateNego.svelte';
  import Barb from '../conf/barb.svelte';
  import moment from 'moment';
  import { toast } from 'svelte-sonner';
  import Rich from '../conf/rich.svelte';
  import ActsNego from '../conf/actsNego.svelte';
  import LocationNego from '../conf/locationNego.svelte';
  import { submitNegoMission } from '$lib/client/actionClient';
  import { updatePendsStore } from '$lib/utils/levSocketHandler';
  import { toIsoDateString } from '$lib/func/montsi.svelte';
  import { fetchBridgeResolution, openNegoBridge, readNegoBridgeReturn } from '$lib/func/negoBridge.js';
  /**
   * @typedef {Object} Props
   * @property {any} [negopendmissions]
   * @property {any} descrip
   * @property {any} projectName
   * @property {any} name1
   * @property {any} hearotMeyuchadot
   * @property {number} [noofhours]
   * @property {number} [perhour]
   * @property {any} projectId
   * @property {any} [uids]
   * @property {any} [what]
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} noofusersWaiting
   * @property {number} [total]
   * @property {any} noofusers
   * @property {any} already
   * @property {any} mypos
   * @property {any} missionId
   * @property {any} skills
   * @property {any} tafkidims
   * @property {any} workways
   * @property {any} vallues
   * @property {any} publicklinks
   * @property {string} [privatlinks]
   * @property {any} mdate
   * @property {any} mdates
   * @property {number} [stepState]
   * @property {any} pendId
   * @property {any} [users]
   * @property {any} isKavua
   * @property {number} [oldide] - last tg id, if non 0
   * @property {any} timegramaId
   * @property {number} [ordern]
   * @property {boolean} [masaalr]
   * @property {any} restime
   * @property {any} [acts]
   * @property {any} [location]
   * @property {Function} [onClose]
   * @property {Function} [onLoad]
   * @property {number} [isAsk]
   */

  /** @type {Props} */
  let {
    negopendmissions = [],
    descrip,
    projectName,
    name1,
    hearotMeyuchadot,
    noofhours = 0,
    perhour = 0,
    projectId,
    uids = [],
    what = [],
    noofusersOk,
    noofusersNo,
    noofusersWaiting,
    total = 0,
    noofusers,
    already,
    mypos,
    missionId,
    skills,
    tafkidims,
    workways,
    vallues,
    publicklinks,
    privatlinks = 'aaxa',
    mdate,
    mdates,
    stepState = 2,
    pendId,
    users = [],
    isKavua,
    oldide = 0,
    timegramaId,
    ordern = 0,
    masaalr = false,
    restime,
    acts = [],
    location = null,
    onClose,
    onLoad,
    isAsk = 0,
    /**
     * Optional: when provided, hands the diff to the parent instead of calling
     * submitNegoMission. Used by the open-mission candidate/counter flow where
     * the terms become a parallel Negopendmission round. Receives { newValues, originalValues }.
     * @type {((d: { newValues: any, originalValues: any }) => Promise<void>) | null}
     */
    onSubmit = null,
    /**
     * The latest candidate-side negotiation round attributes (proposedBy=candidate).
     * Shown alongside fields as a reference when counter-proposing on a candidate's
     * open-mission application so members know what they are responding to.
     * @type {any | null}
     */
    candidateRound = null
  } = $props();
  $inspect(acts);
  let datai = $state([]);

  $effect(() => {
    const items = [
      {
        leb: `${$t('nego.new')},${noofhours2 * perhour2}`,
        value: noofhours2 * perhour2
      },
      {
        leb: `${$t('nego.original')},${noofhours * perhour}`,
        value: noofhours * perhour
      }
    ];
    if (negopendmissions.length > 0) {
      for (let i = 0; i < negopendmissions.length; i++) {
        if (
          negopendmissions[i].attributes.perhour != null ||
          negopendmissions[i].attributes.noofhours != null
        ) {
          items.push({
            leb: `${$t('nego.oldno')}-${i + 1}, ${(negopendmissions[i].attributes.noofhours ?? noofhours) * (negopendmissions[i].attributes.perhour ?? perhour)}`,
            value:
              (negopendmissions[i].attributes.noofhours ?? noofhours) *
              (negopendmissions[i].attributes.perhour ?? perhour)
          });
        }
      }
    }
    datai = items;
  });
  console.log(negopendmissions);
  let isKavua2 = $state();

  let error1;
  let descrip2 = $state(descrip);
  let name2 = $state(name1);
  let mdate2 = $state(mdate);
  let mdates2 = $state(mdates);

  let hearotMeyuchadot2 = hearotMeyuchadot;
  let privatlinks2 = $state(privatlinks);
  let noofhours2 = $state(noofhours);
  let perhour2 = $state(perhour);
  let myM;
  let done;

  // Unified vocab selection — name arrays bound to the VocabSelector wrappers.
  // Seeded (in onMount) from the mission's current relations and resolved back
  // to ids at submit time, the same flow used in userPr/edit.svelte.
  let selectedSkills = $state([]);
  let selectedRoles = $state([]);
  let selectedWorkways = $state([]);
  let acts2 = $state(
    acts?.data && Array.isArray(acts.data) ? [...acts.data] : []
  );
  let location2 = $state(
    location
      ? { ...location }
      : {
          location_mode: 'unspecified',
          isOnline: false,
          lat: null,
          lng: null,
          radius: 15,
          location_hint: ''
        }
  );

  function locationChanged() {
    const a = location;
    const b = location2;
    if (a == null) {
      return (
        (b?.location_mode ?? 'unspecified') !== 'unspecified' ||
        b?.lat != null ||
        b?.lng != null ||
        Boolean(b?.location_hint?.trim())
      );
    }
    return (
      (a.location_mode ?? 'unspecified') !== (b?.location_mode ?? 'unspecified') ||
      (a.lat ?? null) !== (b?.lat ?? null) ||
      (a.lng ?? null) !== (b?.lng ?? null) ||
      (a.radius ?? null) !== (b?.radius ?? null) ||
      (a.location_hint ?? '') !== (b?.location_hint ?? '')
    );
  }


  function arraysEqual(a1, a2) {
    return JSON.stringify(a1) == JSON.stringify(a2);
  }

  /** Localized display name for a catalog/relation entry (he localization first). */
  function vname(item, nameField) {
    let name = item?.attributes?.[nameField] || '';
    if ($lang === 'he' && item?.attributes?.localizations?.data?.length > 0) {
      name = item.attributes.localizations.data[0].attributes[nameField];
    }
    return name;
  }

  // Seed selected names from the mission's current relations, preferring the
  // catalog entry (which always carries localizations) so the labels match the
  // dropdown options — otherwise re-picking a Hebrew item wouldn't resolve.
  function seedNames(items, catalog, nameField) {
    return (items ?? [])
      .map((it) => {
        const hit = catalog.find((c) => String(c.id) === String(it.id));
        return vname(hit ?? it, nameField);
      })
      .filter(Boolean);
  }

  // Resolve display names back to catalog ids (matches master name OR he
  // localization) — the inverse of the seeding above. Includes the original
  // relation objects in the source so existing items never drop while a newly
  // created one is still propagating into the store.
  function findIds(names, catalog, originals, nameField) {
    const source = [...catalog, ...(originals ?? [])];
    const ids = [];
    for (const searchName of names) {
      for (const item of source) {
        if (!item.attributes) continue;
        const name = item.attributes[nameField];
        let heName = name;
        if (item.attributes.localizations?.data?.length > 0) {
          heName = item.attributes.localizations.data[0].attributes[nameField];
        }
        if (name === searchName || heName === searchName) {
          ids.push(String(item.id));
          break;
        }
      }
    }
    return ids;
  }

  function close() {
    onClose?.();
  }

  // ── Consensus bridge ──────────────────────────────────────────────────────
  // Open a structured mediation discussion in the consensus app, seeded with the
  // mission's negotiable terms (original vs. current proposal). See negoBridge.js.
  function openBridge() {
    openNegoBridge({
      sourceType: 'mission',
      sourceId: pendId,
      title: name1,
      projectName,
      fields: [
        { key: 'name', label: 'שם', kind: 'text', original: name1 ?? null, proposed: name2 ?? null },
        { key: 'descrip', label: 'תיאור', kind: 'text', original: descrip ?? null, proposed: descrip2 ?? null },
        { key: 'noofhours', label: 'כמות שעות', kind: 'number', original: noofhours || 0, proposed: noofhours2 || 0 },
        { key: 'perhour', label: 'שווי לשעה', kind: 'number', original: perhour || 0, proposed: perhour2 || 0 },
        { key: 'startDate', label: 'תאריך התחלה', kind: 'date', original: toIsoDateString(mdate) ?? null, proposed: toIsoDateString(mdate2) ?? null },
        { key: 'finishDate', label: 'תאריך סיום', kind: 'date', original: toIsoDateString(mdates) ?? null, proposed: toIsoDateString(mdates2) ?? null }
      ]
    });
  }

  // Prefill from a returned bridge agreement. Dates come back as ISO strings;
  // convert them to the picker's display format so submit (which re-parses with
  // 'HH:mm DD/MM/YYYY') round-trips correctly.
  function applyBridgeValues(v) {
    if (v.name != null) name2 = String(v.name);
    if (v.descrip != null) descrip2 = String(v.descrip);
    if (v.noofhours != null) noofhours2 = +v.noofhours;
    if (v.perhour != null) perhour2 = +v.perhour;
    if (v.startDate != null) {
      const m = moment(v.startDate);
      if (m.isValid()) mdate2 = m.format('HH:mm DD/MM/YYYY');
    }
    if (v.finishDate != null) {
      const m = moment(v.finishDate);
      if (m.isValid()) mdates2 = m.format('HH:mm DD/MM/YYYY');
    }
  }

  // The way back from the bridge, two channels with the same shape:
  //  1. `negoBridge` URL param — instant, but only for whoever clicked the link.
  //  2. The resolution signed in the discussion and persisted on the server —
  //     visible to every member who opens the card.
  // Either way the values only prefill the editable side; the user still
  // submits and the proposal passes the regular vote round.
  async function applyBridgeReturn() {
    const fromUrl = readNegoBridgeReturn(pendId);
    if (fromUrl) {
      applyBridgeValues(fromUrl);
      return;
    }
    const found = await fetchBridgeResolution('mission', pendId);
    if (found?.resolution?.values) applyBridgeValues(found.resolution.values);
  }

  function hasActsChanged() {
    const actsArray = acts?.data && Array.isArray(acts.data) ? acts.data : [];
    const acts2Array = Array.isArray(acts2) ? acts2 : [];

    if (actsArray.length === 0 && acts2Array.length === 0) return false;
    if (actsArray.length !== acts2Array.length) return true;

    return actsArray.some((originalAct, index) => {
      const negotiatedAct = acts2Array[index];
      if (!negotiatedAct) return true;

      const orig = originalAct.attributes;
      const nego = negotiatedAct.attributes;

      return (
        orig.shem !== nego.shem ||
        orig.link !== nego.link ||
        orig.des !== nego.des ||
        orig.dateF !== nego.dateF ||
        orig.dateS !== nego.dateS
      );
    });
  }

  async function increment() {
    onLoad?.();

    // Detect what changed and build newValues / originalValues
    const newValues = {};
    const originalValues = {};
    let hasChanges = false;

    if (isKavua !== isKavua2) {
      newValues.iskvua = isKavua2 ?? false;
      originalValues.isMonth = isKavua ?? false;
      hasChanges = true;
    }
    if (mdates !== mdates2) {
      const momebtt = moment(mdates2, 'HH:mm DD/MM/YYYY ');
      newValues.dates = mdates2 != null ? momebtt.toISOString() : null;
      originalValues.dates = mdates ?? null;
      hasChanges = true;
    }
    if (mdate !== mdate2) {
      const momebtt = moment(mdate2, 'HH:mm DD/MM/YYYY ');
      newValues.sqadualed = mdate2 != null ? momebtt.toISOString() : null;
      originalValues.date = mdate ?? null;
      hasChanges = true;
    }
    if (name1 !== name2) {
      newValues.name = name2;
      originalValues.name = name1;
      hasChanges = true;
    }
    if (descrip !== descrip2) {
      newValues.descrip = descrip2;
      originalValues.descrip = descrip;
      hasChanges = true;
    }
    if (hearotMeyuchadot !== hearotMeyuchadot2) {
      newValues.hearotMeyuchadot = hearotMeyuchadot2;
      originalValues.hearotMeyuchadot = hearotMeyuchadot;
      hasChanges = true;
    }
    if (noofhours !== noofhours2) {
      newValues.noofhours = noofhours2;
      originalValues.noofhours = noofhours;
      hasChanges = true;
    }
    if (perhour !== perhour2) {
      newValues.perhour = perhour2;
      originalValues.perhour = perhour;
      hasChanges = true;
    }

    const skillsId = (skills?.data ?? []).map((c) => String(c.id));
    const skills2Id = findIds(selectedSkills, $skil, skills?.data, 'skillName');
    if (!arraysEqual(skillsId, skills2Id)) {
      newValues.skillIds = skills2Id;
      originalValues.skillIds = skillsId;
      hasChanges = true;
    }
    const roId = (tafkidims?.data ?? []).map((c) => String(c.id));
    const ro2Id = findIds(selectedRoles, $role, tafkidims?.data, 'roleDescription');
    if (!arraysEqual(roId, ro2Id)) {
      newValues.roleIds = ro2Id;
      originalValues.roleIds = roId;
      hasChanges = true;
    }
    const wwId = (workways?.data ?? []).map((c) => String(c.id));
    const ww2Id = findIds(selectedWorkways, $ww, workways?.data, 'workWayName');
    if (!arraysEqual(wwId, ww2Id)) {
      newValues.workwayIds = ww2Id;
      originalValues.workwayIds = wwId;
      hasChanges = true;
    }

    if (locationChanged()) {
      newValues.location = {
        location_mode: location2?.location_mode ?? 'unspecified',
        isOnline: location2?.location_mode === 'online',
        lat: location2?.lat ?? null,
        lng: location2?.lng ?? null,
        radius: location2?.radius ?? null,
        location_hint: location2?.location_hint ?? null
      };
      originalValues.location = location ?? null;
      hasChanges = true;
    }

    const actsChanged = hasActsChanged();
    if (actsChanged) hasChanges = true;

    // Guard: skip if nothing changed and user already voted (masaalr + mypos)
    if (!hasChanges && masaalr && mypos) return;

    // Parent-handled flow (open-mission candidate/counter): hand the diff to the parent.
    if (onSubmit) {
      try {
        await onSubmit({ newValues, originalValues });
        toast.success($t('toasts.suc'));
        close();
      } catch (e) {
        error1 = e;
        console.log(error1);
        toast.warning($t('toasts.er'));
      }
      return;
    }

    // Build acts data for server
    const acts2Array = Array.isArray(acts2) ? acts2 : [];
    const newActs = acts2Array
      .filter((a) => a.id?.startsWith('temp_'))
      .map((a) => ({
        shem: a.attributes.shem,
        des: a.attributes.des ?? null,
        link: a.attributes.link ?? null,
        dateS: a.attributes.dateS ? a.attributes.dateS + ':00.000Z' : null,
        dateF: a.attributes.dateF ? a.attributes.dateF + ':00.000Z' : null,
      }));
    const existingActsIds = acts2Array
      .filter((a) => a.id && !a.id.startsWith('temp_'))
      .map((a) => a.id);
    const snapshotActIds = (acts?.data ?? []).map((a) => a.id);

    try {
      const result = await submitNegoMission({
        pendId: String(pendId),
        projectId: String(projectId),
        timegramaId: String(timegramaId),
        isAsk: isAsk ?? 0,
        restime,
        isOriginal: stepState === 2,
        ordern: ordern ?? 0,
        newValues,
        originalValues,
        newActs,
        existingActsIds,
        snapshotActIds,
        actsChanged,
        users: users ?? [],
      });

      if (result.success) {
        // Pendm negotiation: update the card in place (changed fields + new
        // vote round) so the user sees the new terms without a full refresh
        // that would reset their scroll/swiper position.
        if ((isAsk ?? 0) === 0 && result.data?.id) {
          updatePendsStore(result.data);
        }
        toast.success($t('toasts.suc'));
        close();
      } else {
        toast.warning($t('toasts.er'));
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
      toast.warning($t('toasts.er'));
    }
  }
  onMount(() => {
    applyBridgeReturn();
    isKavua2 = isKavua;
    // Seed the selectors from the mission's current relations. The shared vocab
    // stores (mi.js) are seeded synchronously from static JSON at import, so the
    // localized labels are available here; the VocabSelector refreshes the
    // catalog through the proxy on its own mount.
    selectedSkills = seedNames(skills?.data, get(skil), 'skillName');
    selectedRoles = seedNames(tafkidims?.data, get(role), 'roleDescription');
    selectedWorkways = seedNames(workways?.data, get(ww), 'workWayName');
  });
</script>

<div class="text-barbi" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h1 class="md:text-center text-2xl md:text-2xl font-bold underline">
    {onSubmit ? $t('nego.headMissionCandidate') : $t('nego.head')}:
    {name1}
  </h1>
  <div class="flex flex-col align-middle justify-center">
    <Text
      text={name1}
      bind:textb={name2}
      lebel={$t('common.name')}
      old={negopendmissions.map((c) => c?.attributes?.name)}
    />
    <Rich
      old={negopendmissions.map((c) => c?.attributes?.descrip)}
      text={descrip}
      bind:textb={descrip2}
      lebel={$t('common.description')}
    />
    <div class="m-2">
      <h3 class="text-center text-sm text-barbi underline decoration-mturk">
        {$t('mission.requireSkills')}
      </h3>
      <SkillSelector
        bind:selectedSkills
        placeholder={$t('mission.addNewSkills')}
        autoCreate={true}
      />
    </div>
    <div class="m-2">
      <h3 class="text-center text-sm text-barbi underline decoration-mturk">
        {$t('mission.requiredRoles')}
      </h3>
      <RoleSelector
        bind:selectedRoles
        placeholder={$t('mission.addNewRoles')}
        autoCreate={true}
      />
    </div>
    <div class="m-2">
      <h3 class="text-center text-sm text-barbi underline decoration-mturk">
        {$t('mission.requiredWW')}
      </h3>
      <WorkwaySelector
        bind:selectedWorkways
        placeholder={$t('mission.addNewww')}
        autoCreate={true}
      />
    </div>
    <!----<Text long={true} text={hearotMeyuchadot} bind:textb={hearotMeyuchadot2} lebel={$t('mission.specialNotes')}/>
            --><Text
      text={privatlinks}
      bind:textb={privatlinks2}
      lebel={$t('mission.linkToMission')}
    />
    {#if onSubmit && candidateRound}
      {@const candTot = (candidateRound.noofhours ?? noofhours) * (candidateRound.perhour ?? perhour)}
      <div class="mx-2 my-2 rounded-lg border border-barbi/50 bg-barbi/5 p-3 text-sm space-y-1">
        <p class="font-bold text-barbi text-base">
          💡 {$t('nego.cand.proposalRef')}
        </p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-barbi/80">
          {#if candidateRound.noofhours != null}
            <span>{$t('nego.cand.hours')} <strong>{candidateRound.noofhours}</strong></span>
          {/if}
          {#if candidateRound.perhour != null}
            <span>{$t('nego.cand.perHour')} <strong>{candidateRound.perhour}</strong></span>
          {/if}
          {#if candTot > 0}
            <span class="font-bold">{$t('nego.cand.total')} <strong>{candTot.toLocaleString()}</strong></span>
          {/if}
          {#if candidateRound.mdate}
            <span>{$t('nego.cand.start')} <strong>{new Date(candidateRound.mdate).toLocaleDateString($lang)}</strong></span>
          {/if}
          {#if candidateRound.mdates}
            <span>{$t('nego.cand.end')} <strong>{new Date(candidateRound.mdates).toLocaleDateString($lang)}</strong></span>
          {/if}
        </div>
      </div>
    {/if}
    <Number
      old={negopendmissions.map((c) => c?.attributes?.noofhours)}
      number={noofhours}
      bind:numberb={noofhours2}
      lebel={`${$t('mission.noOfHours')} ${isKavua == true && isKavua2 == true ? $t('mission.perMonth') : ''}`}
      splebel={isKavua == true && isKavua2 == true
        ? null
        : isKavua == true && isKavua2 == false
          ? false
          : isKavua == false && isKavua2 == true
            ? true
            : null}
    />
    {#if onSubmit && candidateRound?.noofhours != null && candidateRound.noofhours !== noofhours}
      <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} <strong>{candidateRound.noofhours}</strong></p>
    {/if}
    <Number
      old={negopendmissions.map((c) => c?.attributes?.perhour)}
      number={perhour}
      bind:numberb={perhour2}
      lebel={$t('mission.hourlyVallue')}
    />
    {#if onSubmit && candidateRound?.perhour != null && candidateRound.perhour !== perhour}
      <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} <strong>{candidateRound.perhour}</strong></p>
    {/if}
    <DateNego date={mdate} bind:dateb={mdate2} lebel={$t('common.startDate')} />
    {#if onSubmit && candidateRound?.mdate}
      <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} {new Date(candidateRound.mdate).toLocaleDateString($lang)}</p>
    {/if}
    <DateNego
      date={mdates}
      bind:dateb={mdates2}
      lebel={$t('common.finishDate')}
    />
    {#if onSubmit && candidateRound?.mdates}
      <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} {new Date(candidateRound.mdates).toLocaleDateString($lang)}</p>
    {/if}

    <LocationNego
      {location}
      bind:locationb={location2}
      lebel={{ he: 'מיקום', en: 'Location' }}
    />

    <ActsNego {acts} bind:actsb={acts2} lebel={{ he: 'מטלות', en: 'Tasks' }} />
    <div
      class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
    >
      <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{$t('mission.iskvua')}:</h2>
        <input
          bind:checked={isKavua2}
          type="checkbox"
          id="tomeC"
          name="isKavua2"
        />
      </div>
    </div>
    <!---
<div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{$t('mission.assingToMe')}: </h2>
  <input
    bind:checked={myM}
    type="checkbox" id="tomeC" name="tome" value="tome" onclick={()=> myMission()}>
</div>
</div>-->
  </div>
  <div
    class="border border-gold border-opacity-80 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
  >
    <h2 class="underline decoration-mturk">{$t('mission.total')}</h2>
    {#if noofhours == noofhours2 && perhour == perhour2}
      {#if noofhours > 0 && perhour > 0}
        {noofhours * perhour}
      {:else}
        <p>0</p>
      {/if}
    {:else}
      <div class="w-4/5 mx-auto">
        <Barb {datai} />
      </div>
    {/if}
  </div>
  <!---
<table dir="rtl" >
      <tr class="ggr">
        <th class="ggr" > </th>
        <td class="ggr">{$t('nego.original')}</td>
        <td class="ggr">{$t('nego.new')}</td>
    </tr> 
   <tr>
                   <th>שווי סך הכל למשימה </th>
                                    <td>
                                         {#if noofhours > 0 & perhour> 0}

                                        {noofhours * perhour}

                                        {:else} <p>0</p>
                                        {/if}
                                    </td>
                                    <td>
                                        {#if noofhours2 > 0 & perhour2 > 0}

                                        {noofhours2 * perhour2}

                                        {:else if noofhours > 0 & perhour> 0} 
                                        {noofhours * perhour}

                                        {:else} <p>0</p>
                                        {/if}
                                    </td>
                              <tr>
                                    <th>השמת המשימה לעצמי</th>
                                    <td></td>
                                    <td>
                                        <input
                                            bind:checked={myM}
                                            type="checkbox" id="tomeC" name="tome" value="tome" onclick={()=> myMission()}>
                                        <label for="tome">השמת המשימה לעצמי</label>
                                    </td>
                                </tr><tr style="display:none" id="doneC" >
                                    <th>ביצעתי כבר את המשימה</th>
                                    <td></td>
                                    <td>
                                        <input
                                            bind:checked={done}
                                            type="checkbox" id="done" name="done" value="done" onclick={()=> myMissionH()}>
                                        <label for="done">ביצעתי כבר את המשימה</label>
                                    </td>
                                </tr><tr style="display:none" id="hoursC">
                                    <th>כמה שעות זה לקח לי? </th>
                                    <td>{noofhours}</td>
                                    <td>
                                                                           <div dir="rtl" class='textinput'>
  <input type="number" placeholder="0" id="hours" name="hours"  bind:value={noofhours2} class='input' required>
  <label for="hours" class='label'>כמה שעות זה לקח לי? </label>
  <span class='line'></span>
</div>
                                    </td>
                                </tr><tr style="display:none" id="vallueperhourC">
                                    <th>כמה שווה שעה? </th>
                                    <td>{perhour}</td>
                                    <td>
                                         <div dir="rtl" class='textinput'>
  <input type="number"  id="vallueperhour" name="vallueperhour" placeholder="0"
                                            bind:value={perhour2} class='input' required>
  <label for="vallueperhour" class='label'>כמה שווה שעה? </label>
  <span class='line'></span>
</div>
                                        <input >
                                    </td>
                                </tr>
                              
                                <tr >
                                    <th>שווי סך הכל למשימה </th>
                                    <td>
                                         {#if noofhours > 0 & perhour> 0}

                                        {noofhours * perhour}

                                        {:else} <p>0</p>
                                        {/if}
                                    </td>
                                    <td>
                                        {#if noofhours2 > 0 & perhour2 > 0}

                                        {noofhours2 * perhour2}

                                        {:else if noofhours > 0 & perhour> 0} 
                                        {noofhours * perhour}

                                        {:else} <p>0</p>
                                        {/if}
                                    </td>
                                </tr>
                                </table>-->
  <div class="w-fit mx-auto flex flex-col items-center gap-y-2">
    <button
      onclick={increment}
      class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
      type="submit"
      name="addm">{onSubmit ? $t('nego.submitProposal') : $t('common.puttovote')}</button
    >
    <button
      onclick={openBridge}
      type="button"
      class="mx-auto text-sm border border-gold/50 text-gold hover:bg-gold/20 rounded-full px-4 py-1"
    >
      {$t('nego.cand.deeperDiscussion')}
    </button>
  </div>
</div>

<style>
  .gg {
    position: sticky;
    top: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggd {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggr {
    position: sticky;
    top: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggr:hover,
  .gg:hover,
  .ggd:hover {
    background: var(--barbi-pink);
  }
  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .body {
    overflow-x: auto;
    overflow-y: auto;
    height: 100vh;
    width: 100vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  table,
  th,
  td {
    border-collapse: collapse;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
  }
  table {
    text-align: center;
    color: var(--barbi-pink);
    margin: 0 auto;
  }

  th {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
  }
  td {
    background-color: #5efaf2;
    background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }
  th:hover {
    background: var(--barbi-pink);
  }
  td:hover {
    background: rgb(132, 241, 223);
  }
  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--barbi-pink);
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  .label {
    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--mturk);
    user-select: none;
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
    color: var(--barbi-pink);
    top: 0;
  }
</style>
