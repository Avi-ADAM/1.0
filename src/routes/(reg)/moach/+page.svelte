<script>
  // import Scab from '$lib/celim/moach/scad.svelte'
  //   import Siduri from '$lib/celim/moach/siduri.svelte'
  //   import Taskk from '$lib/celim/moach/taskkk.svelte'
  import { mi, role, ww, skil } from '$lib/components/prPr/mi.js';
  import Tile from '$lib/celim/tile.svelte';
  import { Confetti } from 'svelte-confetti';
  const baseUrl = import.meta.env.VITE_URL;
  import pkg from 'lodash';
  const {isEqual} = pkg;
  import Bethas from '$lib/components/prPr/bethas.svelte';
  import Sidur from '$lib/components/prPr/sidur/sidur.svelte';
  import { toast } from 'svelte-sonner';
  import Pub from '$lib/celim/icons/pub.svelte';
  //	import { draw } from 'svelte/transition';
  import Close from '$lib/celim/close.svelte';
  import Gantt from '$lib/components/prPr/gantt/gant.svelte';
  import Header from '$lib/components/header/header.svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';
  import Uplad from '$lib/components/userPr/uploadPic.svelte';
  import axios from 'axios';
  import Editb from '$lib/components/prPr/editp.svelte';
  import Hand from '$lib/components/prPr/hand.svelte';
  import Handd from '$lib/components/prPr/handd.svelte';
  import Mashman from '$lib/components/prPr/mashmam.svelte';
  import Hamatanot from '$lib/components/prPr/hamatanot.svelte';
  import { idPr } from '$lib/stores/idPr.js';
  // import { idM } from '../../lib/stores/idM.js';
  import Mission from '$lib/components/prPr/mission.svelte';
  import ChoosMission from '$lib/components/prPr/choosMission.svelte';
  import ChoosNeed from '$lib/components/prPr/chosNed.svelte';
  import TotalNeeds from '$lib/components/prPr/totalNeeds.svelte';
  //import { total } from '$lib/stores/total.js';
  //   import { beforeUpdate, tick } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import OpenM from '$lib/components/prPr/newOpn.svelte';
  import PendsM from '$lib/components/prPr/pendsM.svelte';
  import Betaha from '$lib/components/prPr/betaha.svelte';
  import Fini from '$lib/components/prPr/fini.svelte';
  import Hach from '$lib/components/prPr/hachcal.svelte';
  import Finisin from '$lib/components/prPr/finisin.svelte';

  //import { validate_component } from 'svelte/internal';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import Sheirut from '$lib/components/prPr/sheirut.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Diun from '$lib/components/lev/diun.svelte';
  import { forum, initialForum, isChatOpen, updSend, nowChatId, newChat } from '$lib/stores/pendMisMes';
  import {SendTo} from '$lib/send/sendTo.svelte';
  let idL;
  let success = $state(false);
  let isOpen = $state(false);
  let a = $state(0);
  let fmiData = $state([]);
  let tahaS = $state(false);
  let bmiData = $state([]);
  let mission1 = $state([]);
  let dow = $state();
  let cow = $state();
  let hosaf = $state();
  let error2 = null;
  async function findM() {
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
    let bearer1 = 'bearer' + ' ' + token;
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };
    let linkg = baseUrl + '/graphql';
    try {
      await fetch(linkg, {
        method: 'POST',

        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `{  missions {data{id attributes{
                           missionName
                            } }}}`
        })
      })
        .then((r) => r.json())
        .then((data) => (mission1 = data.data.missions.data));
      console.log(mission1);
    } catch (e) {
      console.log(e);
    }
  }
  let bmimData = $state([]);
  let addN = $state(false);
  let addM = $state(false);
  let hosafa = {
    he: 'הוספת פעולות נדרשות לריקמה',
    en: 'add needed missions to FreeMates'
  };
  let hosafat = {
    he: 'הוספת משאבים נדרשים לריקמה',
    en: 'add needed resources to FreeMates'
  };
  let cencel = { he: 'ביטול', en: 'cencel' };
  let showvd = $state(false);

  let totalneed = $state(false);
  // total.subscribe(newwork => {
  //  totalneed = newwork;
  //  });
  let error1 = null;
  let srcP = $state();
  let desP = $state();
  let projectname = $state();
  let token;
  let linkP = $state(),
    githublink = $state(),
    fblink = $state(),
    discordlink = $state(),
    drivelink = $state(),
    twiterlink = $state(),
    watsapplink = $state();
    let errorM = $state(false);
  
    let noneti = $state("");
  
  let newcontent = true;
  let newcontentR = true;
  let newcontentW = true;
  let descPri;
  let omiData = $state([]);
  let pmiData = $state([]);
  let project = $state([]);
  let projectUsers = $state([]);
  let vallues = $state([]);
  let ata = [];
  let restime = $state();
  let valit = $state();
  let user = [];
  let rikmashes = $state([]);
  let lll = $state();
  let opmash = $state([]);
  let actdata = [];
  let noofopenm = $state(0);
  let salee = $state([]);
  let trili = $state([]);
  let projects = $state(prog());
  let meData = $state(start());
  let alit = $state([]);
  //sale {id in}
  async function start() {
    if ($idPr !== 0) {
      // ולידציה שהיוזר חבר ברקמה
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jwt='))
        .split('=')[1];
      const cookieValueId = document.cookie
        .split('; ')
        .find((row) => row.startsWith('id='))
        .split('=')[1];
      let idL = cookieValueId;
      let token = cookieValue;
      let bearer1 = 'bearer' + ' ' + token;
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
        const res = await fetch(baseUrl + '/graphql', {
          //+ $idPr
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `{project(id:"${$idPr}"){data { attributes{
            projectName 
             user_1s { data{id}}}}}
            me{id}}
              `
          })
        })
          .then(checkStatus)
          .then(parseJSON);
               errorM = false

        ata = res.data.project.data.attributes;
        console.log(res);
        const users = ata.user_1s.data;
        const x = users.map((c) => c.id);
        if (x.includes(res.data.me.id)) {
          //me from server

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
            const res = await fetch(baseUrl + '/graphql', {
              //+ $idPr
              method: 'POST',
              headers: {
                Authorization: bearer1,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: `
        {project(id:${$idPr}){ data{attributes{
            tosplits (filters: { finished: { eq: false } }){data{attributes{  prectentage vots {what users_permissions_user {data{ id}}}}}}
            projectName
            descripFor
            publicDescription
             acts{data{id attributes{shem
               tafkidims {data{ id attributes{ roleDescription ${
                $lang == 'he'
                  ? 'localizations{data {attributes{ roleDescription}} }'
                  : ''
              } }}}
                  isAssigned
                open_mission{data{id attributes {name}}}
                pendm{data{id attributes{name}}}
                 dateS naasa my{data{ id attributes{ username profilePic {data{attributes{ url }}}}}} des dateF vali{data{id attributes{ username profilePic {data{attributes{ url }}}}}} myIshur valiIshur status mesimabetahaliches{data{id 
                  attributes{name forums{data{id}}}}}}}}
            sheiruts{data{ id attributes{name descrip equaliSplited oneTime isApruved}}}
            sales {data{ id attributes{ in date matanot {data{id attributes{ name }}} users_permissions_user {data{ id attributes{ username}}}}}}
            matanotofs {data{ id attributes{ name price quant kindOf }}}
            finnished_missions {data{ id attributes{ missionName start finish mesimabetahalich {data{attributes{ createdAt}}} createdAt why total descrip hearotMeyuchadot noofhours perhour users_permissions_user {data{ id attributes{ username}}}}}}
            rikmashes{data{ id attributes{ name kindOf total hm price agprice sp { data{id} } spnot users_permissions_user {data{ id attributes {username}}}}}}
             user_1s {data{ id attributes{email noMail lang username profilePic {data{attributes{ url formats}}}}}}
            mesimabetahaliches (filters:{finnished:{eq: false}}) {data{
             id attributes{ status  iskvua 
                          forums{data{id}}
              acts{data{id attributes{shem dateS naasa my{data{ id attributes{ username profilePic {data{attributes{ url }}}}}}
               des dateF vali{data{id}} myIshur valiIshur status mesimabetahaliches{data{id}}}}}
                tafkidims {data{ id attributes{ roleDescription ${
                  $lang == 'he'
                    ? 'localizations{data {attributes{ roleDescription}} }'
                    : ''
                } }}}
             admaticedai  createdAt hearotMeyuchadot howmanyhoursalready name descrip hoursassinged perhour privatlinks publicklinks 
             users_permissions_user {data{ id attributes{ username profilePic {data{attributes{ url }}}}}}}}}
            open_missions (filters:{archived:{eq: false }}) {data{  id attributes{ name hearotMeyuchadot descrip noofhours perhour sqadualed
                                    privatlinks publicklinks
                                    acts{data{id attributes{shem dateS}}}
                                    rishon {data{ id}}
                                    skills {data{ id attributes{ skillName ${
                                      $lang == 'he'
                                        ? 'localizations{data {attributes{ skillName}} }'
                                        : ''
                                    } }}}
                                    tafkidims {data{ id attributes{ roleDescription ${
                                      $lang == 'he'
                                        ? 'localizations{data {attributes{ roleDescription}} }'
                                        : ''
                                    }}}}
                                    work_ways {data{ id attributes{ workWayName ${
                                      $lang == 'he'
                                        ? 'localizations{data {attributes{ workWayName}} }'
                                        : ''
                                    } } }}
                                    mission {data{ id}}
                                    createdAt
  } }}
                        open_mashaabims (filters: {archived:{eq: false }}){data{id attributes{ kindOf hm descrip price easy name spnot sqadualed sqadualedf }}}
             pendms (filters: {archived:{eq: false }}) {data{id attributes{createdAt dates name hearotMeyuchadot descrip noofhours perhour sqadualed
                                    privatlinks publicklinks
                                    rishon {data{ id}}
                                    skills {data{ id attributes{ skillName ${
                                      $lang == 'he'
                                        ? 'localizations{data {attributes{ skillName}} }'
                                        : ''
                                    } }}}
                                    tafkidims {data{ id attributes{ roleDescription ${
                                      $lang == 'he'
                                        ? 'localizations{data {attributes{ roleDescription}} }'
                                        : ''
                                    }}}}
                                    work_ways {data{ id attributes{ workWayName  ${
                                      $lang == 'he'
                                        ? 'localizations{data {attributes{ workWayName}} }'
                                        : ''
                                    }} }}
                                    mission {data{ id}}
                                    
                                    users  {what why id users_permissions_user {data{ id}} }}}}
            vallues {data{ id attributes { valueName ${
              $lang == 'he'
                ? 'localizations{data {attributes{ valueName}} }'
                : ''
            }}}}
            linkToWebsite
            profilePic {data{attributes{ url  formats }}}
            restime githublink fblink discordlink drivelink twiterlink watsapplink
  } }}
        me{id}}
          `
              })
            })
              .then(checkStatus)
              .then(parseJSON);
            console.log(res);
            if(res.data){
                errorM = false

            meData = res.data.project.data.attributes;
            console.log("ACTS",meData.acts)
            project = res.data.project.data.attributes;
            projectname = res.data.project.data.attributes.projectName;
            desP = project.publicDescription;
            linkP = res.data.project.data.attributes.linkToWebsite;
            descPri = meData.descripFor;
            descripFor = meData.descripFor;
            projectUsers = project.user_1s.data;
            restime = project.restime;
            if (project.mesimabetahaliches.data.length > 0) {
              bmiData = project.mesimabetahaliches.data;
            } else if (project.mesimabetahaliches.data.length == null) {
              bmiData.push(project.mesimabetahaliches.data);
            }
            if (project.sales.data.length > 0) {
              salee = project.sales.data;
            } else if (project.sales.data.length == null) {
              salee.push(project.sales.data);
            }
            salee = salee;
            if (project.matanotofs?.data?.length > 0) {
              bmimData = project.matanotofs.data;
            } else if (project.matanotofs?.data?.length == null) {
              if (project.matanotofs?.data == null) {
                //bmimData.push([]);
              } else {
                bmimData.push(project.matanotofs.data);
              }
            }
            console.log(project);
            if (project.open_mashaabims.data.length > 0) {
              opmash = project.open_mashaabims.data;
            } else if (project.open_mashaabims.data.length == null) {
              opmash.push(project.open_mashaabims.data);
            }
            if (project.finnished_missions.data.length > 0) {
              fmiData = project.finnished_missions.data;
            } else if (project.finnished_missions.data.length == null) {
              fmiData.push(project.finnished_missions.data);
            }
            if (project.rikmashes.data.length > 0) {
              rikmashes = project.rikmashes.data;
            } else if (project.rikmashes.data.length == null) {
              rikmashes.push(project.rikmashes.data);
            }
            rikmashes = rikmashes;
            //  if (project.open_missions.length > 1){
            bmimData = bmimData;

            omiData = project.open_missions.data;
            //  } else if (project.open_missions.length == null){
            //  omiData.push(project.open_missions);
            //  }
            if (project.pendms.data.length > 0) {
              pmiData = project.pendms.data;
            } else if (project.pendms.data.length == null) {
              pmiData.push(project.pendms.data);
            }
            //    omiData = omiData;
            pmiData = pmiData;
            bmiData = bmiData;
            vallues = project.vallues.data;
            if ($lang == 'he') {
              for (let i = 0; i < vallues.length; i++) {
                if (vallues[i].attributes.localizations.data.length > 0) {
                  vallues[i].attributes.valueName =
                    vallues[
                      i
                    ].attributes.localizations.data[0].attributes.valueName;
                }
              }
            }
            valit = vallues.map((c) => c.attributes.valueName);
            alit = vallues.map((c) => c.id);
            linkP = meData.linkToWebsite;
            githublink = meData.githubLink;
            fblink = meData.fblink;
            discordlink = meData.discordLink;
            drivelink = meData.drivelink;
            twiterlink = meData.twiterLink;
            watsapplink = meData.watsapplink;
            noofopenm = opmash.length;
            noofopen = project.open_missions.data.length;
            if (project.profilePic.data !== null) {
              srcP = project.profilePic.data.attributes.url;
            }
            trili = meData.tosplits.data;
            // pre(projectUsers, fmiData)
          }else{
            if(res.error && res.error.status == 401)
            goto("/login?from=moach")
          }
          } catch (e) {
            error1 = e;
            console.log(error1);
          }
        } else {
          goto('/');
        }
      } catch (e) {
        error1 = e;
        console.log(error1);
         if(e == "TypeError: Failed to fetch"){
          const nonet = {"he":"נראה שאין חיבור לאינטרנט, כדאי לנסות שוב","en":"no internet connection, try again"}
                   errorM = true
                  noneti = `${nonet[$lang]}`

              }
      }
      return meData;
    }
  }
  async function prog() {
    if ($idPr == 0) {
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
      let bearer1 = 'bearer' + ' ' + token;
      const parseJSON = (resp) => (resp.json ? resp.json() : resp);
      const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      let linkg = baseUrl + '/graphql';
      try {
        await fetch(linkg, {
          method: 'POST',

          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `{  usersPermissionsUser (id:${idL}) {data{ attributes{
                            projects_1s {data {id attributes{ projectName }}}
                            } }}}`
          })
        })
          .then((r) => r.json())
          .then((data) => (user = data));
          if(user.data){
               errorM = false
        console.log(user);
        if (user.errors) {
          if (user.errors[0].message === 'Invalid token.') {
                goto("/login?from=moach");
          }
        }
        projects =
          user.data.usersPermissionsUser.data.attributes.projects_1s.data;
      }else{
         if(user.error && user.error.status == 401)
            goto("/login?from=moach")
      }
      } catch (e) {
        console.log(e);
        if(e == "TypeError: Failed to fetch"){
          const nonet = {"he":"נראה שאין חיבור לאינטרנט, כדאי לנסות שוב","en":"no internet connection, try again"}
          errorM = true
          noneti =`${nonet[$lang]}`
          console.log(noneti)
          return []
              }
      }
      return projects;
    }
  }

  let li = [];
  let miData = $state([]);
  let blabla = $state([]);
  let load = $state(false);
  async function callbackFunction(event) {
    if (event.detail.type == 'add') {
      cow.scrollIntoView(true);
      load = true;
      const lim = event.detail.li;
      if (lim.length > 0 || lim > 0) {
        //showvd = false;
        if ($mi.length == 0) {
          addM = false;
          li = event.detail.li;
          await findiM().then();
          load = false;
          showvd = true;
          blabla = event.detail.bla;
          addM = true;
          cow.scrollIntoView(true);
        } else {
          addM = false;
          let alrIds = $mi.map((c) => c.id);
          let chooseIds = event.detail.li;
          li = chooseIds.filter((el) => !alrIds.includes(el));
          await findiM().then();
          load = false;
          showvd = true;
          blabla = event.detail.bla;
          addM = true;
          cow.scrollIntoView(true);
        }
      }
    } else {
      if ($mi.length > 0) {
        miData = $mi;

        blabla = miData.map((c) => c.attributes.missionName);
        console.log(blabla, miData);
      } else {
        miData = [];
        blabla = [];
        showvd = false;
      }
    }
  }
  async function findiM() {
    let res = [];
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };
    let linkg = baseUrl + '/graphql';
    try {
      await fetch(linkg, {
        method: 'POST',

        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `{  missions (filters:{id: {in:[${li}]}}){data{ id attributes{
          descrip missionName 
          skills {data{ id attributes{ skillName ${
            $lang == 'he' ? 'localizations{data {attributes{ skillName}} }' : ''
          } }}}
          tafkidims {data{ id attributes{ roleDescription ${
            $lang == 'he'
              ? 'localizations{data {attributes{ roleDescription}} }'
              : ''
          }}}}
          work_ways {data{ id attributes{ workWayName ${
            $lang == 'he'
              ? 'localizations{data {attributes{ workWayName}} }'
              : ''
          } } }}
        } }}}`
        })
      })
        .then((r) => r.json())
        .then((data) => (res = data));
      let miDatal = res.data.missions.data;
      for (let z = 0; z < miDatal.length; z++) {
        let skills2 = miDatal[z].attributes.skills.data;
        if ($lang == 'he') {
          for (let i = 0; i < skills2.length; i++) {
            if (skills2[i].attributes.localizations.data.length > 0) {
              skills2[i].attributes.skillName =
                skills2[
                  i
                ].attributes.localizations.data[0].attributes.skillName;
            }
          }
        }
        miDatal[z].attributes.skills.data = skills2;
        let roles = miDatal[z].attributes.tafkidims.data;
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
        miDatal[z].attributes.tafkidims.data = roles;
        let workways2 = miDatal[z].attributes.work_ways.data;
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
        miDatal[z].attributes.work_ways.data = workways2;
      }
      const merged = [...miDatal, ...$mi];
      miData = merged;
    } catch (e) {
      console.log(e);
    }
  }

  let error8;
  let roles = [];
  let skills2 = [];

  let workways2 = [];
  
 

  async function hosa() {
    addM = true;
    await findM().then();
    hosaf.scrollIntoView(true);
  }

  async function removeF(event) {
    let miDatanew = event.detail.data;
    const y = miDatanew.map((c) => c.id);
    const id = event.detail.id;
    const index = y.indexOf(id);
    if (index > -1) {
      miDatanew.splice(index, 1);
    }
    if (miDatanew.length > 0) {
      miData = miDatanew;
      mi.set(miData);
      blabla = miData.map((c) => c.attributes.missionName);
      console.log(blabla, miData);
    } else {
      miData = miDatanew;
      blabla = miData.map((c) => c.attributes.missionName);
      showvd = false;
    }
  }

  function closeM() {
    addM = false;
    showvd = false;
    blabla = [];
  }

  let descripFor = $state();

 
  let openMA = $state(false);
  let cencel1 = { he: 'סגירה', en: 'close' };

  let openMS = $state(false);
  const fnnn = { he: 'המשימה נשלחה בהצלחה', en: 'mission has sent ' };
  function close() {
    showvd = false;
    addM = false;
    blabla = [];
    success = true;
    mi.set([]);
    setTimeout(function () {
      success = false;
      start();
    }, 15000);
    toast.success(`${fnnn[$lang]}`);
  }
  let meDatamm = $state([]);
  async function updi() {
    let res = [];
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };
    let linkg = baseUrl + '/graphql';
    try {
      await fetch(linkg, {
        method: 'POST',

        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `{  mashaabims (filters:{id: {in:[${needr}]}}){data{ id attributes{
          name descrip kindOf  price linkto 
        } }}}`
        })
      })
        .then((r) => r.json())
        .then((data) => (res = data));
      meDatamm = res.data.mashaabims.data;
      console.log(meDatamm);
    } catch (e) {
      console.log(e);
    }
  }

  function clo() {
    totalneed = false;
    addN = false;
    meDatamm = [];
    needr = [];
    toast.success(cloma[$lang]);
  }
  let noofopen = $state(2);

  let pendS = $state(false);
  let hovered = $state(false);
  let hoveredd = $state(false);

  function bighand() {
    hovered = !hovered;
  }
  function bighandd() {
    hoveredd = !hoveredd;
  }
  function addp() {
    if (projectUsers.length == 1) {
      a = 0;
      isOpen = true;
    } else {
      toast.success(tovote[$lang]);
      a = 0;
      isOpen = true;
    }
    //if project users more then 1
  }
  const tovote = {
    he: 'התמונה שתיבחר תועלה להצבעה ולאחר אישורה תחליף את הקיימת',
    en: 'the Logo you choose will be waiting for the approval of all FreeMates members'
  };
  const toalart = {
    he: 'בריקמה עם מס חברים גדול מ-1 יש צורך בהסכמה של כולם, מערכת ההצבעות משתחררת בקרוב ודרכה ניתן יהיה לשנות',
    en: 'if number of users in freemates is greater than 1 you need everyone to agree, this feature will be released soon'
  };

  function editp() {
    if (projectUsers.length == 1) {
      a = 0;
      isOpen = true;
    } else {
      toast.success(`${tovote[$lang]}`);
      a = 0;
      isOpen = true;
    }
    //if project users more then 1
  }
  function editb() {
    //if project users more then 1
    if (projectUsers.length == 1) {
      a = 1;
      isOpen = true;
    } else {
      alert(toalart[$lang]);
    }
  }

  const closer = () => {
    isOpen = false;
    a = 0;
  };
  let files;
  function basic() {
    isOpen = true;
    a = 1;
  }
  function allbackFunction(event) {
    a = 2;
    files = event.detail.files;
    sendP();
  }
  let url1 = baseUrl + '/api/upload';
  let meDatap = [];
  let mecata = [];
  async function sendP() {
    let d = new Date();
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
    let bearer1 = 'bearer' + ' ' + token;
    let linkdi = baseUrl + '/api/projects/' + $idPr;
    //  let fd = new FormData();
    //   fd.append('files', files[0]);
    axios
      .post(url1, files, {
        headers: {
          Authorization: bearer1
        }
      })
      .then(({ data }) => {
        const imageId = data[0].id;
        if (projectUsers.length == 1) {
          axios
            .put(
              linkdi,
              {
                profilePic: imageId
              },
              {
                headers: {
                  Authorization: bearer1
                }
              }
            )
            .then((response) => {
              meDatap = response.data;
              srcP = meDatap.profilePic.formats.thumbnail.url;
              srcP = meDatap.profilePic.formats.small.url;
              srcP = meDatap.profilePic.url;
              isOpen = false;
              a = 0;
              toast.success(`${picupsu[$lang]}`);
            })
            .catch((error) => {
              console.log('צריך לתקן:', error.response);
              if (error.response != undefined) {
                a = 3;
              }
            });
        } else {
          let linkg = baseUrl + '/graphql';
          try {
            fetch(linkg, {
              method: 'POST',

              headers: {
                Authorization: bearer1,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: ` mutation { createDecision(
       data: {
        projects: ${$idPr},
                publishedAt: "${d.toISOString()}",
         newpic: ${imageId},
        kind: pic,
          vots: [
        {what: true,
        users_permissions_user: ${idL}
        }
      ]
    }
  ){
         data{
              id 
          }
  }
 }`
              })
            })
              .then((r) => r.json())
              .then((data) => (meDatap = data));
            isOpen = false;
            a = 0;
            toast.success(`${picvots[$lang]}`);
          } catch (e) {
            console.log(e);
          }
        }
      });
  }
  const cloma = {
    he: 'יצירת המשאב הושלמה בהצלחה',
    en: 'new need has created successfully'
  };
  const editfix = {
    he: 'המידע עודכן בהצלחה!',
    en: 'info has updated successfully'
  };
  const picupsu = {
    he: 'הלוגו עודכן בהצלחה',
    en: 'Logo has updated successfully'
  };
  const picvots = {
    he: 'הלוגו הועלה להצבעה בהצלחה',
    en: 'vote on new Logo has created successfully'
  };
  async function updete(event) {
    console.log(event.detail.valit);
    a = 2;
    let counter = false;
    let projectnamei = ``;
    let despi = ``;
    let linkPii = ``;
    let desPlii = ``;
    let valluesii = ``;
    let restimeii = ``;
    let githublinkii = ``;
    let fblinkii = ``;
    let discordlinkii = ``;
    let drivelinkii = ``;
    let twiterlinkii = ``;
    let watsapplinkii = ``;
    if (event.detail.projectName_value != projectname) {
      projectnamei = `projectName: "${event.detail.projectName_value}",`;
      counter = true;
    }
    if (event.detail.desP != desP && event.detail.desP != null) {
      despi = `publicDescription: "${event.detail.desP}",`;
      counter = true;
    }
    if (event.detail.linkP != linkP && event.detail.linkP != null) {
      linkPii = `linkToWebsite: "${event.detail.linkP}",`;
      counter = true;
    }
    if (event.detail.desPl != descripFor && event.detail.desPl != null) {
      desPlii = `descripFor: "${event.detail.desPl}",`;
      counter = true;
    }
    const x = event.detail.valit.sort(function (a, b) {
      return a - b;
    });
    const y = alit.sort(function (a, b) {
      return a - b;
    });
    if (!isEqual(x, y)) {
      valluesii = `vallues: [${event.detail.valit}],`;
      counter = true;
    } //array
    if (event.detail.restime != restime && event.detail.restime != null) {
      restimeii = `restime: ${event.detail.restime},`;
      counter = true;
    }
    if (
      event.detail.githublink != githublink &&
      event.detail.githublink != null
    ) {
      githublinkii = `githublink: "${event.detail.githublink}",`;
      counter = true;
    }
    if (event.detail.fblink != fblink && event.detail.fblink != null) {
      fblinkii = `fblink: "${event.detail.fblink}",`;
      counter = true;
    }
    if (
      event.detail.discordlink != discordlink &&
      event.detail.discordlink != null
    ) {
      discordlinkii = `discordlink: "${event.detail.discordlink}",`;
      counter = true;
    }
    if (event.detail.drivelink != drivelink && event.detail.drivelink != null) {
      drivelinkii = `drivelink: "${event.detail.drivelink}",`;
      counter = true;
    }
    if (
      event.detail.twiterlink != projectname &&
      event.detail.twiterlink != null
    ) {
      twiterlinkii = `twiterlink: "${event.detail.twiterlink}",`;
      counter = true;
    }
    if (
      event.detail.watsapplink != watsapplink &&
      event.detail.watsapplink != null
    ) {
      watsapplinkii = `watsapplink: "${event.detail.watsapplink}",`;
      counter = true;
    }
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
    let bearer1 = 'bearer' + ' ' + token;
    let linkg = baseUrl + '/graphql';
    try {
      await fetch(linkg, {
        method: 'POST',

        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: ` mutation { updateProject(
     id: ${$idPr}
       data: {
        ${projectnamei}
        ${despi}
        ${linkPii}
        ${desPlii}
        ${valluesii}
        ${restimeii}
        ${githublinkii}
         ${fblinkii} 
         ${discordlinkii}
         ${drivelinkii}
         ${twiterlinkii}
         ${watsapplinkii}
       }
    
  ){
         data{attributes{
           linkToWebsite descripFor projectName publicDescription restime 
           githublink fblink discordlink drivelink twiterlink watsapplink vallues {data{ attributes{ valueName ${
             $lang == 'he' ? 'localizations{data{attributes{valueName }}}' : ''
           }}}}
          }}}
  }
 `
        })
      })
        .then((r) => r.json())
        .then((data) => (mecata = data));
      mecata = mecata.data.updateProject.data.attributes;
      console.log(mecata);
      projectname = mecata.projectName;
      desP = mecata.publicDescription;
      restime = mecata.restime;
      vallues = mecata.vallues.data;
      if ($lang == 'he') {
        for (let i = 0; i < vallues.length; i++) {
          if (vallues[i].attributes.localizations.data.length > 0) {
            vallues[i].attributes.valueName =
              vallues[i].attributes.localizations.data[0].attributes.valueName;
          }
        }
      }
      valit = vallues.map((c) => c.attributes.valueName);
      alit = vallues.map((c) => c.id);
      linkP = mecata.linkToWebsite;
      githublink = mecata.githubLink;
      fblink = mecata.fblink;
      discordlink = mecata.discordLink;
      drivelink = mecata.drivelink;
      twiterlink = mecata.twiterLink;
      watsapplink = mecata.watsapplink;
      descripFor = mecata.descripFor;
      isOpen = false;
      a = 0;
      toast.success(`${editfix[$lang]}`);
    } catch (e) {
      console.log(e);
      if (e.response != undefined) {
        a = 3;
      }
    }
  }

  async function projectn(id) {
    idPr.set(id);
    goto('/moach');
    meData = await start();
  }
  let needr = $state([]);
  let loadr = $state(false);
  async function needad(event) {
    const x = event.detail.x;
    if (x.length > 0 || x > 0) {
      dow.scrollIntoView(true);
      loadr = true;
      needr = x;
      totalneed = false;
      await updi().then();
      loadr = false;
      totalneed = true;
      dow.scrollIntoView(true);
    }
  }
  async function needadm(event) {
    const x = event.detail.x;
    const y = event.detail.scob;
    if (x.length > 0 || x > 0) {
      dow.scrollIntoView(true);
      loadr = true;
      needr.push(x);
      needr = needr;
      totalneed = false;
      await updi().then();
      loadr = false;
      totalneed = true;
      dow.scrollIntoView(true);
    } else {
      totalneed = false;
    }
  }

  async function wdwd(event) {
    const miDatanew = event.detail.data;
    const y = miDatanew.map((c) => c.id);
    const id = event.detail.id;
    const index = y.indexOf(id);
    if (index > -1) {
      miDatanew.splice(index, 1);
    }
    if (miDatanew.length > 0) {
      totalneed = false;
      meDatamm = miDatanew;
      needr = meDatamm.map((c) => c.id);
      totalneed = true;
    } else {
      totalneed = false;
    }
  }
  let hal = $state(false);
  function trym() {
    openMS = true;
  }
  function tryma() {
    openMA = true;
  }
  let fff = $state();
  async function masi() {
    addN = true;
    loadr = true;
    //if (addN == true)
    //	fff.scrollIntoView(true);
  }

  function titlel(event) {
    ti = event.detail.ti;
  }
  let who = $state();
  function openTheDesc(event) {
    const id = event.detail.id;
    const is = id[0].model.classes;
    who = Math.floor(id[0].model.id);
    console.log(id[0].model.classes, Math.floor(id[0].model.id));
    if (is == 'green') {
      isOpen = true;
      a = 4;
    } else if (is == 'blue') {
      isOpen = true;
      a = 5;
    } else if (is == 'orange') {
      isOpen = true;
      a = 6;
    } else if (is == 'pink') {
      isOpen = true;
      a = 7;
    }
  }
  function openDescrip(event) {
    const id = event.detail.id;
    const is = event.detail.kind;
    who = id
    if (is == 'pendm') {
      isOpen = true;
      a = 4;
    } else if (is == 'betha') {
      isOpen = true;
      a = 5;
    } else if (is == 'openM') {
      isOpen = true;
      a = 6;
    }else if(is == "assign"){
      isOpen = true;
      a = 9
    }
  }
  let hover = false;
  let bmiss = $state();
  let pendss = $state();
  let openss = $state();
  let finiss = $state();
  let hagdel = $state(false);
  function topends() {
    pendS = true;
    pendss.scrollIntoView(true);
  }
  function toopens() {
    openMS = true;
    openss.scrollIntoView(true);
  }
  function tobetha() {
    tahaS = true;
    bmiss.scrollIntoView(true);
  }
  function tofinish() {
    hagdel = true;
    tab = 8
    finiss.scrollIntoView(true);
  }
  const title = { he: 'מוח הריקמה 1💗1', en: '1💗1 FreeMates Brain' };
  const mwa = { he: 'פעולות ממתינות לאישור', en: 'panding missions' };
  const errmsg = { he: ' אירעה שגיאה', en: 'error' };
  const editpic = {
    he: 'עריכת תמונת הפרופיל של הריקמה',
    en: 'edit FreeMates logo'
  };
  const upload = {
    he: 'העלאת תמונת פרופיל לריקמה',
    en: 'upload logo for your FreeMates'
  };
  const editd = { he: 'עריכת פרטי ריקמה', en: 'edit FreeMates details' };
  const publicp = {
    he: 'לעמוד הציבורי של הריקמה',
    en: 'view FreeMates public page'
  };
  const tower = { he: 'לינק לאתר', en: 'link to website' };
  const sidd = { he: 'סידור משמרות', en: 'shifts sqadual' };
  const gann = { he: 'לוח המשימות שלנו ', en: 'our mission board' };
  const bet = { he: 'משימות בתהליך ביצוע', en: 'mission in progress' };
  const towel = {
    he: 'לינק לגוגל דרייב המשותף',
    en: 'link to a shared Google Drive'
  };
  const githublinkde = {
    he: 'לינק לגיטהב של הריקמה',
    en: 'link to the FreeMates GitHub'
  };
  const fblinkde = {
    he: 'לינק לפייסבוק של הריקמה',
    en: 'link to the FreeMates Facebook'
  };
  const discordlinkde = {
    he: 'לינק לדיסקורד של הריקמה',
    en: 'link to the FreeMates Discord'
  };
  const twiterlinkde = {
    he: 'לינק לטוויטר של הריקמה',
    en: 'link to the FreeMates twitter'
  };
  const watsapplinkde = {
    he: 'לינק לווטסאפ של הריקמה',
    en: 'link to the FreeMates WhatsApp'
  };
  const vap = { he: 'ערכים ומטרות', en: 'vallues and objectives' };
  const opmi = { he: 'משימות פנויות', en: "open mission's" };
  const noopen = {
    he: 'אין פעולות פתוחות לריקמה זו, מומלץ ליצור כבר עכשיו',
    en: ''
  };
  const neww = {
    he:"יצירה",
    en:"add"
  }
  const mechirot ={
    he:"מכירות",
    en:"sales"
  }
  const haluka = {
    he:"חלוקה",
    en:"spliting"
  }
  const shirutims ={
    he:"שירותים",
    en:"services"
  }
  const actL = {
    he:"פעולות",
    en:"todo"
  }

  const maini = {he: "ראשי", en:"main"}
  const choo = { he: 'בחירת ריקמה', en: 'choose FreeMate' };
  let sid = false;
  let gan = false;
  let bett = false;
    let width = $state(0);
  
  let chatId = $state();
  let newID;
  let smalldes;
  let nameChatPartner;
  let clicked = $state(false);
  
  let ani;
  let isNew = false
      const er = {"he": "אם הבעיה נמשכת baruch@1lev1.com שגיאה יש לנסות שנית, ניתן ליצור קשר במייל ","en":"error: please try again, if the problem continue contact at baruch@1lev1.com"}

  const messs = {"he":"הודעתך נשלחה בהצלחה","en":"your message was send succsefully"}
     
    let unsubscribe;

    function subs() {
        unsubscribe = newChat.subscribe(value => {
            if (value.created == true) {
                addTo();
            }
        });
    }
    import { onDestroy } from 'svelte';
  import ActsTable from '$lib/components/prPr/tasks/actsTable.svelte';
  import ChooseM from '$lib/components/prPr/tasks/chooseM.svelte';

    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    function addTo() {
      
        let oldbmiData = bmiData
        let bmiDataSp = oldbmiData.findIndex(obj=> obj.id == $newChat.id)
        if(bmiDataSp !== -1){
            oldbmiData[bmiDataSp].attributes.forums = {data:[{id:id}]}
            bmiData = oldbmiData
            bmiData = bmiData
            console.log(bmiData)
             if (unsubscribe) {
            unsubscribe();
        }
            }
              }
  


  async function afreact(e) {
    const m = e.detail.why
    console.log(m)
    let da = new Date
    if(isNew == true){
      let queFor = `mutation { createForum(
       data: {
        project:"${$idPr}",
        mesimabetahaliches:"${newID}",
        publishedAt:"${da.toISOString()}"
       }
        ){data{id}}
      }`
     let d = await SendTo(queFor).then(d=> d = d.data)
     if(d != null){
      const forumId = d.createForum.data.id
      createMes(forumId,m)
     }else{
      console.error(d)
      toast.warning(`${er[$lang]}`);
     }
    }else{
     createMes(chatId,m)
    }

  }

