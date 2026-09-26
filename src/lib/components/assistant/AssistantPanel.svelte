<script>
  /**
   * One living list, edited in words or with a tap (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md
   * §3, §6, §7, §11): a member's profile, or a wish's breakdown.
   *
   * The same session an agent edits over MCP: every change is an op the server
   * applies, the version guards against two hands at once, and a change made
   * "through Claude" says so. Nothing here deletes anything — "not now" is a
   * reversible mark — and what may be saved from here is exactly what the plan
   * allows: the profile, and my own rows of my wish. A row a supplier already
   * answered is locked, with the way to them on the site.
   */
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { onMount, untrack } from 'svelte';

  /**
   * @typedef {{ key: string, group: string, label: string, status: string, why?: string,
   *   spec?: Record<string, any>, committed?: object, createdRef?: object }} Row
   * @typedef {{ sessionId: string, kind: 'profile'|'wish', version: number, items: Row[],
   *   questions?: string[], recent?: { via: string, instruction?: string, say?: string }[],
   *   suggestions?: { offers: any[], nearby: any[] }, siteUrl?: string }} Session
   */

  /** @type {{ session: Session, onApplied?: (s: Session) => void }} */
  let { session: initial, onApplied } = $props();

  // The panel owns the live copy from here on; the prop is only the start.
  let session = $state(/** @type {Session} */ (untrack(() => $state.snapshot(initial))));
  let busy = $state(false);
  let text = $state('');
  let said = $state('');
  let error = $state('');
  let notice = $state('');
  /** @type {Record<string, string>} */
  let adding = $state({});

  const GROUPS = {
    profile: ['skills', 'roles', 'methods', 'vallues', 'resources'],
    wish: ['wishMissions', 'wishResources']
  };
  let groups = $derived(
    (GROUPS[session.kind] ?? []).map((g) => ({ group: g, rows: session.items.filter((r) => r.group === g) }))
  );
  let viaAgent = $derived((session.recent ?? []).some((r) => r.via === 'agent'));

  /** @param {any} res */
  function take(res) {
    if (!res?.success) {
      error = res?.error?.message || $t('assistant.error');
      return false;
    }
    const d = res.data?.session ?? res.data;
    if (d?.conflict) notice = $t('assistant.conflict');
    if (d?.items) session = { ...session, ...d };
    return true;
  }

  async function ops(/** @type {any[]} */ list) {
    if (busy || !list.length) return;
    busy = true;
    error = '';
    notice = '';
    take(await executeAction('setAssistantItems', { sessionId: session.sessionId, ops: list, expectedVersion: session.version, via: 'site' }, { showErrorToast: false }));
    busy = false;
  }

  async function revise() {
    const instruction = text.trim();
    if (busy || !instruction) return;
    busy = true;
    error = '';
    notice = '';
    const res = await executeAction(
      'reviseAssistantSession',
      { sessionId: session.sessionId, instruction, expectedVersion: session.version, via: 'site' },
      { showErrorToast: false }
    );
    if (take(res)) {
      said = res.data?.say ?? '';
      text = '';
    }
    busy = false;
  }

  async function undo() {
    if (busy) return;
    busy = true;
    error = '';
    take(await executeAction('undoAssistantRevision', { sessionId: session.sessionId, expectedVersion: session.version, via: 'site' }, { showErrorToast: false }));
    busy = false;
  }

  async function apply() {
    if (busy) return;
    busy = true;
    error = '';
    notice = '';
    const res = await executeAction('applyAssistantSession', { sessionId: session.sessionId, expectedVersion: session.version, via: 'site' }, { showErrorToast: false });
    if (take(res)) {
      notice = res.data?.applied ? $t(`assistant.saved.${session.kind}`) : $t('assistant.nothingToSave');
      if (res.data?.keptBecauseAnswered) notice += ' ' + $t('assistant.keptAnswered', { count: res.data.keptBecauseAnswered });
      onApplied?.(session);
    }
    busy = false;
  }

  function add(/** @type {string} */ group) {
    const label = (adding[group] ?? '').trim();
    if (!label) return;
    adding[group] = '';
    ops([{ op: 'add', group, label }]);
  }

  /** Someone else (their agent) may have changed it meanwhile. */
  async function sync() {
    if (busy) return;
    const res = await executeAction('getAssistantSession', { sessionId: session.sessionId, withSuggestions: false }, { showErrorToast: false });
    const s = res?.success ? res.data?.session : null;
    if (s && s.version !== session.version) {
      session = { ...session, ...s };
      notice = $t('assistant.updatedElsewhere');
    }
  }

  onMount(() => {
    const onFocus = () => sync();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  });

  const locked = (/** @type {Row} */ r) => !!r.committed || !!r.createdRef;
</script>

