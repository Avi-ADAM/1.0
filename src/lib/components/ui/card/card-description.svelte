<script>
	import { cn } from "$lib/utils";
	let { class: className = '', children, ...others } = $props();
</script>

<p class={cn("text-sm text-muted-foreground", className)} {...others}>
	 {#if children}
     {@render children()}
   {/if}
</p>
