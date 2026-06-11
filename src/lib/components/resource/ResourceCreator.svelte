<script>
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
  import moment from 'moment';

  /**
   * @typedef {Object} Props
   * @property {string} [projectId]
   * @property {number} [userslength]   - מספר חברי הפרויקט (1 = משתמש יחיד)
   * @property {string} [restime]       - זמן תגובה לחישוב Timegrama (לדוגמה: "7d")
   * @property {boolean} [specMode]     - מצב "ספק" (PLAN_CONCIERGE §5.3): הלקוחה מנסחת מפרט משאב
   *                                      ולא יוצרת רשומה — handleSubmit מחזיר את המפרט ל-onSpec.
   * @property {(spec: {name:string, descrip:string, price:number, quantity:number, kindOf:string, linkto:string, spnot:string}) => void} [onSpec]
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

  const i18n = {
    he: {
      title: 'בקשת משאב חדש',
      selectPlaceholder: 'בחירה מרשימה או הקלדת שם למשאב חדש...',
      createOption: 'יצירת משאב חדש: "{name}"',
      name: 'שם המשאב',
      description: 'תיאור',
      price: 'שווי / מחיר',
      maxInvestment: 'שווי לחישוב בפרויקט',
      maxInvestmentHint: 'הצעת ערך גבוה יותר שמכיל את הסיכון',
      kindOf: 'סוג שווי',
      quantity: 'כמות',
      link: 'לינק לפרטים / רכישה',
      notes: 'הערות מיוחדות',
      startDate: 'תאריך התחלה',
      endDate: 'תאריך סיום',
      submit: 'פרסום דרישת משאב',
      cancel: 'ביטול',
      loading: 'טוען משאבים...',
      success: 'דרישת המשאב פורסמה בהצלחה',
      error: 'שגיאה בפרסום דרישת המשאב',
      datesRequired: 'יש לציין תאריך התחלה ותאריך סיום',
      recurring: 'הוצאה חוזרת חודשית',
      recurringHint: 'תשלום קבוע שחוזר כל חודש (שרת, שכירות, דוכן). בכל חודש תתבקשו לאשר את הסכום שהוצא, וזה ייכנס לארכיון לאחר אישור הריקמה.',
      recurringEndOptional: 'תאריך סיום (לא חובה — עד לסימון כהושלם)',
      totalPrice: 'סה"כ עלות משוערת',
      totalMax: 'סה"כ שווי בריקמה',
      summaryTitle: 'סיכום עלות',
      selfAssign: 'השמה לעצמי',
      selfAssignHint: 'לחץ לסמן שאתה תספק משאב זה',
      chooseExistingSp: 'בחר מהמשאבים שלי',
      createNewSp: 'יצירת משאב חדש (Sp)',
      resourceReceived: 'האם המשאב התקבל?',
      resourceReceivedHint: 'סמן אם קיבלת את המשאב כבר',
      noMatchingSp: 'אין לך משאבים מתאימים',
      noSpForResource: 'אין לך את המשאב הזה',
      confirmCreateSp: 'כן, צור משאב חדש',
      newSpWillBeCreated: 'משאב חדש ייווצר עבורך',
      kinds: {
        total: 'עלות חד פעמית',
        monthly: 'חודשי',
        yearly: 'שנתי',
        perUnit: 'ליחידה',
        rent: 'השכרה'
      },
      locationTitle: 'מיקום',
      locationHelper:
        'בחרו האם המשאב ניתן אונליין, במקום או היברידי, ואת רדיוס השירות.',
      locationEmpty: 'לא הוגדר מיקום',
      locationSelected: 'מיקום נבחר',
      locationOnline: 'אונליין',
      locationDone: 'סיום'
    },
    en: {
      title: 'Request New Resource',
      selectPlaceholder: 'Choose from list or type a new name...',
      createOption: 'Create new resource: "{name}"',
      name: 'Resource Name',
      description: 'Description',
      price: 'Value / Price',
      maxInvestment: 'Maximum Investment Value',
      maxInvestmentHint: 'Suggested higher value to cover risk',
      kindOf: 'Value Type',
      quantity: 'Quantity',
      link: 'Link to details / purchase',
      notes: 'Special Notes',
      startDate: 'Start Date',
      endDate: 'End Date',
      submit: 'Publish Resource Requirement',
      cancel: 'Cancel',
      loading: 'Loading resources...',
      success: 'Resource requirement published successfully',
      error: 'Error publishing resource requirement',
      datesRequired: 'Start and end dates are required',
      recurring: 'Recurring monthly expense',
      recurringHint: 'A fixed payment that repeats every month (server, rent, stall). Each month you will be asked to confirm the amount spent, and it is archived after the weave approves it.',
      recurringEndOptional: 'End date (optional — until marked done)',
      totalPrice: 'Total Estimated Cost',
      totalMax: 'Total Maximum Value',
      summaryTitle: 'Cost Summary',
      selfAssign: 'Self Assignment',
      selfAssignHint: 'Click to mark that you will provide this resource',
      chooseExistingSp: 'Choose from my resources',
      createNewSp: 'Create new resource (Sp)',
      resourceReceived: 'Was the resource received?',
      resourceReceivedHint: 'Check if you already received the resource',
      noMatchingSp: 'No matching resources found',
      noSpForResource: "You don't have this resource",
      confirmCreateSp: 'Yes, create new resource',
      newSpWillBeCreated: 'A new resource will be created for you',
      kinds: {
        total: 'One-time cost',
        monthly: 'Monthly',
        yearly: 'Yearly',
        perUnit: 'Per unit',
        rent: 'Rent'
      },
      locationTitle: 'Location',
      locationHelper:
        'Choose whether this resource is online, on-site, or hybrid, and set the service radius.',
      locationEmpty: 'No location set',
      locationSelected: 'Location selected',
      locationOnline: 'Online',
      locationDone: 'Done'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);

  function locationSummary(location) {
    if (!location || !hasLocationValue(location)) return t.locationEmpty;
    if (location.location_mode === 'online') return t.locationOnline;
    if (hasLocationPoint(location)) {
      const hint = location.location_hint?.trim() || t.locationSelected;
      return `${hint} - ${location.radius || 15} km`;
    }
    return location.location_hint?.trim() || t.locationSelected;
  }

  onMount(async () => {
    // specMode editing: hydrate the form with the existing plan item's details.
    if (specMode && initialSpec) {
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
        toast.error(t.datesRequired);
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
        toast.success(t.success);
        // Forward the created record so callers (e.g. AcceptWishOffer) can link
        // it. Existing no-arg callers are unaffected.
        onCreated?.(result.data);
      } else {
        toast.error(t.error + ': ' + result.error.message);
      }
    } catch (e) {
      toast.error(t.error);
      console.error(e);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="resource-creator space-y-6" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
  <header class="flex justify-between items-center mb-4">
    <h2 class="text-2xl font-bold text-barbi">{specMode ? ($lang === 'en' ? 'Resource offer' : 'הצעת משאב') : t.title}</h2>
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
            placeholder={t.selectPlaceholder}
            options={mashaabimTemplates.map((t) => t.attributes.name)}
            bind:selected={selectedTemplateName}
            bind:searchText
            allowUserOptions="append"
            createOptionMsg={t.createOption.replace('{name}', searchText)}
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
          <label class="text-sm text-barbie mb-1">{t.name}</label>
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
          <label class="text-sm text-barbie mb-1">{t.kindOf}</label>
          <select
            bind:value={kindOf}
            class="bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all shadow-sm"
          >
            {#each Object.entries(t.kinds) as [val, label] (val)}
              <option value={val} class="bg-pink-900">{label}</option>
            {/each}
          </select>
        </div>

        <div class="flex flex-col">
          <label class="text-sm text-barbie mb-1 font-medium">{t.price}</label>
          <NumberInput value={price} onValueChange={handlePriceInput} />
        </div>
        <div class="flex flex-col">
          <label class="text-sm text-barbie mb-1 font-medium"
            >{t.maxInvestment}</label
          >
          <p class="text-xs text-barbie/80 mb-1">{t.maxInvestmentHint}</p>
          <NumberInput
            value={maxInvestment}
            onValueChange={handleMaxInvestmentInput}
          />
        </div>

        {#if showQuantity}
          <div class="md:col-span-2 flex flex-col">
            <label class="text-sm text-barbie mb-1 font-medium"
              >{t.quantity}</label
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
                <span class="text-sm font-semibold text-white">🔁 {t.recurring}</span>
                <span class="text-xs text-barbie/90">{t.recurringHint}</span>
              </span>
              <span
                class="shrink-0 w-12 h-7 rounded-full flex items-center px-1 transition-colors"
                class:bg-gold={isRecurring}
                class:bg-pink-800={!isRecurring}
              >
                <span
                  class="w-5 h-5 rounded-full bg-white transition-transform"
                  class:translate-x-5={isRecurring}
                ></span>
              </span>
            </button>
          </div>
        {/if}

        {#if showDates}
          <div class="flex flex-col">
            <label class="text-sm text-barbie mb-1">{t.startDate} *</label>
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
              >{isRecurring ? t.recurringEndOptional : `${t.endDate} *`}</label
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
          <label class="text-sm text-barbie mb-1">{t.link}</label>
          <input
            type="url"
            bind:value={linkto}
            placeholder="https://..."
            class="bg-pink-950/30 placeholder:text-barbie border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all shadow-sm"
          />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-barbie mb-1">{t.description}</label>
          <textarea
            bind:value={description}
            class="w-full bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all h-24 resize-none shadow-sm"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-barbie mb-1">{t.notes}</label>
          <textarea
            bind:value={spnot}
            class="w-full bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all h-20 resize-none shadow-sm"
          ></textarea>
        </div>

        <div class="md:col-span-2 space-y-2">
          <label class="text-sm text-barbie mb-1">{t.locationTitle}</label>
          <button
            type="button"
            onclick={() => (locationOpen = !locationOpen)}
            class="w-full px-4 py-3 text-sm font-medium text-white rounded-xl border border-gold/40 transition-colors flex items-center justify-center"
            class:bg-pink-800={!locationOpen}
            class:hover:bg-pink-700={!locationOpen}
            class:bg-gold-700={locationOpen}
            class:hover:bg-gold-600={locationOpen}
          >
            {locationOpen ? t.locationDone : locationSummary(locationScope)}
          </button>
          {#if locationOpen}
            <LocationPicker
              bind:value={locationScope}
              label={t.locationTitle}
              helper={t.locationHelper}
              height="280px"
            />
          {/if}
        </div>
      </div>

      <!-- השמה לעצמי – מוצג רק כשיש משתמש יחיד בפרויקט; מוסתר במצב מפרט (הצעה לספק) -->
      {#if isSingleUser && !specMode}
        <div
          class="self-assign-box rounded-2xl border border-gold bg-pink-950/20 backdrop-blur-sm p-4 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3
                class="text-sm font-semibold text-barbie/80 uppercase tracking-wider"
              >
                {t.selfAssign}
              </h3>
              <p class="text-xs text-barbie/90 mt-0.5">{t.selfAssignHint}</p>
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
              {t.selfAssign}
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
                    {t.chooseExistingSp}
                  </label>
                  <MultiSelect
                    outerDivClass="!bg-pink-900/40 !border-gold focus-within:!border-gold !text-white !rounded-xl !p-2"
                    inputClass="!bg-transparent !text-white"
                    ulOptionsClass="!bg-pink-900 !border-gold !text-white !rounded-xl"
                    liOptionClass="!text-white hover:!bg-gold-500/20"
                    liSelectedClass="!bg-gold-600 !text-white"
                    placeholder={t.chooseExistingSp}
                    options={existingSpOptions.map((s) => s.attributes.name)}
                    bind:selected={selectedSpName}
                    noMatchingOptionsMsg={t.noMatchingSp}
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
                    {t.resourceReceived}
                    {#if isReceived}<span>✓</span>{/if}
                  </button>
                  {#if isReceived}
                    <p class="text-xs text-pink-200/70 text-center">
                      {t.resourceReceivedHint}
                    </p>
                  {/if}
                {/if}
              {:else if !createNewSp}
                <!-- אין SPs – שאל אם ליצור חדש -->
                <div class="text-center space-y-3 py-2">
                  <p class="text-sm font-semibold text-barbie">{t.noSpForResource}</p>
                  <button
                    type="button"
                    onclick={() => (createNewSp = true)}
                    class="w-full px-4 py-2 text-sm font-semibold rounded-xl bg-pink-800 hover:bg-pink-700 text-white transition-all duration-200 shadow-sm"
                  >
                    {t.confirmCreateSp}
                  </button>
                </div>
              {:else}
                <!-- createNewSp = true – SP חדש ייוצר -->
                <div class="space-y-3">
                  <p class="text-sm text-center text-barbie/90">{t.newSpWillBeCreated}</p>
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
                    {t.resourceReceived}
                    {#if isReceived}<span>✓</span>{/if}
                  </button>
                  {#if isReceived}
                    <p class="text-xs text-pink-200/70 text-center">
                      {t.resourceReceivedHint}
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
          {t.summaryTitle}
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="summary-item">
            <span class="summary-label">{t.totalPrice}</span>
            <span class="summary-value price"
              >{(+totalPrice || 0).toLocaleString()} ₪</span
            >
          </div>
          <div class="summary-item">
            <span class="summary-label">{t.totalMax}</span>
            <span class="summary-value max"
              >{(+totalMax || 0).toLocaleString()} ₪</span
            >
          </div>
        </div>
      </div>

      <div class="flex gap-4 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          loading={isSubmitting}
          text={specMode ? { he: 'שליחת הצעה לספק', en: 'Send offer to provider' } : { he: t.submit, en: t.submit }}
          class="flex-grow !py-4 text-lg font-bold !bg-gold-600 hover:!bg-gold !text-pink-950 shadow-md"
        />
        <Button
          onClick={() => {
            if (onCancel) onCancel();
            else showForm = false;
          }}
          text={{ he: t.cancel, en: t.cancel }}
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
