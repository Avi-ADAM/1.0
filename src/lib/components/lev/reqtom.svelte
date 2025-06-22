<script>
  import { lang } from '$lib/stores/lang.js';
  import { ProgressBar } from 'progressbar-svelte';
  import { goto } from '$app/navigation';
  import Chaticon from '../../celim/chaticon.svelte';
  import { Drawer } from 'vaul-svelte';

  import { clickOutside } from './outsidclick.js';
  import { fly } from 'svelte/transition';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Card from './cards/rektom.svelte';
  import { nowId } from '$lib/stores/pendMisMes';
  import { DialogContent, DialogOverlay } from 'svelte-accessible-dialog';
  import { RingLoader } from 'svelte-loading-spinners';
  import Diun from './diun.svelte';
  const baseUrl = import.meta.env.VITE_URL
  let clicked = $state(false);
  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [modal]
   * @property {boolean} [isVisible]
   * @property {any} coinlapach
   * @property {any} deadline
   * @property {any} projectName
   * @property {any} openmissionName
   * @property {any} myp
   * @property {any} easy
   * @property {any} price
   * @property {any} useraplyname
   * @property {string} [src]
   * @property {string} [src2]
   * @property {any} projectId
   * @property {string} [link]
   * @property {string} [linkU]
   * @property {any} userId
   * @property {string} [missionDetails]
   * @property {any} name
   * @property {number} [noofpu]
   * @property {any} publicklinks
   * @property {any} privatlinks
   * @property {any} hearotMeyuchadot
   * @property {number} [nhours]
   * @property {number} [valph]
   * @property {any} missId
   * @property {any} id
   * @property {any} openMid
   * @property {number} [st]
   * @property {any} [declined]
   * @property {any} noofusersWaiting
   * @property {any} uids
   * @property {any} what
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {boolean} [already]
   * @property {any} pid
   * @property {string} [stylef]
   * @property {any} askId
   * @property {any} users
   * @property {any} spid
   * @property {boolean} [cards]
   * @property {any} [chat]
   * @property {number} [order]
   * @property {(payload: { ani: string, coinlapach: any }) => void} [onAcsept]
   * @property {(payload: { ani: string, coinlapach: any }) => void} [onDecline]
   * @property {(payload: { id: string }) => void} [onHover]
   * @property {() => void} [onModal]
   * @property {(payload: { id: any }) => void} [onUser]
   * @property {(payload: { id: any }) => void} [onProj]
   */

  /** @type {Props} */
  let {
    onUser, onProj, onAcsept, onDecline, onHover, onModal,
    low = false,
    modal = $bindable(false),
    isVisible = false,
    coinlapach,
    deadline,
    projectName,
    openmissionName,
    myp,
    easy,
    price,
    useraplyname,
    src = 'coin.png',
    src2 = ' ',
    projectId,
    link = '/project/',
    linkU = '/user/',
    userId,
    missionDetails = '',
    name,
    noofpu = 0,
    publicklinks,
    privatlinks,
    hearotMeyuchadot,
    nhours = 0,
    valph = 0,
    missId,
    id,
    openMid,
    st = 275,
    declined = [],
    noofusersWaiting = $bindable(),
    uids,
    what,
    noofusersOk = $bindable(),
    noofusersNo = $bindable(),
    already = $bindable(false),
    pid = $bindable(),
    stylef = '24px',
    askId,
    users,
    spid,
    cards = false,
    chat = $bindable([]),
    order = $bindable(0)
  } = $props();
  let dialogOpen = $state(false)
  let resP = [];

  let idL;
  let bearer1;
  let token;
  import { Swiper, SwiperSlide } from 'swiper/svelte';

  // Import Swiper styles
  import 'swiper/css';

  import 'swiper/css/effect-flip';
  import './style.css';

  // import required modules
  import { EffectFlip, Navigation } from 'swiper';
  let swiperRef = null;

  const setSwiperRef = ({ detail }) => {
    const [swiper] = detail;
    // set swiper instance
    setTimeout(() => {
      swiperRef = swiper;
    });
  };

  const slideTo = (index) => {
    if (swiperRef !== null) {
      swiperRef.slideTo(index, 400);
    }
  };
  function toggleShow() {
    slideTo(0);
  }
  let error1;
  let miDatan = [];
  let linkg = baseUrl+'/graphql';

  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
  let ok;
  let nook;
  let tryo = $state('115%');
  let tryot = $state('-10.5%');
  let tryoti = $state('-5.25%');
  let nut;
  async function xyz() {
    ok = percentage(noofusersOk, noofpu);
    nook = percentage(noofusersNo, noofpu);
    nut = percentage(noofusersWaiting, noofpu);
    let ser = [];
    ser.push({
      perc: ok,
      color: '#7EE081'
    });

    if (nut > 0) {
      ser.push({
        perc: nut,
        color: '#0000cc'
      });
    }
    if (nook > 0) {
      ser.push({
        perc: nook,
        color: '#80037e'
      });
    }
    if (nut > 0 && nook > 0) {
      tryo = '129%';
      tryot = '-17%';
      tryoti = '-11.5%';
    }

    ser = ser;
    return ser;
  }

  let ser = $state(xyz());

  let ucli = $state(0);
  
  let pcli = $state(0);
  
  let pmcli = $state(0);
  
  function linke(s) {
    if (s == 'u') {
      ucli += 1;
      if (ucli >= 2) {
        onUser?.({ id: userId });
      }
    } else if (s == 'p') {
      pcli += 1;
      if (pcli >= 2) {
        onProj?.({ id: projectId });
      }
    }
  }
  import { idPr } from '$lib/stores/idPr.js';

  function project(id) {
    pmcli += 1;
    if (pmcli >= 2) {
      idPr.set(id);
      goto('/moach');
    }
  }
  function objToString(obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      for (const [p, val] of Object.entries(obj[i])) {
        if ((typeof val == 'string') | 'number' | 'boolean') {
          str += `{${p}:${val}\n},`;
        } else if (typeof val == 'null') {
          str += `{${p}:${val.map((c) => c.id)}\n},`;
        }
      }
    }
    return str;
  }
  const userss = objToString(users);
  let welcome = ``;
  let adduser = ``;
  let adduser2 = ``;
  async function agree() {
    let d = new Date();
    already = true;
    noofusersOk += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    const date = deadline !== undefined ? ` admaticedai: ${deadline}` : ``;
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    console.log(idL);
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;

    console.log(uids);
    if (pid.includes(userId)) {
      welcome = ``;
      adduser2 = ``;
      adduser = ``;
      console.log(welcome, 'member');
    } else {
      pid.push(userId);
      pid = pid;
      welcome = `createWelcomTop(
    data: {users_permissions_user: "${userId}",
          project: "${projectId}",
          publishedAt: "${d.toISOString()}",      
        }
    ) {data{id}}`;
      adduser = `updateProject(
       id: "${projectId}"
      data: {user_1s: ["${idL}","${userId}"]}
       ){data{attributes {user_1s {data{id}}}}}`;
      adduser2 = `updateProject(
      id: "${projectId}"
     data: {user_1s: [${pid}]}
      ){data {attributes{user_1s {data{id}}}}}`;
      console.log(welcome, 'not member');
    }
    //add to pr users create missioninprogres, create welcom ballun;  first check for no of pr users and full consent ,(delete or save for refernce but put archive ) openM and asked
    if (noofpu === 1) {
      try {
        await fetch(linkg, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `mutation 
                        { createMaap(
      data: {project: "${projectId}",
             name: "${openmissionName}",
             sp: "${spid}",
            publishedAt: "${d.toISOString()}",         
             open_mashaabim: ${openMid}
                  }
  ) {data{attributes{project{data{id }}}}}

  updateOpenMashaabim(
  id: "${openMid}"
  data: {archived: true}
 ) {data{id attributes{ archived}}}
 ${welcome}
 ${adduser}
 updateAskm(
               id: "${askId}" 
                                data: { archived: true,
                                    vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                        ){data{id}}
}
`
          })
        })
          .then((r) => r.json())
          .then((data) => (miDatan = data));
        console.log(miDatan);
        onAcsept?.({
          ani: 'askedma',
          coinlapach: coinlapach
        });
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    } else if (noofpu === noofusersOk) {
      console.log('create new as above and add vote and archive asked');

      try {
        await fetch(linkg, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `mutation 
                        { createMaap(
      data: {project: "${projectId}",
             name: "${openmissionName}",
             sp: "${spid}",
                     publishedAt: "${d.toISOString()}",
             open_mashaabim: ${openMid}
                  }
  ) {data{attributes{project{data{id}} }}}

updateOpenMashaabim(
  id: "${openMid}"
  data: {archived: true}
) {data{id attributes{ archived}}}
${welcome}
${adduser2}
 updateAskm(
            id: "${askId}" 
                                data: { archived: true,
                                    vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                        ){data{id}}
}
`
          })
        })
          .then((r) => r.json())
          .then((data) => (miDatan = data));
        console.log(miDatan);
        onAcsept?.({
          ani: 'askedma',
          coinlapach: coinlapach
        });
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    } else {
      console.log('just add vote to asked and update to not show for me again');
      try {
        await fetch(linkg, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `mutation 
                        {
                            updateAskm(
                          id: "${askId}" 
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){data{id}}
                     
                    }
`
          })
        })
          .then((r) => r.json())
          .then((data) => (miDatan = data));
        console.log(miDatan);
        onAcsept?.({
          ani: 'askedma',
          coinlapach: coinlapach
        });
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    }
  }
  function ask() {
    // plain text? list? terms???
  }

  async function decline() {
    already = true;
    noofusersNo += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    const declineda = declined.map((c) => c.id);
    declineda.push(userId);

    // delete asked coin forever but keep asked on user ////matrix(1, 0, 0, 1, -61.718609, -47.72295)
    if (noofpu === 1) {
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
      try {
        await fetch(linkg, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          //add already declined ids
          body: JSON.stringify({
            query: `mutation 
                        { 
updateAskm(
  id: "${id}"
  data: {vots: [${userss}, 
                                       {
                                        what: false
                                        users_permissions_user: "${idL}"
                                      }
                                    ],
                                  archived: true
}
) {data{id }}
}
`
          })
        })
          .then((r) => r.json())
          .then((data) => (miDatan = data));
        console.log(miDatan);
        onDecline?.({
          ani: 'askedma',
          coinlapach: coinlapach
        });
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    } else if (noofpu > 1) {
      console.log('if another uprove explain why you decline');
    }
  }
  let hovered = $state(false);

  let w = $state(0);
  
  const u = {
    he: 'הצבעה על בקשה לשיתוף משאב והצטרפות לרקמה',
    en: 'vote on request to join the FreeMates and share a resorce '
  };
  const levi = { he: 'לב 1💗1', en: 'the heart of 1💗1' };
  function hover(id) {
    let ut;
    if (id == '0') {
      ut = u[$lang];
    } else {
      ut = id;
    }
    onHover?.({ id: ut });
  }
  function hoverede() {
    hovered = !hovered;
    let ut;
    if (hovered == false) {
      ut = levi[$lang];
    } else {
      ut = u[$lang];
    }
    onHover?.({ id: ut });
  }

  function hoverc(event) {
    let ut;
    if (event.detail.x == '0') {
      ut = u[$lang];
    } else {
      ut = event.detail.x;
    }
    onHover?.({ id: ut });
  }

  const clicktoup = {
    he: ` לחיצה למעבר לעמוד הפרופיל של ${useraplyname}`,
    en: `click twice to see ${useraplyname} profile`
  };
  const resorcename = {
    he: ' שם המשאב המוצע',
    en: 'name of the suggested resorce'
  };
  const clicktofree = {
    he: 'לחיצה למעבר לעמוד הציבורי של הריקמה',
    en: 'click twice to see FreeMates public page'
  };
  const clicktobrain = {
    he: ` לחיצה למעבר למוח הריקמה ${projectName}`,
    en: `click twice to go to the ${projectName} Brain`
  };
  function tochat() {
    isOpen = true;
    diunm = true;
  }
 
  let isOpen = $state(false),
    diunm = $state(false),
    loading = false;
  const close = () => {
    isOpen = false;
    diunm = false;
  };
  async function afreact(event) {
    let why = event.detail.why;
    console.log(why);
    let d = new Date();
    //  loading = true;
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
    let dataa = {
      data: {
        chat: [
          ...chat,
          {
            what: true,
            users_permissions_user: idL,
            why: why,
            order: (order += 1),
            zman: d.toISOString(),
            ide: idL
          }
        ]
      }
    };
    try {
      await fetch(`${baseUrl}/api/askms/${askId}?populate=*`, {
        method: 'PUT',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataa)
      })
        .then((r) => r.json())
        .then((data) => (miDatan = data));
      console.log(miDatan);
      chat.push({
        what: true,
        users_permissions_user: idL,
        why: why,
        order: (order += 1),
        zman: d.toISOString(),
        ide: idL
      });
      chat = chat;
      clicked = false;
      nowId.set(
        miDatan.data.attributes.chat[miDatan.data.attributes.chat.length - 1].id
      );
      //   loading = false;
    } catch (e) {
      let error1 = e;
      console.log(error1);
    }
  }
  const tit = { he: 'ביטול', en: 'close' };
  const chatdes2 = { he: "צ'אט על הצטרפות לריקמה", en: 'chat on joining' };
