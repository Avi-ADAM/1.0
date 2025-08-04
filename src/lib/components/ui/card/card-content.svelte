<script>
	import { cn } from "$lib/utils";
	let { class: className = '', children, ...others } = $props();
</script>

<div class={cn("p-6 pt-0", className)} {...others}>
	 {#if children}
     {@render children()}
   {/if}
</div>
