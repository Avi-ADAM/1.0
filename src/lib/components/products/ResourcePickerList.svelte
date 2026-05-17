<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import ResourceDetailsModal from './ResourceDetailsModal.svelte';
  import type {
    RecipeResourceRow,
    AvailableResource,
    ProjectMember,
    ResourceExtraDetails,
    ResourceTemplate
  } from './types';

  type Props = {
    rows: RecipeResourceRow[];
    projectId: string;
    availableResources?: AvailableResource[];
    projectMembers?: ProjectMember[];
    resourceTemplates?: ResourceTemplate[];
    multiMember?: boolean;
  };

  let {
    rows = $bindable([]),
    projectId,
    availableResources = [],
    projectMembers = [],
    resourceTemplates = [],
    multiMember = false
  }: Props = $props();

  const kindMap: Record<string, RecipeResourceRow['kindOf']> = {
    service: 'service',
    good: 'good',
    subscription: 'subscription',
    perUnit: 'good',
    monthly: 'subscription',
    yearly: 'subscription',
    total: 'good',
    rent: 'service',
    other: 'other'
  };

  function hydrateFromTemplate(i: number, value: string) {
    const v = value.trim().toLocaleLowerCase();
    if (!v) return;
    const template = resourceTemplates.find(
      (m) => (m.attributes.name ?? '').trim().toLocaleLowerCase() === v
    );
    if (!template) return;
    const attrs = template.attributes;
    const descripPlain = (attrs.descrip ?? '').replace(/<[^>]*>/g, ' ').trim();
    const mappedKind = kindMap[attrs.kindOf ?? ''] ?? null;

    rows = rows.map((r, idx) => {
      if (idx !== i) return r;
      const existing = r.extraDetails;
      const hydratedDetails: ResourceExtraDetails = {
        descripRich: existing?.descripRich || attrs.descrip || '',
        spnot: existing?.spnot ?? '',
        linkto: existing?.linkto || attrs.linkto || '',
        easy: existing?.easy ?? 0,
        startDate: existing?.startDate ?? null,
        endDate: existing?.endDate ?? null
      };
      return {
        ...r,
        name: attrs.name ?? r.name,
        pricePerUnit: r.pricePerUnit || attrs.price || 0,
        kindOf: mappedKind ?? r.kindOf,
        notes: r.notes || descripPlain,
        extraDetails: hydratedDetails
      };
    });
  }

  const t = $derived(
    $lang === 'he'
      ? {
          empty: 'אין משאבים נדרשים. אפשר להשאיר ריק או להוסיף שורה.',
          add: '+ הוסף משאב',
          modeExisting: 'משאב בתהליך בפרויקט',
          modeNew: 'משאב חדש',
          pickExisting: 'בחר משאב פעיל',
          pickExistingPh: '— בחר משאב בתהליך —',
          noExisting: 'אין משאבים פעילים בפרויקט. צור משאב חדש.',
          nameph: 'שם המשאב',
          desc: 'תיאור קצר',
          quantityPerUnit: 'כמות ליחידה',
          pricePerUnit: 'מחיר ליחידה',
          kindOf: 'סוג',
          kindService: 'שירות',
          kindGood: 'מוצר',
          kindSubscription: 'מנוי',
          kindOther: 'אחר',
          assignedTo: 'אחראי',
          chooseMember: '— בחר חבר פרויקט —',
          unassigned: 'טרם שויך',
          unassignedWarning:
            'ללא אחראי → המשאב יוצג ללקוחות כתלוי בספק שעדיין לא נמצא',
          onlyPartOfTag: 'לא מנוצל עד מכירה',
          onlyPartOfHelp:
            'המשאב יוקם כסקיצה (onlyPartOf=true) וייצא לרכש רק כשמישהו יקנה את המוצר',
          pendmFlow:
            '⚠ פרויקט עם 2+ חברים — כל משאב חדש ייווצר ראשית כ-pmash להצבעה',
          singleFlow: '👤 חבר יחיד בפרויקט — המשאב ייווצר ישירות אצלך',
          ownerFromExisting: 'האחראי יורש מהמשאב הקיים',
          fullDetails: '⚙ פרטים מלאים (קישור, מפרט, תאריכים...)',
          fullDetailsSet: '✓ פרטים מלאים נשמרו',
          detailsSubtitle: 'אופציונלי — אפשר להשאיר ריק ולהמשיך',
          rowTotal: 'סה"כ לשורה',
          remove: 'הסר שורה',
          fromPmash: 'בתהליך הצבעה',
          fromOpen: 'בקשה פתוחה'
        }
      : {
          empty: 'No resources required. Leave empty or add a row.',
          add: '+ Add resource',
          modeExisting: 'Existing project resource',
          modeNew: 'New resource',
          pickExisting: 'Pick an active resource',
          pickExistingPh: '— Select resource in progress —',
          noExisting: 'No active resources in the project. Create a new one.',
          nameph: 'Resource name',
          desc: 'Short description',
          quantityPerUnit: 'Qty/unit',
          pricePerUnit: 'Price/unit',
          kindOf: 'Kind',
          kindService: 'Service',
          kindGood: 'Good',
          kindSubscription: 'Subscription',
          kindOther: 'Other',
          assignedTo: 'Owner',
          chooseMember: '— Choose project member —',
          unassigned: 'Unassigned',
          unassignedWarning:
            'No owner → the resource will be flagged to customers as "supplier not yet found"',
          onlyPartOfTag: 'Idle until purchase',
          onlyPartOfHelp:
            'Resource is created as a draft (onlyPartOf=true) — procurement triggered only when product is sold',
          pendmFlow:
            '⚠ Multi-member project — every new resource first becomes a pmash for vote',
          singleFlow:
            '👤 Single project member — the resource will be created directly under you',
          ownerFromExisting: 'Owner is inherited from the existing resource',
          fullDetails: '⚙ Full details (link, spec, dates...)',
          fullDetailsSet: '✓ Full details saved',
          detailsSubtitle: 'optional — you can skip and continue',
          rowTotal: 'Row total',
          remove: 'Remove row',
          fromPmash: 'pending vote',
          fromOpen: 'open request'
        }
  );

  function add() {
    rows = [
      ...rows,
      {
        pmashId: null,
        openMashaabimId: null,
        name: '',
        quantityPerUnit: 1,
        pricePerUnit: 0,
        kindOf: 'good',
        mode: availableResources.length > 0 ? 'consumeExisting' : 'createNew',
        assignedMemberId: null,
        onlyPartOf: true,
        notes: '',
        extraDetails: null
      }
    ];
  }

  function remove(i: number) {
    rows = rows.filter((_, idx) => idx !== i);
  }

  function setMode(i: number, m: 'createNew' | 'consumeExisting') {
    rows = rows.map((r, idx) => {
      if (idx !== i) return r;
      if (m === r.mode) return r;
      if (m === 'createNew') {
        return {
          ...r,
          mode: m,
          pmashId: null,
          openMashaabimId: null,
          name: '',
          pricePerUnit: 0,
          assignedMemberId: null,
          onlyPartOf: true
        };
      }
      return {
        ...r,
        mode: m,
        onlyPartOf: false,
        extraDetails: null
      };
    });
  }

  function existingKey(r: AvailableResource): string {
    return `${r.source}:${r.id}`;
  }

  function pickExisting(i: number, key: string) {
    const found = availableResources.find((r) => existingKey(r) === key);
    if (!found) return;
    const attrs = found.attributes;
    const ownerId =
      attrs.users?.find((u) => u.what)?.users_permissions_user?.data?.id ?? null;
    rows = rows.map((r, idx) =>
      idx === i
        ? {
            ...r,
            pmashId: found.source === 'pmash' ? found.id : null,
            openMashaabimId: found.source === 'openMashaabim' ? found.id : null,
            name: attrs.name,
            pricePerUnit: attrs.price ?? r.pricePerUnit,
            quantityPerUnit: attrs.hm ?? r.quantityPerUnit,
            kindOf: kindMap[attrs.kindOf ?? 'good'] ?? 'good',
            assignedMemberId: ownerId,
            onlyPartOf: false
          }
        : r
    );
  }

  function currentExistingKey(r: RecipeResourceRow): string {
    if (r.pmashId) return `pmash:${r.pmashId}`;
    if (r.openMashaabimId) return `openMashaabim:${r.openMashaabimId}`;
    return '';
  }

  function rowTotal(r: RecipeResourceRow): number {
    return (r.quantityPerUnit || 0) * (r.pricePerUnit || 0);
  }

  function memberLabel(id: string | null): string {
    if (!id) return t.unassigned;
    const m = projectMembers.find((u) => u.id === id);
    return m?.attributes.username ?? `#${id}`;
  }

  // ── Full-details modal ─────────────────────────────────────────────────────
  let detailsOpenFor = $state<number | null>(null);
  const activeRowName = $derived(
    detailsOpenFor !== null ? rows[detailsOpenFor]?.name ?? '' : ''
  );
  const activeRowDetails = $derived(
    detailsOpenFor !== null ? rows[detailsOpenFor]?.extraDetails ?? null : null
  );

  function saveDetails(details: ResourceExtraDetails) {
    if (detailsOpenFor === null) return;
    const i = detailsOpenFor;
    rows = rows.map((r, idx) => (idx === i ? { ...r, extraDetails: details } : r));
    detailsOpenFor = null;
  }
