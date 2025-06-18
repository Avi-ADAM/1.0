<script>
  import { Wave } from "svelte-loading-spinners";
  import { quintOut } from "svelte/easing";
  import { slide } from "svelte/transition";

	
		// This should use timestamp, but its simplified for the demo.
		function isToday(date) {
  const today = new Date();

  // 👇️ Today's date
  console.log(today);
	if(date != null){ 
		let dater = new Date(date)
  if (
    today.getFullYear() === dater.getFullYear() &&
    today.getMonth() === dater.getMonth() &&
    today.getDate() === dater.getDate()
  ) {
    return true;
  }
	}
  return false;
}
	/**
	 * @typedef {Object} Props
	 * @property {any} sentByMe
	 * @property {any} nameChatPartner
	 * @property {any} profilePicChatPartner
	 * @property {any} nameMe
	 * @property {boolean} [pending]
	 * @property {any} message
	 * @property {any} timestamp
	 * @property {number} [timeRead]
	 * @property {boolean} [changed]
	 * @property {any} [what]
	 */

	/** @type {Props} */
	let {
		sentByMe,
		nameChatPartner,
		profilePicChatPartner,
		nameMe,
		pending = false,
		message,
		timestamp,
		timeRead = 0,
		changed = false,
		what = null
	} = $props();
	
</script>

<style>
	.direct-chat-timestamp {
	margin-left: 50px;
	margin-right: 50px;
	color: #999;

	margin-bottom: 0;
}
/*
.direct-chat-msg,
.direct-chat-text {
	display: block;
}
.direct-chat-msg {
	margin-bottom: 10px;
}
.direct-chat-msg:before,
.direct-chat-msg:after {
	content: " ";
	display: table;
}
.direct-chat-msg:after {
	clear: both;
}
.direct-chat-text {
	border-radius: 5px;
	position: relative;
	padding: 5px 10px;
	background: #d2d6de;
	border: 1px solid #d2d6de;
	margin: 2px 0 5px 50px;
	color: #444;
			margin-right: 50px;
}
.direct-chat-text:after,
.direct-chat-text:before {
	position: absolute;
	right: 100%;
	top: 15px;
	border: solid transparent;
	border-right-color: #d2d6de;
	content: ' ';
	height: 0;
	width: 0;
	pointer-events: none;
}
.direct-chat-text:after {
	border-width: 5px;
	margin-top: -5px;
}
.direct-chat-text:before {
	border-width: 6px;
	margin-top: -6px;
}
.right .direct-chat-text {
	margin-right: 50px;
	margin-left: 50px;
}
.right .direct-chat-text:after,
.right .direct-chat-text:before {
	right: auto;
	left: 100%;
	border-right-color: transparent;
	border-left-color: #d2d6de;
}
img {
	border-radius: 50%;
	float: left;
	width: 40px;
	height: 40px;
}
.right img {
	float: right;
}
	
	.direct-chat-infos {
			font-size: .8rem;
		
	}
.direct-chat-name {
	font-weight: 600;
}

	*/
	.read-icon {
		color: #007bff;
	}
	
	.un-read-icon {
				color: #8f8f8f8f;
	}
</style>
 <div transition:slide="{{ duration: 1000, easing: quintOut }}"  class="chat-message">
         <div class="flex items-end" class:justify-end={sentByMe === true}>
            <div class="flex flex-col space-y-2 text-xs md:text-lg md:max-w-lg max-w-xs mx-2 " class:order-2={sentByMe === false} class:order-1={sentByMe === true} class:items-end={sentByMe === true} class:items-start={sentByMe === false}>
               <div><span class="px-4 py-2 rounded-lg inline-block" 
				 class:text-gray-600={sentByMe === false && what === null} class:text-white={sentByMe === true && what === null} class:text-black={what == true} class:text-gold={what=== false}
				 class:bg-gray-300={sentByMe === false && what === null} class:bg-blue-600={sentByMe === true && what === null} class:bg-barbi={what=== false} class:bg-green-300={what=== true}
								 class:rounded-bl-none={sentByMe === true} class:rounded-br-none={sentByMe === false}
								 class:line-through={changed == true}
				dir="rtl" >{@html message}</span></div>
            </div>
            <img src="{profilePicChatPartner}" alt="pic" class="w-6 h-6 rounded-full order-1">
         </div>
     

			<!--
					       <span class="direct-chat-name" class:float-right="{sentByMe}" class:float-left="{!sentByMe}">{sentByMe==true?nameMe:nameChatPartner}</span> 
-->
        <span class="direct-chat-timestamp left-0 text-xs md:text-sm flex flex-row" class:float-left="{sentByMe}" class:float-right="{!sentByMe}">
				{#if isToday(timestamp)}
							{ new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) }
					{:else}
										{new Date(timestamp).toLocaleString([], {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', hour12: false})}
					{/if}
					
			{#if sentByMe === true}
			{#if pending === true}
			<Wave size="20" color="#ff00ae" unit="px" duration="2s"></Wave>
				{:else}
	
				<span class={((timeRead === 0) ? 'un-' : '') + 'read-icon'}><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.5 12.5L5.57574 16.5757C5.81005 16.8101 6.18995 16.8101 6.42426 16.5757L9 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<path d="M16 7L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<path d="M7 12L11.5757 16.5757C11.8101 16.8101 12.1899 16.8101 12.4243 16.5757L22 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg></span>
			{/if}
	{/if}
			</span>
			      </div>

   <!--- </div>
    <img class="direct-chat-img" src="{sentByMe==true?profilePicMe:profilePicChatPartner}" alt="pic">
    <div class="direct-chat-text">
		<div class="d-flex">
			<span class="mr-auto">{message}</span>

		</div>
	</div>
</div>-->