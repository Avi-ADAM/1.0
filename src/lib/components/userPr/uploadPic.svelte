<script>
  import { lang } from '$lib/stores/lang.js'

  /**
   * @property {(payload: MessagePayload) => void} [onMessage] - Callback for the message event.
   */

  /** @type {Props} */
  let { onMessage, noHeader = false, current = 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png' } = $props();


  async function sendP(fileToSend) {
        const formData = new FormData()
        formData.append('files', fileToSend, 'image.jpg')
 
    onMessage?.({
    files: formData
    })
  };
    
 const up = {"he":"העלאת תמונה", "en": "upload picture"}
const adj = {"he":"התאמת גודל התמונה", "en": "adjust picture size"}
const cut = {"he":"לחתוך!","en": "cut!"}
const re = {"he":"להתחיל הכל מהתחלה?", "en": "start over"}

import { getFileFromUrl } from '$lib/components/ui/image-cropper';
	import * as ImageCropper from '$lib/components/ui/image-cropper';
	import { toast } from 'svelte-sonner';

</script>


{#if noHeader == false}
<h2>{up[$lang]}</h2>
{/if}

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
		<ImageCropper.Preview />
	</ImageCropper.UploadTrigger>
	<ImageCropper.Dialog>
		<ImageCropper.Cropper />
		<ImageCropper.Controls>
			<ImageCropper.Cancel />
			<ImageCropper.Crop />
		</ImageCropper.Controls>
	</ImageCropper.Dialog>
</ImageCropper.Root>

