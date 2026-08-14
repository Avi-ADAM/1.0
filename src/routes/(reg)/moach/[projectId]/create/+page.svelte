<script>
  import { t } from '$lib/translations';
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { tick } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import Hand from '$lib/components/prPr/hand.svelte';
  import Handd from '$lib/components/prPr/handd.svelte';
  import ProcessCreator from '$lib/components/process/ProcessCreator.svelte';
  import ChoosMission from '$lib/components/prPr/choosMission.svelte';
  import OpenBoard from '$lib/components/prPr/open/OpenBoard.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import ResourceCreator from '$lib/components/resource/ResourceCreator.svelte';
  import Handp from '$lib/components/prPr/handp.svelte';
  import PlanBoards from '$lib/components/planning/PlanBoards.svelte';
  import Crtask from '$lib/components/prPr/tasks/crtask.svelte';
  import Newmatana from '$lib/components/prPr/newmatana.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { isLinkableMissionType } from '$lib/acts/publishAsMission.js';
  import { toast } from 'svelte-sonner';
  import { invalidateAll } from '$app/navigation';

  const moachStore = getMoachStore();

  let { data } = $props();

  let createMode = $state(null);
  let addM = $state(false);
  let openMS = $state(false);
  let addN = $state(false);
  let openMA = $state(false);
  let hovered = $state(false);
  let hoveredd = $state(false);

  // Prefill state for action=createmission URL param
  let prefillMissionName = $state('');
  let prefillMissionDescrip = $state('');
  /** @type {{name?:string, descrip?:string, nhours?:number, valph?:number, skills?:string[], roles?:string[], workways?:string[], vocab?:{skills?:{id:string,name:string}[], roles?:{id:string,name:string}[], workways?:{id:string,name:string}[]}}|null} */
  let prefillMissionSpec = $state(null);
  /** Resolving the URL's vocabulary against the catalogue, before the form opens. */
  let preparingMission = $state(false);

  /** `a,b , c` → ['a','b','c'] */
  const csv = (v) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  /**
   * Turn free-text vocabulary from the URL into real catalogue entries.
   *
   * The URL carries names only — any producer can build it (the bot's
   * prepareMissionTool, an external MCP agent, a pasted link) — and the form
   * maps chips back to ids against the catalogue it loaded, dropping whatever
   * it cannot find. Rows that come from a planning board are resolved on the
   * server before they are stored; this is the same step for the URL path.
   *
   * Best-effort: on failure the names are used as they are, which is exactly
   * the old behaviour.
   */
  async function resolveUrlVocab(names, missionName) {
    if (!names.skills.length && !names.roles.length && !names.workways.length) return null;
    // Resolution embeds and may create entries, so it is not instant. Bound it:
    // a slow vector store must delay the form by seconds, never hold it shut.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);
    try {
      const res = await fetch('/api/vocab/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...names, name: missionName, lang: $lang }),
        signal: abort.signal
      });
      if (!res.ok) return null;
      const body = await res.json();
      if (!body?.ok) return null;
      return { skills: body.skills ?? [], roles: body.roles ?? [], workways: body.workways ?? [] };
    } catch (err) {
      console.warn('[create] could not resolve URL vocabulary:', err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // Consumer for ?action=createmission — mirrors the createproject consumer in me/+page.svelte.
  // Reads every param prepareMissionTool emits so the AI's suggestions (skills,
  // roles, work-ways, hours, rate) reach the form instead of being dropped.
  $effect(async () => {
    if (page.url.searchParams.has('action')) {
      await tick();
      if (page.url.searchParams.get('action') === 'createmission') {
        const params = page.url.searchParams;
        prefillMissionName    = params.get('name') ?? '';
        prefillMissionDescrip = params.get('descrip') ?? '';
        // Set only here: the act is linked to whatever this form produces.
        fromActId = params.get('fromAct');
        assignActToMe = params.get('assignActToMe') === '1';

        const nhours = Number(params.get('nhours'));
        const valph  = Number(params.get('valph'));

        const names = {
          skills:   csv(params.get('skills')),
          roles:    csv(params.get('roles')),
          workways: csv(params.get('workways'))
        };

        // Resolve BEFORE opening the form: mission.svelte hydrates from
        // `initialSpec` on mount only, so ids that arrive later would never
        // reach it.
        preparingMission = true;
        const vocab = await resolveUrlVocab(names, prefillMissionName);
        preparingMission = false;

        prefillMissionSpec = {
          name: prefillMissionName,
          descrip: prefillMissionDescrip,
          ...names,
          // Canonical names + the ids the form submits (see resolveUrlVocab).
          ...(vocab?.skills.length ? { skills: vocab.skills.map((t) => t.name) } : {}),
          ...(vocab?.roles.length ? { roles: vocab.roles.map((t) => t.name) } : {}),
          ...(vocab?.workways.length ? { workways: vocab.workways.map((t) => t.name) } : {}),
          ...(vocab ? { vocab } : {}),
          ...(Number.isFinite(nhours) && params.get('nhours') ? { nhours } : {}),
          ...(Number.isFinite(valph)  && params.get('valph')  ? { valph }  : {})
        };
        addM = true;
      }
    }
  });

  let projectBase = $derived(data.projectBase);
  // projectMissionsData = full project.attributes from getProjectMissions query
  // (same format the progress page stores in moachStore.missions)
  let projectMissionsData = $derived(data.projectMissionsData);
  let noofopen = $derived(projectMissionsData?.open_missions?.data?.length ?? 0);
  let omiData = $derived(projectMissionsData?.open_missions?.data ?? []);
  /** Mission proposals still awaiting a vote — an opt-in section on the board. */
  let pendmData = $derived(projectMissionsData?.pendms?.data ?? []);
  /** @type {any[]} */
  let missionTemplates = $derived(data.missionTemplates ?? []);
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const base = import.meta.env.VITE_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  let pn = $derived(projectBase?.projectName ?? '');
  let pl = $derived(getImageUrl(projectBase?.profilePic?.data?.attributes?.url));
  let projectUsers = $derived(projectBase?.user_1s?.data ?? []);
  let restime = $derived(projectBase?.restime);
  /** @type {string[]} */
  let alit = $derived(projectBase?.vallues?.data?.map((v) => v.id) ?? []);

  // Missions in progress + the roles they carry — what crtask.svelte needs to
  // offer an assignee (a person on a mission, or a role whose holders get
  // notified). Same derivation as the acts page.
  let bmiData = $derived(projectMissionsData?.mesimabetahaliches?.data ?? []);
  let proles = $derived.by(() => {
    /** @type {{ id: string; name: string }[]} */
    const roles = [];
    const seen = new Set();
    for (const bmi of bmiData) {
      for (const role of bmi.attributes?.tafkidims?.data ?? []) {
        if (!seen.has(role.id)) {
          seen.add(role.id);
          roles.push({ id: role.id, name: role.attributes?.roleDescription ?? '' });
        }
      }
    }
    return roles;
  });

  let openResources = $derived(projectMissionsData?.open_mashaabims?.data ?? []);
  let pmashes = $derived(projectMissionsData?.pmashes?.data ?? []);
  let combinedResources = $derived([...openResources, ...pmashes]);

  let projectId = $derived(page.params.projectId);

  // Seed moachStore in the same format the progress page expects
  $effect(() => {
    if (projectId && projectMissionsData) {
      untrack(() =>
        moachStore.updateProjectData(projectId, 'missions', projectMissionsData)
      );
    }
  });


  function hosa() {
    addM = true;
  }

  function bighand() {
    hovered = !hovered;
  }

  function trym() {
    openMS = true;
  }

  function closeM() {
    addM = false;
  }

  function handleBack() {
    createMode = null;
    addM = false;
    openMS = false;
    addN = false;
    openMA = false;
    addAct = false;
    addProduct = false;
    resourcePrefill = null;
    productPrefill = null;
    // Backing out of a form means the plan row was not turned into anything.
    pendingPlanItem = null;
  }

  async function handleCreated() {
    await invalidateAll();
    handleBack();
  }

  // ── Planning boards ────────────────────────────────────────────────
  // A board row is only a proposal: opening it prefills the *real* creation
  // form, and the row is marked `created` afterwards with whatever the form
  // actually produced. See PLAN_PROJECT_PLANNING_BOARDS.

  /**
   * Board to open on load — the `?board=` deep link planProjectWorkTool hands
   * the user after drafting a plan from the bot or an external agent.
   */
  let deepLinkedBoardId = $derived(page.url.searchParams.get('board'));

  /** The plan row currently being turned into a real entity, if any. */
  let pendingPlanItem = $state(/** @type {any} */ (null));
  let planBoardsRef = $state(/** @type {any} */ (null));
  let addAct = $state(false);
  let actPrefill = $state({ name: '', teur: '', isPersonal: true });
  /** Resource/product rows carry their own prefill into their own form. */
  let addProduct = $state(false);
  let resourcePrefill = $state(/** @type {any} */ (null));
  let productPrefill = $state(/** @type {any} */ (null));
  // Bindables crtask.svelte writes back into (assignee resolved from the
  // selected mission, and the optional start/end dates).
  let actUserMevatzeaId = $state(null);
  let actMimatai = $state(undefined);
  let actAdMatai = $state(undefined);

  /**
   * Record on the board what the form actually created. Best-effort: a failure
   * here must not swallow the fact that the entity itself was created.
   */
  async function markPlanRowCreated(createdType, createdId) {
    const item = pendingPlanItem;
    pendingPlanItem = null;
    if (!item || !createdType || !createdId) return;
    try {
      await executeAction(
        'markPlanItemCreated',
        {
          itemId: String(item.itemId),
          boardId: String(item.boardId),
          projectId: String(projectId),
          createdType: String(createdType),
          createdId: String(createdId)
        },
        { showErrorToast: false }
      );
      await planBoardsRef?.reload?.();
    } catch (err) {
      console.warn('[create] could not mark plan row as created:', err);
    }
  }

  /** Open a plan row in the creation form that matches its kind. */
  function openPlanItem(item, board) {
    const a = item?.attributes ?? {};
    const spec = a.spec ?? {};
    pendingPlanItem = { itemId: item.id, boardId: board.id, kind: a.kind };

    if (a.kind === 'act') {
      actPrefill = {
        name: a.name ?? '',
        teur: a.descrip ?? '',
        // Role-assigned chores open in role mode so the holders get notified.
        isPersonal: spec.assigneeKind !== 'role'
      };
      addAct = true;
      return;
    }

    // A product is what the rikma SELLS — it has its own form and its own
    // action (createComplexMatanot). Sending it to the resource creator, as
    // this page used to, silently turned an offering into a need.
    if (a.kind === 'product') {
      productPrefill = {
        name: a.name ?? '',
        descrip: a.descrip ?? '',
        ...(spec.price != null ? { price: Number(spec.price) } : {}),
        ...(spec.quantity != null ? { quantity: Number(spec.quantity) } : {})
      };
      addProduct = true;
      return;
    }

    if (a.kind === 'resource') {
      resourcePrefill = {
        name: a.name ?? '',
        descrip: a.descrip ?? '',
        ...(spec.kindOf ? { kindOf: spec.kindOf } : {}),
        ...(spec.price != null ? { price: Number(spec.price) } : {}),
        ...(spec.quantity != null ? { quantity: Number(spec.quantity) } : {})
      };
      addN = true;
      return;
    }

    // A note is not a form — there is nothing to create from it.
    if (a.kind === 'note') {
      pendingPlanItem = null;
      return;
    }

    // Default: a mission. Reuse the same prefill path as ?action=createmission.
    prefillMissionName = a.name ?? '';
    prefillMissionDescrip = a.descrip ?? '';
    prefillMissionSpec = {
      name: a.name ?? '',
      descrip: a.descrip ?? '',
      skills: Array.isArray(spec.skills) ? spec.skills : [],
      roles: Array.isArray(spec.roles) ? spec.roles : [],
      workways: Array.isArray(spec.workways) ? spec.workways : [],
      // Server-resolved `{id, name}` pairs — real catalogue entries. Without
      // them the form maps chips back to ids against its own catalogue and
      // drops whatever it cannot find, losing suggestions the member approved.
      ...(spec.vocab ? { vocab: spec.vocab } : {}),
      ...(spec.nhours != null ? { nhours: Number(spec.nhours) } : {}),
      ...(spec.valph != null ? { valph: Number(spec.valph) } : {})
    };
    addM = true;
  }

  // ── Publish an act as a mission ────────────────────────────────────
  // An unplaced act (מטלה ממתינה להשמה) offers "publish as a mission" on the
  // acts table. That button lands here with the act's details prefilled and
  // `?fromAct=<id>` in tow; once the member actually publishes, the act is
  // attached to whatever createMission produced. See PLAN docs and
  // `src/lib/acts/publishAsMission.ts`.

  /**
   * The act this mission is being published from, if any.
   *
   * State rather than a `$derived` off the URL: it is cleared once the link
   * lands, so a member who stays on this page and publishes a second mission
   * does not file the same act under both.
   */
  let fromActId = $state(/** @type {string|null} */ (null));

  /**
   * Set when the member arrived via "I'll do it" → "create a mission" (the
   * picker in `tasks/chooseM.svelte`), rather than via "publish as a mission".
   * They are not publishing the act for the rikma to staff — they are taking
   * it and needed a mission to hang it on.
   */
  let assignActToMe = $state(false);

  /**
   * Attach the source act to the mission that was just created.
   *
   * Best-effort and explicitly so: the mission exists and the rikma may
   * already be voting on it, so a failure here is reported to the member as
   * "link it yourself" rather than being allowed to look like the mission
   * failed to publish.
   */
  async function linkSourceAct(createdType, createdId) {
    const actId = fromActId;
    if (!actId || !createdId || !isLinkableMissionType(createdType)) return;
    try {
      const res = await executeAction(
        'linkActToMission',
        {
          actId: String(actId),
          projectId: String(projectId),
          missionId: String(createdId),
          missionType: createdType
        },
        { showErrorToast: false }
      );
      if (!res?.success) throw new Error(res?.error?.message ?? 'link failed');

      // Only a `mesimabetahalich` is a mission that actually exists and is
      // being run by this member. A `pendm` is still awaiting the rikma's
      // vote and an `openMission` is still looking for its doer — claiming
      // the act against either would assert an assignment nobody agreed to.
      if (assignActToMe && createdType === 'mesimabetahalich') {
        await executeAction(
          'updateTask',
          {
            id: String(actId),
            projectId: String(projectId),
            isAssigned: true,
            uid: [String(page.data.uid)],
            myIshur: true
          },
          { showErrorToast: false }
        );
      }

      fromActId = null;
      assignActToMe = false;
      toast.success(
        $t('mission.actsTable.linkedToMission', { name: res?.data?.actName ?? '' })
      );
    } catch (err) {
      console.warn('[create] could not link the source act to the new mission:', err);
      toast.error($t('mission.actsTable.linkFailed'));
    }
  }

  /** mission.svelte reports `{ md: { createdEntityType, createdEntityId } }`. */
  async function handleMissionClosed(payload) {
    const md = payload?.md;
    if (md?.createdEntityId) {
      await markPlanRowCreated(md.createdEntityType ?? 'mission', md.createdEntityId);
      await linkSourceAct(md.createdEntityType, md.createdEntityId);
    } else {
      pendingPlanItem = null;
    }
    closeM();
  }

  async function handleResourceCreated(data) {
    const id = data?.id ?? data?.data?.id;
    if (id) await markPlanRowCreated('openMashaabim', id);
    else pendingPlanItem = null;
    await handleCreated();
  }

  async function handleActDone(payload) {
    if (payload?.id) await markPlanRowCreated('act', payload.id);
    else pendingPlanItem = null;
    addAct = false;
    await invalidateAll();
  }

  /** newmatana.svelte reports `{ matana }` once the product really exists. */
  async function handleProductDone(payload) {
    const id = payload?.matana?.id ?? payload?.matana?.data?.id ?? payload?.id;
    if (id) await markPlanRowCreated('matanot', id);
    else pendingPlanItem = null;
    addProduct = false;
    productPrefill = null;
    await invalidateAll();
  }
</script>

<svelte:head>
  <title>{data.projectBase?.projectName ? `${data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'יצירה' : $lang === 'ar' ? 'إنشاء' : 'Create'} · 1lev1</title>
  <link rel="preload" as="image" href="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg" />
  <link rel="preload" as="image" href="https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg" />
</svelte:head>

<div class="create-page p-4">

  {#if preparingMission}
    <!-- On the page background, not on the ramp — so this one uses the token
         that follows the mode (--stgold), not --ramp-ink.

         A bare sentence was too quiet for what it covers: resolving the
         vocabulary against the catalogue can take seconds, and arriving here
         from an act's "publish as a mission" the member has already waited
         through a route load. The pulsing rail gives the wait a visible
         shape, so nothing looks stalled. -->
    <div
      class="prep-card mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-2xl px-6 py-5 text-center"
      role="status"
      aria-live="polite"
    >
      <svg class="prep-spin" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-opacity="0.2" stroke-width="2.5" />
        <circle
          cx="12" cy="12" r="9" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-dasharray="30 27"
        />
      </svg>
      <p class="text-sm font-semibold">{$t('moach.create.preparingMission')}</p>
      <span class="prep-rail" aria-hidden="true"><span class="prep-rail__run"></span></span>
    </div>
  {/if}

  <!-- כרטיסים עם עיגולים מוטמעים — נעלמים כשפורם פתוח -->
  {#if !addM && !openMS && !addN && !openMA && !addAct && !addProduct && createMode !== 'process'}
    <!-- באנר AI — גולל ללוחות התכנון בהמשך העמוד -->
    <a
      href="#ai-planning-boards"
      class="group relative flex flex-col sm:flex-row items-center gap-4 w-full max-w-4xl mx-auto mt-8 overflow-hidden rounded-2xl border-2 border-barbi bg-gradient-to-br from-gra via-grb to-gre px-5 py-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
    >
      <div
        class="shrink-0 w-12 h-12 rounded-xl bg-white/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300"
      >
        🤖
      </div>
      <div class="flex flex-col gap-0.5 text-center sm:text-start flex-1 min-w-0">
        <span class="text-xs font-semibold tracking-wide uppercase text-[color:var(--ramp-ink,#16131b)]">
          {$t('moach.create.aiBanner.eyebrow')}
        </span>
        <p class="font-bold text-lg text-[color:var(--ramp-ink,#16131b)]">{$t('moach.create.aiBanner.title')}</p>
        <p class="text-sm text-[color:var(--ramp-ink,#16131b)]">{$t('moach.create.aiBanner.desc')}</p>
      </div>
      <div
        class="shrink-0 flex items-center gap-1.5 bg-barbi text-white font-bold px-4 py-2 rounded-xl group-hover:bg-white group-hover:text-barbi transition-all duration-300 text-sm whitespace-nowrap"
      >
        {$t('moach.create.aiBanner.cta')}
        <svg
          class="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg
        >
      </div>
    </a>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto py-12">

      <!-- משימה -->
      <div class="create-card flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold text-[color:var(--ramp-ink,#16131b)] theme-personal-only">{$t('moach.create.mission')}</h3>
        <p class="text-sm text-center text-[color:var(--ramp-ink,#16131b)]">{$t('moach.create.missionDesc')}</p>

        <div class="theme-personal-only flex flex-col items-center">
          {#if hovered}
            <button onclick={hosa} onmouseleave={() => (hovered = false)}>
              <img
                title={$t('moach.create.hosafa')}
                style="max-width:45vw; max-height:45vw;"
                width="240"
                height="240"
                src="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg"
                alt="add mission"
              />
            </button>
          {:else}
            <Hand
              onHosa={hosa}
              onProgres={bighand}
              onTrym={trym}
              {noofopen}
              {openMS}
              {addM}
              hosafa={$t('moach.create.hosafa')}
            />
          {/if}
        </div>

        <div class="theme-business-only pro-actions">
          <button type="button" class="pro-btn" onclick={hosa} title={$t('moach.create.hosafa')}>
            <svg class="pro-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            {$t('moach.create.mission')}
          </button>
          <button type="button" class="pro-sub" onclick={trym}>
            {$t('project.misc.showOpenActions')}
            <span class="pro-count">{noofopen}</span>
          </button>
        </div>
      </div>

      <!-- משאב -->
      <div class="create-card flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold text-[color:var(--ramp-ink,#16131b)] theme-personal-only">{$t('moach.create.resource')}</h3>
        <p class="text-sm text-center text-[color:var(--ramp-ink,#16131b)]">{$t('moach.create.resourceDesc')}</p>

        <div class="theme-personal-only flex flex-col items-center">
          {#if hoveredd}
            <button onclick={() => (addN = true)} onmouseleave={() => (hoveredd = false)}>
              <img
                title={$t('moach.create.hosafat')}
                style="max-width:45vw; max-height:45vw;"
                width="240"
                height="240"
                src="https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg"
                alt="add resource"
              />
            </button>
          {:else}
            <Handd
              {addN}
              {openMA}
              hosafat={$t('moach.create.hosafat')}
              noofopenm={combinedResources.length}
              onMasi={() => (addN = true)}
              onBighandd={() => (hoveredd = !hoveredd)}
              onTrym={() => (openMA = true)}
            />
          {/if}
        </div>

        <div class="theme-business-only pro-actions">
          <button type="button" class="pro-btn" onclick={() => (addN = true)} title={$t('moach.create.hosafat')}>
            <svg class="pro-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></svg>
            {$t('moach.create.resource')}
          </button>
          <button type="button" class="pro-sub" onclick={() => (openMA = true)}>
            {$t('project.misc.showResourceRequests')}
            <span class="pro-count">{combinedResources.length}</span>
          </button>
        </div>
      </div>

      <!-- תהליך -->
      <div class="create-card flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold text-[color:var(--ramp-ink,#16131b)] theme-personal-only">{$t('moach.create.process')}</h3>
        <p class="text-sm text-center text-[color:var(--ramp-ink,#16131b)]">{$t('moach.create.processDesc')}</p>

        <div class="theme-personal-only flex flex-col items-center">
          <Handp
            hosafap={$t('moach.create.process')}
            onClick={() => (createMode = 'process')}
          />
        </div>

        <div class="theme-business-only pro-actions">
          <button type="button" class="pro-btn" onclick={() => (createMode = 'process')}>
            <svg class="pro-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="5" rx="1" /><rect x="4" y="16" width="16" height="5" rx="1" /><path d="M12 8v4.5M9.5 12.5l2.5 3 2.5-3" /></svg>
            {$t('moach.create.process')}
          </button>
        </div>
      </div>

    </div>

    <!-- לוחות תכנון — הצעות שהופכות למשימות רק אחרי אישור בטופס -->
    <PlanBoards
      bind:this={planBoardsRef}
      {projectId}
      onOpenItem={openPlanItem}
      initialBoardId={deepLinkedBoardId}
    />
  {/if}

  <!-- פורמים — עם כפתור חזרה -->
  {#if addM || openMS || addN || openMA || addAct || addProduct || createMode === 'process'}
    <div class="max-w-4xl mx-auto">
      <button
        onclick={handleBack}
        class="mb-6 flex items-center gap-2 text-[color:var(--goldink,#8a6a15)] hover:text-barbi hover:underline"
      >
        <svg
          class="w-4 h-4 transition-transform duration-200"
          class:rotate-180={$lang === 'he' || $lang === 'ar'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
        >
        {$t('moach.create.back')}
      </button>

      <!-- פורמי משימה -->
      {#if openMS}
        <div class="m-4 border-2 border-barbi rounded bg-slate-900/70 backdrop-blur-sm shadow-xl">
          <div class="p-2 flex justify-end">
            <button
              onclick={() => (openMS = false)}
              aria-label={$t('moach.create.back')}
              class="hover:bg-barbi text-gold hover:text-white font-bold p-1 rounded-full transition-colors"
            >
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
              </svg>
            </button>
          </div>
          <div class="p-2 sm:p-4">
            <OpenBoard
              {projectId}
              projectName={pn}
              missions={omiData}
              pendms={pendmData}
              only="missions"
              showHeader={false}
              linkToFullBoard={true}
            />
          </div>
        </div>
      {/if}
      {#if addM}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl">
          <div class="p-2 flex justify-end">
            <button
              onclick={closeM}
              aria-label={$t('moach.create.back')}
              class="hover:bg-barbi text-[color:var(--ramp-ink,#16131b)] hover:text-white font-bold p-1 rounded-full transition-colors"
            >
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
              </svg>
            </button>
          </div>
          <ChoosMission mission1={missionTemplates} {pn} {pl} {restime} {projectUsers} {alit} onClose={handleMissionClosed} name={prefillMissionName} initialDescrip={prefillMissionDescrip} prefillSpec={prefillMissionSpec} />
        </div>
      {/if}

      <!-- פורמי משאב -->
      {#if openMA}
        <div class="m-4 border-2 border-barbi rounded bg-slate-900/70 backdrop-blur-sm shadow-xl">
          <div class="p-2 flex justify-end">
            <button
              onclick={() => (openMA = false)}
              aria-label={$t('moach.create.back')}
              class="hover:bg-barbi text-gold hover:text-white font-bold p-1 rounded-full transition-colors"
            >
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
              </svg>
            </button>
          </div>
          <div class="p-2 sm:p-4">
            <OpenBoard
              {projectId}
              projectName={pn}
              resources={openResources}
              pmashes={pmashes}
              only="resources"
              showHeader={false}
              linkToFullBoard={true}
            />
          </div>
        </div>
      {/if}
      {#if addN}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl p-6">
          <ResourceCreator
            {projectId}
            initialSpec={resourcePrefill}
            onCreated={handleResourceCreated}
            onCancel={() => {
              pendingPlanItem = null;
              resourcePrefill = null;
              addN = false;
            }}
          />
        </div>
      {/if}

      <!-- מוצר — נפתח משורת לוח מסוג product -->
      {#if addProduct}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl p-6">
          <Newmatana
            initialName={productPrefill?.name ?? ''}
            initialDescrip={productPrefill?.descrip ?? ''}
            initialPrice={productPrefill?.price}
            initialQuantity={productPrefill?.quantity}
            onDone={handleProductDone}
          />
        </div>
      {/if}

      <!-- תהליך -->
      {#if createMode === 'process'}
        <ProcessCreator
          projectId={page.params.projectId}
          onCreated={() => { createMode = null; }}
          onSelect={() => {}}
        />
      {/if}

      <!-- מטלה (Act) — נפתח משורת לוח מסוג act -->
      {#if addAct}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl p-4">
          <Crtask
            {bmiData}
            {proles}
            id={0}
            misid={undefined}
            fromMis={false}
            name={actPrefill.name}
            teur={actPrefill.teur}
            isPersonal={actPrefill.isPersonal}
            bind:userMevatzeaId={actUserMevatzeaId}
            bind:mimatai={actMimatai}
            bind:adMatai={actAdMatai}
            onDone={handleActDone}
          />
        </div>
      {/if}
    </div>
  {/if}

</div>

<style>
  /* ── The two identities of this page ────────────────────────────────────
     "personal" keeps the illustrated circles (hand.svelte / handd.svelte /
     handp.svelte): they ARE the identity, a 240px drawing you click.
     "professional" (html.business) trades them for plain, large, labelled
     buttons — the same three actions, stated instead of drawn.

     The switch is CSS, not `{#if $theme}`: the theme store is seeded from a
     cookie in the browser only, so a JS branch renders the personal markup on
     the server and swaps it after hydration — a visible flip on every load for
     every business user. `html.business` is already on the server-rendered
     <html> (hooks.server.js stamps %themeclass%), so the correct half is
     painted on the first frame and a theme toggle takes effect instantly,
     with no re-render.
     ------------------------------------------------------------------- */
  .theme-business-only {
    display: none;
  }
  :global(html.business) .theme-personal-only {
    display: none;
  }
  :global(html.business) .theme-business-only {
    display: flex;
  }

  /* Sharper corners are most of what reads as "professional" — the same
     scalar the appearance layer uses everywhere else. */
  :global(html.business) .create-card {
    border-radius: var(--radius-theme, 0.25rem);
  }

  /* No `margin-top: auto` here: the process card has no secondary control, so
     pushing the block to the bottom of an equal-height grid cell would land
     its primary button on the other cards' *secondary* row. Starting straight
     after the description keeps the three primaries on one line. */
  .pro-actions {
    flex-direction: column;
    gap: 0.625rem;
    width: 100%;
    padding-top: 0.5rem;
  }

  /* `bg-barbi` + `--gold` ink is the documented safe pairing (6.4:1 in
     business light, 4.8:1 in business dark) — see the gold/barbi contract in
     app.postcss. Hover brightens rather than swapping to --gold-l, which is a
     pale blue in dark mode and would take the ink down with it. */
  .pro-btn,
  .pro-sub {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    border-radius: var(--radius-theme, 0.25rem);
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    transition:
      filter 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.15s ease,
      background-color 0.15s ease;
  }

  .pro-btn {
    padding: 0.875rem 1rem;
    font-size: 1rem;
    color: var(--gold, #f8fafc);
    background: var(--barbi-pink, #1d4ed8);
    border: 1px solid var(--barbi-pink, #1d4ed8);
    box-shadow: var(--shadow-theme, 0 1px 3px rgb(15 23 42 / 0.12));
  }
  .pro-btn:hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgb(15 23 42 / 0.2);
  }

  /* The secondary control sits on the pale ramp, so its surface is a literal
     white wash and its ink is --ramp-ink — both fixed, because the ramp does
     not darken in dark mode. */
  .pro-sub {
    padding: 0.55rem 0.875rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ramp-ink, #16131b);
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--border-g, rgb(29 78 216 / 0.28));
  }
  .pro-sub:hover {
    background: rgb(255 255 255 / 0.95);
  }

  .pro-btn:focus-visible,
  .pro-sub:focus-visible {
    outline: 2px solid var(--barbi-pink, #1d4ed8);
    outline-offset: 2px;
  }

  .pro-ico {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .pro-count {
    min-width: 1.75rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: var(--barbi-pink, #1d4ed8);
    color: var(--gold, #f8fafc);
    font-size: 0.75rem;
    font-weight: 700;
  }
  /* ── "Preparing the mission" wait ─────────────────────────────────
     Sized and coloured off the page tokens so it reads in every theme.
     `--stgold` is the mode-following ink already used by this page. */
  .prep-card {
    color: var(--stgold, #574010);
    background: color-mix(in srgb, currentColor 7%, transparent);
    border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  }

  .prep-spin {
    animation: prep-rotate 0.9s linear infinite;
  }

  @keyframes prep-rotate {
    to { transform: rotate(360deg); }
  }

  .prep-rail {
    display: block;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    overflow: hidden;
    background: color-mix(in srgb, currentColor 14%, transparent);
  }

  .prep-rail__run {
    display: block;
    width: 40%;
    height: 100%;
    border-radius: 999px;
    background: currentColor;
    animation: prep-slide 1.3s ease-in-out infinite;
  }

  /* Indeterminate on purpose: the resolution has no progress to report, and
     a fake percentage would be a lie about how much is left. */
  @keyframes prep-slide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }

  @media (prefers-reduced-motion: reduce) {
    .prep-spin { animation-duration: 2.6s; }
    .prep-rail__run { animation: none; width: 100%; opacity: 0.5; }
  }
</style>
