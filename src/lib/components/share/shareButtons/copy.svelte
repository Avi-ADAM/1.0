<script>
  import { t } from '$lib/translations';
    import { toast } from 'svelte-sonner';
    import { copy } from "svelte-copy";
  const handleSuccessfullyCopied = (e) => {
    console.log(e)
        checked = true
        toast.success($t('common.status.copied'))
        setTimeout(()=>checked = false,15000)
    }

  const handleFailedCopy = () => {
       toast.warning($t('common.status.copyError'))
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

    <button  use:copy={{text:url, events: ['click'], 
    onCopy:handleSuccessfullyCopied, onError({error}){
       toast.warning($t('common.status.copyError'))
       error = true
        setTimeout(()=>checked = true,15000)
  }}}  >
      <span class="sr-only">Copy to clipboard</span>
      <Copy
  		{checked}
          {error}
  		width={48}
  	/>
    </button>

    
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


