<script>
  import { lang } from '$lib/stores/lang.js';
  import ComparisonDisplay from './ComparisonDisplay.svelte';
  import { getProjectData } from '$lib/stores/projectStore';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { t } from '$lib/translations';
  import { get } from 'svelte/store';

  /**
   * @typedef {Object} Props
   * @property {Array} negopendmissions - Array of negotiation missions
   * @property {string} openmissionName - Original mission name
   * @property {number} noofhours - Original number of hours
   * @property {number} perhour - Original per hour rate
   * @property {string} missionDetails - Original mission details
   * @property {string} [hearotMeyuchadot] - Original special notes
   * @property {Object} [acts] - Original acts/tasks
   * @property {string} [projectId] - Project ID for user data lookup
   * @property {any} [location] - Original location object
   * @property {boolean} [isCandidateFlow] - When true the nego rounds are candidate proposals; swap old/new direction
   */

  /** @type {Props} */
  let {
    negopendmissions = [],
    openmissionName,
    noofhours,
    perhour,
    missionDetails,
    hearotMeyuchadot,
    acts,
    projectId,
    location = null,
    isCandidateFlow = false
  } = $props();

  const locLabel = { he: 'מיקום', en: 'Location' };

  function locationSummary(loc) {
    if (!loc) return '—';
    if (loc.location_mode === 'online') return get(t)('location.online');
    const hasPoint = Number.isFinite(loc.lat) && Number.isFinite(loc.lng);
    if (hasPoint) {
      const hint = loc.location_hint?.trim();
      const r = loc.radius || 15;
      return `${hint ? hint + ' · ' : ''}${r} ${get(t)('location.km')}`;
    }
    return loc.location_hint?.trim() || '—';
  }
</script>

