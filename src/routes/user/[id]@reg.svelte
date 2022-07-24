<script context="module">
 
  export const load = async ({params}) => {
      const id =  params.id;
      
      const userId = id;
      return {
          props:{
              userId,
          },
      }
  };
</script>


<script>
  
  export let userId; 
  import { onMount } from 'svelte';
  import Header from '../../lib/components/header/header.svelte'

let user = [
];
let projects =[];
let uskill =[];
let token;
let idL;
let srcU;
let uww = [];
let ur = [];
let error1 = null;
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
      }; let link ="https://i18.onrender.com/graphql" ;
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
            srcU =`${user.profilePic.formats.thumbnail.url}`
            srcU =`${user.profilePic.formats.small.url}`
        } catch (e) {
            error1 = e
        }
    });
    
  </script>
  <svelte:head>
  <title>פרופיל 1❤️1</title>
</svelte:head>
  <div dir="rtl" >
<Header/>
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
    
  <a class="text-gold hover:text-barbi hover:scale-150" sveltekit:prefetch href={`/project/${data.id}`} ><p>{data.projectName}</p></a>
   
    {/each} 
  
  </div>
<a target=”_blank” href="https://www.facebook.com/worldnonviolent" class="text-barbi"><img align="left" height="32" width="32" alt="facebook" src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png"></a>
<a target=”_blank” href="https://discord.gg/DNaMwrXzyS" class="text-barbi"><img align="left" height="32" width="64" alt="Discord" src="https://res.cloudinary.com/love1/image/upload/v1641482980/discord-seeklogo.com_tkftet.svg"></a> 
</div> 
<!--סקשן של תעודות וקורות חיים 
סקשן של משימות שסיימתי
דירוג משתמשים לכישורים ולמשימות שסיימתי-->

    </div>
     
  
    <style>
   .q{
font-size: 220%;
text-align: center;
color: var(--barbi-pink);
  }
    </style>         