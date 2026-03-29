<script lang="ts">
  import { t } from '$lib/translations';
  console.log('mounted');
  let {
    missions,
    onAction
  }: {
    missions: Array<{
      id: string;
      name: string;
      projectName: string;
      action: string;
    }>;
    onAction: (text: string) => void;
  } = $props();

  let selectedId = $state<string | null>(null);

  function handleSelect(
    missionId: string,
    missionName: string,
    action: string
  ) {
    if (selectedId) return;
    selectedId = missionId;

    // Send a structured command that the agent can easily parse
    // Providing both the name and the ID ensures the agent knows exactly which one
    const command =
      action === 'start_timer'
        ? $t('bot.startTimerCommand', { missionName, missionId } as any)
        : $t('bot.stopTimerCommand', { missionName, missionId } as any);

    onAction(command);
  }
</script>

<div class="mission-list-card">
  <div class="ml-header">
    <div class="ml-badge">⏱</div>
    <div class="ml-meta">
      <div class="ml-label">{$t('bot.missionsFound')}</div>
      <div class="ml-title">{$t('bot.whichMissionToStart')}</div>
    </div>
  </div>

  <div class="missions-container">
    {#each missions as mission (mission.id)}
      <button
        class="mission-btn"
        class:selected={selectedId === mission.id}
        class:dimmed={selectedId !== null && selectedId !== mission.id}
        onclick={() => handleSelect(mission.id, mission.name, mission.action)}
        disabled={selectedId !== null}
      >
        <div class="mission-info">
          <span class="mission-name">{mission.name}</span>
          <span class="project-tag">{mission.projectName}</span>
        </div>
        <div class="action-icon">
          {#if selectedId === mission.id}
            <span class="check">✓</span>
          {:else}
            <span class="play">▶</span>
          {/if}
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .mission-list-card {
    background: var(--surface-2, #1a1e26);
    border: 1px solid var(--border-2, rgba(255, 255, 255, 0.1));
    border-radius: var(--radius, 16px);
    padding: 16px;
    margin-top: 10px;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    width: 100%;
  }

  .ml-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .ml-badge {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(62, 207, 178, 0.1);
    display: grid;
    place-items: center;
    font-size: 16px;
    flex-shrink: 0;
    border: 1px solid rgba(62, 207, 178, 0.3);
    color: var(--teal, #3ecfb2);
  }

  .ml-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ml-label {
    font-size: 10px;
    color: var(--text-3, #a0aec0);
    font-family: var(--font-mono, monospace);
    display: block;
    margin: 0;
    text-align: right;
  }

  .ml-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text, #ffffff);
    line-height: 1.45;
    margin: 0;
    text-align: right;
  }

  .missions-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mission-btn {
    width: 100%;
    background: var(--surface-3, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: right;
    color: inherit;
  }

  .mission-btn:hover:not(:disabled) {
    background: rgba(62, 207, 178, 0.08);
    border-color: var(--teal, #3ecfb2);
    transform: translateX(-4px);
  }

  .mission-btn.selected {
    background: rgba(62, 207, 178, 0.12);
    border-color: var(--teal, #3ecfb2);
    color: var(--teal, #3ecfb2);
  }

  .mission-btn.dimmed {
    opacity: 0.4;
  }

  .mission-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .mission-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .project-tag {
    font-size: 10px;
    color: var(--text-3, #a0aec0);
    opacity: 0.8;
  }

  .action-icon {
    font-size: 12px;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .play {
    color: var(--teal, #3ecfb2);
    opacity: 0.7;
    font-size: 10px;
  }

  .check {
    font-weight: bold;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
