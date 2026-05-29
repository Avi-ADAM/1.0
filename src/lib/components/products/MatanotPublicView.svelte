<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import RichText from '$lib/celim/ui/richText.svelte';

  type RecipeMissionRow = {
    id: string;
    attributes: {
      hoursPerUnit?: number;
      unitsPerProduct?: number;
      ratePerHour?: number;
      mode?: 'createNew' | 'consumeExisting';
      notes?: string | null;
      pendm?: { data?: { id: string; attributes: { name?: string; descrip?: string } } | null };
      mesimabetahalich?: { data?: { id: string; attributes: { name?: string; howmanyhoursalready?: number; hoursassinged?: number } } | null };
    };
  };

  type RecipeResourceRow = {
    id: string;
    attributes: {
      quantityPerUnit?: number;
      pricePerUnit?: number;
      kindOf?: string | null;
      mode?: 'createNew' | 'consumeExisting' | 'reuseSp';
      notes?: string | null;
      pmash?: { data?: { id: string; attributes: { name?: string } } | null };
      mashabetahalich?: { data?: { id: string; attributes: { name?: string; pricePerUnit?: number; kindOf?: string | null; descrip?: string } } | null };
    };
  };

  type Props = {
    matanot: {
      id: string;
      name?: string;
      desc?: string;
      price?: number;
      quant?: number;
      kindOf?: 'total' | 'monthly' | 'yearly' | 'unlimited';
      currency?: string | null;
      pricingMode?: 'fixed' | 'estimated' | 'quote';
      status_of_voting?: 'draft' | 'voting' | 'active' | 'archived';
      appruved?: boolean;
      estimatedPrice?: number;
      marginPct?: number;
      pic?: { data?: { attributes?: { url?: string } } | null };
      matanot_recipe_missions?: { data?: RecipeMissionRow[] } | null;
      matanot_recipe_resources?: { data?: RecipeResourceRow[] } | null;
      process?: { data?: { id: string; attributes?: { forums?: { data?: Array<{ id: string }> } | null } } | null };
    };
  };

  let { matanot }: Props = $props();

  const isComplex = $derived(matanot.pricingMode && matanot.pricingMode !== 'fixed');
  const showBom = $derived(isComplex);
  const missionRows = $derived(matanot.matanot_recipe_missions?.data ?? []);
  const resourceRows = $derived(matanot.matanot_recipe_resources?.data ?? []);

  const subtotalMissions = $derived(
    missionRows.reduce((s, m) => {
      const a = m.attributes;
      return (
        s + (a.hoursPerUnit ?? 0) * (a.unitsPerProduct ?? 1) * (a.ratePerHour ?? 0)
      );
    }, 0)
  );
  const subtotalResources = $derived(
    resourceRows.reduce((s, r) => {
      const a = r.attributes;
      return s + (a.quantityPerUnit ?? 0) * (a.pricePerUnit ?? 0);
    }, 0)
  );
  const bomSubtotal = $derived(subtotalMissions + subtotalResources);

  const t = $derived(
    $lang === 'he'
      ? {
          bomTitle: 'הרכב המוצר',
          missions: 'משימות',
          resources: 'משאבים',
          hoursPerUnit: 'שעות ליחידה',
          unitsPerProduct: 'יחידות',
          ratePerHour: '₪/שעה',
          quantity: 'כמות',
          pricePer: '₪/יחידה',
          subtotal: 'סך עלות BOM',
          margin: 'אחוז רווח',
          estimated: 'מחיר משוער',
          status: 'מצב',
          statusDraft: 'טיוטה',
          statusVoting: 'בהצבעה',
          statusActive: 'פתוח לרכישה',
          statusArchived: 'בארכיון',
          noBom: 'אין פריטים ב-BOM',
          openTag: 'מחפשים ספק'
        }
      : {
          bomTitle: 'Bill of materials',
          missions: 'Missions',
          resources: 'Resources',
          hoursPerUnit: 'hours / unit',
          unitsPerProduct: 'units',
          ratePerHour: '₪/h',
          quantity: 'qty',
          pricePer: '₪/unit',
          subtotal: 'BOM subtotal',
          margin: 'Margin',
          estimated: 'Estimated price',
          status: 'Status',
          statusDraft: 'Draft',
          statusVoting: 'In vote',
          statusActive: 'Open for sale',
          statusArchived: 'Archived',
          noBom: 'No BOM rows',
          openTag: 'Looking for provider'
        }
  );

  function statusLabel(s?: string) {
    if (s === 'draft') return t.statusDraft;
    if (s === 'voting') return t.statusVoting;
    if (s === 'active') return t.statusActive;
    if (s === 'archived') return t.statusArchived;
    return s ?? '';
  }
