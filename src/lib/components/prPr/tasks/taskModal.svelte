<script>
  import { lang } from '$lib/stores/lang';

  /**
   * @typedef {Object} Props
   * @property {any} act - The act object (after reformatArray from onMount)
   * @property {boolean} open
   * @property {() => void} onClose
   */

  /** @type {Props} */
  let { act = null, open = false, onClose } = $props();
  console.log(act, 'act');
  // ─── helpers ───────────────────────────────────────────────────────────────

  function fmtDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString($lang === 'he' ? 'he-IL' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function closeOnBg(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  // ─── derived state ─────────────────────────────────────────────────────────

  const assignee = $derived(act?.my?.data?.[0]?.attributes ?? null);
  const assigneeId = $derived(act?.my?.data?.[0]?.id ?? null);
  const creatorId = $derived(act?.vali?.data?.id ?? null);
  // creator attributes only present if the GraphQL query fetches them
  const creator = $derived(act?.vali?.data?.attributes ?? null);
  const hasRole = $derived((act?.mesimabetahaliches?.data?.length ?? 0) > 0);
  const roles = $derived(
    act?.tafkidims?.data?.map((r) => r.attributes?.roleDescription) ?? []
  );

  /**
   * stage:
   *  0 = open (no assignee, no role)
   *  1 = role_only (role defined, no person yet)
   *  2 = pending_my   (assigned but myIshur = false)
   *  3 = in_progress  (myIshur = true, naasa = false)
   *  4 = pending_vali (naasa = true, valiIshur = false)
   *  5 = completed    (naasa = true, valiIshur = true)
   */
  const stage = $derived(() => {
    if (!act) return -1;
    const hasAssignee = !!assigneeId;
    if (!hasAssignee && !hasRole) return 0;
    if (hasRole && !hasAssignee) return 1;
    if (hasAssignee && !act.myIshur) return 2;
    if (act.myIshur && !act.naasa) return 3;
    if (act.naasa && !act.valiIshur) return 4;
    if (act.naasa && act.valiIshur) return 5;
    return 0;
  });

  const STAGES = [
    { he: 'נוצרה', en: 'Created' },
    { he: 'הוקצתה', en: 'Assigned' },
    { he: 'אושרה ע"י מבצע', en: 'Accepted' },
    { he: 'בביצוע', en: 'In Progress' },
    { he: 'סומנה כבוצע', en: 'Done' },
    { he: 'אושרה סופית', en: 'Validated' }
  ];

  // badge per stage
  const BADGE = [
    { he: 'פתוחה', en: 'Open', cls: 'bg-sky-100 text-sky-700 border-sky-300' },
    {
      he: 'ממתינה להשמה',
      en: 'Awaiting Assignment',
      cls: 'bg-violet-100 text-violet-700 border-violet-300'
    },
    {
      he: 'ממתינה לאישור מבצע',
      en: 'Pending Acceptance',
      cls: 'bg-amber-100 text-amber-700 border-amber-300'
    },
    {
      he: 'בביצוע',
      en: 'In Progress',
      cls: 'bg-blue-100 text-blue-700 border-blue-300'
    },
    {
      he: 'ממתינה לאישור יוצר',
      en: 'Pending Validation',
      cls: 'bg-orange-100 text-orange-700 border-orange-300'
    },
    {
      he: 'הושלמה',
      en: 'Completed',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-300'
    }
  ];

  const URGENCY = {
    white: {
      he: 'רגיל',
      en: 'Normal',
      cls: 'bg-slate-50 text-slate-600 border-slate-200'
    },
    green: {
      he: 'נמוך',
      en: 'Low',
      cls: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    yellow: {
      he: 'בינוני',
      en: 'Medium',
      cls: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    red: {
      he: 'דחוף',
      en: 'Urgent',
      cls: 'bg-rose-50 text-rose-600 border-rose-200'
    }
  };

  const ICONS = ['📋', '🎯', '🤝', '⚙️', '🏁', '✅'];

  const isHe = $derived($lang === 'he');
  const dir = $derived(isHe ? 'rtl' : 'ltr');

  const progress = $derived(act?.status ?? 0);

  function avatarUrl(attributes) {
    return (
      attributes?.profilePic?.data?.attributes?.url ??
      'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'
    );
  }
</script>

{#if open && act}
  {@const uCfg = URGENCY[act.hashivut] || URGENCY.white}
  <!-- backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onclick={closeOnBg}
  >
    <!-- modal card -->
    <div
      class="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl
             bg-white dark:bg-zinc-900
             border border-zinc-200 dark:border-zinc-700"
      {dir}
    >
      <!-- ── header strip ─────────────────────────────────────── -->
      <div
        class="sticky top-0 z-10 flex items-center justify-between gap-3
                  bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
                  border-b border-zinc-200 dark:border-zinc-700
                  px-6 py-4"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-2xl">{ICONS[stage()]}</span>
          <h2
            class="font-bold text-lg text-zinc-900 dark:text-zinc-50 truncate leading-tight"
          >
            {act.shem ?? '—'}
          </h2>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- status badge -->
          {#if stage() >= 0}
            <span
              class="text-xs font-semibold px-2.5 py-1 rounded-full border
                         {BADGE[stage()].cls}"
            >
              {BADGE[stage()][isHe ? 'he' : 'en']}
            </span>
          {/if}
          <!-- urgency badge -->

          <span
            class="text-[10px] font-bold px-2 py-1 rounded-full border shadow-sm
                   {uCfg.cls}"
          >
            {uCfg[isHe ? 'he' : 'en']}
          </span>
          <!-- close -->
          <button
            onclick={onClose}
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100
                   dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="סגור"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- ── body ─────────────────────────────────────────────── -->
      <div class="px-6 py-5 space-y-6">
        <!-- lifecycle timeline -->
        <div class="overflow-x-auto">
          <ol class="flex items-start justify-center gap-0 min-w-max" {dir}>
            {#each STAGES as s, i}
              {@const done = i < stage()}
              {@const current = i === stage()}
              <li class="flex flex-col items-center" style="width:80px">
                <!-- connector line before -->
                <div class="flex items-center w-full">
                  <div
                    class="flex-1 h-0.5 {i === 0
                      ? 'invisible'
                      : (isHe ? i < stage() : i <= stage())
                        ? 'bg-amber-400'
                        : 'bg-zinc-200 dark:bg-zinc-700'}"
                  ></div>
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10
                              border-2 transition-all
                              {done
                      ? 'bg-amber-400 border-amber-400 text-white shadow-md shadow-amber-200'
                      : current
                        ? 'bg-white dark:bg-zinc-900 border-amber-500 text-amber-600 dark:text-amber-400 shadow-lg ring-2 ring-amber-200 dark:ring-amber-800'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-400'}"
                  >
                    {#if done}
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="3"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    {:else}
                      {i + 1}
                    {/if}
                  </div>
                  <div
                    class="flex-1 h-0.5 {i === STAGES.length - 1
                      ? 'invisible'
                      : (isHe ? i <= stage() - 1 : i < stage())
                        ? 'bg-amber-400'
                        : 'bg-zinc-200 dark:bg-zinc-700'}"
                  ></div>
                </div>
                <span
                  class="mt-1.5 text-center leading-tight text-[10px]
                             {done
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : current
                      ? 'text-zinc-800 dark:text-zinc-100 font-bold'
                      : 'text-zinc-400 dark:text-zinc-500'}"
                >
                  {s[isHe ? 'he' : 'en']}
                </span>
              </li>
            {/each}
          </ol>
        </div>

        <!-- progress bar (status) -->
        {#if stage() >= 3}
          <div class="space-y-1.5">
            <div
              class="flex justify-between text-xs text-zinc-500 dark:text-zinc-400"
            >
              <span>{isHe ? 'התקדמות' : 'Progress'}</span>
              <span
                class="font-mono font-semibold text-zinc-700 dark:text-zinc-300"
                >{progress}%</span
              >
            </div>
            <div
              class="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                style="width: {progress}%"
              ></div>
            </div>
          </div>
        {/if}

        <!-- two-column info grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- creator card -->
          <div
            class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2"
          >
            <p
              class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              {isHe ? 'יצר את המטלה' : 'Created by'}
            </p>
            {#if creator}
              <div class="flex items-center gap-3">
                <img
                  src={avatarUrl(creator)}
                  alt={creator.username}
                  class="w-9 h-9 rounded-full object-cover border-2 border-amber-300"
                />
                <span
                  class="font-semibold text-zinc-800 dark:text-zinc-100 text-sm"
                >
                  {creator.username}
                </span>
              </div>
            {:else if creatorId}
              <p class="text-sm text-zinc-500">#{creatorId}</p>
            {:else}
              <p class="text-sm text-zinc-400 italic">
                {isHe ? 'לא ידוע' : 'Unknown'}
              </p>
            {/if}
          </div>

          <!-- assignee card -->
          <div
            class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2"
          >
            <p
              class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              {isHe ? 'מבצע המטלה' : 'Assigned to'}
            </p>

            {#if assignee}
              <div class="flex items-center gap-3">
                <img
                  src={avatarUrl(assignee)}
                  alt={assignee.username}
                  class="w-9 h-9 rounded-full object-cover border-2 border-blue-300"
                />
                <div>
                  <p
                    class="font-semibold text-zinc-800 dark:text-zinc-100 text-sm"
                  >
                    {assignee.username}
                  </p>
                  <!-- acceptance chip -->
                  {#if act.myIshur}
                    <span
                      class="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      {isHe ? 'קיבל/ה את המטלה' : 'Accepted'}
                    </span>
                  {:else}
                    <span
                      class="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {isHe ? 'ממתין לאישור מבצע' : 'Awaiting acceptance'}
                    </span>
                  {/if}
                </div>
              </div>
            {:else if hasRole && roles.length > 0}
              <div class="space-y-1.5">
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  {isHe ? 'פתוחה לתפקידים:' : 'Open for roles:'}
                </p>
                <div class="flex flex-wrap gap-1.5">
                  {#each roles as role}
                    <span
                      class="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-xs font-medium border border-violet-200"
                    >
                      {role}
                    </span>
                  {/each}
                </div>
              </div>
            {:else}
              <div
                class="flex items-center gap-2 text-sky-600 dark:text-sky-400"
              >
                <svg
                  class="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <span class="text-sm font-medium">
                  {isHe ? 'פתוחה להתנדבות' : 'Open – unassigned'}
                </span>
              </div>
            {/if}
          </div>
        </div>

        <!-- dates row -->
        {#if act.dateS || act.dateF}
          <div class="flex flex-wrap gap-4">
            {#if act.dateS}
              <div
                class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
              >
                <svg
                  class="w-4 h-4 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span class="text-zinc-400">{isHe ? 'התחלה:' : 'Start:'}</span>
                <span class="font-medium">{fmtDate(act.dateS)}</span>
              </div>
            {/if}
            {#if act.dateF}
              <div
                class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
              >
                <svg
                  class="w-4 h-4 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-zinc-400">{isHe ? 'יעד:' : 'Due:'}</span>
                <span class="font-medium">{fmtDate(act.dateF)}</span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- description -->
        {#if act.des}
          <div class="space-y-2">
            <p
              class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              {isHe ? 'תיאור' : 'Description'}
            </p>
            <div
              class="prose prose-sm dark:prose-invert max-w-none
                     rounded-xl bg-zinc-50 dark:bg-zinc-800/60
                     border border-zinc-200 dark:border-zinc-700 p-4
                     text-zinc-700 dark:text-zinc-300 leading-relaxed"
            >
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html act.des}
            </div>
          </div>
        {/if}

        <!-- approval summary row -->
        <div
          class="rounded-xl border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-200 dark:divide-zinc-700 overflow-hidden"
        >
          <!-- row: assignee approved -->
          <div class="flex items-center justify-between px-4 py-3">
            <span class="text-sm text-zinc-600 dark:text-zinc-300">
              {isHe ? 'מבצע קיבל את המטלה' : 'Assignee accepted the task'}
            </span>
            {#if act.myIshur}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
                {isHe ? 'כן' : 'Yes'}
              </span>
            {:else}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isHe ? 'ממתין' : 'Pending'}
              </span>
            {/if}
          </div>

          <!-- row: marked as done -->
          <div class="flex items-center justify-between px-4 py-3">
            <span class="text-sm text-zinc-600 dark:text-zinc-300">
              {isHe ? 'מבצע סימן כבוצע' : 'Assignee marked as done'}
            </span>
            {#if act.naasa}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
                {isHe ? 'כן' : 'Yes'}
              </span>
            {:else}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full"
              >
                —
              </span>
            {/if}
          </div>

          <!-- row: creator validated -->
          <div class="flex items-center justify-between px-4 py-3">
            <span class="text-sm text-zinc-600 dark:text-zinc-300">
              {isHe ? 'יוצר אישר שבוצע' : 'Creator validated completion'}
            </span>
            {#if act.valiIshur}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
                {isHe ? 'כן' : 'Yes'}
              </span>
            {:else if act.naasa}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isHe ? 'ממתין' : 'Pending'}
              </span>
            {:else}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full"
              >
                —
              </span>
            {/if}
          </div>
        </div>
      </div>
      <!-- end body -->
    </div>
  </div>
{/if}
