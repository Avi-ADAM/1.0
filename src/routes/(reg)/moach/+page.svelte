<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { idPr } from '$lib/stores/idPr.js';
  import { lang } from '$lib/stores/lang.js';
  import CrNewProject from '$lib/celim/icons/crNewProject.svelte';
  interface Project {
    id: string;
    projectName: string;
    profilePic: string | null;
  }

  let { data }: { data: { projects: Project[] } } = $props();

  const choo = { he: 'בחירת ריקמה', en: 'choose FreeMate' };
  const createNewRikma = { he: 'יצירת ריקמה חדשה', en: 'Create new FreeMate' };

  onMount(() => {
    if ($idPr && $idPr !== 0) {
      goto(`/moach/${$idPr}`);
    }
  });

  function selectProject(id: string) {
    goto(`/moach/${id}`);
    idPr.set(id);
  }
</script>

<svelte:head>
  <title>{{ he: 'הריקמות שלי', en: 'My Projects', ar: 'مشاريعي' }[$lang] ?? 'My Projects'} · 1lev1</title>
</svelte:head>

<div
  class="alli bg-[radial-gradient(circle_at_50%,theme(colors.slate.400),theme(colors.slate.500)_10%,theme(colors.slate.600)_20%,theme(colors.slate.800),theme(colors.slate.900),#19031d)]"
></div>

<div class="border-2 border-barbi rounded m-4 p-4">
  <h1
    class="text-barbi underline text-2xl decoration-lturk font-bold py-2 px-4 mb-4 text-center rounded-full"
  >
    {choo[$lang]}
  </h1>
  <div class="flex flex-wrap justify-center items-center gap-4">
    {#each data.projects as project}
      {#if project}
        <button
          class="group relative overflow-hidden border-2 border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-gray-700 hover:text-gold p-2 m-1 rounded-xl shadow-lg shadow-fuchsia-400 hover:shadow-2xl hover:shadow-fuchsia-400 transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
          onclick={() => selectProject(project.id)}
        >
          <span class="text-base font-semibold text-center leading-tight"
            >{project.projectName}</span
          >
          {#if project.profilePic}
            <div
              class="w-6 h-6 rounded-full overflow-hidden ring-2 ring-gold/30 group-hover:ring-gold transition-all duration-300 flex-shrink-0"
            >
              <img
                src={project.profilePic}
                alt={`${project.projectName} logo`}
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          {:else}
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-barbi flex items-center justify-center ring-2 ring-gold/30 group-hover:ring-gold transition-all duration-300 flex-shrink-0"
            >
              <span class="text-xl font-bold text-white"
                >{project.projectName.charAt(0).toUpperCase()}</span
              >
            </div>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
</div>

<div class="flex justify-center items-center pb-64">
  <button
    class="inline-flex items-center gap-2 border-2 border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-3 px-6 m-4 rounded-full shadow-md shadow-fuchsia-400 hover:shadow-2xl hover:shadow-fuchsia-400 transition-all"
    onclick={() => goto('/me?action=createproject')}
    title={createNewRikma[$lang]}
  >
    <CrNewProject />
    <span class="text-lg md:text-xl">{createNewRikma[$lang]}</span>
  </button>
</div>

<style>
  .alli {
    /*   background: radial-gradient(circle at 0.9% 49.5%, rgb(0, 250, 255) 0%, rgb(2, 255, 187) 100.2%); */
    /*  background: radial-gradient(
      circle at 0.9%,
      rgb(2, 255, 187) 0%,
      rgb(238 232 170) 50%,
      rgb(2, 255, 187) 100.2%
    );*/
    z-index: -1;
    min-width: 100vw;
    min-height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
  }
</style>
