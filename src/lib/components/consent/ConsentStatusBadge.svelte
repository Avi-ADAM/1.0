<script lang="ts">
  import { t } from '$lib/translations';
  /**
   * ConsentStatusBadge — surfaces the user's cryptographic identity status
   * (PLAN_user_sovereign_consent Phase 1).
   *
   * Pulls from the reactive `consentStatus` rune in
   * `$lib/consent/bootstrap.svelte`. Place it in /me, in a header, or wherever
   * you want signing readiness visible. Defaults to compact mode so it fits
   * inline with other badges.
   */

  import { consentStatus, type ConsentStatusKind } from '$lib/consent/bootstrap.svelte';

  type Props = {
    /** Compact = dot + label; expanded adds the device pubkey fingerprint */
    expanded?: boolean;
    /** Optional href to a details page (e.g., /me/identity) */
    href?: string;
    /** RTL caption language override; defaults to Hebrew */
    lang?: 'he' | 'en';
  };

  let { expanded = false, href, lang = 'he' }: Props = $props();

  const dotColor: Record<ConsentStatusKind, string> = {
    idle:        'bg-zinc-300 dark:bg-zinc-600',
    creating:    'bg-sky-400 animate-pulse',
    registering: 'bg-sky-400 animate-pulse',
    ready:       'bg-emerald-500',
    'local-only':'bg-amber-400',
    unsupported: 'bg-zinc-400',
    error:       'bg-rose-500'
  };

  const fp = $derived(
    consentStatus.devicePubB64 ? consentStatus.devicePubB64.slice(0, 8) : ''
  );

  const kind = $derived(consentStatus.kind);
  const Tag = $derived(href ? 'a' : 'span');
</script>

<svelte:element
  this={Tag}
  href={Tag === 'a' ? href : undefined}
  class="inline-flex items-center gap-1.5 text-xs leading-tight {Tag === 'a' ? 'hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400 rounded' : ''}"
  title={$t(`ui.consent.status.${kind}.help`)}
  aria-label={$t(`ui.consent.status.${kind}.label`)}
  data-consent-kind={consentStatus.kind}
>
  <span
    class="inline-block h-2 w-2 rounded-full {dotColor[consentStatus.kind]}"
    aria-hidden="true"
  ></span>
  <span class="text-zinc-600 dark:text-zinc-300">{$t(`ui.consent.status.${kind}.label`)}</span>
  {#if expanded && fp}
    <span class="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">· {fp}…</span>
  {/if}
</svelte:element>
