<script lang="ts">
  import { locale, t } from '$lib/translations';
  import { errorKey, runGrowth } from '$lib/growth/client';
  import type { Claim, Prospect } from '$lib/growth/types';

  /**
   * Business intelligence (§4). Every claim shows whether its evidence was
   * found in the page that was read, and the interpretive answers are framed
   * as the agent's suggestions. Contact details found on the site are offered,
   * never filled in by themselves.
   */
  let { prospect }: { prospect: Prospect } = $props();
  let r = $derived(prospect.research);
  let busy = $state(false);
  let err = $state<string | null>(null);

  async function research() {
    busy = true;
    err = null;
    const lang = ['he', 'en', 'ar'].includes($locale) ? $locale : prospect.lang;
    const res = await runGrowth('growthResearch', { id: prospect.id, lang });
    busy = false;
    if (res.ok === false) err = (res as Extract<typeof res, { ok: false }>).code;
  }

  /** Adopt a contact the research found, with the page as its source. */
  async function useContact(kind: 'email' | 'phone', value: string, url: string) {
    err = null;
    const p = prospect;
    const res = await runGrowth('growthSaveProspect', {
      id: p.id,
      prospect: {
        name: p.name,
        website: p.website,
        email: kind === 'email' ? value : p.email,
        phone: kind === 'phone' ? value : p.phone,
        country: p.country,
        city: p.city,
        region: p.region,
        category: p.category,
        services: p.services,
        keywords: p.keywords,
        size: p.size,
        notes: p.notes,
        lang: p.lang,
        sourceKind: 'website',
        sourceUrl: url
      }
    });
    if (res.ok === false) err = (res as Extract<typeof res, { ok: false }>).code;
  }

  const confTone = (c: string) => (c === 'high' ? 'sh-chip-ok' : c === 'medium' ? 'sh-chip-gold' : 'sh-chip-warn-soft');
</script>

{#snippet claim(c: Claim)}
  <div class="gr-claim">
    <div class="gr-between">
      <span>{c.text}</span>
      <span class="sh-chip gr-small {c.verified ? 'sh-chip-ok' : 'sh-chip-info'}">
        {c.verified ? $t('growth.research.verified') : $t('growth.research.unverified')}
      </span>
    </div>
    {#if c.evidence}<q dir="auto">{c.evidence}</q>{/if}
    {#if c.sourceUrl}<a class="gr-link gr-small" href={c.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{c.sourceUrl}</a>{/if}
  </div>
{/snippet}

<section class="gr-card sh-card" aria-labelledby="gr-research-h">
  <div class="gr-between">
    <h2 id="gr-research-h">{$t('growth.research.title')}</h2>
    <button class="sh-btn {r ? 'sh-btn-quiet' : 'sh-btn-primary'}" onclick={research} disabled={busy || prospect.stage === 'doNotContact'}>
      {busy ? $t('growth.research.running') : r ? $t('growth.research.rerun') : $t('growth.research.run')}
    </button>
  </div>
  {#if err}<p class="gr-error" role="alert">{$t(errorKey(err))}</p>{/if}

  {#if !r}
    <p class="gr-muted">{$t('growth.research.empty')}</p>
  {:else}
    <div class="gr-row">
      <span class="sh-chip {confTone(r.confidence)}">{$t('growth.research.confidence')}: {$t(`growth.confidence.${r.confidence}`)}</span>
      <span class="sh-chip sh-chip-muted">{$t(`growth.research.status.${r.status}`)}</span>
      <span class="gr-muted gr-small">{new Date(r.at).toLocaleString()}</span>
    </div>
    {#if r.sourceUrl}
      <p class="gr-small">{$t('growth.research.read')} <a class="gr-link" href={r.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{r.sourceUrl}</a></p>
    {/if}
    {#if r.problems.length}
      <ul class="gr-list gr-small">
        {#each r.problems as pr (pr)}<li class="gr-muted">⚠ {$t(`growth.problem.${pr.split(':')[0]}`)} <code dir="ltr">{pr}</code></li>{/each}
      </ul>
    {/if}

    {#if r.summary}<h3>{$t('growth.research.summary')}</h3>{@render claim(r.summary)}{/if}
    {#if r.services.length}
      <h3>{$t('growth.research.services')}</h3>
      {#each r.services as c, i (i)}{@render claim(c)}{/each}
    {/if}
    {#if r.products.length}
      <h3>{$t('growth.research.products')}</h3>
      {#each r.products as c, i (i)}{@render claim(c)}{/each}
    {/if}
    {#if r.coverage}<h3>{$t('growth.research.coverage')}</h3>{@render claim(r.coverage)}{/if}

    {#if r.contacts.length}
      <h3>{$t('growth.research.contacts')}</h3>
      <ul class="gr-list">
        {#each r.contacts as c (c.value)}
          {@const inUse = c.kind === 'email' ? prospect.email === c.value : prospect.phone === c.value}
          <li class="gr-between">
            <span dir="ltr">{c.value}</span>
            {#if inUse}
              <span class="sh-chip sh-chip-ok gr-small">{$t('growth.research.inUse')}</span>
            {:else}
              <button class="sh-btn sh-btn-quiet" onclick={() => useContact(c.kind, c.value, c.sourceUrl)}>{$t('growth.research.useContact')}</button>
            {/if}
          </li>
        {/each}
      </ul>
      <p class="gr-muted gr-small">{$t('growth.research.contactsRule')}</p>
    {/if}

    <div class="gr-ai">
      <p class="sh-section-label">{$t('growth.research.aiAnswers')}</p>
      {#if r.whyJoin}<h3>{$t('growth.research.whyJoin')}</h3><p dir="auto">{r.whyJoin}</p>{/if}
      {#if r.requestsFulfilled.length}
        <h3>{$t('growth.research.requests')}</h3>
        <ul class="gr-list">{#each r.requestsFulfilled as q (q)}<li dir="auto">“{q}”</li>{/each}</ul>
      {/if}
      {#if r.collaboration}<h3>{$t('growth.research.collaboration')}</h3><p dir="auto">{r.collaboration}</p>{/if}
      {#if r.complementary.length}
        <h3>{$t('growth.research.complementary')}</h3>
        <div class="gr-row">{#each r.complementary as c (c)}<span class="sh-chip sh-chip-plain">{c}</span>{/each}</div>
      {/if}
      {#if r.customers.length}
        <h3>{$t('growth.research.customers')}</h3>
        <div class="gr-row">{#each r.customers as c (c)}<span class="sh-chip sh-chip-muted">{c}</span>{/each}</div>
      {/if}
      {#if r.categories.length || r.keywords.length}
        <h3>{$t('growth.research.keywords')}</h3>
        <div class="gr-row">{#each [...r.categories, ...r.keywords] as c, i (i)}<span class="sh-chip sh-chip-muted">{c}</span>{/each}</div>
      {/if}
    </div>

    {#if r.missing.length}
      <h3>{$t('growth.research.missing')}</h3>
      <ul class="gr-list gr-small">
        {#each r.missing as m (m)}<li class="gr-muted">• {m.startsWith('missing:') ? $t(`growth.missing.${m.slice(8)}`) : m}</li>{/each}
      </ul>
    {/if}
  {/if}
</section>
