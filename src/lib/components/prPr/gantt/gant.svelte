<script>
    import { onMount } from 'svelte';
    import moment from 'moment';
      import { createEventDispatcher } from 'svelte';
    let SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter;

 const dispatch = createEventDispatcher();
   /** @type {{bmiData?: any, pmiData?: any, omiData?: any, fmiData?: any}} */
   let {
      bmiData = [],
      pmiData = [],
      omiData = [],
      fmiData = []
   } = $props();
    let options = {}

    let currentStart ;
    let currentEnd ;
    let generation = 0;
    let rowCount = bmiData.length + pmiData.length + omiData.length
     const timeRanges = [
        {
            id: 0,
            from: moment("02/01/2022"),
            to: moment("07/03/2022"),
            classes: null,
            label: 'הקמה'
        },
        {
            id: 1,
            from: moment("07/07/2022"),
            to: moment("12/09/2022"),
            classes: null,
            label: 'פעילות'
        }
    ];
        console.log (timeRanges)
    const colors = ['blue', 'green', 'orange', 'pink']
   let data
    let gantt;
    onMount(async() => {
        SvelteGantt = (await import ('svelte-gantt')).SvelteGantt
        SvelteGanttTable = (await import ('svelte-gantt')).SvelteGanttTable
        MomentSvelteGanttDateAdapter = (await import ('svelte-gantt')).MomentSvelteGanttDateAdapter
       let  zoomLevels = [ { headers: [ { unit: 'year', format: 'YYYY' }, { unit: 'month', format: 'MMM' } ], minWidth: 300, fitWidth: true }, { headers: [ { unit: 'month', format: 'MMMM' }, { unit: 'day', format: 'DD', offset: 5 } ], minWidth: 300, fitWidth: true } ];
        currentStart = moment().clone().startOf('year');
         currentEnd = moment().clone().endOf('year');
         console.log(currentStart,currentEnd) 
         data =  generate()
		 options = {
            resizeHandleWidth: 5,
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: data.rows,
        tasks: data.tasks,
      //          timeRanges,
      //      zoomLevels,
		columnUnit: 'month',
        columnOffset: 1,
        rowHeight: 40,
        rowPadding: 2,
       headers:[{ unit: 'year', format: 'YYYY' }, { unit: 'month', format: 'M',offset: 1 }],
        minWidth: 300,
        fitWidth: true,
        from: currentStart,
        to: currentEnd,
    }
    console.log(options)
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: options });
    	gantt.api.tasks.on.select((task) => dispatch('selected', { id:task}));

    });
	
    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
	
    function generate() {
        let rows = [];
        let tasks = [];
                for (let i = 0; i < fmiData.length; i++) {
            rows.push({
                id: i ,
                enableDragging: false,
                age: (Math.random() * 80) | 0,
                generation
            });
			
			const from = fmiData[i].attributes.start == null ? moment(fmiData[i].attributes.mesimabetahalich.data.attributes.createdAt) : moment(fmiData[i].attributes.start)//todo first timer start
            
            const to = fmiData[i].attributes.finnish == null ? moment(fmiData[i].attributes.createdAt) : moment(fmiData[i].attributes.finnish)//todo last timer end
            tasks.push({
                type: 'task',
                id: `${fmiData[i].id}.4`,
                resourceId: i ,
                label: fmiData[i].attributes.missionName,
                from,
                enableDragging: false,
                to,
                classes: 'pink',
                resizeHandleWidth: 0,
                generation
            });            

        }
        tasks = tasks
        rows = rows     
        for (let i = 0; i < bmiData.length; i++) {
            rows.push({
                id: i + fmiData.length,
                enableDragging: false,
                age: (Math.random() * 80) | 0,
                generation
            });
			
			const from = moment(bmiData[i].attributes.createdAt)
            let rand_l = bmiData[i].attributes.hoursassinged / 2
            const to = from.clone().add(rand_l, 'days')
            tasks.push({
                type: 'task',
                id: bmiData[i].id,
                resourceId: i + fmiData.length,
                label: bmiData[i].attributes.name,
                from,
                enableDragging: false,
                to,
                classes:'blue',
                resizeHandleWidth: 0,
                generation
            });            

        }
        tasks = tasks
        rows = rows
        for (let i = 0; i < omiData.length; i++) {
            rows.push({
                id: i + bmiData.length + fmiData.length,
                enableDragging: false,
                age: (Math.random() * 80) | 0,
                generation
            });
			
			const from = moment(omiData[i].attributes.createdAt)
            let rand_l = omiData[i].attributes.noofhours / 2
                        console.log(from,"f")

            const to = from.clone().add(rand_l, 'days')
            tasks.push({
                type: 'task',
                id: `${omiData[i].id}.2`,
                resourceId: i + bmiData.length + fmiData.length,
                label: omiData[i].attributes.name,
                from,
                enableDragging: false,
                to,
                classes:'orange',
                resizeHandleWidth: 0,
                generation
            });            

        }
        tasks = tasks
        rows = rows

        for (let i = 0; i < pmiData.length; i++) {
            rows.push({
                id: i + bmiData.length + omiData.length + fmiData.length,
                enableDragging: false,
                age: (Math.random() * 80) | 0,
                generation
            });
			
			const from = pmiData[i].attributes.sqadualed ?  moment(pmiData[i].attributes.sqadualed) : moment(pmiData[i].attributes.createdAt)
            let rand_l = pmiData[i].attributes.noofhours / 2
            console.log(from,"p",pmiData[i])
            const to = pmiData[i].attributes.dates ? pmiData[i].attributes.dates : from.clone().add(rand_l, 'days')
            tasks.push({
                type: 'task',
                id: `${pmiData[i].id}.3`,
                resourceId: i + bmiData.length + omiData.length + fmiData.length,
                label: pmiData[i].attributes.name,
                from,
                enableDragging: false,
                to,
                classes: 'green',
                resizeHandleWidth: 0,
                generation
            });            

        }
           tasks = tasks
        rows = rows


              console.log("jjf")

        generation += 1;
        console.log("tasks",tasks,rows)
        


        return { rows, tasks };
    }
    function onUpdateOptions(opts) {
      //  const opts = event.detail;
        Object.assign(options, opts);
        gantt.$set(options);
    }
    function onSetNextDay() {
        currentStart.add(1, 'year');
        currentEnd.add(1, 'year');
        console.log('set next year');
        onUpdateOptions({
            from: currentStart,
            to: currentEnd
        });
    };
    function onSetPreviousDay() {
        currentStart.subtract(1, 'year');
        currentEnd.subtract(1, 'year');
        console.log('set previous year');
        onUpdateOptions({
            from: currentStart,
            to: currentEnd
        });
    };
