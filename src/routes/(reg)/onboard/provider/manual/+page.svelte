<script>
  import Bein from '$lib/components/main/bein.svelte';
  import { show } from '$lib/components/registration/store-show.js';
  import { skills1 } from '$lib/components/registration/skills1.js';
  import { roles2 } from '$lib/components/registration/roles2.js';
  import { workways1 } from '$lib/components/registration/workways1.js';
  import { valluss } from '$lib/components/registration/valluss.js';
  import { userName } from '$lib/stores/store.js';
  import { page } from '$app/state';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  onMount(() => {
    // Bein's children (skills/vallues/...) read $userName for the greeting.
    // In the registration flow it's set by amana.svelte, but onboarding skips
    // that step — pull the name from the `un` cookie exposed by the (reg)
    // layout, falling back to the raw cookie if SSR data isn't there.
    try {
      let un = page?.data?.un || '';
      if (!un && typeof document !== 'undefined') {
        const m = document.cookie.split('; ').find((r) => r.startsWith('un='));
        if (m) un = m.split('=')[1];
      }
      if (un) {
        const decoded = decodeURIComponent(un);
        if (decoded && decoded !== 'false') userName.set(decoded);
      }
    } catch {
      // ignore — fall back to the default greeting
    }

    // Seed the wizard's stores from the saved selection so Bein loads the
    // user's AI-confirmed items pre-selected (instead of an empty wizard).
    try {
      const raw = sessionStorage.getItem('onboard.cvSavedIds');
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids.skills) && ids.skills.length) skills1.set(ids.skills);
        if (Array.isArray(ids.roles) && ids.roles.length) roles2.set(ids.roles);
        if (Array.isArray(ids.methods) && ids.methods.length) workways1.set(ids.methods);
        if (Array.isArray(ids.vallues) && ids.vallues.length) valluss.set(ids.vallues);
      }
    } catch {
      // ignore — Bein will simply start empty
    }

    // Only start from step 1 on a fresh entry. If we're already inside the
    // wizard (e.g. user navigated back via browser, or refreshed mid-flow),
    // keep them on the current step instead of resetting.
    if (get(show) === 0) {
      show.set(1);
    }
  });
</script>

<svelte:head>
  <title>פרופיל ספק · 1💗1</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="back-bar">
  <a href="/onboard/provider/review" class="back-link">← חזרה לסקירה</a>
  <a href="/onboard/done" class="back-link skip">דלגו לסיום</a>
</div>

<div class="bein-wrap">
  <Bein mode="onboarding" />
</div>

<style>
  .back-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    background: rgba(255, 248, 220, 0.75);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(218, 165, 32, 0.25);
    font-family: 'Heebo', sans-serif;
    direction: rtl;
  }
  /* Offset Bein's sticky tabs by the back-bar height so the two sticky rows
     stack instead of overlapping when the user scrolls the wizard content. */
  .bein-wrap {
    --bein-tabs-top: 44px;
  }
  .back-link {
    font-size: 13px;
    font-weight: 700;
    color: #574010;
    text-decoration: underline;
    opacity: 0.85;
  }
  .back-link.skip { opacity: 0.7; font-weight: 600; }
  .back-link:hover {
    color: #e91e8c;
    opacity: 1;
  }
</style>
