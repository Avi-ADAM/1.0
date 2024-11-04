<!--
  @component
  Generates an SVG bar chart.
 -->
<script>
  import { getContext } from 'svelte';

  const { data, xGet, yGet, xScale, yScale } = getContext('LayerCake');

  
  /** @type {{fill?: String}} */
  let { fill = 'var(--barbi-pink)' } = $props();
</script>

<g class="bar-group">
  {#each $data as d, i}
    <rect
      class='group-rect'
      data-id="{i}"
      x="{$xScale.range()[0]}"
      y="{$yGet(d)}"
      height={$yScale.bandwidth()}
      width="{$xGet(d)}"
      {fill}
    ></rect>
  {/each}
</g>