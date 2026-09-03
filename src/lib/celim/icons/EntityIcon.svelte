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
   *
   * ## Colour: pick the `tone` from the SURFACE, not the theme
   *
   * A Lucide stroke is `currentColor`, where the emoji it replaced carried its
   * own colours and so was visible on anything. `body` sets `color: var(--text)`,
   * and --text is PALE in three of the four theme×mode combinations (personal
   * light and dark, business dark). So an icon that merely inherits goes
   * invisible on any surface hard-coded pale — which is most of the homepage's
   * cards (`bg-cyan-50/70` and friends, which carry no `dark:` variant).
   *
   *   inherit  the parent already sets an explicit colour the icon should match
   *            — a `bg-barbi text-gold` button, a `text-amber-700` line. Also
   *            the only tone that follows a hover that recolours the label.
   *   brand    ink on a PALE surface. --barbi-pink is the palette's designated
   *            ink for exactly this ("the pale cards where `text-barbi`
   *            overwhelmingly sits" — see the appearance layer in app.postcss);
   *            it is dark in all four combinations and flips personal↔business.
   *   onDark   a surface that is dark in every theme, such as the phone mockup
   *            in ProductPeek, where the neighbouring text is `text-white`.
   */
  import { ENTITY_ICONS, type EntityIconKind } from './entityIcons';

  type Props = {
    /** Which piece of the vocabulary this icon stands for. */
    kind: EntityIconKind;
    /** Stroke box in px. Sized for body text by default. */
    size?: number;
    /** Chosen by the surface the icon sits on — see the note above. */
    tone?: 'inherit' | 'brand' | 'onDark';
    /** Set only when the icon carries meaning no adjacent text repeats. */
    label?: string;
  };

  let { kind, size = 16, tone = 'inherit', label }: Props = $props();

  const Icon = $derived(ENTITY_ICONS[kind]);
</script>

<span
  class="entity-icon"
  class:tone-brand={tone === 'brand'}
  class:tone-onDark={tone === 'onDark'}
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

  /* `inherit` deliberately sets nothing, so the icon keeps following the
     parent's colour — including a hover that recolours it. */
  .tone-brand {
    color: var(--barbi-pink);
  }
  .tone-onDark {
    color: rgb(255 255 255 / 0.85);
  }
</style>
