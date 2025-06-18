 
<script>
  import { run } from 'svelte/legacy';

  import { RingLoader
} from 'svelte-loading-spinners';
  
    import {lang} from '$lib/stores/lang.js'
   //  import datai from '$lib/components/main/data.json';


  import { LayerCake, Svg, Html } from 'layercake';
  import { feature } from 'topojson-client';
  import { geoMercator } from 'd3-geo';
  import { scaleLinear } from 'd3-scale';
  import { format } from 'd3-format';
    
  import MapSvg from '../../lib/components/main/map.svg.svelte';
  import Tooltip from '../../lib/components/main/tooltip.html.svelte';
 
  // This example loads json data as json using @rollup/plugin-json
  import world from '../../lib/components/main/countries110m.json';
  import { onMount } from 'svelte';
  /**
   * @typedef {Object} Props
   * @property {any} [data]
   */

  /** @type {Props} */
  let { data = null } = $props();

  const colorKey = 'agrees';
  const colorKeyy = 'value';

  /* --------------------------------------------
   * Create lookups to more easily join our data
   * `dataJoinKey` is the name of the field in the data
   * `mapJoinKey` is the name of the field in the map file
   */
  const dataJoinKey = 'name';
  const mapJoinKey = 'name';
  const dataLookup = new Map();
  let noof = $state(0);
  
    run(() => {
    data.streamed.data.then(function(data) {
        noof = data.total
        data.forEach(d => {
      dataLookup.set(d[dataJoinKey], d);
          }
          )
        })
  });

   
  const geojson = feature(world, world.objects.units);
  const projection = geoMercator;

  
  let evt = $state();
  let hideTooltip = $state(true);
      const onm = {"he":"רק רגע בבקשה","en":"one moment please","ar":"دقيقة واحدة فقط من فضلك"}
  // Create a flat array of objects that LayerCake can use to measure
  // extents for the color scale
  const flatData = geojson.features.map(d => d.properties);
  const colors = [ "#FF0092",
  'rgb(244, 114, 182)',
  'rgb(209, 146, 255)',
					"#EEE8AA"];
     run(() => {
    console.log(data.streamed.data)
  });
  const addCommas = format(',');
  const title = {"he":" סך הכל הסכימו","en":"Total agreements","ar":" مجموع الموافقات المستلمة"}
</script>

<style>
  /*
    The wrapper div needs to have an explicit width and height in CSS.
    It can also be a flexbox child or CSS grid element.
    The point being it needs dimensions since the <LayerCake> element will
    expand to fill it.
  */
  .chart-container {
    width: 100%;
    height: 100%;
  }
  .ww{
      width: 100vw;
      height: 100vh;
      background-color: rgb(103, 232, 249);
  }
  .wwa{
      margin: auto auto;
      max-width: 100vw;
      max-height: calc(100vh - 30px);
      aspect-ratio: 1/1;
      background-color: rgb(103, 232, 249);
  }
</style>
{#await data.streamed.data}
<div class="flex flex-col text-center items-center justify-center trr">
            <h3 class="text-barbi">{onm[$lang]}</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> 
{:then}
<div class="ww">
    <h1 style="font-size:20px;" class="text-barbi text-center">{title[$lang]} - {noof}
    </h1>
    <div class="wwa">
<div class="chart-container">
  <LayerCake
    data={geojson}
    z={d => dataLookup.get(d[mapJoinKey])[colorKey]}
    zScale={scaleLinear()}
    zRange={colors}
    zDomain={[0,1,2,64]}
    {flatData}
  >
    <Svg>
      <MapSvg
        {projection}
        on:mousemove={event => evt = hideTooltip = event}
        on:mouseout={() => hideTooltip = true}
      />
    </Svg>

    <Html
      pointerEvents={false}
    >
      {#if hideTooltip !== true}
        <Tooltip
          {evt}
          
        >
          {#snippet children({ detail })}
                                {@const tooltipData = { ...detail.props, ...dataLookup.get(detail.props[mapJoinKey]) }}
            {#each Object.entries(tooltipData) as [key, value]}
              {@const keyCapitalized = key.replace(/^\w/, d => d.toUpperCase())}
              <div class="row"><span>{keyCapitalized}:</span> {typeof value === 'number' ? addCommas(value) : value}</div>
            {/each}
                                        {/snippet}
                            </Tooltip>
      {/if}
    </Html>
  </LayerCake>
</div></div></div>
{/await}
