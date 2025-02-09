<script>
      import { RingLoader } from 'svelte-loading-spinners';
        import { lang } from '$lib/stores/lang.js';
        import AddImg from '$lib/celim/icons/addImg.svelte';
  import UploadPic from '$lib/components/userPr/uploadPic.svelte';
        let pic = false
  function openen() {
    pic = true;
  }
 export let files;
  let suc = false;

  export let aspect = 1;
    export let ladd = { he: 'הוספת תמונה', en: 'add image' };
    export let cencel = { he: 'ביטול', en: 'cancel' };
    export let om = { he: 'מעלה תמונה', en: 'uploading image' };
     let a = 0;
     let psrc = '';
     const closer = () => {
    pic = false;
    a = 0;
  };
  function callbackFunction(event) {
    a = 2;
    files = event.detail.files;
    let xst
     for (const value of files.values()) {
    console.log(value);
 xst = value
  }
  console.log(xst)   
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageUrl = e.target.result;
        // This will now log the base64 data URL
                psrc = imageUrl

            // Set the image source or perform other actions with the data
        };
        reader.readAsDataURL(xst);
    pic = false;
    suc = true;
  }
</script>

{#if pic != true}
<button
title="{ladd[$lang]}"
on:click={openen}
class="border flex flex-row border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold rounded px-2 py-1"
> <AddImg/>
{#if psrc}
<img class:rounded-full={aspect == 1} height="40" width="40" src={psrc} alt="choosen image"/>
{/if}
</button>
{:else}
<div> <button
    class=" hover:bg-barbi text-mturk rounded-full"
    on:click={closer}>{cencel[$lang]}</button
  >
  {#if a == 0}
    <UploadPic on:message={callbackFunction} {aspect}/>
  {:else if a == 2}
    <div class="sp bg-gold">
      <h3 class="text-barbi">{om[$lang]}</h3>
      <br />
      <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
      ></RingLoader>
    </div>
  {/if}
</div>
{/if}