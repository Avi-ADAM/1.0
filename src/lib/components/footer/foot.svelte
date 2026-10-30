<script>
  import { forum, isChatOpen, nowChatId } from '$lib/stores/pendMisMes.js';
  import { initialForum } from '$lib/stores/pendMisMes.js';
  import { onMount } from 'svelte';
  import ChatDock from './ChatDock.svelte';
  import { initiatePgishot } from '$lib/stores/pgishot';
  import { goldenMeetingHref } from '$lib/meetings/goldenMeeting.js';
  import MobileFooter from './mobileFooter.svelte';

  let username = '';
  let iwant = false,
    addP = false,
    min = true;
  function addi(kind) {
    if (kind == 'chat') {
      iwant = true;
      isChatOpen.set(true);
    } else {
      // New meetings are made on the meetings app (magik-meetings).
      window.open(goldenMeetingHref(), '_blank', 'noopener');
    }
  }
  const close = () => {
    iwant = false;
    isChatOpen.set(false);
  };
  let loading = false;
  /**
   * @typedef {Object} Props
   * @property {any} un
   * @property {any} idL
   * @property {number} [chatId]
   * @property {boolean} [online]
   */

  /** @type {Props} */
  let { un = '', idL = 0, chatId = $bindable(0), online = true } = $props();
  let isAuthed = $derived(idL != 0);

  $effect(() => {
    if ($isChatOpen && $nowChatId && $nowChatId != 0 && idL && idL != 0) {
      const fid = String($nowChatId);
      const existing = $forum?.[fid];
      // Load forum data only when missing md and not already loading (prevents loops)
      if (!existing?.md && !existing?.loading) {
        initialForum(false, [Number($nowChatId)], idL);
      }
    }
  });

  onMount(async () => {
    if (idL && idL > 0) {
      initiatePgishot(idL);
    }
  });
</script>

{#if isAuthed}
  {#if $isChatOpen == true}
    <ChatDock bind:chatId {un} onClose={close} />
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
{/if}

<!-- Outside the auth branch on purpose: `(regandnon)` is a public group, so a
     visitor browsing /project or /demand gets the bar too — in its guest form,
     which carries login/signup instead of the member tabs. Only the chat panel
     and the drawers above are members-only. -->
<MobileFooter {isAuthed} onChat={() => addi('chat')} onNew={() => addi()} />

<!-- The appearance handle rides the footer bar itself (see mobileFooter) —
     floating it over the page put it on top of the bot bubble and the lev
     demand map. A guest used to get a floating dock here instead, because they
     had no bar at all; now they do, and it carries the same handle, so a dock
     would only duplicate it. -->

<style>
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
  .online {
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
