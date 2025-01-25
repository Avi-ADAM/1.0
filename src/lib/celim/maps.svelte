<script>
	const dispatch = createEventDispatcher();

  import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	//import mapStyles from './map-styles'; // optional

	const key = '';
	
	export let globally = false;
	export let map;

	// @ts-ignore
	let container;
	let zoom = 8;
	let center = { lat: 37.5742776, lng: 43.7260158 };
  let src = '';

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

<div class="w-full h-full" bind:this={container} />

<svelte:head>
	{#if src}
		<script {src}></script>
	{/if}
</svelte:head>