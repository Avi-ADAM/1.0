<script>
   import {BarLoader} from 'svelte-loading-spinners'
	import ChatMessage from '../../celim/messeges.svelte';
	import TodayDivider from '../../celim/todaydevider.svelte';
    import {pendMisMes, pendMasMes, askMisMes, meAskMisMes,meAskMasMes,askMasMes,forum, addMes} from '$lib/stores/pendMisMes.js'
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { lang } from '$lib/stores/lang.js';
   let why = $state("");
  /**
   * @typedef {Object} Props
   * @property {any} ani
   * @property {boolean} [dont]
   * @property {any} pendId
   * @property {string} [rikmaName]
   * @property {any} rect
   * @property {boolean} [no]
   * @property {any} [mypos]
   * @property {string} [nameMe]
   * @property {string} [profilePicMe]
   * @property {string} [smalldes]
   * @property {string} [nameChatPartner]
   * @property {string} [profilePicChatPartner]
   * @property {boolean} [money]
   * @property {any} [messages]
   * @property {boolean} [clicked]
   * @property {(payload: { why: string }) => void} [onNo] - Callback for 'no' event.
   * @property {(payload: { why: string }) => void} [onRect] - Callback for 'rect' event.
   */

  /** @type {Props} */
  let {
    ani,
    dont = false,
    pendId,
    rikmaName = "1💗1",
    rect,
    no = false,
    mypos = null,
    nameMe = 'Me',
    profilePicMe = "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png",
    smalldes = "small description",
    nameChatPartner = 'הצבעה',
    profilePicChatPartner = '/favicon.ico',
    money = false,
    messages = [],
    clicked = $bindable(false),
    onNo,
    onRect
  } = $props();

  const scrollToBottom = async (node) => {
    node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
  }; 
 let dow = $state()
 
 // תרגומים עבור ה-label
 const labelTexts = {
   money: {
     he: "פרטים שיעזרו לההעברה להתבצע (מספר חשבון, פרטי העברה וכו')",
     en: "Details to help complete the transfer (account number, transfer details, etc.)",
     ar: "تفاصيل للمساعدة في إتمام التحويل (رقم الحساب، تفاصيل التحويل، إلخ)"
   },
   rejection: {
     he: "נימוק לדחייה (מינימום 27 תווים)",
     en: "Reason for rejection (minimum 27 characters)",
     ar: "سبب الرفض (27 حرفًا على الأقل)"
   },
   discussion: {
     he: "הודעה - נא להתייחס להודעות קודמות",
     en: "Message - please refer to previous messages",
     ar: "رسالة - يرجى الرجوع إلى الرسائل السابقة"
   },
   forum: {
     he: "כתוב הודעה...",
     en: "Write a message...",
     ar: "اكتب رسالة..."
   }
 };
 
 let labelText = $derived(
   money ? labelTexts.money[$lang] :
   no ? labelTexts.rejection[$lang] :
   ani === "forum" ? labelTexts.forum[$lang] :
   labelTexts.discussion[$lang]
 );
async function click() {
   if(why.length > 0){
   clicked = true
 if (no == true) {
    if (why.length > 27) {
            onNo?.({why:why})
      } else{
            alert("מינימום 27 תווים")//todo lang
        }
      } else if (rect == true) {
            onRect?.({why:why})
   if(ani === "forum"){
      let picLink =  "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png";
      if (localStorage.getItem('picLink') !== null) {
          picLink = JSON.parse(localStorage.getItem('picLink'));
        }
        let d = new Date
      addMes(why,pendId,true,true,picLink,d,0)
      why = ""
      clicked = false
 	scrollToBottom(dow);
   }
      }
      why = ""
   }
      }
	 let messagesi = $derived(ani == "pendM" ? $pendMisMes[pendId] : 
                   ani == "pmashes" ? $pendMasMes[pendId] : 
                   ani == "askedMi" ? $askMisMes[pendId] : 
                   ani == "iaskedMi"? $meAskMisMes[pendId] : 
                   ani == "askedMa" ? $askMasMes[pendId] : 
                   ani == "iaskedMa"? $meAskMasMes[pendId] : 
                   ani == "forum"? $forum[pendId]?.messages ?? [] :                  
                   messages)
 let off = $state(0);
      let loading = $derived(ani == "forum" ? $forum[pendId]?.loading ?? false : false)
