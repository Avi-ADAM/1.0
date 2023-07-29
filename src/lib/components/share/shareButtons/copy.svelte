<script>
  import CopyToClipboard from "svelte-copy-to-clipboard";
  export let exampleText = 'Copy me!';

  const handleSuccessfullyCopied = (e) => {
        checked = true
        setTimeout(()=>checked = false,15000)
    }

  const handleFailedCopy = () => {
      alert('failed to copy :(');
  }
	import Copy from '$lib/celim/icons/copy.svelte';
	
	export let url;
  $: checked = false

</script>

<button 
	><span class="sr-only">Copy to clipboard</span>
    <CopyToClipboard text={url} on:copy={handleSuccessfullyCopied} on:fail={handleFailedCopy} let:copy>
      <button on:click={copy}><Copy
		{checked}
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


