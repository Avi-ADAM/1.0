<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher()
  function oneClick() {
   dispatch('oneClick');
  }

  export let lang;

  // Static display data for the AI chat list item
  const aiChatDisplayData = {
    id: 'ai-chat', // Consistent ID to be passed to onClick
    md: {
      projectName: 'AI Assistant',
      mesimaName: 'Chat with AI',
      projectPic: 'https://res.cloudinary.com/love1/image/upload/v1694087594/ai_icon_kxqt2x.png'
    },
    // Representative last message for display in the list
    lastMessage: {
      username: 'AI Assistant',
      message: 'Hello! How can I help you today?',
      timestamp: new Date().toISOString() // Using current time for freshness, could be a static string
    }
  };

  // Helper to format time, similar to what was in listSmall.svelte
  function formatTime(isoTimestamp) {
    return new Date(isoTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
  }
</script>

<button
  on:click={() => oneClick(aiChatDisplayData.id)}
  class="w-full {lang === 'en' ? 'text-left' : 'text-right'} py-3 px-2 focus:outline-none focus-visible:bg-indigo-100 mt-2 p-2 hover:shadow-lg rounded cursor-pointer transition bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 shadow-md border-b-2 border-purple-600"
>
  <div class="flex flex-row items-center">
    <div class="flex ml-2 basis-3/4 items-center">
      <img
        src="{aiChatDisplayData.md.projectPic}"
        alt="AI assistant profile pic"
        width="44" height="44"
        class="rounded-full {lang === 'en' ? 'mr-3' : 'ml-3'} h-11 w-11 border-2 border-white"
      />
      <div class="flex flex-col ml-2">
        <span class="font-semibold text-xl text-white">{aiChatDisplayData.md.projectName}</span>
        <span class="font-medium text-lg text-gray-100">{aiChatDisplayData.md.mesimaName}</span>
      </div>
    </div>
    <div class="flex flex-col items-center basis-1/4">
      <span class="text-gray-200 text-sm">
        {formatTime(aiChatDisplayData.lastMessage.timestamp)}
      </span>
      <!-- You can add a different icon or indicator for AI chat if needed -->
      <span><svg class="w-5 h-5 fill-white" viewBox="0 0 100 100"><circle r="40" cx="50" cy="50"></circle></svg></span>
    </div>
  </div>
  <div class="text-sm text-gray-100 truncate w-full mt-1">
    <span class="font-bold">{aiChatDisplayData.lastMessage.username}:</span> {aiChatDisplayData.lastMessage.message}
  </div>
</button>
