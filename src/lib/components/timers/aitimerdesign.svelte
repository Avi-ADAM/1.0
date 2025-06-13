
<svg
  class="timer"
  style="width:{orders?.big ? bigsize : size}px;
       left:{orders?.x}px;
       top:{orders?.y}px;
       transform:  translate(-50%, -50%);"
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

    <!-- Hour markers -->
    {#each Array(12) as _, i}
      <line
        x1="300"
        y1="70"
        x2="300"
        y2="90"
        stroke="#666"
        stroke-width="2"
        transform="rotate({i * 30} 300 300)"
      />
    {/each}

    <!-- Minute markers -->
    {#each Array(60) as _, i}
      {#if i % 5 !== 0}
        <line
          x1="300"
          y1="75"
          x2="300"
          y2="85"
          stroke="#444"
          stroke-width="1"
          transform="rotate({i * 6} 300 300)"
        />
      {/if}
    {/each}

    <!-- Timer hands -->
    <g transform="translate(300, 300)">
      <!-- Hour hand -->
      <line
        y2="-100"
        stroke="#ff3366"
        stroke-width="4"
        transform="rotate({rotationh})"
      />

      <!-- Minute hand -->
      <line
        y2="-140"
        stroke="#00ff88"
        stroke-width="3"
        transform="rotate({rotationm})"
      />

      <!-- Second hand -->
      <line
        y2="-160"
        stroke="#00ffff"
        stroke-width="2"
        transform="rotate({rotation})"
      />

      <!-- Center dot -->
      <circle r="8" fill="#333" />
    </g>

    <!-- Orbital element -->
    <g transform="translate(300, 300)">
      <g transform="rotate({orbitalRotation})">
        <circle
          cx="0"
          cy="-200"
          r="15"
          class="orbital-element"
          fill="#ff3366"
        >
          <animate
            attributeName="r"
            values="15;18;15"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </g>

    <!-- Control buttons -->
    <g transform="translate(300,280)"> <!-- Changed Y from 300 to 280 to move up -->
      <!-- Left Button - Play/Stop -->
      <g 
        transform="translate(-80,0)" 
        class="control-button"
        on:click={handleToggleTimer}
        on:keypress={handleToggleTimer}
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
        on:click={() => showSaveDialog = true}
        on:keypress={() => showSaveDialog = true}
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
  </svg>



<style>
  .timer-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    transition: transform 0.3s ease;
  }

  .timer {
    width: 100%;
    height: auto;
  }

  .timer-bg {
    fill: rgba(255, 255, 255, 0.05);
  }

  .control-button circle {
    transition: stroke 0.3s ease;
  }

  .control-button:hover circle {
    stroke-width: 4;
  }

  .button-bg {
    transition: fill 0.3s ease;
  }

  .control-button:hover .button-bg {
    fill: rgba(255, 255, 255, 0.1);
  }

  .orbital-element {
    filter: drop-shadow(0 0 10px rgba(255, 51, 102, 0.5));
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
</style>
