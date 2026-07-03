<script>
  import { fade, scale } from 'svelte/transition';
  import { isRtl } from '$lib/translations';

  /**
   * מודל וידאו כמעט מסך‑מלא עם הטמעת יוטיוב שמתחילה אוטומטית ברגע הפתיחה.
   * ה‑iframe מותקן רק כשהמודל פתוח — כך הסרטון נטען ומתנגן מיד עם הלחיצה,
   * ואין הטמעה כבדה באמצע העמוד.
   */
  let {
    open = $bindable(false),
    videoId = '',
    title = '',
    closeLabel = ''
  } = $props();

  // כתובת הטמעה עם ניגון אוטומטי ברגע הטעינה
  let embedSrc = $derived(
    videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
      : ''
  );

  function close() {
    open = false;
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={open ? onKeydown : undefined} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-[900] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
    dir={$isRtl ? 'rtl' : 'ltr'}
    transition:fade={{ duration: 180 }}
    onclick={close}
  >
    <!-- כפתור סגירה -->
    <button
      type="button"
      onclick={close}
      aria-label={closeLabel || 'close'}
      title={closeLabel || 'close'}
      class="absolute top-3 end-3 z-[910] w-11 h-11 flex items-center justify-center rounded-full bg-white/90 text-barbi hover:bg-gold hover:text-white shadow-lg transition-all duration-200 hover:scale-110"
    >
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>

    <!-- מיכל הווידאו — כמעט מסך מלא, יחס 16:9 -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gold/60 bg-black"
      transition:scale={{ duration: 220, start: 0.92 }}
      onclick={(e) => e.stopPropagation()}
    >
      <iframe
        class="absolute inset-0 w-full h-full"
        src={embedSrc}
        {title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
  </div>
{/if}
