<script>
    import { onMount } from 'svelte';

    let country = [];
    let error = null
    
    onMount(async () => {
        const parseJSON = (resp) => (resp.json ? resp.json() : resp);
        const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      const headers = {
        'Content-Type': 'application/json',
      };
    
        try {
            const res = await fetch("https://oneloveone.onrender.com/cuntries?_limit=-1", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
            country = res
            for (let j = 0; j< country.length; j++){
      for (let i = 0; i< data.length; i++){
        if(data[i].name === country[j].name){
          data[i].agrees = country[j].free_people.length 
        }else if (data[i].name === "Palestine" && country[j].id === 167 || data[i].name === "Palestine" && country[j].id ===  246){
             data[i].agrees += country[j].free_people.length
        } else if (data[i].name === "Russia"  && country[j].name ==="Russian Federation"){
             data[i].agrees = country[j].free_people.length
        }else if (data[i].name === "United States of America"  && country[j].name ==="United States"){
             data[i].agrees = country[j].free_people.length
        }
            }
        }

        } catch (e) {
            error = e
        }
    });


  import { LayerCake, Svg, Html } from 'layercake';
  import { feature } from 'topojson-client';
  import { geoMercator } from 'd3-geo';
  import { scaleLinear } from 'd3-scale';
  import { format } from 'd3-format';
    
  import MapSvg from './../lib/components/main/map.svg.svelte';
  import Tooltip from './../lib/components/main/tooltip.html.svelte';

  // This example loads json data as json using @rollup/plugin-json
  import world from './../lib/components/main/countries110m.json';
  import data from './../lib/components/main/data.json';

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

  const geojson = feature(world, world.objects.units);
  const projection = geoMercator;

  data.forEach(d => {
    dataLookup.set(d[dataJoinKey], d);
  });
  let evt;
  let hideTooltip = true;

  // Create a flat array of objects that LayerCake can use to measure
  // extents for the color scale
  const flatData = geojson.features.map(d => d.properties);
  const colors = [ "#FF0092",
  'rgb(244, 114, 182)',
  'rgb(190, 114, 244)',
					"#EEE8AA",
                 ];

  const addCommas = format(',');
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
</style>
<div class="ww">
<div class="chart-container">
  <LayerCake
    data={geojson}
    z={d => dataLookup.get(d[mapJoinKey])[colorKey]}
    zScale={scaleLinear()}
    zRange={colors}
    zDomain={[0,1,2,65]}
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
          let:detail
        >
          {@const tooltipData = { ...detail.props, ...dataLookup.get(detail.props[mapJoinKey]) }}
          {#each Object.entries(tooltipData) as [key, value]}
            {@const keyCapitalized = key.replace(/^\w/, d => d.toUpperCase())}
            <div class="row"><span>{keyCapitalized}:</span> {typeof value === 'number' ? addCommas(value) : value}</div>
          {/each}
        </Tooltip>
      {/if}
    </Html>
  </LayerCake>
</div></div>