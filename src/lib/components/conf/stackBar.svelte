<script>
	// 	Note: Due to REPL limitations, full responsiveness may not work here. Download the example from here or from the website (https://layercake.graphics/example/BarStacked) and run locally to get all features.
	
	import { LayerCake, Svg, flatten, stack } from 'layercake';
	import { scaleBand, scaleOrdinal } from 'd3-scale';
	import { format, precisionFixed } from 'd3-format';

	import BarStacked from './BarStacked.svelte';
	import AxisX from './AxisX.svelte';
	import AxisY from './AxisY.svelte';

  export let datai 

	const xKey = [0, 1];
  const yKey = 'leb';
  const zKey = 'key';

  const seriesNames = Object.keys(datai[0]).filter(d => d !== yKey);
  const seriesColors = ['#FF0092', '#EEE8AA', '#c4e2ed', '#f7f6e3'];

  /* --------------------------------------------
   * Cast data
   */
  datai.forEach(d => {
    seriesNames.forEach(name => {
      d[name] = +d[name];
    });
  });

  const formatTickX = d => format(`.${precisionFixed(d)}s`)(d);

  const stackedData = stack(datai, seriesNames);
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
		padding={{ top: 0, bottom: 20, left: 30 }}
		x={xKey}
		y={d => d.data[yKey]}
		z={zKey}
		yScale={scaleBand().paddingInner([0.05])}
		zScale={scaleOrdinal()}

		zDomain={seriesNames}
		zRange={seriesColors}
		flatData={flatten(stackedData)}
		data={stackedData}
	>
		<Svg>
			<AxisX
				baseline={true}
				snapTicks={true}
				formatTick={formatTickX}
			/>
			<AxisY
				gridlines={false}
			/>
			<BarStacked/>
		</Svg>
	</LayerCake>
</div>
