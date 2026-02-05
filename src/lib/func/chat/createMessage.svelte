<script module>
  import { sendApi } from '$lib/send/sendApi.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { nowId, updSend } from '$lib/stores/pendMisMes';

  export async function createMessage(id = 0, mes = '', md = {}, un = '') {
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionKey: 'createChatMessage',
          params: {
            forumId: String(id),
            message: mes,
            md: md,
            username: un
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Success handling legacy style for compatibility
        // we might not need nowId if the backend handles notifications correctly
        // but let's keep it if other parts depend on it
        if (result.data?.messageId) {
          nowId.set(result.data.messageId);
        }
        updSend(id, result.data?.messageId || 0);
        return 'sucsses';
      } else {
        console.error('Action failed:', result.error);
        return 'error';
      }
    } catch (e) {
      console.error('Error calling createChatMessage action:', e);
      return 'error';
    }
  }
</script>
