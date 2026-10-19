<script lang="ts">
  /**
   * Fulfilment — the rikma's order automation (PLAN_SHOP_OPERATIONS §2.1, A1).
   *
   * One list of steps ("every paid order opens a Shipping task for Dana's
   * delivery mission"), and one form. A step that lands on someone else waits
   * for their yes; the person it lands on sees "Agree" here — or edits the rule,
   * which is a counter and asks again. There is no reject button on purpose.
   */
  import { page } from '$app/state';
  import { invalidate } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { shopFulfillmentKey } from '$lib/shop/keys';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';
  import type { FulfillmentSetup, StepRowView } from '$lib/fulfillment/rows';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  let uid = $derived(String(data.uid ?? ''));
  let setup = $derived<FulfillmentSetup>(data.fulfillment ?? { ready: false, steps: [], missions: [], roles: [], members: [] });
  let memberName = $derived(new Map(setup.members.map((m) => [m.id, m.name])));
  let zones = $derived<Array<{ id: string; name: string }>>(data.zones ?? []);
  let zoneName = $derived(new Map(zones.map((z) => [z.id, z.name])));

  type Target = 'mission' | 'role' | 'member';
  type Effect = 'none' | 'markShipped' | 'markFulfilled';
  type Per = 'order' | 'line' | 'unit';
  type Pref = 'any' | 'delivery' | 'pickup';

  const TARGETS: Target[] = ['mission', 'role', 'member'];
  const EFFECTS: Effect[] = ['markShipped', 'markFulfilled', 'none'];
  const PERS: Per[] = ['order', 'line'];
  const PREFS: Pref[] = ['any', 'delivery', 'pickup'];

  let editing = $state<string | null>(null); // step id, or 'new'
  let busy = $state(false);
  let form = $state({
    name: '',
    target: 'mission' as Target,
    missionId: '',
    roleId: '',
    memberId: '',
    per: 'order' as Per,
    pref: 'any' as Pref,
    dueHours: '' as string | number,
    effect: 'markShipped' as Effect,
    zones: [] as string[]
  });

  function openNew() {
    form = {
      name: '',
      target: 'mission',
      missionId: setup.missions[0]?.id ?? '',
      roleId: setup.roles[0]?.id ?? '',
      memberId: uid,
      per: 'order',
      pref: 'any',
      dueHours: 24,
      effect: 'markShipped',
      zones: []
    };
    editing = 'new';
  }

  function openEdit(s: StepRowView) {
    const prefs = s.when.deliveryPreference ?? [];
    form = {
      name: s.name,
      target: s.target,
      missionId: s.missionId ?? '',
      roleId: s.roleId ?? '',
      memberId: s.memberId ?? '',
      per: s.per === 'unit' ? 'line' : s.per,
      pref: prefs.length === 1 && (prefs[0] === 'delivery' || prefs[0] === 'pickup') ? prefs[0] : 'any',
      dueHours: s.dueHours ?? '',
      effect: s.effect,
      zones: [...(s.when.shippingZones ?? [])]
    };
    editing = s.id;
  }

  async function call(key: Parameters<typeof executeAction>[0], params: Record<string, unknown>, ok: string) {
    if (busy) return false;
    busy = true;
    try {
      const res = await executeAction(key, { projectId, ...params });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('shop.fulfil.error')));
      toast.success(ok);
      await invalidate(shopFulfillmentKey(projectId));
      return true;
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : $t('shop.fulfil.error'));
      return false;
    } finally {
      busy = false;
    }
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    const due = form.dueHours === '' ? null : Number(form.dueHours);
    const ok = await call(
      'saveFulfillmentStep',
      {
        ...(editing && editing !== 'new' ? { stepId: editing } : {}),
        name: form.name.trim(),
        target: form.target,
        ...(form.target === 'mission' ? { missionId: form.missionId } : {}),
        ...(form.target === 'role' ? { roleId: form.roleId } : {}),
        ...(form.target === 'member' ? { memberId: form.memberId } : {}),
        per: form.per,
        deliveryPreference: form.pref === 'any' ? [] : [form.pref],
        shippingZones: form.pref === 'pickup' ? [] : form.zones,
        ...(due != null && Number.isFinite(due) ? { dueHours: due } : {}),
        effect: form.effect
      },
      $t('shop.fulfil.saved')
    );
    if (ok) editing = null;
  }

  function targetText(s: StepRowView): string {
    if (s.target === 'mission') return $t('shop.fulfil.targetMission', { mission: s.missionName ?? '—' });
    if (s.target === 'role') return $t('shop.fulfil.targetRole', { role: s.roleName ?? '—' });
    return $t('shop.fulfil.targetMember', { member: s.memberName ?? '—' });
  }

  function whenText(s: StepRowView): string {
    const prefs = s.when.deliveryPreference ?? [];
    const base = prefs.length === 1 ? $t(`shop.fulfil.when.${prefs[0]}`) : $t('shop.fulfil.when.any');
    const z = (s.when.shippingZones ?? []).map((id) => zoneName.get(id) ?? id);
    return z.length ? `${base} · ${$t('shop.fulfil.whenZones', { names: z.join(', ') })}` : base;
  }
  function toggleZone(id: string) {
    form.zones = form.zones.includes(id) ? form.zones.filter((z) => z !== id) : [...form.zones, id];
  }

  function stateOf(s: StepRowView): { label: string; chip: string } {
    if (s.consentState === 'paused') return { label: $t('shop.fulfil.state.paused'), chip: 'sh-chip-muted' };
    if (s.consentState === 'proposed') {
      const names = s.waitingFor.map((id) => memberName.get(id) ?? '').filter(Boolean).join(', ');
      return {
        label: names ? $t('shop.fulfil.state.waitingFor', { names }) : $t('shop.fulfil.state.noTarget'),
        chip: 'sh-chip-warn-soft'
      };
    }
    return { label: $t('shop.fulfil.state.live'), chip: 'sh-chip-ok' };
  }
