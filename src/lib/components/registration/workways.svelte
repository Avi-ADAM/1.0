<script>
  import { isRtl, t } from '$lib/translations';
  import WorkwaySelector from '$lib/components/ui/WorkwaySelector.svelte';
  import { userName } from '../../stores/store.js';
  import { show } from './store-show.js';
  import { workways1 } from './workways1.js';
  import { ww } from '$lib/components/prPr/mi.js';
  import { lang } from '$lib/stores/lang.js';

  let { onProgres } = $props();

  let selected = $state([]);

  let userName_value = $state();
  let show_value = $state(0);

  userName.subscribe((value) => { userName_value = value; });
  show.subscribe((newValue) => { show_value = newValue; });

  // Seed `selected` from the stored ids once the shared catalog has loaded,
  // mapping each id to its current-language name — same pattern as the other
  // steps. WorkwaySelector (VocabSelector) owns the catalog, creation,
  // moderation and duplicate detection.
  let seedComplete = $state(false);
  $effect(() => {
    if (seedComplete) return;
    const ids = $workways1;
    if (!ids || ids.length === 0 || !$ww || $ww.length === 0) return;
    const mapped = ids
      .map((workwayId) => {
        const w = $ww.find((item) => item.id == workwayId);
        if (!w) return null;
        let name = w.attributes?.workWayName || '';
        if ($lang === 'he' && w.attributes?.localizations?.data?.length > 0) {
          name = w.attributes.localizations.data[0].attributes.workWayName;
        }
        return name;
      })
      .filter(Boolean);
    if (mapped.length === 0) return;
    selected = [...new Set(mapped)];
    if (mapped.length === ids.length) seedComplete = true;
  });

  function find_workway_id(workway_arr) {
    var arr = [];
    for (let j = 0; j < workway_arr.length; j++) {
      for (let i = 0; i < $ww.length; i++) {
        let name = $ww[i].attributes?.workWayName || '';
        let heName = name;
        if ($ww[i].attributes?.localizations?.data?.length > 0) {
          heName = $ww[i].attributes.localizations.data[0].attributes.workWayName;
        }
        if (name === workway_arr[j] || heName === workway_arr[j]) {
          arr.push($ww[i].id);
          break;
        }
      }
    }
    return arr;
  }

  function saveToStore() {
    workways1.set(find_workway_id(selected));
  }

  function increment() {
    saveToStore();
    show.update((n) => n + 1);
    onProgres?.({ tx: 0, txx: 8 });
  }
  function toend() {
    saveToStore();
    show.set(5);
    onProgres?.({ tx: 0, txx: 8 });
  }
  function back() {
    saveToStore();
    show.update((n) => n - 1);
    onProgres?.({ tx: 0, txx: 16 });
  }

  const ws = {
    he: 'מה הם העדפות היצירה שלך?',
    en: 'How do you prefer to Create?'
  };
</script>

<div class="step-inner" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h2 class="step-title">{userName_value}&nbsp;{ws[$lang]}</h2>
  <div class="multi-wrap">
    <WorkwaySelector bind:selectedWorkways={selected} color="--gold" />
  </div>
  <div class="nav-row">
    <button class="btn-nav btn-back" onclick={back} disabled={show_value <= 1}>
      {$t('reg.back')}
    </button>
    <button class="btn-nav btn-skip" onclick={toend}>
      {$t('reg.skip')}
    </button>
    <button class="btn-nav btn-next" onclick={increment}>
      {$t('reg.next')}
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
