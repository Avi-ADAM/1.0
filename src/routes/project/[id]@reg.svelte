<script context="module">
    export const load = async ({params}) => {
       const id = params.id;

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
  import Header from './../../lib/components/header/header.svelte'

export let projectId;
export let project = [
];
let projectUsers =[];
let token;
let idL;
let srcP;
let error1 = null;
let projecto = [];
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
      };
        let link ="https://new-zuhk.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
          `{  project (id:${projectId}) {projectName  user_1s {id username}
                        publicDescription    profilePic {url formats }   open_missions (where:{archived: false }) { id name}}
        }`
        })
})
  .then(r => r.json())
  .then(data => project = data.data.project);
            projectUsers = project.user_1s;
            projecto = project.open_missions;
            srcP =`${project.profilePic.formats.small.url}`
        } catch (e) {
            error1 = e
        }
    });
    
    
</script>
 <svelte:head>
  <title>ריקמה 1❤️1</title>
</svelte:head>
<div dir="rtl" class="all">
  <Header/>

  <div class="4">
    {#if srcP}
    <img
    width="250" height="250" 
    style="border-radius: 50%; margin-right:auto; margin-left:auto ;"  
    src={srcP}
    alt="profilePic">
  {/if}
  </div>
<h1 class="q">{project.projectName}</h1>
{#if project.publicDescription !== null}
<p class="text-barbi text-center">{project.publicDescription}</p>
{/if}
<div style="background-color: var(--mturk); margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--gold);" class="3">
    <h2 style="color: var(--barbi-pink);
" >1 ברקמה </h2>
{#each projectUsers as user}
<a sveltekit:prefetch href={`/user/${user.id}`}><p class="text-gold hover:text-barbi">{user.username}</p></a>
{/each}
</div>

<div style="background-color: var(--mturk); margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--gold);" >
<h3 style="color: var(--barbi-pink);
" class="5">משימות פנויות </h3>
{#each projecto as om }
<p class="text-gold hover:text-barbi">{om.name}</p>
{/each}
</div>
</div>

<style>
  .all{

  }
  .q{
font-size: 220%;
text-align: center;
color: var(--barbi-pink);
  }
</style>