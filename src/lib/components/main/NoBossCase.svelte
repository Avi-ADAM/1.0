<!--
  The case for working with partners instead of for a boss.

  These three blocks - the four pains, the employee/solo/rikma comparison and
  the ten-year income curves - used to sit in the middle of the homepage,
  where they were the fifth through seventh thing a visitor read. They are the
  whole argument of /no-boss, so they live here and the homepage links in.

  The copy is unchanged and still comes from the `home` namespace: it was
  already written in five languages, and re-keying it would have meant
  retranslating an argument that customers already respond to. Only the
  framing around it is new, and that is on the page.
-->
<script>
  import { t, isRtl } from '$lib/translations';
  // The recorded videos are Hebrew-only, so the buttons that open them are
  // offered only in Hebrew - same source of truth fpage reads.
  import { lang } from '$lib/stores/lang';
  import IncomeCurves from '$lib/components/main/IncomeCurves.svelte';
  import VideoModal from '$lib/components/main/VideoModal.svelte';

  const VIDEO_HOW_IT_WORKS = 'l0d1yv6Qtz4'; // How 1lev1 works (the solution)
  const VIDEO_THIRD_WAY = 'FcyaiAIqeA4'; // The problem and the third way

  let videoOpen = $state(false);
  let videoId = $state('');
  let videoTitle = $state('');
  function openVideo(id, title) {
    videoId = id;
    videoTitle = title;
    videoOpen = true;
  }
