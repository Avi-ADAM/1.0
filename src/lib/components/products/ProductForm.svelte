<script lang="ts">
  /**
   * One form for a new product (docs/tbd/PLAN_PRODUCT_FORM_UNIFIED.md, phase 1).
   *
   * Laid out like the mission form: numbered sections, "more options" rows,
   * and a summary beside it (below it on a phone, with a sticky save bar).
   *
   * Pricing has exactly two modes, and neither adds anything on top:
   *   - **by actual cost** (recommended) — the price is the sum of the product's
   *     missions and resources, `priceAt(bom, 1, 0)`;
   *   - **fixed** — one number, optionally "priced per request" (`quote`).
   * The form never sends a margin: `marginPct` is always 0.
   *
   * The payload is the one `createComplexMatanot` always took. Pictures,
   * variants and stock are edited in the product editor that opens on save.
   */
  import { untrack } from 'svelte';
  import { Calculator, Tag, MapPin, Users, Images } from '@lucide/svelte';
  import { t, isRtl } from '$lib/translations';
  import Money from '$lib/components/money/Money.svelte';
  import CurrencyPicker from '$lib/components/money/CurrencyPicker.svelte';
  import { useMoney, useRikmaCurrency, useFormatMoney } from '$lib/money/context.svelte';
  import { DEFAULT_CURRENCY } from '$lib/money/currencies.js';
  import Button from '$lib/celim/ui/button.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import UploadPic from '$lib/components/userPr/uploadPic.svelte';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import FormSection from '$lib/components/prPr/missionForm/FormSection.svelte';
  import OptionRow from '$lib/components/prPr/missionForm/OptionRow.svelte';
  import MissionSummary from '$lib/components/prPr/missionForm/MissionSummary.svelte';
  import { lbl, inp, segBtn } from '$lib/components/prPr/missionForm/classes.js';
  import MissionPickerList from './MissionPickerList.svelte';
  import ResourcePickerList from './ResourcePickerList.svelte';
  import { hasGroupCurve, priceAt, risingPoints, toBomLines } from '$lib/pooling/priceCurve';
  import type {
    AvailableMission,
    AvailableResource,
    ComposeProductPayload,
    MissionTemplate,
    PricingMode,
    ProjectMember,
    RecipeMissionRow,
    RecipeResourceRow,
    ResourceTemplate
  } from './types';

  type Pricing = 'cost' | 'fixed';
  type Kind = 'total' | 'monthly' | 'yearly' | 'unlimited';

  type Props = {
    projectId: string;
    projectName?: string;
    availableMissions?: AvailableMission[];
    availableResources?: AvailableResource[];
    projectMembers?: ProjectMember[];
    missionTemplates?: MissionTemplate[];
    resourceTemplates?: ResourceTemplate[];
    /** Which pricing the form opens with; "by actual cost" unless a draft says otherwise. */
    initialPricing?: Pricing;
    /** Prefill from the quick create-product flow (CreateProductFlow draft). */
    initialDraft?: {
      name?: string;
      descrip?: string;
      price?: number | null;
      quant?: number | null;
      kindOf?: string;
      pricingMode?: string;
    } | null;
    onDone?: (data: { matana: unknown; payload?: ComposeProductPayload }) => void;
    onCancel?: () => void;
  };

  let {
    projectId,
    projectName = '',
    availableMissions = [],
    availableResources = [],
    projectMembers = [],
    missionTemplates = [],
    resourceTemplates = [],
    initialPricing = 'cost',
    initialDraft = null,
    onDone,
    onCancel
  }: Props = $props();

  // The draft and the opening pricing seed the form once; later prop changes do not reset it.
  const draft = untrack(() => initialDraft);
  const startPricing = untrack(() => initialPricing);

  const multiMember = $derived(projectMembers.length >= 2);
  const fmtMoney = useFormatMoney();

  // ── 1 · what ─────────────────────────────────────────────────────────────
  let name = $state(draft?.name ?? '');
  let description = $state(draft?.descrip ?? '');
  let croppedImage = $state<unknown>(null);
  let nameTouched = $state(false);

  // ── 2 · price ────────────────────────────────────────────────────────────
  let pricing = $state<Pricing>(startPricing);
  let fixedPrice = $state(
    draft?.price != null && Number(draft.price) > 0 ? Number(draft.price) : 0
  );
  let byQuote = $state(draft?.pricingMode === 'quote');
  const money = useMoney();
  const enclosingRikma = useRikmaCurrency();
  // A blank form starts in the writer's currency; a draft arrives with its
  // numbers already in the rikma's, so it starts there (PLAN_MULTI_CURRENCY C5).
  let currency = $state(
    draft?.price != null ? (enclosingRikma() ?? DEFAULT_CURRENCY) : money.currency
  );
  let recipeMissions = $state<RecipeMissionRow[]>([]);
  let recipeResources = $state<RecipeResourceRow[]>([]);

  // ── 3 · how it is sold ───────────────────────────────────────────────────
  const KINDS: Kind[] = ['total', 'monthly', 'yearly', 'unlimited'];
  let kindOf = $state<Kind>(
    KINDS.includes(draft?.kindOf as Kind) ? (draft!.kindOf as Kind) : 'total'
  );
  let quant = $state(
    draft?.quant != null && Number(draft.quant) > 0 ? Number(draft.quant) : 1
  );
  let unlimitedM = $state(false);
  let dates = $state<string | null>(null);
  let datef = $state<string | null>(null);
  let oneForeProject = $state(false);
  const periodic = $derived(kindOf === 'monthly' || kindOf === 'yearly');
  const showQuant = $derived(kindOf !== 'unlimited' && !unlimitedM);

  // ── more options ─────────────────────────────────────────────────────────
  let locationOpen = $state(false);
  let groupOpen = $state(false);
  let laterOpen = $state(false);
  let locationScope = $state({
    location_mode: 'unspecified' as 'online' | 'onsite' | 'hybrid' | 'unspecified',
    isOnline: false,
    lat: null as number | null,
    lng: null as number | null,
    radius: 15 as number | null,
    location_hint: '' as string | null
  });

  // A group curve only means something for a product offered to a demand pool.
  // Switching it off puts every line back to per-participant, so nothing the
  // author can no longer see still bends the price.
  let forGroup = $state(false);
  function setForGroup(on: boolean) {
    forGroup = on;
    if (on) return;
    recipeMissions = recipeMissions.map((m) => ({ ...m, costShape: null, stepCapacity: null }));
    recipeResources = recipeResources.map((r) => ({ ...r, costShape: null, stepCapacity: null }));
  }

  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const hasPoint = (l: typeof locationScope) => num(l.lat) != null && num(l.lng) != null;
  const hasLocation = (l: typeof locationScope) =>
    l.location_mode !== 'unspecified' || hasPoint(l) || Boolean(l.location_hint?.trim());
  const locationStatus = $derived.by(() => {
    const l = locationScope;
    if (!hasLocation(l)) return $t('offerings.compose.locationEmpty');
    if (l.location_mode === 'online') return $t('offerings.compose.locationOnline');
    const hint = l.location_hint?.trim() || $t('offerings.compose.locationSelected');
    return hasPoint(l) ? `${hint} - ${l.radius || 15} km` : hint;
  });

  // ── price math — all from $lib/pooling/priceCurve, never a margin ───────
  const isCost = $derived(pricing === 'cost');
  const bom = $derived(toBomLines(recipeMissions, recipeResources));
  const costPrice = $derived(priceAt(bom, 1, 0));
  const lineCount = $derived(recipeMissions.length + recipeResources.length);
  const openItems = $derived(
    recipeMissions.filter((m) => !m.assignedMemberId).length +
      recipeResources.filter((r) => !r.assignedMemberId).length
  );
  const groupCurve = $derived(isCost && forGroup && hasGroupCurve(bom));
  const CURVE_HORIZON = 50;
  const firstRise = $derived(groupCurve ? (risingPoints(bom, 1, CURVE_HORIZON, 0)[0] ?? null) : null);
  const curvePreview = $derived.by(() => {
    if (!groupCurve) return [];
    const ns = new Set([1, 2, 5, 10, 20, CURVE_HORIZON]);
    if (firstRise) {
      ns.add(firstRise.n - 1);
      ns.add(firstRise.n);
    }
    return [...ns].filter((n) => n >= 1).sort((a, b) => a - b).map((n) => ({ n, price: priceAt(bom, n, 0) }));
  });

  const pricingMode = $derived<PricingMode>(isCost ? 'estimated' : byQuote ? 'quote' : 'fixed');
  const unitPrice = $derived(isCost ? costPrice : Number(fixedPrice) || 0);
  const costFormula = $derived(
    $t('shopEditor.form.costFormula', {
      missions: recipeMissions.length,
      resources: recipeResources.length
    })
  );

  // ── summary ──────────────────────────────────────────────────────────────
  const kindLabel = (k: Kind) =>
    k === 'total' ? $t('shopEditor.form.kindTotal') : $t(`offerings.compose.kind${k[0].toUpperCase()}${k.slice(1)}`);
  const summaryMeta = $derived(
    [kindLabel(kindOf), showQuant ? `${quant} ×` : null].filter(Boolean).join(' · ')
  );
  const totalText = $derived(fmtMoney(unitPrice, currency));
  const formulaText = $derived(
    isCost
      ? `${costFormula} · ${$t('shopEditor.form.byCostMeta')}`
      : byQuote
        ? $t('shopEditor.form.quoteMeta')
        : $t('shopEditor.form.fixedMeta')
  );
  const nameOk = $derived(name.trim().length > 0);
  const priceOk = $derived(isCost ? lineCount > 0 : byQuote || Number(fixedPrice) > 0);
  const checks = $derived([
    { label: $t('shopEditor.form.checkName'), done: nameOk },
    { label: $t('shopEditor.form.checkPrice'), done: priceOk },
    { label: $t('shopEditor.form.checkSold'), done: kindOf === 'unlimited' || unlimitedM || quant > 0 },
    { label: $t('shopEditor.form.checkMore'), done: false, optional: true }
  ]);
  const note = $derived(multiMember ? $t('shopEditor.form.noteVote') : $t('shopEditor.form.noteSolo'));
  const saveText = $derived(multiMember ? $t('shopEditor.form.saveVote') : $t('shopEditor.form.save'));

  // ── save ─────────────────────────────────────────────────────────────────
  let loading = $state(false);
  let success = $state(false);
  let error = $state(false);
  let failMsg = $state('');

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
      console.warn('[ProductForm] image upload failed', err);
      return null;
    }
  }

  const missionPayload = (m: RecipeMissionRow) => ({
    missionId: m.missionId,
    mesimabetahalichId: m.mesimabetahalichId,
    name: m.name,
    hoursPerUnit: m.hoursPerUnit,
    unitsPerProduct: m.unitsPerProduct,
    ratePerHour: m.ratePerHour,
    mode: m.mode,
    assignedMemberId: m.assignedMemberId,
    onlyPartOf: m.onlyPartOf,
    notes: m.notes,
    costShape: m.costShape ?? null,
    stepCapacity: m.costShape === 'stepped' ? (m.stepCapacity ?? null) : null
  });
  const resourcePayload = (r: RecipeResourceRow) => ({
    pmashId: r.pmashId,
    openMashaabimId: r.openMashaabimId,
    name: r.name,
    quantityPerUnit: r.quantityPerUnit,
    pricePerUnit: r.pricePerUnit,
    kindOf: r.kindOf,
    mode: r.mode,
    assignedMemberId: r.assignedMemberId,
    onlyPartOf: r.onlyPartOf,
    notes: r.notes,
    costShape: r.costShape ?? null,
    stepCapacity: r.costShape === 'stepped' ? (r.stepCapacity ?? null) : null
  });

  async function handleSubmit() {
    nameTouched = true;
    if (!nameOk) {
      error = true;
      failMsg = $t('shopEditor.form.nameMissing');
      document.getElementById('pf-name')?.focus();
      return;
    }
    loading = true;
    error = false;
    success = false;
    failMsg = '';
    try {
      const picId = await uploadPicIfAny();
      const params: Record<string, unknown> = {
        projectId,
        name: name.trim(),
        desc: description,
        pricingMode,
        marginPct: 0,
        currency,
        estimatedPrice: unitPrice,
        fixedPrice: isCost ? 0 : Number(fixedPrice) || 0,
        kindOf,
        quant,
        unlimitedM,
        dates,
        datef,
        oneForeProject,
        picId,
        isOnline: locationScope.location_mode === 'online',
        lat: num(locationScope.lat),
        lng: num(locationScope.lng),
        radius: num(locationScope.radius),
        location_hint: locationScope.location_hint?.trim() || null,
        recipeMissions: isCost ? recipeMissions.map(missionPayload) : [],
        recipeResources: isCost ? recipeResources.map(resourcePayload) : []
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
      onDone?.({ matana: data?.matanot ?? data, payload: params as ComposeProductPayload });
    } catch (e) {
      console.error('[ProductForm] submit failed', e);
      error = true;
      failMsg = $t('shopEditor.form.failed');
    } finally {
      loading = false;
    }
  }

  const choice = (on: boolean) =>
    `flex min-h-[76px] flex-col items-start gap-1 rounded-2xl border-[1.5px] p-3.5 text-start transition sm:p-4 ${
      on
        ? 'border-[#c8155f] bg-[#fdeef4] ring-[3px] ring-[#c8155f]/15'
        : 'border-[#e4d9c4] bg-[#fffdf8] hover:border-[#d9a5bb]'
    }`;
</script>

{#snippet saveActions()}
  <div class="flex flex-col gap-2">
    {#if failMsg}
      <p class="m-0 text-sm font-medium text-[#b42318]" role="alert">{failMsg}</p>
    {/if}
    <div class="flex flex-wrap items-center justify-end gap-2">
      {#if onCancel}
        <button
          type="button"
          onclick={() => onCancel?.()}
          class="min-h-11 rounded-xl border-[1.5px] border-[#e4d9c4] bg-white px-4 text-sm text-[#2a1420] transition hover:border-[#c8155f]"
        >
          {$t('offerings.compose.cancel')}
        </button>
      {/if}
      <Button text={saveText} onClick={handleSubmit} {loading} {success} {error} />
    </div>
  </div>
{/snippet}

<div class="mx-auto flex w-full max-w-[1180px] flex-col gap-5 text-start" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="flex flex-col gap-2">
    {#if projectName}
      <span class="self-start rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#f1c47a]">{projectName}</span>
    {/if}
    <h1 class="m-0 text-3xl font-extrabold leading-tight text-white sm:text-4xl">{$t('shopEditor.form.title')}</h1>
    <p class="m-0 max-w-2xl text-base text-[#e9dfe4]">{$t('shopEditor.form.intro')}</p>
  </header>

  <!-- step rail (phone/tablet): jumps to a section, ✓ once it is complete -->
  <nav class="sticky top-2 z-10 flex gap-2 overflow-x-auto rounded-2xl bg-[#140b12]/90 p-1.5 backdrop-blur lg:hidden" aria-label={$t('shopEditor.form.summary')}>
    {#each [{ id: 'pf-s1', n: '1', done: nameOk }, { id: 'pf-s2', n: '2', done: priceOk }, { id: 'pf-s3', n: '3', done: true }, { id: 'pf-more', n: '+', done: false }] as s (s.id)}
      <a
        href="#{s.id}"
        class="flex min-h-10 flex-none items-center gap-1.5 rounded-xl px-3 text-sm font-bold {s.done
          ? 'bg-[#1f9d6b] text-white'
          : 'bg-white/10 text-[#f4ecd6]'}"
      >
        {s.done ? '✓' : s.n}
        <span class="font-medium">
          {s.id === 'pf-s1'
            ? $t('shopEditor.form.step1Title')
            : s.id === 'pf-s2'
              ? $t('shopEditor.form.step2Title')
              : s.id === 'pf-s3'
                ? $t('shopEditor.form.step3Title')
                : $t('shopEditor.form.moreTitle')}
        </span>
      </a>
    {/each}
  </nav>

  <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
    <div class="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
      <!-- 1 · what -->
      <div id="pf-s1" class="scroll-mt-16">
        <FormSection step={1} title={$t('shopEditor.form.step1Title')} subtitle={$t('shopEditor.form.step1Sub')}>
          <div>
            <label for="pf-name" class={lbl}>{$t('offerings.compose.name')}</label>
            <input
              id="pf-name"
              class={inp}
              bind:value={name}
              maxlength="120"
              placeholder={$t('shopEditor.form.namePh')}
              aria-invalid={nameTouched && !nameOk}
              onblur={() => (nameTouched = true)}
            />
            {#if nameTouched && !nameOk}
              <p class="m-0 mt-1.5 text-sm text-[#b42318]">{$t('shopEditor.form.nameMissing')}</p>
            {/if}
          </div>
          <div>
            <span class={lbl}>{$t('offerings.compose.desc')}</span>
            <div class="min-h-[120px] rounded-xl border-[1.5px] border-[#e4d9c4] bg-[#fffdf8] p-2 text-[#2a1420]">
              <RichText bind:outpot={description} editable={true} />
            </div>
          </div>
          <div>
            <span class={lbl}>{$t('shopEditor.form.image')}</span>
            <div class="max-w-md overflow-hidden rounded-xl bg-[#1f1c24] p-2">
              <UploadPic
                aspect={16 / 9}
                cropShape="rect"
                onMessage={(e: { files: unknown }) => (croppedImage = e.files)}
                color={true}
                noHeader={true}
                current={'/cover.png'}
              />
            </div>
          </div>
        </FormSection>
      </div>

      <!-- 2 · price -->
      <div id="pf-s2" class="scroll-mt-16">
        <FormSection step={2} title={$t('shopEditor.form.step2Title')} subtitle={$t('shopEditor.form.step2Sub')}>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={$t('shopEditor.form.step2Title')}>
            <button type="button" role="radio" aria-checked={isCost} class={choice(isCost)} onclick={() => (pricing = 'cost')}>
              <span class="flex items-center gap-2 text-base font-extrabold text-[#2a1420]">
                <Calculator size={18} class="text-[#c8155f]" aria-hidden="true" />
                {$t('shopEditor.form.byCost')}
                <span class="rounded-full bg-[#c8155f] px-2 py-0.5 text-[11px] font-bold text-white">{$t('shopEditor.form.recommended')}</span>
              </span>
              <span class="text-sm text-[#6b5560]">{$t('shopEditor.form.byCostSub')}</span>
            </button>
            <button type="button" role="radio" aria-checked={!isCost} class={choice(!isCost)} onclick={() => (pricing = 'fixed')}>
              <span class="flex items-center gap-2 text-base font-extrabold text-[#2a1420]">
                <Tag size={18} class="text-[#c8155f]" aria-hidden="true" />
                {$t('shopEditor.form.fixed')}
              </span>
              <span class="text-sm text-[#6b5560]">{$t('shopEditor.form.fixedSub')}</span>
            </button>
          </div>

          {#if isCost}
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="m-0 max-w-xl text-sm text-[#6b5560]">{$t('shopEditor.form.costHint')}</p>
              <CurrencyPicker bind:value={currency} compact class="!border-[#e4d9c4] !bg-[#fffdf8] !text-[#2a1420]" />
            </div>
            <!-- The BOM pickers keep their own (dark) look inside this panel. -->
            <div class="pf-bom flex flex-col gap-4 rounded-2xl bg-[#1f1c24] p-3 text-[#f4ecd6] sm:p-4">
              <section class="flex flex-col gap-2">
                <h3 class="m-0 text-sm font-bold text-[#f1c47a]">{$t('offerings.compose.missions')}</h3>
                <MissionPickerList
                  bind:rows={recipeMissions}
                  {projectId}
                  {currency}
                  {availableMissions}
                  {projectMembers}
                  {missionTemplates}
                  {multiMember}
                  groupPricing={forGroup}
                />
              </section>
              <section class="flex flex-col gap-2">
                <h3 class="m-0 text-sm font-bold text-[#f1c47a]">{$t('offerings.compose.resources')}</h3>
                <ResourcePickerList
                  bind:rows={recipeResources}
                  {projectId}
                  {currency}
                  {availableResources}
                  {projectMembers}
                  {resourceTemplates}
                  {multiMember}
                  groupPricing={forGroup}
                />
              </section>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#eee2a6] bg-[#fdf9ea] px-4 py-3">
              <span class="text-sm text-[#6b5560]" dir="auto">
                {lineCount > 0 ? costFormula : $t('shopEditor.form.noLines')}
              </span>
              <strong class="text-2xl font-extrabold text-[#2a1420]"><Money amount={costPrice} {currency} /></strong>
            </div>
            {#if openItems > 0}
              <p class="m-0 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#8a4b00]">
                {$t('shopEditor.form.openItems', { count: openItems })} — {$t('offerings.compose.openWarn')}
              </p>
            {/if}
          {:else}
            <div class="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label for="pf-price" class={lbl}>
                  {byQuote ? $t('offerings.compose.priceFrom') : $t('offerings.compose.price')}
                </label>
                <input id="pf-price" class={inp} type="number" min="0" step="any" inputmode="decimal" bind:value={fixedPrice} />
              </div>
              <CurrencyPicker bind:value={currency} class="h-[52px] !border-[#e4d9c4] !bg-[#fffdf8] !text-[#2a1420]" />
            </div>
            <label class="flex cursor-pointer items-start gap-2.5 text-[#2a1420]">
              <input type="checkbox" class="mt-1 h-4 w-4 accent-[#c8155f]" bind:checked={byQuote} />
              <span class="flex flex-col gap-0.5">
                <strong class="text-sm">{$t('offerings.compose.byQuote')}</strong>
                <small class="text-xs text-[#6b5560]">{$t('offerings.compose.byQuoteHint')}</small>
              </span>
            </label>
          {/if}
        </FormSection>
      </div>

      <!-- 3 · how it is sold -->
      <div id="pf-s3" class="scroll-mt-16">
        <FormSection step={3} title={$t('shopEditor.form.step3Title')} subtitle={$t('shopEditor.form.step3Sub')}>
          <div class="inline-flex flex-wrap gap-1 self-start rounded-xl bg-[#f6f0e4] p-1" role="group" aria-label={$t('offerings.compose.kindOf')}>
            {#each KINDS as k (k)}
              <button type="button" aria-pressed={kindOf === k} class={segBtn(kindOf === k)} onclick={() => (kindOf = k)}>
                {kindLabel(k)}
              </button>
            {/each}
          </div>
          {#if periodic}
            <label class="flex cursor-pointer items-center gap-2.5 text-sm text-[#2a1420]">
              <input type="checkbox" class="h-4 w-4 accent-[#c8155f]" bind:checked={unlimitedM} />
              {$t('offerings.compose.unlimitedQuant')}
            </label>
          {/if}
          {#if showQuant}
            <div class="max-w-[220px]">
              <label for="pf-quant" class={lbl}>{$t('offerings.compose.quant')}</label>
              <input id="pf-quant" class={inp} type="number" min="0" step="1" bind:value={quant} />
            </div>
          {/if}
          {#if periodic}
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label for="pf-start" class={lbl}>
                  {$t('offerings.compose.startDate')} <small class="font-normal text-[#6b5560]">{$t('offerings.compose.optional')}</small>
                </label>
                <input id="pf-start" class={inp} type="datetime-local" bind:value={dates} />
              </div>
              <div>
                <label for="pf-end" class={lbl}>
                  {$t('offerings.compose.endDate')} <small class="font-normal text-[#6b5560]">{$t('offerings.compose.optional')}</small>
                </label>
                <input id="pf-end" class={inp} type="datetime-local" bind:value={datef} min={dates ?? undefined} />
              </div>
            </div>
          {/if}
          <label class="flex cursor-pointer items-center gap-2.5 text-sm text-[#2a1420]">
            <input type="checkbox" class="h-4 w-4 accent-[#c8155f]" bind:checked={oneForeProject} />
            {$t('offerings.compose.oneForeProject')}
          </label>
        </FormSection>
      </div>

      <!-- more options — now or later -->
      <div id="pf-more" class="scroll-mt-16">
        <FormSection title={$t('shopEditor.form.moreTitle')} subtitle={$t('shopEditor.form.moreSub')}>
          <div class="flex flex-col gap-3">
            <OptionRow icon={MapPin} title={$t('shopEditor.form.location')} status={locationStatus} bind:open={locationOpen}>
              <LocationPicker
                bind:value={locationScope}
                label={$t('offerings.compose.locationTitle')}
                helper={$t('offerings.compose.locationHelper')}
                height="280px"
              />
            </OptionRow>

            {#if isCost}
              <OptionRow
                icon={Users}
                title={$t('shopEditor.form.group')}
                status={forGroup ? $t('shopEditor.form.groupOn') : $t('shopEditor.form.groupOff')}
                bind:open={groupOpen}
              >
                <label class="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    class="mt-1 h-4 w-4 accent-[#c8155f]"
                    checked={forGroup}
                    onchange={(e) => setForGroup(e.currentTarget.checked)}
                  />
                  <span class="flex flex-col gap-0.5">
                    <strong class="text-sm">{$t('shopEditor.form.groupLabel')}</strong>
                    <small class="text-xs text-[#6b5560]">{$t('shopEditor.form.groupHint')}</small>
                  </span>
                </label>
                {#if groupCurve}
                  <div class="mt-3 flex flex-col gap-2">
                    <strong class="text-sm">{$t('offerings.compose.curveTitle')}</strong>
                    <table class="w-full max-w-sm text-sm">
                      <thead>
                        <tr class="text-[#6b5560]">
                          <th scope="col" class="py-1 text-start font-medium">{$t('offerings.compose.curveN')}</th>
                          <th scope="col" class="py-1 text-start font-medium">{$t('offerings.compose.curvePrice')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each curvePreview as p (p.n)}
                          <tr class="border-t border-[#efe6d3] {firstRise?.n === p.n ? 'font-bold text-[#c8155f]' : ''}">
                            <td class="py-1">{p.n}</td>
                            <td class="py-1"><Money amount={p.price} {currency} /></td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                    {#if firstRise}
                      <p class="m-0 text-xs text-[#c8155f]">{$t('offerings.compose.curveRises', { count: firstRise.n })}</p>
                    {/if}
                  </div>
                {/if}
              </OptionRow>
            {/if}

            <OptionRow icon={Images} title={$t('shopEditor.form.later')} status={$t('shopEditor.form.laterStatus')} bind:open={laterOpen}>
              <p class="m-0 text-sm leading-relaxed text-[#6b5560]">{$t('shopEditor.form.laterBody')}</p>
            </OptionRow>
          </div>
        </FormSection>
      </div>
    </div>

    <aside class="hidden lg:sticky lg:top-4 lg:block lg:w-[340px] lg:flex-none">
      <MissionSummary
        heading={$t('shopEditor.form.summary')}
        {name}
        meta={summaryMeta}
        valueLabel={$t('shopEditor.form.priceLabel')}
        total={totalText}
        formula={formulaText}
        {checks}
        {note}
      >
        {#snippet actions()}
          {@render saveActions()}
        {/snippet}
      </MissionSummary>
    </aside>
  </div>

  <div class="lg:hidden">
    <MissionSummary
      wide
      heading={$t('shopEditor.form.summary')}
      {name}
      meta={summaryMeta}
      valueLabel={$t('shopEditor.form.priceLabel')}
      total={totalText}
      formula={formulaText}
      {checks}
      {note}
    >
      {#snippet actions()}
        {@render saveActions()}
      {/snippet}
    </MissionSummary>
  </div>

  <!-- save bar (phone/tablet), above the app's bottom nav -->
  <div
    class="sticky bottom-24 z-10 flex items-center gap-3 rounded-2xl border border-[#eee2a6] bg-[#fffdf7] p-3 shadow-[0_-6px_30px_rgba(0,0,0,.18)] lg:hidden"
  >
    <div class="min-w-0 flex-1">
      <strong class="block truncate text-xl font-extrabold text-[#c8155f]" dir="auto">{totalText}</strong>
      <span class="block truncate text-xs text-[#6b5560]" dir="auto">{formulaText}</span>
    </div>
    <Button text={saveText} onClick={handleSubmit} {loading} {success} {error} />
  </div>
</div>