</script>

<div class="matanot-view" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
  {#if matanot.pic?.data?.attributes?.url}
    <img class="cover" src={matanot.pic.data.attributes.url} alt={matanot.name ?? ''} />
  {/if}

  <div class="head">
    <h1 class="title">{matanot.name}</h1>
    {#if matanot.status_of_voting}
      <span class="status status-{matanot.status_of_voting}">
        {statusLabel(matanot.status_of_voting)}
      </span>
    {/if}
  </div>

  {#if matanot.desc}
    <div class="desc">
      <RichText outpot={matanot.desc} editable={false} />
    </div>
  {/if}

  {#if showBom}
    <section class="bom">
      <h2>{t.bomTitle}</h2>

      <div class="bom-group">
        <h3>{t.missions}</h3>
        {#if missionRows.length === 0}
          <div class="empty">{t.noBom}</div>
        {:else}
          <table>
            <thead>
              <tr>
                <th></th>
                <th>{t.hoursPerUnit}</th>
                <th>{t.unitsPerProduct}</th>
                <th>{t.ratePerHour}</th>
              </tr>
            </thead>
            <tbody>
              {#each missionRows as row (row.id)}
                {@const a = row.attributes}
                {@const name =
                  a.mesimabetahalich?.data?.attributes?.name ??
                  a.pendm?.data?.attributes?.name ??
                  '—'}
                <tr>
                  <td>{name}</td>
                  <td>{a.hoursPerUnit ?? 0}</td>
                  <td>{a.unitsPerProduct ?? 1}</td>
                  <td>{a.ratePerHour ?? 0}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <div class="bom-group">
        <h3>{t.resources}</h3>
        {#if resourceRows.length === 0}
          <div class="empty">{t.noBom}</div>
        {:else}
          <table>
            <thead>
              <tr>
                <th></th>
                <th>{t.quantity}</th>
                <th>{t.pricePer}</th>
              </tr>
            </thead>
            <tbody>
              {#each resourceRows as row (row.id)}
                {@const a = row.attributes}
                {@const name =
                  a.mashabetahalich?.data?.attributes?.name ??
                  a.pmash?.data?.attributes?.name ??
                  '—'}
                <tr>
                  <td>{name}</td>
                  <td>{a.quantityPerUnit ?? 0}</td>
                  <td>{a.pricePerUnit ?? 0}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <div class="summary">
        <div class="row">
          <span>{t.subtotal}</span>
          <strong>₪ {bomSubtotal.toLocaleString('en', { maximumFractionDigits: 2 })}</strong>
        </div>
        {#if matanot.marginPct}
          <div class="row">
            <span>{t.margin}</span>
            <strong>{matanot.marginPct}%</strong>
          </div>
        {/if}
        <div class="row total">
          <span>{t.estimated}</span>
          <strong>
            ₪ {Number(matanot.estimatedPrice ?? 0).toLocaleString('en', { maximumFractionDigits: 2 })}
          </strong>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .matanot-view {
    --gold: var(--gold, #d8a64b);
    --gold-l: var(--gold-l, #f1c47a);
    --border: var(--border, #3b3540);
    --tm: var(--tm, #b6acb1);
    --bg-2: var(--bg-2, #251f2c);

    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    color: var(--text, #f4ecd6);
  }
  .cover {
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: 12px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .title {
    color: var(--gold);
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0;
  }
  .status {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 99px;
    border: 1px solid var(--border);
    background: var(--bg-2);
    color: var(--gold-l);
  }
  .status-active { color: #6fcf97; border-color: #6fcf97; }
  .status-voting { color: var(--gold-l); border-color: var(--gold); }
  .status-archived { color: var(--tm); }
  .desc :global(p) { margin: 0; }

  .bom {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .bom h2 {
    margin: 0;
    color: var(--gold);
    font-size: 1.05rem;
  }
  .bom-group h3 {
    margin: 0 0 4px 0;
    font-size: 0.9rem;
    color: var(--gold-l);
  }
  .bom-group table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  .bom-group th,
  .bom-group td {
    border-bottom: 1px solid var(--border);
    padding: 4px 6px;
    text-align: start;
  }
  .bom-group th { color: var(--tm); font-weight: 600; }
  .empty { color: var(--tm); font-size: 0.8rem; }

  .summary {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px dashed var(--gold);
    padding-top: 6px;
  }
  .summary .row {
    display: flex;
    justify-content: space-between;
  }
  .summary .total {
    font-size: 1.05rem;
    color: var(--gold);
  }
</style>
