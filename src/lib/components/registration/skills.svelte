<script>
  import SkillSelector from '$lib/components/ui/SkillSelector.svelte';
  import { userName } from '../../stores/store.js';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { page } from '$app/state';

  import { show } from './store-show.js';
  import { skills1 } from './skills1.js';
  import { onMount } from 'svelte';
  import { skil } from '$lib/components/prPr/mi.js';
  import Skip from '$lib/celim/icons/skip.svelte';

  let { onProgres } = $props();

  let selected = $state([]);
  let userName_value = $state();
  let show_value = 0;

  // Subscribe to stores
  userName.subscribe((value) => {
    userName_value = value;
  });

  show.subscribe((newValue) => {
    show_value = newValue;
  });

  onMount(() => {
    // Load previously selected skills from store and map IDs to strings
    const currentSkills = $skills1;
    if (
      currentSkills &&
      currentSkills.length > 0 &&
      $skil &&
      $skil.length > 0
    ) {
      selected = currentSkills
        .map((skillId) => {
          const s = $skil.find((item) => item.id == skillId);
          if (s) {
            let name = s.attributes?.skillName || '';
            if (
              $lang === 'he' &&
              s.attributes?.localizations?.data?.length > 0
            ) {
              name = s.attributes.localizations.data[0].attributes.skillName;
            }
            return name;
          }
          return null;
        })
        .filter(Boolean);
    }
  });

  // Map strings back to IDs and save before navigating
  function find_skill_id(skill_name_arr) {
    var arr = [];
    for (let j = 0; j < skill_name_arr.length; j++) {
      for (let i = 0; i < $skil.length; i++) {
        let name = $skil[i].attributes?.skillName || '';
        let heName = name;
        if ($skil[i].attributes?.localizations?.data?.length > 0) {
          heName =
            $skil[i].attributes.localizations.data[0].attributes.skillName;
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
    // SkillSelector automatically creates new items on the server
    // and adds them to $skil, so we just need to find their IDs here.
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

  // Assets and text
  const srca = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg'
  };
  const srcb = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg'
  };
</script>

<h1 class="midscreenText-2">
  {userName_value}
  <br />
  {$t('auth.registration.skills.question')}
</h1>

<div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="input-2">
  <!-- Integration of the new SkillSelector -->
  <div style="width: var(--multiselect-width, 80vw); max-width: 600px;">
    <SkillSelector bind:selectedSkills={selected} color="--gold" />
  </div>
</div>

<button class="button-in-1-2" onclick={back}>
  <img alt="go" style="height:15vh;" src={srca[$lang]} />
</button>

<button
  class="button-end bg-sturk p-1 rounded-full"
  onclick={toend}
  title={$t('auth.registration.skills.skipToEnd')}
>
  <Skip />
</button>

<button class="button-2" onclick={increment}>
  <img alt="go" style="height:15vh;" src={srcb[$lang]} />
</button>

<style>
  .midscreenText-2 {
    transition: all 1s ease-in;
    grid-column: 1 /5;
    grid-row: 1/ 2;
    align-self: center;
    justify-self: center;
    font-size: 1.8rem;
    line-height: normal;
    text-shadow: 1px 1px purple;
    color: var(--barbi-pink);
    margin-top: 12vh;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
    background-size: 18rem 6rem;
    height: 6rem;
    width: 18rem;
    text-align: center;
    padding-top: 0.65rem;
    -webkit-text-size-adjust: 100%;
  }
  @media (min-width: 501px) {
    :global([data-svelte-dialog-overlay].content) {
      z-index: 700;
      width: 50vw;
    }
  }
  @media (max-width: 500px) {
    :global([data-svelte-dialog-overlay].content) {
      z-index: 700;
      width: 80vw;
    }
    .midscreenText-2 {
      background-size: 12rem 4rem;
      height: 4rem;
      width: 12rem;
      font-size: 0.75rem;
      margin-top: 14vh;
    }
    .input-2 {
      grid-column: 2/4;
      grid-row: 2/3;
      align-self: center;
      justify-self: center;
      display: flex;
      justify-content: center;
      --multiselect-width: 80vw;
    }
  }
  .input-2-2 {
    grid-column: 1/5;
    grid-row: 5/6;
    text-align: center;
    margin: 0 auto;
  }
  .button-in-1-2 {
    grid-column: 1/2;
    grid-row: 8/9;
    align-self: center;
    justify-self: center;
  }
  .button-2 {
    grid-column: 4/5;
    grid-row: 8/9;
    align-self: center;
    justify-self: center;
  }
  .button-end {
    grid-column: 2/4;
    grid-row: 8/9;
    align-self: center;
    justify-self: center;
  }

  .input-2 {
    grid-column: 2/4;
    grid-row: 2/3;
    text-align: center;
    margin-top: -4vh;
    align-self: center;
    justify-self: center;
    display: flex;
    justify-content: center;
    --multiselect-width: 25vw;
  }
</style>
