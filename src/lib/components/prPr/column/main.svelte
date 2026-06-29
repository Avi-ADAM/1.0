<script>
  import { LayerCake, Svg, flatten, uniques } from 'layercake';
  import { stack } from 'd3-shape';
  import { scaleBand, scaleOrdinal } from 'd3-scale';
  import { format, precisionFixed } from 'd3-format';

  import ColumnStacked from './_components/ColumnStacked.svelte';
  import AxisX from './_components/AxisX.svelte';
  import AxisY from './_components/AxisY.svelte';

  
  /**
   * @typedef {Object} Props
   * @property {any} data - This example loads csv data as json using @rollup/plugin-dsv
   */

  /** @type {Props} */
  let { data } = $props();

  const xKey = 'date';
  const yKey = [0, 1];
  const zKey = 'key';

  const seriesNames = $derived(
    data.length > 0 ? Object.keys(data[0]).filter((d) => d !== xKey) : []
  );
  const seriesColors = ["rgb(244, 114, 182)","rgb(34, 211, 238)","rgb(251, 207, 232)","rgb(103, 232, 249)", '#00e047', '#7ceb68', '#b7f486', '#ecfda5'];

  const normalizedData = $derived(
    data.map((d) => {
      const row = { ...d };
      seriesNames.forEach((name) => {
        row[name] = +row[name];
      });
      return row;
    })
  );

  const series = $derived(
    data.length > 0
      ? stack().keys(seriesNames)(normalizedData)
      : []
  );

  const formatTickY = d => {
    if (d === 0 || !isFinite(d) || isNaN(d)) return '0';
    return format(`.${precisionFixed(d)}s`)(d);
  };
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
</style>

<div class="chart-container">
  {#if data.length > 0}
  <LayerCake
       padding={{ top: 0, right: 20, bottom: 28, left: 20 }}
       x={d => d.data[xKey]}
       y={yKey}
       z={zKey}
       xScale={scaleBand().paddingInner([0.05]).paddingOuter([0.1]).round(false)}
       xDomain={uniques(normalizedData, xKey)}
      zScale={scaleOrdinal()}
      zDomain={seriesNames}
      zRange={seriesColors}
       flatData={flatten(series)}
       data={series}
  >
    <Svg>
      <AxisX
        gridlines={false}
      />
      <AxisY
        ticks={6}
        gridlines={false}
        formatTick={formatTickY}
      />
      <ColumnStacked/>
    </Svg>
  </LayerCake>
  {/if}
</div>