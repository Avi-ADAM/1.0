<script>
  $: w = 500;
  $: h = 500 ;
    $: ow = 500;
  $: oh = 500 ;
  let screen
  $: top = 0
  $: left = 0
  $: maxW = 100
  $: maxH = 100
  $: center = { x: w / 2, y: h / 2 };
  $: console.log(center)
  // Call this function whenever you add new circles
  //placeCircles();

  // Add your infinite scroll mechanism here
  $: size = ow>550? 125:115;
  $: bigsize = ow>550? 225: 100;
  $: add = ow>550? 70: 70;

  function checkLine(i) {

    let myLine = 1;
    let lineCircels = 8;
    let check = false;
    let calculated = 0;
    let realcircels = 0
    let scrollX = 0
    let scrollY = 0
    while (check == false) {
      let thisLineCircles = Number(
        (((bigsize) + (size * myLine * 1.1 * Math.PI))/(size/2) ).toFixed(0)
      );
      calculated += thisLineCircles;
      if (i - calculated < 0 ) {
        let isThisLineOverflowsY = (bigsize) + (size * myLine * 2.8) > oh 
        let isThisLineOverflowsX = (bigsize) + (size * myLine * 2.8) > ow
        if(isThisLineOverflowsY){
          maxH = (((bigsize) + (size * myLine * 2.8))/oh)*100
          scrollY =(((bigsize + (size * myLine * 2.4)) - oh)/2)
          console.log(h,"sco;",scrollY)
        }else{
          maxH = 100
        }
        if(isThisLineOverflowsX){
          console.info("thislineoverflowx",w,center)
          maxW = (((bigsize) + (size * myLine * 2.8))/ow)*100
          scrollX = (((bigsize + (size * myLine * 2.4)) - ow)/2)
        }else{
          maxW = 100
        }        
        lineCircels = thisLineCircles;
        realcircels = (arr1.length - calculated) > 0 ? lineCircels : lineCircels + (arr1.length - calculated)
        
        check = true;
      } else {
        myLine += 1;
      }
    }
     const angle = (i / realcircels) * 2 * Math.PI
      const distanceFromCenter = myLine * (size) * 1.1+ bigsize/2
      console.log(center,i,"kk")
      const x = center.x + distanceFromCenter * Math.cos(angle) -add
      const y = center.y + distanceFromCenter * Math.sin(angle)-add
      if(scrollX >0|| scrollY >0 ){
        console.log("scroling",scrollX,scrollY)
         window.scrollBy(scrollX,scrollY) 
         console.log("scroled")
      }
    return { myline: myLine, lineCircels: realcircels,x,y};
  }

  import * as animateScroll from 'svelte-scrollto';
  import Vid from './didiget.svelte';
  import Desi from './decisionMaking.svelte';
  import Mid from './midi.svelte';
  import MissionInProgress from './missionInProgress.svelte';
  import ProjectSuggestor from './projectSuggestor.svelte';
  import Reqtojoin from './reqtojoin.svelte';
  import PendingM from './pandingMesima.svelte';
  import PendingMa from './pmas.svelte';
  import Welcomt from './welcomTo.svelte';
  import Fiappru from './fiappru.svelte';
  import Mashsug from './mashsuggest.svelte';
  import Reqtom from './reqtom.svelte';
  import Weget from './weget.svelte';
  import Hal from './halukaask.svelte';
  import { fly } from 'svelte/transition';

  import { createEventDispatcher, onMount } from 'svelte';
  import { page } from '$app/stores';

  const dispatch = createEventDispatcher();
  export let adder = [],
    arr1 = [],
    askedarr = [],
    declineddarr = [],
    halu = 17,
    askma = 17,
    maap = 13,
    mashs = 13,
    pmashd = 13,
    fia = 13,
    beta = 13,
    pen = 17,
    sug = 17,
    low = false,
    nam,
    wel = 13,
    ask = 13,
    picLink,
    total;
  export let milon = {
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
  };
  let modal = false;

  function modali() {
    modal = true;
    animateScroll.scrollToTop();
  }

  function delo(event) {
    let oldob = arr1;
    const x = oldob.map((c) => c.coinlapach);
    const indexy = x.indexOf(event.detail.coinlapach);
    oldob.splice(indexy, 1);
    arr1 = oldob;
    dispatch('start', {
      cards: false,
      ani: event.detail.ani
    });
  }

  function user(event) {
    dispatch('user', {
      id: event.detail.id
    });
  }

  function mesima(event) {
    dispatch('mesima', {
      id: event.detail.id
    });
  }

  function hover(event) {
    dispatch('hover', {
      id: event.detail.id
    });
  }

  function chat() {}

  function cards() {
    dispatch('cards', {
      cards: true
    });
  }

  function proj(event) {
    dispatch('proj', {
      id: event.detail.id
    });
  }

  function showonly(event) {
    const value = event.detail.data;
    for (const key in milon) {
      milon[key] = false;
    }

    milon[value] = true;
  }

  function showall(event) {
    for (const key in milon) {
      milon[key] = true;
    }
  }
  export let sml = false;
  function checkLines(arr,w,h){
    let c = {}
    for (let i = 0; i < arr.length; i++) {
      c[i] = checkLine(i) 
      console.log(i,checkLine(i))    
      c = c 
    }
    return c
  }
  onMount(()=>{
    size = w>550? 125:75;
    bigsize = w>550? 225: 165;
    orders = checkLines(arr1,w,h)
    console.log(orders,w,"mount")
  })
  $: orders = checkLines(arr1,w,h)
  export const snapshot = {
    capture: () => JSON.parse(JSON.stringify(orders)),
    restore: (value) => (orders = value)
  };