</script>

{#await ser}
  <h1>loop</h1>
{:then ser}
  <DialogOverlay {isOpen} onDismiss={close} class="overlay">
    <div transition:fly={{ y: 450, opacity: 0.5, duration: 2000 }}>
      <DialogContent class="chat" aria-label="form">
        <div dir="rtl" class="grid items-center justify-center aling-center">
          <button
            onclick={close}
            style="margin: 0 auto;"
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title={tit[$lang]}
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg></button
          >
          {#if loading === true}
            <RingLoader size="260" color="#ff00ae" unit="px" duration="2s" />
            <!--   
{:else if masa === true}

<Nego
      on:load={()=>loading = true}
        on:close={afternego}
  descrip ={descrip}
  projectName ={projectName}
  name1 ={name}
  spnot = {hearotMeyuchadot}
  kindOf ={kindOf}
  hm = {hm}
  {timegramaId}
  projectId = {projectId}
  total ={total}
  noofusers={noofusers}
  price={price}
  easy = {easy}
  linkto = {linkto}
  pendId ={pendId}
  mshaabId={mshaabId}
  sqadualedf={sqadualedf}
  sqadualed={sqadualed}
  users={users}
{restime}
/>-->
          {:else if diunm === true}
            <Diun
              on:rect={afreact}
              smalldes={projectName + '-' + openmissionName}
              nameChatPartner={`${chatdes2[$lang]} ${useraplyname}
   ${projectName} `}
              mypos={true}
              rect={true}
              {clicked}
              pendId={askId}
              profilePicChatPartner={src.length > 0
                ? src
                : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
              ani="askedMa"
            />
          {/if}
        </div>
      </DialogContent>
    </div>
  </DialogOverlay>

  {#if cards == false}
    <div
onclick={()=>{modal = true
  onModal?.()
dialogOpen = true}}
role="button"
      style="position: relative;"
      style:z-index={hovered === false ? 11 : 16}
      onmouseenter={() => hoverede()}
      onmouseleave={() => hoverede()}
      use:clickOutside
      onclick_outside={toggleShow}
      class="hover:scale-290 duration-1000 ease-in"
      transition:fly|local={{ y: 250, opacity: 0.9, duration: 2000 }}
    >
      <Swiper
        dir="rtl"
        on:swiper={setSwiperRef}
        effect={'flip'}
        grabCursor={true}
        modules={[EffectFlip, Navigation]}
        flipEffect={{ slideShadows: false }}
        class="mySwiper swiperg"
        navigation={{
          nextEl: `.normSml${askId}-noo`,
          prevEl: `.normSmll${askId}-noo`
        }}
      >
        <div
          bind:clientWidth={w}
          style:width={tryo}
          style:top={tryot}
          style:left={tryoti}
          style="position:absolute;"
        >
          <ProgressBar
            cls="transition: all 1000ms ease-in-out;"
            series={ser}
            width={w}
            textSize={0}
            thickness={4}
            style="radial"
          />
        </div>
        <SwiperSlide class="swiper-slideg"
          ><div id="normSml">
            <div style="--the:{stylef};">
              <svg
                version="1.1"
                viewBox="-106 -106 212 212"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="lggm" x1="1" y1="1" spreadMethod="pad">
                    <stop offset="0" style="stop-color: rgb(100, 71, 105);" />
                    <stop offset="1" style="stop-color: rgb(54, 241, 155);" />
                  </linearGradient>
                  <linearGradient id="lgbgm" x1="1" y1="1">
                    <stop offset="0" style="stop-color: rgb(125, 105, 155);" />
                    <stop offset="1" style="stop-color: rgb(0, 100, 120);" />
                  </linearGradient>
                </defs>
                <circle
                  r="100"
                  fill="url(#lggm)"
                  transform="rotate(135)"
                  stroke="url(#lgbgm)"
                  stroke-width="6"
                  style="fill-rule: nonzero; paint-order: fill;"
                />
                <circle
                  r="80"
                  fill="url(#lggm)"
                  transform="rotate(315)"
                  stroke="none"
                />

                <g
                  role="button"
                  tabindex="0"
                  onkeypress={() => linke('u')}
                  onclick={() => linke('u')}
                  onmouseenter={() => hover(clicktoup[$lang])}
                  onmouseleave={() => hover('0')}
                  x="0"
                  y="40"
                  style="margin-top: 2px; margin-bottom: 2px"
                >
                  <foreignObject
                    x="0"
                    y="0"
                    width="56px"
                    height="56px"
                    transform="translate(-28,-28)"
                  >
                    <span class={`normSml${askId}-noo`}></span>
                    <img
                      width="56px"
                      height="56px"
                      alt={useraplyname}
                      {src}
                      style="border-radius: 50%;"
                    />
                  </foreignObject>
                  <text
                    fill="#EEE8AA "
                    text-anchor="middle"
                    x="0"
                    y="46"
                    style="margin: 2px; font-size: 24px; line-height: 1; font-weight: bold;"
                    >{useraplyname}</text
                  >
                </g>
                <path
                  id="curvee"
                  d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"
                />
                <text
                  color="#EEE8AA"
                  width="208.55"
                  x="-90"
                  y="-90"
                  style="white-space: pre-wrap;"
                >
                  <textPath
                    role="contentinfo"
                    onmouseenter={() => hover(resorcename[$lang])}
                    onmouseleave={() => hover('0')}
                    color="#EEE8AA"
                    x="-90"
                    y="-90"
                    class="curved-text"
                    startOffset={st}
                    xlink:href="#curvee"
                  >
                    {openmissionName}
                  </textPath>
                </text>
                <g
                  role="button"
                  tabindex="0"
                  onkeypress={() => linke('p')}
                  onclick={() => linke('p')}
                  onmouseenter={() => hover(clicktofree[$lang])}
                  onmouseleave={() => hover('0')}
                  data-sveltekit-prefetch
                  x="0"
                  y="-40"
                >
                  <text
                    fill="#FF0092"
                    text-anchor="middle"
                    x="0"
                    y="-29"
                    style="font-size: 15px; line-height: 1; font-weight: bold; white-space: pre;"
                    >{projectName}</text
                  >
                </g>
                <foreignObject
                  x="0"
                  y="-60 "
                  width="40px"
                  height="40px"
                  transform="translate(-20,-20)"
                >
                  <button
                    onclick={() => project()}
                    onmouseenter={() => hover(clicktobrain[$lang])}
                    onmouseleave={() => hover('0')}
                  >
                    <img
                      style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;"
                      src={src2}
                      width="40"
                      height="40"
                      alt="projectlogo"
                      title={projectName}
                    />
                  </button>
                </foreignObject>
                <foreignObject x="-25" y="55" width="50px" height="20px">
                  <p style="margin-top: 10px;">
                    <span
                      role="contentinfo"
                      onmouseenter={() => hover('בעד')}
                      onmouseleave={() => hover('0')}
                      style="color:var(--gold)"
                      >{noofusersOk}
                    </span><span
                      role="contentinfo"
                      onmouseenter={() => hover('לא הצביעו')}
                      onmouseleave={() => hover('0')}
                      style="color:aqua"
                      >{noofusersWaiting}
                    </span><span
                      role="contentinfo"
                      onmouseenter={() => hover('נגד')}
                      onmouseleave={() => hover('0')}
                      style="color:var(--barbi-pink)"
                      title="נגד"
                      >{noofusersNo}
                    </span>
                  </p>
                </foreignObject>
              </svg>
            </div>
          </div>
        </SwiperSlide><SwiperSlide class="swiper-slideg"
          ><div id="normSmll">
            <div class={`normSmll${askId}-noo`}></div>
            <!--  <button on:click={tochat}><Chaticon/></button>-->
            {#if deadline}
              <p
                onmouseenter={() => hover('תאריך הביצוע')}
                onmouseleave={() => hover('0')}
                class="hslink ab"
              >
                {new Date(deadline).toLocaleDateString('he-IL')}
              </p>{/if}
            <p
              onmouseenter={() => hover('שווי')}
              onmouseleave={() => hover('0')}
              class="hslink bc"
            >
              {price}
            </p>
            <p class="hslink cd">
              <span
                role="contentinfo"
                onmouseenter={() => hover('ההצעה שהתקבלה')}
                onmouseleave={() => hover('0')}
                style="color: var(--gold)">{myp}</span
              >
              /<span
                role="contentinfo"
                onmouseenter={() => hover('ההצעה של הריקמה')}
                onmouseleave={() => hover('0')}
              >
                {easy}</span
              >
            </p>
            {#if missionDetails !== null}
              <p
                onmouseenter={() => hover('פרטי ההצעה ')}
                onmouseleave={() => hover('0')}
                class="hslink de d"
              >
                {missionDetails}
              </p>{/if}
            {#if low == false}
              {#if already === false}
                <button
                  onmouseenter={() => hover('אישור')}
                  onmouseleave={() => hover('0')}
                  onclick={agree}
                  class="btn ga"
                  name="requestToJoin"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    version="1.1"
                    class="btin"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                    /></svg
                  ></button
                >
                <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>-->
                <button
                  onmouseenter={() => hover('דחיה')}
                  onmouseleave={() => hover('0')}
                  onclick={decline}
                  class="btn gb"
                  name="decline"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    version="1.1"
                    class="btin"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                    /></svg
                  ></button
                >
              {/if}
            {:else if low == true}
              <Lowbtn />
            {/if}
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
    {#if modal}
<div data-vaul-drawer-wrapper>
<Drawer.Root bind:open={dialogOpen} direction="right" shouldScaleBackground>
	<Drawer.Trigger/>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40 " />
		<Drawer.Content class="fixed bottom-0 top-0 right-0 max-h-[96%] rounded-t-[10px] z-[1000] flex flex-row-reverse">
			<div class="swiper-slidec mx-auto ">
        <Card
      on:tochat={tochat}
      on:agree={() => agree()}
      on:decline={() => decline()}
      on:hover={hoverc}
      {already}
      {projectName}
      {src}
      {low}
      {deadline}
      {easy}
      {myp}
      {price}
      {noofusersWaiting}
      {useraplyname}
      {noofusersOk}
      {src2}
      {openmissionName}
      {missionDetails}
      {noofusersNo}
    />
      </div>
      </Drawer.Content>
      </Drawer.Portal>
      </Drawer.Root>
      </div>
      {/if}
  {:else}
    <Card
      on:tochat={tochat}
      on:agree={() => agree()}
      on:decline={() => decline()}
      on:hover={hoverc}
      {isVisible}
      {already}
      {projectName}
      {src}
      {low}
      {deadline}
      {easy}
      {myp}
      {price}
      {noofusersWaiting}
      {useraplyname}
      {noofusersOk}
      {src2}
      {openmissionName}
      {missionDetails}
      {noofusersNo}
    />
  {/if}
{/await}

<style>
  .swiper-slidec {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px !important;
  border: 1px solid var(--barbi-pink);
  font-size: 22px;
  font-weight: bold;
  min-height:100vh;
  min-width: 25vw !important;
  max-width: 80vw !important;
  }
  .btin {
    width: 13px;
    height: 13px;
  }
  .pnn {
    margin: 2px;
    font-size: 8px;
    font-weight: bold;
    line-height: 0.7;
  }
  .ab {
    grid-column: 1/3;
    grid-row: 1/ 2;
  }
  .bc {
    grid-column: 1/3;
    grid-row: 2/ 3;
  }
  .cd {
    grid-column: 1/3;
    grid-row: 3/ 4;
  }
  .de {
    grid-column: 1/3;
    grid-row: 4/ 5;
    max-height: 55px;
    overflow-y: auto;
  }
  .ef {
    grid-column: 1/3;
    grid-row: 5/ 6;
  }
  .ga {
    grid-column: 1/2;
    margin-right: 20px;
  }
  .gb {
    grid-column: 2/3;
    margin-left: 20px;
  }
  #normSmll {
    background: url(https://res.cloudinary.com/love1/image/upload/v1650979768/coinnn_oatfhw.svg);
    white-space: normal;
    text-align: center;
    align-items: center;
    justify-content: center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;
    border-radius: 50%;
    background-position: center;
    background-repeat: no-repeat;
    background-size: 125% 125%;
    display: grid;
    grid-template-columns: auto auto;
    grid-auto-rows: auto auto auto auto;
  }
  .a {
    margin-right: 20px;
  }
  .b {
    margin-left: 20px;
  }
  .vo {
    margin: 1px;
    font-size: 8px;
  }
  .hslink {
    margin: 0px;
    font-size: 8px;
    line-height: 1;
    font-weight: bold;
  }
  .slink {
    margin-top: 0px;
    margin-bottom: 0px;
  }
  .seimg {
    margin-top: 0px;
    margin-bottom: 0px;
    margin-right: auto;
    margin-left: auto;
    border-radius: 50%;
    width: 22px;
    height: 22px;
  }
  .na {
    margin: 1px;
    font-size: 8px;
    font-weight: bold;
    color: var(--gold);
    line-height: 0.7;
  }
  .hflink {
    margin: 0px;
    font-size: 8px;
    line-height: 1;
    font-weight: bold;
  }
  .flink {
    margin-top: 0px;
    margin-bottom: 0px;
  }
  .timg {
    margin-top: 0px;
    margin-bottom: 0px;
    margin-right: auto;
    margin-left: auto;
    border-radius: 50%;
    width: 22px;
    height: 22px;
  }
  #curvee {
    fill: transparent;
  }

  .curved-text {
    fill: #d0f5f6;
    text-align: center;
    font-size: var(--the, 24px);
  }

  #normSml {
    text-align: center;
    line-height: 0.5;
    align-items: center;
    justify-content: safe center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;
    background-color: rgb(100, 224, 137);
    border-radius: 50%;

    background: url(https://res.cloudinary.com/love1/image/upload/v1647261055/spare_gv0gui.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }

  .btn {
    background-color: rgb(87, 208, 248);
    border-radius: 50%;
    color: var(--barbi-pink);
    text-align: center;
    opacity: 0.6;
    transition: 0.3s;
    padding: 2px;
    grid-row: 6/ 7;
  }

  .btn:hover {
    opacity: 1;
    padding: 6px;
  }
  @media (min-width: 550px) {
    .btin {
      width: 24px;
      height: 24px;
    }
    .ga {
      margin-right: 26px;
    }
    .gb {
      margin-left: 26px;
    }
    .vo {
      margin: 7px;
      font-size: 13px;
    }
    .hslink {
      margin: 2px;
      font-size: 13px;
      line-height: 1;
      font-weight: bold;
    }
    .slink {
      margin-top: 2px;
      margin-bottom: 2px;
    }
    .seimg {
      width: 32px;
      height: 32px;
    }
    .na {
      margin: 7px;
      font-size: 13px;
      font-weight: bold;
      color: var(--gold);
      line-height: 0.7;
    }
    .hflink {
      margin: 2px;
      font-size: 13px;
      line-height: 1;
      font-weight: bold;
    }
    .flink {
      margin-top: 2px;
      margin-bottom: 2px;
    }
    #normSml {
      max-width: 94%;
      max-height: 94%;
    }

    .timg {
      height: 32px;
      height: 32px;
    }
  }
</style>