</script>

  <!-- ===== הבעיה / הכאב — לקהל שעוד אין לו שותפות ===== -->
  <section
    class="w-full max-w-xl mt-12 animate-fade-in-up"
    style="font-family:'Sababa',sans-serif;"
  >
    <p
      class="text-center text-barbi font-bold text-base sm:text-sm tracking-widest mb-1"
    >
      {$t('home.sections.problemEyebrow')}
    </p>
    <h2
      class="text-rose-700 dark:text-gold font-bold text-3xl sm:text-2xl mb-1 text-center"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('home.sections.problemTitle')}
    </h2>
    <p class="text-center text-rose-500 text-base sm:text-sm mb-4">
      {$t('home.sections.painLead')}
    </p>
    <div class="flex flex-col gap-2.5">
      {#each ['pain1', 'pain2', 'pain3', 'pain4'] as p}
        <div
          class="flex items-start gap-3 bg-cyan-50/55 dark:bg-surface2 backdrop-blur-sm border border-rose-300/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <span
            class="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-sm font-bold"
            >✕</span
          >
          <p
            class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start"
          >
            {$t(`home.sections.${p}`)}
          </p>
        </div>
      {/each}
    </div>
    <p
      class="text-center text-rose-700 dark:text-gold font-semibold italic text-lg sm:text-base mt-4"
    >
      {$t('home.sections.painCost')}
    </p>
    <!-- המפסיד הגדול מכולם: הלקוח -->
    <div
      class="mt-6 bg-cyan-50/55 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-2xl px-4 py-4 shadow-sm"
    >
      <h3
        class="text-rose-700 dark:text-gold font-bold text-xl sm:text-lg mb-3 text-center"
      >
        {$t('home.sections.painCustomerTitle')}
      </h3>
      <div class="flex flex-col gap-2.5">
        {#each [['painCustomer1', false], ['painCustomer2', false], ['painCustomer3', true]] as [p, good]}
          <div class="flex items-start gap-3">
            <span
              class="shrink-0 mt-0.5 w-6 h-6 rounded-full {good
                ? 'bg-amber-100'
                : 'bg-rose-100 text-rose-500'} flex items-center justify-center text-sm font-bold"
              >{good ? '✓' : '✕'}</span
            >
            <p
              class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start"
            >
              {$t(`home.sections.${p}`)}
            </p>
          </div>
        {/each}
      </div>
      <p
        class="text-center text-rose-700 dark:text-gold font-semibold text-base sm:text-sm mt-3"
      >
        {$t('home.sections.painCustomerTurn')}
      </p>
    </div>
    <div class="mt-5 text-center">
      <p
        class="inline-block bg-gradient-to-r from-gold via-barbi to-gold bg-[length:200%_auto] animate-gradientx text-white font-bold text-xl sm:text-lg px-6 py-3 rounded-2xl shadow-lg"
      >
        {$t('home.sections.painTurn')}
      </p>
    </div>
    <!-- The one place on the page where "why is work like this at all?"
         is the reader's own question rather than ours: they have just read
         four lines describing it. A plain text link, not a card - the
         banner for /why sits far below, and a second card here would read
         as a pitch at the exact moment the section earns its trust. -->
    <p class="mt-3 text-center">
      <a
        href="/why"
        data-sveltekit-prefetch
        class="text-barbi font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-gold"
      >
        {$t('home.why.inline')} {$isRtl ? '←' : '→'}
      </a>
    </p>
    {#if $lang === 'he'}
      <div class="mt-5 text-center">
        <button
          type="button"
          onclick={() =>
            openVideo(
              VIDEO_HOW_IT_WORKS,
              $t('home.videos.howItWorksLabel')
            )}
          class="inline-flex items-center gap-2 bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
        >
          <span class="text-2xl leading-none">▶</span>
          {$t('home.videos.howItWorksCta')}
        </button>
      </div>
    {/if}
  </section>

  <!-- ===== הדרך השלישית: שכיר / יזם בודד / ריקמה ===== -->
  <section
    class="w-full max-w-xl mt-10 animate-fade-in-up"
    style="font-family:'Sababa',sans-serif;"
  >
    <h2
      class="text-rose-700 dark:text-gold font-bold text-3xl sm:text-2xl mb-1 text-center"
    >
      {$t('home.sections.oldWayTitle')}
    </h2>
    <p class="text-center text-slate-700 dark:text-surfaceMuted text-base sm:text-sm mb-5">
      {$t('home.sections.oldWaySub')}
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
      {#each [['colEmployee', false], ['colSolo', false], ['colRikma', true]] as [key, highlight]}
        <div
          class="relative flex flex-col rounded-2xl p-4 {highlight
            ? 'bg-gradient-to-br from-amber-200 via-gold to-rose-200 border-2 border-gold shadow-xl ring-2 ring-gold/50'
            : 'bg-slate-100/70 backdrop-blur-sm border border-slate-300 shadow-sm'}"
        >
          {#if highlight}
            <span
              class="absolute -top-3 left-1/2 -translate-x-1/2 bg-barbi text-gold text-xs font-bold px-3 py-1 rounded-full shadow whitespace-nowrap"
              >{$t('home.sections.colRikma_badge')}</span
            >
          {/if}
          <h3
            class="font-bold text-lg sm:text-base mb-3 text-center {highlight
              ? 'text-rose-700 dark:text-gold mt-1'
              : 'text-slate-500'}"
          >
            {$t(`home.sections.${key}_t`)}
          </h3>
          <ul class="flex flex-col gap-2">
            {#each $t(`home.sections.${key}_d`).split('•') as item}
              <li
                class="flex items-start gap-2 text-sm text-start {highlight
                  ? 'text-slate-900 dark:text-surfaceInk font-medium'
                  : 'text-slate-600'}"
              >
                <span
                  class="shrink-0 {highlight
                    ? 'text-emerald-600'
                    : 'text-rose-400'}">{highlight ? '✓' : '✕'}</span
                >
                <span>{item.trim()}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    {#if $lang === 'he'}
      <div class="mt-6 text-center">
        <button
          type="button"
          onclick={() =>
            openVideo(VIDEO_THIRD_WAY, $t('home.videos.thirdWayLabel'))}
          class="inline-flex items-center gap-2 bg-gold hover:bg-barbi hover:text-gold text-barbi font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 border-2 border-gold"
        >
          <span class="text-2xl leading-none">▶</span>
          {$t('home.videos.thirdWayCta')}
        </button>
      </div>
    {/if}
  </section>

  <!-- ===== הגרף: איך נראית פרנסה לאורך עשור בכל אחד מהשלושה =====
       ממוקם מיד אחרי טבלת ההשוואה כי הוא בדיוק אותה טענה בציר זמן: שם
       רואים *מה* שונה, וכאן רואים *מתי* זה מתחיל להיות שונה - ומה קורה
       ביום שמפסיקים לעבוד, שזה ההבדל היחיד שאי אפשר להתווכח עליו. -->
  <section
    class="w-full max-w-xl mt-8 animate-fade-in-up"
    style="font-family:'Sababa',sans-serif;"
  >
    <IncomeCurves />
  </section>

<VideoModal
  bind:open={videoOpen}
  {videoId}
  title={videoTitle}
  closeLabel={$t('home.videos.close')}
/>
