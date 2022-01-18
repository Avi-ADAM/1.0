<script> 
 import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
let meData;
let token; 
let idL;
  let picU;
let picLink;
 let total;
 let error1 = null;
 
let name;

    onMount(async () => {
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    let link ="http://localhost:5000/users/" + idL ;
        const parseJSON = (resp) => (resp.json ? resp.json() : resp);
        const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      const headers = {
        'Content-Type': 'application/json'   
      };
        try {
            const res = await fetch(link, {
              method: 'GET',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
            }).then(checkStatus)
          .then(parseJSON);
            meData = res
            name = meData.username;
            picU =  meData.profilePic.formats.thumbnail.url;
            picLink = "http://localhost:5000" + picU;
            total = meData.hervachti;
        } catch (e) {
            error1 = e
        }
    });
export let sug = 0;
let sugg =  "sugg";
export let pen = 0;
let pend = "pend";
export let ask = 0;
let asks = "asks";
export let wel = 0;
let welc = "welc";
export let beta = 0;
let betaha = "betaha";
export let des = 0;
let desi = "desi";
export let fia = 0;
let fiap = "fiap";
function disp (value) { 
  console.log(value)
   if (value !== "true"){
   dispatch ("showonly",{
      data: value
   });
   if (value === "sugg"){
sugg = "true";
console.log ("sugg", sugg);
   } else if (value === "pend"){
pend = "true";
   } else if (value === "asks"){
asks = "true";
   } else if (value === "welc"){
welc = "true";
   } else if (value === "betaha"){
betaha = "true";
   } else if (value === "desi"){
desi = "true";
   } else if (value === "fiap"){
fiap = "true";
   } 
  } else {
      dispatch ("showall",{
   })
  sugg =  "sugg";
 pend = "pend";
 asks = "asks";
 welc = "welc";
 betaha = "betaha";
desi = "desi";
fiap = "fiap";
  }


}
    	import { fly } from 'svelte/transition';
</script>

<div in:fly={{duration: 4200, y:1000}} class="midCom">
    <br>
    <br>
    <a sveltekit:prefetch 
    href="http://localhost:3000/userProfile" 
    style="color: var(--barbi-pink); font-weight: bold;  font-size: 24px ;">{ name}</a>
    <h3 style="margin-top: -10px">{total}$</h3> 
    <img
      width="50" height="50" 
      style="border-radius: 50%; margin-right:auto; margin-left:auto ;"  
      src={picLink} alt="profilePic">
<br>
{#if sug > 0}    <button on:click={()=>disp(sugg)}  class="btn" title="הצגת הצעות לפרוייקטים  בלבד" name="number ">{sug}</button>{/if}
{#if pen > 0}    <button on:click={() => disp(pend)}  class="btn" title="הצגת פעולות ממתינות לאישור" name="number o">{pen}</button>{/if}
{#if ask > 0}    <button on:click={() => disp(asks)}  class="btn" title="הצגת בקשות הצטרפות בלבד" name="number of ">{ask}</button> {/if}
{#if des > 0}    <button on:click={() => disp(desi)} class="btn" title="הצגת החלטות ממתינות למענה בלבד" name="number of o">{des}</button>{/if}
{#if beta > 0}    <button on:click={() => disp(betaha)}  class="btn" title="הצגת פעולות בתהליך ביצוע בלבד" name="number of m">{beta}</button>{/if}
{#if wel > 0}    <button on:click={() => disp(welc)}  class="btn" title="הצגת קבלות פנים לפרוייקטים בלבד" name="number of op">{wel}</button> {/if}
{#if fia > 0}     <button on:click={() => disp(fiap)}  class="btn" title="הצגת אישור פעולות שהסתיימו בלבד" name="number of p">{fia}</button> {/if}

  </div> 

<style>
.midCom{
    color: rgb(113, 244, 253);
    
    text-align: center;
    
    min-height: 290px;
    min-width: 290px;
    border-radius: 50%;
        background: url(goodCoin.png);
/*
    background: url(coinN.png);*/
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
}
.btn{
    background-color: var(--lturk);
        border-radius: 50%;
        color: var(--barbi-pink);
        text-align: center;
        opacity: 0.6;
  transition: 0.3s;
  padding: 6px;
  margin-right: 2px;
  margin-left: 4px;
  margin-bottom :8px;
    }
    

.btn:hover {
    opacity: 1;
    padding: 13px;}

    @media only screen 
  and (min-device-width: 375px) 
  and (max-device-width: 812px) 
  and (-webkit-min-device-pixel-ratio: 3)
  and (orientation: portrait) {
      
.midCom{
    color: rgb(113, 244, 253);
    
    text-align: center;
    
    min-height: 170px;
    min-width: 170px;
    border-radius: 50%;
    
    background: url(goodCoin.png);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
}
.btn{
    background-color: rgb(87, 208, 248);
        border-radius: 50%;
        color: purple;
        text-align: center;
        opacity: 0.6;
  transition: 0.3s;
  padding: 6px;
  margin-right: 2px;
  margin-left: 4px;
    }
    

.btn:hover {
    opacity: 1;
    padding: 13px;}

   }
</style>
