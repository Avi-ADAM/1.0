<script>
    import { scale ,fly } from 'svelte/transition';
    import { clickOutside } from './outsidclick.js';
	let shows = true
    export let deadLine = "11.11.21 11:11"
    export let projectName = "ONE"
    export let decisionName = "decide x"
    export let link = "https://www.free-mates.com"
    export let linkDescription = "to discussion"
    export let decisionDetails = "showld we do x";
    export let src = "coin.png";
    export let projectId;
    export let linkP = "/project/"


	function toggleShow() {
		shows = !shows
	}
</script>

<div in:fly={{duration: 4200, y:1}}
out:scale={{duration: 2200, opacity: 0.5}}
>

{#if shows}
<div
	on:mouseenter={toggleShow}
	class="normSml"
	in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"
	>
        <img style="border-radius: 50%;  margin-right:auto; margin-left: auto;" src={src} width="32" height="32"   alt="logo">
        <a sveltekit:prefetch href={`${linkP}${projectId}`}><h3 style="margin: 2px; font-size: 13px; font-weight: bold; line-height: 1;">{projectName}</h3></a>
        <h3 style="margin: 7px; font-size: 13px; line-height: 0.7;">{decisionName}</h3>       
        <h5 style="margin: 7px; font-size: 13px;">{deadLine}</h5>
        <button1 style="margin: 0px; " name="yes"  class="btn"><i class="far fa-check-circle"></i></button1>
        <button3 name="negotiate"  class="btn"><i class="far fa-comments"></i></button3>
        <button2 name="no"  class="btn"><i class="far fa-times-circle"></i></button2>
        
</div>

{:else}
<div class="normSmlHover"
in:scale="{{ duration: 1000, opacity: 0.5, start: 0.64 }}"
on:mouseleave={toggleShow}
use:clickOutside on:click_outside={toggleShow}>
<br>
<img  style=" border-radius: 50%;  margin-right:auto; margin-left: auto;" src={src} width="55" height="55"   alt="logo">
        <a sveltekit:prefetch href={`${linkP}${projectId}`}><h3 style="margin: 2px font-size: 13px; font-weight: bold; line-height: 1;">{projectName}</h3></a>
        <h3 style="margin: 7px; line-height: 1; font-size: 13px;">{decisionName}</h3>       
 <p style="margin: 7px; font-size: 13px;">{decisionDetails}</p>
    <a style="margin: 7px; font-size: 13px; font-weight: bold;" href={link}>{linkDescription}</a>
    <br>
        <button1 style="margin: 7px" class="btn"><i class="far fa-check-circle"></i></button1>
        <button3 name="negotiate"  class="btn"><i class="far fa-comments"></i></button3>
        <button2 name="no"  class="btn"><i class="far fa-times-circle"></i></button2>
        
   
</div>

{/if}

</div>

<style>
	.normSml{

        text-align: center; 
                 text-shadow: 1px 1px  rgb(63, 56, 18);

        align-items: center;
        justify-content: safe center;
        color: var(--gold);
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        max-height: 125px;
         background-color: var(--gold);
         border-radius: 50%;
         
         background: url(turkiz.jpeg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }
	
    .normSmlHover{
               text-shadow: 1px 1px  rgb(63, 56, 18);

        height: 195px;
        width: 195px;
      color: var(--gold);
        border-radius: 50%;
        line-height: 0.6;
        text-align: center;
        background: url(turkiz.jpeg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }
    .btn{ 
        
        background-color: var(--barbi-pink);
        border-radius: 50%;
        color: var(--gold);
        text-align: center;
        opacity: 0.6;
  transition: 0.3s;
  padding: 2px;
  margin-right: 4px;
  margin-left: 4px;
    }
    

.btn:hover {
        opacity: 1;
        padding: 6px;
}

@media only screen 
  and (min-device-width: 375px) 
  and (max-device-width: 812px) 
  and (-webkit-min-device-pixel-ratio: 3)
  and (orientation: portrait) { }
</style>

