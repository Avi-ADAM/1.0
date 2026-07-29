<script lang="ts">
  import { isRtl, t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import Button from '$lib/celim/ui/button.svelte';
  import UploadPic from '$lib/components/userPr/uploadPic.svelte';
  import MissionPickerList from './MissionPickerList.svelte';
  import ResourcePickerList from './ResourcePickerList.svelte';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import type {
    ComposeMode,
    PricingMode,
    RecipeMissionRow,
    RecipeResourceRow,
    ComposeProductPayload,
    AvailableMission,
    AvailableResource,
    ProjectMember,
    MissionTemplate,
    ResourceTemplate
  } from './types';

  type Props = {
    projectId: string;
    mode?: ComposeMode;
    availableMissions?: AvailableMission[];
    availableResources?: AvailableResource[];
    projectMembers?: ProjectMember[];
    missionTemplates?: MissionTemplate[];
    resourceTemplates?: ResourceTemplate[];
    onDone?: (data: {
      matana: unknown;
      payload?: ComposeProductPayload;
    }) => void;
    onCancel?: () => void;
    /**
     * Prefill from the quick create-product flow (CreateProductFlow draft,
     * PLAN_USER_OFFERINGS): { name, descrip, price, quant, kindOf }.
     * Hydrates the base fields once on init.
     */
    initialDraft?: {
      name?: string;
      descrip?: string;
      price?: number | null;
      quant?: number | null;
      kindOf?: string;
    } | null;
  };

  let {
    projectId,
    mode = $bindable('complex'),
    availableMissions = [],
    availableResources = [],
    projectMembers = [],
    missionTemplates = [],
    resourceTemplates = [],
    onDone,
    onCancel,
    initialDraft = null
  }: Props = $props();

  const multiMember = $derived(projectMembers.length >= 2);

  // ─── base fields (mirror newmatana) ───────────────────────────────────────
  let name = $state('');
  let description = $state('');
  let kindOf = $state<'total' | 'monthly' | 'yearly' | 'unlimited'>('total');
  let quant = $state(1);
  let unlimitedM = $state(false);
  let dates = $state<string | null>(null);
  let datef = $state<string | null>(null);
  let oneForeProject = $state(false);
  let croppedImage = $state<unknown>(null);
  let fixedPrice = $state(0); // used when pricingMode='fixed'

  // Hydrate base fields from the quick-flow draft (once, on init).
  if (initialDraft) {
    if (initialDraft.name) name = initialDraft.name;
    if (initialDraft.descrip) description = initialDraft.descrip;
    if (initialDraft.quant != null && Number(initialDraft.quant) > 0) {
      quant = Number(initialDraft.quant);
    }
    if (
      initialDraft.kindOf &&
      ['total', 'monthly', 'yearly', 'unlimited'].includes(initialDraft.kindOf)
    ) {
      kindOf = initialDraft.kindOf as typeof kindOf;
    }
    if (initialDraft.price != null && Number(initialDraft.price) > 0) {
      fixedPrice = Number(initialDraft.price);
    }
  }

  // ─── complex-only fields ──────────────────────────────────────────────────
  let marginPct = $state(0);
  const currency = 'ILS';
  let recipeMissions = $state<RecipeMissionRow[]>([]);
  let recipeResources = $state<RecipeResourceRow[]>([]);

  let loading = $state(false);
  let success = $state(false);
  let error = $state(false);

  let locationOpen = $state(false);
  let locationScope = $state({
    location_mode: 'unspecified' as 'online' | 'onsite' | 'hybrid' | 'unspecified',
    isOnline: false,
    lat: null as number | null,
    lng: null as number | null,
    radius: 15 as number | null,
    location_hint: '' as string | null
  });

  function normalizeLocationNumber(v: unknown): number | null {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  function hasLocationPoint(loc: typeof locationScope) {
    return (
      typeof loc?.lat === 'number' && Number.isFinite(loc.lat) &&
      typeof loc?.lng === 'number' && Number.isFinite(loc.lng)
    );
  }
  function hasLocationValue(loc: typeof locationScope) {
    return loc?.location_mode !== 'unspecified' || hasLocationPoint(loc) || Boolean(loc?.location_hint?.trim());
  }
  function locationSummary(loc: typeof locationScope, tl: typeof ui) {
    if (!loc || !hasLocationValue(loc)) return tl.locationEmpty;
    if (loc.location_mode === 'online') return tl.locationOnline;
    if (hasLocationPoint(loc)) {
      const hint = loc.location_hint?.trim() || tl.locationSelected;
      return `${hint} - ${loc.radius || 15} km`;
    }
    return loc.location_hint?.trim() || tl.locationSelected;
  }

  const isComplex = $derived(mode === 'complex');
  const pricingMode = $derived<PricingMode>(isComplex ? 'estimated' : 'fixed');

  const sumMissions = $derived(
    recipeMissions.reduce(
      (s, m) =>
        s +
        (m.hoursPerUnit || 0) * (m.unitsPerProduct || 1) * (m.ratePerHour || 0),
      0
    )
  );
  const sumResources = $derived(
    recipeResources.reduce(
      (s, r) => s + (r.quantityPerUnit || 0) * (r.pricePerUnit || 0),
      0
    )
  );
  const subTotal = $derived(sumMissions + sumResources);
  const estimatedPrice = $derived(subTotal * (1 + marginPct / 100));
  const openItems = $derived(
    recipeMissions.filter((m) => !m.assignedMemberId).length +
      recipeResources.filter((r) => !r.assignedMemberId).length
  );

  // Used only for simple monthly/yearly preview, mirrors newmatana logic
  const simpleTotal = $derived.by(() => {
    const q = unlimitedM || kindOf === 'unlimited' ? 1 : quant;
    if ((kindOf === 'monthly' || kindOf === 'yearly') && dates && datef) {
      const a = new Date(dates);
      const b = new Date(datef);
      const months =
        (b.getFullYear() - a.getFullYear()) * 12 +
        (b.getMonth() - a.getMonth());
      if (kindOf === 'monthly') return months * fixedPrice * q;
      return (b.getFullYear() - a.getFullYear()) * fixedPrice * q;
    }
    return fixedPrice * q;
  });

  // ─── i18n ─────────────────────────────────────────────────────────────────
  const ui = $derived({
    title: $t('offerings.compose.title'),
    modeSimple: $t('offerings.compose.modeSimple'),
    modeComplex: $t('offerings.compose.modeComplex'),
    previewBadge: $t('offerings.compose.previewBadge'),
    name: $t('offerings.compose.name'),
    desc: $t('offerings.compose.desc'),
    image: $t('offerings.compose.image'),
    price: $t('offerings.compose.price'),
    kindOf: $t('offerings.compose.kindOf'),
    kindTotal: $t('offerings.compose.kindTotal'),
    kindMonthly: $t('offerings.compose.kindMonthly'),
    kindYearly: $t('offerings.compose.kindYearly'),
    kindUnlimited: $t('offerings.compose.kindUnlimited'),
    quant: $t('offerings.compose.quant'),
    unlimitedQuant: $t('offerings.compose.unlimitedQuant'),
    startDate: $t('offerings.compose.startDate'),
    endDate: $t('offerings.compose.endDate'),
    optional: $t('offerings.compose.optional'),
    oneForeProject: $t('offerings.compose.oneForeProject'),
    missions: $t('offerings.compose.missions'),
    resources: $t('offerings.compose.resources'),
    marginPct: $t('offerings.compose.marginPct'),
    subtotal: $t('offerings.compose.subtotal'),
    estimated: $t('offerings.compose.estimated'),
    total: $t('offerings.compose.total'),
    cancel: $t('offerings.compose.cancel'),
    openWarn: $t('offerings.compose.openWarn'),
    complexHint: $t('offerings.compose.complexHint'),
    locationTitle: $t('offerings.compose.locationTitle'),
    locationHelper: $t('offerings.compose.locationHelper'),
    locationEmpty: $t('offerings.compose.locationEmpty'),
    locationOnline: $t('offerings.compose.locationOnline'),
    locationSelected: $t('offerings.compose.locationSelected'),
    locationDone: $t('offerings.compose.locationDone'),
    submit: $t('common.save'),
    submitVote: $t('offerings.products.submitVote')
  });

  async function uploadPicIfAny(): Promise<string | null> {
    if (!croppedImage) return null;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: croppedImage as FormData
      });
      const json = await res.json();
      return Array.isArray(json) && json[0]?.id ? String(json[0].id) : null;
    } catch (err) {
      console.warn('[ComposeProduct] image upload failed', err);
      return null;
    }
  }

  function toRecipeMissionPayload(m: RecipeMissionRow) {
    return {
      missionId: m.missionId,
      mesimabetahalichId: m.mesimabetahalichId,
      name: m.name,
      hoursPerUnit: m.hoursPerUnit,
      unitsPerProduct: m.unitsPerProduct,
      ratePerHour: m.ratePerHour,
      mode: m.mode,
      assignedMemberId: m.assignedMemberId,
      onlyPartOf: m.onlyPartOf,
      notes: m.notes
    };
  }

  function toRecipeResourcePayload(r: RecipeResourceRow) {
    return {
      pmashId: r.pmashId,
      openMashaabimId: r.openMashaabimId,
      name: r.name,
      quantityPerUnit: r.quantityPerUnit,
      pricePerUnit: r.pricePerUnit,
      kindOf: r.kindOf,
      mode: r.mode,
      assignedMemberId: r.assignedMemberId,
      onlyPartOf: r.onlyPartOf,
      notes: r.notes
    };
  }

  async function handleSubmit() {
    if (!name.trim()) {
      error = true;
      return;
    }
    loading = true;
    error = false;
    success = false;

    try {
      const picId = await uploadPicIfAny();

      const params: Record<string, unknown> = {
        projectId,
        name: name.trim(),
        desc: description,
        pricingMode,
        marginPct,
        currency,
        estimatedPrice: isComplex ? estimatedPrice : fixedPrice,
        fixedPrice,
        kindOf,
        quant,
        unlimitedM,
        dates,
        datef,
        oneForeProject,
        picId,
        isOnline: locationScope.location_mode === 'online',
        lat: normalizeLocationNumber(locationScope.lat),
        lng: normalizeLocationNumber(locationScope.lng),
        radius: normalizeLocationNumber(locationScope.radius),
        location_hint: locationScope.location_hint?.trim() || null,
        recipeMissions: isComplex
          ? recipeMissions.map(toRecipeMissionPayload)
          : [],
        recipeResources: isComplex
          ? recipeResources.map(toRecipeResourcePayload)
          : []
      };

      const response = await fetch('/api/action', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey: 'createComplexMatanot', params })
      });

      const result = await response.json();
      if (!response.ok || result?.success === false) {
        throw new Error(result?.error || 'Failed to create product');
      }

      const data = result?.data ?? result;
      success = true;
      onDone?.({
        matana: data?.matanot ?? data,
        payload: params as ComposeProductPayload
      });
    } catch (e) {
      console.error('[ComposeProduct] submit failed', e);
      error = true;
    } finally {
      loading = false;
    }
  }
