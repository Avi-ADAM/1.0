<script>
  import {
    createEventDispatcher
} from 'svelte';
 const dispatch = createEventDispatcher();

  export let userId; 
  import { RingLoader
} from 'svelte-loading-spinners';
let projects =[];
let uskill =[];
let token;
let idL;
let srcU;
let uww = [];
let ur = [];
let error1 = null;
let value = [];
function pr (x){
  dispatch('proj',{id:x})
}
     async function xys () {
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
      }; let link ="https://onelovevone.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
          `{  user (id:${userId}) { work_ways { workWayName } 
                     tafkidims { roleDescription }
                       vallues { valueName}
                                  skills { skillName } 
                            projects_1s {id projectName }
                            username 
                             profilePic {url formats }   
                            }
        }`
        })
})
  .then(r => r.json())
  .then(data => user = data.data.user);
            console.log(user);
            projects = user.projects_1s;
            uskill = user.skills;
            uww = user.work_ways;
            ur =  user.tafkidims;
            value = user.vallues;
            srcU =`${user.profilePic.formats.thumbnail.url}`
            srcU =`${user.profilePic.formats.small.url}`
        } catch (e) {
            error1 = e
        }
        return user
    };
    let user = xys();

  </script>
 {#await user}
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
 {:then user}
  <div dir="rtl" >
      <div class="middle">
    {#if srcU }
 <img
 height="150px" width="150px" 
     style="border-radius: 50%; margin-right:auto; margin-left:auto ;"  

  src={srcU} 
  alt="profilePicAvatar" />
{/if}
      </div>
         <div class="flexi">
           <div class="q">
<h3 >{user.username}</h3></div>
 <div style="margin: 2px; background-color: var(--mturk); text-align:center; padding: 10px; border: 2px solid var(--gold);" >
    <h6  style="font-size:23px; color:var(--barbi-pink); ">הערכים והמטרות שלי</h6>
    {#each  value as val, i}
       <p class="text-gold">{val.valueName}</p>
       {/each}
      </div>
<div style="margin: 2px; background-color: var(--mturk); text-align:center; padding: 10px; border: 2px solid var(--gold);" >
    <h6  style="font-size:23px; color:var(--barbi-pink); ">הכישורים שלי </h6>
    {#each uskill as dat, i}
       <p class="text-gold">{dat.skillName}</p>
       {/each}
      </div>
<div style="margin: 2px; background-color: var(--mturk); text-align:center; padding: 10px; border: 2px solid var(--gold);" >
    <h6  style="font-size:23px; color:var(--barbi-pink); ">התפקידים שלי </h6>
    {#each ur as dat, i}
       <p class="text-gold">{dat.roleDescription}</p>
       {/each}
      </div>
      <div style="margin: 2px; background-color: var(--mturk); text-align:center; padding: 10px; border: 2px solid var(--gold);" >
    <h6  style="font-size:23px; color:var(--barbi-pink); ">דרכי העבודה שלי </h6>
    {#each  uww as dat, i}
       <p class="text-gold">{dat.workWayName}</p>
       {/each}
      </div>
<div style="margin: 2px; background-color: var(--mturk); text-align:center; padding: 10px; border: 2px solid var(--gold);" >
    <h1 style="font-size:23px; color:var(--barbi-pink); ">הרקמות שלי</h1>
  {#each projects as data, i}
    
  <button class="text-gold hover:text-barbi hover:scale-150" on:click={pr(data.id)}  ><p>{data.projectName}</p></button>
   <br>
    {/each} 
  
  </div>

 </div> 
<!--סקשן של תעודות וקורות חיים 
סקשן של משימות שסיימתי
דירוג משתמשים לכישורים ולמשימות שסיימתי-->

    </div>
     
  {/await}
    <style>
   .q{
font-size: 220%;
text-align: center;
color: var(--barbi-pink);
  }

    </style>         