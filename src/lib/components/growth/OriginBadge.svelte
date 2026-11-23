<script lang="ts">
  import { t } from '$lib/translations';
  import type { FieldOrigin } from '$lib/growth/types';

  /** Verified, an AI suggestion, or edited by the operator — never left unsaid (§5.2). */
  let { origin }: { origin: FieldOrigin | 'ai' } = $props();
  const tone = $derived(origin === 'verified' ? 'sh-chip-ok' : origin === 'edited' ? 'sh-chip-gold' : 'sh-chip-info');
</script>

<span class="sh-chip {tone} gr-small" title={$t(`growth.origin.${origin}Hint`)}>{$t(`growth.origin.${origin}`)}</span>
