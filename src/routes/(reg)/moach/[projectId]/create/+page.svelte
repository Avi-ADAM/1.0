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

  /** mission.svelte reports `{ md: { createdEntityType, createdEntityId } }`. */
  async function handleMissionClosed(payload) {
    const md = payload?.md;
    if (md?.createdEntityId) {
      await markPlanRowCreated(md.createdEntityType ?? 'mission', md.createdEntityId);
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
    <p class="max-w-4xl mx-auto mt-6 text-center text-sm text-[color:var(--stgold,#574010)]">
      {$t('moach.create.preparingMission')}
    </p>
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
        <span class="text-xs font-semibold tracking-wide uppercase text-[color:var(--stgold,#574010)]">
          {$t('moach.create.aiBanner.eyebrow')}
        </span>
        <p class="font-bold text-lg text-[color:var(--stgold,#574010)]">{$t('moach.create.aiBanner.title')}</p>
        <p class="text-sm text-[color:var(--stgold,#574010)]">{$t('moach.create.aiBanner.desc')}</p>
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
      <div class="flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold">{$t('moach.create.mission')}</h3>
        <p class="text-sm text-gray-500 text-center">{$t('moach.create.missionDesc')}</p>
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

      <!-- משאב -->
      <div class="flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold">{$t('moach.create.resource')}</h3>
        <p class="text-sm text-gray-500 text-center">{$t('moach.create.resourceDesc')}</p>
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

      <!-- תהליך -->
      <div class="flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold">{$t('moach.create.process')}</h3>
        <p class="text-sm text-gray-500 text-center">{$t('moach.create.processDesc')}</p>
        <Handp
          hosafap={$t('moach.create.process')}
          onClick={() => (createMode = 'process')}
        />
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
        class="mb-6 flex items-center gap-2 text-gold hover:text-barbi hover:underline"
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
              class="hover:bg-barbi text-gold hover:text-white font-bold p-1 rounded-full transition-colors"
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
