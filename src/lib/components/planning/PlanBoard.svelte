<script>
  /**
   * One open planning board and its proposed rows
   * (PLAN_PROJECT_PLANNING_BOARDS §4).
   *
   * Every row is a *proposal*. Nothing here creates a real entity — "open in
   * form" hands the row's spec to the normal creation form (mission.svelte /
   * crtask.svelte / ResourceCreator.svelte), where the user reviews and
   * approves it. Only then does the parent call `markPlanItemCreated`.
   */
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import Button from '$lib/celim/ui/button.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} board - Board node: { id, attributes: { title, …, items } }
   * @property {string} projectId
   * @property {(item: any, board: any) => void} [onOpenItem] - Open the row in its real creation form.
   * @property {() => void} [onChanged] - Ask the parent to reload after a change.
   */

  /** @type {Props} */
  let { board, projectId, onOpenItem, onChanged } = $props();

  let busyItemId = $state(/** @type {string|null} */ (null));
  let expanding = $state(false);
  let revisionNote = $state('');
  let showRevision = $state(false);

  const i18n = {
    he: {
      empty: 'הכיוון הזה עדיין לא פורט למשימות.',
      expand: '✨ פרט את הכיוון למשימות',
      expanding: 'מפרק…',
      revise: 'בקש רוויזיה',
      revisePlaceholder: 'מה לשנות? למשל: יותר שיווק, בלי משימות תקציב',
      reviseSend: 'שלח בקשה',
      cancel: 'ביטול',
      openInForm: 'פתח בטופס',
      dismiss: 'לא רלוונטי',
      restore: 'החזר',
      must: 'חובה',
      nice: 'רצוי',
      created: '✓ נוצר',
      exists: 'כבר קיים',
      kinds: { mission: 'משימה', act: 'מטלה', resource: 'משאב', product: 'מוצר', note: 'הערה' },
      hint: 'שאלות לחידוד'
    },
    en: {
      empty: 'This direction has not been broken down yet.',
      expand: '✨ Break this direction into tasks',
      expanding: 'Breaking down…',
      revise: 'Ask for a revision',
      revisePlaceholder: 'What should change? e.g. more marketing, drop the budget ones',
      reviseSend: 'Send request',
      cancel: 'Cancel',
      openInForm: 'Open in form',
      dismiss: 'Not relevant',
      restore: 'Restore',
      must: 'Must',
      nice: 'Nice',
      created: '✓ Created',
      exists: 'Already exists',
      kinds: { mission: 'Mission', act: 'Task', resource: 'Resource', product: 'Product', note: 'Note' },
      hint: 'Clarifying questions'
    },
    ar: {
      empty: 'لم يتم تفصيل هذا الاتجاه بعد.',
      expand: '✨ فصّل هذا الاتجاه إلى مهام',
      expanding: 'جارٍ التفصيل…',
      revise: 'اطلب مراجعة',
      revisePlaceholder: 'ما الذي يجب تغييره؟',
      reviseSend: 'إرسال',
      cancel: 'إلغاء',
      openInForm: 'افتح في النموذج',
      dismiss: 'غير ذي صلة',
      restore: 'استعادة',
      must: 'ضروري',
      nice: 'مستحسن',
      created: '✓ تم الإنشاء',
      exists: 'موجود بالفعل',
      kinds: { mission: 'مهمة', act: 'مهمة صغيرة', resource: 'مورد', product: 'منتج', note: 'ملاحظة' },
      hint: 'أسئلة توضيحية'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);
  let attrs = $derived(board?.attributes ?? {});
  let items = $derived(attrs.items?.data ?? []);
  let isExpanded = $derived(attrs.status === 'expanded');

  /** Skill names the AI suggested for a row, for display as chips. */
  function skillsOf(item) {
    const raw = item?.attributes?.spec?.skills;
    return Array.isArray(raw) ? raw.filter(Boolean).slice(0, 6) : [];
  }

  async function expand() {
    if (expanding) return;
    expanding = true;
    try {
      const res = await executeAction('expandPlanBoard', {
        boardId: String(board.id),
        projectId: String(projectId),
        lang: $lang,
        ...(revisionNote.trim() ? { revisionNote: revisionNote.trim() } : {})
      });
      if (res.success) {
        revisionNote = '';
        showRevision = false;
        onChanged?.();
      }
    } finally {
      expanding = false;
    }
  }

  async function patchItem(item, data) {
    if (busyItemId) return;
    busyItemId = String(item.id);
    try {
      const res = await executeAction('updatePlanItem', {
        itemId: String(item.id),
        boardId: String(board.id),
        projectId: String(projectId),
        ...data
      });
      if (res.success) onChanged?.();
    } finally {
      busyItemId = null;
    }
  }

  const toggleImp = (item) =>
    patchItem(item, { imp: item.attributes.imp === 'must' ? 'nice' : 'must' });

  const dismiss = (item) => patchItem(item, { status: 'dismissed' });
  const restore = (item) => patchItem(item, { status: 'proposed' });
</script>

<div class="plan-board rounded-2xl border border-barbi/40 p-4 bg-white/50 dark:bg-black/20">
  {#if attrs.rationale}
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">{attrs.rationale}</p>
  {/if}

  {#if !isExpanded || items.length === 0}
    <p class="text-sm text-gray-500 mb-3">{t.empty}</p>
    <Button onClick={expand} disabled={expanding}>
      {expanding ? t.expanding : t.expand}
    </Button>
  {:else}
    <ul class="flex flex-col gap-3">
      {#each items as item (item.id)}
        {@const a = item.attributes}
        {@const isCreated = a.status === 'created'}
        {@const isDismissed = a.status === 'dismissed'}
        <li
          class="rounded-xl border p-3 transition-opacity {isDismissed
            ? 'opacity-40 border-gray-300'
            : 'border-barbi/30'}"
        >
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded-full bg-barbi/15">
              {t.kinds[a.kind] ?? a.kind}
            </span>

            <button
              type="button"
              class="text-xs px-2 py-0.5 rounded-full border {a.imp === 'must'
                ? 'bg-red-100 border-red-300 text-red-800'
                : 'bg-gray-100 border-gray-300 text-gray-700'}"
              disabled={isCreated || busyItemId === String(item.id)}
              onclick={() => toggleImp(item)}
            >
              {a.imp === 'must' ? t.must : t.nice}
            </button>

            {#if a.existingRef}
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300"
                title={a.existingRef.name}
              >
                {t.exists}
              </span>
            {/if}

            {#if isCreated}
              <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-900 border border-green-300">
                {t.created}
              </span>
            {/if}
          </div>

          <p class="font-semibold">{a.name}</p>
          {#if a.descrip}
            <p class="text-sm text-gray-600 dark:text-gray-300">{a.descrip}</p>
          {/if}

          {#if skillsOf(item).length > 0}
            <div class="flex flex-wrap gap-1 mt-2">
              {#each skillsOf(item) as skill (skill)}
                <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {skill}
                </span>
              {/each}
            </div>
          {/if}

          {#if !isCreated}
            <div class="flex flex-wrap gap-2 mt-3">
              {#if !isDismissed}
                <Button onClick={() => onOpenItem?.(item, board)}>{t.openInForm}</Button>
                <button
                  type="button"
                  class="text-sm underline text-gray-500"
                  disabled={busyItemId === String(item.id)}
                  onclick={() => dismiss(item)}
                >
                  {t.dismiss}
                </button>
              {:else}
                <button
                  type="button"
                  class="text-sm underline text-gray-500"
                  disabled={busyItemId === String(item.id)}
                  onclick={() => restore(item)}
                >
                  {t.restore}
                </button>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="mt-4">
      {#if showRevision}
        <textarea
          class="w-full rounded-xl border border-barbi/40 p-2 text-sm"
          rows="2"
          bind:value={revisionNote}
          placeholder={t.revisePlaceholder}
        ></textarea>
        <div class="flex gap-2 mt-2">
          <Button onClick={expand} disabled={expanding || !revisionNote.trim()}>
            {expanding ? t.expanding : t.reviseSend}
          </Button>
          <button type="button" class="text-sm underline text-gray-500" onclick={() => (showRevision = false)}>
            {t.cancel}
          </button>
        </div>
      {:else}
        <button type="button" class="text-sm underline text-gray-500" onclick={() => (showRevision = true)}>
          {t.revise}
        </button>
      {/if}
    </div>
  {/if}
</div>
