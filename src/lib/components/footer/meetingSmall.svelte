<script>
  import { t } from '$lib/translations';
  import ListSmall from '../forum/listSmall.svelte';
  import {
    forum,
    nowChatId,
    newChat,
    initialForum
  } from '$lib/stores/pendMisMes.js';
  import Diun from '../lev/diun.svelte';
  import { page } from '$app/state';
  import { createMessage } from '$lib/func/chat/createMessage.svelte';
  import { createForum } from '$lib/func/chat/createForum.svelte';
  import { toast } from 'svelte-sonner';
  let unsubscribe;
  let messagesArray = $state(forumToArr());

  function subs() {
    unsubscribe = forum.subscribe((value) => {
      messagesArray = forumToArr();
    });
  }
  import { onDestroy } from 'svelte';
  /**
   * @typedef {Object} Props
   * @property {number} [chatId]
   * @property {any} un
   */

  /** @type {Props} */
  let { chatId = $bindable(0), un } = $props();

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  subs();
  function forumToArr() {
    let messagesArray = Object.entries($forum)
      .filter(([key, value]) => value.hasOwnProperty('messages')) // Ensure the property exists
      .map(([key, value]) => {
        return {
          id: key,
          ...value
        };
      }) // Add the id property
      .sort((a, b) => {
        let lastMessageA = a.messages[a.messages.length - 1];
        let lastMessageB = b.messages[b.messages.length - 1];

        // Sort by timestamp or messageId
        return (
          new Date(lastMessageB?.timestamp) -
            new Date(lastMessageA?.timestamp) ||
          lastMessageB?.messageId - lastMessageA?.messageId
        );
      });
    return messagesArray;
  }
  let clicked = $state(false),
    ani = 'forum';
  console.log(messagesArray);
  async function afreact(e) {
    const m = e.why;
    if ($nowChatId != -1) {
      let c = await createMessage(
        $nowChatId,
        m,
        $forum[$nowChatId].md,
        un
      ).then((c) => (c = c));
      if (c == 'sucsses') {
        clicked = false;
        console.log(clicked);
        toast.success(`${$t('common.chat.sent')}`);
      } else {
        toast.success(`${$t('common.chat.error')}`);
        clicked = false;
      }
    } else {
      console.log(m);
      const forumRes = await createForum($newChat.md.pid, $newChat.md.mbId);
      if (forumRes != 'error') {
        const forumId = forumRes.data.createForum.data.id;
        console.log($forum[forumId], '55');
        $forum[forumId] = $forum[-1];
        $forum[-1] = {
          started: false,
          created: true,
          id: forumId,
          md: { mbId: 0, pid: 0 }
        };
        $nowChatId = forumId;
        let c = await createMessage(forumId, m, $forum[forumId].md, un).then(
          (c) => (c = c)
        );
        if (c == 'sucsses') {
          clicked = false;
          console.log(clicked);
          toast.success(`${$t('common.chat.sent')}`);
        } else {
          toast.warning(`${$t('common.chat.error')}`);
          clicked = false;
        }
      } else {
        console.error('error');
        toast.warning(`${$t('common.chat.error')}`);
      }
    }
  }</script>

{#if $nowChatId == 0}
  {#key messagesArray}
    <ListSmall bind:chatId chats={messagesArray} />
  {/key}
{:else}
  <Diun
    dont={true}
    rikmaName={$forum[$nowChatId].md.projectName}
    onRect={afreact}
    smalldes={$forum[$nowChatId].md.mesimaName}
    nameChatPartner={$t('common.chat.missionChat')}
    mypos={true}
    bind:clicked
    pendId={$nowChatId}
    rect={true}
    profilePicChatPartner={$forum[$nowChatId].md.projectPic}
    {ani}
  />
{/if}
