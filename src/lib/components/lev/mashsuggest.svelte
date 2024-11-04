<script>
  import { lang } from '$lib/stores/lang.js';
  import { fly } from 'svelte/transition';
      	import { Drawer } from 'vaul-svelte';
  import { createEventDispatcher } from 'svelte';
  import { clickOutside } from './outsidclick.js';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  const dispatch = createEventDispatcher();
    let dialogOpen = $state(false)
  const baseUrl = import.meta.env.VITE_URL

  let token;
  let uId;

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
  function less() {
    dispatch('less', {
      ani: 'mashsu',
      coinlapach: coinlapach
    });
  }
  let miData = [];
  let error1 = null;
  let pcli = $state(0);
  
  function linke() {
    pcli += 1;
    if (pcli >= 2) {
      dispatch('proj', { id: projectId });
    }
  }

  async function agree(oid) {
    already = true;
    const ds = declineddarra;
    ds.push(`${id}`);
    let d = new Date();
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    uId = cookieValueId;
    token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    let link = baseUrl+'/graphql';
    try {
      await fetch(link, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation { 
  createAskm(
      data:{ 
        publishedAt: "${d.toISOString()}",
        open_mashaabim: ${id},
            project: ${projectId},
            sp: ${oid},
            users_permissions_user: ${uId}
    }
  ){
    data {id}
  }
  updateSp(
    id: "${oid}" 
    data: {declinedm: "${id}" }
  ){
      data {
        attributes{
          declinedm{
            data{
              id
            }
          }
        }
      }
  }
}`
        })
      })
        .then((r) => r.json())
        .then((data) => (miData = data));
      console.log(miData);
      let hiluzId = miData.data.createAskm.data.id;
        let x = calcX(restime)
      let fd = new Date(Date.now() + x)
            let quee = `mutation 
                        {createTimegrama(
             data:{
               date: "${fd.toISOString()}",
               whatami: "askm",
               askm: ${hiluzId},
             }
           ){
             data {id}
           }
         }`;
      SendTo(quee);
      less();
    } catch (e) {
      error1 = e;
    }
  }

  function nego(oid) {
    console.log('nego', oid);
  }

  async function decline(oid) {
    already = true;
    console.log('decline', oid);
    const ds = declineddarra;
    ds.push(`${oid}`);
    console.log(ds);
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    uId = cookieValueId;
    token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    let link = baseUrl+'/graphql';
    try {
      await fetch(link, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation { updateSp(
   id: "${oid}" 
      data: {declinedm: "${id}" }
  ){
      data {
        attributes{
          declinedm{
            data{
              id
            }
          }
        }
      }
  }
}`
        })
      })
        .then((r) => r.json())
        .then((data) => (miData = data));
      console.log(miData);
      less(oid);
    } catch (e) {
      error1 = e;
    }
  }
  //out:fly={{duration: 2200, opacity: 0.5, y: 450}}

  import { Swiper, SwiperSlide } from 'swiper/svelte';

  // Import Swiper styles
  import 'swiper/css';

  import 'swiper/css/effect-flip';
  import './style.css';

  // import required modules
  import { EffectFlip, Navigation } from 'swiper';
  let hovered = $state(false);

  let w = $derived(0);
  let u = 'הצעה לשיתוף משאב והצטרפות לריקמה';

  function hover(id) {
    if (id == '0') {
      u = 'הצעה לשיתוף משאב והצטרפות לריקמה';
    } else {
      u = id;
    }
    dispatch('hover', { id: u });
  }

  function hoverc(event) {
    if (event.detail.x == '0') {
      u = 'הצעה לשיתוף משאב והצטרפות לריקמה';
    } else {
      u = event.detail.x;
    }
    dispatch('hover', { id: u });
  }
  import Cards from './cards/sugestma.svelte';
  import { SendTo } from '$lib/send/sendTo.svelte';
  import { DialogContent, DialogOverlay } from 'svelte-accessible-dialog';
  import { RingLoader } from 'svelte-loading-spinners';
  import Diun from './diun.svelte';
  import { nowId } from '$lib/stores/pendMisMes.js';
  function claf(event) {
    let o = event.detail.alr;
    let d = event.detail.y;
    console.log(o, d);
  }
  function tochat() {
    isOpen = true;
    diunm = true;
  }
  let clicked = $state(false);
  /** @type {{isVisible?: boolean, modal?: boolean, coinlapach: any, low?: boolean, messege?: any, shows?: boolean, kindOf: any, deadLine: any, sqedualedf: any, projectName: any, mashName: any, descrip: any, src: any, projectId: any, linki?: string, oid?: number, spnot?: string, easy?: number, price?: number, myp?: number, total?: number, askedarr?: any, declineddarra?: any, id: any, i: any, restime: any, already?: boolean, cards?: boolean, chat?: any, order?: number, askId?: number}} */
  let {
    isVisible = false,
    modal = $bindable(false),
    coinlapach,
    low = false,
    messege = [],
    shows = true,
    kindOf,
    deadLine,
    sqedualedf,
    projectName,
    mashName,
    descrip,
    src,
    projectId,
    linki = '/project/',
    oid = 0,
    spnot = '',
    easy = 0,
    price = 0,
    myp = 0,
    total = 0,
    askedarr = [],
    declineddarra = [],
    id,
    i,
    restime,
    already = $bindable(false),
    cards = false,
    chat = $bindable([]),
    order = $bindable(0),
    askId = 1
  } = $props();
  let isOpen = $state(false),
    diunm = $state(false),
    loading = false;
  const close = () => {
    isOpen = false;
    diunm = false;
  };
  let miDatan = [];
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
            smalldes={projectName + '-' + mashName}
            nameChatPartner={`${chatdes2[$lang]}
                              ${projectName} `}
            mypos={true}
            rect={true}
            {clicked}
            pendId={askId}
            profilePicChatPartner={src.length > 0
              ? src
              : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
            ani="iaskedMa"
          />
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>
{#if cards == false}
  <div
    style="position: relative;"
onclick={()=>{modal = true
  dispatch("modal")
dialogOpen = true}}
role="button"
    style:z-index={hovered === false ? 11 : 16}
    onmouseenter={() => (hovered = true)}
    onmouseleave={() => (hovered = false)}
    use:clickOutside
    onclick_outside={toggleShow}
    class="hover:scale-290 duration-1000 ease-in"
    transition:fly|local={{ y: 450, duration: 2200, opacity: 0.5 }}
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
        nextEl: `.normSml${oid}`,
        prevEl: `.normSmll${oid}`
      }}
    >
      <SwiperSlide class="swiper-slideg"
        ><div>
          <div id="normSml">
            <span class={`normSml${oid}`}></span>
            <img
              onmouseenter={() => hover('לוגו הריקמה')}
              onmouseleave={() => hover('0')}
              class="img"
              {src}
              alt="logo"
            />
            <button
              onclick={() => linke()}
              onmouseenter={() => hover('לחיצה למעבר לעמוד הציבורי של הריקמה')}
              onmouseleave={() => hover('0')}
              class="hover:scale-110 lt">{projectName}</button
            >
            <h1
              onmouseenter={() => hover('שם המשאב')}
              onmouseleave={() => hover('0')}
              style="color: var(--barbi-pink); "
              class="ltn"
            >
              {mashName}
            </h1>
            <h3
              onmouseenter={() => hover('שווי')}
              onmouseleave={() => hover('0')}
              class="ltn"
            >
              {price}
            </h3>
            <h3 class="ltn">
              <span
                role="contentinfo"
                onmouseenter={() => hover('ההצעה שלי')}
                onmouseleave={() => hover('0')}
                style="color: var(--gold)">{easy}</span
              >
              /<span
                role="contentinfo"
                onmouseenter={() => hover('ההצעה של הריקמה')}
                onmouseleave={() => hover('0')}
              >
                {myp}</span
              >
            </h3>
            {#if total}
              <p
                onmouseenter={() => hover('סך הכל')}
                onmouseleave={() => hover('0')}
              >
                {total}
              </p>{/if}
          </div>
        </div>
      </SwiperSlide><SwiperSlide class="swiper-slideg"
        ><div id="normSmll">
          <span class={`normSmll${oid}`}></span>

          {#if descrip !== null}<h6
              onmouseenter={() => hover('תיאור')}
              onmouseleave={() => hover('0')}
              class="ab"
            >
              {descrip}
            </h6>{/if}
          <h5
            onmouseenter={() => hover('הערות')}
            onmouseleave={() => hover('0')}
            class="bc"
          >
            {spnot}
          </h5>
          {#if low == false}
            {#if already === false}
              <button
                onmouseenter={() => hover(' אני רוצה')}
                onmouseleave={() => hover('0')}
                onclick={agree(oid)}
                class="btn a"
                name="requestToJoin"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                  /></svg
                ></button
              >
              <!--<button on:click={nego(oid)} name="negotiate" class="btn" title="משא ומתן"><i class="far fa-comments"></i></button>
   -->
              <button
                onmouseenter={() => hover('לא מתאים לי')}
                onmouseleave={() => hover('0')}
                onclick={decline(oid)}
                class="btn b"
                name="decline"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  width="24"
                  height="24"
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
        
  <Cards
    on:agree={() => agree(oid)}
    on:decline={() => decline(oid)}
    on:hover={hoverc}
    on:tochat={tochat}
    {low}
    {mashName}
    {easy}
    {myp}
    {already}
    {deadLine} 
    {sqedualedf}
    {price}
    {total}
    {descrip}
    {projectName}
    {src}
    {spnot}
  />
      </div>
      </Drawer.Content>
      </Drawer.Portal>
      </Drawer.Root>
      </div>
      {/if}
{:else}
  <Cards
    on:agree={() => agree(oid)}
    on:decline={() => decline(oid)}
    on:hover={hoverc}
    on:tochat={tochat}
    {isVisible}
    {low}
    {mashName}
    {easy}
    {myp}
    {already}
    {deadLine} 
    {sqedualedf}
    {price}
    {total}
    {descrip}
    {projectName}
    {src}
    {spnot}
  />
{/if}

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
  .ab {
    grid-column: 1/3;
    grid-row: 1/ 2;
    font-size: 9px;
  }
  .bc {
    grid-column: 1/3;
    grid-row: 2/ 3;
    font-size: 9px;
  }

  .a {
    margin-right: 10px;
    grid-column: 1/2;
  }
  .b {
    margin-left: 10px;
    grid-column: 2/3;
  }
  .ltb {
    margin: 0px;
    font-size: 9px;
    font-weight: bold;
    line-height: 1;
  }
  .ltn {
    margin: 2px;
    font-size: 8px;
    line-height: 1;
    font-weight: bold;
  }
  .lt {
    margin: 1px;
    font-size: 8px;
    line-height: 1;
    font-weight: bold;
  }
  .img {
    margin-top: 0px;
    margin-bottom: 0px;
    margin-right: auto;
    margin-left: auto;
    border-radius: 50%;
    width: 22px;
    height: 22px;
  }
  #normSmll {
    white-space: normal;
    text-align: center;
    align-items: center;
    justify-content: safe center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;
    border-radius: 50%;
    text-shadow: 1px 1px rgb(63, 56, 18);
    background: url(https://res.cloudinary.com/love1/image/upload/v1646313201/turkiz_v5a7c8.jpg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto auto;
  }
  #normSml {
    white-space: normal;
    text-align: center;
    line-height: 0.5;
    align-items: center;
    justify-content: safe center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;
    background-color: rgb(100, 224, 137);
    border-radius: 50%;
    text-shadow: 1px 1px rgb(63, 56, 18);
    background: url(https://res.cloudinary.com/love1/image/upload/v1646313201/turkiz_v5a7c8.jpg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  /*
    .normSmlHover{
        text-shadow: 1px 1px var(--gold);
        color: var(--barbi-pink);
        min-height: 115px;
    min-width: 115px;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1/ 1;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1646313201/turkiz_v5a7c8.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }*/
  .btn {
    grid-row: 3/ 4;
    background-color: rgb(87, 208, 248);
    border-radius: 50%;
    color: var(--barbi-pink);
    text-align: center;
    opacity: 0.6;
    transition: 0.3s;
    padding: 2px;
  }

  .btn:hover {
    opacity: 1;
    padding: 6px;
  }
  @media (min-width: 550px) {
    .a {
      margin-right: 30px;
    }
    .b {
      margin-left: 30px;
    }
    .ltb {
      margin: 0px;
      font-size: 17px;
    }
    .ltn {
      margin: 7px;
      font-size: 13px;
    }
    .lt {
      margin: 2px;
      font-size: 13px;
    }
    .img {
      width: 32px;
      height: 32px;
    }
    .normSml {
      min-height: 125px;
      min-width: 125px;
      max-width: 125px;
      max-height: 125px;
    }
    .normSmlHover {
      height: 195px;
      width: 195px;
    }
  }
</style>
