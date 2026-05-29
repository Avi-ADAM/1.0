<script>
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import ScreenFrame from '$lib/components/onboard/ScreenFrame.svelte';
  import JourneyStrip from '$lib/components/onboard/JourneyStrip.svelte';
  import Plaque from '$lib/components/onboard/Plaque.svelte';

  let email = $state('');
  let resent = $state(false);
  let resending = $state(false);

  onMount(() => {
    const match = document.cookie.split('; ').find((r) => r.startsWith('email='));
    if (match) email = decodeURIComponent(match.split('=')[1]);
  });

  async function resend() {
    if (!email || resending) return;
    resending = true;
    try {
      await fetch('/api/auth/send-email-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      resent = true;
    } catch {
      // silent
    } finally {
      resending = false;
    }
  }
</script>

<svelte:head>
  <title>בדקו את המייל · 1💗1</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&family=Cinzel:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<ScreenFrame>
  {#snippet journey()}
    <JourneyStrip stepIdx={2} totalSteps={6} label="שלב 2 · אישור מייל" />
  {/snippet}

  <div class="content" in:scale={{ duration: 600, opacity: 0.5, start: 0.96, easing: quintOut }}>
    <div class="heart-bg">
      <svg class="heart-shape" viewBox="0 0 320 280" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hp-ce" patternUnits="userSpaceOnUse" width="18" height="20">
            <path
              d="M9 16 C 2 11, 0 6, 4 3 C 6 1, 9 3, 9 6 C 9 3, 12 1, 14 3 C 18 6, 16 11, 9 16 Z"
              fill="url(#hg-ce)"
              stroke="#854d0e"
              stroke-width="0.4"
            />
          </pattern>
          <linearGradient id="hg-ce" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#facc15" />
            <stop offset="30%" stop-color="#c026d3" />
            <stop offset="60%" stop-color="#0891b2" />
            <stop offset="100%" stop-color="#be185d" />
          </linearGradient>
          <linearGradient id="hg2-ce" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fcd34d" />
            <stop offset="50%" stop-color="#a21caf" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </linearGradient>
        </defs>
        <path
          d="M160 250 C 100 220, 30 180, 30 110 C 30 60, 70 30, 110 30 C 135 30, 155 50, 160 70 C 165 50, 185 30, 210 30 C 250 30, 290 60, 290 110 C 290 180, 220 220, 160 250 Z"
          fill="url(#hp-ce)"
          stroke="url(#hg2-ce)"
          stroke-width="3"
        />
      </svg>
      <span class="envelope">
        <span class="float" style="display: inline-block;">✉️</span>
      </span>
    </div>

    <Plaque title="המייל בדרך" sub="ניצור חיבור — תכף תקבלו לינק" />

    <div class="tile-info">
      שלחנו אליכם מייל ל-{#if email}<b dir="ltr">{email}</b>{/if}<br />
      לחצו על הקישור במייל כדי לאשר ולפתוח את הדלת. הקישור תקף שעה.
    </div>

    {#if resent}
      <p class="resent-msg" in:fly={{ y: -4, duration: 300 }}>✓ מייל נשלח שוב!</p>
    {:else}
      <div class="actions">
        <button class="btn btn-ghost" onclick={resend} disabled={resending || !email}>
          {resending ? '⟳ שולח...' : '📨 לא הגיע — שליחה חוזרת'}
        </button>
        <a href="/signup" class="btn btn-skip">✏️ תיקון כתובת</a>
      </div>
    {/if}

    <div class="spam-tip">בודקים בתיבת הספאם? לפעמים גוגל מסתיר אותנו שם.</div>

    <div class="footer">
      אחרי האישור, <a href="/login" class="link">לחצו להתחבר</a>
    </div>
  </div>
</ScreenFrame>

<style>
  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 12px 8px;
  }
  .heart-bg {
    position: relative;
    width: 220px;
    height: 190px;
  }
  .heart-shape {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 6px 20px rgba(190, 24, 93, 0.22));
    animation: heartbeat 3s ease-in-out infinite;
  }
  .envelope {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    filter: drop-shadow(0 4px 10px rgba(190, 24, 93, 0.35));
    pointer-events: none;
  }
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    40% { transform: scale(1.04); }
    60% { transform: scale(0.97); }
  }
  .resent-msg {
    font-size: 13px;
    font-weight: 700;
    color: #15803d;
    margin: 0;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .spam-tip {
    font-size: 11.5px;
    color: #9a6b10;
    text-align: center;
    opacity: 0.85;
  }
  .footer {
    font-size: 12.5px;
    color: #9a6b10;
  }
  .link {
    color: var(--pink-deep, #c8155f);
    font-weight: 700;
    text-decoration: underline;
  }
</style>
