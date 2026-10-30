<script>
  // A door into the meetings app with a golden meeting already filled in.
  // Meetings are managed only there (magik-meetings); this app never renders a
  // meeting page of its own.
  import { t } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { goldenMeetingHref } from '$lib/meetings/goldenMeeting.js';

  /**
   * @typedef {Object} Props
   * @property {Array<string|number|null|undefined>} [withIds] - who to invite (the creator is added there)
   * @property {string} [title] - the meeting's suggested name
   * @property {string} [label] - visible text; defaults to "Golden meeting"
   * @property {boolean} [compact] - icon + short label, for tight rows
   */

  /** @type {Props} */
  let { withIds = [], title = '', label = '', compact = false } = $props();

  let href = $derived(goldenMeetingHref({ withIds, title }));
</script>

<a
  {href}
  target="_blank"
  rel="noopener"
  title={$t('common.goldenMeeting.opensSite')}
  class="gm-link inline-flex items-center gap-1.5 rounded-full border border-gold font-semibold text-gold transition-colors hover:bg-gold hover:text-barbi {compact
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1.5 text-sm'}"
>
  <EntityIcon kind="video" size={compact ? 13 : 15} />
  <span>{label || $t('common.goldenMeeting.label')}</span>
</a>
