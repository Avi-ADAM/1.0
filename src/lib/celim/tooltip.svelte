<script>
	let isHovered = $state(false);
	let x = $state(), ix;
	let y = $state(), iy;
	/**
	 * @typedef {Object} Props
	 * @property {string} [title]
	 * @property {number} [z]
	 * @property {boolean} [ispic]
	 * @property {boolean} [islink]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let {
		title = '',
		z = 15,
		ispic = $bindable(false),
		islink = false,
		children
	} = $props();

	/* `clientX/clientY`, not `pageX/pageY`. The bubble is `position: fixed`, so
	   its coordinates are viewport ones; the page pair adds the document scroll
	   and pushed the bubble that far off the cursor on any scrolled page. It
	   went unnoticed on the lev page only because `#screen` is itself fixed and
	   scrolls internally, so the document never scrolls there. */
	function place(event) {
		x = event.clientX + 5;
		y = event.clientY + 5;
		ix = event.clientX + 5;
		iy = event.clientY + 5;
	}
	function mouseOver(event) {
		isHovered = true;
		place(event);
	}
	function mouseMove(event) {
		place(event);
	}
	function mouseLeave() {
		isHovered = false;
		ispic = false
	}

</script>

<span
	onmouseenter={mouseOver}
  onmouseleave={mouseLeave}
	onmousemove={mouseMove}
   >
	{@render children?.()}
</span>

{#if isHovered}
	<div dir="rtl" style="top: {y}px; left: {x}px;" class="tooltip">{title}</div>
<!--
{#if ispic}
	<div dir="rtl" style="top: {ix}px; left: {iy}px;" class="tooltip"><button on:click={gotop}>קישור</button></div>
{/if}-->
	{/if}

<style>
	/* This bubble carries the only running commentary the heart has — what each
	   diamond filters, where the centre leads — and it was unreadable: hot pink
	   (#ef1758) on a four-stop gold ramp that ends at #AA771C, which is 1.3:1
	   at the dark end, and with no width limit a whole sentence stretched across
	   whatever it was explaining. Same gold identity, but only the pale end of
	   the ramp, violet ink to match the heart, and a width that makes it wrap. */
	.tooltip {
		z-index: 999;
		max-width: min(22rem, 70vw);
		border: 1px solid #8b2fd6;
		box-shadow: 0 2px 8px rgb(2 6 23 / 0.35);
		background: linear-gradient(to bottom right, #fcf6ba, #f0de72);
		color: #3b0047; /* 13.6:1 on #f0de72 */
		border-radius: 4px;
		padding: 4px 8px;
		position: fixed;
		text-align: center;
		/* The cursor is at the bubble's top-left corner; without this it would be
		   the first thing the bubble covers on its way to a stud. */
		pointer-events: none;
	}

	/* The professional identity has no gold parchment. Same bubble, the
	   appearance layer's own surface and ink — readable in light and dark
	   without a second rule, because both tokens flip together. */
	:global(html.business) .tooltip {
		background: var(--s1, #fff);
		color: var(--text, #0f172a);
		border-color: var(--border, rgb(15 23 42 / 0.12));
	}

</style>
