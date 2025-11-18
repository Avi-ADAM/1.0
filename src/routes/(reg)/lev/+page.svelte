<script>
  import { io } from 'socket.io-client';
  const baseUrl = import.meta.env.VITE_URL;
  const levVersion = 1;
  let updateV = null;
  import {
    pendMisMes,
    pendMasMes,
    askMisMes,
    meAskMisMes,
    meAskMasMes,
    askMasMes,
    nowId
  } from '$lib/stores/pendMisMes.js';
  import tr from '$lib/translations/tr.json';
  import { nutifi } from '$lib/func/nutifi.svelte';
  import Yahalomim from '$lib/components/lev/yahalomim.svelte';
  import { toast } from 'svelte-sonner';
  import Mesima from '$lib/components/lev/mesima.svelte';
  import { sendEror } from '$lib/func/sendEror.js';
  import { betha } from '$lib/components/lev/storess/betha.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import Cardsui from '$lib/components/lev/cards/cards.svelte';
  import Tooltip from '$lib/celim/tooltip.svelte';
  import Coinsui from '$lib/components/lev/newcoinui.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchTimers } from '$lib/stores/timers';
  import pkg from 'lodash';
  const { isEqual } = pkg;
  import Rikma from '$lib/components/lev/rikma.svelte';
  import Hevel from '$lib/components/lev/hevel.svelte';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import Levchat from '$lib/components/lev/levchat.svelte';
  import { lang, doesLang, langUs } from '$lib/stores/lang.js';
  import { getOccurrence } from '$lib/func/getOccurrence.svelte';
  import { montsi } from '$lib/func/montsi.svelte';
  import { kindOfTranslation } from '$lib/func/kindOfTranslate.svelte';
  import { peace } from '$lib/func/lev/peace.svelte';
  import Love from '$lib/func/lev/love.svelte';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import { sharLimud } from '$lib/func/lev/sharLimud.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { page } from '$app/state';
  import { get } from 'svelte/store';
  import {
    projects,
    userId,
    getProjectData
  } from '$lib/stores/projectStore.js';

  // Import utility functions
  import {
    letters,
    txx,
    checkStb,
    checkHst,
    filterArrayd,
    filterArray
  } from '$lib/utils/levDataProcessors.js';
  import {
    mesimabetahalicha,
    ishursium
  } from '$lib/utils/levMissionProcessors.js';
  import {
    processVotingData,
    processComplexVoting,
    hachla
  } from '$lib/utils/levVotingProcessors.js';
  import {
    createMessagesForAsked,
    createNegoMessages,
    createVotingMessages
  } from '$lib/utils/levMessageProcessors.js';
  import {
    gen,
    createFlashAnimation,
    reverseString
  } from '$lib/utils/levAnimationUtils.js';
  import {
    fetchMainUserData,
    fetchOpenMissions
  } from '$lib/utils/levGraphQLQueries.js';
  
  /**
   * @typedef {Object} PageData
   * @property {any} user - User data from server
   * @property {Array<any>} missions - Mission data
   * @property {string} [token] - Authentication token
   */
  
  /** @type {{ data: PageData }} */
  let { data } = $props();
  
  let low = $state(true);
  let indexi = $state(-1);

  let isOpen = $state(false);
  //  import Viewport from 'svelte-viewport-info'
  
  /** @type {string | undefined} */
  let idL;
  
  /** @type {Array<any>} */
  let meData = [];
  
  /** @type {Array<any>} */
  let miData = [];
  
  /** @type {string | undefined} */
  let token;
  
  /** @type {Array<any>} */
  let askedarr = $state([]);
  
  /** @type {Array<any>} */
  let declineddarr = $state([]);
  
  /** @type {Array<any>} */
  let d = [];
  
  /** @type {Array<any>} */
  let sk = [];
  
  /** @type {Record<string, any>} */
  let dictids = {};
  
  /** @type {Array<any>} */
  let dictasked = [];
  let askedcoin = [];
  let error1 = null;
  let mtaha = [];
  let pmashd = $state(0);
  let mashs = $state(0);
  let maap = $state(0);
  let sug = $state(0);
  let pen = $state(0);
  let ask = $state(0);
  let halu = $state(0);
  let wel = $state(0);
  let askma = $state(0);
  let beta = $state(0);
  let des = 0;
  let fia = $state(0);
  let hachlot = $state(0);
  let fiapp = [];
  let askedm = [];
  let askm = 0;
  let ma = 0;
  let wegets = [];
  let arr1 = $state([]);
  let askWants = [];
  function close() {
    if (mode !== 4) {
      isOpen = false;
    }
  }
  let eizeish = $state(),
    eizep = $state();
  let mode = $state(0);

  function user(event) {
    isOpen = false;
    eizeish = event.id;
    mode = 1;
    isOpen = true;
  }

  function chat(event) {
    isOpen = false;
    //eizeish = event.id
    mode = 3;
    isOpen = true;
  }

  function proj(event) {
    isOpen = false;
    eizep = event.id;
    mode = 2;
    isOpen = true;
  }
  let eizeme = $state();
  function mesima(event) {
    isOpen = false;
    eizeme = event.id;
    mode = 5;
    isOpen = true;
  }
  function processMesimabetahalicha(data) {
    const result = mesimabetahalicha(data, mtaha, beta, $lang);
    mtaha = result.mtaha;
    beta = result.beta;

    if (!isEqual(mtaha, mtahaold) && counter > 1) {
      if (mtahaold.length < mtaha.length) {
        const usernames =
          data.data.usersPermissionsUser.data.attributes.username;
        const rikn = getProjectData(
          mtaha[mtaha.length - 1].project.data.id,
          'pn'
        );
        let text = `שלום ${usernames} !יש לך משימה חדשה לביצוע ברקמת ${rikn}`;
        let linkop = 'lev';
        nutifi('1💗1 משימה חדשה', text, linkop);
      }
    }
  }

  function processIshursium(data) {
    const result = ishursium(data, fiapp, fia, $lang, idL);
    fiapp = result.fiapp;
    fia = result.fia;
  }

  function processHachla(data) {
    const result = hachla(data, hachlatot, hachlot, $lang, idL);
    hachlatot = result.hachlatot;
    hachlot = result.hachlot;
  }

  function gvots(data) {
    for (let k = 0; k < data.length; k++) {
      const x = data[k].users; //בעיה לפעמים זה vots
      data[k].uids = [];
      for (let z = 0; z < x.length; z++) {
        data[k].uids.push(x[z].users_permissions_user.id);
        data[k].what = [];
        data[k].what.push(x[z].what);
      }
    }

    for (let t = 0; t < data.length; t++) {
      const allid = data[t].uids;
      const myid = data[t].myid;
      data[t].already = false;
      data[t].noofusersOk = 0;
      data[t].noofusersNo = 0;
      data[t].whyno = [];
      data[t].whyes = [];
      data[t].mypos = null;
      if (allid.includes(myid)) {
        data[t].already = true;
        data[t].pl = 20;
        for (let l = 0; l < data[t].users.length; l++) {
          if (data[t].users[l].users_permissions_user.id === myid)
            fiapp[t].mypos = fiapp[t].users[l].what;
        }
      }

      for (let r = 0; r < fiapp[t].users.length; r++) {
        if (fiapp[t].users[r].what === true) {
          fiapp[t].noofusersOk += 1;
          fiapp[t].whyes.push(fiapp[t].users[r].why);
        } else if (fiapp[t].users[r].what === false) {
          fiapp[t].noofusersNo += 1;
          fiapp[t].whyno.push(fiapp[t].users[r].why);
        }
      }

      const noofusersWaiting = fiapp[t].noof - fiapp[t].users.length;
      fiapp[t].noofusersWaiting = noofusersWaiting;
    }
  }

  function crMaap(hh) {
    const start = hh.data.usersPermissionsUser.data.attributes.projects_1s.data;
    const myid = hh.data.usersPermissionsUser.data.id;
    for (let i = 0; i < start.length; i++) {
      if (start[i].attributes.maaps.data) {
        for (let j = 0; j < start[i].attributes.maaps.data.length; j++) {
          if (start[i].attributes.maaps.data.length > 0) {
            const rt = letters(
              start[i].attributes.maaps.data[j].attributes.sp.data.attributes
                .name
            );
            const y = start[i].attributes.maaps.data[j].attributes;
            const v = y.sp.data.attributes;
            let src27 = '';
            if (
              v.users_permissions_user.data.attributes.profilePic.data != null
            ) {
              src27 =
                v.users_permissions_user.data.attributes.profilePic.data
                  .attributes.formats.thumbnail.url;
            }
            wegets.push({
              uid: v.users_permissions_user.data.id,
              username: v.users_permissions_user.data.attributes.username,
              src: src27,
              myp: v.myp,
              spid: y.sp.data.id,
              omid: y.open_mashaabim.data.id,
              askId: start[i].attributes.maaps.data[j].id,
              users: y.vots,
              hm: v.unit,
              openName: v.name,
              easy: y.open_mashaabim.data.attributes.easy,
              price: y.open_mashaabim.data.attributes.price,
              sqadualed: y.open_mashaabim.data.attributes.sqadualed,
              sqadualedf: y.open_mashaabim.data.attributes.sqadualedf,
              spnot: y.open_mashaabim.data.attributes.spnot,
              kindOf: y.open_mashaabim.data.attributes.kindOf,
              name: rt[0],
              stylef: rt[1],
              st: rt[2],
              projectId: start[i].id,
              projectName: getProjectData(start[i].id, 'pn'),
              noof: getProjectData(start[i].id, 'noof'),
              src2: getProjectData(start[i].id, 'pp'),
              myid: myid,
              ani: 'wegets',
              azmi: 'ishrur',
              pl: -1 + y.vots.length
            });
          }
        }
      }
    }
    for (let k = 0; k < wegets.length; k++) {
      const x = wegets[k].users;
      wegets[k].uids = [];
      for (let z = 0; z < x.length; z++) {
        wegets[k].uids.push(x[z].users_permissions_user.id);
        wegets[k].what = [];
        wegets[k].what.push(x[z].what);
      }
    }
    for (let t = 0; t < wegets.length; t++) {
      const allid = wegets[t].uids;
      const myid = wegets[t].myid;
      wegets[t].already = false;
      wegets[t].noofusersOk = 0;
      wegets[t].noofusersNo = 0;
      wegets[t].whyno = [];
      wegets[t].whyes = [];
      wegets[t].mypos = null;
      if (allid.includes(myid)) {
        wegets[t].already = true;
        for (let l = 0; l < wegets[t].users.length; l++) {
          if (wegets[t].users[l].users_permissions_user.data.id === myid)
            wegets[t].mypos = wegets[t].users[l].what;
        }
      }

      for (let r = 0; r < wegets[t].users.length; r++) {
        if (wegets[t].users[r].what === true) {
          wegets[t].noofusersOk += 1;
          wegets[t].whyes.push(wegets[t].users[r].why);
        } else if (wegets[t].users[r].what === false) {
          wegets[t].noofusersNo += 1;
          wegets[t].whyno.push(wegets[t].users[r].why);
        }
      }

      const noofusersWaiting = wegets[t].noof - wegets[t].users.length;
      wegets[t].noofusersWaiting = noofusersWaiting;
    }
    wegets = wegets;
    maap = wegets.length;
    localStorage.setItem('maap', maap);
  }
  let orech;
  let adder = $state([]);
  let check;
  let wi = 125;

  function createD() {
    //  console.log('Viewport Width x Height:     ',Viewport.Width+'x'+Viewport.Height)
    //     if (Viewport.Width >= 1640){
    //        check = 15
    //    } else if (Viewport.Width >= 1240){
    //        check = 12
    //    } else if (Viewport.Width >= 950){
    //        check = 9
    //    } else {
    //        check = 6
    //    }
    //    if (Viewport.Height >= 840 && Viewport.Height < 1040){
    //     if (Viewport.Width >= 1640){
    //        check = 25
    //    } else if (Viewport.Width >= 1240){
    //        check = 20
    //    } else if (Viewport.Width >= 950){
    //        check = 15
    //    } else {
    //        check = 10
    //    }
    //    } else if (Viewport.Height >= 1040){
    //      if (Viewport.Width >= 1640){
    //        check = 35
    //    } else if (Viewport.Width >= 1240){
    //        check = 28
    //    } else if (Viewport.Width >= 950){
    //        check = 21
    //    } else {
    //        check = 14
    //    }
    //    }
    //    if (Viewport.Width >= 550){
    //        wi = 75;
    //    }
    check = 4;
    orech = arr1.lenght;
    if (orech < check && adder.length === 0) {
      for (let i = orech; i < check; i++) {
        adder.push(
          `<svg class="svggg" viewBox="0 0 100 100" >
  <circle fill="none" id="d" cx="50" cy="50" r="50"/>
 </svg>`
        );
      }
      adder = adder;
    }
  }
  async function createasked(da) {
    const start = da.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < start.length; i++) {
      for (let j = 0; j < start[i].attributes.asks.data.length; j++) {
        const rt = letters(
          start[i].attributes.asks.data[j].attributes.open_mission.data
            .attributes.name
        );
        let src21 = getProjectData(
          start[i].attributes.asks.data[j].attributes.project.data.id,
          'pp'
        );
        let src22 = '';
        if (
          start[i].attributes.asks.data[j].attributes.users_permissions_user
            .data.attributes.profilePic.data !== null
        ) {
          src22 =
            start[i].attributes.asks.data[j].attributes.users_permissions_user
              .data.attributes.profilePic.data.attributes.formats.thumbnail
              .url ??
            'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
        }
        let t = start[i].attributes.asks.data[j].attributes;
        let user = t.users_permissions_user.data.attributes;
        dictasked.push({
          isRishon: t.open_mission.data.attributes.isRishon,
          uid: t.users_permissions_user.data.id,
          username: user.username,
          userSkills: user.skills,
          userRole: user.tafkidims,
          userWorkway: user.work_ways,
          skills: t.open_mission.data.attributes.skills,
          workways: t.open_mission.data.attributes.work_ways,
          timegramaId: t.timegrama.data?.id ?? 0,
          timegramaDate: t.timegrama.data?.attributes.date ?? null,
          src: src22,
          iskvua: t.open_mission.data.attributes.iskvua,
          email: t.users_permissions_user.data.attributes.email,
          publicklinks: t.open_mission.data.attributes.publicklinks,
          privatlinks: t.open_mission.data.attributes.privatlinks,
          hearotMeyuchadot: t.open_mission.data.attributes.hearotMeyuchadot,
          missionDetails: t.open_mission.data.attributes.descrip,
          nhours: t.open_mission.data.attributes.noofhours,
          perhour: t.open_mission.data.attributes.perhour,
          role: t.open_mission.data.attributes.tafkidims,
          missId: t.open_mission.data.attributes.mission.data.id,
          deadline: t.open_mission.data.attributes.dates,
          acts: t.open_mission.data.attributes.acts,
          sqedualed: t.open_mission.data.attributes.sqadualed,
          openName: t.open_mission.data.attributes.name,
          omid: t.open_mission.data.id,
          askId: start[i].attributes.asks.data[j].id,
          users: t.vots,
          chat: t.chat,
          decid: t.open_mission.data.attributes.declined.data,
          orderon: t.open_mission.data.attributes.negopendmissions.data.length || 0,
          negopendmissions: t.open_mission.data.attributes.negopendmissions.data,
          name: rt[0],
          stylef: rt[1],
          st: rt[2],
          createdAt: t.createdAt,
          projectId: t.project.data.id,
          projectName: getProjectData(t.project.data.id, 'pn'),
          noof: getProjectData(t.project.data.id, 'noof'),
          src2: src21,
          myid: da.data.usersPermissionsUser.data.id,
          pid: getProjectData(t.project.data.id, 'uids'),
          ani: 'askedcoin',
          azmi: 'ziruf',
          pl: 1 + i + j
          //   uid: start[i].asks[j].users[k].id,
          //  omid: start[i].open_missions[j].id,
          //  project: start[i].id
        });
      }
    }
    dictasked = dictasked;
    if (dictasked.length > 0) {
      for (let k = 0; k < dictasked.length; k++) {
        const x = dictasked[k].users;
        dictasked[k].uids = [];
        dictasked[k].what = [];
        for (let z = 0; z < x.length; z++) {
          dictasked[k].uids.push(x[z].users_permissions_user.data.id);
          dictasked[k].what.push(x[z].what);
        }
      }

      for (let t = 0; t < dictasked.length; t++) {
        const allid = dictasked[t].uids;
        const myid = dictasked[t].myid;
        dictasked[t].already = false;
        dictasked[t].noofusersOk = 0;
        dictasked[t].noofusersNo = 0;
        dictasked[t].cv = 0;
        dictasked[t].mypos = null;
        console.log("noofusersNo",dictasked[t].users,dictasked[t].noofusersOk,dictasked[t].noofusersNo,dictasked[t].omid,"orderon:",dictasked[t].orderon)

        if (allid.includes(myid)) {
          for (let l = 0; l < dictasked[t].users.length; l++) {
            if (dictasked[t].users[l].users_permissions_user.data.id === myid) {
              // Treat null order as 0 (original version before any negotiations)
              const voteOrder = dictasked[t].users[l].order ?? 0;
              if (voteOrder == dictasked[t].orderon) {
                dictasked[t].already = true;
                dictasked[t].pl += 48;
                dictasked[t].mypos = dictasked[t].users[l].what;
              }
            }
          }
        }
        
        for (let r = 0; r < dictasked[t].users.length; r++) {
          // Treat null order as 0 (original version before any negotiations)
          const voteOrder = dictasked[t].users[r].order ?? 0;
          console.log("Vote check:", "order:", voteOrder, "orderon:", dictasked[t].orderon, "what:", dictasked[t].users[r].what);
          if (voteOrder == dictasked[t].orderon) {
            dictasked[t].cv += 1;
            // Check the actual vote value (what field)
            if (dictasked[t].users[r].what === true) {
              dictasked[t].noofusersOk += 1;
              console.log("Counted as OK");
            } else if (dictasked[t].users[r].what === false) {
              dictasked[t].noofusersNo += 1;
              console.log("Counted as No");
            }
          } else {
            console.log("Order mismatch - going to else branch");
            if (
              getOccurrence(
                dictasked[t].uids,
                dictasked[t].users[r].users_permissions_user.data.id
              ) > 1
            ) {
              const results = dictasked[t].users.filter((obj) => {
                return (
                  obj.users_permissions_user.data.id ===
                  dictasked[t].users[r].users_permissions_user.data.id
                );
              });
              dictasked[t].cv += 1;
              dictasked[t].noofusersNo += 1;
              for (let n = 0; n < results.length; n++) {
                if (results[n].order === dictasked[t].orderon) {
                  dictasked[t].cv -= 1;
                  dictasked[t].noofusersNo -= 1;
                }
              }
            } else {
              dictasked[t].cv += 1;
              dictasked[t].noofusersNo += 1;
            }
          }
        }
                console.log("noofusersNo2",dictasked[t].noofusersOk,dictasked[t].noofusersNo,dictasked[t].omid)

        const noofusersWaiting = dictasked[t].noof - dictasked[t].cv;
        dictasked[t].noofusersWaiting = noofusersWaiting;

          dictasked[t].messeges = [];
          dictasked[t].messeges.push({
            message: `${dictasked[t].username} ${tr?.ask.askedTo[$lang]} ${dictasked[t].openName}`,
            what: true,
            pic: dictasked[t].src,
            timestamp: new Date(dictasked[t].createdAt),
            sentByMe: false,
            changed: false
          });
          if (dictasked[t].users.length > 0) {
            for (let x = 0; x < dictasked[t].users.length; x++) {
              let src22 = getProjectData(
                dictasked[t].projectId,
                'upic',
                dictasked[t].users[x].users_permissions_user.data.id
              );
              dictasked[t].messeges.push({
                message: `${getProjectData(
                  dictasked[t].projectId,
                  'un',
                  dictasked[t].users[x].users_permissions_user.data.id
                )}  
                  ${
                    dictasked[t].users[x].what == true
                      ? tr?.vots.inFavor[$lang]
                      : tr?.vots.against[$lang]
                  }
                  ${
                    dictasked[t].users[x].order != dictasked[t].orderon
                      ? ' ' + tr?.nego.olderVersion[$lang]
                      : ``
                  }`,
                what: dictasked[t].users[x].order != dictasked[t].orderon ? false : dictasked[t].users[x].what,
                pic: src22,
                timestamp: new Date(dictasked[t].users[x].zman),
                sentByMe:
                  dictasked[t].users[x].users_permissions_user.data.id === myid
                    ? true
                    : false,
                changed: dictasked[t].users[x].order < dictasked[t].orderon ? true : false
              });
            }
          }
          if (dictasked[t].chat?.length > 0) {
            for (let x = 0; x < dictasked[t].chat.length; x++) {
              let src22 = dictasked[t].pid.includes(dictasked[t].chat[x].ide)
                ? getProjectData(
                    dictasked[t].projectId,
                    'upic',
                    dictasked[t].chat[x].ide
                  )
                : dictasked[t].src;
              dictasked[t].messeges.push({
                message: dictasked[t].chat[x].why,
                what: true,
                pic: src22,
                timestamp: new Date(dictasked[t].chat[x].zman),
                sentByMe: dictasked[t].chat[x].ide === myid ? true : false,
                changed: false
              });
            }
          }
                  console.log("noofusersNo1",dictasked[t].noofusersOk,dictasked[t].noofusersNo,dictasked[t].omid)

          // Negotiation messages handling
          if (dictasked[t].negopendmissions && dictasked[t].negopendmissions.length > 0) {
            for (let x = 0; x < dictasked[t].negopendmissions.length; x++) {
              let src22 = getProjectData(
                dictasked[t].projectId,
                'upic',
                dictasked[t].negopendmissions[x].attributes.users_permissions_user.data.id
              );
              const negoUser = getProjectData(
                dictasked[t].projectId,
                'un',
                dictasked[t].negopendmissions[x].attributes.users_permissions_user.data.id
              );
              let negoMessage = '<span class="underline">' + negoUser + ' ' + (tr?.nego?.didNego?.[$lang] || 'negotiated') + '</span>';
              
              const negoAttrs = dictasked[t].negopendmissions[x].attributes;
              
              if (negoAttrs.noofhours && negoAttrs.noofhours !== dictasked[t].nhours) {
                negoMessage += '<br>⚙️ ' + (tr?.nego?.thatMission?.[$lang] || 'Mission') + ' ' + (dictasked[t].nhours || 0) + ' ' + (tr?.nego?.hoursInsted?.[$lang] || 'hours instead') + ' ' + (negoAttrs.noofhours || 0) + ' ' + (tr?.common?.hours?.[$lang] || 'hours');
              }
              
              if (negoAttrs.perhour && negoAttrs.perhour !== dictasked[t].perhour) {
                negoMessage += '<br>⚙️ ' + (tr?.nego?.perhourNego?.[$lang] || 'Per hour') + ' ' + (dictasked[t].perhour || 0) + ' ' + (tr?.nego?.insted?.[$lang] || 'instead') + ' ' + (negoAttrs.perhour || 0);
              }
              
              if ((negoAttrs.perhour && negoAttrs.perhour !== dictasked[t].perhour) ||
                  (negoAttrs.noofhours && negoAttrs.noofhours !== dictasked[t].nhours)) {
                const originalTotal = (dictasked[t].perhour || 0) * (dictasked[t].nhours || 0);
                const negoTotal = (negoAttrs.perhour || 0) * (negoAttrs.noofhours || 0);
                negoMessage += '<br>⚙️ ' + (tr?.nego?.total?.[$lang] || 'Total') + ' ' + originalTotal + ' ' + (tr?.nego?.insted?.[$lang] || 'instead') + ' ' + negoTotal;
              }
              
              if (negoAttrs.name && negoAttrs.name !== dictasked[t].openName) {
                negoMessage += '<br>⚙️ ' + (tr?.nego?.nameNego?.[$lang] || 'Name') + ' "' + dictasked[t].openName + '" ' + (tr?.nego?.insted?.[$lang] || 'instead') + ': "' + negoAttrs.name + '"';
              }
              
              if (negoAttrs.descrip && negoAttrs.descrip !== dictasked[t].missionDetails) {
                negoMessage += '<br>⚙️ ' + (tr?.nego?.desNego?.[$lang] || 'Description') + ' "' + dictasked[t].missionDetails + '" ' + (tr?.nego?.insted?.[$lang] || 'instead') + ': "' + negoAttrs.descrip + '"';
              }
              
              if (negoAttrs.hearotMeyuchadot && negoAttrs.hearotMeyuchadot !== dictasked[t].hearotMeyuchadot) {
                negoMessage += '<br>⚙️ ' + (tr?.nego?.heaNego?.[$lang] || 'Special notes') + ' "' + dictasked[t].hearotMeyuchadot + '" ' + (tr?.nego?.insted?.[$lang] || 'instead') + ': "' + negoAttrs.hearotMeyuchadot + '"';
              }
              
              if (negoAttrs.isMonth !== dictasked[t].iskvua) {
                const originalType = dictasked[t].iskvua ? (tr?.nego?.montly?.[$lang] || 'monthly') : (tr?.nego?.ont?.[$lang] || 'one-time');
                const negoType = negoAttrs.isMonth ? (tr?.nego?.montly?.[$lang] || 'monthly') : (tr?.nego?.ont?.[$lang] || 'one-time');
                negoMessage += '<br>⚙️ ' + (tr?.nego?.moaNego?.[$lang] || 'Type') + ' "' + originalType + '" ' + (tr?.nego?.insted?.[$lang] || 'instead') + ': "' + negoType + '"';
              }
              
              dictasked[t].messeges.push({
                message: negoMessage,
                what: true,
                pic: src22,
                timestamp: new Date(negoAttrs.createdAt),
                sentByMe: negoAttrs.users_permissions_user.data.id === myid,
                changed: false
              });
            }
          }
        
        dictasked[t].messeges = dictasked[t].messeges
          .sort(function (a, b) {
            return b.timestamp - a.timestamp;
          })
          .reverse();
        let old = $askMisMes;
        old[dictasked[t].askId] = dictasked[t].messeges;
        askMisMes.set(old);
        console.log("noofusersNo",dictasked[t].noofusersOk,dictasked[t].noofusersNo,dictasked[t].omid)
      }
    
    }
    console.log(dictasked);
    let filters = [idL];

    let result = dictasked.filter(
      (val) => val.isRishon || !filters.includes(val.uid)
    );
    dictasked = result;
    console.log(dictasked);

    localStorage.setItem('askMisMes', JSON.stringify($askMisMes));
    dictasked = dictasked;
    askedcoin = dictasked;
    ask = askedcoin.length;
    localStorage.setItem('ask', ask);
  }
  async function createmask(da) {
    const start = da.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < start.length; i++) {
      for (let j = 0; j < start[i].attributes.askms.data.length; j++) {
        const rt = letters(
          start[i].attributes.askms.data[j].attributes.open_mashaabim.data
            .attributes.name
        );
        let src21 = getProjectData(start[i].id, 'pp');
        let src22 = '';
        if (
          start[i].attributes.askms.data[j].attributes.users_permissions_user
            .data.attributes.profilePic.data !== null
        ) {
          src22 =
            start[i].attributes.askms.data[j].attributes.users_permissions_user
              .data.attributes.profilePic.data.attributes.formats.thumbnail.url;
        }
        let a = start[i].attributes.askms.data[j].attributes;
        askedm.push({
          uid: a.users_permissions_user.data.id,
          username: a.users_permissions_user.data.attributes.username,
          src: src22,
          price: a.open_mashaabim.data.attributes.price,
          easy: a.open_mashaabim.data.attributes.easy,
          spnot: a.open_mashaabim.data.attributes.spnot,
          descrip: a.open_mashaabim.data.attributes.descrip,
          hm: a.open_mashaabim.data.attributes.hm,
          myp: a.sp.data.attributes.myp,
          kindOf: a.open_mashaabim.data.attributes.kindOf,
          spid: a.sp.data.id,
          deadline: a.open_mashaabim.data.attributes.sqadualed,
          openName: a.open_mashaabim.data.attributes.name,
          omid: a.open_mashaabim.data.id,
          askId: start[i].attributes.askms.data[j].id,
          users: a.vots,
          name: rt[0],
          stylef: rt[1],
          st: rt[2],
          projectId: start[i].id,
          projectName: getProjectData(start[i].id, 'pn'),
          noof: getProjectData(start[i].id, 'noof'),
          src2: src21,
          myid: da.data.usersPermissionsUser.data.id,
          pid: getProjectData(start[i].id, 'uids'),
          ani: 'askedm',
          azmi: 'ziruf',
          pl: 2 + i + j
        });
      }
    }
    askedm = askedm;
    if (askedm.length > 0) {
      for (let k = 0; k < askedm.length; k++) {
        const x = askedm[k].users;
        askedm[k].uids = [];
        askedm[k].what = [];
        for (let z = 0; z < x.length; z++) {
          askedm[k].uids.push(x[z].users_permissions_user.data.id);
          askedm[k].what.push(x[z].what);
        }
      }
      for (let t = 0; t < askedm.length; t++) {
        const allid = askedm[t].uids;
        const myid = askedm[t].myid;
        askedm[t].already = false;
        askedm[t].noofusersOk = 0;
        askedm[t].noofusersNo = 0;

        if (allid.includes(myid)) {
          askedm[t].already = true;
          //  dictasked.splice(t, 1);
          //  dictasked. = dictasked
        }

        if (askedm.length > 0) {
          for (let r = 0; r < askedm[t].users.length; r++) {
            if (askedm[t].users[r].what === true) {
              askedm[t].noofusersOk += 1;
            } else if (askedm[t].users[r].what === false) {
              askedm[t].noofusersNo += 1;
            }
          }
          const noofusersWaiting = askedm[t].noof - askedm[t].users.length;
          askedm[t].noofusersWaiting = noofusersWaiting;
        }
      }
    }
    let filters = [false];

    let result = askedm.filter((val) => filters.includes(val.already));
    askedm = result;
    askedm = askedm;
    askma = askedm.length;
    localStorage.setItem('askma', askma);
  }

  async function showOpenPro(mi) {
    //req
    const r = mi.data.usersPermissionsUser.data.attributes.askeds.data;
    if (r.length > 0) {
      const p = r.map((c) => c.id);
      askedarr = p;
    }
    //dec
    const r1 = mi.data.usersPermissionsUser.data.attributes.declined.data;
    if (r1.length > 0) {
      const p1 = r1.map((c) => c.id);
      declineddarr = p1;
    }
    const x = mi.data.usersPermissionsUser.data.attributes.skills.data;
    const t = mi.data.usersPermissionsUser.data.attributes.work_ways.data;
    const y = mi.data.usersPermissionsUser.data.attributes.tafkidims.data;
    const mytaf = y.map((c) => c.id);
    const mysk = x.map((c) => c.id);
    //check taf
    for (let i = 0; i < y.length; i++) {
      const q = y[i].attributes.open_missions.data;
      let l = [];
      let z = [];
      let www = [];
      let wwn = [];
      let rate = [];
      let mtaf = [];
      let msk = [];
      for (let j = 0; j < q.length; j++) {
        l[j] = q[j].id;
        z[j] = q[j].attributes.work_ways.data.map((c) => c.id);
        mtaf[j] = q[j].attributes.tafkidims.data.map((c) => c.id);
        msk[j] = q[j].attributes.skills.data.map((c) => c.id);
        const tafn = filterArrayd(mtaf[j], mytaf);
        const skn = filterArrayd(msk[j], mysk);
        if (t.length > 0) {
          let s = t.map((c) => c.id);
          www[j] = filterArray(z[j], s);
          wwn[j] = filterArrayd(z[j], s);
          if (www[j].length > 0 && wwn[j].length === 0) {
            if (q[j].id in dictids) {
              dictids[q[j].id] += 1;
            } else {
              dictids[q[j].id] = www[j].length + 1;
              if (msk[j].length > 0) {
                if (mysk.length > 0) {
                  if (skn.length > 0) {
                    dictids[q[j].id] -= skn.length * 2;
                  }
                } else {
                  dictids[q[j].id] -= msk[j].length * 2;
                }
              }
              if (mtaf[j].length > 0) {
                if (tafn.length > 0) {
                  dictids[q[j].id] -= tafn.length;
                }
              }
            }
          } else if (www[j].length > 0 && wwn[j].length > 0) {
            if (q[j].id in dictids) {
              dictids[q[j].id] += 1;
            } else {
              dictids[q[j].id] = 1 + www[j].length - wwn[j].length;
              if (msk[j].length > 0) {
                if (mysk.length > 0) {
                  if (skn.length > 0) {
                    dictids[q[j].id] -= skn.length * 2;
                  }
                } else {
                  dictids[q[j].id] -= msk[j].length * 2;
                }
              }
              if (mtaf[j].length > 0) {
                if (tafn.length > 0) {
                  dictids[q[j].id] -= tafn.length;
                }
              }
            }
          } else if (www[j].length === 0 && wwn[j].length > 0) {
            if (q[j].id in dictids) {
              dictids[q[j].id] += 1;
            } else {
              dictids[q[j].id] = 1 - 2 * wwn[j].length;
              if (msk[j].length > 0) {
                if (mysk.length > 0) {
                  if (skn.length > 0) {
                    dictids[q[j].id] -= skn.length * 2;
                  }
                } else {
                  dictids[q[j].id] -= msk[j].length * 2;
                }
              }
              if (mtaf[j].length > 0) {
                if (tafn.length > 0) {
                  dictids[q[j].id] -= tafn.length;
                }
              }
            }
          } else if (www[j].length === 0 && wwn[j].length === 0) {
            if (q[j].id in dictids) {
              dictids[q[j].id] += 1;
            } else {
              dictids[q[j].id] = 1;
              if (msk[j].length > 0) {
                if (mysk.length > 0) {
                  if (skn.length > 0) {
                    dictids[q[j].id] -= skn.length * 2;
                  }
                } else {
                  dictids[q[j].id] -= msk[j].length * 2;
                }
              }
              if (mtaf[j].length > 0) {
                if (tafn.length > 0) {
                  dictids[q[j].id] -= tafn.length;
                }
              }
            }
          }
        } else if (t.length == 0) {
          if (q[j].id in dictids) {
            dictids[q[j].id] += 1;
          } else {
            dictids[q[j].id] = 1;
            if (msk[j].length > 0) {
              if (mysk.length > 0) {
                if (skn.length > 0) {
                  dictids[q[j].id] -= skn.length * 2;
                }
              } else {
                dictids[q[j].id] -= msk[j].length * 2;
              }
            }
            if (mtaf[j].length > 0) {
              if (tafn.length > 0) {
                dictids[q[j].id] -= tafn.length;
              }
            }
          }
        }
      }

      d[i] = [l, z, www, wwn, rate, dictids];
    }

    for (let i = 0; i < x.length; i++) {
      const q = x[i].attributes.open_missions.data;
      let l = [];
      let z = [];
      let www = [];
      let wwn = [];
      let rate = [];
      let mtaf = [];
      let msk = [];
      for (let j = 0; j < q.length; j++) {
        l[j] = q[j].id;
        z[j] = q[j].attributes.work_ways.data.map((c) => c.id);
        mtaf[j] = q[j].attributes.tafkidims.data.map((c) => c.id);
        msk[j] = q[j].attributes.skills.data.map((c) => c.id);
        let s = t.map((c) => c.id);
        const tafn = filterArrayd(mtaf[j], mytaf);
        const skn = filterArrayd(msk[j], mysk);
        www[j] = filterArray(z[j], s);
        wwn[j] = filterArrayd(z[j], s);
        if (q[j].id in dictids) {
          dictids[q[j].id] += 2;
        } else {
          if (t.length > 0) {
            if (www[j].length > 0 && wwn[j].length === 0) {
              dictids[q[j].id] = www[j].length + 2;
              if (skn.length > 0) {
                dictids[q[j].id] -= skn.length * 2;
              }
              if (tafn.length > 0) {
                dictids[q[j].id] -= tafn.length;
              }
            } else if (www[j].length > 0 && wwn[j].length > 0) {
              dictids[q[j].id] = 2 + www[j].length - wwn[j].length;
              if (skn.length > 0) {
                dictids[q[j].id] -= skn.length * 2;
              }
              if (tafn.length > 0) {
                dictids[q[j].id] -= tafn.length;
              }
            } else if (www[j].length === 0 && wwn[j].length > 0) {
              dictids[q[j].id] = 2 - 2 * wwn[j].length;
              if (skn.length > 0) {
                dictids[q[j].id] -= skn.length * 2;
              }
              if (tafn.length > 0) {
                dictids[q[j].id] -= tafn.length;
              }
            } else if (www[j].length === 0 && wwn[j].length === 0) {
              dictids[q[j].id] = 2;
              if (skn.length > 0) {
                dictids[q[j].id] -= skn.length * 2;
              }
              if (tafn.length > 0) {
                dictids[q[j].id] -= tafn.length;
              }
            }
          } else if (t.length === 0) {
            dictids[q[j].id] = 2;
            if (skn.length > 0) {
              dictids[q[j].id] -= skn.length * 2;
            }
            if (tafn.length > 0) {
              dictids[q[j].id] -= tafn.length;
            }
          }
        }
      }
      sk[i] = [l, z, www, wwn, rate];
    }
    const asks = mi.data.usersPermissionsUser.data.attributes.asks.data.map(
      (c) => c.attributes.open_mission.data.id
    );
    console.log(asks, 'dec', declineddarr, dictids);
    for (let i = 0; i < asks.length; i++) {
      if (asks[i] in dictids) {
      } else {
        dictids[asks[i]] = 2;
        askedarr.push(asks[i]);
      }
    }
    askedarr = askedarr;
    //TODO: add also asked that not come from filtering (from aseked) make sure to point them as alreadyi - done
    //  let asanddec = askedarr.concat(declineddarr);
    //  asanddec = [...new Set([...askedarr, ...declineddarr])];
    let asanddec = declineddarr;
    asanddec = [...new Set([...declineddarr])];
    const filteredw = Object.keys(dictids)
      .filter((key) => !asanddec.includes(key))
      .reduce((obj, key) => {
        obj[key] = dictids[key];
        return obj;
      }, {});
    let keysSorted = Object.keys(filteredw).sort(function (a, b) {
      return filteredw[a] - filteredw[b];
    });
    // add declined filter add sort by value
    console.log('showOpenPro', keysSorted);

    if (keysSorted.length > 0) {
      let resultString = keysSorted.join(' , ');
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
      let link = baseUrl + '/graphql';
      try {
        const openMissionsData = await fetchOpenMissions(
          baseUrl,
          token,
          keysSorted,
          $lang
        );
        meData = openMissionsData.data.openMissions.data;
        for (let i = 0; i < meData.length; i++) {
          meData[i].alreadyi = askedarr.includes(meData[i].id);
          ((meData[i].ani = 'meData'),
            (meData[i].azmi = 'hazaa'),
            (meData[i].pl = 10 + i),
            (meData[i].pid = meData[
              i
            ].attributes.project.data.attributes.user_1s.data.map((t) => t.id)),
            (meData[i].hst = checkHst(
              meData[i].attributes.project.data.attributes.projectName
            )));
          meData[i].stb = checkStb(meData[i].attributes.name);
          if (askedarr.includes(meData[i].id)) {
            const asksar =
              mi.data.usersPermissionsUser.data.attributes.asks.data;
            const askId = asksar.find(
              (ask) => ask.attributes.open_mission.data.id === meData[i].id
            );
            console.log(askId, 'askId', meData[i].id);
            meData[i].askId = askId.id;
            meData[i].chat = askId.attributes.chat;
            meData[i].projectId = meData[i].attributes.project.data.id;
            meData[i].openName = meData[i].attributes.name;
            let old = $meAskMisMes;
            old[meData[i].id] = peace(miData, meData[i].id, $lang, idL);
            meAskMisMes.set(old);
            console.log('peace', $meAskMisMes);
            localStorage.setItem('meAskMisMes', JSON.stringify($meAskMisMes));
          }
        }
      } catch (e) {
        //ErrorId=1
        console.error('Error in showOpenPro (ErrorId=1):', e);
        error1 = e;
        sendEror(idL, e, 1);
      }
    } else {
      tyu = true;
    }
    sug = meData.length;
    localStorage.setItem('sug', sug);
    bubleUiAngin();
    arr1 = arr1;
    console.log('her', arr1);
    if (!isEqual(meData, meDataold) && counter > 1) {
      if (meDataold.length < meData.length) {
        // Create and show the notification
        let rikn = '0';
        if (meDataold.length - meData.length === -1) {
          rikn = meData[meData.length - 1].projectName;
        }
        let text = `שלום ${usernames} ! יש לך הצעה חדשה: ביצוע משימה  ${
          rikn !== '0' ? `ברקמת ${rikn}` : 'בריקמה'
        }`;
        const head = { he: '1💗1 הצעה חדשה', en: '1💗1 new suggestion' };
        nutifi(head[$lang], text, 'lev');

        /*    navigator.serviceWorker.register('sw.js');
            Notification.requestPermission(function(result) {
                if (result === 'granted') {
                    navigator.serviceWorker.ready.then(function(registration) {
                        registration.showNotification('1💗1', {
                            body: text,
                            icon: img
                        });
                    });
                }
            });*/
      }
    }
  }

  // מיון ראשוני עדיף לפי האם סיים כבר משימה כזו
  let tyu = false;
  let nam = $state('');
  let total = $state('');
  let picLink = $state('');

  function midd(min) {
    const dd = min.data.usersPermissionsUser.data.attributes;
    nam = dd.username;
    total = dd.total;
    if (dd.profilePic.data !== null) {
      if (dd.profilePic.data.attributes.formats.thumbnail.url) {
        picLink = dd.profilePic.data.attributes.formats.thumbnail.url;
      } else if (dd.profilePic.data.attributes.small.thumbnail.url) {
        picLink = dd.profilePic.data.attributes.small.thumbnail.url;
      } else if (dd.profilePic.data.attributes.url) {
        picLink = dd.profilePic.data.attributes.url;
      }
    } else {
      picLink =
        'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
    }
    localStorage.setItem('nam', JSON.stringify(nam));
    localStorage.setItem('picLink', JSON.stringify(picLink));
  }
  let tickSpeed = 60000 * 5;
  let sdsa = [];
  let tt = null;

  let miDataold = [];
  let mtahaold = [];
  let counter = 0;

  let innerFlash = 'rgb(255,0,255)';
  let outerFlash = 'rgb(255,55,255)';
  let x = [],
    y = [],
    xyz = $state(['1,2']),
    c = 0;

  let h = $state(),
    w = $state(),
    initX = 0;

  function generateLightning() {
    const result = gen(w, h);
    xyz = result.xyz;
    initX = result.initX;
  }
  let repeater = null;
  let update = false;
  function localRec() {
    if (localStorage.getItem('pendMasMes') !== null) {
      pendMasMes.set(JSON.parse(localStorage.getItem('pendMasMes')));
    }
    if (localStorage.getItem('askMisMes') !== null) {
      askMisMes.set(JSON.parse(localStorage.getItem('askMisMes')));
    }
    if (localStorage.getItem('meAskMisMes') !== null) {
      meAskMisMes.set(JSON.parse(localStorage.getItem('meAskMisMes')));
    }
    if (localStorage.getItem('pendMisMes') !== null) {
      pendMisMes.set(JSON.parse(localStorage.getItem('pendMisMes')));
    }
    if (localStorage.getItem('meAskMasMes') !== null) {
      meAskMasMes.set(JSON.parse(localStorage.getItem('meAskMasMes')));
    }
    if (localStorage.getItem('askMasMes') !== null) {
      askMasMes.set(JSON.parse(localStorage.getItem('askMasMes')));
    }
    if (localStorage.getItem('miDataLM') !== null) {
      arr1 = JSON.parse(localStorage.getItem('miDataLM'));
    }
    if (localStorage.getItem('nam') !== null) {
      nam = JSON.parse(localStorage.getItem('nam'));
    }
    if (localStorage.getItem('picLink') !== null) {
      picLink = JSON.parse(localStorage.getItem('picLink'));
    }
    if (localStorage.getItem('betha') !== null) {
      betha.set(JSON.parse(localStorage.getItem('betha')));
    }
    if (localStorage.getItem('miDataL') !== null) {
      miData = JSON.parse(localStorage.getItem('miDataL'));
    }
    if (localStorage.getItem('pmashd') !== null) {
      pmashd = localStorage.getItem('pmashd');
    }
    if (localStorage.getItem('fia') !== null) {
      fia = localStorage.getItem('fia');
    }
    if (localStorage.getItem('beta') !== null) {
      beta = localStorage.getItem('beta');
    }
    if (localStorage.getItem('askma') !== null) {
      askma = localStorage.getItem('askma');
    }
    if (localStorage.getItem('wel') !== null) {
      wel = localStorage.getItem('wel');
    }
    if (localStorage.getItem('halu') !== null) {
      halu = localStorage.getItem('halu');
    }
    if (localStorage.getItem('ask') !== null) {
      ask = localStorage.getItem('ask');
    }
    if (localStorage.getItem('pen') !== null) {
      pen = localStorage.getItem('pen');
    }
    if (localStorage.getItem('sug') !== null) {
      sug = localStorage.getItem('sug');
    }
    if (localStorage.getItem('maap') !== null) {
      maap = localStorage.getItem('maap');
    }
    if (localStorage.getItem('mashs') !== null) {
      mashs = localStorage.getItem('mashs');
    }
  }
  let nowT;
  onMount(async () => {
    console.log('=== ONMOUNT STARTED ===');
    nowT = Date.now();
    //check if code updated
    const storedVersion = localStorage.getItem('version');
    if (storedVersion != levVersion) {
      updateV = true;
      localStorage.setItem('version', levVersion);
      console.log('here VERSION');
    } else {
      updateV = false;
      console.log('here VERSION OK');

      // קודם כל מנסה לשחזר מהסנאפשוט
      const storedSnapshot = localStorage.getItem('arr1Snapshot');
      if (storedSnapshot) {
        arr1 = JSON.parse(storedSnapshot);
      }
      //אם אין סנאפשוט, משחזר מהלוקל סטורג' הרגיל
      localRec();
    }

    /*  if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js', {
            scope: '.'
        }).then(function(reg) {
            // registration worked
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(function(error) {
            // registration failed
            console.log('Registration failed with ' + error);
        });
    };*/
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='));
    if (cookieValue != null) {
      const cookieValu = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jwt='))
        .split('=')[1];
      const cookieRe = document.cookie
        .split('; ')
        .find((row) => row.startsWith('when='));
      if (cookieRe != null) {
        const cookieR = document.cookie
          .split('; ')
          .find((row) => row.startsWith('when='))
          .split('=')[1];
        const today = Date.now();
        if (cookieR + 2592000000 < today) {
          goto('/login?from=/lev');
        }
      }
      const cookieValueId = document.cookie
        .split('; ')
        .find((row) => row.startsWith('id='))
        .split('=')[1];
      idL = cookieValueId;
      fetchTimers(page.data.uid, fetch);
      token = cookieValu;
      const elem = document.getElementById('screen');

      function flash() {
        if (low == true && cards == false) {
          elem.style.backgroundImage =
            'radial-gradient(ellipse farthest-corner at ' +
            initX +
            'px top, #ffaaff 0%, #ee88ff 16%, #000 100%)';
          let r = (30 + Math.random() * 70) | 0;
          c++;
          setTimeout(function () {
            flkr();
          }, r);
        }
      }

      function flkr() {
        elem.style.backgroundImage =
          'radial-gradient(ellipse farthest-corner at ' +
          initX +
          'px top, #000 0%, #000 100%)';
        let r = (16 + Math.random() * 30) | 0;
        if (c > 6) {
          clear();
        } else {
          setTimeout(function () {
            flash();
          }, r);
        }
      }

      function clear() {
        if (low == true) {
          elem.style.backgroundImage =
            'radial-gradient(ellipse farthest-corner at center top, #000 0%, #000 100%)';
        } else {
          elem.style.backgroundImage = '';
        }
      }

      if (low == true && cards == false) {
        //  document.getElementById("my_audio").play();
        let speed = 2400;
        let changeSpeed = speed;
        repeater = setInterval(repeaterFn, speed);

        function repeaterFn() {
          c = 0;
          generateLightning();
          flash();
          finito();
          if (changeSpeed != speed) {
            clearInterval(repeater);
            speed = changeSpeed;
            repeater = setInterval(repeaterFn, speed);
          }
        }
        setTimeout(function () {
          changeSpeed = 1200;
        }, 12000);
        setTimeout(function () {
          changeSpeed = 600;
        }, 24000);
      }

      function finito() {
        if (low == false && cards == false) {
          elem.style.backgroundImage = '';
          clearInterval(repeater);
          elem.style.backgroundImage = '';
          //  document.getElementById("my_audio").pause();
        }
      }
      console.log('=== ABOUT TO CALL START FROM ONMOUNT ===');
      await start();
      console.log('=== START COMPLETED FROM ONMOUNT ===');
      const SERVER_URL = baseUrl;

      // token will be verified, connection will be rejected if not a valid JWT
      const socket = io(SERVER_URL, {
        auth: {
          token: cookieValu
        }
      });

      //  wait until socket connects before adding event listeners
      socket.on('connect', () => {
        console.log('connected');
        socket.on('pmash:update', (datan) => {
          console.log('io= ', datan);
          let iddd = datan.data.id;
          console.log(iddd);
          update = true;
          let index = arr1.findIndex(
            (element) => element.ani === 'pmashes' && element.pendId == iddd
          );
          //check if updater is me, check if diun is longer && if users longer
          console.log(index, arr1[index]);
          if (index != -1 || null) {
            // indexi = index
            if (
              arr1[index].diun &&
              arr1[index].diun.length == datan.data.attributes?.diun?.length &&
              datan.data.attributes.diun[
                datan.data.attributes?.diun?.length - 1
              ].id != $nowId
            ) {
              start();
            } else {
              let src22 = getProjectData(
                arr1[index].projectId,
                'upic',
                datan.data.attributes.diun[
                  datan.data.attributes.diun.length - 1
                ].ide
              );
              let uname = getProjectData(
                arr1[index].projectId,
                'un',
                datan.data.attributes.diun[
                  datan.data.attributes.diun.length - 1
                ].ide
              );
              let pname = getProjectData(arr1[index].projectId, 'pn');
              let arr = arr1[index].messege;
              arr.push({
                message:
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].why,
                what: datan.data.attributes.diun[
                  datan.data.attributes.diun.length - 1
                ].what,
                pic: src22,
                sentByMe:
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].ide === idL
                    ? true
                    : false,
                timestamp: new Date(
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].zman
                )
              });
              arr = arr;
              let old = $pendMasMes;
              old[arr1[index].pendId] = arr;
              pendMasMes.set(old);
              localStorage.setItem('pendMasMes', JSON.stringify($pendMasMes));
              if (
                datan.data.attributes.chat[
                  datan.data.attributes.chat.length - 1
                ].id != $nowId
              ) {
                let head = `${tr.nuti.sendNewA[$lang]} 
                 ${datan.data.attributes.name} 
                 ${tr.nuti.sendNewB[$lang]} 
                 ${pname} 
                 ${tr.nuti.sendNewC[$lang]}
                 ${uname}`;
                let body =
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].why;
                if (document.visibilityState == 'visible') {
                  toast.info(head, { description: body });
                } else {
                  nutifi(head, body);
                }
              }
            }
          }
        });
        socket.on('pendm:update', (datan) => {
          console.log('io= ', datan);
          let iddd = datan.data.id;
          console.log(iddd);
          update = true;
          let index = arr1.findIndex(
            (element) => element.ani === 'pends' && element.pendId == iddd
          );
          //check if updater is me, check if diun is longer && if users longer
          console.log(index, arr1[index]);
          if (index != -1 || null) {
            // indexi = index
            if (
              arr1[index].diun.length == datan.data.attributes.diun.length &&
              datan.data.attributes.diun[datan.data.attributes.diun.length - 1]
                .id != $nowId
            ) {
              start();
            } else {
              let src22 = getProjectData(
                arr1[index].projectId,
                'upic',
                datan.data.attributes.diun[
                  datan.data.attributes.diun.length - 1
                ].ide
              );
              let uname = getProjectData(
                arr1[index].projectId,
                'un',
                datan.data.attributes.diun[
                  datan.data.attributes.diun.length - 1
                ].ide
              );
              let pname = getProjectData(arr1[index].projectId, 'pn');
              let arr = arr1[index].messege;
              arr.push({
                message:
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].why,
                what: datan.data.attributes.diun[
                  datan.data.attributes.diun.length - 1
                ].what,
                pic: src22,
                sentByMe:
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].ide === idL
                    ? true
                    : false,
                timestamp: new Date(
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].zman
                )
              });
              arr = arr;
              let old = $pendMisMes;
              old[arr1[index].pendId] = arr;
              pendMisMes.set(old);
              localStorage.setItem('pendMisMes', JSON.stringify($pendMisMes));
              if (
                datan.data.attributes.chat[
                  datan.data.attributes.chat.length - 1
                ].id != $nowId
              ) {
                let head = `${tr.nuti.sendNewA[$lang]} 
                 ${datan.data.attributes.name} 
                 ${tr.nuti.sendNewB[$lang]} 
                 ${pname} 
                 ${tr.nuti.sendNewC[$lang]}
                 ${uname}`;
                let body =
                  datan.data.attributes.diun[
                    datan.data.attributes.diun.length - 1
                  ].why;
                if (document.visibilityState == 'visible') {
                  toast(head, { description: body });
                } else {
                  nutifi(head, body);
                }
              }
            }
          }
        });
        socket.on('ask:update', (datan) => {
          console.log('io= ', datan);
          let iddd = datan.data.id;
          console.log(iddd);
          update = true;
          let index;
          let isMeData = false;
          if (datan.data.attributes.users_permissions_user?.data?.id == idL) {
            index = arr1.findIndex(
              (element) => element.ani === 'meData' && element.askId == iddd
            );
            isMeData = true;
          } else {
            index = arr1.findIndex(
              (element) => element.ani === 'askedcoin' && element.askId == iddd
            );
            isMeData = false;
          }
          //check if updater is me, check if diun is longer && if users longer
          console.log(index, arr1[index]);
          if (index != -1 || null) {
            // indexi = index
            start();
            /*
            if (
              arr1[index].chat &&
              arr1[index]?.chat?.length == datan.data.attributes?.chat?.length &&
              datan.data.attributes.chat[datan.data.attributes.chat.length - 1]
                .id != $nowId
            ) {
              start();
            } else {
              let src22 = arr1[index].pid.includes(
                datan.data.attributes.chat[
                  datan.data.attributes.chat.length - 1
                ].ide
              )
                ? getProjectData(
                    arr1[index].projectId,
                    'upic',
                    datan.data.attributes.chat[
                      datan.data.attributes.chat.length - 1
                    ].ide
                  )
                : isMeData
                ? picLink
                : arr1[index].src;
              let uname = arr1[index].pid.includes(
                datan.data.attributes.chat[
                  datan.data.attributes.chat.length - 1
                ].ide
              )
                ? getProjectData(
                    arr1[index].projectId,
                    'un',
                    datan.data.attributes.chat[
                      datan.data.attributes.chat.length - 1
                    ].ide
                  )
                : isMeData
                ? nam
                : arr1[index].username;
              let pname = isMeData
                ? arr1[index].attributes.project.data.attributes.projectName
                : getProjectData(arr1[index].projectId, 'pn');
              let arr = isMeData
                ? $meAskMisMes[datan.data.attributes.open_mission.data.id]
                : arr1[index].messeges;
              arr.push({
                message:
                  datan.data.attributes.chat[
                    datan.data.attributes.chat.length - 1
                  ].why,
                what: datan.data.attributes.chat[
                  datan.data.attributes.chat.length - 1
                ].what,
                pic: src22,
                sentByMe:
                  datan.data.attributes.chat[
                    datan.data.attributes.chat.length - 1
                  ].ide === idL
                    ? true
                    : false,
                timestamp: new Date(
                  datan.data.attributes.chat[
                    datan.data.attributes.chat.length - 1
                  ].zman
                )
              });
              arr = arr;
              if ((isMeData = false)) {
                let old = $askMisMes;
                old[arr1[index].askId] = arr;
                askMisMes.set(old);
                localStorage.setItem('askMisMes', JSON.stringify($askMisMes));
              } else {
                let old = $meAskMisMes;
                old[arr1[index].id] = arr;
                meAskMisMes.set(old);
                localStorage.setItem(
                  'meAskMisMes',
                  JSON.stringify($meAskMisMes)
                );
              }
              if (
                datan.data.attributes.chat[
                  datan.data.attributes.chat.length - 1
                ].id != $nowId
              ) {
                let head = `${tr.nuti.sendNewA[$lang]} 
                 ${arr1[index].openName} 
                 ${tr.nuti.sendNewB[$lang]} 
                 ${pname} 
                 ${tr.nuti.sendNewC[$lang]}
                 ${uname}`;
                let body =
                  datan.data.attributes.chat[
                    datan.data.attributes.chat.length - 1
                  ].why;
                if (document.visibilityState == 'visible') {
                  toast(head, {description:body});
                } else {
                  nutifi(head, body);
                }
              }
            }*/
          }
        });
      });
      setInterval(start, tickSpeed);
      if (
        navigator.userAgent.indexOf('Safari') != -1 &&
        navigator.userAgent.indexOf('Chrome') == -1
      ) {
        if (/[\u0590-\u05FF]/.test(nam) || /[\u0600-\u06FF]/.test(nam)) {
          nam = reverseString(nam);
          nam = nam;
        }
        console.log('safari.. please use chrome for better experince');
        await start().then();
        if (/[\u0590-\u05FF]/.test(nam) || /[\u0600-\u06FF]/.test(nam)) {
          nam = reverseString(nam);
          nam = nam;
        }
      }
    } else {
      goto('/');
    }
  });
  export const snapshot = {
    capture: () => {
      const snapshotData = JSON.stringify(arr1);
      localStorage.setItem('arr1Snapshot', snapshotData);
      return JSON.parse(snapshotData);
    },
    restore: async (value) => {
      while (updateV === null) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (updateV === false) {
        arr1 = value;
        localStorage.setItem('arr1Snapshot', JSON.stringify(value));
      }
    }
    /*   await sendToSer({uid: page.data.uid},"25UserArr1",null,null,false,fetch).then(v =>{
        console.log("ARR!JSON__out_ser",v)
      })*/
  };

  let usernames;
  const tolog = {
    he: 'תוקף ההתחברות שלך פג, אנו מעבירים אותך להתחברות מחדש',
    en: 'your connection is outdated you being redirected to login'
  };
  let walcomenold = [],
    hucaold = [],
    meDataold = [],
    hachlatot = [],
    iAskMi = [];
  async function start() {
    console.log('=== START FUNCTION CALLED ===');
    lang.set(data.lang);
    console.log($lang, 'start function beginning');
    miDataold = miData;
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
    console.log('Cookies extracted:', {
      idL,
      tokenExists: !!token,
      tokenLength: token?.length
    });

    let bearer1 = 'bearer' + ' ' + token;
    let link = baseUrl + '/graphql';

    try {
      console.log('About to call fetchMainUserData with:', {
        baseUrl,
        token: token?.substring(0, 10) + '...',
        idL,
        lang: $lang
      });
      miData = await fetchMainUserData(baseUrl, token, idL, $lang);
      console.log(
        'fetchMainUserData completed. Result:',
        nowT - Date.now(),
        miData?.data ? 'Data received' : 'No data',
        miData
      );
      if (
        miData?.data?.usersPermissionsUser == null ||
        miData?.data == null ||
        miData == null
      ) {
        console.log('login');
        toast.warning(`${tolog[$lang]}`);

        goto('/login?from=/lev');
      }
      console.log('nologin');

      counter += 1;
      projects.set(
        miData.data.usersPermissionsUser.data.attributes.projects_1s.data
      );
      userId.set(miData.data.usersPermissionsUser.data.id);
      localStorage.setItem('miDataL', JSON.stringify(miData));
      if (isEqual(miData, miDataold) && update != true) {
        console.log('nada', nowT - Date.now());
        low = false;
      } else {
        console.log(miDataold);
        console.log('tada', nowT - Date.now());
        console.log(miData);
        miData = miData;
        askedm = [];
        fiapp = [];
        dictasked = [];
        pends = [];
        adder = [];
        walcomenold = walcomen;
        walcomen = [];
        askedcoin = [];
        mtahaold = mtaha;
        mtaha = [];
        meDataold = meData;
        meData = [];
        sdsa = [];
        iAskMi = [];
        pmashes = [];
        hucaold = huca;
        huca = [];
        wegets = [];
        haluask = [];
        hachlatot = [];
        tverias = [];
        usernames = miData.data.usersPermissionsUser.data.attributes.username;
        showOpenPro(miData);
        console.log('openpro', nowT - Date.now());
        midd(miData);
        console.log('midd', nowT - Date.now());
        makeWalcom(miData);
        console.log('makeWalcom', nowT - Date.now());
        createasked(miData); // לא עבד כשלא היו משימות פתוחות.. כפילויות אחרי מחיקה
        console.log('createasked', nowT - Date.now());
        createpends(miData);
        console.log('createpends', nowT - Date.now());
        processMesimabetahalicha(miData);
        console.log('mtaha', nowT - Date.now());
        processIshursium(miData);
        console.log('ishursium', nowT - Date.now());
        sds(miData);
        console.log('sds', nowT - Date.now());
        pmash(miData);
        console.log('pmash', nowT - Date.now());
        sps(miData);
        console.log('sps', nowT - Date.now());
        createmask(miData);
        console.log('createmask', nowT - Date.now());
        crMaap(miData);
        console.log('crMaap', nowT - Date.now());
        rashbi(miData);
        console.log('rashbi', nowT - Date.now());
        processHachla(miData);
        console.log('hachla', nowT - Date.now());
        tveria(miData);
        console.log('tveria', nowT - Date.now());
        askWants = sharLimud(miData);
        console.log('scharLimud', askWants, nowT - Date.now());
        bubleUiAngin();
        console.log('bubleUiAngin', nowT - Date.now());
        low = false;
        update = false;
      }
    } catch (e) {
      //errorId=2
      console.error('Error in start function (ErrorId=2):', e);
      sendEror(idL, e, 2);
    }
  }
  let pmashes = [];
  let huca = [];
  let haluask = [];
  let tverias = [];
  function tveria(data) {
    const myid = data.data.usersPermissionsUser.data.id;
    const projects =
      data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      for (let j = 0; j < projects[i].attributes.halukas.data.length; j++) {
        const el = projects[i].attributes.halukas.data[j];
        if (
          el.attributes.usersend.data.id == myid ||
          el.attributes.userrecive.data.id == myid
        ) {
          tverias.push({
            shear: el.attributes.tosplit.data.attributes.halukas.data,
            hervachti: el.attributes.tosplit.data.attributes.hervachti,
            sendpropic: getProjectData(
              proj.id,
              'upic',
              el.attributes.usersend.data.id
            ),
            sendname: getProjectData(
              proj.id,
              'un',
              el.attributes.usersend.data.id
            ),
            respropic: getProjectData(
              proj.id,
              'upic',
              el.attributes.userrecive.data.id
            ),
            resname: getProjectData(
              proj.id,
              'un',
              el.attributes.userrecive.data.id
            ),
            projectId: proj.id,
            kind: el.attributes.usersend.data.id == myid ? 'send' : 'recive',
            //      created_at: pend.createdAt,
            projectName: getProjectData(proj.id, 'pn'),
            //    user_1s: getProjectData(proj.id,"us"),
            src: getProjectData(proj.id, 'pp'),
            //   noofpu: getProjectData(proj.id,"noof"),
            myid: myid,
            forumId: el.attributes.forum?.data?.id,
            pendId: projects[i].attributes.halukas.data[j].id,
            chat: el.attributes.chatre,
            amount: el.attributes.amount,
            send: el.attributes.usersend.data.id,
            recive: el.attributes.userrecive.data.id,
            senderconf: el.attributes.senderconf,
            ani: 'vidu',
            azmi: 'vidu',
            pl: 1,
            messege: []
          });
        }
      }
    }
    for (let s = 0; s < tverias.length; s++) {
      for (let t = 0; t < tverias[s].chat.length; t++) {
        tverias[s].messege.push({
          message: tverias[s].chat[t].freetext,
          when: tverias[s].chat[t].when,
          pic: getProjectData(
            tverias[s].projectId,
            'upic',
            tverias[s].chat[t].send.data.id
          ),
          sentByMe: tverias[s].chat[t].send.data.id === myid ? true : false,
          seen: tverias[s].chat[t].seen
        });
      }
    }

    tverias = tverias;
  }

  function rashbi(data) {
    const myid = data.data.usersPermissionsUser.data.id;
    const projects =
      data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
      for (let j = 0; j < projects[i].attributes.tosplits.data.length; j++) {
        const halug = projects[i].attributes.tosplits.data[j].attributes;
        haluask.push({
          name: halug.name,
          projectId: projects[i].id,
          projectName: getProjectData(projects[i].id, 'pn'),
          user_1s: getProjectData(projects[i].id, 'us'),
          src: getProjectData(projects[i].id, 'pp'),
          users: halug.vots,
          myid: myid,
          pendId: projects[i].attributes.tosplits.data[j].id,
          noofusers: getProjectData(projects[i].id, 'noof'),
          halukot: halug.halukas.data,
          hervach: halug.hervachti,
          ani: 'haluk',
          azmi: 'hachla',
          pl: 1 + halug.vots.length
        });
      }
    }
    for (let k = 0; k < haluask.length; k++) {
      const x = haluask[k].users;
      for (let z = 0; z < x.length; z++) {
        haluask[k].uids = [];
        haluask[k].uids.push(x[z].users_permissions_user.data.id);
        haluask[k].what = [];

        haluask[k].what.push(x[z].what);
      }
    }

    for (let t = 0; t < haluask.length; t++) {
      const allid = haluask[t].uids;
      const myid = haluask[t].myid;
      haluask[t].already = false;
      haluask[t].noofusersOk = 0;
      haluask[t].noofusersNo = 0;

      if (allid.includes(myid)) {
        haluask[t].already = true;
        haluask[t].pl += 25;
      }
      for (let r = 0; r < haluask[t].users.length; r++) {
        if (haluask[t].users[r].what === true) {
          haluask[t].noofusersOk += 1;
        } else if (haluask[t].users[r].what === false) {
          haluask[t].noofusersNo += 1;
        }
      }
      const noofusersWaiting =
        haluask[t].user_1s.length - haluask[t].users.length;
      haluask[t].noofusersWaiting = noofusersWaiting;
    }
    halu = haluask.length;
    localStorage.setItem('halu', halu);
  }
  //suggest mash
  function sps(pp) {
    const usernames = pp.data.usersPermissionsUser.data.attributes.username;
    for (
      let i = 0;
      i < pp.data.usersPermissionsUser.data.attributes.sps.data.length;
      i++
    ) {
      const y =
        pp.data.usersPermissionsUser.data.attributes.sps.data[i].attributes;
      if (y.mashaabim.data.attributes.open_mashaabims.data.length > 0) {
        for (
          let t = 0;
          t < y.mashaabim.data.attributes.open_mashaabims.data.length;
          t++
        ) {
          const x =
            y.mashaabim.data.attributes.open_mashaabims.data[t].attributes;
          const z = x.project.data.attributes;
          const declineddarra = x.declinedsps.data.map((c) => c.id);
          if (
            !declineddarra.includes(
              y.mashaabim.data.attributes.open_mashaabims.data[t].id
            )
          ) {
            // if(x.hm <= y.unit){
            huca.push({
              declineddarra: declineddarra,
              projectid: x.project.data.id,
              projectName: z.projectName,
              srcb: z.profilePic.data.attributes.formats.thumbnail.url,
              id: y.mashaabim.data.attributes.open_mashaabims.data[t].id,
              price: x.price,
              mashname: x.name,
              myp: y.myp,
              easy: x.easy,
              kindOf: x.kindOf,
              sqedualed: x.sqedualed,
              sqedualedf: x.sqedualedf,
              restime: getProjectData(x.project.data.id, 'restime'),
              spnot: x.spnot,
              descrip: x.descrip,
              oid: pp.data.usersPermissionsUser.data.attributes.sps.data[i].id,
              already: false,
              ani: 'huca',
              azmi: 'hazaa',
              pl: 6
            });
            //    }
          }
        }
      }
    }
    huca = huca;
    console.log(pp.data.usersPermissionsUser.data.attributes.askms);
    /* const askedarrmash =
      pp.data.usersPermissionsUser.data.attributes.askms.data.map(
        (d) => d.attributes.open_mashaabims.data[t].id
      );
    console.log(askedarrmash)

    for (let i = 0; i < huca.length; i++) {
      if (askedarrmash.includes(huca[i].id)) {
        Love(huca[i]);
      }
    }
    huca = huca;*/
    mashs = huca.length;
    localStorage.setItem('mashs', mashs);
    //todo hm vs hm
    if (!isEqual(huca, hucaold) && counter > 1) {
      if (hucaold.length < huca.length) {
        // Create and show the notification
        let rikn = '0';
        if (hucaold.length - huca.length === -1) {
          rikn = huca[huca.length - 1].projectName;
        }
        let linkop = 'lev';
        let text = `שלום ${usernames} ! יש לך הצעה חדשה: שיתוף משאב  ${
          rikn !== '0' ? `ברקמת ${rikn}` : 'בריקמה'
        }`;
        nutifi('1💗1 ריקמה חדשה', text, linkop);
      }
    }
  }
  let penm = 0;

  function pmash(data) {
    //rishonnnn so to create openM first avilable only to rishon then to rest of users..
    const myid = data.data.usersPermissionsUser.data.id;
    let src24 = '';
    if (
      data.data.usersPermissionsUser.data.attributes.profilePic.data !== null
    ) {
      src24 =
        data.data.usersPermissionsUser.data.attributes.profilePic.data
          .attributes.formats.thumbnail.url;
    } else {
      src24 = '';
    }
    const projects =
      data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      for (let j = 0; j < projects[i].attributes.pmashes.data.length; j++) {
        const pend = projects[i].attributes.pmashes.data[j].attributes;
        pmashes.push({
          orderon: pend.nego_mashes.data.length,
          mysrc: src24,
          name: pend.name,
          projectId: proj.id,
          hearotMeyuchadot: pend.spnot,
          descrip: pend.descrip,
          kindOf: pend.kindOf,
          created_at: pend.createdAt,
          nego_mashes: pend.nego_mashes,
          timegramaId: pend.timegrama.data.id,
          timeGramaDate: pend.timegrama.data.attributes.date,
          nego_mashes: pend.nego_mashes.data,
          restime: getProjectData(proj.id, 'restime'),
          projectName: getProjectData(proj.id, 'pn'),
          user_1s: getProjectData(proj.id, 'us'),
          src: getProjectData(proj.id, 'pp'),
          noofusers: getProjectData(proj.id, 'noof'),
          users: pend.users,
          myid: myid,
          mshaabId: pend.mashaabim.data.id,
          hm: pend.hm,
          price: pend.price,
          easy: pend.easy,
          linkto: pend.linkto,
          sqadualed: pend.sqadualed,
          sqadualedf: pend.sqadualedf,
          pendId: projects[i].attributes.pmashes.data[j].id,
          diun: pend.diun,
          ani: 'pmashes',
          azmi: 'harchava',
          pl: 1 + pend.users.length,
          messege: []
        });
      }
    }
    for (let k = 0; k < pmashes.length; k++) {
      const x = pmashes[k].users;
      pmashes[k].uids = [];
      for (let z = 0; z < x.length; z++) {
        pmashes[k].uids.push(x[z].users_permissions_user.data.id);
      }
    }
    for (let t = 0; t < pmashes.length; t++) {
      const allid = pmashes[t].uids;
      const myid = pmashes[t].myid;
      pmashes[t].already = false;
      pmashes[t].noofusersOk = 0;
      pmashes[t].noofusersNo = 0;
      pmashes[t].cv = 0;
      pmashes[t].mypos = null;
      if (allid.includes(myid)) {
        for (let l = 0; l < pmashes[t].users.length; l++) {
          if (pmashes[t].users[l].users_permissions_user.data.id === myid) {
            console.log(
              pmashes[t].users[l].order,
              '  pemashes check ',
              pmashes[t].orderon
            );
            if (pmashes[t].users[l].order == pmashes[t].orderon) {
              pmashes[t].already = true;
              pmashes[t].pl += 48;
              pmashes[t].mypos = pmashes[t].users[l].what;
            }
          }
        }
      }
      for (let r = 0; r < pmashes[t].users.length; r++) {
        if (pmashes[t].users[r].order == pmashes[t].orderon) {
          pmashes[t].cv += 1;
          pmashes[t].noofusersOk += 1;
        } else {
          if (
            getOccurrence(
              pmashes[t].uids,
              pmashes[t].users[r].users_permissions_user.data.id
            ) > 1
          ) {
            const results = pmashes[t].users.filter((obj) => {
              return (
                obj.users_permissions_user.data.id ===
                pmashes[t].users[r].users_permissions_user.data.id
              );
            });
            pmashes[t].cv += 1;
            pmashes[t].noofusersNo += 1;
            for (let n = 0; n < results.length; n++) {
              if (results[n].order === pmashes[t].orderon) {
                pmashes[t].cv -= 1;
                pmashes[t].noofusersNo -= 1;
              }
            }
          } else {
            pmashes[t].cv += 1;
            pmashes[t].noofusersNo += 1;
          }
        }
      } /*
        if (allid.includes(myid)) {
            pmashes[t].already = true;
            pmashes[t].pl += 48
            for (let l = 0; l < pmashes[t].users.length; l++) {
                if (pmashes[t].users[l].users_permissions_user.data.id === myid)
                    if (pmashes[t].users[l].order !== 1) {
                        pmashes[t].mypos = pmashes[t].users[l].what;
                    }
            }
        }
        for (let r = 0; r < pmashes[t].users.length; r++) {
            if (pmashes[t].users[r].order !== 1) {
                pmashes[t].cv += 1
                if (pmashes[t].users[r].what === true) {
                    pmashes[t].noofusersOk += 1;
                } else if (pmashes[t].users[r].what === false) {
                    pmashes[t].noofusersNo += 1;
                }
            }
        }*/
      const noofusersWaiting = pmashes[t].user_1s.length - pmashes[t].cv;
      pmashes[t].noofusersWaiting = noofusersWaiting;
      if (pmashes[t].users.length > 0) {
        for (let x = 0; x < pmashes[t].users.length; x++) {
          let src22 = getProjectData(
            pmashes[t].projectId,
            'upic',
            pmashes[t].users[x].users_permissions_user.data.id
          );
          pmashes[t].messege.push({
            message: `${getProjectData(
              pmashes[t].projectId,
              'un',
              pmashes[t].users[x].users_permissions_user.data.id
            )}  
                      ${tr?.vots.inFavor[$lang]}
                  ${
                    pmashes[t].users[x].order != pmashes[t].orderon
                      ? ' ' + tr?.nego.olderVersion[$lang]
                      : ``
                  }`,
            what: pmashes[t].users[x].what,
            pic: src22,
            sentByMe:
              pmashes[t].users[x].users_permissions_user.data.id === myid
                ? true
                : false,
            changed:
              pmashes[t].users[x].order < pmashes[t].orderon ? true : false
          });
        }
      }
      //todo diun should be orgenized by order so diun order 1 be before users order 2
      if (pmashes[t].diun.length > 0) {
        for (let x = 0; x < pmashes[t].diun.length; x++) {
          let src22 = getProjectData(
            pmashes[t].projectId,
            'upic',
            pmashes[t].diun[x].users_permissions_user.data.id
          );

          pmashes[t].messege.push({
            message: pmashes[t].diun[x].why,
            what: pmashes[t].diun[x].what,
            pic: src22,
            sentByMe:
              pmashes[t].diun[x].users_permissions_user.data.id === myid
                ? true
                : false
          });
        }
      }
      //nego to store
      if (pmashes[t].nego_mashes.length > 0) {
        for (let x = 0; x < pmashes[t].nego_mashes.length; x++) {
          let src22 = getProjectData(
            pmashes[t].projectId,
            'upic',
            pmashes[t].nego_mashes[x].attributes.users_permissions_user.data.id
          );
          console.log(
            'started!  sqadualedf sqadualed linkto createdAt name descrip easy  kindOf spnot',
            pmashes[t].nego_mashes[x]
          );
          //total
          pmashes[t].messege.push({
            message: `<span class="underline">${getProjectData(
              pmashes[t].projectId,
              'un',
              pmashes[t].nego_mashes[x].attributes.users_permissions_user.data
                .id
            )}
                  ${tr?.nego.didNego[$lang]}</span>
                  ${
                    pmashes[t].nego_mashes[x].attributes.hm &&
                    pmashes[t].nego_mashes[x].attributes.hm !== pmashes[t].hm
                      ? `<br>⚙️ ${tr?.nego.thatMashF[$lang]} 
                    ${tr?.nego.quant[$lang]}
                    ${pmashes[t].hm ?? 0} 
                    ${tr?.nego.insted[$lang]} 
                    ${pmashes[t].nego_mashes[x].attributes.hm ?? 0} `
                      : ``
                  }
                  ${
                    pmashes[t].nego_mashes[x].attributes.price &&
                    pmashes[t].nego_mashes[x].attributes.price !==
                      pmashes[t].price
                      ? `<br>⚙️ ${tr?.nego.thatMash[$lang]} 
                    ${tr?.nego.price[$lang]}
                    ${pmashes[t].price ?? 0} 
                    ${tr?.nego.insted[$lang]} 
                    ${pmashes[t].nego_mashes[x].attributes?.price ?? 0}`
                      : ``
                  }
                  ${
                    pmashes[t].nego_mashes[x].attributes.easy &&
                    pmashes[t].nego_mashes[x].attributes.easy !==
                      pmashes[t].easy
                      ? `<br>⚙️ ${tr?.nego.thatMash[$lang]} 
                    ${tr?.nego.easy[$lang]}
                    ${pmashes[t].easy ?? 0} 
                    ${tr?.nego.insted[$lang]} 
                    ${pmashes[t].nego_mashes[x].attributes.easy ?? 0}`
                      : ``
                  }    
                  ${
                    pmashes[t].nego_mashes[x].attributes.price !==
                      pmashes[t].price ||
                    pmashes[t].nego_mashes[x].attributes.hm !== pmashes[t].hm
                      ? `<br>⚙️ ${tr?.nego.sothatMashto[$lang]} 
                    ${
                      pmashes[t].price *
                        montsi(
                          pmashes[t].kindOf,
                          pmashes[t].sqadualed,
                          pmashes[t].sqadualedf
                        ) *
                        pmashes[t].hm ?? 0
                    } 
                    ${tr?.nego.insted[$lang]} 
                    ${
                      pmashes[t].nego_mashes[x].attributes?.price
                        ? pmashes[t].nego_mashes[x].attributes?.price
                        : pmashes[t].price *
                            montsi(
                              pmashes[t].nego_mashes[x].attributes.kindOf
                                ? pmashes[t].nego_mashes[x].attributes.kindOf
                                : pmashes[t].kindOf,
                              pmashes[t].nego_mashes[x].attributes.sqadualed
                                ? pmashes[t].nego_mashes[x].attributes.sqadualed
                                : pmashes[t].sqadualed,
                              pmashes[t].nego_mashes[x].attributes.sqadualedf
                                ? pmashes[t].nego_mashes[x].attributes
                                    .sqadualedf
                                : pmashes[t].sqadualedf
                            ) *
                            pmashes[t].nego_mashes[x].attributes.hm
                          ? pmashes[t].nego_mashes[x].attributes.hm
                          : (pmashes[t].hm ?? 0)
                    }`
                      : ``
                  }           
                  ${
                    pmashes[t].nego_mashes[x].attributes.easy !==
                      pmashes[t].easy ||
                    pmashes[t].nego_mashes[x].attributes.hm !== pmashes[t].hm
                      ? `<br>⚙️ ${tr?.nego.sothatMash[$lang]} 
                    ${
                      pmashes[t].easy *
                      montsi(
                        pmashes[t].nego_mashes[x].attributes.kindOf
                          ? pmashes[t].nego_mashes[x].attributes.kindOf
                          : pmashes[t].kindOf,
                        pmashes[t].nego_mashes[x].attributes.sqadualed
                          ? pmashes[t].nego_mashes[x].attributes.sqadualed
                          : pmashes[t].sqadualed,
                        pmashes[t].nego_mashes[x].attributes.sqadualedf
                          ? pmashes[t].nego_mashes[x].attributes.sqadualedf
                          : pmashes[t].sqadualedf
                      ) *
                      pmashes[t].nego_mashes[x].attributes.hm
                        ? pmashes[t].nego_mashes[x].attributes.hm
                        : (pmashes[t].hm ?? 0)
                    } 
                    ${tr?.nego.insted[$lang]} 
                    ${
                      pmashes[t].nego_mashes[x].attributes.easy
                        ? pmashes[t].nego_mashes[x].attributes.easy
                        : (pmashes[t].easy *
                            montsi(
                              pmashes[t].nego_mashes[x].attributes.kindOf,
                              pmashes[t].nego_mashes[x].attributes.sqadualed,
                              pmashes[t].nego_mashes[x].attributes.sqadualedf
                            ) *
                            pmashes[t].nego_mashes[x].attributes.hm ?? 0)
                    }`
                      : ``
                  }                                      
                  ${
                    pmashes[t].nego_mashes[x].attributes.name &&
                    pmashes[t].nego_mashes[x].attributes.name !==
                      pmashes[t].name
                      ? `<br>⚙️ ${tr?.nego.nameMashNego[$lang]} "${pmashes[t].name}" ${tr?.nego.insted[$lang]}: "${pmashes[t].nego_mashes[x].attributes.name}"`
                      : ``
                  }
                  ${
                    pmashes[t].nego_mashes[x].attributes.descrip &&
                    pmashes[t].nego_mashes[x].attributes.descrip !==
                      pmashes[t].descrip
                      ? `<br>⚙️ ${tr?.nego.desMashNego[$lang]} 
                    "${pmashes[t].descrip}" 
                    ${tr?.nego.insted[$lang]}: 
                    "${pmashes[t].nego_mashes[x].attributes.descrip}"`
                      : ``
                  }
                  ${
                    pmashes[t].nego_mashes[x].attributes.hearotMeyuchadot &&
                    pmashes[t].nego_mashes[x].attributes.hearotMeyuchadot !==
                      pmashes[t].hearotMeyuchadot
                      ? `<br>⚙️ ${tr?.nego.heaMashNego[$lang]} 
                    "${pmashes[t].hearotMeyuchadot}" 
                    ${tr?.nego.insted[$lang]}: 
                    "${pmashes[t].nego_mashes[x].attributes.spnot}"`
                      : ``
                  }
                  ${
                    pmashes[t].nego_mashes[x].attributes.kindOf &&
                    pmashes[t].nego_mashes[x].attributes.kindOf !==
                      pmashes[t].kindOf
                      ? `<br>⚙️ ${tr?.nego.kindOf[$lang]} 
                    ${kindOfTranslation(pmashes[t].kindOf, $lang)}
                    ${tr?.nego.insted[$lang]}: 
                    "${kindOfTranslation(
                      pmashes[t].nego_mashes[x].attributes.kindOf,
                      $lang
                    )}"`
                      : ``
                  }                    
                  `,
            what: true,
            pic: src22,
            timestamp: new Date(pmashes[t].nego_mashes[x].attributes.createdAt),
            sentByMe:
              pmashes[t].nego_mashes[x].attributes.users_permissions_user.data
                .id === myid
                ? true
                : false
          });
        }
      }
      pmashes[t].messege = pmashes[t].messege
        .sort(function (a, b) {
          return b.timestamp - a.timestamp;
        })
        .reverse();
      let old = $pendMasMes;
      old[pmashes[t].pendId] = pmashes[t].messege;
      pendMasMes.set(old);
    }
    localStorage.setItem('pendMasMes', JSON.stringify($pendMasMes));
    pmashes = pmashes;

    pmashd = pmashes.length;
    localStorage.setItem('pmashd', pmashd);
    console.log(pmashes);
  }

  function sds(mta) {
    for (
      let i = 0;
      i < mta.data.usersPermissionsUser.data.attributes.projects_1s.data.length;
      i++
    ) {
      const z =
        mta.data.usersPermissionsUser.data.attributes.projects_1s.data[i];
      if (z.attributes.open_mashaabims.data.length > 0) {
        for (let j = 0; j < z.attributes.open_mashaabims.data.length; j++) {
          const y = z.attributes.open_mashaabims.data[j];
          for (
            let m = 0;
            m < y.attributes.mashaabim.data.attributes.sps.data.length;
            m++
          ) {
            const x = y.attributes.mashaabim.data.attributes.sps.data[m];
            sdsa.push({
              projectid: z.id,
              projectName: getProjectData(z.id, 'pn'),
              srcb: getProjectData(z.id, 'pp'),
              id: x.id,
              price: x.attributes.price,
              mashname: x.attributes.name,
              myp: x.attributes.myp,
              kindOf: x.attributes.kindOf,
              spnot: x.attributes.spnot,
              descrip: x.attributes.descrip,
              oid: y.id
            });
          }
        }
      }
    }
    sdsa = sdsa;
    localStorage.setItem('sdsa', sdsa);
  }
  let walcomen = [];
  function makeWalcom(ata) {
    const usernames = ata.data.usersPermissionsUser.data.attributes.username;
    for (
      let i = 0;
      i < ata.data.usersPermissionsUser.data.attributes.welcom_tops.data.length;
      i++
    ) {
      const wal =
        ata.data.usersPermissionsUser.data.attributes.welcom_tops.data[i];
      console.log(
        'welcomen',
        ata.data.usersPermissionsUser.data.attributes.welcom_tops.data[i],
        getProjectData(wal.attributes.project.data.id, 'pp')
      );
      walcomen.push({
        welcomId: wal.id,
        id: wal.attributes.project.data.id,
        details: wal.attributes.project.data.attributes.publicDescription,
        pd: wal.attributes.project.data.attributes.descripFor,
        username: usernames,
        src: getProjectData(wal.attributes.project.data.id, 'pp'),
        projectName: getProjectData(wal.attributes.project.data.id, 'pn'),
        ani: 'walcomen',
        azmi: 'mesima',
        pl: 1
      });
    }
    walcomen = walcomen;
    wel = walcomen.length;
    walcomenold = [];
    localStorage.setItem('wel', wel);
    if (!isEqual(walcomen, walcomenold) && counter > 1) {
      if (walcomenold.length < walcomen.length) {
        // Create and show the notification
        const rikn = walcomen[walcomen.length - 1].projectName;

        //    let img = 'https://res.cloudinary.com/love1/image/upload/v1648817031/maskable_icon_x128_tt2kgj.png';
        let text = `שלום ${usernames} ! הצטרפת בהצלחה לרקמת ${rikn}`;
        let linkop = 'lev';
        nutifi('1💗1 ריקמה חדשה', text, linkop);

        /*   navigator.serviceWorker.register('sw.js');
            Notification.requestPermission(function(result) {
                if (result === 'granted') {
                    navigator.serviceWorker.ready.then(function(registration) {
                        registration.showNotification('1💗1', {
                            body: text,
                            icon: img
                        });
                    });
                }
            });*/

        // let notification = new Notification('1💗1', { body: text, icon: img });
      }
    }
  }

  let pends = [];

  function createpends(data) {
    let src24 = '';
    if (
      data.data.usersPermissionsUser.data.attributes.profilePic.data !== null
    ) {
      src24 =
        data.data.usersPermissionsUser.data.attributes.profilePic.data
          .attributes.url;
    } else {
      src24 = null;
    }
    //rishonnnn so to create openM first avilable only to rishon then to rest of users..
    const myid = data.data.usersPermissionsUser.data.id;
    const projects =
      data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
      for (let j = 0; j < projects[i].attributes.pendms.data.length; j++) {
        const pend = projects[i].attributes.pendms.data[j];
        pends.push({
          mysrc: src24,
          acts: pend.attributes.acts,
          orderon: pend.attributes.negopendmissions.data.length || 0,
          negopendmissions: pend.attributes.negopendmissions.data,
          isKavua: pend.attributes.iskvua,
          name: pend.attributes.name,
          projectId: projects[i].id,
          hearotMeyuchadot: pend.attributes.hearotMeyuchadot,
          descrip: pend.attributes.descrip,
          noofhours: pend.attributes.noofhours,
          perhour: pend.attributes.perhour,
          projectName: getProjectData(projects[i].id, 'pn'),
          user_1s: getProjectData(projects[i].id, 'us'),
          src: getProjectData(projects[i].id, 'pp'),
          noofusers: getProjectData(projects[i].id, 'noof'),
          users: pend.attributes.users,
          myid: myid,
          timegramaId: pend.attributes.timegrama.data.id,
          timegramaDate: pend.attributes.timegrama.data.attributes.date,
          diun: pend.attributes.diun,
          missionId: pend.attributes.mission.data.id,
          skills: pend.attributes.skills,
          tafkidims: pend.attributes.tafkidims,
          workways: pend.attributes.work_ways,
          vallues: pend.attributes.vallues,
          privatlinks: pend.attributes.privatlinks,
          publicklinks: pend.attributes.publicklinks,
          mdate: pend.attributes.sqadualed,
          dates: pend.attributes.dates,
          sqadualed: pend.attributes.sqadualed,
          restime: getProjectData(projects[i].id, 'restime'),
          pendId: pend.id,
          createdAt: pend.attributes.createdAt,
          ani: 'pends',
          azmi: 'harchava',
          pl: 1 + pend.attributes.users.length,
          messege: []
        });
      }
    }
    //get all voted users
    for (let k = 0; k < pends.length; k++) {
      const x = pends[k].users;
      pends[k].uids = [];
      for (let z = 0; z < x.length; z++) {
        pends[k].uids.push(x[z].users_permissions_user.data.id);
      }
    }

    for (let t = 0; t < pends.length; t++) {
      const allid = pends[t].uids;
      const myid = pends[t].myid;
      pends[t].already = false;
      pends[t].noofusersOk = 0;
      pends[t].noofusersNo = 0;
      pends[t].cv = 0;
      pends[t].mypos = null;
      if (allid.includes(myid)) {
        for (let l = 0; l < pends[t].users.length; l++) {
          if (pends[t].users[l].users_permissions_user.data.id === myid)
            if (pends[t].users[l].order == pends[t].orderon) {
              pends[t].already = true;
              pends[t].pl += 48;
              pends[t].mypos = pends[t].users[l].what;
            }
        }
      }
      for (let r = 0; r < pends[t].users.length; r++) {
        if (pends[t].users[r].order == pends[t].orderon) {
          pends[t].cv += 1;
          pends[t].noofusersOk += 1;
        } else {
          if (
            getOccurrence(
              pends[t].uids,
              pends[t].users[r].users_permissions_user.data.id
            ) > 1
          ) {
            const results = pends[t].users.filter((obj) => {
              return (
                obj.users_permissions_user.data.id ===
                pends[t].users[r].users_permissions_user.data.id
              );
            });
            pends[t].cv += 1;
            pends[t].noofusersNo += 1;
            for (let n = 0; n < results.length; n++) {
              if (results[n].order === pends[t].orderon) {
                pends[t].cv -= 1;
                pends[t].noofusersNo -= 1;
              }
            }
          } else {
            pends[t].cv += 1;
            pends[t].noofusersNo += 1;
            console.log('somehow');
          }
        }
      }
      const noofusersWaiting = pends[t].user_1s.length - pends[t].cv;
      pends[t].noofusersWaiting = noofusersWaiting;
      if (pends[t].users.length > 0) {
        for (let x = 0; x < pends[t].users.length; x++) {
          let src22 = getProjectData(
            pends[t].projectId,
            'upic',
            pends[t].users[x].users_permissions_user.data.id
          );
          pends[t].messege.push({
            message: `${getProjectData(
              pends[t].projectId,
              'un',
              pends[t].users[x].users_permissions_user.data.id
            )}  
                     ${tr?.vots.inFavor[$lang]}
                  ${
                    pends[t].users[x].order != pends[t].orderon
                      ? ' ' + tr?.nego.olderVersion[$lang]
                      : ``
                  }`,
            what: pends[t].users[x].order != pends[t].orderon ? false : true,
            pic: src22,
            timestamp: new Date(pends[t].users[x].zman),
            sentByMe:
              pends[t].users[x].users_permissions_user.data.id === myid
                ? true
                : false,
            changed: pends[t].users[x].order < pends[t].orderon ? true : false
          });
        }
      }
      if (pends[t].diun.length > 0) {
        for (let x = 0; x < pends[t].diun.length; x++) {
          let src22 = getProjectData(
            pends[t].projectId,
            'upic',
            pends[t].diun[x].users_permissions_user.data.id
          );
          pends[t].messege.push({
            message: pends[t].diun[x].why,
            what: pends[t].diun[x].what,
            pic: src22,
            timestamp: new Date(pends[t].diun[x].zman),
            sentByMe:
              pends[t].diun[x].users_permissions_user.data.id === myid
                ? true
                : false
          });
        }
      }
      if (pends[t].negopendmissions.length > 0) {
        for (let x = 0; x < pends[t].negopendmissions.length; x++) {
          let src22 = getProjectData(
            pends[t].projectId,
            'upic',
            pends[t].negopendmissions[x].attributes.users_permissions_user.data
              .id
          );
          //TODO: total
          pends[t].messege.push({
            message: `<span class="underline">${getProjectData(
              pends[t].projectId,
              'un',
              pends[t].negopendmissions[x].attributes.users_permissions_user
                .data.id
            )}
                  ${tr?.nego.didNego[$lang]}</span>
                  ${
                    pends[t].negopendmissions[x].attributes.noofhours &&
                    pends[t].negopendmissions[x].attributes.noofhours !==
                      pends[t].noofhours
                      ? `<br>⚙️ ${tr?.nego.thatMission[$lang]}
                   ${pends[t].noofhours ?? 0} 
                   ${tr?.nego.hoursInsted[$lang]} 
                   ${pends[t].negopendmissions[x].attributes.noofhours ?? 0} 
                   ${tr?.common.hours[$lang]}`
                      : ``
                  }
                  ${
                    pends[t].negopendmissions[x].attributes.perhour &&
                    pends[t].negopendmissions[x].attributes.perhour !==
                      pends[t].perhour
                      ? `<br> ⚙️ ${tr?.nego.perhourNego[$lang]} 
                    ${pends[t].perhour ?? 0} 
                    ${tr?.nego.insted[$lang]} 
                    ${pends[t].negopendmissions[x].attributes.perhour ?? 0}`
                      : ``
                  }
                  ${
                    pends[t].negopendmissions[x].attributes?.perhour !==
                      pends[t].perhour ||
                    pends[t].negopendmissions[x].attributes?.noofhours !==
                      pends[t].noofhours
                      ? `<br>⚙️ ${tr?.nego.total[$lang]} 
                    ${pends[t].perhour * pends[t].noofhours ?? 0} 
                    ${tr?.nego.insted[$lang]} 
                    ${pends[t].negopendmissions[x].attributes.perhour ?? 0}`
                      : ``
                  }  
                  ${
                    pends[t].negopendmissions[x].attributes.name &&
                    pends[t].negopendmissions[x].attributes.name !==
                      pends[t].name
                      ? `<br>⚙️ ${tr?.nego.nameNego[$lang]} 
                    "${pends[t].name}" 
                    ${tr?.nego.insted[$lang]}: 
                    "${pends[t].negopendmissions[x].attributes.name}"`
                      : ``
                  }
                  ${
                    pends[t].negopendmissions[x].attributes.descrip &&
                    pends[t].negopendmissions[x].attributes.descrip !==
                      pends[t].descrip
                      ? `<br>⚙️ ${tr?.nego.desNego[$lang]} 
                    "${pends[t].descrip}" 
                    ${tr?.nego.insted[$lang]}: 
                    "${pends[t].negopendmissions[x].attributes.descrip}"`
                      : ``
                  }
                  ${
                    pends[t].negopendmissions[x].attributes.hearotMeyuchadot &&
                    pends[t].negopendmissions[x].attributes.hearotMeyuchadot !==
                      pends[t].hearotMeyuchadot
                      ? `<br>⚙️ ${tr?.nego.heaNego[$lang]} 
                    "${pends[t].hearotMeyuchadot}" 
                    ${tr?.nego.insted[$lang]}: 
                    "${pends[t].negopendmissions[x].attributes.hearotMeyuchadot}"`
                      : ``
                  }
                  ${
                    pends[t].negopendmissions[x].attributes.isMonth !==
                    pends[t].isKavua
                      ? `<br>⚙️ ${tr?.nego.moaNego[$lang]} 
                    "${
                      pends[t].isKavua == true
                        ? `${tr?.nego.montly[$lang]}`
                        : `${tr?.nego.ont[$lang]}`
                    }" 
                    ${tr?.nego.insted[$lang]}:
                    "${
                      pends[t].negopendmissions[x].attributes.isMonth == true
                        ? `${tr?.nego.montly[$lang]}`
                        : `${tr?.nego.ont[$lang]}`
                    }" `
                      : ``
                  }
                  `,
            what: true,
            pic: src22,
            timestamp: new Date(
              pends[t].negopendmissions[x].attributes.createdAt
            ),
            sentByMe:
              pends[t].negopendmissions[x].attributes.users_permissions_user
                .data.id === myid
                ? true
                : false
          });
        }
      }
      pends[t].messege = pends[t].messege
        .sort(function (a, b) {
          return b.timestamp - a.timestamp;
        })
        .reverse();
      let old = $pendMisMes;
      old[pends[t].pendId] = pends[t].messege;
      pendMisMes.set(old);
    }
    localStorage.setItem('pendMisMes', JSON.stringify($pendMisMes));

    pen = pends.length;
    localStorage.setItem('pen', pen);
    //  bubleUiAngin(pends)
  }

  function coinLapach(event) {
    const indexy = arr1.findIndex((c) => c.coinlapach === event.coinlapach);
    if (indexy > -1) {
      arr1.splice(indexy, 1);
      arr1 = [...arr1];
    }

    counter = 0;
    cards == event.cards;
    let ani = event.ani;
    if (ani == 'asked') {
      ask -= 1;
    }
    //harchava mesima ishrur ziruf hazaa hachla
    console.log('im starting 2');
    start();
  }

  // one function to rull them all , pass all the difrrent to one arry then to sort by important then to have them render with if to check wwhat kind and which component.....

  let xy = [];

  async function bubleUiAngin() {
    arr1 = [
      ...tverias,
      ...walcomen,
      ...askedcoin,
      ...meData,
      ...mtaha,
      ...pmashes,
      ...pends,
      ...wegets,
      ...fiapp,
      ...askedm,
      ...huca,
      ...haluask,
      ...hachlatot
    ].sort(({ pl: a }, { pl: b }) => a - b);
    arr1.forEach((item, i) => {
      item.coinlapach = i + 1;
      xy.push({
        id: i + 1,
        ch: false
      });
    });
    xy = xy;
    betha.set(xy);
    localStorage.setItem('miDataLM', JSON.stringify(arr1));
    localStorage.setItem('betha', JSON.stringify(xy));

    createD();
    console.log(arr1);
    const x = new Date();
    const d = x.toISOString();
    /*  await sendToSer({uid: page.data.uid,arr:JSON.stringify(arr1),arrDate:d},"26addUserArr1",null,null,false,fetch).then(v =>{
        console.log("ARR!JSON",v)
      })*/
    //sp;it to 2 4 diif ways , elgo if lengt > 3 split first 3 then 2 , another 5 and 4 ,, pay ottention to heart
  }
  const defaulti = { he: 'מסך הלב', en: 'heart of 1💗1' };
  let u = $state(defaulti[$lang]);

  function hover(event) {
    u = event.id;
  }
  let cards = $state(true);
  async function cardsi(event) {
    cards = event.cards;
    console.log(cards, 'from papa');
  }
  const title = { he: 'לב 1💗1', en: 'heart of 1💗1' };
  let milon = $state({
    hachla: true,
    fiap: true,
    welc: true,
    sugg: true,
    pend: true,
    asks: true,
    betaha: true,
    desi: true,
    ppmash: true,
    pmashs: true,
    pmaap: true,
    askmap: true
  });

  function cardsYaron() {
    //  dispatch("cards", {
    //      cards: true
    //  })
  }

  let toCoin = $state(true);

  function showonly(event) {
    const value = event.data;
    for (const key in milon) {
      milon[key] = false;
    }

    milon[value] = true;
    toCoin = true;
  }

  function showall(event) {
    for (const key in milon) {
      milon[key] = true;
    }
  }
  let success = false;
</script>

<SucssesConf {success} />

<svelte:head>
  <title>{title[$lang]}</title>
</svelte:head>
{#if low == true && cards == false}
  <!--  <audio id="my_audio" src="https://res.cloudinary.com/love1/video/upload/v1655748801/thunder-25689_taqapa.mp3" loop="loop"></audio>-->
  <div
    bind:clientHeight={h}
    bind:clientWidth={w}
    style="display:block;
        position:absolute;
        height:100vh;
        width:100vw;
        margin:auto;
        visability:hidden;
        z-index:10;
        top:0;left:0;right:0;bottom:0;
        background-color: transparent;
        overflow:hidden;"
  >
    <svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter
          id="scatter"
          width="2"
          height="2"
          y="-.5"
          x="-.5"
          color-interpolation-filters="sRGB"
        >
          <feGaussianBlur stdDeviation="0.6" result="result1" />
          <feBlend in2="result1" result="fbSourceGraphic" mode="multiply" />
          <feTurbulence
            baseFrequency=".015"
            type="fractalNoise"
            numOctaves="6"
            result="result3"
          />
          <feDisplacementMap
            in="fbSourceGraphic"
            xChannelSelector="R"
            yChannelSelector="G"
            scale="60"
            result="result2"
            in2="result3"
          />
          <feMorphology radius="0" operator="dilate" result="result4" />
          <feBlend mode="screen" in2="result2" />
        </filter>
        <filter id="glow" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="1" flood-color={innerFlash} result="flood" />
          <feComposite
            in="flood"
            in2="SourceGraphic"
            operator="in"
            result="composite1"
          />
          <feGaussianBlur in="composite1" stdDeviation="10" result="blur" />
          <feOffset dx="0" dy="0" result="offset" />
          <feComposite in="SourceGraphic" in2="offset" result="composite2" />
        </filter>
      </defs>
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100vw"
      height="100vh"
      style="position:absolute; top:0; left:0;visibility:visible;-webkit-filter: drop-shadow( 0 0 20px {outerFlash});"
    >
      <g id="mainBolt" filter="url(#scatter)">
        <path
          d="M {xyz}"
          fill="none"
          stroke="#fff"
          stroke-width={Math.round(1 + Math.random() * 7) | 0}
          filter="url(#glow)"
        />
      </g>
    </svg>
  </div>
{/if}
<DialogOverlay class="overlay" {isOpen} onDismiss={close}>
  <div transition:fly={{ y: 450, opacity: 0.5, duration: 1000 }}>
    <DialogContent aria-label="form" class="user ">
      <div
        dir="rtl"
        class="grid items-center justify-center text-center bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"
      >
        <button
          style="margin: 0 auto;"
          onclick={close}
          class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
          title="סגירה"
          ><svg style="width:24px;height:24px;z-index:999;" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
            />
          </svg></button
        >
        {#if mode == 1}
          <span>
            <Hevel userId={eizeish} onProj={proj} />
          </span>
        {:else if mode == 2}
          <Rikma projectId={eizep} onUser={user} onMesima={mesima} />
        {:else if mode == 3}
          <Levchat />
        {:else if mode == 4}
          <RingLoader size="260" color="#ff00ae" unit="px" duration="2s" />
        {:else if mode == 5}
          <Mesima missionId={eizeme} onProject={proj} />
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>
<!-- לשים בלוק של פוראיצ על כל משימה בתהליך  הצעת משימה והחלטה ולמשוך שם משימה וכו משם    {#if arr1.length > 0}
 -->
{#if toCoin == true}
  {#if cards == true}
    <div class="cards-ui">
      <Tooltip title={u} ispic="true">
        <Cardsui
          {low}
          onHover={hover}
          onCards={cardsi}
          onUser={user}
          onProj={proj}
          onChat={chat}
          onStart={coinLapach}
          bind:indexi
          {arr1}
          {askedarr}
          {declineddarr}
          {sug}
          {pen}
          {ask}
          {wel}
          {beta}
          {des}
          {fia}
          {pmash}
          {mashs}
          {maap}
          {askma}
          {hachlot}
        />
      </Tooltip>
    </div>
  {:else if cards == false}
    <Tooltip title={u} ispic="true">
      <Coinsui
        onHover={hover}
        {low}
        {milon}
        onMesima={mesima}
        onUser={user}
        onProj={proj}
        onChat={chat}
        onStart={coinLapach}
        onCards={cardsi}
        {adder}
        {arr1}
        {askedarr}
        {declineddarr}
        {halu}
        {askma}
        {maap}
        {mashs}
        {pmashd}
        {fia}
        {beta}
        {pen}
        {sug}
        {nam}
        {wel}
        {ask}
        {picLink}
        {total}
      />
    </Tooltip>
  {/if}
{:else}
  <Yahalomim
    low={false}
    {adder}
    {arr1}
    {askedarr}
    {declineddarr}
    {halu}
    {askma}
    {maap}
    {mashs}
    {pmashd}
    {fia}
    {beta}
    {pen}
    {sug}
    {nam}
    {wel}
    {ask}
    {picLink}
    {total}
    onCards={cardsYaron}
    onShowall={showall}
    onShowonly={showonly}
  />
{/if}

<style>
  :global([data-svelte-dialog-content].user) {
    width: 90vw;
    z-index: 1000;
    padding: 0px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }

  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].user) {
      width: 80vw;
      margin-top: 10px;

      margin-bottom: 10px;
      z-index: 1000;
    }

    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
      height: 100vh;
    }
  }

  .cards-ui {
    max-height: 100vh;
    max-width: 100vw;
    overflow: hidden;
  }
</style>
