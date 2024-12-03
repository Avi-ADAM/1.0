<script>
  import { addslashes } from '$lib/func/uti/string.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { beforeUpdate } from 'svelte';
  import moment from 'moment';
  import { lang } from '$lib/stores/lang.js';
  import MultiSelect from 'svelte-multiselect';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { calcX } from '$lib/func/calcX.svelte';
  import { SendTo } from '$lib/send/sendTo.svelte';
  import Button from '$lib/celim/ui/button.svelte';

  const dispatch = createEventDispatcher();
  let token;
  export let needr = [];
  export let projectId;
  let mash = [];
  $: showResourceOptions = {}; // לשמירת מצב התצוגה של אפשרויות המשאבים לכל שורה
  $: availableResourcesByRow = {}; // מערך המשאבים הזמינים לכל שורה
  $: loadingByRow = {}; // מצב טעינה לכל שורה
  $: newResourceByRow = {}; // מעקב אחר בחירת משאב חדש לכל שורה
  $: resourceReceivedByRow = {}; // מעקב אחר קבלת משאב לכל שורה

  // טקסט קבוע ליצירת משאב חדש
  const NEW_RESOURCE_TEXT = {
    he: 'יצירת משאב חדש...',
    en: 'Creating new resource...'
  };

  // טקסט לכפתור קבלת משאב
  const RESOURCE_RECEIVED_TEXT = {
    he: 'האם המשאב התקבל?',
    en: 'Was the resource received?'
  };

  const selfAssign = { he: 'השמה לעצמי', en: 'Self Assignment' };

  async function loadUserResources(resourceId) {
    const que1 = `query { 
        usersPermissionsUser (id: ${idL}){
            data{
                id
                attributes{
                    username
                    sps (filters: { mashaabim: { id: { eq: ${resourceId} } } }){
                        data {
                            id
                            attributes {
                                name
                            }
                        }
                    }
                }
            }
        }
    }`;

    try {
      const d1 = await SendTo(que1);
      console.log('Resources loaded for resource ID:', resourceId, d1);
      return d1.data.usersPermissionsUser.data.attributes.sps.data;
    } catch (error) {
      console.error('Error loading resources:', error);
      return [];
    }
  }

  async function handleAssignment(element, index) {
    console.log('Handling assignment for element:', element);

    if (!element || !element.id) {
      console.error('Invalid element or missing ID:', element);
      return;
    }

    try {
      // מחליף את מצב התצוגה של אפשרויות המשאבים
      showResourceOptions[index] = !showResourceOptions[index];
      showResourceOptions = showResourceOptions;

      if (showResourceOptions[index]) {
        // סימון שהשורה בטעינה
        loadingByRow[index] = true;
        loadingByRow = loadingByRow;

        try {
          const resources = await loadUserResources(element.id);
          availableResourcesByRow[index] = resources || [];
          availableResourcesByRow = availableResourcesByRow;

          // אם אין משאבים זמינים, מסמנים אוטומטית את 'צור חדש'
          if (!resources || resources.length === 0) {
            console.log("No resources found, marking 'Create New' as selected");
            createNewResource(element, index);
          }
        } catch (error) {
          console.error('Error loading resources:', error);
        } finally {
          // מסיימים את מצב הטעינה
          loadingByRow[index] = false;
          loadingByRow = loadingByRow;
        }
      }
    } catch (error) {
      console.error('Error in handleAssignment:', error);
      showResourceOptions[index] = false;
      showResourceOptions = showResourceOptions;
    }
  }

  async function createNewResource(element, index) {
    // מסמנים שנבחר משאב חדש
    newResourceByRow[index] = true;
    // מאפסים בחירות קודמות בשורה זו
    meData[index].selectedResource = [NEW_RESOURCE_TEXT[$lang]]; // שימוש בטקסט ידידותי למשתמש
    meData = meData; // מעדכן את הריאקטיביות
    console.log(
      'Creating new resource for:',
      element,
      'in meData:',
      meData[index]
    );
  }

  async function handleResourceSelection() {
    if (!selectedResource || !currentElement) return;

    let d = new Date();
    console.log(
      'Creating resource assignment with selected resource:',
      selectedResource
    );

    try {
      // Create askm with the selected resource
      const quet = `mutation { 
            createAskm(
                data:{ 
                    publishedAt: "${d.toISOString()}",
                    open_mashaabim: ${currentElement.id},
                    project: ${projectId},
                    sp: ${selectedResource},
                    users_permissions_user: ${idL}
                }
            ){
                data {id}
            }
            updateSp(
                id: "${selectedResource}" 
                data: {declinedm: "${currentElement.id}" }
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
        }`;

      const result = await SendTo(quet);
      console.log('Resource assignment created:', result);

      if (result?.data?.createAskm?.data?.id) {
        // Handle timegrama creation if needed
        const hiluzId = result.data.createAskm.data.id;
        let restime = currentElement.attributes.restime;
        let x = calcX(restime);
        let fd = new Date(Date.now() + x);

        const quee = `mutation 
            {createTimegrama(
                data:{
                    date: "${fd.toISOString()}",
                    whatami: "askm",
                    askm:  "${hiluzId}",
                }
            ){
                data {id}
            }
            }`;

        const timeResult = await SendTo(quee);
        console.log('Timegrama created:', timeResult);
      }

      showResourceDialog = false;
      selectedResource = null;
      currentElement = null;
    } catch (error) {
      console.error('Error creating resource assignment:', error);
      error1 = error;
    }
  }

  async function han() {
    console.log('Handling assignments for meData:', meData);
    already = true;
    let d = new Date();
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    if (userslength > 1) {
      linkop = 'createPmash';
      qwerys = 'pmash';
      pendq = ` users: [
     {
      what: true
      users_permissions_user: "${idL}"
      ide: ${idL}
      order: 0
      zman: "${d.toISOString()}"
    }
  ]`;
    } else if (userslength === 1) {
      linkop = 'createOpenMashaabim';
      qwerys = 'openMashaabim';
    }
    for (let i = 0; i < meData.length; i++) {
      const data = meData[i];
      let isAssigned = false;
      let isReceived = false;
      if (data.assignedTo && data.assignedTo.length > 0) {
        const assignedUsername = data.assignedTo[0];
        const assignedUser = pu.find(
          (user) => user.attributes.username === assignedUsername
        );
        isAssigned = true;
        isReceived = resourceReceivedByRow[i];
        if (assignedUser && assignedUser.id === idL) {
          // בודקים אם נבחר משאב חדש
          if (newResourceByRow[i]) {
            // מחכים ליצירת משאב חדש ומקבלים את ה-ID שלו
            try {
              const newResourceParams = {
                name: data.attributes.name,
                descrip: data.attributes.descrip || '',
                kindOf: data.attributes.kindOf || 'null',
                unit: data.hm || 'null',
                spnot: data.spnot || '',
                price: data.attributes.price || 0,
                myp: data.attributes.easy || false,
                linkto: data.attributes.linkto || '',
                userId: idL,
                resourceId: data.id,
                ...(data.attributes.dates && {
                  sdate: new Date(data.attributes.dates).toISOString()
                }),
                ...(data.attributes.datef && {
                  fdate: new Date(data.attributes.datef).toISOString()
                })
              };
              console.log(
                'Creating new resource with params:',
                newResourceParams
              );
              console.log(
                resourceReceivedByRow[i]
                  ? 'יוצר משאב שהסתיים - Resource creation completed'
                  : 'יוצר משאב בתהליך - Resource creation in progress'
              );

              // קריאה לפונקציה שיוצרת משאב חדש
              const newResourceResult =
                await createNewResourceInDB(newResourceParams);
              const spId = newResourceResult.data.id;
              console.log('New resource created with ID:', spId);

              // שמירת ה-ID של המשאב החדש
              console.log('Saving spId for row', i, 'with ID:', spId);
              data.spId = spId;
            } catch (error) {
              console.error('Error creating new resource:', error);
              continue;
            }
          } else if (
            data.selectedResource &&
            data.selectedResource.length > 0
          ) {
            // משאב קיים נבחר - מוצאים את ה-ID שלו
            try {
              const selectedResourceName = data.selectedResource[0];
              const selectedResource = availableResourcesByRow[i]?.find(
                (res) => res.attributes.name === selectedResourceName
              );

              if (selectedResource) {
                data.spId = selectedResource.id;
                console.log('Selected existing resource with ID:', data.spId);
              } else {
                console.error(
                  'Selected resource not found in available resources'
                );
                continue;
              }
            } catch (error) {
              console.error('Error processing selected resource:', error);
              continue;
            }
          } else {
            console.log('No resource selected for row', i);
            continue;
          }

          // כאן נמשיך לשלב הבא עם ה-spId שיש לנו
          console.log('Proceeding to next step with spId:', data.spId);
          // המשך הלוגיקה הקיימת...
        }
      }

      const spnot = data.spnot !== undefined ? addslashes(data.spnot) : '';
      const hm = data.hm > 0 ? data.hm : 1;
      const price = data.attributes.price > 0 ? data.attributes.price : 0;
      const easy = data.attributes.easy > 0 ? data.attributes.easy : 0;
      const sdate =
        data.attributes.dates !== undefined
          ? `sqadualed: "${new Date(data.attributes.dates).toISOString()}",`
          : ``;
      const fdate =
        data.attributes.datef !== undefined
          ? ` sqadualedf: "${new Date(data.attributes.datef).toISOString()}" ,`
          : ``;
      let link = baseUrl + '/graphql';

      try {
        await fetch(link, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `mutation { ${linkop}(
                        data: { 
                            name: "${addslashes(data.attributes.name)}",
                            descrip: """${addslashes(data.attributes.descrip)}""",
                            project: "${projectId}",
                            kindOf: ${data.attributes.kindOf},
                            hm: ${hm},
                            spnot: """${spnot}""",  
                            price: ${price},
                            easy: ${easy},   
                            linkto: "${data.attributes.linkto}",
                            mashaabim: "${data.id}",
                            publishedAt: "${d.toISOString()}",
                            ${isAssigned ? `archived: true,` : ``}
                            ${sdate} 
                            ${fdate}
                            ${pendq}
                        }
                    ) {data{id attributes{ project{data{ id }}}}}
                    } `
          })
        })
          .then((r) => r.json())
          .then((data) => (miDatan = data));
        console.log(miDatan);
        if (isAssigned) {
          let hiluz = miDatan.data.createOpenMashaabim.data.id;
          let que = ``;
          if (!isReceived) {
            que = `mutation 
                        { createMaap(
      data: {project: "${projectId}",
             name: """${data.attributes.name}""",
             sp: "${data.spId}",
            publishedAt: "${d.toISOString()}",         
             open_mashaabim: ${hiluz}
                  }
  ) {data{attributes{project{data{id }}}}}
          }
        `;
          } else if (isReceived) {
            let total = 0;
            const kindOf = data.attributes.kindOf;
            const agprice = data.attributes.easy > 0 ? data.attributes.easy : data.attributes.price;
            if (kindOf === 'perUnit') {
              total = agprice * hm;
            } else if (kindOf === 'total' || kindOf === 'rent') {
              total = agprice;
            } else if (kindOf === 'monthly') {
              total = agprice * monts;
            } else if (kindOf === 'yearly') {
              total = agprice * yers;
            }
            const date = (data.attributes.dates !== undefined) ? `sqadualed: "${new Date(data.attributes.dates).toISOString()}",` : ``;
            const sdate = (data.attributes.datef !== undefined) ? `sqadualef: "${new Date(data.attributes.datef).toISOString()}",` : ``;
                /*
                 updateMaap(
 id: "${askId}"
  data: {archived: true,
vots: [${userss}, 
       {
        what: true
        users_permissions_user: "${idL}"
      }
    ]}
) {data{id attributes{ archived}}}
                 */
            que = `mutation 
                        { createRikmash(
             data: {
                      publishedAt: "${d.toISOString()}",
                 total: ${total},
              name: """${data.attributes.name}""",
              kindOf: ${kindOf},
              price: ${price},
              agprice: ${easy},
              project: ${projectId},
              hm: ${hm},
              open_mashaabim: "${hiluz}",
              spnot: """${spnot}""",
              users_permissions_user: "${idL}",
              sp: "${data.spId}",
              ${date}
               ${sdate}
                    }){data {id }}
                updateSp( 
                  id: "${data.spId}"
                  data: {panui: false}
                ){data{id}}
                }
                `;
          }
          console.log(que);
          let v = await SendTo(que);
          console.log(v);
        }
        if (userslength > 1 && data.assignedTo && data.assignedTo.length > 0) {
          let fd = new Date(Date.now() + x);
          let hiluzpend = miDatan.data.createPmash.data.id;
          let quee = `mutation 
                {createTimegrama(
                    data:{
                        date: "${fd.toISOString()}",
                        whatami: "pmash",
                        pmash:  "${hiluzpend}",
                    }
                ){
                    data {id}
                }
                }`;
          let v = await SendTo(quee);
          console.log(v);
          let data = {
            pu: pu,
            pn: pn,
            pl: pl,
            restime: restime,
            pid: projectId,
            uid: idL,
            kind: 'pendmash',
            name: addslashes(data.attributes.name)
          };
          fetch('/api/nuti', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
            .then((response) => response)
            .then((data) => {
              console.log('Success:', data);
            })
            .catch((error) => {
              console.error('Error:', error);
            });
        }
        meData = [];
        if (miDatan.data) dispatch('close');
      } catch (e) {
        error1 = e;
      }
    }
  }

  async function upd() {}

  async function createNewResourceInDB(params) {
    const mutation = `mutation {
        createSp(
            data: {
                name: "${params.name}",
                descrip: "${params.descrip || ''}",
                kindOf: ${params.kindOf || 'null'},
                unit: ${params.unit || 'null'},
                spnot: "${params.spnot || ''}",
                price: ${params.price || 0},
                myp: ${params.myp || false},
                linkto: "${params.linkto || ''}",
                users_permissions_user: "${params.userId}",
                mashaabim: "${params.resourceId}",
                publishedAt: "${new Date().toISOString()}"
                ${params.startDate ? `startDate: "${params.startDate}"` : ''}
                ${params.finishDate ? `finishDate: "${params.finishDate}"` : ''}
            }
        ) {
            data {
                id
                attributes {
                    name
                }
            }
        }
    }`;

    try {
      const result = await SendTo(mutation);
      return result.data.createSp;
    } catch (error) {
      console.error('Error in createNewResourceInDB:', error);
      throw error;
    }
  }

  onMount(async () => {
    myMi();

    myMissionH();
    myMi();
  });
  beforeUpdate(async () => {
    upd();
  });
  const baseUrl = import.meta.env.VITE_URL;

  export let pu, pn, pl, restime;
  let x = calcX(restime);
  let linkop = ``;
  let already = false;
  let idL = $page.data.uid;
  let qwerys = ``;
  let pendq = ``;
  export let userslength = 0;

  let km = false;
  let ky = false;
  let kc = false;

  function myMi() {
    for (var i = 0; i < meData.length; i++) {
      meData[i].hm = 1;
      meData[i].attributes.easy = meData[i].attributes.price;
      meData[i].attributes.dates = new Date().toISOString().slice(0, -1);
      meData[i].attributes.datef = new Date(
        new Date().setFullYear(new Date().getFullYear() + 2)
      )
        .toISOString()
        .slice(0, -1);
    }
  }

  function myMissionH() {
    km = false;
    ky = false;
    kc = false;
    for (var i = 0; i < meData.length; i++) {
      meData[i].attributes.price < 0
        ? (meData[i].attributes.price = 0)
        : meData[i].attributes.price;
      meData[i].attributes.easy < 0
        ? (meData[i].attributes.easy = 0)
        : meData[i].attributes.easy;
      console.log(meData[i].attributes.easy, 'to to');

      if (meData[i].attributes.kindOf === 'monthly') {
        var a = moment(meData[i].attributes.datef);
        var b = moment(meData[i].attributes.dates);
        meData[i].monts = a.diff(b, 'months', true).toFixed(2);
        ky = true;
        meData[i].m = true;
        meData[i].ky = true;
        meData[i].kc = false;
        meData[i].r = false;
        meData[i].y = false;
        meData[i].total = meData[i].monts * meData[i].attributes.price;
        meData[i].totaltotal = meData[i].monts * meData[i].attributes.easy;
      } else if (meData[i].attributes.kindOf === 'yearly') {
        var a = moment(meData[i].attributes.datef);
        var b = moment(meData[i].attributes.dates);
        meData[i].years = a.diff(b, 'years', true).toFixed(2);
        ky = true;
        meData[i].y = true;
        meData[i].m = false;
        meData[i].r = false;
        meData[i].ky = true;
        meData[i].kc = false;
        meData[i].total = (
          meData[i].years * meData[i].attributes.price
        ).toFixed(2);
        meData[i].totaltotal = (
          meData[i].years * meData[i].attributes.easy
        ).toFixed(2);
      } else if (meData[i].attributes.kindOf === 'rent') {
        meData[i].y = false;
        ky = true;
        meData[i].r = true;
        meData[i].ky = true;
        meData[i].m = false;
        meData[i].kc = false;
        meData[i].total = meData[i].attributes.price;
        meData[i].totaltotal = meData[i].attributes.easy;
      } else if (meData[i].attributes.kindOf === 'perUnit') {
        meData[i].y = false;
        meData[i].kc = true;
        meData[i].ky = false;
        meData[i].m = false;
        meData[i].r = false;
        meData[i].hm >= 1 ? meData[i].hm : 1;
        kc = true;
        meData[i].total = meData[i].hm * meData[i].attributes.price;
        meData[i].totaltotal = meData[i].hm * meData[i].attributes.easy;
      } else {
        meData[i].y = false;
        meData[i].kc = false;
        meData[i].ky = false;
        meData[i].m = false;
        meData[i].r = false;
        meData[i].t = true;

        meData[i].total = meData[i].attributes.price;
        meData[i].totaltotal = meData[i].attributes.easy;
      }
    }
  }

  function remove(id) {
    dispatch('remove', {
      id: id,
      data: meData
    });
  }

  export let meData = [];
  let miDatan = [];
  let error1 = null;
  let loading = false;
  let success = false;
  let error = false;

  async function createResources() {
    loading = true;
    error = false;
    success = false;
    try {
      await han();
      success = true;
    } catch (err) {
      error = true;
      error1 = err.message;
    } finally {
      loading = false;
    }
  }

  const ot = { he: 'עלות חד פעמית', en: 'one time' };
  const py = { he: 'ליחידה', en: 'per unit' };
  const pm = { he: 'חודשי', en: 'monthly' };
  const pye = { he: 'שנתי', en: 'yearly' };
  const re = { he: 'השכרה לזמן קצוב', en: 'rent' };
  const assignTo = { he: 'הקצה ל', en: 'Assign to' };
  const nom = { he: 'אין חברי פרויקט', en: 'No project members' };
  const choosee = {
    he: 'בחירה מתוך המשאבים שלי',
    en: 'choose from my resorces'
  };
  const creatnew = { he: 'יצירת משאב חדש', en: 'create new resorce' };
  const cancel = { he: 'ביטול', en: 'Cancel' };
  const ok = { he: 'אישור', en: 'OK' };
  const noResources = {
    he: 'אין לך משאבים מתאימים',
    en: 'No matching resources found'
  };

  function hasAssignment(data) {
    return data.assignedTo && data.assignedTo.length > 0;
  }

  function isSingleUserProject(data) {
    return userslength === 1;
  }

  function isSelfAssignment(data) {
    return (
      data.assignedTo?.length === 1 &&
      pu.find((user) => user.attributes.username === data.assignedTo[0])?.id ===
        idL
    );
  }

  function toggleResourceReceived(index) {
    resourceReceivedByRow[index] = !resourceReceivedByRow[index];
    resourceReceivedByRow = resourceReceivedByRow; // עדכון ריאקטיביות

    // עדכון ה-meData
    meData[index].resourceReceived = resourceReceivedByRow[index];
    meData = meData; // עדכון ריאקטיביות של meData
    console.log(
      `Resource received status updated for row ${index}:`,
      meData[index].resourceReceived
    );
  }

  function toggleSelfAssign(data, index) {
    if (data.assignedTo && data.assignedTo.length > 0) {
      // If already assigned, remove assignment
      data.assignedTo = [];
      meData[index] = { ...data };
    } else {
      // If not assigned, add current user
      data.assignedTo = [
        pu.find((user) => user.id === $page.data.uid).attributes.username
      ];
      meData[index] = data;
      // Activate handleAssignment when assigning
      handleAssignment(data, index);
    }
    meData = meData; // Trigger reactivity
  }
