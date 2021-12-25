<script>
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    let files;
    function updaPi() {
    dispatch('message', {
    files: files
    });
    }
    //  e => dispatch('click', { info: files })
    </script>
       <div dir="rtl" class="flex content-center ">
          <label for="avatar">בחירת תמונה</label>
          <input type="file"
                 id="avatar" name="avatar"
                 accept="image/png, image/jpeg"
                 bind:files={files}
                 >
                 <button on:click={updaPi}
                   class="bg-blue-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
                   > עדכון תמונה</button> 
                </div>