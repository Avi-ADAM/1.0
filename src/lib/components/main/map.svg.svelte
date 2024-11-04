
<script>
  import { getContext, createEventDispatcher } from 'svelte';
  import { geoPath } from 'd3-geo';
  import { raise } from 'layercake';

  const { data, width, height, zGet } = getContext('LayerCake');

  

  

  

  

  

  
  /** @type {{projection: any, fixedAspectRatio?: any, fill?: any, stroke?: string, strokeWidth?: number, features?: any}} */
  let {
    projection,
    fixedAspectRatio = undefined,
    fill = undefined,
    stroke = '#333',
    strokeWidth = 0,
    features = undefined
  } = $props();

  /* --------------------------------------------
   * Here's how you would do cross-component hovers
   */
  const dispatch = createEventDispatcher();

  let fitSizeRange = $derived(fixedAspectRatio ? [100, 100 / fixedAspectRatio] : [$width, $height]);

  let projectionFn = $derived(projection()
    .fitSize(fitSizeRange, $data));

  let geoPathFn = $derived(geoPath(projectionFn));

  function handleMousemove(feature) {
    return function handleMousemoveFn(e) {
      raise(this);
      // When the element gets raised, it flashes 0,0 for a second so skip that
      if (e.layerX !== 0 && e.layerY !== 0) {
        dispatch('mousemove', { e, props: feature.properties });
      }
    }
  }
</script>

<g
  class="map-group"
  onmouseout={(e) => dispatch('mouseout')}
  onblur={(e) => dispatch('mouseout')}
>
  {#each (features || $data.features) as feature}
    <path
      class="feature-path"
      fill="{fill || $zGet(feature.properties)}"
      stroke={stroke}
      stroke-width={strokeWidth}
      d="{geoPathFn(feature)}"
      onmouseover={(e) => dispatch('mousemove', { e, props: feature.properties })}
      onfocus={(e) => dispatch('mousemove', { e, props: feature.properties })}
      onmousemove={handleMousemove(feature)}
    ></path>
  {/each}
</g>

<style>
  /* .feature-path {
    stroke: #333;
    stroke-width: 0.5px;
  } */
  .feature-path:hover {
    stroke: rgb(43, 158, 110);
    stroke-width: 0.5px;
  }
  /**
   * Disable the outline on feature click.
   * Depending on map funtionality and accessiblity issues,
   * you may not want this rule. Read more:
   * https://developer.mozilla.org/en-US/docs/Web/CSS/:focus
   * https://github.com/mhkeller/layercake/issues/63
   */
  .feature-path:focus {
    outline: none;
  }
</style>