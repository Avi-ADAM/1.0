<!-- src/routes/mcp-auth/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
  <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
    {#if data.error}
      <p class="text-4xl mb-3">⚠️</p>
      <p class="font-semibold text-red-600">{data.error}</p>
    {:else}
      <p class="text-5xl mb-4">🤖</p>
      <h1 class="text-xl font-bold mb-2">Connect MCP</h1>
      <p class="text-gray-500 text-sm mb-6">
        שלום <strong>{data.userName}</strong>, סוכן AI מבקש לחבר את הכלים שלו
        לחשבונך. יאפשר לו לבצע פעולות בשמך.
      </p>

      <div
        class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-6 text-right"
      >
        {#if data.hasMcpKey}
          <strong>שים לב:</strong> כבר קיים חיבור MCP לחשבון זה. אישור מחדש
          <strong>יחליף</strong> את המפתח הקודם ויבטל את הגישה הישנה.
        {:else}
          <strong>שים לב:</strong> ייווצר מפתח API חדש. תוכל לבטל גישה זו בכל עת
          מ-
          <a href="/settings/api-keys" class="underline">הגדרות → מפתחות API</a>.
        {/if}
      </div>

      <form method="POST" use:enhance>
        <input type="hidden" name="callback" value={data.callback} />
        <div class="flex gap-3">
          <button
            type="submit"
            class="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            ✅ Approve & Connect
          </button>
          <a
            href="/"
            class="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm flex items-center justify-center"
          >
            ❌ דחה
          </a>
        </div>
      </form>
    {/if}
  </div>
</div>
