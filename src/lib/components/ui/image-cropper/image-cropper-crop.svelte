<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { type ButtonElementProps, Button } from '$lib/components/ui/button';
	import { useImageCropperCrop } from './image-cropper.svelte.js';
	import CropIcon from '@lucide/svelte/icons/crop';
	import { lang } from '$lib/stores/lang';
	let {
		ref = $bindable(null),
		variant = 'default',
		size = 'sm',
		onclick,
		...rest
	}: ButtonElementProps = $props();

	const cropState = useImageCropperCrop();
	const crop = {"he":"חיתוך", "en": "crop"}
</script>

<Button
	{...rest}
	bind:ref
	class="bg-barbi text-gold hover:bg-gold hover:text-barbi"
	{size}
	{variant}
	onclick={(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => {
		onclick?.(e);

		cropState.onclick();
	}}
>
	<CropIcon />
	<span>{crop[$lang]}</span>
</Button>
