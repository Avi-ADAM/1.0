<script>
    import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
    import { onMount } from 'svelte';
    import moment from 'moment';
    export let bmiData = []
    const currentStart = moment().clone().startOf('year');
    const currentEnd = moment().clone().endOf('year');
    let generation = 0;
    let rowCount = bmiData.length
    const colors = ['blue', 'green', 'orange']
    const data = generate();
	console.log(bmiData)
		let options = {
            resizeHandleWidth: 0,
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: data.rows,
        tasks: data.tasks,
		columnUnit: 'month',
        columnOffset: 1,
        rowHeight: 52,
        rowPadding: 6,
        headers: [{ unit: 'year', format: 'YYYY' }, { unit: 'month', format: 'MMM' }], //, { unit: 'day', format: 'MMMM Do' } 
        fitWidth: true,
        minWidth: 400,
        from: currentStart,
        to: currentEnd,
    }
    let gantt;
    onMount(() => {
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: options });
    	gantt.api.tasks.on.select((task) => console.log('Listener: task selected', task));
        
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
        const rows = [];
        const tasks = [];
        const ids = [...Array(rowCount).keys()];
        shuffle(ids);
        for (let i = 0; i < rowCount; i++) {
            rows.push({
                id: i,
                enableDragging: false,
                                age: (Math.random() * 80) | 0,
                generation
            });
			
			const from = moment(bmiData[i].created_at)
            let rand_l = bmiData[i].hoursassinged / 2
            const to = from.clone().add(rand_l, 'days')
            tasks.push({
                type: 'task',
                id: bmiData[i].id,
                resourceId: i,
                label: bmiData[i].name,
                from,
                enableDragging: false,
                to,
                classes: colors[(Math.random() * colors.length) | 0],
                resizeHandleWidth: 0,
                generation
            });            

        }
        generation += 1;
        console.log(tasks,rows)
        return { rows, tasks };
    }
    function onChangeOptions(event) {
        const opts = event.detail;
        Object.assign(options, opts);
        gantt.$set(options);
    }
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
    }


</style>

<div class="container">
    <div id="example-gantt"></div>
</div>