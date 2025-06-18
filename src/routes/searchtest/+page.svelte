<!-- src/routes/Search.svelte -->
<script>
  import { preventDefault } from 'svelte/legacy';

  import Succses from "$lib/celim/icons/succses.svelte";
  import Button from "$lib/celim/ui/button.svelte";
import TextInput from "$lib/celim/ui/input/textInput.svelte";
  import RichText from "$lib/celim/ui/richText.svelte";

    let searchText = $state('');
    let existingMissions = $state([]);
  
    let newMissions = $state([]);
  
  let loading = $state(false);
  
  let error = $state(false);
  
  let succses = $state(false);
  
    async function handleSubmit() {
      loading = true
      const response = await fetch(`/api/missionsfromtext?text=${encodeURIComponent(searchText)}`);
      const result = await response.json();
      if (response.ok) {
        console.log(result);
        existingMissions = result.existingMissions.missions.data;
        newMissions = result.newMissions;
        loading = false
        succses = true
      } else {
        loading = false
        error = true
        console.error(result.error);
      }
    }
  </script>
  <div dir="rtl"	class="flex flex-col items-center justify-center bg-barbi h-screen">
  <form onsubmit={preventDefault(handleSubmit)}>
    <div class="w-[50vw] flex flex-col space-y-2">
    <TextInput  bind:text={searchText} lebel={{"he":"מה הצורך שלך","en":"what you need"}} />
    <Button {loading} {error} {succses} on:click={handleSubmit}>תציעו לי</Button>

    </div>
  </form>
  {#if succses}
  <h3  class="text-gold">משימות קיימות באתר 1💗1 שכדאי להשתמש בהן:</h3>
  <ul>
    {#key existingMissions}
    {#each existingMissions as mission}
      <li class="text-gold">{mission.attributes.missionName}: {mission.attributes.descrip}</li>
    {/each}
    {/key}
  </ul>
  
  <h3  class="text-gold">משימות שכדאי להוסיף וליצור:</h3>
  <ul>
    {#key newMissions}
    {#each newMissions as mission}
      <li  class="text-gold">{mission.title}: {mission.description}</li>
    {/each}
    {/key}
  </ul>
  {/if}
</div>