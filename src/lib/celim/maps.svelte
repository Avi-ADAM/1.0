<script>
  import { onMount } from 'svelte';

	//import mapStyles from './map-styles'; // optional

	const key = '';
	
	/**
	 * @typedef {Object} Props
	 * @property {boolean} [globally]
	 * @property {any} map
	 * @property {(loaded: boolean) => void} [onLoad] - Callback when the map is loaded.
	 */

	/** @type {Props} */
	let { globally = false, map = $bindable(), onLoad } = $props();

	// @ts-ignore
	let container = $state();
	let zoom = 8;
	let center = { lat: 37.5742776, lng: 43.7260158 };
  let src = $state('');

	onMount(() => {
		Object.assign(window, {
			mapLoaded: () => {
				// @ts-ignore
				map = new google.maps.Map(container, {
					zoom,
					center
					// styles: mapStyles
				});

        onLoad?.(true);

        if (globally) {
					Object.assign(window, { map });
				}
        
			}
		});
    
		//Import Google Maps API.
		src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=mapLoaded`;
	});
</script>

<div class="w-full h-full" bind:this={container}></div>

<svelte:head>
	{#if src}
		<script {src}></script>
	{/if}
</svelte:head>