<section class="assistant-panel flex flex-col gap-4" dir="auto">
  {#if viaAgent}
    <p class="text-xs self-start px-2 py-0.5 rounded-full bg-barbi/10 border border-barbi/30">{$t('assistant.viaAgent')}</p>
  {/if}

  {#each groups as { group, rows } (group)}
    <div class="rounded-2xl border border-barbi/30 p-3 bg-white/70">
      <h3 class="font-semibold mb-2">{$t(`assistant.groups.${group}`)}</h3>
      <ul class="flex flex-wrap gap-2">
        {#each rows as r (r.key)}
          <li
            class="chip {r.status}"
            title={r.why ?? ''}
          >
            <span>{r.label}</span>
            {#if locked(r)}
              <span class="text-xs" title={$t('assistant.lockedHint')}>🔒 {$t('assistant.locked')}</span>
            {:else if r.status === 'dropped'}
              <button type="button" class="mini" disabled={busy} onclick={() => ops([{ op: 'restore', key: r.key }])}>{$t('assistant.restore')}</button>
            {:else}
              {#if r.status === 'proposed'}
                <button type="button" class="mini" aria-label="{$t('assistant.keep')} {r.label}" disabled={busy} onclick={() => ops([{ op: 'keep', key: r.key }])}>✓</button>
              {/if}
              <button type="button" class="mini" aria-label="{$t('assistant.notNow')} {r.label}" disabled={busy} onclick={() => ops([{ op: 'drop', key: r.key }])}>{$t('assistant.notNow')}</button>
            {/if}
          </li>
        {/each}
      </ul>
      <form class="flex gap-2 mt-2" onsubmit={(e) => (e.preventDefault(), add(group))}>
        <input
          class="flex-1 rounded-lg border border-barbi/30 p-1 text-sm bg-white"
          placeholder={$t('assistant.addPlaceholder')}
          aria-label="{$t('assistant.add')} · {$t(`assistant.groups.${group}`)}"
          bind:value={adding[group]}
        />
        <button type="submit" class="mini" disabled={busy}>{$t('assistant.add')}</button>
      </form>
    </div>
  {/each}

  <div class="rounded-2xl border border-barbi/40 p-3 bg-white/80 flex flex-col gap-2">
    <label class="text-sm font-semibold" for="assistant-say">{$t('assistant.sayLabel')}</label>
    <textarea id="assistant-say" rows="2" class="rounded-lg border border-barbi/30 p-2 text-sm" placeholder={$t('assistant.sayPlaceholder')} bind:value={text}></textarea>
    <div class="flex flex-wrap gap-2 items-center">
      <button type="button" class="btn" disabled={busy || !text.trim()} onclick={revise}>{busy ? $t('assistant.working') : $t('assistant.send')}</button>
      <button type="button" class="underline text-sm" disabled={busy || !(session.recent ?? []).length} onclick={undo}>{$t('assistant.undo')}</button>
    </div>
    {#if said}<p class="text-sm" role="status">💬 {said}</p>{/if}
    {#each session.questions ?? [] as q, i (i)}<p class="text-sm italic">❓ {q}</p>{/each}
  </div>

  {#if error}<p class="rounded-xl border border-red-300 bg-red-50 p-2 text-sm" role="alert">{error}</p>{/if}
  {#if notice}<p class="rounded-xl border border-green-300 bg-green-50 p-2 text-sm" role="status">{notice}</p>{/if}

  <div class="flex flex-wrap gap-3 items-center">
    <button type="button" class="btn" disabled={busy} onclick={apply}>{$t(`assistant.apply.${session.kind}`)}</button>
    {#if session.kind === 'wish' && session.siteUrl}
      <span class="text-xs">{$t('assistant.publishOnSite')}</span>
    {/if}
  </div>

  {#if session.kind === 'profile' && session.suggestions}
    {#if session.suggestions.offers?.length}
      <div class="rounded-2xl border border-gold/40 p-3 bg-white/70">
        <h3 class="font-semibold mb-2">{$t('assistant.offers.title')}</h3>
        <ul class="flex flex-col gap-1 text-sm">
          {#each session.suggestions.offers as o (o.openMissionId)}
            <li><a class="underline" href="/lev">{o.name}</a>{#if o.projectName} · {o.projectName}{/if}</li>
          {/each}
        </ul>
      </div>
    {/if}
    {#if session.suggestions.nearby?.length}
      <div class="rounded-2xl border border-gold/40 p-3 bg-white/70">
        <h3 class="font-semibold mb-1">{$t('assistant.nearby.title')}</h3>
        <p class="text-xs mb-2">{$t('assistant.nearby.sub')}</p>
        <ul class="flex flex-col gap-2 text-sm">
          {#each session.suggestions.nearby as n (n.id)}
            <li class="flex flex-wrap items-center gap-2">
              <strong>{n.name}</strong>
              {#if n.sharedValues.length}<span class="text-xs">{$t('assistant.nearby.values', { names: n.sharedValues.join(', ') })}</span>{/if}
              {#if n.sharedSkills.length}<span class="text-xs">{$t('assistant.nearby.skills', { names: n.sharedSkills.join(', ') })}</span>{/if}
              <a class="underline" href="/project/{n.id}/join">{$t('assistant.nearby.offerMyself')}</a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</section>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    border: 1px solid rgba(255, 0, 174, 0.35);
    background: #fff;
    font-size: 0.85rem;
    color: #16131b;
  }
  .chip.applied,
  .chip.kept {
    border-color: #16a34a;
    background: #f0fdf4;
  }
  .chip.dropped {
    opacity: 0.55;
    text-decoration: line-through;
  }
  .mini {
    font-size: 0.75rem;
    padding: 0 0.35rem;
    border-radius: 9999px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    background: rgba(255, 255, 255, 0.9);
  }
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    color: #fff;
    font-weight: 700;
  }
  .btn:disabled {
    opacity: 0.6;
  }
  .border-gold\/40 {
    border-color: rgba(255, 215, 0, 0.4);
  }
</style>
