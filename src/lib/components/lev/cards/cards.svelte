<script>
    import Lowding from '$lib/celim/lowding.svelte'
    import {lang} from '$lib/stores/lang.js'
     import MissionInProgress from "../../../components/lev/missionInProgress.svelte"
    import ProjectSuggestor from "../../../components/lev/projectSuggestor.svelte"
    import Reqtojoin from '../../../components/lev/reqtojoin.svelte';
    import PendingM from "../../../components/lev/pandingMesima.svelte";
    import PendingMa from "../../../components/lev/pmas.svelte"
    import Welcomt from "../../../components/lev/welcomTo.svelte";
    import Fiappru from '../../../components/lev/fiappru.svelte';
        import Mashsug from '../../../components/lev/mashsuggest.svelte'
        import Reqtom from '../../../components/lev/reqtom.svelte'
        import Weget from '../../../components/lev/weget.svelte'
        import Hal from '../../../components/lev/halukaask.svelte'
      //import { fly } from 'svelte/transition';
      import { createEventDispatcher } from 'svelte';
    import Header from './../../header/header.svelte'
const dispatch = createEventDispatcher();
  import { Swiper, SwiperSlide } from "swiper/svelte";
  import { afterUpdate } from 'svelte'
  // Import Swiper styles
  import "swiper/css";
  import "swiper/css/navigation";

  import "swiper/css/effect-cards";
  import "swiper/css/keyboard"
  import "swiper/css/mousewheel"
  import "./stylec.css";

  // import required modules
  import {Manipulation, Mousewheel, Keyboard, EffectCards , Navigation} from "swiper";
  export let low = false;
  export let cards = true;
   import Switch from './../../../celim/switch.svelte'
  import DecisionMaking from '../decisionMaking.svelte';
  let h ;

export let askedarr = [], declineddarr = [], arr1 = [];
let swiperRef = null;
export let indexi = -1

$:if (indexi != -1){
  swiperRef.slideTo(indexi)
  indexi = -1
}
  const setSwiperRef = ({ detail }) => {
    const [swiper] = detail;
    // set swiper instance
    setTimeout(() => {
      swiperRef = swiper;
    });
  };
  function change(){
    console.log(cards,"change")
      console.log("will change")
        dispatch("cards",{cards:false})
  }
  let slideIndex;
                let milon = {fiap : true, welc: true, sugg: true, pend: true, asks: true, betaha: true, desi: true, ppmash: true, pmashs: true, pmaap: true, askmap: true,hachla: true}
afterUpdate(async () => {
if (swiperRef !== null) {
  swiperRef.update()
}
})
                async function delo (event){
    console.log("slideIndex")
  slideIndex = event.detail.coinlapach 

 // swiperRef.removeSlide(slideIndex)
  //  	

   dispatch("start", {cards: false,ani:event.detail.ani,coinlapach:event.detail.coinlapach})
// let oldob = arr1;
// const x = oldob.map(c => c.coinlapach);
// const indexy = x.indexOf(event.detail.coinlapach);
// oldob.splice(indexy, 1); 
// arr1 = oldob 
 
 
 
// arr1 = [...arr1] 
}
function user (event) {
 dispatch("user", {id: event.detail.id})
}

function hover (event) {
    
 dispatch("hover", {id: event.detail.id})
}
function chat(){}

function proj (event){
  console.log(event.detail.id)
     dispatch("proj", {id: event.detail.id})
}
let hovered = false
const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
let d = {"he":"לב 1💗1","en":"heart of 1💗1"};
let u = {"he":"לב 1💗1","en":"heart of 1💗1"};
const nexttitle = {"he":" יאללה נקסט!","en":"  next!"}
const pretitle = {"he":"רגע, מה זה היה?","en":"wait.. what was that?"}	
function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = d[$lang]
  } 
  dispatch("hover", {id: u});
 }
