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
  import tr from '$lib/translations/tr.json';

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
    onStart,
    onDone,
    onDoners,
    onError
  } = $props();

  let store = $state();
  let selected = $state(defaultHolder ? [defaultHolder] : []);
  let total = $state(0);
  let hm = $state(1);
  let note = $state('');
  let placeholder = tr.sales.withWhomMoney;
  let already = $state(false);
  let per = $state(false);
  let dates = $state(null);
  let datef = $state(null);
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
      toast.error(noSelected[$lang]);
      return;
    }

    if (kindOf === 'monthly' || kindOf === 'yearly') {
      if (dates === null) {
        datesE = true;
        toast.warning(datesEmessage[$lang]);
        return;
      }
      datesE = false;
    }

    currentOperationId = onStart ? onStart() : null;
    already = true;

    try {
      const saleDate = dayjs($store?.selected).toISOString();
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
        toast.info(
          $lang === 'en'
            ? `Report sent — awaiting ${holderName}'s consent. It will auto-approve after the rikma's response time if there is no reply.`
            : `הדיווח נשלח — ממתין להסכמת ${holderName}. יאושר אוטומטית בתום זמן התגובה של הריקמה אם לא תגיע תגובה.`
        );
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
      const errorMessage = e.message || tr.sales.saleError[$lang];
      onError?.(errorMessage, currentOperationId);
    } finally {
      currentOperationId = null;
      already = false;
    }
  }

  // Localization strings
  const change = tr.sales.changeSaleDate;
  const quantT = tr.sales.howManyUnits;
  const forEachT = tr.sales.howManyPerUnit;
  const perMonth = tr.sales.perMonth;
  const perYear = tr.sales.perYear;
  const datesEmessage = tr.sales.noStartDate;
  const noFinnish = tr.sales.noEndDate;
  const noSelected = tr.sales.noUserSelected;
  const start = tr.sales.startDate;
  const end = tr.sales.endDate;
  const addL = tr.sales.addSale;
  const totalT = tr.sales.total;
  const noteT = tr.sales.noteOptional;
  const notePlaceholder = tr.sales.notePlaceholder;

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
</script>

<div class="flex flex-col align-middle justify-center gap-x-2">
  {#if kindOf !== 'total'}
    <NumberInput
      bind:value={hm}
      topLebel={quantT[$lang]}
      barbi={true}
      noNegative={true}
      noMoreThen={availableQuantity === -1 ? undefined : availableQuantity}
    />
  {/if}
  <NumberInput bind:value={each} topLebel={forEachT[$lang]} barbi={true} noNegative={true} />

  {#if kindOf == 'monthly' || kindOf == 'yearly'}
    <small class="text-barbi text-center">{start[$lang]}</small>
    <input
      class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
      type="datetime-local"
      placeholder={start[$lang]}
      bind:value={dates}
    />
    {#if datesE}
      <small class="text-barbi text-cente"><mark>{datesEmessage[$lang]}</mark></small>
    {/if}
    <small class="text-barbi text-center">{end[$lang]}</small>
    <input
      class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
      type="datetime-local"
      placeholder={end[$lang]}
      bind:value={datef}
      min={dates}
    />
    {#if datef === null}
      <small class="text-barbi text-center "><mark>{noFinnish[$lang]}</mark></small>
    {/if}
  {/if}

  <div class="grid justify-center align-center ">
    <h3 class="text-center text-barbi">{change[$lang]}</h3>
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
      placeholder={placeholder[$lang]}
      options={projectUsers.map((c) => c.attributes.username)}
    />
    {#if noSelectedE}
      <small class="text-barbi text-center"><mark>{noSelected[$lang]}</mark></small>
    {/if}
  </div>

  <!-- Note input -->
  <div class="mt-4">
    <small class="text-barbi text-center block mb-2">{noteT[$lang]}</small>
    <textarea
      class="w-full bg-gold hover:bg-mtork border-2 border-barbi rounded p-2 text-barbi placeholder-barbi/70 resize-none"
      rows="3"
      placeholder={notePlaceholder[$lang]}
      bind:value={note}
      maxlength="500"
    ></textarea>
    {#if note.length > 0}
      <small class="text-barbi/70 text-xs">{note.length}/500</small>
    {/if}
  </div>
  <small class="text-barbi text-center"
    >{totalT[$lang]}
    {#if per == true}
      {kindOf === 'monthly' ? perMonth[$lang] : perYear[$lang]}
    {/if}
  </small>
  <p class="text-center text-barbi">{total}</p>

  {#if already == false}
    <div class="flex items-center justify-center">
      <button
        style="margin: 5px auto;"
        class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
        onclick={add}
      >
        {addL[$lang]}
      </button>
    </div>
  {/if}
</div>