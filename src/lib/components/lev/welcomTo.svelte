<script>
import { onMount } from 'svelte';
    import { scale, fly } from 'svelte/transition';

import {
    idPr
} from './../../stores/idPr.js';
export let id;
export let username;
export let projectName;
import {
    goto,
    invalidate,
    prefetch,
    prefetchRoutes
} from '$app/navigation';

function project(id) {
    idPr.set(id);
    goto("/projectPrivat", );
};
onMount(async () => {
console.log(projectName)

})
</script>
<div transition:fly={{y: 250, opacity: 0.9, duration: 2000} }
    >
<div class="normSml" style="border: 1px solid">
     <h1 class="te" style="line-height: 1; font-weight: bold;"
        >         {username}
        <br/>
ברכות לרגל הצטרפותך לפרוייקט
         {projectName}</h1>
    <button class="bg-lturk p-0.5 te" on:click={project(id)}>ללב הפרויקט</button>
</div>
</div>
<style>
.te{
    font-size: 9px;
}
.normSml {

    text-align: center;
    align-items: center;
    justify-content:  center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 75px;
    max-height: 75px;

    background-color: rgb(213, 216, 171);

}
@media  (min-width: 550px) {
  
	.normSml{
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        max-height: 125px;
  }
 .te{
    font-size: 17px;
}
    }
</style>
