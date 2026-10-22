<script>
  /**
   * The one prefilled control & approval screen of a rikma import
   * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.5, §5.7).
   *
   * Serves both:
   *   1. Registered members on `/moach/import/[sessionId]` (one click runs
   *      `materializeRikmaBlueprint` and creates the ticked items).
   *   2. Unregistered or pre-claim recipients in behind-the-scenes studio mode
   *      on `/preview/rikma/studio/[token]` — full editing of fields, products,
   *      missions, hours (+/-), rates, resources and partners, live share split,
   *      instant public-page preview, and seamless save-then-signup/claim.
   */
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { untrack } from 'svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import BlueprintRowDetail from './BlueprintRowDetail.svelte';
  import BlueprintRikmaFields from './BlueprintRikmaFields.svelte';
  import RikmaPreview from './RikmaPreview.svelte';
  import { applyOps } from '$lib/assistant/applyOps';
  import { blueprintToRikmaView } from '$lib/assistant/rikmaView';
  import {
    addRowSpec,
    effectiveSpec,
    fieldOps,
    rowOps,
    rowValue,
    selectionOps,
    stepNumber
  } from '$lib/assistant/reviewEdits';

  /**
   * @typedef {{ key: string, group: string, label: string, status: string,
   *   why?: string, spec?: Record<string, any>, createdRef?: { type: string, id: string },
   *   _added?: boolean }} Row
   * @typedef {import('$lib/assistant/reviewEdits').RowEdit} RowEdit
   * @typedef {import('$lib/assistant/reviewEdits').FieldEdits} FieldEdits
   * @typedef {import('$lib/assistant/reviewEdits').Raw} Raw
   * @typedef {Object} StudioConfig
   * @property {(expectedVersion: number, ops: Record<string, unknown>[]) => Promise<any>} save
   * @property {() => void | Promise<void>} proceed
   * @property {string} proceedLabel
   * @property {string} previewUrl
   * @property {string} [expiresAt]
   * @typedef {Object} Props
   * @property {{ sessionId: string, version: number, projectId: string|null, projectName: string|null,
   *   fields: Record<string, any>, items: Row[] }} session
   * @property {() => void | Promise<void>} [onConflict] - The draft changed meanwhile; the
   *   page reloads it. The page keys this component on the version, so the
   *   fresh draft arrives as a fresh screen.
   * @property {StudioConfig} [studio] - Behind-the-scenes pre-signup/pre-claim studio mode.
   */

  /** @type {Props} */
  let { session, onConflict, studio } = $props();

  const GROUPS = ['products', 'rikmaMissions', 'rikmaResources', 'partners'];

  const isDone = (/** @type {Row} */ row) => !!row.createdRef || row.status === 'applied';

  /** Ticked by default: everything still open that nobody said "not now" to. */
  function initialSelection(/** @type {Row[]} */ items) {
    /** @type {Record<string, boolean>} */
    const sel = {};
    for (const row of items) sel[row.key] = !isDone(row) && row.status !== 'dropped';
    return sel;
  }

  /** @type {{ version: number, fields: Record<string, any>, items: Row[] }} */
  let draft = $state.raw(
    untrack(() => ({ version: session.version, fields: session.fields ?? {}, items: session.items }))
  );
  let selected = $state(untrack(() => initialSelection(session.items)));
  /** @type {Record<string, RowEdit>} */
  let edits = $state({});
  /** @type {FieldEdits} */
  let fieldEdits = $state({});
  /** @type {Row[]} */
  let addedRows = $state([]);
  let addSeq = 0;
  /** @type {Record<string, boolean>} */
  let open = $state({});
  /** @type {'edit' | 'public'} */
  let activeTab = $state('edit');
  let busy = $state(false);
  let saving = $state(false);
  let error = $state('');
  /** @type {'' | 'saved' | 'partial'} */
  let saveNote = $state('');
  /** @type {any} */
  let result = $state(null);

  /** @type {Record<string, string>} */
  const htmlBase = {};

  function defaultSpecFor(/** @type {string} */ group) {
    if (group === 'rikmaMissions') return { holder: 'me', hours: 10 };
    if (group === 'rikmaResources') return { holder: 'me', kindOf: 'total' };
    if (group === 'products') return { kindOf: 'total' };
    return {};
  }

  function addItem(/** @type {string} */ group) {
    if (locked) return;
    const key = `added_${++addSeq}`;
    /** @type {Row} */
    const row = { key, group, label: '', status: 'proposed', spec: defaultSpecFor(group), _added: true };
    addedRows = [...addedRows, row];
    selected[key] = true;
    open[key] = true;
    saveNote = '';
  }

  function removeAdded(/** @type {string} */ key) {
    if (locked) return;
    addedRows = addedRows.filter((r) => r.key !== key);
    const nextEdits = { ...edits };
    delete nextEdits[key];
    edits = nextEdits;
    const nextSelected = { ...selected };
    delete nextSelected[key];
    selected = nextSelected;
    const nextOpen = { ...open };
    delete nextOpen[key];
    open = nextOpen;
    saveNote = '';
  }

  let allItems = $derived([...draft.items, ...addedRows]);
  let byKey = $derived(new Map(allItems.map((row) => [row.key, row])));
  let grouped = $derived(
    GROUPS.map((group) => ({ group, rows: allItems.filter((row) => row.group === group) })).filter(
      (g) => g.rows.length
    )
  );

  /** Highest numeric suffix in `draft.items`, matching `applyOps.nextKey`. */
  function maxKeyNumber(/** @type {Row[]} */ items) {
    let max = 0;
    for (const it of items) {
      const m = /(\d+)$/.exec(it.key);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max;
  }

  function addedLabelOf(/** @type {Row} */ row) {
    const typed = (edits[row.key]?.label ?? row.label ?? '').replace(/\s+/g, ' ').trim();
    return typed || $t(`rikmaImport.add.placeholder.${row.group}`);
  }

  /** Unsaved newly-added rows mapped to the exact keys `applyOps` will mint (`iN`). */
  let resolvedAdded = $derived.by(() => {
    const base = maxKeyNumber(draft.items);
    return addedRows.map((row, idx) => ({
      row,
      serverKey: `i${base + idx + 1}`,
      label: addedLabelOf(row),
      spec: addRowSpec(row.group, row.spec, edits[row.key]),
      ticked: !!selected[row.key]
    }));
  });

  let selectedCount = $derived(allItems.filter((row) => selected[row.key] && !isDone(row)).length);
  let isNew = $derived(!session.projectId);
  let currency = $derived(String((fieldEdits.currency ?? draft.fields?.currency ?? '')).trim().toUpperCase());

  /** Ops sent with `materializeRikmaBlueprint` (ticked rows are passed separately in `selectedKeys`). */
  function buildOps() {
    /** @type {any[]} */
    const ops = isNew ? fieldOps(draft.fields, fieldEdits) : [];
    for (const [key, e] of Object.entries(edits)) {
      const row = byKey.get(key);
      if (!row || row._added || isDone(row)) continue;
      ops.push(...rowOps(/** @type {any} */ (row), e));
    }
    for (const added of resolvedAdded) {
      ops.push({
        op: 'add',
        group: added.row.group,
        label: added.label,
        ...(added.spec ? { spec: added.spec } : {})
      });
    }
    return ops;
  }

  /** Ops persisted by `save()` (includes checkbox drop/restore changes so previews stay in sync). */
  function buildSaveOps() {
    const ops = [...buildOps(), ...selectionOps(/** @type {any} */ (draft.items), selected)];
    for (const added of resolvedAdded) {
      if (!added.ticked) ops.push({ op: 'drop', key: added.serverKey });
    }
    return ops;
  }

  let pending = $derived(buildSaveOps());
  let locked = $derived(!!result || busy || saving);

  /** Real-time projection of the draft including every unsaved keystroke, hour bump and added row. */
  let liveView = $derived.by(() => {
    const simulated = applyOps(
      { items: /** @type {any} */ (draft.items), fields: draft.fields },
      pending,
      { kind: 'rikma', origin: 'manual' }
    ).state;
    return blueprintToRikmaView(simulated);
  });

  /** The product a ticked recipe row will be created inside, if any. */
  function partOf(/** @type {Row} */ row) {
    for (const p of draft.items) {
      if (p.group !== 'products' || !selected[p.key]) continue;
      const r = p.spec?.recipe;
      if (r?.missionKeys?.includes(row.key) || r?.resourceKeys?.includes(row.key)) return p.label;
    }
    return null;
  }

  function recipeLabels(/** @type {Row} */ product) {
    const r = product.spec?.recipe;
    const keys = [...(r?.missionKeys ?? []), ...(r?.resourceKeys ?? [])];
    return keys.map((k) => byKey.get(k)?.label).filter(Boolean);
  }

  /** The rows a partner will hold. */
  function bringsOf(/** @type {Row} */ partner) {
    return draft.items
      .filter((it) => it.spec?.holder === 'partner' && it.spec?.partnerKey === partner.key)
      .map((it) => it.label);
  }

  /** Who does it once created — the owner's flip on this screen wins over the draft. */
  function holderOf(/** @type {Row} */ row) {
    return edits[row.key]?.spec?.holder ?? row.spec?.holder ?? 'open';
  }

  function holderText(/** @type {Row} */ row) {
    const h = holderOf(row);
    if (h === 'me') return $t('rikmaImport.holder.me');
    if (h === 'partner') {
      const partner = byKey.get(row.spec?.partnerKey);
      return $t('rikmaImport.holder.partner', { name: partner?.label ?? '' });
    }
    return $t('rikmaImport.holder.open');
  }

  const specOf = (/** @type {Row} */ row) => effectiveSpec(/** @type {any} */ (row), edits[row.key]);
  const fmt = (/** @type {number} */ n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  function splitWhoLabel(/** @type {any} */ who) {
    if (!who || who.kind === 'open') return $t('rikmaImport.preview.lookingFor');
    if (who.kind === 'partner') return who.name;
    return $t('rikmaImport.preview.founder');
  }

  /**
   * What the price is for — a monthly rent is typed per month, never as a
   * total. Empty for a one-off price.
   */
  function periodText(/** @type {Row} */ row) {
    switch (specOf(row).kindOf) {
      case 'monthly':
        return $t('rikmaImport.row.period.monthly');
      case 'yearly':
        return $t('rikmaImport.row.period.yearly');
      case 'daily':
        return $t('rikmaImport.row.period.daily');
      case 'perUnit':
        return $t('rikmaImport.row.period.perUnit');
      case 'rent':
        return $t('rikmaImport.row.period.rent');
      default:
        return '';
    }
  }

  /** The closed row's one-line sum: hours × rate = value. */
  function valueLine(/** @type {Row} */ row) {
    const v = rowValue(row.group, specOf(row));
    if (!v) return '';
    return $t('rikmaImport.row.calc', { left: fmt(v.left), right: fmt(v.right), value: fmt(v.value) });
  }

  /** Record one fix; a fresh object each time so the edit stays reactive. `undefined` takes it back. */
  function setSpecEdit(/** @type {string} */ key, /** @type {string} */ field, /** @type {Raw | undefined} */ value) {
    const spec = { ...(edits[key]?.spec ?? {}) };
    if (value === undefined) delete spec[field];
    else spec[field] = value;
    edits[key] = { ...(edits[key] ?? {}), spec };
    saveNote = '';
  }

  function bumpHours(/** @type {Row} */ row, /** @type {number} */ delta) {
    if (locked || isDone(row)) return;
    const next = stepNumber(edits[row.key]?.spec?.hours, row.spec?.hours, delta, 10_000);
    setSpecEdit(row.key, 'hours', next);
  }

  function setLabel(/** @type {string} */ key, /** @type {string} */ value) {
    edits[key] = { ...(edits[key] ?? {}), label: value };
    saveNote = '';
  }

  /** The rich editor's report: its first one is the baseline, a return to it is no edit. */
  function setHtml(/** @type {string} */ key, /** @type {string} */ field, /** @type {string} */ html) {
    const id = `${key}.${field}`;
    if (!(id in htmlBase)) {
      htmlBase[id] = html;
      return;
    }
    const current = edits[key]?.spec?.[field];
    if (html === htmlBase[id]) {
      if (current !== undefined) setSpecEdit(key, field, undefined);
    } else if (current !== html) {
      setSpecEdit(key, field, html);
    }
  }

  function setField(/** @type {keyof FieldEdits} */ field, /** @type {string | boolean} */ value) {
    fieldEdits = { ...fieldEdits, [field]: value };
    saveNote = '';
  }

  /** Persist pending changes into the draft session (works for both member action & guest studio). */
  async function save() {
    if (locked || !pending.length) return true;
    saving = true;
    error = '';
    saveNote = '';
    const res = studio
      ? await studio.save(draft.version, pending)
      : await executeAction(
          'setAssistantItems',
          { sessionId: session.sessionId, expectedVersion: draft.version, ops: pending, via: 'site' },
          { showErrorToast: false }
        );
    saving = false;
    if (!res?.success) {
      error = res?.error?.message || $t('rikmaImport.save.error');
      return false;
    }
    if (res.data?.conflict) {
      await onConflict?.();
      return false;
    }
    const nextItems = res.data.items ?? draft.items;
    draft = {
      version: res.data.version ?? draft.version,
      fields: res.data.fields ?? {},
      items: nextItems
    };
    edits = {};
    fieldEdits = {};
    addedRows = [];
    selected = initialSelection(nextItems);
    saveNote = res.data.rejected?.length ? 'partial' : 'saved';
    return true;
  }

  async function submitStudio() {
    if (locked || !studio) return;
    if (pending.length) {
      const ok = await save();
      if (!ok) return;
    }
    busy = true;
    await studio.proceed();
    busy = false;
  }

  async function create() {
    if (locked || selectedCount === 0) return;
    busy = true;
    error = '';
    const selectedExisting = draft.items.filter((row) => selected[row.key] && !isDone(row)).map((row) => row.key);
    const selectedNew = resolvedAdded.filter((a) => a.ticked).map((a) => a.serverKey);
    const res = await executeAction(
      'materializeRikmaBlueprint',
      {
        sessionId: session.sessionId,
        expectedVersion: draft.version,
        selectedKeys: [...selectedExisting, ...selectedNew],
        ops: buildOps(),
        via: 'site'
      },
      { showErrorToast: false }
    );
    busy = false;
    if (!res?.success) {
      error = res?.error?.message || $t('rikmaImport.error');
      return;
    }
    if (res.data?.conflict) {
      await onConflict?.();
      return;
    }
    result = res.data;
  }

  // ── A read-only link for partners (§4.4) ──
  let sharing = $state(false);
  let shareUrl = $state('');
  let shareError = $state('');
  let copied = $state(false);
  let copiedInviteKey = $state('');
  let inviteCopyErrorKey = $state('');

  async function makeShareLink() {
    if (sharing) return;
    sharing = true;
    shareError = '';
    copied = false;
    const res = await executeAction('shareRikmaPreview', { sessionId: session.sessionId }, { showErrorToast: false });
    sharing = false;
    if (res?.success && res.data?.previewUrl) shareUrl = res.data.previewUrl;
    else shareError = $t('rikmaImport.share.error');
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
    } catch {
      copied = false;
    }
  }

  /** @param {{ key: string, result: string, emailStatus?: string, created?: number, suggestionFailures?: number, retryAfterSeconds?: number }} inv */
  function inviteText(inv) {
    const name = byKey.get(inv.key)?.label ?? '';
    let translation = inv.result;
    if (inv.suggestionFailures) {
      translation =
        inv.emailStatus === 'sent'
          ? 'cardsFailed'
          : inv.emailStatus === 'skipped'
            ? 'cardsFailedEmailSkipped'
            : 'cardsFailedEmailFailed';
    } else if (inv.result === 'invited' && inv.emailStatus !== 'sent') {
      translation = inv.created ? 'invitedCardOnly' : inv.emailStatus === 'skipped' ? 'emailSkipped' : 'emailFailed';
    }
    const known = [
      'invited',
      'invitedCardOnly',
      'notRegistered',
      'pendingVote',
      'noEmail',
      'emailFailed',
      'emailSkipped',
      'rateLimited',
      'cardsFailed',
      'cardsFailedEmailSkipped',
      'cardsFailedEmailFailed'
    ];
    const retryAfterMinutes = Math.max(1, Math.ceil((inv.retryAfterSeconds ?? 60) / 60));
    return $t(`rikmaImport.invite.${known.includes(translation) ? translation : 'other'}`, {
      name,
      minutes: retryAfterMinutes,
      failed: inv.suggestionFailures ?? 0
    });
  }

  /** @param {string} key @param {string} url */
  async function copyJoinLink(key, url) {
    inviteCopyErrorKey = '';
    try {
      await navigator.clipboard.writeText(url);
      copiedInviteKey = key;
    } catch {
      copiedInviteKey = '';
      inviteCopyErrorKey = key;
    }
  }
</script>

<section
  class="blueprint-review mx-auto max-w-3xl p-4 flex flex-col gap-4 text-start rounded-2xl border border-surfaceLine bg-surface text-surfaceInk shadow-lg"
>
  <header class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-2xl font-bold">{$t('rikmaImport.title')}</h1>
        {#if draft.fields?.track}
          <span class="text-xs px-2 py-0.5 rounded-full bg-barbi/15">{$t(`rikmaImport.track.${draft.fields.track}`)}</span>
        {/if}
      </div>

      {#if isNew && !result}
        <div class="inline-flex rounded-full border border-barbi/35 bg-surface2 p-0.5 text-xs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'edit'}
            class="px-3 py-1 rounded-full font-semibold transition-colors {activeTab === 'edit'
              ? 'bg-barbi text-white'
              : 'text-surfaceInk hover:bg-barbi/10'}"
            onclick={() => (activeTab = 'edit')}
          >
            {$t('rikmaImport.tabs.edit')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'public'}
            class="px-3 py-1 rounded-full font-semibold transition-colors {activeTab === 'public'
              ? 'bg-barbi text-white'
              : 'text-surfaceInk hover:bg-barbi/10'}"
            onclick={() => (activeTab = 'public')}
          >
            {$t('rikmaImport.tabs.public')}
          </button>
        </div>
      {/if}
    </div>

    <p class="text-sm text-surfaceMuted">
      {isNew
        ? $t('rikmaImport.subtitleNew')
        : $t('rikmaImport.subtitleExisting', { name: session.projectName ?? '' })}
    </p>

    {#if isNew && !result && !studio}
      <div class="flex flex-col gap-1 text-sm">
        {#if shareUrl}
          <p class="text-surfaceInk">{$t('rikmaImport.share.ready', { days: 30 })}</p>
          <div class="flex flex-wrap items-center gap-2">
            <code class="text-xs break-all rounded bg-surface2 border border-barbi/30 p-1" dir="ltr">{shareUrl}</code>
            <button type="button" class="underline" onclick={copyShareLink}>
              {copied ? $t('rikmaImport.share.copied') : $t('rikmaImport.share.copy')}
            </button>
          </div>
        {:else}
          <button type="button" class="self-start underline" disabled={sharing} onclick={makeShareLink}>
            {sharing ? $t('rikmaImport.share.making') : $t('rikmaImport.share.button')}
          </button>
        {/if}
        {#if shareError}<p class="text-red-700 dark:text-red-300" role="alert">{shareError}</p>{/if}
      </div>
    {/if}
  </header>

  {#if activeTab === 'public' && isNew && !result}
    <RikmaPreview view={liveView} expiresAt={studio?.expiresAt ?? null} embedded={true} />
  {:else}
    {#if isNew}
      <BlueprintRikmaFields fields={draft.fields} edits={fieldEdits} readonly={!!result} onField={setField} />
    {/if}

    <!-- Live real-time share split bar as hours & resources change -->
    {#if liveView.split.length > 0 && !result}
      <div class="rounded-2xl border border-gold/40 bg-surface2 p-3.5 flex flex-col gap-2" data-testid="live-split">
        <h3 class="text-sm font-semibold text-surfaceInk">{$t('rikmaImport.liveSplit.heading')}</h3>
        <div class="flex flex-col gap-2">
          {#each liveView.split as s, i (i)}
            <div>
              <div class="flex justify-between text-xs mb-0.5 text-surfaceInk">
                <span>{splitWhoLabel(s.who)}</span>
                <span class="font-semibold">
                  {fmt(s.value)}{#if currency}{' '}{currency}{/if} · {s.pct}%
                </span>
              </div>
              <div class="h-2 rounded-full bg-surface border border-surfaceLine overflow-hidden" role="presentation">
                <div class="h-full bg-gradient-to-l from-gold to-barbi transition-all duration-200" style="width: {s.pct}%"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Quick-add toolbar so missions, products, resources & partners can always be added -->
    {#if !result}
      <div class="flex flex-wrap items-center gap-2" data-testid="add-toolbar">
        {#each GROUPS as group (group)}
          <button
            type="button"
            class="text-xs px-3 py-1.5 rounded-full border border-barbi/40 bg-surface2 text-surfaceInk font-medium hover:bg-barbi/15 disabled:opacity-50"
            disabled={locked}
            onclick={() => addItem(group)}
          >
            {$t(`rikmaImport.add.${group}`)}
          </button>
        {/each}
      </div>
    {/if}

    {#each grouped as { group, rows } (group)}
      <div class="rounded-2xl border border-barbi/40 p-4 bg-surface2">
        <h2 class="text-lg font-semibold mb-3">{$t(`rikmaImport.groups.${group}`)}</h2>
        <ul class="flex flex-col gap-3">
          {#each rows as row (row.key)}
            {@const done = isDone(row)}
            {@const inside = !done && selected[row.key] ? partOf(row) : null}
            {@const spec = specOf(row)}
            {@const sum = valueLine(row)}
            <li
              class="rounded-xl border p-3 flex gap-3 {done
                ? 'border-green-500/50 bg-green-500/10'
                : selected[row.key]
                  ? 'border-barbi/40 bg-surface'
                  : 'border-surfaceLine bg-surface opacity-70'}"
            >
              <input
                type="checkbox"
                class="mt-1"
                aria-label={edits[row.key]?.label || row.label || $t(`rikmaImport.add.placeholder.${group}`)}
                checked={done || !!selected[row.key]}
                disabled={done || !!result}
                onchange={(e) => (selected[row.key] = e.currentTarget.checked)}
              />
              <div class="flex-1 flex flex-col gap-2 min-w-0">
                {#if done}
                  <p class="font-semibold text-surfaceInk">
                    {row.label} <span class="text-xs text-green-700 dark:text-green-300">✓ {$t('rikmaImport.row.created')}</span>
                  </p>
                {:else}
                  <div class="flex items-center gap-2">
                    <input
                      class="flex-1 min-w-0 font-semibold rounded-lg border {row._added
                        ? 'border-barbi/40 bg-surface2'
                        : 'border-transparent hover:border-barbi/30 bg-transparent'} focus:border-barbi/60 p-1 text-surfaceInk placeholder:text-surfaceMuted"
                      aria-label={$t('rikmaImport.row.name')}
                      placeholder={$t(`rikmaImport.add.placeholder.${group}`)}
                      value={edits[row.key]?.label ?? row.label}
                      disabled={!!result}
                      oninput={(e) => setLabel(row.key, e.currentTarget.value)}
                    />
                    {#if row._added && !result}
                      <button
                        type="button"
                        class="shrink-0 text-xs px-2 py-1 rounded-lg border border-surfaceLine text-surfaceMuted hover:text-red-600 hover:border-red-400"
                        onclick={() => removeAdded(row.key)}
                      >
                        ✕ {$t('rikmaImport.add.remove')}
                      </button>
                    {/if}
                  </div>
                {/if}

                {#if row.why}
                  <p class="text-xs italic text-surfaceMuted">{row.why}</p>
                {/if}

                <div class="flex flex-wrap items-center gap-2 text-xs">
                  {#if row.status === 'dropped' && !done}
                    <span class="px-2 py-0.5 rounded-full bg-surface2 border border-surfaceLine text-surfaceMuted">
                      {$t('rikmaImport.row.notNow')}
                    </span>
                  {/if}
                  {#if (group === 'rikmaMissions' || group === 'rikmaResources') && (done || holderOf(row) === 'partner')}
                    <span class="px-2 py-0.5 rounded-full bg-barbi/10">{holderText(row)}</span>
                  {:else if group === 'rikmaMissions' || group === 'rikmaResources'}
                    <button
                      type="button"
                      class="px-2 py-0.5 rounded-full bg-barbi/10 border border-barbi/30 hover:bg-barbi/20"
                      title={$t('rikmaImport.holder.toggle')}
                      aria-label="{holderText(row)} · {$t('rikmaImport.holder.toggle')}"
                      disabled={!!result}
                      onclick={() => setSpecEdit(row.key, 'holder', holderOf(row) === 'me' ? 'open' : 'me')}
                    >
                      {holderText(row)} ⇄
                    </button>
                  {/if}

                  {#if group === 'rikmaMissions' && !done && !result}
                    <span
                      class="inline-flex items-center gap-1 rounded-full border border-barbi/35 bg-surface2 px-1.5 py-0.5"
                      data-testid="hours-stepper-{row.key}"
                    >
                      <button
                        type="button"
                        class="w-5 h-5 rounded-full hover:bg-barbi/20 font-bold text-surfaceInk leading-none"
                        title={$t('rikmaImport.hoursControl.minus')}
                        onclick={() => bumpHours(row, -1)}
                      >
                        −
                      </button>
                      <span class="px-1 font-medium text-surfaceInk">
                        {$t('rikmaImport.hoursControl.hoursBadge', { hours: fmt(Number(spec.hours ?? 0)) })}
                      </span>
                      <button
                        type="button"
                        class="w-5 h-5 rounded-full hover:bg-barbi/20 font-bold text-surfaceInk leading-none"
                        title={$t('rikmaImport.hoursControl.plus')}
                        onclick={() => bumpHours(row, 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        class="px-1.5 py-0.5 rounded-full hover:bg-barbi/20 text-[11px] font-semibold text-surfaceInk border-s border-surfaceLine"
                        onclick={() => bumpHours(row, 5)}
                      >
                        {$t('rikmaImport.hoursControl.plusFive')}
                      </button>
                    </span>
                  {/if}

                  {#if group === 'rikmaMissions' && spec.recurring === true}
                    <span class="px-2 py-0.5 rounded-full bg-surface2 border border-surfaceLine">{$t('rikmaImport.row.recurring')}</span>
                  {/if}
                  {#if inside}
                    <span class="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                      {$t('rikmaImport.row.partOf', { name: inside })}
                    </span>
                  {/if}
                  {#if group === 'products' && recipeLabels(row).length}
                    <span class="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                      {$t('rikmaImport.row.madeOf', { names: recipeLabels(row).join(', ') })}
                    </span>
                  {/if}
                  {#if group === 'partners'}
                    <span dir="ltr">{spec.email ?? $t('rikmaImport.partner.noEmail')}</span>
                  {/if}
                  {#if sum}
                    <span class="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/40 font-semibold" data-testid="row-sum">
                      <span dir="ltr">{sum}</span>
                      {currency}
                      {#if group === 'rikmaMissions' && spec.recurring === true}{$t('rikmaImport.row.period.monthly')}{/if}
                    </span>
                  {/if}
                </div>

                {#if !done && (group === 'products' || group === 'rikmaResources')}
                  <label class="flex items-center gap-2 text-sm">
                    <span>{$t('rikmaImport.row.price')}</span>
                    <input
                      class="w-28 rounded-lg border border-barbi/30 p-1 bg-surface2 text-surfaceInk placeholder:text-surfaceMuted"
                      inputmode="decimal"
                      placeholder={$t('rikmaImport.row.priceOnRequest')}
                      value={edits[row.key]?.spec?.price ?? (row.spec?.price ?? '')}
                      disabled={!!result}
                      oninput={(e) => setSpecEdit(row.key, 'price', e.currentTarget.value)}
                    />
                    {#if row.spec?.currency || currency}<span>{row.spec?.currency ?? currency}</span>{/if}
                    {#if periodText(row)}<span class="font-semibold">{periodText(row)}</span>{/if}
                  </label>
                {/if}

                {#if !done && group === 'products'}
                  <label class="flex flex-col gap-1 text-sm">
                    <span>{$t('rikmaImport.row.keywords')}</span>
                    <input
                      class="rounded-lg border border-barbi/30 p-1 bg-surface2 text-surfaceInk"
                      value={edits[row.key]?.spec?.keywords ?? (row.spec?.keywords ?? []).join(', ')}
                      disabled={!!result}
                      oninput={(e) => setSpecEdit(row.key, 'keywords', e.currentTarget.value)}
                    />
                    <span class="text-xs text-surfaceMuted">{$t('rikmaImport.row.keywordsHint')}</span>
                  </label>
                  <label class="flex flex-col gap-1 text-sm">
                    <span>{$t('rikmaImport.row.categories')}</span>
                    <input
                      class="rounded-lg border border-barbi/30 p-1 bg-surface2 text-surfaceInk"
                      value={edits[row.key]?.spec?.categories ?? (row.spec?.categories ?? []).join(', ')}
                      disabled={!!result}
                      oninput={(e) => setSpecEdit(row.key, 'categories', e.currentTarget.value)}
                    />
                    <span class="text-xs text-surfaceMuted">{$t('rikmaImport.row.categoriesHint')}</span>
                  </label>
                {/if}

                <button
                  type="button"
                  class="self-start text-sm underline text-surfaceInk"
                  aria-expanded={!!open[row.key]}
                  aria-controls="detail-{row.key}"
                  onclick={() => (open[row.key] = !open[row.key])}
                >
                  {open[row.key] ? $t('rikmaImport.row.hideDetails') : $t('rikmaImport.row.details')}
                  <span aria-hidden="true">{open[row.key] ? '▴' : '▾'}</span>
                </button>
                {#if open[row.key]}
                  <div id="detail-{row.key}">
                    <BlueprintRowDetail
                      {row}
                      edit={edits[row.key]}
                      readonly={done || !!result}
                      currency={row.spec?.currency ?? currency}
                      brings={group === 'partners' ? bringsOf(row) : []}
                      onSpec={(field, raw) => setSpecEdit(row.key, field, raw)}
                      onHtml={(field, html) => setHtml(row.key, field, html)}
                    />
                  </div>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  {/if}

  {#if error}
    <p class="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-surfaceInk" role="alert">{error}</p>
  {/if}

  {#if result}
    <div class="rounded-2xl border border-green-500/50 bg-green-500/10 p-4 flex flex-col gap-2" role="status">
      <h2 class="text-lg font-semibold">{$t('rikmaImport.result.title')}</h2>
      <p class="text-sm text-surfaceInk">{$t('rikmaImport.result.created', { count: result.created?.length ?? 0 })}</p>
      {#if result.failed?.length}
        <p class="text-sm font-semibold text-surfaceInk">{$t('rikmaImport.result.failed')}</p>
        <ul class="list-disc list-inside text-sm">
          {#each result.failed as f (f.key)}
            <li>{byKey.get(f.key)?.label ?? f.key}: {f.message}</li>
          {/each}
        </ul>
      {/if}
      {#each result.invites ?? [] as inv (inv.key)}
        <p class="text-sm text-surfaceInk">{inviteText(inv)}</p>
        {#if inv.joinUrl && inv.result !== 'pendingVote' && inv.result !== 'self'}
          <div class="flex flex-wrap items-center gap-2">
            <code class="text-xs break-all rounded bg-surface2 border border-barbi/30 p-1" dir="ltr">{inv.joinUrl}</code>
            <button type="button" class="underline text-sm" onclick={() => copyJoinLink(inv.key, inv.joinUrl)}>
              {copiedInviteKey === inv.key ? $t('rikmaImport.invite.copied') : $t('rikmaImport.invite.copy')}
            </button>
            {#if inviteCopyErrorKey === inv.key}
              <span class="text-xs text-red-700 dark:text-red-300" role="alert">{$t('rikmaImport.invite.copyFailed')}</span>
            {/if}
          </div>
        {/if}
      {/each}
      {#if result.proposals?.boards}
        <p class="text-sm text-surfaceInk">{$t('rikmaImport.result.proposals')}</p>
      {/if}
      {#if result.projectId}
        <div class="flex flex-wrap gap-3 mt-2">
          <a class="underline font-semibold text-surfaceInk" href="/moach/{result.projectId}">
            {$t('rikmaImport.result.openRikma')}
          </a>
          {#if result.proposals?.boards}
            <a class="underline text-surfaceInk" href="/moach/{result.projectId}/create">
              {$t('rikmaImport.result.openBoards')}
            </a>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <footer class="sticky bottom-0 flex flex-col gap-2 rounded-2xl border border-barbi/40 bg-surface p-3">
      {#if pending.length || saveNote}
        <div class="flex flex-wrap items-center justify-between gap-2 text-sm" role="status">
          {#if pending.length}
            <span class="text-surfaceMuted">{$t('rikmaImport.save.pending', { count: pending.length })}</span>
            <button
              type="button"
              class="rounded-full border border-barbi/50 px-3 py-1 font-semibold hover:bg-barbi/10 disabled:opacity-60"
              disabled={locked}
              onclick={save}
            >
              {saving ? $t('rikmaImport.save.saving') : $t('rikmaImport.save.button')}
            </button>
          {:else if saveNote === 'saved'}
            <span class="text-green-700 dark:text-green-300">
              ✓ {studio ? $t('rikmaImport.studio.savedPublic') : $t('rikmaImport.save.saved')}
            </span>
          {:else if saveNote === 'partial'}
            <span class="text-amber-700 dark:text-amber-300">{$t('rikmaImport.save.partial')}</span>
          {/if}
        </div>
      {/if}
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm">{$t('rikmaImport.selectedCount', { count: selectedCount })}</span>
        {#if studio}
          <Button
            class="text-[color:var(--ramp-ink,#16131b)]"
            onClick={submitStudio}
            disabled={locked}
            loading={busy || saving}
          >
            {busy || saving ? $t('rikmaImport.studio.proceeding') : studio.proceedLabel}
          </Button>
        {:else}
          <Button
            class="text-[color:var(--ramp-ink,#16131b)]"
            onClick={create}
            disabled={locked || selectedCount === 0}
            loading={busy}
          >
            {busy ? $t('rikmaImport.creating') : $t('rikmaImport.submit', { count: selectedCount })}
          </Button>
        {/if}
      </div>
    </footer>
  {/if}
</section>
