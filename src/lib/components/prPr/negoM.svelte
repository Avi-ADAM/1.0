<script>
  import { role, ww, skil } from '$lib/components/prPr/mi.js';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang';
  import { t } from '$lib/translations';
  import tr from '$lib/translations/tr.json';
  import Text from '../conf/text.svelte';
  import Elements from '../conf/elements.svelte';
  import Number from '../conf/number.svelte';
  import DateNego from '../conf/dateNego.svelte';
  import Barb from '../conf/barb.svelte';
  import moment from 'moment';
  import { toast } from 'svelte-sonner';
  import Rich from '../conf/rich.svelte';
  import ActsNego from '../conf/actsNego.svelte';
  import LocationNego from '../conf/locationNego.svelte';
  import { submitNegoMission } from '$lib/client/actionClient';
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
    isAsk = 0
  } = $props();
  $inspect(acts);
  let datai = $state([]);

  $effect(() => {
    const items = [
      {
        leb: `${tri?.nego?.new[$lang]},${noofhours2 * perhour2}`,
        value: noofhours2 * perhour2
      },
      {
        leb: `${tri?.nego?.original[$lang]},${noofhours * perhour}`,
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
            leb: `${tri?.nego?.oldno[$lang]}-${i + 1}, ${(negopendmissions[i].attributes.noofhours ?? noofhours) * (negopendmissions[i].attributes.perhour ?? perhour)}`,
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
  const tri = tr;
  let isKavua2 = $state();
  let newcontent = $state(true);

  let error1;
  let placeholder4 = `בחירת תפקידים`;
  let roles = $state($role);
  let why = '';
  let skills2 = $state($skil);
  let placeholder1 = `בחירת כישורים`;
  let addS = false;
  let descrip2 = $state(descrip);
  let name2 = $state(name1);
  let selected2 = [];
  let selected3 = [];
  let selected1 = [];
  let workways2 = $state($ww);
  let placeholder = `סוג משימה`;
  const plww = { he: `סוג משימה`, en: `mission kind` };
  let mdate2 = $state(mdate);
  let mdates2 = $state(mdates);

  let hearotMeyuchadot2 = hearotMeyuchadot;
  let privatlinks2 = $state(privatlinks);
  let noofhours2 = $state(noofhours);
  let perhour2 = $state(perhour);
  let myM;
  let done;
  let skills3 = $state({ data: [] });
  let tafkidims2 = $state({ data: [] });
  let workways3 = $state({ data: [] });
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
  function close() {
    onClose?.();
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

    const skillsId = skills?.data ? skills.data.map((c) => c.id) : [];
    const skills2Id = skills3?.data ? skills3.data.map((c) => c.id) : [];
    if (!arraysEqual(skillsId, skills2Id)) {
      newValues.skillIds = skills2Id;
      originalValues.skillIds = skillsId;
      hasChanges = true;
    }
    const roId = tafkidims?.data ? tafkidims.data.map((c) => c.id) : [];
    const ro2Id = tafkidims2?.data ? tafkidims2.data.map((c) => c.id) : [];
    if (!arraysEqual(roId, ro2Id)) {
      newValues.roleIds = ro2Id;
      originalValues.roleIds = roId;
      hasChanges = true;
    }
    const wwId = workways?.data ? workways.data.map((c) => c.id) : [];
    const ww2Id = workways3?.data ? workways3.data.map((c) => c.id) : [];
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
        toast.success(tr?.toasts.suc[$lang]);
        close();
      } else {
        toast.warning(tr?.toasts.er[$lang]);
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
      toast.warning(tr?.toasts.er[$lang]);
    }
  }
  let dataibno = $state({
    skillName: [],
    roleDescription: [],
    workWayName: []
  });
  function addnew(event) {
    const newOb = event.skob;
    const valc = event.valc;
    const dataibn = event.dataibn;
    const newN = event.skob.attributes[valc];
    dataibno[valc] = dataibn;
    const newValues =
      valc == 'skillName'
        ? $skil
        : valc == 'roleDescription'
          ? $role
          : valc == 'workWayName'
            ? $ww
            : [];
    newValues.push(newOb);
    if (valc == 'skillName') {
      skills2 = newValues;
      skil.set(skills2);
    } else if (valc == 'roleDescription') {
      roles = newValues;
      role.set(roles);
    } else if (valc == 'workWayName') {
      workways2 = newValues;
      ww.set(workways2);
    }
    const newSele =
      valc == 'skillName'
        ? skills3.data
        : valc == 'roleDescription'
          ? tafkidims2.data
          : valc == 'workWayName'
            ? workways3.data
            : [];
    newSele.push(newOb);
    if (valc == 'skillName') {
      skills3.data = newSele;
    } else if (valc == 'roleDescription') {
      tafkidims2.data = newSele;
    } else if (valc == 'workWayName') {
      workways3.data = newSele;
    }
    dataibno[valc].push(newN);
    dataibno = dataibno;
  }
  onMount(async () => {
    isKavua2 = isKavua;
    skills3 = JSON.parse(JSON.stringify(skills));
    tafkidims2 = JSON.parse(JSON.stringify(tafkidims));
    workways3 = JSON.parse(JSON.stringify(workways));
    console.log('negoM mounted', $lang);
    console.log(
      'acts prop received:',
      acts,
      'type:',
      typeof acts,
      'has data:',
      !!acts?.data,
      'data isArray:',
      Array.isArray(acts?.data)
    );
    console.log('acts.data:', acts?.data);
    console.log('acts2 state:', acts2);
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };
    try {
      const res = await fetch(import.meta.env.VITE_URL + '/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query {
    skills {data{ id attributes{ skillName ${$lang == 'he' ? 'localizations{data {attributes{ skillName}} }' : ''} }}}
     tafkidims {data{ id attributes{ roleDescription ${$lang == 'he' ? 'localizations{data {attributes{ roleDescription}} }' : ''}}}}
     workWays {data{ id attributes{ workWayName ${$lang == 'he' ? 'localizations{data {attributes{ workWayName}} }' : ''} } }}
 }
              `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
      skills2 = res.data.skills.data;
      if ($lang == 'he') {
        for (let i = 0; i < skills2.length; i++) {
          if (skills2[i].attributes.localizations.data.length > 0) {
            skills2[i].attributes.skillName =
              skills2[i].attributes.localizations.data[0].attributes.skillName;
          }
        }
      }
      skills2 = skills2;
      roles = res.data.tafkidims.data;
      if ($lang == 'he') {
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].attributes.localizations.data.length > 0) {
            roles[i].attributes.roleDescription =
              roles[
                i
              ].attributes.localizations.data[0].attributes.roleDescription;
          }
        }
      }
      roles = roles;
      workways2 = res.data.workWays.data;
      if ($lang == 'he') {
        for (let i = 0; i < workways2.length; i++) {
          if (workways2[i].attributes.localizations.data.length > 0) {
            workways2[i].attributes.workWayName =
              workways2[
                i
              ].attributes.localizations.data[0].attributes.workWayName;
          }
        }
      }
      workways2 = workways2;
      skil.set(skills2);
      ww.set(workways2);
      role.set(roles);
      newcontent = false;
    } catch (e) {
      error1 = e;

      console.log(error1);
    }
  });
</script>

<div class="text-barbi" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
  <h1 class="md:text-center text-2xl md:text-2xl font-bold underline">
    {tri?.nego?.head[$lang]}
    {name1}
  </h1>
  <div class="flex flex-col align-middle justify-center">
    <Text
      text={name1}
      bind:textb={name2}
      lebel={tri?.common?.name}
      old={negopendmissions.map((c) => c?.attributes?.name)}
    />
    <Rich
      old={negopendmissions.map((c) => c?.attributes?.descrip)}
      text={descrip}
      bind:textb={descrip2}
      lebel={tri?.common?.description}
    />
    <Elements
      dataibn={dataibno.skillName}
      {newcontent}
      placeholder={tri?.mission?.addNewSkills}
      datai={skills.data}
      alld={skills2}
      bind:dataib={skills3.data}
      lebel={tri?.mission?.requireSkills}
      onAddnew={addnew}
      valc="skillName"
      bgi="gold"
    />
    <Elements
      {newcontent}
      placeholder={tri?.mission?.addNewRoles}
      datai={tafkidims.data}
      alld={roles}
      bind:dataib={tafkidims2.data}
      lebel={tri?.mission?.requiredRoles}
      dataibn={dataibno.roleDescription}
      onAddnew={addnew}
      valc="roleDescription"
      bgi="gold"
    />
    <Elements
      {newcontent}
      placeholder={tri?.mission?.addNewWw}
      datai={workways.data}
      alld={workways2}
      bind:dataib={workways3.data}
      lebel={tri?.mission?.requiredWW}
      dataibn={dataibno.workWayName}
      onAddnew={addnew}
      valc="workWayName"
      bgi="gold"
    />
    <!----<Text long={true} text={hearotMeyuchadot} bind:textb={hearotMeyuchadot2} lebel={tri?.mission?.specialNotes}/>
            --><Text
      text={privatlinks}
      bind:textb={privatlinks2}
      lebel={tri?.mission?.linkToMission}
    />
    <Number
      old={negopendmissions.map((c) => c?.attributes?.noofhours)}
      number={noofhours}
      bind:numberb={noofhours2}
      lebel={`${tri?.mission?.noOfHours[$lang]} ${isKavua == true && isKavua2 == true ? tri?.mission.perMonth[$lang] : ''}`}
      splebel={isKavua == true && isKavua2 == true
        ? null
        : isKavua == true && isKavua2 == false
          ? false
          : isKavua == false && isKavua2 == true
            ? true
            : null}
    />
    <Number
      old={negopendmissions.map((c) => c?.attributes?.perhour)}
      number={perhour}
      bind:numberb={perhour2}
      lebel={tri?.mission?.hourlyVallue[$lang]}
    />
    <DateNego date={mdate} bind:dateb={mdate2} lebel={tri?.common.startDate} />
    <DateNego
      date={mdates}
      bind:dateb={mdates2}
      lebel={tri?.common.finishDate}
    />

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
        <h2 class="underline decoration-mturk">{tr?.mission.iskvua[$lang]}:</h2>
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
        <h2 class="underline decoration-mturk">{tr?.mission.assingToMe[$lang]}: </h2>
  <input
    bind:checked={myM}
    type="checkbox" id="tomeC" name="tome" value="tome" onclick={()=> myMission()}>
</div>
</div>-->
  </div>
  <div
    class="border border-gold border-opacity-80 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
  >
    <h2 class="underline decoration-mturk">{tri?.mission.total[$lang]}</h2>
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
        <td class="ggr">{tri?.nego?.original[$lang]}</td>
        <td class="ggr">{tri?.nego?.new[$lang]}</td>
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
  <div class="w-fit mx-auto">
    <button
      onclick={increment}
      class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
      type="submit"
      name="addm">{tri?.common.puttovote[$lang]}</button
    >
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
