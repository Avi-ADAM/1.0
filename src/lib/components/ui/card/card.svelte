<script>
	import { cn } from "$lib/utils";
	let { class: className = '', children, ...others } = $props();
</script>

<div
	class={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
	{...others}
>
	{#if children}
     {@render children()}
   {/if}
</div>