</script>

{#if error1 !== null}
  {error1}
{:else}
  {#each needr as n}
    <h1 style="display:none;">{n}</h1>
  {/each}
  <div class="dd md:items-center border-2 border-gold rounded">
    <div class="body items-center d">
      <table dir="rtl">
        <caption class="sm:text-right md:text-center text-right">
          <h1 class="md:text-center text-2xl md:text-2xl font-bold">
            משאבים שנבחרו
          </h1>
        </caption>
        <tr class="gg">
          <th class="gg">הסרת המשאב שנבחר</th>
          {#each meData as data, i}
            <td class="gg" style="font-size: 3rem">
              {i + 1}
              <button title="הסרה" on:click={remove(data.id)}
                ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z"
                  />
                </svg></button
              ></td
            >
          {/each}
        </tr>
        <tr class="ggr">
          <th class="ggr">שם</th>
          {#each meData as data, i}
            <td class="ggr">
              <div dir="rtl" class="textinput">
                <input
                  type="text"
                  id="inputi"
                  name="inputi"
                  bind:value={data.attributes.name}
                  class="input"
                  required
                />
                <label for="nam" id="labeli" class="label">שם</label>
                <span class="line"></span>
              </div>
            </td>
          {/each}
        </tr>
        <tr>
          <th>תיאור</th>
          {#each meData as data, i}
            <td>
              <div dir="rtl" class="textinput">
                <textarea
                  bind:value={data.attributes.descrip}
                  type="text"
                  class="input d"
                  required
                ></textarea>
                <label for="name" class="label">תיאור</label>
                <span class="line"></span>
              </div>
            </td>
          {/each}
        </tr>
        <tr>
          <th>סוג</th>
          {#each meData as data, i}
            <td>
              <select
                bind:value={data.attributes.kindOf}
                on:change={() => myMissionH()}
                class="round form-select appearance-none
                        block
                        w-full
                        px-3
                        py-1.5
                        text-barbi
                        font-normal
                        bg-gold bg-clip-padding bg-no-repeat
                        border border-solid border-gold
                        rounded
                        transition
                        ease-in-out
                        m-0
                        focus:text-barbi focus:bg-gold focus:border-barbi focus:outline-none"
              >
                <option value="total">{ot[$lang]}</option>
                <option value="monthly">{pm[$lang]}</option>
                <option value="yearly">{pye[$lang]}</option>
                <option value="perUnit">{py[$lang]}</option>
                <option value="rent">{re[$lang]}</option>
              </select>
            </td>
          {/each}
        </tr>
        {#if userslength === 1}
          <tr>
            <th>{selfAssign[$lang]}</th>
            {#each meData as data, i}
              <td>
                <div class="space-y-2">
                  <button
                    class="w-full px-4 py-2 text-sm text-white rounded hover:bg-blue-600 relative flex items-center justify-center"
                    class:bg-blue-500={data.assignedTo?.length < 1 ||
                      !data.assignedTo?.length}
                    class:bg-green-500={data.assignedTo?.length === 1}
                    class:hover:bg-green-600={data.assignedTo?.length === 1}
                    on:click={() => toggleSelfAssign(data, i)}
                  >
                    <span>{selfAssign[$lang]}</span>
                    {#if data.assignedTo?.length}
                      <span class="ml-2 text-white">✓</span>
                    {/if}
                  </button>

                  {#if showResourceOptions[i]}
                    {#if loadingByRow[i]}
                      <div class="text-center py-2">
                        <span class="loading loading-spinner loading-md"></span>
                      </div>
                    {:else}
                      {#if availableResourcesByRow[i]?.length > 0}
                        <MultiSelect
                          --sms-open-z-index={10000}
                          bind:selected={data.selectedResource}
                          placeholder={choosee[$lang]}
                          loading={loadingByRow[i]}
                          options={availableResourcesByRow[i].map(
                            (res) => res.attributes.name
                          )}
                          noMatchingOptionsMsg={noResources[$lang]}
                          maxSelect={1}
                          on:change={() => {
                            if (
                              data.selectedResource &&
                              data.selectedResource.length > 0
                            ) {
                              newResourceByRow[i] = false;
                            }
                          }}
                        />
                      {:else}
                        <div class="text-red-500 text-sm mb-2 text-center">
                          {noResources[$lang]}
                        </div>
                      {/if}

                      <button
                        class="w-full px-4 py-2 text-sm text-white rounded hover:bg-blue-600 relative flex items-center justify-center"
                        class:bg-blue-500={!newResourceByRow[i]}
                        class:bg-green-500={newResourceByRow[i]}
                        class:hover:bg-green-600={newResourceByRow[i]}
                        on:click={() => createNewResource(data, i)}
                      >
                        <span>{creatnew[$lang]}</span>
                        {#if newResourceByRow[i]}
                          <span class="ml-2 text-white">✓</span>
                        {/if}
                      </button>

                      {#if data.selectedResource?.length > 0 || newResourceByRow[i]}
                        <button
                          class="mt-2 w-full px-4 py-2 text-sm text-white rounded hover:bg-blue-600 relative flex items-center justify-center"
                          class:bg-blue-500={!resourceReceivedByRow[i]}
                          class:bg-green-500={resourceReceivedByRow[i]}
                          class:hover:bg-green-600={resourceReceivedByRow[i]}
                          on:click={() => toggleResourceReceived(i)}
                        >
                          <span>{RESOURCE_RECEIVED_TEXT[$lang]}</span>
                          {#if resourceReceivedByRow[i]}
                            <span class="ml-2 text-white">✓</span>
                          {/if}
                        </button>
                      {/if}
                    {/if}
                  {/if}
                </div>
              </td>
            {/each}
          </tr>
        {/if}
        <tr>
          <th>כמות</th>
          {#each meData as data, i}
            <td>
              <div
                style="display:{kc ? '' : 'none'};"
                dir="rtl"
                class="textinput"
              >
                <input
                  on:change={() => myMissionH()}
                  bind:value={data.hm}
                  type="number"
                  class="input"
                  required
                />
                <label for="name" class="label">כמות</label>
                <span class="line"></span>
              </div>
              {#if data.hm < 0}<small class="bg-red-800 text-slate-50 px-2"
                  >לא יכולה להיות קטנה מ-0</small
                >{/if}
            </td>{/each}
        </tr><tr style="display:{ky ? '' : 'none'};">
          <th>תאריך התחלה </th>
          {#each meData as data, i}
            <td
              ><input
                on:change={() => myMissionH()}
                class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
                type="datetime-local"
                style="display:{meData[i].ky ? '' : 'none'};"
                placeholder="הוספת תאריך התחלה"
                bind:value={data.attributes.dates}
              /></td
            >
          {/each}
        </tr>
        <tr style="display:{ky ? '' : 'none'};">
          <th>תאריך סיום </th>
          {#each meData as data, i}
            <td
              ><input
                on:change={() => myMissionH()}
                class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
                style="display:{meData[i].ky ? '' : 'none'};"
                type="datetime-local"
                placeholder="הוספת תאריך סיום"
                bind:value={data.attributes.datef}
              /></td
            >
          {/each}
        </tr>
        <tr>
          <th>הערות מיוחדות</th>
          {#each meData as data, i}
            <td>
              <div dir="rtl" class="textinput">
                <textarea
                  bind:value={data.spnot}
                  type="text"
                  class="input d"
                  required
                ></textarea>
                <label for="name" class="label">הערות מיוחדות</label>
                <span class="line"></span>
              </div>
            </td>
          {/each}
        </tr>
        <tr>
          <th>עלות</th>
          {#each meData as data, i}
            <td>
              <div dir="rtl" class="textinput">
                <input
                  on:change={() => myMissionH()}
                  bind:value={data.attributes.price}
                  type="number"
                  class="input"
                  required
                />
                <label for="name" class="label"
                  >שווי כספי <span style="display:{meData[i].m ? '' : 'none'};"
                    >לכל חודש</span
                  ><span style="display:{meData[i].y ? '' : 'none'};"
                    >לכל שנה</span
                  ><span style="display:{meData[i].r ? '' : 'none'};"
                    >לכל התקופה</span
                  ><span style="display:{meData[i].kc ? '' : 'none'};"
                    >ליחידה</span
                  >
                </label>
                <span class="line"></span>
              </div>
              {#if data.attributes.price < 0}<small class="bg-red-800 text-slate-50 px-2"
                  >לא יכולה להיות קטנה מ-0</small
                >{/if}
            </td>{/each}
        </tr><tr>
          <th>שווי מקסימלי לחישוב בריקמה</th>
          {#each meData as data, i}
            <td>
              <div dir="rtl" class="textinput">
                <input
                  on:change={() => myMissionH()}
                  bind:value={data.attributes.easy}
                  type="number"
                  class="input"
                  required
                />
                <label for="name" class="label"
                  >שווי מוצע <span style="display:{meData[i].m ? '' : 'none'};"
                    >לכל חודש</span
                  ><span style="display:{meData[i].y ? '' : 'none'};"
                    >לכל שנה</span
                  ><span style="display:{meData[i].r ? '' : 'none'};"
                    >לכל התקופה</span
                  ><span style="display:{meData[i].kc ? '' : 'none'};"
                    >ליחידה</span
                  >
                </label>
                <span class="line"></span>
              </div>
              {#if data.attributes.easy < 0}<small
                  class="bg-red-800 text-slate-50 px-2"
                  >לא יכול להיות קטן מ-0</small
                >{/if}
            </td>{/each}
        </tr><tr style="display:{kc || ky ? '' : 'none'};">
          <th>עלות סה"כ</th>
          {#each meData as data, i}
            <td>
              <h3
                style="display:{meData[i].m ||
                meData[i].y ||
                meData[i].kc ||
                meData[i].t
                  ? ''
                  : 'none'};"
              >
                {data.total}
              </h3>
            </td>{/each}
        </tr><tr style="display:{kc || ky ? '' : 'none'};">
          <th>שווי מקסימלי סה"כ</th>
          {#each meData as data, i}
            <td>
              <h3
                style="display:{meData[i].m ||
                meData[i].y ||
                meData[i].kc ||
                meData[i].t
                  ? ''
                  : 'none'};"
              >
                {data.totaltotal}
              </h3>
            </td>{/each}
        </tr>
        <tr>
          <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
          {#each meData as data, i}
            <td>
              <div dir="rtl" class="textinput">
                <input
                  bind:value={data.attributes.linkto}
                  type="text"
                  class="input"
                  required
                />
                <label for="name" class="label">לינק</label>
                <span class="line"></span>
              </div></td
            >
          {/each}
        </tr>
      </table>
    </div>
    <div>
        <br>
        <Button 
          text={{ he: 'פרסום משאבים', en: 'Create' }}
          on:click={createResources}
          {loading}
          {success}
          {error}
        />
        <br>
    </div>
  </div>
{/if}

<style>
  textarea::-webkit-resizer {
    border-width: 8px;
    border-style: solid;
    border-color: transparent transparent var(--barbi-pink) var(--barbi-pink);
  }

  select.round {
    background-image: linear-gradient(
        315deg,
        transparent 50%,
        rgb(0, 174, 255) 50%
      ),
      linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
      radial-gradient(#ddd 70%, transparent 72%);
    background-position:
      calc(0% + 20px) calc(1em + 2px),
      calc(0% + 15px) calc(1em + 2px),
      calc(0% + 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
  }

  select.round:focus {
    background-image: linear-gradient(315deg, white 50%, transparent 50%),
      linear-gradient(225deg, transparent 50%, white 50%),
      radial-gradient(gray 70%, transparent 72%);
    background-position:
      calc(0% + 15px) 1em,
      calc(0% + 20px) 1em,
      calc(0% + 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
    border-color: green;
    outline: 0;
  }

  .gg {
    position: sticky;
    top: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggd {
    position: sticky;
    bottom: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggr {
    position: sticky;
    top: 77px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggr:hover,
  .gg:hover,
  .ggd:hover {
    background: var(--barbi-pink);
  }

  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .body {
    overflow-x: auto;
    overflow-y: auto;
    width: 96vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  table,
  th,
  td {
    border-collapse: collapse;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
  }

  table {
    text-align: center;
    color: var(--barbi-pink);
    margin: 0 auto;
  }

  th {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
  }

  td {
    background-color: #5efaf2;
    background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
    min-width: 150px;
  }

  th:hover {
    background: var(--barbi-pink);
  }

  td:hover {
    background: rgb(132, 241, 223);
  }

  #labeli {
    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--gold);
    user-select: none;
  }

  #inputi {
    color: var(--gold);

    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--barbi-pink);
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  .label {
    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--barbi-pink);
    user-select: none;
  }

  .line {
    height: 2px;
    background-color: #2196f3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line,
  #inputi:valid ~ #labeli,
  #inputi:focus ~ #labeli {
    width: 100%;
  }

  #inputi:valid ~ #labeli,
  #inputi:focus ~ #labeli {
    font-size: 11px;
    color: var(--mturk);
    top: 0;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 11px;
    color: #2196f3;
    top: 0;
  }

  .input:focus,
  .input:valid,
  #inputi:valid ~ #labeli,
  #inputi:focus ~ #labeli {
    border: 0;
  }

  @media (max-width: 600px) {
    .textinput {
      position: relative;
      width: 100%;
      display: block;
    }
  }
</style>
