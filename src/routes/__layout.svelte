<script context="module">
  import { t, locale, locales, loadTranslations } from '$lib/translations';
  export const load = async ({ url }) => {
    const { pathname } = url;
    const defaultLocale = 'he'; // get from cookie / user session etc...
    const initLocale = locale.get() || defaultLocale; 
    await loadTranslations(initLocale, pathname); // keep this just before the `return`
    return {};
  }
</script>

<script>

import "../app.postcss";

</script>


<main>
	<slot />
</main>
<style>
</style>