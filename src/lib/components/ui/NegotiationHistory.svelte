<script>
  import { lang } from '$lib/stores/lang.js';
  import ComparisonDisplay from './ComparisonDisplay.svelte';
  import { getProjectData } from '$lib/stores/projectStore';
  import tr from '$lib/translations/tr.json';

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
    location = null
  } = $props();

  const locLabel = { he: 'מיקום', en: 'Location' };

  function locationSummary(loc) {
    if (!loc) return '—';
    if (loc.location_mode === 'online') return $lang === 'he' ? 'אונליין' : 'Online';
    const hasPoint = Number.isFinite(loc.lat) && Number.isFinite(loc.lng);
    if (hasPoint) {
      const hint = loc.location_hint?.trim();
      const r = loc.radius || 15;
      return `${hint ? hint + ' · ' : ''}${r} ${$lang === 'he' ? 'ק״מ' : 'km'}`;
    }
    return loc.location_hint?.trim() || '—';
  }
</script>

{#if negopendmissions && negopendmissions.length > 0}
  <div class="mt-6">
    <div class="mb-2 font-bold text-barbi text-xl lg:text-2xl">
      {tr.nego.history[$lang]}
    </div>
    <div class="space-y-3">
      {#each negopendmissions as nego}
        {@const attrs = nego.attributes}
        {@const prevLoc = Array.isArray(attrs.location) ? attrs.location[0] : attrs.location}
        <div class="border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
          <div class="text-sm md:text-base text-gray-600 mb-2">
            {tr.nego.proposedBy[$lang]}
            <span class="font-semibold">
              {getProjectData(
                projectId,
                'un',
                attrs.users_permissions_user?.data?.id
              ) ||
                attrs.users_permissions_user?.data?.attributes.username ||
                'Unknown'}
            </span>
            <span class="text-xs md:text-sm ml-2">
              {new Date(attrs.createdAt).toLocaleDateString($lang)}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            {#if attrs.name && attrs.name !== openmissionName}
              <ComparisonDisplay
                label={tr.common.nameLabel[$lang]}
                oldValue={attrs.name}
                newValue={openmissionName}
              />
            {/if}

            {#if attrs.noofhours && attrs.noofhours !== noofhours}
              <ComparisonDisplay
                label={tr.common.hoursLabel[$lang]}
                oldValue={attrs.noofhours}
                newValue={noofhours}
              />
            {/if}

            {#if attrs.perhour && attrs.perhour !== perhour}
              <ComparisonDisplay
                label={tr.common.perhourLabel[$lang]}
                oldValue={attrs.perhour}
                newValue={perhour}
              />
            {/if}

            {#if (attrs.perhour && attrs.perhour !== perhour) || (attrs.noofhours && attrs.noofhours !== noofhours)}
              <ComparisonDisplay
                label={tr.common.totalLabel[$lang]}
                oldValue={(attrs.noofhours || noofhours) *
                  (attrs.perhour || perhour)}
                newValue={noofhours * perhour}
              />
            {/if}

            {#if (prevLoc || location) && locationSummary(prevLoc) !== locationSummary(location)}
              <ComparisonDisplay
                label={locLabel[$lang]}
                oldValue={locationSummary(prevLoc)}
                newValue={locationSummary(location)}
              />
            {/if}
          </div>

          {#if attrs.descrip && attrs.descrip !== missionDetails}
            <div class="mt-3 text-sm md:text-base">
              <span class="font-medium text-blue-700 text-base md:text-lg"
                >{tr.nego.updatedDescription[$lang]}</span
              >
              <p class="text-gray-700 mt-2 text-sm md:text-base">
                {attrs.descrip}
              </p>
            </div>
          {/if}

          {#if attrs.hearotMeyuchadot && attrs.hearotMeyuchadot !== hearotMeyuchadot}
            <div class="mt-3 text-sm md:text-base">
              <span class="font-medium text-blue-700 text-base md:text-lg"
                >{tr.nego.updatedNotes[$lang]}</span
              >
              <p class="text-gray-700 mt-2 text-sm md:text-base">
                {attrs.hearotMeyuchadot}
              </p>
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
                  >{tr.nego.tasksChanges[$lang]}</span
                >
                <div class="mt-2 space-y-3">
                  <!-- Proposed/Rejected Tasks -->
                  <div class="text-sm md:text-base text-gray-600 font-medium">
                    {tr.nego.proposedRejected[$lang]}
                  </div>
                  <div class="line-through text-gray-500 space-y-2">
                    {#if originalActs.length === 0}
                      <div
                        class="bg-gray-100 p-3 rounded text-sm md:text-base italic"
                      >
                        {tr.nego.noTasksOriginally[$lang]}
                      </div>
                    {:else}
                      {#each originalActs as act}
                        <div class="bg-gray-100 p-3 rounded">
                          <div class="font-medium text-sm md:text-base">
                            {act.attributes.shem || tr.nego.noName[$lang]}
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
                    {tr.nego.approvedFinal[$lang]}
                  </div>
                  <div class="text-green-600 space-y-2">
                    {#if proposedActs.length === 0}
                      <div
                        class="bg-green-50 p-3 rounded border border-green-200 text-sm md:text-base italic"
                      >
                        {tr.nego.noTasksFinal[$lang]}
                      </div>
                    {:else}
                      {#each proposedActs as act}
                        <div
                          class="bg-green-50 p-3 rounded border border-green-200"
                        >
                          <div class="font-medium text-sm md:text-base">
                            {act.attributes.shem || tr.nego.noName[$lang]}
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
