<script>
  import { isRtl } from '$lib/translations';
  import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
  import { show } from './store-show.js';
  import { roles2 } from './roles2.js';
  import { onMount } from 'svelte';
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

  import { lang } from '$lib/stores/lang.js';
  import jroles from '$lib/data/tafkidim.json';
  import enjrole from '$lib/data/tafkidimEn.json';
  import tr from '$lib/translations/tr.json';
  let roles1 = $state([]);
  let error1 = null;
  const baseUrl = import.meta.env.VITE_URL;

  function find_role_id(role_name_arr) {
    var arr = [];
    for (let j = 0; j < role_name_arr.length; j++) {
      for (let i = 0; i < roles1.length; i++) {
        if (roles1[i].attributes.roleDescription === role_name_arr[j]) {
          arr.push(roles1[i].id);
        }
      }
    }
    return arr;
  }
  let newcontent = $state(true);

  onMount(async () => {
    if ($lang == 'he') {
      roles1 = jroles;
    } else if ($lang == 'en') {
      roles1 = enjrole;
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
  tafkidims(sort: "roleDescription") { data { id attributes{ roleDescription  ${$lang == 'he' ? 'localizations {data {attributes{roleDescription } }}' : ''}}
}
}
}
              `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
      let freshRoles = res.data.tafkidims.data;
      if ($lang == 'he') {
        for (var i = 0; i < freshRoles.length; i++) {
          if (freshRoles[i].attributes.localizations.data.length > 0) {
            freshRoles[i].attributes.roleDescription =
              freshRoles[i].attributes.localizations.data[0].attributes.roleDescription;
          }
        }
      }
      const seenR = new Set();
      freshRoles = freshRoles.filter((r) => {
        const name = r.attributes?.roleDescription;
        if (!name || seenR.has(name)) return false;
        seenR.add(name);
        return true;
      });
      roles1 = freshRoles;

      const currentRoles = $roles2;
      if (currentRoles && currentRoles.length > 0) {
        const roleNames = currentRoles
          .map((roleId) => {
            const role = roles1.find((r) => r.id == roleId);
            return role ? role.attributes.roleDescription : null;
          })
          .filter(Boolean);
        selected = roleNames;
      }

      newcontent = false;
    } catch (e) {
      error1 = e;
    }
  });

  let selected = $state([]);
  const placeholder = tr.reg.rolesPlaceholder[$lang];

  userName.subscribe((value) => { userName_value = value; });
  show.subscribe((newValue) => { show_value = newValue; });

  function increment() {
    newnew();
    show.update((n) => n + 1);
    onProgres?.({ tx: 0, txx: 11 });
  }
  function toend() {
    newnew();
    show.set(5);
    onProgres?.({ tx: 0, txx: 4 });
  }
  function back() {
    newnew();
    show.update((n) => n - 1);
    onProgres?.({ tx: 0, txx: 20 });
  }

  let meData = $state();
  async function newnew() {
    for (let i = 0; i < selected.length; i++) {
      if (!roles1.map((c) => c.attributes.roleDescription).includes(selected[i])) {
        let link = baseUrl + '/graphql';
        let d = new Date();
        try {
          await fetch(link, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `mutation  createTafkidim {
  createTafkidim(data: {  roleDescription: "${selected[i]}",
        publishedAt: "${d.toISOString()}"}) {
    data {
      id
      attributes {
        roleDescription
      }
       }
    }
}`
            })
          })
            .then((r) => r.json())
            .then((data) => (meData = data));
          const newOb = meData.data.createTafkidim.data;
          const newValues = roles1;
          newValues.push(newOb);
          roles1 = newValues;
          let userName_value = $userName;
          let data = {
            name: userName_value,
            action: 'create תפקיד חדש בשם:',
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
    roles2.set(find_role_id(selected));
  }

  let ugug = $state('');
  let addn = $derived({
    he: `${tr.selector.addPrefix.he} "${ugug}"`,
    en: `${tr.selector.addPrefix.en} "${ugug}"`,
    ar: `${tr.selector.addPrefix.ar} "${ugug}"`
  });
  const what = tr.reg.rolesQuestion;
</script>

<div class="step-inner" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h2 class="step-title">{userName_value}&nbsp;{what[$lang]}</h2>
  <div class="multi-wrap">
    <MultiSelect
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
      options={[...new Set(roles1.map((c) => c.attributes.roleDescription).filter(Boolean))]}
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
