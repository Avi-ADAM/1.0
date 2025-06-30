<script>
 import { role, ww, skil } from '$lib/components/prPr/mi.js';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang';

  let isKavua2 = $state();
  let newcontent = $state(true);

  let miDatan = [];
  let error1;
  let bearer1;
  let token;
  let idL;
  let no = false;
  let masa = false;
  let data;
  let isOpen;
  const less = {
    he: 'הסרה',
    en: 'remove'
  };
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
  let skills3 = $state([]);
  let tafkidims2 = $state([]);
  let workways3 = $state([]);

  let rishon = 0;
  function myMission() {
    let checkBox = document.getElementById('tomeC');

    let text = document.getElementById('doneC');
    console.log(text);
    if (text.style.display == 'none') {
      text.style.display = '';
    } else {
      text.style.display = 'none';
    }
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    rishon = idL;
  }
  let rishonves = 0;
  function myMissionH() {
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    rishonves = idL;
    /*let checkBox = document.getElementById("done");
  // Get the output text
  let text = document.getElementById("hoursC");
  let text2 = document.getElementById("vallueperhourC");
  let text3 = document.getElementById("vallueperhourN");
  let text4 = document.getElementById("hoursD");
  let text5 = document.getElementById("vallueperM");
  // If the checkbox is checked, display the output text
  if (text.style.display == "none"){
    text.style.display = "";
    text2.style.display = "";
    text3.style.display = "none";
    text4.style.display = "none";
    text5.style.display = "none";
  } else {
    text.style.display = "none";
    text2.style.display = "none";
    text3.style.display = "";
    text4.style.display = "";
    text5.style.display = "";
  }*/
  }

  function arraysEqual(a1, a2) {
    return JSON.stringify(a1) == JSON.stringify(a2);
  }
  function close() {
    onClose?.();
  }
  let name4 = ``;
  let descrip4 = ``;
  let hearotMeyuchadot4 = ``;
  let noofhours4 = ``;
  let perhour4 = ``;
  let skills4 = ``;
  let roles4 = ``;
  let ww4 = ``;
  let rishon4 = ``;
  let rishonves4 = ``;
  let what4 = true;
  function objToString(obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      const length = Object.keys(obj[i]).length;
      let t = 0;
      for (const [p, val] of Object.entries(obj[i])) {
        const last = t === length - 1;
        t++;
        if (typeof val == 'string') {
          str += `${p}:"${val}"\n`;
        } else if ((typeof val == 'number') | 'boolean') {
          str += `${p}:${val}\n`;
        } else if (typeof val == 'null') {
          str += `${p}:${val.map((c) => c.id)}\n`;
        }
        if (last) {
          str += '},';
        }
        if (t == 1) {
          str += '{';
        }
      }
    }
    return str;
  }
  function objToStringC(obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      const length = Object.keys(obj[i]).length;
      let t = 0;
      for (const [p, val] of Object.entries(obj[i])) {
        const last = t === length - 1;
        t++;
        if (typeof val == 'string') {
          str += `${p}:"${val}"\n`;
        } else if ((typeof val == 'number') | 'boolean') {
          str += `${p}:${val}\n`;
        } else if (typeof val == 'null') {
          str += `${p}:${val.map((c) => c.id)}\n`;
        }
        if (last) {
          str += '},';
        }
        if (t == 1) {
          str += '{';
        }
      }
    }
    return str;
  }
  let userss;
  async function increment() {
    onLoad?.();
    //TODO: update timegrama, add now pend that is changed to nego
    let date4 = ``,
      dates4 = ``,
      iskvua4 = ``,
      iskvua4nego = ``,
      date4nego,
      dates4nego,
      namefornego,
      descrip4nego,
      hearotMeyuchadot4nego,
      noofhours4nego,
      perhour4nego,
      skills4nego,
      roles4nego,
      ww4nego,
      rishon4nego,
      rishonves4nego;
    let d = new Date();
    const negoss = ``;
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
    if (rishon !== 0) {
      rishon4 = `rishon: "${rishon}"`;
    } else {
      rishon4 = ``;
    }
    /* if (rishonves !== 0){
        rishonves4= `rishonves: "${rishonves}"`
    } else {
        rishonves4 = ``;
    }
    ${rishon4nego}
    ${rishonves4nego}
     ${rishon4}
    ${rishonves4}
    ${rishon4}
    ${rishonves4},
    iskvua
    */
    if (isKavua === isKavua2) {
      iskvua4 = ``;
      iskvua4nego = ``;
    } else {
      iskvua4nego = ` isMonth: ${isKavua ?? false},`;
      iskvua4 = ` iskvua: ${isKavua2 ?? false},`;
      what4 = false;
    }
    if (mdates === mdates2) {
      dates4 = ``;
      dates4nego = ``;
    } else {
      let momebtt = moment(mdates2, 'HH:mm DD/MM/YYYY ') || null;
      dates4nego =
        mdates != null && mdates != undefined ? ` dates: "${mdates}",` : ``;
      dates4 =
        mdates2 != null && mdates2 != undefined
          ? ` dates: "${momebtt.toISOString()}",`
          : ``;
      what4 = false;
    }
    if (mdate === mdate2) {
      date4 = ``;
      date4nego = ``;
    } else {
      let momebtt = moment(mdate2, 'HH:mm DD/MM/YYYY ') || null;
      date4nego =
        mdate != null && mdate != undefined ? ` date: "${mdate}",` : ``;
      date4 =
        mdate2 != null && mdate2 != undefined
          ? ` sqadualed: "${momebtt.toISOString()}",`
          : ``;
      what4 = false;
    }
    if (name1 === name2) {
      name4 = ``;
      namefornego = ``;
    } else {
      name4 = `name: "${name2}",`;
      namefornego = `name: "${name1}",`;
      what4 = false;
    }
    if (descrip === descrip2) {
      descrip4 = ``;
      descrip4nego = ``;
    } else {
      descrip4 = `descrip: "${descrip2}",`;
      descrip4nego = `descrip: "${descrip}",`;
      what4 = false;
    }
    if (hearotMeyuchadot === hearotMeyuchadot2) {
      hearotMeyuchadot4 = ``;
      hearotMeyuchadot4nego = ``;
    } else {
      hearotMeyuchadot4 = `hearotMeyuchadot: "${hearotMeyuchadot2}",`;
      hearotMeyuchadot4nego = `hearotMeyuchadot: "${hearotMeyuchadot}",`;
      what4 = false;
    }
    if (noofhours === noofhours2) {
      noofhours4 = ``;
      noofhours4nego = ``;
    } else {
      noofhours4 = `noofhours: ${noofhours2},`;
      noofhours4nego = `noofhours: ${noofhours},`;
      what4 = false;
    }
    if (perhour === perhour2) {
      perhour4 = ``;
      perhour4nego = ``;
    } else {
      perhour4 = `perhour: ${perhour2},`;
      perhour4nego = `perhour: ${perhour},`;
      what4 = false;
    }
    const skillsId = skills.data.map((c) => c.id);
    const skills2Id = skills3.data.map((c) => c.id);
    const roId = tafkidims.data.map((c) => c.id);
    const ro2Id = tafkidims2.data.map((c) => c.id);
    const wwId = workways.data.map((c) => c.id);
    const ww2Id = workways3.data.map((c) => c.id);
    if (arraysEqual(skillsId, skills2Id) === false) {
      skills4 = ` skills: [${skills2Id}], `;
      skills4nego = ` skills: [${skillsId}], `;
      what4 = false;
    } else {
      skills4 = ``;
      skills4nego = ``;
    }
    if (arraysEqual(roId, ro2Id) === false) {
      roles4 = ` tafkidims: [${ro2Id}], `;
      roles4nego = ` tafkidims: [${roId}], `;
      what4 = false;
    } else {
      roles4 = ``;
      roles4nego = ``;
    }
    if (arraysEqual(wwId, ww2Id) === false) {
      ww4 = ` work_ways: [${ww2Id}], `;
      ww4nego = ` work_ways: [${wwId}], `;
      what4 = false;
    } else {
      ww4 = ``;
      ww4nego = ``;
    }
    let another = ``;
    if (
      (what4 == true && masaalr == true && mypos == false) ||
      (what4 == true && masaalr == false) ||
      what4 == false
    ) {
      if (what4 == false) {
        another = `,{
      what: true
      users_permissions_user: "${idL}"
      order: 4
    }`;
      }
      if (masaalr == true) {
        userss = objToStringC(users);
      } else {
        userss = objToString(users);
      }
      let fd = new Date(Date.now() + x);
      try {
        await fetch(linkg, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          //${negoss} {rishons} {rishonveses}?
          body: JSON.stringify({
            query: `mutation { 
             updateTimegrama(
     id: ${timegramaId}
             data:{
      date: "${fd.toISOString()}",
             }){data {id}}
             createNegopendmission(
              data:{
                publishedAt: "${d.toISOString()}",
                pendm:${pendId},
                 users_permissions_user: "${idL}",
                 isOriginal:${stepState == 2 ? true : false},
    ${iskvua4nego}             
    ${noofhours4nego}
    ${hearotMeyuchadot4nego}
    ${descrip4nego}
    ${namefornego}
    ${perhour4nego}
    ${skills4nego}
    ${roles4nego}
    ${ww4nego}
    ${date4nego}
    ${dates4nego}
              }
             ){data{id}}
            updatePendm(
     id: ${pendId}
      data:  { 
            ${iskvua4}             
           ${noofhours4}
    ${hearotMeyuchadot4}
    ${descrip4}
    ${name4}
    ${perhour4}
    ${skills4}
    ${roles4}
    ${ww4}
    ${date4}
    ${dates4}
        users:[  ${userss}, 
     {
      what: true
      users_permissions_user: "${idL}"
      order: ${ordern + 1}
      zman:"${d.toISOString()}"
      ide:${idL}
    }
  ], nego:[ 
{
    users_permissions_user: "${idL}"
}
  ]
      }
  ){data { attributes{ users { users_permissions_user {data{ id}}}}}}
} `
            // make coin desapire
          })
        })
          .then((r) => r.json())
          .then((data) => (miDatan = data));
        console.log(miDatan);
        toast.success(tr?.toasts.suc[$lang]);

        close();
      } catch (e) {
        error1 = e;
        console.log(error1);
        toast.warning(tr?.toasts.er[$lang]);
      }
    }
  }
  let x;
  let linkg = import.meta.env.VITE_URL + '/graphql';
  let dataibno = $state({ skillName: [], roleDescription: [], workWayName: [] });
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
    const newSele = dataib;
    newSele.push(newOb);
    if (valc == 'skillName') {
      skills3.data = newSele;
    } else if (valc == 'roleDescription') {
      tafkidims2.data = newSele;
    } else if (valc == 'workWayName') {
      workways3 = newSele;
    }
    dataibno[valc].push(newN);
    dataibno = dataibno;
  }
  onMount(async () => {
    isKavua2 = isKavua;
    //  skills3 = skills;
    //tafkidims2 = tafkidims;
    //workways3 = workways;
    console.log('mounted', $lang);
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
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
    if (restime == 'feh') {
      x = 48 * 60 * 60 * 1000;
    } else if (restime == 'sth') {
      x = 72 * 60 * 60 * 1000;
    } else if (restime == 'nsh') {
      x = 96 * 60 * 60 * 1000;
    } else if (restime == 'sevend') {
      x = 168 * 60 * 60 * 1000;
    }
    x = x;
    console.log(new Date(Date.now() + x).toLocaleString(), restime);
  });
  import tr from '$lib/translations/tr.json';
  import Text from '../conf/text.svelte';
  import Elements from '../conf/elements.svelte';
  import Number from '../conf/number.svelte';
  import DateNego from '../conf/dateNego.svelte';
  import Barb from '../conf/barb.svelte';
  import moment from 'moment';
  import { toast } from 'svelte-sonner';
  import Rich from '../conf/rich.svelte';
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
    onClose,
    onLoad
  } = $props();

  const tri = tr;
  let datai = $state([]);
  
  $effect(() => {
    if(negopendmissions.length > 0){
    datai = [
      {
        leb: `${tri?.nego?.new[$lang]},${noofhours2 * perhour2}`,
        value: noofhours2 * perhour2
      },
      {
        leb: `${tri?.nego?.original[$lang]},${noofhours * perhour}`,
        value: noofhours * perhour
      }
    ];
    for(let i = 0; i < negopendmissions.length; i++){
      if(negopendmissions[i].attributes.perhour != null || negopendmissions[i].attributes.noofhours != null){
        datai.push({
          leb: `${tri?.nego?.oldno[$lang]}-${i+1}, ${(negopendmissions[i].attributes.noofhours ?? noofhours) * (negopendmissions[i].attributes.perhour ?? perhour)}`,
          value: (negopendmissions[i].attributes.noofhours ?? noofhours) * (negopendmissions[i].attributes.perhour ?? perhour)
    })
      }
    }
    datai = datai
    }else{
      datai = [
        {
          leb: `${tri?.nego?.new[$lang]},${noofhours2 * perhour2}`,
          value: noofhours2 * perhour2
        },
        {
          leb: `${tri?.nego?.original[$lang]},${noofhours * perhour}`,
          value: noofhours * perhour
        }
      ];
      datai = datai
    }
  });
  console.log(negopendmissions)
</script>

<div class="text-barbi" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
  <h1 class="md:text-center text-2xl md:text-2xl font-bold underline">
    {tri?.nego?.head[$lang]}
    {name1}
  </h1>
  <div class="flex flex-col align-middle justify-center">
    <Text text={name1} bind:textb={name2} lebel={tri?.common?.name}  
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
      {#if (noofhours > 0) & (perhour > 0)}
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
