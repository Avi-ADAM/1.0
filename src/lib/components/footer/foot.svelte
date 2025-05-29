<script context="module">
  import mapTouchToMouseFor from 'svelte-touch-to-mouse';
</script>

<script>
  import { sendToSer } from '$lib/send/sendToSer.svelte';
  import NewIwant from '$lib/components/addnew/newIwant.svelte';
  import { quintOut } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';
  import { lang } from '$lib/stores/lang.js';
  import Plus from '$lib/celim/icons/plus.svelte';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import { isChatOpen, nowChatId } from '$lib/stores/pendMisMes.js';
  import { onMount } from 'svelte';
  import Drag from '$lib/celim/icons/drag.svelte';
  import ChatSmall from './chatSmall.svelte';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import { Drawer } from 'vaul-svelte';
  import OnlineSwitch from '$lib/celim/onlineSwitch.svelte';
  import NewMeetingIcon from '$lib/celim/3d/newMeetingIcon.svelte';
  import { Canvas } from '@threlte/core';
  import CreateNewMeeting from '../addnew/createNewMeeting.svelte';
  import { initiatePgishot, isOnline, myUserMeeting } from '$lib/stores/pgishot';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import MobileFooter from './mobileFooter.svelte';
  export let un;
  let draggable;
  onMount(async () => {
    initiatePgishot(idL);
    draggable = (await import('svelte-agnostic-draggable')).draggable;
  });
  mapTouchToMouseFor('.draggable');

  let username = '';
  let iwant = false,
    addP = false,
    min = true;
  function addi(kind) {
    if (kind == 'chat') {
      iwant = true;
      mapTouchToMouseFor('.draggable');
      isChatOpen.set(true);
    } else {
      newMeeting = false
      dialogOpen = true;
    }
  }
  let dialogOpen = false;
  const close = () => {
    dialogOpen = false;
    iwant = false;
    isChatOpen.set(false);
  };
  let loading = false;
  let newMeeting = false;
  const cencel = { he: 'ביטול', en: 'cencel' };
  export let idL
  export let chatId = 0;
  export let online = true
  function onlineSwitcher(e) {
    const changedTo = e.detail.checked
    console.log(changedTo, $myUserMeeting)
    if($myUserMeeting == 0){
      console.log(0)
      //create usermeeting and make it online
    }else{
      sendToSer( { id: $myUserMeeting, online: changedTo },'22setOnline', null, null, false, fetch)
    }
  }
  const back = { he: "חזרה לרשימת הצ'אטים", en: 'back to chat list' };

  /**** Svelte Event Handling ****/

  function onDraggableInit() {
    console.log('Draggable was created');
  }
  function onDragStart() {
    console.log('dragging started');
  }
  function onDragMove() {
    console.log('dragging continues');
  }
  function onDragStop() {
    console.log('dragging was stopped');
  }
  function onDraggableDestroy() {
    console.log('Draggable was destroyed');
  }
