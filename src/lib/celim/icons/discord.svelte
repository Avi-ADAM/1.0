<script>
  /**
   * Discord's wordmark-free brand glyph, for a rikma's Discord link on the
   * public pages. Sits alongside `whatsapp.svelte` / `github.svelte`, which the
   * same social row uses. Inherits `currentColor` so the row can theme it.
   *
   * @typedef {Object} Props
   * @property {number} [width]
   */

  /** @type {Props} */
  let { width = 20 } = $props();
</script>

<svg viewBox="0 0 24 24" {width} aria-hidden="true" focusable="false">
  <path
    fill="currentColor"
    d="M20.317 4.369A19.79 19.79 0 0 0 15.432 3a13.9 13.9 0 0 0-.617 1.267a18.4 18.4 0 0 0-5.63 0A13 13 0 0 0 8.56 3a19.7 19.7 0 0 0-4.886 1.372C.535 9.046-.32 13.605.106 18.1a19.9 19.9 0 0 0 6.01 3.04q.73-.994 1.286-2.1a13 13 0 0 1-2.025-.973q.255-.187.497-.383a14.2 14.2 0 0 0 12.264 0q.245.212.496.383a13 13 0 0 1-2.028.974a14 14 0 0 0 1.287 2.098a19.8 19.8 0 0 0 6.014-3.04c.5-5.211-.854-9.729-3.59-13.73M8.02 15.331c-1.183 0-2.157-1.086-2.157-2.42s.955-2.42 2.157-2.42s2.176 1.086 2.156 2.42c0 1.334-.955 2.42-2.156 2.42m7.975 0c-1.183 0-2.157-1.086-2.157-2.42s.955-2.42 2.157-2.42s2.176 1.086 2.156 2.42c0 1.334-.955 2.42-2.156 2.42"
  />
</svg>

<style>
  svg {
    color: #5865f2;
  }
  svg:hover {
    color: var(--barbi-pink);
  }
</style>
