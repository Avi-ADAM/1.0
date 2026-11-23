<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '$lib/translations';
  import { errorKey, runGrowth } from '$lib/growth/client';
  import { GROWTH_LANGS, SOURCE_KINDS, type Prospect } from '$lib/growth/types';

  /** Add a business by hand, or edit one (`prospect` given). */
  let { prospect = null, ondone }: { prospect?: Prospect | null; ondone?: () => void } = $props();

  const init = () => ({
    name: prospect?.name ?? '',
    website: prospect?.website ?? '',
    email: prospect?.email ?? '',
    phone: prospect?.phone ?? '',
    country: prospect?.country ?? '',
    city: prospect?.city ?? '',
    region: prospect?.region ?? '',
    category: prospect?.category ?? '',
    services: (prospect?.services ?? []).join(', '),
    keywords: (prospect?.keywords ?? []).join(', '),
    size: prospect?.size ?? '',
    notes: prospect?.notes ?? '',
    lang: prospect?.lang ?? 'he',
    sourceKind: 'manual',
    sourceLabel: '',
    sourceUrl: ''
  });
  let f = $state(init());
  let busy = $state(false);
  let err = $state<string | null>(null);
  let dup = $state<{ id: string } | null>(null);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    err = null;
    dup = null;
    const r = await runGrowth<{ id: string; duplicated?: boolean }>('growthSaveProspect', {
      ...(prospect ? { id: prospect.id } : {}),
      prospect: { ...f }
    });
    busy = false;
    if (r.ok === false) {
      const failed = r as Extract<typeof r, { ok: false }>;
      err = failed.code;
      if (failed.code === 'DUPLICATE' && failed.details?.id) dup = { id: String(failed.details.id) };
      return;
    }
    if (r.data.duplicated) {
      dup = { id: r.data.id };
      err = 'DUPLICATE';
      return;
    }
    if (prospect) ondone?.();
    else goto(`/growth/b/${r.data.id}`);
  }
</script>

<form class="gr-form" onsubmit={submit}>
  <label class="sh-field gr-wide">
    {$t('growth.form.name')} *
    <input class="sh-input" bind:value={f.name} required maxlength="120" />
  </label>
  <label class="sh-field">
    {$t('growth.form.website')}
    <input class="sh-input" bind:value={f.website} inputmode="url" placeholder="https://" dir="ltr" />
  </label>
  <label class="sh-field">
    {$t('growth.form.category')}
    <input class="sh-input" bind:value={f.category} maxlength="120" />
  </label>
  <label class="sh-field">
    {$t('growth.form.email')}
    <input class="sh-input" bind:value={f.email} type="email" dir="ltr" />
  </label>
  <label class="sh-field">
    {$t('growth.form.phone')}
    <input class="sh-input" bind:value={f.phone} type="tel" dir="ltr" />
  </label>
  <label class="sh-field">
    {$t('growth.form.country')}
    <input class="sh-input" bind:value={f.country} />
  </label>
  <label class="sh-field">
    {$t('growth.form.city')}
    <input class="sh-input" bind:value={f.city} />
  </label>
  <label class="sh-field">
    {$t('growth.form.region')}
    <input class="sh-input" bind:value={f.region} />
  </label>
  <label class="sh-field">
    {$t('growth.form.size')}
    <input class="sh-input" bind:value={f.size} maxlength="40" />
  </label>
  <label class="sh-field gr-wide">
    {$t('growth.form.services')}
    <input class="sh-input" bind:value={f.services} placeholder={$t('growth.form.listHint')} />
  </label>
  <label class="sh-field gr-wide">
    {$t('growth.form.keywords')}
    <input class="sh-input" bind:value={f.keywords} placeholder={$t('growth.form.listHint')} />
  </label>
  <label class="sh-field gr-wide">
    {$t('growth.form.notes')}
    <textarea class="sh-input gr-textarea" bind:value={f.notes} maxlength="2000"></textarea>
  </label>
  <label class="sh-field">
    {$t('growth.form.lang')}
    <select class="sh-input" bind:value={f.lang}>
      {#each GROWTH_LANGS as l (l)}<option value={l}>{$t(`growth.lang.${l}`)}</option>{/each}
    </select>
  </label>
  <label class="sh-field">
    {$t('growth.form.sourceKind')}
    <select class="sh-input" bind:value={f.sourceKind}>
      {#each SOURCE_KINDS.filter((k) => k !== 'csv') as k (k)}<option value={k}>{$t(`growth.source.${k}`)}</option>{/each}
    </select>
  </label>
  <label class="sh-field">
    {$t('growth.form.sourceLabel')}
    <input class="sh-input" bind:value={f.sourceLabel} maxlength="200" />
  </label>
  <label class="sh-field">
    {$t('growth.form.sourceUrl')}
    <input class="sh-input" bind:value={f.sourceUrl} inputmode="url" dir="ltr" />
  </label>
  <p class="gr-muted gr-wide">{$t('growth.form.sourceRule')}</p>
  <div class="gr-row gr-wide">
    <button class="sh-btn sh-btn-primary" disabled={busy || !f.name.trim()}>
      {prospect ? $t('growth.form.save') : $t('growth.form.add')}
    </button>
    {#if prospect}
      <button type="button" class="sh-btn sh-btn-quiet" onclick={() => ondone?.()}>{$t('growth.common.cancel')}</button>
    {/if}
    {#if err}
      <span class="gr-error" role="alert">
        {$t(errorKey(err))}
        {#if dup}<a href="/growth/b/{dup.id}">{$t('growth.form.openExisting')}</a>{/if}
      </span>
    {/if}
  </div>
</form>
