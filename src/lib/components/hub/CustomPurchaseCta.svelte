<script lang="ts">
  import { t } from '$lib/translations';

  const L = (key: string): string => $t(`hub.${key}`);

  let labels = $derived({
    text: L('customPurchaseText'),
    sub: L('customPurchaseSub'),
    btn: L('startBtn')
  });
</script>

<a
  href="/concierge/new"
  class="gold group relative flex items-center gap-3 px-4 py-4 rounded-2xl no-underline overflow-hidden
         transition-transform active:scale-[0.98]"
>
  <!-- a slow glint travels across the metal -->
  <span class="glint pointer-events-none absolute inset-0" aria-hidden="true"></span>

  <span class="relative text-2xl shrink-0">✨</span>
  <span class="relative flex-1 min-w-0">
    <span class="block text-sm font-bold text-[#3b2604] leading-tight">{labels.text}</span>
    <span class="block text-xs text-[#5a3b08] mt-0.5 truncate">{labels.sub}</span>
  </span>
  <span
    class="relative shrink-0 text-xs font-bold text-[#fbeec0] bg-[#3b2604]/90 rounded-full px-3 py-1.5 whitespace-nowrap
           shadow-[inset_0_1px_0_rgba(255,236,170,0.25)]"
  >{labels.btn}</span>
</a>

<style>
  /* Polished gold: one smooth light-to-deep ramp (no visible bands), a soft
     specular bloom from above, and bevelled edges from inset highlights. The
     old 9-stop goldTobr striped visibly at this size. */
  .gold {
    background:
      radial-gradient(130% 110% at 28% -10%, rgba(255, 252, 232, 0.9) 0%, rgba(255, 244, 200, 0.35) 32%, transparent 60%),
      radial-gradient(90% 120% at 100% 120%, rgba(122, 78, 10, 0.45) 0%, transparent 60%),
      linear-gradient(165deg, #f8e8a6 0%, #eccb6c 30%, #d6a53c 58%, #bb8726 82%, #a9761d 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      inset 0 -1px 0 rgba(96, 60, 6, 0.55),
      inset 0 0 0 1px rgba(255, 238, 180, 0.4),
      0 12px 30px -12px rgba(222, 170, 60, 0.75),
      0 2px 8px -3px rgba(0, 0, 0, 0.45);
  }
  .gold:hover {
    filter: brightness(1.04) saturate(1.05);
  }

  .glint {
    background: linear-gradient(
      105deg,
      transparent 30%,
      rgba(255, 255, 255, 0) 40%,
      rgba(255, 255, 255, 0.55) 50%,
      rgba(255, 255, 255, 0) 60%,
      transparent 70%
    );
    transform: translateX(-110%);
    animation: glint 6s cubic-bezier(0.4, 0, 0.2, 1) 1.2s infinite;
    mix-blend-mode: soft-light;
  }
  @keyframes glint {
    0% {
      transform: translateX(-110%);
    }
    22%,
    100% {
      transform: translateX(110%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .glint {
      animation: none;
      display: none;
    }
  }
</style>
