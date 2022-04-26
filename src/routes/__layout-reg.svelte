<script>
import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
  import { onMount } from 'svelte';
let isAuthed = false;
let token;
onMount(async () => {
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  if(cookieValue !== null){
      const tok = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
    token  = tok;     
}
    
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
<div class="a  bg-gradient-to-br from-gra to-grb">
    <div class="b border border-barbi">
<h1 class="text-lturk font-bold text-2xl p-2">הגעת לעמוד הדורש הרשמה</h1>
<div class="flex flex-row flex-auto justify-between">
<button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4 rounded-full" on:click={reg}>להרשמה</button>
<button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4 rounded-full" on:click={login}>להתחברות</button>
</div></div></div>
{/if}
<style>
    .b{
        display: grid;
        align-items: center;
        justify-content: center;
    }
    .a{
      
        height: 100vh;
        width: 100vw;
         display: grid;
        align-items: center;
        justify-content: center;
    }
</style>
