<script>
  import tr from '$lib/translations/tr.json';
  import Text from '../conf/text.svelte';
  import Number from '../conf/number.svelte';
  import DateNego from '../conf/dateNego.svelte';
  import Barb from '../conf/stackBar.svelte';
  import KindOfnego from '$lib/components/conf/kindOfnego.svelte';
  const tri = tr;
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang';
  import { montsi } from '$lib/func/montsi.svelte';
  import moment from 'moment';
  import { toast } from 'svelte-sonner';
  import Rich from '../conf/rich.svelte';

  let bearer1;
  let token;
  let idL;

  const less = {
    he: 'הסרה',
    en: 'remove'
  };
  let descrip2 = $state(descrip);
  let name2 = $state(name1);
  let sqadualed2 = $state(sqadualed);
  let sqadualedf2 = $state(sqadualedf);

  let spnot2 = spnot;
  let linkto2 = $state(linkto);
  let hm2 = $state(hm);
  let price2 = $state(price);
  let easy2 = $state(easy);
  let rishon = 0;
  let kindOfb = $state(kindOf);

  function close() {
    onClose?.();
  }
  let name4 = ``;
  let descrip4 = ``;
  let spnot4 = ``;
  let hm4 = ``;
  let price4 = ``;

  let rishon4 = ``;
  let rishonves4 = ``;
  let what4 = true;
  function objToString(obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      const length = Object.keys(obj[i]).length;
      let t = 0;
      for (const [p, val] of Object.entries(obj[i])) {
        const last = t === length - 1;
        t++;
        if (typeof val == 'string') {
          str += `${p}:"${val}"\n`;
        } else if ((typeof val == 'number') | 'boolean') {
          str += `${p}:${val}\n`;
        } else if (typeof val == 'null') {
          str += `${p}:${val.map((c) => c.id)}\n`;
        }
        if (last) {
          str += '},';
        }
        if (t == 1) {
          str += '{';
        }
      }
    }
    return str;
  }
  function objToStringC(obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      const length = Object.keys(obj[i]).length;
      let t = 0;
      for (const [p, val] of Object.entries(obj[i])) {
        const last = t === length - 1;
        t++;
        if (typeof val == 'string') {
          str += `${p}:"${val}"\n`;
        } else if ((typeof val == 'number') | 'boolean') {
          str += `${p}:${val}\n`;
        } else if (typeof val == 'null') {
          str += `${p}:${val.map((c) => c.id)}\n`;
        }
        if (last) {
          str += '},';
        }
        if (t == 1) {
          str += '{';
        }
      }
    }
    return str;
  }
  let miDatan = [];
  let error1;
  let clicked = false;
  /**
   * @typedef {Object} Props
   * @property {any} restime
   * @property {any} descrip
   * @property {any} projectName
   * @property {any} name1
   * @property {any} spnot
   * @property {number} [easy]
   * @property {number} [hm]
   * @property {number} [price]
   * @property {any} projectId
   * @property {any} [uids]
   * @property {any} [what]
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} noofusersWaiting
   * @property {number} [total]
   * @property {any} noofusers
   * @property {any} already
   * @property {any} mypos
   * @property {any} missionId
   * @property {any} linkto
   * @property {any} tafkidims
   * @property {any} sqadualed
   * @property {any} sqadualedf
   * @property {number} [stepState]
   * @property {any} pendId
   * @property {any} [users]
   * @property {string} [kindOf]
   * @property {number} [oldide] - last tg id, if non 0
   * @property {any} timegramaId
   * @property {number} [ordern]
   * @property {boolean} [masaalr]
   */

  /** @type {Props} */
  let {
    restime,
    descrip,
    projectName,
    name1,
    spnot,
    easy = 0,
    hm = 0,
    price = 0,
    projectId,
    uids = [],
    what = [],
    noofusersOk,
    noofusersNo,
    noofusersWaiting,
    total = 0,
    noofusers,
    already,
    mypos,
    missionId,
    linkto,
    tafkidims,
    sqadualed,
    sqadualedf,
    stepState = 2,
    pendId,
    users = [],
    kindOf = 'perUnit',
    oldide = 0,
    timegramaId,
    ordern = 0,
    masaalr = false,
    onClose,
    onLoad
  } = $props();
  
  let userss;
  async function increment() {
    onLoad?.();
    //TODO: update timegrama, add now pend that is changed to nego
    let sqadualedf4 = ``,
      kindOf4nego = ``,
      kindOf4 = ``,
      sqadualed4 = ``,
      easy4 = ``,
      easy4nego = ``,
      sqadualedf4nego,
      sqadualed4nego,
      namefornego,
      descrip4nego,
      spnot4nego,
      hm4nego,
      price4nego,
      rishon4nego,
      rishonves4nego;

    const negoss = ``;
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
    if (rishon !== 0) {
      rishon4 = `rishon: "${rishon}"`;
    } else {
      rishon4 = ``;
    }

    if (sqadualed === sqadualed2) {
      sqadualed4 = ``;
      sqadualed4nego = ``;
    } else {
      let momebtt = moment(sqadualed2, 'HH:mm DD/MM/YYYY ') || null;
      sqadualed4nego =
        sqadualed !== undefined ? ` sqadualed: "${sqadualed}",` : ``;
      sqadualed4 =
        sqadualed2 !== undefined && sqadualed2 != null
          ? ` sqadualed: "${momebtt.toISOString()}",`
          : ``;
      what4 = false;
    }
    if (sqadualedf === sqadualedf2) {
      sqadualedf4 = ``;
      sqadualedf4nego = ``;
    } else {
      let momebtt = moment(sqadualedf2, 'HH:mm DD/MM/YYYY ') || null;
      sqadualedf4nego =
        sqadualedf !== undefined ? ` sqadualedf: "${sqadualedf}",` : ``;
      sqadualedf4 =
        sqadualedf2 !== undefined && sqadualedf2 != null
          ? ` sqadualedf: "${momebtt.toISOString()}"`
          : ``;
      what4 = false;
    }
    if (name1 === name2) {
      name4 = ``;
      namefornego = ``;
    } else {
      name4 = `name: "${name2}",`;
      namefornego = `name: "${name1}",`;
      what4 = false;
    }
    if (descrip === descrip2) {
      descrip4 = ``;
      descrip4nego = ``;
    } else {
      descrip4 = `descrip: "${descrip2}",`;
      descrip4nego = `descrip: "${descrip}",`;
      what4 = false;
    }
    if (spnot === spnot2) {
      spnot4 = ``;
      spnot4nego = ``;
    } else {
      spnot4 = `spnot: "${spnot2}",`;
      spnot4nego = `spnot: "${spnot}",`;
      what4 = false;
    }
    if (easy === easy2) {
      easy4 = ``;
      easy4nego = ``;
    } else {
      easy4 = `easy: ${easy2},`;
      easy4nego = `easy: ${easy},`;
      what4 = false;
    }
    if (hm === hm2) {
      hm4 = ``;
      hm4nego = ``;
    } else {
      hm4 = `hm: ${hm2},`;
      hm4nego = `hm: ${hm},`;
      what4 = false;
    }
    if (price === price2) {
      price4 = ``;
      price4nego = ``;
    } else {
      price4 = `price: ${price2},`;
      price4nego = `price: ${price},`;
      what4 = false;
    }
    if (kindOf === kindOfb) {
      kindOf4 = ``;
      kindOf4nego = ``;
    } else {
      kindOf4 = `kindOf:${kindOfb},`;
      kindOf4nego = `kindOf:${kindOf},`;
      what4 = false;
    }
    let fd = new Date(Date.now() + x);
    let d = new Date();
    let another = ``;
    if (
      (what4 == true && masaalr == true && mypos == false) ||
      (what4 == true && masaalr == false) ||
      what4 == false
    ) {
      if (what4 == false) {
        another = `,{
      what: true
      users_permissions_user: "${idL}"
      order: 4
      zman: "${d.toISOString()}"
    }`;
      }
      if (masaalr == true) {
        userss = objToStringC(users);
      } else {
        userss = objToString(users);
      }
      try {
        await fetch(linkg, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          //${negoss} {rishons} {rishonveses}?
          body: JSON.stringify({
            query: `mutation { 
             updateTimegrama(
     id: ${timegramaId}
             data:{
      date: "${fd.toISOString()}",
             }){data {id}}
             createNegoMash(
              data:{
              users_permissions_user:"${idL}",
                publishedAt: "${d.toISOString()}",
                pmash:${pendId},
                 isOriginal:${stepState == 2 ? true : false},
                 ${kindOf4nego}
    ${easy4nego}             
    ${hm4nego}
    ${spnot4nego}
    ${descrip4nego}
    ${namefornego}
    ${price4nego}
    ${sqadualedf4nego}
    ${sqadualed4nego}
              }
             ){data{id}}
            updatePmash(
     id: ${pendId}
      data:  { 
            ${easy4}             
           ${hm4}
    ${spnot4}
    ${kindOf4}
    ${descrip4}
    ${name4}
    ${price4}
    ${sqadualedf4}
    ${sqadualed4}
        users:[  ${userss}, 
     {
      what: true
      users_permissions_user: "${idL}"
      order: ${ordern + 1}
      zman: "${d.toISOString()}"
    }
  ]
      }
  ){data {  id}}
} `
            // make coin desapire
          })
        })
          .then((r) => r.json())
          .then((data) => (miDatan = data));
        console.log(miDatan);
        toast.success(tr?.toasts.suc[$lang]);
        close();
      } catch (e) {
        error1 = e;
        console.log(error1);
        toast.success(tr?.toasts.er[$lang]);
      }
    }
  }
  let x;
  let linkg = import.meta.env.VITE_URL + '/graphql';
  onMount(async () => {
    console.log('mounted', $lang);
    if (restime == 'feh') {
      x = 48 * 60 * 60 * 1000;
    } else if (restime == 'sth') {
      x = 72 * 60 * 60 * 1000;
    } else if (restime == 'nsh') {
      x = 96 * 60 * 60 * 1000;
    } else if (restime == 'sevend') {
      x = 168 * 60 * 60 * 1000;
    }
    x = x;
    console.log(new Date(Date.now() + x).toLocaleString(), restime);
  });

  let datai = $derived([
    {
      leb: `${tri?.nego?.new[$lang]},${price2 * hm2 * montsi(kindOfb, sqadualed2, sqadualedf2, true)}| ${tri?.mash?.shovile[$lang]},${easy2 * hm2 * montsi(kindOfb, sqadualed2, sqadualedf2, true)}`,
      value: price2 * hm2 * montsi(kindOfb, sqadualed2, sqadualedf2, true),
      vallue2:
        easy2 * hm2 * montsi(kindOfb, sqadualed2, sqadualedf2, true) -
        price2 * hm2 * montsi(kindOfb, sqadualed2, sqadualedf2, true)
    },
    {
      leb: `${tri?.nego?.original[$lang]},${price * hm * montsi(kindOf, sqadualed, sqadualedf, true)} | ${tri?.mash?.shovile[$lang]},${easy * hm * montsi(kindOf, sqadualed, sqadualedf, true)}`,
      value: price * hm * montsi(kindOf, sqadualed, sqadualedf, true),
      vallue2:
        easy * hm * montsi(kindOf, sqadualed, sqadualedf, true) -
        price * hm * montsi(kindOf, sqadualed, sqadualedf, true)
    }
  ]);
  $effect(() => {
    console.log(datai);
  });
