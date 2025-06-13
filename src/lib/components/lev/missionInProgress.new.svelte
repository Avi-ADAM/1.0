<script lang="ts">
    import { Drawer } from 'vaul-svelte';
    import {nutifi } from '$lib/func/nutifi.svelte'
    import { toast } from 'svelte-sonner';
    import RangeSlider from "svelte-range-slider-pips";
    import { lang } from '$lib/stores/lang.js'
    import { fly, scale } from 'svelte/transition';
    import { clickOutside } from './outsidclick.js';
    import { formatTime } from './utils.js';
    import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
    import { goto } from '$app/navigation';
    import { idPr } from '../../stores/idPr.js';
    import { onMount, onDestroy } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import {betha} from './storess/betha.js'
    import Lowbtn from '$lib/celim/lowbtn.svelte'
    import {SendTo} from '$lib/send/sendTo.svelte';
    import axios from 'axios';
    import { startTimer, stopTimer, saveTimer, handleClearSingle, handleClearAll, updateTimer } from '$lib/func/timers.svelte';
    import Cards from './cards/cards.svelte';
    import { Swiper, SwiperSlide } from 'swiper/svelte';
    import { Virtual, Pagination, Navigation } from 'swiper';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { enhance, applyAction } from '$app/forms';
    import { invalidate } from '$app/navigation';
    import { sta } from '$lib/stores/sta';
    
    // ייבוא סגנונות Swiper
    import 'swiper/css';
    import 'swiper/css/virtual';
    import 'swiper/css/pagination';
    import 'swiper/css/navigation';

    const baseUrl = import.meta.env.VITE_URL;
    const dispatch = createEventDispatcher();

    // Props
    export let isVisible = true;
    export let coinlapach;
    export let stname;
    export let modal = false;
    export let iskvua = false;
    export let low = false;
    export let status = [0];
    export let tasks= [];
    export let restime;
    export let tx = 300;
    export let dueDateOrCountToDedline = "11:11";
    export let projectName = "ONE";
    export let missionName = "do x";
    export let missionDetails = "do x in y";
    export let hearotMeyuchadot;
    export let src = "coin.png";
    export let link = "https://www.1lev1.world";
    export let linkDescription = "לביצוע";
    export let projectId;
    export let linkP = "/project/";
    export let hourstotal;
    export let hoursdon = 0;
    export let mId;
    export let missId;
    export let noofpu;
    export let pu;
    export let perhour;
    export let usernames;
    export let oldzman;
    export let displayType = "coin"; // אפשרויות: "coin" או "card"

    // Local state
    let dialogOpen = false;
    let show = true;
    let idL;
    let x = 0;
    let already = false;
    let pcli = 0;
    let pmcli = 0;
    let zmani;
    let msdonf;
    let running = false;
    let error1;
    let timer = null; // משתנה לשמירת מצב הטיימר הנוכחי
    let lapse = 0;
    let token;
    let bearer1;
    let linkg = baseUrl + "/graphql";
    let seconds; // משתנה לשמירת אלמנט השניות בשעון
    let rotation = 0; // משתנה לשמירת הסיבוב הנוכחי של השעון
    let a = 0;
    let iskvuatime = false;
    let iskvuadate = false;
    let iskvuacount = false;
    let iskvuapu = false;
    let iskvuahours = false;
    let iskvuahourspu = false;
    let iskvuahourscount = false;
    let iskvuahoursdate = false;
    let iskvuapucount = false;
    let iskvuapudate = false;
    let iskvuacountdate = false;
    let iskvuaall = false;
    let iskvuanone = false;
    let iskvuasome = false;
    let iskvuaother = false;
    let iskvuaotherpu = false;
    let iskvuaothercount = false;
    let iskvuaotherdate = false;
    let iskvuaotherhours = false;
    let iskvuaotherhourspu = false;
    let iskvuaotherhourscount = false;
    let iskvuaotherhoursdate = false;
    let iskvuaotherpucount = false;
    let iskvuaotherpudate = false;
    let iskvuaothercountdate = false;
    let iskvuaotherall = false;
    let timerElement;
    let startTime;
    let zman = 0;
    let isRunning = false;

    $: msdonf = hoursdon * 3600000;
    $: zman = msdonf + lapse + x;

    function percentage(partialValue, totalValue) {
        return (100 * partialValue) / totalValue;
    }

    // Timer functions
    async function handleRunClick() {
        if (!running) {
            // התחלת טיימר חדש
            const timerResponse = await startTimer(timer, mId, idL, projectId, timer?.id || 0, false, fetch);
            if (timerResponse) {
                timer = timerResponse;
                running = true;
                stname = Date.now();
                tdtd[coinlapach-1].stname = stname;
                tdtd[coinlapach-1].running = true;
                betha.set(tdtd);
            }
        } else if (timer?.attributes?.activeTimer?.data) {
            // עצירת הטיימר - רק אם יש טיימר פעיל
            const stoppedTimer = await stopTimer(timer.attributes.activeTimer.data, fetch, false);
            if (stoppedTimer) {
                timer = stoppedTimer;
                running = false;
                stname = "stopi";
                tdtd[coinlapach-1].stname = "stopi";
                tdtd[coinlapach-1].running = false;
                betha.set(tdtd);
            }
        }
    }

    async function handleClearClick() {
        const clearedTimer = await handleClearAll(timer, fetch, false);
        if (clearedTimer) {
            timer = clearedTimer;
            running = false;
            lapse = 0;
            x = 0;
            stname = "0";
            tdtd[coinlapach-1].stname = "0";
            tdtd[coinlapach-1].timer = 0;
            tdtd[coinlapach-1].running = false;
            betha.set(tdtd);
        }
    }

    async function save() {
        const savedResult = await saveTimer(timer, mId, fetch, false);
        if (savedResult) {
            timer = savedResult.timer;
            running = false;
            lapse = 0;
            x = 0;
            hoursdon = savedResult.mission.attributes.howmanyhoursalready;
            stname = "0";
            tdtd[coinlapach-1].stname = "0";
            tdtd[coinlapach-1].timer = 0;
            tdtd[coinlapach-1].hoursdon = hoursdon;
            tdtd[coinlapach-1].running = false;
            betha.set(tdtd);
            toast.success("נשמר בהצלחה");
        }
    }

    // Other functions
    function linke(s) {
        pcli += 1;
        if (pcli >= 2) {
            dispatch("proj", {id: projectId});
        }
    }

    function project(id) {
        pmcli += 1;
        if (pmcli >= 2) {
            idPr.set(id);
            goto("/moach");
        }
    }

    function done() {
        already = true;
        a = 1;
        isOpen = true;
    }

    function opentask() {
        a = 4;
        isOpen = true;
    }

    let isOpen = false;
    function close() {
        isOpen = false;
        already = false;
    }

    // Lifecycle
    onMount(async () => {
        if (status == null) {
            status = [0];
        }
        if (status >= 0) {
            const numi = status;
            status = [];
            status.push(numi);
        }

        if (tdtd[coinlapach-1]?.ch === true) {
            stname = tdtd[coinlapach-1].stname;
            if (tdtd[coinlapach-1].hoursdon !== false) {
                hoursdon = tdtd[coinlapach-1].hoursdon;
            }
        }

        // טיפול במצב הטיימר בטעינה
        if (stname === "0") {
            // טיימר לא פעיל
        } else if (stname === "stopi") {
            if (tdtd[coinlapach-1]?.ch === true && tdtd[coinlapach-1].hoursdon === false) {
                oldzman = tdtd[coinlapach-1].timer;
            }
            x = oldzman;
        } else {
            if (tdtd[coinlapach-1]?.ch === true) {
                oldzman = tdtd[coinlapach-1].timer;
            }
            running = true;
            const startTime = stname - lapse;
            timer = setInterval(() => {
                lapse = Date.now() - startTime;
            }, 1);
            x = oldzman;
        }

        if (browser) {
            modal = true;
        }
    });

    // Watchers
    $: if (percentage(zman, mstotal) >= 100 && running === true && timer?.attributes?.activeTimer?.data) {
        handleRunClick();
        let text = `שלום ${usernames} הטיימר של ${missionName} נעצר מפני שמכסת השעות שסוכמה הסתיימה, יש ליצור משימה חדשה`;
        nutifi("1💗1 טיימר נעצר", text, "lev");
    }

    $: {
        if (zman >= mstotal * 0.9 && zman < mstotal * 0.95) {
            toast.message('90% מהזמן עבר');
        } else if (zman >= mstotal * 0.95 && zman < mstotal) {
            toast.message('95% מהזמן עבר');
        } else if (zman >= mstotal) {
            toast.message('הזמן נגמר!');
        }
    }

    function updateCookie() {
        if (document.cookie) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'token') {
                    token = value;
                    bearer1 = 'Bearer ' + token;
                    break;
                }
            }
        }
    }

    let tdtd = [];
    betha.subscribe(value => {
        tdtd = value;
    });

    function hover(text) {
        dispatch('hover', text);
    }

    function hoverc(event) {
        dispatch('hover', event.detail);
    }

    function start() {
        if (!running) {
            running = true;
            startTimer();
        }
    }

    function azor() {
        running = false;
    }

    function formatTime(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (running) {
            const startTime = Date.now() - lapse;
            const timer = setInterval(() => {
                if (!running) {
                    clearInterval(timer);
                    return;
                }
                lapse = Date.now() - startTime;
                zman = lapse;
                rotation = (lapse / 60000) * 360;
            }, 1000);
        }
    }

    function pauseTimer() {
        if (isRunning) {
            isRunning = false;
            clearInterval(timer);
        }
    }

    function resetTimer() {
        pauseTimer();
        zman = 0;
        if (timerElement) {
            timerElement.style.transform = 'rotate(0deg)';
        }
    }

    onMount(() => {
        startTimer();
        if (timerElement && seconds) {
            seconds.style.transformOrigin = 'bottom center';
        }
    });

    onDestroy(() => {
        pauseTimer();
        if (timer) {
            clearInterval(timer);
        }
    });
