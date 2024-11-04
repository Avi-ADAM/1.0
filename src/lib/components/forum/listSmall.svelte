<script>
  import {isToday }from '$lib/func/uti/isToday.svelte';
   import {lang} from '$lib/stores/lang'
  import { isChatLoading, nowChatId } from '$lib/stores/pendMisMes';
  import { Rainbow } from 'svelte-loading-spinners';
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  /** @type {{chats?: any, chatId?: number}} */
  let { chats = [], chatId = $bindable(0) } = $props();
   console.log(chats)
   function toChat(id){
    nowChatId.set(id)
    chatId = id
   }
   //TODO: projectName and image as link to moach or publick page from open dialog - do you want to go to ...
</script>
<section transition:slide="{{ duration: 1000, easing: quintOut }}"  class="flex flex-col justify-center antialiased bg-gold text-gray-600  px-2 pb-2 h-max w-full shadow-xl shadow-fuchsia-500 rounded">
    <div class="h-full">
        <!-- Card -->
        <div class="relative max-w-[340px] mx-auto bg-white shadow-lg rounded-lg">
          
            <!-- Card body -->
            <div class="py-3 px-5 d overflow-y-auto h-[420px] ">
                
                <!-- Chat list -->
                <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="divide-y divide-gray-200">
                  {#if $isChatLoading}
                  <div class="w-full h-full flex justify-center align-middle items-center">
                  <Rainbow />
                  </div>
                  {/if}
                  {#key chats}
                   {#each chats as chat}
                    <button onclick={()=>toChat(chat.id)} class="w-full {$lang == "en" ? "text-left" : "text-right"} py-2 focus:outline-none focus-visible:bg-indigo-50 mt-2 p-2 hover:shadow-lg rounded cursor-pointer transition">
                        <div class="flex flex-row ">
                        <div class="flex ml-2  basis-3/4">
                             <img 
                             src="{chat?.md?.projectPic || "https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"}" 
                             alt="project profile pic" 
                             width="40" height="40" 
                             class="rounded-full {$lang =="en"? "mr-2": "ml-2"} h-10 w-10">

                            <div class="flex flex-col ml-2">
                                 <span class="font-medium text-xl text-black">{chat?.md?.projectName || ""}</span> 
                                <span class="font-medium text-lg text-gray-800">{chat?.md?.mesimaName || ""}</span> 
                             </div>
                                </div>
                        <div class="flex flex-col items-center  basis-1/4">
                             <span class="text-gray-300">   {#if isToday(chat?.messages[chat.messages.length - 1].timestamp)}
				{ new Date(chat?.messages[chat.messages.length - 1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) }
					{:else}
				{new Date(chat?.messages[chat.messages.length - 1].timestamp).toLocaleString([$lang], {year: 'numeric', month: '2-digit', day: '2-digit'})}
					{/if}</span>
                             <span><svg class="w-5 h-5 fill-barbi" viewBox="0 0 100 100"><circle r="50" cx=50 cy=50 ></circle></svg></span> </div>
                    </div>
                  <div class="text-sm text-gray-500 truncate w-full"><span class="font-bold">{chat.messages[chat.messages.length - 1].username ?? "מערכת 1💗1"}:</span> {chat?.messages[chat.messages.length - 1].message ?? " יש אמונה לא אכנע"}
                 
                </div>
                            
                     
                    </button>

                  {/each}
                  {/key}
                </div>
            </div>
          
        </div>
    </div>
</section>