</script>
<div id="screen" bind:clientWidth={ow} bind:clientHeight={oh} dir="ltr" style=" position:fixed; width:100vw;height:100vh ;overflow: auto; top:0%;
    left: 0%;
    max-width: 100vw;
    max-height: 100vh;" class="d">
     {#key arr1}
  {#key w}
  {#key h}
  {#key orders}
<div  dir="ltr"  bind:clientWidth={w} bind:clientHeight={h} style=" position: absolute; overflow: auto;top:{top}%;
    left: {left}%;
    width: calc({maxW}vw - 10px);
    height: {maxH}vh;" class="screen d" >
 

    {#each arr1 as buble, i}
      {@const myline = orders[i] ?? {x:0,y:0}}
      {#if buble.ani === 'vidu' && milon.desi == true}
        <div  class="vidu normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Vid
            on:modal={() => (modal = true)}
            on:hover={hover}
            on:proj={proj}
            on:user={user}
            on:coinLapach={delo}
            shear={buble.shear}
            hervachti={buble.hervachti}
            sendpropic={buble.sendpropic}
            sendname={buble.sendname}
            respropic={buble.respropic}
            resname={buble.resname}
            projectId={buble.projectId}
            kind={buble.kind}
            projectName={buble.projectName}
            src={buble.src}
            myid={buble.myid}
            pendId={buble.pendId}
            chat={buble.chat}
            amount={buble.amount}
            send={buble.send}
            recive={buble.recive}
            sendcon={buble.senderconf}
            coinlapach={buble.coinlapach}
            messege={buble.messege}
            already={buble.already}
            {low}
          />
        </div>
      {:else if buble.ani === 'haluk' && milon.desi == true}
        <div  class=" halu normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Hal
            on:modal={() => (modal = true)}
            on:coinLapach={delo}
            user_1s={buble.user_1s}
            on:hover={hover}
            on:proj={proj}
            on:user={user}
            hervach={buble.hervach}
            halukot={buble.halukot}
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
            {low}
          />
        </div>
      {:else if buble.ani === 'mtaha' && milon.betaha == true}
        <div  class="betaha normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <MissionInProgress
            on:proj={proj}
            on:user={user}
            on:hover={hover}
            on:coinLapach={delo}
            on:modal={() => (modal = true)}
            pu={buble.pu}
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
            hearotMeyuchadot={buble.hearotMeyuchadot}
            dueDateOrCountToDedline={buble.admaticedai}
            hoursdon={buble.howmanyhoursalready}
            hourstotal={buble.hoursassinged}
            perhour={buble.perhour}
            on:done={delo}
            {low}
          />
        </div>
      {:else if buble.ani === 'pmashes' && milon.ppmash == true}
        <div class="normSml ppmash" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <PendingMa
            on:hover={hover}
            on:proj={proj}
            on:user={user}
            on:coinLapach={delo}
            on:modal={modali}
            ordern={buble.orderon}
            timegramaId={buble.timegramaId}
            restime={buble.restime}
            coinlapach={buble.coinlapach}
            messege={buble.messege}
            mysrc={buble.mysrc}
            mypos={buble.mypos}
            diun={buble.diun}
            descrip={buble.descrip}
            projectName={buble.projectName}
            name={buble.name}
            hearotMeyuchadot={buble.hearotMeyuchadot}
            kindOf={buble.kindOf}
            src={buble.src}
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
            {low}
          />
        </div>
      {:else if buble.ani === 'pends' && milon.pend == true}
        <div class="normSml pend" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <PendingM
            on:hover={hover}
            on:modal={modali}
            on:proj={proj}
            on:user={user}
            on:coinLapach={delo}
            diun={buble.diun}
            timegramaId={buble.timegramaId}
            timegramaDate={buble.timegramaDate}
            publicklinks={buble.publicklinks}
            privatlinks={buble.privatlinks}
            coinlapach={buble.coinlapach}
            isKavua={buble.isKavua}
            createdAt={buble.createdAt}
            messege={buble.messege}
            restime={buble.restime}
            mysrc={buble.mysrc}
            mypos={buble.mypos}
            descrip={buble.descrip}
            projectName={buble.projectName}
            name={buble.name}
            hearotMeyuchadot={buble.hearotMeyuchadot}
            noofhours={buble.noofhours}
            src={buble.src}
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
            ordern={buble.orderon}
            skills={buble.skills}
            tafkidims={buble.tafkidims}
            workways={buble.workways}
            mdate={buble.mdate}
            mdates={buble.dates}
            vallues={buble.vallues}
            pendId={buble.pendId}
            users={buble.users}
            {low}
          />
        </div>
      {:else if buble.ani === 'wegets' && milon.pmaap == true}
        <div class="pmaap normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Weget
            on:acsept={delo}
            on:decline={delo}
            on:hover={hover}
            on:modal={modali}
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
            projectName={buble.projectName}
            useraplyname={buble.username}
            userId={buble.uid}
            spid={buble.spid}
            src={buble.src}
            price={buble.price}
            hm={buble.hm}
            src2={buble.src2}
            why={buble.why}
            whatt={buble.whatt}
            missionBName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
            noofpu={buble.noof}
            sqadualedf={buble.sqadualedf}
            sqadualed={buble.sqadualed}
            spnot={buble.spnot}
            easy={buble.easy}
            nhours={buble.nhours}
            deadline={buble.deadline}
            missId={buble.missId}
            id={buble.id}
            openMid={buble.omid}
            stylef={buble.stylef}
            st={buble.st}
            declined={buble.decid}
            {low}
          />
        </div>
      {:else if buble.ani === 'fiapp' && milon.fiap == true}
        <div class="fiap normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Fiappru
            on:acsept={delo}
            on:decline={delo}
            on:hover={hover}
            on:modal={modali}
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
            projectName={buble.projectName}
            useraplyname={buble.username}
            userId={buble.uid}
            missionDetails={buble.descrip}
            src={buble.src}
            src2={buble.src2}
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
            valph={buble.perhour}
            nhours={buble.nhours}
            deadline={buble.deadline}
            missId={buble.missId}
            id={buble.id}
            openMid={buble.omid}
            stylef={buble.stylef}
            st={buble.st}
            declined={buble.decid}
            {low}
          />
        </div>
      {:else if buble.ani === 'walcomen' && milon.welc == true}
        <div class="welc normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Welcomt
            id={buble.id}
            on:hover={hover}
            coinlapach={buble.coinlapach}
            username={buble.username}
            projectName={buble.projectName}
          />
        </div>
      {:else if buble.ani === 'askedcoin' && milon.asks == true}
        <div class="asks normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Reqtojoin
            on:acsept={delo}
            on:hover={hover}
            on:modal={modali}
            on:proj={proj}
            on:user={user}
            on:decline={delo}
            iskvua={buble.iskvua}
            email={buble.email}
            role={buble.role}
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
            projectName={buble.projectName}
            useraplyname={buble.username}
            userId={buble.uid}
            missionDetails={buble.descrip}
            src={buble.src}
            src2={buble.src2}
            openmissionName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
            noofpu={buble.noof}
            publicklinks={buble.publicklinks}
            privatlinks={buble.privatlinks}
            hearotMeyuchadot={buble.hearotMeyuchadot}
            valph={buble.perhour}
            nhours={buble.nhours}
            deadline={buble.deadline}
            sqedualed={buble.sqedualed}
            missId={buble.missId}
            id={buble.id}
            openMid={buble.omid}
            stylef={buble.stylef}
            st={buble.st}
            chat={buble.chat}
            declined={buble.decid}
            {low}
          />
        </div>
      {:else if buble.ani === 'askedm' && milon.askmap == true}
        <div class="askmap normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Reqtom
            on:acsept={delo}
            on:decline={delo}
            on:hover={hover}
            on:modal={modali}
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
            projectName={buble.projectName}
            useraplyname={buble.username}
            userId={buble.uid}
            missionDetails={buble.descrip}
            src={buble.src}
            src2={buble.src2}
            openmissionName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
            noofpu={buble.noof}
            myp={buble.myp}
            easy={buble.easy}
            spnot={buble.spnot}
            price={buble.price}
            deadline={buble.deadline}
            missId={buble.missId}
            id={buble.id}
            openMid={buble.omid}
            stylef={buble.stylef}
            st={buble.st}
            declined={buble.decid}
            spid={buble.spid}
            {low}
          />
        </div>
      {:else if buble.ani === 'hachla' && milon.hachla == true}
        <div class="hachla normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Desi
            on:acsept={delo}
            on:decline={delo}
            on:hover={hover}
            on:modal={modali}
            on:proj={proj}
            on:chat={chat}
            noofpu={buble.noofpu}
            newpicid={buble?.newpicid}
            coinlapach={buble.coinlapach}
            created_at={buble.created_at}
            spdata={buble.spdata}
            kind={buble.kind}
            timegramaId={buble.timegramaId}
            timegramaDate={buble.timegramaDate}
            restime={buble.restime}
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
            projectName={buble.projectName}
            projectId={buble.projectId}
            userId={buble.uid}
            src={buble.src}
            src2={buble?.newpic}
            stylef={buble.stylef}
            st={buble.st}
            spid={buble.spid}
            {low}
          />
        </div>
      {:else if buble.ani === 'meData' && milon.sugg == true}
        <div class="sugg normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <ProjectSuggestor
            on:modal={modali}
            on:less={delo}
            on:hover={hover}
            on:proj={proj}
            on:user={user}
            on:mesima={mesima}
            timeToP={buble.attributes.project.data.attributes.timeToP}
            coinlapach={buble.coinlapach}
            restime={buble.attributes.project.data.attributes.restime}
            {askedarr}
            {declineddarr}
            pid={buble.pid}
            chat={buble.chat ?? null}
            askId={buble.askId ?? null}
            deadLine={buble.attributes.sqadualed}
            oid={buble.id}
            hst={buble.hst}
            stb={buble.stb}
            projectName={buble.attributes.project.data.attributes.projectName}
            role={buble.attributes.tafkidims}
            skills={buble.attributes.skills}
            missionDetails={buble.attributes.descrip}
            notes={buble.attributes.hearotMeyuchadot}
            src={buble.attributes.project.data.attributes.profilePic.data
              ?.attributes.formats.thumbnail.url}
            missionName={buble.attributes.name}
            projectId={buble.attributes.project.data.id}
            workways={buble.attributes.work_ways}
            noOfHours={buble.attributes.noofhours}
            perhour={buble.attributes.perhour}
            total={buble.attributes.noofhours * buble.attributes.perhour}
            {low}
          />
        </div>
      {:else if buble.ani === 'huca' && milon.pmashs == true}
        <div class="pmashs normSml" style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px">
          <Mashsug
            on:less={delo}
            on:hover={hover}
            on:proj={proj}
            on:user={user}
            messege={buble.messege}
            {i}
            coinlapach={buble.coinlapach}
            {askedarr}
            declineddarra={buble.declineddarra}
            deadLine={buble.sqadualed}
            sqadualedf={buble.sqadualedf}
            oid={buble.oid}
            id={buble.id}
            price={buble.price}
            myp={buble.myp}
            already={buble.already}
            projectName={buble.projectName}
            missionDetails={buble.descrip}
            notes={buble.hearotMeyuchadot}
            src={buble.srcb}
            mashName={buble.mashname}
            projectId={buble.projectid}
            descrip={buble.descrip}
            spnot={buble.spnot}
            easy={buble.easy}
            {low}
          />
        </div>
      {/if}
    {/each}

    <div class="midCom">
    <Mid
      {sml}
      on:cards={cards}
      on:hover={hover}
      on:showall={showall}
      on:showonly={showonly}
      {total}
      {picLink}
      {ask}
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
      des={halu}
    />
  </div>
</div>
  {/key}
  {/key}
  {/key}
  {/key}
</div>
<style>
  .screen {
     background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
  }
  .midCom{
    position:absolute;
    top: 50%;
    left:50%;
    transform: translate(-50%,-50%);
  }
  .midCom:hover{
    z-index:444;
  }
  .normSml {
    position: absolute;
    transition: transform 500ms ease-in-out;
    border-radius: 50%;
    /* Position your elements based on the center */
  }
</style>