{#if negopendmissions && negopendmissions.length > 0}
  <div class="mt-6">
    <div class="mb-2 font-bold text-barbi text-xl lg:text-2xl">
      {isCandidateFlow ? $t('nego.candidateHistory') : $t('nego.history')}
    </div>
    <div class="space-y-3">
      {#each negopendmissions as negoItem}
        {@const attrs = negoItem.attributes}
        {@const byCandidate = attrs.proposedBy === 'candidate'}
        {@const prevLoc = Array.isArray(attrs.location) ? attrs.location[0] : attrs.location}
        {@const roundLabel = isCandidateFlow
          ? (byCandidate ? $t('nego.candidateRound') : $t('nego.projectRound'))
          : $t('nego.proposedBy')}
        {@const old_hours = isCandidateFlow ? noofhours : (attrs.noofhours ?? noofhours)}
        {@const new_hours = isCandidateFlow ? (attrs.noofhours ?? noofhours) : noofhours}
        {@const old_perhour = isCandidateFlow ? perhour : (attrs.perhour ?? perhour)}
        {@const new_perhour = isCandidateFlow ? (attrs.perhour ?? perhour) : perhour}
        {@const old_name = isCandidateFlow ? openmissionName : attrs.name}
        {@const new_name = isCandidateFlow ? attrs.name : openmissionName}
        {@const old_loc = isCandidateFlow ? locationSummary(location) : locationSummary(prevLoc)}
        {@const new_loc = isCandidateFlow ? locationSummary(prevLoc) : locationSummary(location)}
        <div class="border-2 {isCandidateFlow && byCandidate ? 'border-barbi/50 bg-barbi/5' : isCandidateFlow ? 'border-gold/50 bg-gold/5' : 'border-blue-300 bg-blue-50'} rounded-lg p-3">
          <div class="text-sm md:text-base text-gray-600 mb-2 flex flex-wrap items-center gap-2">
            {#if isCandidateFlow}
              <span class="font-bold px-2 py-0.5 rounded-full text-xs {byCandidate ? 'bg-barbi/20 text-barbi' : 'bg-gold/20 text-yellow-700'}">
                {roundLabel}
              </span>
            {:else}
              {roundLabel}
              <span class="font-semibold">
                {getProjectData(
                  projectId,
                  'un',
                  attrs.users_permissions_user?.data?.id
                ) ||
                  attrs.users_permissions_user?.data?.attributes.username ||
                  'Unknown'}
              </span>
            {/if}
            {#if attrs.createdAt && !isNaN(new Date(attrs.createdAt).getTime())}
              <span class="text-xs md:text-sm ml-2">
                {new Date(attrs.createdAt).toLocaleDateString($lang)}
              </span>
            {/if}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            {#if attrs.name && attrs.name !== openmissionName}
              <ComparisonDisplay
                label={$t('common.nameLabel')}
                oldValue={old_name}
                newValue={new_name}
              />
            {/if}

            {#if attrs.noofhours && attrs.noofhours !== noofhours}
              <ComparisonDisplay
                label={$t('common.hoursLabel')}
                oldValue={old_hours}
                newValue={new_hours}
              />
            {/if}

            {#if attrs.perhour && attrs.perhour !== perhour}
              <ComparisonDisplay
                label={$t('common.perhourLabel')}
                oldValue={old_perhour}
                newValue={new_perhour}
              />
            {/if}

            {#if (attrs.perhour && attrs.perhour !== perhour) || (attrs.noofhours && attrs.noofhours !== noofhours)}
              <ComparisonDisplay
                label={$t('common.totalLabel')}
                oldValue={String(old_hours * old_perhour)}
                newValue={String(new_hours * new_perhour)}
              />
            {/if}

            {#if (prevLoc || location) && locationSummary(prevLoc) !== locationSummary(location)}
              <ComparisonDisplay
                label={locLabel[$lang]}
                oldValue={old_loc}
                newValue={new_loc}
              />
            {/if}
          </div>

          {#if attrs.descrip && attrs.descrip !== missionDetails}
            <div class="mt-3 text-sm md:text-base rounded-lg bg-white/70 dark:bg-gray-900/40 p-3">
              <span
                class="font-medium text-blue-700 dark:text-blue-300 text-base md:text-lg"
                >{$t('nego.updatedDescription')}</span
              >
              <div
                class="text-gray-800 dark:text-gray-100 mt-2 text-sm md:text-base leading-relaxed"
              >
                <RichText outpot={attrs.descrip} editable={false} trans={true} />
              </div>
            </div>
          {/if}

          {#if attrs.hearotMeyuchadot && attrs.hearotMeyuchadot !== hearotMeyuchadot}
            <div class="mt-3 text-sm md:text-base rounded-lg bg-white/70 dark:bg-gray-900/40 p-3">
              <span
                class="font-medium text-blue-700 dark:text-blue-300 text-base md:text-lg"
                >{$t('nego.updatedNotes')}</span
              >
              <div
                class="text-gray-800 dark:text-gray-100 mt-2 text-sm md:text-base leading-relaxed"
              >
                <RichText
                  outpot={attrs.hearotMeyuchadot}
                  editable={false}
                  trans={true}
                />
              </div>
            </div>
          {/if}

          <!-- Acts/Tasks Comparison -->
          {#if acts?.data || attrs.acts?.data}
            {@const proposedActs = acts?.data || []}
            {@const originalActs = attrs.acts?.data || []}
            {@const hasActsChanges =
              (proposedActs.length > 0 || originalActs.length > 0) &&
              JSON.stringify(
                proposedActs.map((a) => ({
                  id: a.id,
                  shem: a.attributes.shem,
                  des: a.attributes.des
                }))
              ) !==
                JSON.stringify(
                  originalActs.map((a) => ({
                    id: a.id,
                    shem: a.attributes.shem,
                    des: a.attributes.des
                  }))
                )}

            {#if hasActsChanges}
              <div class="mt-3 text-sm md:text-base">
                <span class="font-medium text-blue-700 text-base md:text-lg"
                  >{$t('nego.tasksChanges')}</span
                >
                <div class="mt-2 space-y-3">
                  <!-- Proposed/Rejected Tasks -->
                  <div class="text-sm md:text-base text-gray-600 font-medium">
                    {$t('nego.proposedRejected')}
                  </div>
                  <div class="line-through text-gray-500 space-y-2">
                    {#if originalActs.length === 0}
                      <div
                        class="bg-gray-100 p-3 rounded text-sm md:text-base italic"
                      >
                        {$t('nego.noTasksOriginally')}
                      </div>
                    {:else}
                      {#each originalActs as act}
                        <div class="bg-gray-100 p-3 rounded">
                          <div class="font-medium text-sm md:text-base">
                            {act.attributes.shem || $t('nego.noName')}
                          </div>
                          {#if act.attributes.des}
                            <div class="text-xs md:text-sm mt-1">
                              {act.attributes.des}
                            </div>
                          {/if}
                        </div>
                      {/each}
                    {/if}
                  </div>

                  <!-- Approved/Final Tasks -->
                  <div
                    class="text-sm md:text-base text-green-700 font-medium mt-3"
                  >
                    {$t('nego.approvedFinal')}
                  </div>
                  <div class="text-green-600 space-y-2">
                    {#if proposedActs.length === 0}
                      <div
                        class="bg-green-50 p-3 rounded border border-green-200 text-sm md:text-base italic"
                      >
                        {$t('nego.noTasksFinal')}
                      </div>
                    {:else}
                      {#each proposedActs as act}
                        <div
                          class="bg-green-50 p-3 rounded border border-green-200"
                        >
                          <div class="font-medium text-sm md:text-base">
                            {act.attributes.shem || $t('nego.noName')}
                          </div>
                          {#if act.attributes.des}
                            <div class="text-xs md:text-sm mt-1">
                              {act.attributes.des}
                            </div>
                          {/if}
                        </div>
                      {/each}
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
