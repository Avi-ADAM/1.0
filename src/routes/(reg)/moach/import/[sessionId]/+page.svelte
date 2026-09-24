<script>
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/translations';
  import BlueprintReview from '$lib/components/assistant/BlueprintReview.svelte';

  let { data } = $props();

  /** Set when the draft changed under the owner (in the chat with their agent). */
  let conflict = $state(false);

  async function reload() {
    conflict = true;
    await invalidateAll();
  }
</script>

<svelte:head>
  <title>{$t('rikmaImport.title')} · 1💗1</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#if conflict}
  <p class="mx-auto max-w-3xl mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm" role="status">
    {$t('rikmaImport.conflict')}
  </p>
{/if}

<!-- A new version of the draft is a new screen: selections start from it. -->
{#key data.session.version}
  <BlueprintReview session={data.session} onConflict={reload} />
{/key}
