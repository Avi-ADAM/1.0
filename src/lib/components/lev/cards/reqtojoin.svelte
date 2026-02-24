<script>
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import { lang } from '$lib/stores/lang.js';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';
  import CardHeader from './CardHeader.svelte';

  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import ComparisonDisplay from '../../ui/ComparisonDisplay.svelte';
  import NegotiationHistory from '../../ui/NegotiationHistory.svelte';
  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {string} [glowColor]
   * @property {any} iskvua
   * @property {any} projectName
   * @property {any} [projectId]
   * @property {any} [hearotMeyuchadot]
   * @property {any} [skills]
   * @property {any} [role]
   * @property {any} [workways]
   * @property {any} [userSkills]
   * @property {any} [userRole]
   * @property {any} [userWorkway]
   * @property {any} [acts]
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
   * @property {any} [sqedualed]
   * @property {any} [dates]
   * @property {number} [noofhours]
   * @property {(x: any) => void} [onHover]
   * @property {(alr: any) => void} [onAgree]
   * @property {(alr: any) => void} [onDecline]
   * @property {(alr: any) => void} [onNego]
   * @property {(() => void)} [onChat]
   * @property {(() => void)} [onProj]
   * @property {boolean} [isRishon]
   * @property {boolean} [negotiationMode]
   * @property {any[]} [negopendmissions]
   * @property {number} [orderon]
   * @property {any[]} [users]
   * @property {number} [activeOrder]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    glowColor = 'barbi',
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
    onProj,
    isRishon = false,
    negotiationMode = false,
    negopendmissions = [],
    orderon = 0,
    users = [],
    activeOrder = 0
  } = $props();
  let user_1s = $derived.by(() => {
    return getProjectData(projectId, 'us') || [];
  });
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
  function handleProjectClick() {
    if (onProj) {
      onProj();
    }
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
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowColor === 'gold'
    ? '238, 232, 170'
    : glowColor === 'barbi'
      ? '255, 0, 146'
      : glowColor === 'blue'
        ? '116, 191, 255'
        : glowColor === 'green'
          ? '2, 255, 187'
          : '2, 255, 187'}
