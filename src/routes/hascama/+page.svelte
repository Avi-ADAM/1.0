<script>
  import { fbl } from '$lib/stores/fbl.js';

  import { lang } from '$lib/stores/lang.js';
  import { goto } from '$app/navigation';
  import Mobile from '$lib/components/front/mobile.svelte';
  import { userName } from '$lib/stores/store.js';
  import Amana1 from '$lib/components/main/amana.svelte';
  import { regHelper } from '$lib/stores/regHelper.js';
  import { onMount } from 'svelte';
  import { email } from '$lib/components/registration/email.js';
  import { linkos } from '$lib/stores/linkos.js';
  import { fpval } from '$lib/components/registration/fpval.js';
  import { t } from '$lib/translations';

  let user = 0;

  onMount(async () => {
    if (document.cookie) {
      const unt = document.cookie
        .split('; ')
        .find((row) => row.startsWith('un='));
      if (unt != null) {
        const un = document.cookie
          .split('; ')
          .find((row) => row.startsWith('un='))
          .split('=')[1];
        userName.set(decodeURIComponent(un));
      }
      const regt = document.cookie
        .split('; ')
        .find((row) => row.startsWith('id='));
      if (regt != null) {
        const reg = document.cookie
          .split('; ')
          .find((row) => row.startsWith('id='))
          .split('=')[1];

        user = reg;
      }
      const cookieValuet = document.cookie
        .split('; ')
        .find((row) => row.startsWith('email='));
      if (cookieValuet != null) {
        const cookieValue = document.cookie
          .split('; ')
          .find((row) => row.startsWith('email='))
          .split('=')[1];
        email.set(cookieValue);
        goto('/signup');
        return;
      }
      const cookieValueti = document.cookie
        .split('; ')
        .find((row) => row.startsWith('await='));
      if (cookieValueti != null) {
        goto('/signup/check-email');
        return;
      }
    }
    if (user > 0) {
      goto('/lev');
    }
    //console.log(emaili)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('service-worker.js', {
          scope: '/'
        })
        .then(function (reg) {
          // registration worked
          console.log('Registration succeeded. Scope is ' + reg.scope);
        })
        .catch(function (error) {
          // registration failed
          console.log('Registration failed with ' + error);
        });
    }
  });

  let regHelperL = $state(-1);

  regHelper.subscribe((value) => {
    regHelperL = value;
  });

  // regHelperL === 1 means the signature was recorded and we are on our way to
  // /signup. Without this the page rendered nothing at all — a bare hearts
  // background — whenever that navigation did not land.
  let signupHref = $derived(
    $fpval ? `/signup?fp=${encodeURIComponent($fpval)}` : '/signup'
  );

  /*function toggle() {

regHelperL = 0;
    show.set(0);
    regHelper.set(0)

}*/
  function reportExit(event) {
    if ($fbl == true) {
      let data = {
        name: `${$userName}  who speak ${$lang}`,
        action: `${regHelperL == 1 ? 'sing' : 'not sign'} and mail = ${$email}`,
        data: $linkos
      }; //username email projectname projectsrc lang openmissionName
      fetch('/api/ste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        keepalive: true
      })
        .then((response) => response)
        .then((data) => {
          console.log('Success:', data);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  }
</script>

<svelte:head>
  <title>{$lang === 'he' ? 'הסכמה · 1lev1' : 'Agreement · 1lev1'}</title>
  <meta
    name="description"
    content={$lang === 'he'
      ? 'הצהרת העקרונות של 1lev1 — חיים בחופש, בהסכמה הדדית ובלי אלימות'
      : '1lev1 principles declaration — living in freedom, mutual agreement and without violence'}
  />
  <meta
    property="og:title"
    content={$lang === 'he' ? 'הסכמה · 1lev1' : 'Agreement · 1lev1'}
  />
  <meta
    property="og:description"
    content={$lang === 'he'
      ? 'הצהרת העקרונות של 1lev1 — חיים בחופש, בהסכמה הדדית ובלי אלימות'
      : '1lev1 principles declaration — living in freedom, mutual agreement and without violence'}
  />
  <meta property="og:type" content="website" />
  <script>
    nl_pos = 'br';
    nl_color = 'pink';
    nl_compact = '1';
    nl_accordion = '1';
  </script>
  <script src="https://1lev1.com/nagishli.js?v=2.3" charset="utf-8" defer>
  </script>
</svelte:head>

<svelte:window onbeforeunload={reportExit} />

<div class="main">
  <!--{#if user > 0}
{ goto("/lev", )}
{:else}-->
  {#if regHelperL == 0}
    <Amana1 />
  {:else if regHelperL == -1}
    <Mobile />
  {:else}
    <div class="handoff">
      <div class="handoff-heart">💗</div>
      <h2>{$t('home.amana.redirect.title')}</h2>
      <p>{$t('home.amana.redirect.hint')}</p>
      <a class="handoff-link" href={signupHref}
        >{$t('home.amana.redirect.link')}</a
      >
    </div>
  {/if}
</div>

<style>
  :root {
    --primary-light: #a6f9d6;
    --primary: #5be2a9;
    --primary-dark: #53ce9a;
    --secondary: #1e2145;
    --white: #fff;
    --grey: #e6e6ff;
    --grey-dark: #6d7098;
    --red: #ff6b6b;
  }

  *,
  *:after,
  *:before {
    box-sizing: border-box;
  }

  .handoff {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
    background: rgba(26, 10, 46, 0.85);
    color: #fff;
    font-family: 'Rubik', sans-serif;
  }

  .handoff-heart {
    font-size: 3rem;
    animation: handoffBeat 1.6s ease-in-out infinite;
  }

  @keyframes handoffBeat {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
  }

  .handoff h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #ffd700;
  }

  .handoff p {
    margin: 0;
    max-width: 32ch;
    color: rgba(255, 255, 255, 0.8);
  }

  .handoff-link {
    padding: 0.85rem 2rem;
    border-radius: 15px;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    color: #fff;
    font-weight: 700;
    text-decoration: none;
  }

  @media (min-width: 1100px) {
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      box-sizing: border-box;
      margin: 0px;
      background-image: url(https://res.cloudinary.com/love1/image/upload/v1639597594/Prismatic-Hearts-World-Map-4_ge7z9u.svg);
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
    }
  }

  @media (max-width: 1099px) {
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }

  @media (max-width: 720px) {
    .main {
      flex: 1;
      display: flex;
      width: 100vw;
      padding: 0;
    }
  }
</style>