</script>



<style>
   textarea { resize: none; }
     textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--gold)  var(--gold);
}
	
.textinput {
  position: relative;
  width: 100%;
  display: block;
}

.dont {
  border-radius: 0.75rem;
}

/* Custom scrollbar for messages */
#messages::-webkit-scrollbar {
  width: 6px;
}

#messages::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 3px;
}

#messages::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.6), rgba(236, 72, 153, 0.6));
  border-radius: 3px;
}

#messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8));
}

@media (max-width: 600px) {
  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }
}
</style>

<div dir={$lang === 'en' ? 'ltr' : 'rtl'} class="flex flex-col {dont == false ? "dont h-[75vh] sm:h-[80vh]" : "shadow-lg shadow-fuchsia-400/20 h-full"} max-h-[calc(100vh-100px)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden">
   <!-- Header -->
   <div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-800/60 to-gray-800/40 backdrop-blur-md border-b border-gray-700/30">
      <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
         <div class="relative flex-shrink-0">
            <img src={profilePicChatPartner} alt={nameChatPartner} class="w-11 h-11 sm:w-14 sm:h-14 rounded-full ring-2 ring-gray-700/50 hover:ring-fuchsia-500/50 object-cover transition-all duration-200">
            <span class="absolute -bottom-0.5 {$lang === 'en' ? '-right-0.5' : '-left-0.5'} w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-gray-800 {mypos === true ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'} transition-all duration-200"></span>
         </div>
         <div class="flex flex-col min-w-0 flex-1 gap-0.5">
            <h3 class="text-base sm:text-xl font-semibold text-white truncate">{nameChatPartner}</h3>
            {#if rikmaName}
               <p class="text-xs sm:text-sm text-barbi truncate font-medium">{rikmaName}</p>
            {/if}
            {#if smalldes}
               <p class="text-xs text-gold truncate ">{smalldes}</p>
            {/if}
         </div>
      </div>
   </div>
  
   <!-- Messages Area -->
   <div bind:this={dow} bind:offsetHeight={off} id="messages" class="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-4 sm:py-6 space-y-2 sm:space-y-3 bg-gray-900/30 scroll-smooth min-h-0">
      {#each messagesi as message}
         <ChatMessage
            nameMe = {nameMe}
            profilePicMe = {profilePicMe}
            nameChatPartner = {nameChatPartner}
            profilePicChatPartner = {message.pic}
            message={message.message}
            timestamp={message.timestamp}
            sentByMe={message.sentByMe} 
            timeRead={message.timeRead}
            what={message.what}
            changed={message.changed}
            pending={message.pending ?? false}
         />
      {/each}
   </div>

   <!-- Input Area -->
   <div dir={$lang === 'en' ? 'ltr' : 'rtl'} class:pb-8={rect == false && no == false} class="px-4 py-3 bg-gradient-to-r from-gray-800/40 to-gray-800/60 backdrop-blur-md {loading == true ? '' : 'border-t border-gray-700/30'}">
      {#if loading == true}
         <div class="w-full flex items-center justify-center py-6">
            <BarLoader size="120" color="#ff00ae" unit="px" duration="2s"></BarLoader>
         </div>
      {/if}
      
      {#if rect == true || no == true}
         <div class="relative flex items-end gap-2 sm:gap-3">
            <div dir={$lang === 'en' ? 'ltr' : 'rtl'} class='textinput flex-1'>
               <textarea 
                  name="s" 
                  bind:value={why}     
                  minlength="26" 
                  placeholder={labelText}
                  class='input text-base sm:text-lg text-white bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 hover:border-gray-500/50 hover:bg-gray-700/40 resize-none transition-all duration-200 max-h-32' 
                  rows="1"
                  required
               ></textarea>
            </div>
            
            {#key clicked}
               {#if clicked == false}
                  <button 
                     onclick={click} 
                     type="button"
                     aria-label="Send message"
                     class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 via-pink-600 to-fuchsia-700 hover:from-fuchsia-500 hover:via-pink-500 hover:to-fuchsia-600 active:scale-95 text-white transition-all duration-200 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 transform {$lang === 'en' ? 'rotate-90' : '-rotate-90'}">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                     </svg>
                  </button>
               {/if}
            {/key}
         </div>
      {/if}
   </div>
</div>
