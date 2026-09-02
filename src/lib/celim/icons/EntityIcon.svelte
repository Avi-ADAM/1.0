<script lang="ts">
  /**
   * Draws one entry of the rikma vocabulary (the table lives in
   * `entityIcons.ts`) as a Lucide stroke.
   *
   * The public pages used to spell these out in emoji (🧶 for a rikma, 🛠️ for a
   * mission, 📦 for a resource…). Emoji render differently on every platform,
   * carry a playful tone the money and consent pages should not, and a screen
   * reader announces them by their CLDR name ("ball of yarn") — so they are
   * drawn from one table instead, which also keeps the vocabulary consistent
   * across the discovery pages, the demand map and the public rikma pages.
   *
   * The icon is wrapped in an inline-flex span with a baseline nudge, so a call
   * site can drop it in front of text without touching its own layout.
   *
   * Decorative by default (`aria-hidden`) — the label beside it carries the
   * meaning. Pass `label` only when the icon stands alone.
   */
  import { ENTITY_ICONS, type EntityIconKind } from './entityIcons';

  type Props = {
    /** Which piece of the vocabulary this icon stands for. */
    kind: EntityIconKind;
    /** Stroke box in px. Sized for body text by default. */
    size?: number;
    /** Set only when the icon carries meaning no adjacent text repeats. */
    label?: string;
  };

  let { kind, size = 16, label }: Props = $props();

  const Icon = $derived(ENTITY_ICONS[kind]);
</script>

<span
  class="entity-icon"
  aria-hidden={label ? undefined : 'true'}
  aria-label={label}
  role={label ? 'img' : undefined}
>
  <Icon {size} strokeWidth={1.75} />
</span>

<style>
  .entity-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: -0.18em;
    flex-shrink: 0;
  }
</style>
