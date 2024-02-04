<script>
  import ListSmall from "../forum/listSmall.svelte";
    import {forum} from '$lib/stores/pendMisMes.js'
  import Diun from "../lev/diun.svelte";
    export let chatId = 0 
    import {lang} from '$lib/stores/lang'
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
    return new Date(lastMessageB.timestamp) - new Date(lastMessageA.timestamp) || lastMessageB.messageId - lastMessageA.messageId;
  });
let clicked = true, ani = "forum"
console.log(messagesArray);
function afreact (){

}
let nameChatPartner = {"he":"דיון על משימה בתהליך ","en":"chat on mission in progress"}
</script>
{#if chatId == 0}
<ListSmall bind:chatId chats={messagesArray}/>
{:else}
 <Diun
  rikmaName={$forum[chatId].md.projectName}
  on:rect={afreact}
  smalldes={$forum[chatId].md.mesimaName}
  nameChatPartner={nameChatPartner[$lang]}
  mypos={true}
  {clicked}
  pendId={chatId}
  rect={false}
  profilePicChatPartner={$forum[chatId].md.projectPic}
  {ani}
/>
{/if}