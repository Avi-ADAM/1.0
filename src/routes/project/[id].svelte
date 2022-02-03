<script context="module">
en = newwork;
    export const load = async ({page, fetch}) => {
       const id = page.params.id;

const projectId = id;
        return {
            props:{
                projectId,
            },
        }

    };
</script>
<script>
      import { onMount } from 'svelte';
export let projectId;
let project = [
];
let projectUsers =[];
let token;
let idL;
let srcP;
let error1 = null;
let projecto = [];
onMount(async () => {
    console.log (document.cookie);
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
    console.log(token);
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
      };
        try {
            const res = await fetch(`https://strapi-k4vr.onrender.com/${projectId}`, {
              method: 'GET',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
            }).then(checkStatus)
          .then(parseJSON);
            project = res;
            console.log(project);
            projectUsers = project.user_1s;
            projecto = project.open_missions;
            srcP =`${project.profilePic.formats.small.url}`
        } catch (e) {
            error1 = e
        }
    });
    
    
</script>
<div dir="rtl" class="all">
<h1 class="q">{project.projectName}</h1>
{#if project.description}
<h6 class="2">{project.publicDescription}</h6>
{/if}
<div style="text-align:center; padding: 10px;" class="3">
    <h2 style="color: var(--barbi-pink);
" >1 בפרוייקט </h2>
{#each projectUsers as user}
<a sveltekit:prefetch href={`/user/${user.id}`}><h6>{user.username}</h6></a>
{/each}
</div>
<div class="4">
    <img
    width="250" height="250" 
    style="border-radius: 50%; margin-right:auto; margin-left:auto ;"  
    src={srcP}
    alt="profilePic"></div>
</div>
<div style="text-align:center; padding: 10px;" >
<h3 style="color: var(--barbi-pink);
" class="5">משימות פנויות </h3>
{#each projecto as om }
<p>{om.name}</p>
{/each}
</div>

<style>
  .all{

  }
  .q{
font-size: 82px;
text-align: center;
color: var(--barbi-pink);
  }
</style>