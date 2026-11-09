<script lang="ts">
  /**
   * What an existing product is made of (PLAN_PRODUCT_FORM_UNIFIED, phase 3): its
   * lines, editable or marked for removal, and the pickers for new ones. The form
   * turns this draft into terms (`$lib/shop/bomEditor`); nothing is saved here.
   */
  import { t } from '$lib/translations';
  import Money from '$lib/components/money/Money.svelte';
  import { lbl, inp } from '$lib/components/prPr/missionForm/classes.js';
  import MissionPickerList from './MissionPickerList.svelte';
  import ResourcePickerList from './ResourcePickerList.svelte';
  import type {
    AvailableMission,
    AvailableResource,
    BomLineRow,
    MissionTemplate,
    ProjectMember,
    RecipeMissionRow,
    RecipeResourceRow,
    ResourceTemplate
  } from './types';

  let {
    lines = $bindable([]),
    missions = $bindable([]),
    resources = $bindable([]),
    projectId,
    currency,
    availableMissions = [],
    availableResources = [],
    projectMembers = [],
    missionTemplates = [],
    resourceTemplates = [],
    multiMember = false,
    locked = false,
    sovereign = false,
    isDeal = false
  }: {
    lines: BomLineRow[];
    missions: RecipeMissionRow[];
    resources: RecipeResourceRow[];
    projectId: string;
    currency: string;
    availableMissions?: AvailableMission[];
    availableResources?: AvailableResource[];
    projectMembers?: ProjectMember[];
    missionTemplates?: MissionTemplate[];
    resourceTemplates?: ResourceTemplate[];
    multiMember?: boolean;
    locked?: boolean;
    sovereign?: boolean;
    isDeal?: boolean;
  } = $props();

  // Something already in the recipe is not offered a second time.
  let linked = $derived(new Set(lines.filter((l) => !l.removed && l.linkedId).map((l) => `${l.kind}:${l.linkedId}`)));
  let freeMissions = $derived(availableMissions.filter((m) => !linked.has(`mission:${m.id}`)));
  let freeResources = $derived(availableResources.filter((r) => r.source !== 'pmash' || !linked.has(`resource:${r.id}`)));

  const lineCost = (l: BomLineRow) => (Number(l.amount) || 0) * l.units * (Number(l.unit) || 0);
  const lineName = (l: BomLineRow) => l.name || (l.kind === 'mission' ? $t('offerings.compose.missions') : $t('offerings.compose.resources'));
</script>

<section class="flex flex-col gap-3" aria-labelledby="pf-bom">
  <h3 id="pf-bom" class="m-0 text-sm font-bold text-[#2a1420]">{$t('shopEditor.form.bomTitle')}</h3>

  {#if lines.length}
    <ul class="m-0 flex list-none flex-col gap-2 p-0">
      {#each lines as line (line.id)}
        <li class="flex flex-col gap-2 rounded-xl border border-[#efe6d3] bg-[#fffdf8] px-3 py-2.5 text-sm text-[#2a1420]">
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span class="min-w-0 break-words {line.removed ? 'line-through opacity-60' : ''}" dir="auto">
              {lineName(line)}
              {#if line.open}<span class="ms-1 rounded-full bg-[#fff4e5] px-2 py-0.5 text-xs font-bold text-[#8a4b00]">{$t('shopEditor.form.bomOpen')}</span>{/if}
            </span>
            <span class="flex flex-none items-center gap-3">
              <strong class={line.removed ? 'opacity-60' : ''}><Money amount={lineCost(line)} {currency} /></strong>
              {#if !locked}
                <button type="button" class="min-h-11 text-sm font-bold text-[#c8155f] underline" onclick={() => (line.removed = !line.removed)}>
                  {line.removed ? $t('shopEditor.form.bomRestore') : $t('shopEditor.form.bomRemove')}
                </button>
              {/if}
            </span>
          </div>
          {#if !locked && !line.removed}
            <div class="grid max-w-sm grid-cols-2 gap-2">
              <div>
                <label for="pf-amount-{line.id}" class={lbl}>{line.kind === 'mission' ? $t('shopEditor.form.bomHours') : $t('shopEditor.form.bomQuantity')}</label>
                <input id="pf-amount-{line.id}" class={inp} type="number" min="0" step="any" inputmode="decimal" bind:value={line.amount} />
              </div>
              <div>
                <label for="pf-unit-{line.id}" class={lbl}>{line.kind === 'mission' ? $t('shopEditor.form.bomRate') : $t('shopEditor.form.bomUnitPrice')}</label>
                <input id="pf-unit-{line.id}" class={inp} type="number" min="0" step="any" inputmode="decimal" bind:value={line.unit} />
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else if locked}
    <p class="m-0 text-sm text-[#6b5560]">{$t('shopEditor.form.noLines')}</p>
  {/if}

  {#if locked}
    <p class="m-0 rounded-xl bg-[#fdf9ea] px-3 py-2 text-sm text-[#6b5560]">{$t('shopEditor.form.bomUnread')}</p>
  {:else}
    <!-- The BOM pickers keep their own (dark) look inside this panel. -->
    <div class="pf-bom flex flex-col gap-4 rounded-2xl bg-[#1f1c24] p-3 text-[#f4ecd6] sm:p-4">
      <h4 class="m-0 text-sm font-bold text-[#f1c47a]">{$t('shopEditor.form.bomAddTitle')}</h4>
      <section class="flex flex-col gap-2">
        <h5 class="m-0 text-xs font-bold text-[#f1c47a]">{$t('offerings.compose.missions')}</h5>
        <MissionPickerList bind:rows={missions} {projectId} {currency} availableMissions={freeMissions} {projectMembers} {missionTemplates} {multiMember} adding />
      </section>
      <section class="flex flex-col gap-2">
        <h5 class="m-0 text-xs font-bold text-[#f1c47a]">{$t('offerings.compose.resources')}</h5>
        <ResourcePickerList bind:rows={resources} {projectId} {currency} availableResources={freeResources} {projectMembers} {resourceTemplates} {multiMember} adding />
      </section>
    </div>
    <p class="m-0 text-sm text-[#6b5560]">{sovereign ? $t('shopEditor.form.bomHintAlone') : $t('shopEditor.form.bomHintPartners')}</p>
    <p class="m-0 text-sm text-[#6b5560]">{$t('shopEditor.form.bomRemoveHint')}</p>
    {#if isDeal}
      <p class="m-0 rounded-xl bg-[#fdf9ea] px-3 py-2 text-sm text-[#6b5560]">{$t('shopEditor.form.bomDealHint')}</p>
    {/if}
  {/if}
</section>
