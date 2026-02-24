<script>
  import Tile from '$lib/celim/tile.svelte';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '$lib/celim/lev.svelte';
  import No from '$lib/celim/no.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';

  // ייבוא רכיבים מודרניים חדשים
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';

  /**
   * @typedef {Object} Props
   * ... (כל ה-Props המקוריים שלך נשארים כאן)
   */

  let {
    low = false,
    projectName,
    timeToP,
    acts,
    src,
    perhour,
    noOfHours,
    missionDetails,
    missionName,
    skills = [],
    role = [],
    workways = [],
    totalminyearone = 1000,
    totalmaxyearone = 30000,
    totalminyearsec = 2000,
    totalmaxyearsec = 60000,
    totalinyearone = 600,
    totalinyearsec = 1000,
    isMonthly = true,
    alreadyi = false,
    hearotMeyuchadot,
    already = $bindable(),
    allr = false,
    isVisible = false,
    sqadualed,
    sqadualedf,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onProject,
    onTochat,
    noOfusers,

    // Props חדשים לתמיכה במבנה המודרני
    glowColor = 'green', // מוגדר לירוק עבור משימה מוצעת
    onProj
  } = $props();

  function hover(x) {
    onHover?.(x);
  }
  function agree() {
    already = true;
    onAgree?.();
  }
  function decline() {
    already = true;
    onDecline?.();
  }
  function nego(alr) {
    onNego?.(alr, 'n');
  }
  function project() {
    onProject?.();
    onProj?.(); // תמיכה גם בפרופ החדש במידה וקיים
  }
  function tochat() {
    onTochat?.();
  }

  const ttal = { he: 'נכנס כבר כסף', en: 'already has income' };
  const ttwe = { he: 'צפי רווח: שבוע', en: 'exp income: one week ' };
  const ttmo = { he: 'צפי רווח: חודש', en: 'exp income: one month ' };
  const tt3mo = { he: 'צפי רווח: 3 חודשים', en: 'exp income: three months' };
  const tt6mo = { he: 'צפי רווח: חצי שנה', en: 'exp income: 6 months ' };
  const tt1y = { he: 'צפי רווח: שנה', en: 'exp income: 1 year' };
  const tt2y = { he: 'צפי רווח: שנתיים', en: 'exp income: 2 years ' };
  const ttmor = { he: 'צפי רווח: ארוך טווח', en: 'exp income: long term' };
  const ttne = { he: 'ללא רווח', en: 'not profitable' };
  const headi = { he: 'הצעה למשימה', en: 'suggested mission' };

  const t = {
    acts: { he: 'רשימת מטלות:', en: 'todo list:' },
    wwneed: { he: 'דרכי עבודה מבוקשות:', en: 'ways of work for the mission:' },
    skneed: { he: 'הכישורים הנדרשים:', en: 'needed skills:' },
    rneed: { he: 'תפקיד מבוקש:', en: 'requested role:' },
    watchpr: { he: 'לצפיה בריקמה', en: 'see the FreeMate' },
    min: { he: 'מינימום', en: 'min.' },
    max: { he: '', en: 'max.' },
    firyer: { he: '', en: 'first year' }
  };
  const perho = { he: 'לשעה', en: 'per hour' };
  const hourss = { he: 'שעות', en: 'hours' };
  const monhly = { he: 'בחודש', en: 'per month' };
</script>