>
  <CardHeader
    logoSrc={src2}
    {projectName}
    cardType={hed[$lang]}
    cardTitle={openmissionName}
    {glowColor}
    onProjectClick={handleProjectClick}
  >
    {#snippet actions()}
      {#if negotiationMode}
        <span class="text-sm bg-gold text-white px-2 py-1 rounded-full">
          {$lang === 'he' ? 'מצב משא ומתן' : 'Negotiation Mode'}
        </span>
      {/if}
      {#if negopendmissions && negopendmissions.length > 0}
        <span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
          {$lang === 'he'
            ? `${negopendmissions.length} משא ומתן`
            : `${negopendmissions.length} negotiations`}
        </span>
      {/if}
    {/snippet}
  </CardHeader>
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <div class="space-y-3">
      <!-- User Info -->
      <div
        class="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"
      >
        <img
          class="w-12 h-12 rounded-full object-cover border-2 border-barbi/20"
          src={src.length > 0
            ? src
            : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
          alt={useraplyname}
        />
        <div>
          <div class="text-[20px] text-gray-500 uppercase">
            {$lang === 'he' ? 'מבקש/ת:' : 'Requester:'}
          </div>
          <div class="font-bold text-gray-800 dark:text-gray-200">
            {useraplyname}
          </div>
        </div>
      </div>
    </div>
    <!-- Financial Info -->
    <div
      class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 p-3 rounded-xl border border-purple-200 dark:border-purple-700"
    >
      <div class="flex items-center gap-3 text-sm sm:text-base">
        <img
          style="width:2.5rem;"
          class="flex-shrink-0"
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />
        <div class="flex flex-col sm:flex-row sm:items-center gap-1">
          <span
            class="font-bold text-gray-800 dark:text-gray-200"
            role="contentinfo"
            onmouseenter={() => hover(tr?.common.valph[$lang])}
            onmouseleave={() => hover('0')}
          >
            {perhour}
            {tr?.common.perhour[$lang]}
          </span>
          <span class="text-gray-600 dark:text-gray-400">*</span>
          <span
            class="font-bold text-gray-800 dark:text-gray-200"
            role="contentinfo"
            onmouseenter={() => hover(tr?.common.noofhours[$lang])}
            onmouseleave={() => hover('0')}
          >
            {noofhours.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            {tr?.common.hours[$lang]}
            {iskvua == true ? t.formonth[$lang] : ''}
          </span>
          <span class="text-gray-600 dark:text-gray-400">=</span>
          <span
            class="font-bold text-barbi"
            role="contentinfo"
            onmouseenter={() => hover(tr.mission.total[$lang])}
            onmouseleave={() => hover('0')}
            >{(noofhours * perhour).toLocaleString('en-US', {
              maximumFractionDigits: 2
            })}
            {iskvua == true ? t.perMonth[$lang] : ''}
          </span>
        </div>
      </div>
    </div>

    <!-- Dates -->
    {#if sqedualed || dates}
      <div
        class="flex gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center gap-2">
          <img
            class="w-5 h-5"
            src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
            alt="calendar"
          />
          <div class="flex items-center gap-1">
            {#if sqedualed}
              <span>{new Date(sqedualed).toLocaleDateString($lang)}</span>
            {/if}
            {#if sqedualed && dates}
              <span>-</span>
            {/if}
            {#if dates}
              <span>{new Date(dates).toLocaleDateString($lang)}</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Mission Details -->
    {#if missionDetails !== ''}
      <div
        class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 p-3 rounded-lg"
      >
        <RichText outpot={missionDetails} editable={false} trans={true} />
      </div>
    {/if}

    <!-- Skill Comparison Section -->
    {#if skills?.data && userSkills?.data}
      {#key skills.data.length + userSkills.data.length}
        {@const required = getSkillNames(skills.data)}
        {@const user = getSkillNames(userSkills.data)}
        {@const matched = required.filter((s) => user.includes(s))}
        {@const missing = required.filter((s) => !user.includes(s))}
        {@const extra = user.filter((s) => !required.includes(s))}
        <div>
          <div class="mb-2 font-bold text-barbi text-lg">
            {t.skneed[$lang]}
          </div>
          <div
            class="border-2 border-barbi rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50"
          >
            <div
              class="mb-2 font-bold text-green-600 dark:text-green-400 text-sm"
            >
              {tr.common.matchedSkillsHeadline?.[$lang] ||
                ($lang === 'he' ? 'כישורים תואמים' : 'Matched skills')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matched as skill}
                <Tile sm={true} big={true} bg="green" word={skill} />
              {/each}
            </div>
            {#if missing.length > 0}
              <div
                class="mt-3 mb-2 font-bold text-red-600 dark:text-red-400 text-sm"
              >
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
              <div
                class="mt-3 mb-2 font-bold text-blue-600 dark:text-blue-400 text-sm"
              >
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
        <div>
          <div class="mb-2 font-bold text-barbi text-lg">
            {t.rneed[$lang]}
          </div>
          <div
            class="border-2 border-barbi rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50"
          >
            <div
              class="mb-2 font-bold text-green-600 dark:text-green-400 text-sm"
            >
              {tr.common.matchedRolesHeadline?.[$lang] ||
                ($lang === 'he' ? 'תפקידים תואמים' : 'Matched roles')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matchedRoles as roleDesc}
                <Tile sm={true} big={true} bg="green" word={roleDesc} />
              {/each}
            </div>
            {#if missingRoles.length > 0}
              <div
                class="mt-3 mb-2 font-bold text-red-600 dark:text-red-400 text-sm"
              >
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
              <div
                class="mt-3 mb-2 font-bold text-blue-600 dark:text-blue-400 text-sm"
              >
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
        <div>
          <div class="mb-2 font-bold text-barbi text-lg">
            {t.wwneed[$lang]}
          </div>
          <div
            class="border-2 border-barbi rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50"
          >
            <div
              class="mb-2 font-bold text-green-600 dark:text-green-400 text-sm"
            >
              {tr.common.matchedWaysHeadline?.[$lang] ||
                ($lang === 'he' ? 'דרכי עבודה תואמות' : 'Matched workways')}
            </div>
            <div class="flex flex-wrap gap-2">
              {#each matchedWays as wayName}
                <Tile sm={true} big={true} bg="green" word={wayName} />
              {/each}
            </div>
            {#if missingWays.length > 0}
              <div
                class="mt-3 mb-2 font-bold text-red-600 dark:text-red-400 text-sm"
              >
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
              <div
                class="mt-3 mb-2 font-bold text-blue-600 dark:text-blue-400 text-sm"
              >
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
      <div>
        <div class="mb-2 font-bold text-barbi text-lg">
          {$lang === 'he' ? 'רשימת מטלות' : 'Tasks List'}
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          {#each acts.data as act}
            {@const attrs = act.attributes}
            <div
              class="border-2 border-barbi/30 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50 hover:shadow-lg transition-shadow"
            >
              <div class="flex items-start justify-between mb-2">
                <h3
                  class="font-bold text-base text-gray-800 dark:text-gray-200 leading-tight"
                >
                  {attrs.shem ||
                    ($lang === 'he' ? 'פעילות ללא שם' : 'Unnamed Activity')}
                </h3>
              </div>

              {#if attrs.des}
                <p
                  class="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2"
                >
                  {attrs.des}
                </p>
              {/if}

              <div class="space-y-1">
                {#if attrs.dateF}
                  <div
                    class="flex items-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    <svg
                      class="w-3 h-3 mr-1"
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
                  <div
                    class="flex items-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    <svg
                      class="w-3 h-3 mr-1"
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
                  <div class="mt-2">
                    <a
                      href={attrs.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center text-xs text-barbi hover:text-mpink font-medium transition-colors"
                    >
                      <svg
                        class="w-3 h-3 mr-1"
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
  <!-- Vote Status Display -->
  {#if user_1s && user_1s.length > 0}
    <div class="px-4 pb-4">
      <VoteStatusDisplay votes={users || []} members={user_1s} {activeOrder} />
    </div>
  {/if}
  <!-- Actions Footer -->
  <div
    class="p-4 h-20 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if low == false}
      {#if already === false}
        <button
          aria-label={tr?.common.approve[$lang]}
          onmouseenter={() => hover(tr?.common.approve[$lang])}
          onmouseleave={() => hover('0')}
          onclick={agree}
          class="flex-[2] py-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          name="requestToJoin"
        >
          <Lev />
          <span class="text-xs sm:text-sm whitespace-nowrap"
            >{tr?.common.approve[$lang]}</span
          >
        </button>
        <button
          aria-label={isRishon
            ? negotiationMode
              ? tr?.common.exitNego[$lang]
              : tr?.common.nego[$lang]
            : tr?.common.nego[$lang]}
          onmouseenter={() =>
            hover(
              isRishon
                ? negotiationMode
                  ? tr?.common.exitNego[$lang]
                  : tr?.common.nego[$lang]
                : tr?.common.nego[$lang]
            )}
          onmouseleave={() => hover('0')}
          onclick={() => nego('f')}
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-gold text-gold hover:bg-gold/10 font-bold rounded-xl transition-all flex items-center justify-center gap-2 {negotiationMode
            ? 'ring-2 ring-gold'
            : ''}"
          name="negotiate"
        >
          {#if negotiationMode}
            <svg
              class="w-5 h-5"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
              />
            </svg>
            <span class="text-xs sm:text-sm whitespace-nowrap"
              >{tr?.common.exitNego[$lang]}</span
            >
          {:else}
            <svg
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              version="1.1"
              height="24"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
              /></svg
            >
            <span class="text-xs sm:text-sm whitespace-nowrap"
              >{tr?.common.nego[$lang]}</span
            >
          {/if}
        </button>
      {/if}
      <button
        aria-label={tr?.common.watchthe[$lang]}
        onmouseenter={() => hover(tr?.common.watchthe[$lang])}
        onmouseleave={() => hover('0')}
        class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        onclick={() => tochat()}
      >
        <Chaticon />
        <span class="text-xs sm:text-sm whitespace-nowrap"
          >{tr?.common.watchthe[$lang]}</span
        >
      </button>
    {:else if low == true}
      <Lowbtn isCart={true} />
    {/if}
  </div>
</div>

<style>
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
