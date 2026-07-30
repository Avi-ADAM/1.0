<script>
  import { isRtl, t } from '$lib/translations';
  import { onMount } from 'svelte';
  import MultiSelect from 'svelte-multiselect';
  import { lang } from '$lib/stores/lang.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { createResource } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
  import moment from 'moment';

  /**
   * @typedef {Object} Props
   * @property {string} [projectId]
   * @property {number} [userslength]   - מספר חברי הפרויקט (1 = משתמש יחיד)
   * @property {string} [restime]       - זמן תגובה לחישוב Timegrama (לדוגמה: "7d")
   * @property {boolean} [specMode]     - מצב "ספק" (PLAN_CONCIERGE §5.3): הלקוחה מנסחת מפרט משאב
   *                                      ולא יוצרת רשומה — handleSubmit מחזיר את המפרט ל-onSpec.
   * @property {(spec: {name:string, descrip:string, price:number, quantity:number, kindOf:string, linkto:string, spnot:string}) => void} [onSpec]
   * @property {boolean} [publishMode]  - מצב "פרסום לקהילה" (קונסיירז'): הטופס המלא נפתח אך
   *                                      ה-handleSubmit אינו יוצר רשומת משאב בפרויקט אלא מחזיר
   *                                      את כל הפרטים ל-onPublish (כולל mashaabimId שזוהה לפי שם),
   *                                      כדי שהקורא יפרסם openMashaabim. תאימות לאחור: פעיל רק
   *                                      כשמוזרק onPublish/publishMode.
   * @property {(payload: {name:string, descrip:string, price:number, easy:number, kindOf:string, quantity:number, recurring:boolean, cycleSize:number|null, linkto:string, spnot:string, mashaabimId:string|null, startDate:string|null, endDate:string|null, isOnline:boolean, lat:number|null, lng:number|null, radius:number|null, location_hint:string|null}) => void} [onPublish]
   * @property {() => void} [onCreated]
   * @property {() => void} [onCancel]
   */

  /** @type {Props} */
  let {
    projectId = '',
    userslength = 1,
    restime = '',
    specMode = false,
    onSpec,
    publishMode = false,
    onPublish,
    onCreated,
    onCancel,
    /**
     * Optional prefill for specMode editing (PLAN_CONCIERGE plan editing):
     * `{ name, descrip, price, quantity, kindOf }`. When present, the form opens
     * with these values so the wisher edits an existing plan item with all its
     * details. Ignored outside specMode.
     */
    initialSpec = null
  } = $props();

  let mashaabimTemplates = $state([]);
  let isLoading = $state(true);
  let isSubmitting = $state(false);
  let selectedTemplateName = $state([]);
  let searchText = $state('');
  let hydratedTemplateId = $state(null);

  // Form fields
  let name = $state('');
  let description = $state('');
  let price = $state(0);
  let maxInvestment = $state(0);
  let maxInvestmentTouched = $state(false);
  let kindOf = $state('total');
  let hm = $state(1);
  let linkto = $state('');
  let spnot = $state('');
  let startDate = $state('');
  let endDate = $state('');
  // Recurring monthly/yearly expense (server rent, apartment, stall…). When on,
  // the resource becomes a mashabetahalich engine driven by /api/monthi.
  let isRecurring = $state(false);
  // How often the cycle repeats: every N units (months for monthly, years for
  // yearly). Defaults to every 1.
  let cycleSize = $state(1);

  let locationOpen = $state(false);
  let locationScope = $state({
    location_mode: 'unspecified',
    isOnline: false,
    lat: null,
    lng: null,
    radius: 15,
    location_hint: ''
  });

  // --- Self-assignment (רלוונטי רק כשיש משתמש יחיד בפרויקט) ---
  let isSelfAssigned = $state(false);
  let isReceived = $state(false); // האם המשאב כבר התקבל?
  let existingSpOptions = $state([]); // Sp קיימים של המשתמש למשאב זה
  let selectedSpName = $state([]); // MultiSelect
  let createNewSp = $state(false); // יצירת Sp חדש
  let loadingSpOptions = $state(false);

  // derived: ID של Sp נבחר קיים
  let selectedSpId = $derived(
    (() => {
      if (!selectedSpName.length) return null;
      const found = existingSpOptions.find(
        (s) => s.attributes.name === selectedSpName[0]
      );
      return found?.id ?? null;
    })()
  );

  // derived visibility flags
  let showDates = $derived(kindOf === 'monthly' || kindOf === 'yearly');
  let canBeRecurring = $derived(kindOf === 'monthly' || kindOf === 'yearly');
  let showQuantity = $derived(kindOf === 'perUnit');
  let isSingleUser = $derived(userslength <= 1);
  // For a recurring expense the end date is optional ("no end date = until done").
  let hasValidDates = $derived(
    !showDates
      ? true
      : isRecurring
        ? Boolean(startDate)
        : Boolean(startDate && endDate && endDate >= startDate)
  );
  let canSubmit = $derived(Boolean(name.trim()) && hasValidDates);

  // Recurring only makes sense for monthly/yearly — clear it otherwise.
  $effect(() => {
    if (!canBeRecurring && isRecurring) isRecurring = false;
  });

  // חישוב סה"כ בזמן אמת
  let totalPrice = $derived(
    kindOf === 'perUnit'
      ? price * hm
      : kindOf === 'monthly' && startDate && endDate
        ? +(
            price *
            Math.max(moment(endDate).diff(moment(startDate), 'months', true), 0)
          ).toFixed(2)
        : kindOf === 'yearly' && startDate && endDate
          ? +(
              price *
              Math.max(
                moment(endDate).diff(moment(startDate), 'years', true),
                0
              )
            ).toFixed(2)
          : price
  );

  let totalMax = $derived(
    (() => {
      const mx = maxInvestment > 0 ? maxInvestment : price;
      return kindOf === 'perUnit'
        ? mx * hm
        : kindOf === 'monthly' && startDate && endDate
          ? +(
              mx *
              Math.max(
                moment(endDate).diff(moment(startDate), 'months', true),
                0
              )
            ).toFixed(2)
          : kindOf === 'yearly' && startDate && endDate
            ? +(
                mx *
                Math.max(
                  moment(endDate).diff(moment(startDate), 'years', true),
                  0
                )
              ).toFixed(2)
            : mx;
    })()
  );

  // ₪ לחודש עבור הצגת השווי בריקמה — רק להוצאה מתחדשת בלי תאריך סיום, שממשיכה
  // לחייב ללא הגבלה ולכן נמדדת בזרימה חודשית ולא בסכום חד-פעמי.
  let equityMonthlyValue = $derived(
    (() => {
      if (!isRecurring || endDate) return null;
      const per = maxInvestment > 0 ? maxInvestment : price;
      if (!(per > 0)) return null;
      const months =
        Math.max(1, Number(cycleSize) || 1) * (kindOf === 'yearly' ? 12 : 1);
      return per / months;
    })()
  );

  let showForm = $state(true);

  function normalizeLocationNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function hasLocationPoint(location) {
    return (
      typeof location?.lat === 'number' &&
      Number.isFinite(location.lat) &&
      typeof location?.lng === 'number' &&
      Number.isFinite(location.lng)
    );
  }

  function hasLocationValue(location) {
    return (
      location?.location_mode !== 'unspecified' ||
      hasLocationPoint(location) ||
      Boolean(location?.location_hint?.trim())
    );
  }


  function locationSummary(location) {
    if (!location || !hasLocationValue(location)) return $t('project.resourceCreator.locationEmpty');
    if (location.location_mode === 'online') return $t('project.resourceCreator.locationOnline');
    if (hasLocationPoint(location)) {
      const hint = location.location_hint?.trim() || $t('project.resourceCreator.locationSelected');
      return `${hint} - ${location.radius || 15} km`;
    }
    return location.location_hint?.trim() || $t('project.resourceCreator.locationSelected');
  }

  onMount(async () => {
    // specMode / publishMode: hydrate the form with the incoming item's details.
    if ((specMode || publishMode) && initialSpec) {
      if (initialSpec.name != null) name = initialSpec.name;
      if (initialSpec.descrip != null) description = initialSpec.descrip;
      if (initialSpec.price != null) price = Number(initialSpec.price) || 0;
      if (initialSpec.kindOf) kindOf = initialSpec.kindOf;
      if (initialSpec.quantity != null) hm = Number(initialSpec.quantity) || 1;
    }
    try {
      const result = await sendToSer({}, 'getMashaabims', 0, 0, false, fetch);
      if (result && result.data && result.data.mashaabims) {
        mashaabimTemplates = result.data.mashaabims.data || [];
      } else {
        console.error('Unexpected GraphQL response structure:', result);
        mashaabimTemplates = [];
      }
    } catch (e) {
      console.error('Failed to load mashaabim templates:', e);
    } finally {
      isLoading = false;
    }
  });

  function normalizeResourceName(value) {
    return String(value || '').trim().toLocaleLowerCase();
  }

  function findResourceTemplateByName(value) {
    const normalized = normalizeResourceName(value);
    if (!normalized) return null;
    return (
      mashaabimTemplates.find(
        (template) =>
          normalizeResourceName(template?.attributes?.name) === normalized
      ) ?? null
    );
  }

  function resetSelfAssignmentState() {
    isSelfAssigned = false;
    isReceived = false;
    existingSpOptions = [];
    selectedSpName = [];
    createNewSp = false;
  }

  function handlePriceInput(value) {
    price = value ?? 0;
    if (!maxInvestmentTouched) {
      maxInvestment = price;
    }
  }

  function handleMaxInvestmentInput(value) {
    maxInvestmentTouched = true;
    maxInvestment = value ?? 0;
  }

  function handleStartDateInput(value) {
    startDate = value;
    if (endDate && startDate && endDate < startDate) {
      endDate = startDate;
    }
  }

  function hydrateFromResourceName(value) {
    const template = findResourceTemplateByName(value);
    if (!template) {
      hydratedTemplateId = null;
      resetSelfAssignmentState();
      return;
    }

    if (hydratedTemplateId === template.id) return;
    hydratedTemplateId = template.id;
    name = template.attributes.name || value;
    description = template.attributes.descrip || '';
    price = template.attributes.price || 0;
    maxInvestment = template.attributes.easy || template.attributes.price || 0;
    maxInvestmentTouched = Boolean(
      template.attributes.easy &&
        template.attributes.easy !== template.attributes.price
    );
    kindOf = template.attributes.kindOf || 'total';
    linkto = template.attributes.linkto || '';
    resetSelfAssignmentState();
  }

  function handleSelect() {
    if (selectedTemplateName.length > 0) {
      const selectedName = selectedTemplateName[0];
      name = selectedName;
      hydrateFromResourceName(selectedName);
      showForm = true;
    }
  }

  /**
   * טוען את רשימת ה-Sp הקיימים של המשתמש הנוכחי עבור המשאב (mashaabim) שנבחר.
   */
  async function loadSpOptions() {
    const template = findResourceTemplateByName(name);
    if (!template?.id) {
      existingSpOptions = [];
      return;
    }
    loadingSpOptions = true;
    try {
      const result = await sendToSer(
        { idL: '0', mashaabimId: template.id },
        'getUserSpByMashaabim',
        0,
        0,
        false,
        fetch
      );
      const sps =
        result?.data?.usersPermissionsUser?.data?.attributes?.sps?.data ?? [];
      existingSpOptions = sps;
    } catch (e) {
      console.error('Failed to load Sp options:', e);
      existingSpOptions = [];
    } finally {
      loadingSpOptions = false;
    }
  }

  function toggleSelfAssign() {
    isSelfAssigned = !isSelfAssigned;
    if (isSelfAssigned) {
      loadSpOptions();
    } else {
      // ביטול השמה – איפוס
      isReceived = false;
      existingSpOptions = [];
      selectedSpName = [];
      createNewSp = false;
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      if (showDates && !hasValidDates) {
        toast.error($t('project.resourceCreator.datesRequired'));
      }
      return;
    }

    // ── specMode (PLAN_CONCIERGE §5.3): the wisher authors a resource spec; we
    //    don't persist a record here — the contract is created weave-less by the
    //    requestWishResource action. Just hand the spec back to the caller. ──
    if (specMode) {
      onSpec?.({
        name: name.trim(),
        descrip: description || '',
        price: Number(price) || 0,
        quantity: showQuantity ? Number(hm) || 1 : 1,
        kindOf,
        linkto: linkto || '',
        spnot: spnot || ''
      });
      return;
    }

    // ── publishMode (Concierge community publish): full form, but instead of
    //    persisting a project resource we hand the complete payload back to the
    //    caller — including the resolved mashaabim template id (so the published
    //    open-mashaabim is matchable to providers who hold this resource) and the
    //    rich dimensions (easy, dates, recurring, location). No record created. ──
    if (publishMode) {
      const selectedTemplate = findResourceTemplateByName(name);
      onPublish?.({
        name: name.trim(),
        descrip: description || '',
        price: Number(price) || 0,
        easy: Number(maxInvestment) || Number(price) || 0,
        kindOf,
        quantity: showQuantity ? Number(hm) || 1 : 1,
        recurring: isRecurring && (kindOf === 'monthly' || kindOf === 'yearly'),
        cycleSize:
          isRecurring && (kindOf === 'monthly' || kindOf === 'yearly')
            ? Math.max(1, Number(cycleSize) || 1)
            : null,
        linkto: linkto || '',
        spnot: spnot || '',
        mashaabimId: selectedTemplate?.id ?? null,
        startDate:
          showDates && startDate ? new Date(startDate).toISOString() : null,
        endDate: showDates && endDate ? new Date(endDate).toISOString() : null,
        isOnline: locationScope.location_mode === 'online',
        lat: normalizeLocationNumber(locationScope.lat),
        lng: normalizeLocationNumber(locationScope.lng),
        radius: normalizeLocationNumber(locationScope.radius),
        location_hint: locationScope.location_hint?.trim() || null
      });
      return;
    }

    isSubmitting = true;
    try {
      const selectedTemplate = findResourceTemplateByName(name);

      const result = await createResource({
        projectId,
        name,
        description,
        price,
        easy: maxInvestment || price,
        kindOf,
        recurring: isRecurring && (kindOf === 'monthly' || kindOf === 'yearly'),
        cycleSize:
          isRecurring && (kindOf === 'monthly' || kindOf === 'yearly')
            ? Math.max(1, Number(cycleSize) || 1)
            : undefined,
        hm: showQuantity ? hm : 1,
        linkto,
        spnot,
        mashaabimId: selectedTemplate?.id,
        startDate:
          showDates && startDate
            ? new Date(startDate).toISOString()
            : undefined,
        endDate:
          showDates && endDate ? new Date(endDate).toISOString() : undefined,
        // Self-assignment
        isAssigned: isSingleUser && isSelfAssigned,
        isReceived: isSingleUser && isSelfAssigned && isReceived,
        existingSpId: selectedSpId ?? undefined,
        restime: restime || undefined,
        isOnline: locationScope.location_mode === 'online',
        lat: normalizeLocationNumber(locationScope.lat),
        lng: normalizeLocationNumber(locationScope.lng),
        radius: normalizeLocationNumber(locationScope.radius),
        location_hint: locationScope.location_hint?.trim() || null
      });

      if (result.success) {
        toast.success($t('project.resourceCreator.success'));
        // Forward the created record so callers (e.g. AcceptWishOffer) can link
        // it. Existing no-arg callers are unaffected.
        onCreated?.(result.data);
      } else {
        toast.error($t('project.resourceCreator.error') + ': ' + result.error.message);
      }
    } catch (e) {
      toast.error($t('project.resourceCreator.error'));
      console.error(e);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="resource-creator space-y-6" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="flex justify-between items-center mb-4">
    <h2 class="text-2xl font-bold text-barbi">{specMode ? ($lang === 'en' ? 'Resource offer' : 'הצעת משאב') : publishMode ? ($lang === 'en' ? 'Publish to community' : 'פרסום משאב לקהילה') : $t('project.resourceCreator.title')}</h2>
    {#if onCancel}
      <button
        onclick={onCancel}
        class="text-grey-400 hover:text-white transition-colors"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path></svg
        >
      </button>
    {/if}
  </header>

  {#if !showForm}
    <div
      class="selection-step animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div class="flex items-center gap-2">
        <div class="flex-grow">
          <MultiSelect
            outerDivClass="!bg-pink-900 !border-gold/30 focus-within:!border-gold !text-white !rounded-xl !p-2 shadow-inner"
            inputClass="!bg-transparent !text-white"
            ulOptionsClass="!bg-pink-900 !border-gold/30 !text-white !rounded-xl"
            liOptionClass="!text-white hover:!bg-gold/20"
            liSelectedClass="!bg-gold !text-white"
            loading={isLoading}
            placeholder={$t('project.resourceCreator.selectPlaceholder')}
            options={mashaabimTemplates.map((t) => t.attributes.name)}
            bind:selected={selectedTemplateName}
            bind:searchText
            allowUserOptions="append"
            createOptionMsg={$t('project.resourceCreator.createOption').replace('{name}', searchText)}
            maxSelect={1}
          />
        </div>
        {#if selectedTemplateName.length > 0}
          <Button onClick={handleSelect} class="!p-4">
            <Arrow back={$lang === 'en'} />
          </Button>
        {/if}
      </div>
    </div>
  {:else}
    <div
      class="form-step space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col">
          <label class="text-sm text-barbie mb-1">{$t('project.resourceCreator.name')}</label>
          <input
            type="text"
            bind:value={name}
            list="resource-name-options"
            oninput={() => hydrateFromResourceName(name)}
            required
            class="bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all shadow-sm"
          />
          <datalist id="resource-name-options">
            {#each mashaabimTemplates as template (template.id)}
              <option value={template.attributes.name}></option>
            {/each}
          </datalist>
        </div>
        <div class="flex flex-col">
          <label class="text-sm text-barbie mb-1">{$t('project.resourceCreator.kindOf')}</label>
          <select
            bind:value={kindOf}
            class="bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all shadow-sm"
          >
            {#each ['total', 'monthly', 'yearly', 'perUnit', 'rent'] as val (val)}
              <option value={val} class="bg-pink-900">{$t(`project.resourceCreator.kinds.${val}`)}</option>
            {/each}
          </select>
        </div>

        <div class="flex flex-col">
          <label class="text-sm text-barbie mb-1 font-medium"
            >{publishMode ? $t('project.resourceCreator.minValue') : $t('project.resourceCreator.price')}</label
          >
          <NumberInput value={price} onValueChange={handlePriceInput} />
        </div>
        <div class="flex flex-col">
          <label class="text-sm text-barbie mb-1 font-medium"
            >{publishMode ? $t('project.resourceCreator.maxValue') : $t('project.resourceCreator.maxInvestment')}</label
          >
          <p class="text-xs text-barbie/80 mb-1">
            {publishMode ? $t('project.resourceCreator.maxValueHint') : $t('project.resourceCreator.maxInvestmentHint')}
          </p>
          <NumberInput
            value={maxInvestment}
            onValueChange={handleMaxInvestmentInput}
          />
        </div>

        {#if showQuantity}
          <div class="md:col-span-2 flex flex-col">
            <label class="text-sm text-barbie mb-1 font-medium"
              >{$t('project.resourceCreator.quantity')}</label
            >
            <NumberInput bind:value={hm} />
          </div>
        {/if}

        {#if canBeRecurring}
          <div class="md:col-span-2">
            <button
              type="button"
              onclick={() => (isRecurring = !isRecurring)}
              class="w-full flex items-center justify-between gap-3 rounded-xl border border-gold bg-pink-950/20 p-3 text-start transition-all"
              class:!bg-gold-600={isRecurring}
            >
              <span class="flex flex-col">
                <span class="text-sm font-semibold text-white">🔁 {$t('project.resourceCreator.recurring')}</span>
                <span class="text-xs text-barbie/90">{$t('project.resourceCreator.recurringHint')}</span>
              </span>
              <span
                class="shrink-0 w-12 h-7 rounded-full flex items-center px-1 transition-colors"
                class:bg-gold={isRecurring}
                class:bg-pink-800={!isRecurring}
              >
                <span
                  class="w-5 h-5 rounded-full bg-white transition-transform"
                  class:translate-x-5={isRecurring && $lang !== 'he'}
                  class:-translate-x-5={isRecurring && $lang === 'he'}
                ></span>
              </span>
            </button>

            {#if isRecurring}
              <div
                class="mt-3 flex flex-col rounded-xl border border-gold/40 bg-pink-950/10 p-3 animate-in fade-in duration-300"
              >
                <label class="text-sm text-barbie mb-1 font-medium"
                  >{$t('project.resourceCreator.cycleSize')}</label
                >
                <p class="text-xs text-barbie/80 mb-2">
                  {kindOf === 'yearly'
                    ? $t('project.resourceCreator.cycleSizeHintYearly')
                    : $t('project.resourceCreator.cycleSizeHintMonthly')}
                </p>
                <div class="flex items-center gap-3">
                  <NumberInput
                    value={cycleSize}
                    onValueChange={(v) => (cycleSize = Math.max(1, Number(v) || 1))}
                  />
                  <span class="text-sm text-barbie/90 whitespace-nowrap">
                    {kindOf === 'yearly'
                      ? $t('project.resourceCreator.cycleUnitYearly')
                      : $t('project.resourceCreator.cycleUnitMonthly')}
                  </span>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        {#if showDates}
          <div class="flex flex-col">
            <label class="text-sm text-barbie mb-1">{$t('project.resourceCreator.startDate')} *</label>
            <input
              type="date"
              value={startDate}
              onchange={(event) => handleStartDateInput(event.currentTarget.value)}
              required
              class="bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all"
              class:!border-red-400={showDates && !startDate}
            />
          </div>
          <div class="flex flex-col">
            <label class="text-sm text-barbie mb-1"
              >{isRecurring ? $t('project.resourceCreator.recurringEndOptional') : `${$t('project.resourceCreator.endDate')} *`}</label
            >
            <input
              type="date"
              bind:value={endDate}
              min={startDate || undefined}
              required={!isRecurring}
              class="bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all"
              class:!border-red-400={showDates && !isRecurring && !endDate}
            />
          </div>
        {/if}

        <div class="md:col-span-2 flex flex-col">
          <label class="text-sm text-barbie mb-1">{$t('project.resourceCreator.link')}</label>
          <input
            type="url"
            bind:value={linkto}
            placeholder="https://..."
            class="bg-pink-950/30 placeholder:text-barbie border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all shadow-sm"
          />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-barbie mb-1">{$t('project.resourceCreator.description')}</label>
          <textarea
            bind:value={description}
            class="w-full bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all h-24 resize-none shadow-sm"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-barbie mb-1">{$t('project.resourceCreator.notes')}</label>
          <textarea
            bind:value={spnot}
            class="w-full bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all h-20 resize-none shadow-sm"
          ></textarea>
        </div>

        <div class="md:col-span-2 space-y-2">
          <label class="text-sm text-barbie mb-1">{$t('project.resourceCreator.locationTitle')}</label>
          <button
            type="button"
            onclick={() => (locationOpen = !locationOpen)}
            class="w-full px-4 py-3 text-sm font-medium text-white rounded-xl border border-gold/40 transition-colors flex items-center justify-center"
            class:bg-pink-800={!locationOpen}
            class:hover:bg-pink-700={!locationOpen}
            class:bg-gold-700={locationOpen}
            class:hover:bg-gold-600={locationOpen}
          >
            {locationOpen ? $t('project.resourceCreator.locationDone') : locationSummary(locationScope)}
          </button>
          {#if locationOpen}
            <LocationPicker
              bind:value={locationScope}
              label={$t('project.resourceCreator.locationTitle')}
              helper={$t('project.resourceCreator.locationHelper')}
              height="280px"
            />
          {/if}
        </div>
      </div>

      <!-- השמה לעצמי – מוצג רק כשיש משתמש יחיד בפרויקט; מוסתר במצב מפרט (הצעה לספק) ובמצב פרסום לקהילה -->
      {#if isSingleUser && !specMode && !publishMode}
        <div
          class="self-assign-box rounded-2xl border border-gold bg-pink-950/20 backdrop-blur-sm p-4 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3
                class="text-sm font-semibold text-barbie/80 uppercase tracking-wider"
              >
                {$t('project.resourceCreator.selfAssign')}
              </h3>
              <p class="text-xs text-barbie/90 mt-0.5">{$t('project.resourceCreator.selfAssignHint')}</p>
            </div>
            <button
              type="button"
              onclick={toggleSelfAssign}
              class="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
              class:bg-pink-600={!isSelfAssigned}
              class:hover:bg-pink-500={!isSelfAssigned}
              class:bg-gold-600={isSelfAssigned}
              class:hover:bg-gold-500={isSelfAssigned}
              class:text-white={true}
            >
              {$t('project.resourceCreator.selfAssign')}
              {#if isSelfAssigned}<span>✓</span>{/if}
            </button>
          </div>

          {#if isSelfAssigned}
            <div class="space-y-3 animate-in fade-in duration-300">
              {#if loadingSpOptions}
                <div class="text-center text-barbie text-sm py-2">טוען...</div>
              {:else if existingSpOptions.length > 0}
                <!-- יש SPs קיימים – בחר מהם -->
                <div>
                  <label
                    class="text-xs text-barbie font-semibold uppercase tracking-wider mb-1 block"
                  >
                    {$t('project.resourceCreator.chooseExistingSp')}
                  </label>
                  <MultiSelect
                    outerDivClass="!bg-pink-900/40 !border-gold focus-within:!border-gold !text-white !rounded-xl !p-2"
                    inputClass="!bg-transparent !text-white"
                    ulOptionsClass="!bg-pink-900 !border-gold !text-white !rounded-xl"
                    liOptionClass="!text-white hover:!bg-gold-500/20"
                    liSelectedClass="!bg-gold-600 !text-white"
                    placeholder={$t('project.resourceCreator.chooseExistingSp')}
                    options={existingSpOptions.map((s) => s.attributes.name)}
                    bind:selected={selectedSpName}
                    noMatchingOptionsMsg={$t('project.resourceCreator.noMatchingSp')}
                    maxSelect={1}
                  />
                </div>
                {#if selectedSpName.length > 0}
                  <button
                    type="button"
                    onclick={() => (isReceived = !isReceived)}
                    class="w-full px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                    class:bg-pink-800={!isReceived}
                    class:hover:bg-pink-700={!isReceived}
                    class:bg-pink-500={isReceived}
                    class:hover:bg-pink-400={isReceived}
                    class:text-white={true}
                  >
                    {$t('project.resourceCreator.resourceReceived')}
                    {#if isReceived}<span>✓</span>{/if}
                  </button>
                  {#if isReceived}
                    <p class="text-xs text-pink-200/70 text-center">
                      {$t('project.resourceCreator.resourceReceivedHint')}
                    </p>
                  {/if}
                {/if}
              {:else if !createNewSp}
                <!-- אין SPs – שאל אם ליצור חדש -->
                <div class="text-center space-y-3 py-2">
                  <p class="text-sm font-semibold text-barbie">{$t('project.resourceCreator.noSpForResource')}</p>
                  <button
                    type="button"
                    onclick={() => (createNewSp = true)}
                    class="w-full px-4 py-2 text-sm font-semibold rounded-xl bg-pink-800 hover:bg-pink-700 text-white transition-all duration-200 shadow-sm"
                  >
                    {$t('project.resourceCreator.confirmCreateSp')}
                  </button>
                </div>
              {:else}
                <!-- createNewSp = true – SP חדש ייוצר -->
                <div class="space-y-3">
                  <p class="text-sm text-center text-barbie/90">{$t('project.resourceCreator.newSpWillBeCreated')}</p>
                  <button
                    type="button"
                    onclick={() => (isReceived = !isReceived)}
                    class="w-full px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                    class:bg-pink-800={!isReceived}
                    class:hover:bg-pink-700={!isReceived}
                    class:bg-pink-500={isReceived}
                    class:hover:bg-pink-400={isReceived}
                    class:text-white={true}
                  >
                    {$t('project.resourceCreator.resourceReceived')}
                    {#if isReceived}<span>✓</span>{/if}
                  </button>
                  {#if isReceived}
                    <p class="text-xs text-pink-200/70 text-center">
                      {$t('project.resourceCreator.resourceReceivedHint')}
                    </p>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- סיכום עלות -->
      <div
        class="summary-box mt-4 rounded-2xl border border-gold-500/40 bg-pink-950/20 backdrop-blur-sm p-4 space-y-3 shadow-lg"
      >
        <h3
          class="text-sm font-semibold text-gold-400 uppercase tracking-wider"
        >
          {$t('project.resourceCreator.summaryTitle')}
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="summary-item">
            <span class="summary-label">{$t('project.resourceCreator.totalPrice')}</span>
            <span class="summary-value price"
              >{(+totalPrice || 0).toLocaleString()} ₪</span
            >
          </div>
          <div class="summary-item">
            <span class="summary-label">{$t('project.resourceCreator.totalMax')}</span>
            <span class="summary-value max"
              >{(+totalMax || 0).toLocaleString()} ₪</span
            >
          </div>
        </div>

        <!-- כמה מהריקמה יהיה שווה המשאב הזה — מתעדכן בזמן אמת עם הטופס.
             השווי הוא סכום ההשקעה המבוקש (easy), כפי שנרשם על המשאב. -->
        {#if projectId && totalMax > 0}
          <EquityPreview
            projectId={String(projectId)}
            missionValue={+totalMax || 0}
            monthlyValue={equityMonthlyValue}
            alreadyCountedIn="none"
            subject="resource"
            titleKey="equity.resourceShareAtCreation"
          />
        {/if}
      </div>

      <div class="flex gap-4 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          loading={isSubmitting}
          text={specMode ? $t('common.buttons.sendOfferToProvider') : publishMode ? $t('common.buttons.publishToCommunity') : $t('project.resourceCreator.submit')}
          class="flex-grow !py-4 text-lg font-bold !bg-gold-600 hover:!bg-gold !text-pink-950 shadow-md"
        />
        <Button
          onClick={() => {
            if (onCancel) onCancel();
            else showForm = false;
          }}
          text={$t('project.resourceCreator.cancel')}
          class="!bg-pink-900 hover:!bg-pink-800 !text-pink-200"
        />
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.svelte-multiselect) {
    border: none !important;
  }
  :global(.svelte-multiselect ul.options) {
    background-color: #500724 !important; /* pink-950 */
    border: 1px solid rgba(251, 191, 36, 0.3) !important; /* gold-400 */
    border-radius: 0.75rem !important;
    color: white !important;
  }
  :global(.svelte-multiselect ul.options li.selected) {
    background-color: #d97706 !important; /* gold-600 */
    color: white !important;
  }
  :global(.svelte-multiselect ul.options li) {
    color: white !important;
  }
  :global(.svelte-multiselect ul.options li:hover) {
    background-color: rgba(251, 191, 36, 0.2) !important;
  }

  .summary-box {
    animation: fadeIn 0.3s ease;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(251, 191, 36, 0.1);
  }

  .summary-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--barbie-pink); /* pink-100 */
  }

  .summary-value {
    font-size: 1.4rem;
    font-weight: 800;
    line-height: 1;
  }

  .summary-value.price {
    color: var(--barbie-pink); /* pink-200 */
    text-shadow: 0 0 10px rgba(244, 114, 182, 0.3);
  }

  .summary-value.max {
    color: var(--gold); /* gold-300 */
    text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
