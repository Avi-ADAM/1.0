<script>
	/** @type {{rel?: string, target?: string, href: any, ariaLabel: any, children?: import('svelte').Snippet}} */
	let {
		rel = '',
		target = '',
		href,
		ariaLabel,
		children
	} = $props();
</script>

<a aria-label={ariaLabel} {href} {rel} {target}>{@render children?.()}</a>