<script>
  import { run } from 'svelte/legacy';

    import { lang } from '$lib/stores/lang.js';
  import { isChatOpen } from '$lib/stores/pendMisMes.js';
  import { navigating } from '$app/stores';
    import { page } from "$app/stores"
  import { goto } from "$app/navigation";
  import Chaticon from "$lib/celim/chaticon.svelte";
  import MoachIcon from "$lib/celim/icons/moachIcon.svelte";
  import { createEventDispatcher } from "svelte";
  import Lev from '$lib/celim/lev.svelte';
  const dispatch = createEventDispatcher();
    function addi(kind){
      if(kind == 'chat'){
        dispatch('chat');
      }else{
        dispatch('new');
      }
    }
  /** @type {{initialRout?: string}} */
  let { initialRout = "" } = $props();
    let activeRoute;
  run(() => {
    activeRoute = $page.url.pathname
  });
    run(() => {
    if($navigating){
          console.log($navigating?.to)

      }
  });
    const brainLeb= {"he":"מוח הרקמות","en":"brain of organiczations"}
</script>


<div class="fixed z-50 w-full h-12 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-0 left-1/2 dark:bg-gray-700 dark:border-gray-600">
    <div class="grid h-full max-w-lg grid-cols-5 mx-auto" >
        <button onclick={()=>{
            activeRoute = "moach"
            goto("/moach")
        }} type="button" class="{$page.url.pathname == "/moach" ? "border-b-2 border-gold" : ""} inline-flex flex-col items-center justify-center px-5 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <MoachIcon active={$navigating?.to.url.pathname == "/moach"}/>
            <span class="sr-only">{brainLeb[$lang]}</span>
        </button>
        <div id="tooltip-home" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
            {brainLeb[$lang]}
            <div class="tooltip-arrow" ></div>
        </div>
        <button onclick={() => addi('chat')} type="button" 
            class="{$isChatOpen ? "border-b-2 border-gold" :""} inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
            <Chaticon />
            <span class="sr-only">Chat</span>
        </button>
        <div id="tooltip-wallet" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
            Wallet
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <div class="flex items-center justify-center">
            <button onclick={() => addi()} type="button" class="inline-flex items-center justify-center w-10 h-10 font-medium  bg-goldGrad bg-[length:200%_auto] animate-gradientx text-barbi  rounded-full hover:animate-shine group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800">
                <svg class="w-4 h-4 text-barbi" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M9 1v16M1 9h16"/>
                </svg>
                <span class="sr-only">New item</span>
            </button>
        </div>
        <div id="tooltip-new" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
            Create new item
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button onclick={()=>{
            activeRoute = "lev"
            goto("/lev")
        }} type="button" class="{$page.url.pathname == "/lev" ? "border-b-2 border-gold" : ""} inline-flex text-barbi flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
           <Lev/>
            <span class="sr-only">Lev</span>
        </button>
        <div id="tooltip-settings" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
            Lev
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button onclick={()=>{
            activeRoute = "me"
            goto("/me")
        }} type="button" class="{$page.url.pathname == "/me" ? "border-b-2 border-gold" : ""} inline-flex flex-col items-center justify-center text-barbi px-5 rounded-e-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
              <img
              class=""
              src='https://res.cloudinary.com/love1/image/upload/v1641481504/newC_qq5z3l.svg'
              alt="link to Profile">
            <span class="sr-only">Profile</span>
        </button>
        <div id="tooltip-profile" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
            Profile
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
    </div>
</div>