</script>

<div class="compose-product" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="mode-tabs" role="tablist">
    <button
      type="button"
      role="tab"
      class:active={mode === 'simple'}
      aria-selected={mode === 'simple'}
      onclick={() => (mode = 'simple')}
    >
      {ui.modeSimple}
    </button>
    <button
      type="button"
      role="tab"
      class:active={mode === 'complex'}
      aria-selected={mode === 'complex'}
      onclick={() => (mode = 'complex')}
    >
      {ui.modeComplex}
    </button>
  </div>

  <h2 class="title">
    {ui.title}
    <span class="title-mode">
      · {isComplex ? ui.modeComplex : ui.modeSimple}
    </span>
  </h2>

  <!-- Image -->
  <section class="section">
    <div class="label-block">{ui.image}</div>
    <UploadPic
      aspect={16 / 9}
      cropShape="rect"
      onMessage={(e: { files: unknown }) => (croppedImage = e.files)}
      color={true}
      noHeader={true}
      current={'/cover.png'}
    />
  </section>

  <!-- Name -->
  <label class="field">
    <span class="label-block">{ui.name}</span>
    <input bind:value={name} class="inputt" placeholder={ui.name} />
  </label>

  <!-- Description -->
  <label class="field">
    <span class="label-block">{ui.desc}</span>
    <textarea
      bind:value={description}
      class="inputt textarea"
      rows="3"
      placeholder={ui.desc}
    ></textarea>
  </label>

  <!-- Price (simple only) -->
  {#if !isComplex}
    <label class="field">
      <span class="label-block">{ui.price}</span>
      <input
        class="inputt"
        type="number"
        min="0"
        step="1"
        bind:value={fixedPrice}
      />
    </label>
  {/if}

  <!-- Kind -->
  <label class="field">
    <span class="label-block">{ui.kindOf}</span>
    <select class="inputt" bind:value={kindOf}>
      <option value="total">{ui.kindTotal}</option>
      <option value="monthly">{ui.kindMonthly}</option>
      <option value="yearly">{ui.kindYearly}</option>
      <option value="unlimited">{ui.kindUnlimited}</option>
    </select>
  </label>

  <!-- Quantity (hidden when unlimited) -->
  {#if kindOf !== 'unlimited' && !unlimitedM}
    <label class="field">
      <span class="label-block">{ui.quant}</span>
      <input class="inputt" type="number" min="0" step="1" bind:value={quant} />
    </label>
  {/if}

  {#if kindOf === 'monthly' || kindOf === 'yearly'}
    <label class="checkbox-row">
      <input type="checkbox" bind:checked={unlimitedM} />
      <span>{ui.unlimitedQuant}</span>
    </label>

    <label class="field">
      <span class="label-block"
        >{ui.startDate} <small class="hint">{ui.optional}</small></span
      >
      <input class="inputt" type="datetime-local" bind:value={dates} />
    </label>

    <label class="field">
      <span class="label-block"
        >{ui.endDate} <small class="hint">{ui.optional}</small></span
      >
      <input
        class="inputt"
        type="datetime-local"
        bind:value={datef}
        min={dates ?? undefined}
      />
    </label>
  {/if}

  <label class="checkbox-row">
    <input type="checkbox" bind:checked={oneForeProject} />
    <span>{ui.oneForeProject}</span>
  </label>

  <!-- Location -->
  <div class="field">
    <button
      type="button"
      class="location-toggle"
      class:active={locationOpen || hasLocationValue(locationScope)}
      onclick={() => (locationOpen = !locationOpen)}
    >
      {locationOpen ? ui.locationDone : locationSummary(locationScope, ui)}
    </button>
    {#if locationOpen}
      <LocationPicker
        bind:value={locationScope}
        label={ui.locationTitle}
        helper={ui.locationHelper}
        height="280px"
      />
    {/if}
  </div>

  <!-- Simple total preview -->
  {#if !isComplex}
    <div class="summary">
      <div class="sum-row total">
        <span>{ui.total}</span>
        <strong>
          ₪ {simpleTotal.toLocaleString('en', { maximumFractionDigits: 2 })}
          {#if unlimitedM || kindOf === 'unlimited'}
            <small>/ unit</small>
          {/if}
        </strong>
      </div>
    </div>
  {/if}

  <!-- ── COMPLEX-ONLY ADDITIONS ────────────────────────────────────────── -->
  {#if isComplex}
    <div class="complex-hint">{ui.complexHint}</div>

    <section class="section">
      <div class="section-head">
        <h3>{ui.missions}</h3>
      </div>
      <MissionPickerList
        bind:rows={recipeMissions}
        {projectId}
        {availableMissions}
        {projectMembers}
        {missionTemplates}
        {multiMember}
      />
    </section>

    <section class="section">
      <div class="section-head">
        <h3>{ui.resources}</h3>
      </div>
      <ResourcePickerList
        bind:rows={recipeResources}
        {projectId}
        {availableResources}
        {projectMembers}
        {resourceTemplates}
        {multiMember}
      />
    </section>

    <section class="section margin-section">
      <label class="field">
        <span class="label-block">
          {ui.marginPct}: <strong>{marginPct.toFixed(1)}%</strong>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.5"
          bind:value={marginPct}
        />
      </label>
    </section>

    <div class="summary">
      <div class="sum-row">
        <span>{ui.subtotal}</span>
        <strong>
          ₪ {subTotal.toLocaleString('en', { maximumFractionDigits: 2 })}
        </strong>
      </div>
      <div class="sum-row total">
        <span>{ui.estimated}</span>
        <strong>
          ₪ {estimatedPrice.toLocaleString('en', { maximumFractionDigits: 2 })}
        </strong>
      </div>
      {#if openItems > 0}
        <div class="open-warn">⚡ {ui.openWarn} ({openItems})</div>
      {/if}
    </div>
  {/if}

  <div class="actions">
    {#if onCancel}
      <button class="btn-secondary" type="button" onclick={onCancel}>
        {ui.cancel}
      </button>
    {/if}
    <Button
      text={isComplex ? ui.submitVote : ui.submit}
      onClick={handleSubmit}
      {loading}
      {success}
      {error}
    />
  </div>
</div>

<style>
  .location-toggle {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--bg-22, #2a2030);
    color: var(--gold-l, #f1c47a);
    border: 1px solid var(--border, #3b3540);
    border-radius: 8px;
    cursor: pointer;
    text-align: start;
    font-size: 0.9rem;
  }
  .location-toggle.active {
    border-color: var(--gold, #d8a64b);
  }

  .compose-product {
    background: var(--bg, #1f1c24);
    color: var(--text, #f4ecd6);
    border-radius: 14px;
    padding: 1rem;
    max-width: 760px;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;

    --gold: var(--gold, #d8a64b);
    --gold-l: var(--gold-l, #f1c47a);
    --border: var(--border, #3b3540);
    --tm: var(--tm, #b6acb1);
    --bg-22: #403151;
    --pink-l: var(--pink-l, #ff5a99);
  }

  .mode-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border);
  }
  .mode-tabs button {
    flex: 1;
    background: transparent;
    color: var(--tm);
    border: none;
    border-bottom: 3px solid transparent;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-weight: 600;
    transition:
      color 0.15s,
      border-color 0.15s;
  }
  .mode-tabs button.active {
    color: var(--gold);
    border-bottom-color: var(--gold);
  }
  .mode-tabs button:hover {
    color: var(--gold);
  }

  .preview-badge {
    align-self: center;
    background: rgba(216, 166, 75, 0.12);
    color: var(--gold-l);
    border: 1px dashed var(--gold);
    border-radius: 99px;
    padding: 2px 10px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .title {
    color: var(--gold);
    text-align: center;
    font-weight: 700;
    margin: 0;
    font-size: 1.15rem;
  }
  .title-mode {
    color: var(--tm);
    font-weight: 500;
  }

  .complex-hint {
    background: rgba(216, 166, 75, 0.08);
    border-inline-start: 3px solid var(--gold);
    color: var(--gold-l);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label-block {
    font-size: 0.85rem;
    color: var(--gold-l);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .hint {
    color: var(--tm);
    font-weight: 400;
    font-size: 0.75rem;
  }

  .inputt {
    background: var(--bg-22);
    color: var(--text, #f4ecd6);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 10px;
    width: 100%;
    box-sizing: border-box;
    font-size: 0.95rem;
  }
  .inputt::placeholder {
    color: var(--tm);
    opacity: 0.65;
  }
  .inputt:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgba(216, 166, 75, 0.25);
  }
  .textarea {
    resize: vertical;
    min-height: 70px;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text);
    font-size: 0.9rem;
    cursor: pointer;
  }
  .checkbox-row input[type='checkbox'] {
    accent-color: var(--gold);
  }

  .section {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.75rem;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .section-head h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--gold);
    margin: 0;
  }
  .margin-section input[type='range'] {
    width: 100%;
    accent-color: var(--gold);
  }

  .summary {
    background: var(--bg-2);
    border: 1px dashed var(--gold);
    border-radius: 10px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sum-row {
    display: flex;
    justify-content: space-between;
    color: var(--text);
  }
  .sum-row.total {
    font-size: 1.1rem;
    color: var(--gold);
  }
  .open-warn {
    font-size: 0.8rem;
    color: var(--pink-l);
    background: rgba(255, 90, 153, 0.1);
    padding: 6px 8px;
    border-radius: 6px;
    margin-top: 4px;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 0.25rem;
  }
  .btn-secondary {
    background: transparent;
    color: var(--tm);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
  }
  .btn-secondary:hover {
    color: var(--gold);
    border-color: var(--gold);
  }
</style>
