<script>
  /**
   * "Refine with Lev" on a wish (docs/PLAN_AI_SIGNUP_CONCIERGE §7.3): opens
   * the wish's living list — the same one the owner's agent edits — only when
   * asked, so a plain visit to the wish page never creates a session.
   */
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import AssistantPanel from './AssistantPanel.svelte';

  /** @type {{ ratsonId: string, onApplied?: () => void }} */
  let { ratsonId, onApplied } = $props();

  let open = $state(false);
  let loading = $state(false);
  let error = $state('');
  /** @type {any} */
  let session = $state(null);

  async function toggle() {
    open = !open;
    if (!open || session || loading) return;
    loading = true;
    error = '';
    const res = await executeAction('startAssistantSession', { kind: 'wish', ratsonId, via: 'site' }, { showErrorToast: false });
    loading = false;
    if (res?.success) session = res.data;
    else error = res?.error?.message || $t('assistant.error');
  }
</script>

<button type="button" class="btn-ghost" style="padding:8px 14px;font-size:13px" aria-expanded={open} onclick={toggle}>
  💬 {$t('assistant.wishLauncher')}
</button>

{#if open}
  <div class="wish-assistant" style="margin:12px 0;flex-basis:100%">
    {#if loading}
      <p class="text-sm">{$t('assistant.working')}</p>
    {:else if error}
      <p class="text-sm" role="alert">{error}</p>
    {:else if session}
      <AssistantPanel {session} onApplied={() => onApplied?.()} />
    {/if}
  </div>
{/if}
