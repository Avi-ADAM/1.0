<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import type { PendingApproval } from '$lib/types';

  let {
    approvals,
    onApprove,
    onReject,
    isProcessing = false,
  }: {
    approvals: PendingApproval[];
    onApprove: (id: string) => void;
    onReject:  (id: string) => void;
    isProcessing?: boolean;
  } = $props();
</script>

{#if approvals.length > 0}
  <Panel title="ממתין לאישורך" titleColor="var(--pink-l)">
    {#each approvals as a (a.id)}
      <div class="item">
        <div class="item-name">{a.name}</div>
        <div class="item-sub">
          {#if a.type === 'mission'}
            משימה חדשה · {a.hours} שע׳ · ₪ {a.cost.toLocaleString()}
          {:else}
            משאב חדש · ₪ {a.cost.toLocaleString()}
          {/if}
        </div>
        <div class="btns">
          <button class="btn-approve" onclick={() => onApprove(a.id)} disabled={isProcessing}>
            {isProcessing ? '...' : '✓ אשר'}
          </button>
          <button class="btn-reject"  onclick={() => onReject(a.id)} disabled={isProcessing}>✗ דחה</button>
        </div>
      </div>
    {/each}
  </Panel>
{/if}

<style>
  .item {
    background: var(--pink-d);
    border: 1px solid rgba(200, 21, 95, 0.25);
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 10px;
  }
  .item:last-child { margin-bottom: 0; }

  .item-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px;
  }
  .item-sub {
    font-size: 11px;
    color: var(--tm);
    margin-bottom: 12px;
  }

  .btns { display: flex; gap: 8px; }

  .btn-approve {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, var(--pink), var(--pink-l));
    color: #fff;
    font-family: 'Heebo', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-approve:hover:not(:disabled) { transform: translateY(-1px); }
  .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-reject {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--tm);
    font-family: 'Heebo', sans-serif;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-reject:hover:not(:disabled) {
    border-color: var(--border-g);
    color: var(--text);
  }
  .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
