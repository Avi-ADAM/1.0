<script>
	export let title = '';
	let isHovered = false;
	let x;
	let y;
	export let z = 0;
	function mouseOver(event) {
		isHovered = true;
		x = event.pageX + 5;
		y = event.pageY + 5;
	}
	function mouseMove(event) {
		x = event.pageX + 5;
		y = event.pageY + 5;
	}
	function mouseLeave() {
		isHovered = false;
	}
 
</script>

<span
	on:mouseenter={mouseOver}
  on:mouseleave={mouseLeave}
	on:mousemove={mouseMove}
   >
	<slot />
</span>

{#if isHovered}
	<div dir="rtl" style="top: { y + z}px; left: {x}px;" class="tooltip">{title}</div>
{/if}

<style>
	.tooltip {
        z-index: 999;
		border: 1px solid rgb(239, 45, 178);
		box-shadow: 1px 1px 1px rgb(224, 165, 211);
		background: linear-gradient(to bottom right, #BF953F, #FCF6BA, #FBF5B7, #AA771C);;
        color: rgb(239, 23, 88);
		border-radius: 4px;
		padding: 4px;
		position: absolute;
		text-align: center;
	}
    
</style>