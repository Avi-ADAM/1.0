<script>
  import { lang } from '$lib/stores/lang.js';
  /**
   * @typedef {Object} Props
   * @property {boolean} [checked]
   * @property {string} [title]
   * @property {(payload: { checked: boolean }) => void} [onChange]
   */

  /** @type {Props} */
  let { checked = $bindable(false), title = 'online', onChange } = $props();
</script>

<div {title} dir="ltr" class="flex justify-center items-center">
  <div class="btn-status">
    <input
      bind:checked
      onchange={() => onChange?.({ checked })}
      type="checkbox"
      name="checkbox"
      id="checkbox"
      class="hidden"
    />
    <label
      for="checkbox"
      style={checked
        ? '--bg-btn: #C6F6D5; --btn-color: #38A169;'
        : '--bg-btn: #fed7d7; --btn-color: #e53e3e;'}
      class="btn-change flex items-center p-1 rounded-lg w-12 h-6 cursor-pointer {checked
        ? 'is-checked'
        : ''}"
    >
      {#if checked}
        <div class="live-animation"></div>
      {/if}
    </label>
  </div>
</div>

<style>
  :root {
    --bg-btn: #fed7d7;
    --btn-color: #e53e3e;
    --live-animation-color: #38a169;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .btn-change.is-checked::before {
    transform: translateX(27px);
  }

  .btn-change {
    background-color: var(--bg-btn);
    position: relative;
    overflow: hidden;
  }

  .btn-change::before {
    content: '';
    display: block;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background-color: var(--btn-color);
    transition: 0.3s;
    transform: translateX(2px);
    position: relative;
    z-index: 1;
  }

  .live-animation {
    position: absolute;
    top: 50%;
    left: 75%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background-color: var(--live-animation-color);
    opacity: 0;
    transform: translate(-50%, -50%);
    z-index: 0;
    animation: pulse 1.5s infinite;
    pointer-events: none; /* To prevent blocking clicks */
  }

  @keyframes pulse {
    0% {
      width: 17px;
      height: 17px;
      opacity: 1;
    }
    100% {
      width: 35px; /* Adjusted size */
      height: 35px; /* Adjusted size */
      opacity: 0;
    }
  }
</style>
