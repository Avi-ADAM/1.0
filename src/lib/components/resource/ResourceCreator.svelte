<script>
  import CurrencyPicker from '$lib/components/money/CurrencyPicker.svelte';
  import CurrencySymbol from '$lib/components/money/CurrencySymbol.svelte';
  import { useFormatMoney, useRikmaCurrency } from '$lib/money/context.svelte';
  import { DEFAULT_CURRENCY } from '$lib/money/currencies.js';
  import { isRtl, t } from '$lib/translations';
  import { onMount, untrack } from 'svelte';
  import MultiSelect from 'svelte-multiselect';
  import { lang } from '$lib/stores/lang.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { createResource } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
  import InviteResultCard from '$lib/components/prPr/InviteResultCard.svelte';
  // Same layout as the mission form (docs/tbd/PLAN_MISSION_FORM_REDESIGN.md).
  import FormSection from '$lib/components/prPr/missionForm/FormSection.svelte';
  import OptionRow from '$lib/components/prPr/missionForm/OptionRow.svelte';
  import MissionSummary from '$lib/components/prPr/missionForm/MissionSummary.svelte';
  import { portal } from '$lib/components/prPr/missionForm/portal.js';
  import { lbl, fieldBox, inp, ghost, segBtn } from '$lib/components/prPr/missionForm/classes.js';
  import {
    Heart,
    Link as LinkLucide,
    Mail,
    MapPin,
    Maximize2,
    Minimize2,
    Repeat,
    UserCheck,
    X
  } from '@lucide/svelte';
  import moment from 'moment';

  /**
   * @typedef {Object} Props
   * @property {string} [projectId]
   * @property {number} [userslength]   - מספר חברי הפרויקט (1 = משתמש יחיד)
   * @property {number|null} [memberCount] - מספר החברים בפועל, להזמנת שותף חדש
   *                                      (PLAN_INVITE_PARTNER_TO_MISSION). לא ידוע = האפשרות מוסתרת.
   * @property {string} [projectName]    - שם הרקמה, להודעת השיתוף של ההזמנה
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
   * @property {(created?: any) => void} [onCreated] - receives the created record
   * @property {() => void} [onCancel]
   * @property {{name?:string, descrip?:string, price?:number, quantity?:number, kindOf?:string}|null} [initialSpec]
   *   - פרה-מילוי: מצב specMode (עריכת מפרט קונסיירז') וגם שורת `resource` מלוח תכנון.
   */

  /** @type {Props} */
  let {
    projectId = '',
    userslength = 1,
    memberCount = null,
    projectName = '',
    restime = '',
    specMode = false,
    onSpec,
    publishMode = false,
    onPublish,
    onCreated,
    onCancel,
    /**
     * Optional prefill: `{ name, descrip, price, quantity, kindOf }`. When
     * present the form opens with these values — used both by specMode plan
     * editing (PLAN_CONCIERGE) and by a planning-board `resource` row opened in
     * the ordinary creation form (PLAN_PROJECT_PLANNING_BOARDS §4).
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
  // The currency the two prices are typed in (PLAN_MULTI_CURRENCY C5). Starts
  // in the rikma's: templates and prefills bring numbers already in it.
  const enclosingRikma = useRikmaCurrency();
  const rikmaCur = $derived(enclosingRikma() ?? DEFAULT_CURRENCY);
  let entryCurrency = $state(enclosingRikma() ?? DEFAULT_CURRENCY);
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

  // "Invite someone new" (PLAN_INVITE_PARTNER_TO_MISSION, decision 3). A solo
  // rikma sends it at once; a larger one votes first, so the invite waits on the
  // pmash and is emailed when it matures — hence the required email there. Keyed
  // on the real member count, not `userslength`, whose default of 1 keeps the
  // self-assign box on for callers that never pass it.
  const canInvite = $derived(!!projectId && !specMode && !publishMode && Number(memberCount) >= 1);
  const inviteNeedsEmail = $derived(Number(memberCount) > 1);
  let inviteNew = $state(false);
  let inviteEmail = $state('');
  let inviteResult = $state(null);
  let inviteCreated = null;
  const INVITE_EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // ₪ לחודש עבור הצגת השווי ברקמה — רק להוצאה מתחדשת בלי תאריך סיום, שממשיכה
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
    // Hydrate from whatever the caller knows about the item. Not gated on
    // specMode any more: a planning-board `resource` row opens the ordinary
    // creation form, and gating this on specMode threw away even its name.
    if (initialSpec) {
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

  // A cleared number field reads back as null; it is held as is (so the field
  // stays empty while typing) and every use reads it through Number().
  function handlePriceInput(value) {
    price = value;
    if (!maxInvestmentTouched) {
      maxInvestment = price;
    }
  }

  function handleMaxInvestmentInput(value) {
    maxInvestmentTouched = true;
    maxInvestment = value;
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
      inviteNew = false;
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

    const inviting = canInvite && inviteNew && !isSelfAssigned;
    const inviteAddress = inviteEmail.trim();
    if (inviting && inviteAddress && !INVITE_EMAIL_SHAPE.test(inviteAddress)) {
      toast.warning($t('mission.invite.invalidEmail'));
      return;
    }
    if (inviting && inviteNeedsEmail && !inviteAddress) {
      toast.warning($t('mission.invite.emailRequired'));
      return;
    }

    isSubmitting = true;
    try {
      const selectedTemplate = findResourceTemplateByName(name);

      const result = await createResource({
        invite: inviting ? (inviteAddress ? { email: inviteAddress } : {}) : undefined,
        projectId,
        name,
        description,
        price: Number(price) || 0,
        easy: Number(maxInvestment) || Number(price) || 0,
        entryCurrency: entryCurrency !== rikmaCur ? entryCurrency : undefined,
        kindOf,
        recurring: isRecurring && (kindOf === 'monthly' || kindOf === 'yearly'),
        cycleSize:
          isRecurring && (kindOf === 'monthly' || kindOf === 'yearly')
            ? Math.max(1, Number(cycleSize) || 1)
            : undefined,
        hm: showQuantity ? Number(hm) || 1 : 1,
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
        // With an invite the form stays up until the inviter has the link in
        // hand — closing first would lose the one thing they came here to send.
        // In a rikma that votes there is no link yet; the card says when it goes.
        if (result.data?.invite) {
          inviteResult = result.data.invite;
          inviteCreated = result.data;
          return;
        }
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

  // ── Layout (same as the mission form) ───────────────────────────────────────
  // Presentation only: the fields above and `handleSubmit`'s payloads are unchanged.
  const rc = (/** @type {string} */ key, /** @type {any} */ vars = undefined) =>
    $t(`project.resourceCreator.${key}`, vars);
  const fmtMoney = useFormatMoney();
  const fmtNum = (/** @type {any} */ n) =>
    (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  /** An amount typed in the form, in the currency it was typed in. */
  const moneyText = (/** @type {any} */ n) =>
    specMode || publishMode ? fmtNum(n) : fmtMoney(Number(n) || 0, entryCurrency);

  /** The rikma-only parts (currency, equity, self-assign, invite, consent note). */
  const inProject = $derived(!!projectId && !specMode && !publishMode);
  /** A rikma's new resource opens full screen, like a new mission; concierge flows open inline. */
  let fullscreen = $state(untrack(() => !!projectId && !specMode && !publishMode));
  let assignOpen = $state(false);
  let inviteOpen = $state(false);
  let detailsOpen = $state(false);

  const KINDS = ['total', 'monthly', 'yearly', 'perUnit', 'rent'];
  const cycles = $derived(Math.max(1, Number(cycleSize) || 1));
  const spanCount = $derived(
    showDates && startDate && endDate
      ? Math.max(moment(endDate).diff(moment(startDate), kindOf === 'yearly' ? 'years' : 'months', true), 0)
      : null
  );
  const formulaText = $derived.by(() => {
    const p = moneyText(price);
    if (isRecurring) {
      const unit = kindOf === 'yearly' ? 'Year' : 'Month';
      return cycles > 1
        ? rc(`form2.everyN${unit}s`, { price: p, count: cycles })
        : rc(`form2.every${unit}`, { price: p });
    }
    if (kindOf === 'perUnit') return rc('form2.formulaUnits', { price: p, count: fmtNum(hm) });
    if (spanCount != null)
      return rc(kindOf === 'yearly' ? 'form2.formulaYears' : 'form2.formulaMonths', {
        price: p,
        count: fmtNum(spanCount)
      });
    // A one-time / rent price is the total itself; the kind is already in the meta line.
    return '';
  });
  const totalText = $derived(moneyText(totalPrice));
  const maxDiffers = $derived((+totalMax || 0) !== (+totalPrice || 0));
  const maxText = $derived(
    rc(publishMode ? 'form2.upTo' : 'form2.rikmaValue', { value: moneyText(totalMax) })
  );
  const summaryMeta = $derived(
    [
      rc(`kinds.${kindOf}`),
      isRecurring ? rc('form2.recurringShort') : '',
      showQuantity ? rc('form2.units', { count: fmtNum(hm) }) : ''
    ]
      .filter(Boolean)
      .join(' · ')
  );
  const checks = $derived([
    { label: rc('form2.checkName'), done: !!name.trim() },
    { label: $t('mission.form2.checkValue'), done: Number(price) > 0 },
    ...(showDates ? [{ label: rc('form2.checkDates'), done: hasValidDates }] : []),
    { label: rc('form2.checkWhere'), done: hasLocationValue(locationScope), optional: true }
  ]);
  const consentNote = $derived(
    inProject && memberCount != null
      ? Number(memberCount) > 1
        ? $t('mission.form2.noteVote')
        : rc('form2.noteSolo')
      : ''
  );
  const assignStatus = $derived(
    isSelfAssigned
      ? isReceived
        ? rc('form2.assignReceived')
        : rc('form2.assignSelf')
      : rc('form2.assignNone')
  );
  const detailsStatus = $derived(
    linkto.trim() || spnot.trim() ? rc('form2.detailsSet') : rc('form2.detailsStatus')
  );
  const title = $derived(
    specMode ? rc('form2.titleSpec') : publishMode ? rc('form2.titlePublish') : rc('title')
  );
  const submitText = $derived(
    specMode
      ? $t('common.buttons.sendOfferToProvider')
      : publishMode
        ? $t('common.buttons.publishToCommunity')
        : rc('submit')
  );
  const msClasses = {
    outerDivClass: '!min-h-[52px] !rounded-xl !border-[1.5px] !border-[#e4d9c4] !bg-white !text-[#2a1420]',
    inputClass: '!bg-transparent !text-[#2a1420]',
    liSelectedClass: '!rounded-full !bg-[#fdeef4] !text-[#a3124e]'
  };

  function cancel() {
    fullscreen = false;
    if (onCancel) onCancel();
    else showForm = false;
  }
</script>

{#snippet publishActions()}
  <div class="flex flex-wrap items-center justify-end gap-2">
    <button
      type="button"
      onclick={cancel}
      class="min-h-11 rounded-xl border-[1.5px] border-[#e4d9c4] bg-white px-4 text-sm text-[#2a1420] transition hover:border-[#c8155f]"
    >
      {rc('cancel')}
    </button>
    <Button
      text={submitText}
      onClick={handleSubmit}
      disabled={isSubmitting || !canSubmit}
      loading={isSubmitting}
    />
  </div>
{/snippet}

<svelte:window
  onkeydown={(e) => {
    if (fullscreen && e.key === 'Escape') fullscreen = false;
  }}
/>

<div
  use:portal={fullscreen}
  dir={$isRtl ? 'rtl' : 'ltr'}
  class={fullscreen
    ? 'fixed inset-0 z-[600] overflow-y-auto bg-[#f4efe6] px-3 py-4 text-start text-[#2a1420] sm:px-8 sm:py-6'
    : 'w-full text-start text-[#2a1420]'}
  role={fullscreen ? 'dialog' : undefined}
  aria-modal={fullscreen ? 'true' : undefined}
  aria-label={fullscreen ? title : undefined}
>
<div class="resource-creator mx-auto w-full max-w-6xl pb-2 sm:pt-2">
  <!-- Header -->
  <header class="mb-5 flex flex-col gap-2 px-1">
    {#if projectName && inProject}
      <span
        class="inline-flex items-center gap-2 self-start rounded-full bg-[#fdeef4] px-3 py-1 text-sm font-medium text-[#a3124e]"
      >
        <Heart size={14} fill="currentColor" aria-hidden="true" />
        {$t('mission.form2.rikmaChip', { name: projectName })}
      </span>
    {/if}
    <div class="flex items-center justify-between gap-3">
      <h1 class="m-0 text-3xl font-extrabold leading-tight text-[#2a1420] sm:text-4xl">{title}</h1>
      <div class="flex flex-none items-center gap-2">
        {#if showForm}
          <button
            type="button"
            onclick={() => (fullscreen = !fullscreen)}
            aria-pressed={fullscreen}
            title={fullscreen ? $t('mission.form2.exitFullscreen') : $t('mission.form2.fullscreen')}
            class="inline-flex min-h-11 flex-none items-center gap-2 rounded-full border-[1.5px] border-[#e4d9c4] bg-white px-4 text-sm font-medium text-[#2a1420] transition hover:border-[#c8155f] hover:text-[#c8155f]"
          >
            {#if fullscreen}
              <Minimize2 size={16} aria-hidden="true" />
              <span class="hidden sm:inline">{$t('mission.form2.exitFullscreen')}</span>
            {:else}
              <Maximize2 size={16} aria-hidden="true" />
              <span class="hidden sm:inline">{$t('mission.form2.fullscreen')}</span>
            {/if}
          </button>
        {/if}
        {#if fullscreen && onCancel}
          <button
            type="button"
            onclick={cancel}
            aria-label={$t('mission.form2.close')}
            title={$t('mission.form2.close')}
            class="flex h-11 w-11 flex-none items-center justify-center rounded-full border-[1.5px] border-[#e4d9c4] bg-white text-[#2a1420] transition hover:border-[#c8155f] hover:text-[#c8155f]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        {/if}
      </div>
    </div>
    <p class="m-0 max-w-2xl text-base text-[#6b5560]">{rc('form2.intro')}</p>
  </header>

  {#if !showForm}
    <div class="flex items-center gap-2 rounded-2xl border border-[#efe6d3] bg-white p-4 shadow-sm">
      <div class="min-w-0 flex-grow">
        <MultiSelect
          {...msClasses}
          loading={isLoading}
          placeholder={rc('selectPlaceholder')}
          options={mashaabimTemplates.map((t) => t.attributes.name)}
          bind:selected={selectedTemplateName}
          bind:searchText
          allowUserOptions="append"
          createOptionMsg={rc('createOption').replace('{name}', searchText)}
          maxSelect={1}
        />
      </div>
      {#if selectedTemplateName.length > 0}
        <Button onClick={handleSelect} class="!p-4">
          <Arrow back={$lang === 'en'} />
        </Button>
      {/if}
    </div>
  {:else}
  <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
    <!-- FORM -->
    <div class="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
      <!-- 1 · What -->
      <FormSection step={1} title={rc('form2.step1Title')} subtitle={rc('form2.step1Sub')}>
        <div>
          <label for="resource-name-input" class={lbl}>{rc('name')}</label>
          <input
            id="resource-name-input"
            type="text"
            bind:value={name}
            list="resource-name-options"
            oninput={() => hydrateFromResourceName(name)}
            required
            placeholder={rc('selectPlaceholder')}
            class={inp}
          />
          <datalist id="resource-name-options">
            {#each mashaabimTemplates as template (template.id)}
              <option value={template.attributes.name}></option>
            {/each}
          </datalist>
          <p class="m-0 mt-1.5 text-[13px] {hydratedTemplateId ? 'font-medium text-[#1f7a55]' : 'text-[#6b5560]'}">
            {hydratedTemplateId ? rc('form2.fromTemplate') : rc('form2.nameHint')}
          </p>
        </div>
        <div>
          <span class={lbl}>{rc('description')}</span>
          <div class="{fieldBox} overflow-hidden">
            <RichText bind:outpot={description} />
          </div>
        </div>
      </FormSection>

      <!-- 2 · Value -->
      <FormSection step={2} title={$t('mission.form2.step2Title')} subtitle={rc('form2.step2Sub')}>
        <div>
          <span class={lbl}>{rc('kindOf')}</span>
          <div class="inline-flex flex-wrap gap-1 rounded-xl bg-[#f6f0e4] p-1" role="group" aria-label={rc('kindOf')}>
            {#each KINDS as val (val)}
              <button
                type="button"
                aria-pressed={kindOf === val}
                onclick={() => (kindOf = val)}
                class={segBtn(kindOf === val)}>{rc(`kinds.${val}`)}</button
              >
            {/each}
          </div>
        </div>

        <div class="grid items-start gap-3 sm:grid-cols-2">
          <div>
            <div class="mb-2 flex min-h-6 items-center justify-between gap-2">
              <label for="resource-price" class="whitespace-nowrap text-sm font-bold text-[#2a1420]"
                >{publishMode ? rc('minValue') : rc('price')}</label
              >
              {#if inProject}
                <CurrencyPicker id="resource-currency" bind:value={entryCurrency} compact />
              {/if}
            </div>
            <div class="{fieldBox} flex h-[52px] items-center overflow-hidden">
              <input
                id="resource-price"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                bind:value={() => price, handlePriceInput}
                class="h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-xl font-bold outline-none"
              />
              <span class="flex-none pe-3.5 text-lg font-bold text-[#6b5560]">
                <CurrencySymbol currency={specMode || publishMode ? null : entryCurrency} />
              </span>
            </div>
          </div>
          <div>
            <div class="mb-2 flex min-h-6 items-center">
              <label for="resource-max" class="text-sm font-bold text-[#2a1420]"
                >{publishMode ? rc('maxValue') : rc('maxInvestment')}</label
              >
            </div>
            <div class="{fieldBox} flex h-[52px] items-center overflow-hidden">
              <input
                id="resource-max"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                bind:value={() => maxInvestment, handleMaxInvestmentInput}
                class="h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-xl font-bold outline-none"
              />
              <span class="flex-none pe-3.5 text-lg font-bold text-[#6b5560]">
                <CurrencySymbol currency={specMode || publishMode ? null : entryCurrency} />
              </span>
            </div>
            <p class="m-0 mt-1.5 text-[13px] text-[#6b5560]">
              {publishMode ? rc('maxValueHint') : rc('maxInvestmentHint')}
            </p>
          </div>
          {#if showQuantity}
            <div>
              <label for="resource-quantity" class={lbl}>{rc('quantity')}</label>
              <input
                id="resource-quantity"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                bind:value={hm}
                class="{inp} text-xl font-bold"
              />
            </div>
          {/if}
        </div>

        {#if canBeRecurring}
          <div class="flex flex-col gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onclick={() => (isRecurring = !isRecurring)}
              class="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-[1.5px] bg-[#fffdf8] p-3 text-start transition sm:p-4 {isRecurring
                ? 'border-[#d9a5bb]'
                : 'border-[#efe6d3] hover:border-[#d9a5bb]'}"
            >
              <span
                class="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#fdeef4] text-[#c8155f]"
                aria-hidden="true"><Repeat size={20} /></span
              >
              <span class="min-w-0 flex-1">
                <strong class="block text-base text-[#2a1420]">{rc('recurring')}</strong>
                <span class="block text-sm text-[#6b5560]">{rc('recurringHint')}</span>
              </span>
              <span
                class="flex h-7 w-12 flex-none items-center rounded-full p-1 transition-colors {isRecurring
                  ? 'justify-end bg-[#c8155f]'
                  : 'justify-start bg-[#d8cbb0]'}"
                aria-hidden="true"><span class="h-5 w-5 rounded-full bg-white shadow"></span></span
              >
            </button>
            {#if isRecurring}
              <div>
                <label for="resource-cycle" class={lbl}>{rc('cycleSize')}</label>
                <div class="flex items-center gap-3">
                  <input
                    id="resource-cycle"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    bind:value={() => cycleSize, (v) => (cycleSize = Math.max(1, Number(v) || 1))}
                    class="{inp} max-w-32 text-xl font-bold"
                  />
                  <span class="text-[15px] text-[#6b5560]">
                    {kindOf === 'yearly' ? rc('cycleUnitYearly') : rc('cycleUnitMonthly')}
                  </span>
                </div>
                <p class="m-0 mt-1.5 text-[13px] text-[#6b5560]">
                  {kindOf === 'yearly' ? rc('cycleSizeHintYearly') : rc('cycleSizeHintMonthly')}
                </p>
              </div>
            {/if}
          </div>
        {/if}

        <div class="flex flex-col gap-1 rounded-2xl border border-[#eee2a6] bg-[#fdf9ea] px-4 py-3.5">
          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span class="text-[15px] text-[#5a4a2a]" dir="auto">{formulaText}</span>
            <strong class="text-2xl font-extrabold text-[#2a1420]" dir="auto">{totalText}</strong>
          </div>
          {#if maxDiffers}
            <span class="text-sm text-[#5a4a2a]" dir="auto">{maxText}</span>
          {/if}
        </div>

        <!-- כמה מהרקמה יהיה שווה המשאב הזה — מתעדכן בזמן אמת עם הטופס.
             השווי הוא סכום ההשקעה המבוקש (easy), כפי שנרשם על המשאב. -->
        {#if projectId && totalMax > 0}
          <details class="group rounded-2xl border border-[#efe6d3] bg-[#fffdf8]">
            <summary
              class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-bold text-[#2a1420]"
            >
              {$t('mission.form2.equityTitle')}
              <svg
                class="h-5 w-5 flex-none text-[#6b5560] transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg
              >
            </summary>
            <div class="border-t border-[#efe6d3] p-2">
              <EquityPreview
                projectId={String(projectId)}
                missionValue={+totalMax || 0}
                monthlyValue={equityMonthlyValue}
                alreadyCountedIn="none"
                subject="resource"
                titleKey="equity.resourceShareAtCreation"
              />
            </div>
          </details>
        {/if}
      </FormSection>

      <!-- 3 · When & where -->
      <FormSection
        step={3}
        title={$t('mission.form2.step4Title')}
        subtitle={showDates ? rc('form2.step3SubDates') : rc('form2.step3Sub')}
        badge={showDates ? '' : $t('mission.form2.optional')}
      >
        {#if showDates}
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="resource-start" class={lbl}>{rc('startDate')} *</label>
              <input
                id="resource-start"
                type="date"
                value={startDate}
                onchange={(event) => handleStartDateInput(event.currentTarget.value)}
                required
                class="{inp} {startDate ? '' : '!border-[#e0849f]'}"
              />
            </div>
            <div>
              <label for="resource-end" class={lbl}
                >{isRecurring ? rc('recurringEndOptional') : `${rc('endDate')} *`}</label
              >
              <input
                id="resource-end"
                type="date"
                bind:value={endDate}
                min={startDate || undefined}
                required={!isRecurring}
                class="{inp} {isRecurring || endDate ? '' : '!border-[#e0849f]'}"
              />
            </div>
          </div>
        {/if}
        <div>
          <span class={lbl}>{$t('mission.form2.location')}</span>
          {#if locationOpen}
            <div class="flex flex-col gap-3">
              <LocationPicker
                bind:value={locationScope}
                label={rc('locationTitle')}
                helper={rc('locationHelper')}
                height="280px"
              />
              <button type="button" onclick={() => (locationOpen = false)} class="{ghost} self-start">
                {$t('mission.form2.closeLocation')}
              </button>
            </div>
          {:else}
            <button
              type="button"
              onclick={() => (locationOpen = true)}
              class="flex min-h-[56px] w-full items-center gap-3 rounded-xl border-[1.5px] border-[#e4d9c4] bg-[#fffdf8] px-3 text-start transition hover:border-[#c8155f]"
            >
              <span class="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#fdeef4] text-[#c8155f]">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <span
                class="min-w-0 flex-1 truncate text-[15px] {hasLocationValue(locationScope) ? 'font-medium' : 'text-[#6b5560]'}"
              >
                {locationSummary(locationScope)}
              </span>
              <span class="flex-none text-sm font-bold text-[#c8155f]">{$t('mission.form2.setLocation')}</span>
            </button>
          {/if}
        </div>
      </FormSection>

      <!-- More options -->
      <FormSection title={$t('mission.form2.moreTitle')} subtitle={$t('mission.form2.moreSub')}>
        <div class="flex flex-col gap-3">
          <!-- השמה לעצמי – רק כשיש משתמש יחיד בפרויקט; לא במצב מפרט (הצעה לספק) ולא בפרסום לקהילה -->
          {#if isSingleUser && !specMode && !publishMode}
            <OptionRow icon={UserCheck} title={rc('selfAssign')} status={assignStatus} bind:open={assignOpen}>
              <div class="flex flex-col gap-3">
                <label for="resource-self" class="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    id="resource-self"
                    type="checkbox"
                    checked={isSelfAssigned}
                    onchange={toggleSelfAssign}
                    class="h-5 w-5 accent-[#c8155f]"
                  />
                  <span>
                    <span class="block font-semibold">{rc('selfAssign')}</span>
                    <span class="block text-sm text-[#6b5560]">{rc('selfAssignHint')}</span>
                  </span>
                </label>

                {#if isSelfAssigned}
                  {#if loadingSpOptions}
                    <p class="m-0 text-sm text-[#6b5560]" aria-busy="true">{rc('loading')}</p>
                  {:else if existingSpOptions.length > 0}
                    <!-- יש SPs קיימים – בחר מהם -->
                    <div>
                      <span class={lbl}>{rc('chooseExistingSp')}</span>
                      <MultiSelect
                        {...msClasses}
                        --sms-open-z-index={10000}
                        placeholder={rc('chooseExistingSp')}
                        options={existingSpOptions.map((s) => s.attributes.name)}
                        bind:selected={selectedSpName}
                        noMatchingOptionsMsg={rc('noMatchingSp')}
                        maxSelect={1}
                      />
                    </div>
                  {:else if !createNewSp}
                    <!-- אין SPs – שאל אם ליצור חדש -->
                    <div class="flex flex-col gap-2">
                      <p class="m-0 text-sm font-semibold">{rc('noSpForResource')}</p>
                      <button type="button" onclick={() => (createNewSp = true)} class="{ghost} self-start">
                        {rc('confirmCreateSp')}
                      </button>
                    </div>
                  {:else}
                    <p class="m-0 text-sm text-[#6b5560]">{rc('newSpWillBeCreated')}</p>
                  {/if}

                  {#if selectedSpName.length > 0 || (createNewSp && existingSpOptions.length === 0)}
                    <label for="resource-received" class="flex min-h-11 cursor-pointer items-center gap-3">
                      <input
                        id="resource-received"
                        type="checkbox"
                        bind:checked={isReceived}
                        class="h-5 w-5 accent-[#c8155f]"
                      />
                      <span>
                        <span class="block font-semibold">{rc('resourceReceived')}</span>
                        <span class="block text-sm text-[#6b5560]">{rc('resourceReceivedHint')}</span>
                      </span>
                    </label>
                  {/if}
                {/if}
              </div>
            </OptionRow>
          {/if}

          <!-- הזמנת שותף חדש (PLAN_INVITE_PARTNER_TO_MISSION) -->
          {#if canInvite}
            <OptionRow
              icon={Mail}
              title={$t('mission.form2.invite')}
              status={inviteNew && inviteEmail.trim() ? inviteEmail.trim() : $t('mission.form2.inviteStatus')}
              bind:open={inviteOpen}
            >
              <label for="resource-invite" class="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  id="resource-invite"
                  bind:checked={inviteNew}
                  type="checkbox"
                  class="h-5 w-5 accent-[#c8155f]"
                  onchange={() => {
                    if (inviteNew && isSelfAssigned) toggleSelfAssign();
                  }}
                />
                <span class="font-semibold">{$t('mission.invite.resourceOptionLabel')}</span>
              </label>
              <p class="m-0 text-sm text-[#6b5560]">
                {$t(inviteNeedsEmail ? 'mission.invite.resourceVoteHelp' : 'mission.invite.resourceHelp')}
              </p>
              {#if inviteNew}
                <input
                  bind:value={inviteEmail}
                  type="email"
                  inputmode="email"
                  autocomplete="off"
                  dir="ltr"
                  required={inviteNeedsEmail}
                  class="{inp} mt-2"
                  placeholder={$t(inviteNeedsEmail ? 'mission.invite.emailPlaceholderRequired' : 'mission.invite.emailPlaceholder')}
                  aria-label={$t(inviteNeedsEmail ? 'mission.invite.emailPlaceholderRequired' : 'mission.invite.emailPlaceholder')}
                />
              {/if}
            </OptionRow>
          {/if}

          <OptionRow icon={LinkLucide} title={rc('form2.details')} status={detailsStatus} bind:open={detailsOpen}>
            <div class="flex flex-col gap-3">
              <div>
                <label for="resource-link" class={lbl}>{rc('link')}</label>
                <input
                  id="resource-link"
                  type="url"
                  bind:value={linkto}
                  placeholder="https://..."
                  dir="ltr"
                  class={inp}
                />
              </div>
              <div>
                <label for="resource-notes" class={lbl}>{rc('notes')}</label>
                <textarea
                  id="resource-notes"
                  bind:value={spnot}
                  rows="3"
                  class="{inp} h-auto min-h-20 resize-y py-3"
                ></textarea>
              </div>
            </div>
          </OptionRow>
        </div>
      </FormSection>
    </div>

    <!-- SUMMARY + submit (desktop): stays in view while the form scrolls. -->
    <aside class="hidden lg:sticky lg:top-4 lg:block lg:w-[340px] lg:flex-none">
      <MissionSummary
        heading={$t('mission.form2.summary')}
        {name}
        meta={summaryMeta}
        valueLabel={publishMode ? rc('minValue') : rc('totalPrice')}
        total={totalText}
        formula={maxDiffers ? `${formulaText} · ${maxText}` : formulaText}
        {checks}
        note={consentNote}
      >
        {#snippet actions()}
          {@render publishActions()}
        {/snippet}
      </MissionSummary>
    </aside>
  </div>

  <!-- SUMMARY + submit (phone / tablet), at the end of the form -->
  <div class="mt-5 lg:hidden">
    <MissionSummary
      wide
      heading={$t('mission.form2.summary')}
      {name}
      meta={summaryMeta}
      valueLabel={publishMode ? rc('minValue') : rc('totalPrice')}
      total={totalText}
      formula={maxDiffers ? `${formulaText} · ${maxText}` : formulaText}
      {checks}
      note={consentNote}
    >
      {#snippet actions()}
        {@render publishActions()}
      {/snippet}
    </MissionSummary>
  </div>

  <!-- Submit bar (phone / tablet): above the app's bottom nav, or at the very
       bottom in full-screen mode where the nav is covered. -->
  <div
    class="sticky z-10 mt-4 flex items-center gap-3 rounded-2xl border border-[#eee2a6] bg-[#fffdf7] p-3 shadow-[0_-6px_30px_rgba(0,0,0,.18)] lg:hidden {fullscreen
      ? 'bottom-2'
      : 'bottom-24'}"
  >
    <div class="min-w-0 flex-1">
      <strong class="block truncate text-xl font-extrabold text-[#c8155f]" dir="auto">{totalText}</strong>
      <span class="block truncate text-xs text-[#6b5560]" dir="auto">{formulaText}</span>
    </div>
    {@render publishActions()}
  </div>
  {/if}
</div>
</div>

{#if inviteResult}
  <InviteResultCard
    invite={inviteResult}
    kind="resource"
    missionName={name}
    {projectName}
    onDone={() => {
      const created = inviteCreated;
      inviteResult = null;
      inviteCreated = null;
      onCreated?.(created);
    }}
  />
{/if}
