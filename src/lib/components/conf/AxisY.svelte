<!--
  @component
  Generates an SVG y-axis. This component is also configured to detect if your y-scale is an ordinal scale. If so, it will place the markers in the middle of the bandwidth.
 -->
<script>
  import {lang} from '$lib/stores/lang'
  import { getContext } from 'svelte';

  const { padding, xRange, yScale } = getContext('LayerCake');

  

  

  

  

  

  

  

  

  
  /**
   * @typedef {Object} Props
   * @property {Boolean} [gridlines]
   * @property {Boolean} [tickMarks]
   * @property {Function} [formatTick]
   * @property {Number|Array|Function} [ticks]
   * @property {Number} [xTick]
   * @property {Number} [yTick]
   * @property {Number} [dxTick]
   * @property {Number} [dyTick]
   * @property {String} [textAnchor]
   */

  /** @type {Props} */
  let {
    gridlines = true,
    tickMarks = false,
    formatTick = d => d,
    ticks = 4,
    xTick = 0,
    yTick = 0,
    dxTick = 0,
    dyTick = -4,
    textAnchor = 'start'
  } = $props();

  let isBandwidth = $derived(typeof $yScale.bandwidth === 'function');

  let tickVals = $derived(Array.isArray(ticks) ? ticks :
    isBandwidth ?
      $yScale.domain() :
      typeof ticks === 'function' ?
        ticks($yScale.ticks()) :
          $yScale.ticks(ticks));
</script>

<g class='axis y-axis' transform='translate({-$padding.left}, 0)'>
  {#each tickVals as tick (tick)}
    <g class='tick tick-{tick}' transform='translate({$xRange[0] + (isBandwidth ? $padding.left : 0)}, {$yScale(tick)})'>
      {#if gridlines !== false}
        <line
          class="gridline"
          x2='100%'
          y1={(isBandwidth ? ($yScale.bandwidth() / 2) : 0)}
          y2={(isBandwidth ? ($yScale.bandwidth() / 2) : 0)}
        ></line>
      {/if}
      {#if tickMarks === true}
        <line
          class='tick-mark'
          x1='0'
          x2='{isBandwidth ? -6 : 6}'
          y1={(isBandwidth ? ($yScale.bandwidth() / 2) : 0)}
          y2={(isBandwidth ? ($yScale.bandwidth() / 2) : 0)}
        ></line>
      {/if}
      <text
        x='{xTick}'
        y='{(isBandwidth ? ($yScale.bandwidth() / 2) + yTick : yTick)}'
        dx='{isBandwidth ? -9 : dxTick}'
        dy='{isBandwidth ? 4 : dyTick}'
        style="text-anchor:{isBandwidth ? $lang ==  "he" ? 'start' : 'end' : textAnchor};"
      >{formatTick(tick)}</text>
    </g>
  {/each}
</g>

<style>
  .tick {
    font-size: .725em;
    font-weight: 200;
  }

  .tick line {
    stroke: #aaa;
  }
  .tick .gridline {
    stroke-dasharray: 2;
  }

  .tick text {
    fill: var(--gold);
  }

  .tick.tick-0 line {
    stroke-dasharray: 0;
  }
</style>