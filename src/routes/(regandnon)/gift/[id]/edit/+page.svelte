<script lang="ts">
  /** Only reached by a product with no rikma; every other one redirects to its page there. */
  import { isRtl, t } from '$lib/translations';

  let { data } = $props();
</script>

<div class="container mx-auto max-w-4xl px-4 py-10 text-center" dir={$isRtl ? 'rtl' : 'ltr'}>
  <p class="text-pink-500">{$t('offerings.compose.noRikma')}</p>
  <a class="mt-4 inline-block rounded border px-4 py-2" href="/gift/{data.mId}">{$t('offerings.compose.backToProduct')}</a>
</div>
