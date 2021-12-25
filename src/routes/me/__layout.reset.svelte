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
<button on:click={reg}>להרשמה</button>
<button on:click={login}>להתחברות</button>
{/if}