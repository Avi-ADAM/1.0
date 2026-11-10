<script lang="ts">
  /**
   * One form for a product, new or existing (docs/inprogress/PLAN_PRODUCT_FORM_UNIFIED.md).
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
   * New: the payload is the one `createComplexMatanot` always took; pictures,
   * variants and stock are staged and written with the new id once it exists.
   *
   * Existing (`product` is set): one save, two speeds, exactly as
   * `saveProductVariants` decides them. Stock, pictures, SKU and order apply at
   * once; a moved price, a new variant or a changed detail is proposed to the
   * partners, unless the product is sovereign. What the product is made of is
   * such a term too (`$lib/shop/bomEditor`); how the price is determined stays
   * as it was created.
   */
  import '$lib/styles/shop.css';
  import { untrack } from 'svelte';
  import { beforeNavigate, goto, invalidate } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { Calculator, Tag, MapPin, Users, Images, Layers, Boxes, Archive } from '@lucide/svelte';
  import { executeAction } from '$lib/client/actionClient';
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
  import GalleryField from './GalleryField.svelte';
  import VariantsField from './VariantsField.svelte';
  import ProductChangesPanel from './ProductChangesPanel.svelte';
  import BomLinesField from './BomLinesField.svelte';
  import BomApproval from './BomApproval.svelte';
  import { bomCostAfter, bomResourcesToPick, planBomChanges, type BomAddDraft, type BomPlan, type BomResourcePick } from '$lib/shop/bomEditor';
  import ArchiveObjectButton from '$lib/components/archive/ArchiveObjectButton.svelte';
  import { hasGroupCurve, priceAt, risingPoints, toBomLines } from '$lib/pooling/priceCurve';
  import { shopOrdersKey, shopProductsKey } from '$lib/shop/keys';
  import {
    buildMatrix,
    normaliseAxes,
    pendingByVariant,
    planVariantSave,
    stampNewSkus,
    validateVariants,
    type EditorAxis
  } from '$lib/shop/variantEditor';
  import {
    detailChanges,
    isCostPriced,
    sameLocation,
    type EditorPicture,
    type EditorProduct,
    type EditorRow,
    type ProductKind
  } from '$lib/shop/productEditor';
  import type {
    AvailableMission,
    AvailableResource,
    BomLineRow,
    ComposeProductPayload,
    MissionTemplate,
    PricingMode,
    ProjectMember,
    RecipeMissionRow,
    RecipeResourceRow,
    ResourceTemplate
  } from './types';

  type Pricing = 'cost' | 'fixed';
  type Kind = ProductKind;

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
    /** The product being edited; absent on a new one. */
    product?: EditorProduct | null;
    /** The rikma's option axes, offered back when the seller adds one. */
    rikmaAxes?: EditorAxis[];
    /** SKUs of the rikma's other products. */
    takenSkus?: string[];
    /** The signed-in member: an open proposal may ask them something. */
    viewerId?: string;
    /** Which "more options" rows start open. */
    initialOpen?: 'variants' | null;
    onDone?: (data: { matana: unknown; payload?: ComposeProductPayload; stagedFailed?: boolean }) => void;
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
    product = null,
    rikmaAxes = [],
    takenSkus = [],
    viewerId = '',
    initialOpen = null,
    onDone,
    onCancel
  }: Props = $props();

  // The draft and the opening pricing seed the form once; later prop changes do not reset it.
  const draft = untrack(() => initialDraft);
  const startPricing = untrack(() => initialPricing);
  const startProduct = untrack(() => product);
  const startOpen = untrack(() => initialOpen);

  const multiMember = $derived(projectMembers.length >= 2);
  const sovereign = $derived(product ? product.sovereign : !multiMember);
  const fmtMoney = useFormatMoney();

  // ── 1 · what ─────────────────────────────────────────────────────────────
  let name = $state(draft?.name ?? '');
  let description = $state(draft?.descrip ?? '');
  let croppedImage = $state<unknown>(null);
  let nameTouched = $state(false);
  // RichText is mounted once; a reset re-seeds it through this key.
  let descripSeed = $state(0);

  // ── 2 · price ────────────────────────────────────────────────────────────
  let pricing = $state<Pricing>(startPricing);
  let fixedPrice = $state<number | null>(
    draft?.price != null && Number(draft.price) > 0 ? Number(draft.price) : 0
  );
  let byQuote = $state(draft?.pricingMode === 'quote');
  const money = useMoney();
  const enclosingRikma = useRikmaCurrency();
  // A blank form starts in the writer's currency; a draft or a stored product
  // has its numbers in the rikma's already, so it starts there (PLAN_MULTI_CURRENCY C5).
  let currency = $state(
    draft?.price != null || startProduct ? (enclosingRikma() ?? DEFAULT_CURRENCY) : money.currency
  );
  let recipeMissions = $state<RecipeMissionRow[]>([]);
  let recipeResources = $state<RecipeResourceRow[]>([]);
  // Editing: the stored lines. New lines of an existing product sit in the two lists above.
  let bomLines = $state<BomLineRow[]>([]);
  // The seller typed a price of their own; until then it follows the recipe.
  let priceTyped = $state(false);

  // ── 3 · how it is sold ───────────────────────────────────────────────────
  const KINDS: Kind[] = ['total', 'monthly', 'yearly', 'unlimited'];
  let kindOf = $state<Kind>(
    KINDS.includes(draft?.kindOf as Kind) ? (draft!.kindOf as Kind) : 'total'
  );
  let quant = $state<number>(
    draft?.quant != null && Number(draft.quant) > 0 ? Number(draft.quant) : 1
  );
  let unlimitedM = $state(false);
  let dates = $state<string | null>(null);
  let datef = $state<string | null>(null);
  let oneForeProject = $state(false);
  const periodic = $derived(kindOf === 'monthly' || kindOf === 'yearly');
  let rows = $state<EditorRow[]>([]);
  const kindChoices = $derived<Kind[]>(product?.kindOf === 'daily' ? [...KINDS, 'daily'] : KINDS);
  // With variants the count lives on each of them.
  const showQuant = $derived(kindOf !== 'unlimited' && !unlimitedM && !rows.length);
  const showUnlimitedM = $derived(periodic || (!!product?.unlimited && !rows.length));

  // ── more options ─────────────────────────────────────────────────────────
  let locationOpen = $state(false);
  let groupOpen = $state(false);
  let galleryOpen = $state(startOpen === 'variants');
  let variantsOpen = $state(startOpen === 'variants');
  let stockOpen = $state(false);
  let removeOpen = $state(false);
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

  // ── pictures, options, variants, stock — staged when new, saved when not ─
  let gallery = $state<EditorPicture[]>([]);
  let axes = $state<EditorAxis[]>([]);
  let lowAt = $state('');
  let why = $state('');
  let uploading = $state(false);

  const parseNum = (s: string): number | null => (s.trim() === '' ? null : Number(s.replace(',', '.')));
  const clean = $derived(normaliseAxes(axes));
  const storedCounts = $derived(
    new Map((product?.variants ?? []).filter((v) => v.id && !v.unlimited).map((v) => [v.id as string, v.quant]))
  );
  const issues = $derived(validateVariants(rows, takenSkus, storedCounts));
  const stagedTouched = $derived(
    gallery.length > 0 || axes.length > 0 || rows.length > 0 || lowAt.trim() !== ''
  );

  function pictureRemoved(id: string) {
    for (const r of rows) r.picIds = r.picIds.filter((x) => x !== id);
  }

  const variantPayload = (r: EditorRow, i: number) => ({
    id: r.id,
    optionValues: r.optionValues.map(({ key, value }) => ({ key, value })),
    name: r.name,
    sku: r.sku,
    price: r.price,
    compareAtPrice: r.compareAtPrice,
    quant: r.quant,
    unlimited: r.unlimited,
    active: r.active,
    position: i,
    picIds: r.picIds
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
  // ── what the recipe of an existing product becomes ──────────────────────
  const missionAdd = (m: RecipeMissionRow): BomAddDraft => ({
    line: 'mission',
    name: m.name,
    amount: m.hoursPerUnit,
    units: m.unitsPerProduct,
    unit: m.ratePerHour,
    notes: m.notes,
    mesimabetahalichId: m.mesimabetahalichId,
    assignedMemberId: m.mode === 'createNew' ? m.assignedMemberId : null
  });
  const resourceAdd = (r: RecipeResourceRow): BomAddDraft => ({
    line: 'resource',
    name: r.name,
    amount: r.quantityPerUnit,
    units: 1,
    unit: r.pricePerUnit,
    notes: r.notes,
    resourceKind: r.kindOf,
    pmashId: r.pmashId,
    openMashaabimId: r.openMashaabimId,
    assignedMemberId: r.mode === 'createNew' ? r.assignedMemberId : null
  });
  const bomEditable = $derived(!!product && isCost && !product.recipeLocked);
  const bomDraft = $derived({
    lines: bomLines.map(({ id, amount, unit, removed }) => ({ id, amount, unit, removed })),
    add: [...recipeMissions.map(missionAdd), ...recipeResources.map(resourceAdd)]
  });
  const bomPlan = $derived<BomPlan>(product && bomEditable ? planBomChanges(product.recipe, bomDraft) : { terms: [], errors: [] });
  const bomMoves = $derived(bomPlan.terms.length > 0);
  const bomCost = $derived(product ? bomCostAfter(product.recipe, bomPlan.terms) : 0);
  const priceFollows = $derived(bomMoves && !priceTyped);

  // On an existing product the price is the stored number, whatever its mode,
  // until the recipe it is the sum of moves.
  const base = $derived(priceFollows ? bomCost : fixedPrice === null || String(fixedPrice) === '' ? null : Number(fixedPrice));
  const unitPrice = $derived(product ? (base ?? 0) : isCost ? costPrice : Number(fixedPrice) || 0);
  const plan = $derived(
    planVariantSave({
      existing: product?.variants ?? [],
      desired: rows,
      productPrice: product ? product.price : unitPrice,
      sovereign
    })
  );
  const storedCount = (kind: 'mission' | 'resource') => bomLines.filter((l) => l.kind === kind && !l.removed).length;
  const costFormula = $derived(
    $t('shopEditor.form.costFormula', {
      missions: recipeMissions.length + storedCount('mission'),
      resources: recipeResources.length + storedCount('resource')
    })
  );

  // ── summary ──────────────────────────────────────────────────────────────
  const kindLabel = (k: Kind) =>
    k === 'total'
      ? $t('shopEditor.form.kindTotal')
      : k === 'daily'
        ? $t('shopEditor.details.kind.daily')
        : $t(`offerings.compose.kind${k[0].toUpperCase()}${k.slice(1)}`);
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
  const priceOk = $derived(
    product ? isCost || byQuote || unitPrice > 0 : isCost ? lineCount > 0 : byQuote || Number(fixedPrice) > 0
  );
  const checks = $derived([
    { label: $t('shopEditor.form.checkName'), done: nameOk },
    { label: $t('shopEditor.form.checkPrice'), done: priceOk },
    { label: $t('shopEditor.form.checkSold'), done: kindOf === 'unlimited' || unlimitedM || quant > 0 },
    { label: $t('shopEditor.form.checkMore'), done: gallery.length > 0 || rows.length > 0, optional: true }
  ]);
  const note = $derived(
    product
      ? ''
      : multiMember
        ? isCost
          ? $t('shopEditor.form.noteVote')
          : $t('shopEditor.form.noteLive')
        : $t('shopEditor.form.noteSolo')
  );

  // ── what an edit changes ─────────────────────────────────────────────────
  const baseInvalid = $derived(base !== null && (!Number.isFinite(base) || base < 0));
  const baseMoves = $derived(!!product && base !== null && Number.isFinite(base) && base !== product.price);
  const detailsDraft = $derived({ name, descrip: description, kindOf, startDate: dates ?? '', endDate: datef ?? '' });
  const details = $derived(product ? detailChanges(detailsDraft, product) : {});
  const proposing = $derived(
    !!product &&
      ((!product.sovereign && (plan.terms.length > 0 || baseMoves || Object.keys(details).length > 0 || bomMoves)) ||
        (product.recipeIsDeal && bomMoves))
  );
  const waiting = $derived(product?.pending ? pendingByVariant(product.pending.terms) : null);
  const stockMoves = $derived(
    !!product &&
      !rows.length &&
      kindOf !== 'unlimited' &&
      (unlimitedM !== product.unlimited || (!unlimitedM && Number(quant) !== (product.quant ?? 0)))
  );
  const stockInvalid = $derived(stockMoves && !unlimitedM && !(Number(quant) >= 0));
  const locationMoves = $derived(!!product && !sameLocation(locationScope, product.location));
  // How a product with no recipe is priced is its owner's call on a sovereign
  // product; on a rikma's it stays as it was created.
  const quoteLocked = $derived(!!product && !product.sovereign);
  const nextMode = $derived(byQuote ? 'quote' : 'fixed');
  const modeMoves = $derived(
    !!product && product.sovereign && !isCost && nextMode !== (product.pricingMode ?? 'fixed')
  );

  function snapshot(): string {
    return JSON.stringify({
      g: gallery.map((p) => p.id),
      a: axes,
      r: rows,
      b: base,
      bom: bomDraft,
      lowAt,
      d: details,
      s: stockMoves,
      l: locationMoves,
      m: modeMoves
    });
  }
  let saved = $state('');
  const dirty = $derived(!!product && snapshot() !== saved);

  const saveText = $derived(
    product
      ? proposing
        ? $t('shopEditor.saveAndPropose')
        : $t('shopEditor.save')
      : multiMember && isCost
        ? $t('shopEditor.form.saveVote')
        : $t('shopEditor.form.save')
  );
  const moneyText = (n: number | null) => (n === null ? '—' : fmtMoney(n, currency));

  // ── save ─────────────────────────────────────────────────────────────────
  let loading = $state(false);
  let success = $state(false);
  let error = $state(false);
  let failMsg = $state('');

  // ── seeding from a stored product ────────────────────────────────────────
  const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  function seed(p: EditorProduct) {
    name = p.name;
    description = p.descrip;
    descripSeed++;
    pricing = isCostPriced(p) ? 'cost' : 'fixed';
    fixedPrice = p.price;
    priceTyped = false;
    bomLines = p.recipe.map((l) => ({ ...l, removed: false }));
    recipeMissions = [];
    recipeResources = [];
    byQuote = p.pricingMode === 'quote';
    kindOf = p.kindOf;
    unlimitedM = p.unlimited;
    quant = p.unlimited ? 1 : (p.quant ?? 0);
    dates = p.startDate?.slice(0, 10) ?? '';
    datef = p.endDate?.slice(0, 10) ?? '';
    oneForeProject = p.oneForeProject;
    const l = p.location;
    locationScope = {
      location_mode: l?.location_mode ?? 'unspecified',
      isOnline: l?.location_mode === 'online',
      lat: l?.lat ?? null,
      lng: l?.lng ?? null,
      radius: l?.radius ?? 15,
      location_hint: l?.location_hint ?? ''
    };
    gallery = copy(p.gallery);
    axes = copy(p.axes);
    rows = copy(p.variants);
    lowAt = p.lowStockAt === null ? '' : String(p.lowStockAt);
    why = '';
    saved = snapshot();
  }

  if (startProduct) seed(startProduct);
  // A fresh load (after a save, or the rikma approving) starts from what is stored.
  let seeded = startProduct;
  $effect(() => {
    const p = product;
    if (!p || p === seeded) return;
    seeded = p;
    untrack(() => seed(p));
  });

  beforeNavigate((nav) => {
    if (dirty && !loading && !confirm($t('shopEditor.leave'))) nav.cancel();
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

  /** Pictures, variants and stock of a product that has just been created. */
  async function saveStaged(productId: string, coverId: string | null): Promise<boolean> {
    if (!stagedTouched) return true;
    const res: any = await executeAction(
      'saveProductVariants' as any,
      {
        projectId,
        productId,
        axes: clean.axes,
        variants: stampNewSkus(rows, productId).map(variantPayload),
        gallery: [coverId, ...gallery.map((p) => p.id)].filter(Boolean),
        ...(lowAt.trim() ? { lowStockAt: parseNum(lowAt) } : {}),
        why: ''
      },
      { showErrorToast: false }
    ).catch(() => null);
    if (!res?.success) return false;
    if (res.data?.blocked === 'VARIANT_TERMS_NOT_READY') toast.warning($t('shopEditor.err.notReady'));
    else if (res.data?.blocked === 'OPEN_PROPOSAL') toast.warning($t('shopEditor.err.openProposal'));
    else if (res.data?.proposed) toast.success($t('shopEditor.savedProposed'));
    return true;
  }

  let selfApproval = $state<ReturnType<typeof BomApproval>>();

  async function saveEdit(p: EditorProduct, picks?: BomResourcePick[]) {
    nameTouched = true;
    if (!dirty || uploading) return;
    if (!nameOk || issues.length || clean.errors.length || baseInvalid || stockInvalid) {
      if (issues.length || clean.errors.length) variantsOpen = true;
      toast.error($t('shopEditor.err.fix'));
      return;
    }
    if (bomPlan.errors.length) {
      document.getElementById('pf-bom')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error($t(bomPlan.errors.includes('bomEmpty') ? 'shopEditor.err.bomEmpty' : 'shopEditor.err.bomFix'));
      return;
    }
    // Saving is my yes, so a resource I take on says here which of mine it is.
    if (!picks && bomResourcesToPick(bomPlan.terms, viewerId).length) {
      selfApproval?.start();
      return;
    }
    loading = true;
    const res: any = await executeAction(
      'saveProductVariants' as any,
      {
        projectId,
        productId: p.id,
        axes: clean.axes,
        variants: rows.map(variantPayload),
        gallery: gallery.map((x) => x.id),
        ...(baseMoves ? { basePrice: base } : {}),
        lowStockAt: parseNum(lowAt),
        ...(Object.keys(details).length ? { details: detailsDraft } : {}),
        ...(stockMoves ? { stock: { quant: Number(quant), unlimited: unlimitedM } } : {}),
        ...(locationMoves ? { location: locationScope } : {}),
        ...(modeMoves ? { pricingMode: nextMode } : {}),
        ...(bomMoves ? { bom: { ...bomDraft, picks: picks ?? [] } } : {}),
        why: why.trim()
      },
      { showErrorToast: false }
    ).catch(() => null);
    loading = false;
    if (!res?.success) {
      toast.error($t('shopEditor.err.generic'));
      return;
    }
    const d = res.data ?? {};
    if (d.blocked === 'OPEN_PROPOSAL') toast.warning($t('shopEditor.err.openProposal'));
    else if (d.blocked === 'VARIANT_TERMS_NOT_READY') toast.warning($t('shopEditor.err.notReady'));
    else if (d.blocked === 'BOM_TERMS_NOT_READY') toast.warning($t('shopEditor.err.bomNotReady'));
    else toast.success(d.proposed ? $t('shopEditor.savedProposed') : $t('shopEditor.saved'));
    if (d.lowStockSaved === false) toast.message($t('shopEditor.stock.lowNotSaved'));
    saved = snapshot();
    await refreshShop();
  }

  const refreshShop = () =>
    Promise.all([invalidate(shopProductsKey(projectId)), invalidate(shopOrdersKey(projectId))]);

  // ── removing from the shop ───────────────────────────────────────────────
  // Never a delete (sales, orders and halukas point at the product): it is
  // archived. A personal product is its owner's call; a rikma product goes
  // through proposeObjectArchive, at once in a rikma of one.
  let removing = $state(false);
  const removalOpen = $derived(!!product?.openDecisionId && !product?.pending);

  async function afterRemoved() {
    await refreshShop();
    // A proposal leaves the product live until it matures — stay on it.
    if (product?.sovereign) {
      saved = snapshot();
      await goto(`/moach/${projectId}/sales/manage/products`);
    }
  }

  async function removePersonal(p: EditorProduct) {
    if (removing || !confirm($t('shopEditor.remove.confirm', { name: p.name }))) return;
    removing = true;
    const res: any = await executeAction('archivePersonalMatanot' as any, { matanotId: p.id }, { showErrorToast: false }).catch(
      () => null
    );
    removing = false;
    if (!res?.success) {
      toast.error($t('shopEditor.remove.failed'));
      return;
    }
    toast.success($t('shopEditor.remove.done'));
    await afterRemoved();
  }

  function openGallery() {
    galleryOpen = true;
    document.getElementById('pf-more')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit() {
    if (product) return saveEdit(product);
    if (uploading) return;
    nameTouched = true;
    if (!nameOk) {
      error = true;
      failMsg = $t('shopEditor.form.nameMissing');
      document.getElementById('pf-name')?.focus();
      return;
    }
    // Options named but the table never generated: the seller meant those variants.
    if (!clean.errors.length && axes.length) {
      const matrix = buildMatrix({ axes: clean.axes, existing: rows, productId: null });
      if (matrix.added > 0) rows = matrix.variants.map((v) => ({ ...v, pictures: (v as EditorRow).pictures ?? [] }));
    }
    if (issues.length || clean.errors.length) {
      variantsOpen = true;
      error = true;
      failMsg = $t('shopEditor.err.fix');
      return;
    }
    // The save writes a variant's price as typed, in the rikma's own currency.
    const rikmaCurrency = enclosingRikma();
    if (rikmaCurrency && currency !== rikmaCurrency && rows.some((r) => r.price !== null)) {
      variantsOpen = true;
      error = true;
      failMsg = $t('shopEditor.form.variantsCurrency', { currency: rikmaCurrency });
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
      const matana = data?.matanot ?? data;
      const newId = data?.matanotId ?? matana?.id;
      const stagedOk = newId != null ? await saveStaged(String(newId), picId) : !stagedTouched;
      if (!stagedOk) toast.error($t('shopEditor.form.stagedFailed'));
      success = true;
      onDone?.({ matana, payload: params as ComposeProductPayload, stagedFailed: !stagedOk });
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
      <Button text={saveText} onClick={handleSubmit} {loading} {success} {error} disabled={!!product && !dirty} />
    </div>
  </div>
{/snippet}

{#snippet changes()}
  {#if product}
    <div class="shop-ui pf-fields flex flex-col gap-3">
      <ProductChangesPanel
        {projectId}
        {product}
        {plan}
        {details}
        bom={bomPlan.terms}
        {viewerId}
        onChanged={refreshShop}
        {base}
        {baseMoves}
        {proposing}
        bind:why
        money={moneyText}
      />
    </div>
  {/if}
{/snippet}

{#if product}
  {@const edited = product}
  <BomApproval bind:this={selfApproval} terms={bomPlan.terms} {viewerId} {projectId} onPicked={(picks) => saveEdit(edited, picks)} />
{/if}

<div class="mx-auto flex w-full max-w-[1180px] flex-col gap-5 text-start" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="flex flex-col gap-2">
    {#if product}
      <a class="self-start text-sm font-semibold text-[#f1c47a]" href="/moach/{projectId}/sales/manage/products">{$t('shopEditor.back')}</a>
    {/if}
    <div class="flex flex-wrap items-center gap-2">
      {#if projectName}
        <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#f1c47a]">{projectName}</span>
      {/if}
      {#if product}
        <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#f1c47a]">
          {product.origin === 'personal' ? $t('shopEditor.badge.personal') : $t('shopEditor.badge.rikma')}
        </span>
      {/if}
    </div>
    <h1 class="m-0 break-words text-3xl font-extrabold leading-tight text-white sm:text-4xl">{product ? product.name : $t('shopEditor.form.title')}</h1>
    <p class="m-0 max-w-2xl text-base text-[#e9dfe4]">{product ? $t('shopEditor.form.editIntro') : $t('shopEditor.form.intro')}</p>
    {#if product}
      <a class="self-start text-sm font-semibold text-[#f1c47a] underline" href="/gift/{product.id}">{$t('shopEditor.view')}</a>
    {/if}
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
              {#key descripSeed}
                <RichText bind:outpot={description} editable={true} />
              {/key}
            </div>
          </div>
          <div>
            <span class={lbl}>{$t('shopEditor.form.image')}</span>
            {#if product}
              <div class="flex flex-wrap items-center gap-3">
                {#if gallery[0]}
                  <img src={gallery[0].thumb} alt={gallery[0].alt ?? ''} class="h-20 w-32 rounded-xl object-cover" />
                {/if}
                <div class="flex min-w-0 flex-col items-start gap-1">
                  <p class="m-0 text-sm text-[#6b5560]">{$t('shopEditor.form.coverHint')}</p>
                  <button type="button" class="min-h-10 text-sm font-bold text-[#c8155f] underline" onclick={openGallery}>{$t('shopEditor.form.openGallery')}</button>
                </div>
              </div>
            {:else}
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
            {/if}
          </div>
        </FormSection>
      </div>

      <!-- 2 · price -->
      <div id="pf-s2" class="scroll-mt-16">
        <FormSection step={2} title={$t('shopEditor.form.step2Title')} subtitle={$t('shopEditor.form.step2Sub')}>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={$t('shopEditor.form.step2Title')}>
            <button type="button" role="radio" aria-checked={isCost} disabled={!!product} class="{choice(isCost)} disabled:cursor-default" onclick={() => (pricing = 'cost')}>
              <span class="flex items-center gap-2 text-base font-extrabold text-[#2a1420]">
                <Calculator size={18} class="text-[#c8155f]" aria-hidden="true" />
                {$t('shopEditor.form.byCost')}
                <span class="rounded-full bg-[#c8155f] px-2 py-0.5 text-[11px] font-bold text-white">{$t('shopEditor.form.recommended')}</span>
              </span>
              <span class="text-sm text-[#6b5560]">{$t('shopEditor.form.byCostSub')}</span>
            </button>
            <button type="button" role="radio" aria-checked={!isCost} disabled={!!product} class="{choice(!isCost)} disabled:cursor-default" onclick={() => (pricing = 'fixed')}>
              <span class="flex items-center gap-2 text-base font-extrabold text-[#2a1420]">
                <Tag size={18} class="text-[#c8155f]" aria-hidden="true" />
                {$t('shopEditor.form.fixed')}
              </span>
              <span class="text-sm text-[#6b5560]">{$t('shopEditor.form.fixedSub')}</span>
            </button>
          </div>

          {#if product}
            <p class="m-0 text-sm text-[#6b5560]">{$t('shopEditor.form.pricingLocked')}</p>
            {#if isCost}
              <BomLinesField
                bind:lines={bomLines}
                bind:missions={recipeMissions}
                bind:resources={recipeResources}
                {projectId}
                {currency}
                {availableMissions}
                {availableResources}
                {projectMembers}
                {missionTemplates}
                {resourceTemplates}
                {multiMember}
                locked={product.recipeLocked}
                sovereign={product.sovereign}
                isDeal={product.recipeIsDeal}
              />
              {#if bomMoves}
                <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#eee2a6] bg-[#fdf9ea] px-4 py-3">
                  <span class="text-sm text-[#6b5560]" dir="auto">{costFormula}</span>
                  <strong class="text-2xl font-extrabold text-[#2a1420]"><Money amount={bomCost} {currency} /></strong>
                </div>
              {/if}
            {/if}
            <div class="max-w-[280px]">
              <label for="pf-base" class={lbl}>{$t('shopEditor.stock.basePrice')}</label>
              <input
                id="pf-base"
                class={inp}
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                bind:value={() => base, (v) => { priceTyped = true; fixedPrice = v; }}
                aria-invalid={baseInvalid}
              />
              <p class="m-0 mt-1.5 text-xs text-[#6b5560]">{priceFollows ? $t('shopEditor.form.bomPriceFollows') : $t('shopEditor.stock.basePriceHint')}</p>
            </div>
            {#if product.marginPct > 0}
              <p class="m-0 rounded-xl bg-[#fdf9ea] px-3 py-2 text-sm text-[#6b5560]">{$t('shopEditor.form.marginNote', { pct: product.marginPct })}</p>
            {/if}
            {#if !isCost}
              <label class="flex items-start gap-2.5 text-[#2a1420] {quoteLocked ? 'opacity-70' : 'cursor-pointer'}">
                <input type="checkbox" class="mt-1 h-4 w-4 accent-[#c8155f]" bind:checked={byQuote} disabled={quoteLocked} />
                <span class="flex flex-col gap-0.5">
                  <strong class="text-sm">{$t('offerings.compose.byQuote')}</strong>
                  <small class="text-xs text-[#6b5560]">{quoteLocked ? $t('shopEditor.form.quoteLocked') : $t('offerings.compose.byQuoteHint')}</small>
                </span>
              </label>
            {/if}
          {:else if isCost}
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
            {#each kindChoices as k (k)}
              <button type="button" aria-pressed={kindOf === k} class={segBtn(kindOf === k)} onclick={() => (kindOf = k)}>
                {kindLabel(k)}
              </button>
            {/each}
          </div>
          {#if showUnlimitedM}
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
          {:else if rows.length && kindOf !== 'unlimited'}
            <p class="m-0 text-sm text-[#6b5560]">{$t('shopEditor.form.stockInVariants')}</p>
          {/if}
          {#if periodic}
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label for="pf-start" class={lbl}>
                  {$t('offerings.compose.startDate')} <small class="font-normal text-[#6b5560]">{$t('offerings.compose.optional')}</small>
                </label>
                {#if product}
                  <input id="pf-start" class={inp} type="date" bind:value={dates} />
                {:else}
                  <input id="pf-start" class={inp} type="datetime-local" bind:value={dates} />
                {/if}
              </div>
              <div>
                <label for="pf-end" class={lbl}>
                  {$t('offerings.compose.endDate')} <small class="font-normal text-[#6b5560]">{$t('offerings.compose.optional')}</small>
                </label>
                {#if product}
                  <input id="pf-end" class={inp} type="date" bind:value={datef} min={dates || undefined} />
                {:else}
                  <input id="pf-end" class={inp} type="datetime-local" bind:value={datef} min={dates ?? undefined} />
                {/if}
              </div>
            </div>
          {/if}
          <label class="flex items-center gap-2.5 text-sm text-[#2a1420] {product ? 'opacity-70' : 'cursor-pointer'}">
            <input type="checkbox" class="h-4 w-4 accent-[#c8155f]" bind:checked={oneForeProject} disabled={!!product} />
            {$t('offerings.compose.oneForeProject')}
            {#if product}<small class="text-xs text-[#6b5560]">· {$t('shopEditor.form.fixedAtCreate')}</small>{/if}
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

            {#if isCost && !product}
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

            <OptionRow
              icon={Images}
              title={$t('shopEditor.form.gallery')}
              status={gallery.length ? $t('shopEditor.form.galleryCount', { count: gallery.length }) : $t('shopEditor.form.none')}
              bind:open={galleryOpen}
            >
              <div class="shop-ui pf-fields">
                <GalleryField bind:gallery bind:uploading onRemoved={pictureRemoved} />
              </div>
            </OptionRow>

            <OptionRow
              icon={Layers}
              title={$t('shopEditor.form.variants')}
              status={rows.length ? $t('shopEditor.form.variantsCount', { axes: axes.length, variants: rows.length }) : $t('shopEditor.form.none')}
              bind:open={variantsOpen}
            >
              <div class="shop-ui pf-fields">
                <VariantsField
                  bind:axes
                  bind:rows
                  {gallery}
                  productId={product?.id ?? null}
                  productPrice={product ? product.price : unitPrice}
                  {sovereign}
                  {rikmaAxes}
                  {clean}
                  {issues}
                  {plan}
                  {waiting}
                  money={moneyText}
                />
              </div>
            </OptionRow>

            <OptionRow
              icon={Boxes}
              title={$t('shopEditor.form.stock')}
              status={rows.length
                ? $t('shopEditor.form.stockInVariantsShort')
                : kindOf === 'unlimited' || unlimitedM
                  ? $t('shopEditor.variants.unlimited')
                  : $t('shopEditor.form.stockCount', { count: quant })}
              bind:open={stockOpen}
            >
              <div class="max-w-[220px]">
                <label for="pf-low" class={lbl}>{$t('shopEditor.stock.lowAt')}</label>
                <input id="pf-low" class={inp} inputmode="numeric" bind:value={lowAt} />
              </div>
              <p class="m-0 mt-1.5 text-xs text-[#6b5560]">{$t('shopEditor.stock.lowHint')}</p>
            </OptionRow>

            {#if product}
              <OptionRow icon={Archive} title={$t('shopEditor.remove.title')} bind:open={removeOpen}>
                <div class="shop-ui pf-fields flex flex-col gap-2">
                  {#if product.archived}
                    <p class="m-0 text-sm">{$t('shopEditor.remove.archived')}</p>
                  {:else if removalOpen}
                    <p class="m-0 text-sm">{$t('shopEditor.remove.open')}</p>
                    <a class="font-bold" href="/moach/{projectId}/votes/decision/{product.openDecisionId}">{$t('shopEditor.pending.vote')}</a>
                  {:else}
                    <p class="m-0 text-sm">{$t('shopEditor.remove.hint')}</p>
                    {#if product.origin === 'personal'}
                      <button type="button" class="sh-btn sh-btn-outline pf-remove" onclick={() => removePersonal(product)} disabled={removing} aria-busy={removing}>
                        {$t('shopEditor.remove.button')}
                      </button>
                    {:else}
                      <p class="m-0 text-sm">{product.sovereign ? $t('shopEditor.remove.alone') : $t('shopEditor.remove.rikma')}</p>
                      <ArchiveObjectButton
                        targetKind="matanot"
                        targetId={product.id}
                        targetName={product.name}
                        soleMember={product.sovereign}
                        label={$t('shopEditor.remove.button')}
                        className="sh-btn sh-btn-outline pf-remove"
                        onDone={afterRemoved}
                      />
                    {/if}
                  {/if}
                </div>
              </OptionRow>
            {/if}
          </div>
        </FormSection>
      </div>
    </div>

    <aside class="hidden lg:sticky lg:top-4 lg:flex lg:w-[340px] lg:flex-none lg:flex-col lg:gap-3">
      {@render changes()}
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

  <div class="flex flex-col gap-3 lg:hidden">
    {@render changes()}
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
    <Button text={saveText} onClick={handleSubmit} {loading} {success} {error} disabled={!!product && !dirty} />
  </div>
</div>

<style>
  /* The shop's fields inside the form's cream cards: the same in every theme. */
  :global(.shop-ui.shop-ui.pf-fields.pf-fields) {
    --sh-page: #fffdf8;
    --sh-card: #fffdf8;
    --sh-card-2: #f6f0e4;
    --sh-ink: #2a1420;
    --sh-muted: #6b5560;
    --sh-line: #e4d9c4;
    --sh-gold: #7a5a0c;
    --sh-gold-line: rgba(122, 90, 12, 0.3);
    --sh-accent: #c8155f;
    --sh-accent-ink: #c8155f;
  }
  :global(.pf-remove) {
    align-self: flex-start;
    color: var(--sh-accent-ink);
  }
</style>
