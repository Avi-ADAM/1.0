<script>
  import { isRtl, t } from '$lib/translations';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { executeAction } from '$lib/client/actionClient.js';
  import { invalidateAll } from '$app/navigation';
  import MultiSelect from 'svelte-multiselect';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { onMount, untrack } from 'svelte';
  import { mergeRemote, sameSet, sameText } from '$lib/realtime/editMerge';
  import Uplad from '$lib/components/userPr/uploadPic.svelte';
  import CurrencyPicker from '$lib/components/money/CurrencyPicker.svelte';
  import { DEFAULT_CURRENCY } from '$lib/money/currencies.js';
  import {
    DEFAULT_OPEN_YEARS,
    MAX_OPEN_YEARS,
    MIN_OPEN_YEARS,
    effectiveLicense,
    isDelayedLicense
  } from '$lib/codeLicense/codeLicense.js';



  let { projectBase, projectId, memberCount = 1, onSuccess, onCancel } = $props();

  // Form state initialized from projectBase
  let projectName = $state(projectBase?.projectName ?? '');
  let publicDescription = $state(projectBase?.publicDescription ?? '');
  let descripFor = $state(projectBase?.descripFor ?? '');
  let linkToWebsite = $state(projectBase?.linkToWebsite ?? '');
  let githublink = $state(projectBase?.githublink ?? '');
  let fblink = $state(projectBase?.fblink ?? '');
  let discordlink = $state(projectBase?.discordlink ?? '');
  let drivelink = $state(projectBase?.drivelink ?? '');
  let twiterlink = $state(projectBase?.twiterlink ?? '');
  let watsapplink = $state(projectBase?.watsapplink ?? '');
  let restime = $state(projectBase?.restime ?? 'feh');
  let codeLicense = $state(effectiveLicense(projectBase?.codeLicense));
  let codeLicenseOpenYears = $state(projectBase?.codeLicenseOpenYears ?? DEFAULT_OPEN_YEARS);
  let srcP = $state(projectBase?.profilePic?.data?.attributes?.url ?? '');
  let newPicId = $state(null);

  // Values selection
  let allVallues = $state([]);

  function localizedVallueName(v) {
    if ($lang === 'he') {
      const loc = v.attributes.localizations?.data?.[0]?.attributes?.valueName;
      if (loc) return loc;
    }
    return v.attributes.valueName;
  }

  let selectedVallueNames = $state(
    (projectBase?.vallues?.data ?? []).map(localizedVallueName)
  );

  let loading = $state(false);
  let successMsg = $state('');
  let errorMsg = $state('');

  // The rikma's own books (PLAN_MULTI_CURRENCY D-C8). Saved on its own, not
  // with the rest of the form: the server refuses it once money exists, and
  // that refusal must not take the whole "save details" with it.
  let rikmaCurrency = $state(projectBase?.currencyCode || DEFAULT_CURRENCY);
  let currencyMsg = $state('');
  let currencyErr = $state('');
  let currencySaving = $state(false);

  async function saveCurrency(code) {
    currencyMsg = '';
    currencyErr = '';
    currencySaving = true;
    const res = await executeAction(
      'setRikmaCurrency',
      { projectId: String(projectId), currency: code },
      { showErrorToast: false }
    );
    currencySaving = false;
    if (res?.success) {
      currencyMsg = $t('money.rikma.saved');
      await invalidateAll();
    } else {
      currencyErr = res?.error?.message || $t('money.rikma.locked');
      rikmaCurrency = projectBase?.currencyCode || DEFAULT_CURRENCY;
    }
  }

  const isMultiUser = memberCount > 1;

  // ── Changed while you were editing (PLAN_REALTIME_MIGRATION, $lib/realtime/editMerge)
  // The rikma's details can change under the open form — another member's
  // edit, or a details decision that matured. The moach realtime adapter
  // re-reads `projectBase`; here it is merged into the form field by field:
  // what the member did not touch follows quietly, what both sides changed is
  // put to the member to choose.
  const MERGE_FIELDS = [
    { key: 'projectName' },
    { key: 'publicDescription', eq: sameText },
    { key: 'descripFor', eq: sameText },
    { key: 'linkToWebsite' },
    { key: 'githublink' },
    { key: 'fblink' },
    { key: 'discordlink' },
    { key: 'drivelink' },
    { key: 'twiterlink' },
    { key: 'watsapplink' },
    { key: 'restime' },
    { key: 'codeLicense' },
    { key: 'codeLicenseOpenYears' },
    { key: 'vallues', eq: sameSet },
    { key: 'pic' }
  ];
  const FIELD_LABEL = {
    projectName: 'project.editDetails.name',
    publicDescription: 'project.editDetails.pubDesc',
    descripFor: 'project.editDetails.privDesc',
    linkToWebsite: 'project.editDetails.website',
    githublink: 'project.editDetails.github',
    fblink: 'project.editDetails.facebook',
    discordlink: 'project.editDetails.discord',
    drivelink: 'project.editDetails.drive',
    twiterlink: 'project.editDetails.twitter',
    watsapplink: 'project.editDetails.whatsapp',
    restime: 'project.editDetails.restime',
    codeLicense: 'project.editDetails.codeLicense',
    codeLicenseOpenYears: 'project.editDetails.codeLicenseYears',
    vallues: 'project.editDetails.values',
    pic: 'project.editDetails.uploadPic'
  };
  const fieldLabels = (keys) => keys.map((k) => $t(FIELD_LABEL[k])).join(', ');

  /** The rikma's details, shaped like the form. */
  function fromBase(pb) {
    return {
      projectName: pb?.projectName ?? '',
      publicDescription: pb?.publicDescription ?? '',
      descripFor: pb?.descripFor ?? '',
      linkToWebsite: pb?.linkToWebsite ?? '',
      githublink: pb?.githublink ?? '',
      fblink: pb?.fblink ?? '',
      discordlink: pb?.discordlink ?? '',
      drivelink: pb?.drivelink ?? '',
      twiterlink: pb?.twiterlink ?? '',
      watsapplink: pb?.watsapplink ?? '',
      restime: pb?.restime ?? 'feh',
      codeLicense: effectiveLicense(pb?.codeLicense),
      codeLicenseOpenYears: pb?.codeLicenseOpenYears ?? DEFAULT_OPEN_YEARS,
      vallues: (pb?.vallues?.data ?? []).map(localizedVallueName),
      pic: pb?.profilePic?.data?.attributes?.url ?? ''
    };
  }

  /** What the form holds now. */
  function current() {
    return {
      projectName, publicDescription, descripFor, linkToWebsite, githublink, fblink,
      discordlink, drivelink, twiterlink, watsapplink, restime, codeLicense,
      codeLicenseOpenYears, vallues: selectedVallueNames, pic: srcP
    };
  }

  function setField(key, value) {
    switch (key) {
      case 'projectName': projectName = value ?? ''; break;
      case 'publicDescription': publicDescription = value ?? ''; break;
      case 'descripFor': descripFor = value ?? ''; break;
      case 'linkToWebsite': linkToWebsite = value ?? ''; break;
      case 'githublink': githublink = value ?? ''; break;
      case 'fblink': fblink = value ?? ''; break;
      case 'discordlink': discordlink = value ?? ''; break;
      case 'drivelink': drivelink = value ?? ''; break;
      case 'twiterlink': twiterlink = value ?? ''; break;
      case 'watsapplink': watsapplink = value ?? ''; break;
      case 'restime': restime = value ?? 'feh'; break;
      case 'codeLicense': codeLicense = value; break;
      case 'codeLicenseOpenYears': codeLicenseOpenYears = value ?? DEFAULT_OPEN_YEARS; break;
      case 'vallues': selectedVallueNames = value ?? []; break;
      case 'pic': srcP = value ?? ''; newPicId = null; break;
    }
  }

  // The version the form is editing against. Plain, not reactive: it moves
  // only when a newer version has been merged in.
  let baseline = untrack(() => fromBase(projectBase));
  let conflicts = $state([]);
  let quietlyUpdated = $state([]);

  // An effect, not a $derived: the fields are the member's to edit, and the
  // merge needs history (`baseline`) — it writes a newer version *into* local
  // state only where the member had not touched it.
  $effect(() => {
    const theirs = fromBase(projectBase);
    untrack(() => {
      const r = mergeRemote(baseline, current(), theirs, MERGE_FIELDS);
      baseline = theirs;
      const applied = Object.keys(r.apply);
      for (const k of applied) setField(k, r.apply[k]);
      if (applied.length) quietlyUpdated = applied;
      if (r.conflicts.length) {
        const fresh = new Set(r.conflicts.map((c) => c.key));
        conflicts = [...conflicts.filter((c) => !fresh.has(c.key)), ...r.conflicts];
      }
    });
  });

  function takeTheirs() {
    for (const c of conflicts) setField(c.key, c.theirs);
    conflicts = [];
  }
  function keepMine() {
    conflicts = [];
  }

  /** @type {'rtl' | 'ltr'} */
  let dir = $derived($isRtl ? 'rtl' : 'ltr');

  onMount(async () => {
    try {
      const res = await sendToSer({}, 'getAllVallues', 0, 0, false, fetch);
      let vallues = res?.data?.vallues?.data ?? [];
      if ($lang === 'he') {
        vallues = vallues.map((v) => {
          const loc = v.attributes.localizations?.data?.[0]?.attributes?.valueName;
          return loc ? { ...v, attributes: { ...v.attributes, valueName: loc } } : v;
        });
      }
      allVallues = vallues;
    } catch (e) {
      console.error('Failed to load vallues', e);
    }
  });

  // Original IDs from projectBase, used as fallback if allVallues hasn't loaded yet
  const originalVallueIds = (projectBase?.vallues?.data ?? []).map((v) => v.id);

  function resolveVallueIds(names) {
    if (allVallues.length === 0) {
      // allVallues not loaded yet — keep original to avoid wiping the relation
      return originalVallueIds;
    }
    return names
      .map((name) => allVallues.find((v) => v.attributes.valueName === name)?.id)
      .filter(Boolean);
  }

  async function handleUpload(event) {
    const files = event.files;
    loading = true;
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: files
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      if (data?.[0]?.id) {
        newPicId = String(data[0].id);
        srcP = data[0].url;
      }
    } catch (e) {
      console.error('Upload failed', e);
      errorMsg = $t('project.editDetails.errorMsg');
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    if (!projectName.trim()) return;
    loading = true;
    successMsg = '';
    errorMsg = '';

    const result = await executeAction('updateProjectDetails', {
      projectId,
      projectName: projectName.trim(),
      publicDescription,
      descripFor,
      linkToWebsite,
      githublink,
      fblink,
      discordlink,
      drivelink,
      twiterlink,
      watsapplink,
      restime,
      codeLicense,
      codeLicenseOpenYears: Number(codeLicenseOpenYears),
      vallueIds: resolveVallueIds(selectedVallueNames),
      newPicId
    });

    loading = false;

    if (result.success) {
      const count = result.data?.decisionsCreated ?? 0;
      if (isMultiUser && count === 0 && !result.data?.projectName) {
        successMsg = $t('project.editDetails.successNoChange');
      } else if (isMultiUser) {
        successMsg = $t('project.editDetails.successMulti');
      } else {
        successMsg = $t('project.editDetails.successSingle');
        await invalidateAll();
      }
      onSuccess?.();
    } else {
      errorMsg = result.error?.message || $t('project.editDetails.errorMsg');
    }
  }
