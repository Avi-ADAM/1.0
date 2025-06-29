<script>
    import { toast } from 'svelte-sonner';
    import CopyToClipboard from "svelte-copy-to-clipboard";
  import {lang} from '$lib/stores/lang'
  const su = {
    "he": "!העתקת בהצלחה",
    "en": "you copied successfully"
  }
  const er = {
    "he": "שגיאה בהעתקה!",
    "en": "error while copying"
  }
  const handleSuccessfullyCopied = (e) => {
        checked = true
        toast.success(su[$lang])
        setTimeout(()=>checked = false,15000)
    }

  const handleFailedCopy = () => {
       toast.warning(er[$lang])
       error = true
        setTimeout(()=>checked = true,15000)
  }
	import Copy from '$lib/celim/icons/copy.svelte';
	
  /**
   * @typedef {Object} Props
   * @property {string} [exampleText]
   * @property {any} url
   */

  /** @type {Props} */
  let { exampleText = 'Copy me!', url } = $props();
  let checked = $state(false);
  
  let error = $state(false);
  
</script>

<button 
	><span class="sr-only">Copy to clipboard</span>
    <CopyToClipboard text={url} oncopy={handleSuccessfullyCopied} onfail={handleFailedCopy} >
      {#snippet children({ copy })}
        <button onclick={copy}><Copy
  		{checked}
          {error}
  		width={48}
  	/></button>
      {/snippet}
    </CopyToClipboard></button
>

<style>
	button {
		background: transparent;
		border-style: none;
		transition: all 0.2s ease-in-out;
	}

		button {
			transition: all 2s ease-in-out;
		}

	button:focus,
	button:hover {
		transform: scale(1.1);
	}
</style>


