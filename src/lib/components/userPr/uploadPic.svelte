<script>
 import Cropper from "svelte-easy-crop";
  import { lang } from '$lib/stores/lang.js'
  /**
   * @typedef {Object} MessagePayload
   * @property {FormData} files
   */

  /**
   * @typedef {Object} Props
   * @property {number} [aspect]
   * @property {(payload: MessagePayload) => void} [onMessage] - Callback for the message event.
   */

  /** @type {Props} */
  let { aspect = 1, onMessage } = $props();
let dataU;
	let image = $state(), fileinput = $state(), pixelCrop = $state({x:0, y:0, width: 0, height: 0});
  let displayImage = $state();
  let canCrop = $state(false); // New state variable

   let imgBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCA";

  async function sendP(fileToSend) {
        const formData = new FormData()
        formData.append('files', fileToSend, 'image.jpg')
 
    onMessage?.({
    files: formData
    })
  };
    
let imageFile = $state();
	function onFileSelected(e) {
  	 imageFile = e.target.files[0];
		let reader = new FileReader();
		reader.onload = e => {
			image = e.target.result;
      displayImage = e.target.result;
      canCrop = false; // Reset canCrop when a new image is selected
		};
		reader.readAsDataURL(imageFile);
	}

	let profilePicture = $state();
		
	
	async function cropImage(){
	   console.log("cropImage: Function started."); // Log at the very beginning
	   if (!imageFile || !pixelCrop || !image || pixelCrop.width === 0 || pixelCrop.height === 0) {
	     alert("Please select an image and adjust the crop area first.");
	     console.error("cropImage: Prerequisites not met. imageFile:", imageFile, "pixelCrop:", pixelCrop, "image:", !!image);
	     return;
	   }

	   const imageElement = new Image();
	   imageElement.src = image;

	   imageElement.onload = async () => {
	       console.log("cropImage: imageElement loaded."); // Log inside onload
	       const canvas = document.createElement('canvas');
	       const ctx = canvas.getContext('2d');

	       canvas.width = pixelCrop.width;
	       canvas.height = pixelCrop.height;

	       ctx.drawImage(
	           imageElement,
	           pixelCrop.x,
	           pixelCrop.y,
	           pixelCrop.width,
	           pixelCrop.height,
	           0,
	           0,
	           pixelCrop.width,
	           pixelCrop.height
	       );

	       canvas.toBlob(async (blob) => {
	           console.log("cropImage: canvas.toBlob callback executed. Blob:", blob); // Log inside toBlob callback
	           if (blob) {
	               const croppedFile = new File([blob], imageFile.name, { type: imageFile.type });
	               sendP(croppedFile);
	           } else {
	               alert("Failed to crop image.");
	               console.error("cropImage: Blob is null. Failed to create image blob.");
	           }
	       }, imageFile.type);
	   };
	}
	
	function reset() {
		image = null;
    displayImage = null; // Clear displayImage on reset
    canCrop = false; // Reset canCrop on reset
		// pixelCrop is reset in the reset function
	}
 const up = {"he":"העלאת תמונה", "en": "upload picture"}
const adj = {"he":"התאמת גודל התמונה", "en": "adjust picture size"}
const cut = {"he":"לחתוך!","en": "cut!"}
const re = {"he":"להתחיל הכל מהתחלה?", "en": "start over"}

import { getFileFromUrl } from '$lib/components/ui/image-cropper';
	import * as ImageCropper from '$lib/components/ui/image-cropper';
	import { toast } from 'svelte-sonner';

</script>

{#if !image}
	<h2 class="text-barbi">
{up[$lang]}
  </h2>
	<input class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full a" type="file" accept=".jpg, .jpeg, .png" onchange={(e)=>onFileSelected(e)} bind:this={fileinput} >

{:else}
<h2>{adj[$lang]}</h2>

<ImageCropper.Root
	src={image}
	onCropped={async (url) => {
		// if you need the file for a form you can call getFileFromUrl with the cropped url
		const file = await getFileFromUrl(url);

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
<!---	<h2>{adj[$lang]}</h2>

	<div id="cr" >
		<Cropper
			bind:image
      cropShape={aspect == 1  ? 'round' : null}
			aspect={aspect}
			zoom=1
			onCropcomplete={(e)=>{
        console.log("onCropcomplete: canCrop set to true. pixelCrop:", e); // Log canCrop state
				pixelCrop = e.detail.croppedAreaPixels;
        canCrop = true; // Enable crop button once crop area is defined
        console.log("onCropcomplete: canCrop set to true. pixelCrop:", pixelCrop); // Log canCrop state
			}}
		/>
	</div>
	<div class="prof-pic-wrapper">
		<img
			bind:this={profilePicture}
			class="prof-pic"
			src={displayImage}
			alt="Profile example"
		/>
	</div>
	
	<br>
  <div dir="rtl">
  <button type="button" onclick={() => { alert("Cut button clicked!"); cropImage(); }} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full bt">{cut[$lang]}</button>

	<button type="button" class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full" onclick={reset}>{re[$lang]}</button>
</div>
-->
{/if}

<style>
  @media (max-width: 568px) {
     .a{
font-size: 8px;
  }
  }
  .bt:active{
    animation: changeColor 1s infinite;
  }
  @keyframes changeColor
{
  from { background: aqua; }
  to { background: fuchsia; }
}
  .a{
    width: 40vW;
  }
    .prof-pic-wrapper{
        height: 200px;
        width: 200px;
        position: relative;
        border: solid;
        overflow: hidden;
        /* display: none; */ /* Removed to make the preview visible */
    }
    #cr{
      position: relative;
      width: 40vw;
      aspect-ratio: 1;
    }
    .prof-pic{
        max-width: 100%; /* Ensure it fits within the wrapper */
        height: auto; /* Maintain aspect ratio */
    }
</style>
 
<!--
    {#if before}
    <div dir="rtl" class="flex content-center ">
        <label for="avatar">בחירת תמונה</label>
        <input type="file"
               id="avatar" name="avatar"
               accept="image/png, image/jpeg"
               bind:files={files}
               >

               <button on:click={()=>before = false}  class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">העלאה</button> 
              </div>
{:else}
              <Cropper
              cropShape={'round'}
              aspect={1}
 {image}
 bind:crop
 bind:zoom
 on:cropcomplete={e => console.log(e)}
/>
               <button on:click={sendP}  class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">העלאה</button> 

{/if}-->
