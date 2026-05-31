<script>
  import Dates from '$lib/components/grid/dates.svelte';
  import ListOfTiles from '$lib/components/grid/listOfTiles.svelte';
  import {
    Grid,
    PrelineTheme,
    GridFooter,
    PagingData
  } from '@mediakular/gridcraft';
  import { lang } from '$lib/stores/lang';
  import { t } from '$lib/translations';
  import RichText from '$lib/celim/ui/richText.svelte';
  import NameAndPname from '$lib/components/grid/nameAndPname.svelte';
  import NameField from '$lib/components/grid/nameField.svelte';
  import UrgencyBadge from '$lib/components/grid/urgencyBadge.svelte';
  import { onMount } from 'svelte';
  import Tile from '$lib/celim/tile.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';

  /**
   * @typedef {Object} Props
   * @property {Array<any>} [acts]
   * @property {(payload: { id: any; kind: string }) => void} [onTaskClick] - Callback when a task is clicked.
   * @property {(() => void) | undefined} [onCreateClick] - Called when the create task button is clicked.
   */

  /** @type {Props} */
  let { acts = $bindable([]), onTaskClick, onRowClick, onCreateClick } = $props();

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
  let theme = PrelineTheme;

  let columns = $state([
    {
      key: 'shem',
      title: $t('mission.actsTable.name'),
      accessor: (row) => ({ value: row.shem, onClick: () => onRowClick?.(row) }),
      renderComponent: NameField
    },
    {
      key: 'hashivut',
      title: $t('mission.actsTable.urgency'),
      accessor: (row) => row.hashivut || 'white',
      renderComponent: UrgencyBadge
    },
    {
      key: 'vali',
      title: $t('mission.actsTable.createdBy'),
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
      title: $t('mission.actsTable.assignedTo'),
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
      title: $t('mission.actsTable.description'),
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
      title: $t('mission.actsTable.date'),
      accessor: (row) => {
        return {
          value: row.dateS,
          value2: row.dateF
        };
      },
      renderComponent: Dates
    }
  ]);

  let myid = $derived(String(page.data.uid ?? ''));
  let uiFilters = $state([]);
  

  // משתנים חיצוניים למצב הפילטרים
  let isMyTasksActive = $state(false); // מתחיל דלוק
  let isCreatedByMeActive = $state(false); // מתחיל דלוק
  let isUnassignedActive = $state(false);

  let filters = $state([
    {
      key: 'myTasks',
      columns: 'my',
      filter: (val) => val?.my?.data?.some((user) => String(user.id) === myid),
      active: false
    },
    {
      key: 'tasksICreated',
      columns: 'vali',
      filter: (val) => String(val?.vali?.data?.id ?? '') === myid,
      active: false
    },
    {
      key: 'unassignedTasks',
      columns: 'my',
      filter: (val) => !val?.my?.data || val.my.data.length === 0,
      active: false
    }
  ]);

  let filteredActs = $derived.by(() => {
    const activeFilters = filters.filter((f) => f.active);
    if (activeFilters.length === 0) {
      return [...acts];
    } else {
      return acts.filter((item) => activeFilters.every((f) => f.filter(item)));
    }
  });

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

  let previousRawActs = $state();

  $effect(() => {
    if (acts && acts.length > 0 && acts[0].attributes) {
      acts = reformatArray(acts);
      
      let counter = 0;
      let colors = ["blue", "green", "yellow", "red", "purple", "indigo","pink" , "gray"];
      let newFiltersUi = [];
      let newUiFilters = [];

      for (let i = 0; i < acts.length; i++) {
        if (!acts[i].isAssigned) {
          for (let t = 0; t < acts[i].tafkidims.data.length; t++) {
            if (newFiltersUi.length === 0 || !newFiltersUi.map(e => e.id).includes(acts[i].tafkidims.data[t].id)) {
              newFiltersUi.push({
                id: acts[i].tafkidims.data[t].id,
                word: {
                  he: acts[i].tafkidims.data[t].attributes?.localizations?.data ? acts[i].tafkidims.data[t].attributes.localizations.data[0].attributes.roleDescription : acts[i].tafkidims.data[t].attributes.roleDescription,
                  en: acts[i].tafkidims.data[t].attributes.roleDescription
                },
                checked: false,
                color: colors[counter]
              });
              counter < 7 ? counter += 1 : counter = 0;
              newUiFilters.push({
                filter: (val) => {
                  return val.tafkidims && val.tafkidims.data?.some(e => e.id === acts[i].tafkidims.data[t].id) && !val.isAssigned;
                },
                active: false,
                key: acts[i].tafkidims.data[t].id + 3,
                columns: "tafkidims"
              });
            }
          }
        }
      }
      filtersUi = newFiltersUi;
      uiFilters = newUiFilters;
      filters = [...filters.slice(0, 3), ...uiFilters];
    } else if (acts && acts.length === 0 && acts !== previousRawActs) {
      filtersUi = [];
      uiFilters = [];
      filters = [...filters.slice(0, 3)];
    }
    previousRawActs = acts;
  });
</script>

<div
  class="w-full px-2 text-center bg-gold dark:bg-barbi dark:text-gold text-barbi"
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
>
  <div class="flex items-center gap-2">
    <div class="flex flex-row flex-1 overflow-x-auto d min-w-0">
      <button onclick={() => handleFilterClick(0)}>
        <Tile
          big={false}
          sm={false}
          bg="gold"
          word={$t('mission.actsTable.myTasks')}
          closei={!isMyTasksActive}
          openi={isMyTasksActive}
        />
      </button>
      <button onclick={() => handleFilterClick(1)}>
        <Tile
          big={false}
          sm={false}
          bg="gold"
          word={$t('mission.actsTable.myCreatedTasks')}
          closei={!isCreatedByMeActive}
          openi={isCreatedByMeActive}
        />
      </button>
      <button onclick={() => handleFilterClick(2)}>
        <Tile
          big={false}
          sm={false}
          bg="gold"
          word={$t('mission.actsTable.pendingAssignment')}
          closei={!isUnassignedActive}
          openi={isUnassignedActive}
        />
      </button>
      {#if filtersUi.length > 0}
        {#each filtersUi as ui, i}
          <button onclick={() => handleFilterClick(i + 3)}>
            <Tile
              big={false}
              sm={false}
              bg={ui.color}
              word={ui.word[$lang]}
              closei={!ui.checked}
              openi={ui.checked}
            />
          </button>
        {/each}
      {/if}
    </div>
    {#if onCreateClick}
      <button
        onclick={onCreateClick}
        class="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-barbi text-gold font-bold text-sm hover:bg-barbi/80 transition-colors"
        title={$t('mission.actsTable.newTask')}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        {$t('mission.actsTable.newTask')}
      </button>
    {/if}
  </div>
  <Grid data={filteredActs} bind:columns {theme} {paging} />
  <span dir="ltr"> <GridFooter data={filteredActs} {theme} bind:paging /></span>
</div>
