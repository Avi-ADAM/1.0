<script>
  import { isRtl } from '$lib/translations';
  import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
  import { show } from './store-show.js';
  import { workways1 } from './workways1.js';
  import { onMount } from 'svelte';
  import jwork from '$lib/data/workways.json';
  import enjwork from '$lib/data/workwaysEn.json';
  import { lang } from '$lib/stores/lang.js';

  let { onProgres } = $props();
  let newcontent = $state(true);
  let workways2 = $state([]);
  let error1 = null;
  const baseUrl = import.meta.env.VITE_URL;

  onMount(async () => {
    if ($lang == 'he') {
      workways2 = jwork;
    } else if ($lang == 'en') {
      workways2 = enjwork;
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
  workWays(sort: "workWayName") {data{ id attributes{workWayName  ${$lang == 'he' ? 'localizations {data{attributes{workWayName}} }' : ''}}
}}}
              `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
      let freshWorkways = res.data.workWays.data;
      if ($lang == 'he') {
        for (var i = 0; i < freshWorkways.length; i++) {
          if (freshWorkways[i].attributes.localizations.data.length > 0) {
            freshWorkways[i].attributes.workWayName =
              freshWorkways[i].attributes.localizations.data[0].attributes.workWayName;
          }
        }
      }
      const seenW = new Set();
      freshWorkways = freshWorkways.filter((w) => {
        const name = w.attributes?.workWayName;
        if (!name || seenW.has(name)) return false;
        seenW.add(name);
        return true;
      });
      workways2 = freshWorkways;

      const currentWorkways = $workways1;
      if (currentWorkways && currentWorkways.length > 0) {
        const workwayNames = currentWorkways
          .map((workwayId) => {
            const workway = workways2.find((w) => w.id == workwayId);
            return workway ? workway.attributes.workWayName : null;
          })
          .filter(Boolean);
        selected = workwayNames;
      }

      newcontent = false;
    } catch (e) {
      error1 = e;
    }
  });

  function find_workway_id(workway_arr) {
    var arr = [];
    for (let j = 0; j < workway_arr.length; j++) {
      for (let i = 0; i < workways2.length; i++) {
        if (workways2[i].attributes.workWayName === workway_arr[j]) {
          arr.push(workways2[i].id);
        }
      }
    }
    return arr;
  }

  import tr from '$lib/translations/tr.json';

  let selected = $state([]);
  const placeholder = tr.reg.workwaysPlaceholder[$lang];

  let userName_value = $state();
  let show_value = 0;

  userName.subscribe((value) => { userName_value = value; });
  show.subscribe((newValue) => { show_value = newValue; });

  function increment() {
    newnew();
    show.update((n) => n + 1);
    onProgres?.({ tx: 0, txx: 8 });
  }
  function toend() {
    newnew();
    show.set(5);
    onProgres?.({ tx: 0, txx: 8 });
  }
  function back() {
    newnew();
    show.update((n) => n - 1);
    onProgres?.({ tx: 0, txx: 16 });
  }

  let meData = $state();
  async function newnew() {
    for (let i = 0; i < selected.length; i++) {
      if (!workways2.map((c) => c.attributes.workWayName).includes(selected[i])) {
        let d = new Date();
        let link = baseUrl + '/graphql';
        try {
          await fetch(link, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `mutation  createWorkWay {
  createWorkWay(data: {  workWayName: "${selected[i]}",
        publishedAt: "${d.toISOString()}"
           }) {
    data {
      id
      attributes {
        workWayName ${$lang == 'he' ? 'localizations { data {attributes{workWayName} }}' : ''}
      }
       }
    }
}`
            })
          })
            .then((r) => r.json())
            .then((data) => (meData = data));
          const newOb = meData.data.createWorkWay.data;
          const newValues = workways2;
          newValues.push(newOb);
          workways2 = newValues;
          const newN = meData.data.createWorkWay.data.attributes.workWayName;
          let userName_value = $userName;
          let datau = {
            name: userName_value,
            action: 'create דרך יצירה חדשה בשם:',
            det: newN
          };
          fetch('/api/ste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datau)
          }).catch((error) => { console.error('Error:', error); });
        } catch (error) {
          console.log('צריך לתקן:', error.response);
          error = error1;
        }
      }
    }
    workways1.set(find_workway_id(selected));
  }

  let searchText = $state('');
  let addn = $derived({
    he: `הוספת "${searchText}"`,
    en: `Create "${searchText}"`
  });

  const ws = {
    he: 'מה הם העדפות היצירה שלך?',
    en: 'How do you prefer to Create?'
  };
</script>

<div class="step-inner" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h2 class="step-title">{userName_value}&nbsp;{ws[$lang]}</h2>
  <div class="multi-wrap">
    <MultiSelect
      --sms-width="100%"
      outerDivClass="!bg-gold !text-barbi"
      inputClass="!bg-gold !text-barbi"
      liSelectedClass="!bg-barbi !text-gold"
      createOptionMsg={addn[$lang]}
      allowUserOptions={'append'}
      loading={newcontent}
      bind:searchText
      bind:selected
      {placeholder}
      options={[...new Set(workways2.map((c) => c.attributes.workWayName).filter(Boolean))]}
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
    gap: 14px;
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
