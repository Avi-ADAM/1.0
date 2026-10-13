<script>
  import { isRtl, t } from '$lib/translations';
  import { useMoney } from '$lib/money/context.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { Confetti } from 'svelte-confetti';
  import { quintOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { get } from 'svelte/store';
  import { idPr } from '../../stores/idPr.js';
  import { baciStore, resetBaciStore } from '$lib/stores/baciStore.js';
  import { executeAction } from '$lib/client/actionClient';
  import { goto } from '$app/navigation';
  import { peekSeedPlan, takeSeedPlan, countStashedItems } from '$lib/onboard/seedPlanHandoff.js';
  import { onMount, onDestroy, untrack } from 'svelte';
  import Uplad from '../userPr/uploadPic.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} [userName_value]
   * @property {boolean} [drafted] - the form was prefilled from an assistant draft
   * @property {() => void} [onBack] - leave the form; without it there is no back control
   */

  /** @type {Props} */
  let { userName_value, drafted = false, onBack } = $props();
  const money = useMoney();

  let loading = $state(false);
  let success = $state(false);
  let before = $state(false);
  const url1 = '/api/upload';
  let run = $state([]);
  let files;
  let shgi = $state(false);
  let naex = $state('');
  /** @type {HTMLInputElement | undefined} */
  let nameInput = $state();

  async function sendP() {
    if ($baciStore.projectName_value.trim().length < 1) {
      naex = $t('addnew.baci.nameTooShort');
      shgi = true;
      nameInput?.focus();
      return;
    }
    if (run.includes($baciStore.projectName_value)) {
      naex = $t('addnew.baci.naex');
      shgi = true;
      nameInput?.focus();
      return;
    }
    loading = true;
    // Upload the cover image (if any) through the server proxy, which reads the
    // JWT from the HttpOnly cookie — the token never touches the client.
    if (files) {
      try {
        const upRes = await fetch(url1, { method: 'POST', body: files });
        if (!upRes.ok) throw new Error('upload failed');
        const uploaded = await upRes.json();
        $baciStore.imageId = uploaded[0].id;
      } catch (error) {
        console.log('צריך לתקן:', error);
        loading = false;
        return;
      }
    }
    await sendPP();
  }

  async function sendPP() {
    // Resolve the selected vallues: known ones → ids (client already loaded the
    // list); unknown ones → names the server will mint. Project creation + vallue
    // minting happen server-side via the unified action, so no JWT on the client.
    const knownNames = vallues.map((c) => c.attributes.valueName);
    const vallueIds = [];
    const newVallueNames = [];
    for (const sel of $baciStore.selected) {
      const idx = knownNames.indexOf(sel);
      if (idx >= 0) {
        vallueIds.push(String(vallues[idx].id));
      } else {
        newVallueNames.push(sel);
      }
    }

    try {
      const result = await executeAction('createWeave', {
        projectName: $baciStore.projectName_value,
        publicDescription: $baciStore.desP,
        descripFor: $baciStore.desPl,
        linkToWebsite: $baciStore.linkP,
        restime: $baciStore.restime,
        timeToP: $baciStore.timeToP,
        imageId: $baciStore.imageId ? String($baciStore.imageId) : undefined,
        isOt: $baciStore.ont,
        // A new rikma keeps its books in its founder's currency by default
        // (PLAN_MULTI_CURRENCY); changeable in its settings while no money exists.
        currency: money.currency,
        vallueIds,
        newVallueNames
      });

      if (!result.success) {
        loading = false;
        return; // executeAction already surfaced the error toast
      }

      const newProjectId = result.data.projectId;
      success = true;
      idPr.set(newProjectId);
      before = true;
      loading = false;

      // Site-activity feed entry (same-origin internal endpoint, no token).
      const data = {
        name: userName_value,
        action: 'יצר רקמה חדשה בשם:',
        det: `${$baciStore.projectName_value} והתיאור: ${$baciStore.desP}`
      };
      fetch('/api/ste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch((error) => {
        console.error('Error:', error);
      });

      // Business onboarding may have drafted starter boards from the site or the
      // description. Now — and only now — is there a rikma to hang them on. They
      // are still proposals: nothing becomes a real mission, resource or product
      // until the member approves it in its own creation form.
      const seeded = await seedPendingPlan(newProjectId);

      resetBaciStore();
      // Land on the board itself when there is one — `?board=` opens it, so the
      // member sees actual proposals rather than a list of closed titles.
      goto(
        seeded
          ? `/moach/${newProjectId}/create${seeded.firstBoardId ? `?board=${seeded.firstBoardId}` : ''}`
          : '/moach'
      );
    } catch (error) {
      console.log('צריך לתקן:', error);
      loading = false;
    }
  }

  /**
   * Persist the parked onboarding plan, if there is one.
   * Best-effort: losing the starter boards must never cost the member the rikma
   * they just created, so a failure here only means they land on /moach.
   *
   * @param {string} projectId
   * @returns {Promise<{ firstBoardId: string|null }|null>} null when nothing was seeded
   */
  async function seedPendingPlan(projectId) {
    const plan = takeSeedPlan();
    if (!plan || !projectId) return null;
    try {
      const res = await executeAction(
        'seedPlanBoards',
        {
          projectId: String(projectId),
          plan: { boards: plan.boards },
          // The language any vocabulary the resolver has to create is minted in.
          lang: $lang === 'en' || $lang === 'ar' ? $lang : 'he',
          ...(plan.sourceUrl ? { sourceUrl: String(plan.sourceUrl) } : {})
        },
        { showErrorToast: false }
      );
      if (!res?.success || !(res.data?.boardCount > 0)) return null;
      return { firstBoardId: res.data?.firstBoardId ?? null };
    } catch (e) {
      console.warn('[baci] could not seed the onboarding plan:', e);
      return null;
    }
  }

  let vallues = $state([]);
  let newcontent = $state(true);

  /**
   * Rows drafted during business onboarding and waiting for a rikma to live
   * in. Shown before the button so the member knows what approving creates —
   * and what it does not: the rows themselves still need approving one by one.
   */
  let pendingItems = $state(0);
  onMount(() => {
    pendingItems = countStashedItems(peekSeedPlan());
  });

  onMount(async () => {
    // Read vallue options + existing project names through the secure proxy,
    // which injects the JWT from the HttpOnly cookie (no token on the client).
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { queId: 'baciFormData' } })
      });
      const json = await res.json();
      if (!res.ok || !json?.data) throw json;
      // Show each value in the reader's language. A value with no
      // localization for that language would otherwise offer its raw
      // English slug ("altroisem", "anarchy") inside a Hebrew list — and
      // then carry that slug onto the rikma's public page — so those are
      // dropped from the picker instead. English is the base language and
      // always keeps the base name.
      const rows = json.data.vallues.data ?? [];
      vallues =
        $lang === 'en'
          ? rows
          : rows
              .map((v) => {
                const loc = (v.attributes.localizations?.data ?? []).find(
                  (l) => l.attributes?.locale === $lang
                );
                // No `locale` field yet (older API build) → fall back to
                // the single localization row, which is what shipped before.
                const only =
                  v.attributes.localizations?.data?.length === 1 &&
                  v.attributes.localizations.data[0].attributes?.locale == null
                    ? v.attributes.localizations.data[0]
                    : null;
                const named = loc ?? only;
                return named
                  ? {
                      ...v,
                      attributes: {
                        ...v.attributes,
                        valueName: named.attributes.valueName
                      }
                    }
                  : null;
              })
              .filter(Boolean);
      const runi = json.data.projects.data;
      run = runi.map((c) => c.attributes.projectName);
    } catch (e) {
      console.warn('[baci] could not load the form data:', e);
    } finally {
      newcontent = false;
    }
  });

  // ── Logo ────────────────────────────────────────────────────────────────
  let suc = $state(false);
  /** Object URL of the cropped logo, so the preview card shows the real thing. */
  let logoUrl = $state('');

  function callbackFunction(event) {
    files = event.files;
    suc = true;
    const file = files?.get?.('files');
    if (file instanceof Blob) {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      logoUrl = URL.createObjectURL(file);
    }
  }
  onDestroy(() => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
  });

  // ── Assistant draft ─────────────────────────────────────────────────────
  // The store was filled before this form mounted, so what it holds now is
  // what the assistant proposed. A field keeps its "suggested" mark only while
  // it still says what was proposed — once the member rewrites it, it is theirs.
  const draftSnap = untrack(() => drafted) ? structuredClone(get(baciStore)) : null;
  let cleared = $state(false);
  const showDraft = $derived(drafted && !cleared);

  /** @param {'projectName_value'|'desP'|'desPl'|'restime'|'timeToP'} field */
  function isSuggested(field) {
    if (!showDraft || !draftSnap) return false;
    const v = draftSnap[field];
    // A draft that left a choice out keeps the form's default — nobody
    // suggested that, so it carries no mark.
    if (!v || (field === 'restime' && v === 'feh') || (field === 'timeToP' && v === 'already'))
      return false;
    // RichText re-serialises what it is given (plain text comes back wrapped
    // in <p>), so the two rich fields compare by their words.
    return field === 'desP' || field === 'desPl'
      ? !!plain(v) && plain($baciStore[field]) === plain(v)
      : $baciStore[field] === v;
  }

  function clearDraft() {
    resetBaciStore();
    cleared = true;
    shgi = false;
  }

  // ── Values ──────────────────────────────────────────────────────────────
  let ugug = $state('');
  const valueNames = $derived(vallues.map((c) => c.attributes.valueName));
  const valueSuggestions = $derived.by(() => {
    const q = ugug.trim().toLowerCase();
    const pool = q ? valueNames.filter((n) => n.toLowerCase().includes(q)) : valueNames;
    return pool.filter((n) => !$baciStore.selected.includes(n)).slice(0, 8);
  });

  /** @param {string} raw */
  function addValue(raw) {
    const v = (raw ?? '').trim();
    ugug = '';
    if (!v || $baciStore.selected.includes(v)) return;
    $baciStore.selected = [...$baciStore.selected, v];
  }

  /** @param {string} v */
  function removeValue(v) {
    $baciStore.selected = $baciStore.selected.filter((x) => x !== v);
  }

  /** @param {KeyboardEvent} e */
  function onValKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addValue(ugug);
    }
  }

  // ── Consent rules ───────────────────────────────────────────────────────
  const restimes = $derived([
    { id: 'feh', label: `48 ${$t('addnew.baci.hours')}` },
    { id: 'sth', label: `72 ${$t('addnew.baci.hours')}` },
    { id: 'nsh', label: `96 ${$t('addnew.baci.hours')}` },
    { id: 'sevend', label: $t('addnew.baci.week') }
  ]);
  const profits = $derived([
    { id: 'already', label: $t('addnew.baci.cvar') },
    { id: 'week', label: $t('addnew.baci.week') },
    { id: 'month', label: $t('addnew.baci.month') },
    { id: 'threeM', label: $t('addnew.baci.threemonth') },
    { id: 'sixM', label: $t('addnew.baci.halt') },
    { id: 'oneY', label: $t('addnew.baci.year') },
    { id: 'twoY', label: $t('addnew.baci.toyers') },
    { id: 'more', label: $t('addnew.baci.more') },
    { id: 'never', label: $t('addnew.baci.never') }
  ]);
  const types = $derived([
    { on: true, label: $t('addnew.baci.continuous'), example: $t('addnew.baci.continuousEx') },
    { on: false, label: $t('addnew.baci.oneTimed'), example: $t('addnew.baci.oneTimedEx') }
  ]);

  const restimeLabel = $derived(
    (restimes.find((r) => r.id === $baciStore.restime) ?? restimes[0]).label
  );
  const profitLabel = $derived(
    (profits.find((p) => p.id === $baciStore.timeToP) ?? profits[0]).label
  );

  // ── Preview + readiness ─────────────────────────────────────────────────
  /** RichText hands back HTML; the preview card shows its words only. */
  function plain(html) {
    return (html ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const trimmedName = $derived($baciStore.projectName_value.trim());
  const descText = $derived(plain($baciStore.desP));
  const nameTaken = $derived(!!trimmedName && run.includes($baciStore.projectName_value));
  const canSubmit = $derived(trimmedName.length > 0);

  const checklist = $derived([
    { label: $t('addnew.baci.ckName'), ok: trimmedName.length > 0 },
    { label: $t('addnew.baci.ckDesc'), ok: descText.length > 0 },
    { label: $t('addnew.baci.ckLogo'), ok: suc },
    { label: $t('addnew.baci.ckValue'), ok: $baciStore.selected.length > 0 }
  ]);
  const readyDone = $derived(checklist.filter((c) => c.ok).length);
  const readyPct = $derived(Math.round((readyDone / checklist.length) * 100));

  function project() {
    // idPr was already set to the new weave id in sendPP().
    goto('/moach');
  }
</script>

<div class="bc-bg" aria-hidden="true"></div>

{#snippet suggestedMark()}
  <span class="bc-mark"><span class="bc-dot"></span>{$t('addnew.baci.suggested')}</span>
{/snippet}

{#snippet stepHead(n, title, sub)}
  <div class="bc-step-head">
    <div class="bc-medal" aria-hidden="true">{n}</div>
    <div class="bc-step-titles">
      <h2 class="bc-h2">{title}</h2>
      <p class="bc-sub">{sub}</p>
    </div>
  </div>
{/snippet}

{#if before == false}
  <div
    transition:scale={{ delay: 250, duration: 300, easing: quintOut }}
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="bc-root"
  >
    <header class="bc-top">
      {#if onBack}
        <button type="button" class="bc-back" onclick={onBack}>
          <svg aria-hidden="true" class="bc-back-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
          {$t('addnew.baci.back')}
        </button>
      {:else}
        <span></span>
      {/if}
      <div class="bc-brand" dir="ltr" aria-hidden="true">1💗1</div>
    </header>

    <section class="bc-hero">
      <div class="bc-eyebrow">{$t('addnew.baci.eyebrow')}</div>
      <h1 class="bc-h1">{$t('addnew.baci.crn')}</h1>
      <p class="bc-lede">{$t('addnew.baci.lede')}</p>
    </section>

    {#if showDraft}
      <section class="bc-draft" aria-label={$t('addnew.baci.draftTitle')}>
        <div class="bc-draft-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a2a08" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"></path></svg>
        </div>
        <div class="bc-draft-text">
          <div class="bc-draft-title">{$t('addnew.baci.draftTitle')}</div>
          <p class="bc-draft-body"><span class="bc-dot"></span> {$t('addnew.baci.draftBody')}</p>
        </div>
        <button type="button" class="bc-ghost-btn" onclick={clearDraft}>
          {$t('addnew.baci.draftClear')}
        </button>
      </section>
    {/if}

    <div class="bc-layout">
      <!-- ===== FORM COLUMN ===== -->
      <div class="bc-form">
        <!-- step 1 — identity -->
        <section class="bc-card">
          {@render stepHead(1, $t('addnew.baci.s1Title'), $t('addnew.baci.s1Sub'))}

          <div class="bc-field">
            <label for="bc-name" class="bc-label">
              {$t('addnew.baci.frn')} <span class="bc-req" aria-hidden="true">*</span>
              {#if isSuggested('projectName_value')}{@render suggestedMark()}{/if}
            </label>
            <input
              id="bc-name"
              bind:this={nameInput}
              bind:value={$baciStore.projectName_value}
              oninput={() => (shgi = false)}
              type="text"
              required
              aria-invalid={shgi || nameTaken}
              aria-describedby="bc-name-hint"
              placeholder={$t('addnew.baci.namePh')}
              class="bc-input bc-input-lg"
            />
            {#if shgi}
              <small id="bc-name-hint" class="bc-error" role="alert">{naex}</small>
            {:else if nameTaken}
              <small id="bc-name-hint" class="bc-error">{$t('addnew.baci.naex')}</small>
            {:else}
              <small id="bc-name-hint" class="bc-hint">{$t('addnew.baci.nameHint')}</small>
            {/if}
          </div>

          <div class="bc-row">
            <div class="bc-logo-col">
              <span class="bc-label">{$t('addnew.baci.logo')}</span>
              <div class="bc-logo-tile">
                <Uplad
                  noHeader={true}
                  current="https://res.cloudinary.com/onelove1/image/upload/v1645805397/pngegg_2_8aeb98b032.png"
                  onMessage={callbackFunction}
                />
              </div>
            </div>
            <div class="bc-field bc-grow">
              <label for="bc-url" class="bc-label">
                {$t('addnew.baci.siteLabel')}
                <span class="bc-optional">{$t('addnew.baci.optional')}</span>
              </label>
              <div class="bc-url-wrap">
                <input
                  id="bc-url"
                  type="url"
                  dir="ltr"
                  bind:value={$baciStore.linkP}
                  placeholder="https://"
                  class="bc-input bc-input-url"
                />
                <svg aria-hidden="true" class="bc-url-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20"></path></svg>
              </div>
              {#if suc}
                <small class="bc-ok">{$t('addnew.baci.su')}</small>
              {:else}
                <small class="bc-hint">{$t('addnew.baci.logoHint')}</small>
              {/if}
            </div>
          </div>
        </section>

        <!-- step 2 — the story -->
        <section class="bc-card">
          {@render stepHead(2, $t('addnew.baci.s2Title'), $t('addnew.baci.s2Sub'))}

          <div class="bc-field" role="group" aria-labelledby="bc-desc-label">
            <div id="bc-desc-label" class="bc-label">
              {$t('addnew.baci.publicDesc')}
              <span class="bc-badge bc-badge-public">
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                {$t('addnew.baci.publicBadge')}
              </span>
              {#if isSuggested('desP')}{@render suggestedMark()}{/if}
            </div>
            <div class="bc-editor">
              <RichText bind:outpot={$baciStore.desP} placeholder={$t('addnew.baci.descPh')} />
            </div>
          </div>

          <div class="bc-field" role="group" aria-labelledby="bc-details-label">
            <div id="bc-details-label" class="bc-label">
              {$t('addnew.baci.internal')}
              <span class="bc-badge bc-badge-private">
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>
                {$t('addnew.baci.membersBadge')}
              </span>
              {#if isSuggested('desPl')}{@render suggestedMark()}{/if}
            </div>
            <div class="bc-editor">
              <RichText bind:outpot={$baciStore.desPl} placeholder={$t('addnew.baci.detailsPh')} />
            </div>
          </div>
        </section>

        <!-- step 3 — values -->
        <section class="bc-card">
          {@render stepHead(3, $t('addnew.baci.valuesAndGoals'), $t('addnew.baci.s3Sub'))}

          <div class="bc-chips" aria-live="polite">
            {#each $baciStore.selected as v (v)}
              <span class="bc-chip">
                {v}
                <button
                  type="button"
                  class="bc-chip-x"
                  aria-label={$t('addnew.baci.removeValue', { value: v })}
                  onclick={() => removeValue(v)}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                </button>
              </span>
            {:else}
              <span class="bc-empty">{$t('addnew.baci.noValues')}</span>
            {/each}
          </div>

          <div class="bc-add-row">
            <label for="bc-val" class="bc-sr">{$t('addnew.baci.addValue')}</label>
            <input
              id="bc-val"
              type="text"
              bind:value={ugug}
              onkeydown={onValKey}
              placeholder={$t('addnew.baci.valuePh')}
              class="bc-input bc-input-val"
            />
            <button type="button" class="bc-add-btn" onclick={() => addValue(ugug)}>
              {$t('addnew.baci.add')}
            </button>
          </div>

          <div class="bc-suggest">
            <span class="bc-hint">
              {ugug.trim() ? $t('addnew.baci.matchingValues') : $t('addnew.baci.commonValues')}
            </span>
            <div class="bc-suggest-list">
              {#if newcontent}
                <Spinner size="sm" />
              {:else}
                {#each valueSuggestions as s (s)}
                  <button type="button" class="bc-suggest-btn" onclick={() => addValue(s)}>
                    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
                    {s}
                  </button>
                {/each}
                {#if ugug.trim() && !valueNames.includes(ugug.trim())}
                  <button type="button" class="bc-suggest-btn bc-suggest-new" onclick={() => addValue(ugug)}>
                    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
                    {$t('addnew.baci.addne', { name: ugug.trim() })}
                  </button>
                {/if}
              {/if}
            </div>
          </div>
        </section>

        <!-- step 4 — consent rules -->
        <section class="bc-card bc-card-loose">
          {@render stepHead(4, $t('addnew.baci.s4Title'), $t('addnew.baci.s4Sub'))}

          <fieldset class="bc-fieldset">
            <legend class="bc-legend">{$t('addnew.baci.typeLegend')}</legend>
            <div class="bc-types">
              {#each types as tp (tp.on)}
                {@const sel = tp.on === $baciStore.ont}
                <button
                  type="button"
                  class="bc-type"
                  class:bc-type-on={sel}
                  aria-pressed={sel}
                  onclick={() => ($baciStore.ont = tp.on)}
                >
                  <span class="bc-type-top">
                    <span class="bc-type-label">{tp.label}</span>
                    <span class="bc-radio" class:bc-radio-on={sel}></span>
                  </span>
                  <span class="bc-type-ex">{tp.example}</span>
                </button>
              {/each}
            </div>
          </fieldset>

          <fieldset class="bc-fieldset">
            <legend class="bc-legend">
              {$t('addnew.baci.hre')}
              {#if isSuggested('restime')}{@render suggestedMark()}{/if}
            </legend>
            <div class="bc-pills">
              {#each restimes as r (r.id)}
                <button
                  type="button"
                  class="bc-pill"
                  class:bc-pill-on={r.id === $baciStore.restime}
                  aria-pressed={r.id === $baciStore.restime}
                  onclick={() => ($baciStore.restime = r.id)}>{r.label}</button
                >
              {/each}
            </div>
            <div class="bc-silence">
              <svg aria-hidden="true" class="bc-silence-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
              <p class="bc-silence-text">
                <b class="bc-silence-lead">{$t('addnew.baci.silenceLead')}</b>
                {$t('addnew.baci.silenceBody', { time: restimeLabel })}
              </p>
            </div>
          </fieldset>

          <fieldset class="bc-fieldset">
            <legend class="bc-legend">
              {$t('addnew.baci.timeto')}
              {#if isSuggested('timeToP')}{@render suggestedMark()}{/if}
            </legend>
            <small class="bc-hint bc-legend-hint">{$t('addnew.baci.timetoex')}</small>
            <div class="bc-pills">
              {#each profits as p (p.id)}
                <button
                  type="button"
                  class="bc-pill"
                  class:bc-pill-on={p.id === $baciStore.timeToP}
                  aria-pressed={p.id === $baciStore.timeToP}
                  onclick={() => ($baciStore.timeToP = p.id)}>{p.label}</button
                >
              {/each}
            </div>
          </fieldset>
        </section>

        <!-- submit -->
        <section class="bc-submit">
          {#if pendingItems > 0}
            <div class="bc-seed">
              <svg aria-hidden="true" class="bc-seed-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>
              <p class="bc-seed-text">{$t('addnew.baci.seedPlanWaiting', { count: pendingItems })}</p>
            </div>
          {/if}
          <div class="bc-submit-row">
            <p class="bc-cta-hint">
              {canSubmit ? $t('addnew.baci.ctaReady') : $t('addnew.baci.ctaNeedName')}
            </p>
            <button
              type="button"
              class="bc-cta"
              name="addm"
              disabled={!canSubmit || loading}
              aria-busy={loading}
              onclick={sendP}
            >
              {#if loading}
                <Spinner size="sm" />
              {/if}
              <span>{$t('addnew.baci.cree')}</span>
              <svg aria-hidden="true" class="bc-cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
            </button>
          </div>
        </section>
      </div>

      <!-- ===== PREVIEW COLUMN ===== -->
      <aside class="bc-aside" aria-label={$t('addnew.baci.previewAria')}>
        <div class="bc-eyebrow bc-eyebrow-muted">{$t('addnew.baci.previewEyebrow')}</div>

        <article class="bc-preview">
          <div class="bc-preview-cover"></div>
          <div class="bc-preview-body">
            {#if logoUrl}
              <img class="bc-preview-avatar" src={logoUrl} alt="" />
            {:else}
              <div class="bc-preview-avatar" aria-hidden="true">
                {trimmedName ? trimmedName.charAt(0) : '?'}
              </div>
            {/if}
            <h3 class="bc-preview-name">{trimmedName || $t('addnew.baci.frn')}</h3>
            <p class="bc-preview-desc">
              {descText
                ? descText.length > 150
                  ? descText.slice(0, 150) + '…'
                  : descText
                : $t('addnew.baci.previewDescPh')}
            </p>
            {#if $baciStore.selected.length > 0}
              <div class="bc-preview-tags">
                {#each $baciStore.selected as v (v)}
                  <span class="bc-preview-tag">{v}</span>
                {/each}
              </div>
            {/if}
            <dl class="bc-preview-facts">
              <div><dt>{$t('addnew.baci.pvRestime')}</dt><dd>{restimeLabel}</dd></div>
              <div>
                <dt>{$t('addnew.baci.pvType')}</dt>
                <dd>{$baciStore.ont ? $t('addnew.baci.typeOngoing') : $t('addnew.baci.typeOnce')}</dd>
              </div>
              <div><dt>{$t('addnew.baci.pvProfit')}</dt><dd>{profitLabel}</dd></div>
              <div><dt>{$t('addnew.baci.pvPartners')}</dt><dd>{$t('addnew.baci.pvPartnersVal')}</dd></div>
            </dl>
          </div>
        </article>

        <div class="bc-ready">
          <div class="bc-ready-head">
            <span class="bc-ready-title">{$t('addnew.baci.readiness')}</span>
            <span class="bc-hint">
              {$t('addnew.baci.readyOf', { done: readyDone, total: checklist.length })}
            </span>
          </div>
          <div
            class="bc-ready-track"
            role="progressbar"
            aria-label={$t('addnew.baci.readinessAria')}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={readyPct}
          >
            <div class="bc-ready-bar" style:width="{readyPct}%"></div>
          </div>
          <ul class="bc-ready-list">
            {#each checklist as c (c.label)}
              <li class="bc-ready-item">
                <span class="bc-ready-dot" class:bc-ready-dot-ok={c.ok}></span>{c.label}
              </li>
            {/each}
          </ul>
        </div>
      </aside>
    </div>
  </div>
{:else}
  <div class="bc-done" dir={$isRtl ? 'rtl' : 'ltr'}>
    <h1 class="bc-h1">{$t('addnew.baci.sur')}</h1>
    <button type="button" class="bc-cta" onclick={project}>{$t('addnew.baci.tob')}</button>
  </div>
{/if}

{#if success}
  <div class="bc-confetti">
    <Confetti rounded size={30} x={[-5, 5]} y={[-5, 5]} delay={[0, 50]} amount={200} duration={10000} colorArray={['url(https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png)']} fallDistance="100vh" />
    <Confetti noGravity x={[-5, 5]} y={[-5, 5]} delay={[550, 550]} duration={10000} amount={2000} colorRange={[120, 240]} fallDistance="100vh" />
    <Confetti noGravity x={[-5, 5]} y={[-5, 5]} delay={[1000, 1050]} duration={10000} amount={200} colorRange={[240, 360]} fallDistance="100vh" />
    <Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]} duration={5000} amount={200} />
  </div>
{/if}

<style>
  /* Every class here carries the bc- prefix: the app has global `.label`,
     `.top`, `p` and `a` rules that would otherwise win over these. */
  .bc-root,
  .bc-done {
    --bc-ground: #070606;
    --bc-card: #171512;
    --bc-well: #0e0d0c;
    --bc-raised: #201d19;
    --bc-line: rgba(255, 255, 255, 0.06);
    --bc-edge: rgba(200, 150, 12, 0.35);
    --bc-ink: #ede5d8;
    --bc-ink-2: #c9bfb0;
    --bc-ink-3: #d8cfc0;
    --bc-muted: #9a8f80;
    --bc-gold: #eee8aa;
    --bc-gold-warm: #f0c040;
    --bc-pink: #ff4d9e;
    --bc-medal: linear-gradient(135deg, #bf953f, #fcf6ba 45%, #b38728 70%, #fbf5b7);
    --bc-display: 'Sababa', 'Cinzel', serif;
    --bc-serif: 'Bellefair', serif;
    --bc-sans: 'Heebo', 'Rubik', system-ui, sans-serif;
    --bc-ease: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bc-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    background-color: #070606;
    background-image:
      radial-gradient(900px 600px at 100% 0%, rgba(200, 150, 12, 0.1), transparent 70%),
      radial-gradient(900px 700px at 0% 100%, rgba(255, 0, 146, 0.08), transparent 70%);
  }

  .bc-root {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 16px 96px;
    box-sizing: border-box;
    color: var(--bc-ink);
    font-family: var(--bc-sans);
    text-align: start;
  }
  .bc-root :global(*) {
    box-sizing: border-box;
  }
  .bc-root p,
  .bc-root h1,
  .bc-root h2,
  .bc-root h3 {
    margin: 0;
  }

  /* top bar */
  .bc-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 0;
    border-bottom: 1px solid var(--bc-line);
  }
  .bc-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding-block: 0;
    padding-inline: 14px 18px;
    border-radius: 9999px;
    border: 1px solid rgba(238, 232, 170, 0.3);
    background: rgba(238, 232, 170, 0.04);
    color: var(--bc-gold);
    font-family: var(--bc-sans);
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s var(--bc-ease), border-color 0.2s var(--bc-ease);
  }
  .bc-back:hover {
    background: rgba(238, 232, 170, 0.1);
    border-color: rgba(238, 232, 170, 0.6);
  }
  .bc-back-arrow {
    transition: transform 0.2s var(--bc-ease);
  }
  .bc-back:hover .bc-back-arrow {
    transform: translateX(3px);
  }
  /* In RTL "back" points right (the drawn arrow); in LTR it points left. */
  :global([dir='ltr']) .bc-back-arrow {
    transform: scaleX(-1);
  }
  :global([dir='ltr']) .bc-back:hover .bc-back-arrow {
    transform: scaleX(-1) translateX(3px);
  }
  .bc-brand {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    letter-spacing: 0.24em;
    color: var(--bc-gold);
    font-size: 18px;
  }

  /* hero */
  .bc-hero {
    padding: 40px 0 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bc-eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--bc-gold-warm);
  }
  .bc-eyebrow-muted {
    color: var(--bc-muted);
  }
  .bc-h1 {
    font-family: var(--bc-display);
    font-weight: 700;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 1.1;
    color: var(--bc-gold);
  }
  .bc-lede {
    max-width: 40rem;
    font-family: var(--bc-serif);
    font-size: 20px;
    line-height: 1.5;
    color: var(--bc-ink-2);
  }

  /* assistant draft banner */
  .bc-draft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 20px;
    padding: 18px 22px;
    margin-bottom: 28px;
    border-radius: 22px;
    border: 1px solid rgba(238, 232, 170, 0.45);
    background: linear-gradient(135deg, rgba(238, 232, 170, 0.12), rgba(255, 0, 146, 0.06));
    box-shadow: 0 0 0 1px rgba(238, 232, 170, 0.12), 0 10px 40px rgba(0, 0, 0, 0.35);
  }
  .bc-draft-icon {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    border-radius: 9999px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #bf953f, #fcf6ba 45%, #aa771c);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.8), inset -1px -1px 0 rgba(0, 0, 0, 0.3);
  }
  .bc-draft-text {
    flex: 1 1 320px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .bc-draft-title {
    font-family: var(--bc-display);
    font-size: 22px;
    color: var(--bc-gold);
  }
  .bc-draft-body {
    font-size: 15px;
    line-height: 1.5;
    color: var(--bc-ink-3);
  }
  .bc-ghost-btn {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 9999px;
    border: 1px solid rgba(238, 232, 170, 0.4);
    background: transparent;
    color: var(--bc-gold);
    font-family: var(--bc-sans);
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s var(--bc-ease);
  }
  .bc-ghost-btn:hover {
    background: rgba(238, 232, 170, 0.08);
  }
  .bc-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: var(--bc-gold-warm);
    vertical-align: middle;
  }
  .bc-mark {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--bc-gold-warm);
  }

  /* layout */
  .bc-layout {
    display: flex;
    flex-wrap: wrap;
    gap: 28px;
    align-items: flex-start;
  }
  .bc-form {
    flex: 999 1 560px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .bc-aside {
    flex: 1 1 340px;
    min-width: 0;
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* step cards */
  .bc-card {
    background: var(--bc-card);
    border: 1px solid var(--bc-line);
    border-radius: 22px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .bc-card-loose {
    gap: 26px;
  }
  .bc-step-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .bc-medal {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 9999px;
    display: grid;
    place-items: center;
    font-family: var(--bc-display);
    font-size: 22px;
    color: #3a2a08;
    background: var(--bc-medal);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.8), inset -1px -1px 0 rgba(0, 0, 0, 0.3),
      0 0 16px rgba(238, 232, 170, 0.2);
  }
  .bc-step-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .bc-h2 {
    font-family: var(--bc-display);
    font-size: 26px;
    font-weight: 700;
    color: var(--bc-gold);
  }
  .bc-sub {
    font-family: var(--bc-serif);
    font-size: 17px;
    color: var(--bc-muted);
  }

  /* fields */
  .bc-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .bc-grow {
    flex: 1 1 260px;
    min-width: 0;
  }
  .bc-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  .bc-label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    font-size: 15px;
    color: var(--bc-ink);
  }
  .bc-req {
    color: var(--bc-pink);
  }
  .bc-optional {
    font-weight: 400;
    font-size: 13px;
    color: var(--bc-muted);
  }
  .bc-hint {
    font-size: 13px;
    line-height: 1.5;
    color: var(--bc-muted);
  }
  .bc-error {
    font-size: 13px;
    color: #ff8fb8;
  }
  .bc-ok {
    font-size: 13px;
    color: #49f3df;
  }
  .bc-input {
    width: 100%;
    border-radius: 10px;
    border: 1px solid var(--bc-edge);
    background: var(--bc-well);
    color: var(--bc-ink);
    font-family: var(--bc-sans);
    font-size: 16px;
    transition: border-color 0.2s var(--bc-ease), box-shadow 0.2s var(--bc-ease);
  }
  .bc-input::placeholder {
    color: #7d7366;
  }
  .bc-input:focus {
    outline: none;
    border-color: var(--bc-pink);
    box-shadow: 0 0 0 3px rgba(255, 0, 146, 0.22);
  }
  .bc-input[aria-invalid='true'] {
    border-color: #ff8fb8;
  }
  .bc-input-lg {
    min-height: 52px;
    padding: 12px 16px;
    font-size: 18px;
    font-weight: 500;
  }
  .bc-url-wrap {
    position: relative;
  }
  .bc-input-url {
    min-height: 48px;
    padding: 10px 16px 10px 44px;
    text-align: left;
  }
  .bc-url-icon {
    position: absolute;
    left: 14px;
    top: 14px;
    color: var(--bc-muted);
    pointer-events: none;
  }
  .bc-logo-col {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .bc-logo-tile {
    width: 112px;
    height: 112px;
    border-radius: 22px;
    border: 1.5px dashed rgba(238, 232, 170, 0.45);
    background: rgba(238, 232, 170, 0.04);
    display: grid;
    place-items: center;
  }

  /* rich text wells */
  .bc-editor {
    border: 1px solid var(--bc-edge);
    border-radius: 14px;
    background: var(--bc-well);
    color: var(--bc-ink);
    overflow: hidden;
    transition: border-color 0.2s var(--bc-ease), box-shadow 0.2s var(--bc-ease);
  }
  .bc-editor:focus-within {
    border-color: var(--bc-pink);
    box-shadow: 0 0 0 3px rgba(255, 0, 146, 0.22);
  }
  .bc-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
  }
  .bc-badge-public {
    background: rgba(34, 211, 238, 0.12);
    color: #67e8f9;
  }
  .bc-badge-private {
    background: rgba(255, 0, 146, 0.12);
    color: #ff7ab8;
  }

  /* values */
  .bc-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    min-height: 44px;
    align-items: center;
  }
  .bc-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding-inline: 16px 6px;
    min-height: 40px;
    border-radius: 9999px;
    background: rgba(255, 0, 146, 0.14);
    border: 1px solid rgba(255, 77, 158, 0.55);
    color: #ffd1e6;
    font-size: 15px;
    font-weight: 500;
  }
  .bc-chip-x {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 9999px;
    background: transparent;
    color: #ff9cc8;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .bc-chip-x:hover {
    background: rgba(255, 0, 146, 0.18);
  }
  .bc-empty {
    font-size: 14px;
    color: #7d7366;
  }
  .bc-add-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .bc-input-val {
    flex: 1 1 240px;
    min-width: 0;
    width: auto;
    min-height: 46px;
    padding: 10px 16px;
  }
  .bc-add-btn {
    min-height: 46px;
    padding: 0 20px;
    border-radius: 10px;
    border: 1px solid rgba(238, 232, 170, 0.4);
    background: var(--bc-raised);
    color: var(--bc-gold);
    font-family: var(--bc-sans);
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
  }
  .bc-add-btn:hover {
    background: #2a2520;
  }
  .bc-suggest {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bc-suggest-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .bc-suggest-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 9999px;
    border: 1px dashed rgba(238, 232, 170, 0.35);
    background: transparent;
    color: var(--bc-ink-3);
    font-family: var(--bc-sans);
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s var(--bc-ease);
  }
  .bc-suggest-btn:hover {
    background: rgba(238, 232, 170, 0.06);
  }
  .bc-suggest-new {
    border-color: rgba(255, 77, 158, 0.55);
    color: #ffd1e6;
  }

  /* consent rules */
  .bc-fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bc-legend {
    padding: 0;
    margin-bottom: 12px;
    font-weight: 500;
    font-size: 15px;
    color: var(--bc-ink);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .bc-legend-hint {
    margin-top: -8px;
  }
  .bc-types {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }
  .bc-type {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 18px;
    min-height: 44px;
    border-radius: 14px;
    cursor: pointer;
    text-align: start;
    background: var(--bc-well);
    border: 2px solid var(--bc-line);
    transition: all 0.2s var(--bc-ease);
  }
  .bc-type:hover {
    border-color: rgba(238, 232, 170, 0.3);
  }
  .bc-type-on,
  .bc-type-on:hover {
    background: rgba(238, 232, 170, 0.08);
    border-color: rgba(238, 232, 170, 0.6);
    box-shadow: 0 0 0 1px rgba(238, 232, 170, 0.2), 0 0 20px rgba(238, 232, 170, 0.15);
  }
  .bc-type-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
  }
  .bc-type-label {
    font-family: var(--bc-display);
    font-size: 20px;
    color: var(--bc-gold);
  }
  .bc-type-ex {
    font-family: var(--bc-sans);
    font-weight: 400;
    font-size: 14px;
    line-height: 1.5;
    color: #b5aa9a;
  }
  .bc-radio {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    border: 2px solid #52493e;
  }
  .bc-radio-on {
    border: 6px solid var(--bc-gold);
    background: var(--bc-card);
  }
  .bc-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .bc-pill {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 9999px;
    font-family: var(--bc-sans);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    background: var(--bc-raised);
    color: var(--bc-ink);
    border: 1px solid rgba(200, 150, 12, 0.22);
    transition: all 0.2s var(--bc-ease);
  }
  .bc-pill:hover {
    border-color: rgba(238, 232, 170, 0.5);
  }
  .bc-pill-on,
  .bc-pill-on:hover {
    background: linear-gradient(180deg, #f6f0b8, #d9c76a);
    color: #2e2106;
    border-color: var(--bc-gold);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.7), 0 0 18px rgba(238, 232, 170, 0.25);
  }
  .bc-silence {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(2, 255, 187, 0.06);
    border: 1px solid rgba(2, 255, 187, 0.22);
  }
  .bc-silence-icon {
    flex: 0 0 auto;
    margin-top: 2px;
    color: #49f3df;
  }
  .bc-silence-text {
    font-size: 15px;
    line-height: 1.55;
    color: #cfeee8;
  }
  .bc-silence-lead {
    color: #49f3df;
    font-weight: 700;
  }

  /* submit */
  .bc-submit {
    border-radius: 22px;
    padding: 26px 28px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    background: linear-gradient(135deg, rgba(200, 21, 95, 0.16), rgba(238, 232, 170, 0.06));
    border: 1px solid rgba(255, 77, 158, 0.35);
  }
  .bc-seed {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .bc-seed-icon {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--bc-gold-warm);
  }
  .bc-seed-text {
    font-size: 15px;
    line-height: 1.55;
    color: var(--bc-ink);
  }
  .bc-submit-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }
  .bc-cta-hint {
    flex: 1 1 260px;
    font-family: var(--bc-serif);
    font-size: 18px;
    line-height: 1.45;
    color: var(--bc-ink-3);
  }
  .bc-cta {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 0 30px;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: linear-gradient(135deg, #c8155f, #9e0f4a);
    color: #ffffff;
    font-family: var(--bc-display);
    font-weight: 700;
    font-size: 21px;
    cursor: pointer;
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.35), inset -1px -1px 0 rgba(0, 0, 0, 0.35),
      0 6px 26px rgba(200, 21, 95, 0.45);
    transition: all 0.2s var(--bc-ease);
  }
  .bc-cta:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .bc-cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
  /* The arrow points the way the page reads. */
  :global([dir='ltr']) .bc-cta-arrow {
    transform: scaleX(-1);
  }

  /* preview card */
  .bc-preview {
    border-radius: 22px;
    background: var(--bc-card);
    border: 2px solid rgba(238, 232, 170, 0.5);
    box-shadow: 0 0 0 1px rgba(238, 232, 170, 0.25), 0 0 24px rgba(238, 232, 170, 0.18),
      0 0 48px rgba(238, 232, 170, 0.08);
    overflow: hidden;
  }
  .bc-preview-cover {
    height: 84px;
    background: linear-gradient(120deg, #2a2520, #3a2f1c 50%, #3b1427);
  }
  .bc-preview-body {
    padding: 0 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .bc-preview-avatar {
    width: 72px;
    height: 72px;
    margin-top: -36px;
    border-radius: 9999px;
    display: grid;
    place-items: center;
    object-fit: cover;
    background: var(--bc-medal);
    border: 3px solid var(--bc-card);
    font-family: var(--bc-display);
    font-size: 30px;
    color: #3a2a08;
  }
  .bc-preview-name {
    font-family: var(--bc-display);
    font-size: 28px;
    line-height: 1.15;
    font-weight: 700;
    color: var(--bc-gold);
    overflow-wrap: anywhere;
  }
  .bc-preview-desc {
    font-family: var(--bc-serif);
    font-size: 17px;
    line-height: 1.5;
    color: var(--bc-ink-2);
    overflow-wrap: anywhere;
  }
  .bc-preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .bc-preview-tag {
    padding: 4px 12px;
    border-radius: 9999px;
    background: rgba(255, 0, 146, 0.12);
    color: #ffb3d6;
    font-size: 13px;
  }
  .bc-preview-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding-top: 14px;
    border-top: 1px solid var(--bc-line);
  }
  .bc-preview-facts div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .bc-preview-facts dt {
    font-size: 12px;
    color: var(--bc-muted);
  }
  .bc-preview-facts dd {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--bc-ink);
  }

  /* readiness */
  .bc-ready {
    border-radius: 14px;
    background: var(--bc-well);
    border: 1px solid var(--bc-line);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bc-ready-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .bc-ready-title {
    font-weight: 500;
    font-size: 15px;
  }
  .bc-ready-track {
    height: 6px;
    border-radius: 9999px;
    background: #2a2520;
    overflow: hidden;
  }
  .bc-ready-bar {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #ff0092, #eee8aa);
    transition: width 0.3s var(--bc-ease);
  }
  .bc-ready-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .bc-ready-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--bc-ink-2);
  }
  .bc-ready-dot {
    flex: 0 0 auto;
    width: 10px;
    height: 10px;
    border-radius: 9999px;
    border: 1.5px solid #52493e;
  }
  .bc-ready-dot-ok {
    border: 0;
    background: #02ffbb;
    box-shadow: 0 0 8px rgba(2, 255, 187, 0.5);
  }

  /* done */
  .bc-done {
    min-height: 60vh;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 28px;
    padding: 0 16px;
    text-align: center;
  }

  .bc-confetti {
    position: fixed;
    top: -50px;
    left: 0;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    overflow: hidden;
    pointer-events: none;
  }

  .bc-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .bc-root button:focus-visible,
  .bc-done button:focus-visible {
    outline: 2px solid var(--bc-gold-warm);
    outline-offset: 2px;
  }

  @media (max-width: 600px) {
    .bc-card {
      padding: 20px 18px;
    }
    .bc-submit {
      padding: 22px 18px;
    }
    .bc-cta {
      width: 100%;
      justify-content: center;
    }
    .bc-aside {
      position: static;
    }
  }
</style>
