<script>
  import ListSmall from '../forum/listSmall.svelte';
  import {
    forum,
    nowChatId,
    newChat,
    initialForum
  } from '$lib/stores/pendMisMes.js';
  import Diun from '../lev/diun.svelte';
  import { lang } from '$lib/stores/lang';
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
  const er = {
    he: 'אם הבעיה נמשכת baruch@1lev1.com שגיאה יש לנסות שנית, ניתן ליצור קשר במייל ',
    en: 'error: please try again, if the problem continue contact at baruch@1lev1.com'
  };

  const messs = {
    he: 'הודעתך נשלחה בהצלחה',
    en: 'your message was send succsefully'
  };

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
        toast.success(`${messs[$lang]}`);
      } else {
        toast.success(`${er[$lang]}`);
        clicked = false;
      }
    } else {
      console.log(m);
      let t = await createForum($newChat.md.pid, $newChat.md.mbId).then(
        (t) => (t = t)
      );
      if (t != 'error') {
        const forumId = t.data.createForum.data.id;
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
          toast.success(`${messs[$lang]}`);
        } else {
          toast.warning(`${er[$lang]}`);
          clicked = false;
        }
      } else {
        console.error('error');
        toast.warning(`${er[$lang]}`);
      }
    }
  }
  let nameChatPartner = {
    he: 'דיון על משימה בתהליך ',
    en: 'chat on mission in progress'
  };
</script>

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
    nameChatPartner={nameChatPartner[$lang]}
    mypos={true}
    bind:clicked
    pendId={$nowChatId}
    rect={true}
    profilePicChatPartner={$forum[$nowChatId].md.projectPic}
    {ani}
  />
{/if}
