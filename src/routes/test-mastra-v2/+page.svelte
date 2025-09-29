<script>
  import { onMount } from 'svelte';
  
  let message = $state('');
  let response = $state('');
  let loading = $state(false);
  
  const testUser = {
    id: '1',
    lang: 'he'
  };

  async function sendMessage() {
    if (!message.trim()) return;
    
    loading = true;
    try {
      const res = await fetch('/api/mastra-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'chat',
          payload: {
            text: message,
            history: []
          },
          user: testUser
        })
      });
      
      const data = await res.json();
      response = JSON.stringify(data, null, 2);
    } catch (error) {
      response = 'Error: ' + error.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Mastra V2 Test</h1>
  
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-2">הודעה לבוט:</label>
      <input 
        bind:value={message}
        type="text" 
        class="w-full p-2 border rounded"
        placeholder="לדוגמה: עצור את הטיימר"
        onkeydown={(e) => e.key === 'Enter' && sendMessage()}
      />
    </div>
    
    <div class="flex gap-2">
      <button 
        onclick={sendMessage}
        disabled={loading}
        class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'שולח...' : 'שלח'}
      </button>
      
      <button 
        onclick={() => { message = 'תעביר אותי לדף הפרויקטים'; sendMessage(); }}
        disabled={loading}
        class="px-3 py-2 bg-green-500 text-white rounded text-sm disabled:opacity-50"
      >
        בדיקת ניווט
      </button>
      
      <button 
        onclick={() => { message = 'לך לפרופיל שלי'; sendMessage(); }}
        disabled={loading}
        class="px-3 py-2 bg-purple-500 text-white rounded text-sm disabled:opacity-50"
      >
        פרופיל
      </button>
    </div>
    
    {#if response}
      <div>
        <label class="block text-sm font-medium mb-2">תגובה:</label>
        <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{response}</pre>
      </div>
    {/if}
  </div>
  
  <div class="mt-8 text-sm text-gray-600">
    <h3 class="font-medium mb-2">דוגמאות לבדיקה:</h3>
    <ul class="list-disc list-inside space-y-1">
      <li>"עצור את הטיימר" - צריך לזהות כ-timer intent</li>
      <li>"תעביר אותי לדף הפרויקטים" - צריך לזהות כ-navigation intent ולהחזיר navigation object</li>
      <li>"לך לפרופיל שלי" - צריך לזהות כ-navigation intent ולנווט ל-/me</li>
      <li>"תראה לי את הטיימרים" - צריך לזהות כ-navigation intent ולנווט ל-/timers</li>
      <li>"לעמוד הבית" - צריך לזהות כ-navigation intent ולנווט ל-/</li>
      <li>"מעבר לניהול פרויקט ABC" - צריך לחפש פרויקט ולנווט עם idPr</li>
      <li>"איך אני יוצר טיימר חדש?" - צריך לזהות כ-general intent</li>
      <li>"התחל טיימר" - צריך לזהות כ-timer intent</li>
    </ul>
  </div>
</div>