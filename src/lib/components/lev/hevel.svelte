<script>
  import { run } from 'svelte/legacy';


  import { lang } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
  let { userId, onProj } = $props<{ onProj?: (payload: { id: any }) => void }>();
function pr (x){
  onProj?.({id:x})
}
let user = $state([]);
let fblink = $state(), twiterlink = $state(), discordlink = $state(), githublink = $state()
let load = $state(false)
let projects =$state([]);
let uskill =$state([]);
let token;
let idL;
let srcU = $state("https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png");
let uww = $state([]);
let fmm = $state([]);
let ur = $state([]);
let val = $state([]);
let mash = $state([])
let error1 = null;
const baseUrl = import.meta.env.VITE_URL

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
       let link = baseUrl+"/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
          `{  usersPermissionsUser (id:${userId}) { data{attributes{
             fblink twiterlink discordlink githublink
            bio
            username 
                        finnished_missions { data{attributes{ missionName }}}
            profilePic { data{attributes{url formats }}}
            projects_1s {data{ id attributes{ projectName}}} 
            sps (filters: {archived:{eq: false }}) {data{id attributes { name panui}}}
            skills {data{ id attributes{ skillName ${$lang == 'he' ? 'localizations{  data{attributes{skillName }}}' : ""}} }}
            tafkidims {data{ id attributes{ roleDescription ${$lang == 'he' ? 'localizations{ data{attributes{roleDescription }}}' : ""}}}}
            vallues {data{ id attributes{ valueName ${$lang == 'he' ? 'localizations{ data{attributes{valueName }}}' : ""}}}}
            work_ways {data{ id attributes{workWayName ${$lang == 'he' ? 'localizations{ data{attributes{workWayName }}}' : ""}}}}
                            }}}
        }`
        })
})
  .then(r => r.json())
  .then(data => user = data.data.user);
            projects = user.projects_1s.data;
            load = true
            uskill = user.skills.data;
              fblink = user.fblink
            twiterlink = user.twiterlink
             discordlink = user.discordlink
               githublink = user.githublink
            let fermatana = {}
            let fnn = []
            fnn = user.finnished_missions.data;
            if (fnn.length > 1){
             for (let i = 0; i < fnn.length; i++){
              if (fnn[i].attributes.missionName in fermatana) {
                    fermatana[fnn[i].attributes.missionName] += 1
                   } else {
                    fermatana[fnn[i].attributes.missionName] = 1
                   }
              }
         for (const [key, value] of Object.entries(fermatana)) {
            const datea = key
            const ano = value
            fmm.push({
              missionName: `${$lang == "en" ?  key : ""}${value > 1 ? ` ${$lang == "en" ?  ":" : ""}${value}${$lang == "he" ?  ":" : ""}` : ""}${$lang == "he" ?  key : ""}`
            })
         }
        }
        fmm = fmm
            ur =  user.tafkidims.data;
              val = user.vallues.data;
            if ($lang == "he"){
              for (let i = 0; i < val.length; i++){
                if (val[i].attributes.localizations.data.length > 0){
                val[i].attributes.valueName = val[i].attributes.localizations.data[0].attributes.valueName
                }
              }
            }
            val = val
            uskill = user.skills.data;
              if ($lang == "he"){
              for (let i = 0; i < uskill.length; i++){
                if (uskill[i].attributes.localizations.data.length > 0){
                uskill[i].attributes.skillName = uskill[i].attributes.localizations.data[0].attributes.skillName
                }
              }
            }       
            uskill = uskill   
            ur = user.tafkidims.data;
                        if ($lang == "he"){
              for (let i = 0; i < ur.length; i++){
                if (ur[i].attributes.localizations.data.length > 0){
                ur[i].attributes.roleDescription = ur[i].attributes.localizations.data[0].attributes.roleDescription
                }
              }
            }
            ur = ur
            mash = user.sps.data;
            uww = user.work_ways.data;  
            if ($lang == "he"){
              for (let i = 0; i < uww.length; i++){
                if (uww[i].attributes.localizations.data.length > 0){
                uww[i].attributes.workWayName = uww[i].attributes.localizations.data[0].attributes.workWayName
                }
              }
            }    
              uww = uww
              if (user.profilePic.data !=null){
            srcU =user.profilePic.data.attributes.formats.thumbnail.url
            srcU =user.profilePic.data.attributes.formats.small.url
              }
        } catch (e) {
            error1 = e
        }
    });
    let linkP = "https://www.google.co.il" 
const towel = {"he":"לינק","en":"link"}
const todis = {"he":"לינק לדיסקורד","en":"link to discord"}
const tofac = {"he":"לינק לפייסבוק" ,"en":"link to Facebook"}
const togit = {"he":" לינק לגיטהב","en":"link to GitHub"}
const totwi = {"he":" לינק לטוויטר","en":"link to twitter"}
let h = $state(),w = $state(), height = $state(),width = $state();
run(() => {
    if(h > w){
    height = "90vw"
    width = "90vw"
  } else if (h < w){
    console.log("f",h,w)
    height = "calc(100vh - 60px)";
    width = "calc(100vh - 60px)";
  }
  });
