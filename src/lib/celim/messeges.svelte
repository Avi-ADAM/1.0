<script>
  import { Wave } from "svelte-loading-spinners";
  import { quintOut } from "svelte/easing";
  import { slide } from "svelte/transition";
  import { lang } from '$lib/stores/lang.js';

	
	function isToday(date) {
		const today = new Date();
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

	function getRelativeTime(date, language = 'he') {
		if (!date) return '';
		
		const now = new Date();
		const messageDate = new Date(date);
		const diffMs = now.getTime() - messageDate.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		
		const translations = {
			he: {
				now: 'עכשיו',
				minsAgo: (n) => `לפני ${n} דק'`,
				hoursAgo: (n) => `לפני ${n} שעות`,
				yesterday: 'אתמול'
			},
			en: {
				now: 'now',
				minsAgo: (n) => `${n}m ago`,
				hoursAgo: (n) => `${n}h ago`,
				yesterday: 'Yesterday'
			},
			ar: {
				now: 'الآن',
				minsAgo: (n) => `منذ ${n} د`,
				hoursAgo: (n) => `منذ ${n} س`,
				yesterday: 'أمس'
			}
		};
		
		const t = translations[language] || translations.he;
		
		// תוך 24 שעות - הצג זמן יחסי
		if (diffMins < 1) {
			return t.now;
		} else if (diffMins < 60) {
			return t.minsAgo(diffMins);
		} else if (diffHours < 24) {
			return t.hoursAgo(diffHours);
		} else if (isToday(date)) {
			return messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
		} else if (diffDays === 1) {
			return t.yesterday + ' ' + messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
		} else {
			return messageDate.toLocaleString([], {month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', hour12: false});
		}
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
	.chat-message {
		animation: fadeIn 0.3s ease-out;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.read-icon {
		color: #3b82f6;
		display: inline-flex;
		align-items: center;
		filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.5));
	}
	
	.un-read-icon {
		color: #9ca3af;
		display: inline-flex;
		align-items: center;
		opacity: 0.7;
	}
</style>
 <div transition:slide="{{ duration: 1000, easing: quintOut }}"  class="chat-message w-full">
         <div class="flex items-end" class:justify-end={sentByMe === true}>
            <div class="flex flex-col space-y-1 text-xs md:text-base md:max-w-[70%] max-w-[75%] mx-2 min-w-0" class:order-2={sentByMe === false} class:order-1={sentByMe === true} class:items-end={sentByMe === true} class:items-start={sentByMe === false}>
               <!-- Message bubble -->
               <div class="max-w-full">
                  <span class="px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl inline-block break-words max-w-full" 
                     class:text-gray-800={sentByMe === false && what === null} 
                     class:text-white={sentByMe === true && what === null} 
                     class:text-black={what == true} 
                     class:text-gold={what=== false}
                     class:bg-gray-200={sentByMe === false && what === null} 
                     class:bg-gradient-to-br={sentByMe === true && what === null} 
                     class:from-blue-600={sentByMe === true && what === null} 
                     class:to-blue-700={sentByMe === true && what === null} 
                     class:bg-barbi={what=== false} 
                     class:bg-green-300={what=== true}
                     class:rounded-bl-none={sentByMe === true} 
                     class:rounded-br-none={sentByMe === false}
                     class:line-through={changed == true}
                     class:shadow-md={sentByMe === true}
                     dir="rtl" 
                     style="word-break: break-word; overflow-wrap: break-word;"
                  >{@html message}</span>
               </div>
               
               <!-- Timestamp and status -->
               <div class="flex items-center gap-1.5 text-[10px] sm:text-xs px-1" 
                    class:self-end={sentByMe === true} 
                    class:self-start={sentByMe === false}>
                  <span class="font-semibold whitespace-nowrap drop-shadow-sm" 
                        class:text-blue-500={sentByMe === true} 
                        class:text-green-600={sentByMe === false}>
                     {getRelativeTime(timestamp, $lang)}
                  </span>
                  
                  {#if sentByMe === true}
                     {#if pending === true}
                        <Wave size="12" color="#ff00ae" unit="px" duration="2s"></Wave>
                     {:else}
                        <span class={((timeRead === 0) ? 'un-' : '') + 'read-icon'}>
                           <svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.5 12.5L5.57574 16.5757C5.81005 16.8101 6.18995 16.8101 6.42426 16.5757L9 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                              <path d="M16 7L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                              <path d="M7 12L11.5757 16.5757C11.8101 16.8101 12.1899 16.8101 12.4243 16.5757L22 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                           </svg>
                        </span>
                     {/if}
                  {/if}
               </div>
            </div>
            <img src="{profilePicChatPartner}" alt="pic" class="w-6 h-6 sm:w-8 sm:h-8 rounded-full order-1 flex-shrink-0">
         </div>
      </div>