</script>

<div class="text-barbi" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
  <h1 class="md:text-center text-2xl md:text-2xl font-bold underline">
    {tri?.nego?.headmash[$lang]}
    {name1}
  </h1>
  <div class="flex flex-col align-middle justify-center">
    <Text text={name1} bind:textb={name2} lebel={tri?.common?.name} />
    <Rich
      text={descrip}
      bind:textb={descrip2}
      lebel={tri?.common?.description}
    />
    <!--<Text text={spnot} bind:textb={spnot2} lebel={tri?.mission?.specialNotes}/>-->
    <Text text={linkto} bind:textb={linkto2} lebel={tri?.mash?.linkto} />
    <KindOfnego {kindOf} bind:kindOfb lebel={tri?.mash.kindof} />

    {#if !(kindOf == 'total' && kindOfb == 'total')}
      <Number number={hm} bind:numberb={hm2} lebel={tri?.mash?.noof[$lang]} />
    {/if}
    <Number
      number={price}
      bind:numberb={price2}
      lebel={tri?.mash?.shovi[$lang]}
    />
    <Number
      number={easy}
      bind:numberb={easy2}
      lebel={tri?.mash?.shovile[$lang]}
    />
    {#if kindOf == 'yearly' || kindOfb == 'yearly' || kindOfb == 'monthly' || kindOf == 'monthly' || kindOf == 'rent' || kindOfb == 'rent'}
      <DateNego
        date={sqadualed}
        bind:dateb={sqadualed2}
        lebel={tri?.common.startDate}
      />
      <DateNego
        date={sqadualedf}
        bind:dateb={sqadualedf2}
        lebel={tri?.common.finishDate}
      />
    {/if}

    <!---<div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{tr?.mission.iskvua[$lang]}: </h2>
  <input
    bind:checked={isKavua2}
    type="checkbox" id="tomeC" name="isKavua2" >
</div>
</div>

<div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{tr?.mission.assingToMe[$lang]}: </h2>
  <input
    bind:checked={myM}
    type="checkbox" id="tomeC" name="tome" value="tome" onclick={()=> myMission()}>
</div>
</div>-->
  </div>
  <div
    class="border border-gold border-opacity-80 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
  >
    <h2 class="underline decoration-mturk">{tri?.mash.tota[$lang]}</h2>
    {#if price == price2 && hm == hm2 && kindOf == kindOfb && easy == easy2}
      {#if (price > 0) & (hm > 0)}
        {(
          price *
          hm *
          montsi(kindOf, sqadualed, sqadualedf, true)
        ).toLocaleString()}
        {#if price != easy}
          {tri?.mash?.shovile[$lang]}:
          {(
            easy *
            hm *
            montsi(kindOf, sqadualed, sqadualedf, true)
          ).toLocaleString()}
        {/if}
      {:else}
        <p>0</p>
      {/if}
    {:else}
      {#key datai}
        <div class="w-1/2 mx-auto">
          <Barb {datai} />
        </div>
      {/key}
    {/if}
  </div>

  <div class="w-fit mx-auto">
    <button
      onclick={increment}
      class="mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
      type="submit"
      name="addm">{tri?.common.puttovote[$lang]}</button
    >
  </div>
</div>
