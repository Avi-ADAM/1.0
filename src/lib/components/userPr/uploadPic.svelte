<script>
 import { createEventDispatcher } from 'svelte';
 import Cropper from "svelte-easy-crop";
	import { getCroppedImg } from "./canvasUtils"
  import { lang } from '$lib/stores/lang.js'

	      let file;
let dataU;
	let image = $state(), fileinput = $state(), pixelCrop, croppedImage;

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
        for (let i = 0; i < byteString.length; i++){
            ia[i] = byteString.charCodeAt(i)}

        return new Blob([ia], { type: mimeString })//
      }
	
    const dispatch = createEventDispatcher();
  async function sendP(data) { 
               console.log(pixelCrop)
        const formData = new FormData()
      //croppedImage = await getCroppedImg(image, pixelCrop)
      if ((navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)) {
           file = imageFile
        } else{
      // console.log(croppedImage)
   file = DataURIToBlob(data) 
        }
formData.append('files', file, 'image.jpg')

     // .then(
      
       //  formpic.append('my-file', blob, 'filename.png')
//formData.append("image_data", image))

 // formData.append('my-file', croppedImage, 'filename.png'))
    //  console.log("bafs", croppedImage)
    //   const data = croppedImage.replace(/^data:image\/\w+;base64,/, "");
    
 
    dispatch('message', {
    files: formData
    })
  };
     let before = true;

let files;
let imageFile;
	function onFileSelected(e) {
  	 imageFile = e.target.files[0];
		let reader = new FileReader();
		reader.onload = e => {
			image = e.target.result
		};
		reader.readAsDataURL(imageFile);
	}

	let profilePicture = $state(), style;
		
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
 const up = {"he":"העלאת תמונה", "en": "upload picture"} 
const adj = {"he":"התאמת גודל התמונה", "en": "adjust picture size"}
const cut = {"he":"לחתוך!","en": "cut!"}
const re = {"he":"להתחיל הכל מהתחלה?", "en": "start over"}
</script>

{#if !image}
	<h2 class="text-barbi">
{up[$lang]}
  </h2>
	<input class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full a" type="file" accept=".jpg, .jpeg, .png" onchange={(e)=>onFileSelected(e)} bind:this={fileinput} >

{:else}
	<h2>{adj[$lang]}</h2>
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
  <button type="button" onclick={cropImage} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full bt">{cut[$lang]}</button>

	<button type="button" class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full" onclick={reset}>{re[$lang]}</button>
</div>{/if}

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
        display: none;
    }
    #cr{
      position: relative;
      width: 40vw;
      aspect-ratio: 1;
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

               <button on:click={()=>before = false}  class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">העלאה</button> 
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
               <button on:click={sendP}  class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">העלאה</button> 

{/if}-->