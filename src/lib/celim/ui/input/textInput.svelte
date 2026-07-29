<script>
  import { isRtl } from '$lib/translations';
  import { lang } from "$lib/stores/lang";
  /**
   * @typedef {Object} Props
   * @property {string} [text]
   * @property {any} [lebel]
   * @property {any} [label]
   * @property {string} [color]
   * @property {string} [type]
   * @property {string} [autocomplete]
   */

  /** @type {Props} */
  let {
    text = $bindable(""),
    lebel = {"en":"Name", "he":"שם"},
    label = undefined,
    color = "gold",
    type = "text",
    autocomplete = "off"
  } = $props();

  let displayLabel = $derived(
    label ??
    (typeof lebel === 'object' && lebel !== null
      ? (lebel[$lang] || lebel['he'] || lebel['en'] || '')
      : (lebel ?? ''))
  );
</script>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput">
  <input
    name="name"
    bind:value={text}
    {type}
    {autocomplete}
    class="input"
    required
    style={color == "barbi" ? "color:var(--barbi-pink); border-bottom: solid 1px var(--barbi-pink)" : "color:var(--gold); border-bottom: solid 1px var(--gold)"}	
  />
  <label
    for="name"
    style="{color == 'barbi' ? 'color:var(--barbi-pink)' : 'color:var(--gold)'}"
    class="label">{displayLabel}</label
  >
  <span class="line"></span>
</div>


<style>
  .textinput {
    position: relative;
    width: 100%;
    display: block;
    text-align: start;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    -webkit-tap-highlight-color: transparent;
    background: transparent;
    text-align: start;
    direction: inherit;
  }

  .label {
    font-size: 15px;
    position: absolute;
    top: 22px;
    inset-inline-start: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    user-select: none;
    text-align: start;
    direction: inherit;
  }

  .line {
    height: 2px;
    background-color: #2196f3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line {
    width: 100%;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 14px;
    color: turquoise;
    top: 0;
  }
  .input:focus,
  .input:valid {
    border: 0;
  }

  @media (max-width: 600px) {
    .textinput {
      position: relative;
      width: 100%;
      display: block;
    }
  }
</style>
