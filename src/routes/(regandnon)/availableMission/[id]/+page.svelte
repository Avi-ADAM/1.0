<script>
  import { toast } from 'svelte-sonner';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import { goto } from '$app/navigation';

  //TODO: get asked from server then show you alr .., find a way to get title
  let error1 = null;
  /**
   * @typedef {Object} Props
   * @property {any} [askedarr]
   * @property {boolean} [alr]
   * @property {any} data
   */

  /** @type {Props} */
  let { askedarr = $bindable([]), alr = $bindable(false), data } = $props();

  let success = $state(false);
  function project(x) {
    goto('/project/' + x);
  }
  import { sendToSer } from '$lib/send/sendToSer.js';

  async function ask() {
    alr = true;
    const inD = data.alld;
    if (!inD || !inD.attributes.project || !inD.attributes.project.data) {
      toast.error('שגיאה בטעינת נתוני הפרויקט');
      return;
    }

    const uId = data.uid;
    if (!uId) {
      toast.error('נא להתחבר מחדש למערכת');
      return;
    }

    const projectUserIds =
      inD.attributes.project.data.attributes.user_1s.data.map((t) => t.id);

    // If only one user in project and it's me - create mesimabetahalich directly
    if (projectUserIds.length === 1 && projectUserIds.includes(uId)) {
      const token = page.data.tok;

      if (!token) {
        toast.error('נא להתחבר מחדש למערכת');
        return;
      }

      try {
        const { createMesimabetahalich, afterMesimabetahalikhCreation } =
          await import('$lib/utils/createMesimabetahalich.js');

        const result = await createMesimabetahalich({
          projectId: inD.attributes.project.data.id,
          missId: inD.attributes.mission?.data?.id || data.mId,
          openMid: data.mId,
          userId: uId,
          currentUserId: uId,
          openmissionName: inD.attributes.name,
          missionDetails: inD.attributes.descrip || '',
          nhours: inD.attributes.noofhours,
          valph: inD.attributes.perhour,
          iskvua: inD.attributes.iskvua || false,
          hearotMeyuchadot: inD.attributes.hearotMeyuchadot || '',
          privatlinks: inD.attributes.privatlinks || '',
          publicklinks: inD.attributes.publicklinks || '',
          tafkidims: inD.attributes.tafkidims.data,
          deadline: inD.attributes.dates,
          sqedualed: inD.attributes.sqadualed,
          projectUserIds: projectUserIds,
          sendToSer
        });

        if (result?.data?.createMesimabetahalich) {
          await afterMesimabetahalikhCreation({
            miDatan: result,
            isNewUser: false,
            iskvua: inD.attributes.iskvua || false,
            sqedualed: inD.attributes.sqadualed,
            deadline: inD.attributes.dates,
            userId: uId,
            currentUserId: uId,
            useraplyname: data.username || '',
            projectName: inD.attributes.project.data.attributes.projectName,
            src2:
              inD.attributes.project.data.attributes.profilePic.data?.attributes
                .url || '',
            openmissionName: inD.attributes.name,
            lang: $lang,
            sendToSer,
            projectUserData: null
          });

          success = true;
          setTimeout(() => {
            success = false;
          }, 15000);
          toast.success('המשימה נוצרה בהצלחה!');
          return;
        } else {
          toast.error('שגיאה ביצירת המשימה');
          return;
        }
      } catch (error) {
        console.error('שגיאה ביצירת משימה:', error);
        toast.error('אירעה שגיאה ביצירת המשימה');
        return;
      }
    }

    const d1 = await sendToSer(
      { id: uId },
      '80usersPermissionsUserWithAskeds',
      0,
      0,
      false,
      fetch
    );

    // Accessing deep property safely
    const r = d1?.data?.usersPermissionsUser?.data?.attributes?.askeds?.data;
    if (r && r.length > 0) {
      const p = r.map((c) => c.id);
      askedarr = p;
    }

    let myvote = [];
    try {
      let pid = inD.attributes.project.data.attributes.user_1s.data.map(
        (t) => t.id
      );
      if (pid.includes(uId)) {
        let d = new Date();
        myvote = [
          {
            what: true,
            users_permissions_user: uId,
            ide: parseInt(uId),
            zman: d.toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('שגיאה בעיבוד הבקשה:', error);
      toast.error('אירעה שגיאה בעיבוד הבקשה');
      return;
    }

    const as = [...askedarr];
    as.push(`${data.mId}`);

    // First, update the user's askeds list
    await sendToSer(
      {
        userId: uId,
        askedsList: as
      },
      '81updateAskeds',
      0,
      0,
      false,
      fetch
    );

    // Then, create the Ask
    const d2 = await sendToSer(
      {
        userId: uId,
        openMissionId: data.mId,
        projectId: inD.attributes.project.data.id,
        publishedAt: new Date().toISOString(),
        vote: myvote
      },
      '81.5createAsk',
      0,
      0,
      false,
      fetch
    );

    const r2 = d2.data;
    console.log(r2);
    if (r2 != null && r2.createAsk) {
      let restime = inD.attributes.project.data.attributes.restime;
      let x = calcX(restime);
      let fd = new Date(Date.now() + x);
      let hiluzId = r2.createAsk.data.id;

      const d3 = await sendToSer(
        {
          date: fd.toISOString(),
          whatami: 'ask',
          askId: hiluzId
        },
        '82createTimegramaForAsk',
        0,
        0,
        false,
        fetch
      );

      const r3 = d3.data;
      console.log(r3);
      if (r3 != null) {
        success = true;
        setTimeout(function () {
          success = false;
        }, 15000);
        toast.success(`${fnnn[$lang]}`);
      }
    }
  }

  let hovered = $state(false);

  function hover(a) {}
  console.log(data);
  const fnnn = { he: 'הבקשה נשלחה בהצלחה', en: 'request has sent sucsesfully' };

  const headi = {
    he: 'הצעה למשימה',
    en: 'suggested mission'
  };
  const om = {
    he: 'משימה פתוחה',
    en: 'open mission'
  };
  const requireSkills = {
    he: 'כישורים נדרשים:',
    en: 'required skills:'
  };
  const seePr = {
    he: 'לצפיה בריקמה',
    en: 'see the freeMates page'
  };
  const requiredRoles = {
    he: 'תפקידים נדרשים:',
    en: 'required roles:'
  };
  const requiredWW = {
    he: 'דרכי עבודה מבוקשות:',
    en: 'ways of work for the mission:'
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
    goto(`/login?from=availableMission/${data.mId}`);
  }
  let wid = $state();
  const mand = {
    he: 'המשימה אוישה בהצלחה',
    en: 'the mission has already assigned'
  };
  const alri = {
    he: 'כבר הגשת בקשה לבצע את המשימה הזו',
    en: 'you have already requested to do this mission'
  };
  const iwantto = { he: 'אני אשמח לבצע!', en: 'I want to do it!' };
  const info = {
    he: 'בכדי לבקש להצטרף לצוות ולבצע את המשימה וגם בכדי לקבל הצעות למשימות, לפתוח רקמות (פרויקטים) חדשות ולהתנהל בהן בהסכמה יש להתחבר או להירשם',
    en: 'You are not connected'
  };
  const registratio = { he: 'להרשמה', en: 'To Registration' };
  const logi = { he: 'להתחברות', en: 'To Login' };
  const perho = { he: 'לשעה', en: 'per hour' };
  const hourss = { he: 'שעות', en: 'hours' };
  const monhly = { he: 'בחודש', en: 'per month' };
  const foreg = {
    he: 'כדי לראות את כל המידע נדרשת התחברות או הרשמה',
    en: 'some information is available only for registersd users'
  };
  import { Head } from 'svead';
  import { calcX } from '$lib/func/calcX.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';

  let title = 'This is Svead a Svelte Head Component';
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;
  let description = page.data.alld?.attributes?.descrip || om[$lang];
  let url = page.url.toString();
  //TODO: header nav menu
</script>

{#await data.alld}
  <div
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex align-middle content-center justify-center"
  >
    <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  </div>
{:then a}
  <Head
    title={data?.alld?.title[$lang] ?? headi[$lang]}
    {description}
    {image}
    {url}
  />
  <SucssesConf {success} />

  {#if data != null}
    {#if data?.alld?.attributes?.archived !== true}
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
                src={data.alld.attributes.project.data.attributes.profilePic
                  .data?.attributes.url}
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
                >{data.alld.attributes.project.data.attributes
                  .projectName}</span
              >
            </div>
          </div>
          <div>
            <button
              onclick={() => project(data.alld.attributes.project.data.id)}
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
                  <h2
                    class="text-barbi font-bold text-xl lg:text-4xl underline"
                  >
                    {data.alld.attributes.name}
                  </h2>
                  {#if data.alld.attributes.descrip !== null && data.alld.attributes.descrip !== 'null' && data.alld.attributes.descrip !== 'undefined' && data.alld.attributes.descrip !== undefined && data.alld.attributes.descrip}
                    <RichText
                      outpot={data.alld.attributes.descrip}
                      editable={false}
                    />{/if}

                  {#if data.tok == true}
                    {#if data.alld.attributes.hearotMeyuchadot !== null && data.alld.attributes.hearotMeyuchadot !== 'null' && data.alld.attributes.hearotMeyuchadot !== 'undefined' && data.alld.attributes.hearotMeyuchadot !== undefined && data.alld.attributes.hearotMeyuchadot}
                      <RichText
                        outpot={data.alld.attributes.hearotMeyuchadot}
                        editable={false}
                      />
                    {/if}
                  {:else}
                    <div
                      role="status"
                      class="space-y-2.5 animate-pulse max-w-lg"
                    >
                      <div class="flex items-center w-full space-x-2">
                        <div
                          class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                        ></div>
                      </div>
                      <div
                        class="flex items-center w-full space-x-2 max-w-[480px]"
                      >
                        <small class="text-barbi text-lg leading-3 sm:text-2xl"
                          >{foreg[$lang]}</small
                        >
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                        ></div>
                      </div>
                      <div
                        class="flex items-center w-full space-x-2 max-w-[400px]"
                      >
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                        ></div>
                      </div>
                      <div
                        class="flex items-center w-full space-x-2 max-w-[480px]"
                      >
                        <div
                          class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                        ></div>
                      </div>
                      <div
                        class="flex items-center w-full space-x-2 max-w-[440px]"
                      >
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-32"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"
                        ></div>
                      </div>
                      <div
                        class="flex items-center w-full space-x-2 max-w-[360px]"
                      >
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"
                        ></div>
                        <div
                          class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"
                        ></div>
                      </div>
                      <span class="sr-only">for registered users only...</span>
                    </div>
                  {/if}
                  {#if data.alld.attributes.sqadualed || data.alld.attributes.dates}
                    <p
                      style="line-height: 1;"
                      class="text-sm text-gray-100 flex items-center lg:text-2xl m-5"
                    >
                      <img
                        class="w-12 lg:w-24"
                        src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
                        alt="howmuch"
                      />
                      {#if data.alld.attributes.sqadualed}
                        <span>
                          {new Date(
                            data.alld?.attributes.sqadualed
                          ).toLocaleDateString($lang)}</span
                        >
                      {/if}
                      {#if data.alld.attributes.dates}
                        <span>
                          - {new Date(
                            data.alld?.attributes.dates
                          ).toLocaleDateString()}</span
                        >
                      {/if}
                    </p>
                  {/if}
                  <p
                    style="line-height: 1;"
                    class="text-sm text-gray-100 flex items-center lg:text-2xl m-5"
                  >
                    <img
                      class="w-12 lg:w-24"
                      src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
                      alt="howmuch"
                    />
                    <span
                      role="contentinfo"
                      onmouseenter={() =>
                        hover({ he: 'שווי לשעה', en: 'vallue per hour' })}
                      onmouseleave={() => hover('0')}
                    >
                      {data.alld.attributes.perhour.toLocaleString('en-US', {
                        maximumFractionDigits: 2
                      })}
                      {perho[$lang]}
                    </span>
                    *
                    <span
                      role="contentinfo"
                      onmouseenter={() =>
                        hover({ he: 'כמות השעות', en: 'amount of hours' })}
                      onmouseleave={() => hover('0')}
                    >
                      {data.alld.attributes.noofhours.toLocaleString('en-US', {
                        maximumFractionDigits: 2
                      })}
                      {hourss[$lang]}
                      {data.alld.attributes.iskvua ? monhly[$lang] : ''}</span
                    >
                    =
                    <span
                      onmouseenter={() => hover({ he: 'סך הכל', en: 'total' })}
                      onmouseleave={() => hover('0')}
                      >{(
                        data.alld.attributes.noofhours *
                        data.alld.attributes.perhour
                      ).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      {data.alld.attributes.iskvua ? monhly[$lang] : ''}
                    </span>
                  </p>
                  {#if data.alld.attributes.acts.data.length > 0}
                    <div class="border-2 border-gold">
                      <ul>
                        {#each data.alld.attributes.acts.data as datai, t}
                          <li>
                            <div
                              class="flex flex-row space-x-2 items-start border-y-2 border-y-mturk"
                            >
                              <span class="p-1">✅</span>
                              <h2 class="md:text-xl p-1 text-barbi">
                                {datai.attributes.shem}
                              </h2>
                            </div>
                          </li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                </div>
                <div class="">
                  <Share
                    slug={'availableMission/' + page.data.mId}
                    title={data.alld.title[$lang]}
                    desc="a new mission"
                    hashtags={['1💗1', 'consensus']}
                    quote={data.alld.title[$lang]}
                    related={[]}
                    via={''}
                  />
                </div>
              </div>

              {#if data.alld.attributes.skills.data.length > 0}
                <small class="text-barbi text-sm lg:text-2xl"
                  >{requireSkills[$lang]}</small
                >
                <div
                  class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 lg:p-4"
                >
                  {#each data.alld.attributes.skills.data as skill}
                    <p
                      onmouseenter={() =>
                        hover({ he: 'הכישורים הנדרשים', en: 'needed skills' })}
                      onmouseleave={() => hover('0')}
                    >
                      <Tile
                        sm={wid > 555 ? true : false}
                        big={wid > 555 ? true : false}
                        pink={true}
                        word={skill.attributes.skillName}
                      />
                    </p>
                  {/each}
                </div>
              {/if}
              {#if data.alld.attributes.tafkidims.data.length > 0}
                <small class="text-sm text-barbi lg:text-2xl"
                  >{requiredRoles[$lang]}</small
                >
                <div
                  class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle d cd p-2"
                >
                  {#each data.alld.attributes.tafkidims.data as rol}
                    <p
                      onmouseenter={() =>
                        hover({ he: 'תפקיד מבוקש', en: 'requested role' })}
                      onmouseleave={() => hover('0')}
                      class="m-0"
                      style="text-shadow:none;"
                    >
                      <Tile
                        sm={wid > 555 ? true : false}
                        big={wid > 555 ? true : false}
                        word={rol.attributes.roleDescription}
                        wow={true}
                      />
                    </p>{/each}
                </div>
              {/if}
              {#if data.alld.attributes.work_ways.data.length > 0}
                <small class="text-sm lg:text-2xl text-barbi"
                  >{requiredWW[$lang]}</small
                >
                <div
                  class="border border-gold flex sm:flex-row flex-wrap lg:p-4 justify-center align-middle d cd p-2"
                >
                  {#each data.alld.attributes.work_ways.data as rol}
                    <p
                      onmouseenter={() =>
                        hover({
                          he: 'דרכי עבודה מבוקשות',
                          en: 'ways of work for the mission'
                        })}
                      onmouseleave={() => hover('0')}
                      class="m-0"
                      style="text-shadow:none;"
                    >
                      <Tile
                        bg="gold"
                        sm={wid > 555 ? true : false}
                        big={wid > 555 ? true : false}
                        word={rol.attributes.workWayName}
                      />
                    </p>
                  {/each}
                </div>
              {/if}
              {#if page.data.tok != false}
                <div class="flex justify-center">
                  {#if alr == false && !data.alld.attributes.users.data
                      .map((c) => c.id)
                      .includes(data.uid)}
                    <button
                      onclick={ask}
                      onmouseenter={() => (hovered = true)}
                      onmouseleave={() => (hovered = false)}
                      class:button-perl={hovered == false}
                      class:button-gold={hovered == true}
                      class=" mx-auto mt-7 text-3xl px-4 py-3 hover:text-black hover:font-bold text-barbi"
                      >{iwantto[$lang]}</button
                    >
                  {:else if data.alld.attributes.users.data
                    .map((c) => c.id)
                    .includes(data.uid)}
                    <h3 class="button-perl text-barbi px-4 py-1">
                      {alri[$lang]}
                    </h3>
                  {/if}
                </div>
              {:else}
                <div class="flex justify-center">
                  <div
                    class="mx-8 mt-7 text-barbi hover:text-black"
                    role="contentinfo"
                    onmouseenter={() => (hovered = true)}
                    onmouseleave={() => (hovered = false)}
                    class:button-perl={hovered == false}
                    class:button-gold={hovered == true}
                  >
                    <p class="text-center font-bold text-2xl p-2">
                      {info[$lang]}
                    </p>
                    <div class="flex flex-row flex-auto justify-between">
                      <button
                        class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                        onclick={reg}>{registratio[$lang]}</button
                      >
                      <button
                        class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                        onclick={login}>{logi[$lang]}</button
                      >
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center pt-14">
        <h1 class="text-barbi sm:text-xl my-5">{mand[$lang]}</h1>
        {#if page.data.tok != false}
          <a
            href="/lev"
            class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl"
            >לצפיה במשימות אחרות ובכל העדכונים שלך</a
          >
        {:else}
          <div class="  w-screen">
            <div class="w-1/2 mx-auto border border-barbi button-bronze">
              <h3 class="font-bold text-2xl p-2">{info[$lang]}</h3>
              <div class="flex flex-row flex-auto justify-between">
                <button
                  class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                  onclick={reg}>{registratio[$lang]}</button
                >
                <button
                  class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                  onclick={login}>{logi[$lang]}</button
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
      {#if page.data.tok != false}
        <a
          href="/lev"
          class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl"
          >לצפיה במשימות אחרות ובכל העדכונים שלך</a
        >
      {:else}
        <div class="  w-screen">
          <div class="w-1/2 mx-auto border border-barbi button-bronze">
            <h1 class=" font-bold text-2xl p-2">{info[$lang]}</h1>
            <div class="flex flex-row flex-auto justify-between">
              <button
                class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                onclick={reg}>{registratio[$lang]}</button
              >
              <button
                class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4"
                onclick={login}>{logi[$lang]}</button
              >
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
{/await}
