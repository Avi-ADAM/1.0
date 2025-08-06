<script>
  import Dates from '$lib/components/grid/dates.svelte';
  import ListOfTiles from '$lib/components/grid/listOfTiles.svelte';
  import {
    Grid,
    PrelineTheme,
    GridFooter,
    PagingData
  } from '@avitest/gridcraft';
  import { lang } from '$lib/stores/lang';
  import RichText from '$lib/celim/ui/richText.svelte';
  import NameAndPname from '$lib/components/grid/nameAndPname.svelte';
  import NameField from '$lib/components/grid/nameField.svelte';
  import { onMount } from 'svelte';
  import Tile from '$lib/celim/tile.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';

  /**
   * @typedef {Object} Props
   * @property {Array<any>} [acts]
   * @property {(payload: { id: any; kind: string }) => void} [onTaskClick] - Callback when a task is clicked.
   */

  /** @type {Props} */
  let { acts = $bindable([]), onTaskClick } = $props();
  let paging = $state(new PagingData(
    1, // currentPage
    20, // itemsPerPage
    [10, 20, 50, 100] // itemsPerPageOptions
  ));
  function handleTaskClick(row, type, mid, isOpen, isPend) {
    let id;
    let kind;
    if (mid) {
      kind = 'betha';
      id = mid;
    } else if (isOpen) {
      kind = 'openM';
      id = isOpen.id;
    } else if (isPend) {
      kind = 'pendm';
      id = isPend.id;
    }else{
      kind = 'assign';
      id = row.id
    }
    console.log(row, type, mid, isOpen, isPend,kind,id);
    onTaskClick?.({
      id,
      kind
    });
  }
  let filtersUi  = $state([]);
  const name = { he: ' שם', en: 'name' };
  const des = { he: 'תיאור', en: 'description' };
  const my = { he: 'מבוצע ע"י', en: 'assigned to' };
  const datest = { he: 'תאריך', en: 'date' };
  const vali = { he: 'נוצר ע"י', en: 'created by' };
  const approve = { he: 'אישור', en: 'Approve' };
  const pending = { he: 'ממתין לאישור', en: 'Pending Approval' };
  let theme = PrelineTheme;

  let columns = $state([
    {
      key: 'shem',
      title: name[$lang],
      accessor: (row) => row.shem,
      renderComponent: NameField
    },
    {
      key: 'vali',
      title: vali[$lang],
      sortValue: (row) => row.vali.data?.id,
      accessor: (row) => {
        const valiData = row?.vali?.data?.attributes;
        const profilePicData = valiData?.profilePic?.data?.attributes;

        return {
          src:
            profilePicData?.url ||
            'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',
          alt: 'Medium avatar',
          pic: true,
          big: false,
          sm: false,
          single: true,
          bg: 'gold',
          word: valiData?.username || '',
          uid: row?.vali?.data?.id || ''
        };
      },
      renderComponent: Tile
    },
    {
      key: 'my',
      title: my[$lang],
      sortValue: (row) => row.my?.data?.[0]?.id || 0,
      accessor: (row) => {
        const myData = row.my?.data?.[0]?.attributes;
        const mesima = row.mesimabetahaliches?.data?.[0]?.attributes;
        const profilePic = myData?.profilePic?.data?.attributes?.url;
        const isPend = row.pendm?.data?.id
          ? { id: row.pendm?.data?.id, name: row.pendm?.data?.attributes.name }
          : false;
        const isOpen = row.open_mission?.data?.id
          ? {
              id: row.open_mission?.data?.id,
              name: row.open_mission?.data?.attributes.name
            }
          : false;
        const username = myData?.username;
        const mesimaName = mesima?.name;
        const mid = row.mesimabetahaliches?.data?.[0]?.id || false;
        const type = !username && !mesimaName && !isPend && !isOpen ? 'button' : null;

        return {
          src: profilePic || '',
          pname: username || '',
          mname: mesimaName || '',
          type,
          isOpen,
          isPend,
          id: row.id,
          isPending: row.isAssigned && !row.myIshur && row.my?.data?.[0]?.id,
          isCurrentUser: page.data.uid === row.my?.data?.[0]?.id,
          isValidator: page.data.uid === row.vali?.data?.id,
          isAssigned: row.isAssigned,
          roles: row.tafkidims?.data?.map(r => r.attributes.roleDescription) || [],
          isApproved: row.myIshur,
          naasa: row.naasa,
          pendingValidation: row.naasa && !row.valiIshur,
          isCompleted: row.naasa && row.valiIshur,
          progress: row.status || 0,
          onClick: () => handleTaskClick(row, type, mid, isOpen, isPend),
          onApprove: () => handleApprove(row.id),
          onValidate: () => handleValidate(row.id)
        };
      },
      renderComponent: NameAndPname
    },
    {
      key: 'des',
      title: des[$lang],
      sortable: false,
      accessor: (row) => {
        return {
          outpot: row.des,
          editable: false,
          sml: true,
          minw: true,
          trans: true
        };
      },
      renderComponent: RichText
    },
    {
      key: 'sqadualed',
      title: datest[$lang],
      accessor: (row) => {
        return {
          value: row.dateS,
          value2: row.dateF
        };
      },
      renderComponent: Dates
    }
  ]);

  let myid = page.data.uid;
  let filteredActs = $state([]);
  
    let uiFilters = $state([]);
  
  const myTasks = { en: 'my assigned tasks', he: 'מטלות שאני מבצע' };
  const valiTasks = { en: 'tasks I created', he: 'מטלות שיצרתי' };
  const emptyTasks = {
    en: 'tasks pending assingment',
    he: 'מטלות ממתינות להשמה'
  };

  // משתנים חיצוניים למצב הפילטרים
  let isMyTasksActive = $state(false); // מתחיל דלוק
  let isCreatedByMeActive = $state(false); // מתחיל דלוק
  let isUnassignedActive = $state(false);

  let filters = $state([]);
  $effect(() => {
    filters = [
      {
        key: 'myTasks',
        columns: 'my',
        filter: (val) => {
          if (!filters[0].active) return true;
          return val?.my?.data?.some((user) => user.id === myid);
        },
        active: false
      },
      {
        key: 'tasksICreated',
        columns: 'vali',
        filter: (val) => {
          if (!filters[1].active) return true;
          return val?.vali?.data?.id === myid;
        },
        active: false
      },
      {
        key: 'unassignedTasks',
        columns: 'my',
        filter: (val) => {
          if (!filters[2].active) return true;
          return !val?.my?.data || val.my.data.length === 0;
        },
        active: false
      },
      ...uiFilters
    ];
  });
  
  function updateFilteredActs() {
    const activeFilter = filters.find((f) => f.active);
    if (!activeFilter) {
        filteredActs = acts; // אם אין פילטר פעיל, החזר את כל ה-acts
    } else {
        filteredActs = acts.filter((item) => {
            // בדוק אם הפילטר פעיל
            return activeFilter.filter(item);
        });
    }
    
    // הוסף כאן לולאה כדי לבדוק את כל הפילטרים הפעילים
    filters.forEach((filter) => {
        if (filter.active) {
            filteredActs = filteredActs.filter((item) => filter.filter(item));
        }
    });
    filteredActs = filteredActs;
    console.log("Filtered acts after applying filters:", filteredActs, uiFilters); // הוסף לוג כאן

  }

  function handleFilterClick(filterIndex) {
    console.log(`Filter ${filterIndex} clicked`,filters);
    if (filters[filterIndex].active) { // אם הפילטר כבר פעיל, ננקה את כל הפילטרים
        filters.forEach(f => f.active = false);
        isMyTasksActive = false;
        isCreatedByMeActive = false;
        isUnassignedActive = false;
        filtersUi.forEach(f => f.checked = false);
        filtersUi = filtersUi; // אכיפת עדכון ריאקטיבי
        filters = [...filters];
    } else {
        filters.forEach((f, index) => {
            if (index !== filterIndex) {
                f.active = false;
            }
        });
        filters[filterIndex].active = !filters[filterIndex].active;
        filters = [...filters]; // אכיפת עדכון ריאקטיבי

        console.log(
            `Filter ${filterIndex} clicked, new state:`,
            filters[filterIndex].active,
            isMyTasksActive,
            isCreatedByMeActive,
            isUnassignedActive
        );
        console.log('Filtered acts count:', filteredActs.length);
    
    if (filterIndex === 0) {
      isMyTasksActive = true;
      isCreatedByMeActive = false; // מתחיל דלוק
      isUnassignedActive = false;
      for (let i = 0; i < filtersUi.length; i++) {
            filtersUi[i].checked = false;
      }
      filtersUi = filtersUi;
    } else if (filterIndex === 1) {
      isMyTasksActive = false;
      isCreatedByMeActive = true; // מתחיל דלוק
      isUnassignedActive = false;
      for (let i = 0; i < filtersUi.length; i++) {
            filtersUi[i].checked = false;
      }
      filtersUi = filtersUi;
    } else if (filterIndex === 2) {
      isMyTasksActive = false;
      isCreatedByMeActive = false; // מתחיל דלוק
      isUnassignedActive = true;
      for (let i = 0; i < filtersUi.length; i++) {
            filtersUi[i].checked = false;
      }
      filtersUi = filtersUi;
    } else if (filterIndex > 2) {
      isMyTasksActive = false;
      isCreatedByMeActive = false; // מתחיל דלוק
      isUnassignedActive = false;
      for (let i = 0; i < filtersUi.length; i++) {
          if (i === filterIndex-3) {
            filtersUi[i].checked = true;
              console.log("filtersUi[i].checked",filtersUi[i].checked)
          } else {
            filtersUi[i].checked = false;
          }
      }
      filtersUi = filtersUi;
    }
    }
    updateFilteredActs();

  }

  function handleApprove(taskId, event) {
    console.log(taskId)
    const taskIndex = acts.findIndex((act) => act.id === taskId);
    if (taskIndex === -1) {
      console.error(`Task with id ${taskId} not found.`);
      return;
    }
    acts = [
      ...acts.slice(0, taskIndex),
      { ...acts[taskIndex], myIshur: true },
      ...acts.slice(taskIndex + 1)
    ];
    acts = acts
  }

  function handleValidate(taskId, event) {
    console.log(taskId)
   
  }

  onMount(() => {
    const reformatArray = (arr) => {
      if (!Array.isArray(arr)) return [];

      return arr
        .map((item) => {
          if (!item || !item.id || !item.attributes) return null;

          const attributes = item.attributes || {};
          return {
            id: item.id,
            ...attributes,
            vali: attributes.vali || { data: null },
            my: attributes.my || { data: [] },
            mesimabetahaliches: attributes.mesimabetahaliches || { data: [] },
            tafkidims: attributes.tafkidims || { data: [] }
          };
        })
        .filter(Boolean);
    };

    acts = reformatArray(acts);
    updateFilteredActs();
    let counter = 0;
    let colors = ["blue", "green", "yellow", "red", "purple", "indigo","pink" , "gray"];
      for (let i = 0; i < acts.length; i++) {
          if(acts[i].isAssigned === false){
              for (let t = 0; t < acts[i].tafkidims.data.length; t++) {
                  if(filtersUi.length === 0 || !filtersUi.map(e => e.id).includes(acts[i].tafkidims.data[t].id)){
                      filtersUi.push({
                        id: acts[i].tafkidims.data[t].id,
                        word: {
                            he: acts[i].tafkidims.data[t].attributes?.localizations?.data ? acts[i].tafkidims.data[t].attributes.localizations.data[0].attributes.roleDescription : acts[i].tafkidims.data[t].attributes.roleDescription,
                            en: acts[i].tafkidims.data[t].attributes.roleDescription
                        },
                        checked: false,
                        color: colors[counter]
                      })
                      counter < 7 ? counter += 1 : counter = 0;
                      filtersUi = filtersUi
                      uiFilters = [
                        ...uiFilters,{
                          filter: (val) => {
                            return val.tafkidims && val.tafkidims.data?.some(e => e.id === acts[i].tafkidims.data[t].id) && val.isAssigned  === false;
                        },
                          active: false,
                          key: acts[i].tafkidims.data[t].id + 3,
                          columns: "tafkidims"
                      }]
                  }
              }
          }
      }
      uiFilters = uiFilters
      filters = filters
      console.log("ONMOUNT",filtersUi,filters)
      updateFilteredActs();
      console.log("ONMOUNT2",filtersUi,filters)

  });
