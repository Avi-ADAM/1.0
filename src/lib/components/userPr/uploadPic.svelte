<script>
 import { createEventDispatcher } from 'svelte';
 import Cropper from "svelte-easy-crop";
	import { getCroppedImg } from "./canvasUtils"
	      let file;
let dataU;
	let image, fileinput, pixelCrop, croppedImage;

   var imgBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCA";
//	async function DataURIToBlob(dataURI) {
//    dataU = dataURI;
//   
//        console.log(dataU);
//          dataU.split(',') ; 
//           console.log(dataU);
//        var splitDataURI;
//        
//        var byteString = dataU[0].indexOf('base64') >= 0 ? atob(dataU[1]) : decodeURI(dataU[1])
//        var mimeString = dataU[0].split(':')[1].split(';')[0]
function DataURIToBlob(dataURI) {
        const splitDataURI = dataURI.split(',')
        const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])
        const mimeString = splitDataURI[0].split(':')[1].split(';')[0]
        const ia = new Uint8Array(byteString.length)
        for (let i = 0; i < byteString.length; i++)
            ia[i] = byteString.charCodeAt(i)

        return new Blob([ia], { type: mimeString })//
      }
	
    const dispatch = createEventDispatcher();
     async function sendP(data) { 
               console.log( pixelCrop)
        const formData = new FormData()
      //croppedImage = await getCroppedImg(image, pixelCrop)
      
      //  console.log(croppedImage),
file = DataURIToBlob(data) 

formData.append('files', file, 'image.jpg')

     // .then(
      
       //  formpic.append('my-file', blob, 'filename.png')
//formData.append("image_data", image))

 // formData.append('my-file', croppedImage, 'filename.png'))
    //  console.log("bafs", croppedImage)
    //   const data = croppedImage.replace(/^data:image\/\w+;base64,/, "");
    
  console.log("bafsi", croppedImage, file)
 
    dispatch('message', {
    files: formData
    })
  };
     let before = true;

let files;

	function onFileSelected(e) {
  	let imageFile = e.target.files[0];
		let reader = new FileReader();
		reader.onload = e => {
			image = e.target.result
		};
		reader.readAsDataURL(imageFile);
	}

	let profilePicture, style;
		
	function previewCrop(e){
		pixelCrop = e.detail.pixels;
		const { x, y, width } = e.detail.pixels;
		const scale = 200 / width;	
		profilePicture.style=`margin: ${-y*scale}px 0 0 ${-x*scale}px; width: ${profilePicture.naturalWidth * scale}px;`
	}
	
	async function cropImage(){
		 await getCroppedImg(image, pixelCrop).then(data =>  sendP(data)
     
    )
	}
	
	function reset() {
		croppedImage = null;
		image = null;
	}
</script>

{#if !image}
	<h2>
		העלאת תמונת פרופיל
	</h2>
	<input class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded" type="file" accept=".jpg, .jpeg, .png" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
<!--	<h2>
		Or... use this cute dog 🐕
	</h2>
<button type="button" on:click={() => {image = defaultSrc}}>Click me!</button>
-->{:else}
	<h2>התאמת גודל התמונה</h2>
	<div id="cr" >
		<Cropper
			{image}
      cropShape={'round'}
			aspect={1}
			zoom=1
			crop={{x:0, y:0}}
			on:cropcomplete={previewCrop}
		/>
	</div>
	<div class="prof-pic-wrapper">
		<img
			bind:this={profilePicture}
			class="prof-pic"
			src={image}
			alt="Profile example"
			{style}
		/>
	</div>
	
	<br>
  <div dir="rtl">
  <button type="button" on:click={cropImage} class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded">לחתוך!</button>

	<button type="button" class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded" on:click={reset}>להתחיל הכל מהתחלה?</button>
</div>{/if}

<style>
    .prof-pic-wrapper{
        height: 200px;
        width: 200px;
        position: relative;
        border: solid;
        overflow: hidden;
        display: none;
    }
    #cr{
      position: relative;
      width: 40vw;
      height: 50vh;
    }
    .prof-pic{
        position: absolute;
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

               <button on:click={()=>before = false}  class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded">העלאה</button> 
              </div>
{:else}
              <Cropper
              cropShape={'round'}
              aspect={1}
 {image}
 bind:crop
 bind:zoom
 on:cropcomplete={e => console.log(e.detail)}
/>
               <button on:click={sendP}  class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded">העלאה</button> 

{/if}-->