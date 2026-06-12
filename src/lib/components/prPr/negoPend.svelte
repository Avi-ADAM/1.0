<script>
  import tr from '$lib/translations/tr.json';
  import Text from '../conf/text.svelte';
  import NumberField from '../conf/number.svelte';
  import DateNego from '../conf/dateNego.svelte';
  import TotalBar from '../conf/barb.svelte';
  import KindOfnego from '$lib/components/conf/kindOfnego.svelte';
  import LocationNego from '$lib/components/conf/locationNego.svelte';
  const tri = tr;
  import { lang } from '$lib/stores/lang';
  import { montsi, toIsoDateString } from '$lib/func/montsi.svelte';
  import { toast } from 'svelte-sonner';
  import Rich from '../conf/rich.svelte';
  import { submitNegoMash } from '$lib/client/actionClient';
  import { updatePmashesStore } from '$lib/utils/levSocketHandler';

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
    onSubmit = null
  } = $props();

  let descrip2 = $state(descrip);
  let name2 = $state(name1);
  let sqadualed2 = $state(sqadualed);
  let sqadualedf2 = $state(sqadualedf);

  let spnot2 = spnot;
  let linkto2 = $state(linkto);
  let hm2 = $state(hm);
  let price2 = $state(price);
  let easy2 = $state(easy);
  let kindOfb = $state(kindOf);
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
  async function increment() {
    onLoad?.();

    if (!onSubmit && !pendId) {
      toast.error(tr?.toasts?.er?.[$lang] ?? 'Missing resource id');
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
        toast.success(tr?.toasts.suc[$lang]);
        close();
      } catch (e) {
        error1 = e;
        console.log(error1);
        toast.error(tr?.toasts?.er?.[$lang] ?? 'Error');
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
        toast.success(tr?.toasts.suc[$lang]);
        close();
      } else {
        toast.error(tr?.toasts?.er?.[$lang] ?? 'Error');
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
      toast.error(tr?.toasts?.er?.[$lang] ?? 'Error');
    }
  }
  const effectiveHmNew = $derived(
    kindOfb === 'total' ? 1 : Number(hm2) || 0
  );
  const effectiveHmOrig = $derived(
    kindOf === 'total' ? 1 : Number(hm) || 0
  );

  const montsiNew = $derived(
    Number(montsi(kindOfb, sqadualed2, sqadualedf2)) || 1
  );
  const montsiOrig = $derived(
    Number(montsi(kindOf, sqadualed, sqadualedf)) || 1
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
      leb: `${tri?.nego?.new[$lang]},${totalNew.toLocaleString()}`,
      value: totalNew
    },
    {
      leb: `${tri?.nego?.original[$lang]},${totalOrig.toLocaleString()}`,
      value: totalOrig
    }
  ]);

  const dataiEasy = $derived([
    {
      leb: `${tri?.nego?.new[$lang]},${totalEasyNew.toLocaleString()}`,
      value: totalEasyNew
    },
    {
      leb: `${tri?.nego?.original[$lang]},${totalEasyOrig.toLocaleString()}`,
      value: totalEasyOrig
    }
  ]);
</script>

<div class="text-barbi" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
  <h1 class="md:text-center text-2xl md:text-2xl font-bold underline">
    {tri?.nego?.headmash[$lang]}
    {name1}
  </h1>
  <div class="flex flex-col align-middle justify-center">
    <Text text={name1} bind:textb={name2} lebel={tri?.common?.name} />
    <Rich
      text={descrip}
      bind:textb={descrip2}
      lebel={tri?.common?.description}
    />
    <!--<Text text={spnot} bind:textb={spnot2} lebel={tri?.mission?.specialNotes}/>-->
    <Text text={linkto} bind:textb={linkto2} lebel={tri?.mash?.linkto} />
    <KindOfnego {kindOf} bind:kindOfb lebel={tri?.mash.kindof} />

    {#if !(kindOf == 'total' && kindOfb == 'total')}
      <NumberField number={hm} bind:numberb={hm2} lebel={tri?.mash?.noof[$lang]} />
    {/if}
    <NumberField
      number={price}
      bind:numberb={price2}
      lebel={tri?.mash?.shovi[$lang]}
    />
    <NumberField
      number={easy}
      bind:numberb={easy2}
      lebel={tri?.mash?.shovile[$lang]}
    />
    {#if kindOf == 'yearly' || kindOfb == 'yearly' || kindOfb == 'monthly' || kindOf == 'monthly' || kindOf == 'rent' || kindOfb == 'rent'}
      <DateNego
        date={sqadualed}
        bind:dateb={sqadualed2}
        lebel={tri?.common.startDate}
      />
      <DateNego
        date={sqadualedf}
        bind:dateb={sqadualedf2}
        lebel={tri?.common.finishDate}
      />
    {/if}

    <LocationNego
      {location}
      bind:locationb={location2}
      lebel={{ he: 'מיקום', en: 'Location' }}
    />

    <!---<div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{tr?.mission.iskvua[$lang]}: </h2>
  <input
    bind:checked={isKavua2}
    type="checkbox" id="tomeC" name="isKavua2" >
</div>
</div>

<div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{tr?.mission.assingToMe[$lang]}: </h2>
  <input
    bind:checked={myM}
    type="checkbox" id="tomeC" name="tome" value="tome" onclick={()=> myMission()}>
</div>
</div>-->
  </div>
  <div
    class="border border-gold border-opacity-80 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
  >
    <h2 class="underline decoration-mturk">{tri?.mash.tota[$lang]}</h2>
    {#if valuesChanged}
      <div class="flex flex-col gap-2">
        <div>
          <p class="text-gold">
            {tri?.mash?.shovi[$lang]}: {totalNew.toLocaleString()}
            <span class="text-barbi text-sm">
              ({tri?.nego?.original[$lang]}: {totalOrig.toLocaleString()})
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
              {tri?.mash?.shovile[$lang]}: {totalEasyNew.toLocaleString()}
              <span class="text-barbi text-sm">
                ({tri?.nego?.original[$lang]}: {totalEasyOrig.toLocaleString()})
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
        {tri?.mash?.shovile[$lang]}:
        {totalEasyNew.toLocaleString()}
      {/if}
    {:else}
      <p>0</p>
    {/if}
  </div>

  <div class="w-fit mx-auto">
    <button
      onclick={increment}
      class="mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
      type="submit"
      name="addm">{tri?.common.puttovote[$lang]}</button
    >
  </div>
</div>
