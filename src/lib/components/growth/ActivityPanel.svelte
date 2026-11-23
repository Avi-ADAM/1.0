<script lang="ts">
  import { t } from '$lib/translations';
  import { errorKey, runGrowth } from '$lib/growth/client';
  import type { Prospect } from '$lib/growth/types';

  let { prospect, uid }: { prospect: Prospect; uid: string } = $props();
  let note = $state('');
  let busy = $state(false);
  let err = $state<string | null>(null);

  async function add() {
    busy = true;
    err = null;
    const r = await runGrowth('growthLogActivity', { id: prospect.id, kind: 'note', text: note });
    busy = false;
    if (r.ok) note = '';
    else err = (r as Extract<typeof r, { ok: false }>).code;
  }
</script>

<section class="gr-card sh-card" aria-labelledby="gr-log-h">
  <h2 id="gr-log-h">{$t('growth.log.title')}</h2>
  <div class="gr-row">
    <input class="sh-input" style="flex:1 1 200px" bind:value={note} maxlength="2000" placeholder={$t('growth.log.notePlaceholder')} />
    <button class="sh-btn sh-btn-quiet" onclick={add} disabled={busy || !note.trim()}>{$t('growth.log.add')}</button>
  </div>
  {#if err}<p class="gr-error" role="alert">{$t(errorKey(err))}</p>{/if}
  <ul class="gr-log">
    {#each prospect.activity as a (a.id)}
      <li>
        <span>
          <strong>{$t(`growth.activity.${a.kind}`)}</strong>
          {#if a.kind === 'stage' && a.from && a.to}: {$t(`growth.stage.${a.from}`)} → {$t(`growth.stage.${a.to}`)}{/if}
          {#if a.channel}· {$t(`growth.channel.${a.channel}`)}{/if}
          {#if a.response}· {$t(`growth.response.${a.response}`)}{/if}
        </span>
        {#if a.text}<span class="gr-muted" dir="auto">{a.text}</span>{/if}
        <span class="gr-muted gr-small">
          {new Date(a.at).toLocaleString()} · {a.by === uid ? $t('growth.log.you') : a.by ? `#${a.by}` : $t('growth.log.system')}
        </span>
      </li>
    {/each}
  </ul>
</section>
