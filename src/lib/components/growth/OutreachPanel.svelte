<script lang="ts">
  import { untrack } from 'svelte';
  import { t } from '$lib/translations';
  import { errorKey, runGrowth } from '$lib/growth/client';
  import { fillLink, mailtoUrl, whatsappUrl } from '$lib/growth/outreach';
  import { isClosed } from '$lib/growth/stages';
  import {
    CONTACT_CHANNELS,
    GROWTH_LANGS,
    OUTREACH_KINDS,
    RESPONSE_KINDS,
    type ContactChannel,
    type GrowthLang,
    type OutreachKind,
    type Prospect,
    type ResponseKind
  } from '$lib/growth/types';
  import OriginBadge from './OriginBadge.svelte';

  /**
   * Outreach and onboarding (§6, §7). Draft → the operator edits and approves
   * one message → the owner's review link → the operator sends it from their
   * own WhatsApp or mail, and only then says so. Nothing on this panel sends.
   */
  let { prospect, phoneDigits }: { prospect: Prospect; phoneDigits: string | null } = $props();

  let closed = $derived(isClosed(prospect.stage));
  let o = $derived(prospect.outreach);
  // Chosen once per business (the page keys this panel by id); a refresh must not undo the operator's pick.
  let lang = $state<GrowthLang>(
    untrack(() => prospect.outreach?.approved?.lang ?? prospect.outreach?.variants[0]?.lang ?? prospect.lang)
  );
  let kind = $state<OutreachKind>('friendly');
  let subject = $state('');
  let body = $state('');
  let busy = $state(false);
  let err = $state<string | null>(null);
  let copied = $state(false);
  /** Set after the operator opened WhatsApp / mail: ask, never assume (§6.3). */
  let askedSent = $state<ContactChannel | null>(null);
  let channel = $state<ContactChannel>('whatsapp');
  let contactNote = $state('');
  let response = $state<ResponseKind>('interested');
  let responseNote = $state('');
  let followUpAt = $state(untrack(() => (prospect.followUpAt ? prospect.followUpAt.slice(0, 10) : '')));
  let nextAction = $state(untrack(() => prospect.nextAction ?? ''));

  /** Load the chosen variant into the editor (the approved one when it is that kind). */
  function load(k: OutreachKind) {
    kind = k;
    const a = o?.approved;
    const v = a && a.kind === k ? a : o?.variants.find((x) => x.kind === k && x.lang === lang);
    subject = v?.subject ?? '';
    body = v?.body ?? '';
  }
  // Re-load the editor when a new draft or approval arrives, or the language changes — not on every keystroke.
  $effect(() => {
    void `${o?.generatedAt}|${o?.approved?.approvedAt}|${lang}`;
    untrack(() => load(o?.approved && o.approved.lang === lang ? o.approved.kind : kind));
  });

  let link = $derived(prospect.onboarding ? (prospect.onboarding.manageUrl ?? prospect.onboarding.receiveUrl ?? prospect.onboarding.signupUrl ?? null) : null);
  let finalText = $derived(o?.approved ? fillLink(o.approved.body, link) : '');
  let waHref = $derived(finalText ? whatsappUrl(phoneDigits, finalText) : null);
  let mailHref = $derived(finalText ? mailtoUrl(prospect.email, o?.approved?.subject, finalText) : null);
  let approvedIsCurrent = $derived(!!o?.approved && o.approved.kind === kind && o.approved.body === body && (o.approved.subject ?? '') === subject);

  async function call(key: string, params: Record<string, unknown>) {
    busy = true;
    err = null;
    const r = await runGrowth(key, { id: prospect.id, ...params });
    busy = false;
    if (r.ok === false) err = (r as Extract<typeof r, { ok: false }>).code;
    return r.ok;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(finalText);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      err = 'COPY_FAILED';
    }
  }

  async function markContacted(ch: ContactChannel, note = '') {
    if (await call('growthLogActivity', { kind: 'contacted', channel: ch, text: note })) {
      askedSent = null;
      contactNote = '';
    }
  }
</script>

