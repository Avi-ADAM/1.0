<script>
  let w = $state(1200);

  let h = $state(1200);

  let ow = $state(500);

  let oh = $state(500);

  let screen;
  let top = $derived(0);
  let left = $derived(0);
  let maxW = $derived(100);
  let maxH = $derived(100);
  let center;
  $effect(() => {
    center = { x: w / 2, y: h / 2 };
  });
  $effect(() => {
    console.log('עדכון מרכז:', center);
  });
  // Call this function whenever you add new circles
  //placeCircles();

  // Add your infinite scroll mechanism here

  let size = $derived(ow > 550 ? 125 : 115);
  let bigsize = $derived(ow > 550 ? 225 : 100);
  let add = $derived(ow > 550 ? 70 : 70);

  // פונקציה למירכוז המסך על אזור התוכן
  function centerViewOnLoad() {
    setTimeout(() => {
      const container = document.getElementById('screen');
      const content = document.getElementById('content-area');
      if (container && content) {
        try {
          // מציאת מרכז התוכן
          const contentCenter = { x: w / 2, y: h / 2 };

          // חישוב מיקום הגלילה
          const scrollLeft = contentCenter.x - container.clientWidth / 2;
          const scrollTop = contentCenter.y - container.clientHeight / 2;

          console.log('גלילה למיקום:', scrollLeft, scrollTop);

          // גלילה למרכז
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        } catch (err) {
          console.error('שגיאה במירכוז:', err);
        }
      }
    }, 300);
  }

  function checkLine(i) {
    // נחשב את המיקום של האלמנטים במעגלים סביב האלמנט המרכזי
    // תחילה נחשב באיזה מעגל אנחנו נמצאים (myLine)
    let myLine = 1; // מתחילים ממעגל ראשון סביב המרכז
    let calculated = 0;
    let maxElementsInCurrentCircle = 0;

    // מחשבים כמה אלמנטים יכולים להכנס בכל מעגל
    while (true) {
      // מחשב כמה אלמנטים מתאימים למעגל הנוכחי - זה מבוסס על היקף המעגל
      const radius = myLine * (size * 1.1); // צמצום הרדיוס מ-1.3 ל-1.1
      const circumference = 2 * Math.PI * radius; // היקף המעגל
      maxElementsInCurrentCircle = Math.max(
        1,
        Math.floor(circumference / (size * 1.0))
      ); // הגדלת כמות האלמנטים במעגל מ-1.2 ל-1.0

      // בדיקה האם האלמנט הנוכחי שייך למעגל הזה
      if (i < calculated + maxElementsInCurrentCircle) {
        break; // מצאנו את המעגל שבו האלמנט נמצא
      }

      calculated += maxElementsInCurrentCircle; // עוברים למעגל הבא
      myLine++; // עוברים למעגל הבא
    }

    // חישוב המיקום של האלמנט במעגל
    const positionInCircle = i - calculated; // מיקום האלמנט במעגל הנוכחי (0 עד maxElementsInCurrentCircle-1)
    const angleStep = (2 * Math.PI) / maxElementsInCurrentCircle; // הזווית בין אלמנטים במעגל
    const angle = positionInCircle * angleStep; // הזווית של האלמנט הנוכחי

    // חישוב המיקום במישור דו-ממדי
    // נוסיף מרווח התחלתי (initialRadius) שהוא קטן יותר מהקודם
    const initialRadius = bigsize * 0.6; // הקטנת המרווח בין המרכז לעיגול הראשון מ-0.8 ל-0.6
    const radius = initialRadius + myLine * (size * 1.1); // עדכון הרדיוס כדי להתאים לשינויים
    const x = center.x + radius * Math.cos(angle) - size / 2; // מיקום X, עם התחשבות בגודל האלמנט
    const y = center.y + radius * Math.sin(angle) - size / 2; // מיקום Y, עם התחשבות בגודל האלמנט

    return {
      myline: myLine,
      lineCircels: maxElementsInCurrentCircle,
      realCircels: maxElementsInCurrentCircle,
      x,
      y
    };
  }

  import {
    animateScroll,
    scrollto,
    scrolltobottom,
    scrolltotop
  } from 'svelte-scrollto-element';
  import Vid from './didiget.svelte';
  import ProductRequestCoin from './ProductRequestCoin.svelte';
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

  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { isMobileOrTablet } from '$lib/utilities/device';

  let modal = $state(false);

  function modali() {
    modal = true;
    animateScroll.scrollToTop();
  }

  function delo(event) {
    let oldob = arr1;
    const x = oldob.map((c) => c.coinlapach);
    const indexy = x.indexOf(event.coinlapach);
    oldob.splice(indexy, 1);
    arr1 = oldob;
    onStart?.({
      cards: false,
      ani: event.ani
    });
  }

  function user(event) {
    onUser?.({
      id: event.id
    });
  }

  function mesima(event) {
    onMesima?.({
      id: event.id
    });
  }

  function hover(event) {
    onHover?.({
      id: event.id
    });
  }

  function chat() {}

  function cards() {
    onCards?.({
      cards: true
    });
  }

  function proj(event) {
    onProj?.({
      id: event.id
    });
  }

  function showonly(event) {
    const value = event.data;
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
  /**
   * @typedef {Object} Props
   * @property {any} [adder]
   * @property {any} [arr1]
   * @property {any} [askedarr]
   * @property {any} [declineddarr]
   * @property {number} [halu]
   * @property {number} [askma]
   * @property {number} [maap]
   * @property {number} [mashs]
   * @property {number} [pmashd]
   * @property {number} [fia]
   * @property {number} [beta]
   * @property {number} [pen]
   * @property {number} [sug]
   * @property {boolean} [low]
   * @property {any} nam
   * @property {number} [wel]
   * @property {number} [ask]
   * @property {any} picLink
   * @property {any} total
   * @property {any} [milon]
   * @property {boolean} [sml]
   * @property {(payload: { cards: boolean, ani: any }) => void} [onStart] - Callback for 'start' event
   * @property {(payload: { id: any }) => void} [onUser] - Callback for 'user' event
   * @property {(payload: { id: any }) => void} [onMesima] - Callback for 'mesima' event
   * @property {(payload: { id: any }) => void} [onHover] - Callback for 'hover' event
   * @property {(payload: { cards: boolean }) => void} [onCards] - Callback for 'cards' event
   * @property {(payload: { id: any }) => void} [onProj] - Callback for 'proj' event
   */

  /** @type {Props} */
  let {
    onStart,
    onUser,
    onMesima,
    onHover,
    onCards,
    onProj,
    adder = [],
    arr1 = $bindable([]),
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
    total,
    milon = $bindable({
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
    }),
    sml = false
  } = $props();
  function checkLines(arr, w, h) {
    let c = {};
    for (let i = 0; i < arr.length; i++) {
      c[i] = checkLine(i);
      c = c;
    }
    return c;
  }

  // פונקציה לעדכון מידות והתאמת האזור
  function updateSizes() {
    // קבלת גודל החלון
    ow = window.innerWidth;
    oh = window.innerHeight;

    // התאמת גודל האזור לפי מספר האלמנטים
    if (arr1.length > 50) {
      w = 2500;
      h = 2500;
    } else if (arr1.length > 30) {
      w = 2000;
      h = 2000;
    } else if (arr1.length > 15) {
      w = 1500;
      h = 1500;
    } else {
      w = 1200;
      h = 1200;
    }

    // עדכון מידות האלמנטים לפי גודל המסך
    size = ow > 550 ? 125 : 75;
    bigsize = ow > 550 ? 225 : 165;

    // חישוב מחדש של מרכז האזור
    center = { x: w / 2, y: h / 2 };

    // עדכון המיקומים
    orders = checkLines(arr1, w, h);
  }

  // פונקציה לפיזור מחדש של האלמנטים
  function redistributeElements() {
    // עדכון מידות ומיקומים
    updateSizes();

    // מירכוז התצוגה
    centerViewOnLoad();
  }

  onMount(() => {
    // עדכון מידות ראשוני
    updateSizes();

    // מירכוז התצוגה
    centerViewOnLoad();

    // האזנה לשינויי גודל החלון
    window.addEventListener('resize', () => {
      updateSizes();
      centerViewOnLoad();
    });

    console.log(orders, w, 'mount');
  });

  let orders = $state([]);
  $effect(() => {
    orders = checkLines(arr1, w, h);
  });

  export const snapshot = {
    capture: () => JSON.parse(JSON.stringify(orders)),
    restore: (value) => (orders = value)
  };
</script>

<div
  id="screen"
  bind:clientWidth={ow}
  bind:clientHeight={oh}
  dir="ltr"
  style="position:fixed; width:100vw; height:100vh; overflow: auto; top:0; left:0; 
            max-width: 100vw; max-height:{isMobileOrTablet()
    ? 'calc(100vh - 3rem)'
    : '100vh'};"
  class="coin-container d"
>
  <!-- כפתורי שליטה -->
  <div class="control-buttons">
    <button
      class="control-button center-button"
      onclick={centerViewOnLoad}
      title="חזרה למרכז"
    >
      <span>⌘</span>
    </button>

    <button
      class="control-button redistribute-button"
      onclick={redistributeElements}
      title="פיזור מחדש"
    >
      <span>⟳</span>
    </button>
  </div>

  {#key arr1}
    <div
      id="content-area"
      dir="ltr"
      bind:clientWidth={w}
      bind:clientHeight={h}
      style="position: relative; width: {w}px; height: {h}px;"
      class="screen d"
    >
      {#each arr1 as buble, i}
        {@const myline = orders[i] ?? { x: 0, y: 0 }}
        {#if buble.ani === 'vidu' && milon.desi == true}
          <div
            class="vidu normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Vid
              onModal={() => (modal = true)}
              onHover={hover}
              onProj={proj}
              onUser={user}
              onCoinLapach={delo}
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
          <div
            class=" halu normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Hal
              onModal={() => (modal = true)}
              onCoinLapach={delo}
              user_1s={buble.user_1s}
              onHover={hover}
              onProj={proj}
              onUser={user}
              hervach={buble.hervach}
              halukot={buble.halukot}
              forumId={buble.forumId}
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
        {:else if buble.ani === 'sheirutp' && milon.sheirutp == true}
          <div
            class="sheirutp normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <ProductRequestCoin {buble} />
          </div>
        {:else if buble.ani === 'mtaha' && milon.betaha == true}
          <div
            class="betaha normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <MissionInProgress
              onProj={proj}
              onUser={user}
              onHover={hover}
              onCoinLapach={delo}
              onModal={() => (modal = true)}
              pu={buble.pu}
              tasks={buble.acts.data}
              status={buble.status}
              tx={buble.tx}
              iskvua={buble.iskvua}
              coinlapach={buble.coinlapach}
              usernames={buble.usernames}
              noofpu={buble.noof}
              oldzman={buble.timer}
              stname={buble.stname}
              mId={buble.id}
              missId={buble.missionId}
              missionName={buble.name}
              projectId={buble.projectId}
              projectName={buble.projectName}
              missionDetails={buble.descrip}
              src={buble.src}
              link={buble.privatlinks}
              hearotMeyuchadot={buble.hearotMeyuchadot}
              dueDateOrCountToDedline={buble.admaticedai}
              hoursdon={buble.howmanyhoursalready}
              hourstotal={buble.hoursassinged}
              perhour={buble.perhour}
              onDone={delo}
              {low}
            />
          </div>
        {:else if buble.ani === 'pmashes' && milon.ppmash == true}
          <div
            class="normSml ppmash"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <PendingMa
              onHover={hover}
              onProj={proj}
              onUser={user}
              onCoinLapach={delo}
              onModal={modali}
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
              acts={buble.acts || []}
              {low}
            />
          </div>
        {:else if buble.ani === 'pends' && milon.pend == true}
          <div
            class="normSml pend"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <PendingM
              onHover={hover}
              onModal={modali}
              onProj={proj}
              onUser={user}
              onCoinLapach={delo}
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
          <div
            class="pmaap normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Weget
              onAcsept={delo}
              onDecline={delo}
              onHover={hover}
              onModal={modali}
              onProj={proj}
              onUser={user}
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
          <div
            class="fiap normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Fiappru
              onAcsept={delo}
              onDecline={delo}
              onHover={hover}
              onModal={modali}
              onProj={proj}
              onUser={user}
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
          <div
            class="welc normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Welcomt
              welcomId={buble.welcomeId}
              id={buble.id}
              src={buble.src}
              onHover={hover}
              coinlapach={buble.coinlapach}
              onCoinLapach={delo}
              username={buble.username}
              projectName={buble.projectName}
              projectId={buble.projectId}
              partnershipDetails={buble.details}
              pd={buble.pd}
            />
          </div>
        {:else if buble.ani === 'askedcoin' && milon.asks == true}
          <div
            class="asks normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Reqtojoin
              onAcsept={delo}
              onHover={hover}
              onModal={modali}
              onProj={proj}
              onUser={user}
              onDecline={delo}
              iskvua={buble.iskvua}
              email={buble.email}
              role={buble.role}
              workways={buble.workways}
              userSkills={buble.userSkills}
              userRole={buble.userRole}
              userWorkway={buble.userWorkway}
              skills={buble.skills}
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
              missionDetails={buble.missionDetails}
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
              acts={buble.acts}
              openMid={buble.omid}
              stylef={buble.stylef}
              st={buble.st}
              chat={buble.chat}
              declined={buble.decid}
              isRishon={buble?.openMissionData?.isRishon || buble.isRishon}
              forumId={buble.forumId}
              timegramaId={buble.timegramaId}
              timegramaDate={buble.timegramaDate}
              negopendmissions={buble.negopendmissions || []}
              orderon={buble.orderon || 0}
              {low}
            />
          </div>
        {:else if buble.ani === 'askedm' && milon.askmap == true}
          <div
            class="askmap normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Reqtom
              onAcsept={delo}
              onDecline={delo}
              onHover={hover}
              onModal={modali}
              onProj={proj}
              onUser={user}
              onChat={chat}
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
          <div
            class="hachla normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Desi
              onAcsept={delo}
              onDecline={delo}
              onHover={hover}
              onModal={modali}
              onProj={proj}
              onChat={chat}
              noofpu={buble.noof}
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
          <div
            class="sugg normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <ProjectSuggestor
              onModal={modali}
              onLess={delo}
              onHover={hover}
              onProj={proj}
              onUser={user}
              onMesima={mesima}
              coinlapach={buble.coinlapach}
              acts={buble.acts}
              restime={buble.restime}
              {askedarr}
              {declineddarr}
              pid={buble.pid}
              chat={buble.chat ?? null}
              askId={buble.askId ?? null}
              alreadyi={buble.alreadyi}
              deadLine={buble.sqadualed}
              oid={buble.id}
              hst={buble.hst}
              stb={buble.stb}
              projectName={buble.projectName}
              role={buble.tafkidims}
              skills={buble.skills}
              missionDetails={buble.descrip}
              notes={buble.hearotMeyuchadot}
              src={buble.src}
              missionName={buble.name}
              projectId={buble.projectId}
              workways={buble.work_ways}
              noOfHours={buble.noofhours}
              perhour={buble.perhour}
              total={(buble.noofhours || 0) * (buble.perhour || 0)}
              noOfusers={buble.noOfusers}
              {low}
            />
          </div>
        {:else if buble.ani === 'huca' && milon.pmashs == true}
          <div
            class="pmashs normSml"
            style="width:{size}px; left:{orders[i]?.x}px; top:{orders[i]?.y}px"
          >
            <Mashsug
              onLess={delo}
              onHover={hover}
              onProj={proj}
              onUser={user}
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
          onCards={cards}
          onHover={hover}
          onShowall={showall}
          onShowonly={showonly}
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
</div>

<style>
  .coin-container {
    background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    overflow: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    padding: 0;
  }

  .screen {
    background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    margin: 0 auto;
    transform-origin: center center;
  }

  .midCom {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
  }

  .midCom:hover {
    z-index: 444;
  }

  .normSml {
    position: absolute;
    transition: transform 500ms ease-in-out;
    border-radius: 50%;
    /* Position your elements based on the center */
  }

  .control-buttons {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 999;
  }

  .control-button {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .control-button:hover {
    background-color: rgba(255, 255, 255, 0.25);
    transform: scale(1.1);
  }

  .control-button:active {
    transform: scale(0.95);
  }

  .redistribute-button {
    background-color: rgba(100, 200, 255, 0.15);
  }

  .redistribute-button:hover {
    background-color: rgba(100, 200, 255, 0.25);
  }
</style>
