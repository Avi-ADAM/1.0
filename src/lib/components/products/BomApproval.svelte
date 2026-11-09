<script lang="ts">
  /**
   * A new recipe line's owner says yes: for a resource, the yes opens the choice of
   * which of theirs it is, one at a time (the same modal as a resource offered on
   * its own). With `decisionId` it signs that version; without one the choices go
   * back to the caller, because saving the proposal is the signature.
   */
  import { Portal } from 'bits-ui';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import ProvideAssigned from '$lib/components/lev/ProvideAssignedResource.svelte';
  import { bomResourcesToPick, type BomResourcePick, type BomTerm } from '$lib/shop/bomEditor';

  let {
    terms,
    viewerId = '',
    indexes,
    projectId,
    decisionId = null,
    onSigned,
    onPicked
  }: {
    terms: BomTerm[];
    viewerId?: string;
    /** The resources to ask about, when the caller already knows them. */
    indexes?: number[];
    projectId: string;
    decisionId?: string | null;
    onSigned?: (data: any) => unknown;
    onPicked?: (picks: BomResourcePick[]) => unknown;
  } = $props();

  let queue = $state<number[]>([]);
  let picks: BomResourcePick[] = [];
  let sending = false;
  let current = $derived(queue.length ? terms[queue[0]] : null);

  async function finish() {
    if (!decisionId) {
      await onPicked?.(picks);
      return;
    }
    if (sending) return;
    sending = true;
    const res: any = await executeAction('signBomAssignment' as any, { decisionId, picks }, { showErrorToast: false }).catch(() => null);
    sending = false;
    if (!res?.success) {
      toast.error($t('lev.provideAssigned.failed'));
      return;
    }
    await onSigned?.(res.data);
  }

  export function start() {
    picks = [];
    queue = indexes ?? bomResourcesToPick(terms, viewerId);
    if (!queue.length) void finish();
  }

  function chosen(pick: { spId?: string; create?: { myp: number } }) {
    picks.push({ index: queue[0], ...pick });
    queue = queue.slice(1);
    if (!queue.length) void finish();
  }
</script>

{#if current && current.kind === 'add'}
  <!-- To the body: the heart deck's transform would trap a fixed overlay. -->
  <Portal>
    <div class="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={current.name}>
      <div class="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white dark:bg-gray-900">
        <ProvideAssigned askmId="" {projectId} name={current.name} value={current.unit} onChoose={chosen} onCancel={() => (queue = [])} />
      </div>
    </div>
  </Portal>
{/if}
