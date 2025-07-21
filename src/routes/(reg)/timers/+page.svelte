<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
    import { fetchTimers , initialWebSocketForTimer, timers} from '$lib/stores/timers'
    import Timer from '$lib/components/timers/timer.svelte'
	let hoverText = '0';
	let tx = $state(200);
	$effect(() => {
        if ($timers.length > 10) {
    		tx = (400 / $timers.length) * 3.6;
    	}
    });

	//let center = { x: w / 2, y: h / 2 }; // No longer the overall center, see below
	let size = $state(150);  // Reduced size, to make room for rotation and spacing.
	let bigsize = $state(160); // Increased bigsize for clarity.
	let add = $derived(size/2 + 10) ; //  spacing.  CRUCIAL.
	let tiltAngle = $state(59); // Rotation angle in degrees

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
    let newState = $state(false);
    // Function to fetch timer data
	
    onMount(async () => {
		const res = await fetchTimers(page.data.uid,fetch).then((x) => {
            newState = true;
            
            // עדכון מידות
            updateSizes();
            
            // מירכוז התצוגה
            centerViewOnLoad();
            
            // האזנה לשינויי גודל החלון
            window.addEventListener('resize', () => {
                updateSizes();
                centerViewOnLoad();
            });
        });
        // Call initialWebSocketForTimer without the token, as it will be handled server-side
        // Assuming page.data.uid is the 'id' needed for the socket connection
        initialWebSocketForTimer(page.data.uid,page.data.tok,fetch);
	});

	function project() {}
	function linke() {}
	function hover(txt) {
		hoverText = txt;
	}
	// Calculate the center position *once*, based on bigsize.  This is now the
    // center of the *large* timer, NOT the center of the entire container.
    let center = $derived({ x: bigsize / 2, y: bigsize / 2 });

    let w = $state(1200);
     // הגדלת רוחב אזור הטיימרים
    let h = $state(1200);
     // הגדלת גובה אזור הטיימרים
    let ow = $state(500);
    
    let oh = $state(500);
 
    // Adjust sizes based on screen width
    $effect(() => {
        size = ow > 550 ? 160 : 115;
    });
    $effect(() => {
        bigsize = ow > 550 ? 185 : 100;
    });
    $effect(() => {
        add = ow > 550 ? 70 : 70;
    });
    
    // חישוב אוטומטי של גודל אזור התצוגה לפי מספר הטיימרים
    $effect(() => {
        if ($timers.length > 50) {
            w = 2500;
            h = 2500;
        } else if ($timers.length > 30) {
            w = 2000;
            h = 2000;
        } else if ($timers.length > 15) {
            w = 1500;
            h = 1500;
        } else {
            w = 1200;
            h = 1200;
        }
    });

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
        let currentLineTimersCount = 0; // כמה טיימרים יש בשורה הנוכחית

        while (true) {
            let radius = bigsize / 2 + myLine * (size * 1.1);
            let circumference = 2 * Math.PI * radius;
            // Use Math.floor to ensure coins don't exceed the circumference.
            let thisLineCircles = Math.floor(circumference / effectiveSize);
            
            // בדיקה אם הטיימר הנוכחי שייך לשורה זו
            if (i - previousAcc < thisLineCircles) {
                let coinIndex = i - previousAcc;
                
                // מציאת כמות הטיימרים בשורה הנוכחית
                if (myLine === 1) {
                    // עבור המעגל הראשון
                    currentLineTimersCount = Math.min($timers.length - 1, thisLineCircles);
                } else {
                    // עבור מעגלים חיצוניים יותר
                    currentLineTimersCount = Math.min($timers.length - previousAcc, thisLineCircles);
                }
                
                // חישוב זווית עם פיזור אחיד על פני כל המעגל
                const angleStep = 2 * Math.PI / Math.max(1, currentLineTimersCount);
                const angle = coinIndex * angleStep;
                
                const x = w / 2 + radius * Math.cos(angle) - size / 2;
                const y = h / 2 + radius * Math.sin(angle) - size / 2;
                
                return { 
                    myline: myLine, 
                    lineCircels: thisLineCircles, 
                    totalInLine: currentLineTimersCount,
                    x, 
                    y 
                };
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

    let orders = $state({});
    $effect(() => {
        orders = checkLines($timers);
    });

    // פונקציה נפרדת למירכוז התצוגה - מאפשרת קריאה חוזרת אם צריך
    function centerViewOnLoad() {
        setTimeout(() => {
            const container = document.getElementById('screen');
            const content = document.getElementById('timer-content');
            if (container && content) {
                try {
                    // גישה חדשה - חישוב מדויק יותר של המרכז
                    // המרכז האמיתי של התוכן הוא w/2 ו-h/2 יחסית לגודל המכולה
                    const contentCenter = { x: w / 2, y: h / 2 };
                    
                    // חישוב כמה לגלול כדי למרכז את התוכן
                    const scrollLeft = contentCenter.x - (container.clientWidth / 2);
                    const scrollTop = contentCenter.y - (container.clientHeight / 2);
                    
                    console.log('גלילה אל:', scrollLeft, scrollTop, 'גודל תוכן:', w, h);
                    
                    // גלילה למיקום החדש
                    container.scrollTo({
                        left: Math.max(0, scrollLeft),
                        top: Math.max(0, scrollTop),
                        behavior: 'smooth'
                    });
                } catch (err) {
                    console.error('שגיאה במירכוז:', err);
                }
            }
        }, 400); // הארכת זמן ההמתנה עוד יותר
    }
    
    // גישה חדשה למדידת גודל החלון והתאמת ה-viewport
    function updateSizes() {
        // הגדרת גודל סבירים עבור החלון
        ow = window.innerWidth;
        oh = window.innerHeight;
        
        // התאמת גודל הפריסה של הטיימרים לפי מספר הטיימרים
        if ($timers.length > 50) {
            w = 3000;
            h = 3000;
        } else if ($timers.length > 30) {
            w = 2500;
            h = 2500;
        } else if ($timers.length > 15) {
            w = 2000;
            h = 2000;
        } else {
            w = 1500;
            h = 1500;
        }
        
        // התאמת מידות האלמנטים לפי גודל המסך
        size = ow > 550 ? 120 : 110;
        bigsize = ow > 550 ? 145 : 95;
        
        // מחשבים מחדש את המיקומים
        orders = checkLines($timers);
    }
</script>
{#key $timers}

<div id="screen" bind:clientWidth={ow} bind:clientHeight={oh} 
     style="position: fixed; width: 100vw; height: 100vh; top: 0; left: 0; max-width: 100vw; max-height: 100vh;" 
     class="timer-container d">
    <div class="center-wrapper">
        <div id="timer-content" dir="ltr" bind:clientWidth={w} bind:clientHeight={h} 
            style="position: relative; width: {w}px; height: {h}px;" 
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
                hoursAssigned={timer.hoursAssigned}
            />
            {/each}
            
            <!-- סמן מרכז - שימושי לפיתוח - להסרת ההערה לצורך בדיקות -->
            <!-- <div class="center-marker"></div> -->
        </div>
    </div>
</div>
{/key}

<style>
    .timer-container {
        background-color: #000000;
        background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
        overflow: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        padding: 0;
    }
    
    .center-wrapper {
        display: grid;
        place-items: center;
        width: max-content;
        height: max-content;
        padding: 10px;
        min-width: 100%;
        min-height: 100%;
    }
    
    .screen {
        background: transparent;
        transform-origin: center center;
    }
    
    /* מרקר למרכז הדף - לפיתוח בלבד */
    .center-marker {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        background-color: rgba(255, 0, 0, 0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 999;
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
