<script>
  // The rikma's door to golden meetings: with every member, with the holders of
  // a role, or with whoever does a running mission. Each choice opens the
  // meetings app with that meeting filled in (GoldenMeetingLink).
  import { t } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import GoldenMeetingLink from './GoldenMeetingLink.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { buildMeetingGroups } from '$lib/meetings/meetingGroups.js';

  /**
   * @typedef {Object} Props
   * @property {string|number} projectId
   * @property {string} [projectName]
   * @property {Array<string|number>} [memberIds] - known already; "everyone" needs no fetch
   */

  /** @type {Props} */
  let { projectId, projectName = '', memberIds = [] } = $props();

  let open = $state(false);
  let loading = $state(false);
  let failed = $state(false);
  /** @type {import('$lib/meetings/meetingGroups.js').MeetingGroups | null} */
  let groups = $state(null);

  let allIds = $derived(groups?.all.length ? groups.all : memberIds);

  async function load() {
    if (groups || loading) return;
    loading = true;
    failed = false;
    try {
      const res = await sendToSer({ pid: String(projectId) }, '466rikmaMeetingGroups', null, null, false, fetch);
      groups = buildMeetingGroups(res?.data?.project?.data?.attributes);
    } catch (e) {
      console.error('[GoldenMeetingMenu] load failed', e);
      failed = true;
    } finally {
      loading = false;
    }
  }

  function toggle() {
    open = !open;
    if (open) load();
  }

  /** @param {string} scope */
  const scoped = (scope) => $t('common.goldenMeeting.titleScoped', { scope, rikma: projectName });
</script>

<div class="flex flex-col items-center gap-2">
  <button
    type="button"
    onclick={toggle}
    aria-expanded={open}
    class="inline-flex items-center gap-1.5 rounded-full border border-gold px-3 py-1 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-barbi"
  >
    <EntityIcon kind="video" size={15} />
    {$t('common.goldenMeeting.label')}
  </button>

  {#if open}
    <div class="w-full max-w-xl rounded-2xl border border-gold/50 bg-slate-900/80 p-4 text-start backdrop-blur-sm">
      <p class="mb-3 text-xs leading-relaxed text-white/80">{$t('common.goldenMeeting.hint')}</p>

      <div class="flex flex-wrap gap-2">
        <GoldenMeetingLink
          withIds={allIds}
          title={$t('common.goldenMeeting.titleAll', { rikma: projectName })}
          label={$t('common.goldenMeeting.withAll')}
        />
      </div>

      {#if loading}
        <div class="flex justify-center py-3"><Spinner size="sm" /></div>
      {:else if failed}
        <p class="mt-3 text-xs text-white/80">{$t('common.goldenMeeting.loadError')}</p>
      {:else if groups}
        {#if groups.roles.length}
          <h3 class="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-gold">
            {$t('common.goldenMeeting.byRole')}
          </h3>
          <div class="flex flex-wrap gap-2">
            {#each groups.roles as role (role.id)}
              <GoldenMeetingLink
                compact
                withIds={role.ids}
                title={scoped(role.name)}
                label={`${role.name} (${role.ids.length})`}
              />
            {/each}
          </div>
        {/if}

        <h3 class="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-gold">
          {$t('common.goldenMeeting.byMission')}
        </h3>
        {#if groups.missions.length}
          <div class="flex flex-wrap gap-2">
            {#each groups.missions as m (m.id)}
              <GoldenMeetingLink
                compact
                withIds={[m.holderId]}
                title={scoped(m.name)}
                label={`${m.name} · ${m.holderName}`}
              />
            {/each}
          </div>
        {:else}
          <p class="text-xs text-white/80">{$t('common.goldenMeeting.empty')}</p>
        {/if}
      {/if}
    </div>
  {/if}
</div>