let viewBox="460 0 1000 1080"//1450

const sk = {"he": "כישורים", "en":"skills"}
const ro = {"he": "תפקידים", "en":"roles"}
const ww = {"he": "דרכי יצירה", "en": "ways of creation"}
const re = {"he": "רקמות", "en": "FreeMates"}
const vv = {"he": "ערכים", "en": "vallues"}
const rr = {"he": "משאבים", "en": "resources"}
const mm = {"he": "משימות","en":"missions"}

  </script>
 <span style=" position:absolute;
        height:100vh;
        width:100vw; top:0; left:0; z-index:-1;" bind:clientHeight="{h}" bind:clientWidth="{w}"></span>

  <div dir="rtl" >
      <div class="middle" >
        <svg height={height} width={width} id="eARfSi12ITv1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="{viewBox}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
     {#if srcU}
<foreignObject class="stroke-1 stroke-barbi" x='768' y='348' width='384' height='384' > <img
 height="100%" width="100%" 
 class="border-2 border-barbi"
     style="border-radius: 50%; margin-right:auto; margin-left:auto ; "  

  src={srcU} 
  alt="profilePicAvatar" /></foreignObject>
{/if}
<foreignObject class:rou={load == false} x='820' y='60' width='280' height='280'  >
  <div class="  h-full  max-w-full flex-row  bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre" style="padding: 0 10px; text-align:center;  border-radius:50%; border: 2px solid var(--gold);" >
    <h6 class="mt-6 " style="font-size:28px; color:var(--barbi-pink); ">{sk[$lang]}</h6>
   <div class= " overflow-y-auto h-3/5 d mb-6 mx-5  max-w-9/12 px-5 grid align-middle justify-center">
    {#each uskill as dat, i}
       <span style="font-size:25px;" class="font-bold text-gold bg-barbi rounded-lg px-1 my-1 ">{dat.attributes.skillName}</span>
       {/each}
      </div>
      </div>
</foreignObject>
<foreignObject class:rou={load == false} fill="#d2d555" x='546' y='184' width='280' height='280'  >
  <div class="  h-full  max-w-full flex-row bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre " style="padding: 0 10px;  text-align:center;  border-radius:50%; border: 2px solid var(--gold);" >
    <h6 class="mt-6 " style="font-size:28px; color:var(--barbi-pink); ">{ro[$lang]}</h6>
   <div class= " overflow-y-auto h-3/5 d mb-6 mx-5  max-w-9/12 px-5 grid align-middle justify-center">
    {#each ur as dat, i}
       <span style="font-size:25px;" class="font-bold text-gold bg-barbi rounded-lg px-1 my-1 ">{dat.attributes.roleDescription}</span>
       {/each}
      </div>
      </div>
</foreignObject>
<foreignObject class:rou={load == false} fill="#d2d555" x='1094' y='184' width='280' height='280'  >
  <div class="  h-full  max-w-full flex-row bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre " style="padding: 0 10px;  text-align:center;  border-radius:50%; border: 2px solid var(--gold);" >
    <h6 class="mt-6 " style="font-size:28px; color:var(--barbi-pink); ">{re[$lang]}</h6>
   <div class= " overflow-y-auto h-3/5 d mb-6 mx-5  max-w-9/12 px-5 grid align-middle justify-center">
        {#each projects as data, i}
       <span style="font-size:25px;" class="font-bold hover:scale-110 text-gold bg-barbi rounded-lg px-1 my-1 ">
          <button class="text-gold hover:text-mturk "   onclick={pr(data.id)} >{data.attributes.projectName}</button>
       </span>
       {/each}
    </div>
      </div>
</foreignObject>
<foreignObject class:rou={load == false} fill="#d2d555" x='486' y='469' width='280' height='280'  >
  <div class="  h-full  max-w-full flex-row bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre " style="padding: 0 10px; text-align:center;  border-radius:50%; border: 2px solid var(--gold);" >
    <h6 class="mt-6 " style="font-size:28px; color:var(--barbi-pink); ">{ww[$lang]}</h6>
   <div class= " overflow-y-auto h-3/5 d mb-6 mx-5  max-w-9/12 px-5 grid align-middle justify-center">
    {#each uww as dat, i}
       <span style="font-size:25px;" class="font-bold text-gold bg-barbi rounded-lg px-1 my-1 ">{dat.attributes.workWayName}</span>
       {/each}
      </div>
      </div>
</foreignObject>
<foreignObject class:rou={load == false} fill="#d2d555" x='1166' y='469' width='280' height='280'  >
  <div class="  h-full  max-w-full flex-row bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre " style="padding: 0 10px;  text-align:center;  border-radius:50%; border: 2px solid var(--gold);" >
    <h6 class="mt-6 " style="font-size:28px; color:var(--barbi-pink); ">{vv[$lang]}</h6>
   <div class= " overflow-y-auto h-3/5 d mb-6 mx-5  max-w-9/12 px-5 grid align-middle justify-center">
    {#each val as dat, i}
       <span style="font-size:25px;" class="font-bold text-gold bg-barbi rounded-lg px-1 my-1 ">{dat.attributes.valueName}</span>
       {/each}
      </div>
      </div>
</foreignObject>
<foreignObject class:rou={load == false} fill="#d2d555" x='677' y='707' width='280' height='280'  >
  <div class="  h-full  max-w-full flex-row bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre " style="padding: 0 10px;  text-align:center;  border-radius:50%; border: 2px solid var(--gold);" >
    <h6 class="mt-6 " style="font-size:28px; color:var(--barbi-pink); ">{rr[$lang]}</h6>
   <div class= " overflow-y-auto h-3/5 d mb-6 mx-5  max-w-9/12 px-5 grid align-middle justify-center">
    {#each mash as dat, i}
       <span style="font-size:25px;" class="font-bold text-gold bg-barbi rounded-lg px-1 my-1 ">{dat.attributes.name}</span>
       {/each}
      </div>
      </div>
</foreignObject>
<foreignObject class:rou={load == false} fill="#d2d555" x='982' y='707' width='280' height='280'  >
  <div class="  h-full  max-w-full flex-row bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre " style="padding: 0 10px;  text-align:center;  border-radius:50%; border: 2px solid var(--gold);" >
    <h6 class="mt-6 " style="font-size:28px; color:var(--barbi-pink); ">{mm[$lang]}</h6>
   <div class= " overflow-y-auto h-3/5 d mb-6 mx-5  max-w-9/12 px-5 grid align-middle justify-center">
    {#each fmm as dat, i}
       <span style="font-size:25px;" class="font-bold text-gold bg-barbi rounded-lg px-1 my-1 ">{dat.missionName}</span>
       {/each}
      </div>
      </div>
</foreignObject>

 
    <foreignObject x="710" y="957" height="280" width="500">
        <div class="flexi">
           <div class="q">
            {#if load == true}
<h3 >{user.username}</h3>
{/if}
</div></div>
 <div class="flex flex-row items-center justify-center">
         {#if discordlink}
                     <a
                     rel="noreferrer"
                     target="_blank" href={discordlink}
          class=" hover:bg-white text-barbi rounded-full"
          title={todis[$lang]}
          >
          <img style="width:48px;height:48px" src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg" alt="Discord"/>
          </a>
                      {/if}
                         {#if twiterlink}
                     <a
                      rel="noreferrer"
                     target="_blank" href={twiterlink}
          class=" hover:bg-white text-barbi rounded-full"
          title={totwi[$lang]}
          >
          <img style="width:48px;height:48px" src="https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg" alt="Twitter"/>
          </a>
                      {/if}
                    <!--   {#if linkP}
                     <a
                     target="_blank" href={linkP}
          class=" hover:bg-white text-barbi rounded-full"
          title={towel[$lang]}
          >
          <img style="width:48px;height:48px" src="https://tochat.be/whatsapp-icon-white.png" alt="WhatsApp"/>
          </a>
                      {/if}-->
                        {#if githublink}
                     <a
                      rel="noreferrer"
                     target="_blank" href={githublink}
          class=" hover:bg-white text-barbi rounded-full"
          title={togit[$lang]}
          >
          <img style="width:48px;height:48px" src="https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg" alt="GitHub"/>
          </a>
                      {/if}
                       {#if fblink}
                     <a
                      rel="noreferrer"
                     target="_blank" href={fblink}
          class=" hover:bg-white text-barbi rounded-full"
          title={tofac[$lang]}
          >
          <img style="width:48px;height:48px" src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png" alt="Facebook"/>
          </a>
                      {/if}
    </foreignObject>
  </svg>
  
      </div>
           
            </div>
      
     
  
    <style>
      .middle{
        padding: 10px 0;
      }
     /* #eARfSi12ITv1{
            height:calc(100vh - 60px) ;
        width:calc(100vh -60px);
      }*/
   .q{
font-size: 50px;
text-align: center;
color: var(--barbi-pink);
  }

   
    
@-webkit-keyframes pulsen {
   0% {  
        
        transform: rotate(0deg);
    }
    25% { 
               transform: rotate(180deg);
    }
    50% { 
               transform: rotate(0deg);

    }
    75% { 
    transform: rotate(-180deg);

      }
    100% {
       transform: rotate(0deg);

    }
}
@keyframes pulsen {
    0% {  
        
        transform: rotate(0deg);
    }
    25% { 
               transform: rotate(180deg);
    }
    50% { 
               transform: rotate(0deg);

    }
    75% { 
    transform: rotate(-180deg);

      }
    100% {
       transform: rotate(0deg);

    }
}
.spark_1 {
    -webkit-animation-delay: 0.11s;
    animation-delay: 0.11s;
}
.spark_2 {
    -webkit-animation-delay: 0.21s;
    animation-delay: 0.21s;
}

  .rou{
       -webkit-animation-duration: 3s;
    -webkit-animation-name: pulsen;
    -webkit-animation-iteration-count: infinite;
    animation-duration: 3s;
    animation-name: pulsen;
    animation-iteration-count: infinite;
      transform-origin: 960px 50%;

  }
  .aa{

  }
  .bb{
    
  }
  .cc{
   
  }
  .dd{

  }
  .ee{

  }
    </style>