</script>

<style>
    .swiper-slidec {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.5rem;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        width: 100%;
        max-width: 500px;
    }
    .di {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        padding: 1rem;
    }
    .btin {
        border-radius: 0.5rem;
        padding: 0.5rem;
        background-color: #f5f5f5;
        border: 1px solid #e0e0e0;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
    }
    .btin:hover {
        background-color: #e0e0e0;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        padding: 1rem;
    }
    .item {
        grid-column: span 1;
    }
    @media (max-width: 768px) {
        .item {
            grid-column: span 2;
        }
    }
    @media (max-width: 480px) {
        .item {
            grid-column: span 3;
        }
    }
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 0.5rem;
    }
    .content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background-color: #ffffff;
        border-radius: 0.5rem;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .mn {
        margin: 0.5rem;
        padding: 0.5rem;
        border-radius: 0.5rem;
    }
    .ab {
        font-size: 2rem;
        font-weight: bold;
        color: var(--gold);
    }
    .bc {
        font-size: 1rem;
        color: var(--text);
    }
    .cd {
        font-size: 1.2rem;
        color: var(--gold);
    }
    .de {
        width: 100%;
        height: 1rem;
        background-color: var(--background);
        border-radius: 0.5rem;
        overflow: hidden;
    }
    .ef {
        display: inline-block;
        padding: 0.5rem 1rem;
        text-decoration: none;
        color: var(--gold);
        border-radius: 0.5rem;
        transition: all 0.2s ease-in-out;
    }
    .ga {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
    }
    .gb {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
    }
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border: none;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
    }
    .btn svg {
        width: 1.5rem;
        height: 1.5rem;
        fill: currentColor;
    }
    .btn.a {
        color: var(--gold);
    }
    .btn.b {
        color: var(--text);
    }
