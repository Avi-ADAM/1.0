<script>
  //טבלת מתנות כפתור מכירה מקפיץ תפריט של איפה הכסף יושב
  import Col from './column/main.svelte';
  import New from './newmatana.svelte';
  import { SaleComponent } from '$lib/components/sales';
  import dayjs from 'dayjs';
  import { lang } from '$lib/stores/lang.js';
  import { idPr } from '$lib/stores/idPr.js';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import Halu from './whowhat.svelte';
  import Cir from './graph/circle.svelte';
  let isOpen = $state(false);
  let a = $state(0);
  import { RingLoader } from 'svelte-loading-spinners';
  import Close from '$lib/celim/close.svelte';
  import ShareButtons from '$lib/components/share/shareButtons/index.svelte';
  
  /** @type {Record<string, number>} */
  let fermatana = $state({});
  
  /** @type {Record<string, Record<string, number>>} */
  let ferdate = $state({});
  
  /** @type {Array<{key: string, value: number}>} */
  let arr = $state([]);
  
  /** @type {Array<Record<string, string | number>>} */
  let arrt = $state([]);
  
  /** @type {string | undefined} */
  let kindOf = $state();
  
  let kindUlimit = $state(false);
  
  /**
   * @typedef {Object} MatanaAttributes
   * @property {string} name - Gift name
   * @property {number} price - Gift price
   * @property {number} quant - Available quantity (-1 for unlimited)
   * @property {string} kindOf - Type: 'total', 'monthly', 'yearly', or 'unlimited'
   */
  
  /**
   * @typedef {Object} Matana
   * @property {string} id - Gift ID
   * @property {Object} attributes
   * @property {string} attributes.name
   * @property {number} attributes.price
   * @property {number} attributes.quant
   * @property {string} attributes.kindOf
   */
  
  /**
   * @typedef {Object} SaleAttributes
   * @property {number} in - Sale amount
   * @property {string} date - Sale date
   * @property {boolean} [splited] - Whether the sale has been split
   * @property {string} [note] - Optional note about the sale
   * @property {Object} matanot - Related gift
   * @property {Object} matanot.data
   * @property {MatanaAttributes} matanot.data.attributes
   * @property {Object} users_permissions_user - User who made the sale
   * @property {Object} users_permissions_user.data
   * @property {string} users_permissions_user.data.id
   * @property {Object} users_permissions_user.data.attributes
   * @property {string} users_permissions_user.data.attributes.username
   */
  
  /**
   * @typedef {Object} Sale
   * @property {string} id - Sale ID
   * @property {SaleAttributes} attributes
   */
  
  /**
   * @typedef {Object} ProjectUser
   * @property {string} id - User ID
   * @property {Object} attributes
   * @property {string} attributes.username
   * @property {Object} attributes.profilePic
   * @property {Object | null} attributes.profilePic.data
   * @property {Object} [attributes.profilePic.data.attributes]
   * @property {string} [attributes.profilePic.data.attributes.url]
   */
  
  let {
    /** @type {Array<any>} */
    fmiData = [],
    /** @type {Array<any>} */
    rikmashes = [],
    /** @type {string} */
    projectId,
    /** @type {Array<any>} */
    trili,
    /** @type {Array<Matana>} */
    bmiData = $bindable([]),
    /** @type {Array<Sale>} */
    salee = $bindable([]),
    /** @type {Array<ProjectUser>} */
    projectUsers = [],
    /** @type {any} */
    restime
  } = $props();
  let quant = $state(),
    each = $state(),
    maid = $state();
  function sell(id, v, z, isto) {
    maid = id;
    each = v;
    quant = z;
    kindOf = isto;
    if (isto == 'unlimited') {
      console.log('unlimited', isto);
      kindUlimit = true;
    } else {
      kindUlimit = false;
    }
    isOpen = true;
    a = 0;
  }
  function addnew() {
    isOpen = true;
    a = 1;
  }
  const closer = () => {
    isOpen = false;
    a = 0;
  };
  let hal = $state(false);
  const sale = (event) => {
    const id = event.id;
    const un = event.un;
    let oldob = bmiData;
    const x = oldob.map((c) => c.id);
    const indexy = x.indexOf(id);
    
    // עדכון כמות רק אם יש un (לא unlimited) והאינדקס נמצא
    if (un !== undefined && indexy !== -1) {
      oldob[indexy].quant = un;
      bmiData = oldob;
    }
    
    isOpen = false;
    a = 0;
    salee.push(event.matana);
  };
  
  function saleUnlimited() {
    // עבור מוצרים unlimited - סגירת הדיאלוג בלבד
    // המכירה כבר נוצרה בשרת, אין צורך לעדכן כמות
    isOpen = false;
    a = 0;
  };
  
  function done(event) {
    isOpen = false;
    a = 0;
    bmiData.push(event.matana);
    bmiData = bmiData;
  }
  function ask() {
    hal = true;
    //ליצור מטבע אישור של חלוקה ליצור טופס של פרטי חלוקה כמה אחוז לחלק וכמה להעמיד להוצאות
  }
  let allin = $state(0);
  let totalSales = $state(0);
  function getSrc(id) {
    let src;
    for (let i = 0; i < projectUsers.length; i++) {
      if (projectUsers[i].id == id) {
        if (projectUsers[i].attributes.profilePic.data != null) {
          src = projectUsers[i].attributes.profilePic.data.attributes.url;
        } else {
          src =
            'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
        }
        return src;
      }
    }
    return 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
  }
  let arrc = [
    { year: 2019, bananas: 3840, cherries: 1920, dates: 960 },
    { year: 2020, bananas: 380, cherries: 920, dates: 1960 }
  ];
  const om = { he: 'רק רגע בבקשה', en: 'one moment please' };
  const cencel = { he: 'ביטול', en: 'cencel' };
  const errmsg = { he: ' אירעה שגיאה', en: 'error' };
  const trya = { he: 'לנסות שוב', en: 'try again' };
  const erhe = { he: 'הכנסות ממתינות לחלוקה', en: 'awited spliting earnings' };
  const our = { he: 'המתנות שלנו', en: "our gift's" };
  const nm = { he: 'שם', en: 'name' };
  const pric = { he: 'מחיר', en: 'price' };
  const quanti = { he: 'כמות מצויה', en: 'available quantity' };
  const kinde = { he: 'סוג', en: 'kind' };
  const py = { he: 'ליחידה', en: 'per unit' };
  const pm = { he: 'חודשי', en: 'monthly' };
  const pye = { he: 'שנתי', en: 'yearly' };
  const unl = { he: 'ללא הגבלה', en: 'unlimited' };
  const res = { he: 'דיווח על מכירה', en: 'report sale' };
  const cr = { he: ' יצירת מתנה חדשה', en: 'create new gift' };
  const gn = { he: 'שם המתנה', en: 'gift name' };
  const qu = { he: 'סכום', en: 'amount' };
  const whoo = { he: 'הכסף ממתין אצל: ', en: 'who guard the money' };
  const noteLabel = { he: 'הערה:', en: 'Note:' };
  const tot = { he: 'סך הכל:', en: 'total:' };
  const req = { he: 'בקשת חלוקה', en: 'request money spliting' };
  const see = { he: 'צפיה בהצעת החלוקה', en: 'see existed sppliting offer' };
  const sbp = { he: 'התפלגות המכירות לפי מוצר', en: 'sales by product' };
  const sbd = { he: 'התפלגות המכירות לפי תאריך', en: 'sales by date' };
  const awaitingSplit = { he: '(ממתינות לחלוקה)', en: '(awaiting split)' };
  $effect(() => {
    // Show all sales in graphs
    fermatana = salee.reduce((acc, sale) => {
      const matanaName = sale.attributes.matanot.data.attributes.name;
      const saleIn = sale.attributes.in;
      acc[matanaName] = (acc[matanaName] || 0) + saleIn;
      return acc;
    }, {});
  });
  $effect(() => {
    // Show all sales in graphs
    const newFerdate = {};
    for (const sale of salee) {
      const dateKey = dayjs(sale.attributes.date).format('YYYY-MM-DD');
      const matanaName = sale.attributes.matanot.data.attributes.name;
      const saleIn = sale.attributes.in;

      if (!newFerdate[dateKey]) {
        newFerdate[dateKey] = {};
      }

      if (newFerdate[dateKey][matanaName]) {
        newFerdate[dateKey][matanaName] += saleIn;
      } else {
        newFerdate[dateKey][matanaName] = saleIn;
      }
    }
    ferdate = newFerdate;
  });
  $effect(() => {
    if (salee.length > 0) {
      const newArrt = [];
      for (const [key, value] of Object.entries(ferdate)) {
        newArrt.push({ date: key, ...value });
      }

      if (newArrt.length === 0) {
        arrt = [];
        return;
      }

      //get all keys
      const keys = newArrt.reduce(
        (acc, curr) => (Object.keys(curr).forEach((key) => acc.add(key)), acc),
        new Set()
      );
      //add all matanot to all objects
      const output = newArrt.map((item) =>
        [...keys].reduce((acc, key) => ((acc[key] = item[key] ?? ''), acc), {})
      );
      //sort by date
      output.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
      });
      //formate to readble local date
      const x = output.map((obj) => {
        return { ...obj, date: dayjs(obj.date).format('D.M.YY') };
      });
      arrt = x;
    } else {
      arrt = [];
    }
  });
  $effect(() => {
    if (salee.length > 0) {
      arr = Object.entries(fermatana).map(([key, value]) => ({ key, value }));
    } else {
      arr = [];
    }
  });
  $effect(() => {
    // Count all sales
    totalSales = salee.reduce((total, s) => total + s.attributes.in, 0);
    // Count all unsplited sales (including pending ones) - these are awaiting split
    allin = salee
      .filter(s => !s.attributes.splited)
      .reduce((total, s) => total + s.attributes.in, 0);
  });
