<script lang="ts">
  /**
   * Fulfilment — the rikma's order automation (PLAN_SHOP_OPERATIONS §2.1–2.4, A1–A3).
   *
   * One list of steps ("every paid order opens a Shipping task for Dana's
   * delivery mission"), and one form. A step that lands on someone else waits
   * for their answer — and, once the rule's Decision is deployed, their silence
   * within the rikma's restime is consent. The person it lands on sees "Agree"
   * here, or edits the rule: a counter-proposal that asks again and restarts
   * the clock. There is no reject button on purpose.
   *
   * A2 adds chains (`after`), conditions (category, product, delivery method,
   * pickup point), one task per unit, routing between a role's holders, and
   * waves; A3 the `stock.low` event — a purchase task when a resource runs low.
   */
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { invalidate } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { t, locale } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { shopFulfillmentKey } from '$lib/shop/keys';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';
  import { EMPTY_CHOICES, type FulfillmentSetup, type StepRowView } from '$lib/fulfillment/rows';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  let uid = $derived(String(data.uid ?? ''));
  let setup = $derived<FulfillmentSetup>(
    data.fulfillment ?? { ready: false, steps: [], missions: [], roles: [], members: [], choices: EMPTY_CHOICES, consentClock: false }
  );
  let choices = $derived(setup.choices ?? EMPTY_CHOICES);
  let memberName = $derived(new Map(setup.members.map((m) => [m.id, m.name])));
  let nameOf = $derived({
    zone: new Map(choices.zones.map((z) => [z.id, z.name])),
    method: new Map(choices.methods.map((m) => [m.id, `${m.zoneName} · ${m.name}`])),
    point: new Map(choices.pickupPoints.map((p) => [p.id, p.name])),
    category: new Map(choices.categories.map((c) => [c.id, c.name])),
    product: new Map(choices.products.map((p) => [p.id, p.name])),
    resource: new Map(choices.resources.map((r) => [r.id, r.name])),
    step: new Map(setup.steps.map((s) => [s.id, s.name]))
  });

  type Target = 'mission' | 'role' | 'member';
  type Effect = 'none' | 'markShipped' | 'markFulfilled';
  type Per = 'order' | 'line' | 'unit';
  type Pref = 'any' | 'delivery' | 'pickup';
  type Event = 'order.paid' | 'stock.low';
  type Scope = 'rikma' | 'category' | 'product';
  type Routing = 'single' | 'roundRobin' | 'leastOpen';
  type Batching = 'perOrder' | 'wave';

  const EVENTS: Event[] = ['order.paid', 'stock.low'];
  const TARGETS: Target[] = ['mission', 'role', 'member'];
  const EFFECTS: Effect[] = ['markShipped', 'markFulfilled', 'none'];
  const PERS: Per[] = ['order', 'line', 'unit'];
  const PREFS: Pref[] = ['any', 'delivery', 'pickup'];
  const SCOPES: Scope[] = ['rikma', 'category', 'product'];
  const ROUTINGS: Routing[] = ['single', 'roundRobin', 'leastOpen'];
  const BATCHINGS: Batching[] = ['perOrder', 'wave'];

  type Form = {
    name: string;
    event: Event;
    target: Target;
    missionId: string;
    roleId: string;
    memberId: string;
    per: Per;
    pref: Pref;
    dueHours: string | number;
    effect: Effect;
    zones: string[];
    methods: string[];
    points: string[];
    scope: Scope;
    categories: string[];
    productIds: string[];
    after: string[];
    resources: string[];
    routing: Routing;
    batching: Batching;
    waveAt: string;
    why: string;
  };

  let editing = $state<string | null>(null); // step id, or 'new'
  /** Editing a rule that lands on me and is someone else's: my edit is a counter. */
  let countering = $state(false);
  let busy = $state(false);
  let form = $state<Form>(blank());

  function blank(): Form {
    return {
      name: '',
      event: 'order.paid',
      target: 'mission',
      missionId: '',
      roleId: '',
      memberId: '',
      per: 'order',
      pref: 'any',
      dueHours: 24,
      effect: 'markShipped',
      zones: [],
      methods: [],
      points: [],
      scope: 'rikma',
      categories: [],
      productIds: [],
      after: [],
      resources: [],
      routing: 'single',
      batching: 'perOrder',
      waveAt: '16:00',
      why: ''
    };
  }

  function openNew() {
    form = {
      ...blank(),
      missionId: setup.missions[0]?.id ?? '',
      roleId: setup.roles[0]?.id ?? '',
      memberId: uid
    };
    countering = false;
    editing = 'new';
  }

  function openEdit(s: StepRowView) {
    const prefs = s.when.deliveryPreference ?? [];
    form = {
      name: s.name,
      event: s.when.event === 'stock.low' ? 'stock.low' : 'order.paid',
      target: s.target,
      missionId: s.missionId ?? '',
      roleId: s.roleId ?? '',
      memberId: s.memberId ?? '',
      per: s.per,
      pref: prefs.length === 1 && (prefs[0] === 'delivery' || prefs[0] === 'pickup') ? prefs[0] : 'any',
      dueHours: s.dueHours ?? '',
      effect: s.effect,
      zones: [...(s.when.shippingZones ?? [])],
      methods: [...(s.when.shippingMethods ?? [])],
      points: [...(s.when.pickupPoints ?? [])],
      scope: s.scope === 'category' || s.scope === 'product' ? s.scope : 'rikma',
      categories: [...(s.when.categories ?? [])],
      productIds: [...s.productIds],
      after: [...(s.when.after ?? [])],
      resources: [...(s.when.resources ?? [])],
      routing: s.routing === 'roundRobin' || s.routing === 'leastOpen' ? s.routing : 'single',
      batching: s.batching,
      waveAt: s.waveAt ?? '16:00',
      why: ''
    };
    countering = s.targetIds.includes(uid) && !!s.proposedById && s.proposedById !== uid;
    editing = s.id;
  }

  // From the heart's "propose a change" (FulfillRuleCard): ?step=<id> opens
  // that rule once, as the page opens — server-rendered already open.
  untrack(() => {
    const wanted = page.url.searchParams.get('step');
    const linked = wanted ? setup.steps.find((x) => x.id === wanted) : null;
    if (linked) openEdit(linked);
  });

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
    const stock = form.event === 'stock.low';
    const conditions = stock
      ? { resources: form.resources }
      : {
          per: form.per,
          effect: form.effect,
          deliveryPreference: form.pref === 'any' ? [] : [form.pref],
          shippingZones: form.pref === 'pickup' ? [] : form.zones,
          shippingMethods: form.pref === 'pickup' ? [] : form.methods,
          pickupPoints: form.pref === 'delivery' ? [] : form.points,
          scope: form.scope,
          ...(form.scope === 'category' ? { categories: form.categories } : {}),
          ...(form.scope === 'product' ? { productIds: form.productIds } : {}),
          after: form.after,
          batching: form.batching,
          ...(form.batching === 'wave' ? { waveAt: form.waveAt } : {})
        };
    const ok = await call(
      'saveFulfillmentStep',
      {
        ...(editing && editing !== 'new' ? { stepId: editing } : {}),
        name: form.name.trim(),
        event: form.event,
        target: form.target,
        ...(form.target === 'mission' ? { missionId: form.missionId } : {}),
        ...(form.target === 'role' ? { roleId: form.roleId } : {}),
        ...(form.target === 'member' ? { memberId: form.memberId } : {}),
        routing: form.target === 'role' ? form.routing : 'single',
        ...conditions,
        ...(due != null && Number.isFinite(due) ? { dueHours: due } : {}),
        ...(countering && form.why.trim() ? { why: form.why.trim() } : {})
      },
      countering ? $t('shop.fulfil.countered') : $t('shop.fulfil.saved')
    );
    if (ok) editing = null;
  }

  const names = (ids: string[] | undefined, map: Map<string, string>) => (ids ?? []).map((id) => map.get(id) ?? id).join(', ');

  function targetText(s: StepRowView): string {
    if (s.target === 'mission') return $t('shop.fulfil.targetMission', { mission: s.missionName ?? '—' });
    if (s.target === 'role') return $t('shop.fulfil.targetRole', { role: s.roleName ?? '—' });
    return $t('shop.fulfil.targetMember', { member: s.memberName ?? '—' });
  }

  function whenText(s: StepRowView): string {
    if (s.when.event === 'stock.low') {
      const r = names(s.when.resources, nameOf.resource);
      return r ? $t('shop.fulfil.whenStockOf', { names: r }) : $t('shop.fulfil.whenStock');
    }
    const prefs = s.when.deliveryPreference ?? [];
    const parts = [prefs.length === 1 ? $t(`shop.fulfil.when.${prefs[0]}`) : $t('shop.fulfil.when.any')];
    const z = names(s.when.shippingZones, nameOf.zone);
    if (z) parts.push($t('shop.fulfil.whenZones', { names: z }));
    const m = names(s.when.shippingMethods, nameOf.method);
    if (m) parts.push($t('shop.fulfil.whenMethods', { names: m }));
    const p = names(s.when.pickupPoints, nameOf.point);
    if (p) parts.push($t('shop.fulfil.whenPoints', { names: p }));
    const c = names(s.when.categories, nameOf.category);
    if (s.scope === 'category' && c) parts.push($t('shop.fulfil.whenCategories', { names: c }));
    if (s.scope === 'product') {
      const pr = s.productNames.length ? s.productNames.join(', ') : names(s.productIds, nameOf.product);
      if (pr) parts.push($t('shop.fulfil.whenProducts', { names: pr }));
    }
    const a = names(s.when.after, nameOf.step);
    if (a) parts.push($t('shop.fulfil.whenAfter', { names: a }));
    return parts.join(' · ');
  }

  function metaText(s: StepRowView): string {
    const parts: string[] = [];
    if (s.when.event !== 'stock.low') parts.push($t(`shop.fulfil.effect.${s.effect}`));
    if (s.dueHours != null) parts.push($t('shop.fulfil.dueIn', { hours: s.dueHours }));
    if (s.per === 'line') parts.push($t('shop.fulfil.perLine'));
    if (s.per === 'unit') parts.push($t('shop.fulfil.perUnit'));
    if (s.routing === 'roundRobin' || s.routing === 'leastOpen') parts.push($t(`shop.fulfil.routing.${s.routing}`));
    if (s.batching === 'wave' && s.waveAt) parts.push($t('shop.fulfil.waveAt', { time: s.waveAt }));
    return parts.join(' · ');
  }

  function fmtDeadline(iso: string): string {
    try {
      return new Intl.DateTimeFormat($locale || 'he', {
        timeZone: 'Asia/Jerusalem',
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function stateOf(s: StepRowView): { label: string; chip: string } {
    if (s.consentState === 'paused') return { label: $t('shop.fulfil.state.paused'), chip: 'sh-chip-muted' };
    if (s.consentState === 'proposed') {
      const who = s.waitingFor.map((id) => memberName.get(id) ?? '').filter(Boolean).join(', ');
      // Everyone it lands on agreed, and it still waits: a counter, for its author's answer.
      const author = !who && s.targetIds.length > 0 && s.proposedByName;
      return {
        label: who
          ? $t('shop.fulfil.state.waitingFor', { names: who })
          : author
            ? $t('shop.fulfil.state.waitingFor', { names: s.proposedByName })
            : $t('shop.fulfil.state.noTarget'),
        chip: 'sh-chip-warn-soft'
      };
    }
    return { label: $t('shop.fulfil.state.live'), chip: 'sh-chip-ok' };
  }

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  /** Steps a rule can wait for: the rikma's other order steps. */
  let chainable = $derived(setup.steps.filter((s) => s.id !== editing && s.when.event !== 'stock.low'));
</script>

{#snippet chips(items: { id: string; name: string }[], selected: string[], onToggle: (id: string) => void)}
  <div class="fu-chips" role="group">
    {#each items as it (it.id)}
      <button
        type="button"
        class="sh-chip"
        class:sh-chip-accent={selected.includes(it.id)}
        aria-pressed={selected.includes(it.id)}
        onclick={() => onToggle(it.id)}><bdi>{it.name}</bdi></button
      >
    {/each}
  </div>
{/snippet}

{#if !setup.ready}
  <ShopNotice title={$t('shop.fulfil.notReady')} body={$t('shop.fulfil.notReadyBody')} />
{:else}
  <section class="fu-intro sh-card-2">
    <p>{$t('shop.fulfil.intro')}</p>
    <p class="fu-muted">{setup.consentClock ? $t('shop.fulfil.introClock') : $t('shop.fulfil.introConsent')}</p>
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
        {@const meta = metaText(s)}
        <li class="sh-card fu-step">
          <div class="fu-step-head">
            <strong class="fu-name"><bdi>{s.name}</bdi></strong>
            <span class="sh-chip {st.chip}">{st.label}</span>
          </div>
          <p class="fu-line">{whenText(s)} · {targetText(s)}</p>
          {#if meta}<p class="fu-muted">{meta}</p>{/if}
          {#if s.consentState === 'proposed' && s.deadline}
            <p class="fu-muted">{$t('shop.fulfil.silenceBy', { when: fmtDeadline(s.deadline) })}</p>
          {/if}

          {#if s.consentState === 'proposed' && (s.waitingFor.includes(uid) || (s.proposedById === uid && s.waitingFor.length === 0))}
            <div class="fu-ask">
              <p>
                {s.waitingFor.includes(uid)
                  ? s.deadline
                    ? $t('shop.fulfil.askYouClock', { when: fmtDeadline(s.deadline) })
                    : $t('shop.fulfil.askYou')
                  : $t('shop.fulfil.askAuthor')}
              </p>
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
      <h2 class="sh-section-label">{editing === 'new' ? $t('shop.fulfil.newTitle') : countering ? $t('shop.fulfil.counterTitle') : $t('shop.fulfil.editTitle')}</h2>
      {#if editing !== 'new'}
        <p class="fu-muted">{countering ? $t('shop.fulfil.counterHint') : $t('shop.fulfil.editAsksAgain')}</p>
      {/if}

      <label class="sh-field">
        {$t('shop.fulfil.f.name')}
        <input class="sh-input" bind:value={form.name} maxlength="80" required placeholder={$t('shop.fulfil.f.namePh')} />
      </label>

      <fieldset class="sh-field">
        <legend>{$t('shop.fulfil.f.event')}</legend>
        <div class="sh-seg" role="group">
          {#each EVENTS as ev (ev)}
            <button type="button" aria-pressed={form.event === ev} onclick={() => (form.event = ev)}>{$t(`shop.fulfil.f.event_${ev === 'stock.low' ? 'stock' : 'order'}`)}</button>
          {/each}
        </div>
      </fieldset>

      {#if form.event === 'stock.low'}
        <fieldset class="sh-field">
          <legend>{$t('shop.fulfil.f.resources')}</legend>
          {#if choices.resources.length}
            {@render chips(choices.resources, form.resources, (id) => (form.resources = toggle(form.resources, id)))}
            <span class="fu-muted">{form.resources.length ? $t('shop.fulfil.f.resourcesSome') : $t('shop.fulfil.f.resourcesAll')}</span>
          {:else}
            <span class="fu-muted">{$t('shop.fulfil.f.noResources')}</span>
          {/if}
        </fieldset>
      {:else}
        <fieldset class="sh-field">
          <legend>{$t('shop.fulfil.f.when')}</legend>
          <div class="sh-seg" role="group">
            {#each PREFS as p (p)}
              <button type="button" aria-pressed={form.pref === p} onclick={() => (form.pref = p)}>{$t(`shop.fulfil.when.${p}`)}</button>
            {/each}
          </div>
        </fieldset>

        {#if choices.zones.length && form.pref !== 'pickup'}
          <fieldset class="sh-field">
            <legend>{$t('shop.fulfil.f.zones')}</legend>
            {@render chips(choices.zones, form.zones, (id) => (form.zones = toggle(form.zones, id)))}
            <span class="fu-muted">{form.zones.length ? $t('shop.fulfil.f.zonesSome') : $t('shop.fulfil.f.zonesAll')}</span>
          </fieldset>
        {/if}

        {#if choices.methods.length && form.pref !== 'pickup'}
          <fieldset class="sh-field">
            <legend>{$t('shop.fulfil.f.methods')}</legend>
            {@render chips(
              choices.methods.map((m) => ({ id: m.id, name: `${m.zoneName} · ${m.name}` })),
              form.methods,
              (id) => (form.methods = toggle(form.methods, id))
            )}
            <span class="fu-muted">{form.methods.length ? $t('shop.fulfil.f.methodsSome') : $t('shop.fulfil.f.methodsAll')}</span>
          </fieldset>
        {/if}

        {#if choices.pickupPoints.length && form.pref !== 'delivery'}
          <fieldset class="sh-field">
            <legend>{$t('shop.fulfil.f.points')}</legend>
            {@render chips(choices.pickupPoints, form.points, (id) => (form.points = toggle(form.points, id)))}
            <span class="fu-muted">{form.points.length ? $t('shop.fulfil.f.pointsSome') : $t('shop.fulfil.f.pointsAll')}</span>
          </fieldset>
        {/if}

        <fieldset class="sh-field">
          <legend>{$t('shop.fulfil.f.scope')}</legend>
          <div class="sh-seg" role="group">
            {#each SCOPES as k (k)}
              <button type="button" aria-pressed={form.scope === k} onclick={() => (form.scope = k)}>{$t(`shop.fulfil.f.scope_${k}`)}</button>
            {/each}
          </div>
          {#if form.scope === 'category'}
            {#if choices.categories.length}
              {@render chips(choices.categories, form.categories, (id) => (form.categories = toggle(form.categories, id)))}
            {:else}
              <span class="fu-muted">{$t('shop.fulfil.f.noCategories')}</span>
            {/if}
          {:else if form.scope === 'product'}
            {#if choices.products.length}
              {@render chips(choices.products, form.productIds, (id) => (form.productIds = toggle(form.productIds, id)))}
            {:else}
              <span class="fu-muted">{$t('shop.fulfil.f.noProducts')}</span>
            {/if}
          {/if}
        </fieldset>

        {#if chainable.length}
          <fieldset class="sh-field">
            <legend>{$t('shop.fulfil.f.after')}</legend>
            {@render chips(chainable, form.after, (id) => (form.after = toggle(form.after, id)))}
            <span class="fu-muted">{form.after.length ? $t('shop.fulfil.f.afterSome') : $t('shop.fulfil.f.afterNone')}</span>
          </fieldset>
        {/if}
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
        <fieldset class="sh-field">
          <legend>{$t('shop.fulfil.f.routing')}</legend>
          <div class="sh-seg" role="group">
            {#each ROUTINGS as k (k)}
              <button type="button" aria-pressed={form.routing === k} onclick={() => (form.routing = k)}>{$t(`shop.fulfil.f.routing_${k}`)}</button>
            {/each}
          </div>
          <span class="fu-muted">{$t(`shop.fulfil.f.routingHint_${form.routing}`)}</span>
        </fieldset>
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

      {#if form.event === 'order.paid'}
        <fieldset class="sh-field">
          <legend>{$t('shop.fulfil.f.per')}</legend>
          <div class="sh-seg" role="group">
            {#each PERS as k (k)}
              <button type="button" aria-pressed={form.per === k} onclick={() => (form.per = k)}>{$t(`shop.fulfil.f.per_${k}`)}</button>
            {/each}
          </div>
          {#if form.per === 'unit'}<span class="fu-muted">{$t('shop.fulfil.f.perUnitHint')}</span>{/if}
        </fieldset>

        <fieldset class="sh-field">
          <legend>{$t('shop.fulfil.f.batching')}</legend>
          <div class="sh-seg" role="group">
            {#each BATCHINGS as k (k)}
              <button type="button" aria-pressed={form.batching === k} onclick={() => (form.batching = k)}>{$t(`shop.fulfil.f.batching_${k}`)}</button>
            {/each}
          </div>
          {#if form.batching === 'wave'}
            <label class="fu-inline">
              {$t('shop.fulfil.f.waveAt')}
              <input class="sh-input fu-time" type="time" bind:value={form.waveAt} required />
            </label>
            <span class="fu-muted">{$t('shop.fulfil.f.waveHint')}</span>
          {/if}
        </fieldset>

        <label class="sh-field">
          {$t('shop.fulfil.f.effect')}
          <select class="sh-input" bind:value={form.effect}>
            {#each EFFECTS as k (k)}
              <option value={k}>{$t(`shop.fulfil.effect.${k}`)}</option>
            {/each}
          </select>
        </label>
      {/if}

      <label class="sh-field">
        {$t('shop.fulfil.f.due')}
        <input class="sh-input sh-num" type="number" min="0" step="1" inputmode="numeric" bind:value={form.dueHours} />
        {#if form.dueHours !== '' && Number(form.dueHours) > 0}<span class="fu-muted">{$t('shop.fulfil.f.dueHint')}</span>{/if}
      </label>

      {#if countering}
        <label class="sh-field">
          {$t('shop.fulfil.f.why')}
          <textarea class="sh-input" rows="2" maxlength="300" bind:value={form.why} placeholder={$t('shop.fulfil.f.whyPh')}></textarea>
        </label>
      {/if}

      <div class="fu-actions">
        <button type="submit" class="sh-btn sh-btn-primary" disabled={busy || !form.name.trim()}>
          {countering ? $t('shop.fulfil.sendCounter') : $t('shop.fulfil.save')}
        </button>
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
  .fu-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .fu-chips button {
    cursor: pointer;
    border: 1px solid var(--sh-line);
  }
  .fu-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    font-size: 14px;
  }
  .fu-time {
    max-width: 8rem;
  }
  fieldset.sh-field {
    border: 0;
    padding: 0;
    margin: 0;
  }
</style>
