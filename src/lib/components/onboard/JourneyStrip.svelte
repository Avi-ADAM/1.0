<script>
  /** @type {{ stepIdx: number, totalSteps?: number, label?: string }} */
  let { stepIdx, totalSteps = 6, label = '' } = $props();

  let progress = $derived(
    stepIdx === 0 ? 0 : Math.min((stepIdx - 0.5) / (totalSteps - 1), 1)
  );
  let stepLabel = $derived(label || `שלב ${stepIdx} מתוך ${totalSteps}`);
</script>

<div class="j-strip">
  <div class="j-end">
    <span class="icn">🚩</span>
    <span class="lbl">התחלה</span>
  </div>

  <div class="j-col">
    <div class="j-dots">
      {#each Array(totalSteps) as _, i (i)}
        <div
          class="j-dot"
          class:done={i + 1 < stepIdx}
          class:active={i + 1 === stepIdx}
        ></div>
      {/each}
    </div>
    <div class="j-track">
      <div class="j-fill" style="width: {progress * 100}%"></div>
      <div class="j-key" style="inset-inline-start: {progress * 100}%">
        <svg viewBox="0 0 60 28" width="54" height="22">
          <defs>
            <linearGradient id="rkg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFD700" />
              <stop offset="50%" stop-color="#E91E8C" />
              <stop offset="100%" stop-color="#DAA520" />
            </linearGradient>
          </defs>
          <circle cx="46" cy="14" r="9" fill="url(#rkg)" stroke="#FFD700" stroke-width="1.5" />
          <circle cx="46" cy="14" r="3.5" fill="#fde8f0" />
          <rect x="6" y="11" width="34" height="6" rx="2" fill="url(#rkg)" stroke="#FFD700" stroke-width="1" />
          <rect x="8" y="17" width="4" height="6" fill="url(#rkg)" />
          <rect x="16" y="17" width="4" height="4" fill="url(#rkg)" />
        </svg>
      </div>
    </div>
    <div class="j-label">{stepLabel}</div>
  </div>

  <div class="j-end">
    <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="brg-strip" cx="50%" cy="40%" r="60%">
          <stop offset="0" stop-color="#FFD700" />
          <stop offset="0.5" stop-color="#FFA0C0" />
          <stop offset="1" stop-color="#FF82A0" />
        </radialGradient>
      </defs>
      <path
        d="M32 8 C 18 8, 10 18, 12 26 C 8 30, 8 38, 14 42 C 14 50, 22 56, 32 56 C 42 56, 50 50, 50 42 C 56 38, 56 30, 52 26 C 54 18, 46 8, 32 8 Z"
        fill="url(#brg-strip)" stroke="#DAA520" stroke-width="1.6"
      />
      <path d="M32 14 Q 28 22 32 30 Q 36 38 32 50" stroke="#aa771c" stroke-width="1.2" fill="none" opacity="0.5" />
      <path d="M22 22 Q 26 26 24 32" stroke="#aa771c" stroke-width="1" fill="none" opacity="0.4" />
      <path d="M42 22 Q 38 26 40 32" stroke="#aa771c" stroke-width="1" fill="none" opacity="0.4" />
    </svg>
    <span class="lbl">יעד 💗</span>
  </div>
</div>

<style>
  .j-key {
    position: absolute;
    top: 50%;
    margin-top: -12px;
    transform: translateX(50%) rotate(-6deg);
    filter: drop-shadow(0 2px 7px rgba(218, 165, 32, 0.65));
    pointer-events: none;
    transition: inset-inline-start 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
</style>