</style>

<div>
{#if isVisible}
    {#if displayType === "coin"}
        <Swiper
          modules={[Virtual, Pagination, Navigation]}
          spaceBetween={30}
          slidesPerView={1}
          virtual
          navigation
          pagination={{ clickable: true }}
        >
          <!-- תצוגת מטבע -->
          <SwiperSlide class="swiper-slidec">
            <div class="w-full h-full">
              <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <defs>
                  <linearGradient id="gradient-15-18">
                    <stop offset="0" style="stop-color:#F4A223"/>
                    <stop offset="1" style="stop-color:#F4A223"/>
                  </linearGradient>
                  <!-- ... הוסף את כל ה-gradients הנדרשים ... -->
                </defs>

                <g>
                  <g bind:this="{seconds}" transform="rotate(-{(rotation * 30) % 360})">
                    <path style="fill: rgb(244, 67, 54);" d="M116.31,96.26c-6.38-4.14-13.3-0.02-13.3-0.02s1.43-6.67-3.91-10.58 c-6.41-4.7-15.2-3.13-18.81,6.88c-4.13,11.45,6.46,31.39,6.46,31.39s20.6,0.81,30.2-8.09C124.76,108.61,121.13,99.39,116.31,96.26 z"/>
                    <!-- ... הוסף את שאר האלמנטים של השעון ... -->
                  </g>
                </g>

                <text fill="#00ffff" stroke="purple" on:mouseenter={()=>hover("טיימר")} on:mouseleave={()=>hover("0")} text-anchor="middle" style="font-family: Abel; font-size: 151.8557px;" transform="matrix(0.402832, 0, 0, 0.402832, 160.187408, 123.860977)">
                  <tspan x="348.475" y="383.502">{formatTime(zman)}</tspan>
                </text>

                <foreignObject x='300' y='105' width='100' height='100' transform='translate(-50 -50)'>   
                  <span class="{`normSml${perhour}-${projectId}-${mId}`}"></span>
                  <img on:click={()=>project()} on:keypress={()=>project()} on:mouseenter={()=>hover("לוגו הריקמה")} on:mouseleave={()=>hover("0")} style="border-radius: 50%;" src={src} width="24" height="24" alt="logo">
                </foreignObject> 

                <g style="overflow:hidden; text-anchor: middle;" on:click={()=>linke("p")} on:mouseenter={()=>hover("לחיצה כפולה לצפיה בעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}>
                  <text x="300" y='210' fill="#00ffff" style="filter: url(#glow);" text-anchor="middle" font-size="42">{projectName}</text>
                  <text x="300" y='210' fill="black" text-anchor="middle" font-size="42">{projectName}</text>
                </g>

                <path transform="matrix(1.4, 0, 0, 1.4 , 20, 280)" fill="transparent" stroke="transparent" id="curveooo8" d="M 0 0 A 200 200 0 0 0 400 0" />
                <text x="{tx}" fill="#00ffff" font-weight="bold" stroke="purple">
                  <textPath font-size="60" fill="#00ffff" font-weight="bold" stroke="purple" xlink:href="#curveooo8">
                    <tspan fill="#00ffff" font-weight="bold" stroke="purple" dy="-5">{missionName}</tspan>
                  </textPath>
                </text>
              </svg>
            </div>
          </SwiperSlide>

          <SwiperSlide class="swiper-slideg">
            <div id="normSmll">
              <div on:mouseenter={()=>hover("זמן שכבר בוצע")} on:mouseleave={()=>hover("0")} class="mn ab">{formatTime(zman)}</div>
              {#if missionDetails !== undefined && missionDetails !== null && missionDetails !== "undefined"}
                <p on:mouseenter={()=>hover("פרטי המשימה")} on:mouseleave={()=>hover("0")} class="mn bc">{missionDetails}</p>
              {/if}

              <h5 dir="ltr" class="mn cd">
                <span on:mouseenter={()=>hover("מספר השעות שבוצעו ונשמרו")} on:mouseleave={()=>hover("0")}>
                  {`${hoursdon ? Math.round((hoursdon + Number.EPSILON) * 100) / 100 : 0}`}
                </span> / 
                <span on:mouseenter={()=>hover("מספר השעות שהוקצו למשימה")} on:mouseleave={()=>hover("0")}>
                  {hourstotal}
                </span>
              </h5>

              <div on:mouseenter={()=>hover(sta[$lang])} on:mouseleave={()=>hover("0")} 
                   class="de border rounded-2xl border-barbi hover:border-gold"
                   on:click={() => { a = 2; isOpen = true }}
                   on:keypress={() => { a = 2; isOpen = true }}>
                <div class="rounded-2xl bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre" 
                     style="width: {status == null ? 0 : status[0]}%">
                  {status != null ? status[0] : "0"}%
                </div>
              </div>

              {#if link != null && link != undefined && link != "undefined"}
                <a on:mouseenter={()=>hover("לינק לביצוע המשימה")} on:mouseleave={()=>hover("0")} 
                   class="mn ef text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink hover:text-barbi p-0 rounded-full"
                   style="padding: 0px;" href={link}>
                  {linkDescription}
                </a>
              {/if}

              <div class="{`normSmll${perhour}-${projectId}-${mId}`}"></div>

              {#if low == false}
                {#if lapse !== 0 || x !== 0}
                  <button on:mouseenter={()=>hover("לחיצה לאיפוס הטיימר מבלי לשמור")} on:mouseleave={()=>hover("0")}
                          class="border border-barbi hover:border-gold bg-gradient-to-br from-graa to-grab text-barbi p-0 rounded-full hover:from-lturk hover:to-barbi ga"
                          on:click={handleClearClick}>
                    ניקוי
                  </button>
                  <button on:mouseenter={()=>hover("לחיצה לעצירת הטיימר ושמירת הזמן שבוצע")} on:mouseleave={()=>hover("0")}
                          class="bg-gradient-to-br text-gold hover:from-graa hover:to-grab hover:text-gold p-0 rounded-full from-lturk to-barbi gb"
                          on:click={save}>
                    הוספה
                  </button>
                {/if}

                {#if already === false}
                  <button on:mouseenter={()=>hover("לחיצה לסיום המשימה")} on:mouseleave={()=>hover("0")}
                          on:click={done} class="btn a" name="done">
                    <svg xmlns="http://www.w3.org/2000/svg" class="btin" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" />
                    </svg>
                  </button>
                {/if}

                {#if show === true}
                  <button on:mouseenter={()=>hover(`${running ? "עצירת הטיימר" : "הפעלת טיימר"}`)} on:mouseleave={()=>hover("0")}
                          on:click={running ? azor : start} class="btn b" name="start timer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="btin" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z" />
                    </svg>
                  </button>
                {/if}
              {:else if low == true}
                <Lowbtn/>
              {/if}
            </div>
          </SwiperSlide>
        </Swiper>
    {/if}

    {#if modal}
        <div data-vaul-drawer-wrapper>
            <Drawer.Root bind:open={dialogOpen} direction="right" shouldScaleBackground>
              <Drawer.Trigger/>
              <Drawer.Portal>
                <Drawer.Overlay class="fixed inset-0 bg-black/40" />
                <Drawer.Content class="fixed bottom-0 top-0 right-0 max-h-[96%] rounded-t-[10px] z-[1000] flex flex-row-reverse">
                  <div class="swiper-slidec mx-auto">
                    <Cards 
                      on:start={start}
                      on:done={done}
                      on:save={save}
                      on:hover={hoverc}
                      on:task={opentask}
                      on:azor={azor}
                      on:clear={handleClearClick}
                      on:statusi={() => { a = 2; isOpen = true }}
                      {projectId}
                      {mId}
                      {projectName}
                      {missionName}
                      {missionDetails}
                      {src}
                      {link}
                      {linkDescription}
                      {running}
                      {zman}
                      {hoursdon}
                      {hourstotal}
                      {status}
                      {already}
                      {show}
                      {low}
                      {perhour}
                    />
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
        </div>
    {/if}
{:else}
    <Cards 
        on:start={start}
        on:done={done}
        on:save={save}
        on:hover={hoverc}
        on:task={opentask}
        on:azor={azor}
        on:clear={handleClearClick}
        on:statusi={() => { a = 2; isOpen = true }}
        {isVisible}
        {low}
        {tasks}
        {dueDateOrCountToDedline}
        {hearotMeyuchadot}
        {x}
        {iskvua}
        {zman}
        {already}
        {projectName}
        {src}
        {missionDetails}
        {link}
        {missionName}
        {linkDescription}
        {running}
        {show}
        {hourstotal}
        {hoursdon}
        {status}
    />
{/if}
</div> 