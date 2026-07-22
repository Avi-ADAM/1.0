<script>
  import DiscoveryNav from "$lib/components/discovery/DiscoveryNav.svelte";
  import Dates from "$lib/components/grid/dates.svelte";
  import ListOfTiles from "$lib/components/grid/listOfTiles.svelte";
    import { Grid , PrelineTheme,PlainTableCssTheme ,CardsPlusTheme ,PagingData, GridFooter} from "@mediakular/gridcraft";
    import { lang } from "$lib/stores/lang";
  import { isRtl } from '$lib/translations';
  import GoButton from "$lib/components/grid/GoButton.svelte";
  import RichText from "$lib/celim/ui/richText.svelte";
  import NameAndPname from "$lib/components/grid/nameAndPname.svelte";
  import Vallue from "$lib/components/grid/vallue.svelte";
  import {sendToSer} from "$lib/send/sendToSer.js";
  import { RingLoader } from "svelte-loading-spinners";
  import { Head } from "svead";
  import { page } from "$app/state"; // Changed from $app/state to $app/stores
  import { goto } from '$app/navigation'; // Import goto for URL manipulation
    const intitle = {he:" משימות פתוחות",en:"Open missions"}
    const name = {"he": ' שם ושם הריקמה',"en":"name and project name"}
    const des = {"he":"תיאור","en":'description'}
    const shovi = {'he':'שווי','en':'vallue'}
    const datest = {'he':'תאריך','en':'date'}
    const sklt = {'he': 'כישורים','en': 'skills'}
    const taft = {'he': 'תפקיד','en': 'role'}
    const seet = {'he':'הרחבה והגשת מועמדות', 'en':'see more'}
    const wwt = {'he':'דרך העבודה','en': 'work ways'}
  import { onMount } from 'svelte';
  let { data } = $props();
    let alld = $state([]); // Initialize as empty, will be populated in onMount
    let isLoading = $state(true); // Initial loading is handled by onMount
    let isLoadingMore = $state(false);
    let hasMoreData = $state(false);

// יצירת אובייקט PagingData חדש
let paging = $state(new PagingData(
    1,      // currentPage
    10,     // itemsPerPage (Changed to 10)
    [10, 20, 50, 100] // itemsPerPageOptions
));

const BATCH_SIZE = 10; // Changed to 10
const LOAD_DELAY = 2000; // 2 seconds delay between loads

onMount(async () => {
    // Initial data from server load
    if (data.missions && data.missions.length > 0) {
        alld = data.missions;
        hasMoreData = data.hasMoreData;
    }
    isLoading = false;
});

async function fetchMoreMissions() {
    if (isLoadingMore || !hasMoreData) return;

    isLoadingMore = true;
    paging.currentPage++;
    const newStart = (paging.currentPage - 1) * BATCH_SIZE;

    try {
        const response = await fetch(`/api/missions?start=${newStart}&limit=${BATCH_SIZE}`);
        const result = await response.json();

        if (result.missions && result.missions.length > 0) {
            alld = [...alld, ...result.missions];
            hasMoreData = result.hasMoreData;
        } else {
            hasMoreData = false;
        }
    } catch (error) {
        console.error("Error fetching more missions:", error);
        // Handle error, maybe show a toast notification
    } finally {
        isLoadingMore = false;
    }
}

let theme = PrelineTheme;


// האזנה לשינויים בגודל העמוד


let columns = $state([
        {
            key: 'name',
            title: name[$lang],
            accessor: (row) => {
                return{
                    src: row.project.data.attributes.profilePic.data.attributes.url,
                    pname: row.project.data.attributes.projectName,
                    mname: row.name
                }
            },
            renderComponent: NameAndPname
        },
        {
            key: 'descrip',
            title: des[$lang],
            sortable: false,
            accessor: (row) => {
                return{
                    outpot: row.descrip,
                    editable: false,
                    sml: true,
                    minw: true
                }
            },
            renderComponent: RichText
        },

        {
            key: 'noofhours',
            title: shovi[$lang],
            accessor: (row) => {
                return{
                    noofhours :row.noofhours,
                    perhour : row.perhour,
                    iskvua: row.iskvua
                }
            },
            renderComponent: Vallue
        },
        {
        key: 'sqadualed',
        title: datest[$lang],
        accessor: (row) => {
            return {
                value: row.sqadualed,
                value2: row.dates
            }
        },
        renderComponent: Dates
    },{
        key: 'skills',
        title: sklt[$lang],
        accessor: (row) =>{
            return{
                color: 'pink',
       items:  row.skills.data.map((c) => c.attributes.skillName)
            }
        },
        renderComponent: ListOfTiles
    },{
        key: 'work_ways',
        title: wwt[$lang],
        accessor: (row) =>{
            return{
                color: 'green',
       items:  row.work_ways.data.map((c) => c.attributes.workWayName)
            }
        },
        renderComponent: ListOfTiles
    },{
        key: 'tafkidims',
        title: taft[$lang],
        accessor: (row) =>{
            return{
                color: 'blue',
       items:  row.tafkidims.data.map((c) => c.attributes.roleDescription)
            }
        },
        renderComponent: ListOfTiles
    },{
        key: 'id',
        title: seet[$lang],
        accessor: (row) =>{
            return{
                id: row.id
            }
        },
        renderComponent: GoButton
    }
    ]);
  
    let title = {he:"משימות פתוחות",en:"Open missions"}
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`
  let description = {he:"משימות פתוחות שאפשר להגיש מועמדות כדי להצטרף ולבצע יחד ב-1💗1",en:"Open missions that you can submit candidates to join and do together in 1💗1"}
  let url = page.url.toString()
        function loadMoreMissions() {
            isLoadingMore = true;
            paging.currentPage++;
            const newStart = (paging.currentPage - 1) * BATCH_SIZE;
            const currentUrl = new URL(page.url);
            currentUrl.searchParams.set('start', newStart.toString());
            currentUrl.searchParams.set('limit', BATCH_SIZE.toString());
            goto(currentUrl.toString(), { invalidateAll: true, replaceState: true });
        }
    </script>
<Head title={title[$lang]} description={description[$lang]} {image} {url} />
<div class="w-full px-2 text-center bg-gold text-barbi" dir={$isRtl ? 'rtl' : 'ltr'}>
<div class="flex justify-center py-2">
  <DiscoveryNav current="missions" />
</div>
<h2 class="flex justify-center items-center">{intitle[$lang]}{#if isLoading || isLoadingMore}
    <RingLoader size={30}/>
     {/if}</h2>
{#if alld}
    <Grid
    bind:data={alld}
    bind:columns {theme} {paging}/>
    {#if hasMoreData}
        <button
            class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onclick={() => loadMoreMissions()}
            disabled={isLoadingMore}
        >
            {#if isLoadingMore}
                Loading...
            {:else}
                Load More
            {/if}
        </button>
    {/if}
    <GridFooter
       bind:data={alld}
       {theme}
    bind:paging/>
    {/if}
</div>


