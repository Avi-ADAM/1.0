<script>
  import Amana1 from '$lib/components/main/amanar.svelte';
  import One from '$lib/components/main/bein.svelte';
  import { regHelper } from '$lib/stores/regHelper.js';
  import { onMount } from 'svelte';
  import { userName } from '$lib/stores/store.js';
  import { email } from '$lib/components/registration/email.js';
  import { show } from '$lib/components/registration/store-show.js';
  import { goto } from '$app/navigation';

  let idx = $state(1);
  let user = $state();
  let kvar = $state();

  let regHelperL = $state(0);
  regHelper.subscribe((value) => {
    regHelperL = value;
  });

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
        kvar = cookieValue;
        email.set(cookieValue);
      }
      const cookieValueti = document.cookie
        .split('; ')
        .find((row) => row.startsWith('await='));
      if (cookieValueti != null) {
        kvar = true;
        show.set(1);
      }
    }
    if (user > 0) {
      goto('/lev');
    }
  });
</script>

<svelte:head>
  <title>اتفاقية الأمن والسلام العالمي</title>
</svelte:head>

<div class="main">
  {#if kvar || regHelperL == 1}
    <One {idx} />
  {:else}
    <Amana1 {idx} />
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
