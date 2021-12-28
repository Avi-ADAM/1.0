<script>
 import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    function sendP() {
      console.log("bafs")
    dispatch('message', {
    files: files
    });
    }
   

let files;
</script>
    
    <div dir="rtl" class="flex content-center ">
        <label for="avatar">בחירת תמונה</label>
        <input type="file"
               id="avatar" name="avatar"
               accept="image/png, image/jpeg"
               bind:files={files}
               >
               <button on:click={sendP}  class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded">העלאה</button> 
              </div>