<script>
    import Mid from "./midi.svelte"
     import MissionInProgress from "./missionInProgress.svelte"
    import ProjectSuggestor from "./projectSuggestor.svelte"
    import Reqtojoin from './reqtojoin.svelte';
    import PendingM from "./pandingMesima.svelte";
    import PendingMa from "./pmas.svelte"
    import Welcomt from "./welcomTo.svelte";
    import Fiappru from './fiappru.svelte';
        import Mashsug from './mashsuggest.svelte'
        import Reqtom from './reqtom.svelte'
        import Weget from './weget.svelte'
        import Hal from './halukaask.svelte'
           import { fly } from 'svelte/transition';

        import {
    createEventDispatcher
} from 'svelte';

const dispatch = createEventDispatcher();
 
export let adder = [], arr1 = [], askedarr = [], declineddarr = [],halu = 17, askma = 17,maap = 13,mashs = 13,pmashd = 13, fia = 13, beta = 13, pen = 17, sug = 17, low = false, nam,wel = 13, ask = 13,picLink,total
   let milon = {fiap : true, welc: true, sugg: true, pend: true, asks: true, betaha: true, desi: true, ppmash: true, pmashs: true, pmaap: true, askmap: true}
function delo (event){
 let oldob = arr1;
 const x = oldob.map(c => c.coinlapach);
 const indexy = x.indexOf(event.detail.coinlapach);
 oldob.splice(indexy, 1); 
 arr1 = oldob  
 dispatch("start", {cards: false,ani:event.detail.ani})
}
function user (event) {
 dispatch("user", {id: event.detail.id})
}

function hover (event) {
    
 dispatch("hover", {id: event.detail.id})

}
function chat(){}
function cards(){
 dispatch("cards",{cards:true})
}
function proj (event){
     dispatch("proj", {id: event.detail.id})
}
function showonly (event){
    const value = event.detail.data;
 for (const key in milon) {
        milon[key] = false
    }
    
    milon[value] = true;
}
function showall (event){
for (const key in milon) {
        milon[key] = true
    }

}
let h = 500;
    </script>


<div bind:clientHeight={h} class="screen" transition:fly={{delay: 0, y: -h, opacity: 0.5, duration: 4000}} > 
    
