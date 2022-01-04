<script>
import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
  import { onMount } from 'svelte';
let isAuthed = false;
let token;
onMount(async () => {
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
    token  = cookieValue; 
if (token){
    isAuthed = true
}
});
function reg (){
    goto("/",)
}
function login () { 
    goto ("/login",)
}
</script>


{#if isAuthed}
    <slot />
{:else}
<h1>הגעת לעמוד הדורש הרשמה</h1>
<button class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded" on:click={reg}>להרשמה</button>
<button class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded" on:click={login}>להתחברות</button>
{/if}