async function createMes(id,mes){
       const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
      idL = cookieValueId;
      let da = new Date()
      let queFor = `mutation { createMessage(
       data: {
        forum:"${id}",
        users_permissions_user:"${idL}",
        when:"${da.toISOString()}",
        publishedAt:"${da.toISOString()}",
        content:"""${mes}"""
       }
        ){data{id}}
      }`
     let d = await SendTo(queFor).then(d=> d = d.data)
     if(d != null){
      if(isNew == true){
        //update bmidata, 
        updSend(0,0)
        let oldbmiData = bmiData
        let bmiDataSp = oldbmiData.findIndex(obj=> obj.id == newID)
        if(bmiDataSp !== -1){
            oldbmiData[bmiDataSp].attributes.forums = {data:[{id:id}]}
            bmiData = oldbmiData
            bmiData = bmiData
            console.log(bmiData)
        }else{
          console.error(1570)
        }
        chatId = id
        //inititate with new id
              initialForum(false,[chatId],idL)
      }else{
      //message sended
      updSend(chatId,0)
      }
      clicked = false
      console.log(clicked,"sdfaw")
      toast.success(`${messs[$lang]}`);
     }else{
      console.error(d)
      toast.warning(`${er[$lang]}`);
     }
  }
  function openChat(e) {
     isNew = e.detail.isNew;
     console.log(e)
    if (isNew == false) {
      $nowChatId = e.detail.id
      $isChatOpen = true
      /*
       initialForum(false,[e.detail.id],idL)
      chatId = e.detail.id;
      smalldes = e.detail.smalldes;
      nameChatPartner = e.detail.nameChatPartner[$lang];*/
      //TODO: meanwhile show loading on chat
    } else {
      $newChat = {
          started:true,
          created: false,
          id: 0,
          md: { mbId:e.detail.id, pid:$idPr}
            }
      let tempF = $forum
      tempF[-1] = {
        loading: false,
        messages:[],
        md:{
          projectName:projectname,
          projectPic:srcP,
          mesimaName:e.detail.smalldes
        }
      };
      forum.set(tempF)
      nowChatId.set(-1)
      $isChatOpen = true
      subs()
      console.log($nowChatId)
      /*newID = e.detail.id
      smalldes = e.detail.smalldes;
      nameChatPartner = e.detail.nameChatPartner[$lang];
      clicked = false;
    ani = 'forum';
    a = 8;
    isOpen = true;*/
    }

    
  }
  function forums(dat) {
    let oldForums = $forum;
    //check for is forum by id if not cr
    for (let index = 0; index < dat.data.length; index++) {
      const element = dat.data[index];
      if (element.attributes.forums != null) {
        for (let t = 0; t < element.attributes.forums.data.length; t++) {
          const elementt = element.attributes.forums.data[t];
          if (elementt.id in oldForums) {
            //check lenght = lenght
          } else {
            //oldForums[]
          }
        }
      }
    }
    function addMes() {
      let arr = [];
      let datan
      arr.push({
        message:
          datan.data.attributes.diun[datan.data.attributes.diun.length - 1].why,
        what: datan.data.attributes.diun[datan.data.attributes.diun.length - 1]
          .what,
        pic: src22,
        sentByMe:
          datan.data.attributes.diun[datan.data.attributes.diun.length - 1]
            .ide === idL
            ? true
            : false,
        timestamp: new Date(
          datan.data.attributes.diun[datan.data.attributes.diun.length - 1].zman
        )
      });

      arr = arr;
    }
    let old = $forum;
    old[arr1[index].pendId] = arr;
    pendMisMes.set(forums);
    localStorage.setItem('pendMisMes', JSON.stringify($forum));
  }
  let tab = $state(1);
  
