<script>
  import { startTimer, stopTimer } from '$lib/func/timers.js';
  import NumberFlow, { NumberFlowGroup } from '@number-flow/svelte';
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { timers, updateTimers } from '$lib/stores/timers';
  import { lang } from '$lib/stores/lang'; // Import the lang store
  import TimerDialogs from './TimerDialogs.svelte';

  let {
    orders,
    tx,
    size,
    bigsize,
    add,
    center,
    tiltAngle,
    hover,
    project,
    linke,
    missionId,
    hoursAssigned // Add this prop
  } = $props();
  let showSaveDialog = $state(false);
  let showClearDialog = $state(false);
  let showSaveFinal = $state(false);
  let dialogEdit = $state(true);
  let elapsedTime = $state('00:00:00');
  let selectedTasks = $state([]);
  let taskSearchTerm = $state('');
  let timer = $state([]);
  let localZman = $state(0); // Make localZman a state variable
  let isRunning = $derived(timer?.running || false); // Keep isRunning derived from timer.running
  let timerInterval = $state();

  onMount(() => {
    timer = $timers?.find((t) => t.mId == missionId);

    console.log(timer)
    if(timer.attributes.activeTimer.data?.attributes?.isActive) {
      console.log("running")  
    // Get the timers array from the timer data
    let timers = timer.attributes.activeTimer.data.attributes.timers;
    
    if (timers && timers.length > 0) {
      // Get the most recent timer entry
      let lastTimer = timers[timers.length - 1];
      
      // Calculate elapsed time since the last start
      let startTime = new Date(lastTimer.start).getTime();
      let currentTime = Date.now();
      
      // Update local state
      localZman = (currentTime - startTime) + timer.attributes.activeTimer.data.attributes.totalHours * 3600000;
      isRunning = true;
      timer.running = true;
      console.log(localZman, isRunning)
    }
  }else if(timer.attributes.activeTimer.data?.attributes?.isActive == false){
    console.log("stopped")
    let totalHours = timer.attributes.activeTimer.data.attributes.totalHours;
    localZman = totalHours * 3600000;
    isRunning = false;
    timer.running = false;
  
}
    selectedTasks = timer?.attributes.activeTimer?.data?.attributes.acts.data.map(task => task.id) ?? []
  })

  // Calculate total hours done (saved + current running)
  let totalHoursDone = $derived(
    (localZman / 3600000) + (timer?.attributes?.howmanyhoursalready || 0)
  );

 // Start/stop timer function
 async function startTimerLocal(only=false) {
    console.log("start",only)
    if (timerInterval) clearInterval(timerInterval);
    const startTime = Date.now() - localZman;
    timerInterval = setInterval(() => {
      localZman = Date.now() - startTime;
    }, 100);
  if (only) return;
  // Call startTimer with all required params
 await startTimer(
    timer.attributes?.activeTimer, // Active timer object from props
    timer.mId,                     // Mission ID
    page.data.uid,                        // User ID
    timer.projectId,                     // Project ID
    timer.attributes?.activeTimer?.data?.id || 0, // Timer ID or 0 if none
    false,                         // isSer flag
    fetch                          // fetch function
  ).then((res) => {
    console.log(res)
    if (res) {
      console.log(res)
      timer.attributes.activeTimer = res;
            timer.attributes.activeTimer.isActive = true; // Make sure to update isActive flag
            
            // Update global timers store
           updateTimers(
                $timers.map((t) =>
                  t.mId === timer.mId
                    ? {
                        ...t,
                        running: true,
                        attributes: {
                          ...t.attributes,
                          activeTimer: {
                            ...t.attributes.activeTimer,
                            data: res,
                            isActive: true,
                          },
                        },
                      }
                    : t
                )
              );
            console.log($timers)
            }
  });
  }

  async function stopTimerLocal(only = false) {
    isRunning = false;
    timer.running = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (only) return;
    // Call stopTimer with all required params
   await stopTimer(timer.attributes.activeTimer.data,fetch,false).then((res) => {
    if (res) {
      console.log(res)
      timer.attributes.activeTimer.data = res;
            timer.attributes.activeTimer.isActive = false; // Make sure to update isActive flag
            
            // Update global timers store
            updateTimers(
                $timers.map((t) =>
                  t.mId === timer.mId
                    ? {
                        ...t,
                        running: false,
                        attributes: {
                          ...t.attributes,
                          activeTimer: {
                            ...t.attributes.activeTimer,
                            data: res,
                            isActive: false,
                          },
                        },
                      }
                    : t
                )
              );
                   // Show save dialog after successful stop
      const { hours, minutes, seconds } = getTimeComponents(localZman);
      elapsedTime = `${hours}:${minutes}:${seconds}`;
      console.log('hereeee')
      showSaveDialog = true;
      dialogEdit = false
      console.log(showSaveDialog)
    }
  });
  }


  async function handleToggleTimer() {
    const timerId =
      timer.attributes.activeTimer?.data != null
        ? timer.attributes.activeTimer?.data.attributes?.saved == false
          ? timer.attributes.activeTimer?.data?.id
          : 0
        : 0;

    const now = new Date().toISOString();

    isRunning = !isRunning;
    timer.running = isRunning;

    if (isRunning) {
      startTimerLocal();
    } else {
      stopTimerLocal();
      timer.zman = localZman;
    }
  }

  // Cleanup on component destruction
  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  function getTimeComponents(milliseconds) {
    if (!milliseconds) return { hours: 0, minutes: 0, seconds: 0 };
    const totalSeconds = Math.floor(milliseconds / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

 

  // Update local state when timer prop changes
  $effect(() => {
    isRunning = timer?.running || false;
    if (isRunning && !timerInterval) {
      startTimerLocal(true);
    } else if (!isRunning && timerInterval) {
      stopTimerLocal(true);
    }
  });
  // Reactive rotations based on localZman
  
  let rotation = $derived((localZman / 1000) * 6);
  let rotationm = $derived((localZman / 60000) * 6 + ((localZman % 60000) / 60000) * 6);
  let rotationh =
    $derived((localZman / 3600000) * 30 + ((localZman % 3_600_000) / 3_600_000) * 30);
  let orbitalRotation = $derived((localZman / 60000) * 360); // Complete rotation every minute
</script>
<TimerDialogs
  bind:timer
  bind:showSaveDialog
  bind:showClearDialog
  bind:showSaveFinal
  bind:dialogEdit
  bind:elapsedTime
  bind:selectedTasks
  bind:taskSearchTerm
  onUpdate-timer={({ detail }) => {
    if (detail.timer) {
      timer.attributes.activeTimer.data = detail.timer;
      timer.attributes.activeTimer.isActive = detail.running;
      
      if (detail.hoursdon !== undefined) {
        timer.attributes.howmanyhoursalready = detail.hoursdon;
      }
      
      // Update global timers store
      updateTimers(
        $timers.map((t) =>
          t.mId === timer.mId
            ? {
                ...t,
                running: detail.running,
                attributes: {
                  ...t.attributes,
                  howmanyhoursalready: detail.hoursdon !== undefined ? detail.hoursdon : t.attributes.howmanyhoursalready,
                  activeTimer: {
                    ...t.attributes.activeTimer,
                    data: detail.timer,
                    isActive: detail.running,
                  },
                },
              }
            : t
        )
      );

      // Reset localZman specifically for clear operations
      if (!detail.running && detail.timer?.attributes?.timers?.length === 0) {
        localZman = 0;
      } else {
        // Otherwise, update based on totalHours (for save, update, etc.)
        localZman = (detail.timer?.attributes?.totalHours || 0) * 3600000;
      }
      // Ensure isRunning state is also updated based on the event
      isRunning = detail.running;

    } else {
       // Handle cases where detail.timer might be null or undefined if necessary
       console.warn("update-timer event received without timer data:", detail);
       localZman = 0; // Default to 0 if timer data is missing
       isRunning = false;
    }
  }}
/>
<svg
  class="timer"
  style="width:{orders?.big ? bigsize : size}px;
       left:{orders?.x}px;
       top:{orders?.y}px;
       transform: rotate({tiltAngle}deg) translate(-50%, -50%);"
  viewBox="0 0 600 600"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:bx="https://boxy-svg.com"
>
  <defs>
    <!-- Your gradients and filters here (no changes needed) -->
    <linearGradient id="gradient-15-18" gradientUnits="userSpaceOnUse" x1="12.639" y1="8.381" x2="12.639" y2="21.5" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-234-0" gradientUnits="userSpaceOnUse" x1="12.3" y1="3.752" x2="12.3" y2="16.871" xlink:href="#gradient-234"/>
    <radialGradient id="rg1" bx:pinned="true">
      <stop offset="0" style="stop-color: rgb(66, 221, 210);" />
      <stop offset="0.249" style="stop-color: rgb(34, 0, 255);" />
      <stop offset="0.621" stop-color="magenta" />
      <stop offset="0.974" style="stop-color: rgb(189, 255, 244);" />
    </radialGradient>
    <!-- ... other gradients ... -->
    <linearGradient
      id="rg1-0"
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      gradientTransform="matrix(1.122731, 0, 0, 1.267796, -36.960182, -99.406624)"
      xlink:href="#rg1"
    />
    <linearGradient
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      id="gradient-1"
      gradientTransform="matrix(1.122731, 0, 0, 1.267796, -36.960182, -99.406624)"
    >
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)" />
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)" />
    </linearGradient>
    <linearGradient
      id="rg1-1"
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      gradientTransform="matrix(0.877271, 0, 0, 0.719844, 62.592922, 117.334374)"
      xlink:href="#rg1"
    />
    <linearGradient
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      id="gradient-2"
      gradientTransform="matrix(0.877271, 0, 0, 0.719844, 62.592922, 117.334374)"
    >
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)" />
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)" />
    </linearGradient>
    <linearGradient
      id="rg1-2"
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      gradientTransform="matrix(1, 0, 0, 1, 0, -5)"
      xlink:href="#rg1"
    />
    <linearGradient
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      id="gradient-3"
      gradientTransform="matrix(1, 0, 0, 1, 0, -5)"
    >
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)" />
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)" />
    </linearGradient>
    <linearGradient
      id="rg1-3"
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      gradientTransform="matrix(0.693194, 0, 0, 0.740444, 123.399486, 111.6365)"
      xlink:href="#rg1"
    />
    <linearGradient
      gradientUnits="userSpaceOnUse"
      x1="300"
      y1="130"
      x2="300"
      y2="360"
      id="gradient-4"
      gradientTransform="matrix(0.693194, 0, 0, 0.740444, 123.399486, 111.6365)"
    >
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)" />
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)" />
    </linearGradient>
    <style bx:fonts="Abel" bx:pinned="true">
      @import url(https://fonts.googleapis.com/css2?family=Abel%3Aital%2Cwght%400%2C400&display=swap);
    </style>

    <linearGradient id="linearGradient3938" bx:pinned="true">
      <stop
        id="stop3940"
        style="stop-color:#ffdd55;stop-opacity:1"
        offset="0.257"
      />
      <stop offset="0.455" style="stop-color: rgb(247, 0, 128);" />
      <stop offset="0.587" style="stop-color: rgb(255, 3, 121);" />
      <stop
        id="stop3958"
        style="stop-opacity: 1; stop-color: rgb(255, 196, 0);"
        offset="0.741"
      />
    </linearGradient>

    <linearGradient id="gradient-15" bx:pinned="true">
      <stop offset="0.214" style="stop-color: rgb(255, 216, 40);" />
      <stop offset="0.888" style="stop-color: rgb(255, 0, 102);" />
    </linearGradient>

    <linearGradient id="color-0" bx:pinned="true">
      <stop style="stop-color: #40e0d0;" offset="0" />
      <stop style="stop-color: #ff8c00;" offset="0.775" />
      <stop style="stop-color: #ff0080;" offset="1" />
    </linearGradient>

    <linearGradient
      id="color-0-0"
      gradientUnits="userSpaceOnUse"
      x1="295.697"
      y1="-5.847"
      x2="295.697"
      y2="584.153"
      gradientTransform="matrix(1, 0, 0, 1, 2.999577, 9.641026)"
      xlink:href="#color-0"
    />
    <linearGradient
      id="gradient-15-1"
      gradientUnits="userSpaceOnUse"
      x1="310.847"
      y1="0"
      x2="310.847"
      y2="590"
      gradientTransform="matrix(1, 0, 0, 1, -12.150015, 3.794)"
      xlink:href="#gradient-15"
    />
    <radialGradient
      gradientUnits="userSpaceOnUse"
      cx="127.028"
      cy="92.411"
      r="107.258"
      id="linearGradient3938-4"
      xlink:href="#linearGradient3938"
    />
    <radialGradient
      gradientUnits="userSpaceOnUse"
      cx="349.119"
      cy="362.34"
      r="96.651"
      id="linearGradient3938-0"
      xlink:href="#linearGradient3938"
    />
  </defs>

  <!-- Main circle -->
  <circle
    cx="300"
    cy="300"
    r="295"
    style="stroke-width: 15px; fill: url(#color-0-0); stroke: url(#gradient-15-1);"
  />

  <!-- Ticks (simplified, you can add more if needed) -->
  <g id="ts" class="tics">
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(0.8660254037844387, 0.49999999999999994, -0.49999999999999994, 0.8660254037844387, 190.19237886466837, -109.8076211353316)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(0.5000000000000001, 0.8660254037844386, -0.8660254037844386, 0.5000000000000001, 409.8076211353316, -109.8076211353316)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(6.123233995736766e-17, 1, -1, 6.123233995736766e-17, 600, 0)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(-0.4999999999999998, 0.8660254037844387, -0.8660254037844387, -0.4999999999999998, 709.8076211353316, 190.19237886466834)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(-0.8660254037844387, 0.49999999999999994, -0.49999999999999994, -0.8660254037844387, 709.8076211353316, 409.8076211353316)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(-1, 1.2246467991473532e-16, -1.2246467991473532e-16, -1, 600, 600)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(-0.8660254037844386, -0.5000000000000001, 0.5000000000000001, -0.8660254037844386, 409.8076211353316, 709.8076211353316)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(-0.5000000000000004, -0.8660254037844385, 0.8660254037844385, -0.5000000000000004, 190.1923788646686, 709.8076211353317)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(-1.8369701987210297e-16, -1, 1, -1.8369701987210297e-16, 5.684341886080802e-14, 600)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <path d="M300,14l0,12" transform="rotate(24,300,300)" />
  </g>
  <g
    class="tics"
    transform="matrix(0.5000000000000001, -0.8660254037844386, 0.8660254037844386, 0.5000000000000001, -109.8076211353316, 409.8076211353316)"
  >
    <circle class="dots" cx="300" cy="20" r="6" />
    <path d="M300,14l0,12" transform="rotate(6,300,300)" />
    <path d="M300,14l0,12" transform="rotate(12,300,300)" />
    <path d="M300,14l0,12" transform="rotate(18,300,300)" />
    <g
      class="tics"
      transform="matrix(0.5000000000000001, -0.8660254037844386, 0.8660254037844386, 0.5000000000000001, -109.8076211353316, 409.8076211353316)"
    >
      <circle class="dots" cx="300" cy="20" r="6" />
      <path d="M300,14l0,12" transform="rotate(6,300,300)" />
      <path d="M300,14l0,12" transform="rotate(12,300,300)" />
      <path d="M300,14l0,12" transform="rotate(18,300,300)" />
      <path d="M300,14l0,12" transform="rotate(24,300,300)" />
    </g>
    <g
      class="tics"
      transform="matrix(0.8660254037844384, -0.5000000000000004, 0.5000000000000004, 0.8660254037844384, -109.8076211353316, 190.19237886466865)"
    >
      <circle class="dots" cx="300" cy="20" r="6" />
      <path d="M300,14l0,12" transform="rotate(6,300,300)" />
      <path d="M300,14l0,12" transform="rotate(12,300,300)" />
      <path d="M300,14l0,12" transform="rotate(18,300,300)" />
      <path d="M300,14l0,12" transform="rotate(24,300,300)" />
    </g>
    
    <!-- Centered Control Buttons -->
    <g transform="translate(300,280)"> <!-- Changed Y from 300 to 280 to move up -->
      <!-- Left Button - Play/Stop -->
      <g 
        transform="translate(-80,0)" 
        class="control-button"
        onclick={handleToggleTimer}
        onkeypress={handleToggleTimer}
        style="cursor: pointer;"
        role="button"
        tabindex="0"
        aria-label={timer.running ? 'עצור טיימר' : 'הפעל טיימר'}
      >
        <circle
          cx="0"
          cy="0"
          r="50"
          class="fill-pink-100"
          stroke={timer.running ? '#ff3366' : '#00ff88'}
          stroke-width="3"
        />
        {#if timer.running}
          <rect
            x="-20"
            y="-20"
            width="40"
            height="40"
            fill="#ff3366"
            rx="4"
          />
        {:else}
          <path
            d="M -16 -24 L 24 0 L -16 24 Z"
            fill="#00ff88"
          />
        {/if}
      </g>

      <!-- Right Button - Edit -->
      <g 
        transform="translate(80,0)" 
        class="control-button"
        onclick={() => showSaveDialog = true}
        onkeypress={() => showSaveDialog = true}
        style="cursor: pointer;"
        role="button"
        tabindex="0"
        aria-label="ערוך טיימר"
      >
        <circle
          cx="0"
          cy="0"
          r="50"
          class="fill-pink-100 button-bg"
          stroke="#00ffff"
          stroke-width="3"
        />
        <path
          d="M-20 -20 L-20 20 L20 20 L20 -8 L8 -20 Z M-12 12 L-12 -12 L0 -12 L0 12 Z M8 -16 L16 -8 L8 -8 Z"
          fill="#00ffff"
        />
      </g>
    </g>
       <!-- Timer Display -->
       <g transform="translate(300,380)">
        <foreignObject x="-150" y="-20" width="300" height="120">
          <div
            style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;"
          >
            <NumberFlowGroup>
              <div
                style="
                  font-variant-numeric: tabular-nums;
                  --number-flow-char-height: 1em;
                  font-size: 48px;
                  font-family: 'DS-Digital', 'Seven Segment', monospace;
                  color: #33ff33;
                  text-shadow: 0 0 10px rgba(51, 255, 51, 0.7);
                  font-weight: normal;
                  letter-spacing: 4px;
                  background: rgba(0, 0, 0, 0.3);
                  padding: 8px 15px;
                  border-radius: 8px;
                  border: 1px solid rgba(51, 255, 51, 0.3);"
                class="flex items-baseline"
              >
                <NumberFlow
                  trend={-1}
                  value={getTimeComponents(localZman).hours}
                  format={{ minimumIntegerDigits: 2 }}
                />
                <NumberFlow
                  prefix=":"
                  trend={-1}
                  value={getTimeComponents(localZman).minutes}
                  digits={{ 1: { max: 5 } }}
                  format={{ minimumIntegerDigits: 2 }}
                />
                <NumberFlow
                  prefix=":"
                  trend={-1}
                  value={getTimeComponents(localZman).seconds}
                  digits={{ 1: { max: 2 } }}
                  format={{ minimumIntegerDigits: 2 }}
                />
              </div>
            </NumberFlowGroup>
          </div>
        </foreignObject>
      </g>
      <g
      transform="matrix(0.542341, 0, 0, 0.542341, 267.0672, 302.203613)"
      style=""
    >
      <radialGradient
        id="face_1_"
        cx="63.6"
        cy="-2088.8999"
        r="56.9597"
        gradientTransform="matrix(1 0 0 -1 0 -2026)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.5" style="stop-color:#FDE030" />
        <stop offset="0.9188" style="stop-color:#F7C02B" />
        <stop offset="1" style="stop-color:#F4A223" />
      </radialGradient>
      <path
        id="face_15_"
        style="fill: url(#face_1_); stroke: url(#gradient-15-3);"
        d="M63.6,118.8c-27.9,0-58-17.5-58-55.9S35.7,7,63.6,7c15.5,0,29.8,5.1,40.4,14.4 c11.5,10.2,17.6,24.6,17.6,41.5s-6.1,31.2-17.6,41.4C93.4,113.6,79,118.8,63.6,118.8z"
      />
      <path
        style="fill: rgb(235, 143, 0); stroke: url(#gradient-15-4);"
        d="M111.49,29.67c5.33,8.6,8.11,18.84,8.11,30.23c0,16.9-6.1,31.2-17.6,41.4 c-10.6,9.3-25,14.5-40.4,14.5c-18.06,0-37.04-7.35-48.18-22.94c10.76,17.66,30.99,25.94,50.18,25.94c15.4,0,29.8-5.2,40.4-14.5 c11.5-10.2,17.6-24.5,17.6-41.4C121.6,50.16,118.13,38.84,111.49,29.67z"
      />
      <g id="three-heart-face_2_">
        <g id="blush_3_">
          <radialGradient
            id="gradient-5"
            cx="25.7006"
            cy="61.378"
            r="19.4444"
            gradientTransform="matrix(0.9791 0 0 0.9301 2.0871 5.7411)"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" style="stop-color:#ED7770" />
            <stop offset="0.9" style="stop-color:#ED7770;stop-opacity:0" />
          </radialGradient>
          <circle
            style="opacity: 0.8; fill: url(#gradient-5); stroke: url(#gradient-15-5);"
            cx="27.25"
            cy="62.83"
            r="17.5"
          />
          <radialGradient
            id="gradient-6"
            cx="100.7714"
            cy="61.378"
            r="19.4444"
            gradientTransform="matrix(0.9791 0 0 0.9301 2.0871 5.7411)"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" style="stop-color:#ED7770" />
            <stop offset="0.9" style="stop-color:#ED7770;stop-opacity:0" />
          </radialGradient>
          <circle
            style="opacity: 0.8; fill: url(#gradient-6); stroke: url(#gradient-15-6);"
            cx="100.75"
            cy="62.83"
            r="17.5"
          />
        </g>
        <path
          id="mouth_91_"
          style="fill: rgb(66, 43, 13); stroke: url(#gradient-15-7);"
          d="M100.69,65.04C90.42,71,77.74,74.53,64,74.53c-13.74,0-26.42-3.53-36.69-9.49 c-1.89-1.09-3.87,1.27-2.46,2.92c9.3,10.87,23.38,17.8,39.15,17.8c15.77,0,29.85-6.93,39.15-17.8 C104.57,66.3,102.58,63.94,100.69,65.04z"
        />
        <g id="eyes_71_">
          <path
            style="fill: rgb(66, 43, 13); stroke: url(#gradient-15-8);"
            d="M49.56,44.12c0,0-0.05-0.07-0.16-0.2c-0.1-0.13-0.24-0.31-0.42-0.54 c-0.15-0.16-0.33-0.35-0.54-0.57c-0.21-0.24-0.47-0.49-0.73-0.75c-0.27-0.25-0.55-0.51-0.84-0.72c-0.28-0.23-0.59-0.4-0.84-0.54 c-0.26-0.16-0.5-0.2-0.65-0.25c-0.08-0.03-0.15-0.03-0.21-0.04c-0.03,0.01-0.06-0.01-0.09,0l-0.04,0.01l-0.02,0l-0.01,0l0,0l0,0 l0,0c0.12,0-0.27,0.01,0.27-0.01l-0.55,0.02c-0.14,0-0.05,0.01-0.04,0.01c0.03,0,0.05,0,0.07-0.01c0.08-0.03,0,0-0.02,0 c-0.03,0-0.07,0.01-0.11,0.03c-0.16,0.05-0.4,0.09-0.65,0.25c-0.25,0.14-0.56,0.31-0.84,0.54c-0.28,0.22-0.57,0.47-0.84,0.72 c-0.52,0.51-0.98,1.02-1.3,1.39c-0.33,0.38-0.51,0.6-0.51,0.6l-0.23,0.27c-1.37,1.6-3.89,1.87-5.62,0.61 c-1.18-0.86-1.69-2.2-1.47-3.48c0,0,0.07-0.41,0.27-1.12c0.21-0.71,0.56-1.72,1.25-2.91c0.69-1.18,1.69-2.57,3.38-3.84 c0.83-0.62,1.84-1.24,3.04-1.66c0.29-0.11,0.6-0.21,0.92-0.29c0.33-0.08,0.59-0.17,1.04-0.23l0.62-0.09 c0.19-0.02,0.47-0.05,0.51-0.05l0.55-0.04l0.31-0.01l0.03,0l0.06,0l0.13,0.01l0.26,0.01l0.51,0.03c0.34,0.03,0.67,0.09,1,0.14 c0.65,0.12,1.3,0.29,1.89,0.51c1.2,0.42,2.21,1.03,3.04,1.66c1.69,1.27,2.69,2.66,3.38,3.84c0.35,0.59,0.61,1.15,0.8,1.64 c0.21,0.47,0.36,0.97,0.48,1.34c0.11,0.36,0.11,0.55,0.16,0.72c0.03,0.16,0.04,0.25,0.04,0.25c0.37,2.02-1.12,3.93-3.31,4.26 C51.94,45.88,50.43,45.24,49.56,44.12z"
          />
          <path
            style="fill: rgb(66, 43, 13); stroke: url(#gradient-15-9);"
            d="M87.06,44.12c0,0-0.05-0.07-0.16-0.2c-0.1-0.13-0.24-0.31-0.42-0.54 c-0.15-0.16-0.33-0.35-0.54-0.57c-0.21-0.24-0.47-0.49-0.73-0.75c-0.27-0.25-0.55-0.51-0.84-0.72c-0.28-0.23-0.59-0.4-0.84-0.54 c-0.26-0.16-0.5-0.2-0.65-0.25c-0.08-0.03-0.15-0.03-0.21-0.04c-0.03,0.01-0.06-0.01-0.09,0l-0.04,0.01l-0.02,0l-0.01,0l-0.01,0 l0,0l0,0c0.12,0-0.27,0.01,0.27-0.01l-0.55,0.02c-0.14,0-0.05,0.01-0.04,0.01c0.03,0,0.05,0,0.07-0.01c0.08-0.03,0,0-0.02,0 c-0.03,0-0.07,0.01-0.11,0.03c-0.16,0.05-0.4,0.09-0.65,0.25c-0.25,0.14-0.56,0.31-0.84,0.54c-0.28,0.22-0.57,0.47-0.84,0.72 c-0.52,0.51-0.98,1.02-1.3,1.39c-0.33,0.38-0.51,0.6-0.51,0.6l-0.23,0.27c-1.37,1.6-3.89,1.87-5.62,0.61 c-1.18-0.86-1.69-2.2-1.47-3.48c0,0,0.07-0.41,0.27-1.12c0.21-0.71,0.56-1.72,1.25-2.91c0.69-1.18,1.69-2.57,3.38-3.84 c0.83-0.62,1.84-1.24,3.04-1.66c0.29-0.11,0.6-0.21,0.92-0.29c0.33-0.08,0.59-0.17,1.04-0.23l0.62-0.09 c0.19-0.02,0.47-0.05,0.51-0.05l0.55-0.04l0.31-0.01l0.03,0l0.06,0l0.13,0.01l0.26,0.01l0.51,0.03c0.34,0.03,0.67,0.09,1,0.14 c0.65,0.12,1.3,0.29,1.89,0.51c1.2,0.42,2.21,1.03,3.04,1.66c1.69,1.27,2.69,2.66,3.38,3.84c0.35,0.59,0.61,1.15,0.8,1.64 c0.21,0.47,0.36,0.97,0.48,1.34c0.11,0.36,0.11,0.55,0.16,0.72c0.03,0.16,0.04,0.25,0.04,0.25c0.37,2.02-1.12,3.93-3.31,4.26 C89.43,45.88,87.92,45.24,87.06,44.12z"
          />
        </g>
      </g>
      <g>
        <g bind:this={rotation} transform="rotate(-{(rotation * 30) % 360})">
          <path
            style="fill: rgb(244, 67, 54); stroke: url(#gradient-15-10);"
            d="M116.31,96.26c-6.38-4.14-13.3-0.02-13.3-0.02s1.43-6.67-3.91-10.58 c-6.41-4.7-15.2-3.13-18.81,6.88c-4.13,11.45,6.46,31.39,6.46,31.39s20.6,0.81,30.2-8.09C124.76,108.61,121.13,99.39,116.31,96.26 z"
          />
          <g>
            <path
              style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-11);"
              d="M116.31,96.26c0,0-1.58-1-2.52-1.18c0,0,3.14,3.61,3.62,8.55c0.31,3.26-0.54,7.09-4.21,10.85 c-7.96,8.15-25.07,9.4-26.34,9.46c1.51,0.05,20.87,0.46,30.1-8.09C124.76,108.61,121.13,99.39,116.31,96.26z"
            />
          </g>
          <path
            style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-12);"
            d="M102.67,97.3c0.28-1.04,0.4-2.12,0.44-2.76c0.19-3.22-0.6-5.24-2.36-7.32 c-1.77-2.08-4.41-3.2-4.41-3.2s2.33,1.58,3.03,5.68c0.37,2.15,0.22,4.37-0.29,6.5c-0.18,0.77-0.41,1.55-0.28,2.33 s0.72,1.55,1.51,1.57C101.58,100.14,102.28,98.76,102.67,97.3z"
          />
          <g>
            <path
              style="fill: rgb(255, 132, 122); stroke: url(#gradient-15-13);"
              d="M87.39,88.07c2.2-1.48,5.4-2.56,7.37-0.04c1.04,1.34,0.24,3.97-1.75,4.66 c-3.37,1.15-3.91,2.44-4.56,3.44c-0.78,1.21-1.52,2.71-2.93,3c-1.41,0.29-2.24-0.74-2.3-2.8C83.21,95.91,82.89,91.1,87.39,88.07z "
            />
          </g>
        </g>
      </g>
      <g>
        <g bind:this={rotation} transform="rotate({(rotation * 30) % 360})">
          <path
            style="fill: rgb(244, 67, 54); stroke: url(#gradient-15-14);"
            d="M27.99,59.77c-7.12,2.67-7.92,10.68-7.92,10.68s-4.52-5.11-10.83-3.14 C1.65,69.68-2.31,77.68,3.6,86.53c6.76,10.12,29.09,13.45,29.09,13.45s12.89-16.09,11.44-29.1C42.95,60.3,33.38,57.75,27.99,59.77 z"
          />
          <g>
            <path
              style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-15);"
              d="M27.99,59.77c0,0-1.74,0.68-2.44,1.33c0,0,4.77-0.38,9.03,2.17c2.8,1.68,5.38,4.64,6.22,9.83 c1.82,11.25-7.34,25.75-8.04,26.81c0.93-1.19,12.77-16.52,11.37-29.02C42.95,60.3,33.38,57.75,27.99,59.77z"
            />
          </g>
          <path
            style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-16);"
            d="M20.73,71.36c-0.67-0.84-1.47-1.58-1.97-1.99c-2.48-2.07-4.57-2.63-7.29-2.45 c-2.73,0.18-5.19,1.65-5.19,1.65s2.66-0.94,6.37,0.93c1.95,0.98,3.65,2.42,5.06,4.09c0.51,0.6,1.01,1.25,1.71,1.61 s1.68,0.34,2.16-0.28C22.36,73.92,21.67,72.53,20.73,71.36z"
          />
          <g>
            <path
              style="fill: rgb(255, 132, 122); stroke: url(#gradient-15-17);"
              d="M4.22,78.16c0.12-2.65,1.15-5.87,4.35-5.95c1.7-0.04,3.34,2.17,2.7,4.18 c-1.07,3.4-0.36,4.59,0.06,5.71c0.51,1.35,1.28,2.83,0.68,4.14c-0.6,1.31-1.93,1.37-3.62,0.19C8.04,86.18,3.99,83.58,4.22,78.16z "
            />
          </g>
        </g>
      </g>
    </g>
    <!-- Project Logo and Name -->
    <foreignObject
      x="300"
      y="105"
      width="120"
      height="120"
      transform="translate(-50 -50)"
    >
      <img
        style=" border-radius: 50%;"
        src={timer.src}
        width="120"
        height="120"
        alt="logo"
      />
    </foreignObject>

    <!-- Project Name -->
    <g
      style="overflow:hidden; text-anchor: middle;"
    >
      <!-- Text with glow and outline -->
      <text
        x="300"
        y="210"
        fill="#FF0092"
        font-family="Sababa"
        text-anchor="middle"
        font-size="62">{timer.projectName}</text
      >
    </g>
    <!-- Hands (simplified) -->
    <g transform="translate(300,300)">
      <!-- Hour Hand -->
      <path
        id="hhand"
        d="M -9 0 L 0 -110 L 9 0 z"
        style="fill: #00ffff; stroke: purple;"
        transform="rotate({rotationh})"
      />

      <!-- Minute Hand -->
      <path
        id="mhand"
        d="M -5 0 L 0 -180 L 5 0 z"
        style="fill: lime; stroke: purple;"
        transform="rotate({rotationm})"
      />

      <!-- Second Hand -->
      <path
        id="shand"
        d="M -2 0 L 0 -250 L 2 0 z"
        style="fill: magenta; stroke: purple;"
        transform="rotate({rotation})"
      />
    </g>
    <g
      style=""
      transform="matrix(0.570447, 0, 0, 0.324065, 129.261917, 312.639984)"
    >
      <circle cx="298.282" cy="436.598" r="4" style="fill:url(#rg1);" />
    </g>
 
    <g transform="translate(300,300)"> <!-- Center point -->
        <g transform={`rotate(${orbitalRotation})`}>
          <g transform="translate(0,-220) rotate(-120)" > <!-- Adjust radius by changing -220 -->
            <g transform="matrix(0.876067, -1.904102, 2.169019, 0.860512, 0, 0)">
              <path 
                d="M 17.426 8.381 C 20.657 8.381 23.277 10.153 23.277 12.636 C 23.277 17.6 15.298 20.436 12.638 21.5 C 10.534 20.658 5.102 18.708 2.923 15.472 L 2.223 14.054 C 2.079 13.602 2 13.129 2 12.636 C 2 10.153 4.66 8.381 7.851 8.381 C 9.83 8.381 11.574 9.09 12.638 9.799 C 13.702 9.09 15.447 8.381 17.426 8.381 Z"
                style="fill: url(#gradient-15-18); stroke: url(#gradient-234-0);"
              />
            </g>
          </g>
        </g>
      </g>
    <!-- Mission Name (curved text) -->
    <path
      transform="matrix(1.4, 0, 0, 1.4 , 20, 280)"
      fill="transparent"
      stroke="transparent"
      id="curveooo8"
      d=" M 0 0 A 200 200 0 0 0 400 0"
    />
    <text x={tx} fill="#00ffff" font-weight="bold" stroke="purple">
      <textPath
        font-size="60"
        fill="#00ffff"
        font-weight="bold"
        stroke="purple"
        xlink:href="#curveooo8"
             startOffset="50%"
        text-anchor="middle"
      >
        <tspan fill="#00ffff" font-weight="bold" stroke="purple" dy="-5"
          >{timer.missionName}</tspan
        >
      </textPath>
    </text>
  
    <!-- New curved path for Total Hours Display --><!-- Adjusted Y position for top curve -->
    <!-- New curved path for Total Hours Display -->
    <path
      fill="none"
      stroke="none"
      id="curveHours"
      d="M 364.7 58.525 A 250 250 0 0 1 516.5 175"
    />
    <text fill="#FFFFFF" font-weight="900">
      <textPath
        font-size="36"
        xlink:href="#curveHours"
        startOffset="50%"
        text-anchor="middle"
      >
        <tspan fill="#FFFFFF" font-weight="900">
          {#if $lang === 'he'}
          {Math.floor(totalHoursDone)} / {hoursAssigned} שעות
          {:else}
            Hours: {hoursAssigned} / {Math.floor(totalHoursDone)}
          {/if}
        </tspan>
      </textPath>
    </text>
 

  </g></svg
>

<style>
  .edit-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.datetime-input {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  color: #fff;
  padding: 0.25rem;
  font-size: 0.9rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.save-edit-btn,
.cancel-edit-btn {
  background: transparent;
  border: none;
  color: inherit;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-edit-btn {
  color: #00ff88;
}

.cancel-edit-btn {
  color: #ff3366;
}

.save-edit-btn:hover,
.cancel-edit-btn:hover {
  background: rgba(255,255,255,0.1);
}

.timer-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  background: transparent;
  border: none;
  color: #00ffff;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(0,255,255,0.1);
  transform: scale(1.1);
}

.add-interval-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(45deg, #00ff88, #00bbff);
  border: none;
  border-radius: 6px;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 1rem;
}

.add-interval-btn:hover {
  transform: translateY(-2px);
}
   :global(.svelte-dialog-overlay) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 700;
  }

  :global([data-svelte-dialog-content].timer-dialog) {
    /* ... existing styles ... */
    position: relative;
    margin: 2rem auto;
    min-width: 320px;
    z-index: 701;
  }
  .close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.close-button svg {
  width: 20px;
  height: 20px;
}
     :global([data-svelte-dialog-content].timer-dialog) {
    background: linear-gradient(147deg, #000000 0%, #04619f 74%);
    padding: 2rem;
    border-radius: 12px;
    color: #fff;
    width: 90vw;
    max-width: 500px;
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .dialog-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00ffff;
  }

  .dialog-message {
    font-size: 1.1rem;
    line-height: 1.5;
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .save-btn,
  .clear-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .save-btn {
    background: linear-gradient(45deg, #00ff88, #00bbff);
    color: #000;
  }

  .clear-btn {
    background: linear-gradient(45deg, #ff3366, #ff0066);
    color: #fff;
  }

  .save-btn:hover,
  .clear-btn:hover {
    transform: translateY(-2px);
  }
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.heart-orbit {
  transform-origin: center;
  animation: pulse 2s infinite;
}
  .timer-container {
    position: relative; /* Important for absolute positioning of timers */
    width: 100%; /* Or set a specific width */
    height: 100vh; /* Or set a specific height */
    /* overflow: auto;  Needed if the timers overflow the container */
    display: flex;
    align-items: center;
    justify-content: center;
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

  .timer-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
  padding: 1rem;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
}

.timer-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  transition: background 0.2s;
}

.timer-entry:hover {
  background: rgba(255,255,255,0.15);
}

.timer-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.timer-time {
  font-size: 0.9rem;
  color: #00ffff;
}

.timer-duration {
  font-size: 0.8rem;
  color: #aaa;
}

.clear-single-btn {
  background: transparent;
  border: none;
  color: #ff3366;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-single-btn:hover {
  background: rgba(255,51,102,0.1);
  transform: scale(1.1);
}

.clear-all-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(45deg, #ff3366, #ff0066);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 1rem;
}

.clear-all-btn:hover {
  transform: translateY(-2px);
}

.no-timers {
  text-align: center;
  color: #aaa;
  font-style: italic;
  padding: 2rem;
}
.task-selection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-search {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.2);
  color: #fff;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  cursor: pointer;
}

.task-item:hover {
  background: rgba(255,255,255,0.15);
}

.time-summary {
  text-align: center;
  font-size: 1.2rem;
  color: #00ffff;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button > g {
  transform: scale(1);
  transition: transform 0.2s ease;
}

.control-button:hover > g {
  transform: scale(1.1);
}

.control-button:focus {
  outline: none;
}

.control-button:focus .button-bg {
  filter: brightness(1.2);
}

.button-bg {
  transition: filter 0.2s ease; /* Changed from 'all' to just 'filter' to prevent size animation */
}

.control-button:hover .button-bg {
  filter: brightness(1.2);
}
</style>
