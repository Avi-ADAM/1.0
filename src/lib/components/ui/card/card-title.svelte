<script>
	import { cn } from "$lib/utils";
	let { class: className = '', children, ...others } = $props();
</script>

<h3
	class={cn("text-lg text-gold font-semibold leading-none tracking-tight", className)}
	{...others}
>
	 {#if children}
     {@render children()}
   {/if}
</h3>
