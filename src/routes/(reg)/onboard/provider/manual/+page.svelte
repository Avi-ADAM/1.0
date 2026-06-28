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

    // Seed the wizard's stores so Bein loads pre-selected items instead of an
    // empty wizard. Two sources are merged:
    //  • the user's EXISTING profile vocab (loaded server-side in +page.server.js)
    //    — so existing users editing their profile, or skipping the AI steps
    //    straight to here, see what they already have.
    //  • the AI-confirmed ids from the cv/describe flow (onboard.cvSavedIds).
    // Ids are de-duplicated (as strings) so an item kept by both sources appears
    // once, and the persisted set is the union (never wiping existing items).
    try {
      const existing = page?.data?.existingIds ?? {};

      let saved = {};
      const raw = sessionStorage.getItem('onboard.cvSavedIds');
      if (raw) saved = JSON.parse(raw) || {};

      const merge = (a, b) => [
        ...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].map(String))
      ];

      const skills = merge(existing.skills, saved.skills);
      const roles = merge(existing.roles, saved.roles);
      const methods = merge(existing.methods, saved.methods);
      const vallues = merge(existing.vallues, saved.vallues);

      if (skills.length) skills1.set(skills);
      if (roles.length) roles2.set(roles);
      if (methods.length) workways1.set(methods);
      if (vallues.length) valluss.set(vallues);
    } catch {
      // ignore — Bein will simply start empty
    }

    // Keep the current step if mid-wizard (steps 1-4 are valid for onboarding).
    // Reset to 1 if:
    //  • show === 0  →  fresh entry
    //  • show > 4   →  stale value left over from the registration flow
    //                  (steps 5 / 6 are registration-only and would show the
    //                  wrong screen or auto-redirect away)
    const currentShow = get(show);
    if (currentShow < 1 || currentShow > 4) {
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
