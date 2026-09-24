<script>
  /**
   * The one prefilled approval screen of a rikma import
   * (docs/PLAN_AI_SIGNUP_CONCIERGE.md §4.5).
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
  /** @type {Record<string, { label?: string, price?: string, keywords?: string }>} */
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

  function holderText(/** @type {Row} */ row) {
    const h = row.spec?.holder;
    if (h === 'me') return $t('rikmaImport.holder.me');
    if (h === 'partner') {
      const partner = byKey.get(row.spec?.partnerKey);
      return $t('rikmaImport.holder.partner', { name: partner?.label ?? '' });
    }
    return $t('rikmaImport.holder.open');
  }

  /** Record one inline fix; a fresh object each time so the edit stays reactive. */
  function setEdit(/** @type {string} */ key, /** @type {'label'|'price'|'keywords'} */ field, /** @type {string} */ value) {
    edits[key] = { ...(edits[key] ?? {}), [field]: value };
  }

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
        const words = e.keywords
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean);
        spec.keywords = words.length ? words : null;
      }
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

  /** @param {{ key: string, result: string }} inv */
  function inviteText(inv) {
    const name = byKey.get(inv.key)?.label ?? '';
    const known = ['invited', 'notRegistered', 'pendingVote', 'noEmail'];
    return $t(`rikmaImport.invite.${known.includes(inv.result) ? inv.result : 'other'}`, { name });
  }
</script>

<section class="blueprint-review mx-auto max-w-3xl p-4 flex flex-col gap-4 text-[color:var(--ramp-ink,#16131b)]">
  <header class="flex flex-col gap-1">
    <div class="flex flex-wrap items-center gap-2">
      <h1 class="text-2xl font-bold">{$t('rikmaImport.title')}</h1>
      {#if session.fields?.track}
        <span class="text-xs px-2 py-0.5 rounded-full bg-barbi/15">{$t(`rikmaImport.track.${session.fields.track}`)}</span>
      {/if}
    </div>
    <p class="text-sm">
      {isNew
        ? $t('rikmaImport.subtitleNew')
        : $t('rikmaImport.subtitleExisting', { name: session.projectName ?? '' })}
    </p>
  </header>

  {#if isNew}
    <label class="flex flex-col gap-1 text-sm">
      <span class="font-semibold">{$t('rikmaImport.field.name')}</span>
      <input class="rounded-xl border border-barbi/40 p-2 bg-white/80" bind:value={rikmaName} disabled={!!result} />
    </label>
    {#if session.fields?.publicDescription}
      <p class="text-sm italic">{session.fields.publicDescription}</p>
    {/if}
  {/if}

  {#each grouped as { group, rows } (group)}
    <div class="rounded-2xl border border-barbi/40 p-4 bg-white/60">
      <h2 class="text-lg font-semibold mb-3">{$t(`rikmaImport.groups.${group}`)}</h2>
      <ul class="flex flex-col gap-3">
        {#each rows as row (row.key)}
          {@const done = isDone(row)}
          {@const inside = !done && selected[row.key] ? partOf(row) : null}
          <li
            class="rounded-xl border p-3 flex gap-3 {done
              ? 'border-green-300 bg-green-50'
              : selected[row.key]
                ? 'border-barbi/40 bg-white/80'
                : 'border-gray-200 bg-white/40 opacity-70'}"
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
                <p class="font-semibold">{row.label} <span class="text-xs text-green-800">✓ {$t('rikmaImport.row.created')}</span></p>
              {:else}
                <input
                  class="font-semibold rounded-lg border border-transparent hover:border-barbi/30 focus:border-barbi/60 p-1 bg-transparent"
                  aria-label={$t('rikmaImport.row.name')}
                  value={edits[row.key]?.label ?? row.label}
                  disabled={!!result}
                  oninput={(e) => setEdit(row.key, 'label', e.currentTarget.value)}
                />
              {/if}

              {#if row.why}
                <p class="text-xs italic">{row.why}</p>
              {/if}

              <div class="flex flex-wrap items-center gap-2 text-xs">
                {#if row.status === 'dropped' && !done}
                  <span class="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300">{$t('rikmaImport.row.notNow')}</span>
                {/if}
                {#if group === 'rikmaMissions' || group === 'rikmaResources'}
                  <span class="px-2 py-0.5 rounded-full bg-barbi/10">{holderText(row)}</span>
                {/if}
                {#if inside}
                  <span class="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">{$t('rikmaImport.row.partOf', { name: inside })}</span>
                {/if}
                {#if group === 'products' && recipeLabels(row).length}
                  <span class="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
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
                    class="w-28 rounded-lg border border-barbi/30 p-1 bg-white/80"
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
                    class="rounded-lg border border-barbi/30 p-1 bg-white/80"
                    value={edits[row.key]?.keywords ?? (row.spec?.keywords ?? []).join(', ')}
                    disabled={!!result}
                    oninput={(e) => setEdit(row.key, 'keywords', e.currentTarget.value)}
                  />
                  <span class="text-xs">{$t('rikmaImport.row.keywordsHint')}</span>
                </label>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/each}

  {#if error}
    <p class="rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">{error}</p>
  {/if}

  {#if result}
    <div class="rounded-2xl border border-green-300 bg-green-50 p-4 flex flex-col gap-2" role="status">
      <h2 class="text-lg font-semibold">{$t('rikmaImport.result.title')}</h2>
      <p class="text-sm">{$t('rikmaImport.result.created', { count: result.created?.length ?? 0 })}</p>
      {#if result.failed?.length}
        <p class="text-sm font-semibold">{$t('rikmaImport.result.failed')}</p>
        <ul class="list-disc list-inside text-sm">
          {#each result.failed as f (f.key)}
            <li>{byKey.get(f.key)?.label ?? f.key}: {f.message}</li>
          {/each}
        </ul>
      {/if}
      {#each result.invites ?? [] as inv (inv.key)}
        <p class="text-sm">{inviteText(inv)}</p>
        {#if inv.result === 'notRegistered' && result.projectId}
          <code class="text-xs break-all">https://www.1lev1.com/project/{result.projectId}/join</code>
        {/if}
      {/each}
      {#if result.proposals?.boards}
        <p class="text-sm">{$t('rikmaImport.result.proposals')}</p>
      {/if}
      {#if result.projectId}
        <div class="flex flex-wrap gap-3 mt-2">
          <a class="underline font-semibold" href="/moach/{result.projectId}">{$t('rikmaImport.result.openRikma')}</a>
          {#if result.proposals?.boards}
            <a class="underline" href="/moach/{result.projectId}/create">{$t('rikmaImport.result.openBoards')}</a>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <footer class="sticky bottom-0 flex items-center justify-between gap-3 rounded-2xl border border-barbi/40 bg-white/90 p-3">
      <span class="text-sm">{$t('rikmaImport.selectedCount', { count: selectedCount })}</span>
      <Button onClick={create} disabled={busy || selectedCount === 0} loading={busy}>
        {busy ? $t('rikmaImport.creating') : $t('rikmaImport.submit', { count: selectedCount })}
      </Button>
    </footer>
  {/if}
</section>
