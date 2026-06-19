<script>
  import { isRtl } from '$lib/translations';
  import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
  import { show } from './store-show.js';
  import { valluss } from './valluss.js';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import jvals from '$lib/data/vallues.json';
  import enjvals from '$lib/data/valluesEn.json';
  /**
   * @typedef {Object} Props
   * @property {string} [userName_value]
   * @property {number} [show_value]
   * @property {(payload: {tx: number, txx: number}) => void} [onProgres]
   */
  /** @type {Props} */
  let {
    userName_value = $bindable(),
    show_value = $bindable(0),
    onProgres
  } = $props();

  let vallues = $state([]);
  let error1 = null;
  let newcontent = $state(false);

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
    selected = [...new Set(mapped)];
    if (mapped.length === ids.length) seedComplete = true;
  });

  onMount(async () => {
    if ($lang == 'he') {
      vallues = jvals;
    } else if ($lang == 'en') {
      vallues = enjvals;
    }
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) return resp;
      return parseJSON(resp).then((resp) => { throw resp; });
    };

    try {
      const res = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const seen = new Set();
      freshVallues = freshVallues.filter((v) => {
        const name = v.attributes?.valueName;
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
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

  import tr from '$lib/translations/tr.json';

  let selected = $state([]);
  const placeholder = tr.reg.valuesPlaceholder[$lang];

  userName.subscribe((value) => { userName_value = value; });
  show.subscribe((newValue) => { show_value = newValue; });

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
        let link = baseUrl + '/graphql';
        let d = new Date();
        try {
          await fetch(link, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
          const newOb = meData?.data?.createVallue?.data;
          if (!newOb) {
            console.warn('[vallues] createVallue returned no data', meData?.errors);
            continue;
          }
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch((error) => { console.error('Error:', error); });
        } catch (error) {
          console.log('צריך לתקן:', error.response);
          error = error1;
        }
      }
    }
    valluss.set(find_value_id(selected));
  }

  let ugug = $state('');
  let addn = $derived({ he: `הוספת "${ugug}"`, en: `Create "${ugug}"` });

  const what = {
    he: 'אלו ערכים ומטרות ברצונך לקדם?',
    en: 'which values you wish to promote?'
  };
  const info = {
    he: 'כאשר העבודה שלך מגשימה את הערכים ומקדמת את המטרות שלך היא הופכת ליצירה מהנה, אנו נסייע לך לקדם את הערכים והמטרות שלך',
    en: 'When your work aligns with your values and advances your goals, it becomes enjoyable creation. We will assist you in promoting your values and goals.'
  };
</script>

<div class="step-inner" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h2 class="step-title">{userName_value}&nbsp;{what[$lang]}</h2>
  <p class="step-desc">{info[$lang]}</p>
  <div class="multi-wrap">
    <MultiSelect
      liSelectedStyle="z-index: 1000;"
      --sms-width="100%"
      outerDivClass="!bg-gold !text-barbi"
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
  <div class="nav-row">
    <button class="btn-nav btn-back" onclick={back} disabled={show_value <= 1}>
      {$lang === 'en' ? '← Back' : 'חזרה →'}
    </button>
    <button class="btn-nav btn-skip" onclick={toend}>
      {$lang === 'en' ? 'Skip' : 'דלג'}
    </button>
    <button class="btn-nav btn-next" onclick={increment}>
      {$lang === 'en' ? 'Next →' : '← הבא'}
    </button>
  </div>
</div>

<style>
  .step-inner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    width: 100%;
  }

  .step-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #c8860a;
    text-align: center;
    line-height: 1.4;
    margin: 0;
  }

  .step-desc {
    font-family: 'Heebo', sans-serif;
    font-size: 0.82rem;
    color: #7a5e00;
    text-align: center;
    background: rgba(255, 248, 220, 0.75);
    border: 1.5px solid rgba(218, 165, 32, 0.28);
    border-radius: 12px;
    padding: 9px 14px;
    line-height: 1.55;
    margin: 0;
  }

  .multi-wrap {
    width: 100%;
    position: relative;
    z-index: 50;
  }

  .nav-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 4px;
  }

  .btn-nav {
    font-family: 'Heebo', sans-serif;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    border-radius: 99px;
    white-space: nowrap;
  }

  .btn-back {
    padding: 8px 16px;
    background: rgba(255, 248, 220, 0.7);
    border: 1.5px solid rgba(218, 165, 32, 0.38);
    color: #7a5e00;
    font-size: 0.8rem;
  }
  .btn-back:not(:disabled):hover {
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(218, 165, 32, 0.65);
  }
  .btn-back:disabled {
    opacity: 0.32;
    cursor: default;
  }

  .btn-next {
    padding: 9px 20px;
    background: linear-gradient(135deg, #daa520, #e91e8c);
    border: none;
    color: #fff;
    font-size: 0.85rem;
    box-shadow: 0 3px 12px rgba(218, 165, 32, 0.3);
  }
  .btn-next:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 18px rgba(218, 165, 32, 0.42);
  }

  .btn-skip {
    padding: 7px 12px;
    background: transparent;
    border: 1.5px dashed rgba(218, 165, 32, 0.42);
    color: #9a6b10;
    font-size: 0.72rem;
  }
  .btn-skip:hover {
    border-style: solid;
    background: rgba(255, 215, 0, 0.08);
  }

  :global(.multi-wrap .options) {
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
