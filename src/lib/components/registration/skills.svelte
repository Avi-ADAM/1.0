<script>
  import { isRtl } from '$lib/translations';
  import SkillSelector from '$lib/components/ui/SkillSelector.svelte';
  import { userName } from '../../stores/store.js';
  import { lang } from '$lib/stores/lang.js';
  import { show } from './store-show.js';
  import { skills1 } from './skills1.js';
  import { onMount } from 'svelte';
  import { skil } from '$lib/components/prPr/mi.js';

  let { onProgres } = $props();

  let selected = $state([]);
  let userName_value = $state();
  let show_value = 0;

  userName.subscribe((value) => { userName_value = value; });
  show.subscribe((newValue) => { show_value = newValue; });

  let seedComplete = $state(false);
  $effect(() => {
    if (seedComplete) return;
    const ids = $skills1;
    if (!ids || ids.length === 0 || !$skil || $skil.length === 0) return;
    const mapped = ids
      .map((skillId) => {
        const s = $skil.find((item) => item.id == skillId);
        if (!s) return null;
        let name = s.attributes?.skillName || '';
        if ($lang === 'he' && s.attributes?.localizations?.data?.length > 0) {
          name = s.attributes.localizations.data[0].attributes.skillName;
        }
        return name;
      })
      .filter(Boolean);
    if (mapped.length === 0) return;
    selected = mapped;
    if (mapped.length === ids.length) seedComplete = true;
  });

  function find_skill_id(skill_name_arr) {
    var arr = [];
    for (let j = 0; j < skill_name_arr.length; j++) {
      for (let i = 0; i < $skil.length; i++) {
        let name = $skil[i].attributes?.skillName || '';
        let heName = name;
        if ($skil[i].attributes?.localizations?.data?.length > 0) {
          heName = $skil[i].attributes.localizations.data[0].attributes.skillName;
        }
        if (name === skill_name_arr[j] || heName === skill_name_arr[j]) {
          arr.push($skil[i].id);
          break;
        }
      }
    }
    return arr;
  }

  function saveToStore() {
    const skillIds = find_skill_id(selected);
    skills1.set(skillIds);
  }

  function increment() {
    saveToStore();
    show.update((n) => n + 1);
    onProgres?.({ tx: 0, txx: 16 });
  }
  function toend() {
    saveToStore();
    show.set(5);
    onProgres?.({ tx: 0, txx: 4 });
  }
  function back() {
    saveToStore();
    show.update((n) => n - 1);
    onProgres?.({ tx: 600, txx: 20 });
  }

  import tr from '$lib/translations/tr.json';
  const ws = tr.reg.skillsQuestion;
</script>

<div class="step-inner" dir={$isRtl ? 'rtl' : 'ltr'}>
  <h2 class="step-title">{userName_value}&nbsp;{ws[$lang]}</h2>
  <div class="multi-wrap">
    <SkillSelector bind:selectedSkills={selected} color="--gold" />
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
</style>
