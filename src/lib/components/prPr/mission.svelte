<script>
  import { isRtl } from '$lib/translations';
  import Daterange from './../../celim/ui/daterange.svelte';
  import Crtask from '$lib/components/prPr/tasks/crtask.svelte';
  import ExpandTask from '$lib/components/prPr/tasks/expandTask.svelte';
  import { mi, skil, ww, role } from './mi.js';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly, slide } from 'svelte/transition';
  import Close from '$lib/celim/close.svelte';
  import moment from 'moment';
  import { toast } from 'svelte-sonner';
  import { confettiStore } from '$lib/stores/confettiStore';
  import { onMount, untrack } from 'svelte';
  let myDate = '11:00';
  import MultiSelect from 'svelte-multiselect';
  import { lang } from '$lib/stores/lang.js';
  import heMission from '$lib/translations/he/mission.json';
  import enMission from '$lib/translations/en/mission.json';
  import arMission from '$lib/translations/ar/mission.json';
  import SkillSelector from '../ui/SkillSelector.svelte';
  import RoleSelector from '../ui/RoleSelector.svelte';
  import { t as trans } from '$lib/translations';
  import { get } from 'svelte/store';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { quintOut } from 'svelte/easing';
  import { executeAction } from '$lib/client/actionClient';
  import Button from '$lib/celim/ui/button.svelte';
  // AI suggest / improve / translate
  let aiSuggesting = $state(false);
  let aiSuggestResult = $state(null); // { extraction, matchResults, similarMissions }
  let aiApplying = $state(false);
  let aiImproving = $state(false);
  let aiTranslating = $state(false);
  let aiTranslations = $state(null); // { he, en, ar }
  let aiDescUndo = $state(''); // snapshot before improve (for undo)

  async function handleAiSuggest() {
    const name = miData[0].missionName?.trim();
    if (!name) {
      toast.warning(get(trans)('mission.ai.enterNameFirst'));
      return;
    }
    aiSuggesting = true;
    aiSuggestResult = null;
    try {
      const res = await fetch('/api/mission/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          descrip: miData[0].descrip ?? '',
          lang: $lang
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error('suggest failed');
      aiSuggestResult = data;
    } catch (e) {
      toast.error(get(trans)('mission.ai.suggestFailed'));
    } finally {
      aiSuggesting = false;
    }
  }

  /**
   * The names one category of the suggestion offers, de-duplicated.
   *
   * A term the vector store already knows is taken with the catalogue's own
   * spelling (`existingLabel`); everything else keeps what the model wrote.
   * `extraction` is the floor: when the vector store is unavailable the match
   * sections are empty, and the member must still get the model's suggestion.
   */
  function suggestedNames(category, fallback) {
    const out = [];
    const seen = new Set();
    const push = (n) => {
      const name = String(n ?? '').trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return;
      seen.add(key);
      out.push(name);
    };
    for (const r of category?.matched ?? []) push(r.existingLabel ?? r.input);
    for (const r of category?.suggestions ?? []) push(r.existingLabel ?? r.input);
    for (const r of category?.newItems ?? []) push(r.input);
    for (const n of fallback ?? []) push(n);
    return out;
  }

  /**
   * Turn the suggested names into REAL catalogue entries before they become
   * chips.
   *
   * `find_skill_id` & co. map a chip back to an id against the catalogue this
   * component loaded on mount, and drop whatever they cannot find. A skill the
   * model invented has no entry at all, and one whose canonical spelling
   * differs from the model's is not found either — so the chip was shown to
   * the member, survived until submit, and was then silently lost. This is the
   * same resolution step the `?action=createmission` URL path runs before it
   * opens this form; the ids land in `preresolvedVocab`, which the lookups
   * consult first.
   *
   * Best-effort: on failure the plain names are used, which is the old
   * behaviour — some chips resolve, the rest are dropped as before.
   */
  async function resolveSuggestedVocab(names) {
    if (!names.skills.length && !names.roles.length && !names.workways.length) return null;
    // Resolution embeds and may create entries, so it is not instant. Bound it:
    // a slow vector store must delay the chips by seconds, never hang the form.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 12000);
    try {
      const res = await fetch('/api/vocab/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...names,
          name: miData[0].missionName ?? '',
          lang: $lang
        }),
        signal: abort.signal
      });
      if (!res.ok) return null;
      const body = await res.json();
      if (!body?.ok) return null;
      return {
        skills: body.skills ?? [],
        roles: body.roles ?? [],
        workways: body.workways ?? []
      };
    } catch (err) {
      console.warn('[mission] could not resolve AI vocabulary:', err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Add `names` to `current`, keeping what the member already picked. */
  function mergeChips(current, names) {
    const have = new Set((current ?? []).map((n) => String(n).trim().toLowerCase()));
    const added = [];
    for (const n of names) {
      const key = String(n).trim().toLowerCase();
      if (!key || have.has(key)) continue;
      have.add(key);
      added.push(n);
    }
    return [...(current ?? []), ...added];
  }

  async function applyAiSuggestions() {
    if (!aiSuggestResult || aiApplying) return;
    const { extraction, matchResults } = aiSuggestResult;

    const names = {
      skills: suggestedNames(matchResults?.skills, extraction.skills),
      roles: suggestedNames(matchResults?.roles, extraction.roles),
      workways: suggestedNames(matchResults?.workways, extraction.workways)
    };

    aiApplying = true;
    let vocab = null;
    try {
      vocab = await resolveSuggestedVocab(names);
    } finally {
      aiApplying = false;
    }

    // Keep the ids the server resolved, so the chips survive submit even when
    // the entry was created moments ago and this component's catalogue predates
    // it. Merge — an earlier prefill may already hold ids for other chips.
    if (vocab) {
      preresolvedVocab = {
        skills: { ...preresolvedVocab.skills, ...vocabMap(vocab.skills) },
        roles: { ...preresolvedVocab.roles, ...vocabMap(vocab.roles) },
        workways: { ...preresolvedVocab.workways, ...vocabMap(vocab.workways) }
      };
    }

    // Canonical names when resolution succeeded, the model's names otherwise.
    const chipNames = (kind) => {
      const resolved = (vocab?.[kind] ?? []).map((p) => p?.name).filter(Boolean);
      return resolved.length ? resolved : names[kind];
    };

    miData[0].selectedSkills = mergeChips(miData[0].selectedSkills, chipNames('skills'));
    miData[0].selectedRoles = mergeChips(miData[0].selectedRoles, chipNames('roles'));
    miData[0].selectedWorkways = mergeChips(
      miData[0].selectedWorkways,
      chipNames('workways')
    );

    // Improve descrip if empty
    if (
      (!miData[0].descrip ||
        miData[0].descrip === '<p></p>' ||
        miData[0].descrip === '<p><br></p>') &&
      extraction.improvedDescrip
    ) {
      miData[0].descrip = extraction.improvedDescrip;
    }

    // The money row — the AI's estimate of what the mission is worth. Only
    // written while it still holds the value it was opened with: a number the
    // member typed themselves is theirs, and "apply all" must not overwrite it.
    if (Number(extraction?.valph) > 0 && Number(miData[0].valph) === moneyBaseline.valph) {
      miData[0].valph = Number(extraction.valph);
      moneyBaseline.valph = miData[0].valph;
    }
    if (Number(extraction?.nhours) > 0 && Number(miData[0].nhours) === moneyBaseline.nhours) {
      miData[0].nhours = Number(extraction.nhours);
      moneyBaseline.nhours = miData[0].nhours;
    }

    miData = miData;
    aiSuggestResult = null;
    toast.success(
      get(trans)('mission.ai.suggestionsApplied')
    );
  }

  async function handleAiImprove() {
    const text = miData[0].descrip;
    if (!text || text === '<p></p>' || text === '<p><br></p>') {
      toast.warning(get(trans)('mission.ai.writeDescFirst'));
      return;
    }
    aiImproving = true;
    aiDescUndo = text;
    try {
      const res = await fetch('/api/mission/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'improve', lang: $lang })
      });
      const data = await res.json();
      if (!data.ok || !data.improved) throw new Error('improve failed');
      miData[0].descrip = data.improved;
      miData = miData;
      toast.success(get(trans)('mission.ai.descImproved'));
    } catch (e) {
      aiDescUndo = '';
      toast.error(get(trans)('mission.ai.improveFailed'));
    } finally {
      aiImproving = false;
    }
  }

  function undoAiImprove() {
    if (aiDescUndo) {
      miData[0].descrip = aiDescUndo;
      miData = miData;
      aiDescUndo = '';
    }
  }

  async function handleAiTranslate() {
    const text = miData[0].descrip;
    if (!text || text === '<p></p>' || text === '<p><br></p>') {
      toast.warning(get(trans)('mission.ai.writeDescFirst'));
      return;
    }
    aiTranslating = true;
    aiTranslations = null;
    try {
      const res = await fetch('/api/mission/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'translate', lang: $lang })
      });
      const data = await res.json();
      if (!data.ok || !data.translations) throw new Error('translate failed');
      aiTranslations = data.translations;
    } catch (e) {
      toast.error(get(trans)('mission.ai.translateFailed'));
    } finally {
      aiTranslating = false;
    }
  }
  import TextInput from '$lib/celim/ui/input/textInput.svelte';
  import ShiftPlanForm, { emptyShiftPlan } from '$lib/components/shifts/ShiftPlanForm.svelte';
  import { validatePattern } from '$lib/shifts/pattern';
  import InviteResultCard from './InviteResultCard.svelte';
  import { page } from '$app/state';
  import LocationPicker from '$lib/components/location/LocationPicker.svelte';
  import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
  import MissionStipendSection from '$lib/components/stipend/MissionStipendSection.svelte';
  import CurrencyPicker from '$lib/components/money/CurrencyPicker.svelte';
  import CurrencySymbol from '$lib/components/money/CurrencySymbol.svelte';
  import { useMoney, useRikmaCurrency } from '$lib/money/context.svelte';
  import { convert } from '$lib/money/convert.js';
  import { DEFAULT_CURRENCY } from '$lib/money/currencies.js';

  let {
    pu = [],
    vallues = [],
    onClose,
    newcontent = true,
    newcontentR = true,
    newcontentW = true,
    pn,
    pl,
    restime,
    id,
    userslength = 0,
    projectId,
    name = '',
    missionTemplates = [],
    processContext = null,
    /**
     * Spec mode (PLAN_CONCIERGE §5.3): reuse this form to author a *weave-less*
     * mission contract (e.g. a wisher offering a task to a provider). In this
     * mode submit does NOT create a mission in a project — it emits the spec via
     * `onSpec` and the caller persists it. Project-only UI (member assignment)
     * is hidden.
     */
    specMode = false,
    onSpec,
    /**
     * Publish mode (Concierge community publish): like specMode the full form is
     * shown but submit does NOT create a project mission — it emits the authored
     * spec via `onPublish` so the caller publishes a weave-less open-mission to
     * the community. Backward-compatible: active only when publishMode is set.
     */
    publishMode = false,
    onPublish,
    /**
     * Optional prefill for the form:
     * `{ name, descrip, hours|nhours, ratePerHour|valph, skills[], roles[], workways[] }`.
     *
     * Used by two families of callers:
     *  - specMode / publishMode editing (PLAN_CONCIERGE plan editing);
     *  - the AI prefill routes — `?action=createmission` (prepareMissionTool) and
     *    the planning boards (PLAN_PROJECT_PLANNING_BOARDS) — which open the
     *    normal creation form with the AI's suggestion already filled in so the
     *    user reviews and approves it.
     *
     * Vocabulary arrays arrive as plain names, exactly like `applyAiSuggestions`
     * produces them; SkillSelector resolves names → ids on submit.
     */
    initialSpec = null
  } = $props();

  // The hourly value is typed in the proposer's own currency and converted to
  // the rikma's on the server (PLAN_MULTI_CURRENCY C5). Spec/publish modes
  // hand the rate back to a caller that has no rikma, so they stay put.
  const money = useMoney();
  const enclosingRikma = useRikmaCurrency();
  const rikmaCur = $derived(enclosingRikma() ?? DEFAULT_CURRENCY);
  // Starts in the rikma's currency, not the reader's: the field arrives
  // prefilled (a default, an AI suggestion, an edit) with numbers that already
  // are in the rikma's currency, and re-labelling them would silently change
  // their value. The picker sits beside the number for a writer who types in
  // their own.
  let entryCurrency = $state(enclosingRikma() ?? DEFAULT_CURRENCY);
  /** An amount typed in `entryCurrency`, as the rikma will count it — for the equity preview. */
  const inRikma = (/** @type {number} */ n) =>
    entryCurrency === rikmaCur ? n : (convert(n, entryCurrency, rikmaCur, money.fx) ?? n);

  const missionByLang = { he: heMission, en: enMission, ar: arMission };
  const mf = $derived((missionByLang[$lang] ?? missionByLang.he).form);
  const ml = $derived((missionByLang[$lang] ?? missionByLang.he).location);

  let miData = $state([
    {
      selectedSkills: [],
      selectedRoles: [],
      selectedWorkways: [],
      descrip: '',
      id: 0,
      missionName: '',
      valph: 50,
      nhours: 1,
      // How many people the mission needs (PLAN_SHIFTS §2). `nhours` is per
      // person, so the rikma's real commitment is nhours × valph × howMeny.
      howMeny: 1,
      iskvua: false,
      date: null,
      dates: null,
      location: {
        location_mode: 'unspecified',
        isOnline: false,
        lat: null,
        lng: null,
        radius: 15,
        location_hint: ''
      },
      myM: false,
      rishoni: [],
      publicklinks: ``,
      privatlinks: ``,
      // The mission's own subsistence-stipend need (PLAN_STIPEND §13): 0 = the
      // mission asks for nothing. α defaults to 1 — the model that dilutes
      // nobody — so a member has to *choose* to spread the cost.
      stipendRate: 0,
      stipendCostShare: 1,
      stipendMode: 'equity'
    }
  ]);

  /**
   * The money row as the form opened it — the defaults above, or the numbers an
   * AI prefill supplied. Applying an AI suggestion writes the money row only
   * while it still matches this: a number the member typed is theirs, and
   * "apply all" must not overwrite it.
   */
  let moneyBaseline = $state({ valph: 50, nhours: 1 });

  /**
   * Seats the mission opens (PLAN_SHIFTS §2). An assigned mission is an offer
   * to one named person, so it is always 1 there whatever the field says.
   */
  const seats = $derived(
    miData[0].myM === true ? 1 : Math.max(1, Math.floor(Number(miData[0].howMeny) || 1))
  );
  /** One person's value — `nhours` is per person (PLAN_SHIFTS §2.5). */
  const perPersonValue = $derived(
    (Number(miData[0].nhours) || 0) * (Number(miData[0].valph) || 0)
  );

  let error1 = null;
  let gloading = $state(false);
  onMount(async () => {
    // specMode (or a missing/0 id) authors a NEW spec — never fetch an existing
    // mission. Guards against id===undefined hitting getMissionForEdit('undefined').
    if (id && id !== 0 && !specMode && !publishMode) {
      gloading = true;
      miData[0].missionName = name;
      miData = miData;
      try {
        const result = await executeAction('getMissionForEdit', {
          missionId: String(id),
          lang: $lang
        });
        if (result.success && result.data) {
          const d = result.data;
          miData[0].missionName = d.missionName;
          miData[0].descrip = d.descrip;
          miData[0].selectedSkills = d.skillNames;
          miData[0].selectedRoles = d.roleNames;
          miData[0].selectedWorkways = d.workwayNames;
          miData[0].id = parseInt(String(d.missionId), 10);
          miData = miData;
        }
      } catch (e) {
        error1 = e;
      } finally {
        gloading = false;
      }
    } else {
      // Hydrate the form from a supplied spec. Honoured whenever a spec is
      // given — not only in specMode — because the AI prefill routes open the
      // *normal* creation form pre-filled for human review.
      if (initialSpec) {
        miData[0].missionName = initialSpec.name ?? name ?? '';
        if (initialSpec.descrip != null)
          miData[0].descrip = initialSpec.descrip;

        const hours = initialSpec.hours ?? initialSpec.nhours;
        if (hours != null) {
          miData[0].nhours = Number(hours) || 0;
          moneyBaseline.nhours = miData[0].nhours;
        }

        const rate = initialSpec.ratePerHour ?? initialSpec.valph;
        if (rate != null) {
          miData[0].valph = Number(rate) || 0;
          moneyBaseline.valph = miData[0].valph;
        }

        // AI-suggested vocabulary: pre-select it (the user can remove any chip).
        //
        // `initialSpec.vocab` carries the server-resolved `{id, name}` pairs —
        // real catalogue entries, created there if they did not exist. Keep
        // their ids so the chips survive submit even when this component's
        // catalogue predates them; the names come from the same source, so a
        // chip the member removes simply never reaches find_*_id.
        const asNames = (v) =>
          (Array.isArray(v) ? v : [])
            .map((n) => (typeof n === 'string' ? n : (n?.name ?? '')).trim())
            .filter(Boolean);

        const vocab = initialSpec.vocab ?? {};
        preresolvedVocab = {
          skills: vocabMap(vocab.skills),
          roles: vocabMap(vocab.roles),
          workways: vocabMap(vocab.workways)
        };

        const preSkills = asNames(vocab.skills ?? initialSpec.skills);
        if (preSkills.length) miData[0].selectedSkills = [...preSkills];

        const preRoles = asNames(vocab.roles ?? initialSpec.roles);
        if (preRoles.length) miData[0].selectedRoles = [...preRoles];

        const preWorkways = asNames(vocab.workways ?? initialSpec.workways);
        if (preWorkways.length) miData[0].selectedWorkways = [...preWorkways];
      } else {
        miData[0].missionName = name;
      }
      miData = miData;
      gloading = false;
    }

    if (id === 0 && name) {
      hydrateFromMissionName(name);
    }
  });

  $effect(() => {
    const nameToHydrate = miData[0].missionName;
    if (nameToHydrate) {
      untrack(() => hydrateFromMissionName(nameToHydrate));
    }
  });

  let lastHydratedValues = $state({
    descrip: '',
    skills: [],
    roles: [],
    workways: []
  });

  function hydrateFromMissionName(value) {
    if (!value) return;
    const template = missionTemplates.find(
      (t) => t.attributes.missionName.trim() === value.trim()
    );
    if (!template) return;

    // A template was recognised → transfer it into the form and lock the name
    // field (the spec now comes from the template, not free text).
    missionNameE = false;

    // Store the template's Mission ID so createMission sends existingMissionId
    // instead of trying to create a duplicate (which hits the unique constraint)
    miData[0].id = parseInt(String(template.id), 10);

    const attributes = template.attributes;

    // Smart update for description
    const templateDescrip = attributes.descrip || '';
    const currentDescrip = miData[0].descrip || '';
    const isDescEmpty =
      !currentDescrip ||
      currentDescrip === '<p></p>' ||
      currentDescrip === '<p><br></p>';

    if (isDescEmpty || currentDescrip === lastHydratedValues.descrip) {
      miData[0].descrip = templateDescrip;
      lastHydratedValues.descrip = templateDescrip;
    }

    // Smart update for skills
    const templateSkills = (attributes.skills?.data || []).map((s) => {
      if ($lang === 'he' && s.attributes.localizations?.data?.[0]) {
        return s.attributes.localizations.data[0].attributes.skillName;
      }
      return s.attributes.skillName;
    });
    if (
      miData[0].selectedSkills.length === 0 ||
      JSON.stringify(miData[0].selectedSkills) ===
        JSON.stringify(lastHydratedValues.skills)
    ) {
      miData[0].selectedSkills = [...templateSkills];
      lastHydratedValues.skills = [...templateSkills];
    }

    // Smart update for roles
    const templateRoles = (attributes.tafkidims?.data || []).map((r) => {
      if ($lang === 'he' && r.attributes.localizations?.data?.[0]) {
        return r.attributes.localizations.data[0].attributes.roleDescription;
      }
      return r.attributes.roleDescription;
    });
    if (
      miData[0].selectedRoles.length === 0 ||
      JSON.stringify(miData[0].selectedRoles) ===
        JSON.stringify(lastHydratedValues.roles)
    ) {
      miData[0].selectedRoles = [...templateRoles];
      lastHydratedValues.roles = [...templateRoles];
    }

    // Smart update for workways
    const templateWorkways = (attributes.work_ways?.data || []).map((w) => {
      if ($lang === 'he' && w.attributes.localizations?.data?.[0]) {
        return w.attributes.localizations.data[0].attributes.workWayName;
      }
      return w.attributes.workWayName;
    });
    if (
      miData[0].selectedWorkways.length === 0 ||
      JSON.stringify(miData[0].selectedWorkways) ===
        JSON.stringify(lastHydratedValues.workways)
    ) {
      miData[0].selectedWorkways = [...templateWorkways];
      lastHydratedValues.workways = [...templateWorkways];
    }
  }

  // Resolve a catalog entry's name in the current language — mirrors
  // VocabSelector.entryName so the labels SkillSelector emits (including
  // semantic suggestions that live in the DB store but not in the statically
  // bundled snapshot) map back to ids reliably instead of being silently
  // dropped. Used for skills and roles, which both go through VocabSelector.
  function catName(c, field) {
    let name = c.attributes?.[field] || '';
    if ($lang === 'he' && c.attributes?.localizations?.data?.length > 0) {
      name = c.attributes.localizations.data[0].attributes[field];
    }
    return name;
  }

  /**
   * Vocabulary ids resolved on the server for an AI prefill, keyed by the chip
   * label — see `initialSpec.vocab` and `resolveMissionSpec`.
   *
   * The lookups below map a chip back to a catalogue id and drop whatever they
   * cannot find, which is correct for what the member typed but wrong for a
   * suggestion the server already resolved: a term created moments ago is not
   * in the catalogue this component loaded on mount, so its chip was shown and
   * then silently dropped on submit. Consulting this map first keeps the id.
   */
  let preresolvedVocab = $state({
    skills: /** @type {Record<string, string>} */ ({}),
    roles: /** @type {Record<string, string>} */ ({}),
    workways: /** @type {Record<string, string>} */ ({})
  });

  /** `[{id,name}]` → `{ name: id }`, ignoring malformed entries. */
  function vocabMap(pairs) {
    /** @type {Record<string, string>} */
    const out = {};
    for (const p of Array.isArray(pairs) ? pairs : []) {
      const name = typeof p?.name === 'string' ? p.name.trim() : '';
      const id = p?.id != null ? String(p.id) : '';
      if (name && id) out[name] = id;
    }
    return out;
  }

  function find_role_id(role_name_arr) {
    const arr = [];
    for (const nm of role_name_arr) {
      const pre = preresolvedVocab.roles[nm];
      if (pre) {
        arr.push(pre);
        continue;
      }
      const hit = $role.find((c) => catName(c, 'roleDescription') === nm);
      if (hit) arr.push(hit.id);
    }
    return arr;
  }

  function find_workway_id(workway_arr) {
    let arr = [];
    for (let j = 0; j < workway_arr.length; j++) {
      const pre = preresolvedVocab.workways[workway_arr[j]];
      if (pre) {
        arr.push(pre);
        continue;
      }
      for (let i = 0; i < $ww.length; i++) {
        if ($ww[i].attributes.workWayName === workway_arr[j]) {
          arr.push($ww[i].id);
        }
      }
    }
    return arr;
  }

  function find_user_id(user_name_arr) {
    let id = 0;
    for (let i = 0; i < pu.length; i++) {
      if (pu[i].attributes.username === user_name_arr[0]) {
        id = pu[i].id;
      }
    }
    return id;
  }
  let selected = [];
  let skills2 = $state($skil);
  let selected3;

  function find_skill_id(skill_name_arr) {
    const arr = [];
    for (const nm of skill_name_arr) {
      const pre = preresolvedVocab.skills[nm];
      if (pre) {
        arr.push(pre);
        continue;
      }
      const hit = $skil.find((c) => catName(c, 'skillName') === nm);
      if (hit) arr.push(hit.id);
    }
    return arr;
  }

  async function increment() {
    loading = true;
    const element = miData[0];

    // Spec / publish mode — emit the authored contract instead of creating a
    // mission in a project. specMode caller persists it weave-less; publishMode
    // caller publishes it as a community open-mission.
    if (specMode || publishMode) {
      const spec = {
        name: element.missionName,
        descrip: element.descrip,
        hours: Number(element.nhours) || 0,
        ratePerHour: Number(element.valph) || 0,
        skills: element.selectedSkills ?? [],
        roles: element.selectedRoles ?? [],
        workways: element.selectedWorkways ?? [],
        // The catalogue ids behind the chips, so a published need carries its roles
        // and work ways too, not only skill names (QA C-8: they were dropped).
        skillIds: find_skill_id(element.selectedSkills ?? []).map(String),
        roleIds: find_role_id(element.selectedRoles ?? []).map(String),
        workwayIds: find_workway_id(element.selectedWorkways ?? []).map(String),
        // Additive extras (PLAN_USER_OFFERINGS §3.4): the recognised template id
        // (hydrateFromMissionName stores it on element.id) and the location.
        // Existing spec consumers ignore unknown keys.
        templateId: element.id && element.id !== 0 ? String(element.id) : null,
        location: element.location ?? null
      };
      if (publishMode) onPublish?.(spec);
      else onSpec?.(spec);
      loading = false;
      return;
    }

    // A staffing plan is part of what the rikma votes on; an incomplete one
    // must not go out half-drawn.
    if (shiftsOn && !shiftPlanReady) {
      loading = false;
      toast.warning($trans('shifts.form.fixBeforeSend'));
      return;
    }

    const inviting = canInvite && inviteNew && element.myM !== true;
    const inviteAddress = inviteEmail.trim();
    if (inviting && inviteAddress && !INVITE_EMAIL_SHAPE.test(inviteAddress)) {
      loading = false;
      toast.warning($trans('mission.invite.invalidEmail'));
      return;
    }
    if (inviting && inviteNeedsEmail && !inviteAddress) {
      loading = false;
      toast.warning($trans('mission.invite.emailRequired'));
      return;
    }

    const skills = find_skill_id(element.selectedSkills);
    const work_ways = find_workway_id(element.selectedWorkways);
    const tafkidims = find_role_id(element.selectedRoles);

    let dateStart;
    let dateEnd;
    if (element.date && element.date !== 'undefined' && element.date !== null) {
      dateStart = moment(element.date, 'HH:mm DD/MM/YYYY').toISOString();
    }
    if (
      element.dates &&
      element.dates !== 'undefined' &&
      element.dates !== null
    ) {
      dateEnd = moment(element.dates, 'HH:mm DD/MM/YYYY').toISOString();
    }

    // Determine assignedUserId:
    //   Branch 2 — multi-user, specific member: send their actual ID
    //   Branch 4 — solo self-assign: send 'self'; server always uses context.userId
    let assignedUserId;
    if (element.myM === true) {
      if (userslength > 1) {
        assignedUserId = String(element.rishon);
      } else {
        assignedUserId = 'self';
      }
    }

    try {
      const result = await executeAction('createMission', {
        projectId: String(projectId),
        existingMissionId: element.id !== 0 ? String(element.id) : undefined,
        missionName: element.missionName,
        descrip: element.descrip,
        skillIds: skills.map(String),
        roleIds: tafkidims.map(String),
        workwayIds: work_ways.map(String),
        vallueIds: (vallues || []).map(String),
        nhours: Number(element.nhours),
        valph: Number(element.valph),
        entryCurrency: entryCurrency !== rikmaCur ? entryCurrency : undefined,
        iskvua: element.iskvua,
        // An assigned mission is an offer to one named person — the server
        // forces 1 there anyway; only an open mission carries a headcount.
        howMeny: element.myM === true ? undefined : Math.max(1, Math.floor(Number(element.howMeny) || 1)),
        shiftPlan: shiftsOn && shiftPlan.enabled
          ? {
              pattern: $state.snapshot(shiftPlan.pattern),
              cycleDays: shiftPlan.cycleDays,
              closeOffsetHours: shiftPlan.closeOffsetHours,
              draftWindowHours: shiftPlan.draftWindowHours,
              minRestHours: shiftPlan.minRestHours
            }
          : undefined,
        dateStart,
        dateEnd,
        isOnline: element.location?.location_mode === 'online',
        lat: normalizeLocationNumber(element.location?.lat),
        lng: normalizeLocationNumber(element.location?.lng),
        radius: normalizeLocationNumber(element.location?.radius),
        location_hint: element.location?.location_hint || null,
        publicklinks: element.publicklinks,
        privatlinks: element.privatlinks,
        spnot: element.spnot,
        assignedUserId,
        invite: inviting ? (inviteAddress ? { email: inviteAddress } : {}) : undefined,
        checklist: element.checklist || [],
        stipendRate: Number(element.stipendRate) > 0 ? Number(element.stipendRate) : undefined,
        stipendCostShare:
          Number(element.stipendRate) > 0 ? Number(element.stipendCostShare ?? 1) : undefined,
        stipendMode: Number(element.stipendRate) > 0 ? element.stipendMode || 'equity' : undefined,
        processId: processContext?.processId
          ? String(processContext.processId)
          : undefined
      });
      if (result.success) {
        // The mission stands even if its plan could not be saved — say so.
        if (result.data?.shiftPlanError) toast.warning($trans('shifts.form.planNotSaved'));
        handleSuccess(result.data);
      } else {
        loading = false;
        error = true;
        toast.warning(mf.errorMessage);
      }
    } catch (e) {
      error1 = e;
      loading = false;
      error = true;
    }
  }

  let cencel = ' ביטול';
  let addS = false;
  let rishon = 0;
  let rishonves = 0;

  async function addW(id, mid, e) {
    if (e) if (e.type === 'add') console.log(id);
    newnew(id);
  }
  let tt = [];

  function addnew(event) {
    const newOb = event.skob;
    const newN = event.skob.attributes.skillName;
    const newValues = skills2;
    newValues.push(newOb);
    skills2 = newValues;
    const mid = event.mid;
    const y = miData.map((c) => c.id);
    const index = y.indexOf(mid);
    miData[index].selectedSkills.push(newN);
    miData = miData;
    mi.set(miData);
  }

  //add new workway option
  async function newnew(selectedWorkways) {
    for (let i = 0; i < selectedWorkways.length; i++) {
      if (
        !$ww.map((c) => c.attributes.workWayName).includes(selectedWorkways[i])
      ) {
        try {
          const result = await executeAction('createWorkWay', {
            workWayName: selectedWorkways[i]
          });
          if (result.success && result.data) {
            const newOb = {
              id: result.data.id,
              attributes: { workWayName: result.data.workWayName }
            };
            const newValues = $ww;
            newValues.push(newOb);
            ww.set(newValues);
          }
        } catch (err) {
          console.log('Failed to create workway:', err);
        }
      }
    }
  }
  let searchText = $state(``);

  let isOpen = $state(false);
  const closer = () => {
    isOpen = false;
  };
  let addn = $derived(`${mf.missionType}: "${searchText}"`);
  /**
   * The staffing plan proposed with this mission (PLAN_SHIFTS §9.5, §13.6).
   * Offered only while the shift system is on — with SHIFTS=off the server
   * ignores a plan, and a form that silently does nothing is worse than none.
   */
  let shiftPlan = $state(emptyShiftPlan());
  let shiftsOn = $state(false);
  onMount(() => {
    fetch('/api/shifts/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (shiftsOn = !!d && d.mode !== 'off'))
      .catch(() => (shiftsOn = false));
  });
  const shiftPlanReady = $derived(
    !shiftPlan.enabled ||
      (validatePattern(shiftPlan.pattern).length === 0 &&
        shiftPlan.pattern.days.some((d) => d.windows.length > 0))
  );

  let error = $state(false),
    success = $state(false),
    loading = $state(false);
  function handleSuccess(md) {
    loading = false;
    success = true;
    confettiStore.trigger();
    toast.success(mf.publishedSuccess);
    // With an invite the form stays up until the inviter has the link in hand —
    // closing first would lose the one thing they came here to send. In a rikma
    // that votes there is no link yet; the card says when the invite goes out.
    if (md?.invite) {
      inviteResult = md.invite;
      inviteMd = md;
      return;
    }
    onClose?.({ md });
  }

  // "Invite someone new" (PLAN_INVITE_PARTNER_TO_MISSION). A solo rikma sends it
  // at once; a larger one votes first, so the invite waits on the proposal and
  // is emailed when it matures — which is why the email is required there.
  const canInvite = $derived(!!projectId && !specMode && !publishMode);
  const inviteNeedsEmail = $derived(userslength > 1);
  let inviteNew = $state(false);
  let inviteEmail = $state('');
  let inviteResult = $state(null);
  let inviteMd = null;
  const INVITE_EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let wid = $state(0);
  //TODO: כמות לכל משימה עד אינסוף
  let dialog = $state(1);
  let misid = $state(0);
  let itemid = $state(0);
  let editdata = $state(-1);
  function hover() {}
  let dateE = $state(false);
  let descripE = $state(false);
  let missionNameE = $state(id === 0);
  let valphE = $state(false);
  let ske = $state(false);
  let roleE = $state(false);
  let wwe = $state(false);
  let assignE = $state(false);
  let shiftE = $state(false);
  let publinkE = $state(false);
  let mislinkE = $state(false);
  let locationE = $state(false);
  function disout() {}

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
    if (!location || !hasLocationValue(location)) return ml.empty;
    if (location.location_mode === 'online') return ml.online;
    if (hasLocationPoint(location)) {
      const hint = location.location_hint?.trim() || ml.selected;
      return `${hint} - ${location.radius || 15} km`;
    }
    return location.location_hint?.trim() || ml.selected;
  }
  // ── Redesigned layout (docs/tbd/PLAN_MISSION_FORM_REDESIGN.md) ─────────────
  // Presentation only: every field still reads and writes `miData[0]`, and
  // `increment` builds the exact same payload as before.
  import FormSection from './missionForm/FormSection.svelte';
  import OptionRow from './missionForm/OptionRow.svelte';
  import MissionSummary from './missionForm/MissionSummary.svelte';
  import { portal } from './missionForm/portal.js';
  import { lbl, fieldBox, inp, ghost, segBtn } from './missionForm/classes.js';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import {
    Sparkles,
    WandSparkles,
    Globe,
    Undo2,
    ListChecks,
    UserPlus,
    Mail,
    Link as LinkLucide,
    Clock,
    Pencil,
    X,
    Maximize2,
    Minimize2,
    MapPin,
    Plus as PlusIcon,
    Heart
  } from '@lucide/svelte';

  const fmtMoney = useFormatMoney();
  const fmtNum = (/** @type {any} */ n) =>
    (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  /** An amount typed in the form, in the currency it was typed in. */
  const moneyText = (/** @type {any} */ n) =>
    specMode || publishMode ? fmtNum(n) : fmtMoney(Number(n) || 0, entryCurrency);
  const isBlankHtml = (/** @type {any} */ h) =>
    !h || (typeof h === 'string' && !h.replace(/<[^>]*>/g, '').trim());

  /** The rikma-only parts (headcount, stipend, equity, assignment, shifts). */
  const inProject = $derived(!!projectId && !specMode && !publishMode);
  const showHeadcount = $derived(inProject && miData[0].myM !== true);
  const totalValue = $derived(perPersonValue * seats);
  const formulaText = $derived(
    seats > 1
      ? $trans('mission.form2.formulaSeats', {
          rate: moneyText(miData[0].valph),
          hours: fmtNum(miData[0].nhours),
          count: seats
        })
      : $trans('mission.form2.formula', {
          rate: moneyText(miData[0].valph),
          hours: fmtNum(miData[0].nhours)
        })
  );
  const totalText = $derived(
    miData[0].iskvua
      ? $trans('mission.form2.perMonth', { value: moneyText(totalValue) })
      : moneyText(totalValue)
  );
  const summaryMeta = $derived(
    `${miData[0].iskvua ? $trans('mission.form2.recurring') : $trans('mission.form2.oneTime')} · ${
      seats > 1 ? $trans('mission.form2.people', { count: seats }) : $trans('mission.form2.onePerson')
    }`
  );
  const checks = $derived([
    {
      label: $trans('mission.form2.checkName'),
      done: !!miData[0].missionName?.trim() && !isBlankHtml(miData[0].descrip)
    },
    {
      label: $trans('mission.form2.checkValue'),
      done: Number(miData[0].valph) > 0 && Number(miData[0].nhours) > 0
    },
    {
      label: $trans('mission.form2.checkWho'),
      done: miData[0].selectedSkills.length + miData[0].selectedRoles.length > 0
    },
    {
      label: $trans('mission.form2.checkWhen'),
      done: !!miData[0].date || hasLocationValue(miData[0].location),
      optional: true
    }
  ]);
  const consentNote = $derived(
    inProject
      ? userslength > 1
        ? $trans('mission.form2.noteVote')
        : $trans('mission.form2.noteSolo')
      : ''
  );
  const assignStatus = $derived(
    miData[0].myM === true
      ? userslength > 1 && miData[0].rishoni?.[0]
        ? $trans('mission.form2.assignedTo', { name: miData[0].rishoni[0] })
        : $trans('mission.form2.assignedSelf')
      : $trans('mission.form2.notAssigned')
  );
  const tasksStatus = $derived(
    miData[0].checklist?.length
      ? $trans('mission.form2.tasksCount', { count: miData[0].checklist.length })
      : $trans('mission.form2.tasksNone')
  );
  const linksStatus = $derived(
    miData[0].publicklinks?.trim() || miData[0].privatlinks?.trim()
      ? $trans('mission.form2.linksSet')
      : $trans('mission.form2.linksStatus')
  );
  let tasksOpen = $state(false);
  /**
   * Full-screen mode: the form covers the whole window (Esc leaves). A rikma's
   * new mission opens in it; the concierge spec/publish flows open inline.
   */
  let fullscreen = $state(untrack(() => !!projectId && !specMode && !publishMode));

  let inviteOpen = $state(false);

</script>

<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent
      aria-label="form"
      class="{dialog === 2 ? 'formi' : 'contenti'} surface-dialog"
    >
      {#if dialog === 2}
        <Crtask
          {misid}
          fromMis={true}
          {editdata}
          onAdd={(e) => {
            const data = e.data;
            const id = e.id;
            const isEdit = e.isEdit;
            console.log(isEdit);
            if (!miData[0].checklist) {
              miData[0].checklist = [];
            }
            if (isEdit == true) {
              console.log(':here', itemid);
              miData[0].checklist.splice(itemid, 1);
            }
            miData[0].checklist.push(data);
            miData = miData;
            isOpen = false;
            dialog = 1;
          }}
        />
      {:else if dialog === 3}
        <div
          dir={$isRtl ? 'rtl' : 'ltr'}
          style="  overflow-x: auto; background: linear-gradient(to right, #25c481, #25b7c4);background: -webkit-linear-gradient(left, #25c481, #25b7c4); "
        >
          <ExpandTask
            tasks={itemid != -1
              ? [miData[misid].checklist[itemid]]
              : miData[misid].checklist}
            onAdd={() => (dialog = 2)}
          />
        </div>
      {/if}
    </DialogContent>
  </div>
</DialogOverlay>

{#snippet publishActions()}
  <div class="flex flex-wrap items-center justify-end gap-2">
    {#if specMode || publishMode}
      <button
        type="button"
        onclick={() => onClose?.()}
        class="min-h-11 rounded-xl border-[1.5px] border-[#e4d9c4] bg-white px-4 text-sm text-[#2a1420] transition hover:border-[#c8155f]"
      >
        {$trans('mission.ai.cancel')}
      </button>
    {/if}
    <Button
      text={publishMode
        ? $trans('common.buttons.publishToCommunity')
        : inProject
          ? $trans('mission.form2.publish')
          : mf.publish}
      onClick={increment}
      {loading}
      {success}
      {error}
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
  aria-label={fullscreen ? $trans('mission.form2.title') : undefined}
>
<div class="mission-form mx-auto w-full max-w-6xl pb-2 sm:pt-2">
  <!-- Header -->
  <header class="mb-5 flex flex-col gap-2 px-1">
    {#if pn && !specMode && !publishMode}
      <span
        class="inline-flex items-center gap-2 self-start rounded-full bg-[#fdeef4] px-3 py-1 text-sm font-medium text-[#a3124e]"
      >
        <Heart size={14} fill="currentColor" aria-hidden="true" />
        {$trans('mission.form2.rikmaChip', { name: pn })}
      </span>
    {/if}
    <div class="flex items-center justify-between gap-3">
      <h1 class="m-0 text-3xl font-extrabold leading-tight text-[#2a1420] sm:text-4xl">
        {$trans('mission.form2.title')}
      </h1>
      <div class="flex flex-none items-center gap-2">
      <button
        type="button"
        onclick={() => (fullscreen = !fullscreen)}
        aria-pressed={fullscreen}
        title={fullscreen ? $trans('mission.form2.exitFullscreen') : $trans('mission.form2.fullscreen')}
        class="inline-flex min-h-11 flex-none items-center gap-2 rounded-full border-[1.5px] border-[#e4d9c4] bg-white px-4 text-sm font-medium text-[#2a1420] transition hover:border-[#c8155f] hover:text-[#c8155f]"
      >
        {#if fullscreen}
          <Minimize2 size={16} aria-hidden="true" />
          <span class="hidden sm:inline">{$trans('mission.form2.exitFullscreen')}</span>
        {:else}
          <Maximize2 size={16} aria-hidden="true" />
          <span class="hidden sm:inline">{$trans('mission.form2.fullscreen')}</span>
        {/if}
      </button>
      {#if fullscreen && onClose}
        <button
          type="button"
          onclick={() => {
            fullscreen = false;
            onClose?.();
          }}
          aria-label={$trans('mission.form2.close')}
          title={$trans('mission.form2.close')}
          class="flex h-11 w-11 flex-none items-center justify-center rounded-full border-[1.5px] border-[#e4d9c4] bg-white text-[#2a1420] transition hover:border-[#c8155f] hover:text-[#c8155f]"
        >
          <X size={18} aria-hidden="true" />
        </button>
      {/if}
      </div>
    </div>
    <p class="m-0 max-w-2xl text-base text-[#6b5560]">{$trans('mission.form2.intro')}</p>
  </header>

  <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
    <!-- FORM -->
    <div class="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
      {#if gloading}
        <div class="flex items-center justify-center rounded-2xl bg-white p-10" aria-busy="true">
          <span
            class="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-[#c8155f] border-t-transparent"
          ></span>
        </div>
      {:else}
        <!-- 1 · What -->
        <FormSection
          step={1}
          title={$trans('mission.form2.step1Title')}
          subtitle={$trans('mission.form2.step1Sub')}
        >
          <div>
            {#if missionNameE}
              <label for="mission-name-input" class={lbl}>{$trans('mission.ai.missionName')}</label>
            {:else}
              <span class={lbl}>{$trans('mission.ai.missionName')}</span>
            {/if}
            <div class="flex flex-col gap-2 sm:flex-row">
              {#if missionNameE}
                <input
                  id="mission-name-input"
                  type="text"
                  bind:value={miData[0].missionName}
                  list="mission-name-options"
                  placeholder={$trans('mission.ai.typePickTemplate')}
                  class="{inp} flex-1"
                />
                <datalist id="mission-name-options">
                  {#each missionTemplates as template (template.id)}
                    <option value={template.attributes.missionName}></option>
                  {/each}
                </datalist>
              {:else}
                <div
                  class="flex min-h-[52px] min-w-0 flex-1 items-center gap-2 rounded-xl border-[1.5px] border-[#eee2a6] bg-[#fdf9ea] ps-4 pe-1"
                >
                  <strong class="min-w-0 flex-1 truncate text-[17px]">{miData[0].missionName}</strong>
                  <span class="hidden text-xs text-[#6b5560] sm:inline">{$trans('mission.form2.fromTemplate')}</span>
                  <button
                    type="button"
                    onclick={() => (missionNameE = true)}
                    aria-label={$trans('mission.form2.editName')}
                    title={$trans('mission.form2.editName')}
                    class="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-[#c8155f] transition hover:bg-[#fdeef4]"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              {/if}
              <button
                type="button"
                onclick={handleAiSuggest}
                disabled={aiSuggesting}
                title={$trans('mission.ai.suggestTitle')}
                class="inline-flex h-[52px] flex-none items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ff0092] to-[#c8155f] px-5 text-[15px] font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {#if aiSuggesting}
                  <span
                    class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  ></span>
                {:else}
                  <Sparkles size={18} aria-hidden="true" />
                {/if}
                {$trans('mission.form2.fillWithAi')}
              </button>
            </div>
            {#if missionNameE}
              <p class="m-0 mt-1.5 text-[13px] text-[#6b5560]">{$trans('mission.form2.nameHint')}</p>
            {/if}
          </div>

          {#if aiSuggestResult}
            <div
              transition:slide={{ duration: 250 }}
              class="flex flex-col gap-3 rounded-2xl border-[1.5px] border-[#f3c6da] bg-[#fff6fa] p-4 text-sm"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <strong class="inline-flex items-center gap-2 text-base text-[#c8155f]">
                  <Sparkles size={18} aria-hidden="true" />
                  {$trans('mission.ai.suggestionsHeader')}
                </strong>
                {#if aiSuggestResult.similarMissions?.length > 0}
                  <span class="text-xs text-[#6b5560]">
                    {$trans('mission.ai.similarTemplates')}
                    {aiSuggestResult.similarMissions.map((m) => m.missionName).join(', ')}
                  </span>
                {/if}
              </div>
              <dl class="m-0 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                {#if aiSuggestResult.extraction.skills.length > 0}
                  <dt class="text-[#6b5560]">{$trans('mission.ai.skillsLabel')}</dt>
                  <dd class="m-0 flex flex-wrap gap-1.5">
                    {#each aiSuggestResult.extraction.skills as s}
                      <span class="rounded-full border border-dashed border-[#d9a5bb] bg-white px-2.5 py-1">{s}</span>
                    {/each}
                  </dd>
                {/if}
                {#if aiSuggestResult.extraction.roles.length > 0}
                  <dt class="text-[#6b5560]">{$trans('mission.ai.rolesLabel')}</dt>
                  <dd class="m-0 flex flex-wrap gap-1.5">
                    {#each aiSuggestResult.extraction.roles as r}
                      <span class="rounded-full border border-dashed border-[#9fd3d8] bg-white px-2.5 py-1">{r}</span>
                    {/each}
                  </dd>
                {/if}
                {#if aiSuggestResult.extraction.workways.length > 0}
                  <dt class="text-[#6b5560]">{$trans('mission.ai.workModesLabel')}</dt>
                  <dd class="m-0 flex flex-wrap gap-1.5">
                    {#each aiSuggestResult.extraction.workways as w}
                      <span class="rounded-full border border-dashed border-[#d8cbb0] bg-white px-2.5 py-1">{w}</span>
                    {/each}
                  </dd>
                {/if}
                {#if aiSuggestResult.extraction.valph > 0 || aiSuggestResult.extraction.nhours > 0}
                  <dt class="text-[#6b5560]">{$trans('mission.ai.valueLabel')}</dt>
                  <dd class="m-0 font-bold">
                    {#if aiSuggestResult.extraction.valph > 0}
                      {fmtNum(aiSuggestResult.extraction.valph)} {mf.perHour}
                    {/if}
                    {#if aiSuggestResult.extraction.valph > 0 && aiSuggestResult.extraction.nhours > 0}
                      ×
                    {/if}
                    {#if aiSuggestResult.extraction.nhours > 0}
                      {fmtNum(aiSuggestResult.extraction.nhours)} {mf.hours}
                    {/if}
                  </dd>
                {/if}
              </dl>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  onclick={applyAiSuggestions}
                  disabled={aiApplying}
                  class="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#c8155f] px-5 text-sm font-bold text-white transition hover:bg-[#a3124e] disabled:opacity-50"
                >
                  {#if aiApplying}
                    <span
                      class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                    ></span>
                    {$trans('mission.ai.applying')}
                  {:else}
                    {$trans('mission.ai.applyAll')}
                  {/if}
                </button>
                <button
                  type="button"
                  onclick={() => (aiSuggestResult = null)}
                  disabled={aiApplying}
                  class="{ghost} min-h-10"
                >
                  {$trans('mission.ai.dismiss')}
                </button>
              </div>
            </div>
          {/if}

          <div>
            <span class={lbl}>{$trans('common.description')}</span>
            <div class="{fieldBox} overflow-hidden">
              <RichText bind:outpot={miData[0].descrip} />
              <div
                class="flex flex-wrap items-center gap-2 border-t border-[#efe6d3] bg-[#fbf7ee] px-2.5 py-2"
              >
                <button type="button" onclick={handleAiImprove} disabled={aiImproving} class={ghost}>
                  {#if aiImproving}
                    <span
                      class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c8155f] border-t-transparent"
                    ></span>
                  {:else}
                    <WandSparkles size={15} aria-hidden="true" />
                  {/if}
                  {$trans('mission.ai.improveWithAi')}
                </button>
                {#if aiDescUndo}
                  <button type="button" onclick={undoAiImprove} class={ghost}>
                    <Undo2 size={15} aria-hidden="true" />
                    {$trans('mission.ai.undo')}
                  </button>
                {/if}
                <button type="button" onclick={handleAiTranslate} disabled={aiTranslating} class={ghost}>
                  {#if aiTranslating}
                    <span
                      class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c8155f] border-t-transparent"
                    ></span>
                  {:else}
                    <Globe size={15} aria-hidden="true" />
                  {/if}
                  {$trans('mission.ai.translate')}
                </button>
              </div>
            </div>
            {#if aiTranslations}
              <div
                transition:slide={{ duration: 250 }}
                class="mt-2 flex flex-col gap-2 rounded-xl border border-[#efe6d3] bg-[#fbf7ee] p-3 text-sm"
              >
                <p class="m-0 font-bold">{$trans('mission.ai.translationPreview')}</p>
                {#if aiTranslations.he && $lang !== 'he'}
                  <p class="m-0" dir="rtl">
                    <span class="font-medium text-[#6b5560]">עברית:</span>
                    {aiTranslations.he.replace(/<[^>]+>/g, '').slice(0, 120)}…
                  </p>
                {/if}
                {#if aiTranslations.en && $lang !== 'en'}
                  <p class="m-0" dir="ltr">
                    <span class="font-medium text-[#6b5560]">English:</span>
                    {aiTranslations.en.replace(/<[^>]+>/g, '').slice(0, 120)}…
                  </p>
                {/if}
                {#if aiTranslations.ar && $lang !== 'ar'}
                  <p class="m-0" dir="rtl">
                    <span class="font-medium text-[#6b5560]">العربية:</span>
                    {aiTranslations.ar.replace(/<[^>]+>/g, '').slice(0, 120)}…
                  </p>
                {/if}
                <p class="m-0 text-xs text-[#6b5560]">{$trans('mission.ai.autoSaveNote')}</p>
                <button type="button" onclick={() => (aiTranslations = null)} class="{ghost} self-start">
                  {$trans('mission.ai.close')}
                </button>
              </div>
            {/if}
          </div>
        </FormSection>

        <!-- 2 · Value -->
        <FormSection
          step={2}
          title={$trans('mission.form2.step2Title')}
          subtitle={$trans('mission.form2.step2Sub')}
        >
          <div class="inline-flex gap-1 self-start rounded-xl bg-[#f6f0e4] p-1" role="group" aria-label={mf.isRecurring}>
            <button
              type="button"
              aria-pressed={!miData[0].iskvua}
              onclick={() => (miData[0].iskvua = false)}
              class={segBtn(!miData[0].iskvua)}>{$trans('mission.form2.oneTime')}</button
            >
            <button
              type="button"
              aria-pressed={miData[0].iskvua}
              onclick={() => (miData[0].iskvua = true)}
              class={segBtn(miData[0].iskvua)}>{$trans('mission.form2.recurring')}</button
            >
          </div>

          <div class="grid items-end gap-3 {showHeadcount ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}">
            <div class={showHeadcount ? 'col-span-2 sm:col-span-1' : ''}>
              <div class="mb-2 flex min-h-6 items-center justify-between gap-2">
                <label for="mission-valph" class="whitespace-nowrap text-sm font-bold text-[#2a1420]">{$trans('mission.form2.ratePerHour')}</label>
                {#if inProject}
                  <CurrencyPicker bind:value={entryCurrency} compact />
                {/if}
              </div>
              <div class="{fieldBox} flex h-[52px] items-center overflow-hidden">
                <input
                  id="mission-valph"
                  type="number"
                  min="0"
                  step="any"
                  inputmode="decimal"
                  bind:value={miData[0].valph}
                  class="h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-xl font-bold outline-none"
                />
                <span class="flex-none pe-3.5 text-lg font-bold text-[#6b5560]">
                  <CurrencySymbol currency={specMode || publishMode ? null : entryCurrency} />
                </span>
              </div>
            </div>
            <div>
              <label for="mission-nhours" class={lbl}>
                {#if showHeadcount}
                  {miData[0].iskvua ? $trans('mission.form2.hoursPerPersonMonth') : $trans('mission.form2.hoursPerPerson')}
                {:else}
                  {miData[0].iskvua ? $trans('mission.form2.hoursMonth') : $trans('mission.form2.hours')}
                {/if}
              </label>
              <input
                id="mission-nhours"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                bind:value={miData[0].nhours}
                class="{inp} text-xl font-bold"
              />
            </div>
            {#if showHeadcount}
              <div>
                <label for="mission-howmeny" class={lbl}>{$trans('mission.form2.headcount')}</label>
                <input
                  id="mission-howmeny"
                  type="number"
                  min="1"
                  step="1"
                  inputmode="numeric"
                  bind:value={miData[0].howMeny}
                  class="{inp} text-xl font-bold"
                />
              </div>
            {/if}
          </div>
          {#if showHeadcount}
            <p class="m-0 -mt-1 text-[13px] text-[#6b5560]">
              {seats > 1
                ? $trans('mission.form.headcountMany', { count: seats })
                : $trans('mission.form.headcountOne')}
            </p>
          {/if}

          <div
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-[#eee2a6] bg-[#fdf9ea] px-4 py-3.5"
          >
            <span class="text-[15px] text-[#5a4a2a]" dir="auto">{formulaText}</span>
            <strong class="text-2xl font-extrabold text-[#2a1420]" dir="auto">{totalText}</strong>
          </div>

          {#if inProject}
            <!-- "This mission also wants a subsistence stipend" (PLAN_STIPEND §13).
                 Right under the money row: it is the same question. -->
            <MissionStipendSection
              bind:rate={miData[0].stipendRate}
              bind:costShare={miData[0].stipendCostShare}
              bind:mode={miData[0].stipendMode}
              marketRate={Number(miData[0].valph) || 0}
              hours={Number(miData[0].nhours) || 0}
              iskvua={miData[0].iskvua}
            />
            <!-- Expected share in the rikma. A mission not yet published ⇒
                 alreadyCountedIn="none". -->
            <details class="group rounded-2xl border border-[#efe6d3] bg-[#fffdf8]">
              <summary
                class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-bold text-[#2a1420]"
              >
                {$trans('mission.form2.equityTitle')}
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
                  {projectId}
                  missionValue={inRikma(totalValue)}
                  monthlyValue={miData[0].iskvua ? inRikma(totalValue) : null}
                  alreadyCountedIn="none"
                  titleKey="equity.missionShareAtCreation"
                />
              </div>
            </details>
          {/if}
        </FormSection>

        <!-- 3 · Who -->
        <FormSection
          step={3}
          title={$trans('mission.form2.step3Title')}
          subtitle={$trans('mission.form2.step3Sub')}
          badge={$trans('mission.form2.optional')}
        >
          <div>
            <span class={lbl}>{$trans('mission.form2.skills')}</span>
            <SkillSelector
              bind:selectedSkills={miData[0].selectedSkills}
              placeholder={mf.skillsPlaceholder}
              autoCreate={true}
              outerDivClass="!min-h-[52px] !w-full !rounded-xl !border-[1.5px] !border-[#e4d9c4] !bg-[#fffdf8] !text-[#2a1420]"
              inputClass="!w-full !bg-transparent !text-[#2a1420]"
              liSelectedClass="!rounded-full !bg-[#fdeef4] !text-[#a3124e]"
            />
          </div>
          <div class="flex flex-col gap-4">
            <div>
              <span class={lbl}>{$trans('mission.form2.roles')}</span>
              <RoleSelector
                bind:selectedRoles={miData[0].selectedRoles}
                placeholder={mf.rolePlaceholder}
                autoCreate={true}
                outerDivClass="!min-h-[52px] !w-full !rounded-xl !border-[1.5px] !border-[#e4d9c4] !bg-[#fffdf8] !text-[#2a1420]"
                inputClass="!w-full !bg-transparent !text-[#2a1420]"
                liSelectedClass="!rounded-full !bg-[#e6f7f8] !text-[#0b6470]"
              />
            </div>
            <div>
              <span class={lbl}>{$trans('mission.form2.workways')}</span>
              <MultiSelect
                outerDivClass="!min-h-[52px] !rounded-xl !border-[1.5px] !border-[#e4d9c4] !bg-[#fffdf8] !text-[#2a1420]"
                inputClass="!bg-transparent !text-[#2a1420]"
                liSelectedClass="!rounded-full !bg-[#f6f0e4] !text-[#5a4a2a]"
                --sms-open-z-index={10000}
                createOptionMsg={addn}
                allowUserOptions={true}
                bind:searchText
                loading={newcontentW}
                bind:selected={miData[0].selectedWorkways}
                placeholder={mf.missionType}
                options={$ww.map((c) => c.attributes.workWayName)}
                onchange={(e) => {
                  addW(miData[0].selectedWorkways, miData[0].id, e);
                }}
              />
            </div>
          </div>
        </FormSection>

        <!-- 4 · When & where -->
        <FormSection
          step={4}
          title={$trans('mission.form2.step4Title')}
          subtitle={$trans('mission.form2.step4Sub')}
          badge={$trans('mission.form2.optional')}
        >
          <div>
            <span class={lbl}>{$trans('mission.form2.dates')}</span>
            <div class="{fieldBox} px-3 py-2">
              <Daterange
                dir={$isRtl ? 'rtl' : 'ltr'}
                bind:start={miData[0].date}
                bind:finnish={miData[0].dates}
              />
            </div>
          </div>
          <div>
            <span class={lbl}>{$trans('mission.form2.location')}</span>
            {#if locationE}
              <div class="flex flex-col gap-3">
                <LocationPicker
                  bind:value={miData[0].location}
                  label={ml.title}
                  helper={ml.helper}
                  height="300px"
                />
                <button type="button" onclick={() => (locationE = false)} class="{ghost} self-start">
                  {$trans('mission.form2.closeLocation')}
                </button>
              </div>
            {:else}
              <button
                type="button"
                onclick={() => (locationE = true)}
                class="flex min-h-[56px] w-full items-center gap-3 rounded-xl border-[1.5px] border-[#e4d9c4] bg-[#fffdf8] px-3 text-start transition hover:border-[#c8155f]"
              >
                <span class="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#fdeef4] text-[#c8155f]">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1 truncate text-[15px] {hasLocationValue(miData[0].location) ? 'font-medium' : 'text-[#6b5560]'}">
                  {locationSummary(miData[0].location)}
                </span>
                <span class="flex-none text-sm font-bold text-[#c8155f]">{$trans('mission.form2.setLocation')}</span>
              </button>
            {/if}
          </div>
        </FormSection>

        <!-- More options -->
        <FormSection title={$trans('mission.form2.moreTitle')} subtitle={$trans('mission.form2.moreSub')}>
          <div class="flex flex-col gap-2.5">
            <OptionRow icon={ListChecks} title={$trans('mission.form2.tasks')} status={tasksStatus} bind:open={tasksOpen}>
              <div class="flex flex-col gap-2">
                {#if miData[0].checklist?.length}
                  <ul class="m-0 flex list-none flex-col gap-1.5 p-0" transition:slide={{ duration: 300, easing: quintOut }}>
                    {#each miData[0].checklist as datai, t}
                      <li class="flex items-center gap-2 rounded-xl border border-[#efe6d3] bg-white px-3 py-1.5">
                        <span class="min-w-0 flex-1 truncate font-medium">{datai.shem}</span>
                        <button
                          type="button"
                          class="flex h-10 w-10 items-center justify-center rounded-lg text-[#6b5560] hover:bg-[#f6f0e4]"
                          aria-label={$trans('mission.form2.viewTask')}
                          title={$trans('mission.seechecklist')}
                          onclick={() => {
                            dialog = 3;
                            misid = miData[0].id;
                            itemid = t;
                            isOpen = true;
                          }}><Maximize2 size={16} /></button
                        >
                        <button
                          type="button"
                          class="flex h-10 w-10 items-center justify-center rounded-lg text-[#6b5560] hover:bg-[#f6f0e4]"
                          aria-label={$trans('mission.form2.editTask')}
                          onclick={() => {
                            dialog = 2;
                            misid = miData[0].id;
                            itemid = t;
                            editdata = datai;
                            isOpen = true;
                          }}><Pencil size={16} /></button
                        >
                        <button
                          type="button"
                          class="flex h-10 w-10 items-center justify-center rounded-lg text-[#a3124e] hover:bg-[#fdeef4]"
                          aria-label={$trans('mission.form2.removeTask')}
                          onclick={() => {
                            miData[0].checklist.splice(t, 1);
                            miData = miData;
                          }}><X size={16} /></button
                        >
                      </li>
                    {/each}
                  </ul>
                {/if}
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class={ghost}
                    onclick={() => {
                      dialog = 2;
                      misid = miData[0].id;
                      editdata = -1;
                      itemid = -1;
                      isOpen = true;
                    }}
                  >
                    <PlusIcon size={15} aria-hidden="true" />
                    {$trans('mission.form2.addTask')}
                  </button>
                  {#if miData[0].checklist?.length > 1}
                    <button
                      type="button"
                      class={ghost}
                      onclick={() => {
                        dialog = 3;
                        misid = miData[0].id;
                        itemid = -1;
                        isOpen = true;
                      }}
                    >
                      <Maximize2 size={15} aria-hidden="true" />
                      {$trans('mission.form2.seeAllTasks')}
                    </button>
                  {/if}
                </div>
              </div>
            </OptionRow>

            {#if !specMode && !publishMode}
              <OptionRow icon={UserPlus} title={$trans('mission.form2.assign')} status={assignStatus} bind:open={assignE}>
                <p class="m-0 mb-2 text-sm text-[#6b5560]">{$trans('mission.assingHelp')}</p>
                {#if userslength > 1}
                  <MultiSelect
                    outerDivClass="!min-h-[52px] !rounded-xl !border-[1.5px] !border-[#e4d9c4] !bg-white !text-[#2a1420]"
                    inputClass="!bg-transparent !text-[#2a1420]"
                    liSelectedClass="!rounded-full !bg-[#fdeef4] !text-[#a3124e]"
                    --sms-open-z-index={10000}
                    bind:selected={miData[0].rishoni}
                    placeholder={mf.searchUser}
                    options={pu.map((c) => c.attributes.username)}
                    maxSelect={1}
                    onchange={function () {
                      miData[0].rishon = find_user_id(miData[0].rishoni);
                      miData[0].myM = miData[0].rishoni?.length > 0;
                    }}
                  />
                {:else}
                  <label for="tomeC" class="flex min-h-11 cursor-pointer items-center gap-3">
                    <input
                      bind:checked={miData[0].myM}
                      type="checkbox"
                      id="tomeC"
                      name="tome"
                      value="tome"
                      class="h-5 w-5 accent-[#c8155f]"
                      onclick={() => {
                        miData[0].rishon = 'self';
                        inviteNew = false;
                      }}
                    />
                    <span class="font-medium">{$trans('mission.form2.assignSelfTitle')}</span>
                  </label>
                {/if}
              </OptionRow>
            {/if}

            {#if canInvite}
              <OptionRow
                icon={Mail}
                title={$trans('mission.form2.invite')}
                status={inviteNew && inviteEmail.trim() ? inviteEmail.trim() : $trans('mission.form2.inviteStatus')}
                bind:open={inviteOpen}
              >
                <label for="inviteNewC" class="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    bind:checked={inviteNew}
                    type="checkbox"
                    id="inviteNewC"
                    class="h-5 w-5 accent-[#c8155f]"
                    onchange={() => {
                      if (inviteNew) miData[0].myM = false;
                    }}
                  />
                  <span class="font-semibold">{$trans('mission.invite.optionLabel')}</span>
                </label>
                <p class="m-0 text-sm text-[#6b5560]">
                  {$trans(inviteNeedsEmail ? 'mission.invite.voteHelp' : 'mission.invite.help')}
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
                    placeholder={$trans(inviteNeedsEmail ? 'mission.invite.emailPlaceholderRequired' : 'mission.invite.emailPlaceholder')}
                    aria-label={$trans(inviteNeedsEmail ? 'mission.invite.emailPlaceholderRequired' : 'mission.invite.emailPlaceholder')}
                  />
                {/if}
              </OptionRow>
            {/if}

            <OptionRow icon={LinkLucide} title={$trans('mission.form2.links')} status={linksStatus} bind:open={publinkE}>
              <div class="flex flex-col gap-3">
                <TextInput bind:text={miData[0].publicklinks} lebel={$trans('mission.publicLinks')} />
                <TextInput bind:text={miData[0].privatlinks} lebel={$trans('mission.linkToMission')} />
              </div>
            </OptionRow>

            {#if shiftsOn && inProject}
              <!-- A staffing plan travels with the mission and is approved in
                   the same vote (PLAN_SHIFTS §9.5, §13.6). -->
              <OptionRow
                icon={Clock}
                title={$trans('mission.form2.shifts')}
                status={shiftPlan.enabled ? $trans('mission.form2.shiftsOn') : $trans('mission.form2.shiftsStatus')}
                bind:open={shiftE}
              >
                <ShiftPlanForm
                  bind:value={shiftPlan}
                  onHeadcount={(n) => {
                    miData[0].howMeny = n;
                  }}
                />
              </OptionRow>
            {/if}
          </div>
        </FormSection>
      {/if}
    </div>

    <!-- SUMMARY + publish (desktop): stays in view while the form scrolls. -->
    <aside class="hidden lg:sticky lg:top-4 lg:block lg:w-[340px] lg:flex-none">
      <MissionSummary
        heading={$trans('mission.form2.summary')}
        name={miData[0].missionName}
        meta={summaryMeta}
        valueLabel={$trans('mission.form2.missionValue')}
        total={totalText}
        formula={formulaText}
        {checks}
        note={consentNote}
      >
        {#snippet actions()}
          {@render publishActions()}
        {/snippet}
      </MissionSummary>
    </aside>
  </div>

  <!-- SUMMARY + publish (phone / tablet), at the end of the form -->
  <div class="mt-5 lg:hidden">
    <MissionSummary
      wide
      heading={$trans('mission.form2.summary')}
      name={miData[0].missionName}
      meta={summaryMeta}
      valueLabel={$trans('mission.form2.missionValue')}
      total={totalText}
      formula={formulaText}
      {checks}
      note={consentNote}
    >
      {#snippet actions()}
        {@render publishActions()}
      {/snippet}
    </MissionSummary>
  </div>

  <!-- Publish bar (phone / tablet): above the app's bottom nav, or at the
       very bottom in full-screen mode where the nav is covered. -->
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
</div>
</div>

{#if inviteResult}
  <InviteResultCard
    invite={inviteResult}
    missionName={miData[0].missionName}
    projectName={pn ?? ''}
    onDone={() => {
      const md = inviteMd;
      inviteResult = null;
      inviteMd = null;
      onClose?.({ md });
    }}
  />
{/if}

<style>
  /* Both boxes are painted by `surface-dialog` (app.postcss). */
  :global([data-svelte-dialog-content].contenti) {
    width: 90vw;
  }

  @media (min-width: 768px) {
    :global([data-svelte-dialog-content].contenti) {
      width: 90vw;
    }
  }

  :global([data-svelte-dialog-content].formi) {
    width: 80vw;
  }
  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].formi) {
      width: 50vw;
    }
  }
  textarea::-webkit-resizer {
    border-width: 8px;
    border-style: solid;
    border-color: transparent transparent var(--barbi-pink) var(--barbi-pink);
  }

  .ggd {
    position: sticky;
    bottom: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggr {
    position: sticky;
    top: 77px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggr:hover,
  .ggd:hover {
    background: var(--barbi-pink);
  }

  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .body {
    overflow-x: auto;
    overflow-y: auto;
    height: 110vh;
    width: 96vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  #check table {
    table-layout: fixed;
  }
  .tbl-header {
    position: sticky;
    background-color: rgba(255, 255, 255, 0.3);
  }
  .tbl-content {
    max-height: calc(94vh - 173px);
    margin-top: 0px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  #check th {
    padding: 2px 1px;
    text-align: center;
    font-weight: 500;
    font-family: gan, powerr;
    color: #fff;
    text-transform: uppercase;
  }
  #check td {
    padding: 1px;
    text-align: center;
    vertical-align: middle;
    font-weight: 300;
    font-size: 12px;
    color: var(--barbi-pink);
    border-bottom: solid 1px rgba(255, 255, 255, 0.1);
  }
</style>
