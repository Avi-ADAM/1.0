<script lang="ts">
  import { t } from '$lib/translations';
  import type { Stage } from '$lib/growth/stages';

  let { stage }: { stage: Stage } = $props();

  const TONE: Record<Stage, string> = {
    discovered: 'sh-chip-muted',
    researching: 'sh-chip-info',
    researched: 'sh-chip-info',
    profilePrepared: 'sh-chip-gold',
    awaitingApproval: 'sh-chip-warn-soft',
    invitationReady: 'sh-chip-gold',
    invitationSent: 'sh-chip-accent',
    interested: 'sh-chip-accent',
    onboardingStarted: 'sh-chip-accent',
    joined: 'sh-chip-ok',
    activeProvider: 'sh-chip-ok',
    declined: 'sh-chip-plain',
    doNotContact: 'sh-chip-plain'
  };
</script>

<span class="sh-chip {TONE[stage]}">{$t(`growth.stage.${stage}`)}</span>