</script>

<div {dir} class="edit-project-details space-y-5 p-4 bg-white rounded-xl shadow-md">
  <h2 class="text-xl font-bold text-primary">{$t('project.editDetails.title')}</h2>

  {#if isMultiUser}
    <div class="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-3 text-sm">
      {$t('project.editDetails.multiUserNote')}
    </div>
  {/if}

  {#if conflicts.length}
    <div class="bg-rose-50 border border-rose-300 text-rose-900 rounded-lg p-3 text-sm space-y-2" role="alert">
      <p class="font-bold">{$t('project.editDetails.changedTitle')}</p>
      <p>{$t('project.editDetails.changedBody')} {fieldLabels(conflicts.map((c) => c.key))}</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="px-3 py-1 rounded-lg bg-rose-700 text-white font-semibold" onclick={takeTheirs}>
          {$t('project.editDetails.takeTheirs')}
        </button>
        <button type="button" class="px-3 py-1 rounded-lg border border-rose-400 text-rose-900" onclick={keepMine}>
          {$t('project.editDetails.keepMine')}
        </button>
      </div>
    </div>
  {:else if quietlyUpdated.length}
    <div class="flex items-start justify-between gap-2 bg-sky-50 border border-sky-300 text-sky-900 rounded-lg p-3 text-sm" role="status">
      <span>{$t('project.editDetails.updatedQuietly', { fields: fieldLabels(quietlyUpdated) })}</span>
      <button type="button" class="font-bold leading-none" aria-label={$t('project.editDetails.cancel')} onclick={() => (quietlyUpdated = [])}>×</button>
    </div>
  {/if}

  <!-- Profile Pic -->
  <div class="field-group">
    <label class="field-label">{$t('project.editDetails.uploadPic')}</label>
    <div class="flex justify-center bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gold/30">
      <Uplad onMessage={handleUpload} current={srcP} noHeader={true} />
    </div>
  </div>

  <!-- The currency the rikma keeps its books in (PLAN_MULTI_CURRENCY). Every
       member still reads amounts in their own; this is only the unit the
       rikma counts in, and it can be set while no money has been recorded. -->
  <div class="field-group">
    <label class="field-label" for="epd-currency">{$t('money.rikma.title')}</label>
    <CurrencyPicker
      id="epd-currency"
      bind:value={rikmaCurrency}
      disabled={currencySaving}
      onchange={saveCurrency}
    />
    <small class="text-gold">{$t('money.rikma.desc')}</small>
    {#if currencyMsg}<small class="text-green-600 block" role="status">{currencyMsg}</small>{/if}
    {#if currencyErr}<small class="text-red-600 block" role="alert">{currencyErr}</small>{/if}
  </div>

  <!-- Name -->
  <div class="field-group">
    <label class="field-label" for="epd-name">{$t('project.editDetails.name')}</label>
    <input id="epd-name" class="field-input" type="text" bind:value={projectName} required />
  </div>

  <!-- Public description -->
  <div class="field-group">
    <label class="field-label" for="epd-pubdesc">{$t('project.editDetails.pubDesc')}</label>
    <RichText bind:outpot={publicDescription} sml={true} />
  </div>

  <!-- Private description -->
  <div class="field-group">
    <label class="field-label" for="epd-privdesc">{$t('project.editDetails.privDesc')}</label>
    <RichText bind:outpot={descripFor} sml={true} />
  </div>

  <!-- Website -->
  <div class="field-group">
    <label class="field-label" for="epd-website">{$t('project.editDetails.website')}</label>
    <input id="epd-website" class="field-input" type="url" bind:value={linkToWebsite} />
  </div>

  <!-- GitHub -->
  <div class="field-group">
    <label class="field-label" for="epd-github">{$t('project.editDetails.github')}</label>
    <input id="epd-github" class="field-input" type="url" bind:value={githublink} />
  </div>

  <!-- Code license (PLAN_CODE_RIKMA §2.2) -->
  <div class="field-group">
    <label class="field-label" for="epd-license">{$t('project.editDetails.codeLicense')}</label>
    <select id="epd-license" class="field-select" bind:value={codeLicense}>
      <option value="none">{$t('project.editDetails.codeLicenseNone')}</option>
      <option value="mit">{$t('project.editDetails.codeLicenseMit')}</option>
      <option value="apache">{$t('project.editDetails.codeLicenseApache')}</option>
      <option value="rikma">{$t('project.editDetails.codeLicenseRikma')}</option>
      <option value="rikmaDelayed">{$t('project.editDetails.codeLicenseRikmaDelayed')}</option>
      <option value="rikmaShared">{$t('project.editDetails.codeLicenseRikmaShared')}</option>
      <option value="rikmaSharedDelayed">{$t('project.editDetails.codeLicenseRikmaSharedDelayed')}</option>
    </select>
    {#if isDelayedLicense(codeLicense)}
      <label class="field-label" for="epd-license-years">{$t('project.editDetails.codeLicenseYears')}</label>
      <input
        id="epd-license-years"
        class="field-input"
        type="number"
        min={MIN_OPEN_YEARS}
        max={MAX_OPEN_YEARS}
        bind:value={codeLicenseOpenYears}
      />
    {/if}
    <small class="text-gold">{$t('project.editDetails.codeLicenseNote')}</small>
  </div>

  <!-- Facebook -->
  <div class="field-group">
    <label class="field-label" for="epd-facebook">{$t('project.editDetails.facebook')}</label>
    <input id="epd-facebook" class="field-input" type="url" bind:value={fblink} />
  </div>

  <!-- Discord -->
  <div class="field-group">
    <label class="field-label" for="epd-discord">{$t('project.editDetails.discord')}</label>
    <input id="epd-discord" class="field-input" type="url" bind:value={discordlink} />
  </div>

  <!-- Drive -->
  <div class="field-group">
    <label class="field-label" for="epd-drive">{$t('project.editDetails.drive')}</label>
    <input id="epd-drive" class="field-input" type="url" bind:value={drivelink} />
  </div>

  <!-- Twitter -->
  <div class="field-group">
    <label class="field-label" for="epd-twitter">{$t('project.editDetails.twitter')}</label>
    <input id="epd-twitter" class="field-input" type="url" bind:value={twiterlink} />
  </div>

  <!-- WhatsApp -->
  <div class="field-group">
    <label class="field-label" for="epd-whatsapp">{$t('project.editDetails.whatsapp')}</label>
    <input id="epd-whatsapp" class="field-input" type="url" bind:value={watsapplink} />
  </div>

  <!-- Response time -->
  <div class="field-group">
    <label class="field-label" for="epd-restime">{$t('project.editDetails.restime')}</label>
    <select id="epd-restime" class="field-select" bind:value={restime}>
      <option value="feh">{$t('project.editDetails.restime48')}</option>
      <option value="sth">{$t('project.editDetails.restime72')}</option>
      <option value="nsh">{$t('project.editDetails.restime96')}</option>
      <option value="sevend">{$t('project.editDetails.restimeWeek')}</option>
    </select>
    <small class="text-gold">{$t('project.editDetails.restimeNote')}</small>
  </div>

  <!-- Values -->
  {#if allVallues.length > 0}
    <div class="field-group">
      <label class="field-label">{$t('project.editDetails.values')}</label>
      <MultiSelect
        bind:selected={selectedVallueNames}
        options={allVallues.map((v) => v.attributes.valueName)}
        placeholder={$t('project.editDetails.addValue')}
        --sms-li-selected-bg="var(--gold)"
        outerDivClass="!bg-gold !text-barbi"
        inputClass="!bg-gold !text-barbi"
        liSelectedClass="!bg-barbi !text-gold"
      />
    </div>
  {/if}

  <!-- Messages -->
  {#if successMsg}
    <div class="text-green-700 bg-green-50 border border-green-300 rounded-lg p-3 text-sm">
      {successMsg}
    </div>
  {/if}
  {#if errorMsg}
    <div class="text-red-700 bg-red-50 border border-red-300 rounded-lg p-3 text-sm">
      {errorMsg}
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex gap-3 justify-end flex-wrap">
    <button
      class="btn-secondary"
      onclick={onCancel}
      disabled={loading}
    >
      {$t('project.editDetails.cancel')}
    </button>
    <button
      class="btn-primary"
      onclick={handleSubmit}
      disabled={loading || !projectName.trim()}
    >
      {loading ? $t('project.editDetails.saving') : $t('project.editDetails.save')}
    </button>
  </div>
</div>

<style>
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field-label {
    font-size: 13px;
    color: var(--barbi-pink);
    font-weight: 500;
  }
  .field-input,
  .field-select {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--gold);
    padding: 8px 0;
    font-size: 14px;
    color: var(--barbi-pink);
    outline: none;
    width: 100%;
  }
  .field-input:focus,
  .field-select:focus {
    border-bottom-color: #2196f3;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--barbi-pink), var(--mpink));
    color: var(--gold);
    font-weight: bold;
    padding: 10px 24px;
    border-radius: 9999px;
    transition: opacity 0.2s;
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-secondary {
    border: 1px solid var(--gold);
    color: var(--barbi-pink);
    padding: 10px 24px;
    border-radius: 9999px;
    transition: background 0.2s;
  }
  .btn-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }
</style>
