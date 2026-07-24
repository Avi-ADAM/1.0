<script>
  import { isRtl } from '$lib/translations';
  import { t } from '$lib/translations';
  import Text from '../conf/text.svelte';
  import NumberField from '../conf/number.svelte';
  import DateNego from '../conf/dateNego.svelte';
  import TotalBar from '../conf/barb.svelte';
  import KindOfnego from '$lib/components/conf/kindOfnego.svelte';
  import LocationNego from '$lib/components/conf/locationNego.svelte';
  import { lang } from '$lib/stores/lang';
  import { montsi, toIsoDateString } from '$lib/func/montsi.svelte';
  import { toast } from 'svelte-sonner';
  import Rich from '../conf/rich.svelte';
  import { submitNegoMash } from '$lib/client/actionClient';
  import { updatePmashesStore } from '$lib/utils/levSocketHandler';
  import { onMount } from 'svelte';
  import { fetchBridgeResolution, openNegoBridge, readNegoBridgeReturn } from '$lib/func/negoBridge.js';

  let error1;
  let clicked = false;
  /**
   * @typedef {Object} Props
   * @property {any} restime
   * @property {any} descrip
   * @property {any} projectName
   * @property {any} name1
   * @property {any} spnot
   * @property {number} [easy]
   * @property {number} [hm]
   * @property {number} [price]
   * @property {any} projectId
   * @property {any} [uids]
   * @property {any} [what]
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} noofusersWaiting
   * @property {number} [total]
   * @property {any} noofusers
   * @property {any} already
   * @property {any} mypos
   * @property {any} missionId
   * @property {any} linkto
   * @property {any} tafkidims
   * @property {any} sqadualed
   * @property {any} sqadualedf
   * @property {number} [stepState]
   * @property {any} pendId
   * @property {any} [users]
   * @property {string} [kindOf]
   * @property {number} [oldide] - last tg id, if non 0
   * @property {any} timegramaId
   * @property {number} [ordern]
   * @property {boolean} [masaalr]
   * @property {any} [location]
   */

  /** @type {Props} */
  let {
    restime,
    descrip,
    projectName,
    name1,
    spnot,
    easy = 0,
    hm = 0,
    price = 0,
    projectId,
    uids = [],
    what = [],
    noofusersOk,
    noofusersNo,
    noofusersWaiting,
    total = 0,
    noofusers,
    already,
    mypos,
    missionId,
    linkto,
    tafkidims,
    sqadualed,
    sqadualedf,
    stepState = 2,
    pendId,
    users = [],
    kindOf = 'perUnit',
    oldide = 0,
    timegramaId,
    ordern = 0,
    masaalr = false,
    location = null,
    recurring = false,
    recurringNoEnd = false,
    pricePerUnit = 0,
    cycleSize = 1,
    onClose,
    onLoad,
    /**
     * Optional custom submit handler. When provided, the component hands the
     * computed diff to the parent instead of calling submitNegoMash itself.
     * Used by the open-resource candidate flow (proposeOnOpenMashaabim), where
     * there is no pmash to negotiate on — the terms become a parallel proposal
     * on the candidate's Askm. Receives { newValues, originalValues, hasChanges }.
     * @type {((d: { newValues: any, originalValues: any, hasChanges: boolean }) => Promise<void>) | null}
     */
    onSubmit = null,
    /**
     * The latest candidate-side negotiation round attributes (proposedBy=candidate).
     * When provided alongside onSubmit, shown as a reference beside each field so
     * the project member knows what they are counter-proposing against.
     * @type {any | null}
     */
    candidateRound = null
  } = $props();

  let descrip2 = $state(descrip);
  let name2 = $state(name1);
  let sqadualed2 = $state(sqadualed);
  let sqadualedf2 = $state(sqadualedf);

  let spnot2 = $state(spnot);
  let linkto2 = $state(linkto);
  let hm2 = $state(hm);
  let price2 = $state(price);
  let easy2 = $state(easy);
  let kindOfb = $state(kindOf);
  let recurring2 = $state(Boolean(recurring));
  let cycleSize2 = $state(Number(cycleSize) || 1);
  let location2 = $state(
    location
      ? { ...location }
      : {
          location_mode: 'unspecified',
          isOnline: false,
          lat: null,
          lng: null,
          radius: 15,
          location_hint: ''
        }
  );

  function locationChanged() {
    const a = location;
    const b = location2;
    if (a == null) {
      return (
        (b?.location_mode ?? 'unspecified') !== 'unspecified' ||
        b?.lat != null ||
        b?.lng != null ||
        Boolean(b?.location_hint?.trim())
      );
    }
    return (
      (a.location_mode ?? 'unspecified') !== (b?.location_mode ?? 'unspecified') ||
      (a.lat ?? null) !== (b?.lat ?? null) ||
      (a.lng ?? null) !== (b?.lng ?? null) ||
      (a.radius ?? null) !== (b?.radius ?? null) ||
      (a.location_hint ?? '') !== (b?.location_hint ?? '')
    );
  }

  function close() {
    onClose?.();
  }

  // ── Consensus bridge ──────────────────────────────────────────────────────
  // Open a structured mediation discussion in the consensus app, seeded with
  // every negotiable term (original vs. current proposal). Unchanged terms are
  // sent too — the consensus side marks them agreed. See negoBridge.js.
  function openBridge() {
    openNegoBridge({
      sourceType: 'pmash',
      sourceId: pendId,
      title: name1,
      projectName,
      fields: [
        { key: 'name', label: 'שם', kind: 'text', original: name1 ?? null, proposed: name2 ?? null },
        { key: 'descrip', label: 'תיאור', kind: 'text', original: descrip ?? null, proposed: descrip2 ?? null },
        { key: 'price', label: 'שווי', kind: 'number', original: Number(price) || 0, proposed: Number(price2) || 0 },
        { key: 'easy', label: 'שווי לב', kind: 'number', original: Number(easy) || 0, proposed: Number(easy2) || 0 },
        { key: 'hm', label: 'כמות', kind: 'number', original: Number(hm) || 0, proposed: Number(hm2) || 0 },
        { key: 'sqadualed', label: 'תאריך התחלה', kind: 'date', original: toIsoDateString(sqadualed) ?? null, proposed: toIsoDateString(sqadualed2) ?? null },
        { key: 'sqadualedf', label: 'תאריך סיום', kind: 'date', original: toIsoDateString(sqadualedf) ?? null, proposed: toIsoDateString(sqadualedf2) ?? null }
      ]
    });
  }

  // On return from the bridge, prefill the editable fields with the agreed
  // values. The user still submits + votes as usual.
  function applyBridgeValues(v) {
    if (v.price != null) price2 = Number(v.price);
    if (v.easy != null) easy2 = Number(v.easy);
    if (v.hm != null) hm2 = Number(v.hm);
    if (v.name != null) name2 = String(v.name);
    if (v.descrip != null) descrip2 = String(v.descrip);
    if (v.sqadualed != null) sqadualed2 = v.sqadualed;
    if (v.sqadualedf != null) sqadualedf2 = v.sqadualedf;
  }

  // Two return channels, same shape: the `negoBridge` URL param (instant, only
  // for whoever clicked the link) and the resolution signed in the discussion
  // and persisted on the server (visible to every member opening the card).
  onMount(async () => {
    const fromUrl = readNegoBridgeReturn(pendId);
    if (fromUrl) {
      applyBridgeValues(fromUrl);
      return;
    }
    const found = await fetchBridgeResolution('pmash', pendId);
    if (found?.resolution?.values) applyBridgeValues(found.resolution.values);
  });

  async function increment() {
    onLoad?.();

    if (!onSubmit && !pendId) {
      toast.error($t('toasts.er') ?? 'Missing resource id');
      return;
    }

    // Detect what changed and build newValues (to apply) / originalValues (snapshot)
    const newValues = {};
    const originalValues = {};
    let hasChanges = false;

    if (sqadualed !== sqadualed2) {
      newValues.sqadualed = toIsoDateString(sqadualed2) ?? null;
      originalValues.sqadualed = sqadualed ?? null;
      hasChanges = true;
    }
    if (sqadualedf !== sqadualedf2) {
      newValues.sqadualedf = toIsoDateString(sqadualedf2) ?? null;
      originalValues.sqadualedf = sqadualedf ?? null;
      hasChanges = true;
    }
    if (name1 !== name2) {
      newValues.name = name2;
      originalValues.name = name1;
      hasChanges = true;
    }
    if (descrip !== descrip2) {
      newValues.descrip = descrip2;
      originalValues.descrip = descrip;
      hasChanges = true;
    }
    if (spnot !== spnot2) {
      newValues.spnot = spnot2;
      originalValues.spnot = spnot;
      hasChanges = true;
    }
    if (linkto !== linkto2) {
      newValues.linkto = linkto2;
      originalValues.linkto = linkto;
      hasChanges = true;
    }
    if (Number(easy) !== Number(easy2)) {
      newValues.easy = easy2;
      originalValues.easy = easy;
      hasChanges = true;
    }
    if (Number(hm) !== Number(hm2)) {
      newValues.hm = hm2;
      originalValues.hm = hm;
      hasChanges = true;
    }
    if (Number(price) !== Number(price2)) {
      newValues.price = price2;
      originalValues.price = price;
      hasChanges = true;
    }
    if (kindOf !== kindOfb) {
      newValues.kindOf = kindOfb;
      originalValues.kindOf = kindOf;
      hasChanges = true;
    }
    if (Boolean(recurring) !== Boolean(recurring2)) {
      newValues.recurring = recurring2;
      originalValues.recurring = recurring;
      hasChanges = true;
    }
    if (recurring2 && Number(cycleSize) !== Number(cycleSize2)) {
      newValues.cycleSize = Number(cycleSize2) || 1;
      originalValues.cycleSize = cycleSize;
      hasChanges = true;
    }
    if (locationChanged()) {
      newValues.location = {
        location_mode: location2?.location_mode ?? 'unspecified',
        lat: location2?.lat ?? null,
        lng: location2?.lng ?? null,
        radius: location2?.radius ?? null,
        location_hint: location2?.location_hint ?? null
      };
      originalValues.location = location ?? null;
      hasChanges = true;
    }

    // Guard: skip if nothing changed and the user has already voted yes
    if (!hasChanges && masaalr && mypos) return;

    // Candidate / parallel-proposal flow: hand the diff to the parent.
    if (onSubmit) {
      try {
        await onSubmit({ newValues, originalValues, hasChanges });
        toast.success($t('toasts.suc'));
        close();
      } catch (e) {
        error1 = e;
        console.log(error1);
        toast.error($t('toasts.er') ?? 'Error');
      }
      return;
    }

    try {
      const result = await submitNegoMash({
        pmashId: String(pendId),
        projectId: String(projectId),
        timegramaId: timegramaId != null ? String(timegramaId) : undefined,
        restime,
        isOriginal: stepState === 2,
        ordern: ordern ?? 0,
        newValues,
        originalValues,
        users: users ?? []
      });

      if (result.success) {
        // Update the card in place (changed fields + new vote round) so the
        // user sees the new terms without a full refresh that would reset their
        // scroll/swiper position.
        if (result.data?.id) {
          updatePmashesStore(result.data);
        }
        toast.success($t('toasts.suc'));
        close();
      } else {
        toast.error($t('toasts.er') ?? 'Error');
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
      toast.error($t('toasts.er') ?? 'Error');
    }
  }
  const effectiveHmNew = $derived(
    kindOfb === 'total' ? 1 : Number(hm2) || 0
  );
  const effectiveHmOrig = $derived(
    kindOf === 'total' ? 1 : Number(hm) || 0
  );

  // For a recurring expense the negotiated price IS the per-cycle (monthly /
  // yearly) cost, so we never multiply by the number of months — each cycle is
  // approved separately. Fixed-term resources keep multiplying over the period.
  const montsiNew = $derived(
    recurring2 ? 1 : Number(montsi(kindOfb, sqadualed2, sqadualedf2)) || 1
  );
  const montsiOrig = $derived(
    recurring ? 1 : Number(montsi(kindOf, sqadualed, sqadualedf)) || 1
  );

  const totalNew = $derived(
    Number(price2) * effectiveHmNew * montsiNew
  );
  const totalEasyNew = $derived(
    Number(easy2) * effectiveHmNew * montsiNew
  );
  const totalOrig = $derived(
    Number(price) * effectiveHmOrig * montsiOrig
  );
  const totalEasyOrig = $derived(
    Number(easy) * effectiveHmOrig * montsiOrig
  );

  const valuesChanged = $derived(
    Number(price) !== Number(price2) ||
      effectiveHmOrig !== effectiveHmNew ||
      kindOf !== kindOfb ||
      Number(easy) !== Number(easy2) ||
      sqadualed !== sqadualed2 ||
      sqadualedf !== sqadualedf2
  );

  const chartKey = $derived(
    `${price2}-${hm2}-${easy2}-${kindOfb}-${sqadualed2}-${sqadualedf2}`
  );

  const datai = $derived([
    {
      leb: `${$t('nego.new')},${totalNew.toLocaleString()}`,
      value: totalNew
    },
    {
      leb: `${$t('nego.original')},${totalOrig.toLocaleString()}`,
      value: totalOrig
    }
  ]);

  const dataiEasy = $derived([
    {
      leb: `${$t('nego.new')},${totalEasyNew.toLocaleString()}`,
      value: totalEasyNew
    },
    {
      leb: `${$t('nego.original')},${totalEasyOrig.toLocaleString()}`,
      value: totalEasyOrig
    }
  ]);
</script>

<div class="text-barbi" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h1 class="md:text-center text-2xl md:text-2xl font-bold underline">
    {onSubmit ? $t('nego.headMashCandidate') : $t('nego.headmash')}:
    {name1}
  </h1>

  <!-- Candidate proposal context — shown only in counter-proposal flow -->
  {#if onSubmit && candidateRound}
    {@const candTotal = (candidateRound.hm ?? hm) * (candidateRound.easy ?? candidateRound.price ?? easy ?? price)}
    <div class="mx-2 my-2 rounded-lg border border-barbi/50 bg-barbi/8 p-3 text-sm space-y-1">
      <p class="font-bold text-barbi text-base">
        💡 {$t('nego.cand.proposalRef')}
      </p>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-barbi/80">
        {#if candidateRound.hm != null}
          <span>{$t('nego.cand.qty')} <strong>{candidateRound.hm}</strong></span>
        {/if}
        {#if candidateRound.price != null}
          <span>{$t('nego.cand.price')} <strong>{candidateRound.price}</strong></span>
        {/if}
        {#if candidateRound.easy != null}
          <span>{$t('nego.cand.levValue')} <strong>{candidateRound.easy}</strong></span>
        {/if}
        {#if candTotal > 0}
          <span class="font-bold">{$t('nego.cand.total')} <strong>{candTotal.toLocaleString()}</strong></span>
        {/if}
        {#if candidateRound.sqadualed}
          <span>{$t('nego.cand.start')} <strong>{new Date(candidateRound.sqadualed).toLocaleDateString($lang)}</strong></span>
        {/if}
        {#if candidateRound.sqadualedf}
          <span>{$t('nego.cand.end')} <strong>{new Date(candidateRound.sqadualedf).toLocaleDateString($lang)}</strong></span>
        {/if}
      </div>
    </div>
  {/if}

  {#if recurring || recurring2}
    <div
      class="mx-2 my-2 rounded-lg border border-gold/60 bg-gold/10 p-2 text-sm text-center"
    >
      🔁 {$t('nego.cand.recurringResourceNote')}
    </div>
  {/if}
  <div class="flex flex-col align-middle justify-center">
    <Text text={name1} bind:textb={name2} lebel={$t('common.name')} />
    {#if onSubmit && candidateRound?.name && candidateRound.name !== name1}
      <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidate')} {candidateRound.name}</p>
    {/if}
    <Rich
      text={descrip}
      bind:textb={descrip2}
      lebel={$t('common.description')}
    />
    <Text
      text={spnot}
      bind:textb={spnot2}
      lebel={{ he: 'הערות מיוחדות', en: 'Special notes' }}
    />
    <Text text={linkto} bind:textb={linkto2} lebel={$t('mash.linkto')} />
    <KindOfnego {kindOf} bind:kindOfb lebel={$t('mash.kindof')} />

    {#if !(kindOf == 'total' && kindOfb == 'total')}
      <NumberField number={hm} bind:numberb={hm2} lebel={$t('mash.noof')} />
      {#if onSubmit && candidateRound?.hm != null && candidateRound.hm !== hm}
        <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} <strong>{candidateRound.hm}</strong></p>
      {/if}
    {/if}
    <NumberField
      number={price}
      bind:numberb={price2}
      lebel={$t('mash.shovi')}
    />
    {#if onSubmit && candidateRound?.price != null && candidateRound.price !== price}
      <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} <strong>{candidateRound.price}</strong></p>
    {/if}
    <NumberField
      number={easy}
      bind:numberb={easy2}
      lebel={$t('mash.shovile')}
    />
    {#if onSubmit && candidateRound?.easy != null && candidateRound.easy !== easy}
      <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} <strong>{candidateRound.easy}</strong></p>
    {/if}
    {#if kindOf == 'yearly' || kindOfb == 'yearly' || kindOfb == 'monthly' || kindOf == 'monthly' || kindOf == 'rent' || kindOfb == 'rent'}
      <DateNego
        date={sqadualed}
        bind:dateb={sqadualed2}
        lebel={$t('common.startDate')}
      />
      {#if onSubmit && candidateRound?.sqadualed}
        <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} {new Date(candidateRound.sqadualed).toLocaleDateString($lang)}</p>
      {/if}
      <DateNego
        date={sqadualedf}
        bind:dateb={sqadualedf2}
        lebel={$t('common.finishDate')}
      />
      {#if onSubmit && candidateRound?.sqadualedf}
        <p class="text-xs text-barbi/70 px-2 -mt-1 mb-1 inline-flex items-center gap-1">💡 {$t('nego.cand.candidateProposed')} {new Date(candidateRound.sqadualedf).toLocaleDateString($lang)}</p>
      {/if}
    {/if}

    {#if kindOfb === 'monthly' || kindOfb === 'yearly'}
      <div
        class="border border-gold border-opacity-40 rounded m-2 p-2 flex flex-col gap-2"
      >
        <label class="flex flex-row items-center justify-center gap-x-2">
          <span class="underline decoration-mturk"
            >{$t('nego.cand.recurringExpense')}</span
          >
          <input type="checkbox" bind:checked={recurring2} />
        </label>
        {#if recurring2}
          <p class="text-xs text-center text-barbi/80">
            {$t('nego.cand.approvedEachCycle')}
          </p>
          <NumberField
            number={cycleSize}
            bind:numberb={cycleSize2}
            lebel={`${$t('nego.cand.everyN')} ${kindOfb === 'yearly' ? $t('nego.cand.years') : $t('nego.cand.months')}`}
          />
          <button
            type="button"
            onclick={() => (sqadualedf2 = null)}
            disabled={sqadualedf2 == null || sqadualedf2 === ''}
            class="mx-auto text-sm border border-gold/50 rounded-full px-3 py-1 hover:bg-gold/20 disabled:opacity-40"
          >
            {sqadualedf2 == null || sqadualedf2 === ''
              ? $t('nego.cand.openEndedNoEnd')
              : $t('nego.cand.removeEndDate')}
          </button>
        {/if}
      </div>
    {/if}

    <LocationNego
      {location}
      bind:locationb={location2}
      lebel={{ he: 'מיקום', en: 'Location' }}
    />

    <!---<div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{$t('mission.iskvua')}: </h2>
  <input
    bind:checked={isKavua2}
    type="checkbox" id="tomeC" name="isKavua2" >
</div>
</div>

<div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{$t('mission.assingToMe')}: </h2>
  <input
    bind:checked={myM}
    type="checkbox" id="tomeC" name="tome" value="tome" onclick={()=> myMission()}>
</div>
</div>-->
  </div>
  <div
    class="border border-gold border-opacity-80 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
  >
    <h2 class="underline decoration-mturk">
      {#if recurring2}
        {$t('nego.cand.estCostPerCycle')}
      {:else}
        {$t('mash.tota')}
      {/if}
    </h2>
    {#if valuesChanged}
      <div class="flex flex-col gap-2">
        <div>
          <p class="text-gold">
            {$t('mash.shovi')}: {totalNew.toLocaleString()}
            <span class="text-barbi text-sm">
              ({$t('nego.original')}: {totalOrig.toLocaleString()})
            </span>
          </p>
          {#key chartKey}
            <div class="w-1/2 mx-auto">
              <TotalBar datai={datai} />
            </div>
          {/key}
        </div>
        {#if Number(easy) !== Number(easy2) || Number(price) !== Number(price2)}
          <div>
            <p class="text-gold">
              {$t('mash.shovile')}: {totalEasyNew.toLocaleString()}
              <span class="text-barbi text-sm">
                ({$t('nego.original')}: {totalEasyOrig.toLocaleString()})
              </span>
            </p>
            {#key `${chartKey}-easy`}
              <div class="w-1/2 mx-auto">
                <TotalBar datai={dataiEasy} />
              </div>
            {/key}
          </div>
        {/if}
      </div>
    {:else if totalNew > 0}
      {totalNew.toLocaleString()}
      {#if Number(price2) !== Number(easy2)}
        {$t('mash.shovile')}:
        {totalEasyNew.toLocaleString()}
      {/if}
    {:else}
      <p>0</p>
    {/if}
  </div>

  <div class="w-fit mx-auto flex flex-col items-center gap-y-2">
    <button
      onclick={increment}
      class="mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
      type="submit"
      name="addm">{onSubmit ? $t('nego.submitProposal') : $t('common.puttovote')}</button
    >
    <button
      onclick={openBridge}
      type="button"
      class="mx-auto text-sm border border-gold/50 text-gold hover:bg-gold/20 rounded-full px-4 py-1"
    >
      {$t('nego.cand.deeperDiscussion')}
    </button>
  </div>
</div>
