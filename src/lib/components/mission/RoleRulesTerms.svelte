<script lang="ts">
  /**
   * The rikma's automation rules that come with a mission's roles, shown with
   * its terms before applying (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.3 —
   * like the shift commitment of PLAN_SHIFTS §3.8). Applying from this page
   * agrees to exactly these rules; if one changes later, it asks again.
   */
  import { t } from '$lib/translations';
  import { ruleTermLines, type RoleRuleView } from '$lib/fulfillment/ruleTerms';

  let { rules }: { rules: RoleRuleView[] } = $props();
</script>

{#if rules.length > 0}
  <section class="rrt border border-gold" aria-labelledby="rrt-title">
    <h3 id="rrt-title" class="rrt-title text-barbi">{$t('lev.fulfillRule.roleTerms.title')}</h3>
    <ul class="rrt-rules">
      {#each rules as rule (rule.stepId)}
        <li class="rrt-rule">
          <strong><bdi>{rule.name}</bdi></strong>
          <ul class="rrt-lines">
            {#each ruleTermLines(rule, 'other') as line, i (i)}
              <li><bdi>{$t(line.key, line.params)}</bdi></li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
    <p class="rrt-note">{$t('lev.fulfillRule.roleTerms.note')}</p>
  </section>
{/if}

<style>
  .rrt {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 12px auto 0;
    max-width: 640px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    text-align: start;
  }
  .rrt-title {
    font-size: 1rem;
    font-weight: 700;
  }
  .rrt-rules {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .rrt-rule {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rrt-lines {
    padding-inline-start: 1.1em;
    list-style: disc;
    font-size: 0.9rem;
    line-height: 1.45;
  }
  .rrt-note {
    font-size: 0.85rem;
    opacity: 0.85;
  }
</style>
