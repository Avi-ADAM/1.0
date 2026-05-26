<script>
  import { page } from '$app/state';
  import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
  import { show } from './store-show.js';
  import { valluss } from './valluss.js';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import jvals from '$lib/data/vallues.json';
  import enjvals from '$lib/data/valluesEn.json';
  /**
   * Callback prop:  כאשר יש שינוי התקדמות.
   * @typedef {Object} Props
   * @property {string} [userName_value]
   * @property {number} [show_value]
   * @property {(payload: {tx: number, txx: number}) => void} [onProgres]
   */
  /**
   * @type {Props}
   */
  let {
    userName_value = $bindable(),
    show_value = $bindable(0),
    onProgres
  } = $props();
  import Skip from '$lib/celim/icons/skip.svelte';
  import Tile from '$lib/celim/tile.svelte';
  let vallues = $state([]);
  let error1 = null;
  // Start false — local JSON is immediately available so no initial spinner.
  // A background Strapi fetch refreshes options (including newly-created entries).
  let newcontent = $state(false);

  // Reactive seeding from $valluss IDs → names (mirrors the pattern in skills.svelte).
  // Runs whenever $valluss changes OR vallues list updates (e.g. after Strapi fetch).
  let seedComplete = $state(false);
  $effect(() => {
    if (seedComplete) return;
    const ids = $valluss;
    if (!ids || ids.length === 0) return;
    if (!vallues || vallues.length === 0) return;
    const mapped = ids
      .map((vallueId) => {
        const v = vallues.find((item) => item.id == vallueId);
        if (!v) return null;
        return v.attributes?.valueName || null;
      })
      .filter(Boolean);
    if (mapped.length === 0) return;
    // Deduplicate to prevent each_key_duplicate inside svelte-multiselect
    selected = [...new Set(mapped)];
    // Mark complete only when every requested ID was resolved so we retry
    // after the Strapi fetch if some IDs were missing from the local JSON.
    if (mapped.length === ids.length) seedComplete = true;
  });

  onMount(async () => {
    // Seed from local JSON immediately so options are available with no delay.
    if ($lang == 'he') {
      vallues = jvals;
    } else if ($lang == 'en') {
      vallues = enjvals;
    }
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query {
  vallues (sort: "valueName:asc", pagination: { limit: 1000 }){
    data{
      id
      attributes {valueName ${$lang == 'he' ? 'localizations{ data { attributes{ valueName } } }' : ''}}
}
}
}
              `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
      let freshVallues = res.data.vallues.data;
      if ($lang == 'he') {
        for (var i = 0; i < freshVallues.length; i++) {
          if (freshVallues[i].attributes.localizations?.data?.length > 0) {
            freshVallues[i].attributes.valueName =
              freshVallues[i].attributes.localizations.data[0].attributes.valueName;
          }
        }
      }
      // Deduplicate by valueName so the options array never contains duplicate
      // strings — svelte-multiselect uses option values as keys and throws
      // each_key_duplicate when two items share the same display name.
      const seen = new Set();
      freshVallues = freshVallues.filter((v) => {
        const name = v.attributes?.valueName;
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
      // Updating vallues triggers the $effect above to re-seed only if
      // seedComplete is still false (i.e. some IDs were absent from local JSON
      // because they were just created during the CV review step).
      // If seedComplete is already true, the $effect short-circuits and user
      // edits are preserved.
      vallues = freshVallues;
    } catch (e) {
      error1 = e;
    }
  });

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

  let selected = $state([]);
  const placeholder = `${$lang == 'he' ? ' בחירת ערכים ומטרות' : 'vallues and goals'}`;

  userName.subscribe((value) => {
    userName_value = value;
  });

  show.subscribe((newValue) => {
    show_value = newValue;
  });

  function increment() {
    newnew();
    show.update((n) => n + 1);
    onProgres?.({ tx: 0, txx: 20 });
  }
  function toend() {
    newnew();
    show.set(5);
    onProgres?.({ tx: 0, txx: 4 });
  }

  function back() {
    newnew();
    show.update((n) => n - 1);
    onProgres?.({ tx: 600, txx: 20 });
  }

  const baseUrl = import.meta.env.VITE_URL;

  let meData = [];
  async function newnew() {
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
          // Guard: GraphQL might return errors instead of data
          const newOb = meData?.data?.createVallue?.data;
          if (!newOb) {
            console.warn('[vallues] createVallue returned no data', meData?.errors);
            continue;
          }
          // Avoid duplicates — the item may already be in the list if it was
          // fetched from Strapi concurrently or created in a previous call.
          const alreadyExists = vallues.some(
            (v) => v.id == newOb.id || v.attributes?.valueName === newOb.attributes?.valueName
          );
          if (alreadyExists) continue;
          const newValues = vallues;
          newValues.push(newOb);

          vallues = newValues;
          let userName_value = $userName;
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
    valluss.set(find_value_id(selected));
    console.log($valluss);
  }

  let ugug = $state(``);

  const srca = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg'
  };
  const srcb = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg'
  };
  let addn = $derived({ he: `הוספת "${ugug}"`, en: `Create "${ugug}"` });
  const what = {
    he: 'אלו ערכים ומטרות ברצונך לקדם?',
    en: 'which vallues you wish to promote?'
  };
  const skipt = {
    he: 'דילוג לסוף ההרשמה, ניתן יהיה להוסיף את הפרטים בכל עת מעמוד הפרופיל',
    en: 'skip to end of registration, you can always add those details from your profile page'
  };
  const info = {
    he: 'כאשר העבודה שלך מגשימה את הערכים ומקדמת את המטרות שלך היא הופכת ליצירה מהנה, אנו נסייע לך לקדם את הערכים והמטרות שלך',
    en: 'When your work aligns with your values and advances your goals, it becomes enjoyable creation. We will assist you in promoting your values and goals.'
  };
  let focused = $state(false);
</script>

{#if (!focused && !page.data.isDesktop) || page.data.isDesktop}
  <h1 class="midscreenText-2" dir={$lang == 'en' ? 'ltr' : 'rtl'}>
    {userName_value}
    <br />
    {what[$lang]}
  </h1>
{/if}
{#if (!focused && !page.data.isDesktop) || page.data.isDesktop}
  <div class="info">
    <Tile
      word={info[$lang]}
      big={page.data.isDesktop}
      bg="gold"
      animate={true}
      sm={page.data.isDesktop}
    />
  </div>
{/if}
<div
  class="input-2"
  dir={$lang == 'en' ? 'ltr' : 'rtl'}
  onfocusin={() => (focused = true)}
  onfocusout={() => (focused = false)}
>
  <MultiSelect
    liSelectedStyle="z-index: 1000;"
    --sms-width="var(--multiselect-width)"
    outerDivClass="!bg-gold !text-barbi {page.data.isDesktop ? '' : '!mx-auto'}"
    inputClass="!bg-gold !text-barbi"
    liSelectedClass="!bg-barbi !text-gold"
    createOptionMsg={addn[$lang]}
    allowUserOptions={'append'}
    loading={newcontent}
    bind:searchText={ugug}
    bind:selected
    {placeholder}
    options={[...new Set(vallues.map((c) => c.attributes.valueName).filter(Boolean))]}
  />
</div>

<button class="button-in-2" onclick={back}>
  <img alt="go" style="height:15vh;" src={srcb[$lang]} />
</button>
<button
  class="button-end bg-sturk p-1 rounded-full"
  onclick={toend}
  title={skipt[$lang]}
>
  <Skip />
</button>
<button class="button-2" onclick={increment}>
  <img alt="go" style="height:15vh;" src={srca[$lang]} />
</button>

<style>
  .midscreenText-2 {
    transition: all 1s ease-in;
    grid-column: 1 /5;
    grid-row: 1/ 2;
    align-self: center;
    justify-self: center;
    font-size: 1.5rem;
    line-height: normal;
    text-shadow: 1px 1px purple;
    color: var(--barbi-pink);
    margin-top: 12vh;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
    background-size: 18rem 6rem;
    height: 6rem;
    width: 18rem;
    text-align: center;
    padding: 0.65rem 1rem 0rem 1rem;
    -webkit-text-size-adjust: 100%;
  }
  @media (max-width: 500px) {
    .midscreenText-2 {
      background-size: 12rem 4rem;
      height: 4rem;
      width: 12rem;
      font-size: 0.75rem;
      margin-top: 14vh;
    }
    .input-2 {
      grid-column: 2/4;
      grid-row: 3/4;
      margin-top: 5px;
      align-self: center;
      justify-self: center;
      display: flex;
      justify-content: center;
      --multiselect-width: 80vw;
    }
    .info {
      grid-column: 2/4;
      grid-row: 2/3;
      margin-top: 5px;
      align-self: center;
      justify-self: center;
    }
    /* Keep the gold back/skip/next arrows reachable when the multiselect
       grows past the viewport on small screens. */
    .button-in-2,
    .button-2,
    .button-end {
      position: sticky;
      bottom: 8px;
      z-index: 5;
    }
  }
  .button-in-2 {
    grid-column: 1/2;
    grid-row: 5 / 6;
    align-self: center;
    justify-self: center;
  }
  .button-2 {
    grid-column: 4/5;
    grid-row: 5 / 6;
    align-self: center;
    justify-self: center;
  }
  .button-end {
    grid-column: 2/4;
    grid-row: 5 / 6;
    align-self: center;
    justify-self: center;
  }
  .input-2 {
    grid-column: 2 / 4;
    grid-row: 3 / 4;
    align-self: center;
    justify-self: center;
    display: flex;
    justify-content: center;
    --multiselect-width: auto;
    position: relative;
    z-index: 100;
  }
  .info {
    grid-column: 2 / 4;
    grid-row: 2 / 3;
    align-self: center;
    justify-self: center;
    position: relative;
    z-index: 1;
  }
  .input-2-2 {
    grid-column: 1 / 5;
    grid-row: 5 / 6;
    text-align: center;
  }
  /* Dropdown opens DOWNWARD so it stays on-screen on mobile.
     z-index is kept high so it floats above the sticky navigation buttons. */
  :global(.input-2 .options) {
    top: 100% !important;
    bottom: auto !important;
    margin-top: 5px !important;
    margin-bottom: 0 !important;
    max-height: 40vh !important;
    overflow-y: auto !important;
    z-index: 9999 !important;
    background: var(--gold) !important;
    border: 2px solid var(--barbi-pink) !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18) !important;
  }
</style>
