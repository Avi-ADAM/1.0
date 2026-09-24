<script>
  import { useFormatMoney, useRikmaCurrency } from '$lib/money/context.svelte';
  import { DEFAULT_CURRENCY } from '$lib/money/currencies';
  import Money from '$lib/components/money/Money.svelte';
  import { onMount, onDestroy, tick } from 'svelte';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { fade } from 'svelte/transition';
  import '$lib/styles/concierge.css';
  import { goto, replaceState } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import {
    clearGuestDraft,
    readGuestDraft,
    saveGuestDraft,
    WISH_PREFILL_KEY
  } from '$lib/concierge/wishDraft.js';
  import { CONCIERGE_INTENT } from '$lib/concierge/regIntent.js';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { uPic } from '$lib/stores/uPic.js';
  import { t, locale, isRtl } from '$lib/translations';

  /**
   * @type {{
   *   data?: {
   *     uid?: string;
   *     un?: string;
   *     welcome?: boolean;
   *     draft?: import('../../../routes/(reg)/concierge/new/+page.server').ServerWishDraft | null
   *   },
   *   anon?: boolean
   * }}
   * `anon` = public/guest mode: the wish is composed before an account exists.
   * Matches are shown with supplier identities masked, and "publish" keeps the
   * draft on this device and routes to registration instead of creating the
   * Ratson. `data.draft` resumes a saved draft (status_ratson 'draft');
   * `data.welcome` is the first visit after the customer registration track.
   */
  let { data = {}, anon = false } = $props();
  const fmtMoney = useFormatMoney();
  const rikmaCurrency = useRikmaCurrency();

  /* ===== Drafts (the customer track) =====
     A logged-in wish can be saved as a draft Ratson and resumed from
     /concierge or the profile; once it exists, edits save themselves.
     A guest's wish waits on this device (wishDraft.js) until the account
     exists — then it is sent, if they had pressed "send", or saved as a
     draft on the account, if they had not. */
  let draftId = $state(/** @type {string | null} */ (null));
  let draftSaving = $state(false);
  let draftSavedAt = $state(/** @type {number | null} */ (null));
  /** Sending a wish the guest already pressed "send" on, before registering. */
  let autoSending = $state(false);
  /** The first screen after signing up — greet, rather than drop them in. */
  let welcome = $state(false);
  /** Their pre-registration wish is back in the form. */
  let restoredGuestDraft = $state(false);

  onMount(() => {
    welcome = !anon && !!data.welcome;
    if (!anon) {
      if (data.draft) applyServerDraft(data.draft);
      else resumeGuestDraft();
    }
    // `?seed=gift` — an idea picked on /made-for-you. Never over a draft.
    const seedKey = new URLSearchParams(window.location.search).get('seed');
    const seed = SEEDS.find((s) => s.key === seedKey);
    if (seed && !title.trim() && !data.draft && !restoredGuestDraft) {
      pickSeed(seed);
    }
    // What the visitor typed into the homepage's wish field. Handed over in
    // sessionStorage rather than the URL, so the wish never lands in a log or
    // a shared link; read once, and never over a draft.
    try {
      const prefill = sessionStorage.getItem(WISH_PREFILL_KEY);
      if (prefill) {
        sessionStorage.removeItem(WISH_PREFILL_KEY);
        if (!title.trim() && !data.draft && !restoredGuestDraft) {
          title = prefill.slice(0, 120);
        }
      }
    } catch {
      // storage blocked (private mode, sandbox) - the form simply opens empty
    }
  });

  /** @param {NonNullable<typeof data.draft>} d */
  function applyServerDraft(d) {
    draftId = d.id;
    title = d.title;
    body = d.body;
    if (d.startDate) startDate = d.startDate;
    if (d.finnishDate) finnishDate = d.finnishDate;
    if (typeof d.budgetAmount === 'number') budgetAmount = d.budgetAmount;
    whoCanOffer = d.whoCanOffer;
    whoCanSee = d.whoCanSee;
    location = { ...location, ...d.location };
    if (d.extractedMissions.length) extractedMissions = d.extractedMissions;
    if (d.extractedResources.length) extractedResources = d.extractedResources;
    const meta = d.aiMeta ?? {};
    if (meta.invitePartners) invitePartners = meta.invitePartners;
    if (Array.isArray(meta.skills)) {
      extractedSkills = meta.skills.map((name) => ({ name }));
    }
    if (Array.isArray(meta.categories)) extractedCategories = meta.categories;
    if (meta.enrichment) matchedEnrichment = meta.enrichment;
  }

  /**
   * The wish written before registration, back in the form.
   *
   * It is taken off the device *before* the server call, not after: the
   * composer can mount twice while a slow first load settles, and a second
   * mount that still found it would send or save it a second time. If the
   * server call fails it goes back, for the next visit.
   */
  async function resumeGuestDraft() {
    const d = readGuestDraft();
    if (!d) return;
    clearGuestDraft();
    restoreDraftFields(d);
    restoredGuestDraft = true;
    await tick();
    let kept;
    if (d.sendOnReturn && isReady) {
      autoSending = true;
      kept = await publish();
      if (!kept) autoSending = false;
    } else {
      kept = await saveDraft({ quiet: true });
    }
    if (!kept) saveGuestDraft(d, { sendOnReturn: d.sendOnReturn === true });
  }

  /** @param {Record<string, any>} d */
  function restoreDraftFields(d) {
    try {
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
      // What Lev had found, so a send right after registration carries the
      // same breakdown and matches the guest saw. Extraction also re-runs by
      // itself once `body` is set (debounced $effect).
      if (Array.isArray(d.extractedMissions)) extractedMissions = d.extractedMissions;
      if (Array.isArray(d.extractedResources)) extractedResources = d.extractedResources;
      if (Array.isArray(d.extractedSkills)) extractedSkills = d.extractedSkills;
      if (Array.isArray(d.extractedCategories)) extractedCategories = d.extractedCategories;
      if (Array.isArray(d.matchedPeople)) matchedPeople = d.matchedPeople;
      if (Array.isArray(d.matchedMissions)) matchedMissions = d.matchedMissions;
      if (Array.isArray(d.matchedResources)) matchedResources = d.matchedResources;
      if (d.matchedEnrichment) matchedEnrichment = d.matchedEnrichment;
    } catch (err) {
      console.warn('[WishForm] could not restore draft:', err);
    }
  }

  function getUserInitials(name) {
    if (!name) return $t('concierge.new.avatarFallback');
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2);
    }
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  /* ===== Inspiration seeds ===== */
  /* Label and hint come from `concierge.new.seeds.<key>`. */
  /** @type {{ icon: import('$lib/celim/icons/entityIcons').EntityIconKind, key: string }[]} */
  const SEEDS = [
    { icon: 'product', key: 'gift' },
    { icon: 'mission', key: 'task' },
    { icon: 'community', key: 'community' },
    { icon: 'map', key: 'trip' },
    { icon: 'family', key: 'family' },
    { icon: 'signed', key: 'free' }
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
    /** @type {{id:string,username:string,avatar:string|null,matchedSkills:string[],projects:string[],distanceKm?:number|null}[]} */ ([])
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
  /** Ready products a rikma or member already sells — nearest first when the
   *  wish has a place (enrichWish drops the ones that cannot reach her). */
  const matchedProducts = $derived(
    /** @type {{id:string,name:string,price:number|null,projectName:string|null,distanceKm?:number|null,pricingMode?:string|null}[]} */ (
      matchedEnrichment?.products ?? []
    )
  );
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
    // Read the place here so a changed location re-grounds the suggestions:
    // providers that cannot reach her drop out, the rest come nearest first.
    const place = {
      lat: location.lat,
      lng: location.lng,
      radius: location.radius,
      isOnline: location.location_mode === 'online'
    };
    // Lev filling the place square in from the text changes `location`, which
    // lands back here — and the server already grounded that very place.
    if (groundKey(text, place) === grounded) return;
    const timer = setTimeout(async () => {
      extracting = true;
      try {
        const res = await fetch('/api/concierge-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, place, lang: $locale })
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
          applyDetails(data.details);
          grounded = groundKey(text, {
            lat: location.lat,
            lng: location.lng,
            radius: location.radius,
            isOnline: location.location_mode === 'online'
          });
        }
      } catch (err) {
        console.warn('[concierge/new] extraction failed:', err);
      } finally {
        extracting = false;
      }
    }, 1200);
    return () => clearTimeout(timer);
  });

  /* ===== Details Lev read in the text =====
     A date, a budget, a place, "online", a shared initiative — when the writer
     states one in the text, Lev puts it in its square. Only in a square she
     has not set herself: `leved` remembers what Lev last wrote in each, and a
     square still holding exactly that is Lev's to update or clear as the text
     changes. Anything else — set by hand, restored from a draft — is hers,
     and Lev never touches it. */
  /** text + place the last extraction answered for (plain — not tracked) */
  let grounded = '';
  function groundKey(/** @type {string} */ text, /** @type {object} */ place) {
    return JSON.stringify([text, place]);
  }
  let leved = $state({
    when: '',
    where: '',
    budget: /** @type {number|null} */ (null),
    joinKind: ''
  });
  function placeKey(/** @type {typeof location} */ l) {
    return [l.location_mode, l.lat ?? '', l.lng ?? '', l.location_hint ?? ''].join('|');
  }

  /** @param {any} d the `details` of /api/concierge-extract */
  function applyDetails(d) {
    if (!d || typeof d !== 'object') return;

    // When
    const whenNow = `${startDate}|${finnishDate}`;
    if (whenNow === '|' || whenNow === leved.when) {
      startDate = d.dateFrom || '';
      finnishDate = d.dateTo || d.dateFrom || '';
      leved.when = startDate ? `${startDate}|${finnishDate}` : '';
    }

    // Budget — only an amount in the currency the square counts in; a
    // converted guess would be worse than an empty square.
    const cur = rikmaCurrency() ?? DEFAULT_CURRENCY;
    const budgetOk = d.budget > 0 && (!d.currency || d.currency === cur);
    if (budgetAmount == null || budgetAmount === leved.budget) {
      budgetAmount = budgetOk ? d.budget : null;
      leved.budget = budgetOk ? d.budget : null;
    }

    // Where — the point comes from the server's geocoder (OpenStreetMap).
    const whereNow = placeKey(location);
    const placeUnset =
      location.location_mode === 'unspecified' &&
      !hasLocationPoint &&
      !location.location_hint?.trim();
    if (placeUnset || whereNow === leved.where) {
      const base = { ...location, lat: null, lng: null, location_hint: '' };
      const next =
        d.online === true
          ? { ...base, location_mode: 'online', isOnline: true }
          : d.geo
            ? {
                ...base,
                location_mode: 'onsite',
                isOnline: false,
                lat: d.geo.lat,
                lng: d.geo.lng,
                location_hint: d.geo.label || d.place
              }
            : d.place
              ? { ...base, location_mode: 'onsite', isOnline: false, location_hint: d.place }
              : { ...base, location_mode: 'unspecified', isOnline: false };
      const nextKey = placeKey(/** @type {any} */ (next));
      if (nextKey !== whereNow) location = /** @type {any} */ (next);
      leved.where = next.location_mode === 'unspecified' ? '' : nextKey;
    }

    // A shared initiative others join
    if (joinKind === 'solo' || joinKind === leved.joinKind) {
      joinKind = d.groupKind || 'solo';
      leved.joinKind = d.groupKind || '';
    }
  }

  /** Did Lev fill this square (and nobody has changed it since)? */
  function jewelIsLeved(/** @type {number} */ index) {
    if (index === 0) return !!leved.when && `${startDate}|${finnishDate}` === leved.when;
    if (index === LOCATION_JEWEL_INDEX)
      return !!leved.where && placeKey(location) === leved.where;
    if (index === 2) return leved.budget != null && budgetAmount === leved.budget;
    if (index === 6) return !!leved.joinKind && joinKind === leved.joinKind;
    return false;
  }

  /* Value keys — labels live under `concierge.new.values.<key>`. */
  const ALL_VALUES = [
    'consent',
    'equality',
    'community',
    'transparency',
    'accessibility',
    'ecology',
    'reciprocity',
    'creativity',
    'generosity',
    'trust'
  ];

  /* Label/placeholder come from `concierge.new.jewels.<key>`. */
  /** @type {{ icon: import('$lib/celim/icons/entityIcons').EntityIconKind, key: string, accent: string }[]} */
  const DETAIL_JEWELS = [
    { icon: 'date', key: 'when', accent: 'gold' },
    { icon: 'place', key: 'where', accent: 'blue' },
    { icon: 'money', key: 'budget', accent: 'green' },
    { icon: 'members', key: 'whoCanOffer', accent: 'barbi' },
    { icon: 'private', key: 'whoCanSee', accent: 'gold' },
    { icon: 'maagad', key: 'invite', accent: 'green' },
    { icon: 'audience', key: 'joinKind', accent: 'barbi' }
  ];

  /* Every option list below carries only its stored `value` plus the `key` used
     to look up `<group>.<key>.label` / `.hint`. Where the stored value is
     already a string it doubles as the key. */
  const WHO_CAN_OFFER_OPTIONS = [
    { value: true, key: 'open' },
    { value: false, key: 'mine' }
  ];
  const WHO_CAN_SEE_OPTIONS = [
    { value: 'personal' },
    { value: 'free_threshold' },
    { value: 'pay_to_access' }
  ];
  const INVITE_PARTNERS_OPTIONS = [
    { value: 'lev' },
    { value: 'manual' },
    { value: 'none' }
  ];
  /* Shared-purchase initiative kinds (PLAN_SHARED_PURCHASE S0).
     'solo' = today's behaviour. Any other value opens a group that others
     can join, decide and pay together. */
  const JOIN_KIND_OPTIONS = [
    { value: 'solo' },
    { value: 'group_purchase' },
    { value: 'group_trip' },
    { value: 'community_event' },
    { value: 'public_renovation' },
    { value: 'recurring_subscription' },
    { value: 'other' }
  ];

  const ACCENT = {
    gold: {
      ring: 'rgb(var(--cg-gold-rgb) / 0.4)',
      glow: 'rgb(var(--cg-gold-rgb) / 0.25)',
      text: 'var(--cg-goldhi)',
      rgb: 'var(--cg-gold-rgb)'
    },
    barbi: {
      ring: 'rgb(var(--cg-pink-rgb) / 0.5)',
      glow: 'rgb(var(--cg-pink-rgb) / 0.3)',
      text: 'var(--cg-pink)',
      rgb: 'var(--cg-pink-rgb)'
    },
    blue: {
      ring: 'rgb(var(--cg-sky-rgb) / 0.4)',
      glow: 'rgb(var(--cg-sky-rgb) / 0.25)',
      text: 'var(--cg-sky)',
      rgb: 'var(--cg-sky-rgb)'
    },
    green: {
      ring: 'rgb(var(--cg-mint-rgb) / 0.4)',
      glow: 'rgb(var(--cg-mint-rgb) / 0.25)',
      text: 'var(--cg-mint)',
      rgb: 'var(--cg-mint-rgb)'
    }
  };

  /* `code` is the decorative Latin small-caps on the rail and stays as-is in
     every locale; the word beside it is translated. */
  const STEPS = [
    { id: 0, code: 'WISH', key: 'wish' },
    { id: 1, code: 'UNDERSTAND', key: 'understand' },
    { id: 2, code: 'PROPOSALS', key: 'proposals' },
    { id: 3, code: 'CONSENT', key: 'consent' }
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

  /* Display formatters — the runtime supplies the month names per locale, so
     there is no month table to translate. */
  function fmtDayMon(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString($locale || 'he', {
      day: 'numeric',
      month: 'long'
    });
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
      ? fmtMoney(budgetAmount)
      : ''
  );
  const whoCanOfferJewelValue = $derived(
    $t(`concierge.new.whoCanOffer.${whoCanOffer ? 'open' : 'mine'}.label`)
  );
  const whoCanSeeJewelValue = $derived(
    $t(`concierge.new.whoCanSee.${whoCanSee}.label`)
  );
  const invitePartnersJewelValue = $derived(
    $t(`concierge.new.invitePartners.${invitePartners}.label`)
  );
  const joinKindJewelValue = $derived(
    $t(`concierge.new.joinKind.${joinKind}.label`)
  );

  const bodyText = $derived.by(() =>
    body
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  const words = $derived(bodyText ? bodyText.split(' ').length : 0);
  const fullness = $derived(Math.min(1, words / 50));

  /** Plain text → editor HTML, one <p> per paragraph (never trusted markup). */
  function textToHtml(/** @type {string} */ text) {
    const esc = (/** @type {string} */ s) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  /** Editor HTML → plain paragraphs separated by a blank line. */
  function htmlToText(/** @type {string} */ html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /* ── Dictation ────────────────────────────────────────────────────────────
     Two engines behind one button:
       1. the browser's own Web Speech API — live, free, no key (Chrome, Edge,
          Safari);
       2. a recording sent to /api/concierge-transcribe (Groq Whisper, Gemini
          as fallback) — for Firefox, which has no Web Speech, and for the
          browsers that ship it but block its service (Brave, Electron shells,
          managed installs). Those report `not-allowed` exactly like a real
          permission denial, which is why the first cut told everyone to go
          and fix their browser settings.
     The microphone is asked for explicitly first. That is what raises the
     browser's permission prompt, and it tells a real denial (the user or the
     OS said no) apart from a blocked speech service (the mic is fine). ── */
  const SPEECH_LANG = /** @type {Record<string, string>} */ ({
    he: 'he-IL',
    en: 'en-US',
    ar: 'ar-SA',
    ru: 'ru-RU',
    es: 'es-ES'
  });
  /** A recorded clip is cut here, in ms — the transcription cap is ~a minute. */
  const RECORD_MAX_MS = 60_000;

  let canDictate = $state(false);
  let dictating = $state(false);
  let transcribing = $state(false);
  /** set once this browser's Web Speech service has refused us */
  let speechBlocked = false;
  /** @type {any} */
  let recognition = null;
  /** @type {MediaRecorder | null} */
  let recorder = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let recordTimer;

  onMount(() => {
    const w = /** @type {any} */ (window);
    const hasSpeech = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    const hasRecorder = typeof w.MediaRecorder === 'function';
    canDictate = !!navigator.mediaDevices?.getUserMedia && (hasSpeech || hasRecorder);
  });
  onDestroy(() => {
    recognition?.abort();
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    recorder?.stream.getTracks().forEach((tr) => tr.stop());
    clearTimeout(recordTimer);
  });

  function appendDictated(/** @type {string} */ text) {
    const clean = text.trim();
    if (!clean) return;
    const esc = textToHtml(clean).replace(/^<p>|<\/p>$/g, '');
    // Continue the last paragraph rather than opening a new one per phrase.
    body = /<\/p>\s*$/.test(body) && bodyText
      ? body.replace(/<\/p>\s*$/, () => ` ${esc}</p>`)
      : `${bodyText ? body : ''}<p>${esc}</p>`;
  }

  /** @returns {Promise<MediaStream | null>} */
  async function askForMic() {
    if (!window.isSecureContext) {
      toast.error($t('concierge.new.tool.micInsecure'));
      return null;
    }
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = /** @type {any} */ (err)?.name;
      if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        toast.error($t('concierge.new.tool.micMissing'));
      } else if (name === 'NotAllowedError' || name === 'SecurityError') {
        toast.error($t('concierge.new.tool.micDenied'), { duration: 8000 });
      } else {
        toast.error($t('concierge.new.tool.micFailed'));
      }
      return null;
    }
  }

  async function toggleDictation() {
    if (transcribing) return;
    if (dictating) {
      recognition?.stop();
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      return;
    }
    const stream = await askForMic();
    if (!stream) return;

    const w = /** @type {any} */ (window);
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (Recognition && !speechBlocked) {
      // Web Speech opens its own capture; ours only raised the prompt.
      stream.getTracks().forEach((tr) => tr.stop());
      startSpeech(Recognition);
    } else {
      startRecording(stream);
    }
  }

  function startSpeech(/** @type {any} */ Recognition) {
    let fallBack = false;
    recognition = new Recognition();
    recognition.lang = SPEECH_LANG[$locale] ?? 'he-IL';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (/** @type {any} */ e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) appendDictated(e.results[i][0].transcript);
      }
    };
    recognition.onerror = (/** @type {any} */ e) => {
      // The microphone was just granted, so these mean the browser's speech
      // service is off-limits — not the user's settings. Record instead.
      if (['not-allowed', 'service-not-allowed', 'network'].includes(e.error)) {
        speechBlocked = true;
        fallBack = typeof MediaRecorder === 'function';
        if (!fallBack) toast.error($t('concierge.new.tool.micFailed'));
      } else if (e.error === 'audio-capture') {
        toast.error($t('concierge.new.tool.micMissing'));
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        toast.error($t('concierge.new.tool.micFailed'));
      }
    };
    recognition.onend = async () => {
      dictating = false;
      recognition = null;
      if (!fallBack) return;
      const stream = await askForMic();
      if (stream) startRecording(stream);
    };
    try {
      recognition.start();
      dictating = true;
    } catch {
      dictating = false;
      recognition = null;
    }
  }

  function startRecording(/** @type {MediaStream} */ stream) {
    /** @type {Blob[]} */
    const chunks = [];
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((tr) => tr.stop());
      toast.error($t('concierge.new.tool.micFailed'));
      return;
    }
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      clearTimeout(recordTimer);
      stream.getTracks().forEach((tr) => tr.stop());
      const type = recorder?.mimeType || 'audio/webm';
      recorder = null;
      dictating = false;
      sendRecording(new Blob(chunks, { type }));
    };
    recorder.start();
    dictating = true;
    recordTimer = setTimeout(() => {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    }, RECORD_MAX_MS);
    toast.info($t('concierge.new.tool.micRecording'));
  }

  async function sendRecording(/** @type {Blob} */ clip) {
    // Under ~2KB is a click of the button with nothing said.
    if (clip.size < 2000) return;
    transcribing = true;
    const id = toast.loading($t('concierge.new.tool.micTranscribing'));
    try {
      const form = new FormData();
      form.append('audio', clip);
      form.append('lang', $locale);
      const res = await fetch('/api/concierge-transcribe', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      const text = typeof data?.text === 'string' ? data.text.trim() : '';
      if (text) {
        appendDictated(text);
        toast.dismiss(id);
      } else if (res.ok && !data?.reason) {
        toast.info($t('concierge.new.tool.micNothingHeard'), { id });
      } else {
        toast.error($t('concierge.new.tool.micFailed'), { id });
      }
    } catch {
      toast.error($t('concierge.new.tool.micFailed'), { id });
    } finally {
      transcribing = false;
    }
  }

  /* ── Lev's phrasing suggestion — /api/concierge-rephrase (Gemini). The
     writer's own version is one tap away in the toast, and in undo. ── */
  let rephrasing = $state(false);

  async function rephrase() {
    const text = htmlToText(body);
    if (rephrasing) return;
    if (text.length < 10) {
      toast.info($t('concierge.new.tool.phrasingTooShort'));
      return;
    }
    rephrasing = true;
    // The model can take half a minute; say so rather than sit silent.
    const id = toast.loading($t('concierge.new.tool.phrasingWorking'));
    try {
      const res = await fetch('/api/concierge-rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text })
      });
      const data = await res.json().catch(() => ({}));
      const next = typeof data?.text === 'string' ? data.text.trim() : '';
      if (!next) {
        toast.error(
          res.status === 429
            ? $t('concierge.new.tool.phrasingBusy')
            : $t('concierge.new.tool.phrasingFailed'),
          { id }
        );
        return;
      }
      const before = body;
      body = textToHtml(next);
      toast.success($t('concierge.new.tool.phrasingDone'), {
        id,
        action: {
          label: $t('concierge.new.tool.phrasingRestore'),
          onClick: () => (body = before)
        }
      });
    } catch {
      toast.error($t('concierge.new.tool.phrasingFailed'), { id });
    } finally {
      rephrasing = false;
    }
  }
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
    matchedPeople.length +
      matchedMissions.length +
      matchedResources.length +
      matchedProducts.length >
      0
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
    if (location.location_mode === 'online') return $t('concierge.new.online');
    if (hasLocationPoint) {
      const hint =
        location.location_hint?.trim() || $t('concierge.new.locationChosen');
      return `${hint} · ${location.radius || 15} ${$t('concierge.new.km')}`;
    }
    return location.location_hint?.trim() || '';
  });

  /** The composer's state as it would be stored on the device. */
  function guestDraftPayload() {
    return {
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
      matchedPeople,
      matchedMissions,
      matchedResources,
      matchedEnrichment
    };
  }

  /**
   * Keep the guest's wish on this device and go sign the agreement. The
   * registration track (regIntent.js) then skips the onboarding and brings
   * them back here, where the wish is sent (`sendOnReturn`) or kept as a
   * draft on their new account.
   *
   * @param {{ sendOnReturn?: boolean }} [opts]
   */
  function saveDraftAndRegister(opts = {}) {
    if (title.trim() || bodyText) {
      saveGuestDraft(guestDraftPayload(), { sendOnReturn: opts.sendOnReturn });
    }
    goto(
      `${registerPath()}?intent=${CONCIERGE_INTENT}&from=${encodeURIComponent('/concierge/new')}`
    );
  }

  /** Everything the Ratson row takes from the form, status aside. */
  function wishParams() {
    const hasBudget =
      typeof budgetAmount === 'number' &&
      Number.isFinite(budgetAmount) &&
      budgetAmount > 0;
    const name =
      title.trim() ||
      bodyText.slice(0, 60).trim() ||
      $t('concierge.new.untitledDraft');

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
            place: matchedEnrichment.place ?? null,
            computedAt: new Date().toISOString()
          }
        : null
    };

    return {
      name,
      desc: name,
      longDes: body.trim(),
      access_mode: whoCanSee,
      allowJoin: whoCanOffer,
      bounti: hasBudget,
      totalbounti: hasBudget ? budgetAmount : 0,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      finnishDate: finnishDate ? new Date(finnishDate).toISOString() : null,
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
    };
  }

  /**
   * @param {string} actionKey
   * @param {Record<string, any>} params
   */
  async function runAction(actionKey, params) {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey, params })
    });
    const out = await res.json();
    if (!out?.success) {
      throw new Error(out?.error?.message || out?.error || `${actionKey} failed`);
    }
    return out.data ?? {};
  }

  /**
   * Save the wish as a draft on the account (a guest's stays on the device).
   * The first save creates a draft Ratson; later ones rewrite it.
   *
   * @param {{ quiet?: boolean }} [opts] quiet — an autosave, no toast
   * @returns {Promise<boolean>}
   */
  async function saveDraft(opts = {}) {
    if (!title.trim() && !bodyText) return false;
    if (anon) {
      const kept = saveGuestDraft(guestDraftPayload());
      if (!opts.quiet) {
        if (kept) toast.success($t('concierge.new.draftSavedDevice'));
        else toast.error($t('concierge.new.draftSaveFailed'));
      }
      if (kept) draftSavedAt = Date.now();
      return kept;
    }
    if (draftSaving || publishing) return false;
    draftSaving = true;
    try {
      if (draftId) {
        await runAction('updateRatsonDraft', {
          ratsonId: draftId,
          ...wishParams()
        });
      } else {
        const created = await runAction('createRatson', {
          ...wishParams(),
          status_ratson: 'draft'
        });
        if (!created.ratsonId) throw new Error('no ratsonId');
        draftId = String(created.ratsonId);
        // Refreshing or sharing this URL now reopens the same draft.
        const url = new URL(window.location.href);
        url.searchParams.set('draft', draftId);
        url.searchParams.delete('welcome');
        url.searchParams.delete('seed');
        replaceState(url, {});
      }
      draftSavedAt = Date.now();
      if (!opts.quiet) toast.success($t('concierge.new.draftSaved'));
      return true;
    } catch (err) {
      console.warn('[WishForm] draft save failed:', err);
      if (!opts.quiet) toast.error($t('concierge.new.draftSaveFailed'));
      return false;
    } finally {
      draftSaving = false;
    }
  }

  /* Once a draft exists, keep it current — a few seconds after the last
     change, so a customer who closes the tab mid-thought loses nothing. */
  let lastAutosaved = '';
  $effect(() => {
    if (anon || !draftId || autoSending) return;
    const snapshot = JSON.stringify([
      title,
      body,
      startDate,
      finnishDate,
      budgetAmount,
      whoCanOffer,
      whoCanSee,
      location
    ]);
    if (!lastAutosaved) {
      lastAutosaved = snapshot;
      return;
    }
    if (snapshot === lastAutosaved) return;
    const timer = setTimeout(async () => {
      if (await saveDraft({ quiet: true })) lastAutosaved = snapshot;
    }, 3500);
    return () => clearTimeout(timer);
  });

  /** @returns {Promise<boolean>} whether the wish went out */
  async function publish() {
    if (!isReady) return false;
    if (anon) {
      saveDraftAndRegister({ sendOnReturn: true });
      return false;
    }
    publishing = true;
    publishError = '';
    try {
      let ratsonId;
      if (draftId) {
        // Publishing a draft keeps its id: the draft *becomes* the wish.
        await runAction('updateRatsonDraft', {
          ratsonId: draftId,
          publish: true,
          ...wishParams()
        });
        ratsonId = draftId;
      } else {
        const created = await runAction('createRatson', {
          ...wishParams(),
          status_ratson: 'open'
        });
        ratsonId = created.ratsonId;
        if (!ratsonId) throw new Error('Failed to create wish');
      }
      clearGuestDraft();

      // Give matching a few seconds so the review page opens with the products
      // it found already on their rows; past that, navigate anyway — matching
      // keeps running server-side and "search again" there picks it up.
      const matching = fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'matchRatson',
          params: { ratsonId, mode: 'keyword' }
        })
      }).catch((err) =>
        console.warn('[concierge/new] matchRatson dispatch failed:', err)
      );
      await Promise.race([
        matching,
        new Promise((resolve) => setTimeout(resolve, 5000))
      ]);

      goto(`/concierge/${ratsonId}`);
      return true;
    } catch (err) {
      console.error('[concierge/new] publish failed:', err);
      publishError =
        err instanceof Error
          ? err.message
          : $t('concierge.new.publishFailed');
      return false;
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
    title = $t(`concierge.new.seeds.${seed.key}.label`);
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
    if (index === 3) return whoCanOffer !== true; // 'פתוח לכל' is default → only highlight when changed
    if (index === 4) return whoCanSee !== 'personal';
    if (index === 5) return invitePartners !== 'lev';
    if (index === 6) return joinKind !== 'solo';
    return false;
  }

  function detailJewelValue(jewel, index) {
    const placeholder = $t(`concierge.new.jewels.${jewel.key}.placeholder`);
    if (index === LOCATION_JEWEL_INDEX)
      return locationJewelValue || placeholder;
    if (index === 0) return whenJewelValue || placeholder;
    if (index === 2) return budgetJewelValue || placeholder;
    if (index === 3) return whoCanOfferJewelValue || placeholder;
    if (index === 4) return whoCanSeeJewelValue || placeholder;
    if (index === 5) return invitePartnersJewelValue || placeholder;
    if (index === 6) return joinKindJewelValue || placeholder;
    return placeholder;
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
      : 'border-color:rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)))';
  }
  function accentText(acc, hasVal) {
    return hasVal ? (ACCENT[acc] || ACCENT.gold).text : 'var(--cg-muted)';
  }
  function accentBg(acc, hasVal) {
    if (!hasVal) return 'rgb(var(--cg-fg-rgb) / calc(0.03 * var(--cg-fg-k)))';
    const r = (ACCENT[acc] || ACCENT.gold).rgb;
    return `rgb(${r} / 0.1)`;
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
  /** Registering from the header — whatever was written is kept, not sent. */
  function gotoRegister(dest) {
    if (title.trim() || bodyText) saveGuestDraft(guestDraftPayload());
    goto(
      `${registerPath()}?intent=${CONCIERGE_INTENT}&from=${encodeURIComponent(dest || '/concierge/new')}`
    );
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
    navNotice = $t('concierge.new.navNotice', { label });
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

{#if autoSending}
  <!-- The wish they pressed "send" on before registering, going out now. -->
  <div class="autosend" dir={$isRtl ? 'rtl' : 'ltr'} role="status" transition:fade>
    <div class="autosend-card">
      <img src="/logo-concierge.png" class="autosend-coin" alt="" />
      <div class="autosend-title">{$t('concierge.new.autoSend.title')}</div>
      <div class="autosend-sub">{$t('concierge.new.autoSend.sub')}</div>
      <div class="autosend-bar"><span></span></div>
    </div>
  </div>
{/if}

<!-- ===================================================================
     NEW WISH — form page (mock, design-only)
     =================================================================== -->
<div class="cp" dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ── HEADER ─────────────────────────────────────────────────────── -->
  <header class="hdr">
    <div class="hdr-logo">
      <img src="/logo-concierge.png" class="hdr-coin" alt="1lev1" />
      <div class="hdr-brand">
        <span class="hdr-dot"></span>
        <span class="hdr-name">Concierge</span>
        <span class="hdr-sub hide-xs">{$t('concierge.new.brandSub')}</span>
      </div>
    </div>
    <nav class="hdr-nav hide-sm">
      <a
        href="/lev"
        class="nav-lnk"
        onclick={(e) => navGuard(e, '/lev', $t('concierge.new.nav.overview'))}
        >{$t('concierge.new.nav.overview')}</a
      >
      <a
        href="/concierge"
        class="nav-lnk nav-act"
        onclick={(e) =>
          navGuard(e, '/concierge', $t('concierge.new.nav.wishes'))}
        >{$t('concierge.new.nav.wishes')}</a
      >
      <a
        href="/deals"
        class="nav-lnk"
        onclick={(e) => navGuard(e, '/deals', $t('concierge.new.nav.deals'))}
        >{$t('concierge.new.nav.deals')}</a
      >
      <a
        href="/moach"
        class="nav-lnk"
        onclick={(e) => navGuard(e, '/moach', $t('concierge.new.nav.moach'))}
        >{$t('concierge.new.nav.moach')}</a
      >
    </nav>
    <div class="hdr-right">
      {#if anon}
        <button
          class="hdr-register"
          onclick={() => gotoRegister('/concierge/new')}
          >{$t('concierge.new.register')}</button
        >
      {:else}
        <button class="notif-btn" aria-label={$t('concierge.new.notifications')}
          ><EntityIcon kind="notifications" size={16} /><span class="notif-pip"></span></button
        >
        <button class="av-btn" onclick={() => goto('/me')}>
          {#if $uPic}
            <img
              src={$uPic}
              alt={$t('concierge.new.profileAlt')}
              class="av-img"
            />
          {:else}
            {getUserInitials(data.un)}
          {/if}
        </button>
      {/if}
    </div>
  </header>

  {#if navNotice}
    <div class="nav-notice" role="status" transition:fade={{ duration: 140 }}>
      <span class="nav-notice-txt">{navNotice}</span>
      <button class="nav-notice-reg" onclick={() => gotoRegister(navNoticeDest)}
        >{$t('concierge.new.register')}</button
      >
      <button
        class="nav-notice-x"
        aria-label={$t('concierge.new.close')}
        onclick={dismissNavNotice}>×</button
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
              <span class="step-en hide-xs">{step.code}</span>
              <span class="step-he hide-xs"
                >· {$t(`concierge.new.steps.${step.key}`)}</span
              >
            </div>
            {#if i < STEPS.length - 1}<span class="step-sep"></span>{/if}
          {/each}
        </div>
        <a
          href="/concierge"
          class="btn-ghost btn-xs"
          onclick={(e) =>
            navGuard(e, '/concierge', $t('concierge.new.nav.wishList'))}
          >{$t('concierge.new.backToList')}</a
        >
      </div>

      {#if welcome}
        <!-- First screen after the customer registration track: no onboarding,
             just where they came for. -->
        <div class="welcome-note anim" role="status">
          <span class="welcome-icon"><EntityIcon kind="concierge" size={18} /></span>
          <div>
            <div class="welcome-title">{$t('concierge.new.welcome.title')}</div>
            <div class="welcome-sub">
              {restoredGuestDraft
                ? $t('concierge.new.welcome.draftKept')
                : $t('concierge.new.welcome.start')}
            </div>
          </div>
          <button
            class="welcome-close"
            aria-label={$t('concierge.new.welcome.dismiss')}
            onclick={() => (welcome = false)}>×</button
          >
        </div>
      {/if}

      <!-- OPENING INCANTATION -->
      <div class="anim anim-d1" style="text-align:center;padding:24px 0 6px">
        <div class="incant-rule">{$t('concierge.new.incantRule')}</div>
        <h1 class="incant-h1">{$t('concierge.new.incantTitle')}</h1>
        <p class="incant-p">
          {$t('concierge.new.incantBody')}<br />
          <span style="color:var(--cg-goldhi)"
            >{$t('concierge.new.incantPrivacy')}</span
          >
        </p>
      </div>

      <!-- INSPIRATION SEEDS -->
      <div class="seeds anim anim-d2">
        {#each SEEDS as seed (seed.key)}
          <button class="seed-card" onclick={() => pickSeed(seed)}>
            <span class="seed-icon"><EntityIcon kind={seed.icon} size={18} /></span>
            <div style="min-width:0;text-align:start">
              <div class="seed-label">
                {$t(`concierge.new.seeds.${seed.key}.label`)}
              </div>
              <div class="seed-hint">
                {$t(`concierge.new.seeds.${seed.key}.hint`)}
              </div>
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
                style="width:8px;height:8px;border-radius:50%;background:var(--cg-pink);box-shadow:0 0 12px var(--cg-pink)"
              ></span>
              <span
                style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--cg-goldhi)"
              >
                {$t('concierge.new.draftBadge')}
              </span>
              <span style="flex:1"></span>
              <!-- Only once there is something saved — it used to claim an
                   autosave that never happened. -->
              {#if draftSaving}
                <span
                  style="font-family:'Bellefair',serif;font-size:12px;color:var(--cg-muted)"
                  >{$t('concierge.new.draftSaving')}</span
                >
              {:else if draftSavedAt}
                <span
                  style="font-family:'Bellefair',serif;font-size:12px;color:var(--cg-muted)"
                  >{anon
                    ? $t('concierge.new.savedOnDevice')
                    : $t('concierge.new.autosaved')}</span
                >
              {/if}
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
              <RichText
                bind:outpot={body}
                trans={true}
                sml={true}
                placeholder={$t('concierge.new.bodyPlaceholder')}
              />
            </div>

            <!-- Toolbar -->
            <div class="scroll-toolbar">
              <div style="display:flex;gap:6px">
                {#if canDictate}
                  <button
                    type="button"
                    class="tool-btn"
                    class:tool-live={dictating}
                    class:tool-busy={transcribing}
                    disabled={transcribing}
                    aria-pressed={dictating}
                    title={dictating
                      ? $t('concierge.new.tool.micStop')
                      : $t('concierge.new.tool.mic')}
                    aria-label={dictating
                      ? $t('concierge.new.tool.micStop')
                      : $t('concierge.new.tool.mic')}
                    onclick={toggleDictation}
                    ><EntityIcon kind="voice" size={15} /></button
                  >
                {/if}
                <!-- Not wired yet — kept for the design. Attaching needs the
                     upload to land on the wish's `pics` through the draft and
                     publish actions, and guests cannot upload at all.
                <button class="tool-btn" title={$t('concierge.new.tool.attach')}
                  ><EntityIcon kind="attach" size={15} /></button
                >
                -->
                <button
                  type="button"
                  class="tool-btn"
                  class:tool-busy={rephrasing}
                  disabled={rephrasing}
                  title={$t('concierge.new.tool.phrasing')}
                  aria-label={$t('concierge.new.tool.phrasing')}
                  onclick={rephrase}
                  ><EntityIcon kind="wish" size={15} /></button
                >
                <!-- Not wired yet — kept for the design. What "language"
                     should do (translate the draft? pick the wish's language?)
                     is still open.
                <button
                  class="tool-btn"
                  title={$t('concierge.new.tool.language')}>⇄</button
                >
                -->
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <span
                  style="font-family:'Bellefair',serif;font-size:12px;color:var(--cg-muted2)"
                  >{$t('concierge.new.wordCount', { count: words })}</span
                >
                <div class="word-gauge">
                  <div class="word-fill" style="width:{fullness * 100}%"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- /scroll-frame -->

          <!-- PRACTICAL DETAILS -->
          <div class="subsection">{$t('concierge.new.sectionDetails')}</div>
          <div class="jewels-grid">
            {#each DETAIL_JEWELS as j, i (j.key)}
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
                  style="background:{accentBg(j.accent, has)}"><EntityIcon kind={j.icon} size={15} /></span
                >
                <div style="flex:1;min-width:0;text-align:start">
                  <div class="jewel-label">
                    {$t(`concierge.new.jewels.${j.key}.label`)}
                    {#if jewelIsLeved(i)}
                      <span class="lev-mark" title={$t('concierge.new.levFilled')}
                        >✦ Lev</span
                      >
                    {/if}
                  </div>
                  <div
                    class="jewel-val"
                    style="color:{accentText(j.accent, has)}"
                  >
                    {detailJewelValue(j, i)}
                  </div>
                </div>
                <span style="font-size:12px;color:var(--cg-dim)">›</span>
              </button>
            {/each}
          </div>

          <!-- VALUES -->
          <div class="subsection">{$t('concierge.new.sectionValues')}</div>
          <div class="values-grid anim anim-d4">
            {#each ALL_VALUES as v (v)}
              {@const on = values.includes(v)}
              <button
                class="val-pill {on ? 'on' : ''}"
                onclick={() => toggleValue(v)}
                >{$t(`concierge.new.values.${v}`)}</button
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
              <button
                class="btn-ghost"
                onclick={() => saveDraft()}
                disabled={draftSaving || publishing}
                >{draftSaving
                  ? $t('concierge.new.draftSaving')
                  : $t('concierge.new.saveDraft')}</button
              >
              <button
                class="btn-jewel pub-btn"
                disabled={!isReady}
                onclick={publish}
                style="opacity:{isReady ? 1 : 0.5};background:{isReady
                  ? 'linear-gradient(135deg,var(--cg-g-metal-a),var(--cg-g-metal-b) 30%,var(--cg-g-metal-c) 60%,var(--cg-g-metal-d))'
                  : 'linear-gradient(135deg,var(--cg-g-pinkd),var(--cg-g-pink))'};color:{isReady
                  ? 'var(--cg-on-metal)'
                  : 'var(--cg-on-cta)'};text-shadow:{isReady
                  ? '1px 1px 0 var(--cg-on-metal-glow)'
                  : 'none'}"
                >{anon
                  ? $t('concierge.new.publishRegister')
                  : publishing
                    ? $t('concierge.new.publishing')
                    : hasMatches
                      ? $t('concierge.new.publishAndSee')
                      : $t('concierge.new.publish')}</button
              >
            </div>
          </div>

          <div
            style="margin-top:14px;text-align:center;font-family:'Bellefair',serif;font-size:12px;color:var(--cg-muted)"
          >
            {$t('concierge.new.afterPublish')}
          </div>
          {#if publishError}
            <div
              style="margin-top:10px;padding:10px 14px;background:rgb(var(--cg-pink-rgb) / .06);border:1px solid rgb(var(--cg-pink-rgb) / .3);border-radius:12px;font-family:'Bellefair',serif;font-size:13px;color:var(--cg-pink);text-align:center"
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
                style="width:36px;height:36px;border-radius:50%;border:2px solid rgb(var(--cg-sky-rgb) / .4)"
                alt="Lev"
              />
              <span
                style="position:absolute;bottom:-2px;inset-inline-end:-2px;width:12px;height:12px;border-radius:50%;background:var(--cg-mint);border:2px solid var(--cg-s1);box-shadow:0 0 10px var(--cg-mint)"
              ></span>
            </div>
            <div>
              <div
                style="font-family:'Cinzel',serif;font-size:13px;color:var(--cg-sky);letter-spacing:.18em"
              >
                LEV
              </div>
              <div
                style="font-family:'Bellefair',serif;font-size:11px;color:var(--cg-muted2)"
              >
                {$t('concierge.new.lev.sub')}
              </div>
            </div>
          </div>

          {#if anon && hasMatches}
            <button class="anon-cta" onclick={() => saveDraftAndRegister()}>
              {$t('concierge.new.lev.anonCta', {
                count:
                  matchedPeople.length +
                  matchedResources.length +
                  matchedMissions.length
              })}
            </button>
          {/if}

          <!-- Live extraction preview -->
          <div class="section-label" style="margin:6px 0 8px">
            <span class="lead" style="display:flex;align-items:center;gap:8px">
              <span class="gem" style="width:6px;height:6px"></span>
              {#if extracting}
                {$t('concierge.new.lev.analyzing')}
              {:else if extractedMissions.length + extractedResources.length > 0}
                {$t('concierge.new.lev.identified', {
                  count: extractedMissions.length + extractedResources.length
                })}
              {:else}
                {$t('concierge.new.lev.realtime')}
              {/if}
            </span>
          </div>

          {#if extracting}
            <div
              style="padding:14px 12px;border-radius:10px;background:rgb(var(--cg-fg-rgb) / calc(.02 * var(--cg-fg-k)));border:1px dashed rgb(var(--cg-fg-rgb) / calc(.08 * var(--cg-fg-k)));font-family:'Bellefair',serif;font-size:12.5px;color:var(--cg-muted);line-height:1.55;text-align:center"
            >
              <span style="opacity:.6"
                >{$t('concierge.new.lev.listening')}</span
              >
            </div>
          {:else if extractedMissions.length > 0 || extractedResources.length > 0}
            <div style="display:flex;flex-direction:column;gap:10px">
              {#if extractedMissions.length > 0}
                <div>
                  <div class="lev-col-lbl">
                    {$t('concierge.new.lev.missions')}
                  </div>
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
                  <div class="lev-col-lbl">
                    {$t('concierge.new.lev.resources')}
                  </div>
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
              style="padding:14px 12px;border-radius:10px;background:rgb(var(--cg-fg-rgb) / calc(.02 * var(--cg-fg-k)));border:1px dashed rgb(var(--cg-fg-rgb) / calc(.08 * var(--cg-fg-k)));font-family:'Bellefair',serif;font-size:12.5px;color:var(--cg-muted);line-height:1.55;text-align:center"
            >
              {$t('concierge.new.lev.emptyHint')}
            </div>
          {/if}

          <!-- Skills the wish implies -->
          {#if extractedSkills.length > 0}
            <div style="margin-top:14px">
              <div class="lev-col-lbl">{$t('concierge.new.lev.skills')}</div>
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
              style="margin-top:16px;padding-top:14px;border-top:1px solid rgb(var(--cg-fg-rgb) / calc(.05 * var(--cg-fg-k)))"
            >
              <div class="lev-col-lbl" style="margin-bottom:8px">
                {$t('concierge.new.lev.existing')}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                {#each matchedMissions as m (m.id)}
                  <div
                    style="padding:8px 10px;border-radius:9px;background:rgb(var(--cg-mint-rgb) / .04);border:1px solid rgb(var(--cg-mint-rgb) / .16);font-family:'Bellefair',serif;font-size:12.5px;color:var(--cg-ink)"
                  >
                    {m.name}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Ready products that answer the wish (nearest first) -->
          {#if matchedProducts.length > 0}
            <div
              style="margin-top:16px;padding-top:14px;border-top:1px solid rgb(var(--cg-fg-rgb) / calc(.05 * var(--cg-fg-k)))"
            >
              <div class="lev-col-lbl" style="margin-bottom:8px">
                {$t('concierge.new.lev.products', {
                  count: matchedProducts.length
                })}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                {#each matchedProducts as m (m.id)}
                  <div
                    style="padding:8px 10px;border-radius:9px;background:rgb(var(--cg-pink-rgb) / .04);border:1px solid rgb(var(--cg-pink-rgb) / .16)"
                  >
                    <div
                      style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"
                    >
                      <span
                        style="font-family:'Bellefair',serif;font-size:12.5px;color:var(--cg-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                        >{m.name}</span
                      >
                      {#if m.pricingMode === 'quote'}
                        <span
                          style="font-size:11px;color:var(--cg-goldhi);white-space:nowrap"
                          >{$t('concierge.new.lev.byQuote')}</span
                        >
                      {:else if typeof m.price === 'number' && m.price > 0}
                        <span
                          style="font-size:11px;color:var(--cg-goldhi);white-space:nowrap"
                          >{fmtMoney(m.price)}</span
                        >
                      {/if}
                    </div>
                    {#if m.projectName || m.distanceKm != null}
                      <div
                        style="font-size:10.5px;color:var(--cg-muted);margin-top:2px"
                      >
                        {m.projectName || ''}{m.projectName &&
                        m.distanceKm != null
                          ? ' · '
                          : ''}{m.distanceKm != null
                          ? $t('concierge.km_away', { distance: m.distanceKm })
                          : ''}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Available resources (free Sp instances) that match -->
          {#if matchedResources.length > 0}
            <div
              style="margin-top:16px;padding-top:14px;border-top:1px solid rgb(var(--cg-fg-rgb) / calc(.05 * var(--cg-fg-k)))"
            >
              <div class="lev-col-lbl" style="margin-bottom:8px">
                {$t('concierge.new.lev.freeResources', {
                  count: matchedResources.length
                })}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                {#each matchedResources as r (r.id)}
                  <div
                    style="padding:8px 10px;border-radius:9px;background:rgb(var(--cg-gold-rgb) / .04);border:1px solid rgb(var(--cg-gold-rgb) / .16)"
                  >
                    <div
                      style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"
                    >
                      <span
                        style="font-family:'Bellefair',serif;font-size:12.5px;color:var(--cg-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                        >{r.name}</span
                      >
                      {#if typeof r.price === 'number' && r.price > 0}
                        <span
                          style="font-size:11px;color:var(--cg-goldhi);white-space:nowrap"
                          >{fmtMoney(r.price)}</span
                        >
                      {/if}
                    </div>
                    {#if r.ownerName || r.project}
                      <div
                        style="font-size:10.5px;color:var(--cg-muted);margin-top:2px"
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
              style="margin-top:16px;padding-top:14px;border-top:1px solid rgb(var(--cg-fg-rgb) / calc(.05 * var(--cg-fg-k)))"
            >
              <div class="lev-col-lbl" style="margin-bottom:8px">
                {$t('concierge.new.lev.people', { count: matchedPeople.length })}
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                {#each matchedPeople as p (p.id)}
                  <div
                    style="display:flex;gap:9px;align-items:center;padding:8px 10px;border-radius:10px;background:rgb(var(--cg-sky-rgb) / .04);border:1px solid rgb(var(--cg-sky-rgb) / .16)"
                  >
                    {#if anon}
                      <span
                        style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgb(var(--cg-sky-rgb) / .12);color:var(--cg-sky);font-size:12px;flex-shrink:0"
                        aria-label={$t('concierge.new.lev.hiddenIdentity')}
                        ><EntityIcon kind="private" size={12} /></span
                      >
                    {:else if p.avatar}
                      <img
                        src={p.avatar}
                        alt={p.username}
                        style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1px solid rgb(var(--cg-sky-rgb) / .4);flex-shrink:0"
                      />
                    {:else}
                      <span
                        style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgb(var(--cg-sky-rgb) / .12);color:var(--cg-sky);font-size:12px;flex-shrink:0"
                        >{(p.username || '?').slice(0, 2)}</span
                      >
                    {/if}
                    <div style="min-width:0;flex:1">
                      <div
                        style="font-family:'Bellefair',serif;font-size:13px;color:var(--cg-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                      >
                        {anon ? '••••••••' : p.username}
                      </div>
                      {#if p.matchedSkills.length > 0 || p.distanceKm != null}
                        <div
                          style="font-size:10.5px;color:var(--cg-sky);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                        >
                          {[
                            ...p.matchedSkills,
                            ...(p.distanceKm != null
                              ? [$t('concierge.km_away', { distance: p.distanceKm })]
                              : [])
                          ].join(' · ')}
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
              style="margin-top:18px;padding-top:16px;border-top:1px solid rgb(var(--cg-fg-rgb) / calc(.05 * var(--cg-fg-k)))"
            >
              <div class="lev-col-lbl" style="margin-bottom:10px">
                {$t('concierge.new.lev.hints')}
              </div>
              <div style="display:flex;flex-direction:column;gap:10px">
                {#each extractedHints as hint (hint.text)}
                  <div
                    style="padding:10px 12px;border-radius:10px;background:{hint.kind ===
                    'question'
                      ? 'rgb(var(--cg-gold-rgb) / .05)'
                      : 'rgb(var(--cg-sky-rgb) / .04)'};border:1px solid {hint.kind ===
                    'question'
                      ? 'rgb(var(--cg-gold-rgb) / .15)'
                      : 'rgb(var(--cg-sky-rgb) / .15)'};display:flex;gap:8px"
                  >
                    <span
                      style="font-size:11px;color:{hint.kind === 'question'
                        ? 'var(--cg-goldhi)'
                        : 'var(--cg-sky)'};margin-top:1px"
                      >{hint.kind === 'question' ? '?' : '✶'}</span
                    >
                    <div
                      style="font-family:'Bellefair',serif;font-size:12.5px;color:var(--cg-ink);line-height:1.5"
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
            style="margin-top:16px;padding:10px 12px;background:rgb(var(--cg-fg-rgb) / calc(.02 * var(--cg-fg-k)));border:1px solid rgb(var(--cg-fg-rgb) / calc(.06 * var(--cg-fg-k)));border-radius:10px;display:flex;gap:10px;align-items:flex-start"
          >
            <EntityIcon kind="private" size={13} />
            <div
              style="font-family:'Bellefair',serif;font-size:11.5px;color:var(--cg-muted);line-height:1.55"
            >
              {$t('concierge.new.lev.privacy')}
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
            <div class="modal-eyebrow">
              {$t('concierge.new.locationModal.eyebrow')}
            </div>
            <h2 id="location-modal-title">
              {$t('concierge.new.locationModal.title')}
            </h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label={$t('concierge.new.locationModal.closeAria')}
            onclick={closeLocationModal}>×</button
          >
        </div>

        <LocationPicker
          bind:value={location}
          label={$t('concierge.new.locationModal.label')}
          helper={$t('concierge.new.locationModal.helper')}
          height="420px"
        />

        <div class="location-modal-actions">
          <button class="btn-ghost" type="button" onclick={closeLocationModal}
            >{$t('concierge.new.close')}</button
          >
          <button
            class="btn-jewel modal-save"
            type="button"
            onclick={closeLocationModal}
            >{$t('concierge.new.locationModal.save')}</button
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
              <EntityIcon kind={DETAIL_JEWELS[editingJewel].icon} size={13} /> · {$t(
                `concierge.new.jewels.${DETAIL_JEWELS[editingJewel].key}.label`
              )}
            </div>
            <h2 id="jewel-modal-title">
              {editingJewel === 0
                ? $t('concierge.new.modal.when')
                : editingJewel === 2
                  ? $t('concierge.new.modal.budget')
                  : editingJewel === 3
                    ? $t('concierge.new.modal.whoCanOffer')
                    : editingJewel === 4
                      ? $t('concierge.new.modal.whoCanSee')
                      : editingJewel === 5
                        ? $t('concierge.new.modal.invite')
                        : $t('concierge.new.modal.joinKind')}
            </h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label={$t('concierge.new.close')}
            onclick={closeJewelModal}>×</button
          >
        </div>

        <div class="jewel-modal-body">
          {#if editingJewel === 0}
            <!-- When -->
            <div class="field-grid">
              <label class="field">
                <span class="field-lbl">{$t('concierge.new.dateFrom')}</span>
                <input type="date" bind:value={startDate} class="field-inp" />
              </label>
              <label class="field">
                <span class="field-lbl">{$t('concierge.new.dateTo')}</span>
                <input type="date" bind:value={finnishDate} class="field-inp" />
              </label>
            </div>
            <div class="presets">
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(0)}
                >{$t('concierge.new.preset.today')}</button
              >
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(1)}
                >{$t('concierge.new.preset.tomorrow')}</button
              >
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(7)}
                >{$t('concierge.new.preset.week')}</button
              >
              <button
                type="button"
                class="preset-pill"
                onclick={() => setDatePreset(30)}
                >{$t('concierge.new.preset.month')}</button
              >
              <button
                type="button"
                class="preset-pill ghost"
                onclick={clearDates}
                >{$t('concierge.new.preset.clear')}</button
              >
            </div>
            <p class="modal-hint">
              {$t('concierge.new.dateHint')}
            </p>
          {:else if editingJewel === 2}
            <!-- Budget -->
            <label class="field">
              <span class="field-lbl">{$t('concierge.new.budgetLabel')}</span>
              <input
                type="number"
                inputmode="numeric"
                min="0"
                step="50"
                bind:value={budgetAmount}
                placeholder={$t('concierge.new.budgetPlaceholder')}
                class="field-inp"
              />
            </label>
            <div class="presets">
              {#each BUDGET_PRESETS as v (v)}
                <button
                  type="button"
                  class="preset-pill"
                  onclick={() => pickBudgetPreset(v)}
                  >{fmtMoney(v)}</button
                >
              {/each}
              <button
                type="button"
                class="preset-pill ghost"
                onclick={clearBudget}
                >{$t('concierge.new.budgetNoCap')}</button
              >
            </div>
            <p class="modal-hint">
              {$t('concierge.new.budgetHint')}
            </p>
          {:else if editingJewel === 3}
            <!-- Who can offer -->
            <div class="radio-list">
              {#each WHO_CAN_OFFER_OPTIONS as opt (opt.key)}
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
                    <div class="radio-label">
                      {$t(`concierge.new.whoCanOffer.${opt.key}.label`)}
                    </div>
                    <div class="radio-hint">
                      {$t(`concierge.new.whoCanOffer.${opt.key}.hint`)}
                    </div>
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
                    <div class="radio-label">
                      {$t(`concierge.new.whoCanSee.${opt.value}.label`)}
                    </div>
                    <div class="radio-hint">
                      {$t(`concierge.new.whoCanSee.${opt.value}.hint`)}
                    </div>
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
                    <div class="radio-label">
                      {$t(`concierge.new.invitePartners.${opt.value}.label`)}
                    </div>
                    <div class="radio-hint">
                      {$t(`concierge.new.invitePartners.${opt.value}.hint`)}
                    </div>
                  </div>
                </label>
              {/each}
            </div>
            <p class="modal-hint">
              {$t('concierge.new.inviteHint')}
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
                    <div class="radio-label">
                      {$t(`concierge.new.joinKind.${opt.value}.label`)}
                    </div>
                    <div class="radio-hint">
                      {$t(`concierge.new.joinKind.${opt.value}.hint`)}
                    </div>
                  </div>
                </label>
              {/each}
            </div>

            {#if isGroupKind}
              <div class="field-grid" style="margin-top:14px">
                <label class="field">
                  <span class="field-lbl">{$t('concierge.new.minJoiners')}</span
                  >
                  <input
                    type="number"
                    inputmode="numeric"
                    min="1"
                    step="1"
                    bind:value={minJoiners}
                    placeholder={$t('concierge.new.minJoinersPlaceholder')}
                    class="field-inp"
                  />
                </label>
                <label class="field">
                  <span class="field-lbl">{$t('concierge.new.maxJoiners')}</span
                  >
                  <input
                    type="number"
                    inputmode="numeric"
                    min="1"
                    step="1"
                    bind:value={maxJoiners}
                    placeholder={$t('concierge.new.maxJoinersPlaceholder')}
                    class="field-inp"
                  />
                </label>
              </div>
              <label class="field" style="margin-top:10px">
                <span class="field-lbl">{$t('concierge.new.joinDeadline')}</span
                >
                <input
                  type="date"
                  bind:value={joinDeadline}
                  class="field-inp"
                />
              </label>
              <p class="modal-hint">
                {$t('concierge.new.groupHint', { count: minJoiners || 1 })}
              </p>
            {:else}
              <p class="modal-hint">
                {$t('concierge.new.soloHint')}
              </p>
            {/if}
          {/if}
        </div>

        <div class="location-modal-actions">
          <button class="btn-ghost" type="button" onclick={closeJewelModal}
            >{$t('concierge.new.close')}</button
          >
          <button
            class="btn-jewel modal-save"
            type="button"
            onclick={closeJewelModal}>{$t('concierge.new.save')}</button
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
    background: var(--cg-bg);
    color: var(--cg-ink);
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
        rgb(var(--cg-amber-rgb) / 0.1) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 60% 65% at 90% 110%,
        rgb(var(--cg-pinkd-rgb) / 0.09) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 50% 40% at 50% 50%,
        rgb(var(--cg-mint-rgb) / 0.035) 0%,
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
    background: rgb(var(--cg-bg-rgb) / 0.84);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgb(var(--cg-amber-rgb) / 0.2);
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
    box-shadow: 0 0 14px rgb(var(--cg-gold-rgb) / 0.4);
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
    background: var(--cg-mint);
    box-shadow: 0 0 10px var(--cg-mint);
  }
  .hdr-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(13px, 3vw, 18px);
    color: var(--cg-gold2);
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .hdr-sub {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: var(--cg-muted);
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
    background: rgb(var(--cg-s2-rgb) / 0.96);
    border: 1px solid rgb(var(--cg-pink-rgb) / 0.4);
    box-shadow: 0 12px 40px rgb(var(--cg-shade-rgb) / calc(0.5 * var(--cg-shade-k)));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .nav-notice-txt {
    font-family: 'Bellefair', serif;
    font-size: 13.5px;
    color: var(--cg-ink);
  }
  .nav-notice-reg {
    padding: 6px 14px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-weight: 700;
    font-size: 13px;
    color: var(--cg-on-cta);
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
    white-space: nowrap;
  }
  .nav-notice-x {
    background: none;
    border: none;
    color: var(--cg-muted);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
  }
  .nav-lnk {
    font-size: 13px;
    color: var(--cg-muted);
    text-decoration: none;
    letter-spacing: 0.02em;
  }
  .nav-act {
    color: var(--cg-goldhi);
    text-shadow: 0 0 12px rgb(var(--cg-gold-rgb) / 0.4);
  }
  .hdr-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .hdr-register {
    padding: 8px 18px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--cg-on-cta);
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
    box-shadow: 0 6px 20px rgb(var(--cg-pinkd-rgb) / 0.4);
    white-space: nowrap;
    transition: transform 0.2s;
  }
  .hdr-register:hover {
    transform: translateY(-1px);
  }
  .notif-btn {
    position: relative;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--cg-s2);
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    cursor: pointer;
    font-size: 14px;
    color: var(--cg-goldhi);
  }
  .notif-pip {
    position: absolute;
    top: 6px;
    left: 6px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--cg-pink);
    box-shadow: 0 0 8px var(--cg-pink);
  }
  .av-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid var(--cg-gold);
    background: linear-gradient(135deg, var(--cg-g-s3), var(--cg-g-s4));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--cg-gold2);
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
    color: var(--cg-muted2);
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
    background: rgb(var(--cg-fg-rgb) / calc(0.04 * var(--cg-fg-k)));
    color: var(--cg-muted2);
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.12 * var(--cg-fg-k)));
    flex-shrink: 0;
  }
  .step.active .step-dot {
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
    color: var(--cg-on-cta);
    border-color: rgb(var(--cg-pink-rgb) / 0.5);
    box-shadow: 0 0 18px rgb(var(--cg-pink-rgb) / 0.5);
  }
  .step.active {
    color: var(--cg-pink);
  }
  .step.done .step-dot {
    background: rgb(var(--cg-mint-rgb) / 0.14);
    color: var(--cg-mint);
    border-color: rgb(var(--cg-mint-rgb) / 0.4);
  }
  .step.done {
    color: var(--cg-mint);
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
    background: rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k)));
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
    color: var(--cg-on-cta);
    white-space: nowrap;
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
    box-shadow:
      inset 1px 1px 0 rgb(var(--cg-fg-rgb) / calc(0.25 * var(--cg-fg-k))),
      inset -1px -1px 0 rgb(var(--cg-shade-rgb) / calc(0.4 * var(--cg-shade-k))),
      0 6px 20px rgb(var(--cg-pinkd-rgb) / 0.4);
    transition: transform 0.2s;
  }
  .btn-jewel:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.1 * var(--cg-fg-k)));
    color: var(--cg-muted);
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
    color: var(--cg-ink);
    border-color: rgb(var(--cg-gold-rgb) / 0.3);
    background: rgb(var(--cg-gold-rgb) / 0.04);
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
    background: linear-gradient(135deg, var(--cg-g-pink), var(--cg-g-pinkd));
    transform: rotate(45deg);
    box-shadow: 0 0 12px rgb(var(--cg-pink-rgb) / 0.7);
    flex-shrink: 0;
  }
  .gem-gold {
    background: linear-gradient(135deg, var(--cg-g-goldhi), var(--cg-g-metal-d));
    box-shadow: 0 0 12px rgb(var(--cg-gold-rgb) / 0.7);
  }

  /* ── Section label ── */
  .section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--cg-muted);
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
      rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k))),
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
    background: rgb(var(--cg-fg-rgb) / calc(0.04 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k)));
    color: var(--cg-ink);
  }
  .chip.must {
    background: rgb(var(--cg-pink-rgb) / 0.1);
    border-color: rgb(var(--cg-pink-rgb) / 0.35);
    color: var(--cg-pink);
  }
  .chip.nice {
    background: rgb(var(--cg-gold-rgb) / 0.07);
    border-color: rgb(var(--cg-gold-rgb) / 0.25);
    color: var(--cg-goldhi);
  }

  /* ── Opening incantation ── */
  .incant-rule {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.36em;
    text-transform: uppercase;
    color: var(--cg-muted);
    margin-bottom: 12px;
  }
  .incant-h1 {
    margin: 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(28px, 8vw, 44px);
    font-weight: 700;
    line-height: 1.1;
    color: var(--cg-ink);
  }
  .incant-p {
    margin: 14px auto 0;
    font-family: 'Bellefair', serif;
    font-size: clamp(14px, 2.5vw, 17px);
    color: var(--cg-muted);
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
    background: rgb(var(--cg-fg-rgb) / calc(0.02 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: start;
  }
  .seed-card:hover {
    border-color: rgb(var(--cg-gold-rgb) / 0.32);
    background: rgb(var(--cg-gold-rgb) / 0.04);
    transform: translateY(-1px);
  }
  .seed-icon {
    font-size: 17px;
    opacity: 0.95;
  }
  .seed-label {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: var(--cg-ink);
    line-height: 1.2;
  }
  .seed-hint {
    font-size: 11.5px;
    /* #52493e sat at 2.3:1 against the near-black page — unreadable. */
    color: var(--cg-muted);
    margin-top: 3px;
    line-height: 1.35;
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
        rgb(var(--cg-gold-rgb) / 0.04) 0%,
        rgb(var(--cg-bg-rgb) / 0) 30%
      ),
      linear-gradient(180deg, rgb(var(--cg-pink-rgb) / 0.025), rgb(var(--cg-bg-rgb) / 0)),
      var(--cg-s1);
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.2);
    box-shadow:
      0 0 0 1px rgb(var(--cg-gold-rgb) / 0.06) inset,
      0 30px 80px rgb(var(--cg-shade-rgb) / calc(0.4 * var(--cg-shade-k)));
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
    background: linear-gradient(135deg, var(--cg-g-goldhi), var(--cg-g-metal-d));
    transform: rotate(45deg);
    box-shadow: 0 0 14px rgb(var(--cg-gold-rgb) / 0.7);
    border-radius: 2px;
  }
  .corner-tl {
    top: -7px;
    inset-inline-start: 22px;
  }
  .corner-tr {
    top: -7px;
    inset-inline-end: 22px;
    background: linear-gradient(135deg, var(--cg-g-pink), var(--cg-g-pinkd));
    box-shadow: 0 0 14px rgb(var(--cg-pink-rgb) / 0.7);
  }
  .corner-bl {
    bottom: -7px;
    inset-inline-start: 22px;
    background: linear-gradient(135deg, var(--cg-g-pink), var(--cg-g-pinkd));
    box-shadow: 0 0 14px rgb(var(--cg-pink-rgb) / 0.7);
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
    border-bottom: 1px solid rgb(var(--cg-gold-rgb) / 0.18);
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(22px, 5vw, 32px);
    font-weight: 700;
    color: var(--cg-ink);
    line-height: 1.2;
    transition: border-color 0.2s;
  }
  .wish-title-inp::placeholder {
    color: var(--cg-muted2);
    font-weight: 400;
    font-family: 'Bellefair', serif;
  }
  .wish-title-inp:focus {
    border-bottom-color: rgb(var(--cg-gold-rgb) / 0.5);
  }

  /* ── RichText inside dark scroll-frame ──
     The frame is dark parchment in every theme, but RichText picks its palette
     from <html>: business·light handed it a white toolbar and navy bold text
     and headings (#0f172a on #0f0d0b), personal·light a #43303a bold. Pin its
     tokens to the dark set here. The selector is long for weight: RichText's
     `html.personal.dark .editor-wrapper` is 0,4,1, and Svelte 5 scopes only
     the first class here — the rest are `:where()`, worth nothing. */
  .scroll-frame .rich-body-wrap :global(.editor-wrapper.rt-trans),
  .scroll-frame .rich-body-wrap :global(.tiptap-content .bubble-menu) {
    --barbi-pink: var(--cg-pink);
    --rt-radius: 12px;
    --rt-shadow: 0 6px 18px rgb(var(--cg-shade-rgb) / calc(0.5 * var(--cg-shade-k)));
    --rt-line: rgb(var(--cg-gold-rgb) / 0.28);
    --rt-line-soft: rgb(var(--cg-gold-rgb) / 0.14);
    --rt-wash: transparent;
    --rt-toolbar-bg: rgb(var(--cg-gold-rgb) / 0.035);
    --rt-ring: rgb(var(--cg-goldhi-rgb) / 0.12);
    --rt-pop-bg: var(--cg-s3);
    --rt-pop-ink: var(--cg-ink);
    --rt-btn-ink: var(--cg-ink2b);
    --rt-btn-hover-bg: rgb(var(--cg-gold-rgb) / 0.12);
    --rt-btn-hover-ink: var(--cg-goldhi);
    --rt-accent: var(--cg-pink);
    --rt-accent-ink: var(--cg-on-pink);
    --rt-accent-shadow: none;
    --rt-body-ink: var(--cg-ink);
    --rt-head-ink: var(--cg-goldhi);
    --rt-strong-ink: var(--cg-ink-max);
    --rt-link-ink: var(--cg-pink-l);
    --rt-muted: var(--cg-muted);
    --rt-quote-bg: rgb(var(--cg-gold-rgb) / 0.07);
    --rt-quote-rule: var(--cg-gold3);
  }
  /* The writing area reads as a field: framed, lifted on focus. It used to be
     a borderless strip under a toolbar, and nothing said "type here". */
  .scroll-frame .rich-body-wrap :global(.editor-wrapper) {
    margin-top: 18px;
    background: rgb(var(--cg-fg-rgb) / calc(0.025 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.16);
    border-radius: 12px;
    box-shadow: none;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .scroll-frame .rich-body-wrap :global(.editor-wrapper:focus-within) {
    border-color: rgb(var(--cg-goldhi-rgb) / 0.5);
    box-shadow: 0 0 0 3px rgb(var(--cg-goldhi-rgb) / 0.1);
  }
  .rich-body-wrap :global(.rt-toolbar) {
    padding: 6px 10px;
  }
  .rich-body-wrap :global(.tiptap-content) {
    min-height: 160px;
    padding: 14px 16px 8px;
  }
  .rich-body-wrap :global(.tiptap-content .ProseMirror) {
    min-height: 138px;
  }
  .rich-body-wrap :global(.rt-placeholder) {
    color: var(--cg-muted2);
    font-family: 'Bellefair', serif;
    font-size: clamp(14px, 2vw, 17px);
    line-height: 1.7;
  }
  .rich-body-wrap :global(.custom-prose p) {
    font-size: inherit;
  }
  .rich-body-wrap :global(.custom-prose) {
    color: var(--cg-ink) !important;
    font-family: 'Bellefair', serif !important;
    font-size: clamp(14px, 2vw, 17px) !important;
    line-height: 1.7 !important;
  }
  .rich-body-wrap :global(.custom-prose p.is-editor-empty:first-child::before) {
    color: var(--cg-muted2);
    content: attr(data-placeholder);
    /* `right` pinned the placeholder to the wrong edge in LTR locales. */
    float: inline-start;
    pointer-events: none;
    height: 0;
  }
  .rich-body-wrap :global(button) {
    color: var(--cg-ink2);
  }
  .rich-body-wrap :global(button:hover) {
    color: var(--cg-goldhi);
    background: rgb(var(--cg-gold-rgb) / 0.08) !important;
    border-color: rgb(var(--cg-gold-rgb) / 0.25) !important;
  }
  .rich-body-wrap :global(button.active) {
    background: rgb(var(--cg-pink-rgb) / 0.25) !important;
    color: var(--cg-pink) !important;
    border-color: rgb(var(--cg-pink-rgb) / 0.4) !important;
    box-shadow: none !important;
  }
  .rich-body-wrap :global(.w-px.bg-gold\/50) {
    background: rgb(var(--cg-gold-rgb) / 0.2);
  }

  .wish-body-inp {
    width: 100%;
    box-sizing: border-box;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Bellefair', serif;
    font-size: clamp(14px, 2vw, 17px);
    color: var(--cg-ink);
    line-height: 1.7;
    resize: vertical;
    min-height: 160px;
  }
  .wish-body-inp::placeholder {
    color: var(--cg-muted2);
    line-height: 1.7;
  }

  .scroll-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    border-top: 1px solid rgb(var(--cg-gold-rgb) / 0.12);
    padding-top: 12px;
  }
  .tool-btn {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgb(var(--cg-fg-rgb) / calc(0.03 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    color: var(--cg-ink2);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  .tool-btn:hover {
    background: rgb(var(--cg-gold-rgb) / 0.1);
    border-color: rgb(var(--cg-gold-rgb) / 0.3);
    color: var(--cg-goldhi);
    transform: translateY(-1px);
  }
  .tool-btn:focus-visible {
    outline: 2px solid var(--cg-goldhi);
    outline-offset: 2px;
  }
  /* recording */
  .tool-btn.tool-live {
    background: rgb(var(--cg-pink-rgb) / 0.2);
    border-color: rgb(var(--cg-pink-rgb) / 0.6);
    color: var(--cg-pink);
    animation: tool-pulse 1.4s ease-in-out infinite;
  }
  /* waiting on Lev */
  .tool-btn.tool-busy {
    cursor: progress;
    color: var(--cg-goldhi);
    animation: tool-pulse 1s ease-in-out infinite;
  }
  @keyframes tool-pulse {
    50% {
      box-shadow: 0 0 0 4px rgb(var(--cg-pink-rgb) / 0.15);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tool-btn.tool-live,
    .tool-btn.tool-busy {
      animation: none;
    }
  }

  .word-gauge {
    width: 70px;
    height: 4px;
    border-radius: 999px;
    background: rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    overflow: hidden;
  }
  .word-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cg-g-pinkd), var(--cg-g-goldhi), var(--cg-g-mint));
    transition: width 0.3s;
    border-radius: 999px;
    box-shadow: 0 0 10px rgb(var(--cg-gold-rgb) / 0.4);
  }

  /* ── Subsection heading ── */
  .subsection {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--cg-goldhi);
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
      rgb(var(--cg-gold-rgb) / 0.18)
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
    background: rgb(var(--cg-fg-rgb) / calc(0.02 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: start;
  }
  .detail-jewel:hover {
    background: rgb(var(--cg-gold-rgb) / 0.04);
    border-color: rgb(var(--cg-gold-rgb) / 0.25);
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
    border: 1px solid rgb(var(--cg-sky-rgb) / 0.08);
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
    color: var(--cg-muted);
  }
  /* "Lev filled this in from your text" */
  .lev-mark {
    margin-inline-start: 6px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgb(var(--cg-goldhi-rgb) / 0.12);
    color: var(--cg-goldhi);
    letter-spacing: 0.06em;
    text-transform: none;
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
    background: rgb(var(--cg-bg-rgb) / 0.78);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .location-modal {
    width: min(940px, 100%);
    max-height: min(88vh, 860px);
    overflow: auto;
    border-radius: 20px;
    border: 1px solid rgb(var(--cg-sky-rgb) / 0.28);
    background:
      linear-gradient(
        180deg,
        rgb(var(--cg-sky-rgb) / 0.06),
        rgb(var(--cg-bg-rgb) / 0.98) 26%
      ),
      var(--cg-s1);
    box-shadow:
      0 24px 80px rgb(var(--cg-shade-rgb) / calc(0.62 * var(--cg-shade-k))),
      0 0 0 1px rgb(var(--cg-fg-rgb) / calc(0.04 * var(--cg-fg-k))) inset;
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
    color: var(--cg-sky);
  }
  .location-modal h2 {
    margin: 2px 0 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(20px, 5vw, 28px);
    line-height: 1.15;
    color: var(--cg-ink);
  }
  .modal-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.1 * var(--cg-fg-k)));
    background: rgb(var(--cg-fg-rgb) / calc(0.03 * var(--cg-fg-k)));
    color: var(--cg-ink2);
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
  }
  .modal-close:hover {
    border-color: rgb(var(--cg-gold-rgb) / 0.32);
    color: var(--cg-goldhi);
    background: rgb(var(--cg-gold-rgb) / 0.06);
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
    color: var(--cg-muted);
  }
  .field-inp {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    background: rgb(var(--cg-fg-rgb) / calc(0.03 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.18);
    color: var(--cg-ink);
    border-radius: 10px;
    font-family: 'Bellefair', serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .field-inp:focus {
    border-color: rgb(var(--cg-gold-rgb) / 0.4);
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
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.22);
    background: rgb(var(--cg-gold-rgb) / 0.05);
    color: var(--cg-goldhi);
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    transition: all 0.2s;
  }
  .preset-pill:hover {
    border-color: rgb(var(--cg-gold-rgb) / 0.5);
    background: rgb(var(--cg-gold-rgb) / 0.1);
  }
  .preset-pill.ghost {
    background: transparent;
    border-color: rgb(var(--cg-fg-rgb) / calc(0.1 * var(--cg-fg-k)));
    color: var(--cg-muted);
  }
  .preset-pill.ghost:hover {
    color: var(--cg-ink);
    border-color: rgb(var(--cg-gold-rgb) / 0.3);
  }

  .modal-hint {
    margin: 0;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: var(--cg-muted);
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
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    background: rgb(var(--cg-fg-rgb) / calc(0.02 * var(--cg-fg-k)));
    border-radius: 12px;
    transition: all 0.2s;
  }
  .radio-row:hover {
    border-color: rgb(var(--cg-gold-rgb) / 0.25);
  }
  .radio-row.on {
    border-color: rgb(var(--cg-pink-rgb) / 0.5);
    background: rgb(var(--cg-pink-rgb) / 0.06);
    box-shadow: 0 0 14px rgb(var(--cg-pink-rgb) / 0.1);
  }
  .radio-row input[type='radio'] {
    accent-color: var(--cg-pink);
    margin-top: 3px;
    flex-shrink: 0;
  }
  .radio-label {
    font-family: 'Bellefair', serif;
    font-size: 14px;
    color: var(--cg-ink);
  }
  .radio-hint {
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: var(--cg-muted);
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
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k)));
    background: transparent;
    color: var(--cg-muted);
    font-family: 'Bellefair', serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .val-pill.on {
    border-color: rgb(var(--cg-pink-rgb) / 0.5);
    background: rgb(var(--cg-pink-rgb) / 0.12);
    color: var(--cg-pink);
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
        rgb(var(--cg-gold-rgb) / 0.06),
        transparent 60%
      ),
      radial-gradient(
        120% 80% at 100% 100%,
        rgb(var(--cg-pinkd-rgb) / 0.08),
        transparent 60%
      ),
      var(--cg-s1);
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.22);
    gap: 14px;
    flex-wrap: wrap;
  }
  .pub-dot {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--cg-g-s3), var(--cg-g-s4));
    border: 2px solid rgb(var(--cg-gold-rgb) / 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: var(--cg-dim);
    transition: all 0.3s;
  }
  .pub-dot.ready {
    background: linear-gradient(135deg, var(--cg-g-mint), var(--cg-g-mintd));
    border-color: var(--cg-mint);
    color: var(--cg-on-mint);
    box-shadow: 0 0 18px rgb(var(--cg-mint-rgb) / 0.5);
  }
  .pub-status {
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: 17px;
    color: var(--cg-ink);
  }
  .pub-hint {
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: var(--cg-muted);
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
    color: var(--cg-goldhi);
    text-align: start;
    background: linear-gradient(135deg, rgb(var(--cg-pinkd-rgb) / 0.18), rgb(var(--cg-pink-rgb) / 0.1));
    border: 1px solid rgb(var(--cg-pink-rgb) / 0.4);
    box-shadow: 0 0 18px rgb(var(--cg-pink-rgb) / 0.12);
    transition: all 0.2s;
  }
  .anon-cta:hover {
    border-color: rgb(var(--cg-pink-rgb) / 0.7);
    transform: translateY(-1px);
  }

  /* ── Lev rail ── */
  .lev-rail {
    background: var(--cg-s2);
    border: 1px solid rgb(var(--cg-sky-rgb) / 0.18);
    border-radius: 20px;
    padding: 18px;
    box-shadow: 0 0 30px rgb(var(--cg-sky-rgb) / 0.06);
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
    color: var(--cg-muted);
    margin-bottom: 6px;
  }

  /* ── Customer track: welcome after signup + the automatic send ── */
  .welcome-note {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 18px auto 0;
    max-width: 640px;
    padding: 14px 16px;
    border-radius: 16px;
    background: linear-gradient(
      135deg,
      rgb(var(--cg-amber-rgb) / 0.16),
      rgb(var(--cg-pink-rgb) / 0.08)
    );
    border: 1px solid rgb(var(--cg-goldhi-rgb) / 0.35);
  }
  .welcome-icon {
    flex: none;
    margin-top: 2px;
    color: var(--cg-goldhi);
  }
  .welcome-title {
    font-family: 'Bellefair', serif;
    font-size: 17px;
    color: var(--cg-goldhi);
  }
  .welcome-sub {
    margin-top: 2px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cg-ink2b);
  }
  .welcome-close {
    margin-inline-start: auto;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: var(--cg-ink2b);
    font-size: 18px;
    line-height: 1;
  }
  .welcome-close:hover {
    background: rgb(var(--cg-goldhi-rgb) / 0.12);
    color: var(--cg-goldhi);
  }
  .autosend {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgb(var(--cg-s1-rgb) / 0.82);
    backdrop-filter: blur(6px);
  }
  .autosend-card {
    width: min(360px, 100%);
    padding: 28px 24px;
    border-radius: 22px;
    text-align: center;
    background: var(--cg-s2);
    border: 1px solid rgb(var(--cg-goldhi-rgb) / 0.3);
    box-shadow: 0 20px 60px rgb(var(--cg-shade-rgb) / calc(0.5 * var(--cg-shade-k)));
  }
  .autosend-coin {
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    animation: autosend-pulse 1.6s ease-in-out infinite;
  }
  .autosend-title {
    font-family: 'Bellefair', serif;
    font-size: 21px;
    color: var(--cg-goldhi);
  }
  .autosend-sub {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cg-ink2b);
  }
  .autosend-bar {
    position: relative;
    height: 3px;
    margin-top: 18px;
    overflow: hidden;
    border-radius: 3px;
    background: rgb(var(--cg-goldhi-rgb) / 0.15);
  }
  .autosend-bar span {
    position: absolute;
    inset-block: 0;
    width: 40%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--cg-g-metal-a), var(--cg-g-metal-b), var(--cg-g-metal-c));
    animation: autosend-slide 1.3s ease-in-out infinite;
  }
  @keyframes autosend-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.08);
    }
  }
  @keyframes autosend-slide {
    from {
      inset-inline-start: -40%;
    }
    to {
      inset-inline-start: 100%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .autosend-coin,
    .autosend-bar span {
      animation: none;
    }
  }
</style>
