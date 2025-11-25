<script>
  import 'dayjs/locale/he.js';
  import dayjs from 'dayjs';
  import { Datepicker } from 'svelte-calendar';
  import { lang } from '$lib/stores/lang.js';
  import MultiSelect from 'svelte-multiselect';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import { toast } from 'svelte-sonner';
  import { SendTo } from '$lib/send/sendTo.svelte';

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
    onStart,
    onDone,
    onDoners,
    onError
  } = $props();

  let store = $state();
  let selected = $state([]);
  let total = $state(0);
  let hm = $state(1);
  let note = $state('');
  let placeholder = {
    he: 'אצל מי הכסף',
    en: 'With whom is the money'
  };
  let already = $state(false);
  let per = $state(false);
  let dates = $state(null);
  let datef = $state(null);
  let noSelectedE = $state(false);
  let datesE = $state(false);
  let currentOperationId = $state(null);

  const baseUrl = import.meta.env.VITE_URL;
  let linkg = baseUrl + '/graphql';

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
    
    // Start the sale operation and get operation ID
    currentOperationId = onStart ? onStart() : null;
    already = true;

    let quanter = ``;
    if (hm > 0 && availableQuantity !== -1) {
      const quantnew = availableQuantity - hm;
      quanter = `updateMatanot( id: ${productId}
      data:  {quant: ${quantnew} } ){
        data {id attributes{ quant}}
      }`;
    }

    let d = new Date();
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    
    const token = cookieValue;
    const bearer1 = 'bearer' + ' ' + token;

    try {
      const sdate = new Date(dates) || null;
      const fdate = new Date(datef) || null;

      let saleDate = dayjs($store?.selected);
      let saleData = {
        project: `${projectId}`,
        matanot: `${productId}`,
        users_permissions_user: `${find_user_id(selected)}`,
        in: total,
        unit: hm,
        date: saleDate.toISOString(),
        publishedAt: d.toISOString(),
      };

      // Add note if provided
      if (note.trim()) {
        saleData.note = note.trim();
      }

      if (kindOf === 'monthly' || kindOf === 'yearly') {
        if (dates !== null) {
          datesE = false;
          saleData.startDate = sdate.toISOString();
        } else {
          datesE = true;
          toast.warning(datesEmessage[$lang]);
          return;
        }
        if (datef !== null) {
          saleData.finishDate = fdate.toISOString();
        }
      }

      const response = await fetch(linkg, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation 
                        { createSale(
      data: ${JSON.stringify(saleData).replace(/"([^(")"]+)":/g, '$1:')}
    ) {data{ id attributes{ in date matanot {data{id attributes{ name }}} users_permissions_user {data{ id attributes{ username}}}}}}
  ${quanter}
}`,
        }),
      });

      const miDatan = await response.json();

      if (hm > 0) {
        // יצירת monter רק אם אין תאריך סיום מוגדר (מכירה מתמשכת)
        if ((kindOf === 'monthly' || kindOf === 'yearly') && datef === null) {
          let chiluzh = miDatan.data.createSale.data.id;
          let monti = `mutation{
            createMonter(
              data:{
                sale: "${chiluzh}",
                ani: "sale",
                start: "${sdate.toISOString()}"
              }
            ){data{id}}
            }`;
          await SendTo(monti)
            .then(() => console.log('Ongoing monthly sale created'))
            .catch(() => console.log('Ongoing monthly sale creation error'));
        }
        
        // בדיקה אם יש עדכון כמות לפני הגישה לנתונים
        const saleResult = {
          id: miDatan.data.createSale.data.id,
          in: miDatan.data.createSale.data.attributes.in,
          un: undefined, // Will be set if quantity was updated
          matana: miDatan.data.createSale.data,
        };
        
        // הוספת נתוני עדכון הכמות רק אם הם קיימים (לא unlimited)
        if (miDatan.data.updateMatanot) {
          saleResult.id = miDatan.data.updateMatanot.data.id;
          saleResult.un = miDatan.data.updateMatanot.data.attributes.quant;
          onDone?.(saleResult, currentOperationId);
        } else {
          // במקרה של unlimited, אין עדכון כמות אבל המכירה הצליחה
          onDoners?.();
        }
      } else {
        onDoners?.();
      }
    } catch (e) {
      console.log('Sale error:', e);
      const errorMessage = e.message || ($lang === 'he' ? 'שגיאה בביצוע המכירה' : 'Error processing sale');
      onError?.(errorMessage, currentOperationId);
    } finally {
      // Reset the operation state
      currentOperationId = null;
      already = false;
    }
  }

  // Localization strings
  const change = { he: 'שינוי תאריך מכירה', en: 'change sale date' };
  const quantT = { he: 'כמה יחידות?', en: 'How many units?' };
  const forEachT = { he: 'כמה ליחידה?', en: 'How many per unit?' };
  const perMonth = { he: 'לחודש', en: 'per month' };
  const perYear = { he: 'לשנה', en: 'per year' };
  const datesEmessage = { he: 'אין תאריך התחלה', en: 'No start date' };
  const noFinnish = {
    he: 'אין תאריך סיום, ניתן להשאיר ירק אם רוצים מכירה מתמשכת עד אשר תבוטל באופן יזום',
    en: 'No finish date is provided, it is possible to leave it blank if you want a perpetual sale until canceled'
  };
  const noSelected = { he: ' שדה אצל מי הכסף נשאר ריק ', en: 'No user selected' };
  const start = { he: 'תאריך התחלה', en: 'Start Date' };
  const end = { he: 'תאריך סיום', en: 'End Date' };
  const addL = { he: 'הוספת מכירה', en: 'Add Sale' };
  const totalT = { he: 'סה"כ', en: 'Total' };
  const noteT = { he: 'הערה (אופציונלי)', en: 'Note (optional)' };
  const notePlaceholder = { he: 'הוספת הערה למכירה...', en: 'Add a note to the sale...' };

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
        if (kindOf == 'monthly') {
          total =
            ((b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())) *
            each *
            hm;
        } else if (kindOf == 'yearly') {
          total = (b.getFullYear() - a.getFullYear()) * each * hm;
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