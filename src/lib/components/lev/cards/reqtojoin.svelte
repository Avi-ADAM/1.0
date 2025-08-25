<script>
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import { lang } from '$lib/stores/lang.js';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { formatTime } from '../utils';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} iskvua
   * @property {any} projectName
   * @property {any} src
   * @property {any} openmissionName
   * @property {any} missionDetails
   * @property {any} useraplyname
   * @property {any} noofusersNo
   * @property {any} noofusersOk
   * @property {any} noofusersWaiting
   * @property {boolean} [already]
   * @property {any} src2
   * @property {number} [perhour]
   * @property {number} [noofhours]
   * @property {(x: any) => void} [onHover] - Callback for hover event
   * @property {(alr: any) => void} [onAgree] - Callback for agree event
   * @property {(alr: any) => void} [onDecline] - Callback for decline event
   * @property {() => void} [onChat] - Callback for chat event
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    iskvua,
    projectName,
    skills,
    role,
    workways,
    userSkills,
    userRole,
    userWorkway,
    src,
    openmissionName,
    missionDetails,
    useraplyname,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    already = $bindable(false),
    src2,
    perhour = 0,
    sqedualed,
    dates,
    noofhours = 0,
    onHover,
    onAgree,
    onDecline,
    onChat,
    isRishon = false
  } = $props();
  function hover(x) {
    onHover?.(x);
  }
  function agree(alr) {
    already = true;
    onAgree?.(alr);
  }
  function decline(alr) {
    already = true;
    onDecline?.(alr);
  }
  function tochat() {
    onChat?.();
  }

  const leho = { he: ' בכל חודש ', en: ' per month' };

  const hed = isRishon
    ? {
        he: 'אישור והשמת משימה',
        en: 'appruval and mission assigned'
      }
    : {
        he: 'אישור צירוף לריקמה והשמת משימה',
        en: 'appruval of joining and mission assigned'
      };
  let isScrolable = $state(true);
  function preventSwiperScroll(event) {
    if (!isScrolable && isMobileOrTablet()) {
      event.stopPropagation();
    }
  }

  // מניעת פרופוגציה של גלילה במגע
  function preventTouchScroll(event) {
    if (!isScrolable && isMobileOrTablet()) {
      event.stopPropagation();
    }
  }
    const t = {
    wwneed: { he: 'דרכי עבודה מבוקשות:', en: 'ways of work for the mission:' },
    skneed: { he: 'הכישורים הנדרשים:', en: 'needed skills:' },
    rneed: { he: 'תפקיד מבוקש:', en: 'requested role:' },
    perMonth: { he: 'לחודש', en: 'per month' },
    formonth: { he: 'בכל חודש', en: 'every month' },
    onPrevious: { he: 'על גרסה קודמת', en: 'on previous version' }
  };
    import tr from '$lib/translations/tr.json';
  import Tile from '$lib/celim/tile.svelte';
function getSkillNames(arr) {
            return arr.map(s => s.attributes.skillName);
          }
</script>

<div
  onwheel={preventSwiperScroll}
  ontouchmove={preventTouchScroll}
  onclick={() =>
    isMobileOrTablet() ? (isScrolable = !isScrolable) : (isScrolable = true)}
  role="button"
  tabindex="0"
  onkeypress={preventSwiperScroll}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  class="{isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} leading-normal {isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} bg-white lg:w-[90%] d overflow-y-auto"
