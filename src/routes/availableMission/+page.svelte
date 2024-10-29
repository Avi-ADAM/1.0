<script>
  import Dates from "$lib/components/grid/dates.svelte";
  import ListOfTiles from "$lib/components/grid/listOfTiles.svelte";
    import { Grid , PrelineTheme,PlainTableCssTheme ,CardsPlusTheme ,PagingData, GridFooter} from "@mediakular/gridcraft";
    import { lang } from "$lib/stores/lang";
  import GoButton from "$lib/components/grid/GoButton.svelte";
  import RichText from "$lib/celim/ui/richText.svelte";
  import NameAndPname from "$lib/components/grid/nameAndPname.svelte";
  import Vallue from "$lib/components/grid/vallue.svelte";
  import {sendToSer} from "$lib/send/sendToSer.svelte";
  import { onMount } from 'svelte';
  import { RingLoader } from "svelte-loading-spinners";
  import { Head } from "svead";
  import { page } from "$app/stores";
    const intitle = {he:" משימות פתוחות",en:"Open missions"}
    const name = {"he": 'שם',"en":"name"}
    const des = {"he":"תיאור","en":'description'}
    const shovi = {'he':'שווי','en':'vallue'}
    const datest = {'he':'תאריך','en':'date'}
    const sklt = {'he': 'כישורים','en': 'skills'}
    const taft = {'he': 'תפקיד','en': 'role'}
    const seet = {'he':'הרחבה והגשת מועמדות', 'en':'see more'}
    const wwt = {'he':'דרך העבודה','en': 'work ways'}
    export let data;
    let alld;
    let isLoading = true;

async function getData(){
    try {
        isLoading = true;
        let userLang = data.lang;
        let isReg = data.tok;
        const qid = userLang != "en" ? isReg ? "27GetOpenMissionsRegTr" : "29GetOpenMissionsNonregTr" : isReg ? "28GetOpenMissionsReg" : "30GetOpenMissionsNonreg";
        
        const response = await sendToSer({}, qid, null, null, !isReg, fetch);
        
        if (response.data.openMissions.data != null) {
            const datar = response.data.openMissions.data;
            const reformatArray = arr => arr.map(({id, attributes}) => ({id, ...attributes}));
            return reformatArray(datar);
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    } finally {
        isLoading = false;
    }
}

onMount(async () => {
    alld = await getData();
});

let theme = PrelineTheme;
let paging = { 
        itemsPerPage: 20,
        currentPage: 1,
        itemsPerPageOptions: [10, 20, 50, 100]
    }
   // ThemeStore.set(theme);
   // theme.grid.container = MyTableContainer;
   //ThemeStore.set(theme);
    let columns = [
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
                vallue2: row.dates
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
    ];
    let title = {he:"משימות פתוחות",en:"Open missions"}
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`
  let description = {he:"משימות פתוחות שאפשר להגיש מועמדות כדי להצטרף ולבצע יחד ב-1💗1",en:"Open missions that you can submit candidates to join and do together in 1💗1"}
  let url = $page.url.toString()
    </script>
<Head title={title[$lang]} description={description[$lang]} {image} {url} />
<div class="w-full px-2 text-center bg-gold text-barbi" dir={$lang == "he" ? 'rtl':'ltr'}>
<h2 class="flex justify-center items-center">{intitle[$lang]}{#if isLoading}
    <RingLoader size={30}/>
     {/if}</h2>

    <Grid 
    bind:data={alld} 
    bind:columns {theme} {paging}/>
    <GridFooter  
       bind:data={alld} 
    bind:paging/>
</div>