</script>
<div data-vaul-drawer-wrapper >
	<Drawer.Root  bind:open={dialogOpen}   shouldScaleBackground>
    	<Drawer.Trigger/>
		<Drawer.Portal>
			<Drawer.Overlay class="fixed inset-0 bg-black/40 z-[1000]" />
			<Drawer.Content
				class="fixed bottom-0 left-0 right-0 mt-24 flex max-h-[96%] flex-col rounded-t-[10px] z-[1000] bg-gold"
			>
				<div class="flex-1 rounded-t-[10px] p-4">
          <div class="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-barbi" />

					<div class="mx-auto d overflow-auto flex flex-col ">
					
      <div>
        					<div class="mx-auto h-[85vh] d overflow-auto flex flex-col z-[1001]">
        {#if newMeeting == false}
        <NewIwant {idL} userName_value={username} />
        {:else}
        <CreateNewMeeting on:close={()=>{newMeeting = false
        dialogOpen = false
        }}/>
        {/if}
</div>

            </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
</div>

{#if $isChatOpen == true}
  <div
    use:draggable={{
      containment: 'window',
      cursor: 'grabbing'
    }}
    style="
    display:block; cursor:grab
  "
    on:draggable:init={onDraggableInit}
    on:draggable:destroy={onDraggableDestroy}
    on:drag:start={onDragStart}
    on:drag:move={onDragMove}
    on:drag:stop={onDragStop}
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}
    dir="rtl"
    class=" draggable z-[9999] absolute top-0 left-0 w-[340px] max-h-[420px] grid items-center justify-center aling-center rounded"
  >
  <div>
    <div class="flex flex-row bg-gold rounded  justify-between">
      <div class="flex flex-row  items-start justify-start">
      <div>
        <button
          on:click={close}
          class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
          title={cencel[$lang]}
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
            />
          </svg></button
        >
      </div>
      <div class="hover:bg-wow text-barbi hover:text-barbi font-bold rounded">
        <Drag />
      </div>
      {#if $nowChatId != 0}
        <div
          class="hover:bg-wow justify-end flex text-barbi hover:text-barbi font-bold rounded"
        >
          <button
            on:click={() => ($nowChatId = 0)}
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title={back[$lang]}><Arrow back={true} /></button
          >
        </div>
      {/if}
      </div>
      <div class="flex flex-row gap-2 items-start justify-end "	>
      <div>
        <OnlineSwitch bind:checked={$isOnline} on:change={()=>onlineSwitcher} />
      </div>
      <button class="h-6 w-6 mx-2 my-1" on:click={() => {
        isChatOpen.set(false);
        newMeeting = true
        dialogOpen = true
      }}>
        <Canvas >
          <NewMeetingIcon />
        </Canvas>
      </button>
      </div>
  </div>
    <ChatSmall bind:chatId {un}/>
  </div>
</div>
{/if}
<!--{#if isMobileOrTablet()}

<button
  style="position: fixed; color: var(--gold); font-weight:bold; height:25px width:25px; z-index:500;"
  on:click={() => (min = !min)}
  class="ww3 items-center flex justify-center text-xl"
>
  {#if min !== false}
    ↙️
  {:else}
    ↗️
  {/if}
</button>
{#if min !== false}
  {#if $isChatOpen !== true}
    <button
      transition:slide|all={{ delay: 150, duration: 1000, easing: quintOut }}
      style="position: fixed; color: var(--gold); font-weight:bold; height:50px width:50px; z-index:500;"
      on:click={() => addi('chat')}
      class="{online == true ? "online":"ww"} ww2  items-center flex justify-center text-xl"
      ><Chaticon /></button
    >
  {/if}
  <button
    transition:slide={{ delay: 150, duration: 1000, easing: quintOut }}
    style="position: fixed; color: var(--gold); font-weight:bold; height:50px width:50px; z-index:500;"
    on:click={() => addi()}
    class="ww ww1 text-bold sm:text-2xl text-xl items-center flex justify-center"
    ><Plus /></button
  >
{/if}
{:else}{/if}-->
<MobileFooter on:chat={() => addi("chat")} on:new={() => addi()}/>


<style>
   .draggable {
    -webkit-touch-callout: none;
    -ms-touch-action: none;
    touch-action: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .ww2 {
    top: calc(100% - 105px);
    right: calc(100% - 55px);
    width: 50px;
    height: 50px;
  }
  .ww3 {
    top: calc(100% - 35px);
    right: calc(100% - 35px);
    width: 25px;
    height: 25px;
    box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
  }
  .ww1 {
    top: calc(100% - 55px);
    right: calc(100% - 105px);
    width: 50px;
    height: 50px;
  }
  .online{
     border-radius: 50%;
    background: rgb(31, 246, 35);
    background: -moz-linear-gradient(
      -45deg,
      rgb(31, 246, 35) 0%,
      rgba(26, 188, 156, 1) 100%
    );
    background: -webkit-linear-gradient(
      -45deg,
      rgba(31, 246, 35) 0%,
      rgba(26, 188, 156, 1) 100%
    );
    background: linear-gradient(
      135deg,
      rgba(31, 246, 35) 0%,
      rgba(26, 188, 156, 1) 100%
    );

    box-shadow: 0 10px 30px 0px rgba(0, 0, 0, 0.6);
    transform: translatey(0px);
    animation: float 6s ease-in-out infinite;

  }
  .ww {
    border-radius: 50%;
    background: rgb(26, 188, 156);
    background: -moz-linear-gradient(
      -45deg,
      rgba(26, 188, 156, 1) 0%,
      rgba(142, 68, 173, 1) 100%
    );
    background: -webkit-linear-gradient(
      -45deg,
      rgba(26, 188, 156, 1) 0%,
      rgba(142, 68, 173, 1) 100%
    );
    background: linear-gradient(
      135deg,
      rgba(26, 188, 156, 1) 0%,
      rgba(142, 68, 173, 1) 100%
    );

    box-shadow: 0 10px 30px 0px rgba(0, 0, 0, 0.6);
    transform: translatey(0px);
    animation: float 6s ease-in-out infinite;
  }
  @keyframes float {
    0% {
      box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
      transform: translatey(0px);
    }
    50% {
      box-shadow: 0 25px 15px 0px rgba(0, 0, 0, 0.2);
      transform: translatey(-20px);
    }
    100% {
      box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
      transform: translatey(0px);
    }
  }
 
</style>
