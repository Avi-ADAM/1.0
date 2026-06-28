<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { goto } from '$app/navigation';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { uPic } from '$lib/stores/uPic.js';
  import { t, locale } from '$lib/translations';

  /**
   * @type {{
   *   data?: { uid?: string; un?: string },
   *   anon?: boolean
   * }}
   * `anon` = public/guest mode (V1): the wish is composed before an account
   * exists. Matches are shown with supplier identities masked, and "publish"
   * stashes a draft and routes to registration instead of creating the Ratson.
   */
  let { data = {}, anon = false } = $props();

  onMount(() => {
    showFoot.set(false);
    // Resume a draft stashed by the guest composer before registration (V1).
    if (!anon) restoreDraftIfAny();
  });
  onDestroy(() => showFoot.set(true));

  function restoreDraftIfAny() {
    try {
      const raw = sessionStorage.getItem('wishDraft');
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title && !title) title = d.title;
      if (d.body && !body) body = d.body;
      if (Array.isArray(d.values) && values.length === 0) values = d.values;
      if (d.startDate) startDate = d.startDate;
      if (d.finnishDate) finnishDate = d.finnishDate;
      if (typeof d.budgetAmount === 'number') budgetAmount = d.budgetAmount;
      if (typeof d.whoCanOffer === 'boolean') whoCanOffer = d.whoCanOffer;
      if (d.whoCanSee) whoCanSee = d.whoCanSee;
      if (d.invitePartners) invitePartners = d.invitePartners;
      if (d.joinKind) joinKind = d.joinKind;
      if (typeof d.minJoiners === 'number') minJoiners = d.minJoiners;
      if (typeof d.maxJoiners === 'number') maxJoiners = d.maxJoiners;
      if (d.joinDeadline) joinDeadline = d.joinDeadline;
      if (d.location) location = d.location;
      // Extraction re-runs automatically once `body` is set (debounced $effect).
      sessionStorage.removeItem('wishDraft');
    } catch (err) {
      console.warn('[WishForm] could not restore draft:', err);
    }
  }

  function getUserInitials(name) {
    if (!name) return 'מש';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2);
    }
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  /* ===== Inspiration seeds ===== */
  /* ===== Inspiration seeds ===== */
  const SEEDS = [
    { icon: '🎁', label: 'מתנה לאדם אהוב', hint: 'יום חופש, חוויה, התרגשות' },
    {
      icon: '🛠',
      label: 'משימה שלא מצליחים לבד',
      hint: 'תיקון, סידור, פרויקט'
    },
    { icon: '🌿', label: 'אירוע קטן בקהילה', hint: 'מפгש, סדנה, יוזמה' },
    { icon: '✈', label: 'תכנון נסיעה', hint: 'יעד, מלון, לינה' },
    { icon: '👶', label: 'תמיכה במשפחה', hint: 'השגחה, בישול, ליוوي' },
    { icon: '✍', label: 'משאלה חופשית', hint: 'ספרו הכל בחופשיות' }
  ];

  /* ===== AI extraction (Lev rail — live analysis) ===== */
  let extractedMissions = $state(
    /** @type {{name:string,imp:string}[]} */ ([])
  );
  let extractedResources = $state(
    /** @type {{name:string,imp:string}[]} */ ([])
  );
  let extractedSkills = $state(/** @type {{name:string}[]} */ ([]));
  let extractedCategories = $state(/** @type {string[]} */ ([]));
  let extractedHints = $state(/** @type {{kind:string,text:string}[]} */ ([]));
  let matchedPeople = $state(
    /** @type {{id:string,username:string,avatar:string|null,matchedSkills:string[],projects:string[]}[]} */ ([])
  );
  let matchedMissions = $state(
    /** @type {{id:string,name:string,matchedTerm:string}[]} */ ([])
  );
  let matchedResources = $state(
    /** @type {{id:string,name:string,template:string|null,price:number|null,ownerName:string|null,ownerAvatar:string|null,project:string|null}[]} */ ([])
  );
  /** Full enrichment snapshot (people+resources+products+missions+skills) —
   *  persisted into ai_meta so /concierge/[id] renders it without re-running
   *  the Gemini/Pinecone analysis on every load. */
  let matchedEnrichment = $state(/** @type {any} */ (null));
  let extracting = $state(false);

  /** Debounced AI extraction — fires 1.2s after user stops typing */
  $effect(() => {
    const text = body
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length < 20) {
      extractedMissions = [];
      extractedResources = [];
      extractedSkills = [];
      extractedCategories = [];
      extractedHints = [];
      matchedPeople = [];
      matchedMissions = [];
      matchedResources = [];
      matchedEnrichment = null;
      return;
    }
    const timer = setTimeout(async () => {
      extracting = true;
      try {
        const res = await fetch('/api/concierge-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          const data = await res.json();
          extractedMissions = data.missions ?? [];
          extractedResources = data.resources ?? [];
          extractedSkills = data.skills ?? [];
          extractedCategories = data.categories ?? [];
          extractedHints = data.hints ?? [];
          matchedPeople = data.matches?.people ?? [];
          matchedMissions = data.matches?.missions ?? [];
          matchedResources = data.matches?.resources ?? [];
          matchedEnrichment = data.matches ?? null;
          // Auto-fill a title once Lev suggests one and the user hasn't typed it.
          if (!title.trim() && data.titleSuggestion) {
            title = data.titleSuggestion;
          }
        }
      } catch (err) {
        console.warn('[concierge/new] extraction failed:', err);
      } finally {
        extracting = false;
      }
    }, 1200);
    return () => clearTimeout(timer);
  });

  const ALL_VALUES = [
    'הסכמה',
    'שוויון',
    'קהילתיות',
    'שקיפות',
    'נגישות',
    'אקולוגיה',
    'הדדיות',
    'יצירתיות',
    'נדיבות',
    'אמון'
  ];

  const DETAIL_JEWELS = [
    {
      icon: '📅',
      label: 'מתי',
      placeholder: 'לחיצה לבחירת תאריך',
      accent: 'gold'
    },
    {
      icon: '📍',
      label: 'היכן',
      placeholder: 'עיר, אזור, או הביתה',
      accent: 'blue'
    },
    {
      icon: '💰',
      label: 'תקציב',
      placeholder: 'טווח גמיש או לפי הצעה',
      accent: 'green'
    },
    {
      icon: '👥',
      label: 'מי יכול/ה להציע',
      placeholder: 'פתוח לכל / חברי הריקמה',
      accent: 'barbi'
    },
    {
      icon: '🔒',
      label: 'מי יכול/ה לראות',
      placeholder: 'פרטי · ריקמות בלבד · קהילה',
      accent: 'gold'
    },
    {
      icon: '🤝',
      label: 'האם להזמין שותפים',
      placeholder: 'כן — אישית, או דרך Lev',
      accent: 'green'
    },
    {
      icon: '🫂',
      label: 'יוזמה משותפת',
      placeholder: 'אישית · או קבוצתית',
      accent: 'barbi'
    }
  ];

  const WHO_CAN_OFFER_OPTIONS = [
    {
      value: true,
      label: 'פתוח לכל',
      hint: 'כל מי שיש לו/ה מוצר מתאים יכול/ה להציע.'
    },
    {
      value: false,
      label: 'ריקמות שלי בלבד',
      hint: 'רק חברי/ות פרויקטים שאני בהם יוכלו להציע.'
    }
  ];
  const WHO_CAN_SEE_OPTIONS = [
    {
      value: 'personal',
      label: 'פרטי',
      hint: 'רק המשתמש/ת רואה. המשאלה לא תיכנס למסך הציבורי.'
    },
    {
      value: 'free_threshold',
      label: 'פתוח לקהילה',
      hint: 'מופיע במסך משאלות הקהילה לכל הרשומים.'
    },
    {
      value: 'pay_to_access',
      label: 'גישה בתשלום',
      hint: 'גישה למשאלה דרך טוקן/תשלום (M+).'
    }
  ];
  const INVITE_PARTNERS_OPTIONS = [
    { value: 'lev', label: 'דרך Lev', hint: 'Lev תמצא ותפנה אוטומטית.' },
    {
      value: 'manual',
      label: 'הזמנה עצמית',
      hint: 'הזמנה אישית של השותפים הרצויים.'
    },
    {
      value: 'none',
      label: 'בלי',
      hint: 'ללא הזמנה מראש — בחירה עצמית מתוך ההצעות הקיימות.'
    }
  ];
  /* Shared-purchase initiative kinds (PLAN_SHARED_PURCHASE S0).
     'solo' = today's behaviour. Any other value opens a group that others
     can join, decide and pay together. */
  const JOIN_KIND_OPTIONS = [
    {
      value: 'solo',
      label: 'יוזמה אישית',
      hint: 'אני מארגנ/ת, אחרים מציעים.'
    },
    {
      value: 'group_purchase',
      label: 'רכישה משותפת',
      hint: 'כמה אנשים קונים יחד ומתחלקים בעלות.'
    },
    {
      value: 'group_trip',
      label: 'טיול קבוצתי',
      hint: 'מתכננים ומשלמים יחד על נסיעה.'
    },
    {
      value: 'community_event',
      label: 'אירוע קהילתי',
      hint: 'מפגש או יוזמה משותפת בקהילה.'
    },
    {
      value: 'public_renovation',
      label: 'שיפוץ / פרויקט ציבורי',
      hint: 'מרחב משותף שכמה אנשים משפצים יחד.'
    },
    {
      value: 'recurring_subscription',
      label: 'מנוי משותף מתמשך',
      hint: 'התחייבות חוזרת שמתחלקת בין המשתתפים.'
    },
    { value: 'other', label: 'אחר', hint: 'יוזמה משותפת מסוג אחר.' }
  ];

  const ACCENT = {
    gold: {
      ring: 'rgba(238,232,170,0.4)',
      glow: 'rgba(238,232,170,0.25)',
      text: '#fde68a',
      rgb: '238,232,170'
    },
    barbi: {
      ring: 'rgba(255,77,158,0.5)',
      glow: 'rgba(255,77,158,0.3)',
      text: '#ff4d9e',
      rgb: '255,77,158'
    },
    blue: {
      ring: 'rgba(116,191,255,0.4)',
      glow: 'rgba(116,191,255,0.25)',
      text: '#74bfff',
      rgb: '116,191,255'
    },
    green: {
      ring: 'rgba(2,255,187,0.4)',
      glow: 'rgba(2,255,187,0.25)',
      text: '#02ffbb',
      rgb: '2,255,187'
    }
  };

  const STEPS = [
    { id: 0, en: 'WISH', he: 'משאלה' },
    { id: 1, en: 'UNDERSTAND', he: 'הבנה' },
    { id: 2, en: 'PROPOSALS', he: 'הצעות' },
    { id: 3, en: 'CONSENT', he: 'הסכמה' }
  ];

  /* ===== Form state ===== */
  let title = $state('');
  let body = $state('');
  let values = $state([]);
  let location = $state(
    /** @type {import('$lib/components/location/LocationPicker.svelte').LocationValue} */ ({
      location_mode: 'unspecified',
      isOnline: false,
      lat: null,
      lng: null,
      radius: 15,
      location_hint: ''
    })
  );
  let locationModalOpen = $state(false);
  let editingJewel = $state(/** @type {number|null} */ (null));
  let publishing = $state(false);
  let publishError = $state('');

  /* Jewel-bound state (values surface on the squares) */
  let startDate = $state(''); // ISO yyyy-mm-dd (empty = none)
  let finnishDate = $state(''); // ISO yyyy-mm-dd
  let budgetAmount = $state(/** @type {number|null} */ (null));
  let whoCanOffer = $state(true); // → allowJoin
  let whoCanSee = $state('personal'); // → access_mode
  let invitePartners = $state('lev'); // UI-only for now (no Ratson field)
  let joinKind = $state('solo'); // → Ratson.joinKind (solo = today's behaviour)
  let minJoiners = $state(/** @type {number|null} */ (2));
  let maxJoiners = $state(/** @type {number|null} */ (null));
  let joinDeadline = $state(''); // ISO yyyy-mm-dd
  const isGroupKind = $derived(joinKind !== 'solo');

  /* Display formatters */
  const HE_MONTHS_FULL = [
    'בינואר',
    'בפברואר',
    'במרץ',
    'באפריל',
    'במאי',
    'ביוני',
    'ביולי',
    'באוגוסט',
    'בספטמבר',
    'באוקטובר',
    'בנובמבר',
    'בדצמבר'
  ];
  function fmtDayMon(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getDate()} ${HE_MONTHS_FULL[d.getMonth()]}`;
  }
  const whenJewelValue = $derived.by(() => {
    if (!startDate && !finnishDate) return '';
    if (startDate && finnishDate && startDate !== finnishDate)
      return `${fmtDayMon(startDate)} → ${fmtDayMon(finnishDate)}`;
    return fmtDayMon(startDate || finnishDate);
  });
  const budgetJewelValue = $derived(
    typeof budgetAmount === 'number' &&
      Number.isFinite(budgetAmount) &&
      budgetAmount > 0
      ? `₪ ${budgetAmount.toLocaleString('he-IL')}`
      : ''
  );
  const whoCanOfferJewelValue = $derived(
    WHO_CAN_OFFER_OPTIONS.find((o) => o.value === whoCanOffer)?.label || ''
  );
  const whoCanSeeJewelValue = $derived(
    WHO_CAN_SEE_OPTIONS.find((o) => o.value === whoCanSee)?.label || ''
  );
  const invitePartnersJewelValue = $derived(
    INVITE_PARTNERS_OPTIONS.find((o) => o.value === invitePartners)?.label || ''
  );
  const joinKindJewelValue = $derived(
    JOIN_KIND_OPTIONS.find((o) => o.value === joinKind)?.label || ''
  );

  const bodyText = $derived.by(() =>
    body
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  const words = $derived(bodyText ? bodyText.split(' ').length : 0);
  const fullness = $derived(Math.min(1, words / 50));
  const isReady = $derived(
    title.trim().length > 6 && bodyText.length > 30 && !publishing
  );

  /* Wizard progress reflected in the top step rail:
     0 WISH (writing) → 1 UNDERSTAND (Lev extracted a spec) →
     2 PROPOSALS (real matches/people found). 3 CONSENT lives on /concierge/[id]. */
  const hasExtraction = $derived(
    extractedMissions.length +
      extractedResources.length +
      extractedSkills.length >
      0
  );
  const hasMatches = $derived(
    matchedPeople.length + matchedMissions.length + matchedResources.length > 0
  );
  const activeStep = $derived(hasMatches ? 2 : hasExtraction ? 1 : 0);

  const LOCATION_JEWEL_INDEX = 1;
  const hasLocationPoint = $derived(
    typeof location.lat === 'number' &&
      Number.isFinite(location.lat) &&
      typeof location.lng === 'number' &&
      Number.isFinite(location.lng)
  );
  const hasLocationValue = $derived(
    location.location_mode !== 'unspecified' ||
      hasLocationPoint ||
      Boolean(location.location_hint?.trim())
  );
  const locationJewelValue = $derived.by(() => {
    if (location.location_mode === 'online') return 'אונליין';
    if (hasLocationPoint) {
      const hint = location.location_hint?.trim() || 'מיקום נבחר';
      return `${hint} · ${location.radius || 15} ק״מ`;
    }
    return location.location_hint?.trim() || '';
  });

  function saveDraftAndRegister() {
    // V1: stash the composed wish so it survives the jump to registration.
    // (V2 replaces this with a server-side Strapi draft + draft_token claimed
    //  at signup, so it also survives cross-device email confirmation.)
    try {
      const draft = {
        title,
        body,
        values,
        startDate,
        finnishDate,
        budgetAmount,
        whoCanOffer,
        whoCanSee,
        invitePartners,
        joinKind,
        minJoiners,
        maxJoiners,
        joinDeadline,
        location,
        extractedMissions,
        extractedResources,
        extractedSkills,
        extractedCategories,
        savedAt: Date.now()
      };
      sessionStorage.setItem('wishDraft', JSON.stringify(draft));
    } catch (err) {
      console.warn('[WishForm] could not stash draft:', err);
    }
    goto(`${registerPath()}?from=${encodeURIComponent('/concierge/new')}&intent=wish`);
  }

  async function publish() {
    if (!isReady) return;
    if (anon) {
      saveDraftAndRegister();
      return;
    }
    publishing = true;
    publishError = '';
    try {
      const hasBudget =
        typeof budgetAmount === 'number' &&
        Number.isFinite(budgetAmount) &&
        budgetAmount > 0;

      // Persist the AI extraction so the review stage (/concierge/[id]) starts
      // from a structured spec instead of re-deriving it.
      const extractedMissionsParam = extractedMissions.map((m) => ({
        name: m.name,
        importance: m.imp === 'must' ? 'must' : 'nice'
      }));
      const extractedResourcesParam = extractedResources.map((r) => ({
        name: r.name,
        importance: r.imp === 'must' ? 'must' : 'nice'
      }));
      const aiMeta = {
        ...(invitePartners !== 'lev' ? { invitePartners } : {}),
        skills: extractedSkills.map((s) => s.name),
        categories: extractedCategories,
        suggestedPeople: matchedPeople.map((p) => p.id),
        matchedMissions: matchedMissions.map((m) => m.id),
        // Full, renderable match snapshot — /concierge/[id] reads this straight
        // from Strapi instead of re-running the analysis on every page load.
        enrichment: matchedEnrichment
          ? {
              skills: matchedEnrichment.skills ?? [],
              missions: matchedEnrichment.missions ?? [],
              people: matchedEnrichment.people ?? [],
              resources: matchedEnrichment.resources ?? [],
              products: matchedEnrichment.products ?? [],
              computedAt: new Date().toISOString()
            }
          : null
      };

      const createRes = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'createRatson',
          params: {
            name: title.trim(),
            desc: title.trim(),
            longDes: body.trim(),
            status_ratson: 'open',
            access_mode: whoCanSee,
            allowJoin: whoCanOffer,
            bounti: hasBudget,
            totalbounti: hasBudget ? budgetAmount : 0,
            startDate: startDate ? new Date(startDate).toISOString() : null,
            finnishDate: finnishDate
              ? new Date(finnishDate).toISOString()
              : null,
            isOnline: location.location_mode === 'online',
            lat: location.lat,
            lng: location.lng,
            radius: location.radius,
            location_hint: location.location_hint,
            joinKind,
            minJoiners:
              isGroupKind && typeof minJoiners === 'number' ? minJoiners : null,
            maxJoiners:
              isGroupKind && typeof maxJoiners === 'number' ? maxJoiners : null,
            joinDeadline:
              isGroupKind && joinDeadline
                ? new Date(joinDeadline).toISOString()
                : null,
            extracted_missions: extractedMissionsParam,
            extracted_resources: extractedResourcesParam,
            ai_meta: aiMeta
          }
        })
      });
      const created = await createRes.json();
      if (!created?.success || !created?.data?.ratsonId) {
        throw new Error(
          created?.error?.message || created?.error || 'Failed to create wish'
        );
      }
      const ratsonId = created.data.ratsonId;

      // Fire matching but don't block navigation — the detail page will
      // refresh on its own and pick up the new proposals.
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'matchRatson',
          params: { ratsonId, mode: 'keyword' }
        })
      }).catch((err) =>
        console.warn('[concierge/new] matchRatson dispatch failed:', err)
      );

      goto(`/concierge/${ratsonId}`);
    } catch (err) {
      console.error('[concierge/new] publish failed:', err);
      publishError =
        err instanceof Error ? err.message : 'אירעה שגיאה ביצירת המשאלה';
    } finally {
      publishing = false;
    }
  }

  function toggleValue(v) {
    values = values.includes(v)
      ? values.filter((x) => x !== v)
      : [...values, v];
  }

  function pickSeed(seed) {
    title = seed.label;
  }

  function openLocationModal() {
    locationModalOpen = true;
  }

  function closeLocationModal() {
    locationModalOpen = false;
  }

  function closeJewelModal() {
    editingJewel = null;
  }

  function handleWindowKeydown(event) {
    if (event.key === 'Escape') {
      if (locationModalOpen) closeLocationModal();
      if (editingJewel !== null) closeJewelModal();
    }
  }

  function handleLocationBackdropClick(event) {
    if (event.currentTarget === event.target) closeLocationModal();
  }

  function handleJewelBackdropClick(event) {
    if (event.currentTarget === event.target) closeJewelModal();
  }

  function handleDetailJewelClick(index) {
    if (index === LOCATION_JEWEL_INDEX) {
      openLocationModal();
    } else {
      editingJewel = index;
    }
  }

  function detailJewelHasValue(jewel, index) {
    if (index === LOCATION_JEWEL_INDEX) return hasLocationValue;
    if (index === 0) return Boolean(whenJewelValue);
    if (index === 2) return Boolean(budgetJewelValue);
    if (index === 3) return whoCanOffer !== true; // 'pתוח לכל' is default → only highlight when changed
    if (index === 4) return whoCanSee !== 'personal';
    if (index === 5) return invitePartners !== 'lev';
    if (index === 6) return joinKind !== 'solo';
    return false;
  }

  function detailJewelValue(jewel, index) {
    if (index === LOCATION_JEWEL_INDEX)
      return locationJewelValue || jewel.placeholder;
    if (index === 0) return whenJewelValue || jewel.placeholder;
    if (index === 2) return budgetJewelValue || jewel.placeholder;
    if (index === 3) return whoCanOfferJewelValue || jewel.placeholder;
    if (index === 4) return whoCanSeeJewelValue || jewel.placeholder;
    if (index === 5) return invitePartnersJewelValue || jewel.placeholder;
    if (index === 6) return joinKindJewelValue || jewel.placeholder;
    return jewel.placeholder;
  }

  /* Quick budget presets */
  const BUDGET_PRESETS = [100, 250, 500, 1000, 2500];
  function pickBudgetPreset(v) {
    budgetAmount = v;
  }
  function clearBudget() {
    budgetAmount = null;
  }

  /* Quick date presets */
  function setDatePreset(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const iso = d.toISOString().slice(0, 10);
    if (!startDate || startDate === finnishDate) {
      startDate = iso;
      finnishDate = iso;
    } else {
      finnishDate = iso;
    }
  }
  function clearDates() {
    startDate = '';
    finnishDate = '';
  }

  function accentStyle(acc, hasVal) {
    const a = ACCENT[acc] || ACCENT.gold;
    return hasVal
      ? `border-color:${a.ring};box-shadow:0 0 18px ${a.glow}`
      : 'border-color:rgba(255,255,255,0.06)';
  }
  function accentText(acc, hasVal) {
    return hasVal ? (ACCENT[acc] || ACCENT.gold).text : '#52493e';
  }
  function accentBg(acc, hasVal) {
    if (!hasVal) return 'rgba(255,255,255,0.03)';
    const r = (ACCENT[acc] || ACCENT.gold).rgb;
    return `rgba(${r},0.1)`;
  }

  function gemCls(imp) {
    return imp === 'must' ? 'gem' : 'gem gem-gold';
  }

  function registerPath() {
    return $locale === 'he'
      ? '/hascama'
      : $locale === 'ar'
        ? '/aitifaqia'
        : '/convention';
  }
  function gotoRegister(dest) {
    goto(`${registerPath()}?from=${encodeURIComponent(dest || '/concierge/new')}`);
  }

  // Guests can't reach the app's inner pages. Instead of bouncing them home,
  // intercept the header links and show a "register to reach X" notice.
  let navNotice = $state('');
  let navNoticeDest = $state('/concierge');
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let navNoticeTimer;

  function navGuard(event, dest, label) {
    if (!anon) return; // logged in → let the link/button navigate normally
    event.preventDefault();
    navNotice = `יש להירשם כדי להגיע אל «${label}»`;
    navNoticeDest = dest;
    clearTimeout(navNoticeTimer);
    navNoticeTimer = setTimeout(() => (navNotice = ''), 6000);
  }
  function dismissNavNotice() {
    clearTimeout(navNoticeTimer);
    navNotice = '';
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<!-- ===================================================================
     NEW WISH — form page (mock, design-only)
     =================================================================== -->
<div class="cp" dir="rtl">
  <!-- ── HEADER ─────────────────────────────────────────────────────── -->
  <header class="hdr">
    <div class="hdr-logo">
      <img src="/logo-concierge.png" class="hdr-coin" alt="1lev1" />
      <div class="hdr-brand">
        <span class="hdr-dot"></span>
        <span class="hdr-name">Concierge</span>
        <span class="hdr-sub hide-xs">· קונסיירז׳</span>
      </div>
    </div>
    <nav class="hdr-nav hide-sm">
      <a
        href="/lev"
        class="nav-lnk"
        onclick={(e) => navGuard(e, '/lev', 'הסקירה שלי')}>הסקירה שלי</a
      >
      <a
        href="/concierge"
        class="nav-lnk nav-act"
        onclick={(e) => navGuard(e, '/concierge', 'משאלות')}>משאלות</a
      >
      <a
        href="/deals"
        class="nav-lnk"
        onclick={(e) => navGuard(e, '/deals', 'דילים')}>דילים</a
      >
      <a
        href="/moach"
        class="nav-lnk"
        onclick={(e) => navGuard(e, '/moach', 'ריקמות')}>ריקמות</a
      >
    </nav>
    <div class="hdr-right">
      <button class="notif-btn" aria-label="התראות"
        >🔔<span class="notif-pip"></span></button
      >
      <button
        class="av-btn"
        onclick={(e) => (anon ? navGuard(e, '/me', 'הפרופיל שלי') : goto('/me'))}
      >
        {#if $uPic}
          <img src={$uPic} alt="פרופיל" class="av-img" />
        {:else}
          {getUserInitials(data.un)}
        {/if}
      </button>
    </div>
  </header>

  {#if navNotice}
    <div class="nav-notice" role="status" transition:fade={{ duration: 140 }}>
      <span class="nav-notice-txt">{navNotice}</span>
      <button class="nav-notice-reg" onclick={() => gotoRegister(navNoticeDest)}
        >הרשמה</button
      >
      <button class="nav-notice-x" aria-label="סגירה" onclick={dismissNavNotice}
        >×</button
      >
    </div>
  {/if}

  <!-- ── SHELL ──────────────────────────────────────────────────────── -->
  <div class="shell">
    <div class="wrap">
      <!-- TOP BAR: steps + back link -->
      <div class="topbar anim">
        <div class="steps">
          {#each STEPS as step, i (step.id)}
            {@const st =
              i === activeStep ? 'active' : i < activeStep ? 'done' : ''}
            <div class="step {st}">
              <span class="step-dot">{step.id + 1}</span>
              <span class="step-en hide-xs">{step.en}</span>
              <span class="step-he hide-xs">· {step.he}</span>
            </div>
            {#if i < STEPS.length - 1}<span class="step-sep"></span>{/if}
          {/each}
        </div>
        <a href="/concierge" class="btn-ghost btn-xs"
          >⟵ חזרה לרשימת המשאלות שלי</a
        >
      </div>

      <!-- OPENING INCANTATION -->
      <div class="anim anim-d1" style="text-align:center;padding:24px 0 6px">
        <div class="incant-rule">◈ ───── משאלה חדשה ───── ◈</div>
        <h1 class="incant-h1">מה תרצו שיקרה?</h1>
        <p class="incant-p">
          ספרו בלשונכם. אנחנו נמצא את האנשים, נציע איך לחבר, ותוכלו לאשר.<br />
          <span style="color:#fde68a">שום דבר לא יוצא החוצה עד שתפרסמו.</span>
        </p>
      </div>

      <!-- INSPIRATION SEEDS -->
      <div class="seeds anim anim-d2">
        {#each SEEDS as seed (seed.label)}
          <button class="seed-card" onclick={() => pickSeed(seed)}>
            <span class="seed-icon">{seed.icon}</span>
            <div style="min-width:0;text-align:start">
              <div class="seed-label">{seed.label}</div>
              <div class="seed-hint">{seed.hint}</div>
            </div>
          </button>
        {/each}
      </div>

      <!-- TWO-COLUMN COMPOSE LAYOUT -->
      <div class="compose-layout">
        <!-- ── LEFT: writing area ── -->
        <div>
          <!-- WISH SCROLL (writing surface) -->
          <div class="scroll-frame anim anim-d3">
            <span class="corner corner-tl"></span>
            <span class="corner corner-tr"></span>
            <span class="corner corner-bl"></span>
            <span class="corner corner-br"></span>

            <div
              style="display:flex;align-items:center;gap:12px;margin-bottom:14px"
            >
              <span
                style="width:8px;height:8px;border-radius:50%;background:#ff4d9e;box-shadow:0 0 12px #ff4d9e"
              ></span>
              <span
                style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#fde68a"
              >
                משאלה חדשה · טיוטה
              </span>
              <span style="flex:1"></span>
              <span
                style="font-family:'Bellefair',serif;font-size:12px;color:#52493e"
                >נשמר אוטומטית · עכשיו</span
              >
            </div>

            <!-- Title -->
            <input
              bind:value={title}
              placeholder={$t('concierge.new.titlePlaceholder')}
              class="wish-title-inp"
              maxlength="120"
            />

            <!-- Body -->
            <div class="rich-body-wrap">
              <RichText bind:outpot={body} trans={true} sml={true} />
            </div>

            <!-- Toolbar -->
            <div class="scroll-toolbar">
              <div style="display:flex;gap:6px">
                <button class="tool-btn" title="מיקרופון">🎙</button>
                <button class="tool-btn" title="צרפו תמונה">📎</button>
                <button class="tool-btn" title="הצעת ניסוח של Lev">✨</button>
                <button class="tool-btn" title="שפה">⇄</button>
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <span
                  style="font-family:'Bellefair',serif;font-size:12px;color:#7a6f5e"
                  >{words} מילים</span
                >
                <div class="word-gauge">
                  <div class="word-fill" style="width:{fullness * 100}%"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- /scroll-frame -->

          <!-- PRACTICAL DETAILS -->
          <div class="subsection">פרטים מעשיים</div>
          <div class="jewels-grid">
            {#each DETAIL_JEWELS as j, i (j.label)}
              {@const has = detailJewelHasValue(j, i)}
              <button
                class:location-trigger={i === LOCATION_JEWEL_INDEX}
                class="detail-jewel"
                style={accentStyle(j.accent, has)}
                aria-haspopup={i === LOCATION_JEWEL_INDEX
                  ? 'dialog'
                  : undefined}
                aria-expanded={i === LOCATION_JEWEL_INDEX
                  ? locationModalOpen
                  : undefined}
                onclick={() => handleDetailJewelClick(i)}
              >
                <span
                  class="jewel-icon"
                  style="background:{accentBg(j.accent, has)}">{j.icon}</span
                >
                <div style="flex:1;min-width:0;text-align:start">
                  <div class="jewel-label">{j.label}</div>
                  <div
                    class="jewel-val"
                    style="color:{accentText(j.accent, has)}"
                  >
                    {detailJewelValue(j, i)}
                  </div>
                </div>
                <span style="font-size:12px;color:#52493e">›</span>
              </button>
            {/each}
          </div>

          <!-- VALUES -->
          <div class="subsection">ערכים שחשובים לי</div>
          <div class="values-grid anim anim-d4">
            {#each ALL_VALUES as v (v)}
              {@const on = values.includes(v)}
              <button
                class="val-pill {on ? 'on' : ''}"
                onclick={() => toggleValue(v)}>{v}</button
              >
            {/each}
          </div>

          <!-- PUBLISH BAR -->
          <div class="publish-bar">
            <div style="display:flex;align-items:center;gap:14px;min-width:0">
              <span class="pub-dot {isReady ? 'ready' : ''}"
                >{isReady ? '✓' : '◯'}</span
              >
              <div style="min-width:0">
                <div class="pub-status">
                  {isReady
                    ? $t('concierge.new.readyStatus')
                    : $t('concierge.new.notReadyStatus')}
                </div>
                <div class="pub-hint">
                  {isReady
                    ? $t('concierge.new.readyHint')
                    : $t('concierge.new.notReadyHint')}
                </div>
              </div>
            </div>
            <div
              style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"
            >
              <button class="btn-ghost">{$t('concierge.new.saveDraft')}</button>
              <button
                class="btn-jewel pub-btn"
                disabled={!isReady}
                onclick={publish}
                style="opacity:{isReady ? 1 : 0.5};background:{isReady
                  ? 'linear-gradient(135deg,#bf953f,#fcf6ba 30%,#b38728 60%,#aa771c)'
                  : 'linear-gradient(135deg,#c8155f,#ff4d9e)'};color:{isReady
                  ? '#574010'
                  : '#fde68a'};text-shadow:{isReady
                  ? '1px 1px 0 rgba(255,255,255,0.5)'
                  : 'none'}"
                >{anon
                  ? 'הירשמו כדי לפרסם ←'
                  : publishing
                    ? $t('concierge.new.publishing')
                    : hasMatches
                      ? 'פרסום ומעבר להצעות ←'
                      : $t('concierge.new.publish')}</button
              >
            </div>
          </div>

          <div
            style="margin-top:14px;text-align:center;font-family:'Bellefair',serif;font-size:12px;color:#52493e"
          >
            {$t('concierge.new.afterPublish')}
          </div>
          {#if publishError}
            <div
              style="margin-top:10px;padding:10px 14px;background:rgba(255,77,158,.06);border:1px solid rgba(255,77,158,.3);border-radius:12px;font-family:'Bellefair',serif;font-size:13px;color:#ff4d9e;text-align:center"
            >
              {publishError}
            </div>
          {/if}
        </div>
        <!-- /left col -->

        <!-- ── RIGHT: Lev assist panel ── -->
        <div class="lev-rail anim anim-d3">
          <div
            style="display:flex;align-items:center;gap:10px;margin-bottom:16px"
          >
            <div style="position:relative">
              <img
                src="/botlogo.png"
                style="width:36px;height:36px;border-radius:50%;border:2px solid rgba(116,191,255,.4)"
                alt="Lev"
              />
              <span
                style="position:absolute;bottom:-2px;inset-inline-end:-2px;width:12px;height:12px;border-radius:50%;background:#02ffbb;border:2px solid #0e0d0c;box-shadow:0 0 10px #02ffbb"
              ></span>
            </div>
            <div>
              <div
                style="font-family:'Cinzel',serif;font-size:13px;color:#74bfff;letter-spacing:.18em"
              >
                LEV
              </div>
              <div
                style="font-family:'Bellefair',serif;font-size:11px;color:#7a6f5e"
              >
                מקשיב/ת ומסמנ/ת בעדינות
              </div>
            </div>
          </div>

          {#if anon && hasMatches}
            <button class="anon-cta" onclick={saveDraftAndRegister}>
              ✨ נמצאו {matchedPeople.length +
                matchedResources.length +
                matchedMissions.length} התאמות אפשריות · הירשמו כדי לראות מי
            </button>
          {/if}

          <!-- Live extraction preview -->
          <div class="section-label" style="margin:6px 0 8px">
            <span class="lead" style="display:flex;align-items:center;gap:8px">
              <span class="gem" style="width:6px;height:6px"></span>
              {#if extracting}
                מנתח/ת…
              {:else if extractedMissions.length + extractedResources.length > 0}
                מה אני מזהה עד עכשיו · {extractedMissions.length +
                  extractedResources.length}
              {:else}
                ניתוח בזמן אמת
              {/if}
            </span>
          </div>

          {#if extracting}
            <div
              style="padding:14px 12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.08);font-family:'Bellefair',serif;font-size:12.5px;color:#52493e;line-height:1.55;text-align:center"
            >
              <span style="opacity:.6">מקשיב/ת…</span>
            </div>
          {:else if extractedMissions.length > 0 || extractedResources.length > 0}
            <div style="display:flex;flex-direction:column;gap:10px">
              {#if extractedMissions.length > 0}
                <div>
                  <div class="lev-col-lbl">✦ משימות</div>
                  <div style="display:flex;flex-wrap:wrap;gap:5px">
                    {#each extractedMissions as m (m.name)}
                      <span
                        class="chip {m.imp}"
                        style="font-size:11.5px;padding:3px 9px"
                      >
                        <span class={gemCls(m.imp)} style="width:5px;height:5px"
                        ></span>{m.name}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
              {#if extractedResources.length > 0}
                <div>
                  <div class="lev-col-lbl">◐ משאבים</div>
                  <div style="display:flex;flex-wrap:wrap;gap:5px">
                    {#each extractedResources as r (r.name)}
                      <span
                        class="chip {r.imp}"
                        style="font-size:11.5px;padding:3px 9px"
                      >
                        <span class={gemCls(r.imp)} style="width:5px;height:5px"
                        ></span>{r.name}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else if bodyText.length > 0}
            <!-- body has text but no results yet — show nothing, wait for debounce -->
          {:else}
            <div
              style="padding:14px 12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.08);font-family:'Bellefair',serif;font-size:12.5px;color:#52493e;line-height:1.55;text-align:center"
            >
              התחילו לכתוב ואזהה<br />משימות ומשאבים אוטומטית
            </div>
          {/if}

          <!-- Skills the wish implies -->
          {#if extractedSkills.length > 0}
            <div style="margin-top:14px">
              <div class="lev-col-lbl">✶ כישורים שצריך</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px">
                {#each extractedSkills as s (s.name)}
                  <span class="chip" style="font-size:11.5px;padding:3px 9px"
                    >{s.name}</span
                  >
                {/each}
              </div>
            </div>
          {/if}

          <!-- Existing missions in the library that match -->
          {#if matchedMissions.length > 0}
            <div
              style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.05)"
            >
              <div class="lev-col-lbl" style="margin-bottom:8px">
                ◆ כבר קיים במערכת
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                {#each matchedMissions as m (m.id)}
                  <div
                    style="padding:8px 10px;border-radius:9px;background:rgba(2,255,187,.04);border:1px solid rgba(2,255,187,.16);font-family:'Bellefair',serif;font-size:12.5px;color:#ede5d8"
                  >
                    {m.name}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Available resources (free Sp instances) that match -->
          {#if matchedResources.length > 0}
            <div
              style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.05)"
            >
              <div class="lev-col-lbl" style="margin-bottom:8px">
                ◐ משאבים פנויים · {matchedResources.length}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                {#each matchedResources as r (r.id)}
                  <div
                    style="padding:8px 10px;border-radius:9px;background:rgba(238,232,170,.04);border:1px solid rgba(238,232,170,.16)"
                  >
                    <div
                      style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"
                    >
                      <span
                        style="font-family:'Bellefair',serif;font-size:12.5px;color:#ede5d8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                        >{r.name}</span
                      >
                      {#if typeof r.price === 'number' && r.price > 0}
                        <span
                          style="font-size:11px;color:#fde68a;white-space:nowrap"
                          >₪ {r.price.toLocaleString('he-IL')}</span
                        >
                      {/if}
                    </div>
                    {#if r.ownerName || r.project}
                      <div
                        style="font-size:10.5px;color:#9a8f80;margin-top:2px"
                      >
                        {anon
                          ? r.ownerName
                            ? '••••••'
                            : ''
                          : r.ownerName || ''}{r.ownerName && r.project
                          ? ' · '
                          : ''}{r.project || ''}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Real people who hold the needed skills -->
          {#if matchedPeople.length > 0}
            <div
              style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.05)"
            >
              <div class="lev-col-lbl" style="margin-bottom:8px">
                ♥ אנשים שיכולים לעזור · {matchedPeople.length}
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                {#each matchedPeople as p (p.id)}
                  <div
                    style="display:flex;gap:9px;align-items:center;padding:8px 10px;border-radius:10px;background:rgba(116,191,255,.04);border:1px solid rgba(116,191,255,.16)"
                  >
                    {#if anon}
                      <span
                        style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(116,191,255,.12);color:#74bfff;font-size:12px;flex-shrink:0"
                        aria-label="זהות מוסתרת">🔒</span
                      >
                    {:else if p.avatar}
                      <img
                        src={p.avatar}
                        alt={p.username}
                        style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1px solid rgba(116,191,255,.4);flex-shrink:0"
                      />
                    {:else}
                      <span
                        style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(116,191,255,.12);color:#74bfff;font-size:12px;flex-shrink:0"
                        >{(p.username || '?').slice(0, 2)}</span
                      >
                    {/if}
                    <div style="min-width:0;flex:1">
                      <div
                        style="font-family:'Bellefair',serif;font-size:13px;color:#ede5d8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                      >
                        {anon ? '••••••••' : p.username}
                      </div>
                      {#if p.matchedSkills.length > 0}
                        <div
                          style="font-size:10.5px;color:#74bfff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                        >
                          {p.matchedSkills.join(' · ')}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Lev hints (only shown when AI returned results) -->
          {#if extractedHints.length > 0}
            <div
              style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.05)"
            >
              <div class="lev-col-lbl" style="margin-bottom:10px">
                הצעות עדינות
              </div>
              <div style="display:flex;flex-direction:column;gap:10px">
                {#each extractedHints as hint (hint.text)}
                  <div
                    style="padding:10px 12px;border-radius:10px;background:{hint.kind ===
                    'question'
                      ? 'rgba(238,232,170,.05)'
                      : 'rgba(116,191,255,.04)'};border:1px solid {hint.kind ===
                    'question'
                      ? 'rgba(238,232,170,.15)'
                      : 'rgba(116,191,255,.15)'};display:flex;gap:8px"
                  >
                    <span
                      style="font-size:11px;color:{hint.kind === 'question'
                        ? '#fde68a'
                        : '#74bfff'};margin-top:1px"
                      >{hint.kind === 'question' ? '?' : '✶'}</span
                    >
                    <div
                      style="font-family:'Bellefair',serif;font-size:12.5px;color:#ede5d8;line-height:1.5"
                    >
                      {hint.text}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Privacy hint -->
          <div
            style="margin-top:16px;padding:10px 12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:10px;display:flex;gap:10px;align-items:flex-start"
          >
            <span style="font-size:13px">🔒</span>
            <div
              style="font-family:'Bellefair',serif;font-size:11.5px;color:#9a8f80;line-height:1.55"
            >
              כל מה שאני קורא/ת נשאר בינינו עד שתאשרו. שום שותפ/ה לא רואה כלום
              עד שתפרסמו.
            </div>
          </div>
        </div>
        <!-- /lev-rail -->
      </div>
      <!-- /compose-layout -->
    </div>
    <!-- /wrap -->
  </div>
  <!-- /shell -->

  {#if locationModalOpen}
    <div
      class="location-modal-backdrop"
      role="presentation"
      onclick={handleLocationBackdropClick}
      transition:fade={{ duration: 140 }}
    >
      <div
        class="location-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
      >
        <div class="location-modal-head">
          <div>
            <div class="modal-eyebrow">Location</div>
            <h2 id="location-modal-title">איפה זה קורה?</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label="סגירת בחירת מיקום"
            onclick={closeLocationModal}>×</button
          >
        </div>

        <LocationPicker
          bind:value={location}
          label="מיקום המשאלה"
          helper="בחרו אם זה אונליין, פיזי או היברידי. הנקודה והרדיוס יעזרו ל-Lev להציע ספקים קרובים."
          height="420px"
        />

        <div class="location-modal-actions">
          <button class="btn-ghost" type="button" onclick={closeLocationModal}
            >סגירה</button
          >
          <button
            class="btn-jewel modal-save"
            type="button"
            onclick={closeLocationModal}>שמירת מיקום</button
          >
        </div>
      </div>
    </div>
  {/if}

  {#if editingJewel !== null}
    <div
      class="location-modal-backdrop"
      role="presentation"
      onclick={handleJewelBackdropClick}
      transition:fade={{ duration: 140 }}
    >
      <div
        class="location-modal jewel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jewel-modal-title"
      >
        <div class="location-modal-head">
          <div>
            <div class="modal-eyebrow">
              {DETAIL_JEWELS[editingJewel].icon} · {DETAIL_JEWELS[editingJewel]
                .label}
            </div>
            <h2 id="jewel-modal-title">
              {editingJewel === 0
                ? 'מתי זה יקרה?'
                : editingJewel === 2
                  ? 'כמה ברצונך לתת?'
                  : editingJewel === 3
                    ? 'מי יכול/ה להציע?'
                    : editingJewel === 4
                      ? 'מי יכול/ה לראות?'
                      : editingJewel === 5
                        ? 'איך להזמין שותפים?'
                        : 'יוזמה אישית או קבוצתית?'}
            </h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label="סגירה"
            onclick={closeJewelModal}>×</button
          >
        </div>

        <div class="jewel-modal-body">
          {#if editingJewel === 0}
            <!-- When -->
            <div class="field-grid">
              <label class="field">
                <span class="field-lbl">מתי להתחיל</span>
                <input type="date" bind:value={startDate} class="field-inp" />
              </label>
              <label class="field">
                <span class="field-lbl">מתי לסיים</span>
                <input type="date" bind:value={finnishDate} class="field-inp" />
              </label>
            </div>
            <div class="presets">
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(0)}>היום</button
              >
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(1)}>מחר</button
              >
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(7)}>תוך שבוע</button
              >
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(30)}>תוך חודש</button
              >
              <button
                type="button"
                class="preset-pill ghost"
                onclick={clearDates}>לנקות</button
              >
            </div>
            <p class="modal-hint">
              לא חובה לבחור — אפשר להשאיר ריק ו-Lev תציע מועדים גמישים.
            </p>
          {:else if editingJewel === 2}
            <!-- Budget -->
            <label class="field">
              <span class="field-lbl">סכום מקסימלי (₪)</span>
              <input
                type="number"
                inputmode="numeric"
                min="0"
                step="50"
                bind:value={budgetAmount}
                placeholder="למשל 500"
                class="field-inp"
              />
            </label>
            <div class="presets">
              {#each BUDGET_PRESETS as v (v)}
                <button
                  type="button"
                  class="preset-pill"
                  onclick={() => pickBudgetPreset(v)}
                  >₪ {v.toLocaleString('he-IL')}</button
                >
              {/each}
              <button
                type="button"
                class="preset-pill ghost"
                onclick={clearBudget}>בלי תקרה</button
              >
            </div>
            <p class="modal-hint">
              סכום מירבי. הצעות יוצגו ממוין לפי איכות התאמה ולא רק לפי מחיר.
            </p>
          {:else if editingJewel === 3}
            <!-- Who can offer -->
            <div class="radio-list">
              {#each WHO_CAN_OFFER_OPTIONS as opt (opt.label)}
                <label
                  class="radio-row {whoCanOffer === opt.value ? 'on' : ''}"
                >
                  <input
                    type="radio"
                    name="whoCanOffer"
                    value={opt.value}
                    checked={whoCanOffer === opt.value}
                    onchange={() => (whoCanOffer = opt.value)}
                  />
                  <div>
                    <div class="radio-label">{opt.label}</div>
                    <div class="radio-hint">{opt.hint}</div>
                  </div>
                </label>
              {/each}
            </div>
          {:else if editingJewel === 4}
            <!-- Who can see (access_mode) -->
            <div class="radio-list">
              {#each WHO_CAN_SEE_OPTIONS as opt (opt.value)}
                <label class="radio-row {whoCanSee === opt.value ? 'on' : ''}">
                  <input
                    type="radio"
                    name="whoCanSee"
                    value={opt.value}
                    checked={whoCanSee === opt.value}
                    onchange={() => (whoCanSee = opt.value)}
                  />
                  <div>
                    <div class="radio-label">{opt.label}</div>
                    <div class="radio-hint">{opt.hint}</div>
                  </div>
                </label>
              {/each}
            </div>
          {:else if editingJewel === 5}
            <!-- Invite partners -->
            <div class="radio-list">
              {#each INVITE_PARTNERS_OPTIONS as opt (opt.value)}
                <label
                  class="radio-row {invitePartners === opt.value ? 'on' : ''}"
                >
                  <input
                    type="radio"
                    name="invitePartners"
                    value={opt.value}
                    checked={invitePartners === opt.value}
                    onchange={() => (invitePartners = opt.value)}
                  />
                  <div>
                    <div class="radio-label">{opt.label}</div>
                    <div class="radio-hint">{opt.hint}</div>
                  </div>
                </label>
              {/each}
            </div>
            <p class="modal-hint">
              בחירה זו עוזרת ל־Lev להבין כמה ביוזמה לקחת בעצמה ועד כמה לחכות לך.
            </p>
          {:else if editingJewel === 6}
            <!-- Shared-purchase initiative kind -->
            <div class="radio-list d">
              {#each JOIN_KIND_OPTIONS as opt (opt.value)}
                <label class="radio-row {joinKind === opt.value ? 'on' : ''}">
                  <input
                    type="radio"
                    name="joinKind"
                    value={opt.value}
                    checked={joinKind === opt.value}
                    onchange={() => (joinKind = opt.value)}
                  />
                  <div>
                    <div class="radio-label">{opt.label}</div>
                    <div class="radio-hint">{opt.hint}</div>
                  </div>
                </label>
              {/each}
            </div>

            {#if isGroupKind}
              <div class="field-grid" style="margin-top:14px">
                <label class="field">
                  <span class="field-lbl">מינימום משתתפים</span>
                  <input
                    type="number"
                    inputmode="numeric"
                    min="1"
                    step="1"
                    bind:value={minJoiners}
                    placeholder="למשל 2"
                    class="field-inp"
                  />
                </label>
                <label class="field">
                  <span class="field-lbl">מקסימום (לא חובה)</span>
                  <input
                    type="number"
                    inputmode="numeric"
                    min="1"
                    step="1"
                    bind:value={maxJoiners}
                    placeholder="ללא תקרה"
                    class="field-inp"
                  />
                </label>
              </div>
              <label class="field" style="margin-top:10px">
                <span class="field-lbl">תאריך סגירה להצטרפות (לא חובה)</span>
                <input
                  type="date"
                  bind:value={joinDeadline}
                  class="field-inp"
                />
              </label>
              <p class="modal-hint">
                כש־{minJoiners || 1} משתתפים יצטרפו אפשר יהיה לנעול את הקבוצה, לקבל
                החלטות יחד ולשלם יחד. עד אז המשאלה במצב גיוס.
              </p>
            {:else}
              <p class="modal-hint">
                ברירת המחדל — את/ה מארגנ/ת והקהילה מציעה. בחירת סוג קבוצתי פותחת
                הצטרפות, החלטות משותפות ותשלום משותף.
              </p>
            {/if}
          {/if}
        </div>

        <div class="location-modal-actions">
          <button class="btn-ghost" type="button" onclick={closeJewelModal}
            >סגירה</button
          >
          <button
            class="btn-jewel modal-save"
            type="button"
            onclick={closeJewelModal}>שמירה</button
          >
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- /cp -->

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bellefair&family=Cinzel:wght@400;600;700&family=Heebo:wght@300;400;500;600;700;800&display=swap');

  /* ── Page ── */
  .cp {
    background: #070606;
    color: #ede5d8;
    font-family: 'Heebo', 'Rubik', system-ui, sans-serif;
    min-height: 100vh;
    position: relative;
  }
  .cp::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse 70% 50% at 10% -10%,
        rgba(200, 150, 12, 0.1) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 60% 65% at 90% 110%,
        rgba(200, 21, 95, 0.09) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 50% 40% at 50% 50%,
        rgba(2, 255, 187, 0.035) 0%,
        transparent 60%
      );
  }
  .shell {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding-bottom: 80px;
  }
  .wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 14px;
  }
  @media (min-width: 640px) {
    .wrap {
      padding: 0 22px;
    }
  }
  @media (min-width: 1024px) {
    .wrap {
      padding: 0 28px;
    }
  }

  /* ── Responsive ── */
  @media (max-width: 479px) {
    .hide-xs {
      display: none !important;
    }
  }
  @media (max-width: 767px) {
    .hide-sm {
      display: none !important;
    }
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .anim {
    animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .anim-d1 {
    animation-delay: 0.04s;
  }
  .anim-d2 {
    animation-delay: 0.1s;
  }
  .anim-d3 {
    animation-delay: 0.18s;
  }
  .anim-d4 {
    animation-delay: 0.26s;
  }

  /* ── Header (same as main screen) ── */
  .hdr {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(7, 6, 6, 0.84);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(200, 150, 12, 0.2);
    padding: 0 14px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  @media (min-width: 640px) {
    .hdr {
      padding: 0 24px;
      height: 64px;
    }
  }
  .hdr-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .hdr-coin {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    box-shadow: 0 0 14px rgba(238, 232, 170, 0.4);
  }
  .hdr-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hdr-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #02ffbb;
    box-shadow: 0 0 10px #02ffbb;
  }
  .hdr-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(13px, 3vw, 18px);
    color: #f0c040;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .hdr-sub {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: #9a8f80;
  }
  .hdr-nav {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  /* ── Guest "register to reach X" notice ── */
  .nav-notice {
    position: fixed;
    top: 70px;
    inset-inline: 0;
    margin-inline: auto;
    width: max-content;
    max-width: 92vw;
    z-index: 300;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px 10px 16px;
    border-radius: 14px;
    background: rgba(23, 21, 18, 0.96);
    border: 1px solid rgba(255, 77, 158, 0.4);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .nav-notice-txt {
    font-family: 'Bellefair', serif;
    font-size: 13.5px;
    color: #ede5d8;
  }
  .nav-notice-reg {
    padding: 6px 14px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-weight: 700;
    font-size: 13px;
    color: #fde68a;
    background: linear-gradient(135deg, #c8155f, #ff4d9e);
    white-space: nowrap;
  }
  .nav-notice-x {
    background: none;
    border: none;
    color: #9a8f80;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
  }
  .nav-lnk {
    font-size: 13px;
    color: #9a8f80;
    text-decoration: none;
    letter-spacing: 0.02em;
  }
  .nav-act {
    color: #fde68a;
    text-shadow: 0 0 12px rgba(238, 232, 170, 0.4);
  }
  .hdr-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .notif-btn {
    position: relative;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #171512;
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    font-size: 14px;
    color: #fde68a;
  }
  .notif-pip {
    position: absolute;
    top: 6px;
    left: 6px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ff4d9e;
    box-shadow: 0 0 8px #ff4d9e;
  }
  .av-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid #eee8aa;
    background: linear-gradient(135deg, #201d19, #2a2520);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #f0c040;
    cursor: pointer;
    overflow: hidden;
    padding: 0;
  }
  .av-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  /* ── Top bar ── */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 0 10px;
  }

  /* ── Steps ── */
  .steps {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #7a6f5e;
  }
  .step-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 10px;
    background: rgba(255, 255, 255, 0.04);
    color: #7a6f5e;
    border: 1px solid rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
  }
  .step.active .step-dot {
    background: linear-gradient(135deg, #c8155f, #ff4d9e);
    color: #fde68a;
    border-color: rgba(255, 77, 158, 0.5);
    box-shadow: 0 0 18px rgba(255, 77, 158, 0.5);
  }
  .step.active {
    color: #ff4d9e;
  }
  .step.done .step-dot {
    background: rgba(2, 255, 187, 0.14);
    color: #02ffbb;
    border-color: rgba(2, 255, 187, 0.4);
  }
  .step.done {
    color: #02ffbb;
  }
  .step-en {
    font-family: 'Cinzel', serif;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-size: 10px;
  }
  .step-he {
    font-family: 'Bellefair', serif;
    font-size: 12px;
  }
  .step-sep {
    width: 22px;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  /* ── Buttons ── */
  .btn-jewel {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border: none;
    cursor: pointer;
    border-radius: 14px;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: #fde68a;
    white-space: nowrap;
    background: linear-gradient(135deg, #c8155f, #ff4d9e);
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.25),
      inset -1px -1px 0 rgba(0, 0, 0, 0.4),
      0 6px 20px rgba(200, 21, 95, 0.4);
    transition: transform 0.2s;
  }
  .btn-jewel:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #9a8f80;
    padding: 9px 16px;
    border-radius: 12px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }
  .btn-ghost:hover {
    color: #ede5d8;
    border-color: rgba(238, 232, 170, 0.3);
    background: rgba(238, 232, 170, 0.04);
  }
  .btn-xs {
    padding: 7px 12px;
    font-size: 12px;
  }

  /* ── Gems ── */
  .gem {
    width: 8px;
    height: 8px;
    display: inline-block;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    transform: rotate(45deg);
    box-shadow: 0 0 12px rgba(255, 77, 158, 0.7);
    flex-shrink: 0;
  }
  .gem-gold {
    background: linear-gradient(135deg, #fde68a, #aa771c);
    box-shadow: 0 0 12px rgba(238, 232, 170, 0.7);
  }

  /* ── Section label ── */
  .section-label {
    font-size: 11px;
    font-weight: 700;
    color: #9a8f80;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .section-label::before,
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.08),
      transparent
    );
  }
  .section-label .lead {
    flex: 0 0 auto;
  }

  /* ── Chips ── */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 11px;
    border-radius: 999px;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #ede5d8;
  }
  .chip.must {
    background: rgba(255, 0, 146, 0.1);
    border-color: rgba(255, 0, 146, 0.35);
    color: #ff4d9e;
  }
  .chip.nice {
    background: rgba(238, 232, 170, 0.07);
    border-color: rgba(238, 232, 170, 0.25);
    color: #fde68a;
  }

  /* ── Opening incantation ── */
  .incant-rule {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.36em;
    text-transform: uppercase;
    color: #9a8f80;
    margin-bottom: 12px;
  }
  .incant-h1 {
    margin: 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(28px, 8vw, 44px);
    font-weight: 700;
    line-height: 1.1;
    color: #ede5d8;
  }
  .incant-p {
    margin: 14px auto 0;
    font-family: 'Bellefair', serif;
    font-size: clamp(14px, 2.5vw, 17px);
    color: #9a8f80;
    line-height: 1.6;
    max-width: 560px;
  }

  /* ── Inspiration seeds ── */
  .seeds {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
    margin-top: 20px;
  }
  @media (min-width: 640px) {
    .seeds {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }
  }
  .seed-card {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 11px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: start;
  }
  .seed-card:hover {
    border-color: rgba(238, 232, 170, 0.32);
    background: rgba(238, 232, 170, 0.04);
    transform: translateY(-1px);
  }
  .seed-icon {
    font-size: 17px;
    opacity: 0.95;
  }
  .seed-label {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: #ede5d8;
    line-height: 1.2;
  }
  .seed-hint {
    font-size: 10px;
    color: #52493e;
    margin-top: 2px;
  }

  /* ── Compose layout ── */
  .compose-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    align-items: start;
    margin-top: 16px;
  }
  @media (min-width: 1024px) {
    .compose-layout {
      grid-template-columns: 1fr 320px;
    }
  }

  /* ── Writing scroll ── */
  .scroll-frame {
    position: relative;
    padding: 24px 20px 20px;
    border-radius: 22px;
    background:
      linear-gradient(
        180deg,
        rgba(238, 232, 170, 0.04) 0%,
        rgba(7, 6, 6, 0) 30%
      ),
      linear-gradient(180deg, rgba(255, 77, 158, 0.025), rgba(7, 6, 6, 0)),
      #0e0d0c;
    border: 1px solid rgba(238, 232, 170, 0.2);
    box-shadow:
      0 0 0 1px rgba(238, 232, 170, 0.06) inset,
      0 30px 80px rgba(0, 0, 0, 0.4);
  }
  @media (min-width: 640px) {
    .scroll-frame {
      padding: 28px 32px 24px;
      border-radius: 24px;
    }
  }

  .corner {
    position: absolute;
    width: 14px;
    height: 14px;
    background: linear-gradient(135deg, #fde68a, #aa771c);
    transform: rotate(45deg);
    box-shadow: 0 0 14px rgba(238, 232, 170, 0.7);
    border-radius: 2px;
  }
  .corner-tl {
    top: -7px;
    inset-inline-start: 22px;
  }
  .corner-tr {
    top: -7px;
    inset-inline-end: 22px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    box-shadow: 0 0 14px rgba(255, 77, 158, 0.7);
  }
  .corner-bl {
    bottom: -7px;
    inset-inline-start: 22px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    box-shadow: 0 0 14px rgba(255, 77, 158, 0.7);
  }
  .corner-br {
    bottom: -7px;
    inset-inline-end: 22px;
  }

  .wish-title-inp {
    width: 100%;
    box-sizing: border-box;
    background: transparent;
    border: none;
    outline: none;
    padding: 6px 0 12px;
    border-bottom: 1px solid rgba(238, 232, 170, 0.18);
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(22px, 5vw, 32px);
    font-weight: 700;
    color: #ede5d8;
    line-height: 1.2;
    transition: border-color 0.2s;
  }
  .wish-title-inp::placeholder {
    color: #52493e;
    font-weight: 400;
    font-family: 'Bellefair', serif;
  }
  .wish-title-inp:focus {
    border-bottom-color: rgba(238, 232, 170, 0.5);
  }

  /* ── RichText inside dark scroll-frame ── */
  .rich-body-wrap :global(.editor-wrapper) {
    border: none;
    box-shadow: none;
    border-top: 1px solid rgba(238, 232, 170, 0.12);
    margin-top: 18px;
    border-radius: 0;
  }
  .rich-body-wrap :global(.tiptap-content) {
    min-height: 160px;
  }
  .rich-body-wrap :global(.custom-prose) {
    color: #ede5d8 !important;
    font-family: 'Bellefair', serif !important;
    font-size: clamp(14px, 2vw, 17px) !important;
    line-height: 1.7 !important;
  }
  .rich-body-wrap :global(.custom-prose p.is-editor-empty:first-child::before) {
    color: #52493e;
    content: attr(data-placeholder);
    float: right;
    pointer-events: none;
    height: 0;
  }
  .rich-body-wrap :global(button) {
    color: #c8bba8;
  }
  .rich-body-wrap :global(button:hover) {
    color: #fde68a;
    background: rgba(238, 232, 170, 0.08) !important;
    border-color: rgba(238, 232, 170, 0.25) !important;
  }
  .rich-body-wrap :global(button.active) {
    background: rgba(255, 77, 158, 0.25) !important;
    color: #ff4d9e !important;
    border-color: rgba(255, 77, 158, 0.4) !important;
    box-shadow: none !important;
  }
  .rich-body-wrap :global(.w-px.bg-gold\/50) {
    background: rgba(238, 232, 170, 0.2);
  }

  .wish-body-inp {
    width: 100%;
    box-sizing: border-box;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Bellefair', serif;
    font-size: clamp(14px, 2vw, 17px);
    color: #ede5d8;
    line-height: 1.7;
    resize: vertical;
    min-height: 160px;
  }
  .wish-body-inp::placeholder {
    color: #52493e;
    line-height: 1.7;
  }

  .scroll-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    border-top: 1px solid rgba(238, 232, 170, 0.12);
    padding-top: 12px;
  }
  .tool-btn {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: #c8bba8;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  .tool-btn:hover {
    background: rgba(238, 232, 170, 0.1);
    border-color: rgba(238, 232, 170, 0.3);
    color: #fde68a;
    transform: translateY(-1px);
  }

  .word-gauge {
    width: 70px;
    height: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }
  .word-fill {
    height: 100%;
    background: linear-gradient(90deg, #c8155f, #fde68a, #02ffbb);
    transition: width 0.3s;
    border-radius: 999px;
    box-shadow: 0 0 10px rgba(238, 232, 170, 0.4);
  }

  /* ── Subsection heading ── */
  .subsection {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #fde68a;
    margin: 26px 0 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .subsection::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(
      to left,
      transparent,
      rgba(238, 232, 170, 0.18)
    );
  }

  /* ── Detail jewels ── */
  .jewels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
  }
  .detail-jewel {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: start;
  }
  .detail-jewel:hover {
    background: rgba(238, 232, 170, 0.04);
    border-color: rgba(238, 232, 170, 0.25);
    transform: translateY(-1px);
  }
  .detail-jewel.location-trigger {
    position: relative;
  }
  .detail-jewel.location-trigger::after {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 12px;
    border: 1px solid rgba(116, 191, 255, 0.08);
    pointer-events: none;
  }
  .jewel-icon {
    font-size: 18px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    flex-shrink: 0;
  }
  .jewel-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #9a8f80;
  }
  .jewel-val {
    font-family: 'Bellefair', serif;
    font-size: 14px;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Modal */
  .location-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 220;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    background: rgba(7, 6, 6, 0.78);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .location-modal {
    width: min(940px, 100%);
    max-height: min(88vh, 860px);
    overflow: auto;
    border-radius: 20px;
    border: 1px solid rgba(116, 191, 255, 0.28);
    background:
      linear-gradient(
        180deg,
        rgba(116, 191, 255, 0.06),
        rgba(7, 6, 6, 0.98) 26%
      ),
      #0e0d0c;
    box-shadow:
      0 24px 80px rgba(0, 0, 0, 0.62),
      0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    padding: 16px;
  }
  .location-modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 12px;
  }
  .modal-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #74bfff;
  }
  .location-modal h2 {
    margin: 2px 0 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(20px, 5vw, 28px);
    line-height: 1.15;
    color: #ede5d8;
  }
  .modal-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: #c8bba8;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
  }
  .modal-close:hover {
    border-color: rgba(238, 232, 170, 0.32);
    color: #fde68a;
    background: rgba(238, 232, 170, 0.06);
  }
  .location-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 14px;
    flex-wrap: wrap;
  }
  .modal-save {
    padding: 9px 18px;
    font-size: 14px;
  }

  /* ── Generic jewel modal body ── */
  .jewel-modal {
    max-width: 520px;
  }
  .jewel-modal-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  @media (max-width: 520px) {
    .field-grid {
      grid-template-columns: 1fr;
    }
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field-lbl {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #9a8f80;
  }
  .field-inp {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(238, 232, 170, 0.18);
    color: #ede5d8;
    border-radius: 10px;
    font-family: 'Bellefair', serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .field-inp:focus {
    border-color: rgba(238, 232, 170, 0.4);
  }
  .field-inp::-webkit-calendar-picker-indicator {
    filter: invert(0.7);
    cursor: pointer;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .preset-pill {
    padding: 6px 12px;
    border-radius: 999px;
    cursor: pointer;
    border: 1px solid rgba(238, 232, 170, 0.22);
    background: rgba(238, 232, 170, 0.05);
    color: #fde68a;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    transition: all 0.2s;
  }
  .preset-pill:hover {
    border-color: rgba(238, 232, 170, 0.5);
    background: rgba(238, 232, 170, 0.1);
  }
  .preset-pill.ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.1);
    color: #9a8f80;
  }
  .preset-pill.ghost:hover {
    color: #ede5d8;
    border-color: rgba(238, 232, 170, 0.3);
  }

  .modal-hint {
    margin: 0;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: #52493e;
    line-height: 1.55;
  }

  .radio-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .radio-row {
    display: flex;
    gap: 11px;
    align-items: flex-start;
    padding: 12px 14px;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    transition: all 0.2s;
  }
  .radio-row:hover {
    border-color: rgba(238, 232, 170, 0.25);
  }
  .radio-row.on {
    border-color: rgba(255, 77, 158, 0.5);
    background: rgba(255, 77, 158, 0.06);
    box-shadow: 0 0 14px rgba(255, 77, 158, 0.1);
  }
  .radio-row input[type='radio'] {
    accent-color: #ff4d9e;
    margin-top: 3px;
    flex-shrink: 0;
  }
  .radio-label {
    font-family: 'Bellefair', serif;
    font-size: 14px;
    color: #ede5d8;
  }
  .radio-hint {
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: #9a8f80;
    margin-top: 3px;
    line-height: 1.45;
  }

  /* ── Values picker ── */
  .values-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .val-pill {
    padding: 6px 13px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: #9a8f80;
    font-family: 'Bellefair', serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .val-pill.on {
    border-color: rgba(255, 77, 158, 0.5);
    background: rgba(255, 77, 158, 0.12);
    color: #ff4d9e;
  }

  /* ── Publish bar ── */
  .publish-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 32px;
    padding: 16px 18px;
    border-radius: 18px;
    background:
      radial-gradient(
        120% 80% at 0% 0%,
        rgba(238, 232, 170, 0.06),
        transparent 60%
      ),
      radial-gradient(
        120% 80% at 100% 100%,
        rgba(200, 21, 95, 0.08),
        transparent 60%
      ),
      #0e0d0c;
    border: 1px solid rgba(238, 232, 170, 0.22);
    gap: 14px;
    flex-wrap: wrap;
  }
  .pub-dot {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(135deg, #201d19, #2a2520);
    border: 2px solid rgba(238, 232, 170, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #52493e;
    transition: all 0.3s;
  }
  .pub-dot.ready {
    background: linear-gradient(135deg, #02ffbb, #037d5b);
    border-color: #02ffbb;
    color: #0e0d0c;
    box-shadow: 0 0 18px rgba(2, 255, 187, 0.5);
  }
  .pub-status {
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: 17px;
    color: #ede5d8;
  }
  .pub-hint {
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: #9a8f80;
    margin-top: 2px;
  }
  .pub-btn {
    padding: 11px 20px;
    font-size: 14px;
  }

  /* ── Anonymous (guest) register CTA ── */
  .anon-cta {
    width: 100%;
    margin-bottom: 14px;
    padding: 11px 14px;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    line-height: 1.5;
    color: #fde68a;
    text-align: start;
    background: linear-gradient(135deg, rgba(200, 21, 95, 0.18), rgba(255, 77, 158, 0.1));
    border: 1px solid rgba(255, 77, 158, 0.4);
    box-shadow: 0 0 18px rgba(255, 77, 158, 0.12);
    transition: all 0.2s;
  }
  .anon-cta:hover {
    border-color: rgba(255, 77, 158, 0.7);
    transform: translateY(-1px);
  }

  /* ── Lev rail ── */
  .lev-rail {
    background: #171512;
    border: 1px solid rgba(116, 191, 255, 0.18);
    border-radius: 20px;
    padding: 18px;
    box-shadow: 0 0 30px rgba(116, 191, 255, 0.06);
  }
  @media (min-width: 1024px) {
    .lev-rail {
      position: sticky;
      top: 80px;
    }
  }
  .lev-col-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #9a8f80;
    margin-bottom: 6px;
  }
</style>
