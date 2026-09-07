<script>
	/**
	 * @typedef {Object} Props
	 * @property {number} [progress]
	 */

	/** @type {Props} */
	let { progress = 0 } = $props();
	let angle = $derived(360 * progress)
	
	// Adapt the logic according to the approach
	let background = $derived(`radial-gradient(white 50%, transparent 51%),
    conic-gradient(transparent 0deg ${angle}deg, gainsboro ${angle}deg 360deg),
    conic-gradient(orange 0deg, yellow 90deg, lightgreen 180deg, green);`);
	
	let cssVarStyles = $derived(`--background:${background}`)
</script>

<style>
#progress-circle {
  background: var(--background);
  border-radius: 50%;
  width: 120px;
  height: 120px;
	transition: all 500ms ease-in;
	will-change: transform;
	display: flex;
	justify-items:middle;
	align-items:center;
	text-align:center;
}
	.center{
		margin:0 auto;
		/* The disc under this number is `radial-gradient(white 50% ...)` - always
		   white, in every theme and both modes - so the ink has to be fixed dark.
		   With no colour of its own it inherited the page's, which in the two
		   dark fills is a near-white on white: the number read as an empty ring. */
		color:#1e293b;
	}
</style>

<div id="progress-circle" style="{cssVarStyles}">
<h3 class="center">{(progress*100).toLocaleString('en-US', {maximumFractionDigits:3})}</h3>
</div>
