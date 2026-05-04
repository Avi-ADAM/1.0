<script>
  import { lang } from '$lib/stores/lang.js';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import { onMount } from 'svelte';

  let { data } = $props();

  let projectBase = $derived(data.projectBase);
  let vallues = $derived(projectBase?.vallues?.data || []);

  const i18n = {
    he: { vap: 'ערכי הפרויקט' },
    en: { vap: 'Project Values' },
    ar: { vap: 'قيم المشروع' }
  };

  let t = $derived(i18n[$lang] || i18n.en);

  let innerWidth = $state(0);
</script>

<svelte:window bind:innerWidth />

<div class="space-y-8">
  {#if projectBase}
    {#if projectBase.publicDescription}
      <section id="description" class="bg-white p-6 rounded-xl shadow-sm">
        <RichText editable={false} outpot={projectBase.publicDescription} />
      </section>
    {/if}

    {#if projectBase.descripFor}
      <section class="bg-white p-6 rounded-xl shadow-sm border-t-4 border-primary">
        <RichText editable={false} outpot={projectBase.descripFor} />
      </section>
    {/if}

    {#if vallues.length > 0}
      <section class="bg-white p-6 rounded-xl shadow-sm">
        <h2 class="text-xl font-bold text-primary mb-4">{t.vap}</h2>
        <div class="flex flex-wrap justify-center gap-2 p-4 bg-gray-50 rounded-lg border border-gold">
          {#each vallues as vallue}
            <Tile
              bg="gold"
              sm={innerWidth > 500}
              big={innerWidth > 500}
              word={vallue.attributes.valueName}
            />
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
