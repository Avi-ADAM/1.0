<script lang="ts">
  /**
   * ConsentBadge — visual indicator that an action carries a verified signed
   * ConsentEvent (PLAN_user_sovereign_consent Phase 1 shadow signing).
   *
   * - status='signed'    → green dot + "מאומת" — there's a verified ConsentEvent
   * - status='pending'   → amber dot + "בהמתנה" — sent, awaiting mirror ack
   * - status='unsigned'  → gray dot + "ללא חתימה" — legacy / pre-Phase 1 action
   * - status='unverified'→ red dot + "אימות נכשל" — signature exists but invalid
   */

  type Status = 'signed' | 'pending' | 'unsigned' | 'unverified';

  type Props = {
    status: Status;
    /** Optional tooltip / title override */
    title?: string;
    /** Compact = just the dot; full = dot + label */
    compact?: boolean;
    /** Optional event id to surface in title — links the badge to its receipt */
    eventId?: string;
  };

  let { status, title, compact = false, eventId }: Props = $props();

  const labels: Record<Status, { he: string; en: string }> = {
    signed:     { he: 'מאומת',       en: 'Verified' },
    pending:    { he: 'בהמתנה',      en: 'Pending' },
    unsigned:   { he: 'ללא חתימה',   en: 'Unsigned' },
    unverified: { he: 'אימות נכשל',  en: 'Verification failed' }
  };

  const dotColors: Record<Status, string> = {
    signed:     'bg-emerald-500',
    pending:    'bg-amber-400',
    unsigned:   'bg-zinc-400',
    unverified: 'bg-rose-500'
  };

  const tooltip = $derived(
    title ??
      (eventId ? `${labels[status].he} · ${eventId.slice(0, 10)}…` : labels[status].he)
  );
</script>

<span
  class="inline-flex items-center gap-1.5 text-xs"
  title={tooltip}
  aria-label={labels[status].he}
  data-consent-status={status}
>
  <span
    class="inline-block h-2 w-2 rounded-full {dotColors[status]}"
    aria-hidden="true"
  ></span>
  {#if !compact}
    <span class="text-zinc-600 dark:text-zinc-300">{labels[status].he}</span>
  {/if}
</span>
