<script >
	import { cn } from "$lib/utils";
	let { class: className = '', children, ...others } = $props();
</script>

<div class={cn("flex flex-col space-y-1.5 p-6", className)} {...others}>
	{#if children}
     {@render children()}
   {/if}
</div>
