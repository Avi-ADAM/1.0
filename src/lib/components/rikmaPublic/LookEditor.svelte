<script>
  /**
   * The rikma's address & look editor (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §4.6, §5.5).
   *
   * Everything here edits a plain `RikmaLook` — a layer over the rikma's real
   * public pages. The preview is those pages themselves, in an iframe
   * (`?lookFrame=1`, see `$lib/rikmaLook/frame.svelte.ts`): the main page,
   * /join and /support, rendered by the very components a visitor gets, in
   * any of the four appearances (personal / business × light / dark). The
   * draft travels to the frame by postMessage on every change, so what a
   * member sees is exactly what a visitor will get. The one button sends it
   * to `proposeRikmaIdentity`: applied at once in a rikma of one, a proposal
   * for the others to approve otherwise.
   */
  import { onMount, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { theme, resolvedMode } from '$lib/stores/theme.js';
  import {
    CORNERS,
    CTA_KINDS,
    CTA_LABELS,
    FOCUSES,
    FONTS,
    LIMITS,
    REG_KINDS,
    applyPreset,
    defaultLook,
    lookIssues,
    parseHex,
    parseLook,
    sameLook
  } from '$lib/rikmaLook/look';
  import { skinColors } from '$lib/rikmaLook/tokens';
  import { EDITOR_SOURCE, FRAME_PARAM, FRAME_SOURCE } from '$lib/rikmaLook/frame.svelte';
  import { suggestSlug, validateSlug } from '$lib/rikmaAddress/slug.js';
  import { displayAddress } from '$lib/rikmaAddress/rikmaUrl.js';

  /** @type {{ data: any, projectId: string }} */
  let { data, projectId } = $props();

  const PALETTE = [
    '#0f766e', '#0e7490', '#1d4ed8', '#4338ca', '#7c3aed',
    '#c2185b', '#be123c', '#b45309', '#166534', '#334155'
  ];

  /** @type {readonly ('primary' | 'secondary')[]} */
  const CTA_SLOTS = ['primary', 'secondary'];
  /** @type {readonly ('booking' | 'donate' | 'reports' | 'accessibility')[]} */
  const LINK_KEYS = ['booking', 'donate', 'reports', 'accessibility'];
  /** @type {readonly ['hue' | 'hue2', 'gold' | 'pink'][]} */
  const COLOURS = [
    ['hue', 'gold'],
    ['hue2', 'pink']
  ];
  /** @type {readonly ('main' | 'join' | 'support')[]} */
  const PAGES = ['main', 'join', 'support'];

  let solo = $derived((data.memberCount ?? 1) <= 1);
  let projectName = $derived(data.page?.projectData?.attributes?.projectName ?? '');

  // ── Address ───────────────────────────────────────────────────────────
  let slugInput = $state(untrack(() => data.slug ?? suggestSlug(data.page?.projectData?.attributes?.projectName)));
  /** @type {{ status: string, slug: string }} */
  let slugCheck = $state({ status: 'idle', slug: '' });
  let seq = 0;

  async function checkSlug(/** @type {string} */ raw) {
    const v = validateSlug(raw);
    if (v.ok === false) {
      slugCheck = { status: v.problem, slug: v.slug };
      return;
    }
    if (v.slug === data.slug) {
      slugCheck = { status: 'current', slug: v.slug };
      return;
    }
    const my = ++seq;
    slugCheck = { status: 'checking', slug: v.slug };
    const r = await executeAction('checkRikmaSlug', { projectId, slug: v.slug }, { showErrorToast: false });
    if (my !== seq) return;
    slugCheck = { status: r.success ? r.data.status : 'unknown', slug: v.slug };
  }

  $effect(() => {
    const raw = slugInput;
    if (!data.ready) return;
    const id = setTimeout(() => checkSlug(raw), 350);
    return () => clearTimeout(id);
  });

  let slugOk = $derived(slugCheck.status === 'available' || slugCheck.status === 'mine');

  // ── Look ──────────────────────────────────────────────────────────────
  let look = $state(untrack(() => structuredClone(data.look ?? defaultLook('community'))));

  let parsed = $derived(parseLook($state.snapshot(look)));
  let issues = $derived(parsed ? lookIssues(parsed) : []);
  let changed = $derived(!sameLook(parsed, data.look));
  let skin = $derived(skinColors(parsed));
  let asksForDonation = $derived(
    look.cta.primary.kind === 'donate' || look.cta.secondary?.kind === 'donate'
  );

  function chooseFocus(/** @type {any} */ focus) {
    look = applyPreset(parsed ?? look, focus);
  }

  function setHue(/** @type {'hue' | 'hue2'} */ which, /** @type {string} */ value) {
    const hex = parseHex(value);
    if (hex) look.style[which] = hex;
  }

  function move(/** @type {number} */ i, /** @type {number} */ dir) {
    const j = i + dir;
    if (j < 0 || j >= look.blocks.length) return;
    const next = [...look.blocks];
    [next[i], next[j]] = [next[j], next[i]];
    look.blocks = next;
  }

  // ── Cover upload ──────────────────────────────────────────────────────
  let uploading = $state(false);
  let uploadError = $state('');

  async function upload(/** @type {Event} */ e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget);
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    uploadError = '';
    // Raster only — an SVG can carry script, and the server drops it anyway.
    if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) {
      uploadError = $t('rikmaLook.editor.media.badType');
      return;
    }
    uploading = true;
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(String(res.status));
      const f = (await res.json())?.[0];
      if (!f?.id || !f?.url) throw new Error('no file');
      look.media.cover = { id: String(f.id), url: String(f.url) };
    } catch {
      uploadError = $t('rikmaLook.editor.media.failed');
    } finally {
      uploading = false;
    }
  }

  /** One field of a door. */
  function setCta(/** @type {'primary' | 'secondary'} */ slot, /** @type {'kind' | 'label' | 'url'} */ field, /** @type {any} */ value) {
    const c = look.cta[slot];
    if (c) look.cta[slot] = { ...c, [field]: value };
  }

  // ── Lists ─────────────────────────────────────────────────────────────
  const addStat = () => look.stats.length < LIMITS.stats && look.stats.push({ value: '', label: '' });
  const addPartner = () => look.partners.length < LIMITS.partners && look.partners.push({ name: '', url: null });

  // ── Preview: the real pages, in a frame ───────────────────────────────
  /** @type {HTMLIFrameElement | undefined} */
  let frameEl = $state();
  let frameReady = $state(false);
  /** @type {'main' | 'join' | 'support'} */
  let requestedPage = $state('main');
  /** Which page the frame shows — a door clicked inside it moves it on its own. */
  /** @type {'main' | 'join' | 'support' | 'other'} */
  let shownPage = $state('main');
  let reload = $state(0);
  /** @type {'personal' | 'business'} */
  let previewTheme = $state(untrack(() => get(theme)));
  /** @type {'light' | 'dark'} */
  let previewMode = $state(untrack(() => get(resolvedMode)));
  /** @type {'desktop' | 'mobile'} */
  let previewWidth = $state('desktop');

  const pagePath = (/** @type {string} */ p) => `/project/${projectId}${p === 'main' ? '' : `/${p}`}`;

  // The appearance rides in the address only for the first paint; after that
  // it goes by message, so switching it does not reload the page.
  let frameSrc = $derived.by(() => {
    const p = requestedPage;
    const n = reload;
    return untrack(
      () => `${pagePath(p)}?${FRAME_PARAM}=1&skin=${previewTheme}&shade=${previewMode}${n ? `&n=${n}` : ''}`
    );
  });

  function showPage(/** @type {'main' | 'join' | 'support'} */ p) {
    frameReady = false;
    if (p === requestedPage) reload++;
    requestedPage = p;
  }

  function post(/** @type {any} */ msg) {
    frameEl?.contentWindow?.postMessage(msg, window.location.origin);
  }
  const sendDraft = () => post({ source: EDITOR_SOURCE, type: 'draft', look: $state.snapshot(look) });
  const sendSkin = () => post({ source: EDITOR_SOURCE, type: 'skin', theme: previewTheme, mode: previewMode });

  onMount(() => {
    const onMessage = (/** @type {MessageEvent} */ e) => {
      if (e.origin !== window.location.origin || !frameEl || e.source !== frameEl.contentWindow) return;
      const m = e.data;
      if (m?.source !== FRAME_SOURCE || m.type !== 'ready') return;
      const path = String(m.path ?? '');
      shownPage = path.endsWith('/join') ? 'join' : path.endsWith('/support') ? 'support' : /\/(project|r)\/[^/]+$/.test(path) ? 'main' : 'other';
      sendDraft();
      sendSkin();
      frameReady = true;
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  });

  $effect(() => {
    $state.snapshot(look);
    if (untrack(() => frameReady)) sendDraft();
  });
  $effect(() => {
    previewTheme;
    previewMode;
    if (untrack(() => frameReady)) sendSkin();
  });

  // ── Submit ────────────────────────────────────────────────────────────
  /** @type {null | 'address' | 'look' | 'clear'} */
  let busy = $state(null);
  /** @type {{ tone: 'ok' | 'error', text: string, href?: string } | null} */
  let result = $state(null);

  async function send(/** @type {'address' | 'look' | 'clear'} */ what) {
    busy = what;
    result = null;
    /** @type {Record<string, unknown>} */
    const params = { projectId };
    if (what === 'address') params.slug = slugCheck.slug;
    if (what === 'look') params.look = $state.snapshot(look);
    if (what === 'clear') params.clearLook = true;
    const r = await executeAction('proposeRikmaIdentity', /** @type {any} */ (params), {
      showErrorToast: false,
      skipUpdateStrategy: true
    });
    busy = null;
    if (!r.success) {
      result = { tone: 'error', text: `${$t('rikmaLook.editor.result.failed')} ${r.error?.message ?? ''}` };
      return;
    }
    if (r.data?.unchanged) {
      result = { tone: 'ok', text: $t('rikmaLook.editor.result.unchanged') };
    } else if (r.data?.applied) {
      const slug = r.data.slug ?? data.slug;
      result = {
        tone: 'ok',
        text: $t('rikmaLook.editor.result.applied'),
        href: slug ? `/r/${slug}` : `/project/${projectId}`
      };
      await invalidateAll();
    } else {
      result = { tone: 'ok', text: $t('rikmaLook.editor.result.proposed'), href: '/lev' };
      await invalidateAll();
    }
  }
</script>

<div class="le-wrap">
  <div class="le-form">
    <header class="le-head">
      <h1>{$t('rikmaLook.editor.title')}</h1>
      <p class="le-muted">{$t('rikmaLook.editor.intro', { name: projectName })}</p>
    </header>

    {#if !data.ready}
      <p class="le-alert" role="status">{$t('rikmaLook.editor.notReady')}</p>
    {/if}

    {#if data.open?.length}
      <div class="le-alert" role="status">
        <strong>{$t('rikmaLook.editor.openProposals')}</strong>
        <ul>
          {#each data.open as d (d.id)}
            <li>
              {d.kind === 'address'
                ? $t('rikmaLook.editor.openAddress', { address: displayAddress(d.newSlug ?? '') })
                : $t('rikmaLook.editor.openLook')}
            </li>
          {/each}
        </ul>
        <a href="/lev">{$t('rikmaLook.editor.toLev')}</a>
      </div>
    {/if}

    <!-- ── Address ─────────────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-address">
      <h2 id="le-h-address">{$t('rikmaLook.editor.address.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.address.desc')}</p>
      {#if data.slug}
        <p class="le-current">
          {$t('rikmaLook.editor.address.current')}
          <a href="/r/{data.slug}" dir="ltr">{displayAddress(data.slug)}</a>
        </p>
      {/if}
      <label class="le-field" for="le-slug">
        <span>{$t('rikmaLook.editor.address.label')}</span>
        <span class="le-slug-row" dir="ltr">
          <span class="le-prefix">1lev1.com/r/</span>
          <input
            id="le-slug"
            type="text"
            inputmode="url"
            autocomplete="off"
            spellcheck="false"
            maxlength="40"
            bind:value={slugInput}
            aria-describedby="le-slug-status"
            disabled={!data.ready}
          />
        </span>
      </label>
      <p
        id="le-slug-status"
        class="le-status"
        class:le-good={slugOk}
        class:le-bad={!slugOk && !['idle', 'checking', 'current'].includes(slugCheck.status)}
        aria-live="polite"
      >
        {#if slugCheck.status !== 'idle'}
          {$t(`rikmaLook.editor.address.status.${slugCheck.status}`)}
        {/if}
      </p>
      <button
        type="button"
        class="le-btn"
        disabled={!slugOk || slugCheck.status === 'mine' || busy !== null}
        onclick={() => send('address')}
      >
        {busy === 'address'
          ? $t('rikmaLook.editor.submit.busy')
          : solo
            ? $t('rikmaLook.editor.address.save')
            : $t('rikmaLook.editor.address.propose')}
      </button>
    </section>

    <!-- ── What we do together ─────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-focus">
      <h2 id="le-h-focus">{$t('rikmaLook.editor.focus.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.focus.desc')}</p>
      <div class="le-org-grid" role="radiogroup" aria-labelledby="le-h-focus">
        {#each FOCUSES as focus (focus)}
          <button
            type="button"
            role="radio"
            aria-checked={look.focus === focus}
            class="le-org"
            class:le-org-on={look.focus === focus}
            onclick={() => chooseFocus(focus)}
          >
            <strong>{$t(`rikmaLook.focus.${focus}`)}</strong>
            <span>{$t(`rikmaLook.editor.focus.hint.${focus}`)}</span>
          </button>
        {/each}
      </div>
    </section>

    <!-- ── Under the seal ───────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-profile">
      <h2 id="le-h-profile">{$t('rikmaLook.editor.profile.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.profile.desc')}</p>
      <label class="le-field">
        <span>{$t('rikmaLook.editor.profile.tagline')}</span>
        <input type="text" maxlength={LIMITS.tagline} bind:value={look.profile.tagline} dir="auto" />
        <small class="le-hint">{$t('rikmaLook.editor.profile.taglineHint')}</small>
      </label>
      <div class="le-grid2">
        <label class="le-field">
          <span>{$t('rikmaLook.editor.profile.regKind')}</span>
          <select bind:value={look.profile.regKind}>
            {#each REG_KINDS as k (k)}
              <option value={k}>{$t(`rikmaLook.editor.reg.${k}`)}</option>
            {/each}
          </select>
        </label>
        {#if look.profile.regKind !== 'none'}
          <label class="le-field">
            <span>{$t(`rikmaLook.reg.${look.profile.regKind}`)}</span>
            <input type="text" maxlength={LIMITS.legalId} bind:value={look.profile.legalId} dir="ltr" />
          </label>
        {/if}
        <label class="le-field">
          <span>{$t('rikmaLook.editor.profile.founded')}</span>
          <input type="text" inputmode="numeric" maxlength="4" bind:value={look.profile.founded} dir="ltr" />
        </label>
      </div>
    </section>

    <!-- ── The two doors ────────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-cta">
      <h2 id="le-h-cta">{$t('rikmaLook.editor.cta.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.cta.desc')}</p>
      {#each CTA_SLOTS as slot (slot)}
        <fieldset class="le-fieldset">
          <legend>{$t(`rikmaLook.editor.cta.${slot}`)}</legend>
          {#if slot === 'secondary' && !look.cta.secondary}
            <button
              type="button"
              class="le-link"
              onclick={() => (look.cta.secondary = { kind: 'join', label: 'join', url: null })}
            >
              {$t('rikmaLook.editor.cta.addSecondary')}
            </button>
          {:else}
            {@const c = slot === 'primary' ? look.cta.primary : look.cta.secondary}
            <div class="le-grid2">
              <label class="le-field">
                <span>{$t('rikmaLook.editor.cta.kind')}</span>
                <select value={c.kind} onchange={(e) => setCta(slot, 'kind', e.currentTarget.value)}>
                  {#each CTA_KINDS as k (k)}
                    <option value={k}>{$t(`rikmaLook.editor.ctaKind.${k}`)}</option>
                  {/each}
                </select>
              </label>
              <label class="le-field">
                <span>{$t('rikmaLook.editor.cta.label')}</span>
                <select value={c.label} onchange={(e) => setCta(slot, 'label', e.currentTarget.value)}>
                  {#each CTA_LABELS as l (l)}
                    <option value={l}>{$t(`rikmaLook.cta.${l}`)}</option>
                  {/each}
                </select>
              </label>
            </div>
            {#if c.kind === 'link'}
              <label class="le-field">
                <span>{$t('rikmaLook.editor.cta.url')}</span>
                <input
                  type="url"
                  placeholder="https://"
                  value={c.url ?? ''}
                  oninput={(e) => setCta(slot, 'url', e.currentTarget.value || null)}
                  dir="ltr"
                />
              </label>
            {/if}
            {#if slot === 'secondary'}
              <button type="button" class="le-link" onclick={() => (look.cta.secondary = null)}>
                {$t('rikmaLook.editor.cta.removeSecondary')}
              </button>
            {/if}
          {/if}
        </fieldset>
      {/each}
      {#if asksForDonation}
        <label class="le-field">
          <span>{$t('rikmaLook.editor.profile.donationNote')}</span>
          <input type="text" maxlength={LIMITS.donationNote} bind:value={look.profile.donationNote} dir="auto" />
          <small class="le-hint">{$t('rikmaLook.editor.profile.donationNoteHint')}</small>
        </label>
      {/if}
    </section>

    <!-- ── Colours, type, corners ───────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-style">
      <h2 id="le-h-style">{$t('rikmaLook.editor.style.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.style.desc')}</p>

      {#each COLOURS as [key, platform] (key)}
        <div class="le-field">
          <span id="le-{key}-label">{$t(`rikmaLook.editor.style.${platform}`)}</span>
          {#if look.style[key]}
            <div class="le-colour-row">
              <input
                type="color"
                aria-labelledby="le-{key}-label"
                value={look.style[key]}
                oninput={(e) => setHue(key, e.currentTarget.value)}
              />
              <input
                type="text"
                class="le-hex"
                dir="ltr"
                aria-labelledby="le-{key}-label"
                value={look.style[key]}
                onchange={(e) => setHue(key, e.currentTarget.value)}
              />
              <div class="le-palette" role="group" aria-label={$t('rikmaLook.editor.style.palette')}>
                {#each PALETTE as c (c)}
                  <button
                    type="button"
                    class="le-swatch"
                    style:background={c}
                    aria-label={c}
                    aria-pressed={look.style[key] === c}
                    onclick={() => setHue(key, c)}
                  ></button>
                {/each}
              </div>
            </div>
            <p class="le-hint">
              {$t('rikmaLook.editor.style.inkNote')}
              <span class="le-ink" style:background={skin.bg2} style:color={key === 'hue' ? skin.gold : skin.barbi}>Aa</span>
            </p>
            <button type="button" class="le-link" onclick={() => (look.style[key] = null)}>
              {$t(`rikmaLook.editor.style.${platform}Back`)}
            </button>
          {:else}
            <button type="button" class="le-link" onclick={() => (look.style[key] = key === 'hue' ? PALETTE[0] : PALETTE[5])}>
              {$t(`rikmaLook.editor.style.${platform}Own`)}
            </button>
          {/if}
        </div>
      {/each}

      <div class="le-grid2">
        <label class="le-field">
          <span>{$t('rikmaLook.editor.style.font')}</span>
          <select bind:value={look.style.font}>
            {#each FONTS as f (f)}
              <option value={f}>{$t(`rikmaLook.editor.font.${f}`)}</option>
            {/each}
          </select>
        </label>
        <label class="le-field">
          <span>{$t('rikmaLook.editor.style.headingFont')}</span>
          <select bind:value={look.style.headingFont}>
            {#each FONTS as f (f)}
              <option value={f}>{$t(`rikmaLook.editor.font.${f}`)}</option>
            {/each}
          </select>
        </label>
        <label class="le-field">
          <span>{$t('rikmaLook.editor.style.corners')}</span>
          <select bind:value={look.style.corners}>
            {#each CORNERS as c (c)}
              <option value={c}>{$t(`rikmaLook.editor.corners.${c}`)}</option>
            {/each}
          </select>
        </label>
      </div>
    </section>

    <!-- ── Cover ────────────────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-media">
      <h2 id="le-h-media">{$t('rikmaLook.editor.media.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.media.coverHint')}</p>
      <div class="le-media-row">
        {#if look.media.cover}
          <img src={look.media.cover.url} alt="" class="le-thumb" />
          <button type="button" class="le-link" onclick={() => (look.media.cover = null)}>
            {$t('rikmaLook.editor.media.remove')}
          </button>
        {/if}
        <label class="le-btn le-btn-quiet">
          {uploading ? $t('rikmaLook.editor.media.uploading') : $t('rikmaLook.editor.media.upload')}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            class="le-sr"
            onchange={upload}
            disabled={uploading}
          />
        </label>
      </div>
      {#if look.media.cover}
        <div class="le-grid2">
          <label class="le-field">
            <span>{$t('rikmaLook.editor.media.focusX')}</span>
            <input type="range" min="0" max="100" bind:value={look.media.focusX} />
          </label>
          <label class="le-field">
            <span>{$t('rikmaLook.editor.media.focusY')}</span>
            <input type="range" min="0" max="100" bind:value={look.media.focusY} />
          </label>
        </div>
      {/if}
      {#if uploadError}
        <p class="le-status le-bad" role="alert">{uploadError}</p>
      {/if}
    </section>

    <!-- ── Impact numbers ───────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-stats">
      <h2 id="le-h-stats">{$t('rikmaLook.editor.stats.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.stats.desc')}</p>
      {#each look.stats as s, i (i)}
        <div class="le-row">
          <input
            type="text"
            maxlength={LIMITS.statValue}
            placeholder={$t('rikmaLook.editor.stats.value')}
            aria-label={$t('rikmaLook.editor.stats.value')}
            bind:value={s.value}
            dir="auto"
            class="le-narrow"
          />
          <input
            type="text"
            maxlength={LIMITS.statLabel}
            placeholder={$t('rikmaLook.editor.stats.label')}
            aria-label={$t('rikmaLook.editor.stats.label')}
            bind:value={s.label}
            dir="auto"
          />
          <button type="button" class="le-link" onclick={() => look.stats.splice(i, 1)}>
            {$t('rikmaLook.editor.remove')}
          </button>
        </div>
      {/each}
      {#if look.stats.length < LIMITS.stats}
        <button type="button" class="le-link" onclick={addStat}>{$t('rikmaLook.editor.stats.add')}</button>
      {/if}
    </section>

    <!-- ── Partners ─────────────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-partners">
      <h2 id="le-h-partners">{$t(`rikmaLook.page.heading.partners.${look.focus}`)}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.partners.desc')}</p>
      {#each look.partners as p, i (i)}
        <div class="le-row">
          <input
            type="text"
            maxlength={LIMITS.partnerName}
            placeholder={$t('rikmaLook.editor.partners.name')}
            aria-label={$t('rikmaLook.editor.partners.name')}
            bind:value={p.name}
            dir="auto"
          />
          <input
            type="url"
            placeholder="https://"
            aria-label={$t('rikmaLook.editor.partners.url')}
            value={p.url ?? ''}
            oninput={(e) => (p.url = e.currentTarget.value || null)}
            dir="ltr"
          />
          <button type="button" class="le-link" onclick={() => look.partners.splice(i, 1)}>
            {$t('rikmaLook.editor.remove')}
          </button>
        </div>
      {/each}
      {#if look.partners.length < LIMITS.partners}
        <button type="button" class="le-link" onclick={addPartner}>{$t('rikmaLook.editor.partners.add')}</button>
      {/if}
    </section>

    <!-- ── Contact & links ──────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-contact">
      <h2 id="le-h-contact">{$t('rikmaLook.editor.contact.title')}</h2>
      <div class="le-grid2">
        <label class="le-field">
          <span>{$t('rikmaLook.page.contact.email')}</span>
          <input type="email" maxlength={LIMITS.email} bind:value={look.contact.email} dir="ltr" />
        </label>
        <label class="le-field">
          <span>{$t('rikmaLook.page.contact.phone')}</span>
          <input type="tel" maxlength={LIMITS.phone} bind:value={look.contact.phone} dir="ltr" />
        </label>
        <label class="le-field">
          <span>{$t('rikmaLook.page.contact.address')}</span>
          <input type="text" maxlength={LIMITS.address} bind:value={look.contact.address} dir="auto" />
        </label>
        <label class="le-field">
          <span>{$t('rikmaLook.page.contact.hours')}</span>
          <input type="text" maxlength={LIMITS.hours} bind:value={look.contact.hours} dir="auto" />
        </label>
      </div>
      {#each LINK_KEYS as key (key)}
        <label class="le-field">
          <span>{$t(`rikmaLook.editor.links.${key}`)}</span>
          <input
            type="url"
            placeholder="https://"
            value={look.links[key] ?? ''}
            oninput={(e) => (look.links[key] = e.currentTarget.value || null)}
            dir="ltr"
          />
          <small class="le-hint">{$t(`rikmaLook.editor.links.${key}Hint`)}</small>
        </label>
      {/each}
    </section>

    <!-- ── Panels ───────────────────────────────────────────────────── -->
    <section class="le-card" aria-labelledby="le-h-blocks">
      <h2 id="le-h-blocks">{$t('rikmaLook.editor.blocks.title')}</h2>
      <p class="le-muted">{$t('rikmaLook.editor.blocks.desc')}</p>
      <ol class="le-blocks">
        {#each look.blocks as b, i (b.key)}
          <li class="le-block" class:le-block-off={!b.visible}>
            <label class="le-check">
              <input type="checkbox" bind:checked={b.visible} />
              {$t(`rikmaLook.editor.block.${b.key}`)}
            </label>
            <span class="le-moves">
              <button
                type="button"
                class="le-icon"
                disabled={i === 0}
                aria-label={$t('rikmaLook.editor.blocks.up')}
                onclick={() => move(i, -1)}>↑</button
              >
              <button
                type="button"
                class="le-icon"
                disabled={i === look.blocks.length - 1}
                aria-label={$t('rikmaLook.editor.blocks.down')}
                onclick={() => move(i, 1)}>↓</button
              >
            </span>
          </li>
        {/each}
      </ol>
    </section>

    <!-- ── Send ─────────────────────────────────────────────────────── -->
    <div class="le-bar">
      {#if issues.length}
        <ul class="le-issues" role="alert">
          {#each issues as issue (issue)}
            <li>{$t(`rikmaLook.editor.issues.${issue}`)}</li>
          {/each}
        </ul>
      {/if}
      {#if result}
        <p class="le-status" class:le-good={result.tone === 'ok'} class:le-bad={result.tone === 'error'} role="status">
          {result.text}
          {#if result.href}<a href={result.href}>{$t('rikmaLook.editor.result.view')}</a>{/if}
        </p>
      {/if}
      <div class="le-bar-buttons">
        <button
          type="button"
          class="le-btn"
          disabled={!data.ready || !changed || issues.length > 0 || busy !== null}
          onclick={() => send('look')}
        >
          {busy === 'look'
            ? $t('rikmaLook.editor.submit.busy')
            : solo
              ? $t('rikmaLook.editor.submit.save')
              : $t('rikmaLook.editor.submit.propose')}
        </button>
        {#if data.look}
          <button type="button" class="le-btn le-btn-quiet" disabled={busy !== null} onclick={() => send('clear')}>
            {$t('rikmaLook.editor.submit.clear')}
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- ── Live preview: the real pages ─────────────────────────────────── -->
  <aside class="le-preview-col" aria-label={$t('rikmaLook.editor.preview.title')}>
    <div class="le-preview-tools">
      <strong>{$t('rikmaLook.editor.preview.title')}</strong>
      <span class="le-seg" role="group" aria-label={$t('rikmaLook.editor.preview.page')}>
        {#each PAGES as p (p)}
          <button type="button" aria-pressed={shownPage === p} onclick={() => showPage(p)}>
            {$t(`rikmaLook.editor.preview.pages.${p}`)}
          </button>
        {/each}
      </span>
    </div>
    <div class="le-preview-tools">
      <span class="le-seg" role="group" aria-label={$t('rikmaLook.editor.preview.theme')}>
        <button type="button" aria-pressed={previewTheme === 'personal'} onclick={() => (previewTheme = 'personal')}>
          {$t('rikmaLook.editor.preview.personal')}
        </button>
        <button type="button" aria-pressed={previewTheme === 'business'} onclick={() => (previewTheme = 'business')}>
          {$t('rikmaLook.editor.preview.business')}
        </button>
      </span>
      <span class="le-seg" role="group" aria-label={$t('rikmaLook.editor.preview.scheme')}>
        <button type="button" aria-pressed={previewMode === 'light'} onclick={() => (previewMode = 'light')}>
          {$t('rikmaLook.editor.preview.light')}
        </button>
        <button type="button" aria-pressed={previewMode === 'dark'} onclick={() => (previewMode = 'dark')}>
          {$t('rikmaLook.editor.preview.dark')}
        </button>
      </span>
      <span class="le-seg" role="group" aria-label={$t('rikmaLook.editor.preview.width')}>
        <button type="button" aria-pressed={previewWidth === 'desktop'} onclick={() => (previewWidth = 'desktop')}>
          {$t('rikmaLook.editor.preview.desktop')}
        </button>
        <button type="button" aria-pressed={previewWidth === 'mobile'} onclick={() => (previewWidth = 'mobile')}>
          {$t('rikmaLook.editor.preview.mobile')}
        </button>
      </span>
    </div>
    <p class="le-hint">{$t('rikmaLook.editor.preview.note')}</p>
    <div class="le-preview" class:le-preview-mobile={previewWidth === 'mobile'}>
      <iframe
        bind:this={frameEl}
        src={frameSrc}
        title={$t('rikmaLook.editor.preview.title')}
        class:le-frame-ready={frameReady}
      ></iframe>
      {#if !frameReady}
        <p class="le-frame-wait" role="status">{$t('rikmaLook.editor.preview.loading')}</p>
      {/if}
    </div>
  </aside>
</div>

<style>
  .le-wrap {
    max-width: 96rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 6rem;
    display: grid;
    gap: 1.5rem;
  }
  @media (min-width: 1100px) {
    .le-wrap {
      grid-template-columns: minmax(0, 30rem) minmax(0, 1fr);
      align-items: start;
    }
  }
  .le-form {
    display: grid;
    gap: 1rem;
  }
  .le-head h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.25rem;
  }
  .le-head,
  .le-card,
  .le-bar,
  .le-preview-col {
    color: rgb(var(--surface-ink-rgb));
  }
  .le-card {
    background: rgb(var(--surface-rgb));
    border: 1px solid var(--surface-line);
    border-radius: 1rem;
    padding: 1.25rem;
    display: grid;
    gap: 0.75rem;
  }
  .le-card h2 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
  }
  .le-card p,
  .le-head p,
  .le-bar p,
  .le-preview-col p {
    margin: 0;
    color: inherit;
  }
  .le-muted,
  .le-hint {
    color: rgb(var(--surface-muted-rgb)) !important;
    font-size: 0.9rem;
  }
  .le-alert {
    background: rgb(var(--surface-2-rgb));
    color: rgb(var(--surface-ink-rgb));
    border: 1px solid var(--surface-line);
    border-radius: 0.75rem;
    padding: 0.85rem 1rem;
  }
  .le-alert a,
  .le-current a,
  .le-status a {
    color: inherit;
    text-decoration: underline;
    font-weight: 600;
  }
  .le-field {
    display: grid;
    gap: 0.3rem;
    font-weight: 600;
    font-size: 0.92rem;
  }
  .le-field input[type='text'],
  .le-field input[type='url'],
  .le-field input[type='email'],
  .le-field input[type='tel'],
  .le-field select,
  .le-row input {
    width: 100%;
    min-height: 2.6rem;
    padding: 0.4rem 0.7rem;
    border-radius: 0.6rem;
    border: 1px solid var(--surface-line);
    background: rgb(var(--surface-2-rgb));
    color: rgb(var(--surface-ink-rgb));
    font-weight: 400;
  }
  .le-slug-row {
    display: flex;
    align-items: center;
    border: 1px solid var(--surface-line);
    border-radius: 0.6rem;
    background: rgb(var(--surface-2-rgb));
    overflow: hidden;
  }
  .le-prefix {
    padding: 0 0.6rem;
    color: rgb(var(--surface-muted-rgb));
    font-weight: 400;
    white-space: nowrap;
  }
  .le-slug-row input {
    flex: 1;
    min-width: 0;
    min-height: 2.6rem;
    border: 0;
    background: transparent;
    color: rgb(var(--surface-ink-rgb));
    font-weight: 600;
  }
  .le-status {
    min-height: 1.4rem;
    font-size: 0.9rem;
  }
  .le-good {
    color: #15803d !important;
  }
  .le-bad {
    color: #b91c1c !important;
  }
  :global(.dark) .le-good {
    color: #4ade80 !important;
  }
  :global(.dark) .le-bad {
    color: #f87171 !important;
  }
  .le-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0.5rem 1.25rem;
    border-radius: 9999px;
    background: #c2185b;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    justify-self: start;
  }
  .le-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .le-btn-quiet {
    background: rgb(var(--surface-2-rgb));
    color: rgb(var(--surface-ink-rgb));
    border: 1px solid var(--surface-line);
  }
  .le-link {
    background: none;
    border: 0;
    padding: 0.25rem 0;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    justify-self: start;
    font-size: 0.9rem;
  }
  .le-org-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.5rem;
  }
  .le-org {
    display: grid;
    gap: 0.2rem;
    text-align: start;
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 2px solid var(--surface-line);
    background: rgb(var(--surface-2-rgb));
    color: rgb(var(--surface-ink-rgb));
    cursor: pointer;
  }
  .le-org span {
    font-size: 0.8rem;
    color: rgb(var(--surface-muted-rgb));
  }
  .le-org-on {
    border-color: #c2185b;
  }
  .le-colour-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .le-colour-row input[type='color'] {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--surface-line);
    padding: 0;
    background: none;
  }
  .le-hex {
    width: 6.5rem !important;
    min-height: 2.6rem;
    padding: 0.4rem 0.7rem;
    border-radius: 0.6rem;
    border: 1px solid var(--surface-line);
    background: rgb(var(--surface-2-rgb));
    color: rgb(var(--surface-ink-rgb));
    font-family: ui-monospace, monospace;
  }
  .le-palette {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .le-swatch {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    border: 2px solid transparent;
    cursor: pointer;
  }
  .le-swatch[aria-pressed='true'] {
    border-color: rgb(var(--surface-ink-rgb));
  }
  .le-ink {
    display: inline-block;
    padding: 0 0.4rem;
    margin-inline-start: 0.35rem;
    border-radius: 0.3rem;
    font-weight: 800;
    border: 1px solid var(--surface-line);
  }
  .le-grid2 {
    display: grid;
    gap: 0.75rem;
  }
  @media (min-width: 560px) {
    .le-grid2 {
      grid-template-columns: 1fr 1fr;
    }
  }
  .le-media-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .le-thumb {
    height: 3.5rem;
    max-width: 10rem;
    object-fit: cover;
    border-radius: 0.4rem;
    border: 1px solid var(--surface-line);
  }
  .le-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .le-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.92rem;
  }
  .le-check input {
    width: 1.15rem;
    height: 1.15rem;
  }
  .le-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .le-narrow {
    max-width: 7rem;
  }
  .le-fieldset {
    border: 1px solid var(--surface-line);
    border-radius: 0.75rem;
    padding: 0.75rem;
    display: grid;
    gap: 0.6rem;
  }
  .le-fieldset legend {
    font-weight: 700;
    padding: 0 0.3rem;
  }
  .le-blocks {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.35rem;
  }
  .le-block {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem;
    border-radius: 0.6rem;
    background: rgb(var(--surface-2-rgb));
    border: 1px solid var(--surface-line);
  }
  .le-block-off {
    opacity: 0.6;
  }
  .le-moves {
    display: flex;
    gap: 0.25rem;
  }
  .le-icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    border: 1px solid var(--surface-line);
    background: rgb(var(--surface-rgb));
    color: rgb(var(--surface-ink-rgb));
  }
  .le-icon:disabled {
    opacity: 0.35;
  }
  .le-bar {
    position: sticky;
    bottom: 0;
    z-index: 5;
    background: rgb(var(--surface-rgb));
    border: 1px solid var(--surface-line);
    border-radius: 1rem;
    padding: 0.85rem 1rem;
    display: grid;
    gap: 0.5rem;
    box-shadow: 0 -6px 20px rgb(0 0 0 / 0.08);
  }
  .le-bar-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .le-issues {
    margin: 0;
    padding-inline-start: 1.1rem;
    color: #b91c1c;
    font-size: 0.9rem;
  }
  :global(.dark) .le-issues {
    color: #f87171;
  }
  .le-preview-col {
    position: sticky;
    top: 1rem;
    display: grid;
    gap: 0.5rem;
  }
  .le-preview-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
  }
  .le-seg {
    display: inline-flex;
    border: 1px solid var(--surface-line);
    border-radius: 9999px;
    overflow: hidden;
  }
  .le-seg button {
    padding: 0.3rem 0.8rem;
    min-height: 2.25rem;
    background: rgb(var(--surface-rgb));
    color: rgb(var(--surface-ink-rgb));
    font-size: 0.85rem;
  }
  .le-seg button[aria-pressed='true'] {
    background: rgb(var(--surface-ink-rgb));
    color: rgb(var(--surface-rgb));
  }
  .le-preview {
    position: relative;
    height: min(82vh, 62rem);
    border: 1px solid var(--surface-line);
    border-radius: 1rem;
    overflow: hidden;
    margin-inline: auto;
    width: 100%;
    background: #1a0515;
  }
  .le-preview-mobile {
    max-width: 390px;
  }
  .le-preview iframe {
    width: 100%;
    height: 100%;
    border: 0;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .le-preview iframe.le-frame-ready {
    opacity: 1;
  }
  .le-frame-wait {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff !important;
    font-size: 0.9rem;
  }
</style>
