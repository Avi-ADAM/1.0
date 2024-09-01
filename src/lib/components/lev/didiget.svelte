<script>
  import Chaticon from '../../celim/chaticon.svelte';
  import Diun from './diun.svelte';
  import { toast } from 'svelte-sonner';

      export let modal = false
      export let isVisible = false;
    let dialogOpen = false
  const baseUrl = import.meta.env.VITE_URL
  export let shear = [];
  export let low = false;
  export let sendpropic = '';
  export let sendname = '';
  export let respropic = '';
  export let resname = '';
  export let projectId = '';
  export let kind = '';
  export let projectName = '';
  export let src = '';
  export let myid = '';
  export let pendId = 0;
  export let chat = '';
  export let amount = '';
  export let send = '';
  export let recive = '';
  export let sendcon = false;
  export let coinlapach = '';
  export let already = false;
  import { lang } from '$lib/stores/lang.js';
  import Lowbtni from '$lib/celim/lowbtn.svelte';
  const ishur = { he: 'אישור קבלת', en: 'approve of reciving' };
  const me = { he: 'מאת', en: 'from' };
  //how to recive? discution or build in payments to add
  import { clickOutside } from './outsidclick.js';
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { idPr } from '../../stores/idPr.js';
  import moment from 'moment';
  import ProgressBar from '@okrad/svelte-progressbar';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import { SendTo } from '$lib/send/sendTo.svelte';
  const dispatch = createEventDispatcher();

  export let whyno = [];
  export let hervachti = [];
  export let created_at;
  export let messege = [];
  export let order = messege.length;
  let miDatan = [];
  let error1;
  let bearer1;
  let token;
  let idL;
  let no = false;
  let masa = false;
  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
  let ok;
  let nook;
  let tryo = '116%';
  let tryot = '-10.5%';
  let tryoti = '-5.25%';
  let nut;
  let noofusersOk = sendcon == true ? 1 : 0;
  let noofusersNo = 0;

  let noofusersWaiting = sendcon == true ? 1 : 2;
  async function xyz() {
    ok = percentage(noofusersOk, 2);
    nook = percentage(noofusersNo, 2);
    nut = percentage(noofusersWaiting, 2);
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

  let ser = xyz();

  function coinLapach() {
    isOpen = false;
    console.log('here');
    dispatch('coinLapach', {
      ani: 'vidu',
      coinlapach: coinlapach
    });
  }

  function objToString(obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      for (const [p, val] of Object.entries(obj[i])) {
        if ((typeof val == 'number') | 'boolean') {
          str += `{${p}:${val}\n},`;
        } else if (typeof val == 'string') {
          str += `{${p}:"${val}"\n},`;
        } else if (typeof val == 'null') {
          str += `{${p}:${val.map((c) => c.id)}\n},`;
        }
      }
    }
    return str;
  }
  let linkg = baseUrl+'/graphql';
  const suc = { he: 'בוצע בהצלחה', en: 'appruved sucssefully!' };
  const er = {
    he: 'אם הבעיה נמשכת baruch@1lev1.com שגיאה יש לנסות שנית, ניתן ליצור קשר במייל  ',
    en: 'error: please try again, if the problem continue contact at baruch@1lev1.com'
  };

  async function agree(alr) {
    if (alr == 'alr') {
      alert('soon');
    } else {
      let miDatani = [];
      already = true;
      noofusersOk += 1;
      noofusersWaiting -= 1;
      ser = xyz();
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
      if (kind == 'send') {
        try {
          await fetch(linkg, {
            method: 'POST',
            headers: {
              Authorization: bearer1,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: `mutation { 
  updateHaluka(
      id: ${pendId}
      data: { 
 senderconf: true
 }
  ){data {id}}
 } `
            })
          })
            .then((r) => r.json())
            .then((data) => (miDatan = data));
          console.log(miDatan);
          coinLapach();
        } catch (e) {
          error1 = e;
          console.log(error1);
        }
      } else if (kind == 'recive') {
        let add = ``;

        let allsp = spCheck();
        console.log(hervachti, allsp, shear);

        if (allsp == true) {
          for (let u = 0; u < hervachti.length; u++) {
            const element = hervachti[u];
            if (element.noten == true || element.mekabel == true) {
              const iduse = element.users_permissions_user.data.id;
              const amount =
                element.users_permissions_user.data.attributes.hervachti +
                element.amount;
              add = `
        mutation {
        updateUsersPermissionsUser(
    id:${iduse} 
      data: { hervachti: ${amount} }
    
  ){
      data {
        id
  }
}
}
        `;
              let t = await SendTo(add);
              if (t?.data == null) {
                toast.warning(er[$lang]);
              } else {
                console.log(t);
              }
            }
          }
        }
        let que = `mutation { 
  updateHaluka(
      id: ${pendId}
      data: { 
        confirmed: true
 }
  ){data {id}}
 } `;
        console.log(que);
        try {
          let res = await SendTo(que).then((res) => (res = res));
          console.log(res);
          if (res.data != null) {
            toast.success(suc[$lang]);
            coinLapach();
          } else {
            toast.warning(er[$lang]);
          }
        } catch (e) {
          console.error(e);
          toast.warning(`${er[$lang]}.${e.status},${e.message}`);
        }
      }
    }
  }
  function spCheck() {
    if (shear.length > 1) {
      for (let i = 0; i < shear.length; i++) {
        const element = shear[i];
        if (element.id != pendId) {
          if (element.attributes.confirmed != true) return false;
        }
      }
      return true;
    } else {
      return true;
    }
  }
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  async function nego(alr) {
    /*
  already = true;
        console.log("nego")   
        no = false;
         masa = true;
            isOpen = true;*/
    console.log(no);
  }
  function decline(alr) {
    /*
      if  (alr == "alr"){*/
    alert('soon');
    /*  } else{

      already = true;

      no = true;
            isOpen = true;
        //create why alert (from smui) add validation for minimum 
        // send why with userss, create way to show why for all agreed users and for them to response.
	}*/
  }
  let why;
  let isOpen = false;

  async function afterwhy() {
    /*
        if (why.length > 20) {
          
    isOpen = false;
  already = true;
   noofusersNo += 1;
  noofusersWaiting -= 1;
  ser = xyz();      
    const userss = objToString(users);
    const diunim = objToString(diun);  
  const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
     bearer1 = 'bearer' + ' ' + token;
        try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation {  updateTosplit(
id: ${pendId}
      data: { vots:[  ${userss},      
     {
      what: false
      why: "${why}"
      users_permissions_user: "${idL}"
    }
  ],
 }
  ){data { vots { users_permissions_user {data{ id}}}}}
} `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
                 coinLapach()
        } catch (e) {
            error1 = e
            console.log(error1)
        }
    } else{
          console.log("decline",why)
            alert("מינימום 20 תווים")
            already = false;
        }
           
*/
  }
  const close = () => {
    isOpen = false;
    no = false;
    masa = false;
    already = false;
    allr = false;
    rect = false;
  };

  function afternego(event) {
    isOpen = false;
    no = false;
    masa = false;
    //dispach or update  coin to negotiable state
  }

  $: pcli = 0;
  $: pmcli = 0;
  function linke() {
    pcli += 1;
    if (pcli >= 2) {
      dispatch('proj', { id: projectId });
    }
  }
  function project(id) {
    pmcli += 1;
    if (pmcli >= 2) {
      idPr.set(id);
      goto('/moach');
    }
  }
  let rect = false;
  let allr = false;
  async function react() {
    allr = true;
    rect = true;
    isOpen = true;
  }
  async function afreact(event) {
    why = event.detail.why;
    const diunim = objToString(chat);

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
    let d = new Date();
    try {
      await fetch(linkg, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation { updateHaluka(
id: ${pendId}
      data: { chatre:[  ${diunim}, 
         
     {
      when: "${d.toISOString()}"
      send: "${idL}"
      freetext: "${why}"
    }
  ]}
  ){data {id attributes{chatre{freetext send {data{id attributes{username profilePic{data{attributes{url}}}}}}when seen} }}}
} `
          // make coin desapire
        })
      })
        .then((r) => r.json())
        .then((data) => (miDatan = data));
      console.log(miDatan);
      if (miDatan.data?.updateHaluka.data.attributes.chatre) {
        const chati = miDatan.data?.updateHaluka.data.attributes.chatre;
        messege = [];
        for (let t = 0; t < chati.length; t++) {
          messege.push({
            message: chati.freetext,
            when: chati.when,
            pic: chati.send.data.attributes.profilePic?.data.attributes.url,
            sentByMe: chati.send.data.id === idL ? true : false,
            seen: chati.seen
          });
        }
        messege = messege;
        toast.success(`${fnnn[$lang]}`);

        setTimeout(function () {
          isOpen = false;
        }, 15000);
      }
      //todo send mail to secund one
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

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
  $: w = 0;
  let u = {
    he: `אישור ${kind == 'send' ? 'העברת' : 'קבלת'} כספים על פי החלוקה שנקבעה`,
    en: `apruval of ${
      kind == 'send' ? 'sending' : 'reciving'
    } money acording to the appruved spliting`
  };

  let hovered = false;
  function hover(id) {
    let t;
    if (id == '0') {
      t = u[$lang];
    } else {
      t = id;
    }
    dispatch('hover', { id: t });
  }
  function hoverede() {
    hovered = !hovered;
    let t;
    if (hovered == false) {
      t = 'לב המערכת';
    } else {
      t = u[$lang];
    }
    dispatch('hover', { id: t });
  }
  function hoverc(event) {
    let t;
    if (event.detail.x == '0') {
      t = u[$lang];
    } else {
      t = event.detail.x;
    }
    dispatch('hover', { id: t });
  }
  import Cards from './cards/haluka.svelte';
  export let cards = false;
  function claf(event) {
    let o = event.detail.alr;
    let d = event.detail.y;
    console.log(o, d);
  }
  let apru = {
    he: `אישור ${kind == 'send' ? 'שהעברתי' : 'שקיבלתי'} את הכסף`,
    en: `I already ${kind == 'send' ? 'send' : 'recive'} the money`
  };
  let mes = { he: ``, en: `` };
  let noo = { he: ``, en: `` };
  const fnnn = { he: 'ההודעה נשלחה בהצלחה', en: 'messege send sucsessfully' };
</script>

{#await ser}
  <h1>..</h1>
{:then ser}
  <DialogOverlay class="overlay" {isOpen} onDismiss={close}>
    <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}>
      <DialogContent class="chat d" aria-label="form">
        <div dir="rtl" class="grid items-center justify-center aling-center">
          <button
            on:click={close}
            style="margin: 0 auto;"
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title="ביטול"
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg></button
          >
          {#if no === true}
            <input
              minlength="26"
              type="text"
              bind:value={why}
              placeholder="יש לנמק מדוע ההצעה נדחית על ידך"
            />
            <button on:click={afterwhy}>אישור</button>
          {:else if rect === true}
            <Diun
              on:rect={afreact}
              on:no={afterwhy}
              money={true}
              {no}
              rect={true}
              smalldes={projectName}
              nameChatPartner={`צ'אט על העברת כסף`}
              mypos={true}
              profilePicChatPartner={src}
              messages={messege}
            />
          {:else if masa === true}
            <h2 class="bg-gold text-barbi text-center">
              .יבנה במהרה בימינו אמן בנתיים יש להגיב לא ולנמק ואז ליצור משאב חדש
              עם המאפיינים הרצויים
            </h2>
            <!--
<Nego
        on:close={afternego}
  descrip ={descrip}
  projectName ={projectName}
  name1 ={name}
  hearotMeyuchadot = {hearotMeyuchadot}
  kindOf ={kindOf}
  hm = {hm}
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
/>-->
          {/if}
        </div>
      </DialogContent>
    </div>
  </DialogOverlay>
  {#if cards == false}
    <div
      use:clickOutside
      on:click_outside={toggleShow}
      on:click={()=>{modal = true
  dispatch("modal")
dialogOpen = true}}
role="button"
      style="position: relative;"
      style:z-index={hovered === false ? 11 : 16}
      on:mouseenter={() => hoverede()}
      on:mouseleave={() => hoverede()}
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
          nextEl: `.normSml-${projectId}-vii`,
          prevEl: `.normSmll-${projectId}-viii`
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
        <SwiperSlide class="swiper-slideg">
          <div id="normSml">
            <button
              on:click={() => project()}
              on:mouseenter={() =>
                hover(` לחיצה למעבר למוח הריקמה ${projectName}`)}
              on:mouseleave={() => hover('0')}
            >
              <img class="img" {src} alt="projectlogo" />
            </button>
            <!----  <h1 class="{`normSml-${projectId}-vii`} pn" >{ishur[$lang]}</h1>-->
            <div class="flex flex-row align-middle justify-center">
              <div class="text-center">
                <img
                  src={respropic}
                  class="rounded-full w-8 mb-1 mx-auto"
                  alt="Avatar"
                />
                <h5 class="text-s font-medium leading-tight mb-2">{resname}</h5>
                <!--- <p class="text-gray-500">Web designer</p>-->
              </div>
              <div class="containers h-14">
                <div class="background-container" />
                <div class="rect-container">
                  <div class="rect" />
                </div>
                <div class="text-container">
                  <div class="text-holder">
                    <span class="work-description">{amount}</span>
                  </div>
                </div>
              </div>
              <div class="text-center">
                <img
                  src={sendpropic}
                  class="rounded-full w-8 mb-1 mx-auto"
                  alt="Avatar"
                />
                <h5 class="text-s font-medium leading-tight mb-2">
                  {sendname}
                </h5>
                <!----<p class="text-gray-500">Web designer</p>-->
              </div>
            </div>

            <!--
       <p class="p">
         <span on:mouseenter={()=>hover("בעד")} 
          on:mouseleave={()=>hover("0")} 
          style="color:#7EE081;" >{sendname} </span>
          <span on:mouseenter={()=>hover("לא הצביעו")} 
            on:mouseleave={()=>hover("0")} 
            style="color:#0000cc;" >{amount} </span>
          <span on:mouseenter={()=>hover("נגד")} 
            on:mouseleave={()=>hover("0")}  style="color:#80037e;" >{resname} </span></p>
          -->
          </div>
        </SwiperSlide><SwiperSlide class="swiper-slideg"
          ><div id="normSmll">
            <button
              on:click={() => linke()}
              on:mouseenter={() => hover('לחיצה למעבר לדף הציבורי של הריקמה')}
              on:mouseleave={() => hover('0')}
              class="ab pn"
              ><h3 class="ab pn pt-8 px-2">{projectName}</h3></button
            >
            <div class={`normSmll-${projectId}-viii`} />

            {#if whyno.length > 0}<h4
                class="bc"
                style="color:var(--barbi); font-size:10px; font-weight:bold;"
                on:mouseenter={() => hover('טענת הנגד האחרונה שעלתה')}
                on:mouseleave={() => hover('0')}
              >
                {amount}
              </h4>{/if}
            {#if low == false}
              {#if already === false}
                <button
                  on:mouseenter={() => hover(apru[$lang])}
                  on:mouseleave={() => hover('0')}
                  on:click={agree}
                  style="margin: 0;"
                  class="btn a"
                  name="requestToJoin"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    version="1.1"
                    class="btin"
                    viewBox="0 0 24 24"
                    ><path
                      d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                    /></svg
                  ></button
                >
                <button
                  on:mouseenter={() => hover(mes[$lang])}
                  on:mouseleave={() => hover('0')}
                  on:click={react}
                  style="margin: 0;"
                  class="btn b"
                  name="negotiate"><Chaticon /></button
                >
                <button
                  on:mouseenter={() => hover(noo[$lang])}
                  on:mouseleave={() => hover('0')}
                  on:click={decline}
                  style="margin: 0;"
                  class="btn c"
                  name="decline"
                  title="התנגדות"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    version="1.1"
                    class="btin"
                    viewBox="0 0 24 24"
                    ><path
                      d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                    /></svg
                  ></button
                >
              {:else if already === true}
                <button
                  on:mouseenter={() => hover(apru[$lang])}
                  on:mouseleave={() => hover('0')}
                  on:click={() => nego('alr')}
                  style="margin: 0;"
                  class="btn a"
                  name="negotiate"
                  title="משא ומתן"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    version="1.1"
                    class="btin"
                    viewBox="0 0 24 24"
                    ><path
                      d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
                    /></svg
                  ></button
                >
                <button
                  on:mouseenter={() => hover(mes[$lang])}
                  on:mouseleave={() => hover('0')}
                  on:click={() => decline('alr')}
                  style="margin: 0;"
                  class="btn b"
                  name="decline"
                  title="התנגדות"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    version="1.1"
                    class="btin"
                    viewBox="0 0 24 24"
                    ><path
                      d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                    /></svg
                  ></button
                >
                <button
                  on:mouseenter={() => hover(noo[$lang])}
                  on:mouseleave={() => hover('0')}
                  class="text-barbi bg-gold j c"
                  on:click={() => react()}>תגובה</button
                >
                <!----   {:else if already === true && mypos === false && diun.length > 0  && allr === false}
 <button on:mouseenter={()=>hover("אישור")} 
            on:mouseleave={()=>hover("0")} on:click={() => agree("alr")} style="margin: 0;" class = "btn a" name="requestToJoin" title="אישור"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
        <button on:mouseenter={()=>hover("משא ומתן")} 
            on:mouseleave={()=>hover("0")}  on:click={() => nego("alr")} style="margin: 0;" class = "btn b" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
        <button on:mouseenter={()=>hover("תגובה")} 
            on:mouseleave={()=>hover("0")} class="c" on:click={() => react()}>תגובה</button>-->
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
      on:agree={claf}
      on:decline={claf}
      on:hover={hoverc}
      {why}
      {already}
      {projectName}
      {src}
      {noofusersWaiting}
      {noofusersOk}
      {noofusersNo}
    />
      </div>
      </Drawer.Content>
      </Drawer.Portal>
      </Drawer.Root>
      </div>
      {/if}
  {:else}
    <Cards
      on:agree={claf}
      on:decline={claf}
      on:hover={hoverc}
      {why}
      {isVisible}
      {already}
      {projectName}
      {src}
      {noofusersWaiting}
      {noofusersOk}
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
  .background-container {
    height: 25px;
    width: 50px;
    float: left;
    border: 1px solid var(--barbi-pink);
    position: relative;
    z-index: 0;
    background: var(--barbi-pink);
    box-shadow: 0px 0px 7.5px black;
  }
  .text-container {
    height: 25px;
    width: 50px;
    float: left;
    border: 2px solid var(--barbi-pink);
    position: absolute;
    z-index: 1;
    background: var(--barbi-pink);
  }
  .rect-container {
    margin-top: 12.5px;
    float: left;
    position: relative;
    left: 0;
    z-index: 0;
    /*   overflow: hidden; */
    height: 38px;
    transform: scaleY(2.4);
  }
  .rect {
    position: relative;
    top: 0;
    height: 25px;
    width: 00px;
  }

  .rect:after {
    display: block;
    height: 7px;
    width: 7px;

    position: absolute;
    z-index: 3;
    left: -4px;
    top: 7.45px;

    content: '';
    background: var(--barbi-pink);
    border: 1px solid var(--barbi-pink);
    box-shadow: 0px 0px 7.5px black;

    transform: rotate(45deg);
  }

  .text-holder {
    background: var(--gold);
  }

  .work-description {
    display: block;
    text-align: center;
    color: var(--barbi-pink);
    font-family: sans-serif;
  }

  .work-header {
    border-bottom: 2px var(--barbi-pink) solid;
    font-weight: bold;
  }

  .work-description {
    font-size: 12px;
    height: 20px;
  }
  .j {
    font-size: 12px;
  }
  .btin {
    width: 13px;
    height: 13px;
  }
  .ab {
    grid-column: 1/4;
    grid-row: 1/ 2;
  }
  .bc {
    grid-column: 1/4;
    grid-row: 2/ 3;
  }
  .cd {
    grid-column: 1/4;
    grid-row: 3/ 4;
  }
  .de {
    grid-column: 1/4;
  }
  .a {
    grid-row: 5/ 6;
    grid-column: 1/2;
  }
  .b {
    grid-row: 5/ 6;

    grid-column: 2/3;
  }
  .c {
    grid-column: 3/4;
    grid-row: 5/ 6;
  }
  .pnn {
    color: var(--gold);

    font-weight: bold;
    line-height: 0.7;
  }
  .pn {
    text-shadow: 1px 1px var(--gold);

    font-weight: bold;
    color: var(--barbi-pink);
  }
  .p {
    font-weight: bold;
    font-size: 18px;
  }
  .mn {
    font-weight: bold;
    color: rgb(87, 208, 248);
    line-height: 0.7;
  }
  .na {
    color: aqua;
    line-height: 1;
    font-weight: bold;
  }
  .img {
    margin-right: auto;
    margin-left: auto;
    border-radius: 50%;
    width: 25px;
    height: 25px;
  }
  input[type='text'] {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
    border: 1px solid var(--lturk);
    width: 250px;
    height: 30px;
    padding-left: 10px;
    padding-right: 10px;
  }

  input[type='text']:focus {
    outline: none;
    border: 2px solid var(--lturk);
    color: #2d9fd9;
  }

  input[type='text']:invalid {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
    border: 2px dashed var(--lturk);
    width: 250px;
    height: 30px;
    color: red;
    padding-left: 10px;
    padding-right: 10px;
  }
  #normSmll {
    display: grid;
    font-size: 9px;
    text-align: center;
    line-height: 0.8;
    align-items: center;
    justify-content: center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;
    grid-template-rows: repeat(4, 1fr);
    grid-template-columns: repeat(3, 1fr);
    border-radius: 50%;
    text-shadow: 1px 1px rgb(63, 56, 18);

    background: url(https://res.cloudinary.com/love1/image/upload/v1650291863/Prismatic-Low-Poly-Sphere-4_smpaxv.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }

  #normSml {
    font-size: 9px;

    text-shadow: 1px 1px rgb(1, 1, 1);
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1/ 1;
    border-radius: 50%;
    line-height: normal;
    text-align: center;
    background: url(https://res.cloudinary.com/love1/image/upload/v1650291863/Prismatic-Low-Poly-Sphere-4_smpaxv.svg);
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
    margin-right: 4px;
    margin-left: 4px;
    grid-row: 5/ 6;
  }

  .btn:hover {
    opacity: 1;
    padding: 6px;
  }

  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 100;
  }
  :global([data-svelte-dialog-content].content) {
    width: 80vw;
    z-index: 299;
  }
  @media (min-width: 568px) {
    .btin {
      width: 24px;
      height: 24px;
    }
  }
  @media (min-width: 550px) {
    #normSml {
      font-size: 13px;
    }
    #normSmll {
      display: grid;
      font-size: 13px;
      text-align: center;
      line-height: 0.8;
    }

    .pnn {
      font-size: 13px;
    }

    .p {
      font-size: 26px;
    }
    .mn {
      font-size: 13px;
    }
    .na {
      font-size: 13px;
    }
    .img {
      width: 46px;
      height: 46px;
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
  :global([data-svelte-dialog-content].nego) {
    z-index: 1000;
    padding: 15px;
    background-color: #242526;
    margin: 0px;
    margin-right: 25px;

    height: 70vh;
    width: fit-content;
    margin-top: 30vh;
    border-radius: 5%;
    overflow-y: auto;
    border-top-right-radius: 2%;
    border-bottom-right-radius: 2%;
  }
  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }

  @media (min-width: 600px) {
    :global([data-svelte-dialog-content].chat) {
      overflow-y: auto;
      z-index: 1000;
      padding: 0px;
      background-color: #242526;
      margin: 0px;
      height: 80vh;
      margin-top: 20vh;
      border-radius: 5%;
    }
    :global([data-svelte-dialog-content].nego) {
      overflow-y: auto;
      z-index: 1000;
      padding: 15px;
      margin-right: 25px;
      background-color: #242526;
      margin: 0px;
      margin-top: 20vh;
      height: 80vh;
      width: fit-content;
      border-radius: 5%;
      border-top-right-radius: 2%;
      border-bottom-right-radius: 2%;
    }
    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
    }
  }
</style>
