<script>
    import { toast } from 'svelte-sonner';
    import CopyToClipboard from "svelte-copy-to-clipboard";
  export let exampleText = 'Copy me!';
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
	
	export let url;
  $: checked = false
  $: error = false
</script>

<button 
	><span class="sr-only">Copy to clipboard</span>
    <CopyToClipboard text={url} on:copy={handleSuccessfullyCopied} on:fail={handleFailedCopy} let:copy>
      <button on:click={copy}><Copy
		{checked}
        {error}
		width={48}
	/></button>
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