</script>

<div class="picker">
  {#if rows.length === 0}
    <div class="empty">{t.empty}</div>
  {/if}

  {#if rows.length > 0}
    {#if multiMember}
      <div class="flow-note flow-multi">{t.pendmFlow}</div>
    {:else}
      <div class="flow-note flow-single">{t.singleFlow}</div>
    {/if}
  {/if}

  {#each rows as r, i (i)}
    <div
      class="row"
      class:warn={r.mode === 'createNew' && !r.assignedMemberId}
    >
      <div class="row-head">
        <div class="mode-seg" role="tablist">
          <button
            type="button"
            class:active={r.mode === 'consumeExisting'}
            onclick={() => setMode(i, 'consumeExisting')}
          >
            {t.modeExisting}
          </button>
          <button
            type="button"
            class:active={r.mode === 'createNew'}
            onclick={() => setMode(i, 'createNew')}
          >
            {t.modeNew}
          </button>
        </div>
        <button class="x" type="button" aria-label={t.remove} onclick={() => remove(i)}>
          ×
        </button>
      </div>

      {#if r.mode === 'consumeExisting'}
        {#if availableResources.length === 0}
          <div class="empty-inline">{t.noExisting}</div>
        {:else}
          <label class="field">
            <span>{t.pickExisting}</span>
            <select
              class="input"
              value={currentExistingKey(r)}
              onchange={(e) => pickExisting(i, (e.currentTarget as HTMLSelectElement).value)}
            >
              <option value="">{t.pickExistingPh}</option>
              {#each availableResources as res (existingKey(res))}
                <option value={existingKey(res)}>
                  {res.attributes.name}
                  {' '}— {res.source === 'pmash' ? t.fromPmash : t.fromOpen}
                </option>
              {/each}
            </select>
          </label>
        {/if}
      {:else}
        <label class="field">
          <span>{t.nameph}</span>
          <input
            class="input"
            bind:value={r.name}
            placeholder={t.nameph}
            list={resourceTemplates.length > 0 ? 'compose-resource-name-options' : undefined}
            onchange={(e) =>
              hydrateFromTemplate(i, (e.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label class="field">
          <span>{t.desc} <small class="hint">{t.detailsSubtitle}</small></span>
          <textarea
            class="input textarea"
            rows="2"
            bind:value={r.notes}
            placeholder={t.desc}
          ></textarea>
        </label>
      {/if}

      <div class="grid">
        <label class="field">
          <span>{t.quantityPerUnit}</span>
          <input class="input" type="number" min="0" step="0.5" bind:value={r.quantityPerUnit} />
        </label>
        <label class="field">
          <span>{t.pricePerUnit}</span>
          <input class="input" type="number" min="0" step="1" bind:value={r.pricePerUnit} />
        </label>
        <label class="field">
          <span>{t.kindOf}</span>
          <select class="input" bind:value={r.kindOf}>
            <option value="good">{t.kindGood}</option>
            <option value="service">{t.kindService}</option>
            <option value="subscription">{t.kindSubscription}</option>
            <option value="other">{t.kindOther}</option>
          </select>
        </label>
      </div>

      {#if r.mode === 'createNew'}
        <label class="field">
          <span>{t.assignedTo}</span>
          <select class="input" bind:value={r.assignedMemberId}>
            <option value={null}>{t.chooseMember}</option>
            {#each projectMembers as m (m.id)}
              <option value={m.id}>{m.attributes.username}</option>
            {/each}
          </select>
        </label>

        <div class="badges">
          <span class="badge badge-info" title={t.onlyPartOfHelp}>
            🏷 {t.onlyPartOfTag}
          </span>
          {#if r.extraDetails}
            <span class="badge badge-success">{t.fullDetailsSet}</span>
          {/if}
        </div>

        <button
          class="details-btn"
          type="button"
          class:filled={!!r.extraDetails}
          onclick={() => (detailsOpenFor = i)}
        >
          {t.fullDetails}
        </button>

        {#if !r.assignedMemberId}
          <div class="warning">⚠ {t.unassignedWarning}</div>
        {/if}
      {:else if r.pmashId || r.openMashaabimId}
        <div class="info-line">👤 {memberLabel(r.assignedMemberId)} — {t.ownerFromExisting}</div>
      {/if}

      <div class="row-foot">
        <span class="tag" class:warn-tag={r.mode === 'createNew' && !r.assignedMemberId}>
          {#if r.assignedMemberId}
            👤 {memberLabel(r.assignedMemberId)}
          {:else}
            ⚡ {t.unassigned}
          {/if}
        </span>
        <span class="row-total">
          {t.rowTotal}:
          <strong>₪ {rowTotal(r).toLocaleString('en', { maximumFractionDigits: 2 })}</strong>
        </span>
      </div>
    </div>
  {/each}

  <button class="add" type="button" onclick={add}>{t.add}</button>

  {#if resourceTemplates.length > 0}
    <datalist id="compose-resource-name-options">
      {#each resourceTemplates as template (template.id)}
        <option value={template.attributes.name}></option>
      {/each}
    </datalist>
  {/if}
</div>

<ResourceDetailsModal
  open={detailsOpenFor !== null}
  initial={activeRowDetails}
  resourceName={activeRowName}
  onSave={saveDetails}
  onClose={() => (detailsOpenFor = null)}
/>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .empty {
    text-align: center;
    color: var(--tm, #b6acb1);
    font-size: 0.85rem;
    padding: 0.5rem 0;
    font-style: italic;
  }

  .flow-note {
    font-size: 0.8rem;
    padding: 6px 10px;
    border-radius: 6px;
    font-weight: 600;
  }
  .flow-multi {
    background: rgba(216, 166, 75, 0.1);
    border: 1px solid var(--gold, #d8a64b);
    color: var(--gold-l, #f1c47a);
  }
  .flow-single {
    background: rgba(74, 222, 128, 0.08);
    border: 1px solid #4ade80;
    color: #6ee7a0;
  }

  .row {
    background: var(--bg, #1f1c24);
    border: 1px solid var(--border, #3b3540);
    border-radius: 8px;
    padding: 0.5rem 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .row.warn {
    border-color: var(--pink-l, #ff5a99);
    box-shadow: 0 0 0 1px rgba(255, 90, 153, 0.2);
  }

  .row-head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .mode-seg {
    display: inline-flex;
    background: var(--bg-2, #251f2c);
    border-radius: 6px;
    border: 1px solid var(--border, #3b3540);
    overflow: hidden;
    flex: 1;
  }
  .mode-seg button {
    flex: 1;
    background: transparent;
    color: var(--tm, #b6acb1);
    border: none;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .mode-seg button.active {
    background: var(--gold, #d8a64b);
    color: #1f1c24;
  }

  .x {
    background: transparent;
    color: var(--tm, #b6acb1);
    border: 1px solid var(--border, #3b3540);
    border-radius: 6px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
  }
  .x:hover {
    color: var(--pink-l, #ff5a99);
    border-color: var(--pink-l, #ff5a99);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }
  @media (max-width: 460px) {
    .grid { grid-template-columns: 1fr 1fr; }
  }

  .field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .field > span {
    font-size: 0.78rem;
    color: var(--gold-l, #f1c47a);
    font-weight: 600;
  }
  .hint { color: var(--tm, #b6acb1); font-weight: 400; font-size: 0.7rem; }

  .input {
    background: var(--bg-2, #2a2630);
    color: var(--text, #f4ecd6);
    border: 1px solid var(--border, #3b3540);
    border-radius: 6px;
    padding: 5px 8px;
    width: 100%;
    box-sizing: border-box;
    font-size: 0.9rem;
  }
  .input:focus {
    outline: none;
    border-color: var(--gold, #d8a64b);
    box-shadow: 0 0 0 2px rgba(216, 166, 75, 0.25);
  }
  .textarea { resize: vertical; min-height: 50px; }

  .empty-inline {
    color: var(--tm, #b6acb1);
    font-style: italic;
    font-size: 0.85rem;
    padding: 4px 0;
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .badge {
    font-size: 0.72rem;
    padding: 2px 8px;
    border-radius: 99px;
    font-weight: 600;
  }
  .badge-info {
    background: rgba(216, 166, 75, 0.12);
    color: var(--gold-l, #f1c47a);
    border: 1px dashed var(--gold, #d8a64b);
  }
  .badge-success {
    background: rgba(74, 222, 128, 0.1);
    color: #6ee7a0;
    border: 1px solid #4ade80;
  }

  .details-btn {
    align-self: flex-start;
    background: transparent;
    color: var(--gold-l, #f1c47a);
    border: 1px dashed var(--gold, #d8a64b);
    border-radius: 6px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .details-btn:hover {
    background: rgba(216, 166, 75, 0.1);
  }
  .details-btn.filled {
    background: rgba(74, 222, 128, 0.08);
    color: #6ee7a0;
    border-color: #4ade80;
    border-style: solid;
  }

  .warning {
    font-size: 0.78rem;
    color: var(--pink-l, #ff5a99);
    background: rgba(255, 90, 153, 0.1);
    padding: 6px 8px;
    border-radius: 6px;
  }

  .info-line {
    font-size: 0.78rem;
    color: #6ee7a0;
    background: rgba(74, 222, 128, 0.06);
    padding: 4px 8px;
    border-radius: 6px;
  }

  .row-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.8rem;
    padding-top: 4px;
    border-top: 1px solid var(--border, #3b3540);
  }
  .tag {
    background: rgba(74, 222, 128, 0.1);
    color: #6ee7a0;
    border-radius: 6px;
    padding: 2px 8px;
    font-weight: 600;
  }
  .tag.warn-tag {
    background: rgba(255, 90, 153, 0.12);
    color: var(--pink-l, #ff5a99);
  }
  .row-total { color: var(--gold, #d8a64b); }

  .add {
    align-self: flex-start;
    background: transparent;
    color: var(--gold, #d8a64b);
    border: 1px dashed var(--gold, #d8a64b);
    border-radius: 6px;
    padding: 5px 12px;
    cursor: pointer;
    font-weight: 600;
  }
  .add:hover {
    background: rgba(216, 166, 75, 0.1);
  }
</style>