<!-- 1. Container מרכזי עם אפקטי Glow -->
<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} 
  flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 relative
  {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'}"
  style:--glow-rgb="2, 255, 187"
>
  <!-- 2. Header מודרני באמצעות CardHeader -->
  <CardHeader
    logoSrc={src}
    {projectName}
    cardType={headi[$lang]}
    cardTitle={missionName}
    memberCount={noOfusers}
    {glowColor}
    onProjectClick={project}
  />

  <!-- 3. אזור התוכן -->
  <div
    class="d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700/50'} 
    transition-all duration-300 p-5 flex-1 overflow-y-auto space-y-6 text-gray-800 dark:text-gray-100"
  >
    <!-- תאריכים -->
    {#if sqadualed || sqadualedf}
      <div
        class="flex items-center gap-3 bg-gray-100 dark:bg-slate-800 p-3 rounded-xl"
      >
        <img
          class="w-8 h-8 opacity-80"
          src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
          alt="calendar"
        />
        <div class="text-sm md:text-base font-medium flex gap-2">
          {#if sqadualed}<span>{new Date(sqadualed).toLocaleDateString()}</span
            >{/if}
          {#if sqadualedf}<span
              >- {new Date(sqadualedf).toLocaleDateString()}</span
            >{/if}
        </div>
      </div>
    {/if}

    <!-- חישוב שכר -->
    <div
      class="flex flex-wrap items-center gap-2 text-lg md:text-xl font-semibold bg-gray-100 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-600"
    >
      <img
        class="w-10 h-10 drop-shadow-sm"
        src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
        alt="money"
      />
      <span
        role="contentinfo"
        class="cursor-help"
        onmouseenter={() => hover({ he: 'שווי לשעה', en: 'vallue per hour' })}
        onmouseleave={() => hover('0')}
      >
        {perhour.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        {perho[$lang]}
      </span>
      <span class="text-gray-400 mx-1">*</span>
      <span
        role="contentinfo"
        class="cursor-help"
        onmouseenter={() => hover({ he: 'כמות השעות', en: 'amount of hours' })}
        onmouseleave={() => hover('0')}
      >
        {noOfHours.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        {hourss[$lang]}
      </span>
      <span class="text-gray-400 mx-1">=</span>
      <span
        role="contentinfo"
        class="text-green-600 dark:text-green-400 cursor-help"
        onmouseenter={() => hover({ he: 'סך הכל', en: 'total' })}
        onmouseleave={() => hover('0')}
      >
        {(noOfHours * perhour).toLocaleString('en-US', {
          maximumFractionDigits: 2
        })}
        {isMonthly ? ' ' + monhly[$lang] : ''}
      </span>
    </div>

    <!-- תגית צפי רווח -->
    <div
      class="inline-block px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/20 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400 rounded-full text-sm md:text-base font-bold shadow-sm"
    >
      {#if timeToP == 'alreadi'}{ttal[$lang]}
      {:else if timeToP == 'week'}{ttwe[$lang]}
      {:else if timeToP == 'month'}{ttmo[$lang]}
      {:else if timeToP == 'threeM'}{tt3mo[$lang]}
      {:else if timeToP == 'sixM'}{tt6mo[$lang]}
      {:else if timeToP == 'oneY'}{tt1y[$lang]}
      {:else if timeToP == 'twoY'}{tt2y[$lang]}
      {:else if timeToP == 'more'}{ttmor[$lang]}
      {:else if timeToP == 'never'}{ttne[$lang]}
      {/if}
    </div>

    <!-- פרטי משימה והערות (RichText) -->
    <div class="space-y-4 text-gray-700 dark:text-gray-300">
      {#if missionDetails !== null && missionDetails !== 'null'}
        <div class="prose dark:prose-invert max-w-none">
          <RichText outpot={missionDetails} editable={false} />
        </div>
      {/if}
      {#if hearotMeyuchadot && hearotMeyuchadot !== 'undefined' && hearotMeyuchadot !== 'null'}
        <div
          class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-400 prose dark:prose-invert max-w-none"
        >
          <RichText outpot={hearotMeyuchadot} editable={false} />
        </div>
      {/if}
    </div>

    <!-- רשימת מטלות -->
    {#if acts?.length > 0}
      <div
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-4 shadow-sm"
      >
        <h4 class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">
          {t.acts[$lang]}
        </h4>
        <ul class="space-y-2">
          {#each acts as datai}
            <li
              class="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-700 last:border-0"
            >
              <span class="text-lg">✅</span>
              <span
                class="text-base md:text-lg font-medium text-gray-800 dark:text-gray-200"
              >
                {datai.attributes.shem}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- תגיות: כישורים, תפקיד, דרכי עבודה -->
    <div class="space-y-4">
      {#if skills?.length > 0}
        <div>
          <h4 class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
            {t.skneed[$lang]}
          </h4>
          <div class="flex flex-wrap gap-2">
            {#each skills as skill}
              <Tile
                sm={true}
                big={true}
                bg="green"
                word={skill.attributes.skillName}
              />
            {/each}
          </div>
        </div>
      {/if}

      {#if role?.length > 0}
        <div>
          <h4 class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
            {t.rneed[$lang]}
          </h4>
          <div class="flex flex-wrap gap-2">
            {#each role as rol}
              <Tile
                sm={true}
                big={true}
                bg="pink"
                word={rol.attributes.roleDescription}
              />
            {/each}
          </div>
        </div>
      {/if}

      {#if workways?.length > 0}
        <div>
          <h4 class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
            {t.wwneed[$lang]}
          </h4>
          <div class="flex flex-wrap gap-2">
            {#each workways as wo}
              <Tile
                sm={true}
                big={true}
                bg="yellow"
                word={wo.attributes.workWayName}
              />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
  <!---
<div class="grow sm:pt-1 sm:p-14">
  <h3 class="text-center underline decoration-barbi">הערכת רווח חודשי:</h3>
  <svg width="100%" height="100%" viewBox="0 0 600.00001 600.00001" id="svg2" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs id="defs4"></defs>
  <g id="layer1" transform="translate(0,-452.36216)">
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4365" d="m 207.19797,508.70985 c -0.38253,9.73948 -0.0761,19.48663 0.0124,29.22711 0.043,4.73228 0.0186,9.46493 0.0278,14.1974 -0.26066,57.68856 -0.88526,115.37432 -1.74321,173.05691 -0.435,14.19182 -0.70789,28.38953 -1.305,42.57545 -1.36508,32.43096 -2.79483,53.91477 -5.83404,86.13381 -3.03991,32.2265 -7.25772,64.32232 -11.51934,96.40352 -0.94792,6.85734 -1.89583,13.71468 -2.84374,20.57202 -0.98831,6.45554 -2.81421,6.176 -1.82591,-0.27954 l 0,0 c 1.14652,-6.82329 2.29304,-13.64659 3.43956,-20.46988 3.03488,-19.5006 6.20076,-38.9502 8.60371,-58.5463 6.77003,-55.20965 10.12342,-110.79161 11.2054,-166.39002 0.11638,-13.21684 0.29028,-26.43331 0.34916,-39.65053 0.19804,-44.45883 -0.41605,-88.91846 -1.04647,-133.3715 -0.36252,-14.49096 -0.93813,-28.97218 -1.44009,-43.45845 0,-13.85843 3.91975,-13.85843 3.91975,0 z"></path>
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4367" d="m 369.14328,508.13854 c 1.49857,13.11239 0.69557,26.3101 0.15416,39.4517 -1.13642,22.44626 -3.239,44.82601 -5.03737,67.22374 -2.65146,33.02251 -2.59291,36.4542 -5.91745,70.55424 -1.28431,13.17321 -2.76445,26.3266 -4.14668,39.48991 -1.62318,13.16627 -3.20614,26.33757 -4.86955,39.49882 -3.77015,29.83019 -5.69143,42.65961 -9.16727,72.15433 -3.42922,29.09923 -6.23534,58.24208 -8.77198,87.42962 -1.14086,16.84151 -2.6656,33.68218 -3.22445,50.56022 -0.10599,3.20115 -0.0667,6.40546 -0.10002,9.60819 -0.27465,10.53584 -3.25463,10.45816 -2.97998,-0.0777 l 0,0 c 0.13453,-3.23691 0.19146,-6.47798 0.40359,-9.71074 1.10667,-16.86595 3.20367,-33.66274 4.57097,-50.50553 2.97065,-29.14881 6.08368,-58.27764 9.73044,-87.35152 4.6683,-37.21811 10.09791,-74.34017 14.32932,-111.61392 1.35896,-13.16473 2.87372,-26.31431 4.07689,-39.4942 2.51766,-27.57928 3.31247,-43.41496 4.9877,-70.6199 1.379,-22.39433 2.81,-44.78858 3.51825,-67.21737 0.17981,-12.81265 0.72331,-25.72504 -1.36755,-38.42715 -3.36845,-13.47383 0.44252,-14.42658 3.81098,-0.95275 z"></path>
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4371" d="m 77.099822,639.18983 c 2.445978,0.35048 4.882264,0.777 7.337936,1.05146 14.089834,1.57477 27.329852,2.49678 41.645522,3.19557 11.94425,0.58304 23.89463,1.07556 35.84987,1.35377 31.74377,0.73871 62.88626,0.48577 94.66145,0.44653 54.6798,-0.39174 109.36414,-0.95778 164.02451,-2.5548 33.34666,-0.9743 55.60145,-2.0434 88.278,-3.46204 0.28033,-0.0122 0.28377,0.0671 0.003,0.0793 l 0,0 c -32.67737,1.41868 -54.93202,2.48777 -88.27958,3.46209 -54.66096,1.59704 -109.34588,2.16308 -164.02627,2.55483 -55.57163,0.0686 -42.08342,0.1818 -94.66864,-0.22422 -28.48464,-0.21993 -57.01353,-0.25837 -85.449517,-2.16281 -13.221729,-2.20363 -12.598451,-5.9433 0.623279,-3.73967 z"></path>
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4373" d="m 87.105643,797.60819 c 9.562746,0.37699 11.865295,0.49856 23.418947,0.72668 7.41238,0.14636 14.82648,0.19166 22.23916,0.32212 37.87921,0.66665 75.75468,1.36225 113.63626,1.9069 71.58979,1.78475 143.06439,6.41391 214.61012,9.28097 47.36049,1.89788 48.99458,1.68052 94.17594,2.44397 11.79504,-0.0543 23.59008,-0.10866 35.38512,-0.16299 1.24745,-9.3e-4 1.24772,0.3519 2.6e-4,0.35283 l 0,0 c -11.79557,-0.0368 -23.59115,-0.0737 -35.38672,-0.11048 -45.18261,-0.76349 -46.81662,-0.54612 -94.17824,-2.44405 -71.54491,-2.86702 -143.01867,-7.49612 -214.60762,-9.2809 -14.99054,-0.21552 -29.97982,-0.55417 -44.97162,-0.64658 -12.77975,-0.0788 -25.55993,0.0667 -38.33975,0.13307 -25.32836,0.13146 -50.67068,0.23292 -75.981857,1.27212 -13.412621,0 -13.412621,-3.79366 0,-3.79366 z"></path>
  </g>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="345" y="129">מינימום</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="197" y="129">מקסימום</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="300" y="273">10</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="177" y="273">100</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="300" y="440">20</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="177" y="440">200</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="534.717" y="273"> שנה ראשונה</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="497.547" y="440">שנה שניה</text>
</svg>
</div>-->

  <!-- 4. Footer פעולות מודרני -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/80 flex gap-3 border-t border-gray-100 dark:border-gray-800"
  >
    {#if low == false}
      {#if already === false && allr === false && alreadyi == false}
        <!-- כפתור דחייה -->
        <button
          class="flex-1 py-3 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl flex justify-center items-center transition-all hover:scale-105"
          onmouseenter={() => hover({ he: 'לא מתאים לי', en: 'not for me' })}
          onmouseleave={() => hover('0')}
          onclick={decline}
        >
          <div class="w-8 h-8"><No /></div>
        </button>

        <!-- כפתור הסכמה -->
        <button
          class="flex-2 py-3 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg flex justify-center items-center transform hover:-translate-y-1 transition-all"
          style="flex: 2;"
          onmouseenter={() => hover({ he: 'אני רוצה', en: 'yes I want' })}
          onmouseleave={() => hover('0')}
          onclick={agree}
        >
          <div class="w-8 h-8 text-white"><Lev /></div>
        </button>
      {:else if alreadyi == true}
        <!-- מצב צ'אט -->
        <button
          class="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-md flex justify-center items-center gap-2 hover:opacity-90 transition-all"
          onmouseenter={() => hover({ he: "צ'אט", en: 'chat' })}
          onmouseleave={() => hover('0')}
          onclick={() => tochat()}
        >
          <span>{$lang === 'he' ? "פתח צ'אט" : 'Open Chat'}</span>
          <div class="w-6 h-6"><Chaticon /></div>
        </button>
      {/if}
    {:else if low == true}
      <Lowbtn isCart="true" />
    {/if}
  </div>
</div>

<style>
  /* מחלקת עזר לכפתור הראשי שיתפוס כפליים מקום ב-Flex */
  .flex-2 {
    flex: 2;
  }

  /* הגדרות הארת ה-Glow לפי מסמך האפיון */
  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }

  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
