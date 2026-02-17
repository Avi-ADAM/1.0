<script>
  import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
  import { lang } from '$lib/stores/lang.js';
  import { page } from '$app/state';

  import { show } from './store-show.js';
  import { skills1 } from './skills1.js';
  import { onMount } from 'svelte';
  import jskill from '$lib/data/skills.json';
  import enjskill from '$lib/data/skillsen.json';
  let skills2 = $state([]);
  let error1 = null;
  let addskil = 0;
  const baseUrl = import.meta.env.VITE_URL;
  let { onProgres } = $props();
  let newcontent = $state(true);
  onMount(async () => {
    if ($lang == 'he') {
      skills2 = jskill;
    } else if ($lang == 'en') {
      skills2 = enjskill;
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
    const headers = {
      'Content-Type': 'application/json'
    };

    try {
      const res = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query {
  skills (sort: "skillName") { data{ id attributes{ skillName ${$lang == 'he' ? 'localizations { data {attributes{skillName} }}' : ''}}
}
} }
              `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
      skills2 = res.data.skills.data;
      if ($lang == 'he') {
        for (var i = 0; i < skills2.length; i++) {
          if (skills2[i].attributes.localizations.data.length > 0) {
            skills2[i].attributes.skillName =
              skills2[i].attributes.localizations.data[0].attributes.skillName;
          }
        }
      }
      skills2 = skills2;
      console.log(skills2);

      // טעינת הכישורים שנבחרו בעבר
      const currentSkills = $skills1;
      if (currentSkills && currentSkills.length > 0) {
        const skillNames = currentSkills
          .map((skillId) => {
            const skill = skills2.find((s) => s.id == skillId);
            return skill ? skill.attributes.skillName : null;
          })
          .filter(Boolean);
        selected = skillNames;
      }

      newcontent = false;
    } catch (e) {
      error1 = e;
    }
  });

  function find_skill_id(skill_name_arr) {
    var arr = [];
    for (let j = 0; j < skill_name_arr.length; j++) {
      for (let i = 0; i < skills2.length; i++) {
        if (skills2[i].attributes.skillName === skill_name_arr[j]) {
          arr.push(skills2[i].id);
        }
      }
    }
    return arr;
  }

  let selected = $state([]);
  const placeholder = `${$lang == 'he' ? 'הכישורים שלי' : 'My skills'}`;

  let userName_value = $state();
  let show_value = 0;

  // טעינת הנתונים מה-store כשהקומפוננט נטען
  onMount(() => {
    const currentSkills = $skills1;
    if (currentSkills && currentSkills.length > 0 && skills2.length > 0) {
      // המרת מזהים חזרה לשמות כישורים
      const skillNames = currentSkills
        .map((skillId) => {
          const skill = skills2.find((s) => s.id == skillId);
          return skill ? skill.attributes.skillName : null;
        })
        .filter(Boolean);
      selected = skillNames;
    }
  });

  userName.subscribe((value) => {
    userName_value = value;
  });

  show.subscribe((newValue) => {
    show_value = newValue;
  });

  function increment() {
    newnew();
    show.update((n) => n + 1);
    onProgres?.({ tx: 0, txx: 16 });
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

  import Skip from '$lib/celim/icons/skip.svelte';

  let meData = [];
  async function newnew() {
    for (let i = 0; i < selected.length; i++) {
      if (!skills2.map((c) => c.attributes.skillName).includes(selected[i])) {
        //create new and update skills
        console.log(selected, skills2);
        let link = baseUrl + '/graphql';
        let d = new Date();
        try {
          await fetch(link, {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: `mutation  createSkill {
  createSkill(data: {  skillName: "${selected[i]}",
        publishedAt: "${d.toISOString()}"}) {
    data {
      id
      attributes {
        skillName
      }

       }
    }
}`
            })
          })
            .then((r) => r.json())
            .then((data) => (meData = data));
          const newOb = meData.data.createSkill.data;
          // יצירת מערך חדש במקום שינוי הקיים - חשוב לריאקטיביות
          skills2 = [...skills2, newOb];
          let userName_value = $userName;
          let data = {
            name: userName_value,
            action: 'create כישור חדש בשם:',
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
          error1 = error;
          console.log(error1);
        }
      }
    }
    const skillIds = find_skill_id(selected);
    console.log('Selected skills:', selected);
    console.log('Found skill IDs:', skillIds);
    console.log('Current skills2:', skills2);
    skills1.set(skillIds);
    console.log('Updated skills1:', $skills1);
  }

  let ugug = $state(``);

  let addn = $derived({ he: `הוספת "${ugug}"`, en: `Create "${ugug}"` });
  const srca = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg'
  };
  const srcb = {
    he: 'https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg',
    en: 'https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg'
  };
  const ws = { he: 'מה הן היכולות והכישורים שלך?', en: 'What you can do?' };
  const skipt = {
    he: 'דילוג לסוף ההרשמה, ניתן יהיה להוסיף את הפרטים בכל עת מעמוד הפרופיל',
    en: 'skip to end of registration, you can always add those details from your profile page'
  };
</script>

<h1 class="midscreenText-2">
  {userName_value}
  <br />
  {ws[$lang]}
</h1>
<div dir={$lang == 'en' ? 'ltr' : 'rtl'} class="input-2">
  <MultiSelect
    loading={newcontent}
    --sms-width="var(--multiselect-width)"
    outerDivClass="!bg-gold !text-barbi"
    inputClass="!bg-gold !text-barbi"
    liSelectedClass="!bg-barbi !text-gold"
    createOptionMsg={addn[$lang]}
    allowUserOptions={'append'}
    bind:searchText={ugug}
    bind:selected
    {placeholder}
    options={skills2.map((c) => c.attributes.skillName)}
  />
</div>
<button class="button-in-1-2" onclick={back}>
  <img alt="go" style="height:15vh;" src={srca[$lang]} />
</button>
<button
  class="button-end bg-sturk p-1 rounded-full"
  onclick={toend}
  title={skipt[$lang]}
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
      --multiselect-width: 30vw;
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
    --multiselect-width: auto;
  }
</style>
