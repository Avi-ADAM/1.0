<script>
  import { page } from '$app/state';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';
  import MissionInProgress from '../../../components/lev/missionInProgress.svelte';
  import ProjectSuggestor from '../../../components/lev/projectSuggestor.svelte';
  import Reqtojoin from '../../../components/lev/reqtojoin.svelte';
  import PendingM from '../../../components/lev/pandingMesima.svelte';
  import PendingMa from '../../../components/lev/pmas.svelte';
  import Welcomt from '../../../components/lev/cards/welcomeToCard.svelte';
  import Fiappru from '../../../components/lev/fiappru.svelte';
  import Mashsug from '../../../components/lev/mashsuggest.svelte';
  import Reqtom from '../../../components/lev/reqtom.svelte';
  import Weget from '../../../components/lev/weget.svelte';
  import Hal from '../../../components/lev/halukaask.svelte';
  //import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import Header from './../../header/header.svelte';
  import { Swiper, SwiperSlide } from 'swiper/svelte';
  // Svelte 5: Define callback props instead of using createEventDispatcher
  let {
    onCards,
    onStart,
    onUser,
    onHover,
    onProj,
    low = false,
    cards = true,
    askedarr = [],
    declineddarr = [],
    arr1 = [],
    indexi = -1,
    sug = 13,
    pen = 13,
    ask = 17,
    wel = 17,
    beta = 13,
    des = 13,
    fia = 99,
    pmash = 99,
    mashs = 17,
    maap = 17,
    askma = 13,
    hachlot = 9
  } = $props();

  let milon = $state({
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
    askmap: true,
    hachla: true
  });
  // Import Swiper styles
  import 'swiper/css';
  import 'swiper/css/navigation';

  import 'swiper/css/effect-fade';
  import 'swiper/css/keyboard';
  import 'swiper/css/mousewheel';
  import './stylec.css';
  let currentIndex = $state(0);
  let swiperInstance;
  const noThings = {
    he: 'לא נמצאו הצעות או פעולות עבורך, מומלץ לגשת לעמוד הפרופיל כדי להוסיף כישורים, משאבים או כדי ליצור ריקמה חדשה, בהצלחה ',
    en: 'There are no suggestions or actions for you, it is recommended to go to the profile page to add connections, resources or create a new freeMates'
  };
  const toProfile = {
    he: ' לעמוד הפרופיל',
    en: 'to the profile page'
  };

  onMount(() => {
    // הסר את האתחול הישיר של Swiper כאן
    // swiperInstance = new Swiper('.swiper', {
    //   on: {
    //     slideChange: () => {
    //       currentIndex = swiperInstance.realIndex;
    //     },
    //   },
    // });
  });

  // הוסף פונקציה לטיפול באירוע swiper
  function handleSwiper(e) {
    const [swiper] = e.detail;
    swiperInstance = swiper;
    swiperRef = swiper;
    swiper.on('slideChange', () => {
      currentIndex = swiper.realIndex;
    });
  }

  // import required modules
  import {
    Manipulation,
    Mousewheel,
    Keyboard,
    EffectFade,
    Navigation
  } from 'swiper'; //, Virtual
  import Switch from './../../../celim/switch.svelte';
  import DecisionMaking from '../decisionMaking.svelte';
  import Filter from './filter.svelte';
  import FilterIcon from '$lib/celim/icons/filterIcon.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import Button from '$lib/celim/ui/button.svelte';
  import { goto } from '$app/navigation';
  let h = $state();

  let swiperRef = null;

  $effect(() => {
    if (swiperRef && indexi != -1) {
      swiperRef.slideTo(indexi);
      indexi = -1;
    }
  });
  function change() {
    console.log(cards, 'change');
    console.log('will change');
    onCards?.({ cards: false });
  }
  let slideIndex;
  $effect(() => {
    if (swiperRef) {
      // re-run when filteredArr changes
      filteredArr;
      swiperRef.update();
    }
  });
  async function delo(event) {
    console.log('slideIndex');
    slideIndex = event.coinlapach;

    // swiperRef.removeSlide(slideIndex)
    //

    onStart?.({ cards: false, ani: event.ani, coinlapach: event.coinlapach }); // Svelte 5: Replaced dispatch with callback prop
    // let oldob = arr1;
    // const x = oldob.map(c => c.coinlapach);
    // const indexy = x.indexOf(event.coinlapach);
    // oldob.splice(indexy, 1);
    // arr1 = oldob

    // arr1 = [...arr1]
  }
  function user(event) {
    onUser?.({ id: event.id }); // Svelte 5: Replaced dispatch with callback prop
  }

  function hover(event) {
    onHover?.({ id: event.id }); // Svelte 5: Replaced dispatch with callback prop
  }
  function chat() {}

  function proj(event) {
    console.log(event.id);
    onProj?.({ id: event.id }); // Svelte 5: Replaced dispatch with callback prop
  }
  let hovered = false;
  const srca = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg'
  };
  const srcb = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg'
  };
  let d = { he: 'לב 1💗1', en: 'heart of 1💗1' };
  let u = { he: 'לב 1💗1', en: 'heart of 1💗1' };
  const nexttitle = { he: ' יאללה נקסט!', en: '  next!' };
  const pretitle = { he: 'רגע, מה זה היה?', en: 'wait.. what was that?' };
  function hoverede() {
    hovered = !hovered;
    if (hovered == false) {
      u = d[$lang];
    }
    onHover?.({ id: u }); // Svelte 5: Replaced dispatch with callback prop
  }
  function hoverc(id) {
    if (id == '0') {
      u = d[$lang];
    } else {
      u = id;
    }

    onHover?.({ id: u }); // Svelte 5: Replaced dispatch with callback prop
  }
  const nav = {
    he: 'ניווט: לעמוד הפרופיל האישי מימין, למוח הרקמות שמאל',
    en: 'Navigation: right side, bottom'
  };
  //exclude meData huca
  function showonly(event) {
    console.log(event, 'event');
    if (event.kind !== 'projects') {
      const value = event.data;
      for (const key in milon) {
        milon[key] = false;
      }

      milon[value] = true;
    } else {
      const id = event.id;
      console.log(id, 'FILTER+id');
      filterByProjectId(id);
    }
  }

  function showall(event) {
    filter = false;
    filter2 = false;
    clearFilters();
    for (const key in milon) {
      milon[key] = true;
    }
  }
  let filter = $state(false),
    filter2 = $state(false);
  const filterT = { he: 'מיון', en: 'filter' };
  let filteredArr = $state(arr1); // Initialize with arr1
  let currentProjectIdFilter = $state(null);

  // Effect to keep filteredArr in sync with arr1 or apply project filter
  $effect(() => {
    if (currentProjectIdFilter !== null) {
      filteredArr = arr1.filter(
        (item) => item.projectId && item.projectId === currentProjectIdFilter
      );
    } else {
      filteredArr = arr1;
    }
  });

  function filterByProjectId(projectId) {
    currentProjectIdFilter = projectId; // Setting this will trigger the effect
    console.log(filteredArr);
  }

  function clearFilters() {
    currentProjectIdFilter = null; // Setting this will trigger the effect
  }
  let uniqueProjects = $derived(
    Array.from(
      arr1.reduce((map, item) => {
        if (item.projectId && item.projectName) {
          if (!map.has(item.projectId)) {
            map.set(item.projectId, {
              projectName: item.projectName,
              count: 0
            });
          }
          map.get(item.projectId).count++;
        }
        return map;
      }, new Map())
    ).map(([projectId, { projectName, count }]) => ({
      projectId,
      projectName,
      count
    }))
  );
