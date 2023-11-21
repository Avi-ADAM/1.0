<script>
  import { addToast } from 'as-toast';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import { page } from '$app/stores';
  import { lang } from '$lib/stores/lang.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import { goto } from '$app/navigation';
  import { SendTo } from '$lib/send/sendTo.svelte';
    import RangeSlider from "svelte-range-slider-pips";
  //TODO: get asked from server then show you alr .., find a way to get title
  let selected = []
  let mash = []
  let easychoose = false
  let error1 = null;
  let success = false;
  function project(x) {
    goto('/project/' + x);
  }
  export let askedarr = [];
  export let alr = false;
  let alrr = false 
  let tochoose = false
  function second (){
    alr = true
  }
  let loading = true
  async function tochoos(){
    tochoose = true
    loading = true
       const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    const uId = cookieValueId;
        const inD = data.alld;

    let id = inD.mashaabim.data.id
    const que1 = `query { usersPermissionsUser (id: ${uId}){
    data {
      id attributes{
        sps (filters: { mashaabim:{id : {eq:${id}}}}){data{id attributes{ name}}}
      }
    }}}`
    const d1 = await SendTo(que1).then();
    console.log(d1)
    mash = d1.data.usersPermissionsUser.data.attributes.sps.data;
    mash = mash
    loading = false
  }
  function afterChoose (){
      let id = find_skill_id(selected,mash,"name")
      console.log(id)
      ask(id)
  }
  let easyy = 0
  const rangehead = {"he":"נא לבחור את השווי בו יוצע המשאב שלך","en":"please choose the vallue you will share it"}
  const okk = {"he":"אישור השווי שלי ובקשת שיתוף","en":"create with this value and ask to share"}
  const ok = {"he":"שיתוף המשאב הנבחר","en":"share selected resorce"}
  const creatnew = {"he":"יצירת משאב חדש","en":"create new resorce"}
  const choosee = {"he":"בחירה מתוך המשאבים שלי","en":"choose from my resorces"}
  async function ask(spId) {
    //TODO: if only me in the freemates and its me create mesimabetahalich
            alrr = true;
          const inD = data.alld;
       let d = new Date();       
          const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    const uId = cookieValueId;
    if(spId == 0){
        const easy = (easyy > 0) ? easyy : 0;
        const sdate = (inD.sqadualed !== undefined) ? `sdate: "${new Date(inD.sqadualed).toISOString()}",` : ``;
        const fdate = (inD.sqadualedf !== undefined) ? `fdate: "${new Date(inD.sqadualedf).toISOString()}" ,` : ``;
        let que0 =  `mutation { createSp(
          data: { 
             name: "${inD.name}",
             descrip: "${inD.descrip}",
             kindOf: ${inD.kindOf},
             unit: ${inD.hm},
             spnot: "${inD.spnot}",  
             price: ${inD.price},
             myp: ${easy},   
             linkto: "${inD.linkto}",
             users_permissions_user: "${uId}",
             mashaabim: "${inD.mashaabim.data.id}", 
             publishedAt: "${d.toISOString()}",        
             ${sdate} 
             ${fdate}
           }
        )  {data{id }}
        } ` 
      const d0 = await SendTo(que0).then();
      const r0 = d0.data.createSp.data.id;
      if (r0) {
      create(r0)
      }

    }else{
      create(spId)
    }
    async function create(spIdd){

    let myvote = ``;
    let pid = inD.project.data.attributes.user_1s.data.map((t) => t.id);
    if (pid.includes(uId)) {
      myvote = `vots: [{
                        what: true
                        users_permissions_user: "${uId}"
                        ide:${uId}
                        zman:"${d.toISOString()}"
                          }
                        ]`;
    }

    let quet =  `mutation { 
          createAskm(
              data:{ 
                publishedAt: "${d.toISOString()}",
                open_mashaabim: ${data.mId},
                    project: ${inD.project.data.id},
                    sp: ${spIdd},
                    users_permissions_user: ${uId},
                    ${myvote}
            }
          ){
            data {id}
          }
          updateSp(
            id: "${spIdd}" 
            data: {declinedm: "${data.mId}" }
          ){
              data {
                attributes{
                  declinedm{
                    data{
                      id
                    }
                  }
                }
              }
          }
        }`
    const d2 = await SendTo(quet).then();
    const r2 = d2.data;
    console.log(r2);
    if (r2 != null) {
      let restime = inD.project.data.attributes.restime;
      let x = calcX(restime);
      let fd = new Date(Date.now() + x);
      let hiluzId = r2.createAskm.data.id;
      let quee = `mutation 
                        {createTimegrama(
         data:{
           date: "${fd.toISOString()}",
           whatami: "askm",
      askm: ${hiluzId},
          }
        ){
          data {id}
        }
      }`;
      const d3 = await SendTo(quee).then();
      const r3 = d3.data;
      console.log(r3);
      if (r3 != null) {
        success = true;
        setTimeout(function () {
          success = false;
        }, 15000);
        addToast(`${fnnn[$lang]}`, 'info');
      }
    }
  }
}

  export let data;

  $: hovered = false;
  function hover(a) {}
  console.log(data);
  const fnnn = { "he": 'הבקשה נשלחה בהצלחה', "en": 'request has sent sucsesfully' };

  const headi = {
    "he": 'הצעה לשיתוף משאב',
    "en": 'oportunity for sharing resource'
  };
  const om = {
    "he": 'משאב נדרש',
    "en": 'needed resorce'
  };

  const seePr = {
    "he": 'לצפיה בריקמה',
    "en": 'see the freeMates page'
  };

  function reg() {
    if ($lang == 'he') {
      goto('/');
    } else if ($lang == 'en') {
      goto('/en');
    } else if ($lang == 'ar') {
      goto('/ar');
    } else {
      goto('/');
    }
  }
  function login() {
    goto(`/login?from=availableResorce/${data.mId}`);
  }
  let wid;
  const mand = {
    "he": 'המשאב שותף כבר בהצלחה',
    "en": 'the resorce has already assigned'
  };
  const alri = {
    "he": 'כבר הגשת בקשה לשתף את המשאב הזה',
    "en": 'you have already requested to share this resorce'
  };
  const iwantto = { "he": 'אני אשמח לשתף!', "en": 'I want to share it!' };
  const info = {
    "he": 'בכדי לבקש להצטרף לריקמה ולשתף איתה את המשאב וגם בכדי לקבל הצעות למשימות, לפתוח רקמות (פרויקטים) חדשות ולהתנהל בהן בהסכמה יש להתחבר או להירשם',
    "en": 'You are not connected'
  };
  const registratio = { "he": 'להרשמה', "en": 'To Registration' };
  const logi = { "he": 'להתחברות', "en": 'To Login' };
  const foreg = {
    "he": 'כדי לראות את כל המידע נדרשת התחברות או הרשמה',
    "en": 'some information is available only for registersd users'
  };
  const units ={
    "he":"יחידות",
    "en":"unit's"
  }
  const monts = {
    "he":"חודשים",
    "en": "month's"
  }
  const years = {
    "he":"שנים",
    "en":"year's"
  }
  const total = {
    "he":"בסך הכל",
    "en":"total"
  }
  const nomash = {
    "he":"לא יצרת משאב מתאים נא ליצור עם הכפתור ליד",
    "en":"no resorce matching create one with the button"
  }
  const plh = {
    "he": "בחירת משאב",
    "en":"choose resorce"
  }
  const nom = {
    "he":"לא נמצא משאב מתאים, ניתן ליצור את המשאב המבוקש עם הכפתור הסמוך",
    "en":"no matching resorce, you can create new same as the requested with the button on the side"
  }
  function torange(){
    console.log("i am")   
    easyy = [Number(data.alld.price)]
    easychoose = true
    console.log("i am",easyy,data.alld.easy ,"kk", data.alld.price)
  }
  const tolev = { "he" :'לצפיה במשאבים אחרים ובכל העדכונים שלך', "en": 'see your updates & nutifictions' };
  import { Head } from 'svead';
  import { calcX } from '$lib/func/calcX.svelte';
  import { montsi } from '$lib/func/montsi.svelte';
  import { MultiSelect } from 'svelte-multiselect';
  import { find_skill_id } from '$lib/func/findSkillId.svelte';
  console.log($page)
  let title = 'This is Svead a Svelte Head Component';
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;
  let description = $page?.data.alld?.descrip || om[$lang];
  let url = $page.url.toString();
  //TODO: header nav menu
