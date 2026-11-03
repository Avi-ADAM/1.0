<script>
  /**
   * A "watch the video" button with its own `VideoModal`, for a page that has no modal of
   * its own. Renders nothing when the video does not speak the reader's language
   * (`videoFor`), so a page can drop it in without its own gate.
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang';
  import { videoFor } from '$lib/videos.js';
  import VideoModal from '$lib/components/main/VideoModal.svelte';

  /** @type {{ video: string, cta: string, label: string, class?: string }} */
  let { video, cta, label, class: klass = '' } = $props();

  const id = $derived(videoFor(video, $lang));
  let open = $state(false);
</script>

{#if id}
  <button type="button" class={klass} onclick={() => (open = true)}>
    <span aria-hidden="true">▶</span>
    {cta}
  </button>
  <VideoModal bind:open videoId={id} title={label} closeLabel={$t('home.videos.close')} />
{/if}
