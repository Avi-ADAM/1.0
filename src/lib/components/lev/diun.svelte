<script>
      import { createEventDispatcher } from 'svelte';
   import {BarLoader} from 'svelte-loading-spinners'
	import ChatMessage from '../../celim/messeges.svelte';
	import TodayDivider from '../../celim/todaydevider.svelte';
    import {pendMisMes, pendMasMes, askMisMes, meAskMisMes,meAskMasMes,askMasMes,forum, addMes} from '$lib/stores/pendMisMes.js'
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
	  const dispatch = createEventDispatcher();
   export let ani
   export let dont = false
   export let pendId
   export let rikmaName = "1💗1"
   export let rect, no = false
   export let mypos = null;   
	export let nameMe='Me';
	export let profilePicMe= "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png";
   export let smalldes = "small description"
	export let nameChatPartner='הצבעה';
	export let profilePicChatPartner='/favicon.ico';
	export let money = false
   export let messages = []
	 $: messagesi = ani == "pendM" ? $pendMisMes[pendId] : 
                   ani == "pmashes" ? $pendMasMes[pendId] : 
                   ani == "askedMi" ? $askMisMes[pendId] : 
                   ani == "iaskedMi"? $meAskMisMes[pendId] : 
                   ani == "askedMa" ? $askMasMes[pendId] : 
                   ani == "iaskedMa"? $meAskMasMes[pendId] : 
                   ani == "forum"? $forum[pendId]?.messages ?? [] :                  
                   messages
   let why = "";
 export let clicked = false
 $: off = 0
 $: console.log(clicked,"diun",off)

  const scrollToBottom = async (node) => {
    node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
  }; 
 let dow
async function click() {
   if(why.length > 0){
   clicked = true
 if (no == true) {
    if (why.length > 27) {
            dispatch("no",{why:why})
      } else{
            alert("מינימום 27 תווים")//todo lang
        }
      } else if (rect == true) {
            dispatch("rect",{why:why})
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
      $: loading = ani == "forum" ? $forum[pendId]?.loading ?? false : false
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

.input {
  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--barbi-pink);
  margin-top: 12px;
  width: 100%;
 color:  var(--gold);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:grey;
  user-select: none;
}

.line {
  height: 2px;
  background-color: #2196F3;
  position: absolute;
  transform: translateX(-50%);
  left: 50%;
  bottom: 0;
  width: 0;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
}

.input:focus ~ .line, .input:valid ~ .line {
  width: 100%;
}

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 14px;
  color: turquoise;
  top: -10px;
}
.input:focus ,.input:valid  {
  border: 0;
}
.t{
    height: 75vh;
     width: 100%;
     border-bottom-left-radius:10%;
          border-bottom-right-radius:10%;
 }
.dont{
       border-radius: 10%;
}
@media (max-width:600px){
 .t{
    height: 65vh;
    width: 100%;
    border-radius: 10%;
 }
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
}
</style>

<div style="background-color: #242526;" dir="rtl" class="flex-1 p:2 sm:p-6 justify-between flex flex-col {dont == false ? "dont" : "shadow-md shadow-fuchsia-400"} t">
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
      <div class="relative flex items-center space-x-4">
         <div class="relative">
            <span class="absolute text-green-500 right-0 bottom-0">
               <svg width="20" height="20">
                  <circle cx="8" cy="8" r="8" fill={mypos === true ? "green":"red"}></circle>
               </svg>
            </span>
         <img src={profilePicChatPartner}  alt="" class="w-10 sm:w-16 h-10 sm:h-16 pr-2 sm:pr-0 rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class="sm:text-2xl text-lg mt-1 flex items-center">
               <span class="text-gray-200 mr-3">{nameChatPartner}</span>
            </div>
            <span class="sm:text-lg text-md mx-5  text-barbi">{rikmaName}</span>
            <span class="sm:text-lg text-md ml-3 text-gold">{smalldes}</span>
         </div>
      </div>
      <div class="flex items-center space-x-2">
       <!--  <button type="button" class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
         </button>
         <button type="button" class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
         </button>
         <button type="button" class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
         </button>-->

      </div>
   </div>
  
   <div bind:this={dow} bind:offsetHeight={off} id="messages" class="flex flex-col space-y-4 p-3 overflow-y-auto d">
<!--
<div class="card card-danger direct-chat direct-chat-danger">
    <div class="card-header">
        <div class="card-tools d-flex">
            <img class="contacts-img" src={profilePicChatPartner} alt="profilePic">
            <span class="contacts-name">{nameChatPartner}</span>
           
        //על הצאט  <button type="button" class="btn btn-tool" title="Contacts"><Fa icon={faUsers} /></button>
          //למזער  <button type="button" class="btn btn-tool"><Fa icon={faCompressArrowsAlt} /></button>
       -->
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

    <div dir="rtl" class:pb-8={rect == false && no == false}  class="{loading == true ? "" : "border-t-2"} border-gray-200 pr-4 pl-8 sm:px-4 pt-4 mb-2 sm:mb-0" >
      {#if loading == true} 	
      <div class="w-full flex items-center justify-center" ><div class="mx-auto"><BarLoader size="120" color="#ff00ae" unit="px" duration="2s"></BarLoader></div>
         </div>
         {/if}
      {#if rect == true || no == true}

      <div class="relative flex ">
         <!---<span class="absolute inset-y-0 flex items-center">
            <button type="button" class="inline-flex items-center justify-center rounded-full h-12 w-12 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
               </svg>
            </button>
         </span>-->  
      <!--   <input type="textarea" placeholder={no === true ? "נימוק" : "נימוק, נא להתייחס לנימוקים שכבר הועלו"} class="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-12 bg-gray-200 rounded-md py-3">-->
       <div dir="rtl" class='textinput'>
  <textarea name="s"  bind:value={why}     
 type='text' minlength="26" class='input sm:text-lg text-gold d' required></textarea>
  <label for="s" class='label'>{money == true ? "פרטים שיעזרו לההעברה להתבצע" : no === true ? "נימוק" : "נימוק, נא להתייחס לנימוקים שכבר הועלו"}</label>
  <span class='line'></span>
</div>  
      <div  class="absolute -left-8 items-center inset-y-8 flex ">
          <!--  <button type="button" class="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
               </svg>
            </button>
            <button type="button" class="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
               </svg>
            </button>
            <button type="button" class="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
               </svg>
            </button>-->
            {#key  clicked}
            {#if clicked == false }
            <button on:click={click} type="button" class="inline-flex items-center justify-center rounded-lg  transition duration-500 ease-in-out text-mturk hover:text-barbi focus:outline-none">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 sm:ml-2 transform -rotate-90">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
               </svg>
            </button>
            {/if}
            {/key}
         </div>
      </div>
         {/if}

   </div>
        </div>

