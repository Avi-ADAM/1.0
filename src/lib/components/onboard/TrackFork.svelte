<script>
  import { goto } from '$app/navigation';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { lang } from '$lib/stores/lang.js';

  let selected = $state(/** @type {'provider' | 'business' | null} */ (null));

  const tracks = [
    {
      id: 'provider',
      emoji: '🛠',
      he: 'נותן/ת שירות',
      en: 'Service Provider',
      sub_he: 'פרילנסר, עצמאי/ת, מציע/ה כישורים ושירותים לאחרים',
      sub_en: 'Freelancer, independent, offering skills & services',
      path: '/onboard/provider'
    },
    {
      id: 'business',
      emoji: '🏢',
      he: 'בעל/ת עסק קיים',
      en: 'Business Owner',
      sub_he: 'עסק מוקם — מוצרים, שירותים, שותפות, ספק מוסדי',
      sub_en: 'Established business — products, services, partnerships',
      path: '/onboard/business'
    }
  ];

  function choose(track) {
    selected = track.id;
    setTimeout(() => goto(track.path), 280);
  }
</script>

<div class="fork-wrap" dir={$lang === 'en' ? 'ltr' : 'rtl'}>
  <!-- title plaque -->
  <div class="plaque" in:fly={{ y: -16, duration: 500, delay: 100, easing: quintOut }}>
    <span class="plaque-title">
      {$lang === 'en' ? 'How would you like to join?' : 'איך תרצו להצטרף?'}
    </span>
    <span class="plaque-sub">
      {$lang === 'en'
        ? 'Choose your track — you can change it later'
        : 'בחרו את המסלול שלכם — אפשר לשנות אחר כך'}
    </span>
  </div>

  <!-- option cards -->
  <div class="options">
    {#each tracks as track, i}
      <button
        class="opt-card"
        class:selected={selected === track.id}
        onclick={() => choose(track)}
        in:fly={{ y: 24, duration: 550, delay: 200 + i * 80, easing: quintOut }}
      >
        <span class="opt-emoji">{track.emoji}</span>
        <span class="opt-title">{track[$lang === 'en' ? 'en' : 'he']}</span>
        <span class="opt-sub">
          {track[$lang === 'en' ? 'sub_en' : 'sub_he']}
        </span>
        {#if selected === track.id}
          <span class="opt-check" in:scale={{ duration: 200 }}>✓</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- skip -->
  <a
    href="/me"
    class="skip-link"
    in:fly={{ y: 10, duration: 400, delay: 500, easing: quintOut }}
  >
    {$lang === 'en' ? 'Skip — go to profile' : 'דלגו — עברו לפרופיל'}
  </a>
</div>

<style>
  :root {
    --gd: #aa771c;
    --gw: #ffd700;
    --ga: #bf953f;
    --gb: #fcf6ba;
    --ink: #574010;
    --pk: #e91e8c;
    --pk-d: #c8155f;
  }

  .fork-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 8px 0 4px;
  }

  /* plaque */
  .plaque {
    padding: 12px 22px;
    background: linear-gradient(135deg, var(--ga), var(--gb) 25%, #b38728 50%, var(--gb) 75%, var(--gd));
    border-radius: 16px 5px 16px 5px;
    border: 1.5px solid rgba(87, 64, 16, 0.38);
    box-shadow:
      0 5px 18px rgba(122, 98, 0, 0.35),
      inset 1px 1px 0 rgba(255, 255, 255, 0.6);
    text-align: center;
    max-width: 340px;
  }
  .plaque-title {
    display: block;
    font-family: 'Heebo', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--pk-d);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
    line-height: 1.25;
  }
  .plaque-sub {
    display: block;
    font-size: 11px;
    color: var(--ink);
    opacity: 0.65;
    margin-top: 3px;
  }

  /* options grid */
  .options {
    display: flex;
    gap: 12px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .opt-card {
    position: relative;
    flex: 1;
    min-width: 150px;
    max-width: 220px;
    padding: 20px 16px;
    background: rgba(255, 255, 255, 0.72);
    border: 1.5px solid rgba(218, 165, 32, 0.4);
    border-radius: 22px;
    cursor: pointer;
    transition: all 0.22s ease;
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 5px;
    box-shadow: 0 4px 16px rgba(218, 165, 32, 0.1);
    font-family: 'Heebo', sans-serif;
  }
  .opt-card:hover {
    transform: translateY(-3px);
    border-color: var(--pk);
    box-shadow: 0 8px 28px rgba(233, 30, 140, 0.22);
  }
  .opt-card.selected {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(233, 30, 140, 0.1));
    border-color: var(--pk);
    box-shadow: 0 6px 22px rgba(233, 30, 140, 0.28), 0 0 0 3px rgba(233, 30, 140, 0.13);
  }

  .opt-emoji {
    font-size: 2.2rem;
    line-height: 1;
    display: block;
    margin-bottom: 4px;
  }
  .opt-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--pk-d);
    line-height: 1.2;
  }
  .opt-sub {
    font-size: 11px;
    color: var(--ink);
    line-height: 1.45;
    opacity: 0.75;
  }
  .opt-check {
    position: absolute;
    top: 10px;
    inset-inline-start: 12px;
    width: 22px;
    height: 22px;
    background: linear-gradient(135deg, var(--gd), var(--pk));
    color: #fff;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* skip */
  .skip-link {
    font-size: 12px;
    font-weight: 600;
    color: #9a6b10;
    text-decoration: underline;
    opacity: 0.75;
    transition: opacity 0.15s, color 0.15s;
  }
  .skip-link:hover {
    opacity: 1;
    color: var(--pk);
  }

  @media (max-width: 420px) {
    .options { flex-direction: column; align-items: center; }
    .opt-card { max-width: 100%; width: 100%; }
  }
</style>
