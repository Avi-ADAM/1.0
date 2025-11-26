<script>
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import { lang } from '$lib/stores/lang.js';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';
  import AuthorityBadge from '../../ui/AuthorityBadge.svelte';
  import ComparisonDisplay from '../../ui/ComparisonDisplay.svelte';
  import NegotiationHistory from '../../ui/NegotiationHistory.svelte';
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
    projectId,
    hearotMeyuchadot,
    skills,
    role,
    workways,
    userSkills,
    userRole,
    userWorkway,
    acts = [],
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
    onNego,
    onChat,
    isRishon = false,
    negotiationMode = false,
    negopendmissions = [],
    orderon = 0
  } = $props();
  function hover(x) {
    onHover?.(x);
  }
  function agree(alr) {
    already = true;
    onAgree?.(alr);
  }
  function nego(alr) {
    already = true;
    onNego?.(alr);
  }
  function tochat() {
    onChat?.();
  }

  const hed = isRishon
    ? {
        he: 'אישור והשמת משימה',
        en: 'appruval and mission assigned'
      }
    : {
        he: 'אישור צירוף לריקמה והשמת משימה',
        en: 'appruval of joining and mission assigned'
      };

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
  import { getProjectData } from '$lib/stores/projectStore';
  function getSkillNames(arr) {
    return arr.map((s) => s.attributes.skillName);
  } //    isMobileOrTablet() ? (isScrolable = !isScrolable) : (isScrolable = true)}
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
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
    class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-colorfulGrad"
  >
    <div class="relative flex items-center space-x-1">
      <AuthorityBadge
        logoSrc={src2}
        {projectName}
        size={isMobileOrTablet() ? 80 : 120}
      />
      <div class="flex flex-col leading-tight ml-4">
        <div class="sm:text-lg text-md mt-1 flex items-center">
          <span class="text-barbi text-center mr-3 sm:text-3xl text-xl"
            >{hed[$lang]}</span
          >
        </div>
        <div class="text-gray-900 font-bold text-lg sm:text-2xl">
          {openmissionName}
          {#if negotiationMode}
            <span
              class="text-sm bg-gold text-white px-2 py-1 rounded-full ml-2"
            >
              {$lang === 'he' ? 'מצב משא ומתן' : 'Negotiation Mode'}
            </span>
          {/if}
          {#if negopendmissions && negopendmissions.length > 0}
            <span
              class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full ml-2"
            >
              {$lang === 'he'
                ? `${negopendmissions.length} משא ומתן`
                : `${negopendmissions.length} negotiations`}
            </span>
          {/if}
        </div>
      </div>
    </div>
  </div>
  <div
    class="{isScrolable.value
      ? 'bg-white'
      : 'bg-gray-200'}  transition-all-300 rounded-b lg:rounded-b-none lg:rounded-r p-4 mb-12 flex flex-col justify-between leading-normal"
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
            class="lg:block lg:w-12 lg:mx-2 w-10 block mx-1"
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

      {#if missionDetails !== ''}
        <RichText outpot={missionDetails} editable={false} trans={true} />{/if}
    </div>
    <div class="flex items-center">
      <img
        class="w-10 h-10 sm:w-16 sm:h-16 rounded-full mr-4"
        src={src.length > 0
          ? src
          : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
        alt=""
      />
      <div class="text-lg sm:text-2xl">
        <p class="text-gray-900 leading-none">{useraplyname}</p>
        <p class="vo ef">
          <span
            role="button"
            tabindex="0"
            onmouseenter={() => hover(tr.vots.totalin[$lang])}
            onmouseleave={() => hover('0')}
            style="color:#7EE081;"
          >
            {noofusersOk}-{tr.vots.inFavor[$lang]}
          </span>
          <span
            role="button"
            tabindex="0"
            onmouseenter={() => hover(tr.vots.notyet[$lang])}
            onmouseleave={() => hover('0')}
            style="color:#0000cc;"
          >
            {noofusersWaiting}-{tr.vots.notyet[$lang]}
          </span>
          <span
            role="button"
            tabindex="0"
            onmouseenter={() =>
              hover(orderon > 0 ? t.onPrevious[$lang] : tr.vots.totalno[$lang])}
            onmouseleave={() => hover('0')}
            style="color:#80037e;"
          >
            {noofusersNo}-{orderon > 0
              ? t.onPrevious[$lang]
              : tr.vots.against[$lang]}
          </span>
        </p>
      </div>
    </div>

    <!-- Skill Comparison Section -->
    {#if skills?.data && userSkills?.data}
      {#key skills.data.length + userSkills.data.length}
        {@const required = getSkillNames(skills.data)}
        {@const user = getSkillNames(userSkills.data)}
        {@const matched = required.filter((s) => user.includes(s))}
        {@const missing = required.filter((s) => !user.includes(s))}
        {@const extra = user.filter((s) => !required.includes(s))}
        <div class="mt-6">
          <div class="mb-2 font-bold text-barbi text-xl">
            {t.skneed[$lang]}
          </div>
          <div class="mb-2 text-md font-semibold text-gray-700">
            {tr.common.comparisonHeadline?.[$lang] ||
              ($lang === 'he' ? 'השוואת כישורים' : 'Skills Comparison')}
          </div>
          <div class="border-2 border-barbi rounded-lg p-4 bg-gray-50">
            <div class="mb-2 font-bold text-green-700">
              {tr.common.matchedSkillsHeadline?.[$lang] ||
                ($lang === 'he' ? 'כישורים תואמים' : 'Matched skills')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matched as skill}
                <Tile sm={true} big={true} bg="green" word={skill} />
              {/each}
            </div>
            {#if missing.length > 0}
              <div class="mt-4 mb-2 font-bold text-red-700">
                {tr.common.missingSkillsHeadline?.[$lang] ||
                  ($lang === 'he' ? 'כישורים חסרים' : 'Missing skills')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each missing as skill}
                  <Tile sm={true} big={true} bg="red" word={skill} />
                {/each}
              </div>
            {/if}
            {#if extra.length > 0}
              <div class="mt-4 mb-2 font-bold text-blue-700">
                {tr.common.extraSkillsHeadline?.[$lang] ||
                  ($lang === 'he' ? 'כישורים נוספים' : 'Extra skills')}
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
        {@const requiredRoles = role.data.map(
          (r) => r.attributes.roleDescription
        )}
        {@const userRoles = userRole.data.map(
          (r) => r.attributes.roleDescription
        )}
        {@const matchedRoles = requiredRoles.filter((r) =>
          userRoles.includes(r)
        )}
        {@const missingRoles = requiredRoles.filter(
          (r) => !userRoles.includes(r)
        )}
        {@const extraRoles = userRoles.filter(
          (r) => !requiredRoles.includes(r)
        )}
        <div class="mt-6">
          <div class="mb-2 font-bold text-barbi text-xl">
            {t.rneed[$lang]}
          </div>
          <div class="mb-2 text-md font-semibold text-gray-700">
            {tr.common.roleComparisonHeadline?.[$lang] ||
              ($lang === 'he' ? 'השוואת תפקידים' : 'Role Comparison')}
          </div>
          <div class="border-2 border-barbi rounded-lg p-4 bg-gray-50">
            <div class="mb-2 font-bold text-green-700">
              {tr.common.matchedRolesHeadline?.[$lang] ||
                ($lang === 'he' ? 'תפקידים תואמים' : 'Matched roles')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matchedRoles as roleDesc}
                <Tile sm={true} big={true} bg="green" word={roleDesc} />
              {/each}
            </div>
            {#if missingRoles.length > 0}
              <div class="mt-4 mb-2 font-bold text-red-700">
                {tr.common.missingRolesHeadline?.[$lang] ||
                  ($lang === 'he' ? 'תפקידים חסרים' : 'Missing roles')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each missingRoles as roleDesc}
                  <Tile sm={true} big={true} bg="red" word={roleDesc} />
                {/each}
              </div>
            {/if}
            {#if extraRoles.length > 0}
              <div class="mt-4 mb-2 font-bold text-blue-700">
                {tr.common.extraRolesHeadline?.[$lang] ||
                  ($lang === 'he' ? 'תפקידים נוספים' : 'Extra roles')}
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
        {@const requiredWays = workways.data.map(
          (w) => w.attributes.workWayName
        )}
        {@const userWays = userWorkway.data.map(
          (w) => w.attributes.workWayName
        )}
        {@const matchedWays = requiredWays.filter((w) => userWays.includes(w))}
        {@const missingWays = requiredWays.filter((w) => !userWays.includes(w))}
        {@const extraWays = userWays.filter((w) => !requiredWays.includes(w))}
        <div class="mt-6">
          <div class="mb-2 font-bold text-barbi text-xl">
            {t.wwneed[$lang]}
          </div>
          <div class="mb-2 text-md font-semibold text-gray-700">
            {tr.common.workwayComparisonHeadline?.[$lang] ||
              ($lang === 'he' ? 'השוואת דרכי עבודה' : 'Workway Comparison')}
          </div>
          <div class="border-2 border-barbi rounded-lg p-4 bg-gray-50">
            <div class="mb-2 font-bold text-green-700">
              {tr.common.matchedWaysHeadline?.[$lang] ||
                ($lang === 'he' ? 'דרכי עבודה תואמות' : 'Matched workways')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matchedWays as wayName}
                <Tile sm={true} big={true} bg="green" word={wayName} />
              {/each}
            </div>
            {#if missingWays.length > 0}
              <div class="mt-4 mb-2 font-bold text-red-700">
                {tr.common.missingWaysHeadline?.[$lang] ||
                  ($lang === 'he' ? 'דרכי עבודה חסרות' : 'Missing workways')}
              </div>
              <div class="flex flex-wrap gap-2">
                {#each missingWays as wayName}
                  <Tile sm={true} big={true} bg="red" word={wayName} />
                {/each}
              </div>
            {/if}
            {#if extraWays.length > 0}
              <div class="mt-4 mb-2 font-bold text-blue-700">
                {tr.common.extraWaysHeadline?.[$lang] ||
                  ($lang === 'he' ? 'דרכי עבודה נוספות' : 'Extra workways')}
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

    <!-- Negotiation History Section -->
    <NegotiationHistory
      {negopendmissions}
      {openmissionName}
      {noofhours}
      {perhour}
      {missionDetails}
      {hearotMeyuchadot}
      {acts}
      {projectId}
    />

    <!-- Acts Display Section -->
    {#if acts?.data && acts.data.length > 0}
      <div class="mt-6">
        <div class="mb-2 font-bold text-barbi text-xl">
          {$lang === 'he' ? 'רשימת מטלות' : 'Tasks List'}
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each acts.data as act}
            {@const attrs = act.attributes}
            <div
              class="border-2 border-barbi rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-shadow"
            >
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-bold text-lg text-gray-800 leading-tight">
                  {attrs.shem ||
                    ($lang === 'he' ? 'פעילות ללא שם' : 'Unnamed Activity')}
                </h3>
              </div>

              {#if attrs.des}
                <p class="text-gray-600 text-sm mb-3 line-clamp-3">
                  {attrs.des}
                </p>
              {/if}

              <div class="space-y-2">
                {#if attrs.dateF}
                  <div class="flex items-center text-sm text-gray-500">
                    <svg
                      class="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>
                      {$lang === 'he' ? 'מתאריך:' : 'From:'}
                      {new Date(attrs.dateF).toLocaleDateString($lang)}
                    </span>
                  </div>
                {/if}

                {#if attrs.dateS}
                  <div class="flex items-center text-sm text-gray-500">
                    <svg
                      class="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>
                      {$lang === 'he' ? 'עד תאריך:' : 'Until:'}
                      {new Date(attrs.dateS).toLocaleDateString($lang)}
                    </span>
                  </div>
                {/if}

                {#if attrs.link}
                  <div class="mt-3">
                    <a
                      href={attrs.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center text-sm text-barbi hover:text-mpink font-medium transition-colors"
                    >
                      <svg
                        class="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
                        />
                        <path
                          d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"
                        />
                      </svg>
                      {$lang === 'he' ? 'קישור למטלה' : 'Task Link'}
                    </a>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  {#if low == false}
    {#if already === false}
      <button
        aria-label={tr?.common.approve[$lang]}
        onmouseenter={() => hover(tr?.common.approve[$lang])}
        onmouseleave={() => hover('0')}
        onclick={agree}
        class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
        name="requestToJoin"
      >
        <Lev />
      </button>
      <button
        aria-label={isRishon
          ? negotiationMode
            ? 'Exit Negotiation'
            : tr?.common.nego[$lang]
          : tr?.common.nego[$lang]}
        onmouseenter={() =>
          hover(
            isRishon
              ? negotiationMode
                ? 'Exit Negotiation'
                : tr?.common.nego[$lang]
              : tr?.common.nego[$lang]
          )}
        onmouseleave={() => hover('0')}
        onclick={() => nego('f')}
        class="btnb z-10 bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110 {negotiationMode
          ? 'ring-2 ring-gold'
          : ''}"
        name="negotiate"
      >
        {#if negotiationMode}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
            />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            version="1.1"
            viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
            /></svg
          >
        {/if}
      </button>
    {/if}
    <button
      aria-label={tr?.common.watchthe[$lang]}
      onmouseenter={() => hover(tr?.common.watchthe[$lang])}
      onmouseleave={() => hover('0')}
      class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110"
      onclick={() => tochat()}
      ><Chaticon />
    </button>
  {:else if low == true}
    <Lowbtn isCart="true" />
  {/if}
</div>
