<script>
    import { quintOut } from 'svelte/easing';
      import {draw} from 'svelte/transition'
  /**
   * @typedef {Object} Props
   * @property {number} [size]
   */

  /** @type {Props} */
  let { size = 24 } = $props();
  </script>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="{size}" height="{size}" viewBox="0 0 256 256" xml:space="preserve">

    <defs>
    </defs>
    <g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)" >
        <path  transition:draw="{{duration: 1500, easing: quintOut}}" d="M 45 87.152 h 39.944 c 3.045 0 5 -3.233 3.587 -5.93 L 48.587 5.018 c -1.516 -2.893 -5.658 -2.893 -7.174 0 L 1.469 81.222 c -1.413 2.697 0.542 5.93 3.587 5.93 H 45 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(255,157,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
        <path  transition:draw="{{duration: 1500, easing: quintOut}}" d="M 45 63.666 L 45 63.666 c -1.519 0 -2.769 -1.196 -2.836 -2.714 l -2.617 -25.256 c -0.238 -3.172 2.272 -5.878 5.453 -5.878 h 0 c 3.181 0 5.691 2.705 5.453 5.878 l -2.617 25.256 C 47.769 62.47 46.519 63.666 45 63.666 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
        <circle cx="45.003" cy="73.383" r="4.523" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
        <path  transition:draw="{{duration: 1500, easing: quintOut}}" d="M 45 64.666 c -2.06 0 -3.744 -1.612 -3.835 -3.67 l -2.613 -25.197 c -0.137 -1.817 0.486 -3.597 1.706 -4.912 c 1.22 -1.315 2.948 -2.069 4.742 -2.069 c 1.794 0 3.522 0.754 4.742 2.069 s 1.843 3.095 1.708 4.883 l -2.619 25.285 C 48.745 63.054 47.061 64.666 45 64.666 z M 45 30.818 c -1.257 0 -2.421 0.508 -3.276 1.429 c -0.855 0.922 -1.274 2.12 -1.18 3.374 l 2.615 25.227 c 0.048 1.045 0.854 1.817 1.841 1.817 c 0.987 0 1.794 -0.772 1.837 -1.758 l 2.621 -25.315 c 0.092 -1.226 -0.327 -2.424 -1.182 -3.346 C 47.421 31.326 46.258 30.818 45 30.818 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
        <path  transition:draw="{{duration: 1500, easing: quintOut}}" d="M 45 78.907 c -3.045 0 -5.523 -2.478 -5.523 -5.522 c 0 -3.046 2.478 -5.523 5.523 -5.523 c 3.046 0 5.523 2.478 5.523 5.523 C 50.523 76.429 48.046 78.907 45 78.907 z M 45 69.861 c -1.942 0 -3.523 1.581 -3.523 3.523 c 0 1.942 1.581 3.522 3.523 3.522 c 1.942 0 3.523 -1.58 3.523 -3.522 C 48.523 71.442 46.942 69.861 45 69.861 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
        <path  transition:draw="{{duration: 1500, easing: quintOut}}" d="M 84.944 88.152 H 5.055 c -1.783 0 -3.398 -0.911 -4.321 -2.437 c -0.923 -1.525 -0.979 -3.379 -0.152 -4.957 L 40.527 4.553 C 41.402 2.885 43.116 1.848 45 1.848 c 1.884 0 3.598 1.037 4.473 2.705 l 39.944 76.206 c 0.828 1.578 0.771 3.432 -0.151 4.957 S 86.727 88.152 84.944 88.152 z M 45 3.848 c -1.155 0 -2.165 0.611 -2.701 1.634 L 2.354 81.686 c -0.5 0.954 -0.466 2.073 0.091 2.994 c 0.558 0.922 1.533 1.472 2.61 1.472 h 79.889 c 1.077 0 2.053 -0.55 2.61 -1.472 c 0.557 -0.921 0.591 -2.04 0.091 -2.993 L 47.701 5.482 C 47.165 4.459 46.155 3.848 45 3.848 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    </g>
    </svg>