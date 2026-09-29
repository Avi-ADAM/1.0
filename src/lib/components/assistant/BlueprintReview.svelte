<script>
  /**
   * The one prefilled approval screen of a rikma import
   * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.5).
   *
   * An agent (or the site) drafted the rikma — products first — into an
   * assistant session. Nothing exists yet. Here the owner sees every row, fixes
   * names, prices and search words in place, unticks what they do not want
   * now, and creates the rest with ONE click. The click runs
   * `materializeRikmaBlueprint`, which calls the same actions the forms do, so
   * any vote a row needs in a rikma with several members still happens.
   *
   * Inline edits travel as ops with the click, so the draft the agent sees
   * afterwards is exactly what was created.
   */
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { untrack } from 'svelte';
  import Button from '$lib/celim/ui/button.svelte';

  /**
   * @typedef {{ key: string, group: string, label: string, status: string,
   *   why?: string, spec?: Record<string, any>, createdRef?: { type: string, id: string } }} Row
   * @typedef {Object} Props
   * @property {{ sessionId: string, version: number, projectId: string|null, projectName: string|null,
   *   fields: Record<string, any>, items: Row[] }} session
   * @property {() => void | Promise<void>} [onConflict] - The draft changed meanwhile; the
   *   page reloads it. The page keys this component on the version, so the
   *   fresh draft arrives as a fresh screen.
   */

  /** @type {Props} */
  let { session, onConflict } = $props();

  const GROUPS = ['products', 'rikmaMissions', 'rikmaResources', 'partners'];

  const isDone = (/** @type {Row} */ row) => !!row.createdRef || row.status === 'applied';

  /** Ticked by default: everything still open that nobody said "not now" to. */
  function initialSelection(/** @type {Row[]} */ items) {
    /** @type {Record<string, boolean>} */
    const sel = {};
    for (const row of items) sel[row.key] = !isDone(row) && row.status !== 'dropped';
    return sel;
  }

  // Initial values only: the page remounts this screen when the draft's version changes.
  let selected = $state(untrack(() => initialSelection(session.items)));
  /** @type {Record<string, { label?: string, price?: string, keywords?: string, categories?: string, holder?: string }>} */
  let edits = $state({});
  let rikmaName = $state(untrack(() => String(session.fields?.name ?? '')));
  let busy = $state(false);
  let error = $state('');
  /** @type {any} */
  let result = $state(null);

  let byKey = $derived(new Map(session.items.map((row) => [row.key, row])));
  let grouped = $derived(
    GROUPS.map((group) => ({ group, rows: session.items.filter((row) => row.group === group) })).filter(
      (g) => g.rows.length
    )
  );
  let selectedCount = $derived(session.items.filter((row) => selected[row.key] && !isDone(row)).length);
  let isNew = $derived(!session.projectId);

  /** The product a ticked recipe row will be created inside, if any. */
  function partOf(/** @type {Row} */ row) {
    for (const p of session.items) {
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

  /** Who does it once created — the owner's flip on this screen wins over the draft. */
  function holderOf(/** @type {Row} */ row) {
    return edits[row.key]?.holder ?? row.spec?.holder ?? 'open';
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

  /** Record one inline fix; a fresh object each time so the edit stays reactive. */
  function setEdit(/** @type {string} */ key, /** @type {'label'|'price'|'keywords'|'categories'|'holder'} */ field, /** @type {string} */ value) {
    edits[key] = { ...(edits[key] ?? {}), [field]: value };
  }

  /** "a, b ,, c" → ['a', 'b', 'c'] */
  const splitList = (/** @type {string} */ s) =>
    s
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

  /** The owner's inline fixes, as the same ops an agent would send. */
  function buildOps() {
    /** @type {any[]} */
    const ops = [];
    if (isNew && rikmaName.trim() && rikmaName.trim() !== String(session.fields?.name ?? '')) {
      ops.push({ op: 'setField', field: 'name', value: rikmaName.trim() });
    }
    for (const [key, e] of Object.entries(edits)) {
      const row = byKey.get(key);
      if (!row || isDone(row)) continue;
      if (e.label !== undefined && e.label.trim() && e.label.trim() !== row.label) {
        ops.push({ op: 'rename', key, label: e.label.trim() });
      }
      /** @type {Record<string, any>} */
      const spec = {};
      if (e.price !== undefined) {
        const n = Number(String(e.price).replace(',', '.'));
        spec.price = e.price.trim() === '' ? null : Number.isFinite(n) && n >= 0 ? n : undefined;
        if (spec.price === undefined) delete spec.price;
        else if (row.group === 'products') spec.pricingMode = spec.price === null ? 'quote' : 'fixed';
      }
      if (e.keywords !== undefined) {
        const words = splitList(e.keywords);
        spec.keywords = words.length ? words : null;
      }
      if (e.categories !== undefined) {
        const domains = splitList(e.categories).slice(0, 3);
        spec.categories = domains.length ? domains : null;
      }
      if (e.holder !== undefined && e.holder !== (row.spec?.holder ?? 'open')) spec.holder = e.holder;
      if (Object.keys(spec).length) ops.push({ op: 'setSpec', key, spec });
    }
    return ops;
  }

  async function create() {
    if (busy || selectedCount === 0) return;
    busy = true;
    error = '';
    const res = await executeAction(
      'materializeRikmaBlueprint',
      {
        sessionId: session.sessionId,
        expectedVersion: session.version,
        selectedKeys: session.items.filter((row) => selected[row.key] && !isDone(row)).map((row) => row.key),
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
    // No reload here: the result below is the page now, and its links lead on.
    result = res.data;
  }

  // ── A read-only link for partners (§4.4) ──
  let sharing = $state(false);
  let shareUrl = $state('');
  let shareError = $state('');
  let copied = $state(false);

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

  /** @param {{ key: string, result: string }} inv */
  function inviteText(inv) {
    const name = byKey.get(inv.key)?.label ?? '';
    const known = ['invited', 'notRegistered', 'pendingVote', 'noEmail'];
    return $t(`rikmaImport.invite.${known.includes(inv.result) ? inv.result : 'other'}`, { name });
  }
</script>

<!--
  The whole screen is one card surface. It is reached from two layouts: under
  /moach/<id> it sits on the slate gradient, at /moach/import on the page's
  --bg, which is dark in personal (both modes) and business-dark. A dark ink
  laid straight on that page read as nothing, so every line here sits on
  `bg-surface` and reads in `text-surfaceInk` — the pair that is resolved per
  theme AND per mode (app.postcss, "THE CARD SURFACE"). Tints on top of it are
  translucent (`bg-green-500/10`), never a fixed `-50` fill, so the inherited
  ink stays readable in all four fills.
  Inheriting is not enough for <p> and <a>: app.postcss paints every bare `p`
  in --heading-color (70% black, in every mode) and every `a` in
  --accent-color, so each one here names its ink itself.
-->
<section
  class="blueprint-review mx-auto max-w-3xl p-4 flex flex-col gap-4 text-start rounded-2xl border border-surfaceLine bg-surface text-surfaceInk shadow-lg"
>
  <header class="flex flex-col gap-1">
    <div class="flex flex-wrap items-center gap-2">
      <h1 class="text-2xl font-bold">{$t('rikmaImport.title')}</h1>
      {#if session.fields?.track}
        <span class="text-xs px-2 py-0.5 rounded-full bg-barbi/15">{$t(`rikmaImport.track.${session.fields.track}`)}</span>
      {/if}
    </div>
    <p class="text-sm text-surfaceMuted">
      {isNew
        ? $t('rikmaImport.subtitleNew')
        : $t('rikmaImport.subtitleExisting', { name: session.projectName ?? '' })}
    </p>
    {#if isNew && !result}
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

  {#if isNew}
    <label class="flex flex-col gap-1 text-sm">
      <span class="font-semibold">{$t('rikmaImport.field.name')}</span>
      <input class="rounded-xl border border-barbi/40 p-2 bg-surface2 text-surfaceInk" bind:value={rikmaName} disabled={!!result} />
    </label>
    {#if session.fields?.publicDescription}
      <p class="text-sm italic text-surfaceMuted">{session.fields.publicDescription}</p>
    {/if}
  {/if}

  {#each grouped as { group, rows } (group)}
    <div class="rounded-2xl border border-barbi/40 p-4 bg-surface2">
      <h2 class="text-lg font-semibold mb-3">{$t(`rikmaImport.groups.${group}`)}</h2>
      <ul class="flex flex-col gap-3">
        {#each rows as row (row.key)}
          {@const done = isDone(row)}
          {@const inside = !done && selected[row.key] ? partOf(row) : null}
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
              aria-label={row.label}
              checked={done || !!selected[row.key]}
              disabled={done || !!result}
              onchange={(e) => (selected[row.key] = e.currentTarget.checked)}
            />
            <div class="flex-1 flex flex-col gap-2 min-w-0">
              {#if done}
                <p class="font-semibold text-surfaceInk">{row.label} <span class="text-xs text-green-700 dark:text-green-300">✓ {$t('rikmaImport.row.created')}</span></p>
              {:else}
                <input
                  class="font-semibold rounded-lg border border-transparent hover:border-barbi/30 focus:border-barbi/60 p-1 bg-transparent text-surfaceInk"
                  aria-label={$t('rikmaImport.row.name')}
                  value={edits[row.key]?.label ?? row.label}
                  disabled={!!result}
                  oninput={(e) => setEdit(row.key, 'label', e.currentTarget.value)}
                />
              {/if}

              {#if row.why}
                <p class="text-xs italic text-surfaceMuted">{row.why}</p>
              {/if}

              <div class="flex flex-wrap items-center gap-2 text-xs">
                {#if row.status === 'dropped' && !done}
                  <span class="px-2 py-0.5 rounded-full bg-surface2 border border-surfaceLine text-surfaceMuted">{$t('rikmaImport.row.notNow')}</span>
                {/if}
                {#if (group === 'rikmaMissions' || group === 'rikmaResources') && (done || holderOf(row) === 'partner')}
                  <span class="px-2 py-0.5 rounded-full bg-barbi/10">{holderText(row)}</span>
                {:else if group === 'rikmaMissions' || group === 'rikmaResources'}
                  <!-- "Looking for someone" emails every matching member once created, so it is the owner's choice. -->
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded-full bg-barbi/10 border border-barbi/30 hover:bg-barbi/20"
                    title={$t('rikmaImport.holder.toggle')}
                    aria-label="{holderText(row)} · {$t('rikmaImport.holder.toggle')}"
                    disabled={!!result}
                    onclick={() => setEdit(row.key, 'holder', holderOf(row) === 'me' ? 'open' : 'me')}
                  >
                    {holderText(row)} ⇄
                  </button>
                {/if}
                {#if inside}
                  <span class="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">{$t('rikmaImport.row.partOf', { name: inside })}</span>
                {/if}
                {#if group === 'products' && recipeLabels(row).length}
                  <span class="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                    {$t('rikmaImport.row.madeOf', { names: recipeLabels(row).join(', ') })}
                  </span>
                {/if}
                {#if group === 'partners'}
                  <span>{row.spec?.email ?? $t('rikmaImport.partner.noEmail')}</span>
                {/if}
              </div>

              {#if !done && (group === 'products' || group === 'rikmaResources')}
                <label class="flex items-center gap-2 text-sm">
                  <span>{$t('rikmaImport.row.price')}</span>
                  <input
                    class="w-28 rounded-lg border border-barbi/30 p-1 bg-surface2 text-surfaceInk placeholder:text-surfaceMuted"
                    inputmode="decimal"
                    placeholder={$t('rikmaImport.row.priceOnRequest')}
                    value={edits[row.key]?.price ?? (row.spec?.price ?? '')}
                    disabled={!!result}
                    oninput={(e) => setEdit(row.key, 'price', e.currentTarget.value)}
                  />
                  {#if session.fields?.currency}<span>{session.fields.currency}</span>{/if}
                </label>
              {/if}

              {#if !done && group === 'products'}
                <label class="flex flex-col gap-1 text-sm">
                  <span>{$t('rikmaImport.row.keywords')}</span>
                  <input
                    class="rounded-lg border border-barbi/30 p-1 bg-surface2 text-surfaceInk"
                    value={edits[row.key]?.keywords ?? (row.spec?.keywords ?? []).join(', ')}
                    disabled={!!result}
                    oninput={(e) => setEdit(row.key, 'keywords', e.currentTarget.value)}
                  />
                  <span class="text-xs text-surfaceMuted">{$t('rikmaImport.row.keywordsHint')}</span>
                </label>
                <label class="flex flex-col gap-1 text-sm">
                  <span>{$t('rikmaImport.row.categories')}</span>
                  <input
                    class="rounded-lg border border-barbi/30 p-1 bg-surface2 text-surfaceInk"
                    value={edits[row.key]?.categories ?? (row.spec?.categories ?? []).join(', ')}
                    disabled={!!result}
                    oninput={(e) => setEdit(row.key, 'categories', e.currentTarget.value)}
                  />
                  <span class="text-xs text-surfaceMuted">{$t('rikmaImport.row.categoriesHint')}</span>
                </label>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/each}

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
        {#if inv.result === 'notRegistered' && result.projectId}
          <code class="text-xs break-all">https://www.1lev1.com/project/{result.projectId}/join</code>
        {/if}
      {/each}
      {#if result.proposals?.boards}
        <p class="text-sm text-surfaceInk">{$t('rikmaImport.result.proposals')}</p>
      {/if}
      {#if result.projectId}
        <div class="flex flex-wrap gap-3 mt-2">
          <a class="underline font-semibold text-surfaceInk" href="/moach/{result.projectId}">{$t('rikmaImport.result.openRikma')}</a>
          {#if result.proposals?.boards}
            <a class="underline text-surfaceInk" href="/moach/{result.projectId}/create">{$t('rikmaImport.result.openBoards')}</a>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <footer class="sticky bottom-0 flex items-center justify-between gap-3 rounded-2xl border border-barbi/40 bg-surface p-3">
      <span class="text-sm">{$t('rikmaImport.selectedCount', { count: selectedCount })}</span>
      <!-- The label is inherited text on the gold ramp, which stays pale in every mode: --ramp-ink. -->
      <Button
        class="text-[color:var(--ramp-ink,#16131b)]"
        onClick={create}
        disabled={busy || selectedCount === 0}
        loading={busy}
      >
        {busy ? $t('rikmaImport.creating') : $t('rikmaImport.submit', { count: selectedCount })}
      </Button>
    </footer>
  {/if}
</section>