>
  <div
    class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre"
  >
    <div class="relative flex items-center space-x-1">
      <div class="relative">
        <img src={src2} alt="" class="w-10 sm:w-16 h-10 sm:h-16 rounded-full" />
      </div>
      <div class="flex flex-col leading-tight">
        <div class="sm:text-sm text-md mt-1 flex items-center">
          <span class="text-barbi text-center mr-3 sm:text-3xl text-sm"
            >{hed[$lang]}</span
          >
        </div>
        <span
          style="text-shadow: 1px 1px white;"
          class="pn ml-1 text-lg sm:text-2xl text-barbi">{projectName}</span
        >
      </div>
    </div>
  </div>
  <div
    class="{isScrolable
      ? 'bg-white'
      : 'bg-gray-200'} transition-all-300 rounded-b lg:rounded-b-none lg:rounded-r p-4 mb-12 flex flex-col justify-between leading-normal"
  >
 <div class="mb-4">
      <p
        style="line-height: 1;"
        class="text-sm sm:text-xl text-gray-600 flex items-center"
      >
        <img
          style="width:2.5rem;"
          class=""
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />
        <span
          role="contentinfo"
          onmouseenter={() => hover(tr?.common.valph[$lang])}
          onmouseleave={() => hover('0')}
        >
          {perhour}
          {tr?.common.perhour[$lang]}
        </span>
        *
        <span
          role="contentinfo"
          onmouseenter={() => hover(tr?.common.noofhours[$lang])}
          onmouseleave={() => hover('0')}
        >
          {noofhours.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          {tr?.common.hours[$lang]}
          {iskvua == true ? t.formonth[$lang] : ''}
        </span>
        =
        <span
          role="contentinfo"
          onmouseenter={() => hover(tr.mission.total[$lang])}
          onmouseleave={() => hover('0')}
          >{(noofhours * perhour).toLocaleString('en-US', {
            maximumFractionDigits: 2
          })}
          {iskvua == true ? t.perMonth[$lang] : ''}
        </span>
      </p>
      {#if sqedualed || dates}
        <p
          style="line-height: 1;"
          class="text-md flex items-center lg:text-2xl lg:m-5"
        >
          <img
            class="lg:block lg:w-12 lg:mx-2"
            src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
            alt="calendar"
          />
          {#if sqedualed}
            <span> {new Date(sqedualed).toLocaleDateString($lang)}</span>
          {/if}
          {#if dates}
            <span> - {new Date(dates).toLocaleDateString($lang)}</span>
          {/if}
        </p>
      {/if}
      <div class="text-gray-900 font-bold md:text-3xl mb-2">
        {openmissionName}
      </div>
      {#if missionDetails !== ''}
        <RichText outpot={missionDetails} editable={false} trans={true} />{/if}
    </div>
    <div class="flex items-center">
      <img
        style="width: 2.5rem;"
        class="w-10 h-10 rounded-full mr-4"
        src={src.length > 0
          ? src
          : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
        alt=""
      />
      <div class="text-sm">
        <p class="text-gray-900 leading-none">{useraplyname}</p>
        <p class="vo ef">
          <span
            onmouseenter={() => hover('סך ההצבעות בעד')}
            onmouseleave={() => hover('0')}
            style="color:#7EE081;">{noofusersOk}-בעד</span
          >
          <span
            onmouseenter={() => hover('לא הצביעו')}
            onmouseleave={() => hover('0')}
            style="color:#0000cc;"
            >{noofusersWaiting}-טרם
          </span><span
            onmouseenter={() => hover('כמות ההצבעות נגד')}
            onmouseleave={() => hover('0')}
            style="color:#80037e;">{noofusersNo}-נגד</span
          >
        </p>
      </div>
    </div>

    <!-- Skill Comparison Section -->
    {#if skills?.data && userSkills?.data}
      {#key skills.data.length + userSkills.data.length}
        {@const required = getSkillNames(skills.data)}
        {@const user = getSkillNames(userSkills.data)}
        {@const matched = required.filter(s => user.includes(s))}
        {@const missing = required.filter(s => !user.includes(s))}
        {@const extra = user.filter(s => !required.includes(s))}
        <div class="mt-6">
          <div class="mb-2 font-bold text-barbi text-xl">
            {t.skneed[$lang]}
          </div>
          <div class="mb-2 text-md font-semibold text-gray-700">
            {tr.common.comparisonHeadline?.[$lang] || ($lang === 'he' ? 'השוואת כישורים' : 'Skills Comparison')}
          </div>
          <div class="border-2 border-barbi rounded-lg p-4 bg-gray-50">
            <div class="mb-2 font-bold text-green-700">
              {tr.common.matchedSkillsHeadline?.[$lang] || ($lang === 'he' ? 'כישורים תואמים' : 'Matched skills')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matched as skill}
                <Tile sm={true} big={true} bg="green" word={skill} />
              {/each}
            </div>
            {#if missing.length > 0}
              <div class="mt-4 mb-2 font-bold text-red-700">
                {tr.common.missingSkillsHeadline?.[$lang] || ($lang === 'he' ? 'כישורים חסרים' : 'Missing skills')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each missing as skill}
                  <Tile sm={true} big={true} bg="red" word={skill} />
                {/each}
              </div>
            {/if}
            {#if extra.length > 0}
              <div class="mt-4 mb-2 font-bold text-blue-700">
                {tr.common.extraSkillsHeadline?.[$lang] || ($lang === 'he' ? 'כישורים נוספים' : 'Extra skills')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each extra as skill}
                  <Tile sm={true} big={true} bg="blue" word={skill} />
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/key}
    {/if}

    <!-- Role Comparison Section -->
    {#if role?.data && userRole?.data}
      {#key role.data.length + userRole.data.length}
        {@const requiredRoles = role.data.map(r => r.attributes.roleDescription)}
        {@const userRoles = userRole.data.map(r => r.attributes.roleDescription)}
        {@const matchedRoles = requiredRoles.filter(r => userRoles.includes(r))}
        {@const missingRoles = requiredRoles.filter(r => !userRoles.includes(r))}
        {@const extraRoles = userRoles.filter(r => !requiredRoles.includes(r))}
        <div class="mt-6">
          <div class="mb-2 font-bold text-barbi text-xl">
            {t.rneed[$lang]}
          </div>
          <div class="mb-2 text-md font-semibold text-gray-700">
            {tr.common.roleComparisonHeadline?.[$lang] || ($lang === 'he' ? 'השוואת תפקידים' : 'Role Comparison')}
          </div>
          <div class="border-2 border-barbi rounded-lg p-4 bg-gray-50">
            <div class="mb-2 font-bold text-green-700">
              {tr.common.matchedRolesHeadline?.[$lang] || ($lang === 'he' ? 'תפקידים תואמים' : 'Matched roles')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matchedRoles as roleDesc}
                <Tile sm={true} big={true} bg="green" word={roleDesc} />
              {/each}
            </div>
            {#if missingRoles.length > 0}
              <div class="mt-4 mb-2 font-bold text-red-700">
                {tr.common.missingRolesHeadline?.[$lang] || ($lang === 'he' ? 'תפקידים חסרים' : 'Missing roles')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each missingRoles as roleDesc}
                  <Tile sm={true} big={true} bg="red" word={roleDesc} />
                {/each}
              </div>
            {/if}
            {#if extraRoles.length > 0}
              <div class="mt-4 mb-2 font-bold text-blue-700">
                {tr.common.extraRolesHeadline?.[$lang] || ($lang === 'he' ? 'תפקידים נוספים' : 'Extra roles')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each extraRoles as roleDesc}
                  <Tile sm={true} big={true} bg="blue" word={roleDesc} />
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/key}
    {/if}

    <!-- Workway Comparison Section -->
    {#if workways?.data && userWorkway?.data}
      {#key workways.data.length + userWorkway.data.length}
        {@const requiredWays = workways.data.map(w => w.attributes.workWayName)}
        {@const userWays = userWorkway.data.map(w => w.attributes.workWayName)}
        {@const matchedWays = requiredWays.filter(w => userWays.includes(w))}
        {@const missingWays = requiredWays.filter(w => !userWays.includes(w))}
        {@const extraWays = userWays.filter(w => !requiredWays.includes(w))}
        <div class="mt-6">
          <div class="mb-2 font-bold text-barbi text-xl">
            {t.wwneed[$lang]}
          </div>
          <div class="mb-2 text-md font-semibold text-gray-700">
            {tr.common.workwayComparisonHeadline?.[$lang] || ($lang === 'he' ? 'השוואת דרכי עבודה' : 'Workway Comparison')}
          </div>
          <div class="border-2 border-barbi rounded-lg p-4 bg-gray-50">
            <div class="mb-2 font-bold text-green-700">
              {tr.common.matchedWaysHeadline?.[$lang] || ($lang === 'he' ? 'דרכי עבודה תואמות' : 'Matched workways')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matchedWays as wayName}
                <Tile sm={true} big={true} bg="green" word={wayName} />
              {/each}
            </div>
            {#if missingWays.length > 0}
              <div class="mt-4 mb-2 font-bold text-red-700">
                {tr.common.missingWaysHeadline?.[$lang] || ($lang === 'he' ? 'דרכי עבודה חסרות' : 'Missing workways')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each missingWays as wayName}
                  <Tile sm={true} big={true} bg="red" word={wayName} />
                {/each}
              </div>
            {/if}
            {#if extraWays.length > 0}
              <div class="mt-4 mb-2 font-bold text-blue-700">
                {tr.common.extraWaysHeadline?.[$lang] || ($lang === 'he' ? 'דרכי עבודה נוספות' : 'Extra workways')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each extraWays as wayName}
                  <Tile sm={true} big={true} bg="blue" word={wayName} />
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/key}
    {/if}
  </div>
  {#if low == false}
    {#if already === false}
      <button
        onmouseenter={() => hover('אישור')}
        onmouseleave={() => hover('0')}
        onclick={agree}
        class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
        name="requestToJoin"
      >
        <Lev />
      </button>
      <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>-->
      <button
        onmouseenter={() => hover('התנגדות')}
        onmouseleave={() => hover('0')}
        onclick={decline}
        class="btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110"
        name="decline"
      >
        <No />
      </button>
    {/if}
    <button
      onmouseenter={() => hover('לצפיה בדיון')}
      onmouseleave={() => hover('0')}
      class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110"
      onclick={() => tochat()}
      ><Chaticon />
    </button>
  {:else if low == true}
    <Lowbtn isCart="true" />
  {/if}
</div>

<style>
</style>
