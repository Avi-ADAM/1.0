<script>	
    export let sentByMe;
    export let nameChatPartner;
    export let profilePicChatPartner;
    export let nameMe;
    export let profilePicMe;
		export let message;
    export let timestamp;		
	  export let timeRead;
		
		// This should use timestamp, but its simplified for the demo.
		export let isToday;
	export let what = null;
	
</script>

<style>
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
.direct-chat-timestamp {
	margin-left: 50px;
	margin-right: 50px;
	color: #999;

	margin-bottom: 0;
}
	
	.read-icon {
		color: #007bff;
	}
	
	.un-read-icon {
				color: #8f8f8f8f;
	}*/
</style>
 <div class="chat-message">
         <div class="flex items-end" class:justify-end={sentByMe === true}>
            <div class="flex flex-col space-y-2 text-xs max-w-xs mx-2 " class:order-2={sentByMe === false} class:order-1={sentByMe === true} class:items-end={sentByMe === true} class:items-start={sentByMe === false}>
               <div><span class="px-4 py-2 rounded-lg inline-block" 
				 class:text-gray-600={sentByMe === false && what === null} class:text-white={sentByMe === true && what === null} class:text-black={what !== null} 
				 class:bg-gray-300={sentByMe === false && what === null} class:bg-blue-600={sentByMe === true && what === null} class:bg-barbi={what=== false} class:bg-green-300={what=== true}
								 class:rounded-bl-none={sentByMe === true} class:rounded-br-none={sentByMe === false}
				dir="rtl" >{message}</span></div>
            </div>
            <img src="{profilePicChatPartner}" alt="pic" class="w-6 h-6 rounded-full order-1">
         </div>
      </div>
     

			<!--
					       <span class="direct-chat-name" class:float-right="{sentByMe}" class:float-left="{!sentByMe}">{sentByMe==true?nameMe:nameChatPartner}</span> 

        <span class="direct-chat-timestamp" class:float-left="{sentByMe}" class:float-right="{!sentByMe}">
					{#if isToday}
							{ new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
					{:else}
										{new Date(timestamp).toLocaleString([], {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', hour12: false})}
					{/if}

					
			{#if sentByMe === true}
					<span class={((timeRead === 0) ? 'un-' : '') + 'read-icon'}><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.5 12.5L5.57574 16.5757C5.81005 16.8101 6.18995 16.8101 6.42426 16.5757L9 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<path d="M16 7L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<path d="M7 12L11.5757 16.5757C11.8101 16.8101 12.1899 16.8101 12.4243 16.5757L22 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg></span>
			{/if}
					
			</span>
    </div>
    <img class="direct-chat-img" src="{sentByMe==true?profilePicMe:profilePicChatPartner}" alt="pic">
    <div class="direct-chat-text">
		<div class="d-flex">
			<span class="mr-auto">{message}</span>

		</div>
	</div>
</div>-->