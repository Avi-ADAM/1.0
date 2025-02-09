<script>
<<<<<<< HEAD
  import { run } from 'svelte/legacy';

  //טבלת מתנות כפתור מכירה מקפיץ תפריט של איפה הכסף יושב
  import Col from './column/main.svelte';
  import New from './newmatana.svelte';
  import Sale from './sale.svelte';
  import dayjs from 'dayjs';
  import { lang } from '$lib/stores/lang.js';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import Halu from './whowhat.svelte';
  import Cir from './graph/circle.svelte';
  let isOpen = $state(false);
  let a = $state(0);
  import { RingLoader } from 'svelte-loading-spinners';
  import Close from '$lib/celim/close.svelte';
  let fermatana = $state({});
  let ferdate = $state({});
  let arr = $state([]);
  let arrt = $state([]);
  arr = arr;

  let kindUlimit = $state(false);
  let {
    fmiData = [],
    rikmashes = [],
    projectId,
    trili,
    bmiData = $bindable([]),
    salee = [],
    projectUsers = []
  } = $props();
  let quant = $state(), each = $state(), maid = $state();
  function sell(id, v, z, isto) {
    maid = id;
    each = v;
    quant = z;
    if (isto == 'unlimited') {
      kindUlimit = true;
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
    const id = event.detail.id;
    const un = event.detail.un;
    let oldob = bmiData;
    const x = oldob.map((c) => c.id);
    const indexy = x.indexOf(id);
    oldob[indexy].quant = un;
    bmiData = oldob;
    isOpen = false;
    a = 0;
  };
  function done(event) {
    isOpen = false;
    a = 0;
    bmiData.push(event.detail.matana);
    bmiData = bmiData;
  }
  function ask() {
    hal = true;
    //ליצור מטבע אישור של חלוקה ליצור טופס של פרטי חלוקה כמה אחוז לחלק וכמה להעמיד להוצאות
  }
  let allin = $state(0);
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
  const tot = { he: 'סך הכל:', en: 'total:' };
  const req = { he: 'בקשת חלוקה', en: 'request money spliting' };
  const see = { he: 'צפיה בהצעת החלוקה', en: 'see existed sppliting offer' };
  const sbp = { he: 'התפלגות המכירות לפי מוצר', en: 'sales by product' };
  const sbd = { he: 'התפלגות המכירות לפי תאריך', en: 'sales by date' };
  run(() => {
    for (let i = 0; i < salee.length; i++) {
      if (salee[i].attributes.matanot.data.attributes.name in fermatana) {
        fermatana[salee[i].attributes.matanot.data.attributes.name] +=
          salee[i].attributes.in;
      } else {
        fermatana[salee[i].attributes.matanot.data.attributes.name] =
          salee[i].attributes.in;
      }
=======
  //טבלת מתנות כפתור מכירה מקפיץ תפריט של איפה הכסף יושב
  import Col from './column/main.svelte';
  import New from './newmatana.svelte';
  import Sale from './sale.svelte';
  import dayjs from 'dayjs';
  import { lang } from '$lib/stores/lang.js';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import Halu from './whowhat.svelte';
  import Cir from './graph/circle.svelte';
  export let fmiData = [];
  export let rikmashes = [];
  export let projectId;
  export let trili;
  let isOpen = false;
  let a = 0;
  export let bmiData = [];
  console.log(bmiData);
  import { RingLoader } from 'svelte-loading-spinners';
  import Close from '$lib/celim/close.svelte';
  let fermatana = {};
  let ferdate = {};
  let arr = [];
  let arrt = [];
  export let salee = [];
  $: for (let i = 0; i < salee.length; i++) {
    if (salee[i].attributes.matanot.data.attributes.name in fermatana) {
      fermatana[salee[i].attributes.matanot.data.attributes.name] +=
        salee[i].attributes.in;
    } else {
      fermatana[salee[i].attributes.matanot.data.attributes.name] =
        salee[i].attributes.in;
>>>>>>> main
    }
  });
  run(() => {
    for (let i = 0; i < salee.length; i++) {
      if (dayjs(salee[i].attributes.date) in ferdate) {
        if (
          salee[i].attributes.matanot.data.attributes.name in
          ferdate[dayjs(salee[i].attributes.date)]
        ) {
          ferdate[dayjs(salee[i].attributes.date)][
            salee[i].attributes.matanot.data.attributes.name
          ] += salee[i].attributes.in;
        } else {
          ferdate[dayjs(salee[i].attributes.date)][
            salee[i].attributes.matanot.data.attributes.name
          ] = salee[i].attributes.in;
        }
      } else {
        ferdate[dayjs(salee[i].attributes.date)] = {
          [salee[i].attributes.matanot.data.attributes.name]:
            salee[i].attributes.in
        };
      }
      console.log(ferdate);
    }
  });
  run(() => {
    if (salee.length > 0) {
      for (const [key, value] of Object.entries(ferdate)) {
        const datea = key;
        const ano = value;
        arrt.push({ date: datea });
        arrt = arrt;
        const objIndex = arrt.findIndex((obj) => obj.date == datea);

        for (const [key, value] of Object.entries(ano)) {
          arrt[objIndex][key] = value;
        }
      }
      //get all keys
      const keys = arrt.reduce(
        (acc, curr) => (Object.keys(curr).forEach((key) => acc.add(key)), acc),
        new Set()
      );
      //add all matanot to all objects
      const output = arrt.map((item) =>
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
      console.log(arrt);
    }
  });
  run(() => {
    if (salee.length > 0) {
      for (let key in fermatana) {
        if (fermatana.hasOwnProperty(key)) {
          arr.push({ key: key, value: fermatana[key] });
        }
      }
    }
<<<<<<< HEAD
  });
  run(() => {
    for (let i = 0; i < salee.length; i++) {
      allin += salee[i].attributes.in;
    }
  });
</script>

<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}
  >
    <DialogContent aria-label="form">
      <div style="z-index: 400;" dir="rtl">
        <button
          class=" hover:bg-barbi text-mturk rounded-full"
          onclick={closer}>{cencel[$lang]}</button
        >
        {#if a == 0}
          <Sale
            {projectUsers}
            {each}
            {quant}
            {kindUlimit}
            {maid}
            on:doner={closer}
            on:done={sale}
            on:eror={() => (a = 3)}
          />
        {:else if a == 1}
          <New {projectId} on:done={done} />
        {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">{om[$lang]}</h3>
            <br />
            <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
            ></RingLoader>
          </div>
        {:else if a == 3}
          <h1>{errmsg[$lang]}</h1>
          <button
            class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full"
            onclick={() => (a = 0)}>{trya[$lang]}</button
          >
        {/if}
      </div></DialogContent
    >
  </div>
</DialogOverlay>
<div class="sm:flex sm:flex-col sm:justify-evenly">
  <div class="flex flex-col sm:flex-row sm:justify-evenly">
    <div>
    <div class="dd md:items-center">
      <div class="body items-center d">
        {#if bmiData.length > 0}
          <table dir="rtl">
            <caption class="sm:text-right md:text-center text-right">
              <h1
                class="md:text-center text-2xl md:text-2xl font-bold underline decoration-mturk"
              >
                {our[$lang]}
              </h1>
            </caption>
            <thead>
            <tr class="gg">
              <th class="gg"></th>
              {#each bmiData as data, i}
                <td class="gg" style="font-size: 3rem">
                  {i + 1}
                  <!--    <button>מחיקה</button>-->
                </td>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>{nm[$lang]}</th>
              {#each bmiData as data, i}
                <td>{data.attributes.name} </td>
              {/each}
            </tr>
            <tr>
              <th>{pric[$lang]}</th>
              {#each bmiData as data, i}
                <td>{data.attributes.price}</td>
              {/each}
            </tr>
            <tr>
              <th>{quanti[$lang]}</th>
              {#each bmiData as data, i}
                <td>
                  {#if data.attributes.quant > 0}
                    <p
                      style="display:{data.attributes.kindOf == 'unlimited'
                        ? 'none'
                        : ''} ;"
                    >
                      {data.attributes.quant}
                    </p>
                  {/if}
                </td>
              {/each}
            </tr><tr>
              <th>{kinde[$lang]}</th>
              {#each bmiData as data, i}
                <td>
                  {#if data.attributes.kindOf == 'total'}
                    {py[$lang]}
                  {:else if data.attributes.kindOf == 'monthly'}
                    {pm[$lang]}
                  {:else if data.attributes.kindOf == 'yearly'}
                    {pye[$lang]}
                  {:else if data.attributes.kindOf == 'unlimited'}
                    {unl[$lang]}
                  {/if}
                </td>
              {/each}
            </tr><!--<tr>
        <th> מכירות</th>
        {#each bmiData as data, i}
        <td>          {#if data.sale.in} 

          {data.sale.in} 
          {/if}
         </td>
         {/each} 
    </tr><tr >
      <th>סך הכל הכנסה למתנה</th>
      {#each bmiData as data, i}
      <td>
      {#if data.sale.in > 0 & data.price > 0}
      
      {data.price * data.sale.in}
      
      {:else} <p>0</p>
      {/if}
      </td>
      {/each}
    </tr>-->

            <tr class="ggd">
              <th class="ggd">{res[$lang]}</th>
              {#each bmiData as data, i}
                <td class="ggd" style="font-size: 3rem">
                  <button
                    class=" hover:bg-gold rounded-full p-0.5"
                    title={res[$lang]}
                    onclick={sell(
                      data.id,
                      data.attributes.price,
                      data.attributes.quant,
                      data.attributes.kindOf
                    )}
                    ><svg
                      class="svggg"
                      version="1.1"
                      id="Layer_1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      x="0px"
                      y="0px"
                      viewBox="0 0 496 496"
                      style=" width:24px;height:24px;"
                      xml:space="preserve"
                    >
                      <g>
                        <g>
                          <g>
                            <path
                              d="M256,32.408V24h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V104h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C272,42.344,265.12,34.264,256,32.408z"
                            />
                            <path
                              d="M104,128.408V120H88v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4H72v4c0,9.656,6.88,17.736,16,19.592V200h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C120,138.344,113.12,130.264,104,128.408z"
                            />
                            <path
                              d="M400,48c-35.288,0-64,28.712-64,64c0,32.144,23.848,58.752,54.76,63.256C387.664,184.928,378.688,192,368,192H256
				v-64.552c31.52-3.96,56-30.872,56-63.448c0-35.288-28.712-64-64-64c-35.288,0-64,28.712-64,64c0,32.576,24.48,59.488,56,63.448
				V240H128c-10.688,0-19.664-7.072-22.76-16.744C136.152,218.752,160,192.144,160,160c0-35.288-28.712-64-64-64
				c-35.288,0-64,28.712-64,64c0,32.84,24.872,59.952,56.768,63.56C92.312,242.008,108.536,256,128,256h112v16H104v64h16.76l16,160
				h222.48l16-160H392v-64H256v-64h112c19.464,0,35.688-13.992,39.232-32.44C439.128,171.952,464,144.84,464,112
				C464,76.712,435.288,48,400,48z M96,208c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S122.472,208,96,208z
				 M344.76,480H151.24l-14.4-144h222.32L344.76,480z M376,288v32H120v-32H376z M248,112c-26.472,0-48-21.528-48-48s21.528-48,48-48
				s48,21.528,48,48S274.472,112,248,112z M400,160c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S426.472,160,400,160
				z"
                            />
                            <path
                              d="M408,80.408V72h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V152h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C424,90.344,417.12,82.264,408,80.408z"
                            />
                            <rect x="320" y="352" width="16" height="16" />
                            <rect x="160" y="352" width="144" height="16" />
                          </g>
                        </g>
                      </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                    </svg>
                  </button>
                </td>
              {/each}
            </tr>
          </tbody>
          </table>
        {/if}
      </div>
    </div>
    <button
      class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
      onclick={addnew}>{cr[$lang]}</button
    >
    </div>
    {#if salee.length > 0}
      <div class=" text-center border-2 border-barbi rounded m-4 flex flex-col">
        <h1
          class="md:text-center text-2xl md:text-2xl font-bold underline decoration-mturk"
        >
          {erhe[$lang]}
        </h1>
        <div class="flex d overflow-auto">
          {#each salee as data, i}
            <div
              class=" button-whitegold py-2 px-5 m-2 rounded shadow-2xl shadow-fuchsia-400"
            >
              <h3 title={gn[$lang]}>
                {data.attributes.matanot.data.attributes.name}
              </h3>
              <p title={qu[$lang]}>{data.attributes.in}</p>
              <span class="flex flex-row">
                <h5 class="text-barbi font-bold" title={whoo[$lang]}>
                  {data.attributes.users_permissions_user.data.attributes
                    .username}
                </h5>
                <img
                  class=" h-4 w-4 rounded-full ring-2 ring-gold"
                  src={getSrc(data.attributes.users_permissions_user.data.id)}
                  alt=""
                />
              </span>
            </div>
          {/each}
        </div>
        <div
          class="button-silver m-1 mt-2 py-4 px-8 mx-auto text-barbi rounded"
        >
          <h2>{tot[$lang]}</h2>
          <p class="font-bold">{allin}</p>
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
            onclick={()=>hal = false}><Close/></button
          >
          <Halu
            {trili}
            {salee}
            {allin}
            meData={rikmashes}
            {fmiData}
            users={projectUsers}
            {rikmashes}
          />
        {/if}
      </div>
    {/if}
  </div>
  {#if salee.length > 0}
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
  .body {
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
</style>
=======
  }
  let kindOf;
  let kindUlimit = false;
  export let projectUsers = [];
  let quant, each, maid;
  function sell(id, v, z, isto) {
    maid = id;
    each = v;
    quant = z;
    kindOf = isto;
    if (isto == 'unlimited') {
      console.log('unlimited',isto);
      kindUlimit = true;
    }else{
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
  let hal = false;
  const sale = (event) => {
    const id = event.detail.id;
    const un = event.detail.un;
    let oldob = bmiData;
    const x = oldob.map((c) => c.id);
    const indexy = x.indexOf(id);
    oldob[indexy].quant = un;
    bmiData = oldob;
    isOpen = false;
    a = 0;
  };
  function done(event) {
    isOpen = false;
    a = 0;
    bmiData.push(event.detail.matana);
    bmiData = bmiData;
  }
  function ask() {
    hal = true;
    //ליצור מטבע אישור של חלוקה ליצור טופס של פרטי חלוקה כמה אחוז לחלק וכמה להעמיד להוצאות
  }
  let allin = 0;
  $: for (let i = 0; i < salee.length; i++) {
    allin += salee[i].attributes.in;
  }
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
  const tot = { he: 'סך הכל:', en: 'total:' };
  const req = { he: 'בקשת חלוקה', en: 'request money spliting' };
  const see = { he: 'צפיה בהצעת החלוקה', en: 'see existed sppliting offer' };
  const sbp = { he: 'התפלגות המכירות לפי מוצר', en: 'sales by product' };
  const sbd = { he: 'התפלגות המכירות לפי תאריך', en: 'sales by date' };
</script>

<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}
  >
    <DialogContent class="content" aria-label="form">
      <div style="z-index: 400;" dir="{$lang == 'he' ? 'rtl' : 'ltr'}">
        <button
          class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}>{cencel[$lang]}</button
        >
        {#if a == 0}
          <Sale
            {projectUsers}
            {each}
            {quant}
            {kindUlimit}
            {maid}
            {kindOf}
            on:doner={closer}
            on:done={sale}
            on:eror={() => (a = 3)}
          />
        {:else if a == 1}
          <New {projectId} on:done={done} />
        {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">{om[$lang]}</h3>
            <br />
            <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
            ></RingLoader>
          </div>
        {:else if a == 3}
          <h1 class="text-center text-barbi text-bold underline decoration-mturk">{errmsg[$lang]}</h1>
          <button
            class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full"
            on:click={() => (a = 0)}>{trya[$lang]}</button
          >
        {/if}
      </div></DialogContent
    >
  </div>
</DialogOverlay>
<div class="sm:flex sm:flex-col sm:justify-evenly">
  <div class="flex flex-col sm:flex-row sm:justify-evenly">
    <div>
    <div class="dd md:items-center">
      <div class="body items-center d">
        {#if bmiData.length > 0}
          <table dir="rtl">
            <caption class="sm:text-right md:text-center text-right">
              <h1
                class="md:text-center text-2xl md:text-2xl font-bold underline decoration-mturk"
              >
                {our[$lang]}
              </h1>
            </caption>
            <tr class="gg">
              <th class="gg"></th>
              {#each bmiData as data, i}
                <td class="gg" style="font-size: 3rem">
                  {i + 1}
                  <!--    <button>מחיקה</button>-->
                </td>
              {/each}
            </tr>
            <tr>
              <th>{nm[$lang]}</th>
              {#each bmiData as data, i}
                <td>{data.attributes.name} </td>
              {/each}
            </tr>
            <tr>
              <th>{pric[$lang]}</th>
              {#each bmiData as data, i}
                <td>{data.attributes.price}</td>
              {/each}
            </tr>
            <tr>
              <th>{quanti[$lang]}</th>
              {#each bmiData as data, i}
                <td>
                  {#if data.attributes.quant > 0}
                    <p
                      style="display:{data.attributes.kindOf == 'unlimited'
                        ? 'none'
                        : ''} ;"
                    >
                      {data.attributes.quant}
                    </p>
                  {/if}
                </td>
              {/each}
            </tr><tr>
              <th>{kinde[$lang]}</th>
              {#each bmiData as data, i}
                <td>
                  {#if data.attributes.kindOf == 'total'}
                    {py[$lang]}
                  {:else if data.attributes.kindOf == 'monthly'}
                    {pm[$lang]}
                  {:else if data.attributes.kindOf == 'yearly'}
                    {pye[$lang]}
                  {:else if data.attributes.kindOf == 'unlimited'}
                    {unl[$lang]}
                  {/if}
                </td>
              {/each}
            </tr><!--<tr>
        <th> מכירות</th>
        {#each bmiData as data, i}
        <td>          {#if data.sale.in} 

          {data.sale.in} 
          {/if}
         </td>
         {/each} 
    </tr><tr >
      <th>סך הכל הכנסה למתנה</th>
      {#each bmiData as data, i}
      <td>
      {#if data.sale.in > 0 & data.price > 0}
      
      {data.price * data.sale.in}
      
      {:else} <p>0</p>
      {/if}
      </td>
      {/each}
    </tr>-->

            <tr class="ggd">
              <th class="ggd">{res[$lang]}</th>
              {#each bmiData as data, i}
                <td class="ggd" style="font-size: 3rem">
                  <button
                    class=" hover:bg-gold rounded-full p-0.5"
                    title={res[$lang]}
                    on:click={sell(
                      data.id,
                      data.attributes.price,
                      data.attributes.quant,
                      data.attributes.kindOf
                    )}
                    ><svg
                      class="svggg"
                      version="1.1"
                      id="Layer_1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      x="0px"
                      y="0px"
                      viewBox="0 0 496 496"
                      style=" width:24px;height:24px;"
                      xml:space="preserve"
                    >
                      <g>
                        <g>
                          <g>
                            <path
                              d="M256,32.408V24h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V104h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C272,42.344,265.12,34.264,256,32.408z"
                            />
                            <path
                              d="M104,128.408V120H88v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4H72v4c0,9.656,6.88,17.736,16,19.592V200h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C120,138.344,113.12,130.264,104,128.408z"
                            />
                            <path
                              d="M400,48c-35.288,0-64,28.712-64,64c0,32.144,23.848,58.752,54.76,63.256C387.664,184.928,378.688,192,368,192H256
				v-64.552c31.52-3.96,56-30.872,56-63.448c0-35.288-28.712-64-64-64c-35.288,0-64,28.712-64,64c0,32.576,24.48,59.488,56,63.448
				V240H128c-10.688,0-19.664-7.072-22.76-16.744C136.152,218.752,160,192.144,160,160c0-35.288-28.712-64-64-64
				c-35.288,0-64,28.712-64,64c0,32.84,24.872,59.952,56.768,63.56C92.312,242.008,108.536,256,128,256h112v16H104v64h16.76l16,160
				h222.48l16-160H392v-64H256v-64h112c19.464,0,35.688-13.992,39.232-32.44C439.128,171.952,464,144.84,464,112
				C464,76.712,435.288,48,400,48z M96,208c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S122.472,208,96,208z
				 M344.76,480H151.24l-14.4-144h222.32L344.76,480z M376,288v32H120v-32H376z M248,112c-26.472,0-48-21.528-48-48s21.528-48,48-48
				s48,21.528,48,48S274.472,112,248,112z M400,160c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S426.472,160,400,160
				z"
                            />
                            <path
                              d="M408,80.408V72h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V152h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C424,90.344,417.12,82.264,408,80.408z"
                            />
                            <rect x="320" y="352" width="16" height="16" />
                            <rect x="160" y="352" width="144" height="16" />
                          </g>
                        </g>
                      </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                      <g> </g>
                    </svg>
                  </button>
                </td>
              {/each}
            </tr>
          </table>
        {/if}
      </div>
    </div>
    <button
      class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
      on:click={addnew}>{cr[$lang]}</button
    >
    </div>
    {#if salee.length > 0}
      <div class=" text-center border-2 border-barbi rounded m-4 flex flex-col">
        <h1
          class="md:text-center text-2xl md:text-2xl font-bold underline decoration-mturk"
        >
          {erhe[$lang]}
        </h1>
        <div class="flex d overflow-auto">
          {#each salee as data, i}
            <div
              class=" button-whitegold py-2 px-5 m-2 rounded shadow-2xl shadow-fuchsia-400"
            >
              <h3 title={gn[$lang]}>
                {data.attributes.matanot.data.attributes.name}
              </h3>
              <p title={qu[$lang]}>{data.attributes.in}</p>
              <span class="flex flex-row">
                <h5 class="text-barbi font-bold" title={whoo[$lang]}>
                  {data.attributes.users_permissions_user.data.attributes
                    .username}
                </h5>
                <img
                  class=" h-4 w-4 rounded-full ring-2 ring-gold"
                  src={getSrc(data.attributes.users_permissions_user.data.id)}
                  alt=""
                />
              </span>
            </div>
          {/each}
        </div>
        <div
          class="button-silver m-1 mt-2 py-4 px-8 mx-auto text-barbi rounded"
        >
          <h2>{tot[$lang]}</h2>
          <p class="font-bold">{allin}</p>
        </div>

        {#if hal === false}
          <button
            id="haluk"
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
            on:click={ask}>{trili.length == 0 ? see[$lang] : req[$lang]}</button
          >
        {:else}
         <button
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
            on:click={()=>hal = false}><Close/></button
          >
          <Halu
            {trili}
            {salee}
            {allin}
            meData={rikmashes}
            {fmiData}
            users={projectUsers}
            {rikmashes}
          />
        {/if}
      </div>
    {/if}
  </div>
  {#if salee.length > 0}
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
  .body {
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
</style>
>>>>>>> main
