<script lang="ts">
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    ArrowRight,
    Check,
    ClipboardList,
    LoaderCircle,
    Package,
    Plus,
    RotateCw,
    Search,
    Sparkles,
    X
  } from '@lucide/svelte';
  import { isRtl, t } from '$lib/translations';
  import {
    buildQuickCreateHref,
    QUICK_CREATE_ACTIONS,
    resolveQuickCreateProjectId,
    type QuickCreateKind,
    type QuickCreateProject
  } from '$lib/quick-create/actions';

  type Props = { compact?: boolean };
  let { compact = true }: Props = $props();

  const RECENT_PROJECT_KEY = 'quickCreateLastProject';
  const PROJECT_CACHE_MS = 60_000;

  let open = $state(false);
  let dialogEl = $state<HTMLDialogElement>();
  let restoreFocusOnClose = true;
  let loading = $state(false);
  let loadError = $state(false);
  let projects = $state<QuickCreateProject[]>([]);
  let loadedAt = $state(0);
  let projectQuery = $state('');
  let selectedProjectId = $state('');
  let projectChoiceTouched = $state(false);
  let selectedKind = $state<QuickCreateKind>('task');
  let searchInput = $state<HTMLInputElement>();
  let trigger = $state<HTMLButtonElement>();
  let loadController: AbortController | null = null;

  const currentProjectId = $derived(page.params.projectId ?? '');
  const userId = $derived(String(page.data?.uid ?? ''));
  const selectedProject = $derived(
    projects.find(
      (project) => String(project.id) === String(selectedProjectId)
    ) ?? null
  );
  const currentProjectIsSelected = $derived(
    !!selectedProject && String(selectedProject.id) === String(currentProjectId)
  );
  const activeAction = $derived(
    QUICK_CREATE_ACTIONS.find((action) => action.id === selectedKind) ??
      QUICK_CREATE_ACTIONS[0]
  );
  const filteredProjects = $derived.by(() => {
    const query = projectQuery.trim().toLocaleLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      project.projectName.toLocaleLowerCase().includes(query)
    );
  });
  const canContinue = $derived(!!selectedProject);

  $effect(() => {
    const dialog = dialogEl;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      void tick().then(() => searchInput?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  function getRecentProjectId() {
    if (!userId || typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(`${RECENT_PROJECT_KEY}:${userId}`);
    } catch {
      return null;
    }
  }

  function applyDefaultProject() {
    selectedProjectId =
      resolveQuickCreateProjectId(
        projects,
        currentProjectId,
        getRecentProjectId()
      ) ?? '';
  }

  async function loadProjects(force = false) {
    if (loading) return;
    if (!force && projects.length && Date.now() - loadedAt < PROJECT_CACHE_MS)
      return;

    loadController?.abort();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    loadController = controller;
    loading = true;
    loadError = false;

    try {
      const response = await fetch('/api/quick-create/projects', {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok)
        throw new Error(`Project list request failed (${response.status})`);
      const body = await response.json();
      const next = Array.isArray(body?.projects)
        ? body.projects.filter(
            (project: unknown): project is QuickCreateProject =>
              !!project &&
              typeof project === 'object' &&
              typeof (project as QuickCreateProject).id === 'string' &&
              typeof (project as QuickCreateProject).projectName === 'string'
          )
        : [];

      projects = next;
      loadedAt = Date.now();
      if (!projectChoiceTouched) applyDefaultProject();
    } catch (error) {
      if (controller.signal.aborted) {
        loadError = true;
        return;
      }
      console.error('[quick-create] Could not load rikmas:', error);
      loadError = true;
    } finally {
      clearTimeout(timeout);
      if (loadController === controller) {
        loading = false;
        loadController = null;
      }
    }
  }

  function openDialog() {
    open = true;
    projectQuery = '';
    projectChoiceTouched = false;
    loadError = false;
    if (projects.length) applyDefaultProject();
    void loadProjects();
  }

  function closeDialog() {
    restoreFocusOnClose = true;
    open = false;
    projectQuery = '';
  }

  function handleDialogCancel(event: Event) {
    event.preventDefault();
    closeDialog();
  }

  function handleDialogClose() {
    if (open) open = false;
    if (restoreFocusOnClose) void tick().then(() => trigger?.focus());
    restoreFocusOnClose = true;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialogEl) closeDialog();
  }

  function handleQuickCreateSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!selectedProject && filteredProjects.length === 1)
      chooseProject(filteredProjects[0]);
    void continueToForm();
  }

  function chooseProject(project: QuickCreateProject) {
    projectChoiceTouched = true;
    selectedProjectId = String(project.id);
    projectQuery = '';
  }

  function updateProjectQuery(event: Event) {
    projectChoiceTouched = true;
    projectQuery = (event.currentTarget as HTMLInputElement).value;
    // Typing a new search must not leave an old default silently selected.
    selectedProjectId = '';
  }

  function getImageUrl(url: string | null) {
    if (!url) return '';
    if (/^(https?:|data:)/i.test(url)) return url;
    const base = import.meta.env.VITE_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  }

  function rememberProject(projectId: string) {
    if (!userId || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`${RECENT_PROJECT_KEY}:${userId}`, projectId);
    } catch {
      // Storage can be unavailable in private browsing; the picker still works.
    }
  }

  async function continueToForm() {
    if (!selectedProject || !canContinue) return;
    const destination = buildQuickCreateHref(selectedKind, selectedProject.id);
    rememberProject(selectedProject.id);
    restoreFocusOnClose = false;
    open = false;
    await goto(destination);
  }

  function onDialogKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.isComposing) return;
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.closest('textarea')) return;

    if (
      target === searchInput &&
      !selectedProjectId &&
      filteredProjects.length === 1
    ) {
      event.preventDefault();
      chooseProject(filteredProjects[0]);
      void continueToForm();
      return;
    }

    if (!canContinue) return;

    const kindButton = target.closest<HTMLButtonElement>('[data-quick-kind]');
    if (kindButton) {
      const kind = kindButton.dataset.quickKind as QuickCreateKind;
      if (kind === selectedKind) {
        event.preventDefault();
        void continueToForm();
      }
      return;
    }

    const projectButton = target.closest<HTMLButtonElement>(
      '[data-quick-project]'
    );
    if (projectButton) {
      if (projectButton.dataset.quickProject === selectedProjectId) {
        event.preventDefault();
        void continueToForm();
      }
      return;
    }

    if (target.closest('button')) return;

    event.preventDefault();
    void continueToForm();
  }