<section class="gr-card sh-card" aria-labelledby="gr-outreach-h">
  <h2 id="gr-outreach-h">{$t('growth.outreach.title')}</h2>
  {#if err}<p class="gr-error" role="alert">{$t(errorKey(err))}</p>{/if}

  {#if closed}
    <p class="sh-chip sh-chip-warn-soft">{$t(`growth.outreach.closed.${prospect.stage}`)}</p>
    <p class="gr-muted">{$t('growth.outreach.closedBody')}</p>
  {:else}
    <!-- 1. draft -->
    <div class="gr-row">
      <label class="sh-field">
        {$t('growth.form.lang')}
        <select class="sh-input" bind:value={lang}>
          {#each GROWTH_LANGS as l (l)}<option value={l}>{$t(`growth.lang.${l}`)}</option>{/each}
        </select>
      </label>
      <button class="sh-btn {o ? 'sh-btn-quiet' : 'sh-btn-primary'}" onclick={() => call('growthOutreach', { mode: 'generate', lang })} disabled={busy}>
        {busy ? $t('growth.common.working') : o ? $t('growth.outreach.regenerate') : $t('growth.outreach.generate')}
      </button>
    </div>
    {#if !prospect.profile?.approvedAt}<p class="gr-muted gr-small">{$t('growth.outreach.needsProfile')}</p>{/if}

    {#if o}
      <div class="sh-seg" role="group" aria-label={$t('growth.outreach.variants')}>
        {#each OUTREACH_KINDS as k (k)}
          <button aria-pressed={kind === k} onclick={() => load(k)}>{$t(`growth.outreach.kind.${k}`)}</button>
        {/each}
      </div>
      {@const v = o.variants.find((x) => x.kind === kind && x.lang === lang)}
      {#if v}
        <p class="gr-row gr-small">
          {#if v.origin === 'template'}<span class="sh-chip sh-chip-muted">{$t('growth.outreach.origin.template')}</span>{:else}<OriginBadge origin={v.origin} />{/if}
        </p>
      {/if}
      {#if kind === 'email'}
        <label class="sh-field">{$t('growth.outreach.subject')}<input class="sh-input" bind:value={subject} dir="auto" /></label>
      {/if}
      <label class="sh-field">
        {$t('growth.outreach.body')}
        <textarea class="sh-input gr-textarea" rows="10" bind:value={body} dir="auto"></textarea>
      </label>
      <p class="gr-muted gr-small">{$t('growth.outreach.linkHint', { token: '{{link}}' })}</p>
      <div class="gr-row">
        {#if approvedIsCurrent}
          <span class="sh-chip sh-chip-ok">{$t('growth.outreach.approved')}</span>
        {:else}
          <button
            class="sh-btn sh-btn-primary"
            onclick={() => call('growthOutreach', { mode: 'approve', kind, lang, subject, body })}
            disabled={busy || !body.trim() || !prospect.profile?.approvedAt}>{$t('growth.outreach.approve')}</button
          >
        {/if}
      </div>
    {/if}

    <!-- 2. the owner's link -->
    <h3>{$t('growth.onboarding.title')}</h3>
    {#if prospect.onboarding}
      {@const ob = prospect.onboarding}
      <ul class="gr-list gr-small">
        {#if ob.previewUrl}<li>{$t('growth.onboarding.preview')}: <a class="gr-link" href={ob.previewUrl} target="_blank" rel="noopener noreferrer">{ob.previewUrl}</a></li>{/if}
        {#if link}<li>{$t('growth.onboarding.manage')}: <a class="gr-link" href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>{/if}
        <li class="gr-muted">{$t('growth.onboarding.expires', { date: new Date(ob.expiresAt).toLocaleDateString() })} · {ob.email}</li>
        {#if ob.hasAccount}<li class="gr-muted">{$t('growth.onboarding.hasAccount')}</li>{/if}
        {#if ob.rikmaId}
          <li><strong>{$t('growth.onboarding.rikmaCreated', { date: new Date(ob.rikmaCreatedAt ?? ob.claimedAt ?? ob.preparedAt).toLocaleDateString() })}</strong> · <a class="gr-link" href={`/moach/${ob.rikmaId}`}>{$t('growth.onboarding.openRikma')}</a></li>
          <li>
            {#if ob.activityCheck}
              {@const ac = ob.activityCheck}
              <span class={ac.active ? '' : 'gr-muted'}
                >{$t(ac.active ? 'growth.active.yes' : 'growth.active.no', { products: ac.products, sales: ac.sales, proposals: ac.proposals, days: ac.days })}</span
              >
              <span class="gr-muted"> · {$t('growth.active.checkedAt', { date: new Date(ac.checkedAt).toLocaleDateString() })}</span>
            {:else}
              <span class="gr-muted">{$t('growth.active.never')}</span>
            {/if}
            <button class="sh-btn sh-btn-quiet" onclick={() => call('growthCheckActive', {})} disabled={busy}>{$t('growth.active.check')}</button>
          </li>
        {:else if ob.claimedAt}
          <li><strong>{$t('growth.onboarding.claimed', { date: new Date(ob.claimedAt).toLocaleDateString() })}</strong></li>
        {/if}
      </ul>
    {:else}
      <p class="gr-muted gr-small">{$t('growth.onboarding.body')}</p>
    {/if}
    <div class="gr-row">
      <button
        class="sh-btn sh-btn-outline"
        onclick={() => call('growthPrepareOnboarding', {})}
        disabled={busy || !prospect.profile?.approvedAt || !prospect.email}
        >{prospect.onboarding ? $t('growth.onboarding.renew') : $t('growth.onboarding.prepare')}</button
      >
      {#if !prospect.email}<span class="gr-muted gr-small">{$t('growth.errors.EMAIL_REQUIRED')}</span>{/if}
    </div>

    <!-- 3. send, by the operator -->
    {#if o?.approved}
      <h3>{$t('growth.send.title')}</h3>
      <!-- dir-ok: this element is the message text itself, not a layout box -->
      <div class="gr-msg" dir="auto">{finalText}</div>
      {#if !link}<p class="gr-muted gr-small">{$t('growth.send.noLink')}</p>{/if}
      <div class="gr-row">
        <button class="sh-btn sh-btn-quiet" onclick={copy}>{copied ? $t('growth.send.copied') : $t('growth.send.copy')}</button>
        {#if waHref}
          <a class="sh-btn sh-btn-quiet" href={waHref} target="_blank" rel="noopener noreferrer" onclick={() => (askedSent = 'whatsapp')}>{$t('growth.send.whatsapp')}</a>
        {/if}
        {#if mailHref}
          <a class="sh-btn sh-btn-quiet" href={mailHref} onclick={() => (askedSent = 'email')}>{$t('growth.send.email')}</a>
        {/if}
      </div>
      <p class="gr-muted gr-small">{$t('growth.send.rule')}</p>
      {#if askedSent}
        <div class="sh-card-2 gr-card" role="status">
          <p>{$t('growth.send.didYouSend')}</p>
          <div class="gr-row">
            <button class="sh-btn sh-btn-primary" onclick={() => markContacted(askedSent!)} disabled={busy}>{$t('growth.send.yesSent')}</button>
            <button class="sh-btn sh-btn-quiet" onclick={() => (askedSent = null)}>{$t('growth.send.notYet')}</button>
          </div>
        </div>
      {/if}
    {/if}

    <details>
      <summary class="sh-section-label">{$t('growth.send.markManually')}</summary>
      <div class="gr-row" style="margin-top:8px">
        <select class="sh-input" bind:value={channel} aria-label={$t('growth.send.channel')}>
          {#each CONTACT_CHANNELS as c (c)}<option value={c}>{$t(`growth.channel.${c}`)}</option>{/each}
        </select>
        <input class="sh-input" bind:value={contactNote} placeholder={$t('growth.common.noteOptional')} />
        <button class="sh-btn sh-btn-quiet" onclick={() => markContacted(channel, contactNote)} disabled={busy}>{$t('growth.send.markContacted')}</button>
      </div>
    </details>

    <!-- 4. what they said, and when to come back -->
    <h3>{$t('growth.response.title')}</h3>
    <div class="gr-row">
      <select class="sh-input" bind:value={response} aria-label={$t('growth.response.title')}>
        {#each RESPONSE_KINDS as r (r)}<option value={r}>{$t(`growth.response.${r}`)}</option>{/each}
      </select>
      <input class="sh-input" bind:value={responseNote} placeholder={$t('growth.common.noteOptional')} />
      <button
        class="sh-btn sh-btn-quiet"
        onclick={async () => {
          if (response === 'doNotContact' && !confirm($t('growth.response.dncConfirm'))) return;
          if (await call('growthLogActivity', { kind: 'response', response, text: responseNote })) responseNote = '';
        }}
        disabled={busy}>{$t('growth.response.record')}</button
      >
    </div>

    <h3>{$t('growth.followUp.title')}</h3>
    <div class="gr-row">
      <input class="sh-input" type="date" bind:value={followUpAt} aria-label={$t('growth.followUp.date')} />
      <input class="sh-input" bind:value={nextAction} maxlength="300" placeholder={$t('growth.followUp.next')} />
      <button class="sh-btn sh-btn-quiet" onclick={() => call('growthLogActivity', { kind: 'followUp', followUpAt, nextAction })} disabled={busy}>
        {$t('growth.followUp.save')}
      </button>
    </div>
    <p class="gr-muted gr-small">{$t('growth.followUp.rule')}</p>
  {/if}
</section>
