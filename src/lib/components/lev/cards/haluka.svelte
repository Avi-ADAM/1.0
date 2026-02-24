<script>
  import Chaticon from '../../../celim/chaticon.svelte';
  import tr from '$lib/translations/tr.json';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';
  import { getProjectData } from '$lib/stores/projectStore.js';

  // רכיבים מודרניים חדשים
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} projectName
   * @property {any} src
   * @property {any} why
   * @property {any} src2
   * @property {any} missionBName
   * @property {any} missionDetails
   * @property {any} noofusersNo
   * @property {any} noofusersOk
   * @property {any} noofusersWaiting
   * @property {any} hearotMeyuchadot
   * @property {any} mypos
   * @property {any} valph
   * @property {any} nhours
   * @property {any} useraplyname
   * @property {any} already
   * @property {boolean} [allr]
   * @property {(payload: { x: any }) => void} [onHover]
   * @property {(payload: { alr: any, y: string }) => void} [onAgree]
   * @property {(payload: { alr: any, y: string }) => void} [onDecline]
   * @property {(payload: { alr: any, y: string }) => void} [onNego]
   * @property {() => void} [onTochat]
   * @property {any} [halukot]
   * @property {any} [hervach]
   * @property {any} [projectId]
   *
   * // Props חדשים למודרניזציה
   * @property {string} [glowColor]
   * @property {Array} [user_1s]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {() => void} [onProj]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    projectName,
    src,
    why,
    src2,
    missionBName,
    missionDetails,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    hearotMeyuchadot,
    mypos,
    valph,
    nhours,
    useraplyname,
    already = $bindable(),
    allr = false,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    halukot = [],
    hervach = [],
    projectId,

    // מודרניזציה Props
    glowColor = 'gold', // צבע זהב כברירת מחדל לחלוקה
    users = [],
    activeOrder = 0,
    onProj
  } = $props();
  let user_1s = $derived.by(() => {
    return getProjectData(projectId, 'us') || [];
  });
  let ulist = $state([]);

  function processSplitDetails() {
    if (!hervach) {
      console.log('Missing hervach data:', { hervach });
      return;
    }

    if (hervach.length === 0) {
      console.log('Empty hervach array');
      return;
    }

    console.log('Processing split details from hervach:', {
      hervachLength: hervach.length,
      hervach
    });

    let tempUlist = [];
    let givers = [];
    let receivers = [];

    let totalAmount = 0;
    for (let i = 0; i < hervach.length; i++) {
      totalAmount += hervach[i]?.amount || 0;
    }

    for (let i = 0; i < hervach.length; i++) {
      let item = hervach[i];
      let user =
        item?.users_permissions_user?.data || item?.users_permissions_user;
      let amount = item?.amount || 0;
      let isMekabel = item?.mekabel || false;
      let isNoten = item?.noten || false;

      console.log(`Hervach ${i}:`, { item, user, amount, isMekabel, isNoten });

      if (user) {
        let userId = user.id || user;
        let username =
          user.attributes?.username ||
          user.username ||
          getProjectData(projectId, 'un', userId) ||
          'Unknown';

        let userObj = {
          uid: userId,
          username: username,
          x: amount,
          p: 0,
          ihave: isNoten ? totalAmount : 0,
          meca: isMekabel ? amount : 0,
          noten: 0,
          le: [],
          isMekabel: isMekabel,
          isNoten: isNoten
        };

        tempUlist.push(userObj);

        if (isNoten) {
          givers.push(userObj);
        }
        if (isMekabel) {
          receivers.push(userObj);
        }
      }
    }

    console.log('After hervach processing:', { tempUlist, givers, receivers });

    for (let giver of givers) {
      let totalGiving = 0;

      for (let receiver of receivers) {
        if (receiver.meca <= 0) continue;

        let transferAmount = receiver.x;

        if (transferAmount > 0.01) {
          giver.le.push({
            le: receiver.username,
            leid: receiver.uid,
            cama: transferAmount
          });

          totalGiving += transferAmount;

          console.log(
            `Transfer calculated: ${giver.username} -> ${receiver.username}: ${transferAmount}`
          );
        }
      }
      giver.noten = totalGiving;
    }

    for (let user of tempUlist) {
      if (user.isMekabel) {
        user.meca = user.x;
      }
    }

    console.log('Final ulist with transfers:', tempUlist);
    ulist = tempUlist;
  }

  $effect(() => {
    processSplitDetails();
  });

  function hover(x) {
    onHover?.({ x: x });
  }
  function agree(alr) {
    already = true;
    onAgree?.({ alr: alr, y: 'a' });
  }
  function decline(alr) {
    already = true;
    onDecline?.({ alr: alr, y: 'd' });
  }
  function nego(alr) {
    onNego?.({ alr: alr, y: 'n' });
  }
  function tochat() {
    onTochat?.();
  }

  function handleProjectClick() {
    if (onProj) onProj();
  }
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
    : ' w-[90%] h-[90%]'} lg:w-[90%] {isVisible
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
          : '238, 232, 170'}
