<script>
  import { sendToSer } from '$lib/send/sendToSer.js';
	import { createEventDispatcher, onMount } from 'svelte';

	/** @type {HTMLDivElement}*/
	let div = $state();
	/** @type {HTMLScriptElement}*/
	let script;

	

    


	

	

	

	

	
	/** @type {{username?: string, uid?: Number, size?: string, authType?: string, redirectURL?: string, requestAccess?: boolean, buttonRadius?: number}} */
	let {
		username = '',
		uid = 0,
		size = 'medium',
		authType = 'callback',
		redirectURL = '',
		requestAccess = false,
		buttonRadius = 10
	} = $props();

	const dispatch = createEventDispatcher();

	function telegramCallback( user) {
        console.log(user)
        sendToSer({uid,telegramId:user.id.toString()},"6addTelegram",uid,null,false,fetch)
		dispatch('auth', user);
	}
	function cleanStart() {
		try {
			div.innerHTML = '';
			script = document.createElement('script');
			script.src = 'https://telegram.org/js/telegram-widget.js?19';
			script.setAttribute('async', 'true');
			script.setAttribute('data-telegram-login', username);
			script.setAttribute('data-size', size);
			script.setAttribute('data-radius', `${buttonRadius}`);
			if (authType === 'callback') {
				script.setAttribute('data-onauth', 'window.telegramCallback(user)');
			} else if (authType === 'redirect') {
				if (!redirectURL) {
					throw new Error('Redirect URL is required if authType is set to redirect');
				}
				script.setAttribute('data-auth-url', redirectURL);
			}
			if (requestAccess) {
				script.setAttribute('data-request-access', 'write');
			}
			div.appendChild(script);
		} catch (e) {
			console.error(e);
		}
	}

	onMount(() => {
		// @ts-ignore
		window.telegramCallback = telegramCallback;
		cleanStart();
	});
</script>

<div bind:this={div}></div>

<style>
	div {
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
