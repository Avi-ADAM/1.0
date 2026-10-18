<script>
  import 'dayjs/locale/he.js';
  import dayjs from 'dayjs';
  import { Datepicker } from 'svelte-calendar';
  import { lang } from '$lib/stores/lang.js';
  import MultiSelect from 'svelte-multiselect';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import { toast } from 'svelte-sonner';
  import { executeAction } from '$lib/client/actionClient';
  import { shadowSignFromCookie } from '$lib/client/shadowSign';
  import { createSaleConsentSpec } from '$lib/consent/specs/createSale';
  import { t } from '$lib/translations';
  import Money from '$lib/components/money/Money.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} productId - The ID of the product being sold
   * @property {string} productName - The name of the product
   * @property {number} availableQuantity - Available quantity of the product
   * @property {number} price - Price per unit
   * @property {'monthly' | 'yearly' | 'total' | 'unlimited'} kindOf - Type of sale
   * @property {string} projectId - The ID of the project
   * @property {Array<{id: string, attributes: {username: string}}>} projectUsers - Users in the project
   * @property {number} [each] - Price per unit (bindable)
   * @property {boolean} [kindUlimit] - Whether unlimited kind is allowed
   * @property {() => number} [onStart] - Callback when sale operation starts, returns operation ID
   * @property {(payload: { id: any; in: any; un: any; matana: any }, operationId?: number) => void} [onDone] - Callback when sale is successfully added with quantity update
   * @property {() => void} [onDoners] - Callback when sale is successfully added without quantity update
   * @property {(error?: string, operationId?: number) => void} [onError] - Callback when an error occurs
   * @property {string} [defaultHolder] - Username preselected as the money-holder
   * @property {'classic' | 'shop'} [skin] - `shop`: the moach sales page's sheet (canvas
   *   "MobileReportSale", `$lib/styles/shop.css`). Same fields, same `createSale`.
   * @property {string | number | null} [meId] - The signed-in member, so the shop skin can
   *   say whether the report is a self-report or a claim on someone else's money
   */

  /** @type {Props} */
  let {
    productId,
    productName,
    availableQuantity,
    price,
    kindOf = 'monthly',
    projectId,
    projectUsers = [],
    each = $bindable(price || 0),
    kindUlimit = false,
    defaultHolder = '',
    skin = 'classic',
    meId = null,
    onStart,
    onDone,
    onDoners,
    onError
  } = $props();

  // The shop skin picks the sale date with a native input instead of the
  // calendar widget; empty = the calendar's own default (now).
  let saleDateLocal = $state('');
  let holderId = $derived(selected[0] != null ? String(find_user_id(selected)) : '');
  let holderIsMe = $derived(meId != null && holderId !== '' && holderId === String(meId));

  let store = $state();
  let selected = $state(defaultHolder ? [defaultHolder] : []);
  let total = $state(0);
  let hm = $state(1);
  let note = $state('');
  // PLAN_SALE_CUSTOMER_LINK: exact 1lev1 username/email of the customer.
  // Links customer↔sale through a Sheirut intermediary. On a regular sale the
  // money already moved ("שולם") so no customer confirmation is needed; on a
  // standing order the customer confirms their transfer every month.
  let customerIdentifier = $state('');
  let already = $state(false);
  let per = $state(false);
  let dates = $state(null);
  let datef = $state(null);
  // Open-ended monthly/yearly sale = a recurring engine (standing order).
  let isRecurring = $derived(
    (kindOf === 'monthly' || kindOf === 'yearly') && dates !== null && datef === null
  );
  let noSelectedE = $state(false);
  let datesE = $state(false);
  let currentOperationId = $state(null);

  function find_user_id(user_name_arr) {
    let id = 0;
    for (let i = 0; i < projectUsers.length; i++) {
      if (projectUsers[i].attributes.username === user_name_arr[0]) {
        id = projectUsers[i].id;
      }
    }
    return id;
  }

  let theme = {
    calendar: {
      width: '400px',
      maxWidth: '100vw',
      legend: {
        height: '45px',
      },
      shadow: '0px 10px 26px rgba(0, 0, 0, 0.25)',
      colors: {
        text: {
          primary: '#EEE8AA',
          highlight: '#CCFBF1',
        },
        background: {
          primary: '#333',
          highlight: '#FF0092',
          hover: '#222',
        },
        border: '#222',
      },
      font: {
        regular: '1.5em',
        large: '26em',
      },
      grid: {
        disabledOpacity: '.5',
        outsiderOpacity: '.7',
      },
    },
  };

  async function add() {
    if (selected[0] == null) {
      noSelectedE = true;
      toast.error($t('sales.noUserSelected'));
      return;
    }

    if (kindOf === 'monthly' || kindOf === 'yearly') {
      if (dates === null) {
        datesE = true;
        toast.warning($t('sales.noStartDate'));
        return;
      }
      datesE = false;
    }

    currentOperationId = onStart ? onStart() : null;
    already = true;

    try {
      const saleDate = dayjs(saleDateLocal || $store?.selected).toISOString();
      const userId = String(find_user_id(selected));

      const actionParams = {
        productId: String(productId),
        projectId: String(projectId),
        userId,
        total,
        quantity: hm,
        saleDate,
        availableQuantity,
        kindOf,
        note: note.trim() || undefined
      };

      if (kindOf === 'monthly' || kindOf === 'yearly') {
        actionParams.startDate = new Date(dates).toISOString();
        if (datef !== null) actionParams.finishDate = new Date(datef).toISOString();
      }

      if (customerIdentifier.trim())
        actionParams.customerIdentifier = customerIdentifier.trim();

      const result = await executeAction('createSale', actionParams);

      if (!result.success) {
        throw new Error(result.error?.message ?? 'Sale failed');
      }

      const holderStatus = result.data?.holderStatus;
      const decisionId = result.data?.decisionId;

      // Phase 1 shadow signing — best-effort, non-blocking. The signed
      // sale.record event mirrors the reporter's attestation of the full claim.
      shadowSignFromCookie(createSaleConsentSpec, {
        ...actionParams,
        saleId: result.data?.saleId,
        decisionId,
        holderStatus
      });

      // Money-held-by-someone-else → the report is a claim awaiting consent.
      if (holderStatus === 'open') {
        const holderName = selected?.[0] ?? '';
        toast.info($t('sales.claimSent', { holderName }));
      }

      if (hm > 0) {
        if (result.data?.newQuantity !== undefined) {
          onDone?.(
            { id: result.data.saleId, in: result.data.saleIn, un: result.data.newQuantity, matana: result.data.matana },
            currentOperationId
          );
        } else {
          onDoners?.();
        }
      } else {
        onDoners?.();
      }
    } catch (e) {
      console.log('Sale error:', e);
      const errorMessage = e.message || $t('sales.saleError');
      onError?.(errorMessage, currentOperationId);
    } finally {
      currentOperationId = null;
      already = false;
    }
  }

  // Localization strings

  $effect(() => {
    dayjs.locale($lang);
  });

  $effect(() => {
    if (kindOf == 'monthly' || kindOf == 'yearly') {
      if (dates !== null && datef !== null) {
        per = false;
        total = 0;
        let a = new Date(dates);
        let b = new Date(datef);
        
        // חישוב מספר הימים בפועל בין התאריכים
        const days = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
        
        if (kindOf == 'monthly') {
          // חישוב כמות חודשים כחלק עשרוני (חלוקה ב-30 ימים)
          total = (days / 30) * each * hm;
        } else if (kindOf == 'yearly') {
          // חישוב כמות שנים כחלק עשרוני (חלוקה ב-365 ימים)
          total = (days / 365) * each * hm;
        }
      } else {
        total = hm * each;
        per = true;
      }
    } else {
      per = false;
      total = hm * each;
    }
  });
  const initialOf = (name) => (String(name || '?').trim().charAt(0) || '?').toUpperCase();
  let unitsMax = $derived(availableQuantity === -1 || availableQuantity == null ? Infinity : Number(availableQuantity));
