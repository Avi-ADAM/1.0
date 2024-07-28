<script>
  import Dates from "$lib/components/grid/dates.svelte";
  import ListOfTiles from "$lib/components/grid/listOfTiles.svelte";
    import { Grid , PrelineTheme,PlainTableCssTheme ,CardsPlusTheme ,PagingData, GridFooter} from "@mediakular/gridcraft";
    import { lang } from "$lib/stores/lang";
  import GoButton from "$lib/components/grid/GoButton.svelte";
  import RichText from "$lib/celim/ui/richText.svelte";
  import NameAndPname from "$lib/components/grid/nameAndPname.svelte";
  import Vallue from "$lib/components/grid/vallue.svelte";
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
    let alld = data.alld
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

    </script>
        <div class="w-full px-2 text-center bg-gold text-barbi" dir={$lang == "he" ? 'rtl':'ltr'}>
<h2>{intitle[$lang]}</h2>
{#await data.alld}
..
    {:then a} 
    <Grid 
    bind:data={data.alld} 
    bind:columns {theme} {paging}/>
    <GridFooter  
       bind:data={data.alld} 
    bind:paging/>
    {/await}
</div>