function hoverc (id){
  if (id == "0"){
        u = d[$lang]
  } else {
    u = id
  }

  dispatch("hover", {id: u});
}
</script>
<style>
 
   .body{
      height: 100vh !important;
      width: 100vw !important;
      border: none;
      height: 100%;
      width: 100%;
      background: #ffcba4;
      background: linear-gradient(to bottom, #ffcba4 0%, #f0bc95 100%);
      overflow: hidden;
    }

.bg{
        position: absolute;
        top: 95% ;
        left: 50%;
      transform: translate(-50%, -50%);
    }
    .next{
        position : absolute;
        top: calc(50% - 15px);
        left: calc(100% - 50px);
        height: 30px;
        width: 50px;
    }
      .perv{
        position : absolute;
        top: calc(50% - 15px);
        right: calc(100% - 50px);
        height: 30px;
        width: 50px;
    }
        @media (min-width: 528px){
    .next{
        position : absolute;
        top: calc(50% - 35px);
        left: calc(100% - 90px);
        height: 70px;
        width: 90px;
    }
      .perv{
        position : absolute;
        top: calc(50% - 35px);
        right: calc(100% - 90px);
        height: 70px;
        width: 90px;
    }
    }
 
</style>
<span role="contentinfo" on:mouseenter={()=> hoverc(" ניווט: לעמוד הפרופיל האישי מימין, למוח הרקמות משמאל")} 
on:mouseleave={()=> hoverc("0")}>
       <Header second="./moach" secondTitle=""/>
       </span>
       {#key arr1}
      {#key low}
       {#if arr1.length > 0}
<div     dir="{$lang == "he" ? "rtl" : "ltr"}" bind:clientWidth={h}
 class="body dark:bg-gradient-to-br dark:from-black dark:via-slate-900 dark:via-slate-800 dark:via-slate-600 dark:to-slate-400 box-border h-screen">
     <img on:mouseenter={()=> hoverc(nexttitle[$lang])} 
on:mouseleave={()=> hoverc("0")} class="{$lang == "he" ? "perv" : "	next"	}" src="{srcb[$lang]}" alt="{$lang == "he" ? "חזרה" : "	next"	}"/>

        <img on:mouseenter={()=> hoverc(pretitle[$lang])} 
on:mouseleave={()=> hoverc("0")} class="{$lang == "he" ? "next" : "perv"	}" src="{srca[$lang]}" alt="{$lang == "he" ? "הבא" : "	next"	}"/>
    <div   
      dir="ltr" role="contentinfo" on:mouseenter={()=> hoverc("שינוי התצוגה מקלפים למטבעות")} 
on:mouseleave={()=> hoverc("0")} 
 style:visibility={low == true ? "hidden":  "visible"} class="bg">
 
 <Switch bind:value={cards} on:change={()=>change()}  design="multi" options={[true, false]} />                

</div>

<span role="contentinfo" class="swi"  on:mouseenter={()=> hoverede()}  
on:mouseleave={()=> hoverede()} >
{#key arr1}
<Swiper 
  on:swiper={setSwiperRef}
  keyboard={{
    enabled: true,
  }}  
mousewheel={{
  eventsTarget: "wrapper",
}}
  effect={h > 370 ? "cards" : ""}
    cardsEffect={{ rotate: h > 450 ? true : false ,perSlideOffset: h > 450 ? 8 : 8}}
  grabCursor={true}
  modules={[Manipulation, Mousewheel, Keyboard, EffectCards, Navigation]}
  class="mySwiperc swiperc"
      dir="rtl"
    loop="true"
    navigation={{
    nextEl: $lang == "he" ? ".perv" : ".next",
     prevEl: $lang == "he" ? ".next" : ".perv"
  }}
>
{#each arr1 as buble, i}
{#if buble.ani === "haluk" && milon.desi == true}
<SwiperSlide  class="swiper-slidec"><Hal    
    user_1s={buble.user_1s}
          on:hover={hover}
 on:proj={proj}
 on:user={user}
 {low}
 cards="true"
     coinlapach={buble.coinlapach} 
    myid={buble.myid}
    pendId={buble.pendId}
    mypos={buble.mypos}
    projectName={buble.projectName} 
    name={buble.name} 
    src={buble.src}
    projectId={buble.projectId}
    noofusersOk={buble.noofusersOk}
    noofusersNo={buble.noofusersNo}
    noofusersWaiting={buble.noofusersWaiting}
    noofusers={buble.noofusers}
    already={buble.already}
    created_at={buble.created_at}
    users={buble.users}
    diun={buble.diun}
    order={buble.order}
                               /></SwiperSlide>
{:else if buble.ani === "mtaha" &&  milon.betaha == true}
 <SwiperSlide class="swiper-slidec"><MissionInProgress
  on:proj={proj}
  cards="true"
 on:user={user}  
  on:hover={hover}
    {low}
                pu={buble.pu}
  hearotMeyuchadot={buble.hearotMeyuchadot}
    tasks={buble.acts.data}
    status={buble.status}
    tx={buble.tx}
    iskvua={buble.iskvua}
    coinlapach={buble.coinlapach} 
    usernames={buble.usernames}
    noofpu={buble.noofpu}
    oldzman={buble.timer}
    stname={buble.stname}
    mId={buble.id}
    missId={buble.mission.data.id}
    missionName={buble.name}
    projectId={buble.project.data.id}
    projectName={buble.projectName}
    missionDetails={buble.descrip}
    src={buble.src}
    link={buble.privatlinks}
    dueDateOrCountToDedline ={buble.admaticedai}
    hoursdon ={buble.howmanyhoursalready}
    hourstotal = {buble.hoursassinged}
    perhour = {buble.perhour}
    on:done={delo}
    /></SwiperSlide>
{:else if buble.ani === "pmashes" && milon.ppmash == true}
  <SwiperSlide class="swiper-slidec"><PendingMa
              on:hover={hover}
  on:proj={proj}
 on:user={user}
         cards="true"
{low}
     coinlapach={buble.coinlapach} 
        on:coinLapach={delo}
        restime={buble.restime}
        ordern={buble.orderon}
        timegramaId={buble.timegramaId}
                 messege={buble.messege}
        mysrc={buble.mysrc}
        mypos={buble.mypos}
        diun={buble.diun}
      descrip={buble.descrip}
      projectName = {buble.projectName}
      name = {buble.name}
              hearotMeyuchadot = {buble.hearotMeyuchadot}
              kindOf = {buble.kindOf} 
              src = {buble.src}
               noofusersWaiting={buble.noofusersWaiting}
                projectId={buble.projectId}
                noofusersOk={buble.noofusersOk}
                created_at={buble.created_at}
                noofusersNo={buble.noofusersNo}
                already={buble.already}
                noofusers={buble.noofusers}
                mshaabId={buble.mshaabId}
                hm={buble.hm}
                price={buble.price}
                easy={buble.easy}
                sqadualed={buble.sqadualed}
                sqadualedf={buble.sqadualedf}
                linkto={buble.linkto}
                pendId={buble.pendId}
                users={buble.users}
                /></SwiperSlide>
  {:else if buble.ani === "pends" && milon.pend == true}
  <SwiperSlide class="swiper-slidec"><PendingM
              on:hover={hover}
  on:proj={proj}
 on:user={user}
        on:coinLapach={delo}
        timegramaId={buble.timegramaId}
        {low}
        createdAt={buble.createdAt}
        restime={buble.restime}
          timegramaDate={buble.timegramaDate}
                            publicklinks={buble.publicklinks}
                            privatlinks={buble.privatlinks}
            dates={buble.dates}
            ordern={buble.orderon}
            coinlapach={buble.coinlapach} 
          messege={buble.messege}
        mysrc={buble.mysrc}
        mypos={buble.mypos}
      descrip={buble.descrip}
      projectName = {buble.projectName}
      name = {buble.name}
              hearotMeyuchadot = {buble.hearotMeyuchadot}
              noofhours = {buble.noofhours} 
              src = {buble.src}
               noofusersWaiting={buble.noofusersWaiting}
                projectId={buble.projectId}
                uids={buble.uids}
                what={buble.what}
                noofusersOk={buble.noofusersOk}
                total={buble.noOfHours * buble.perhour}
                perhour={buble.perhour}
                noofusersNo={buble.noofusersNo}
                already={buble.already}
                noofusers={buble.noofusers}
                missionId={buble.missionId}
                skills={buble.skills}
                tafkidims={buble.tafkidims}
                workways={buble.workways}
                mdate={buble.mdate}
                vallues={buble.vallues}
                pendId={buble.pendId}
                isKavua={buble.isKavua}
                diun={buble.diun}
                users={buble.users}
                cards="true"
                /></SwiperSlide>
{:else if buble.ani === "wegets" && milon.pmaap == true}
    <SwiperSlide class="swiper-slidec"><Weget
            on:acsept={delo}
            cards="true"
            on:decline={delo}
                  on:hover={hover}
          on:proj={proj}
 on:user={user}
 {low}
     coinlapach={buble.coinlapach} 
            mId={buble.mId}
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            kindOf={buble.kindOf}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            myp={buble.myp}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            spid = {buble.spid} 
            src = {buble.src}
            price={buble.price}
            hm={buble.hm}
            src2 = {buble.src2}
            why={buble.why}
            whatt={buble.whatt}
            missionBName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            sqadualedf={buble.sqadualedf}
             sqadualed={buble.sqadualed}
            spnot={buble.spnot}
            easy ={buble.easy}
            nhours={buble.nhours}
            deadline={buble.deadline}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                /></SwiperSlide>
    {:else if buble.ani === "fiapp" && milon.fiap == true}
            <SwiperSlide class="swiper-slidec"><Fiappru
            on:acsept={delo}
            on:decline={delo}
                  on:hover={hover}
    on:proj={proj} 
 on:user={user}
 cards="true"
 {low}
     coinlapach={buble.coinlapach} 
             mId={buble.mId}
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            what={buble.what}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            missionDetails = {buble.descrip} 
            src = {buble.src}
            src2 = {buble.src2}
            why={buble.why}
            whatt={buble.whatt}
            whattid={buble.whattid}
            missionBName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            publicklinks={buble.publicklinks}
             privatlinks={buble.privatlinks}
            hearotMeyuchadot={buble.hearotMeyuchadot}
            valph ={buble.perhour}
            nhours={buble.nhours}
            deadline={buble.deadline}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                /></SwiperSlide><!--
{:else if buble.ani === "walcomen" && milon.welc == true}
   <SwiperSlide class="swiper-slidec"><Welcomt 
    id={buble.id}
        coinlapach={buble.coinlapach} 

          on:hover={hover}
       username={buble.username}
       projectName={buble.projectName}
       /></SwiperSlide>
   -->{:else if buble.ani === "askedcoin" && milon.asks == true}
        <SwiperSlide class="swiper-slidec"><Reqtojoin
            on:acsept={delo}
                  on:hover={hover}
            on:proj={proj}
     on:user={user}
            on:decline={delo}
            cards="true"
            iskvua={buble.iskvua}
            email={buble.email}
            role={buble.role}
            coinlapach={buble.coinlapach} 
            {low}
            pid={buble.pid}
            chat={buble.chat}
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            what={buble.what}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            missionDetails = {buble.descrip} 
            src = {buble.src}
            src2 = {buble.src2}
            openmissionName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            publicklinks={buble.publicklinks}
             privatlinks={buble.privatlinks}
            hearotMeyuchadot={buble.hearotMeyuchadot}
            valph ={buble.perhour}
            nhours={buble.nhours}
            deadline={buble.deadline}
            sqedualed={buble.sqedualed}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                /></SwiperSlide>
{:else if buble.ani === "askedm" && milon.askmap == true}
        <SwiperSlide class="swiper-slidec"><Reqtom
            on:acsept={delo}
            on:decline={delo}
                  on:hover={hover}
            on:proj={proj}
            cards="true"
 on:user={user}
 on:chat={chat}
 {low}
            pid={buble.pid}
                coinlapach={buble.coinlapach} 
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            what={buble.what}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            missionDetails = {buble.descrip} 
            src = {buble.src}
            src2 = {buble.src2}
            openmissionName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            myp={buble.myp}
             easy={buble.easy}
            spnot={buble.spnot}
            price ={buble.price}
            deadline={buble.deadline}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                spid={buble.spid}
                /></SwiperSlide>
{:else if buble.ani === "meData" && milon.sugg == true}
  <SwiperSlide class="swiper-slidec"><ProjectSuggestor
      on:less={delo}
            on:hover={hover}
      on:proj={proj}
 on:user={user}
     coinlapach={buble.coinlapach} 
    {low}
    pid={buble.pid}
     restime={buble.attributes.project.data.attributes.restime}
      chat = {buble.chat ?? null}
     askId = {buble.askId ?? null}
    alreadyi={buble.alreadyi}
      askedarr={askedarr}
      {declineddarr}
      deadLine = {buble.attributes.sqadualed}
      oid = {buble.id}
              projectName = {buble.attributes.project.data.attributes.projectName}
                role ={buble.attributes.tafkidims}
              skills ={ buble.attributes.skills} 
              missionDetails = {buble.attributes.descrip} 
              hearotMeyuchadot = {buble.attributes.hearotMeyuchadot}
           src = {buble.attributes.project.data.attributes.profilePic.data?.attributes.formats.thumbnail.url}
               missionName={buble.attributes.name}
                projectId={buble.attributes.project.data.id}
                workways={buble.attributes.work_ways}
                noOfHours={buble.attributes.noofhours}
                perhour={buble.attributes.perhour}
                total={buble.attributes.noofhours * buble.attributes.perhour}
                cards="true"
                /></SwiperSlide>
{:else if buble.ani === "huca" && milon.pmashs == true}
    <SwiperSlide class="swiper-slidec"><Mashsug
      on:less={delo}
      cards="true"
      on:hover={hover}
      on:proj={proj}
 on:user={user}
 messege={buble.messege}
      i={i}
          coinlapach={buble.coinlapach} 
      {low}
      askedarr={askedarr}
     declineddarra= {buble.declineddarra}
      deadLine = {buble.sqadualed}
      sqadualedf = {buble.sqadualedf}
      oid = {buble.oid}
      id = {buble.id}
      price= {buble.price}
      myp={buble.myp}
      already= {buble.already}
              projectName = {buble.projectName}
              missionDetails = {buble.descrip} 
              notes = {buble.hearotMeyuchadot}
              src = {buble.srcb}
               mashName={buble.mashname}
                projectId={buble.projectid}
                descrip={buble.descrip}
                spnot={buble.spnot}
                easy={buble.easy}
                /></SwiperSlide>
                           {:else if buble.ani === "hachla" && milon.hachla == true}
                                                <SwiperSlide class="swiper-slidec"><DecisionMaking
                                                    on:acsept={delo}
                                                    on:decline={delo}
                                                    on:hover={hover}
                                                    on:proj={proj}
                                                          cards="true" 
                                                    on:chat={chat}
                                                    timegramaDate={buble.timegramaDate}
                                                    timegramaId={buble.timegramaId}
                                                    restime={buble.restime}                                                    
                                                    noofpu={buble.noofpu}
                                                    newpicid={buble?.newpicid}
                                                    coinlapach={buble.coinlapach}
                                                    created_at={buble.created_at}
                                                    spdata={buble.spdata}
                                                    kind={buble.kind}
                                                    messege={buble.messege}
                                                    myid={buble.myid}
                                                    noofusersWaiting={buble.noofusersWaiting}
                                                    uids={buble.uids}
                                                    what={buble.mypos}
                                                    noofusersOk={buble.noofusersOk}
                                                    noofusersNo={buble.noofusersNo}
                                                    already={buble.already}
                                                    users={buble.users}
                                                    askId={buble.pendId}
                                                    projectName = {buble.projectName}
                                                    projectId ={buble.projectId}
                                                    userId ={ buble.uid}
                                                    src = {buble.src}
                                                    src2 = {buble?.newpic}
                                                    stylef={buble.stylef}
                                                    st={buble.st}
                                                    spid={buble.spid}
                                                    {low}
                                                    /></SwiperSlide>
                          
{/if}
{/each}
 <!--- <SwiperSlide class="swiper-slidec">Slide 1</SwiperSlide><SwiperSlide class="swiper-slidec">Slide 2</SwiperSlide
  ><SwiperSlide class="swiper-slidec">Slide 3</SwiperSlide><SwiperSlide class="swiper-slidec">Slide 4</SwiperSlide
  ><SwiperSlide class="swiper-slidec">Slide 5</SwiperSlide><SwiperSlide class="swiper-slidec">Slide 6</SwiperSlide
  ><SwiperSlide class="swiper-slidec">Slide 7</SwiperSlide><SwiperSlide class="swiper-slidec">Slide 8</SwiperSlide
  ><SwiperSlide class="swiper-slidec">Slide 9</SwiperSlide>-->
</Swiper>
{/key}
</span>
</div>
{:else}
<div class="body grid items-center justify-center">
         <Lowding height="100vh" />
         </div> 
         {/if}
         {/key}
{/key}