</script>

<Head
  title={$page.data?.alld?.title[$lang] ?? headi[$lang]}
  {description}
  {image}
  {url}
/>
<SucssesConf {success} />
{#if data?.alld?.fullfild == false}
  <div
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex align-middle content-center justify-center"
  >
    <RingLoader size="260" color="#ff00ae" unit="px" duration="2s" />
  </div>
{:else if data != null}
  {#if data.alld?.archived != true && data.alld != null}
    <div
      bind:clientWidth={wid}
      dir="rtl"
      style="overflow-y:auto"
      class=" d mb-4 sm:pt-4 w-full lg:w-1/2 mx-auto"
    >
      <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
    </div>-->
      <div
        class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre"
      >
        <div class="relative flex items-center space-x-1">
          <div class="relative">
            <img
              src={data.alld.project.data.attributes.profilePic.data?.attributes
                .url}
              alt=""
              class="w-10 sm:w-16 h-10 sm:h-16 rounded-full"
            />
          </div>
          <div class="flex flex-col leading-tight">
            <div class="sm:text-sm text-md mt-1 flex items-center">
              <span
                class="text-barbi text-center mr-3 sm:text-2xl lg:text-4xl text-xl"
                >{headi[$lang]}</span
              >
            </div>
            <span class="pn ml-1 text-lg sm:text-xl lg:text-2xl text-grey-200"
              >{data.alld.project.data.attributes.projectName}</span
            >
          </div>
        </div>
        <div>
          <button
            on:click={() => project(data.alld.project.data.id)}
            class="px-4 py-2 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-lg lg:text-2xl font-bold mt-2 mx-4 border-2 border-gold leading-4"
            >{seePr[$lang]}</button
          >
        </div>
      </div>
      <div
        class=" lg:bg-gray-700 bg-transparent rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal"
      >
        <div class="mb-8">
          <div class="  mb-2">
            <div class="flex flex-row justify-between">
              <div class="px-2">
                <h2 class="text-barbi font-bold text-xl lg:text-4xl underline">
                  {data.alld.name}
                </h2>
                {#if data.alld.descrip !== null && data.alld.descrip !== 'null' && data.alld.descrip !== 'undefined' && data.alld.descrip !== undefined}
                  <p class="cd d max-h-16 text-gray-100 text-lg lg-text-2xl">
                    {data.alld.descrip}
                  </p>
                {/if}
                {#if data.tok == true}
                  <p
                    on:mouseenter={() => hover('הערות')}
                    on:mouseleave={() => hover('0')}
                    class="text-gray-100 lg:text-2xl max-h-16 cd text-sm d"
                  >
                    {data.alld.spnot !== undefined &&
                    data.alld.spnot !== null &&
                    data.alld.spnot !== 'undefined'
                      ? data.alld.spnot
                      : ''}
                  </p>
                {:else}
                  <div role="status" class="space-y-2.5 animate-pulse max-w-lg">
                    <div class="flex items-center w-full space-x-2">
                      <div
                        class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32"
                      />
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                      />
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                      />
                    </div>
                    <div
                      class="flex items-center w-full space-x-2 max-w-[480px]"
                    >
                      <small class="text-barbi text-lg leading-3 sm:text-2xl"
                        >{foreg[$lang]}</small
                      >
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                      />
                    </div>
                    <div
                      class="flex items-center w-full space-x-2 max-w-[400px]"
                    >
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                      />
                      <div
                        class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"
                      />
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                      />
                    </div>
                    <div
                      class="flex items-center w-full space-x-2 max-w-[480px]"
                    >
                      <div
                        class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"
                      />
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                      />
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                      />
                    </div>
                    <div
                      class="flex items-center w-full space-x-2 max-w-[440px]"
                    >
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-32"
                      />
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                      />
                      <div
                        class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"
                      />
                    </div>
                    <div
                      class="flex items-center w-full space-x-2 max-w-[360px]"
                    >
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                      />
                      <div
                        class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"
                      />
                      <div
                        class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                      />
                    </div>
                    <span class="sr-only">for registered users only...</span>
                  </div>
                {/if}
                {#if data.alld.sqadualed || data.alld.sqadualedf}
                                <p
                  style="line-height: 1;"
                  class="text-sm text-gray-100 flex items-center lg:text-2xl m-5"
                >
                  <img
                    class="w-6 lg:w-12"
                    src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
                    alt="howmuch"
                  />
                {#if data.alld.sqadualed}
                <span> {new Date(data.alld?.sqadualed).toLocaleDateString()}</span>
                {/if}
                 {#if data.alld.sqadualedf}
                <span> - {new Date(data.alld?.sqadualedf).toLocaleDateString()}</span>
                {/if}
                  </p>
                {/if}  
                <p
                  style="line-height: 1;"
                  class="text-sm text-gray-100 flex items-center lg:text-2xl m-5"
                >
                  <img
                    class="w-6 lg:w-12"
                    src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
                    alt="howmuch"
                  />
                  <span>
                  <span>{data.alld.price}</span>
                  {#if data.alld.price != data.alld.easy}
                    <span> ↔️ {data.alld.easy}</span>
                  {/if}
                  </span>
                  {#if data.alld.kindOf != "total" && data.alld.hm > 1}
                    <span> ✖️ {data.alld.hm} {units[$lang]}</span>
                  {/if}
                  {#if data.alld.kindOf == "monthly" || data.alld.kindOf == "years" || data.alld.kindOf == "rent"}
                    <span> ✖️ {montsi(data.alld.kindOf,data.alld.sqadualed,data.alld.sqadualedf,true)} 
                    {#if data.alld.kindOf == "monthly" || data.alld.kindOf == "rent"}
                      <span>{monts[$lang]}</span>
                      {:else if data.alld.kindOf == "years"}
                      <span>{years[$lang]}</span>
                      {/if}
                    </span>
                  {/if}
                  {#if data.alld.kindOf != "total"}
                    <span> 🟰 {data.alld.price * data.alld.hm * montsi(data.alld.kindOf, data.alld.sqadualed, data.alld.sqadualedf,true)}
                      {#if data.alld.price != data.alld.easy}
                      <span> ↔️ {data.alld.easy * data.alld.hm * montsi(data.alld.kindOf, data.alld.sqadualed, data.alld.sqadualedf,true)}
                      </span>
                      {/if}
                      {total[$lang]}
                    </span>
                  {/if}
                </p>
                {#if alr == true && alrr == false && !data.alld.declinedsps.data.map((c) => c.id).includes(data.uid)}
                  <div class="flex justify-center">
                  {#if easychoose != true}
                  <button
                    on:click={torange}
                     class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full"
                    >{creatnew[$lang]}</button
                  >
                  {:else}
                    <h3 class="text-barbi">{rangehead[$lang]}</h3>
                    <div class="w-full">

                    <RangeSlider 
                    float={true}
                    on:stop={(e) => { console.log(e) }}
                    bind:values={easyy} min=0 max={Number(data.alld.easy) ?? Number(data.alld.price)}  />
                    </div>
                    <!----<input type="range" min=0 max={data.alld.easy} bind:value={easyy}/>-->
                  <button
                    on:click={()=>ask(0)}
                     class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full"
                    >{okk[$lang]}</button
                  >
                  {/if}
                  {#if tochoose != true && alrr == false}
                  <button
                    on:click={tochoos}
                    class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full"
                    >{choosee[$lang]}</button
                  >
                {:else if alrr == false}
                  {#if loading == true || loading !=true && mash.length >0}
                  <div class="m-4 mt-6">
                  <MultiSelect  
                    {loading}
                    --sms-open-z-index=4
                    --sms-options-max-height="10vh"
                    --sms-text-color="var(--barbi-pink)"
                    --sms-max-width="100%"
                    bind:selected
                    maxSelect={1}
                    placeholder={plh[$lang]}
                    noMatchingOptionsMsg={nom[$lang]}
                    options={mash.map(c => c.attributes.name)}/>
                    </div>
                    {:else}
                    <div class="m-4 mt-6">
                    <p class="text-barbi">{nomash[$lang]}</p>
                    </div>
                    {/if}
                    {#if selected.length>0}
                      <button
                    on:click={afterChoose}
                    class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full"
                    >{ok[$lang]}</button
                  > 
                    {/if}
                  {/if}
                  </div>
                  {/if}
              </div>
              <div class="">
                <Share
                  slug={'/availableResorce/' + $page.data?.mId}
                  title={data.alld?.title[$lang]}
                  desc="it's new thing"
                  hashtags={['1💗1', 'consensus']}
                  quote={data.alld?.title[$lang]}
                  related={[]}
                  via={''}
                />
              </div>
            </div>

            {#if $page.data.tok != false}
              <div class="flex justify-center min-h-fit">
                {#if alr == false && !data.alld.declinedsps.data.map((c) => c.id).includes(data.uid)}
                  <button
                    on:click={second}
                    on:mouseenter={() => (hovered = true)}
                    on:mouseleave={() => (hovered = false)}
                    class:button-perl={hovered == false}
                    class:button-gold={hovered == true}
                    class=" mx-auto mt-7 text-3xl px-4 py-3 hover:text-black hover:font-bold text-barbi"
                    >{iwantto[$lang]}</button
                  >
                
                {:else if data.alld.declinedsps.data.map((c) => c.id).includes(data.uid)}
                  <h3 class="button-perl text-barbi px-4 py-1">
                    {alri[$lang]}
                  </h3>
                {/if}
              </div>
            {:else}
              <div class="flex justify-center">
                <div
                  role="contentinfo"
                  class="mx-8 mt-7 text-barbi hover:text-black"
                  on:mouseenter={() => (hovered = true)}
                  on:mouseleave={() => (hovered = false)}
                  class:button-perl={hovered == false}
                  class:button-gold={hovered == true}
                >
                  <p class="text-center font-bold text-2xl p-2">
                    {info[$lang]}
                  </p>
                  <div class="flex flex-row flex-auto justify-between">
                    <button
                      class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                      on:click={reg}>{registratio[$lang]}</button
                    >
                    <button
                      class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                      on:click={login}>{logi[$lang]}</button
                    >
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else if data.alld?.archived == true}
    <div class="text-center pt-14">
      <h1 class="text-barbi sm:text-xl my-5">{mand[$lang]}</h1>
      {#if $page?.data.tok != false}
        <a
          href="/lev"
          class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl"
          >{tolev[$lang]}</a
        >
      {:else}
        <div class="  w-screen">
          <div class="w-1/2 mx-auto border border-barbi button-bronze">
            <h3 class="font-bold text-2xl p-2">{info[$lang]}</h3>
            <div class="flex flex-row flex-auto justify-between">
              <button
                class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                on:click={reg}>{registratio[$lang]}</button
              >
              <button
                class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                on:click={login}>{logi[$lang]}</button
              >
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
  <div class="text-center pt-14">
    <h3 class="text-barbi sm:text-xl my-5">error | שגיאה</h3>
    {#if $page.data.tok != false}
      <a
        href="/lev"
        class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl"
        >{tolev[$lang]}</a
      >
    {:else}
      <div class="  w-screen">
        <div class="w-1/2 mx-auto border border-barbi button-bronze">
          <h1 class=" font-bold text-2xl p-2">{info[$lang]}</h1>
          <div class="flex flex-row flex-auto justify-between">
            <button
              class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
              on:click={reg}>{registratio[$lang]}</button
            >
            <button
              class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
              on:click={login}>{logi[$lang]}</button
            >
          </div>
        </div>
      </div>
    {/if}
  </div>
  {/if}
{:else}
  <div class="text-center pt-14">
    <h3 class="text-barbi sm:text-xl my-5">error | שגיאה</h3>
    {#if $page.data.tok != false}
      <a
        href="/lev"
        class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl"
        >{tolev[$lang]}</a
      >
    {:else}
      <div class="  w-screen">
        <div class="w-1/2 mx-auto border border-barbi button-bronze">
          <h1 class=" font-bold text-2xl p-2">{info[$lang]}</h1>
          <div class="flex flex-row flex-auto justify-between">
            <button
              class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
              on:click={reg}>{registratio[$lang]}</button
            >
            <button
              class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
              on:click={login}>{logi[$lang]}</button
            >
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
