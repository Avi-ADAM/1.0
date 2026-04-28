<script>
  import Dialog from '$lib/celim/ui/dialog.svelte';
  import { page } from '$app/state';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { liUN } from '$lib/stores/liUN.js';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Close from '$lib/celim/close.svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { TourItem } from 'svelte-tour';
  import { run } from 'svelte-tour';
  import { Tour } from 'svelte-tour';
  import TourTip from '$lib/components/tour/tourMeEnd.svelte';
  import { lang, doesLang, langUs } from '$lib/stores/lang.js';
  import { locale } from '$lib/translations';
  import { onMount, tick } from 'svelte';
  import axios from 'axios';
  import { draw } from 'svelte/transition';
  import Addnew from '$lib/components/addnew/baci.svelte';
  import { baciStore } from '$lib/stores/baciStore.js';
  import Addnewp from '$lib/components/userPr/uploadPic.svelte';
  import { uPic } from '$lib/stores/uPic.js';
  import Edit from '$lib/components/userPr/edit.svelte';
  import EditB from '$lib/components/userPr/editBasic.svelte';
  const baseUrl = import.meta.env.VITE_URL;
  //import Profile from '../../lib/components/userPr/new.svelte';
  //import { addS } from '../../lib/stores/addS.js';
  import { idPr } from '$lib/stores/idPr.js';
  import { goto } from '$app/navigation';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly, scale } from 'svelte/transition';
  let iwant = $state(false);
  let isOpen = $state(false);
  let isOpenM = $state(false);
  let isG = $state(false);
  let current = $state('');

  let url1 = `${baseUrl}/api/upload`;
  let updX = $state(0);
  let token;
  let files;
  let idLi;

  let skil = [];
  let taf = [];
  let mash = [];
  let val = [];
  let work = [];
  let total = $state(0);
  let odata = [];
  let allvn;
  let picLink = $state(
    'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'
  );
  let idL;
  let addSl = $state(false);
  let addSl1 = $state(false);
  let addSl2 = $state(false);
  let addSl3 = $state(false);
  let addSl4 = $state(false);
  let addSl5 = $state(false);
  let a = $state(0);
  let addNs1 = $state(true);
  let error1 = null;
  let addpic = $state(0);
  let addP = $state(false);
  let st = $state(0);
  let stylef = $state('31px');
  let meData = $state(start());
  function isUCBrowser() {
    return /UCWEB|UCBrowser/i.test(navigator.userAgent);
  }

  function sendP() {
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idLi = cookieValueId;
    token = page.data.tok;
    let bearer1 = 'bearer' + ' ' + token;
    let link = `${baseUrl}/api/users/${idLi}`;
    // Check if FormData is empty
    let hasFiles = false;
    for (let pair of files.entries()) {
      hasFiles = true;
      break;
    }

    if (!hasFiles) {
      const msg = {
        he: 'נא לבחור קובץ להעלאה',
        en: 'Please select a file to upload'
      };
      toast.warning(msg[$lang]);
      return;
    }

    axios
      .post(url1, files, {
        headers: {
          Authorization: bearer1
          // 'Content-Type': 'multipart/form-data' is automatically set by axios for FormData
        }
      })
      .then(({ data }) => {
        const imageId = data[0].id;
        console.log(imageId);
        sendpg(imageId);
      })
      .catch((error) => {
        console.log('An error occurred:', error.response);
        const msg = {
          he: error.response?.data?.message || 'שגיאה בהעלאת קובץ',
          en: error.response?.data?.message || 'Error uploading file'
        };
        toast.error(msg[$lang]);
      });
  }

  async function sendpg(imageId) {
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idLi = cookieValueId;
    token = page.data.tok;
    let bearer1 = 'bearer' + ' ' + token;
    let res;
    let linkg = `${baseUrl}/graphql`;
    try {
      await fetch(linkg, {
        method: 'POST',

        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation { updateUsersPermissionsUser(
    id:${idLi}
      data: {profilePic: ${imageId} }

  ){
      data {
        attributes{
        profilePic { data {
               attributes{ url formats}}
          }
      }
  }
}
}
`
        })
      })
        .then((r) => r.json())
        .then((data) => (res = data.data.updateUsersPermissionsUser.data));
      console.log(res);
      uPic.set(
        res.attributes.profilePic.data.attributes.formats?.thumbnail?.url ||
          res.attributes.profilePic.data.attributes.url
      );
      picLink = $uPic;
      uPic.set(
        res.attributes.profilePic.data.attributes.formats?.small?.url ||
          res.attributes.profilePic.data.attributes.url
      );
      picLink = $uPic;
      updX = 0;
      isOpenM = false;
      a = 0;
    } catch (e) {
      error1 = e;
    }
  }
  let meDataa = $state([]);
  let load = $state(false);
  function project(id) {
    load = true;
    idPr.set(id);
    goto('/moach');
  }
  let mail = $state(),
    lango;
  let cards = $state(true);
  async function start() {
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    token = page.data.tok;
    let bearer1 = 'bearer' + ' ' + token;
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    let linkgra = `${baseUrl}/graphql`;
    try {
      await fetch(linkgra, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query { usersPermissionsUser (id: ${idL}){
    data {
      id attributes{
           frd
            fblink twiterlink discordlink githublink
            bio
            preferCards
            lang
            machshirs{data{id attributes{jsoni}}}
            email
            noMail
            username
            hervachti
            profilManualAlready
            profilePic { data{ attributes{url formats} }}
            projects_1s {data{ id attributes {projectName}} }
            skills { data{ id attributes{ skillName ${$lang == 'he' ? 'localizations { data {attributes{skillName} }}' : ''}}}}
            sps (filters: { archived: { ne: true } }) { data{id attributes{ name panui}}}
            tafkidims { data { id attributes{ roleDescription  ${$lang == 'he' ? 'localizations {data {attributes{roleDescription } }}' : ''}}}}
            vallues {data{ id attributes {valueName ${$lang == 'he' ? 'localizations{ data { attributes{ valueName } } }' : ''}}}}
            work_ways {data{ id attributes{workWayName  ${$lang == 'he' ? 'localizations {data{attributes{workWayName}} }' : ''}}}}
          }
        }
      }me { id }
 } `
        })
      })
        .then((r) => r.json())
        .then((data) => (meDataa = data));
      if (meDataa.data != null) {
        if (meDataa.data.me.id === idL && meDataa.data.me != null) {
          if (
            meDataa.data.usersPermissionsUser.data.attributes
              .profilManualAlready != true
          ) {
            showSaveDialog = true; // Show dialog instead of running directly
          }
          console.log(meDataa.data.usersPermissionsUser.data.attributes);
          meData = meDataa.data.usersPermissionsUser.data.attributes;
          // Initialize selected2 for the data arrays themselves
          if (
            meData.skills &&
            meData.skills.data &&
            meData.skills.data.selected2 === undefined
          ) {
            meData.skills.data.selected2 = [];
          }
          if (
            meData.tafkidims &&
            meData.tafkidims.data &&
            meData.tafkidims.data.selected2 === undefined
          ) {
            meData.tafkidims.data.selected2 = [];
          }
          if (
            meData.sps &&
            meData.sps.data &&
            meData.sps.data.selected2 === undefined
          ) {
            meData.sps.data.selected2 = [];
          }
          if (
            meData.vallues &&
            meData.vallues.data &&
            meData.vallues.data.selected2 === undefined
          ) {
            meData.vallues.data.selected2 = [];
          }
          if (
            meData.work_ways &&
            meData.work_ways.data &&
            meData.work_ways.data.selected2 === undefined
          ) {
            meData.work_ways.data.selected2 = [];
          }
          isG =
            meDataa.data.usersPermissionsUser.data.attributes
              .profilManualAlready;
          mail = meData.email;
          liUN.set(meData.username);
          lango = meData.lang || 'he';
          if (lango == 'en' || lango == 'he') {
            // Check if lang store is different from lango
            if ($lang !== lango) {
              // Sync all stores
              lang.set(lango);
              locale.set(lango);
              langUs.set(lango);
              doesLang.set(true);
              // Add to cookies
              document.cookie =
                `lang=${lango}; expires=` + new Date(2027, 0, 1).toUTCString();
              // Re-fetch data to include new lang data
              await start();
              return;
            } else {
              // Sync all stores
              lang.set(lango);
              locale.set(lango);
              langUs.set(lango);
              doesLang.set(true);
              document.cookie =
                `lang=${lango}; expires=` + new Date(2027, 0, 1).toUTCString();
            }
          }
          if ($lang == 'he') {
            for (let i = 0; i < meData.vallues.data.length; i++) {
              if (
                meData.vallues.data[i].attributes.localizations.data.length > 0
              ) {
                meData.vallues.data[i].attributes.valueName =
                  meData.vallues.data[
                    i
                  ].attributes.localizations.data[0].attributes.valueName;
              }
            }
          }
          if ($lang == 'he') {
            for (let i = 0; i < meData.skills.data.length; i++) {
              if (
                meData.skills.data[i].attributes.localizations.data.length > 0
              ) {
                meData.skills.data[i].attributes.skillName =
                  meData.skills.data[
                    i
                  ].attributes.localizations.data[0].attributes.skillName;
              }
            }
          }
          meData = meData;

          if ($lang == 'he') {
            for (let i = 0; i < meData.tafkidims.data.length; i++) {
              if (
                meData.tafkidims.data[i].attributes.localizations.data.length >
                0
              ) {
                meData.tafkidims.data[i].attributes.roleDescription =
                  meData.tafkidims.data[
                    i
                  ].attributes.localizations.data[0].attributes.roleDescription;
              }
            }
          }
          meData = meData;
          if ($lang == 'he') {
            for (let i = 0; i < meData.work_ways.data.length; i++) {
              if (
                meData.work_ways.data[i].attributes.localizations.data.length >
                0
              ) {
                meData.work_ways.data[i].attributes.workWayName =
                  meData.work_ways.data[
                    i
                  ].attributes.localizations.data[0].attributes.workWayName;
              }
            }
          }
          cards = meData.preferCards ?? true;
          //    roundText (meData.username);
          /// pics = meData.profilePic.formats.small.url;

          total = meData.hervachti ? meData.hervachti : 0;
          fblink = meData.fblink;
          twiterlink = meData.twiterlink;
          discordlink = meData.discordlink;
          githublink = meData.githublink;
          noMail = meData.noMail;
          if (meData.profilePic.data != null) {
            uPic.set(
              meData.profilePic.data.attributes.formats?.thumbnail?.url ||
                meData.profilePic.data.attributes.url
            );
            picLink = $uPic;
            uPic.set(
              meData.profilePic.data.attributes.formats?.small?.url ||
                meData.profilePic.data.attributes.url
            );
            picLink = $uPic;
            let b = '/ar_1.0,c_thumb,g_face,w_0.6,z_0.7/r_max';
            let output = [picLink.slice(0, 48), b, picLink.slice(48)].join('');
            picLink = output;
          } else {
            picLink =
              'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
          }
          localStorage.setItem('picLink', JSON.stringify(picLink));

          total = meData.hervachti;
          meData = meData;
        } else {
          goto('/login');
        }
      } else {
        goto('/login');
      }
    } catch (e) {
      error1 = e;
      console.log(e);
      if (e == 'TypeError: Failed to fetch') {
        // setTimeout(start(), 10000);
        const msg = {
          he: 'נראה שיש בעיה בחיבור לאינטרנט, נא לנסות שוב',
          en: 'seems llike we have a internet connection problem, please try again'
        };
        toast.warning(msg[$lang]);
        //getcetch & show msg this from cetch bcz you have no net
        // else no net page
        //await net then again??
      }
    }
    return meData;
  }
  function reverseString(str) {
    return str.split('').reverse().join('');
  }
  export const snapshot = {
    capture: () => JSON.parse(JSON.stringify(meData)),
    restore: (value) => (meData = value)
  };
  function getCookie(name) {
    let dc = document.cookie;
    let prefix = name + '=';
    let begin = dc.indexOf('; ' + prefix);
    if (begin == -1) {
      begin = dc.indexOf(prefix);
      if (begin != 0) return null;
    } else {
      begin += 2;
      let end = document.cookie.indexOf(';', begin);
      if (end == -1) {
        end = dc.length;
      }
    }

    return decodeURI(dc.substring(begin + prefix.length, end));
  }
  /*
  onMount(async () => {
     if ((navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)) {
     await start()
     .then()
  if ((/[\u0590-\u05FF]/).test(meData.username) || (/[\u0600-\u06FF]/).test(meData.username)) {
    meData.username = reverseString(meData.username)
    meData = meData
}
  }
   })*/
  let userName_value;
  let biog;
  let frd;
  let fblink = $state(),
    twiterlink = $state(),
    discordlink = $state(),
    githublink = $state(),
    noMail = $state();
  async function sendD() {
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idLi = cookieValueId;
    token = page.data.tok;
    let bearer1 = 'bearer' + ' ' + token;
    let link = `${baseUrl}/api/users/${idLi}`;
    axios
      .put(
        link,
        {
          username: userName_value,
          bio: biog,
          frd: frd,
          lang: lango,
          fblink: fblink,
          twiterlink: twiterlink,
          discordlink: discordlink,
          githublink: githublink,
          preferCards: cards,
          noMail: noMail
        },
        {
          headers: {
            Authorization: bearer1
          }
        }
      )
      .then((response) => {
        meData = response.data;
        isOpenM = false;
        isOpen = false;
        a = 0;
        start();
        //  updpic.set(0);
      })
      .catch((error) => {
        console.log('An error occurred:', error.response);
      });
  }

  function callbackFunction(event) {
    a = 2;
    files = event.files; // files is already a FormData object from the Addnewp component
    console.log(files);
    sendP();
  }
  function callbackFunctio(event) {
    console.log(event);
    a = 2;
    fblink = event.fblink;
    twiterlink = event.twiterlink;
    discordlink = event.discordlink;
    githublink = event.githublink;
    userName_value = event.un;
    // emailL = event.em;
    noMail = event.noMail;
    biog = event.bi;
    frd = event.frd;
    lango = event.lango;
    cards = event.cards;
    sendD();
  }

  function remove(event) {
    const miDatanew = event.data;
    const linkp = event.linkp;
    addNs1 = false;
    meData[linkp].data = miDatanew;
    console.log(miDatanew, meData);
    skil = meData.skills.data;
    taf = meData.tafkidims.data;
    val = meData.vallues.data;
    mash = meData.sps.data;
    work = meData.work_ways.data;
    meData = meData;
    addNs1 = true;
  }

  async function add(event) {
    console.log(event);
    const linkp = event.linkp;
    const miDatanew = event.data;
    const valc = event.valc;
    const a = event.a;
    miDatanew.selected2 = [];
    console.log(miDatanew, meData);
    addNs1 = false;
    const meDatanew = meData;
    meDatanew[linkp].data = miDatanew;
    console.log(meDatanew);
    meData = meDatanew;
    skil = meData.skills.data;
    taf = meData.tafkidims.data;
    val = meData.vallues.data;
    mash = meData.sps.data;
    work = meData.work_ways.data;
    meData = meData;
    addNs1 = true;
    console.log(a);
  }

  async function addnew(event) {
    const linkp = event.linkp;
    const skob = event.skob;
    const miDatanew = event.data;
    miDatanew.push(skob);
    addNs1 = false;
    const meDatanew = meData;
    meDatanew[linkp].data = miDatanew;
    console.log(meDatanew);
    meData = meDatanew;
    skil = meData.skills.data;
    taf = meData.tafkidims.data;
    val = meData.vallues.data;
    mash = meData.sps.data;
    work = meData.work_ways.data;
    meData = meData;
    addNs1 = true;
  }
  const closer = () => {
    isOpen = false;
    isOpenM = false;
    updX = 0;
    addpic = 0;
    a = 0;
  };
  function basic() {
    isOpen = true;
    a = 1;
  }
  function openen() {
    isOpenM = true;
    updX = 1;
    addpic = 1;
  }

  function open(event) {
    addSl1 = false;
    addSl2 = false;
    addSl3 = false;
    addSl4 = false;
    addSl5 = false;
    const a = event.linkp;
    console.log(addSl);
    if (a == 'tafkidims') {
      current = 'a2';
      addSl2 = true;
    } else if (a == 'skills') {
      current = 'a1';
      addSl1 = true;
    } else if (a == 'vallues') {
      current = 'a4';
      addSl4 = true;
    } else if (a == 'mashaabims') {
      current = 'a3';
      addSl3 = true;
    } else if (a == 'workWays') {
      current = 'a5';
      addSl5 = true;
    }
  }

  function close(event) {
    console.log(event);
    const a = event.linkp;

    if (event.list && event.list.selected2 === undefined) {
      event.list.selected2 = [];
    }

    if (a == 'tafkidims') {
      meData.tafkidims.data = event.list;
    } else if (a == 'skills') {
      meData.skills.data = event.list;
    } else if (a == 'vallues') {
      meData.vallues.data = event.list;
    } else if (a == 'mashaabims') {
      meData.sps.data = event.list;
    } else if (a == 'workWays') {
      meData.work_ways.data = event.list;
    }
    current = 'l';
    meData = meData;
    addSl1 = false;
    addSl2 = false;
    addSl3 = false;
    addSl4 = false;
    addSl5 = false;
  }

  import { RingLoader } from 'svelte-loading-spinners';
  import { toast } from 'svelte-sonner';
  import CrNewProject from '$lib/celim/icons/crNewProject.svelte';
  import { end } from 'happy-dom/lib/PropertySymbol.js';
  import ProfileBadge from '$lib/components/userPr/ProfileBadge.svelte';
  import Diamond from '$lib/components/userPr/Diamond.svelte';
  let mass = $state(false);

  function massss(event) {
    console.log('here');
    if (event.mass == true) {
      mass = true;
    } else if (event.mass == false) {
      mass = false;
    }
  }
  let messege = $state();
  let spid;
  function delm(event) {
    isOpen = true;
    a = 3;
    const nj = event.nj;
    spid = event.id;
    messege =
      $lang == 'he'
        ? `המשאב ${nj} ימחק האם להמשיך?`
        : `the resource ${nj} will be deleted, do you want to continue?`;
  }
  let miDa = [];
  async function han() {
    a = 2;
    console.log(spid);

    token = page.data.tok;
    let bearer1 = 'bearer' + ' ' + token;
    let linkgra = `${baseUrl}/graphql`;
    try {
      await fetch(linkgra, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation { updateSp(
   id: ${spid}
      data: {
        archived: true
      }
  ) {data {id }}
 } `
        })
      })
        .then((r) => r.json())
        .then((data) => (miDa = data));
      console.log(miDa);
      const tor = miDa.data.updateSp.data.id;
      const oldob = meData.sps.data;
      const x = oldob.map((c) => c.id);
      const indexy = x.indexOf(tor);
      oldob.splice(indexy, 1);
      meData.sps.data = oldob;
      meData = meData;
      a = 0;
      isOpen = false;
    } catch (e) {
      error1 = e;
    }
  }
  //
  $effect(async () => {
    if (page.url.searchParams.has('action')) {
      await tick();
      if (page.url.searchParams.get('action') === 'createproject') {
        const params = page.url.searchParams;
        baciStore.update((s) => ({
          ...s,
          projectName_value: params.get('name') || s.projectName_value,
          desP: params.get('desc') || s.desP,
          desPl: params.get('details') || s.desPl,
          linkP: params.get('url') || s.linkP,
          selected: params.get('vals')
            ? params.get('vals').split(',').filter(Boolean)
            : s.selected,
          restime: params.get('res') || s.restime,
          timeToP: params.get('profit') || s.timeToP,
          ont: params.has('ont') ? params.get('ont') === 'true' : s.ont
        }));
        iwant = false;
        addP = true;
      } else if (page.url.searchParams.get('action') === 'editbasic') {
        isOpen = true;
        a = 1;
      }
    }
  });
  function guid() {
    isG = true;
    run();
  }
  const title = { he: 'פרופיל והגדרות 1💗1', en: '1💗1 profile and settings' };
  const deletew = { he: 'מחיקה', en: 'delete' };
  const om = { he: 'רק רגע בבקשה', en: 'one moment please' };
  const message1 = {
    he: 'לחיצה על הכתר מובילה ללב 1💗1, שם נמצאות ההצעות, ההצבעות והפעולות השונות',
    en: 'click on the crown to move to the heart of 1💗1, there are offers, voting and various actions'
  };
  const levtitle = { he: 'ללב 1💗1', en: 'to the heart of 1💗1' };
  const message2 = {
    he: 'רשימת הכישורים שלך, לחיצה על כפתור העריכה להוספת או הסרת כישורים',
    en: 'list of your skills, press the edit button below to add more skills or to remove some from your list'
  };
  const message3 = {
    he: 'רשימת התפקידים, עריכה להוספת או הסרת תפקידים, יש ללחוץ על כפתור האישור למטה כדי שהעריכה תישמר',
    en: 'youre roles list, after adding or removing remember to press the button below to save your edit'
  };
  const message4 = {
    he: 'רשימת המשאבים שלך (למטה מימין), נציע לך רקמות שנדרשים להן המשאבים שהצעת',
    en: "Bottom right is youre resource list, on the heart you'll get offers from FreeMates who need them"
  };
  const message5 = {
    he: 'רשימת הערכים שלך, אנו נציע לך רקמות שמקדמות ערכים כמו אלו שבחרת',
    en: 'list of your Vallues, we will offer you FreeMates who promoting those vallues'
  };
  const message6 = {
    he: 'רשימת דרכי היצירה שלך (למטה משמאל), אנו נציע לך משימות שעשייתן היא בתנאים שהצבת',
    en: 'Bottom left are your ways of creation list, we will offer you missions that accsept those terms'
  };
  const message7 = {
    he: 'עריכת תמונת הפרופיל',
    en: 'edit your profile picture'
  };
  const message8 = {
    he: ' העלאת תמונת פרופיל חדשה',
    en: 'upload new profile picture'
  };
  const message9 = {
    he: 'רשימת הרקמות שלך, ריקמה היא קבוצה שמשתפת פעולה, לחיצה על שם הריקמה למעבר למוח שלה, המנורה למטה משמשת בכדי ליצור ריקמה חדשה',
    en: 'your FreeMates list, FreeMates is a group who Collaborate, press on FreeMates name to go to her Brain, the lamp bellow is for creating a new FreeMates'
  };
  const myfr = { he: 'הרקמות שלי', en: 'My FreeMates' };
  const crnfr = { he: 'יצירת ריקמה חדשה', en: 'create a new FreeMates' };
  const message10 = {
    he: 'כמה הרווחת עד כה (היהלום למטה במרכז), סכום הכסף הכולל שקיבלת מרקמות מופיע כאן',
    en: 'The Diamond down shows how much you earn from FreeMates so far'
  };
  const sofartit = { he: 'סך הכל הרווחתי', en: 'total earnings' };
  const editbas = {
    he: 'עריכת פרטים בסיסיים והגדרות',
    en: 'Edit Basic Information and Settings'
  };
  const message11 = {
    he: 'עריכת פרטים והגדרות, הפעלת התראות במכשיר, בחירת יום חופשי וביטול הצגת המדריך',
    en: 'edit your info, settings, add device alerts, choosing a free day and cencel guid'
  };
  const cencel = { he: 'ביטול', en: 'cencel' };
  const sk = { he: 'כישורים', en: 'skills' };
  const rl = { he: 'תפקידים', en: 'roles' };
  const ms = { he: 'משאבים', en: 'resources' };
  const ar = { he: 'ערכים', en: 'Vallues' };
  const ww = { he: 'דרכי היצירה', en: 'ways of creation' };
  const plv = { he: 'בחירת ערכים', en: 'choose Vallues' };
  const pls = { he: 'בחירת כישורים', en: 'choose skills' };
  const plm = { he: 'בחירת משאבים', en: 'choose resources' };
  const plw = { he: 'בחירת דרכי יצירה', en: 'choose ways of creation' };
  const plt = { he: 'בחירת תפקידים', en: 'choose roles' };
  let width = $state(),
    height = $state();
  let showSaveDialog = $state(false);
  const dialogHeader = {
    he: 'הצגת מדריך משתמש',
    en: 'Show User Guide'
  };
  const innerText = {
    he: 'האם ברצונך לראות מדריך שימוש ב1💗1? \n (ניתן לבטל או להחזיר את הדו שיח הזה בפעמים הבאות בתפריט ההגדרות) ',
    en: 'Would you like to see the user guide?'
  };
  const innerDialogButton = {
    he: 'אשמח',
    en: 'Yes'
  };
  const clearButton = {
    he: 'לא',
    en: 'No'
  };
</script>

<svelte:head>
  <title>{title[$lang]}</title>
</svelte:head>
{#await meData}
  <div class="body button-gold grid items-center justify-center">
    <Lowding height="30vh" />
  </div>
{:then meData}
  <Dialog
    bind:showSaveDialog
    {dialogHeader}
    {innerText}
    {innerDialogButton}
    {clearButton}
    onSaveTimer={async () => {
      showSaveDialog = false;

      // Update server to mark guide as not viewed (so it can show again)
      try {
        if (page.data.tok) {
          const bearer1 = 'bearer' + ' ' + page.data.tok;
          await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
              Authorization: bearer1,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: `mutation { 
                updateUsersPermissionsUser(
                  id: ${parseInt(idL)}, 
                  data: { profilManualAlready: false }
                ) { 
                  data { id } 
                } 
              }`
            })
          });

          // Set cookie to show guide
          document.cookie = `guidMe=again; expires=${new Date(2027, 0, 1).toUTCString()}; path=/`;
        }
      } catch (e) {
        console.error('Failed to update guide status:', e);
      }

      run();
    }}
    onClearTimer={async () => {
      showSaveDialog = false;
      isG = true; // Mark as viewed without showing

      // Update server to mark guide as viewed
      try {
        if (page.data.tok) {
          const bearer1 = 'bearer' + ' ' + page.data.tok;
          await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
              Authorization: bearer1,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: `mutation { 
                updateUsersPermissionsUser(
                  id: ${parseInt(idL)}, 
                  data: { profilManualAlready: true }
                ) { 
                  data { id } 
                } 
              }`
            })
          });

          // Also set cookie to remember choice
          document.cookie = `guidMe=done; expires=${new Date(2027, 0, 1).toUTCString()}; path=/`;
        }
      } catch (e) {
        console.error('Failed to update guide status:', e);
      }
    }}
  />
  <DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
    <div
      style="z-index: 700;"
      transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}
    >
      <DialogContent aria-label="form" class="content">
        <div
          style="z-index: 400;"
          dir="rtl"
          class="grid items-center justify-center text-center bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"
        >
          <button
            style="margin: 0 auto;"
            class=" hover:bg-barbi text-mturk rounded-full p-2"
            onclick={closer}><Close /></button
          >

          {#if a == 1}
            <EditB
              machshirs={meData?.machshirs.data}
              projectIds={meData.projects_1s.data.map((c) => c.id)}
              isGuidMe={!isG}
              onGuidMeChange={(value) => (isG = !value)}
              checked={cards}
              lango={$lang}
              uid={meDataa.data.me.id}
              {fblink}
              {twiterlink}
              {noMail}
              {discordlink}
              {githublink}
              frd={meData.frd}
              {mail}
              un={meData.username}
              bi={meData.bio}
              onMessage={callbackFunctio}
              onGuid={guid}
            />
          {:else if a == 3}
            <div class="grid items-center text-center justify-center">
              <h3 class="text-barbi">{messege}</h3>
              <button
                class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
                onclick={han}>{deletew[$lang]}</button
              >
            </div>
          {:else if a == 2}
            <div class="sp bg-gold">
              <h3 class="text-barbi">{om[$lang]}</h3>
              <br />
              <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
              ></RingLoader>
            </div>
          {/if}
        </div></DialogContent
      >
    </div>
  </DialogOverlay>
  {#if a == 0 && isOpenM}
    <div class="center-upload">
      <Addnewp onMessage={callbackFunction} current={picLink} />
      <button onclick={closer}>{cencel[$lang]}</button>
    </div>
  {:else if a == 2 && isOpenM}
    <div class="center-upload">
      <h3 class="text-barbi">{om[$lang]}</h3>
      <br />
      <RingLoader size="40" color="#ff00ae" unit="px" duration="2s"
      ></RingLoader>
    </div>
  {/if}
  {#if addP == false}
    <div class="body me-page-bg transition-colors duration-500">
      <!-- כדורים מרחפים ברקע לסימטריה מלאה -->
      <div class="bg-orb bg-orb-tr"></div>
      <div class="bg-orb bg-orb-bl"></div>

      <!-- הכנסת הקומפוננטה החדשה שלנו -->
      <ProfileBadge
        username={meData.username}
        avatarUrl={picLink != null
          ? picLink
          : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
      >
        <!-- Snippet לכתר (יוזרק למעלה) -->
        {#snippet crownContent()}
          <a data-sveltekit-prefetch target="_self" href="/lev">
            <TourItem message={message1[$lang]}>
              <img
                title={levtitle[$lang]}
                class="ceterr name-hover"
                src="https://res.cloudinary.com/love1/image/upload/v1641481504/newC_qq5z3l.svg"
                alt="link to the heart page"
              />
            </TourItem>
          </a>
        {/snippet}

        <!-- Snippet לכפתורים (יוזרקו למטה בצורה סימטרית) -->
        {#snippet buttonsContent()}
          {#if updX == 0 && $uPic}
            <button
              onclick={openen}
              class="hover:bg-gold text-mturk hover:text-barbi rounded-full"
              title={message7[$lang]}
            >
              <TourItem message={message7[$lang]}>
                <svg style="width:32px;height:32px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M11.21 15.83L9.25 13.47L6.5 17H13.12L15.66 14.55L13.96 12.29L11.21 15.83M11 19.9V19.05L11.05 19H5V5H19V11.31L21 9.38V5C21 3.9 20.11 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H11V19.9Z"
                  />
                </svg>
              </TourItem>
            </button>
          {/if}

          {#if a == 0}
            <button
              onclick={basic}
              title={editbas[$lang]}
              class="hover:bg-gold text-mturk hover:text-barbi rounded-full"
            >
              <TourItem message={message11[$lang]}>
                <svg style="width:32px;height:32px" viewBox="0 0 24 24">
                  <path
                    transition:draw|local={{ duration: 1000 }}
                    fill="currentColor"
                    d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z"
                  />
                </svg>
              </TourItem>
            </button>
          {/if}

          <!-- במקרה שאין תמונה וצריך כפתור העלאה ענק -->
          {#if !$uPic && addpic == 0}
            <button
              onclick={openen}
              class="hover:bg-gold text-mturk hover:text-barbi rounded-full"
              title={message8[$lang]}
            >
              <TourItem message={message8[$lang]}>
                <svg style="width:32px;height:32px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M7 19L12 14L13.88 15.88C13.33 16.79 13 17.86 13 19H7M10 10.5C10 9.67 9.33 9 8.5 9S7 9.67 7 10.5 7.67 12 8.5 12 10 11.33 10 10.5M13.09 20H6V4H13V9H18V13.09C18.33 13.04 18.66 13 19 13C19.34 13 19.67 13.04 20 13.09V8L14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H13.81C13.46 21.39 13.21 20.72 13.09 20M18 15V18H15V20H18V23H20V20H23V18H20V15H18Z"
                  />
                </svg>
              </TourItem>
            </button>
          {/if}
        {/snippet}

        {#snippet diamondContent()}
          <!-- עוטפים את היהלום במדריך (TourItem) ומעבירים אליו את הסכום והכותרת -->
          <TourItem message={message10[$lang]}>
            <Diamond
              total={total != null ? total : 0}
              title={sofartit[$lang]}
            />
          </TourItem>
        {/snippet}
      </ProfileBadge>

      <div class="flexi">
        {#if addNs1 == true}
          {#key addSl}
            <div
              class="category-wrapper {current === 'a1'
                ? `selected ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                : ' a1'}"
            >
              <TourItem message={message2[$lang]}>
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl1}
                  meData={odata}
                  {allvn}
                  Valname={sk[$lang]}
                  valc={'skillName'}
                  bind:data={meData.skills.data}
                  datan={'skil'}
                  linkp={'skills'}
                  kish={'skills'}
                  placeholder={pls[$lang]}
                />
              </TourItem>
            </div>
            <div
              class="category-wrapper {current === 'a2'
                ? `selected ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                : ' a2'}"
            >
              <TourItem message={message3[$lang]}>
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl2}
                  meData={odata}
                  {allvn}
                  Valname={rl[$lang]}
                  valc={'roleDescription'}
                  bgi={'pink'}
                  bind:data={meData.tafkidims.data}
                  datan={'taf'}
                  linkp={'tafkidims'}
                  kish={'tafkidims'}
                  placeholder={plt[$lang]}
                />
              </TourItem>
            </div>
            <TourItem message={message4[$lang]}>
              <div
                class="category-wrapper {current === 'a3' && mass !== true
                  ? `selected ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                  : ''}"
                class:a3={current !== 'a3'}
                class:whole={mass === true}
              >
                <Edit
                  {width}
                  onDelm={delm}
                  onMassss={massss}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl3}
                  meData={odata}
                  {allvn}
                  bgi={'indigo'}
                  Valname={ms[$lang]}
                  valc={'name'}
                  bind:data={meData.sps.data}
                  datan={'mash'}
                  linkp={'mashaabims'}
                  kish={'sps'}
                  placeholder={plm[$lang]}
                />
              </div>
            </TourItem>

            <div
              class="category-wrapper {current === 'a4'
                ? `selectedl ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                : ' a4'}"
            >
              <TourItem message={message5[$lang]}>
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl4}
                  meData={odata}
                  {allvn}
                  Valname={ar[$lang]}
                  bgi={'gold'}
                  valc={'valueName'}
                  bind:data={meData.vallues.data}
                  datan={'val'}
                  linkp={'vallues'}
                  kish={'vallues'}
                  placeholder={plv[$lang]}
                />
              </TourItem>
            </div>
            <TourItem message={message6[$lang]}>
              <div
                class="category-wrapper {current === 'a5'
                  ? `selectedl ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                  : ' a5'}"
              >
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl5}
                  meData={odata}
                  {allvn}
                  Valname={ww[$lang]}
                  bgi={'yellow'}
                  valc={'workWayName'}
                  bind:data={meData.work_ways.data}
                  datan={'work'}
                  linkp={'workWays'}
                  kish={'work_ways'}
                  placeholder={plw[$lang]}
                />
              </div>
            </TourItem>
          {/key}
        {/if}
        <!-- או גלילה לעשות רינדור עד מקסימום מסויים  של תפקידים כישורים וכו'ואז ההמשך בהרחבה של זה-->
        <div class="a6">
          <TourItem message={message9[$lang]}>
            <div
              in:fly|local={{ x: -(width / 2), opacity: 0.5 }}
              out:scale|local={{ opacity: 0.5, start: 0.1 }}
              class="another"
              dir="rtl"
            >
              <h2 class="cot">{myfr[$lang]}</h2>
              {#if load == false}
                <div class="inner-scroll d pro">
                  {#each meData.projects_1s.data as data, i}
                    <div class="cont">
                      <button
                        onclick={() => project(data.id)}
                        class="pt drop-shadow-lg"
                      >
                        <div
                          class="cont inline-flex items-center sm:text-xl mt-1 mr-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-br from-mpink via-transparent via-lpink to-barbi"
                        >
                          {data.attributes.projectName}<span
                            style="margin-top: 2px ;"
                            ><Arrow
                              width={width > 640 ? 47.4 : 23.7}
                              height={width > 640 ? 35.7 : 17.85}
                            /></span
                          >
                        </div></button
                      >
                    </div>
                  {/each}
                </div>
              {:else}
                <Lowding height="50px" width="50px" />
              {/if}

              <button
                aria-label={crnfr[$lang]}
                style="z-index: 7;"
                class=" hover:scale-150"
                onclick={() => {
                  iwant = false;
                  addP = true;
                }}
                title={crnfr[$lang]}
              >
                <CrNewProject />
              </button>
            </div>
          </TourItem>
        </div>
      </div>
    </div>
  {:else if addP == true}
    <button
      title={cencel[$lang]}
      onclick={() => (addP = false)}
      style="margin: 0 auto;"
      class=" hover:bg-barbi text-barbi hover:text-gold font-bold p-0.5 rounded-full"
      ><Close /></button
    >
    <Addnew userName_value={meData.username} />
  {/if}
  <!-- המשימות שסיימתי-->
{/await}

<style>
  .center-upload {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9;
    background: white;
    border-radius: 1em;
    box-shadow: 0 0 20px #0002;
    padding: 2em;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pro {
    max-height: 15vh;
    overflow-y: scroll;
  }

  :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
    width: 80vw;
    padding: 0px;
  }
  .whole {
    position: absolute;
    top: 0;
    left: 0;
    min-width: 99.9vw;
    min-height: 100vh;
    z-index: 4;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
    background-repeat: no-repeat;
    background-size: cover;
  }

  .n {
    cursor:
      url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg),
      auto;
  }

  .n:hover:before {
    transform: scale(1.2);
    box-shadow: 0 0 15px #d35400;
    filter: blur(3px);
  }

  .n:hover {
    color: #ffa502;
    box-shadow: 0 0 15px #d35400;
    text-shadow: 0 0 15px #d35400;
  }
  .cot {
    color: var(--barbi-pink);
    margin: 0 auto;
    padding: 0;
    text-shadow: 1px 1px #feeb02;
  }
  .pt {
    color: #9900cd;
    text-shadow: 1px 1px aqua;
    font-size: 13px;
    text-align: start;
  }
  .pt:hover {
    color: #574010;
    text-shadow: 1px 1px var(--gold);
  }
  .cont {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .cont > span {
    display: none;
    transition: all 0.5;
  }
  .cont:hover > span {
    display: inline;
  }
  .sp {
    display: grid;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 528px) {
    :global([data-svelte-dialog-overlay].content) {
      z-index: 700;
      width: 80vw;
    }
    .cont {
      white-space: none;
      line-height: 1;
      font-size: 13px;
    }
    .sv {
      width: 8px;
      height: 8px;
    }
    .cot {
      font-size: 10px;
    }
    .pt {
      font-size: 13px;
    }
    .pro {
      max-height: 15vh;
      overflow-y: scroll;
    }
    .another {
      max-height: 25vh;
      min-height: 25vh;
      max-width: 27vw;
      min-width: 27vw;
    }
  }

  .ceterr {
    height: 12vh;
    width: auto;
    margin: 0 auto;
  }

  @media (min-width: 529px) {
    .d::-webkit-scrollbar {
      width: 12px;
    }

    .sv {
      width: 13px;
      height: 13px;
    }
    .cot {
      font-size: 17px;
    }
    .pt {
      font-size: 13px;
    }
  }
  @media (min-width: 892px) {
    :global([data-svelte-dialog-overlay].content) {
      z-index: 700;
      width: 50vw;
    }
  }
  @media (min-height: 500px) {
    .ceterr {
      height: 12vh;
      width: auto;
      margin: 0 auto;
    }
  }

  @media (min-height: 500px) and (min-width: 520px) {
    .ceterr {
      height: 10vh;
      width: auto;
      margin: 0 auto;
    }
  }

  :global([data-svelte-dialog-content].content) {
    padding: 0px;
    margin: auto auto;
  }
  :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
    width: 80vw;
    margin: auto auto;
  }
  :global(data-svelte-dialog-overlay) {
    z-index: 700;
    width: 50vw;
  }
  .a1 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 17%;
    left: 80%;
    overflow: visible;
    transition: all 1s;
  }
  .a2 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 46%;
    left: 86%;
    overflow: visible;
  }
  .a3 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 76%;
    left: 80%;
    overflow: visible;
  }
  .a6 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 17%;
    left: 20%;
    overflow: visible;
  }
  .a4 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 46%;
    left: 14%;
    overflow: visible;
  }
  .a5 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 76%;
    left: 20%;
    overflow: visible;
  }
  @media (min-width: 348px) {
    .a2 {
      left: 80%;
    }
    .a4 {
      left: 20%;
    }
  }
  .selected {
    z-index: 77;

    position: fixed;
    top: 0;
    right: 0;
    padding: 2rem 8px 0.6rem;
    border-left: 1px solid #aaa;
    overflow-y: auto;
    overflow-x: auto;
    width: 230px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
    background-position: right center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  .selectedl {
    z-index: 77;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
    background-position: left center;
    background-repeat: no-repeat;
    background-size: cover;
    position: fixed;
    top: 0;
    left: 0;
    padding: 5rem 1rem 0.6rem;
    overflow-y: scroll;
    overflow-x: auto;

    width: 17rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  @media (min-width: 720px) {
    .selected,
    .selectedl {
      width: 30vw;
    }
  }

  .body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    padding-bottom: 10vh;
  }

  .me-page-bg {
    position: relative;
    overflow: hidden;
    background: radial-gradient(
      circle at bottom center,
      var(--gold) 0%,
      #fdfbfb 70%
    );
    transition: background 0.5s ease;
  }

  :global(.dark) .me-page-bg {
    background: radial-gradient(
      circle at bottom center,
      rgba(212, 175, 55, 0.15) 0%,
      #0f172a 70%
    );
  }

  /* כדורים מרחפים ברקע למראה פרימיום */
  /* ::before = פינה שמאל-עליון (ורוד), ::after = פינה ימין-תחתון (זהב) */
  .me-page-bg::before,
  .me-page-bg::after {
    content: '';
    position: absolute;
    width: 60vw;
    height: 60vw;
    border-radius: 50%;
    filter: blur(40px);
    z-index: 1;
    opacity: 0.6;
    pointer-events: none;
    animation: orb-float 25s infinite alternate ease-in-out;
  }

  /* פינה שמאל-עליון */
  .me-page-bg::before {
    background: radial-gradient(
      circle,
      var(--barbi-pink, #ff0092) 0%,
      transparent 20%
    );
    top: -20%;
    left: -15%;
  }

  /* פינה ימין-תחתון — מקביל לשמאל-עליון */
  .me-page-bg::after {
    background: radial-gradient(
      circle,
      var(--barbi-pink, #ff0092) 0%,
      transparent 20%
    );
    bottom: -20%;
    right: -15%;
  }

  /* כדורים סימטריים נוספים: ימין-עליון ושמאל-תחתון */
  .bg-orb {
    position: absolute;
    width: 50vw;
    height: 50vw;
    border-radius: 50%;
    filter: blur(40px);
    z-index: 1;
    opacity: 0.5;
    pointer-events: none;
  }

  /* פינה ימין-עליון */
  .bg-orb-tr {
    background: radial-gradient(
      circle,
      hsla(210, 100%, 65%, 0.8) 0%,
      transparent 60%
    );
    top: -15%;
    right: -10%;
    animation: orb-float 28s infinite alternate ease-in-out;
    animation-delay: -6s;
  }

  /* פינה שמאל-תחתון — מקביל לימין-עליון */
  .bg-orb-bl {
    background: radial-gradient(
      circle,
      hsla(280, 100%, 65%, 0.7) 0%,
      transparent 60%
    );
    bottom: -15%;
    left: -10%;
    animation: orb-float 30s infinite alternate-reverse ease-in-out;
    animation-delay: -18s;
  }

  @keyframes orb-float {
    0% {
      transform: translate(0, 0) scale(1) rotate(0deg);
    }
    33% {
      transform: translate(15%, 15%) scale(1.15) rotate(10deg);
    }
    66% {
      transform: translate(-10%, 15%) scale(0.85) rotate(-10deg);
    }
    100% {
      transform: translate(10%, -10%) scale(1.05) rotate(5deg);
    }
  }

  /* שיפור למכלים שיהיו Glassmorphic */
  .another {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .another {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .another {
    padding: 0.6em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    z-index: -1;
    height: 28vh;
    width: 27vw;
    overflow: visible;
  }

  .inner-scroll {
    max-height: 20vh;
    width: 100%;
    overflow-y: auto;
  }

  .cot {
    color: var(--barbi-pink);
    margin-top: 0.2em;
    margin-bottom: 0.2em;
    padding: 0;
    text-shadow: 1px 1px #feeb02;
    line-height: 1.1;
  }

  .by {
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Anonymous Pro', 'Monospace';
    font-size: 30px;
  }

  @-moz-keyframes spin {
    100% {
      -moz-transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
    }
  }
  @keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
</style>