const mesimaBetaHe = {"he":"פעולות בתהליך ביצוע","en":"missions in progress"}
function add(event){
  console.log(event.detail)
}
</script>

<svelte:head>
  <title>{title[$lang]}</title>
  <link
    rel="preload"
    as="image"
    href="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg"
  />
  <link
    rel="preload"
    as="image"
    href=" https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg"
  />
</svelte:head>
<div class="alli bg-[radial-gradient(circle_at_45%,theme(colors.slate.400),theme(colors.slate.500)_10%,theme(colors.slate.600)_20%,theme(colors.slate.800),theme(colors.slate.900),theme(colors.black))]"></div>
  {#key errorM}
        {#if errorM != false}
      <h2   class="absolute bg-barbi text-gold py-3 px-6 rounded-sm bottom-6 -translate-x-1/2 left-1/2 ">{noneti}</h2>
    {/if}
    {/key}
{#if $idPr}
  {#await meData}
    <div class="alli grid items-center justify-center">
      <!---  <RingLoader size="260" color="#FF0092" unit="px" duration="2s"></RingLoader>-->
      <Lowding />
    </div>
  {:then meData}
    <!--   <Tooltip title="{ti}" >-->
    <DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
      <div
        style="z-index: 700;"
        transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}
      >
        <DialogContent aria-label="form" class="{a != 8 ? a != 5 ? "content" : "betha" :"chat"}">
          <div style="z-index: 400;"      dir="{$lang == "he" ? "rtl" : "ltr"}"
          >
            <button
              class=" hover:bg-barbi text-mturk rounded-full"
              onclick={closer}
              title={cencel1[$lang]}><Close /></button
            >
            {#if a == 0}
              <Uplad on:message={allbackFunction} />
            {:else if a == 1}
              <Editb
                on:message={updete}
                selected={valit}
                {githublink}
                {fblink}
                {discordlink}
                {drivelink}
                {twiterlink}
                {watsapplink}
                {restime}
                {desP}
                projectName_value={projectname}
                desPl={descripFor}
                {linkP}
              />
            {:else if a == 2}
              <div class="sp bg-gold">
                <Lowding />
              </div>
            {:else if a == 3}
              <h1>{errmsg[$lang]}</h1>
              <button
                class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full"
                onclick={() => (a = 0)}>לנסות שוב</button
              >
            {:else if a == 4}
              <PendsM {who} {pmiData} user_1s={projectUsers.length} />
            {:else if a == 5}
              <Betaha {who} {bmiData} />
            {:else if a == 6}
              <OpenM {who} projectName={projectname} {omiData} />
            {:else if a == 7}
              <Finisin {who} {fmiData} />
            {:else if a === 8}
            {#key clicked}
              <Diun
                rikmaName={projectname}
                on:rect={afreact}
                {smalldes}
                {nameChatPartner}
                mypos={true}
                {clicked}
                pendId={chatId}
                rect={true}
                profilePicChatPartner={srcP}
                {ani}
              />
              {/key}
            {:else if a === 9}
            <span class="text-gold">
            </span>
            <ChooseM {bmiData} taskId={who} on:close={closer}/>
            {/if}
          </div></DialogContent
        >
      </div>
    </DialogOverlay>
  
    <!--{#if idUst.map(c => c.id) == idUsl} 
בנוסף במקרה של רענון יעלם האידי של הרקמה
לכן לוודא שיש ערכים ואם לא לתת אפשרות לבחור רקמה או להחזיר לדף הבית-->

    <div
      dir="{$lang == "he" ? "rtl" : "ltr"}"
      bind:clientWidth={width}
      class="all text-barbi text-center overflow-y-auto min-h-screen scroll-smooth d"
      style="-webkit-scrollbar:0px;"
    >
      <Header />
    
      {#if success}
        <div
          style="
position: fixed;
top: -50px;
left: 0;
height: 100vh;
width: 100vw;
display: flex;
justify-content: center;
overflow: hidden;
pointer-events: none;"
        >
          <Confetti
            rounded
            size="30"
            x={[-5, 5]}
            y={[-5, 5]}
            delay={[0, 50]}
            amount="200"
            duration="10000"
            colorArray={[
              'url(https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png)'
            ]}
            fallDistance="100vh"
          /><!--colorRange={[0, 120]}-->
          <Confetti
            noGravity
            x={[-5, 5]}
            y={[-5, 5]}
            delay={[550, 550]}
            duration="10000"
            amount="2000"
            colorRange={[120, 240]}
            fallDistance="100vh"
          />
          <Confetti
            noGravity
            x={[-5, 5]}
            y={[-5, 5]}
            delay={[1000, 1050]}
            duration="10000"
            amount="200"
            colorRange={[240, 360]}
            fallDistance="100vh"
          />
          <Confetti
            x={[-5, 5]}
            y={[0, 0.1]}
            delay={[500, 2000]}
            duration="5000"
            amount="200"
          />
        </div>
      {/if}
      <div>
        {#if srcP !== null}
          <img
            width="100"
            height="100"
            style="border-radius: 50%; margin-right:auto; margin-left:auto ;"
            src={srcP}
            alt="profilePic"
          />
        {/if}
        <div class="flex flex-row items-center justify-center">
          {#if srcP !== null}
            <button
              class="text-barbi hover:bg-barbi hover:text-mturk rounded-full"
              title={editpic[$lang]}
              onclick={editp}
              ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M11.21 15.83L9.25 13.47L6.5 17H13.12L15.66 14.55L13.96 12.29L11.21 15.83M11 19.9V19.05L11.05 19H5V5H19V11.31L21 9.38V5C21 3.9 20.11 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H11V19.9Z"
                />
              </svg>
            </button>
          {:else}
            <button
              class="bg-barbi hover:bg-mturk text-barbi rounded-full"
              title={upload[$lang]}
              onclick={addp}
            >
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7 19L12 14L13.88 15.88C13.33 16.79 13 17.86 13 19H7M10 10.5C10 9.67 9.33 9 8.5 9S7 9.67 7 10.5 7.67 12 8.5 12 10 11.33 10 10.5M13.09 20H6V4H13V9H18V13.09C18.33 13.04 18.66 13 19 13C19.34 13 19.67 13.04 20 13.09V8L14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H13.81C13.46 21.39 13.21 20.72 13.09 20M18 15V18H15V20H18V23H20V20H23V18H20V15H18Z"
                />
              </svg>
            </button>
          {/if}
          <button
            class=" hover:bg-mturk text-barbi rounded-full"
            title={editd[$lang]}
            onclick={editb}
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z"
              />
            </svg>
          </button>
          <!--change to modal with the project component-->
          {#if discordlink}
            <a
              rel="noreferrer"
              target="_blank"
              href={discordlink}
              class=" hover:bg-mturk text-barbi rounded-full"
              title={discordlinkde[$lang]}
            >
              <img
                style="width:24px;height:24px"
                src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg"
                alt="Discord"
              />
            </a>
          {/if}
          {#if linkP}
            <a
              rel="noreferrer"
              target="_blank"
              href={linkP}
              class=" hover:bg-mturk text-barbi rounded-full"
              title={tower[$lang]}
            >
              <svg
                class="sv"
                style="width:24px;height:24px"
                xmlns="http://www.w3.org/2000/svg"
                fill-rule="evenodd"
                clip-rule="evenodd"
                ><path
                  fill="currentColor"
                  d="M14.851 11.923c-.179-.641-.521-1.246-1.025-1.749-1.562-1.562-4.095-1.563-5.657 0l-4.998 4.998c-1.562 1.563-1.563 4.095 0 5.657 1.562 1.563 4.096 1.561 5.656 0l3.842-3.841.333.009c.404 0 .802-.04 1.189-.117l-4.657 4.656c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-1.952-1.951-1.952-5.12 0-7.071l4.998-4.998c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464.493.493.861 1.063 1.105 1.672l-.787.784zm-5.703.147c.178.643.521 1.25 1.026 1.756 1.562 1.563 4.096 1.561 5.656 0l4.999-4.998c1.563-1.562 1.563-4.095 0-5.657-1.562-1.562-4.095-1.563-5.657 0l-3.841 3.841-.333-.009c-.404 0-.802.04-1.189.117l4.656-4.656c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464 1.951 1.951 1.951 5.119 0 7.071l-4.999 4.998c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-.494-.495-.863-1.067-1.107-1.678l.788-.785z"
                /></svg
              >
            </a>
          {/if}
          {#if drivelink}
            <a
              rel="noreferrer"
              target="_blank"
              href={drivelink}
              class=" hover:bg-mturk text-barbi rounded-full"
              title={towel[$lang]}
            >
              <img
                style="width:24px;height:24px"
                src="https://res.cloudinary.com/love1/image/upload/v1662560567/icon-google-drive-new_jxv2oz.avif"
                alt="Google Drive"
              />
            </a>
          {/if}
          {#if twiterlink}
            <a
              rel="noreferrer"
              target="_blank"
              href={twiterlink}
              class=" hover:bg-white text-barbi rounded-full"
              title={twiterlinkde[$lang]}
            >
              <img
                style="width:24px;height:24px"
                src="https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg"
                alt="Twitter"
              />
            </a>
          {/if}
          {#if watsapplink}
            <a
              rel="noreferrer"
              target="_blank"
              href={watsapplink}
              class=" hover:bg-white text-barbi rounded-full"
              title={watsapplinkde[$lang]}
            >
              <img
                style="width:24px;height:24px"
                src="https://tochat.be/whatsapp-icon-white.png"
                alt="WhatsApp"
              />
            </a>
          {/if}
          {#if githublink}
            <a
              rel="noreferrer"
              target="_blank"
              href={githublink}
              class=" hover:bg-white text-barbi rounded-full"
              title={githublinkde[$lang]}
            >
              <img
                style="width:24px;height:24px"
                src="https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg"
                alt="GitHub"
              />
            </a>
          {/if}
          {#if fblink}
            <a
              rel="noreferrer"
              target="_blank"
              href={fblink}
              class=" hover:bg-white text-barbi rounded-full"
              title={fblinkde[$lang]}
            >
              <img
                style="width:24px;height:24px"
                src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png"
                alt="Facebook"
              />
            </a>
          {/if}
          <button
            class=" hover:bg-white text-barbi rounded-full"
            title={publicp[$lang]}
            onclick={goto(`/project/${$idPr}`)}
          >
            <Pub />
          </button>
        </div>
        <h1 class="1">{projectname}</h1>
        <div       dir="{$lang == "he" ? "rtl" : "ltr"}"
        class="flex items-center justify-center">
          <div       dir="{$lang == "he" ? "rtl" : "ltr"}"
          class="flex -space-x-2 ">
            {#each projectUsers as user}
              <button
                title={user.attributes.username}
                onclick={() => goto(`/user/${user.id}`)}
                ><img
                  class="inline-block h-8 w-8 rounded-full ring-2 ring-gold"
                  src={user.attributes.profilePic.data != null
                    ? user.attributes.profilePic.data.attributes.url
                    : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
                  alt=""
                /></button
              >
              <!--{#if hover}
    <h6 class="textlink hover:text-scale-150 hover:text-gold"></h6>
    {/if}-->
            {/each}
          </div>
        </div>
<!--tab header-->
   <nav class="flex justify-center bg- max-w-screen flex-wrap overflow-x-auto d py-0.5 ">
                  <button
                onclick={() => (tab = 1)}
                class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold  {tab == 1 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                title={maini[$lang]}
                ><div
                  class="flex flex-col items-center justify-center align-middle"
                >
                  <h2 style="{tab == 1 ? "": "text-shadow:1px 1px #fff ;"}">
                    {maini[$lang]}
                  </h2>
                  <!--<Scab/>-->
                </div></button
              >
              <button
                onclick={() => (tab = 2)}
                class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold {tab == 2 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                title={neww[$lang]}
                ><div
                  class="flex flex-col items-center justify-center align-middle"
                >
                  <h2 style="{tab == 2 ? "": "text-shadow:1px 1px #fff ;"}">
                    {neww[$lang]}
                  </h2>
                  <!--<Scab/>-->
                </div></button
              >
              <button
                onclick={() => (tab = 3)}
                class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold {tab == 3 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                title={gann[$lang]}
                ><div
                  class="flex flex-col items-center justify-center align-middle"
                >
                  <h2 style="{tab == 3 ? "": "text-shadow:1px 1px #fff ;"}">
                    {gann[$lang]}
                  </h2>
                  <!--<Scab/>-->
                </div></button
              >
              <button
                onclick={() => (tab = 4)}
                class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi  hover:bg-gold {tab == 4 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                title={haluka[$lang]}
                ><div
                  class="flex flex-col items-center justify-center align-middle"
                >
                  <h2 style="{tab == 4 ? "": "text-shadow:1px 1px #fff ;"}">
                    {haluka[$lang]}
                  </h2>
                  <!--<Siduri/>-->
                </div></button
              >
            {#if bmiData.length > 0}
                <button
                  onclick={() => (tab = 5)}
                class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold {tab == 5 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                  title={bet[$lang]}
                  ><div
                    class="flex flex-col items-center justify-center align-middle"
                  >
                  <h2 style="{tab == 5 ? "": "text-shadow:1px 1px #fff ;"}">
                      {bet[$lang]}
                    </h2>
                    <!--<Taskk/>-->
                  </div></button
                >
            {/if}
            {#if meData?.acts.data.length > 0}
            <button
            onclick={() => (tab = 9)}
            class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi  hover:bg-gold {tab == 9 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
            title={actL[$lang]}
            ><div
              class="flex flex-col items-center justify-center align-middle"
            >
              <h2 style="{tab == 9 ? "": "text-shadow:1px 1px #fff ;"}">
                {actL[$lang]}
              </h2>
            </div></button
          >
            {/if}
             <button
                onclick={() => (tab = 6)}
                class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold {tab == 6 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                title={shirutims[$lang]}
                ><div
                  class="flex flex-col items-center justify-center align-middle"
                >
                  <h2 style="{tab == 6 ? "": "text-shadow:1px 1px #fff ;"}">
                    {shirutims[$lang]}
                  </h2>
                  <!--<Siduri/>-->
                </div></button
              >
               <button
                onclick={() => (tab = 7)}
                class="hover:border  hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold {tab == 7 ? "bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-gold" : "bg-gradient-to-r from-gra via-grb  to-gre text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                title={mechirot[$lang]}
                ><div
                  class="flex flex-col items-center justify-center align-middle"
                >
                  <h2 style="{tab == 7 ? "": "text-shadow:1px 1px #fff ;"}">
                    {mechirot[$lang]}
                  </h2>
                  <!--<Siduri/>-->
                </div></button
              >
               <button
                onclick={() => (tab = 8)}
                class="hover:border hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold  {tab == 8 ? "bg-gradient-to-r from-barbi via-fuchsia-400 to-mpink text-gold " : " bg-gradient-to-r from-gra via-grb  to-grc text-barbi"} px-4 py-2 drop-shadow-lg shadow-gold"
                title={sidd[$lang]}
                ><div
                  class="flex flex-col items-center justify-center align-middle"
                >
                  <h2 style="{tab == 8 ? "": "text-shadow:1px 1px #fff ;"}">
                    {sidd[$lang]}
                  </h2>
                  <!--<Siduri/>-->
                </div></button
              >
              </nav>
<!--tabs-->
<div class="border-t-2 border-mturk">
{#if tab === 1}
        {#if project.publicDescription != 'undefined' && project.publicDescription != null}
            <!----<pre style="overflow-y:auto;  white-space: pre-wrap;" class="2 d max-h-24 p-2">{desP}</pre>-->
            <RichText editable={false} outpot={project?.publicDescription} />
        {/if}
        {#if project.descripFor != 'undefined' && project.descripFor != null}
            <RichText editable={false} outpot={project?.descripFor} />
            <!---- <pre style="overflow-y:auto; white-space: pre-wrap;" class="2 d max-h-24 p-2 ">{descripFor}</pre>-->
        {/if}

        <div>
          {#if vallues.length > 0}
            <h2 class="text-sm text-barbi">{vap[$lang]}</h2>
            <div
              class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2"
            >
              {#each vallues as vallue}<p class="m-0" style="text-shadow:none;">
                  <Tile
                    bg="gold"
                    sm={width > 500 ? true : false}
                    big={width > 500 ? true : false}
                    word={vallue.attributes.valueName}
                  />
                </p>{/each}
            </div>{/if}
            </div>
{:else if tab == 2}            
          <!--
  <div>
 <Fini users={projectUsers} {fmiData}/></div>-->

          <div class=" hhh">
            {#if hovered}
              <button onclick={hosa} onmouseleave={bighand}
                ><img
                  title={hosafa[$lang]}
                  style="max-width:45vw; max-height:45vw;"
                  width="240px"
                  height="240px"
                  src="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg"
                  alt="cheked"
                /></button
              >
            {:else}
              <Hand
                on:hosa={hosa}
                on:progres={bighand}
                on:trym={trym}
                {noofopen}
                {openMS}
                {addM}
                hosafa={hosafa[$lang]}
              />
            {/if}
            {#if hoveredd}
              <button onclick={masi} onmouseleave={bighandd}
                ><img
                  title={hosafat[$lang]}
                  style="max-width:45vw; max-height:45vw;"
                  width="240px"
                  height="240px"
                  src="https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg"
                  alt="cheked"
                /></button
              >
            {:else}
              <Handd
                on:trym={tryma}
                on:masi={masi}
                on:bighandd={bighandd}
                {noofopenm}
                {openMA}
                {addN}
                hosafat={hosafat[$lang]}
              />
            {/if}

            <!--{#if gan == false}
<button on:click={()=>gan = true} class="border mx-2  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre px-2 drop-shadow-lg shadow-gold"title={gann[$lang]}><div class="flex flex-col items-center justify-center align-middle"><p style="text-shadow:1px 1px var(--gold) ;">{gann[$lang]}</p><Scab/></div></button>
{/if}

{#if sid == false}
<button on:click={()=>sid = true} class="border mx-2  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre px-2 drop-shadow-lg shadow-gold"  title={sidd[$lang]}><div class="flex flex-col items-center justify-center align-middle"><p style="text-shadow:1px 1px var(--gold) ;">{sidd[$lang]}</p><Siduri/></div></button>
{/if}
{#if bmiData.length > 0 }
<br> <br>
{#if bett == false}
<button on:click={()=>bett = true} class="border mx-2  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre px-2 drop-shadow-lg shadow-gold" title={bet[$lang]}><div class="flex flex-col items-center justify-center align-middle"><p style="text-shadow:1px 1px var(--gold) ;">{bet[$lang]}</p><Taskk/></div></button>
{/if}
{/if}
-->
          </div>
  
            <!-- כפתור שרק איתו יש את האפשרות כנ"ל על משאבים
  כן להוסיף סקשן שמראה את שלל סוגי המשימות בדיפולט
כולל לפי יוזרים וכו-->

            <div>
              {#if addM === true}
                <div
                  bind:this={hosaf}
                  class=" m-4 border-2 border-barbi rounded"
                >
                  <button
                    title={cencel[$lang]}
                    onclick={closeM}
                    class=" hover:bg-barbi text-barbi hover:text-gold font-bold p-0.5 rounded-full"
                    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                      />
                    </svg></button
                  >
                  <ChoosMission
                    {roles}
                    {mission1}
                    bind:selected={blabla}
                    on:message={callbackFunction}
                    on:add={add}
                    on:close={close}
                    pn={projectname}
                    pl={srcP}
                    {restime}
                    {projectUsers}
                    {alit}
                  />
                </div>
              {/if}
            </div>

          <div bind:this={cow}>
            {#if load === true}
              <div
                class="grid justify-center items-center border-2 border-barbi rounded p-4"
              >
                <Lowding />
              </div>
            {/if}
            {#if showvd == true}
              {#key miData}
                <Mission
                  pn={projectname}
                  pl={srcP}
                  {restime}
                  {newcontent}
                  {newcontentR}
                  {newcontentW}
                  pu={projectUsers}
                  userslength={projectUsers.length}
                  vallues={alit}
                  {miData}
                  projectId={$idPr}
                  on:remove={removeF}
                  on:close={close}
                />
              {/key}
            {/if}
          </div>

          <div class=" m-4" bind:this={dow}>
            {#if addN == true}
              <div
                bind:this={fff}
                id="hosafn"
                class="m-4 border-2 border-barbi rounded"
              >
                <button
                  title={cencel[$lang]}
                  onclick={() => (addN = false)}
                  class=" hover:bg-barbi text-barbi hover:text-gold font-bold py-0.5 rounded-full"
                  ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                    />
                  </svg></button
                >
                <ChoosNeed
                  on:str={() => (loadr = false)}
                  on:add={needad}
                  on:addm={needadm}
                  selectedi={needr}
                />
              </div>
            {/if}

            <div class=" m-4" bind:this={lll}>
              {#if loadr === true}
                <div
                  class="grid justify-center items-center border-2 border-barbi rounded p-4"
                >
                  <Lowding />
                </div>
              {/if}
              {#if totalneed === true}
                <TotalNeeds
                  pn={projectname}
                  pl={srcP}
                  {restime}
                  pu={projectUsers}
                  projectId={$idPr}
                  userslength={projectUsers.length}
                  {needr}
                  meData={meDatamm}
                  on:close={clo}
                  on:remove={wdwd}
                />{/if}
            </div>
          </div>
{:else if tab == 3}          
          <div      dir="{$lang == "he" ? "rtl" : "ltr"}"
          class="pt-2">
          
              {#if pmiData.length > 0}
                <button
                  class="border sm:text-2xl border-barbi hover:border-gold hover:bg-gradient-to-br bg-pinki hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold px-4 rounded"
                  onclick={topends}>{mwa[$lang]}</button
                >
              {/if}

              {#if omiData.length > 0}
                <button
                  class="border sm:text-2xl border-barbi hover:border-gold hover:bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre bg-oranges text-pinki hover:text-barbi font-bold px-4 rounded"
                  onclick={toopens}>{opmi[$lang]}</button
                >
              {/if}
              {#if bmiData.length > 0}
                <button
                  class="border sm:text-2xl border-barbi hover:border-gold hover:bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre bg-blueg text-barbi hover:text-barbi font-bold px-4 rounded"
                  onclick={tobetha}
                >{mesimaBetaHe[$lang]}</button
                >
              {/if}
              {#if fmiData.length > 0}
                <button
                  class="border sm:text-2xl border-barbi hover:border-gold hover:bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre bg-mpink text-pinki hover:text-barbi font-bold px-4 rounded"
                  onclick={tofinish}
                >
                  פעולות שהסתיימו</button
                >
              {/if}
              <div
              dir="{$lang == "he" ? "rtl" : "ltr"}"

                style="width: 95vw; margin: 20px auto; max-height: 88vh; overflow-y: auto; overflow-x: auto; "
                class="d bg-wow"
              >
                <Gantt
                  {bmiData}
                  {pmiData}
                  {omiData}
                  {fmiData}
                  on:selected={openTheDesc}
                />
              </div>
              </div>
{:else if tab === 4}
         <div class=" p-2">
            
            {#if fmiData.length > 0 || rikmashes.length > 0}
              <div
                class="m-4 border-2 border-barbi rounded p-4"
                bind:this={finiss}
              >
                <Fini
                  {fmiData}
                  {hagdel}
                  users={projectUsers}
                  {rikmashes}
                  on:tit={titlel}
                />
                <br />
                {#if hal === false}
                  <button
                    onclick={() => (hal = true)}
                    class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
                  >
                    חישוב רווח בגירסה ראשונית
                  </button>
                {:else if hal === true}
                  <button
                    title={cencel[$lang]}
                    onclick={() => (hal = false)}
                    class=" hover:bg-barbi text-barbi hover:text-gold font-bold py-0.5 rounded-full"
                    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                      />
                    </svg></button
                  >

                  <Hach
                    meData={rikmashes}
                    {fmiData}
                    users={projectUsers}
                    {rikmashes}
                  />
                {/if}
              </div>
            {/if}
          </div>
{:else if tab === 5}
              <div
              dir="{$lang == "he" ? "rtl" : "ltr"}"
              class="rounded-lg"
                style=" margin: 20px auto;  overflow-x: auto; background: linear-gradient(to right, #25c481, #25b7c4);background: -webkit-linear-gradient(left, #25c481, #25b7c4); "
              >
            
                <Bethas {bmiData} on:chat={openChat} />
              </div>
{:else if tab === 6}
                     <div class="p-8">
            <Sheirut
            on:new={findM}
              sheirutim={project?.sheiruts}
              pn={projectname}
              {restime}
              usersNum={projectUsers.length}
              {roles}
   
            />
          </div>
        
{:else if tab === 7}
          <Hamatanot
              {trili}
              {fmiData}
              {rikmashes}
              {salee}
              {projectUsers}
              bmiData={bmimData}
            />
{:else if tab === 8}
      
              <div
              dir="{$lang == "he" ? "rtl" : "ltr"}"
              style="width: 95vw; margin: 20px auto; max-height: 88vh; overflow-y: auto; overflow-x: auto; background-color:rgb(2, 255, 187); "
                class="d"
              >
                <Sidur />
              </div>
{:else if tab === 9}
  <ActsTable acts={meData.acts.data} on:taskClick={openDescrip}/>                
         
{/if}              
          </div>
                   <div class=" m-4" bind:this={openss}>
              {#if openMS === true && omiData.length > 0}
                <span >
                  <button
                    title={cencel1[$lang]}
                    onclick={() => (openMS = false)}
                    class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold p-0.5 rounded-full"
                    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                      />
                    </svg></button
                  >
                  <OpenM {omiData} projectName={projectname} />
                </span>
              {:else if openMS === true && omiData.length == 0}
                <button
                  title={cencel1[$lang]}
                  onclick={() => (openMS = false)}
                  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold p-0.5 rounded-full"
                  ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                    />
                  </svg></button
                >
                <h2>
                  אין פעולות פתוחות לריקמה זו, מומלץ ליצור כבר עכשיו
                  <br />
                  (לחצו על היד המחזיקה מנורה שלמעלה)
                </h2>
              {/if}
            </div>
            <div class="m-4">
              {#if openMA === true && opmash.length > 0}
                <button
                  title={cencel1[$lang]}
                  onclick={() => (openMA = false)}
                  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold p-0.5 rounded-full"
                  ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                    />
                  </svg></button
                >
                <Mashman meData={opmash} />
              {:else if openMA === true && opmash.length == 0}
                <button
                  title={cencel1[$lang]}
                  onclick={() => (openMA = false)}
                  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold p-0.5 rounded-full"
                  ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                    />
                  </svg></button
                >
                <h2>
                  אין משאבים מבוקשים לריקמה זו, מומלץ ליצור כבר עכשיו
                  <br />
                  (לחצו על היד המחזיקה מגנט שלמעלה)
                </h2>
              {/if}
            </div>
          <!-- TODO: הכל בחלונות נפתחים-->
          <div class=" m-4">
            {#if pmiData.length > 0}
              <span bind:this={pendss}>
                {#if pendS === true}
                  <button
                    title={cencel1[$lang]}
                    onclick={() => (pendS = false)}
                    class=" hover:bg-barbi text-barbi hover:text-gold font-bold p-0.5 rounded-full"
                    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                      />
                    </svg></button
                  >
                  <PendsM {pmiData} user_1s={projectUsers.length} />
                {/if}
              </span>
            {/if}
            <div>
              {#if bmiData.length > 0}
                <span bind:this={bmiss}>
                  {#if tahaS === true}
                    <button
                      title={cencel1[$lang]}
                      onclick={() => (tahaS = false)}
                      class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold p-0.5 rounded-full"
                      ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                        />
                      </svg></button
                    >
                    <Betaha {bmiData} />
                  {/if}
                </span>
              {/if}
            </div>
           
   </div>
   </div>
   </div>
          
          <!--<Mindmap/>-->
    <!-- </Tooltip> {:else}
    לשלוח אותו לרקמה ציבורי לקחת ID וכו'
    <h1 class="bg-white">לא מורשה</h1>
    {/if}-->
  {/await}
{:else}
  {#await projects}
    <div class="alli grid items-center justify-center">
      <Lowding />
    </div>
  {:then projects}
    <div class=" text-center border-2 border-barbi rounded m-4">
      <h1 class="text-barbi font-bold py-2 px-4 m-4 rounded-full">
        {choo[$lang]}
      </h1>

      {#each projects as data, i}
        <button
          class=" border font-bold border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-gray-700 hover:text-gold py-2 px-5 m-2 rounded-full shadow-2xl shadow-fuchsia-400 shadow"
          onclick={() => projectn(data.id)}
        >
          {data.attributes.projectName}
        </button>
      {/each}
    </div>
  {/await}
{/if}

<style>
     :global([data-svelte-dialog-content].chat) {
       z-index: 1000;
      padding: 0px;
      background-color: #242526;
          margin: 0px;
                height: 70vh; 
      aspect-ratio: 1/1.7;
          margin-top: 30vh;
                          border-radius: 10%;
      overflow-y: auto;
        }

 @media (max-width: 450px){
        :global([data-svelte-dialog-content].chat) {
              width: 80vw;
        }
      }
  @media (min-width: 600px){
        :global([data-svelte-dialog-content].chat) {
                overflow-y: auto;
       z-index: 1000;
      padding: 0px;
      background-color: #242526;
      margin: 0px;
                      height: 80vh; 
                margin-top: 20vh;
                border-radius: 5%;
              width: auto !important;
        }
      }
  .alli {
    /*   background: radial-gradient(circle at 0.9% 49.5%, rgb(0, 250, 255) 0%, rgb(2, 255, 187) 100.2%); */
  /*  background: radial-gradient(
      circle at 0.9%,
      rgb(2, 255, 187) 0%,
      rgb(238 232 170) 50%,
      rgb(2, 255, 187) 100.2%
    );*/
    z-index: -1;
    min-width: 100vw;
    min-height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
  }
  .hhh {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
  .all {
    min-height: 100vh;
  }
  .all::-webkit-scrollbar {
    width: 0px;
  }
  .textlink:hover {
    -webkit-text-stroke: 1px var(--barbi-pink);
  }

  :global(li:not(:global(.selected)):hover) {
    color: var(--barbi-pink);
    background-color: var(
      --lturk
    ); /* unselected but hovered options in the dropdown list */
  }
  :global(ul.tokens > li) {
    background-color: var(--barbi-pink);
    color: var(--lturk);
  }

  .sp {
    display: grid;
    justify-content: center;
    align-items: center;
  }
  :global([data-svelte-dialog-content].content) {
    background: #60b9b6;
    background: -webkit-radial-gradient(center, #050117, #0f0248, #60b9b6);
    background: -moz-radial-gradient(center, #050117, #0f0248, #60b9b6);
    background: radial-gradient(ellipse at center, #050117, #0f0248, #60b9b6);
    width: 80vw;
  }
  @media (min-width: 768px) {
    :global([data-svelte-dialog-content].content) {
      width: 50vw;
    }
    .hhh {
      display: flex;
      flex-direction: row;
    }
  }
</style>