</script>

<button
  bind:this={trigger}
  type="button"
  class="quick-create-trigger"
  class:compact
  aria-label={$t('common.quickCreate.open')}
  aria-haspopup="dialog"
  aria-expanded={open}
  title={$t('common.quickCreate.open')}
  onclick={openDialog}
>
  <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
  {#if !compact}<span>{$t('common.quickCreate.open')}</span>{/if}
</button>

<dialog
  bind:this={dialogEl}
  class="quick-create-dialog"
  aria-labelledby="quick-create-dialog-title"
  aria-describedby="quick-create-description"
  dir={$isRtl ? 'rtl' : 'ltr'}
  oncancel={handleDialogCancel}
  onclose={handleDialogClose}
  onclick={handleBackdropClick}
  onkeydown={onDialogKeydown}
>
  <form class="quick-create-panel" onsubmit={handleQuickCreateSubmit}>
    <div class="panel-glow" aria-hidden="true"></div>

    <header class="panel-header">
      <div class="heading-lockup">
        <span class="eyebrow">
          <span class="eyebrow-dot" aria-hidden="true"></span>
          {$t('common.quickCreate.eyebrow')}
        </span>
        <h2 id="quick-create-dialog-title">{$t('common.quickCreate.title')}</h2>
        <p id="quick-create-description">{$t('common.quickCreate.subtitle')}</p>
      </div>
      <button
        type="button"
        class="icon-button close-button"
        aria-label={$t('common.quickCreate.close')}
        title={$t('common.quickCreate.close')}
        onclick={closeDialog}
      >
        <X size={19} aria-hidden="true" />
      </button>
    </header>

    <div class="panel-content">
      <section class="choice-section" aria-labelledby="quick-create-kind-label">
        <div class="section-heading">
          <span class="step-number">01</span>
          <div>
            <h3 id="quick-create-kind-label">
              {$t('common.quickCreate.chooseKind')}
            </h3>
            <p>{$t('common.quickCreate.chooseKindHint')}</p>
          </div>
        </div>

        <div
          class="kind-grid"
          role="group"
          aria-labelledby="quick-create-kind-label"
        >
          {#each QUICK_CREATE_ACTIONS as action (action.id)}
            {@const selected = selectedKind === action.id}
            <button
              type="button"
              class="kind-card"
              class:selected
              aria-pressed={selected}
              data-quick-kind={action.id}
              onclick={() => (selectedKind = action.id)}
            >
              <span class="kind-icon" aria-hidden="true">
                {#if action.id === 'task'}
                  <ClipboardList size={20} strokeWidth={1.8} />
                {:else if action.id === 'mission'}
                  <Sparkles size={20} strokeWidth={1.8} />
                {:else}
                  <Package size={20} strokeWidth={1.8} />
                {/if}
              </span>
              <span class="kind-copy">
                <span class="kind-title">{$t(action.titleKey)}</span>
                <span class="kind-hint">{$t(action.descriptionKey)}</span>
              </span>
              <span class="kind-check" aria-hidden="true">
                {#if selected}<Check size={14} strokeWidth={2.5} />{/if}
              </span>
            </button>
          {/each}
        </div>
      </section>

      <section
        class="project-section"
        aria-labelledby="quick-create-project-label"
      >
        <div class="section-heading">
          <span class="step-number">02</span>
          <div>
            <h3 id="quick-create-project-label">
              {$t('common.quickCreate.chooseProject')}
            </h3>
            <p>{$t('common.quickCreate.chooseProjectHint')}</p>
          </div>
        </div>

        {#if selectedProject}
          <div class="selected-project" aria-live="polite">
            <span class="selected-avatar">
              {#if selectedProject.profilePic}
                <img src={getImageUrl(selectedProject.profilePic)} alt="" />
              {:else}
                <span
                  >{selectedProject.projectName
                    .trim()
                    .charAt(0)
                    .toLocaleUpperCase()}</span
                >
              {/if}
            </span>
            <span class="selected-copy">
              <span class="selected-label">
                {currentProjectIsSelected
                  ? $t('common.quickCreate.currentProject')
                  : $t('common.quickCreate.selectedProject')}
              </span>
              <strong>{selectedProject.projectName}</strong>
            </span>
            <span class="selected-check" aria-hidden="true"
              ><Check size={17} /></span
            >
          </div>
        {/if}

        <label class="project-search">
          <Search size={17} strokeWidth={2} aria-hidden="true" />
          <span class="sr-only">{$t('common.quickCreate.searchProjects')}</span>
          <input
            bind:this={searchInput}
            type="search"
            value={projectQuery}
            oninput={updateProjectQuery}
            placeholder={$t('common.quickCreate.searchProjects')}
            autocomplete="off"
            aria-controls="quick-create-project-list"
            disabled={loading && projects.length === 0}
          />
          {#if loading}
            <span
              class="loading-icon"
              role="status"
              aria-label={$t('common.quickCreate.loading')}
            >
              <LoaderCircle size={17} aria-hidden="true" />
            </span>
          {:else if projectQuery}
            <button
              type="button"
              class="clear-search"
              aria-label={$t('common.quickCreate.clearSearch')}
              onclick={() => {
                projectQuery = '';
                searchInput?.focus();
              }}><X size={15} aria-hidden="true" /></button
            >
          {/if}
        </label>

        {#if loadError && projects.length === 0}
          <div class="state-card error-state" role="alert">
            <span class="state-symbol"
              ><RotateCw size={19} aria-hidden="true" /></span
            >
            <div>
              <strong>{$t('common.quickCreate.loadError')}</strong>
              <p>{$t('common.quickCreate.loadErrorHint')}</p>
            </div>
            <button
              type="button"
              class="retry-button"
              onclick={() => loadProjects(true)}
            >
              {$t('common.quickCreate.retry')}
            </button>
          </div>
        {:else if !loading && projects.length === 0}
          <div class="state-card empty-state">
            <span class="state-symbol"
              ><Package size={19} aria-hidden="true" /></span
            >
            <div>
              <strong>{$t('common.quickCreate.noProjects')}</strong>
              <p>{$t('common.quickCreate.noProjectsHint')}</p>
            </div>
            <a class="browse-link" href="/moach" onclick={closeDialog}>
              {$t('common.quickCreate.browseProjects')}<ArrowRight
                size={14}
                aria-hidden="true"
              />
            </a>
          </div>
        {:else if !loading && filteredProjects.length === 0}
          <div class="no-results" role="status">
            {$t('common.quickCreate.noResults')}
          </div>
        {:else}
          <div
            id="quick-create-project-list"
            class="project-list"
            role="group"
            aria-label={$t('common.quickCreate.projectList')}
          >
            {#each filteredProjects as project (project.id)}
              {@const chosen = String(project.id) === String(selectedProjectId)}
              <button
                type="button"
                class="project-option"
                class:chosen
                aria-pressed={chosen}
                data-quick-project={project.id}
                onclick={() => chooseProject(project)}
              >
                <span class="project-avatar">
                  {#if project.profilePic}
                    <img
                      src={getImageUrl(project.profilePic)}
                      alt=""
                      loading="lazy"
                    />
                  {:else}
                    <span
                      >{project.projectName
                        .trim()
                        .charAt(0)
                        .toLocaleUpperCase()}</span
                    >
                  {/if}
                </span>
                <span class="project-name">{project.projectName}</span>
                {#if String(project.id) === String(currentProjectId)}
                  <span class="current-badge"
                    >{$t('common.quickCreate.currentBadge')}</span
                  >
                {/if}
                <span class="project-check" aria-hidden="true">
                  {#if chosen}<Check size={15} strokeWidth={2.5} />{/if}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </section>
    </div>

    <footer class="panel-footer">
      <div class="destination-preview" aria-live="polite">
        <span class="preview-dot" aria-hidden="true"></span>
        {#if selectedProject}
          <span>
            {$t('common.quickCreate.preview', {
              action: $t(activeAction.titleKey),
              project: selectedProject.projectName
            })}
          </span>
        {:else}
          <span>{$t('common.quickCreate.selectProjectHint')}</span>
        {/if}
      </div>
      <div class="footer-actions">
        <span class="keyboard-hint"
          ><kbd>Enter</kbd> {$t('common.quickCreate.openHint')}</span
        >
        <button
          type="button"
          class="continue-button"
          disabled={!canContinue}
          onclick={continueToForm}
        >
          <span>{$t('common.quickCreate.openForm')}</span>
          <kbd aria-hidden="true">↵</kbd>
          <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </footer>
  </form>
</dialog>

<style>
  .quick-create-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-width: 2.25rem;
    min-height: 2.25rem;
    padding: 0.4rem;
    border: 1px solid rgb(255 230 154 / 0.72);
    border-radius: 999px;
    color: #20180a;
    background: linear-gradient(145deg, #ffe9a7 0%, #f4c65e 48%, #d99a2d 100%);
    box-shadow:
      0 5px 14px rgb(5 4 10 / 0.25),
      inset 0 1px 0 rgb(255 255 255 / 0.6);
    cursor: pointer;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      filter 160ms ease;
  }
  .quick-create-trigger:hover {
    transform: translateY(-1px) scale(1.04);
    filter: saturate(1.1);
    box-shadow:
      0 7px 18px rgb(5 4 10 / 0.32),
      inset 0 1px 0 rgb(255 255 255 / 0.7);
  }
  .quick-create-trigger:focus-visible,
  .icon-button:focus-visible,
  .kind-card:focus-visible,
  .project-option:focus-visible,
  .continue-button:focus-visible,
  .retry-button:focus-visible,
  .browse-link:focus-visible {
    outline: 3px solid #68b7ff;
    outline-offset: 3px;
  }
  .quick-create-trigger:active {
    transform: scale(0.97);
  }
  .quick-create-trigger.compact {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    min-height: 2rem;
    padding: 0;
  }
  .quick-create-trigger:not(.compact) {
    padding-inline: 0.9rem;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .quick-create-dialog {
    position: fixed;
    inset: 0;
    width: min(680px, calc(100vw - 2rem));
    max-width: calc(100vw - 2rem);
    max-height: min(90vh, 860px);
    max-height: min(90dvh, 860px);
    margin: auto;
    padding: 0;
    overflow: hidden;
    color: var(--surface-ink, #f4ecd6);
    background: var(--surface, #171512);
    border: 1px solid rgb(230 194 113 / 24%);
    border-radius: 26px;
    box-shadow:
      0 34px 100px rgb(0 0 0 / 48%),
      0 0 0 1px rgb(255 255 255 / 3%);
    animation: quick-create-enter 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .quick-create-dialog::backdrop {
    background: rgb(7 8 14 / 72%);
    backdrop-filter: blur(10px) saturate(0.8);
  }
  .quick-create-panel {
    position: relative;
    display: flex;
    min-height: 0;
    max-height: inherit;
    flex-direction: column;
    overflow: hidden;
    isolation: isolate;
  }
  .panel-glow {
    position: absolute;
    z-index: -1;
    inset: 0 0 auto;
    height: 190px;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse at 12% 0%,
        rgb(205 68 143 / 18%),
        transparent 65%
      ),
      radial-gradient(ellipse at 88% 0%, rgb(247 198 94 / 12%), transparent 62%);
  }
  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.6rem 1.65rem 1.1rem;
    border-bottom: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
  }
  .heading-lockup {
    min-width: 0;
  }
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
    color: var(--goldink, #f0c040);
    font-size: 0.68rem;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .eyebrow-dot {
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 50%;
    background: #e9ae41;
    box-shadow:
      0 0 0 4px rgb(233 174 65 / 13%),
      0 0 12px rgb(233 174 65 / 50%);
  }
  .panel-header h2 {
    margin: 0;
    color: var(--surface-ink, #f4ecd6);
    font-size: clamp(1.35rem, 4vw, 1.8rem);
    font-weight: 820;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }
  .panel-header p {
    max-width: 39rem;
    margin: 0.55rem 0 0;
    color: var(--surface-muted, #a89a86);
    font-size: 0.88rem;
    line-height: 1.5;
  }
  .icon-button {
    display: inline-grid;
    width: 2.25rem;
    height: 2.25rem;
    flex: 0 0 auto;
    place-items: center;
    padding: 0;
    border: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 50%;
    color: var(--surface-muted, #a89a86);
    background: var(--surface-2, #201d19);
    cursor: pointer;
    transition:
      color 140ms ease,
      background 140ms ease,
      border-color 140ms ease;
  }
  .icon-button:hover {
    color: var(--surface-ink, #f4ecd6);
    border-color: var(--goldink, #f0c040);
  }
  .panel-content {
    display: grid;
    min-height: 0;
    flex: 1 1 auto;
    gap: 1.25rem;
    padding: 1.35rem 1.65rem 1.2rem;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .choice-section,
  .project-section {
    min-width: 0;
  }
  .section-heading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .step-number {
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid rgb(230 194 113 / 32%);
    border-radius: 0.7rem;
    color: var(--goldink, #f0c040);
    background: rgb(230 194 113 / 8%);
    font-size: 0.68rem;
    font-weight: 850;
    letter-spacing: 0.03em;
  }
  .section-heading h3 {
    margin: 0;
    color: var(--surface-ink, #f4ecd6);
    font-size: 0.91rem;
    font-weight: 780;
  }
  .section-heading p {
    margin: 0.15rem 0 0;
    color: var(--surface-muted, #a89a86);
    font-size: 0.74rem;
    line-height: 1.35;
  }
  .kind-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.65rem;
  }
  .kind-card {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 6.6rem;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.85rem 0.75rem;
    border: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 15px;
    color: var(--surface-ink, #f4ecd6);
    text-align: start;
    background: color-mix(in srgb, var(--surface-2, #201d19) 90%, transparent);
    cursor: pointer;
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease;
  }
  .kind-card:hover {
    transform: translateY(-2px);
    border-color: rgb(230 194 113 / 55%);
  }
  .kind-card.selected {
    border-color: var(--goldink, #f0c040);
    background: linear-gradient(
      140deg,
      rgb(221 174 75 / 15%),
      rgb(205 68 143 / 8%)
    );
    box-shadow:
      inset 0 0 0 1px rgb(230 194 113 / 14%),
      0 7px 20px rgb(0 0 0 / 10%);
  }
  .kind-icon {
    display: grid;
    width: 2.1rem;
    height: 2.1rem;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid rgb(230 194 113 / 20%);
    border-radius: 0.75rem;
    color: var(--goldink, #f0c040);
    background: rgb(230 194 113 / 8%);
  }
  .kind-copy {
    display: grid;
    gap: 0.28rem;
    min-width: 0;
    padding-top: 0.03rem;
  }
  .kind-title {
    font-size: 0.84rem;
    font-weight: 800;
    line-height: 1.25;
  }
  .kind-hint {
    color: var(--surface-muted, #a89a86);
    font-size: 0.69rem;
    line-height: 1.35;
  }
  .kind-check {
    display: grid;
    width: 1.15rem;
    height: 1.15rem;
    flex: 0 0 auto;
    place-items: center;
    margin-inline-start: auto;
    border: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 50%;
    color: #20180a;
    background: transparent;
  }
  .kind-card.selected .kind-check {
    border-color: #f4c65e;
    background: #f4c65e;
  }
  .selected-project {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 0.6rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid rgb(230 194 113 / 26%);
    border-radius: 13px;
    background: linear-gradient(
      100deg,
      rgb(230 194 113 / 9%),
      rgb(205 68 143 / 5%)
    );
  }
  .selected-avatar,
  .project-avatar {
    display: grid;
    width: 2.25rem;
    height: 2.25rem;
    flex: 0 0 auto;
    place-items: center;
    overflow: hidden;
    border: 1px solid rgb(230 194 113 / 36%);
    border-radius: 50%;
    color: var(--goldink, #f0c040);
    background: var(--surface-2, #201d19);
    font-size: 0.85rem;
    font-weight: 800;
  }
  .selected-avatar img,
  .project-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .selected-copy {
    display: grid;
    min-width: 0;
    gap: 0.08rem;
  }
  .selected-label {
    color: var(--surface-muted, #a89a86);
    font-size: 0.67rem;
  }
  .selected-copy strong {
    overflow: hidden;
    color: var(--surface-ink, #f4ecd6);
    font-size: 0.85rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .selected-check {
    display: grid;
    place-items: center;
    margin-inline-start: auto;
    color: var(--goldink, #f0c040);
  }
  .project-search {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.65rem;
    padding-inline: 0.85rem;
    border: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 12px;
    color: var(--surface-muted, #a89a86);
    background: var(--surface-2, #201d19);
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }
  .project-search:focus-within {
    border-color: var(--goldink, #f0c040);
    box-shadow: 0 0 0 3px rgb(230 194 113 / 12%);
  }
  .project-search input {
    width: 100%;
    min-width: 0;
    padding: 0.7rem 0;
    border: 0;
    outline: 0;
    color: var(--surface-ink, #f4ecd6);
    background: transparent;
    font: inherit;
    font-size: 0.83rem;
  }
  .project-search input::placeholder {
    color: var(--surface-muted, #a89a86);
    opacity: 0.8;
  }
  .project-search input::-webkit-search-cancel-button {
    display: none;
  }
  .loading-icon {
    display: grid;
    flex: 0 0 auto;
    animation: quick-create-spin 950ms linear infinite;
  }
  .clear-search {
    display: grid;
    width: 1.7rem;
    height: 1.7rem;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: 50%;
    color: var(--surface-muted, #a89a86);
    background: transparent;
    cursor: pointer;
  }
  .clear-search:hover {
    color: var(--surface-ink, #f4ecd6);
    background: rgb(255 255 255 / 7%);
  }
  .project-list {
    display: grid;
    max-height: 10.5rem;
    gap: 0.28rem;
    margin-top: 0.55rem;
    padding: 0.1rem 0.12rem 0.1rem 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-color: rgb(230 194 113 / 55%) transparent;
    scrollbar-width: thin;
  }
  .project-option {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.65rem;
    padding: 0.48rem 0.62rem;
    border: 1px solid transparent;
    border-radius: 11px;
    color: var(--surface-ink, #f4ecd6);
    text-align: start;
    background: transparent;
    cursor: pointer;
    transition:
      background 130ms ease,
      border-color 130ms ease;
  }
  .project-option:hover {
    background: rgb(255 255 255 / 5%);
  }
  .project-option.chosen {
    border-color: rgb(230 194 113 / 34%);
    background: rgb(230 194 113 / 8%);
  }
  .project-avatar {
    width: 1.9rem;
    height: 1.9rem;
    font-size: 0.75rem;
  }
  .project-name {
    overflow: hidden;
    font-size: 0.8rem;
    font-weight: 680;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .current-badge {
    flex: 0 0 auto;
    padding: 0.2rem 0.42rem;
    border: 1px solid rgb(230 194 113 / 25%);
    border-radius: 999px;
    color: var(--goldink, #f0c040);
    background: rgb(230 194 113 / 7%);
    font-size: 0.59rem;
    font-weight: 740;
  }
  .project-check {
    display: grid;
    width: 1.3rem;
    height: 1.3rem;
    flex: 0 0 auto;
    place-items: center;
    margin-inline-start: auto;
    border: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 50%;
    color: #20180a;
  }
  .project-option.chosen .project-check {
    border-color: #f4c65e;
    background: #f4c65e;
  }
  .state-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem 0.7rem;
    margin-top: 0.6rem;
    padding: 0.8rem;
    border: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 12px;
    background: var(--surface-2, #201d19);
  }
  .state-symbol {
    display: grid;
    width: 2.1rem;
    height: 2.1rem;
    grid-row: span 2;
    place-items: center;
    border-radius: 0.7rem;
    color: var(--goldink, #f0c040);
    background: rgb(230 194 113 / 9%);
  }
  .state-card strong {
    color: var(--surface-ink, #f4ecd6);
    font-size: 0.8rem;
  }
  .state-card p {
    margin: 0.15rem 0 0;
    color: var(--surface-muted, #a89a86);
    font-size: 0.7rem;
    line-height: 1.45;
  }
  .retry-button,
  .browse-link {
    grid-column: 2;
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.38rem 0.58rem;
    border: 1px solid rgb(230 194 113 / 28%);
    border-radius: 8px;
    color: var(--goldink, #f0c040);
    background: transparent;
    font-size: 0.7rem;
    font-weight: 750;
    text-decoration: none;
    cursor: pointer;
  }
  .retry-button:hover,
  .browse-link:hover {
    background: rgb(230 194 113 / 9%);
  }
  .no-results {
    margin-top: 0.6rem;
    padding: 0.85rem;
    border: 1px dashed var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 11px;
    color: var(--surface-muted, #a89a86);
    font-size: 0.76rem;
    text-align: center;
  }
  .panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.9rem 1.65rem 1rem;
    border-top: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    background: color-mix(in srgb, var(--surface) 90%, transparent);
  }
  .destination-preview {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
    color: var(--surface-muted, #a89a86);
    font-size: 0.72rem;
    line-height: 1.4;
  }
  .destination-preview > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .preview-dot {
    width: 0.48rem;
    height: 0.48rem;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--goldink, #f0c040);
    box-shadow: 0 0 0 4px rgb(230 194 113 / 10%);
  }
  .footer-actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.85rem;
  }
  .keyboard-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--surface-muted, #a89a86);
    font-size: 0.65rem;
    white-space: nowrap;
  }
  kbd {
    display: inline-grid;
    min-width: 1.25rem;
    height: 1.2rem;
    place-items: center;
    padding: 0 0.25rem;
    border: 1px solid var(--surface-line, rgb(255 255 255 / 12%));
    border-radius: 5px;
    color: var(--surface-ink, #f4ecd6);
    background: var(--surface-2, #201d19);
    font: inherit;
    font-size: 0.61rem;
    font-weight: 700;
  }
  .continue-button {
    display: inline-flex;
    min-height: 2.65rem;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 0.6rem 0.9rem;
    border: 1px solid rgb(255 238 182 / 55%);
    border-radius: 11px;
    color: #211707;
    background: linear-gradient(145deg, #ffe9a7 0%, #f4c65e 50%, #dfa33c 100%);
    box-shadow:
      0 7px 18px rgb(0 0 0 / 17%),
      inset 0 1px 0 rgb(255 255 255 / 60%);
    font-size: 0.78rem;
    font-weight: 830;
    white-space: nowrap;
    cursor: pointer;
    transition:
      transform 140ms ease,
      filter 140ms ease,
      opacity 140ms ease;
  }
  .continue-button:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.04);
  }
  .continue-button:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
  .continue-button:disabled {
    opacity: 0.42;
    cursor: not-allowed;
    box-shadow: none;
  }
  .continue-button kbd {
    border-color: rgb(40 30 8 / 18%);
    color: rgb(38 26 8 / 76%);
    background: rgb(255 255 255 / 25%);
  }
  .continue-button :global(svg:last-child) {
    transform: scaleX(1);
  }
  .quick-create-dialog[dir='rtl'] .continue-button :global(svg:last-child) {
    transform: scaleX(-1);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes quick-create-enter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  @keyframes quick-create-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .quick-create-dialog {
      inset: auto 0 0;
      width: 100%;
      max-width: none;
      max-height: min(92vh, 860px);
      max-height: min(92dvh, 860px);
      margin: 0;
      border-radius: 24px 24px 0 0;
      border-inline: 0;
      border-bottom: 0;
      animation-name: quick-create-sheet-enter;
    }
    .panel-header {
      padding: 1.35rem 1.15rem 1rem;
    }
    .panel-content {
      gap: 1rem;
      padding: 1rem 1.15rem;
    }
    .kind-grid {
      gap: 0.45rem;
    }
    .kind-card {
      min-height: 6.2rem;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.7rem 0.62rem;
    }
    .kind-icon {
      width: 1.8rem;
      height: 1.8rem;
      border-radius: 0.65rem;
    }
    .kind-icon :global(svg) {
      width: 17px;
      height: 17px;
    }
    .kind-copy {
      gap: 0.2rem;
    }
    .kind-title {
      font-size: 0.76rem;
    }
    .kind-hint {
      font-size: 0.62rem;
    }
    .kind-check {
      position: absolute;
      top: 0.55rem;
      inset-inline-end: 0.55rem;
      width: 1rem;
      height: 1rem;
    }
    .panel-footer {
      align-items: stretch;
      flex-direction: column;
      gap: 0.65rem;
      padding: 0.8rem 1.15rem calc(0.85rem + env(safe-area-inset-bottom));
    }
    .destination-preview {
      font-size: 0.68rem;
    }
    .footer-actions {
      justify-content: space-between;
    }
    .keyboard-hint {
      font-size: 0.62rem;
    }
    .continue-button {
      min-height: 2.75rem;
    }
  }
  @media (max-width: 390px) {
    .panel-header {
      padding-inline: 1rem;
    }
    .panel-content {
      padding-inline: 1rem;
    }
    .panel-footer {
      padding-inline: 1rem;
    }
    .kind-grid {
      grid-template-columns: 1fr;
    }
    .kind-card {
      min-height: 0;
      flex-direction: row;
      align-items: center;
    }
    .kind-check {
      position: static;
      width: 1.15rem;
      height: 1.15rem;
      margin-inline-start: auto;
    }
    .kind-title {
      font-size: 0.82rem;
    }
    .kind-hint {
      font-size: 0.68rem;
    }
  }
  @keyframes quick-create-sheet-enter {
    from {
      opacity: 0.65;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .quick-create-trigger,
    .kind-card,
    .continue-button {
      transition: none;
    }
    .quick-create-dialog {
      animation: none;
    }
    .loading-icon {
      animation-duration: 2s;
    }
  }
</style>
