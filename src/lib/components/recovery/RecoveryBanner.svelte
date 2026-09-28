<script lang="ts">
  /**
   * The nudge toward T9 guardians (PLAN_T9_SOCIAL_RECOVERY §9, decision 3):
   * not an onboarding step, a banner — shown at the end of onboarding and on
   * the settings page — that sends whoever clicks it to /me/settings/recovery.
   */
  import { t } from '$lib/translations';
</script>

<div
  class="flex w-full items-center justify-between gap-3 flex-wrap rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
>
  <div class="min-w-0 flex-1">
    <p class="font-medium text-goldink">🛡️ {$t('recovery.banner.title')}</p>
    <p class="text-sm text-zinc-500">{$t('recovery.banner.desc')}</p>
  </div>
  <a
    href="/me/settings/recovery"
    data-sveltekit-prefetch
    class="shrink-0 px-4 py-2 rounded-full border border-goldink text-goldink font-bold hover:bg-goldink/10"
  >
    {$t('recovery.banner.cta')}
  </a>
</div>
