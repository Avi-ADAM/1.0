<script>
    import { lang } from "$lib/stores/lang"
	import { browser } from '$app/environment';
       import { LinkedIn, } from 'svelte-share-buttons-component';
    import  Mail from '$lib/components/share/shareButtons/Mail.svelte'
	import ShareIcon from '$lib/celim/icons/share.svelte';
	import Facebook from '$lib/components/share/shareButtons/Facebook.svelte';
	import Telegram from '$lib/components/share/shareButtons/Telegram.svelte';
	import Twitter from '$lib/components/share/shareButtons/Twitter.svelte';
	import website from '$lib/config/website';
    import ShareOp from '$lib/celim/icons/shareOp.svelte'
    import Whatsapp from '$lib/components/share/shareButtons/WhatsApp.svelte'
  import { fly } from 'svelte/transition';
  import Close from '$lib/celim/close.svelte'
	const { siteTitle, siteUrl } = website;
    let cliced = false
	export let slug = "";
	export let title ="come see this on 1💗1";
    export let desc = "its new thing"
    export let hashtags = []; // array of hashtags exclude '#' e.g. ['svelte', 'askRodney']
	export let quote = undefined;
	export let related = []; // array of Twitter users (including '@')
	export let via = ''; // include '@' e.g. '@askRodney'

    const url = `${siteUrl}/${slug}`;

    export let body = desc + " to see this click on " + url

	$: webShareAPISupported = browser && typeof navigator.share !== 'undefined';

	$: handleWebShare;
	const handleWebShare = async () => {
		try {
			navigator.share({
				title,
				text: `Shared from ${siteTitle}`,
				url,
			});
		} catch (error) {
			webShareAPISupported = false;
		}
	};
</script>

<aside class="container">
	<div class="wrapper">
		 <div class="buttons">
            <button on:click={()=>cliced = !cliced}>
                {#if cliced == false}
            <span class="sr-only">Open Share manu</span>
            <ShareIcon colour="#FF0092" width={48} />
            {:else}
            <span class="sr-only">Open Share manu</span>
            <span class="text-gray-500 hover:text-barbi">
            <Close height={48} width={48} />
            </span>
            {/if}
         </button>
            {#if cliced == true}
            <span transition:fly|local={{y:-150, duration: 2000}}>
			{#if webShareAPISupported}
				<button on:click={handleWebShare}
					><span class="sr-only">Share</span><ShareOp width={48} /></button
				>
			{/if}
				<Twitter {via} {hashtags} {related} {quote} {url} {title} />
                <Facebook {url} {hashtags} {quote}/>
                <Whatsapp {url} {title} />
				<Telegram {url} {title} /> 
                <Mail  {title} {body} />
            </span>
            {/if}
               
		</div>
	</div>
</aside>

<style >
	.container {
		display: flex;
		flex-direction: row;
		margin-top: 12px;
		width: 48px;
	}
	.wrapper {
		display: flex;
		flex-direction: row;
		margin-left: auto;
		font-weight: bold;
		font-size: 24px;
	}
	.buttons {
		margin-left: 4px;
	}

	button {
		background: transparent;
		border-style: none;
        border: 0px;
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