</script>

{#if !setup.ready}
  <ShopNotice title={$t('shop.fulfil.notReady')} body={$t('shop.fulfil.notReadyBody')} />
{:else}
  <section class="fu-intro sh-card-2">
    <p>{$t('shop.fulfil.intro')}</p>
    <p class="fu-muted">{$t('shop.fulfil.introConsent')}</p>
  </section>

  {#if setup.steps.length === 0 && editing === null}
    <ShopNotice
      title={$t('shop.fulfil.empty')}
      body={$t('shop.fulfil.emptyBody')}
      action={{ label: $t('shop.fulfil.add'), onclick: openNew }}
    />
  {:else}
    <ul class="fu-list">
      {#each setup.steps as s (s.id)}
        {@const st = stateOf(s)}
        <li class="sh-card fu-step">
          <div class="fu-step-head">
            <strong class="fu-name"><bdi>{s.name}</bdi></strong>
            <span class="sh-chip {st.chip}">{st.label}</span>
          </div>
          <p class="fu-line">{whenText(s)} · {targetText(s)}</p>
          <p class="fu-muted">
            {$t(`shop.fulfil.effect.${s.effect}`)}
            {#if s.dueHours != null} · {$t('shop.fulfil.dueIn', { hours: s.dueHours })}{/if}
            {#if s.per !== 'order'} · {$t('shop.fulfil.perLine')}{/if}
          </p>

          {#if s.consentState === 'proposed' && s.waitingFor.includes(uid)}
            <div class="fu-ask">
              <p>{$t('shop.fulfil.askYou')}</p>
              <div class="fu-actions">
                <button type="button" class="sh-btn sh-btn-primary" disabled={busy} onclick={() => call('respondFulfillmentStep', { stepId: s.id }, $t('shop.fulfil.agreed'))}>
                  {$t('shop.fulfil.agree')}
                </button>
                <button type="button" class="sh-btn sh-btn-outline" disabled={busy} onclick={() => openEdit(s)}>{$t('shop.fulfil.counter')}</button>
              </div>
            </div>
          {/if}

          <div class="fu-actions">
            <button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={() => openEdit(s)}>{$t('shop.fulfil.edit')}</button>
            {#if s.targetIds.includes(uid) || s.proposedById === uid}
              {#if s.consentState === 'paused'}
                <button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={() => call('setFulfillmentStepPaused', { stepId: s.id, paused: false }, $t('shop.fulfil.resumed'))}>
                  {$t('shop.fulfil.resume')}
                </button>
              {:else}
                <button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={() => call('setFulfillmentStepPaused', { stepId: s.id, paused: true }, $t('shop.fulfil.pausedToast'))}>
                  {$t('shop.fulfil.pause')}
                </button>
              {/if}
            {/if}
            <button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={() => call('archiveFulfillmentStep', { stepId: s.id }, $t('shop.fulfil.removed'))}>
              {$t('shop.fulfil.remove')}
            </button>
          </div>
        </li>
      {/each}
    </ul>
    {#if editing === null}
      <button type="button" class="sh-btn sh-btn-outline fu-add" onclick={openNew}>{$t('shop.fulfil.add')}</button>
    {/if}
  {/if}

  {#if editing !== null}
    <form class="sh-card fu-form" onsubmit={save}>
      <h2 class="sh-section-label">{editing === 'new' ? $t('shop.fulfil.newTitle') : $t('shop.fulfil.editTitle')}</h2>
      {#if editing !== 'new'}<p class="fu-muted">{$t('shop.fulfil.editAsksAgain')}</p>{/if}

      <label class="sh-field">
        {$t('shop.fulfil.f.name')}
        <input class="sh-input" bind:value={form.name} maxlength="80" required placeholder={$t('shop.fulfil.f.namePh')} />
      </label>

      <fieldset class="sh-field">
        <legend>{$t('shop.fulfil.f.when')}</legend>
        <div class="sh-seg" role="group">
          {#each PREFS as p (p)}
            <button type="button" aria-pressed={form.pref === p} onclick={() => (form.pref = p)}>{$t(`shop.fulfil.when.${p}`)}</button>
          {/each}
        </div>
      </fieldset>

      {#if zones.length && form.pref !== 'pickup'}
        <fieldset class="sh-field">
          <legend>{$t('shop.fulfil.f.zones')}</legend>
          <div class="fu-zones" role="group">
            {#each zones as z (z.id)}
              <button type="button" class="sh-chip" class:sh-chip-accent={form.zones.includes(z.id)} aria-pressed={form.zones.includes(z.id)} onclick={() => toggleZone(z.id)}><bdi>{z.name}</bdi></button>
            {/each}
          </div>
          <span class="fu-muted">{form.zones.length ? $t('shop.fulfil.f.zonesSome') : $t('shop.fulfil.f.zonesAll')}</span>
        </fieldset>
      {/if}

      <fieldset class="sh-field">
        <legend>{$t('shop.fulfil.f.target')}</legend>
        <div class="sh-seg" role="group">
          {#each TARGETS as k (k)}
            <button type="button" aria-pressed={form.target === k} onclick={() => (form.target = k)}>{$t(`shop.fulfil.f.target_${k}`)}</button>
          {/each}
        </div>
      </fieldset>

      {#if form.target === 'mission'}
        <label class="sh-field">
          {$t('shop.fulfil.f.mission')}
          {#if setup.missions.length}
            <select class="sh-input" bind:value={form.missionId} required>
              {#each setup.missions as m (m.id)}
                <option value={m.id}>{m.name}{m.holderName ? ` — ${m.holderName}` : ''}</option>
              {/each}
            </select>
          {:else}
            <span class="fu-muted">{$t('shop.fulfil.f.noMissions')}</span>
          {/if}
        </label>
      {:else if form.target === 'role'}
        <label class="sh-field">
          {$t('shop.fulfil.f.role')}
          {#if setup.roles.length}
            <select class="sh-input" bind:value={form.roleId} required>
              {#each setup.roles as r (r.id)}
                <option value={r.id}>{r.name}</option>
              {/each}
            </select>
          {:else}
            <span class="fu-muted">{$t('shop.fulfil.f.noRoles')}</span>
          {/if}
        </label>
      {:else}
        <label class="sh-field">
          {$t('shop.fulfil.f.member')}
          <select class="sh-input" bind:value={form.memberId} required>
            {#each setup.members as m (m.id)}
              <option value={m.id}>{m.id === uid ? $t('shop.fulfil.f.me', { name: m.name }) : m.name}</option>
            {/each}
          </select>
        </label>
      {/if}

      <fieldset class="sh-field">
        <legend>{$t('shop.fulfil.f.per')}</legend>
        <div class="sh-seg" role="group">
          {#each PERS as k (k)}
            <button type="button" aria-pressed={form.per === k} onclick={() => (form.per = k)}>{$t(`shop.fulfil.f.per_${k}`)}</button>
          {/each}
        </div>
      </fieldset>

      <label class="sh-field">
        {$t('shop.fulfil.f.effect')}
        <select class="sh-input" bind:value={form.effect}>
          {#each EFFECTS as k (k)}
            <option value={k}>{$t(`shop.fulfil.effect.${k}`)}</option>
          {/each}
        </select>
      </label>

      <label class="sh-field">
        {$t('shop.fulfil.f.due')}
        <input class="sh-input sh-num" type="number" min="0" step="1" inputmode="numeric" bind:value={form.dueHours} />
      </label>

      <div class="fu-actions">
        <button type="submit" class="sh-btn sh-btn-primary" disabled={busy || !form.name.trim()}>{$t('shop.fulfil.save')}</button>
        <button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={() => (editing = null)}>{$t('shop.fulfil.cancel')}</button>
      </div>
    </form>
  {/if}
{/if}

<style>
  .fu-intro {
    padding: 14px 16px;
    border-radius: var(--sh-radius-sm);
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--sh-ink);
    font-size: 14px;
  }
  .fu-muted {
    color: var(--sh-muted);
    font-size: 13px;
  }
  .fu-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .fu-step,
  .fu-form {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--sh-ink);
  }
  .fu-step-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .fu-name {
    font-size: 16px;
  }
  .fu-line {
    font-size: 14px;
    color: var(--sh-ink);
  }
  .fu-ask {
    border: 1px solid var(--sh-gold-line);
    border-radius: var(--sh-radius-sm);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
  }
  .fu-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fu-add {
    align-self: flex-start;
  }
  .fu-zones {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fu-zones button {
    cursor: pointer;
    border: 1px solid var(--sh-line);
  }
  fieldset.sh-field {
    border: 0;
    padding: 0;
    margin: 0;
  }
</style>
