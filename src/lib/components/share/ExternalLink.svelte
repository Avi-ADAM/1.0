<script>
	/** @type {{rel?: string, target?: string, href: any, ariaLabel: any, children?: import('svelte').Snippet}} */
	let {
		rel = 'nofollow noopener noreferrer',
		target = '_blank',
		href,
		ariaLabel,
		children
	} = $props();
</script>

<a aria-label={ariaLabel} {href} {rel} {target}>{@render children?.()}</a>