<script>
  /**
   * Planning boards for a project (PLAN_PROJECT_PLANNING_BOARDS §4).
   *
   * Three entry points, all explicitly user-triggered — **nothing runs
   * automatically**:
   *  1. "What's worth advancing?" → the thin quick scan (tier 1), which
   *     proposes a few directions as suggested boards with no items.
   *  2. Accepting a direction → the big expansion run (tier 2), inside
   *     PlanBoard.
   *  3. Free text → a board that arrives already expanded.
   *
   * Boards are loaded lazily on the client rather than in the page's server
   * load, so this feature cannot break the create page if the Strapi schema
   * has not been deployed yet — it simply stays hidden.
   */
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { executeAction } from '$lib/client/actionClient';
  import Button from '$lib/celim/ui/button.svelte';
  import PlanBoard from './PlanBoard.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} projectId
   * @property {(item: any, board: any) => void} [onOpenItem] - Open a row in its real creation form.
   */

  /** @type {Props} */
  let { projectId, onOpenItem } = $props();

  let boards = $state(/** @type {any[]} */ ([]));
  let loading = $state(true);
  /** True when the backend does not know these types yet (schema not deployed). */
  let unavailable = $state(false);
  let scanning = $state(false);
  let scanned = $state(false);
  let freeText = $state('');
  let submittingText = $state(false);
  let openBoardId = $state(/** @type {string|null} */ (null));

  const i18n = {
    he: {
      heading: 'לוחות תכנון',
      intro: 'מרחב לתכנן איך לקדם את הריקמה. שום דבר לא נוצר עד שתאשרו בטופס.',
      scan: '🧭 מה כדאי לקדם?',
      scanning: 'סורק את הריקמה…',
      rescan: 'סרוק שוב',
      noDirections: 'לא נמצאו הצעות כרגע. נסו לכתוב כיוון משלכם.',
      freeTextLabel: 'או כתבו בחופשיות מה אתם רוצים לקדם',
      freeTextPlaceholder: 'למשל: אנחנו רוצים להתחיל למכור את המוצר הראשון ולהגיע ללקוחות…',
      freeTextSend: 'בנה לי תכנית',
      sending: 'בונה…',
      tooShort: 'כתבו קצת יותר כדי שנוכל לבנות תכנית',
      open: 'פתח',
      close: 'סגור',
      dismissDirection: 'לא רלוונטי',
      empty: 'אין עדיין לוחות תכנון.',
      suggested: 'הצעה'
    },
    en: {
      heading: 'Planning boards',
      intro: "A space to plan how to advance the project. Nothing is created until you approve it in the form.",
      scan: "🧭 What's worth advancing?",
      scanning: 'Scanning the project…',
      rescan: 'Scan again',
      noDirections: 'No suggestions right now. Try writing your own direction.',
      freeTextLabel: 'Or write freely what you want to advance',
      freeTextPlaceholder: 'e.g. we want to start selling our first product and reach customers…',
      freeTextSend: 'Build me a plan',
      sending: 'Building…',
      tooShort: 'Write a little more so we can build a plan',
      open: 'Open',
      close: 'Close',
      dismissDirection: 'Not relevant',
      empty: 'No planning boards yet.',
      suggested: 'Suggestion'
    },
    ar: {
      heading: 'لوحات التخطيط',
      intro: 'مساحة لتخطيط كيفية تقدم المشروع. لا يتم إنشاء أي شيء حتى توافق في النموذج.',
      scan: '🧭 ما الذي يستحق التقدم؟',
      scanning: 'جارٍ الفحص…',
      rescan: 'افحص مجددًا',
      noDirections: 'لا توجد اقتراحات حاليًا.',
      freeTextLabel: 'أو اكتب بحرية ما تريد تقدمه',
      freeTextPlaceholder: 'مثال: نريد بيع منتجنا الأول…',
      freeTextSend: 'ابنِ لي خطة',
      sending: 'جارٍ البناء…',
      tooShort: 'اكتب أكثر قليلاً',
      open: 'افتح',
      close: 'إغلاق',
      dismissDirection: 'غير ذي صلة',
      empty: 'لا توجد لوحات تخطيط بعد.',
      suggested: 'اقتراح'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);
  let suggested = $derived(boards.filter((b) => b.attributes?.status === 'suggested'));
  let opened = $derived(boards.filter((b) => b.attributes?.status !== 'suggested'));

  export async function reload() {
    try {
      const res = await sendToSer(
        { pid: String(projectId) },
        '285getProjectPlanBoards',
        0,
        0,
        false,
        fetch
      );
      const data = res?.data?.projectPlanBoards?.data;
      if (!data) {
        // No data and no throw usually means the backend does not know these
        // types yet — hide the feature instead of showing a broken panel.
        unavailable = true;
        boards = [];
        return;
      }
      unavailable = false;
      boards = data;
    } catch (err) {
      console.warn('[PlanBoards] could not load boards:', err);
      unavailable = true;
      boards = [];
    } finally {
      loading = false;
    }
  }

  onMount(reload);

  async function runScan() {
    if (scanning) return;
    scanning = true;
    try {
      const res = await executeAction('scanProjectDirections', {
        projectId: String(projectId),
        lang: $lang
      });
      if (res.success) {
        scanned = true;
        await reload();
      }
    } finally {
      scanning = false;
    }
  }

  async function submitFreeText() {
    const text = freeText.trim();
    if (text.length < 20 || submittingText) return;
    submittingText = true;
    try {
      const res = await executeAction('createPlanBoardFromText', {
        projectId: String(projectId),
        text,
        lang: $lang
      });
      if (res.success) {
        freeText = '';
        await reload();
        if (res.data?.boardId) openBoardId = String(res.data.boardId);
      }
    } finally {
      submittingText = false;
    }
  }

  async function setBoardStatus(board, status) {
    const res = await executeAction('updatePlanBoard', {
      boardId: String(board.id),
      projectId: String(projectId),
      status
    });
    if (res.success) await reload();
  }

  /** Accepting a direction opens it; PlanBoard then offers the expansion run. */
  async function acceptDirection(board) {
    await setBoardStatus(board, 'active');
    openBoardId = String(board.id);
  }
</script>

{#if !loading && !unavailable}
  <section class="plan-boards max-w-3xl mx-auto my-8 p-4 rounded-2xl border border-barbi bg-gradient-to-br from-gra via-grb to-gre">
    <h2 class="text-xl font-bold">{t.heading}</h2>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">{t.intro}</p>

    <!-- Tier 1 — the thin scan. Explicit click only. -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <Button onClick={runScan} disabled={scanning}>
        {scanning ? t.scanning : scanned ? t.rescan : t.scan}
      </Button>
      {#if scanned && suggested.length === 0 && !scanning}
        <span class="text-sm text-gray-500">{t.noDirections}</span>
      {/if}
    </div>

    <!-- Suggested directions: thin cards, nothing expanded yet -->
    {#if suggested.length > 0}
      <ul class="flex flex-col gap-3 mb-6">
        {#each suggested as board (board.id)}
          {@const a = board.attributes}
          <li class="rounded-xl border border-barbi/40 p-3 bg-white/50 dark:bg-black/20">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-barbi/15">{t.suggested}</span>
              <h3 class="font-semibold">{a.title}</h3>
            </div>
            {#if a.descrip}<p class="text-sm">{a.descrip}</p>{/if}
            {#if a.rationale}
              <p class="text-sm text-gray-600 dark:text-gray-300 italic mt-1">{a.rationale}</p>
            {/if}
            <div class="flex gap-2 mt-3">
              <Button onClick={() => acceptDirection(board)}>{t.open}</Button>
              <button
                type="button"
                class="text-sm underline text-gray-500"
                onclick={() => setBoardStatus(board, 'archived')}
              >
                {t.dismissDirection}
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Boards the user has taken on -->
    {#if opened.length > 0}
      <ul class="flex flex-col gap-3 mb-6">
        {#each opened as board (board.id)}
          {@const isOpen = openBoardId === String(board.id)}
          <li>
            <button
              type="button"
              class="w-full text-start font-semibold flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/40"
              onclick={() => (openBoardId = isOpen ? null : String(board.id))}
            >
              <span>{board.attributes?.title}</span>
              <span class="text-xs text-gray-500">{isOpen ? t.close : t.open}</span>
            </button>
            {#if isOpen}
              <div class="mt-2">
                <PlanBoard {board} {projectId} {onOpenItem} onChanged={reload} />
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else if suggested.length === 0 && !scanning}
      <p class="text-sm text-gray-500 mb-4">{t.empty}</p>
    {/if}

    <!-- Free text entry -->
    <div>
      <label class="block text-sm font-medium mb-1" for="plan-free-text">{t.freeTextLabel}</label>
      <textarea
        id="plan-free-text"
        class="w-full rounded-xl border border-barbi/40 p-2 text-sm"
        rows="3"
        bind:value={freeText}
        placeholder={t.freeTextPlaceholder}
      ></textarea>
      <div class="flex items-center gap-3 mt-2">
        <Button onClick={submitFreeText} disabled={submittingText || freeText.trim().length < 20}>
          {submittingText ? t.sending : t.freeTextSend}
        </Button>
        {#if freeText.trim().length > 0 && freeText.trim().length < 20}
          <span class="text-xs text-gray-500">{t.tooShort}</span>
        {/if}
      </div>
    </div>
  </section>
{/if}