</script>

<style>
    #example-gantt {
        flex-grow: 1;
        overflow: auto;
    }
    .container {
        display: flex;
        overflow: auto;
        flex: 1;
        min-width: 100%;
    }
    .btnr{
        position: relative;
        top: 1px;
        right: 40%;
        height: 16px;
        color: var(--barbi-pink);
    }
 .btnl{
        position: relative;
        top: 1px;
        left : 40%;
        height: 16px;
                color: var(--barbi-pink);

    }
    @media(min-width:640px){
        .btnl,.btnr{
            height: 48px;
        }
    }
</style>
 <div width="100%">
    <button class="btnl" onclick={()=>onSetNextDay()} value=">"><svg class="w-4 sm:w-8 h-4 sm:h-8" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 312 511.42"><path fill="currentColor" fill-rule="nonzero" d="M35.54 0 312 252.82 29.84 511.42 0 478.8l246.54-225.94L5.7 32.62z"/></svg></button>
        <button class="btnr" onclick={()=>onSetPreviousDay()} value="<"><svg class="w-4 sm:w-8 h-4 sm:h-8" style="transform: rotate(180deg);" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 312 511.42"><path fill="currentColor" fill-rule="nonzero" d="M35.54 0 312 252.82 29.84 511.42 0 478.8l246.54-225.94L5.7 32.62z"/></svg></button>
   </div>
<div class="container">
   
        <div id="example-gantt"></div>
</div>