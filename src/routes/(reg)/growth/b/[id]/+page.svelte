<script lang="ts">
  import { t } from '$lib/translations';
  import { errorKey, runGrowth } from '$lib/growth/client';
  import { STAGES, type Stage } from '$lib/growth/stages';
  import type { Prospect } from '$lib/growth/types';
  import StageChip from '$lib/components/growth/StageChip.svelte';
  import SourceBadge from '$lib/components/growth/SourceBadge.svelte';
  import ProspectForm from '$lib/components/growth/ProspectForm.svelte';
  import ResearchPanel from '$lib/components/growth/ResearchPanel.svelte';
  import ProfilePanel from '$lib/components/growth/ProfilePanel.svelte';
  import OutreachPanel from '$lib/components/growth/OutreachPanel.svelte';
  import ActivityPanel from '$lib/components/growth/ActivityPanel.svelte';

  let { data } = $props();
  let p = $derived<Prospect>(data.prospect);
  let editing = $state(false);
  let nextStage = $state<Stage | ''>('');
  let reason = $state('');
  let busy = $state(false);
  let err = $state<string | null>(null);

  const FIELDS = ['website', 'email', 'phone', 'category', 'city', 'region', 'country', 'size'] as const;

  async function changeStage() {
    if (!nextStage) return;
    if (nextStage === 'doNotContact' && !confirm($t('growth.response.dncConfirm'))) return;
    busy = true;
    err = null;
    const r = await runGrowth('growthSetStage', { id: p.id, stage: nextStage, reason });
    busy = false;
    if (r.ok) {
      nextStage = '';
      reason = '';
    } else err = (r as Extract<typeof r, { ok: false }>).code;
  }
</script>

<svelte:head><title>{p.name} · {$t('growth.title')}</title></svelte:head>

{#key p.id}
  <header class="sh-card gr-card">
    <div class="gr-between">
      <div>
        <a class="gr-small" href="/growth/pipeline">← {$t('growth.nav.pipeline')}</a>
        <h2 style="font-size:22px">{p.name}</h2>
      </div>
      <StageChip stage={p.stage} />
    </div>
    <div class="gr-row">
      <select class="sh-input" bind:value={nextStage} aria-label={$t('growth.detail.changeStage')}>
        <option value="">{$t('growth.detail.changeStage')}</option>
        {#each STAGES.filter((s) => s !== p.stage) as s (s)}<option value={s}>{$t(`growth.stage.${s}`)}</option>{/each}
      </select>
      {#if nextStage}
        <input
          class="sh-input"
          bind:value={reason}
          placeholder={p.stage === 'doNotContact' ? $t('growth.detail.reasonRequired') : $t('growth.common.noteOptional')}
        />
        <button class="sh-btn sh-btn-quiet" onclick={changeStage} disabled={busy}>{$t('growth.detail.apply')}</button>
      {/if}
    </div>
    {#if err}<p class="gr-error" role="alert">{$t(errorKey(err))}</p>{/if}
  </header>

  <div class="gr-cols gr-cols-3">
    <!-- 1. Business intelligence -->
    <div class="gr-cols" style="grid-template-columns:1fr;align-content:start">
      <section class="sh-card gr-card" aria-labelledby="gr-record-h">
        <div class="gr-between">
          <h2 id="gr-record-h">{$t('growth.detail.record')}</h2>
          {#if !editing}<button class="sh-btn sh-btn-quiet" onclick={() => (editing = true)}>{$t('growth.profile.edit')}</button>{/if}
        </div>
        {#if editing}
          <ProspectForm prospect={p} ondone={() => (editing = false)} />
        {:else}
          <ul class="gr-list">
            {#each FIELDS as f (f)}
              {#if p[f]}
                <li>
                  <span class="gr-muted">{$t(`growth.form.${f}`)}:</span>
                  {#if f === 'website'}
                    <a class="gr-link" href={p.website} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">{p.website}</a>
                  {:else}
                    <span dir={f === 'email' || f === 'phone' ? 'ltr' : 'auto'}>{p[f]}</span>
                  {/if}
                  <div><SourceBadge source={p.fieldSources[f]} /></div>
                </li>
              {/if}
            {/each}
            {#if p.services.length}<li><span class="gr-muted">{$t('growth.form.services')}:</span> {p.services.join(', ')}</li>{/if}
            {#if p.keywords.length}<li><span class="gr-muted">{$t('growth.form.keywords')}:</span> {p.keywords.join(', ')}</li>{/if}
            {#if p.notes}<li><span class="gr-muted">{$t('growth.form.notes')}:</span> <span dir="auto">{p.notes}</span></li>{/if}
          </ul>
          <p class="sh-section-label">{$t('growth.detail.sources')}</p>
          <ul class="gr-list">{#each p.sources as s, i (i)}<li><SourceBadge source={s} /></li>{/each}</ul>
        {/if}
      </section>
      <ResearchPanel prospect={p} />
    </div>

    <!-- 2. Proposed profile -->
    <ProfilePanel prospect={p} />

    <!-- 3. Outreach and onboarding -->
    <div class="gr-cols" style="grid-template-columns:1fr;align-content:start">
      <OutreachPanel prospect={p} phoneDigits={data.phoneDigits} />
      <ActivityPanel prospect={p} uid={data.uid} />
    </div>
  </div>
{/key}