</script>

<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}
  >
    <DialogContent class="content" aria-label="form">
      <div style="z-index: 400;" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
        <button class=" hover:bg-barbi text-mturk rounded-full" onclick={closer}
          >{cencel[$lang]}</button
        >
        {#if a == 0}
          <SaleComponent
            productId={maid}
            productName=""
            availableQuantity={quant}
            price={each}
            {kindOf}
            projectId={$idPr}
            {projectUsers}
            {kindUlimit}
            onDoners={saleUnlimited}
            onDone={sale}
            onError={() => (a = 3)}
          />
        {:else if a == 1}
          <New {projectId} onDone={done} />
        {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">{om[$lang]}</h3>
            <br />
            <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
            ></RingLoader>
          </div>
        {:else if a == 3}
          <h1
            class="text-center text-barbi text-bold underline decoration-mturk"
          >
            {errmsg[$lang]}
          </h1>
          <button
            class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full"
            onclick={() => (a = 0)}>{trya[$lang]}</button
          >
        {/if}
      </div></DialogContent
    >
  </div>
</DialogOverlay>
<div class="sm:flex sm:flex-col sm:justify-evenly overflow-x-hidden max-w-full">
  <div class="flex flex-col sm:flex-row sm:justify-evenly overflow-x-hidden max-w-full">
    <div>
      <div class="dd md:items-center">
        <div class="bodyi items-center d">
          {#if bmiData.length > 0}
            <div class="gifts-header">
              <h1 class="md:text-center text-2xl md:text-2xl font-bold underline decoration-mturk text-center">
                {our[$lang]}
              </h1>
            </div>
            <div class="gifts-grid max-h-[calc(100vh-200px)] overflow-y-auto d">
              {#each bmiData as data, i}
                <div class="gift-card">
                  <div class="card-header">
                    <span class="card-number">{i + 1}</span>
                    <a href="/gift/{data.id}" class="gift-link">
                      <h3 class="gift-name">{data.attributes.name}</h3>
                    </a>
                  </div>
                  <div class="card-body">
                    <p class="gift-price"><strong>{pric[$lang]}:</strong> {data.attributes.price}</p>
                    <p class="gift-quantity"><strong>{quanti[$lang]}:</strong>
                      {#if data.attributes.quant > 0 || data.attributes.quant === -1}
                        {#if data.attributes.kindOf == 'unlimited'}
                          <span>{unl[$lang]}</span>
                        {:else}
                          {data.attributes.quant === -1 ? ($lang === 'he' ? 'ללא הגבלה' : 'Unlimited') : data.attributes.quant}
                        {/if}
                      {/if}
                    </p>
                    <p class="gift-kind"><strong>{kinde[$lang]}:</strong>
                      {#if data.attributes.kindOf == 'total'}
                        {py[$lang]}
                      {:else if data.attributes.kindOf == 'monthly'}
                        {pm[$lang]}
                      {:else if data.attributes.kindOf == 'yearly'}
                        {pye[$lang]}
                      {:else if data.attributes.kindOf == 'unlimited'}
                        {unl[$lang]}
                      {/if}
                    </p>
                  </div>
                  <div class="card-actions">
                    <div class="share-button-container">
                      <ShareButtons slug="gift/{data.id}" title={data.attributes.name} desc={`Check out this amazing gift: ${data.attributes.name} for ${data.attributes.price}`} />
                    </div>
                    <button class="report-sale-btn" title={res[$lang]} onclick={() => sell(data.id, data.attributes.price, data.attributes.quant, data.attributes.kindOf)}>
                      <svg class="svggg" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 496 496" style="width:32px;height:32px;" xml:space="preserve">
                        <g>
                          <g>
                            <g>
                              <path d="M256,32.408V24h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V104h16v-8.408c9.12-1.856,16-9.936,16-19.592c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4C272,42.344,265.12,34.264,256,32.408z"/>
                              <path d="M104,128.408V120H88v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4h-8c-2.208,0-4-1.792-4-4v-4H72v4c0,9.656,6.88,17.736,16,19.592V200h16v-8.408c9.12-1.856,16-9.936,16-19.592c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4C120,138.344,113.12,130.264,104,128.408z"/>
                              <path d="M400,48c-35.288,0-64,28.712-64,64c0,32.144,23.848,58.752,54.76,63.256C387.664,184.928,378.688,192,368,192H256v-64.552c31.52-3.96,56-30.872,56-63.448c0-35.288-28.712-64-64-64c-35.288,0-64,28.712-64,64c0,32.576,24.48,59.488,56,63.448V240H128c-10.688,0-19.664-7.072-22.76-16.744C136.152,218.752,160,192.144,160,160c0-35.288-28.712-64-64-64c-35.288,0-64,28.712-64,64c0,32.84,24.872,59.952,56.768,63.56C92.312,242.008,108.536,256,128,256h112v16H104v64h16.76l16,160h222.48l16-160H392v-64H256v-64h112c19.464,0,35.688-13.992,39.232-32.44C439.128,171.952,464,144.84,464,112C464,76.712,435.288,48,400,48z M96,208c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S122.472,208,96,208z M344.76,480H151.24l-14.4-144h222.32L344.76,480z M376,288v32H120v-32H376z M248,112c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S274.472,112,248,112z M400,160c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S426.472,160,400,160z"/>
                              <path d="M408,80.408V72h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V152h16v-8.408c9.12-1.856,16-9.936,16-19.592c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4C424,90.344,417.12,82.264,408,80.408z"/>
                              <rect x="320" y="352" width="16" height="16"/>
                              <rect x="160" y="352" width="144" height="16"/>
                            </g>
                          </g>
                        </g>
                      </svg>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      <button
        class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={addnew}>{cr[$lang]}</button
      >
    </div>
    {#if salee.length > 0}
      <div class=" text-center border-2 border-barbi rounded m-4 flex flex-col overflow-x-hidden max-w-full">
        <h1
          class="md:text-center text-2xl md:text-2xl font-bold underline decoration-mturk"
        >
          {erhe[$lang]}
        </h1>
        <div class="flex d overflow-x-auto w-full">
          {#each salee as data, i}
            <div
              class="relative bg-colorfulGrad justify-between flex flex-col py-2 px-5 m-2 rounded shadow-2xl shadow-fuchsia-400 {data.attributes.splited ? 'opacity-50 border-2 border-green-500' : data.attributes.pending ? 'opacity-75 border-2 border-blue-500' : ''}"
            >
              {#if data.attributes.splited}
                <div class="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  ✓ {$lang === 'he' ? 'חולק' : 'Split'}
                </div>
              {:else if data.attributes.pending}
                <div class="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  ⏳ {$lang === 'he' ? 'בהצבעה' : 'Pending'}
                </div>
              {/if}
              <!-- Gift Name with Modern Styling -->
              <div class="mb-3">
                <h3
                  class="text-lg font-bold bg-gradient-to-r from-barbi via-mpink to-cyan-500 bg-clip-text text-transparent hover:from-gold hover:via-mpink hover:to-barbi transition-all duration-300 transform hover:scale-105"
                  title={gn[$lang]}
                >
                  {data.attributes.matanot.data.attributes.name}
                </h3>
              </div>

              <!-- Amount with Enhanced Design -->
              <div class="mb-4 p-2 bg-gradient-to-r from-gold/10 to-mpink/10 rounded-lg border border-gold/20">
                <p
                  class="text-xl font-semibold text-center bg-gradient-to-r from-cyan-500 to-barbi bg-clip-text text-transparent"
                  title={qu[$lang]}
                >
                  ₪{data.attributes.in}
                </p>
              </div>

              <!-- User Info with Avatar -->
              <div class="flex items-center justify-between space-x-3 mb-3"
                title={whoo[$lang]}>
                <div class="flex items-center space-x-3">
                    <img
                      class="w-6 h-6 rounded-full ring-2 ring-gold shadow-md hover:ring-mpink transition-all duration-300 transform hover:scale-105"
                      src={getSrc(data.attributes.users_permissions_user.data.id)}
                      alt="User avatar"
                    />
                  <div class="flex flex-col">
                    <h5 class="text-barbi font-bold text-sm hover:text-gold transition-colors duration-200">
                      {data.attributes.users_permissions_user.data.attributes.username}
                    </h5>
                  </div>
                </div>
              </div>

              <!-- Note Section with Modern Card Design -->
              {#if data.attributes.note}
                <div class="mt-4 p-3 bg-gradient-to-br from-barbi/5 to-gold/5 rounded-xl border-l-4 border-gold/30 backdrop-blur-sm">
                  <div class="flex items-center mb-2">
                    <div class="w-2 h-2 bg-gold rounded-full mr-2"></div>
                    <small class="text-barbi/70 font-semibold text-xs uppercase tracking-wider">
                      {noteLabel[$lang]}
                    </small>
                  </div>
                  <p class="text-sm text-barbi/90 leading-relaxed italic border-t border-barbi/20 pt-2">
                    {data.attributes.note}
                  </p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div
          class="button-silver m-1 mt-2 py-4 px-8 mx-auto text-barbi rounded"
        >
          <div class="mb-2">
            <h2 class="text-sm font-medium">{$lang === 'he' ? 'סך הכל מכירות:' : 'Total Sales:'}</h2>
            <p class="font-bold text-lg">{totalSales}</p>
          </div>
          {#if salee.some(s => s.attributes.splited || s.attributes.pending)}
            <div class="border-t border-barbi/30 pt-2">
              <h2 class="text-sm font-medium">{$lang === 'he' ? 'ממתין לחלוקה:' : 'Awaiting Split:'}</h2>
              <p class="font-bold text-lg">{allin}</p>
            </div>
            {#if salee.some(s => s.attributes.pending)}
              <div class="border-t border-barbi/30 pt-2 mt-2">
                <h2 class="text-sm font-medium text-blue-600">{$lang === 'he' ? 'בהצבעה:' : 'In Voting:'}</h2>
                <p class="font-bold text-lg text-blue-600">
                  {salee.filter(s => s.attributes.pending).reduce((total, s) => total + s.attributes.in, 0)}
                </p>
              </div>
            {/if}
          {:else}
            <div class="border-t border-barbi/30 pt-2">
              <h2>{tot[$lang]}</h2>
              <p class="font-bold">{allin}</p>
            </div>
          {/if}
        </div>

        {#if hal === false}
          <button
            id="haluk"
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
            onclick={ask}>{trili.length == 0 ? see[$lang] : req[$lang]}</button
          >
        {:else}
          <button
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
            onclick={() => (hal = false)}><Close /></button
          >
          <Halu
            {trili}
            {salee}
            {allin}
            {fmiData}
            users={projectUsers}
            {rikmashes}
            {restime}
          />
        {/if}
      </div>
    {/if}
  </div>
  {#if salee.length > 0 && arr?.length > 0}
    <div class="flex flex-col sm:flex-row-reverse justify-center">
      <div>
        <h1 class="text-center text-barbi text-bold underline decoration-mturk">
          {sbp[$lang]}
        </h1>

        <div class="sm:w-96 [width:95vw] [height:95vw] sm:h-96 m-4">
          <Cir data={arr} />
        </div>
      </div>
      <div>
        <div class="mx-auto">
          <h1
            class="text-center text-barbi text-bold underline decoration-mturk"
          >
            {sbd[$lang]}
          </h1>

          <div class="  sm:[width:calc(95vw-24rem)] w-4/5 h-96 m-2">
            <Col data={arrt} />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .kff {
    width: 290px;
    height: 290px;
    margin: 0 auto;
  }
  .d::-webkit-scrollbar {
    width: 10px;
  }

  .d::-webkit-scrollbar-track {
    background-color: #e4e4e4;
    border-radius: 100px;
  }

  .d::-webkit-scrollbar-thumb {
    background-color: #d4aa70;
    border-radius: 100px;
  }
  .d {
    scrollbar-color: #d4aa70 #e4e4e4;
  }
  .d::-webkit-scrollbar-thumb {
    background-image: linear-gradient(180deg, #d0368a 0%, #708ad4 99%);
    box-shadow: inset 2px 2px 5px 0 rgba(#fff, 0.5);
    border-radius: 100px;
  }
  .svggg {
    fill: var(--gold);
  }
  .svggg:hover {
    fill: var(--barbi-pink);
  }
  .gg {
    position: sticky;
    top: 1px;
    padding: 15px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggd {
    position: sticky;
    bottom: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggr {
    position: sticky;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggr:hover,
  .gg:hover,
  .ggd:hover {
    background: var(--barbi-pink);
  }
  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .bodyi {
    overflow-x: auto;
    overflow-y: auto;
    max-width: 96vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  table,
  th,
  td {
    border-collapse: collapse;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
  }
  table {
    text-align: center;
    color: var(--barbi-pink);
    margin: 0 auto;
  }
  th {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
  }
  td {
    background-color: #5efaf2;
    background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }
  th:hover {
    background: var(--barbi-pink);
  }
  td:hover {
    background: rgb(132, 241, 223);
  }

  @media (min-width: 768px) {
    .kff {
      min-width: 450px;
      min-height: 450px;
      max-width: 100vw;
      margin: 0 auto;
    }
  }

  .gifts-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .gifts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    padding: 0 0.5rem;
  }

  .gift-card {
    background: linear-gradient(135deg, #5efaf2 0%, #eee 74%);
    border: 2px solid rgb(103, 232, 249);
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .gift-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  }

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .card-number {
    background: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-left: 0.5rem;
  }

  .gift-link {
    text-decoration: none;
    color: inherit;
    flex: 1;
  }

  .gift-name {
    color: var(--barbi-pink);
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
  }

  .gift-name:hover {
    color: var(--gold);
  }

  .card-body p {
    margin: 0.5rem 0;
    color: var(--barbi-pink);
  }

  .card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .share-button-container {
    transform: scale(0.6);
    transform-origin: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 2px;
  }

  .report-sale-btn {
    background: var(--gold);
    border: 2px solid var(--barbi-pink);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .report-sale-btn:hover {
    background: var(--barbi-pink);
    border-color: var(--gold);
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  .report-sale-btn:hover .svggg {
    transform: scale(1.2);
    transition: transform 0.3s ease;
  }

  .svggg {
    fill: var(--barbi-pink);
    transition: fill 0.3s ease, transform 0.3s ease;
  }

  .report-sale-btn:hover .svggg {
    fill: var(--gold);
  }
</style>
