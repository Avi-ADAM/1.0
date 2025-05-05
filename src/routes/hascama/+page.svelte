<svelte:head>
<script>
nl_pos="br";
nl_color="pink";
nl_compact="1";
nl_accordion="1"; 
</script> 
<script src="https://1lev1.com/nagishli.js?v=2.3"
charset="utf-8"
defer> 
</script> 
</svelte:head>

<script>
  import { preventDefault } from 'svelte/legacy';

  import {
    liUN
  } from '$lib/stores/liUN.js';
  import {
    fbl
  } from '$lib/stores/fbl.js';

  import {
    lang
  } from '$lib/stores/lang.js'
  import {
    page
  } from '$app/stores'
  import {
    goto
  } from '$app/navigation';
  import Mobile from '$lib/components/front/mobile.svelte'
  import {
    userName
  } from '$lib/stores/store.js';
  import Amana1 from "$lib/components/main/amana.svelte"
  import One from "$lib/components/main/bein.svelte"
  import {
    show
  } from '$lib/components/registration/store-show.js';
  import {
    contriesi
  } from '$lib/components/registration/contries.js';
  import {
    fpval
  } from '$lib/components/registration/fpval.js';
  import {
    regHelper
  } from '$lib/stores/regHelper.js';
  import {
    onMount
  } from 'svelte';
  import {
    email
  } from '$lib/components/registration/email.js'
  import {
    linkos
  } from '$lib/stores/linkos.js'

  let idx = $state(1);
  let error;
  const baseUrl = import.meta.env.VITE_URL

  let user = 0;

  let kvar = $state();
  onMount(async () => {
    const x = $page.url.searchParams.get('ref')
    if (x != null) {
      userName.set($page.url.searchParams.get('un'))
      kvar = $page.url.searchParams.get('em');
      email.set($page.url.searchParams.get('em'));
      //cuontry freeppid
      document.cookie = `email=${$page.url.searchParams.get('em')}; expires=` + new Date(2026, 0, 1).toUTCString();
      document.cookie = `un=${encodeURIComponent($page.url.searchParams.get('un'))}; expires=` + new Date(2026, 0, 1).toUTCString();
      liUN.set(decodeURIComponent($page.url.searchParams.get('un')));
      const array = $page.url.searchParams.get('con').split(',');

      contriesi.set(array)
      regHelper.set(1);
      fpval.set($page.url.searchParams.get('id'))
      console.log(x, kvar, user, $contriesi)
    }
    if (document.cookie) {
      const unt = document.cookie
        .split('; ')
        .find(row => row.startsWith('un='))
      if (unt != null) {
        const un = document.cookie
          .split('; ')
          .find(row => row.startsWith('un='))
          .split('=')[1];
        userName.set(decodeURIComponent(un));
      }
      const regt = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
      if (regt != null) {
        const reg = document.cookie
          .split('; ')
          .find(row => row.startsWith('id='))
          .split('=')[1];

        user = reg;
      }
      const cookieValuet = document.cookie
        .split('; ')
        .find(row => row.startsWith('email='))
      if (cookieValuet != null) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('email='))
          .split('=')[1];
        kvar = cookieValue;
        email.set(cookieValue);
      }
      const cookieValueti = document.cookie
        .split('; ')
        .find(row => row.startsWith('await='))
      if (cookieValueti != null) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('await='))
          .split('=')[1];
        kvar = true
        show.set(6)
      }
    }
    if (user > 0) {
      goto("/lev", )
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js', {
        scope: '/'
      }).then(function(reg) {
        console.log('Registration succeeded. Scope is ' + reg.scope);
      }).catch(function(error) {
        console.log('Registration failed with ' + error);
      });
    };
    let error1, fppp
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
      'Content-Type': 'application/json',
    };

    try {
      const res = await fetch(baseUrl+"/graphql", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `query {
  chezins { 
   meta {
      pagination {
        total
      }
    }
  }
}
        `
          })
        }).then(checkStatus)
        .then(parseJSON);
      fppp = res.data.chezins
      idx = fppp.meta.pagination.total
    } catch (e) {
      error1 = e
    }
  });

  let regHelperL = $state(-1);

  regHelper.subscribe(value => {
    regHelperL = value;
  });

  function beforeUnload(event) {
    if ($fbl == true) {
      event.returnValue = null;
      let data = {
        name: `${$userName} who speak ${$lang}`,
        action: `${regHelperL == 1 ? "sing": "not sign"} and mail = ${$email}`,
        data: $linkos
      }
      fetch('/api/ste', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        .then((response) => response)
        .then((data) => {
          console.log('Success:', data);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
    return null
  }
</script>

<svelte:window onbeforeunload={preventDefault(beforeUnload)}/>

<div class="main flex flex-col w-full h-screen box-border m-0 bg-center bg-no-repeat bg-cover" 
    style="background-image: url('https://res.cloudinary.com/love1/image/upload/v1639597594/Prismatic-Hearts-World-Map-4_ge7z9u.svg');">
  {#if kvar}
    <One {idx} />
  {:else}
    {#if regHelperL == 1}
      <One {idx} />
    {:else if regHelperL == 0}
      <Amana1 {idx} />
    {:else if regHelperL == -1}
      <Mobile />
    {/if}
  {/if}
</div>

<style>
:global(.multiselect) {
  color: #02a2ff;
}

:global(li.selected) {
  border: var(--sms-focus-border, 1pt solid var(--sms-active-color, cornflowerblue));
}

:global(li:not(:global(.selected)):hover) {
  color: #FF0092;
}

:global(li.active) {
  color: #EEE8AA;
}

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
</style>
