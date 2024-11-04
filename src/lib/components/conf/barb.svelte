<script>
  import { LayerCake, Svg , Html} from 'layercake';
  import { scaleBand } from 'd3-scale';

  import Bar from './Bar.svelte';
  import AxisX from './AxisX.svelte';
  import AxisY from './AxisY.svelte';
  import Tooltip from './Tooltip.html.svelte';
  /** @type {{datai: any}} */
  let { datai } = $props();
  const xKey = 'value';
  const yKey = 'leb';

  datai.forEach(d => {
    d[xKey] = +d[xKey];
  });
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
    height: 150px;
  }
</style>

<div class="chart-container">
  <LayerCake
    padding={{ top: 0, bottom: 20, left: 35 }}
    x={xKey}
    y={yKey}
    yScale={scaleBand().paddingInner(0.05)}
    xDomain={[0, null]}
    data={datai}
  >
    <Svg>
      <AxisX
        gridlines={true}
        baseline={true}
        snapTicks={true}
      />
      <AxisY
        gridlines={false}
      />
      <Bar/>
    </Svg>
     <Html>
      <Tooltip
        dataset={datai}
      />
    </Html>
  </LayerCake>
</div>