$effect(() => {
    console.log(filter,filter2, 'uniqueProjects');
  });
  import { isScrolable } from './isScrolable.svelte.js'
</script>

{#if !isMobileOrTablet()}
  <span
    role="contentinfo"
    onmouseenter={() => hoverc(nav[$lang])}
    onmouseleave={() => hoverc('0')}
  >
    <Header second="/moach" secondTitle={{ he: 'למוח', en: 'to Brain' }} />
  </span>
{/if}
{#key arr1}
  {#key low}
    {#if arr1.length > 0}
      <div
        dir={$lang == 'he' ? 'rtl' : 'ltr'}
        bind:clientWidth={h}
        class="body box-border h-screen"
      >
        {#if !isMobileOrTablet()}
 
          <img
            onmouseenter={() => hoverc(nexttitle[$lang])}
            onmouseleave={() => hoverc('0')}
            class={$lang == 'he' ? 'perv' : '	next'}
            src={srcb[$lang]}
            alt={$lang == 'he' ? 'חזרה' : '	next'}
          />
          <img
            onmouseenter={() => hoverc(pretitle[$lang])}
            onmouseleave={() => hoverc('0')}
            class={$lang == 'he' ? 'next' : 'perv'}
            class:hidden={currentIndex == 0}
            src={srca[$lang]}
            alt={$lang == 'he' ? 'הבא' : '	next'}
          />
          <div
                      dir="ltr"
            role="contentinfo"
            onmouseenter={() => hoverc('שינוי התצוגה מקלפים למטבעות')}
            onmouseleave={() => hoverc('0')}
            style:visibility={low == true ? 'hidden' : 'visible'}
            class="bg z-[1000]"
          >
            <Switch
              bind:value={cards}

              onChange={() => change()}
              design="multi"
              options={[true, false]}
            />
          </div>
          <div
            dir="ltr"
            role="contentinfo"
            onmouseenter={() => hoverc(filterT[$lang])}
            onmouseleave={() => hoverc('0')}
            style:visibility={low == true ? 'hidden' : 'visible'}
            class="z-[1000] top-0 absolute left-1/2 -translate-x-1/2 flex flex-row items-center justify-center"
          >
            <button
              class="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-gold/80 rounded-full border-1 border-barbi"
              onclick={() => (filter ? showall() : (filter = true))}
            >
              <FilterIcon filterType="cardType" isX={filter} /></button
            >
            {#if filter}
              <Filter
                onShowonly={showonly}
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
                filterKind="kind"
              />
            {/if}
            {#if uniqueProjects.length >= 2}
              <button
                class="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-gold/80 rounded-full border-1 border-barbi"
                onclick={() => (filter2 ? showall() : (filter2 = true))}
              >
                <FilterIcon isX={filter2} /></button
              >
              {#if filter2}
                <Filter
                  allIds={uniqueProjects}
                  filterKind="projects"
                  onShowonly={showonly}
                />
              {/if}
            {/if}
          </div>
        {:else if !low}
          <div
            class="fixed z-50 max-w-[95%] h-8 sm:max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-12 left-1/2 dark:bg-gray-700 dark:border-gray-600"
          >
            <div
              class=" h-full max-w-lg flex space-x-2 flex-row mx-auto justify-center align-middle items-center"
            >
              {#if !filter}
                <div
                  dir="ltr"
                  role="contentinfo"
                  onmouseenter={() => hoverc('שינוי התצוגה מקלפים למטבעות')}
                  onmouseleave={() => hoverc('0')}
                  style:visibility={low == true ? 'hidden' : 'visible'}
                  class="px-4 z-[1000]"
                >
                  <Switch
                    bind:value={cards}
                    onChange={() => change()}
                    design="multi"
                    options={[true, false]}
                  />
                </div>
              {/if}
              <div
                dir="ltr"
                role="contentinfo"
                onmouseenter={() => hoverc(filterT[$lang])}
                onmouseleave={() => hoverc('0')}
                style:visibility={low == true ? 'hidden' : 'visible'}
                class="z-[1000] px-4 flex flex-row items-center justify-center"
              >
                <button
                  class="w-10 h-10 flex items-center justify-center rounded-full border-1 border-barbi"
                  onclick={() => (filter ? showall() : (filter = true))}
                >
                  <FilterIcon isX={filter} filterType="cardType" /></button
                >
                {#if filter}
                  <Filter
                    onShowonly={showonly}
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
                    filterKind="kind"
                  />
                {/if}
                <button
                  class="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-gold/80 rounded-full border-1 border-barbi"
                  onclick={() => (filter2 ? showall() : (filter2 = true))}
                >
                  <FilterIcon isX={filter2} /></button
                >
                {#if filter2}
                  <Filter
                    allIds={uniqueProjects}
                    filterKind="projects"
                    onShowonly={showonly}
                  />
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <div
          role="contentinfo"
          class="swi"
          onmouseenter={() => hoverede()}
          onmouseleave={() => hoverede()}
        >
          {#key filteredArr}
            <Swiper
              releaseOnEdges={true}
              direction={!isMobileOrTablet() ? 'horizontal' : 'vertical'}
              slidesPerView={isMobileOrTablet() ? 1 : 'auto'}
              spaceBetween={isMobileOrTablet() ? 0 : null}
              on:swiper={handleSwiper}
              keyboard={{
                enabled: isScrolable.value ? false : true 
              }}
              mousewheel={isMobileOrTablet() ? isScrolable.value ? false : true : false}
              allowTouchMove={isMobileOrTablet() ? isScrolable ? false : true : false}
              effect={'slide'}
              grabCursor={true}
              modules={[Manipulation, Mousewheel, Keyboard, Navigation]}
              class="mySwiperc {!isMobileOrTablet()
                ? 'swiperc'
                : 'swipermobile'}"
              dir={$lang == 'he' ? 'rtl' : 'ltr'}
              navigation={isMobileOrTablet()
                ? false
                : {
                    nextEl: $lang == 'he' ? '.perv' : '.next',
                    prevEl: $lang == 'he' ? '.next' : '.perv'
                  }}
            >
              {#each filteredArr as buble, i}
                {#if buble.ani === 'haluk' && milon.desi == true}
                  <SwiperSlide
                    class="{isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'} "
                    ><Hal
                      isVisible={currentIndex === i}
                      user_1s={buble.user_1s}
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
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
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'mtaha' && milon.betaha == true}
                  <SwiperSlide
                    class="{isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'} "
                    ><MissionInProgress
                      onProj={proj}
                      cards="true"
                      onUser={user}
                      onHover={hover}
                      {low}
                      restime={buble.restime}
                      isVisible={currentIndex === i}
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
                      projectId={buble.projectId}
                      projectName={buble.projectName}
                      missionDetails={buble.descrip}
                      src={buble.src}
                      link={buble.privatlinks}
                      dueDateOrCountToDedline={buble.admaticedai}
                      startDate={buble.dates}
                      hoursdon={buble.howmanyhoursalready}
                      hourstotal={buble.hoursassinged}
                      perhour={buble.perhour}
                      onDone={delo}
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'pmashes' && milon.ppmash == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><PendingMa
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
                      cards="true"
                      isVisible={currentIndex === i}
                      {low}
                      coinlapach={buble.coinlapach}
                      onCoinLapach={delo}
                      restime={buble.restime}
                      ordern={buble.orderon}
                      timegramaId={buble.timegramaId}
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
                      nego_mashes={buble.nego_mashes || []}
                      timeGramaDate={buble.timeGramaDate}
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'pends' && milon.pend == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><PendingM
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
                      onCoinLapach={delo}
                      timegramaId={buble.timegramaId}
                      {low}
                      negopendmissions={buble.negopendmissions}
                      isVisible={currentIndex === i}
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
                      skills={buble.skills}
                      tafkidims={buble.tafkidims}
                      workways={buble.workways}
                      mdate={buble.mdate}
                      mdates={buble.dates}
                      vallues={buble.vallues}
                      pendId={buble.pendId}
                      isKavua={buble.isKavua}
                      diun={buble.diun}
                      users={buble.users}
                      sqadualed={buble.sqadualed}
                      cards="true"
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'wegets' && milon.pmaap == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><Weget
                      onAcsept={delo}
                      cards="true"
                      onDecline={delo}
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
                      {low}
                      isVisible={currentIndex === i}
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
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'fiapp' && milon.fiap == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><Fiappru
                      onAcsept={delo}
                      onDecline={delo}
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
                      cards="true"
                      {low}
                      timegramaId={buble.timegramaId}
                      timegramaDate={buble.timegramaDate}
                      isVisible={currentIndex === i}
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
                    /></SwiperSlide
                  ><!--
{:else if buble.ani === "walcomen" && milon.welc == true}
   <SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}"><Welcomt 
    id={buble.id}
        coinlapach={buble.coinlapach} 

          onHover={hover}
       username={buble.username}
       projectName={buble.projectName}
       /></SwiperSlide>

   -->
       {:else if buble.ani === "walcomen" && milon.welc == true}
                                     <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><Welcomt
                                        welcomId={buble.welcomId}
                                        id={buble.id}
                                        src={buble.src}
                                        onHover={hover}
                                        coinlapach={buble.coinlapach}
                                        onCoinLapach={delo}
                                        username={buble.username}
                                        projectName={buble.projectName}
                                        projectId={buble.id}
                                        partnershipDetails={buble.details}
                                        pd={buble.pd}
                                        /></SwiperSlide>
   {:else if buble.ani === 'askedcoin' && milon.asks == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><Reqtojoin
                      onAcsept={delo}
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
                      onDecline={delo}
                      cards="true"
                      isVisible={currentIndex === i}
                      iskvua={buble.iskvua}
                      email={buble.email}
                      role={buble.role}
                      workways={buble.workways}
                      userSkills={buble.userSkills}
                      userRole={buble.userRole}
                      userWorkway={buble.userWorkway}
                      skills={buble.skills}
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
                      openMid={buble.omid}
                      stylef={buble.stylef}
                      st={buble.st}
                      isRishon={buble.isRishon}
                      declined={buble.decid}
                      timegramaId={buble.timegramaId}
                      timegramaDate={buble.timegramaDate}
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'askedm' && milon.askmap == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><Reqtom
                      onAcsept={delo}
                      onDecline={delo}
                      onHover={hover}
                      onProj={proj}
                      cards="true"
                      onUser={user}
                      onChat={chat}
                      isVisible={currentIndex === i}
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
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'meData' && milon.sugg == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><ProjectSuggestor
                      onLess={delo}
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
                      isVisible={currentIndex === i}
                      coinlapach={buble.coinlapach}
                      {low}
                      pid={buble.pid}
                      acts={buble.attributes.acts}
                      restime={buble.attributes.project.data.attributes.restime}
                      chat={buble.chat ?? null}
                      askId={buble.askId ?? null}
                      alreadyi={buble.alreadyi}
                      {askedarr}
                      {declineddarr}
                      deadLine={buble.attributes.sqadualed}
                      oid={buble.id}
                      projectName={buble.attributes.project.data.attributes
                        .projectName}
                      role={buble.attributes.tafkidims}
                      skills={buble.attributes.skills}
                      missionDetails={buble.attributes.descrip}
                      hearotMeyuchadot={buble.attributes.hearotMeyuchadot}
                      src={buble.attributes.project.data.attributes.profilePic
                        .data?.attributes.formats.thumbnail.url}
                      missionName={buble.attributes.name}
                      projectId={buble.attributes.project.data.id}
                      workways={buble.attributes.work_ways}
                      noOfHours={buble.attributes.noofhours}
                      perhour={buble.attributes.perhour}
                      total={buble.attributes.noofhours *
                        buble.attributes.perhour}
                      cards="true"
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'huca' && milon.pmashs == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><Mashsug
                      onLess={delo}
                      cards="true"
                      onHover={hover}
                      onProj={proj}
                      onUser={user}
                      messege={buble.messege}
                      {i}
                      isVisible={currentIndex === i}
                      coinlapach={buble.coinlapach}
                      {low}
                      {askedarr}
                      declineddarra={buble.declineddarra}
                      deadLine={buble.sqadualed}
                      sqadualedf={buble.sqadualedf}
                      oid={buble.oid}
                      id={buble.id}
                      price={buble.price}
                      myp={buble.myp}
                      already={buble.already}
                      restime={buble.restime}
                      projectName={buble.projectName}
                      missionDetails={buble.descrip}
                      notes={buble.hearotMeyuchadot}
                      src={buble.srcb}
                      mashName={buble.mashname}
                      projectId={buble.projectid}
                      descrip={buble.descrip}
                      spnot={buble.spnot}
                      easy={buble.easy}
                    /></SwiperSlide
                  >
                {:else if buble.ani === 'hachla' && milon.hachla == true}
                  <SwiperSlide
                    class={isMobileOrTablet()
                      ? 'swipr-slidemobile'
                      : 'swiper-slidec'}
                    ><DecisionMaking
                      onAcsept={delo}
                      onDecline={delo}
                      onHover={hover}
                      onProj={proj}
                      cards="true"
                      onChat={chat}
                      timegramaDate={buble.timegramaDate}
                      timegramaId={buble.timegramaId}
                      restime={buble.restime}
                      noofpu={buble.noofpu}
                      newpicid={buble?.newpicid}
                      coinlapach={buble.coinlapach}
                      created_at={buble.created_at}
                      spdata={buble.spdata}
                      isVisible={currentIndex === i}
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
                      projectName={buble.projectName}
                      projectId={buble.projectId}
                      userId={buble.uid}
                      src={buble.src}
                      src2={buble?.newpic}
                      stylef={buble.stylef}
                      st={buble.st}
                      spid={buble.spid}
                      {low}
                    /></SwiperSlide
                  >
                {/if}
              {/each}
              <SwiperSlide
                class="{isMobileOrTablet() ? 'swipr-slidemobile' : 'swiper-slidec'}"
              >
                <div
                  class="flex flex-col items-center justify-center h-full w-full"
                >
                  <h2 class="text-2xl font-bold mb-4">
                    {$lang === 'he' ? 'התעדכנת בהכל' : 'End of the line'}
                  </h2>
                  <Button
                    onClick={() => swiperRef?.slideTo(0)}
                    text={{ he: 'חזרה להתחלה', en: 'Back to Start' }}
                  />
                </div>
              </SwiperSlide>
              <!--- <SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 1</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 2</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 3</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 4</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 5</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 6</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 7</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 8</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 9</SwiperSlide>-->
            </Swiper>
          {/key}
        </div>
      </div>
    {:else if low == true}
      <div class="body grid items-center justify-center">
        <Lowding height="50vh" />
      </div>
    {:else}
      <div class="body flex flex-col items-center justify-center">
        <h1 class="text-2xl font-bold text-barbi text-center">
          {noThings[$lang]}
        </h1>
        <Button onClick={() => goto('/me')} text={toProfile} />
      </div>
    {/if}
  {/key}
{/key}

<style>
  .body {
    height: 100vh;
    width: 100vw;
    border: none;

    background: #ffcba4;
    background: linear-gradient(to bottom, #ffcba4 0%, #f0bc95 100%);
  }

  .bg {
    position: absolute;
    top: 7%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .next {
    position: absolute;
    top: calc(50% - 15px);
    left: calc(100% - 50px);
    height: 30px;
    width: 50px;
  }
  .perv {
    position: absolute;
    top: calc(50% - 15px);
    right: calc(100% - 50px);
    height: 30px;
    width: 50px;
  }
  @media (min-width: 528px) {
    .next {
      position: absolute;
      top: calc(50% - 35px);
      left: calc(100% - 90px);
      height: 70px;
      width: 90px;
    }
    .perv {
      position: absolute;
      top: calc(50% - 35px);
      right: calc(100% - 90px);
      height: 70px;
      width: 90px;
    }
  }
</style>