</script>

<div
  class="w-full px-2 text-center bg-gold dark:bg-barbi dark:text-gold text-barbi"
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
>
  <div class="flex flex-row max-w-full overflow-x-auto d">
    <button onclick={() => handleFilterClick(0)}>
      {#key isMyTasksActive}
        <Tile
          big={false}
          sm={false}
          bg="gold"
          word={myTasks[$lang]}
          closei={!isMyTasksActive}
          openi={isMyTasksActive}
        />
      {/key}
    </button>
    <button onclick={() => handleFilterClick(1)}>
      {#key isCreatedByMeActive}
        <Tile
          big={false}
          sm={false}
          bg="gold"
          word={valiTasks[$lang]}
          closei={!isCreatedByMeActive}
          openi={isCreatedByMeActive}
        />
      {/key}
    </button>
    <button onclick={() => handleFilterClick(2)}>
      {#key isUnassignedActive}
        <Tile
          big={false}
          sm={false}
          bg="gold"
          word={emptyTasks[$lang]}
          closei={!isUnassignedActive}
          openi={isUnassignedActive}
        />
      {/key}
    </button>
    {#if filtersUi.length > 0}
      {#each filtersUi as ui,i}
      {#key filtersUi}
        <button onclick={() => handleFilterClick(i+3)}>
            <Tile
              big={false}
              sm={false}
              bg="{ui.color}"
              word={ui.word[$lang]}
              closei={!ui.checked}
              openi={ui.checked}
            />
        </button>
        {/key}
      {/each}
    {/if}
  </div>
  <Grid data={filteredActs} bind:columns {theme} {paging} bind:filters />
  <span dir="ltr"> <GridFooter data={filteredActs} {theme} bind:paging /></span>
</div>