>
  <!-- Header המעודכן -->
  <CardHeader
    logoSrc={src}
    {projectName}
    cardType={tr.headers.haluka[$lang]}
    cardTitle={missionBName}
    memberCount={users?.length || noofusersOk + noofusersNo + noofusersWaiting}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- אזור תוכן -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700/50'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <!-- תצוגת סטטוס הצבעה מודרנית או חלופית -->

    {#if ulist.length > 0}
      <div class="w-full overflow-x-auto pb-4">
        <!-- Mobile View -->
        <div class="block md:hidden space-y-3">
          {#each ulist as user}
            <div
              class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div
                class="font-bold text-barbi dark:text-pink-400 text-base mb-2"
              >
                {user.username}
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div
                  class="bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg p-2"
                >
                  <div class="text-gray-500 dark:text-gray-400">מגיע:</div>
                  <div class="font-semibold text-barbi dark:text-pink-400">
                    {user.x.toFixed(2)}
                  </div>
                </div>
                <div
                  class="bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg p-2"
                >
                  <div class="text-gray-500 dark:text-gray-400">בפועל:</div>
                  <div class="font-semibold text-green-600 dark:text-green-400">
                    {user.ihave.toFixed(2)}
                  </div>
                </div>
                {#if user.noten > 0}
                  <div
                    class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg p-2"
                  >
                    <div class="text-gray-500 dark:text-gray-400">נותן:</div>
                    <div class="font-semibold text-red-600 dark:text-red-400">
                      {user.noten.toFixed(2)}
                    </div>
                  </div>
                {/if}
                {#if user.meca > 0}
                  <div
                    class="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-lg p-2"
                  >
                    <div class="text-gray-500 dark:text-gray-400">מקבל:</div>
                    <div
                      class="font-semibold text-green-600 dark:text-green-400"
                    >
                      {user.meca.toFixed(2)}
                    </div>
                  </div>
                {/if}
              </div>
              {#if user.le && user.le.length > 0}
                <div
                  class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    העברות:
                  </div>
                  <div class="space-y-1.5">
                    {#each user.le as transfer}
                      <div
                        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-md px-2 py-1.5 text-xs flex justify-between items-center"
                      >
                        <span class="text-blue-800 dark:text-blue-300"
                          >→ {transfer.le}</span
                        >
                        <span class="font-bold text-blue-600 dark:text-blue-400"
                          >{transfer.cama.toFixed(2)}</span
                        >
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Desktop View -->
        <div
          class="hidden md:block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          <table class="w-full text-center border-collapse text-sm">
            <thead>
              <tr class="bg-gradient-to-br from-barbi to-mpink text-gold">
                <th class="p-3 font-semibold">שם</th>
                <th class="p-3 font-semibold">מגיע</th>
                <th class="p-3 font-semibold">בפועל</th>
                <th class="p-3 font-semibold">נותן</th>
                <th class="p-3 font-semibold">מקבל</th>
                <th class="p-3 font-semibold">העברות</th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
            >
              {#each ulist as user, i}
                <tr
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors {i %
                    2 ===
                  0
                    ? 'bg-transparent'
                    : 'bg-gray-50/50 dark:bg-gray-800/50'}"
                >
                  <td
                    class="p-3 font-bold text-barbi dark:text-pink-400 border-r border-gray-200 dark:border-gray-700"
                    >{user.username}</td
                  >
                  <td class="p-3 font-mono text-gray-800 dark:text-gray-200"
                    >{user.x.toFixed(2)}</td
                  >
                  <td
                    class="p-3 font-mono font-bold text-green-600 dark:text-green-400"
                    >{user.ihave.toFixed(2)}</td
                  >
                  <td
                    class="p-3 font-mono {user.noten > 0
                      ? 'text-red-600 dark:text-red-400 font-bold'
                      : 'text-gray-400 dark:text-gray-500'}"
                  >
                    {user.noten > 0 ? user.noten.toFixed(2) : '-'}
                  </td>
                  <td
                    class="p-3 font-mono {user.meca > 0
                      ? 'text-green-600 dark:text-green-400 font-bold'
                      : 'text-gray-400 dark:text-gray-500'}"
                  >
                    {user.meca > 0 ? user.meca.toFixed(2) : '-'}
                  </td>
                  <td
                    class="p-3 text-xs border-l border-gray-200 dark:border-gray-700"
                  >
                    {#if user.le && user.le.length > 0}
                      <div class="flex flex-wrap gap-1 justify-center">
                        {#each user.le as transfer}
                          <div
                            class="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 rounded px-2 py-1 flex items-center gap-1"
                          >
                            <span>→ {transfer.le}:</span>
                            <span class="font-bold"
                              >{transfer.cama.toFixed(2)}</span
                            >
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-gray-400 dark:text-gray-500">-</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
  {#if user_1s && user_1s.length > 0}
    <div class="px-2">
      <VoteStatusDisplay votes={users || []} members={user_1s} {activeOrder} />
    </div>
  {:else}
    <div class="flex items-center text-sm font-medium dark:text-gray-300">
      <p>
        <span
          onmouseenter={() => hover('סך ההצבעות בעד')}
          onmouseleave={() => hover('0')}
          class="text-green-500 ml-2">{noofusersOk}-בעד</span
        >
        <span
          onmouseenter={() => hover('לא הצביעו')}
          onmouseleave={() => hover('0')}
          class="text-blue-600 dark:text-blue-400 ml-2"
          >{noofusersWaiting}-טרם</span
        >
        <span
          onmouseenter={() => hover('כמות ההצבעות נגד')}
          onmouseleave={() => hover('0')}
          class="text-purple-700 dark:text-purple-400">{noofusersNo}-נגד</span
        >
      </p>
    </div>
  {/if}

  <!-- Actions Footer המעודכן -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700 mt-auto"
  >
    {#if low == false}
      {#if already === false && allr === false}
        <button
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold rounded-xl transition-all flex justify-center items-center"
          onclick={() => decline('f')}
          onmouseenter={() => hover('התנגדות')}
          onmouseleave={() => hover('0')}
        >
          <No />
        </button>

        <button
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 font-bold rounded-xl transition-all flex justify-center items-center"
          onclick={() => nego('f')}
          onmouseenter={() => hover('משא ומתן')}
          onmouseleave={() => hover('0')}
        >
          <svg
            class="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
            />
          </svg>
        </button>

        <button
          class="flex-2 py-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex justify-center items-center"
          onclick={() => agree('f')}
          onmouseenter={() => hover('אישור')}
          onmouseleave={() => hover('0')}
        >
          <Lev />
        </button>
      {/if}
    {:else if low == true}
      <Lowbtn isCart="true" />
    {/if}
  </div>
</div>

<style>
  .flex-2 {
    flex: 2;
  }

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
