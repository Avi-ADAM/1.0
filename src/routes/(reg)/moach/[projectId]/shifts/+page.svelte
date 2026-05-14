<script>
  import Sidur from '$lib/components/prPr/sidur/sidur.svelte';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'משמרות' : $lang === 'ar' ? 'مناوبات' : 'Shifts'} · 1lev1</title>
</svelte:head>

<div class="shifts-page bg-[#02ffbb] p-4 rounded-xl overflow-auto">
  <Sidur />
</div>
