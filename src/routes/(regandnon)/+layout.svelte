<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Toaster } from 'svelte-sonner';

  import { lang } from '$lib/stores/lang.js';
  // import { getAnalytics } from "firebase/analytics";
  import { initialForum, forum } from '$lib/stores/pendMisMes.js';
  import Foot from '$lib/components/footer/foot.svelte';
  import { initialWebS } from '$lib/stores/pendMisMes.js';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { initialWebSP } from '$lib/stores/pgishot.js';

  /**
   * @typedef {Object} Props
   * @property {any} data
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { data, children } = $props();
  let isAuthed = $state(false);
  onMount(async () => {
    const cookieRe = document.cookie
      .split('; ')
      .find((row) => row.startsWith('when='));
    if (cookieRe != null) {
      const cookieR = document.cookie
        .split('; ')
        .find((row) => row.startsWith('when='))
        .split('=')[1];
      const today = Date.now();
      if (new Date(cookieR + 2592000000).getTime() < today) {
        goto('login');
      }
    }
    if (data.tok) {
      console.log('auted');
      isAuthed = true;
      initialForum(true, [], data.uid);
      console.log(data.uid, $forum);
      initialWebS(data.tok, data.uid);
      initialWebSP(data.tok, data.uid);
    } else {
      // jwt is httpOnly now; rely on server-provided token or the 'when' cookie for auth flag
      const cookieT = document.cookie
        .split('; ')
        .find((row) => row.startsWith('when='))
        ?.split('=')[1];
      if (cookieT != null) {
        isAuthed = true;
      }
    }
  });
</script>

{#if $showFoot}
  <main class="h-screen min-w-screen absolute top-0 left-0">
    <Foot un={data?.un} idL={data?.uid} />
    <Toaster
      toastOptions={{
        style: `dir: ${$lang == 'en' ? 'ltr' : 'rtl'}; text-align: ${$lang == 'en' ? 'left' : 'right'}; `
      }}
      richColors
      closeButton
      position="top-center"
    />
  </main>
{/if}
{@render children?.()}
