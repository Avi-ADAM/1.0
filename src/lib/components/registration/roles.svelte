<script>
  import { isRtl } from '$lib/translations';
  import RoleSelector from '$lib/components/ui/RoleSelector.svelte';
  import { userName } from '../../stores/store.js';
  import { lang } from '$lib/stores/lang.js';
  import { show } from './store-show.js';
  import { roles2 } from './roles2.js';
  import { role } from '$lib/components/prPr/mi.js';
  import tr from '$lib/translations/tr.json';
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

  let selected = $state([]);

  userName.subscribe((value) => { userName_value = value; });
  show.subscribe((newValue) => { show_value = newValue; });

  // Seed `selected` from the stored ids (existing profile + AI-confirmed) once
  // the shared catalog has loaded, mapping each id to its current-language name
  // — same pattern as the skills step. RoleSelector (VocabSelector) owns the
  // catalog, creation, moderation, translation and duplicate detection.
  let seedComplete = $state(false);
  $effect(() => {
    if (seedComplete) return;
    const ids = $roles2;
    if (!ids || ids.length === 0 || !$role || $role.length === 0) return;
    const mapped = ids
      .map((roleId) => {
        const r = $role.find((item) => item.id == roleId);
        if (!r) return null;
        let name = r.attributes?.roleDescription || '';
        if ($lang === 'he' && r.attributes?.localizations?.data?.length > 0) {
          name = r.attributes.localizations.data[0].attributes.roleDescription;
        }
        return name;
      })
      .filter(Boolean);
    if (mapped.length === 0) return;
    selected = mapped;
    if (mapped.length === ids.length) seedComplete = true;
  });

  function find_role_id(role_name_arr) {
    var arr = [];
    for (let j = 0; j < role_name_arr.length; j++) {
      for (let i = 0; i < $role.length; i++) {
        let name = $role[i].attributes?.roleDescription || '';
        let heName = name;
        if ($role[i].attributes?.localizations?.data?.length > 0) {
          heName = $role[i].attributes.localizations.data[0].attributes.roleDescription;
        }
        if (name === role_name_arr[j] || heName === role_name_arr[j]) {
          arr.push($role[i].id);
          break;
        }
      }
    }
    return arr;
  }

  function saveToStore() {
    roles2.set(find_role_id(selected));
  }

  function increment() {
    saveToStore();
    show.update((n) => n + 1);
    onProgres?.({ tx: 0, txx: 11 });
  }
  function toend() {
    saveToStore();
    show.set(5);
    onProgres?.({ tx: 0, txx: 4 });
  }
  function back() {
    saveToStore();
    show.update((n) => n - 1);
    onProgres?.({ tx: 0, txx: 20 });
  }

  const what = tr.reg.rolesQuestion;
</script>

<div class="step-inner" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h2 class="step-title">{userName_value}&nbsp;{what[$lang]}</h2>
  <div class="multi-wrap">
    <RoleSelector bind:selectedRoles={selected} color="--gold" />
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