{#each adder as add }
   {@html add}
 {/each}

{#each arr1 as buble, i}
{#if buble.ani === "haluk" && milon.desi == true} 
 <div class="normSml halu"><Hal    
    user_1s={buble.user_1s}
          on:hover={hover}
 on:proj={proj}
 on:user={user}
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
                               /></div>
{:else if buble.ani === "mtaha" &&  milon.betaha == true}
 <div   class="betaha normSml" ><MissionInProgress
  on:proj={proj}
 on:user={user}  
  on:hover={hover}
      coinlapach={buble.coinlapach} 
    usernames={buble.usernames}
    noofpu={buble.project.user_1s.length}
    oldzman={buble.timer}
    stname={buble.stname}
    mId={buble.id}
    missId={buble.mission.id}
    missionName={buble.name}
    projectId={buble.project.id}
    projectName={buble.project.projectName}
    missionDetails={buble.descrip}
    src={buble.project.profilePic.formats.thumbnail.url}
    link={buble.privatlinks}
    dueDateOrCountToDedline ={buble.admaticedai}
    hoursdon ={buble.howmanyhoursalready}
    hourstotal = {buble.hoursassinged}
    perhour = {buble.perhour}
    on:done={delo}
    /></div>
{:else if buble.ani === "pmashes" && milon.ppmash == true}
    <div class="normSml ppmash" 
 ><PendingMa
              on:hover={hover}
  on:proj={proj}
 on:user={user}
        on:coinLapach={delo}
            coinlapach={buble.coinlapach} 
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
                noofusers={buble.user_1s.length}
                mshaabId={buble.mshaabId}
                hm={buble.hm}
                price={buble.price}
                easy={buble.easy}
                sqadualed={buble.sqadualed}
                sqadualedf={buble.sqadualedf}
                linkto={buble.linkto}
                pendId={buble.pendId}
                users={buble.users}
                /></div>
{:else if buble.ani === "pends" && milon.pend == true}
    <div  class="normSml pend" 
 ><PendingM
              on:hover={hover}
  on:proj={proj}
 on:user={user}
        on:coinLapach={delo}
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
                noofusers={buble.user_1s.length}
                missionId={buble.missionId}
                skills={buble.skills}
                tafkidims={buble.tafkidims}
                workways={buble.workways}
                mdate={buble.mdate}
                vallues={buble.vallues}
                pendId={buble.pendId}
                users={buble.users}
                /></div>
{:else if buble.ani === "wegets" && milon.pmaap == true}
        <div class="pmaap normSml" ><Weget
            on:acsept={delo}
            on:decline={delo}
                  on:hover={hover}
          on:proj={proj}
 on:user={user}
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
                /></div>
{:else if buble.ani === "fiapp" && milon.fiap == true}
            <div  class="fiap normSml" ><Fiappru
            on:acsept={delo}
            on:decline={delo}
                  on:hover={hover}
    on:proj={proj} 
 on:user={user}
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
                /></div>
{:else if buble.ani === "walcomen" && milon.welc == true}
   <div  class="welc normSml" ><Welcomt 
    id={buble.id}
          on:hover={hover}
            coinlapach={buble.coinlapach} 
       username={buble.username}
       projectName={buble.projectName}
       /></div>
{:else if buble.ani === "askedcoin" && milon.asks == true}
        <div  class="asks normSml" ><Reqtojoin
            on:acsept={delo}
                  on:hover={hover}
            on:proj={proj}
     on:user={user}
            on:decline={delo}
                coinlapach={buble.coinlapach} 
            pid={buble.pid}
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
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                /></div>
{:else if buble.ani === "askedm" && milon.askmap == true}
        <div  class="askmap normSml" ><Reqtom
            on:acsept={delo}
            on:decline={delo}
                  on:hover={hover}
            on:proj={proj}
 on:user={user}
 on:chat={chat}
     coinlapach={buble.coinlapach} 
            pid={buble.pid}
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
                /></div>
{:else if buble.ani === "meData" && milon.sugg == true}
    <div class="sugg normSml" ><ProjectSuggestor
      on:less={delo}
            on:hover={hover}
      on:proj={proj}
 on:user={user}
     coinlapach={buble.coinlapach} 
      askedarr={askedarr}
      {declineddarr}
      deadLine = {buble.sqadualed}
      oid = {buble.id}
              projectName = {buble.project.projectName}
                role ={buble.tafkidims}
              skills ={ buble.skills} 
              missionDetails = {buble.descrip} 
              notes = {buble.hearotMeyuchadot}
              src = {buble.project.profilePic.formats.thumbnail.url}
               missionName={buble.name}
                projectId={buble.project.id}
                workways={buble.workways}
                noOfHours={buble.noofhours}
                perhour={buble.perhour}
                total={buble.noofhours * buble.perhour}
                /></div>
{:else if buble.ani === "huca" && milon.pmashs == true}
    <div  class="pmashs normSml" ><Mashsug
      on:less={delo}
      on:hover={hover}
      on:proj={proj}
 on:user={user}
 messege={buble.messege}
      i={i}
          coinlapach={buble.coinlapach} 
      askedarr={askedarr}
     declineddarra= {buble.declineddarra}
      deadLine = {buble.sqadualed}
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
                /></div>
{/if}
{/each}

<!--
        <div  class="normSml desi" style="display:'';"><DecisionMaking  decisionName={"?לפתוח קבוצת ווצאפ"} projectName={"פסיפס"} projectId={6}/></div> 
    <div class="normSml desi"><DecisionMaking decisionName={"?מה לבנות קודם"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"} deadLine={"10.7.2021"}/></div> 


   <div class="normSml"><DecisionMaking decisionName={"?להוסיף גם מכירה"} projectName={"BARB"} src={"barbi.jpeg"} projectId={2}/></div> 
  <div class="normSml"><ProjectSuggestor missionName={"לבנות וידאו צ'ט"} projectId={1}/></div>
   <div class="normSml"><MissionInProgress missionName={" מפת מיקום החותמים"} projectId={1}/></div>
   <div class="normSml"><DecisionMaking decisionName={"?לחפש מתכנת"} projectName={"BARB"} projectId={2} src={"barbi.jpeg"}/></div> 
  <div class="normSml"><ProjectSuggestor missionName={"להוסיף דאטהבייס"} projectId={1}/></div> 
   <div class="normSml"><MissionInProgress missionName={" עיצוב עמוד הבית"} projectName= {"BARB"} projectId={2} src={"barbi.jpeg"}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"בניית מערכת תשלומים"} projectId={1}/></div>
    <div class="normSml"><MissionInProgress missionName={" הרשמה ולוגין"} projectId={1}/></div>
   <div class="normSml"><ProjectSuggestor missionName={"תמונות לחיצות"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
 
    <div class="normSml"><MissionInProgress missionName={" צור ריקמה חדש "} projectId={1}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"סליקה ותשלומים"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
    <div class="normSml"><MissionInProgress missionName={"מנוע מיון בועות "} projectId={1}/></div>
    <div class="normSml"><DecisionMaking decisionName={"?לחפש מתכנת"} projectId={1}/></div> 
    <div class="normSml"><DecisionMaking decisionName={"?מה לבנות קודם"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"} deadLine={"10.7.2021"}/></div> 
    <div class="normSml"><DecisionMaking decisionName={"?לחפש קופירייטר"} projectId={1}/></div> 
   <div class="normSml"><ProjectSuggestor missionName={"פרסום בפייסבוק"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
   <div class="normSml"><MissionInProgress missionName={" חיבור לסטראפי של בועות"} projectId={1}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"קמפיין פייסבוק"} projectId={1}/></div>
    <div class="normSml"><MissionInProgress missionName={" עיצוב עמוד מוצר "} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"קמפיין טיקטוק"} projectId={1}/></div>
    <div class="normSml"><MissionInProgress missionName={" הצעות לרקמות strapiב "} projectId={1}/></div>
    <div class="normSml"><DecisionMaking  decisionName={"?לחפש מתכנת"} projectName={"פסיפס"} projectId={6}/></div> 
    <div class="normSml"><MissionInProgress missionName={" החלטות strapiב "} projectId={1} /></div>
   <div class="normSml"><ProjectSuggestor missionName={"ייעוץ משפטי"} projectId={1}/></div>
   <div class="normSml"><MissionInProgress missionName={" משימות strapiב "} projectId={1}/></div>
    <div class="normSml"><ProjectSuggestor  missionName={"הנהלת חשבונות"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
    <div class="normSml"><MissionInProgress missionName={"הזנת מוצרים"}  projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
   <div class="normSml"><ProjectSuggestor missionName={"ייבוא מסין"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
-->
    <div 
 class="midCom">
        <Mid 
        on:cards={cards}
        on:hover={hover}
on:showall={showall}
on:showonly={showonly}
{total}
picLink={picLink} {ask}
{wel}
name={nam}
{low}
{sug}
{pen}
{beta}
{fia}
pmash={pmashd}
{mashs}
{maap}
{askma}
des={halu}  />
    </div>
</div> 



<style>
  
  /*  .svggg{
        min-width:75px; 
        min-height:75px;
        aspect-ratio: 1;
    }
@media (min-width:550){
     .svggg{
        width:125px; 
        height:125px;
    }
} */
.normSml{
       transition: all 1000ms ease-in-out;
}
.normSml:nth-child(1):hover{
   transform: translate(75%,75%);
   z-index: 998;
}.normSml:nth-child(2):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(3):hover{
   transform: translateY(75%);
   z-index: 998;
}
    .normSml:nth-child(4):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(n+9):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(4n+9):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(4n+12):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
    .screen{
background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);       
 display: grid;
        grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(4, 1fr);

        grid-row: center;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        overflow: scroll;
    }

    .midCom{
    grid-row: 2/ 4;
    grid-column: 2 /4;
    align-self: center;
    justify-self: center;
    border-radius: 50%; 
    }

    .normSml{
    align-items: center;
    }
   
    .normSml:hover{
        
        border-radius: 50%;
    }
  
    @media (min-width: 840px){
         .normSml:nth-child(4):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(10):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(12):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(14):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(n+15):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(6n+15):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(6n+20):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
    .screen{
background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
        display: grid;
        grid-template-columns: repeat(6, 1fr);
                grid-template-rows: repeat(4, 1fr);
        grid-row: center;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        overflow: scroll;
    }
    .midCom{
        grid-row: 2 / 4;
    grid-column: 3 /5;
      align-self: center;
        border-radius: 50%; 
    }

    .normSml{ 
        align-items: center;   
    }
    .normSml:hover{
        
        border-radius: 50%;
    }

    }
    @media  (min-width: 1240px){
 /* .normSml:nth-child(1){
    position: absolute;
    top: 18%;   
    left: 50%;
    transform: translate(-50%, -50%);
  }  
  .normSml:nth-child(2){
    position: absolute;
    top: 9%;
    left: 40%;
    transform: translate(-50%, -50%);
  } 
  .normSml:nth-child(3){
    position: absolute;
    top: 9%;
    left: 60%;
    transform: translate(-50%, -50%);
  } 
    .normSml:nth-child(4){
    position: absolute;
    top: 18%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
  .normSml:nth-child(5){
    position: absolute;
    top: 18%;
    left: 70%;
    transform: translate(-50%, -50%);
  } 
    .normSml:nth-child(6){
    position: absolute;
    top: 20%;
    left: 20%;
    transform: translate(-50%, -50%);
  } 
  .normSml:nth-child(7){
    position: absolute;
    top: 20%;
    left: 80%;
    transform: translate(-50%, -50%);
  }  
   .normSml:nth-child(8){
    position: absolute;
    top: 30%;
    left: 70%;
    transform: translate(-50%, -50%);
  }  
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  }  
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } */  
.normSml:nth-child(1):hover{
    transform: translate(75%,75%);
   z-index: 998;
}.normSml:nth-child(2):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(3):hover{
   transform: translateY(75%);
   z-index: 998;
}
        .normSml:nth-child(4):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(9):hover{
   transform: translateX(75%);
   z-index: 998;
}
.normSml:nth-child(10):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(14):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(15):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(16):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(17):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(18):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(19):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(20):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(n+21):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(8n+21):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(8n+28):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
    .screen{
        padding:20px 20px;
       background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg) !important;
        background-size: cover;
        height: 100vh !important;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(4, 1fr);
        grid-row: center; 
        align-items: center;
        justify-content: center;
        width: 100vw;
        overflow: auto;

    }
    .midCom{
      /*  position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);*/
        padding: 20px  20px;
       grid-row: 2 / 4;
    grid-column: 4 /6; 
      align-self: center;
    }
    
    .normSml{
    margin:  0;
    }
    .normSml:hover{
        
        border-radius: 50%;
    }
    }
/*
 @media  (min-width: 1240px){
    .screen{
        padding:20px 20px;
       background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg) !important;
        background-size: cover;
        height: 100vh !important;
        display: grid;
        grid-template-columns: 200px;
        grid-template-rows: 75px;
        grid-gap: 37.5px;
        grid-row: center;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        overflow: auto;

    }
    .midCom{
        padding: 20px  20px;
        grid-row: 3  / 5;
    grid-column: 2 /4;
      align-self: center;
    }
    .normSml:nth-child(6){
margin-left: 125px
    }
      .normSml:nth-child(7){
margin-left: 125px
    }  .normSml:nth-child(8){
margin-left: 125px
    }  .normSml:nth-child(9){
margin-left: 125px
    }  .normSml:nth-child(10){
margin-left: 125px
    }
    .normSml{
    margin:  0;
    }
    .normSml:hover{
        
        border-radius: 50%;
    }
    }*/
     @media  (min-width: 1640px){
           .normSml:nth-child(4):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(9):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(10):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(20):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(21):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(28):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(29):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(36):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(37):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(46):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(n+47):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(10n+47):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(10n+56):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
    .screen{
        grid-template-columns: repeat(10, 1fr);

    }
     .midCom{
        padding: 13px  0px;
        grid-row: 2 / 4;
    grid-column: 5 /7;
      align-self: center;
          }
    }
 @media (min-height: 750px){
   @media (max-width: 839px){
   .normSml:nth-child(6):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(9):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(10):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(12):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(13):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(16):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}.normSml:nth-child(n+17):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(4n+17):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(4n+20):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
   }
    .midCom{
        grid-row: 3 / 5;
    }
    .screen{
    grid-template-rows: repeat(6, 1fr);

    }
    }
  
   @media (min-height: 1040px){
    .midCom{
        grid-row: 4 / 5;
    }
     .screen{
    grid-template-rows: repeat(8, 1fr);

    }
    }
</style>
