<script>
  import { t } from '$lib/translations';

  /**
   * @property {(payload: MessagePayload) => void} [onMessage] - Callback for the message event.
   */

  /** @type {Props} */
  let { onMessage,cropShape = 'round',
  aspect = 1, color=false, noHeader = false, current = 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png' } = $props();


  async function sendP(fileToSend) {
        const formData = new FormData()
        formData.append('files', fileToSend, 'image.jpg')
 
    onMessage?.({
    files: formData
    })
  };
    




import { getFileFromUrl } from '$lib/components/ui/image-cropper';
	import * as ImageCropper from '$lib/components/ui/image-cropper';
	import { toast } from 'svelte-sonner';

</script>


{#if noHeader == false}
<h2 class="text-center text-barbi">{$t('pages.editPic.up')}</h2>
{/if}
<div class="flex justify-center items-center">
<ImageCropper.Root
	src={current}
	onCropped={async (url) => {
		// if you need the file for a form you can call getFileFromUrl with the cropped url
		const file = await getFileFromUrl(url);
		sendP(file)
		console.log(file);
	}}
	onUnsupportedFile={(file) => {
		toast.error(`Unsupported file type: ${file.type}`);
	}}
>
	<ImageCropper.UploadTrigger>
		{#if cropShape === 'rect'}
			<ImageCropper.Preview
				class="rounded-none"
				style={`aspect-ratio: ${aspect}; width: 256px;`}
			>
				{#snippet child({ src })}
					<img {src} alt="Preview" class="h-full w-full rounded-none object-cover border-2 border-barbi" />
				{/snippet}
			</ImageCropper.Preview>
		{:else}
			<ImageCropper.Preview />
		{/if}
	</ImageCropper.UploadTrigger>
	<ImageCropper.Dialog class="z-[9999]">
		<ImageCropper.Cropper {cropShape}
		{aspect}/>
		<ImageCropper.Controls>
			<ImageCropper.Cancel />
			<ImageCropper.Crop />
		</ImageCropper.Controls>
	</ImageCropper.Dialog>
</ImageCropper.Root>

</div>