</script>

{#if skin === 'shop'}
<div class="rs">
  {#if kindOf == 'monthly' || kindOf == 'yearly'}
    <div class="rs-grid2">
      <label class="sh-field">
        {$t('sales.startDate')}
        <input
          class="sh-input"
          type="datetime-local"
          value={dates ?? ''}
          aria-invalid={datesE}
          oninput={(e) => (dates = e.currentTarget.value || null)}
        />
      </label>
      <label class="sh-field">
        {$t('sales.endDate')}
        <input
          class="sh-input"
          type="datetime-local"
          value={datef ?? ''}
          min={dates ?? undefined}
          oninput={(e) => (datef = e.currentTarget.value || null)}
        />
      </label>
      {#if datesE}<p class="rs-err rs-span">{$t('sales.noStartDate')}</p>{/if}
      {#if datef === null}<p class="rs-hint rs-span">{$t('sales.noEndDate')}</p>{/if}
    </div>
  {/if}

  <div class="rs-grid2">
    {#if kindOf !== 'total'}
      <div class="sh-field">
        <span>{$t('sales.howManyUnits')}{per ? ` (${kindOf === 'monthly' ? $t('sales.perMonth') : $t('sales.perYear')})` : ''}</span>
        <div class="rs-step">
          <button type="button" aria-label={$t('shop.sp.rs.more')} disabled={hm >= unitsMax} onclick={() => (hm = Math.min(unitsMax, Number(hm || 0) + 1))}>+</button>
          <input
            type="number"
            inputmode="numeric"
            min="0"
            max={Number.isFinite(unitsMax) ? unitsMax : undefined}
            aria-label={$t('sales.howManyUnits')}
            bind:value={hm}
          />
          <button type="button" aria-label={$t('shop.sp.rs.less')} disabled={hm <= 0} onclick={() => (hm = Math.max(0, Number(hm || 0) - 1))}>−</button>
        </div>
      </div>
    {/if}
    <label class="sh-field">
      {$t('sales.howManyPerUnit')}
      <input class="sh-input rs-num" type="number" inputmode="decimal" min="0" step="any" bind:value={each} />
    </label>
  </div>

  <div class="rs-total">
    <span>{$t('sales.total')}{per ? ` ${kindOf === 'monthly' ? $t('sales.perMonth') : $t('sales.perYear')}` : ''}</span>
    <strong><Money amount={total} /></strong>
  </div>

  <fieldset class="rs-fs">
    <legend class="sh-section-label">{$t('sales.withWhomMoney')}</legend>
    <div class="rs-holders" role="radiogroup" aria-label={$t('sales.withWhomMoney')}>
      {#each projectUsers as u (u.id)}
        <button
          type="button"
          role="radio"
          class="rs-radio"
          aria-checked={selected[0] === u.attributes.username}
          onclick={() => {
            selected = [u.attributes.username];
            noSelectedE = false;
          }}
        >
          <span class="rs-av" aria-hidden="true">{initialOf(u.attributes.username)}</span>
          <span class="rs-radio-name">{meId != null && String(u.id) === String(meId) ? $t('shop.sp.rs.me') : u.attributes.username}</span>
        </button>
      {/each}
    </div>
    {#if noSelectedE}<p class="rs-err">{$t('sales.noUserSelected')}</p>{/if}
    {#if selected[0] != null}
      <p class="rs-holder-note" class:rs-self={holderIsMe}>
        {holderIsMe ? $t('shop.sp.rs.holderSelf') : $t('shop.sp.rs.holderOther', { name: selected[0] })}
      </p>
    {/if}
  </fieldset>

  <details class="rs-details">
    <summary>
      {$t('sales.changeSaleDate')} · {saleDateLocal && dayjs(saleDateLocal).isValid()
        ? dayjs(saleDateLocal).format('D.M.YY HH:mm')
        : $t('shop.sp.rs.today')}
    </summary>
    <input class="sh-input" type="datetime-local" aria-label={$t('sales.changeSaleDate')} bind:value={saleDateLocal} />
  </details>

  <!-- Customer (PLAN_SALE_CUSTOMER_LINK): linked through a Sheirut so the
       purchase shows on the customer's deals page. -->
  <details class="rs-details" open={!!customerIdentifier}>
    <summary>{isRecurring ? $t('shop.sp.rs.customer') : $t('shop.sp.rs.customerPaid')}</summary>
    <label class="sh-field">
      {$t('shop.sp.rs.customerLabel')}
      <input class="sh-input" type="text" autocomplete="off" placeholder={$t('shop.sp.rs.customerPh')} bind:value={customerIdentifier} />
    </label>
    <p class="rs-hint">{isRecurring ? $t('shop.sp.rs.customerHintRecurring') : $t('shop.sp.rs.customerHintPaid')}</p>
  </details>

  <label class="sh-field">
    {$t('sales.noteOptional')}
    <textarea class="sh-input" rows="2" maxlength="500" placeholder={$t('sales.notePlaceholder')} bind:value={note}></textarea>
    {#if note.length > 0}<span class="rs-hint">{note.length}/500</span>{/if}
  </label>

  <div class="rs-foot">
    <button type="button" class="sh-btn sh-btn-primary sh-btn-lg rs-submit" disabled={already} onclick={add}>
      {#if already}<Spinner size="sm" />{/if}
      {$t('sales.addSale')}
    </button>
  </div>
</div>
{:else}
<div class="flex flex-col align-middle justify-center gap-x-2">
  {#if kindOf !== 'total'}
    <NumberInput
      bind:value={hm}
      topLebel={$t('sales.howManyUnits')}
      barbi={true}
      noNegative={true}
      noMoreThen={availableQuantity === -1 ? undefined : availableQuantity}
    />
  {/if}
  <NumberInput bind:value={each} topLebel={$t('sales.howManyPerUnit')} barbi={true} noNegative={true} />

  {#if kindOf == 'monthly' || kindOf == 'yearly'}
    <small class="text-barbi text-center">{$t('sales.startDate')}</small>
    <input
      class="bg-gold hover:bg-mtork border-2 border-barbi rounded text-barbi"
      type="datetime-local"
      placeholder={$t('sales.startDate')}
      bind:value={dates}
    />
    {#if datesE}
      <small class="text-barbi text-cente"><mark>{$t('sales.noStartDate')}</mark></small>
    {/if}
    <small class="text-barbi text-center">{$t('sales.endDate')}</small>
    <input
      class="bg-gold hover:bg-mtork border-2 border-barbi rounded text-barbi"
      type="datetime-local"
      placeholder={$t('sales.endDate')}
      bind:value={datef}
      min={dates}
    />
    {#if datef === null}
      <small class="text-barbi text-center "><mark>{$t('sales.noEndDate')}</mark></small>
    {/if}
  {/if}

  <!-- Customer (PLAN_SALE_CUSTOMER_LINK): linked through a Sheirut so the
       purchase shows on the customer's deals page. On a regular sale the money
       already moved (paid — no customer confirmation); on a standing order the
       customer confirms the transfer every month. -->
  <small class="text-barbi text-center mt-2">
    {$lang === 'en'
      ? `Customer (optional${isRecurring ? '' : ' · paid'}) - exact 1lev1 username or email`
      : `לקוח (אופציונלי${isRecurring ? '' : ' · שולם'}) - שם משתמש או אימייל מדויק ב-1lev1`}
  </small>
  <input
    class="bg-gold hover:bg-mtork border-2 border-barbi rounded text-barbi placeholder-barbi/70 p-1"
    type="text"
    placeholder={$lang === 'en' ? 'username or email' : 'שם משתמש או אימייל'}
    bind:value={customerIdentifier}
  />
  <small class="text-barbi/70 text-center text-xs">
    {#if isRecurring}
      {$lang === 'en'
        ? 'A standing order opens a monthly report card; a named customer also confirms their transfer each month.'
        : 'מכירה מתחדשת פותחת כרטיס דיווח חודשי; לקוח מזוהה גם יעדכן כל חודש כמה העביר.'}
    {:else}
      {$lang === 'en'
        ? 'The sale is recorded as already paid - the purchase appears on the customer\'s deals page, no confirmation needed.'
        : 'המכירה נרשמת כשולמה - הרכישה תופיע בעמוד העסקאות של הלקוח, ללא צורך באשרור.'}
    {/if}
  </small>

  <div class="grid justify-center align-center ">
    <h3 class="text-center text-barbi">{$t('sales.changeSaleDate')}</h3>
    <Datepicker
      bind:store
      {theme}
      format={$lang == 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
    />
  </div>

  <div>
    <MultiSelect
      outerDivClass="!bg-gold !text-barbi"
      inputClass="!bg-gold !text-barbi"
      liSelectedClass="!bg-barbi !text-gold"
      maxSelect={1}
      bind:selected
      placeholder={$t('sales.withWhomMoney')}
      options={projectUsers.map((c) => c.attributes.username)}
    />
    {#if noSelectedE}
      <small class="text-barbi text-center"><mark>{$t('sales.noUserSelected')}</mark></small>
    {/if}
  </div>

  <!-- Note input -->
  <div class="mt-4">
    <small class="text-barbi text-center block mb-2">{$t('sales.noteOptional')}</small>
    <textarea
      class="w-full bg-gold hover:bg-mtork border-2 border-barbi rounded p-2 text-barbi placeholder-barbi/70 resize-none"
      rows="3"
      placeholder={$t('sales.notePlaceholder')}
      bind:value={note}
      maxlength="500"
    ></textarea>
    {#if note.length > 0}
      <small class="text-barbi/70 text-xs">{note.length}/500</small>
    {/if}
  </div>
  <small class="text-barbi text-center"
    >{$t('sales.total')}
    {#if per == true}
      {kindOf === 'monthly' ? $t('sales.perMonth') : $t('sales.perYear')}
    {/if}
  </small>
  <p class="text-center text-barbi"><Money amount={total} /></p>

  {#if already == false}
    <div class="flex items-center justify-center">
      <button
        style="margin: 5px auto;"
        class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
        onclick={add}
      >
        {$t('sales.addSale')}
      </button>
    </div>
  {/if}
</div>
{/if}

<style>
  .rs {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .rs-grid2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .rs-span {
    grid-column: 1 / -1;
  }
  .rs-err {
    font-size: 12px;
    color: var(--sh-accent-ink);
    font-weight: 700;
  }
  .rs-hint {
    font-size: 12px;
    color: var(--sh-muted);
  }
  .rs-num {
    font-size: 17px;
  }
  .rs-step {
    display: flex;
    align-items: center;
    min-height: 48px;
    border-radius: var(--sh-radius-sm);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
  }
  .rs-step button {
    width: 44px;
    height: 46px;
    border: 0;
    background: transparent;
    color: var(--sh-gold);
    font-size: 22px;
    flex-shrink: 0;
  }
  .rs-step input {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--sh-ink);
    text-align: center;
    font-size: 17px;
    font-weight: 700;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .rs-step input::-webkit-inner-spin-button,
  .rs-step input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .rs-step:focus-within {
    border-color: var(--sh-gold);
  }
  .rs-total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-radius: var(--sh-radius);
    border: 1px solid var(--sh-gold-line);
    background: color-mix(in srgb, var(--sh-gold) 8%, var(--sh-card));
    font-size: 14px;
  }
  .rs-total strong {
    font-family: var(--sh-display);
    font-size: 28px;
    color: var(--sh-gold);
  }
  .rs-fs {
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rs-fs legend {
    padding: 0 0 8px;
  }
  .rs-holders {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
  .rs-radio {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 12px;
    border-radius: var(--sh-radius-sm);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
    color: var(--sh-ink);
    font-size: 14px;
    text-align: start;
    min-width: 0;
  }
  .rs-radio[aria-checked='true'] {
    border-color: var(--sh-gold);
    background: color-mix(in srgb, var(--sh-gold) 10%, var(--sh-card));
    font-weight: 700;
  }
  .rs-radio-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rs-av {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid var(--sh-gold);
    color: var(--sh-gold);
    background: var(--sh-card);
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .rs-holder-note {
    padding: 10px 12px;
    border-radius: var(--sh-radius-sm);
    font-size: 12px;
    line-height: 1.5;
    background: var(--sh-accent-tint);
    color: var(--sh-ink);
  }
  .rs-holder-note.rs-self {
    background: var(--sh-ok-tint);
  }
  .rs-details {
    border-radius: var(--sh-radius-sm);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
    padding: 0 12px;
  }
  .rs-details > summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-size: 14px;
    cursor: pointer;
  }
  .rs-details[open] {
    padding-bottom: 12px;
  }
  .rs-details[open] > :not(summary) + :not(summary) {
    margin-top: 8px;
  }
  .rs-foot {
    position: sticky;
    bottom: 0;
    margin: 0 -18px;
    padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--surface, #fff) 92%, transparent);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--sh-line);
  }
  .rs-submit {
    width: 100%;
  }
</style>