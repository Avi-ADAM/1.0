<script>
	const dispatch = createEventDispatcher();

  import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	//import mapStyles from './map-styles'; // optional

	const key = '';
	
	/** @type {{globally?: boolean, map: any}} */
	let { globally = false, map = $bindable() } = $props();

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

        dispatch('load', true);

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