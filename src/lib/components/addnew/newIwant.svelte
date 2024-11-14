<script>
  import { lang } from '$lib/stores/lang.js';
  import { Confetti } from 'svelte-confetti';
  import axios from 'axios';
  import MultiSelect from 'svelte-multiselect';
  import { onMount } from 'svelte';
  import Uplad from '../userPr/uploadPic.svelte';
  import Chooser from '$lib/celim/ui/chooser.svelte';
  const baseUrl = import.meta.env.VITE_URL;
  let totalbounti = $state()
  let des = $state();
  let loading = $state(false);
  let a = $state(0);
  let success = $state(false);
  let before = $state(false);
  let url1 = baseUrl + '/api/upload';
  let linkP = $state();
  let desP = $state();
  let name = $state('');
  let token;
  let timeToP = 'already';
  let run = [];
  let imageId = 50;
  let files;
  let shgi = $state(false);
  let restime = $state();
  let ont = $state(false);
  let start = $state(), finnish = $state()
  function openForum(){

  }
  async function sendP() {
    if (name.length < 1) {
      naex = {
        he: 'שם הריקמה חייב להיות ארוך יותר',
        en: 'please choose name for the FreeMate'
      };
      shgi = true;
    } else {
      if (run.includes(name)) {
        naex = {
          he: 'השם כבר קיים נא לבחור שם אחר',
          en: 'name already exists please try another name'
        };
        shgi = true;
      } else {
        loading = true;
        const cookieValue = document.cookie
          .split('; ')
          .find((row) => row.startsWith('jwt='))
          .split('=')[1];

        token = cookieValue;
        let bearer1 = 'bearer' + ' ' + token;
        //let fd = new FormData();
        if (files) {
          //  fd.append('files', files[0]);
          axios
            .post(url1, files, {
              headers: {
                Authorization: bearer1
              }
            })
            .then(({ data }) => {
              imageId = data[0].id;
              sendPP();
            })
            .catch((error) => {
              console.log('צריך לתקן:', error.response);
              loading = false;
            });
        } else {
          sendPP();
        }
      }
    }
  }
    async function sendPP() {
      await newnew().then();
      let d = await crRatson(
        imageId,
        start?new Date(moment(start, "HH:mm DD/MM/YYYY")).toISOString():null,
        finnish?new Date(moment(finnish, "HH:mm DD/MM/YYYY")).toISOString():null,
        false,
        name,
        des,
        others,
        vallues.length > 0 ? find_value_id(vallues): null,
        desP,
        ont,
        Number(totalbounti),
        idL,
        linkP,/*
        missions,
        mashaabims*/
     ).then((d) => (d = d));
    if (d.data != null) {
      console.log(d)
        success = true;
          before = true;
        loading = false;
        let data = {
          name: userName_value,
          action: 'יצר צורך חדש בשם:',
          det: `${name} והתיאור: ${desP}`
        };
        fetch('/api/ste', {
          method: 'POST', // or 'PUT'
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
          .then((response) => response)
          .then((data) => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
    } else {
      console.error(d);
      return 'error';
    }
  }

  let vallues = $state([]);
  let error1 = null;
  let addval = false;

  onMount(async () => {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };
    try {
      const res = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query {
  vallues (sort: "valueName:asc") {data{ id attributes{  valueName ${
    $lang == 'he' ? 'localizations{data{attributes{ valueName}} }' : ''
  }}}}
}
              `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
      vallues = res.data.vallues.data;
      if ($lang == 'he') {
        for (var i = 0; i < vallues.length; i++) {
          if (vallues[i].attributes.localizations.data.length > 0) {
            vallues[i].attributes.valueName =
              vallues[i].attributes.localizations.data[0].attributes.valueName;
          }
        }
      }
      vallues = vallues;
      newcontent = false;
    
    } catch (e) {
      error1 = e;
    }
  });

  let suc = $state(false);
  function find_value_id(value_name_arr) {
    var arr = [];
    for (let j = 0; j < value_name_arr.length; j++) {
      for (let i = 0; i < vallues.length; i++) {
        if (vallues[i].attributes.valueName === value_name_arr[j]) {
          arr.push(vallues[i].id);
        }
      }
    }
    return arr;
  }

  let selected = $state();
  const placeholder = `${$lang == 'he' ? 'ערכים ומטרות' : 'vallues and goals'}`;


  import { RingLoader } from 'svelte-loading-spinners';
  import RichText from '$lib/celim/ui/richText.svelte';
  import AddImg from '$lib/celim/icons/addImg.svelte';
  import Daterange from '$lib/celim/ui/daterange.svelte';
  import { crRatson } from '$lib/func/send/crratson.svelte';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import moment from 'moment';
  /** @type {{idL: any, userName_value: any}} */
  let { idL, userName_value } = $props();
  const closer = () => {
    pic = false;
    a = 0;
  };
  let psrc = $state()
  function callbackFunction(event) {
    a = 2;
    files = event.detail.files;
    let xst
     for (const value of files.values()) {
    console.log(value);
 xst = value
  }
  console.log(xst)   
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageUrl = e.target.result;
        // This will now log the base64 data URL
                psrc = imageUrl

            // Set the image source or perform other actions with the data
        };
        reader.readAsDataURL(xst);
    pic = false;
    suc = true;
  }
  let pic = $state(false)
  function openen() {
    pic = true;
  }

  async function newnew() {
    let meData = [];
    for (let i = 0; i < selected.length; i++) {
      if (!vallues.map((c) => c.attributes.valueName).includes(selected[i])) {
        //create new and update vallues
        console.log(selected, vallues);
        let link = baseUrl + '/graphql';
        let d = new Date();
        try {
          await fetch(link, {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: `mutation  createVallue {
  createVallue(data: {  valueName: "${selected[i]}",
        publishedAt: "${d.toISOString()}"}) {
    data {
      id
      attributes {
        valueName
      } 

       }
    }
}`
            })
          })
            .then((r) => r.json())
            .then((data) => (meData = data));
          const newOb = meData.data.createVallue.data;
          const newValues = vallues;
          newValues.push(newOb);

          vallues = newValues;
          let data = {
            name: userName_value,
            action: 'create ערך חדש בשם:',
            det: `${selected[i]}`
          };
          fetch('/api/ste', {
            method: 'POST', // or 'PUT'
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
            .then((response) => response)
            .then((data) => {
              console.log('Success:', data);
            })
            .catch((error) => {
              console.error('Error:', error);
            });
        } catch (error) {
          console.log('צריך לתקן:', error.response);
          error = error1;
          console.log(error1);
        }
      }
    }
  }

  let ugug = $state(``);
  
  let others = $state(false);
  let newcontent = $state(true);
  let addne = $derived({ he: `הוספת "${ugug}"`, en: `Create "${ugug}"` });
  const timeto = {
    he: 'כמה זמן עד שהריקמה תכניס כסף',
    en: 'how much time until the FreeMates will be profitable'
  };
  const timetoex = {
    he: 'חישוב הזמן עד שניתן יהיה לחלק כסף מרגע שאוישו כל המשימות ונתקבלו כל המשאבים הנדרשים',
    en: 'the time until money can be splited from when all of the missions has asigned and all the resources has accepted'
  };
  const cvar = {
    he: 'הריקמה כבר רווחית',
    en: 'the FreeMates is already profitable'
  };
  const week = { he: 'שבוע', en: 'week' };
  const month = { he: 'חודש', en: 'month' };
  const threemonth = { he: 'שלושה חודשים', en: 'three months' };
  const halt = { he: 'חצי שנה', en: 'half a year' };
  const year = { he: 'שנה', en: 'year' };
  const toyers = { he: 'שנתיים', en: 'two years' };
  const more = { he: 'יותר משנתיים', en: 'more then 2 years' };
  const never = { he: 'לעולם לא', en: 'never' };
  const om = { he: 'רק רגע בבקשה', en: 'one moment please' };
  const cencel = { he: 'ביטול', en: 'cencel' };
  const crn = { he: 'מהי משאלת הלב שלך?', en: 'what do you wish fot?' };
  const frn = { he: 'כותרת', en: 'name' };
  const hours = { he: 'שעות', en: 'hours' };
  const hrex = {
    he: 'לאחר זמן זה חוסר מענה יחשב כהסכמה',
    en: 'after that: non-voting will consider as agreement'
  };
  const hre = {
    he: 'זמן תגובה לקבלת החלטות',
    en: 'time to respond to voting'
  };
  const teure = { he: 'פירוט מלא', en: 'full description' };
  const teurek = { he: 'תיאור תמציתי', en: 'short description' };

  const wel = { he: 'לינק לאתר (אם יש)', en: 'link to a website (if any)' };
  let naex = $state({
    he: 'השם כבר קיים נא לבחור שם אחר',
    en: 'name already exists please try another name'
  });
  const whva = {
    he: 'תיוג ערכים ומטרות שהצורך מגשים',
    en: 'which vallues and goals this wish to fullfile'
  };
  const ladd = { he: 'הוספת תמונה', en: 'add pic' };
  const su = { he: 'לוגו נוסף בהצלחה', en: 'logo has successfully added' };
  const addn = { he: 'הוספת ערך חדש', en: 'Add new Vallue' };
  const cree = { he: 'ליצור ולפרסם ', en: 'Create and publish' };
  const sur = { he: 'רצונך נשלח בהצלחה כאשר יתקבלו הצעות אנחנו נשלח לך הודעה לצאט', en: 'your wish has created, you will get nutify for suggestions on the chat' };
  const tob = {
    he: 'כמה אחוז מהסכום שתעביר על צורך זה תרצה לתת ל-1💗1',
    en: 'how much (in percentege m the amount you will pay on this) you will want bring to 1💗1'
  };
  const inc = {
    he: 'הסכום שברצונך להעביר לאחר הגשמת הרצון שלך, אם אין ביכולתך לתת ניתן לרשום 0',
    en: 'the amount you want to give the people who will fulfild your wish, if you cannot give anything its possible to enter 0'
  };
</script>

{#if before == false}
<div
  class="a d overflow-auto max-h-[80vh] min-h-[79vh]"
>
  <div
    dir={$lang == 'en' ? 'ltr' : 'rtl'}
    class="jho flex flex-col items-center text-center justify-center"
  >
    <h1 class="text-gold">{crn[$lang]}</h1>
    <br />

    <div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="textinput">
      <input
        name="name"
        bind:value={name}
        type="text"
        class="input"
        required
      />
      <label
        style:right={$lang == 'he' ? '0' : 'none'}
        style:left={$lang == 'en' ? '0' : 'none'}
        for="name"
        class="label">{frn[$lang]}</label
      >
      <span class="line"></span>
    </div>
    {#if shgi == true}<small class="text-red-600 bg-slate-50"
        >{naex[$lang]}</small>{/if}

    <div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="textinput">
      <textarea
        name="es"
        bind:value={des}
        type="text"
        class="input d"
        required
      ></textarea>
      <label
        style:right={$lang == 'he' ? '0' : 'none'}
        style:left={$lang == 'en' ? '0' : 'none'}
        for="es"
        class="label">{teurek[$lang]}</label
      >
      <span class="line"></span>
    </div>
    <div class="w-full">
      <h2 class="text-barbi underline decoration-barbi">{teure[$lang]}</h2>
      <RichText bind:outpot={desP} />
    </div>

    <div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="textinput">
      <input name="de" bind:value={linkP} type="text" class="input" required />
      <label
        style:right={$lang == 'he' ? '0' : 'none'}
        style:left={$lang == 'en' ? '0' : 'none'}
        for="de"
        class="label">{wel[$lang]}</label
      >
      <span class="line"></span>
    </div>
    <br />
      {#if pic != true}
      <button
      title="{ladd[$lang]}"
      onclick={openen}
      class="border flex flex-row border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold rounded px-2 py-1"
      > <AddImg/>
      {#if psrc}
      <image class="rounded-full" height="40" width="40" src={psrc} alt="choosen image"/>
      {/if}
      </button>
  {:else}
  <div> <button
          class=" hover:bg-barbi text-mturk rounded-full"
          onclick={closer}>{cencel[$lang]}</button
        >
        {#if a == 0}
          <Uplad on:message={callbackFunction} />
        {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">{om[$lang]}</h3>
            <br />
            <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
            ></RingLoader>
          </div>
        {/if}
      </div>
  {/if}
      {#if suc == true}<small class="text-barbi">{su[$lang]}</small>{/if}

  <br>
      <div class="flex items-center justify-center border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold rounded px-2 py-1">
    <Daterange bind:start bind:finnish/>
  </div> 
  <br>
     <Chooser
      tr={{ he: 'רק שלי', en: 'relevant for me only' }}
      fl={{ he: 'פתוח לכל', en: 'everyone can join' }}
      level={{
        he: 'האם הצורך המבוקש הוא שלך בלבד או שנזמין עוד להצטרף ולחלוק בעלויות',
        en: 'those the FreeMates intend to be a one time think or a continouse one? for exmple: event production vs openting a production company'
      }}
      bind:checked={others}
    />
      <h3 class="midscreenText-2 text-center text-gold">
        {userName_value}
        {whva[$lang]}
        ?
      </h3>

      <div class="input-2">
        <MultiSelect
          createOptionMsg={addne[$lang]}
          allowUserOptions={'append'}
          loading={newcontent}
          bind:searchText={ugug}
          bind:selected
          {placeholder}
          options={vallues.map((c) => c.attributes.valueName)}
        />
      </div>
    <br />
    <div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">{hre[$lang]}</h2>
      <select
        class:round={$lang == 'he'}
        class:rounden={$lang == 'en'}
        bind:value={restime}
        class=" form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none"
      >
        <option value="feh" selected> 48 {hours[$lang]} </option>
        <option value="sth">72 {hours[$lang]} </option>
        <option value="nsh">96 {hours[$lang]} </option>
        <option value="sevend">{week[$lang]}</option>
      </select>
      <small style="color: turquoise;">{hrex[$lang]}</small>
    </div>
    
    <Chooser
      tr={{ he: 'תיבת אוצר', en: 'bounti' }}
      fl={{ he: 'אישרור של כל הוצאה בנפרד', en: "approve one by one" }}
      level={{
        he: 'האם ברצונך לאשרר ולשלם על כל הוצאה שתוצע כדי להגשים את משאלתך או להגדיר סכום שביכולתך לשלם והוא יחולק כאשר הביצוע יושלם ',
        en:"get asked for any amount needed to fullfild your wish or set an amount and it will be splited when your wish will fullfild"
      }}
      bind:checked={ont}
    />
    <!-- הדוגמה א טובה צריך לתת פתיחה של מסעדה מול אירוע חד פעמי, גם כדאי לשים בשורה נפרדת של הערות 
-->{#if ont == true}
      <NumberInput bind:value={totalbounti} topLebel={inc[$lang]} />
  {/if}
  </div>
  <div class="text-center justify-center items-center m-2 flex flex-row align-bottom">
   
    {#if loading == false}
      <button
        class="cursor-pointer transition-all bg-blue-500  px-6 py-2 rounded-lg
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] 
 border-barbi  bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2 "
        onclick={sendP}
        name="addm">{cree[$lang]}</button
      >
    {:else}
      <RingLoader size="100" color="#ff00ae" unit="px" duration="2s"
      ></RingLoader>
    {/if}
  </div>
</div>
{:else}
  <div class="aft">
    <h2 class="text-barbi">{sur[$lang]}</h2>
    <!--
    <button
      class="cursor-pointer transition-all bg-blue-500  px-6 py-2 rounded-lg
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] 
 border-barbi  bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2 "
      on:click={openForum}>{tob[$lang]}</button
    >-->
  </div>
{/if}
{#if success}
  <div
    style="
position: fixed;
top: -50px;
left: 0;
height: 100vh;
width: 100vw;
display: flex;
justify-content: center;
overflow: hidden;
pointer-events: none;"
  >
    <Confetti
      rounded
      size="30"
      x={[-5, 5]}
      y={[-5, 5]}
      delay={[0, 50]}
      amount="200"
      duration="10000"
      colorArray={[
        'url(https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png)'
      ]}
      fallDistance="100vh"
    /><!--colorRange={[0, 120]}-->
    <Confetti
      noGravity
      x={[-5, 5]}
      y={[-5, 5]}
      delay={[550, 550]}
      duration="10000"
      amount="2000"
      colorRange={[120, 240]}
      fallDistance="100vh"
    />
    <Confetti
      noGravity
      x={[-5, 5]}
      y={[-5, 5]}
      delay={[1000, 1050]}
      duration="10000"
      amount="200"
      colorRange={[240, 360]}
      fallDistance="100vh"
    />
    <Confetti
      x={[-5, 5]}
      y={[0, 0.1]}
      delay={[500, 2000]}
      duration="5000"
      amount="200"
    />
  </div>
{/if}

<style>
  textarea::-webkit-resizer {
    border-width: 8px;
    border-style: solid;
    border-color: transparent transparent var(--gold) var(--gold);
  }

  .a {
    background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    height: 100%;
  }
  select.round {
    background-image: linear-gradient(
        315deg,
        transparent 50%,
        rgb(0, 174, 255) 50%
      ),
      linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
      radial-gradient(#ddd 70%, transparent 72%);
    background-position:
      calc(0% + 20px) calc(1em + 2px),
      calc(0% + 15px) calc(1em + 2px),
      calc(0% + 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
  }

  select.round:focus {
    background-image: linear-gradient(315deg, white 50%, transparent 50%),
      linear-gradient(225deg, transparent 50%, white 50%),
      radial-gradient(gray 70%, transparent 72%);
    background-position:
      calc(0% + 15px) 1em,
      calc(0% + 20px) 1em,
      calc(0% + 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
    border-color: green;
    outline: 0;
  }
  select.rounden {
    background-image: linear-gradient(45deg, transparent 50%, gray 50%),
      linear-gradient(135deg, gray 50%, transparent 50%),
      radial-gradient(#ddd 70%, transparent 72%);
    background-position:
      calc(100% - 20px) calc(1em + 2px),
      calc(100% - 15px) calc(1em + 2px),
      calc(100% - 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
  }

  select.rounden:focus {
    background-image: linear-gradient(45deg, white 50%, transparent 50%),
      linear-gradient(135deg, transparent 50%, white 50%),
      radial-gradient(gray 70%, transparent 72%);
    background-position:
      calc(100% - 15px) 1em,
      calc(100% - 20px) 1em,
      calc(100% - 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
    border-color: green;
    outline: 0;
  }
  .sp {
    display: grid;
    justify-content: center;
    align-items: center;
  }
  .aft {
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .cen {
    margin: 0 auto;
  }
  .jho {
    width: 50%;
    margin: 0 auto;
  }
  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--gold);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--gold);
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  .label {
    font-size: 15px;
    position: absolute;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--gold);
    user-select: none;
  }

  .line {
    height: 2px;
    background-color: #2196f3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line {
    width: 100%;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 14px;
    color: turquoise;
    top: 0;
  }
  .input:focus,
  .input:valid {
    border: 0;
  }

  @media (max-width: 600px) {
    .textinput {
      position: relative;
      width: 100%;
      display: block;
    }
    .jho {
      width: 90%;
      margin: 0 auto;
    }
  }
  @media (min-width: 601px) {
    .d::-webkit-scrollbar {
      width: 17px;
    }
  }

  h1 {
    font-size: 29px;
  }
  img.bg {
    min-height: 100%;
    min-width: 1024px;
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
  }

  @media screen and (max-width: 1024px) {
    /* Specific to this particular image */
    img.bg {
      left: 50%;
      margin-left: -512px; /* 50% */
    }
  }
</style>
