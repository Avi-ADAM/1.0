<script lang="ts">
  import { t } from '$lib/translations';
  import { errorKey, runGrowth } from '$lib/growth/client';
  import { originCounts, PROFILE_LIST_FIELDS, PROFILE_TEXT_FIELDS } from '$lib/growth/profile';
  import type { Prospect } from '$lib/growth/types';
  import OriginBadge from './OriginBadge.svelte';

  /**
   * The proposed 1💗1 profile (§5): every field editable, every field saying
   * whether it is verified, the agent's suggestion, or the operator's edit —
   * and a preview of how the owner will first see it. Approving it here is the
   * operator's approval to show it to the owner; it publishes nothing.
   */
  let { prospect }: { prospect: Prospect } = $props();
  let d = $derived(prospect.profile);
  let editing = $state(false);
  let draft = $state<Record<string, string>>({});
  let busy = $state(false);
  let err = $state<string | null>(null);
  let counts = $derived(d ? originCounts(d) : null);

  function startEdit() {
    if (!d) return;
    const next: Record<string, string> = {};
    for (const k of PROFILE_TEXT_FIELDS) next[k] = d[k].value;
    for (const k of PROFILE_LIST_FIELDS) next[k] = d[k].value.join('\n');
    draft = next;
    editing = true;
  }

  async function call(params: Record<string, unknown>) {
    busy = true;
    err = null;
    const r = await runGrowth('growthProfile', { id: prospect.id, ...params });
    busy = false;
    if (r.ok === false) err = (r as Extract<typeof r, { ok: false }>).code;
    return r.ok;
  }

  async function saveEdit() {
    const patch: Record<string, unknown> = {};
    for (const k of PROFILE_TEXT_FIELDS) patch[k] = draft[k];
    for (const k of PROFILE_LIST_FIELDS) patch[k] = draft[k].split('\n');
    if (await call({ mode: 'edit', patch })) editing = false;
  }
</script>

<section class="gr-card sh-card" aria-labelledby="gr-profile-h">
  <div class="gr-between">
    <h2 id="gr-profile-h">{$t('growth.profile.title')}</h2>
    {#if d?.approvedAt}<span class="sh-chip sh-chip-ok">{$t('growth.profile.approved')}</span>{/if}
  </div>
  {#if err}<p class="gr-error" role="alert">{$t(errorKey(err))}</p>{/if}

  {#if !d}
    <p class="gr-muted">{prospect.research ? $t('growth.profile.emptyResearched') : $t('growth.profile.emptyNoResearch')}</p>
    <div class="gr-row">
      <button class="sh-btn sh-btn-primary" onclick={() => call({ mode: 'generate' })} disabled={busy || prospect.stage === 'doNotContact'}>
        {$t('growth.profile.generate')}
      </button>
    </div>
  {:else if editing}
    <div class="gr-form">
      {#each PROFILE_TEXT_FIELDS as k (k)}
        <label class="sh-field gr-wide">
          <span class="gr-row">{$t(`growth.profile.f.${k}`)} <OriginBadge origin={d[k].origin} /></span>
          {#if k === 'description'}
            <textarea class="sh-input gr-textarea" bind:value={draft[k]} dir="auto"></textarea>
          {:else}
            <input class="sh-input" bind:value={draft[k]} dir={k === 'website' ? 'ltr' : 'auto'} />
          {/if}
        </label>
      {/each}
      {#each PROFILE_LIST_FIELDS as k (k)}
        <label class="sh-field">
          <span class="gr-row">{$t(`growth.profile.f.${k}`)} <OriginBadge origin={d[k].origin} /></span>
          <textarea class="sh-input gr-textarea" bind:value={draft[k]} placeholder={$t('growth.profile.onePerLine')} dir="auto"></textarea>
        </label>
      {/each}
    </div>
    <p class="gr-muted gr-small">{$t('growth.profile.editRule')}</p>
    <div class="gr-row">
      <button class="sh-btn sh-btn-primary" onclick={saveEdit} disabled={busy}>{$t('growth.form.save')}</button>
      <button class="sh-btn sh-btn-quiet" onclick={() => (editing = false)}>{$t('growth.common.cancel')}</button>
    </div>
  {:else}
    {#if counts}
      <p class="gr-row gr-small">
        <OriginBadge origin="verified" /> {counts.verified}
        <OriginBadge origin="suggested" /> {counts.suggested}
        <OriginBadge origin="edited" /> {counts.edited}
      </p>
    {/if}

    <p class="sh-section-label">{$t('growth.profile.preview')}</p>
    <!-- dir-ok: a preview of the business profile in the language it was written in -->
    <article class="gr-preview" dir="auto">
      <div class="gr-between"><h3>{d.title.value}</h3><OriginBadge origin={d.title.origin} /></div>
      {#if d.categories.value.length}
        <div class="gr-row">{#each d.categories.value as c (c)}<span class="sh-chip sh-chip-gold">{c}</span>{/each}<OriginBadge origin={d.categories.origin} /></div>
      {/if}
      {#if d.description.value}<p>{d.description.value} <OriginBadge origin={d.description.origin} /></p>{/if}
      {#if d.coverage.value}<p class="gr-small">📍 {d.coverage.value} <OriginBadge origin={d.coverage.origin} /></p>{/if}
      {#each ['services', 'products', 'capabilities'] as const as k (k)}
        {#if d[k].value.length}
          <div>
            <p class="sh-section-label gr-row">{$t(`growth.profile.f.${k}`)} <OriginBadge origin={d[k].origin} /></p>
            <ul class="gr-list">{#each d[k].value as s (s)}<li>• {s}</li>{/each}</ul>
          </div>
        {/if}
      {/each}
      {#if d.keywords.value.length}
        <div class="gr-row gr-small">{#each d.keywords.value as k (k)}<span class="sh-chip sh-chip-muted">{k}</span>{/each}<OriginBadge origin={d.keywords.origin} /></div>
      {/if}
      {#if d.website.value || d.social.value.length}
        <div class="gr-row gr-small">
          {#each [d.website.value, ...d.social.value].filter(Boolean) as u (u)}
            <a class="gr-link" href={u} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">{u}</a>
          {/each}
        </div>
      {/if}
    </article>
    <p class="gr-muted gr-small">{$t('growth.profile.previewRule')}</p>

    <div class="gr-row">
      <button class="sh-btn sh-btn-quiet" onclick={startEdit} disabled={busy}>{$t('growth.profile.edit')}</button>
      {#if !d.approvedAt}
        <button class="sh-btn sh-btn-primary" onclick={() => call({ mode: 'approve' })} disabled={busy || !d.title.value}>
          {$t('growth.profile.approve')}
        </button>
      {/if}
      <button
        class="sh-btn sh-btn-quiet"
        onclick={() => confirm($t('growth.profile.regenerateConfirm')) && call({ mode: 'generate' })}
        disabled={busy}>{$t('growth.profile.regenerate')}</button
      >
    </div>
    {#if !d.approvedAt}<p class="gr-muted gr-small">{$t('growth.profile.approveRule')}</p>{/if}
  {/if}
</section>
