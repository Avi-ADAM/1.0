<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { type ButtonElementProps, Button } from '$lib/components/ui/button';
	import { useImageCropperCancel } from './image-cropper.svelte.js';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { lang } from '$lib/stores/lang';
	let {
		ref = $bindable(null),
		variant = 'outline',
		size = 'sm',
		onclick,
		...rest
	}: ButtonElementProps = $props();

	const cancelState = useImageCropperCancel();
	const cancel = {"he":"ביטול", "en": "cancel"}
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

		cancelState.onclick();
	}}
>
	<Trash2Icon />
	<span>{cancel[$lang]}</span>
</Button>
