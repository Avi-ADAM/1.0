<script>
  /**
   * @typedef {Object} Props
   * @property {string} [hosafap]
   * @property {() => void} [onProgres]
   * @property {() => void} [onClick]
   */

  /** @type {Props} */
  let { hosafap = '', onProgres, onClick } = $props();
</script>

<svg
  dir="ltr"
  style="max-width:45vw; max-height:45vw;"
  width="240"
  height="240"
  viewBox="304.017 285.449 844.373 823.956"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  <defs>
    <linearGradient id="pp-a">
      <stop style="stop-color:#d400aa;stop-opacity:1;" offset="0"/>
      <stop style="stop-color:#d400aa;stop-opacity:0;" offset="1"/>
    </linearGradient>
    <linearGradient id="pp-b">
      <stop style="stop-color:#8800aa;stop-opacity:1;" offset="0"/>
      <stop style="stop-color:#8800aa;stop-opacity:0;" offset="1"/>
    </linearGradient>
    <linearGradient id="pp-c" x1="402.857" y1="443.791" x2="371.429" y2="513.791"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(1,0,0,1,-6.658,11.985)"
      xlink:href="#pp-b"/>
    <linearGradient id="pp-d" x1="342.362" y1="547.143" x2="496.648" y2="487.143"
      gradientUnits="userSpaceOnUse" xlink:href="#pp-a"/>
    <linearGradient id="pp-ring" x1="420" y1="135.219" x2="311.429" y2="820.934"
      gradientUnits="userSpaceOnUse" xlink:href="#pp-b"/>
    <linearGradient id="pp-pink" x1="177.143" y1="866.648" x2="351.429" y2="569.505"
      gradientUnits="userSpaceOnUse" xlink:href="#pp-a"/>
    <linearGradient id="pp-gold" x1="0" y1="-140" x2="0" y2="140" gradientUnits="userSpaceOnUse" gradientTransform="translate(372,529.652)">
      <stop offset="0" style="stop-color:#fbbf24;"/>
      <stop offset="0.5" style="stop-color:#f59e0b;"/>
      <stop offset="1" style="stop-color:#b45309;"/>
    </linearGradient>
    <linearGradient id="pp-gold2" x1="0" y1="-140" x2="0" y2="140" gradientUnits="userSpaceOnUse" gradientTransform="translate(372,529.652)">
      <stop offset="0" style="stop-color:#bada55;"/>
      <stop offset="1" style="stop-color:#758d29;"/>
    </linearGradient>
    <linearGradient id="pp-ring2" x1="367.762" y1="740.467" x2="367.762" y2="600.467"
      gradientUnits="userSpaceOnUse" xlink:href="#pp-b"/>
  </defs>

  <g transform="matrix(1.001968,0,0,1,345.337128,171.469803)">

    <!-- רקע עיגולים — זהה ל-hand.svelte -->
    <circle r="394.286" cy="526.181" cx="372.047"
      style="fill:rgb(102,0,255);fill-opacity:1;stroke:none;"/>
    <circle r="394.286" cy="526.181" cx="372.047"
      style="fill:url(#pp-pink);fill-opacity:1;stroke:none;"/>
    <circle r="394.286" cy="526.181" cx="372.047"
      style="fill:url(#pp-ring);fill-opacity:1;stroke:none;"/>
    <circle r="305.714" cy="529.652" cx="372.047"
      style="fill:rgb(31,28,36);fill-opacity:1;stroke:none;"/>

    <!-- אייקון שרשרת תהליך — מרוכז בדיוק על מרכז העיגול הפנימי (372, 529.652) -->
    <g transform="translate(372, 529.652)"
       onmouseenter={() => onProgres?.()} onclick={() => onClick?.()}
       style="cursor:pointer">
      <title>{hosafap}</title>

      <!-- כרטיס 1 — top: y=-140 עד y=-70 -->
      <rect x="-130" y="-140" width="260" height="70" rx="15" ry="15"
        fill="url(#pp-gold)" stroke="url(#pp-gold2)" stroke-width="5" opacity="0.95"/>
      <circle cx="-65" cy="-105" r="12" fill="rgb(31,28,36)" opacity="0.45"/>
      <circle cx="0"   cy="-105" r="12" fill="rgb(31,28,36)" opacity="0.45"/>
      <circle cx="65"  cy="-105" r="12" fill="rgb(31,28,36)" opacity="0.45"/>

      <!-- חץ 1 -->
      <line class="pp-line" x1="0" y1="-70" x2="0" y2="-42" stroke="#f59e0b" stroke-width="9" stroke-linecap="round"/>
      <polygon class="pp-head-1" points="-20,-48 20,-48 0,-22" fill="#f59e0b"/>

      <!-- כרטיס 2 — center: y=-35 עד y=35 -->
      <rect x="-130" y="-35" width="260" height="70" rx="15" ry="15"
        fill="url(#pp-gold)" stroke="url(#pp-gold2)" stroke-width="5" opacity="0.78"/>
      <circle cx="-65" cy="0" r="12" fill="rgb(31,28,36)" opacity="0.45"/>
      <circle cx="0"   cy="0" r="12" fill="rgb(31,28,36)" opacity="0.45"/>
      <circle cx="65"  cy="0" r="12" fill="rgb(31,28,36)" opacity="0.45"/>

      <!-- חץ 2 -->
      <line class="pp-line" x1="0" y1="35" x2="0" y2="63" stroke="#f59e0b" stroke-width="9" stroke-linecap="round"/>
      <polygon class="pp-head-2" points="-20,57 20,57 0,83" fill="#f59e0b"/>

      <!-- כרטיס 3 — bottom: y=70 עד y=140 -->
      <rect x="-130" y="70" width="260" height="70" rx="15" ry="15"
        fill="url(#pp-gold)" stroke="url(#pp-gold2)" stroke-width="5" opacity="0.62"/>
      <circle cx="-65" cy="105" r="12" fill="rgb(31,28,36)" opacity="0.45"/>
      <circle cx="0"   cy="105" r="12" fill="rgb(31,28,36)" opacity="0.45"/>
      <circle cx="65"  cy="105" r="12" fill="rgb(31,28,36)" opacity="0.45"/>

      <!-- אזור לחיצה שקוף -->
      <circle r="290" cy="0" cx="0" fill="transparent"/>
    </g>

    <!-- טבעת גבול — זהה ל-hand.svelte -->
    <path
      d="M 372.047 192.183 C 187.585 192.183 38.049 341.719 38.049 526.181 C 38.049 710.643 187.585 860.179 372.047 860.179 C 556.509 860.179 706.045 710.643 706.045 526.181 C 706.045 341.719 556.509 192.183 372.047 192.183 Z M 372.047 212.007 C 545.56 212.007 686.221 352.667 686.221 526.181 C 686.221 699.694 545.56 840.355 372.047 840.355 C 198.534 840.355 57.873 699.694 57.873 526.181 C 57.873 352.667 198.534 212.007 372.047 212.007 Z"
      style="opacity:0.7;fill:rgb(31,28,36);fill-opacity:1;stroke:none;"/>

  </g>
</svg>

<style>
  /* קו מקווקו זורם כלפי מטה */
  .pp-line {
    stroke-dasharray: 14 6;
    stroke-dashoffset: 0;
  }
  svg:hover .pp-line {
    animation: ppFlow 0.35s linear infinite;
  }
  @keyframes ppFlow {
    to { stroke-dashoffset: -20; }
  }

  /* ראש החץ קופץ לכיוון הכרטיס הבא */
  .pp-head-1,
  .pp-head-2 {
    transform-box: fill-box;
    transform-origin: 50% 0%;
  }
  svg:hover .pp-head-1 {
    animation: ppBounce 0.55s ease-in-out infinite;
  }
  svg:hover .pp-head-2 {
    animation: ppBounce 0.55s ease-in-out 0.275s infinite;
  }
  @keyframes ppBounce {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(12px); }
  }
</style>
