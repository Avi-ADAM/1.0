<!-- src/routes/settings/api-keys/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let isCreating = $state(false);
  let newKeyName = $state('');
  let copiedKey = $state(false);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    copiedKey = true;
    setTimeout(() => (copiedKey = false), 2000);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
</script>

<div class="max-w-2xl mx-auto py-10 px-4" dir="rtl">
  <h1 class="text-2xl font-bold mb-2">מפתחות API</h1>
  <p class="text-gray-500 mb-8 text-sm">
    השתמש במפתחות אלו לחיבור סוכן ה-AI שלך לחשבונך.
  </p>

  <!-- הצגת מפתח חדש שנוצר -->
  {#if form?.newKey}
    <div class="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
      <p class="font-semibold text-green-800 mb-1">
        ✅ המפתח <strong>{form.keyName}</strong> נוצר בהצלחה
      </p>
      <p class="text-sm text-green-700 mb-2">
        שמור אותו עכשיו — הוא לא יוצג שוב.
      </p>
      <div
        class="flex items-center gap-2 bg-white border border-green-200 rounded p-2 font-mono text-sm break-all"
      >
        <span class="flex-1 select-all">{form.newKey}</span>
        <button
          onclick={() => copyKey(form.newKey!)}
          class="shrink-0 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {copiedKey ? '✓ הועתק' : 'העתק'}
        </button>
      </div>
    </div>
  {/if}

  {#if form?.error}
    <div
      class="bg-red-50 border border-red-300 text-red-700 rounded p-3 mb-4 text-sm"
    >
      {form.error}
    </div>
  {/if}

  <!-- טופס יצירת מפתח -->
  {#if isCreating}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return ({ update }) => {
          isCreating = false;
          newKeyName = '';
          update();
        };
      }}
      class="bg-gray-50 border rounded-lg p-4 mb-6"
    >
      <label class="block text-sm font-medium mb-1">שם המפתח</label>
      <div class="flex gap-2">
        <input
          name="name"
          bind:value={newKeyName}
          placeholder="לדוגמה: Claude Desktop"
          class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          minlength="2"
        />
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          צור
        </button>
        <button
          type="button"
          onclick={() => (isCreating = false)}
          class="px-4 py-2 border rounded text-sm hover:bg-gray-100"
        >
          ביטול
        </button>
      </div>
    </form>
  {:else}
    <button
      onclick={() => (isCreating = true)}
      class="mb-6 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
    >
      + צור מפתח חדש
    </button>
  {/if}

  <!-- רשימת מפתחות -->
  {#if data.keys.length === 0}
    <p class="text-gray-400 text-sm text-center py-10 border rounded-lg">
      אין מפתחות עדיין
    </p>
  {:else}
    <div class="divide-y border rounded-lg overflow-hidden">
      {#each data.keys as key (key.id)}
        <div
          class="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50"
        >
          <div>
            <p class="font-medium text-sm">{key.attributes.name}</p>
            <p class="text-xs text-gray-400 font-mono">
              ···· {key.attributes.key_prefix}
              <span class="mx-2">•</span>
              נוצר {formatDate(key.attributes.createdAt)}
            </p>
          </div>
          <form
            method="POST"
            action="?/delete"
            use:enhance
            onsubmit={(e) => {
              if (!confirm(`למחוק את המפתח "${key.attributes.name}"?`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={key.id} />
            <button
              type="submit"
              class="text-xs text-red-500 hover:text-red-700 hover:underline"
            >
              מחק
            </button>
          </form>
        </div>
      {/each}
    </div>
  {/if}
</div>
