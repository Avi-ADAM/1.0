<script>
	// +page.svelte
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
    import { fetchTimers , timers} from '$lib/stores/timers'
    import Timer from '$lib/components/timers/timer.svelte'
	let hoverText = '0';
	let tx = 200;
	$: if ($timers.length > 10) {
		tx = (400 / $timers.length) * 3.6;
	}

	//let center = { x: w / 2, y: h / 2 }; // No longer the overall center, see below
	let size = 150;  // Reduced size, to make room for rotation and spacing.
	let bigsize = 160; // Increased bigsize for clarity.
	let add = size/2 + 10 ; //  spacing.  CRUCIAL.
	let tiltAngle = 59; // Rotation angle in degrees

	// Function to format time (you'll likely have this already)
    function getTimeComponents(milliseconds) {
        if (!milliseconds) return { hours: 0, minutes: 0, seconds: 0 };

        const totalSeconds = Math.floor(milliseconds / 1000);
        return {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60
        };
    }
    let newState = false;
    // Function to fetch timer data
	
    onMount(async () => {
		const res = await fetchTimers($page.data.uid,fetch).then((x) => {
            newState = true
            orders = checkLines($timers);
        });
	});

	function project() {}
	function linke() {}
	function hover(txt) {
		hoverText = txt;
	}
	// Calculate the center position *once*, based on bigsize.  This is now the
    // center of the *large* timer, NOT the center of the entire container.
    let center = { x: bigsize / 2, y: bigsize / 2 };

    $: w = 500;
    $: h = 500;
    $: ow = 500;
    $: oh = 500;
    $: maxW = 100;
    $: maxH = 100;
    $: top = 0;
    $: left = 0;
    
    // Adjust sizes based on screen width
    $: size = ow > 550 ? 120 : 115;
    $: bigsize = ow > 550 ? 145 : 100;
    $: add = ow > 550 ? 70 : 70;
    
    function checkLine(i) {
    // Center timer remains unchanged.
    if (i === 0) {
        return { 
            myline: 0, 
            lineCircels: 1, 
            x: w / 2 - bigsize / 2,
            y: h / 2 - bigsize / 2,
            big: true 
        };
    }
    // Introduce a gap between coins.
    let gap = 10; // adjust this value for the desired gap
    let effectiveSize = size + gap;
    
    // Use "previousAcc" to track accumulated timers after the center coin.
    let myLine = 1;
    let previousAcc = 1; // index 0 is the center timer

    while (true) {
        let radius = bigsize / 2 + myLine * (size * 1.1);
        let circumference = 2 * Math.PI * radius;
        // Use Math.floor to ensure coins don't exceed the circumference.
        let thisLineCircles = Math.floor(circumference / effectiveSize);

        if (i - previousAcc < thisLineCircles) {
            let coinIndex = i - previousAcc;
            const angle = (coinIndex / thisLineCircles) * 2 * Math.PI;
            const x = w / 2 + radius * Math.cos(angle) - size / 2;
            const y = h / 2 + radius * Math.sin(angle) - size / 2;
            return { myline: myLine, lineCircels: thisLineCircles, x, y };
        }
        previousAcc += thisLineCircles;
        myLine += 1;
    }
}
    function checkLines(arr) {
        let c = {};
        for (let i = 0; i < arr.length; i++) {
            c[i] = checkLine(i);
        }
        return c;
    }

    $: orders = checkLines($timers);
</script>

<div id="screen" bind:clientWidth={ow} bind:clientHeight={oh} style="position:fixed; width:100vw; height:100vh; overflow: auto; top:0; left:0; max-width:100vw; max-height:100vh;" class="timer-container d">
    <div dir="ltr" bind:clientWidth={w} bind:clientHeight={h} 
    style="position: absolute; overflow: auto; top: 50%; left: 50%; transform: translate(-50%, -50%); width: calc({maxW}vw - 10px); height: {maxH}vh;" 
    class="screen d">
        
        {#each $timers as timer, index (timer.id)}
        <Timer
            orders={orders[index]}
            missionId={timer.mId} 
            {tx} 
            {size}
            {bigsize} 
            {add} 
            {center} 
            {tiltAngle} 
            {hover} 
            {project} 
            {linke}
        />
        {/each}
    </div>
</div>

<style>
    .timer-container {
        background-color: #000000;
        background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    }
    
    .screen {
        background: transparent;
    }

	.timer {
		position: absolute; /* Position each timer absolutely within the container */
		/* Add any other styling you need for the timer SVG itself */
	}
    /* Global styles for the SVG elements */
        #hours {
            stroke: #00ffff;
        }
        #hhand {
            fill: #00ffff;
            stroke: purple;
        }
        #minutes {
            stroke: lime;
        }
        #mhand {
            fill: lime;
            stroke: purple;
        }
        #seconds {
            stroke: magenta;
        }
        #shand {
            fill: magenta;
            stroke: purple;
        }
        .tics {
            stroke: purple;
            stroke-width: 2px;
        }
        .dots {
            fill: purple;
            stroke: none;
        }
        text {
            stroke: purple;
            stroke-width: 0.75px;
        }

	/* Add any other global styles you need */
</style>