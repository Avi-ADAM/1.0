<script>
  /**
   * "Work on this rikma from Claude" — on the create page, because this is
   * where a member decides to add work, and a connected agent can add it for
   * them (createPlanBoardTool, createTaskTool, prepareMissionTool).
   *
   * It does not repeat the setup guide. It links to the two sections of
   * /me/settings/mcp that matter here, and adds the one thing that page cannot
   * know: which rikma to work in. Every MCP tool takes a projectId, and an
   * agent that is not told one lists all of the member's rikmot and guesses —
   * rikmot can share a name — so the copyable opening line carries both the
   * name and the id.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';

  /** @type {{ projectId: string, projectName?: string }} */
  let { projectId, projectName = '' } = $props();

  let copied = $state(false);

  let prompt = $derived(
    $t('moach.create.agentConnect.prompt', {
      name: projectName || `#${projectId}`,
      projectId: String(projectId)
    })
  );

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      copied = true;
      toast.success($t('moach.create.agentConnect.copied'));
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard denied — the line is on screen and selectable.
    }
  }
</script>

<details class="agent-connect w-full max-w-4xl mx-auto mt-4 rounded-2xl border border-surfaceLine bg-surface text-surfaceInk">
  <summary class="flex items-center gap-3 px-5 py-3 cursor-pointer select-none">
    <span class="text-xl" aria-hidden="true">🔌</span>
    <span class="flex flex-col flex-1 min-w-0">
      <span class="font-bold">{$t('moach.create.agentConnect.title')}</span>
      <span class="text-sm text-surfaceMuted">{$t('moach.create.agentConnect.desc')}</span>
    </span>
    <svg class="chev w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  </summary>

  <div class="flex flex-col gap-4 px-5 pb-5">
    <section class="flex flex-col gap-2">
      <h4 class="font-semibold">{$t('moach.create.agentConnect.step1')}</h4>
      <ul class="flex flex-col gap-1.5 text-sm">
        <li>
          <a class="link" href="/me/settings/mcp#connector">{$t('moach.create.agentConnect.connector')}</a>
        </li>
        <li>
          <a class="link" href="/me/settings/mcp#claude-code">{$t('moach.create.agentConnect.claudeCode')}</a>
        </li>
      </ul>
    </section>

    <section class="flex flex-col gap-2">
      <h4 class="font-semibold">{$t('moach.create.agentConnect.step2')}</h4>
      <p class="text-sm text-surfaceMuted">{$t('moach.create.agentConnect.step2Body')}</p>
      <div class="flex items-start gap-2 rounded-lg border border-surfaceLine bg-surface2 p-3">
        <p class="flex-1 min-w-0 text-sm break-words">{prompt}</p>
        <button type="button" class="copy shrink-0 rounded-md border border-surfaceLine px-2.5 py-1 text-xs font-semibold" onclick={copyPrompt}>
          {copied ? $t('moach.create.agentConnect.copied') : $t('moach.create.agentConnect.copy')}
        </button>
      </div>
    </section>

    <p class="text-xs text-surfaceMuted">{$t('moach.create.agentConnect.note')}</p>
  </div>
</details>

<style>
  summary {
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .chev {
    transition: transform 0.2s ease;
  }
  details[open] .chev {
    transform: rotate(180deg);
  }
  .link {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .copy:hover {
    background: rgba(212, 175, 55, 0.12);
  }
</style>
