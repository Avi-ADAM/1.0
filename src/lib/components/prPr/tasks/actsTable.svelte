<script>
    export let acts = [];
    import Dates from "$lib/components/grid/dates.svelte";
    import ListOfTiles from "$lib/components/grid/listOfTiles.svelte";
    import { Grid, PrelineTheme, GridFooter, PagingData } from "@mediakular/gridcraft";
    import { lang } from "$lib/stores/lang";
    import RichText from "$lib/celim/ui/richText.svelte";
    import NameAndPname from "$lib/components/grid/nameAndPname.svelte";
    import { createEventDispatcher } from 'svelte';
    import { onMount } from "svelte";
  import Tile from "$lib/celim/tile.svelte";
  import { page } from "$app/stores";
    const dispatch = createEventDispatcher();
    let paging = new PagingData(
    1,      // currentPage
    20,     // itemsPerPage
    [10, 20, 50, 100] // itemsPerPageOptions
);
    function handleTaskClick(row,type,mid,isOpen,isPend) {

        let id
    let kind 
    if (mid) {
     kind = 'betha'
     id = mid
    } else if (isOpen) {
       kind = 'openM';
      id = isOpen.id
    } else if (isPend) {
      kind = 'pendm'
      id = isPend.id
    }
        console.log(row,type,mid,isOpen,isPend)
        dispatch('taskClick', {
           id,
           kind
        });
    }

    const name = {"he": ' שם',"en":"name"}
    const des = {"he":"תיאור","en":'description'}
    const my = {'he':'מבוצע ע"י','en':'assigned to'}
    const datest = {'he':'תאריך','en':'date'}
    const vali = {"he": 'נוצר ע"י',"en":"created by"}
    const status = {"he": "סטטוס ביצוע","en":"status"}
    let theme = PrelineTheme;

    let columns = [
        { 
            key: "shem", 
            title: name[$lang],
        },
        {
            key: "vali",
            title: vali[$lang],
            sortValue: (row) => row.vali.data?.id,
            accessor: (row) => {
                const valiData = row?.vali?.data?.attributes;
                const profilePicData = valiData?.profilePic?.data?.attributes;

                return {
                    src: profilePicData?.url || "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png",
                    alt: "Medium avatar",
                    pic: true,
                    big: false,
                    sm: false,
                    single: true,
                    bg: "gold",
                    word: valiData?.username || '',
                    uid: row?.vali?.data?.id || '',
                }
            },
            renderComponent: Tile
        },
        {
            key: 'my',
            title: my[$lang],
            sortValue: (row) => row.my.data?.id || 0,
            accessor: (row) => {
                const myData = row.my?.data?.[0]?.attributes;
                const mesima = row.mesimabetahaliches?.data?.[0]?.attributes;
                const profilePic = myData?.profilePic?.data?.attributes?.url;
                const isPend = row.pendm?.data?.id ? {id:row.pendm?.data?.id,name:row.pendm?.data?.attributes.name}: false
                const isOpen = row.open_mission?.data?.id ? {id:row.open_mission?.data?.id,name:row.open_mission?.data?.attributes.name} : false                
                const username = myData?.username;
                const mesimaName = mesima?.name;
                const mid =  row.mesimabetahaliches?.data?.[0]?.id || false
                const type = !username && !mesimaName && !isPend && !isOpen ? "button" : null

                return {
                    type,
                    src: profilePic || '', 
                    pname: username || '', 
                    mname: mesimaName || '',
                    taskId: row.id,
                    isPend,
                    isOpen,
                    onClick: () => handleTaskClick(row,type,mid,isOpen,isPend)
                };
            },
            renderComponent: NameAndPname
        },
        { 
            key: 'des', 
            title: des[$lang],
            sortable: false,
            accessor: (row) => {
                return{
                    outpot: row.des,
                    editable: false,
                    sml: true,
                    minw: true
                }
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
                }
            },
            renderComponent: Dates 
        },
    ];

    let myid = $page.data.uid;
    let filters;
    let filteredActs = [];

   

    const myTasks = {"en": "my assigned tasks", "he": "מטלות שאני מבצע"}
    const valiTasks = {"en":"tasks I created","he":"מטלות שיצרתי"}
    const emptyTasks = {en:"tasks pending assingment", "he":"מטלות ממתינות להשמה"}

    
    // משתנים חיצוניים למצב הפילטרים
    let isMyTasksActive = false;  // מתחיל דלוק
    let isCreatedByMeActive = false;  // מתחיל דלוק
    let isUnassignedActive = false;

    $: filters = [
        { 
            key: "myTasks", 
            columns: "my", 
            filter: (val) => { 
                if (!filters[0].active) return true;
                return val?.my?.data?.some(user => user.id === myid);
            }, 
            active: false 
        },
        { 
            key: "tasksICreated", 
            columns: "vali", 
            filter: (val) => { 
                if (!filters[1].active) return true;
                return val?.vali?.data?.id === myid;
            }, 
            active: false 
        },
        { 
            key: "unassignedTasks", 
            columns: "my", 
            filter: (val) => { 
                if (!filters[2].active) return true;
                return !val?.my?.data || val.my.data.length === 0;
            }, 
            active: false 
        },
    ];

    function updateFilteredActs() {
        const activeFilter = filters.find(f => f.active);
        if (!activeFilter) {
            filteredActs = acts;
        } else {
            filteredActs = acts.filter(item => activeFilter.filter(item));
        }
    }

    function handleFilterClick(filterIndex) {
        if (filters) {
            filters.forEach((f, index) => {
                if (index !== filterIndex) {
                    f.active = false;
                }
            });
            filters[filterIndex].active = !filters[filterIndex].active;
            filters = [...filters]; // אכיפת עדכון ריאקטיבי
            updateFilteredActs();
            
            console.log(`Filter ${filterIndex} clicked, new state:`, filters[filterIndex].active, isMyTasksActive,isCreatedByMeActive,isUnassignedActive);
            console.log('Filtered acts count:', filteredActs.length);
        }
        if(filterIndex === 0){
                isMyTasksActive = true
                isCreatedByMeActive = false;  // מתחיל דלוק
                isUnassignedActive = false;                
            }else if(filterIndex === 1){
                isMyTasksActive = false
                isCreatedByMeActive = true;  // מתחיל דלוק
                isUnassignedActive = false;                       
            }else if(filterIndex === 2){
                isMyTasksActive = false
                isCreatedByMeActive = false;  // מתחיל דלוק
                isUnassignedActive = true;                       
            }
    }

    $: {
        if (acts) {
            updateFilteredActs();
        }
    }

    onMount(() => {
        const reformatArray = arr => {
            if (!Array.isArray(arr)) return [];
            
            return arr.map(item => {
                if (!item || !item.id || !item.attributes) return null;
                
                const attributes = item.attributes || {};
                return {
                    id: item.id,
                    ...attributes,
                    vali: attributes.vali || { data: null },
                    my: attributes.my || { data: [] },
                    mesimabetahaliches: attributes.mesimabetahaliches || { data: [] }
                };
            }).filter(Boolean);
        };

        acts = reformatArray(acts);
        updateFilteredActs();
    });
</script>

<div class="w-full px-2 text-center bg-gold dark:bg-barbi dark:text-gold text-barbi" dir={$lang == "he" ? 'rtl':'ltr'}>
    <div class="flex flex-row">
        <button on:click={() => handleFilterClick(0)}>
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
        <button on:click={() => handleFilterClick(1)}>
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
        <button on:click={() => handleFilterClick(2)}>
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
    </div>
    <Grid 
        data={filteredActs}
        bind:columns 
        {theme}
{paging}
        bind:filters
    />
    <span dir="ltr">
    <GridFooter  
        data={filteredActs}
        {theme}
        bind:paging
    /></span>
</div>
