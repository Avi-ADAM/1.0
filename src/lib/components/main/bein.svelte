<script>
  import { userName } from '../../stores/store.js';
  import { show } from '../registration/store-show.js';
  import Hello from '../registration/hello.svelte';
  import Password from '../registration/password.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { scale, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Skills from '../registration/skills.svelte';
  import Workways from '../registration/workways.svelte';
  import Roles from '../registration/roles.svelte';
  import Vallues from '../registration/vallues.svelte';
  import { spring } from 'svelte/motion';

  let show_value = $state(0);
  show.subscribe((newValue) => {
    show_value = newValue;
  });

  /** @type {{ idx?: number }} */
  let { idx = 1 } = $props();

  let w = $state(1);
  const txx = spring(600 + (() => w * 20), { stiffness: 0.55, damping: 0.99 });

  function add(event) {
    txx.set(event.tx + w * event.txx);
  }

  // 0→1 progress fraction over steps 1–5
  let progress = $derived(
    show_value >= 1 ? Math.min((show_value - 1) / 4, 1) : 0
  );

  // Tab definitions — can only navigate backward
  const tabDefs = [
    { icon: '💡', he: 'ערכים', en: 'Values', step: 1 },
    { icon: '🛠', he: 'כישורים', en: 'Skills', step: 2 },
    { icon: '🎭', he: 'תפקידים', en: 'Roles', step: 3 },
    { icon: '🌿', he: 'סגנון', en: 'Style', step: 4 },
    { icon: '🔑', he: 'סיסמה', en: 'Password', step: 5 }
  ];

  function goToTab(step) {
    if (step < show_value) {
      show.set(step);
    }
  }

  let title = { he: 'הרשמה ל-1💗1', en: '1💗1 registration' };
  let tu = {
    he: 'מייל אישור נשלח. תודה',
    en: 'please check your email, thank you'
  };
  let see = { he: 'ולהתראות בקרוב', en: 'see you soon!' };
  const buttn = {
    he: 'לכל בעיה לחצו לשלוח לנו מייל',
    en: 'if you did not receive please click here to contact us'
  };
</script>

<svelte:head>
  <title>{title[$lang]}</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Heebo:wght@300;400;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div
  dir={$lang === 'en' ? 'ltr' : 'rtl'}
  class="page-shell"
  bind:clientWidth={w}
  in:scale={{
    duration: 1300,
    delay: 200,
    opacity: 0.5,
    start: 0.5,
    easing: quintOut
  }}
>
  <!-- Ambient background blobs -->
  <div class="blob blob-gold"></div>
  <div class="blob blob-pink"></div>
  <div class="blob blob-cream"></div>

  <!-- ══════════════════════════════════════════
       JOURNEY STRIP  — brain ← key traveling ←
       Visible only during steps 1–5
  ═══════════════════════════════════════════ -->
  {#if show_value >= 1 && show_value <= 5}
    <div
      class="journey-strip"
      dir={$lang === 'en' ? 'ltr' : 'rtl'}
      in:fly={{ y: 30, duration: 700, easing: quintOut }}
    >
      <!-- START: Flag -->
      <div class="j-start">
        <span class="j-flag-emoji">🚩</span>
        <span class="j-hint-label">{$lang === 'en' ? 'start' : 'התחלה'}</span>
      </div>

      <!-- CENTER: Rail with dots + moving key -->
      <div class="j-rail-col">
        <!-- Step dots -->
        <div class="j-dots">
          {#each [1, 2, 3, 4, 5] as s}
            <div
              class="j-dot"
              class:j-dot-done={show_value > s}
              class:j-dot-active={show_value === s}
            ></div>
          {/each}
        </div>

        <!-- Track -->
        <div class="j-track">
          <div class="j-fill" style="width:{progress * 100}%"></div>
          <!-- Key icon riding the track -->
          <div class="j-key-rider" style="inset-inline-start:{progress * 100}%">
            <svg
              viewBox="950 200 1700 750"
              xmlns="http://www.w3.org/2000/svg"
              width="54"
              height="24"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="rkg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FFD700" />
                  <stop offset="50%" stop-color="#E91E8C" />
                  <stop offset="100%" stop-color="#DAA520" />
                </linearGradient>
              </defs>
              <path
                fill="url(#rkg)"
                stroke="#FFD700"
                stroke-width="16"
                d="M2631 429C2628 411 2621 393 2505 284 2433 304 2434 267 2416 193 2393 147 2353 110 2305 94 2250 77 2188 85 2141 117 2108 139 2081 171 2069 208 2052 259 2080 364 2113 408 2088 400 2066 385 2043 374 2030 386 2002 408 1998 391 1976 365 1944 348 1903 413 1828 413 1067 413 1068 428 1038 414 1020 403 978 414 952 428 953 491 966 518 1028 523 1040 519 1057 500 1067 499 1067 519 1198 520 1198 557 1077 556 1062 599 1063 627 1098 638 1098 666 1062 677 1063 833 1182 832 1185 721 1235 721 1237 832 1333 831 1333 720 1386 721 1387 833 1506 832 1508 780 1506 675 1470 664 1470 637 1505 625 1506 557 1371 557 1370 517 1828 514 1904 512 1924 565 1951 566 1986 557 1995 542 1999 534 1999 525 2002 517 2015 529 2029 540 2043 551 2067 541 2088 525 2113 517 2098 534 2084 551 2075 572 2049 632 2053 706 2093 760 2123 803 2172 834 2225 838 2296 846 2371 811 2407 749 2430 711 2440 664 2431 620 2457 625 2485 626 2511 620 2565 607 2610 565 2627 513 2632 498 2633 478 2635 462 2636 453 2631 429Z"
              />
            </svg>
          </div>
        </div>

        <!-- Label -->
        <div class="j-step-label">
          {$lang === 'en'
            ? `Step ${show_value} of 5`
            : `שלב ${show_value} מתוך 5`}
        </div>
      </div>

      <!-- END: Brain (goal / destination) -->
      <div class="j-brain">
        <svg
          class="brain-svg"
          viewBox="68 65 1680 1430"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="brain"
        >
          <defs>
            <radialGradient
              id="brg"
              cx="787"
              cy="45"
              r="838"
              gradientUnits="userSpaceOnUse"
              gradientTransform="matrix(1,0.008,-0.009,1.205,113,571)"
            >
              <stop offset="0" stop-color="#FFD700" stop-opacity="0.95" />
              <stop offset="0.4" stop-color="#FFA0C0" />
              <stop offset="0.7" stop-color="#FFC850" />
              <stop offset="1" stop-color="#FF82A0" />
            </radialGradient>
            <linearGradient
              id="blg"
              x1="906"
              y1="66"
              x2="906"
              y2="1493"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stop-color="#DAA520" />
              <stop offset="0.5" stop-color="#FF69B4" />
              <stop offset="1" stop-color="#DAA520" />
            </linearGradient>
          </defs>
          <path
            fill="url(#brg)"
            stroke="url(#blg)"
            stroke-width="36"
            stroke-miterlimit="35"
            d="M1742 841C1742 837 1742 826 1741 816C1740 771 1734 732 1726 699C1717 668 1705 643 1692 628C1688 624 1688 624 1685 613C1675 579 1656 546 1636 525C1630 519 1627 516 1619 512L1610 506L1610 500C1608 482 1608 477 1606 471C1601 445 1589 421 1572 398C1561 385 1546 370 1532 358C1524 352 1504 339 1498 335L1493 333L1492 328C1489 314 1475 295 1458 278C1454 275 1451 270 1446 264C1423 228 1387 198 1339 173C1302 154 1253 137 1211 128C1206 127 1201 126 1196 124C1188 120 1174 114 1165 111C1126 99 1092 94 1055 95L1038 95L1033 92C1016 83 993 75 971 70C953 67 944 66 920 66C893 66 879 67 856 73L845 76L836 74C830 73 823 72 819 72C810 70 766 70 754 72C726 75 696 82 673 90L667 93L658 92C616 88 580 90 541 99C498 110 454 131 420 159C416 162 411 167 408 169L403 174L397 173C389 172 383 172 375 173C348 178 316 197 279 231C266 243 255 253 240 270C228 284 186 324 180 328C171 333 164 339 155 348C139 363 129 378 117 402C110 416 107 423 102 438C100 443 98 449 97 451C94 455 88 466 84 473C74 493 69 515 70 530C71 541 75 553 80 559C81 561 82 563 82 563C82 564 81 567 79 570C71 583 68 594 68 612C68 627 70 634 74 648C83 674 101 704 122 726L127 732L129 740C133 761 138 775 148 792C160 811 181 832 203 848C239 873 288 892 343 902L358 905L359 909C362 918 367 926 378 937L386 945L387 954C388 961 388 965 390 968C392 973 392 974 391 977C390 982 390 992 392 997C396 1012 409 1029 430 1044C434 1046 449 1055 449 1055C457 1060 468 1068 468 1068C490 1086 512 1100 537 1113C560 1124 578 1131 600 1136C629 1143 639 1144 672 1144C689 1144 703 1145 708 1145C730 1147 775 1142 826 1131C832 1130 838 1129 839 1129C840 1130 841 1131 841 1133C848 1149 864 1180 915 1229C919 1231 922 1234 923 1235C924 1237 926 1241 929 1244C931 1248 935 1255 938 1260C941 1265 951 1283 961 1300C971 1316 980 1334 983 1338C985 1343 994 1361 1003 1377C1013 1397 1019 1409 1021 1415C1032 1444 1048 1467 1067 1480C1073 1485 1085 1490 1091 1492C1097 1494 1108 1494 1114 1492C1117 1492 1121 1491 1124 1491C1130 1490 1133 1489 1137 1485C1141 1481 1143 1476 1143 1466C1143 1453 1139 1439 1124 1401C1114 1374 1109 1357 1110 1355C1110 1354 1112 1355 1120 1357C1125 1358 1137 1361 1147 1363L1164 1366L1193 1367C1219 1367 1223 1367 1235 1369C1265 1373 1286 1371 1340 1359C1384 1349 1410 1339 1438 1321C1474 1299 1501 1264 1504 1238C1504 1234 1504 1234 1509 1228C1519 1218 1522 1210 1526 1190C1527 1181 1527 1180 1526 1177C1525 1173 1523 1164 1522 1156L1521 1154L1538 1154C1547 1154 1558 1154 1562 1153C1609 1148 1645 1132 1675 1101C1689 1086 1700 1070 1710 1050C1730 1009 1741 960 1743 901C1744 888 1743 856 1742 841Z"
          />
        </svg>
        <span class="j-hint-label">{$lang === 'en' ? 'goal' : 'יעד 💗'}</span>
      </div>
    </div>
  {/if}

  <!-- ══════════════════════════════════════════
       GLASS CARD
  ═══════════════════════════════════════════ -->
  <div dir={$lang === 'en' ? 'ltr' : 'rtl'} class="glass-stage">
    <!-- Shimmer edge -->
    <div class="card-shim"></div>

    <!-- TABS — visible steps 1–5, can navigate backward -->
    {#if show_value >= 1 && show_value <= 5}
      <nav
        class="tabs-bar"
        dir={$lang === 'en' ? 'ltr' : 'rtl'}
        in:fly={{ y: -8, duration: 450 }}
      >
        {#each tabDefs as tab}
          <button
            class="tab-btn"
            class:tab-active={show_value === tab.step}
            class:tab-done={show_value > tab.step}
            class:tab-future={show_value < tab.step}
            onclick={() => goToTab(tab.step)}
            disabled={show_value <= tab.step}
            title={tab[$lang]}
          >
            <span class="tab-icon">{tab.icon}</span>
            <span class="tab-label">{tab[$lang]}</span>
            {#if show_value > tab.step}
              <span class="tab-check">✓</span>
            {/if}
          </button>
        {/each}
      </nav>

      <!-- Thin separator -->
      <div class="tabs-sep"></div>
    {/if}

    <!-- STEP CONTENT -->
    <div class="steps-area">
      {#if show_value === 0}
        <div
          class="step-wrap"
          in:fly={{
            x: 50,
            duration: 900,
            delay: 100,
            opacity: 0,
            easing: quintOut
          }}
          out:fly={{ x: -50, duration: 600, opacity: 0, easing: quintOut }}
        >
          <Hello {idx} onProgres={add} />
        </div>
      {:else if show_value === 1}
        <div
          class="step-wrap"
          dir={$lang === 'en' ? 'ltr' : 'rtl'}
          in:fly={{
            x: 50,
            duration: 900,
            delay: 100,
            opacity: 0,
            easing: quintOut
          }}
          out:fly={{ x: -50, duration: 600, opacity: 0, easing: quintOut }}
        >
          <Vallues onProgres={add} />
        </div>
      {:else if show_value === 2}
        <div
          class="step-wrap"
          dir={$lang === 'en' ? 'ltr' : 'rtl'}
          in:fly={{
            x: 50,
            duration: 900,
            delay: 100,
            opacity: 0,
            easing: quintOut
          }}
          out:fly={{ x: -50, duration: 600, opacity: 0, easing: quintOut }}
        >
          <Skills onProgres={add} />
        </div>
      {:else if show_value === 3}
        <div
          class="step-wrap"
          dir={$lang === 'en' ? 'ltr' : 'rtl'}
          in:fly={{
            x: 50,
            duration: 900,
            delay: 100,
            opacity: 0,
            easing: quintOut
          }}
          out:fly={{ x: -50, duration: 600, opacity: 0, easing: quintOut }}
        >
          <Roles onProgres={add} />
        </div>
      {:else if show_value === 4}
        <div
          class="step-wrap"
          dir={$lang === 'en' ? 'ltr' : 'rtl'}
          in:fly={{
            x: 50,
            duration: 900,
            delay: 100,
            opacity: 0,
            easing: quintOut
          }}
          out:fly={{ x: -50, duration: 600, opacity: 0, easing: quintOut }}
        >
          <Workways onProgres={add} />
        </div>
      {:else if show_value === 5}
        <div
          class="step-wrap"
          dir={$lang === 'en' ? 'ltr' : 'rtl'}
          in:fly={{
            x: 50,
            duration: 900,
            delay: 100,
            opacity: 0,
            easing: quintOut
          }}
          out:fly={{ x: -50, duration: 600, opacity: 0, easing: quintOut }}
        >
          <Password onProgres={add} />
        </div>
      {:else if show_value === 6}
        <div
          class="step-wrap success-wrap"
          in:fly={{
            x: 50,
            duration: 900,
            delay: 100,
            opacity: 0,
            easing: quintOut
          }}
          out:fly={{ x: -50, duration: 600, opacity: 0, easing: quintOut }}
        >
          <div class="success-card" dir={$lang === 'en' ? 'ltr' : 'rtl'}>
            <div class="success-heart">💗</div>
            <h1 class="success-title">{tu[$lang]}</h1>
            <p class="success-name">{$userName}</p>
            <p class="success-sub">{see[$lang]}</p>
            <a href="mailto:baruch@1lev1.com" class="contact-link"
              >{buttn[$lang]}</a
            >
          </div>
        </div>
      {/if}
    </div>
  </div>
  <!-- /glass-stage -->
</div>

<!-- /page-shell -->

<style>
  /* ── Page ── */
  .page-shell {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: radial-gradient(
      ellipse at 30% 20%,
      #fff8e1 0%,
      #fde8f0 45%,
      #ffe4b5 100%
    );
    font-family: 'Heebo', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  /* ── Blobs ── */
  .blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.32;
    pointer-events: none;
    animation: drift 12s ease-in-out infinite alternate;
  }
  .blob-gold {
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, #ffd700, #daa520);
    top: -130px;
    left: -110px;
    animation-delay: 0s;
  }
  .blob-pink {
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, #ff69b4, #e91e8c);
    bottom: -90px;
    right: -90px;
    animation-delay: -5s;
  }
  .blob-cream {
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, #fff8dc, #ffe8a0);
    top: 40%;
    left: 50%;
    transform: translateX(-50%);
    animation-delay: -3s;
  }
  @keyframes drift {
    from {
      transform: scale(1) translate(0, 0);
    }
    to {
      transform: scale(1.15) translate(30px, 20px);
    }
  }

  /* ══ JOURNEY STRIP ══ */
  .journey-strip {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(92vw, 580px);
    background: rgba(255, 248, 220, 0.6);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1.5px solid rgba(218, 165, 32, 0.38);
    border-radius: 99px;
    padding: 9px 16px;
    box-shadow:
      0 4px 24px rgba(218, 165, 32, 0.14),
      0 1px 0 rgba(255, 215, 0, 0.28) inset;
  }

  /* Brain */
  .j-brain {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .brain-svg {
    width: 46px;
    height: 46px;
    filter: drop-shadow(0 2px 8px rgba(218, 165, 32, 0.38));
    animation: brainPulse 3s ease-in-out infinite;
  }
  @keyframes brainPulse {
    0%,
    100% {
      transform: scale(1);
      filter: drop-shadow(0 2px 8px rgba(218, 165, 32, 0.32));
    }
    50% {
      transform: scale(1.09);
      filter: drop-shadow(0 4px 14px rgba(233, 30, 140, 0.42));
    }
  }
  .j-hint-label {
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #b8860b;
    text-transform: uppercase;
  }

  /* Rail column */
  .j-rail-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: stretch;
  }

  /* Dots */
  .j-dots {
    display: flex;
    justify-content: space-between;
    padding: 0 3px;
  }
  .j-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid rgba(218, 165, 32, 0.35);
    background: rgba(255, 255, 255, 0.5);
    transition: all 0.5s ease;
  }
  .j-dot-done {
    background: linear-gradient(135deg, #daa520, #ff69b4);
    border-color: #daa520;
    box-shadow: 0 0 6px rgba(218, 165, 32, 0.48);
  }
  .j-dot-active {
    background: linear-gradient(135deg, #ffd700, #e91e8c);
    border-color: #e91e8c;
    box-shadow: 0 0 10px rgba(233, 30, 140, 0.5);
    transform: scale(1.28);
  }

  /* Track */
  .j-track {
    position: relative;
    height: 8px;
    background: rgba(218, 165, 32, 0.12);
    border-radius: 99px;
    border: 1px solid rgba(218, 165, 32, 0.22);
    overflow: visible;
  }
  .j-fill {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inset-inline-end: auto;
    border-radius: 99px;
    background: linear-gradient(90deg, #daa520, #ff69b4, #ffd700);
    box-shadow: 0 0 8px rgba(218, 165, 32, 0.45);
    transition: width 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Key rider */
  .j-key-rider {
    position: absolute;
    top: 50%;
    margin-top: -12px;
    inset-inline-start: 0;
    transition: inset-inline-start 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 2px 7px rgba(218, 165, 32, 0.65));
    animation: keyRide 2.5s ease-in-out infinite;
    z-index: 5;

    /* Points left by default in SVG. Mirror in LTR to face right (goal). */
    --sx: -1;
    --tx: -50%;
  }
  :where([dir='rtl']) .j-key-rider {
    --sx: 1; /* Faces left naturally toward goal in RTL. */
    --tx: 50%;
  }

  @keyframes keyRide {
    0%,
    100% {
      transform: translateX(var(--tx)) scaleX(var(--sx)) rotate(-6deg)
        translateY(0px);
    }
    50% {
      transform: translateX(var(--tx)) scaleX(var(--sx)) rotate(4deg)
        translateY(-3px);
    }
  }

  /* Step label */
  .j-step-label {
    text-align: center;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #b8860b;
    text-transform: uppercase;
    height: 11px;
  }

  /* Start */
  .j-start {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .j-flag-emoji {
    font-size: 1.3rem;
  }

  /* ══ GLASS CARD ══ */
  .glass-stage {
    position: relative;
    z-index: 10;
    width: min(94vw, 580px);
    background: rgba(255, 248, 220, 0.6);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1.5px solid rgba(218, 165, 32, 0.4);
    border-radius: 28px;
    box-shadow:
      0 8px 48px rgba(218, 165, 32, 0.15),
      0 2px 0 rgba(255, 215, 0, 0.32) inset,
      0 -1px 0 rgba(233, 30, 140, 0.11) inset;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
  }
  .card-shim {
    position: absolute;
    top: 0;
    left: 8%;
    right: 8%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      #ffd700 30%,
      #ff69b4 70%,
      transparent
    );
    border-radius: 99px;
  }

  /* ── TABS ── */
  .tabs-bar {
    display: flex;
    gap: 4px;
    padding: 14px 14px 8px;
    overflow-x: auto;
    scrollbar-width: none;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  .tabs-bar::-webkit-scrollbar {
    display: none;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 13px;
    border-radius: 99px;
    border: 1.5px solid rgba(218, 165, 32, 0.28);
    background: rgba(255, 248, 220, 0.52);
    font-family: 'Heebo', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #9a6b10;
    cursor: pointer;
    transition: all 0.22s ease;
    white-space: nowrap;
  }
  .tab-btn:disabled {
    cursor: default;
    opacity: 0.42;
  }
  .tab-btn:not(:disabled):hover {
    background: rgba(255, 215, 0, 0.18);
    border-color: rgba(218, 165, 32, 0.6);
    transform: translateY(-1px);
  }
  .tab-btn.tab-active {
    background: linear-gradient(135deg, #daa520, #e91e8c);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 3px 14px rgba(218, 165, 32, 0.33);
  }
  .tab-btn.tab-done {
    background: rgba(255, 215, 0, 0.14);
    border-color: rgba(218, 165, 32, 0.48);
    color: #7a5e00;
  }
  .tab-check {
    font-size: 0.68rem;
    color: #daa520;
    font-weight: 900;
  }
  .tab-icon {
    font-size: 0.88rem;
  }
  .tab-label {
    font-size: 0.69rem;
  }

  .tabs-sep {
    width: 88%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(218, 165, 32, 0.3) 30%,
      rgba(233, 30, 140, 0.2) 70%,
      transparent
    );
    border-radius: 99px;
    margin-bottom: 2px;
  }

  /* ── Step wrapper ── */
  .step-wrap {
    width: 100%;
    display: grid;
    grid-template-columns: auto auto auto auto;
    align-items: center;
    justify-content: center;
    padding: 8px 4px 14px;
    min-height: 370px;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592319/love_nnzswg.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .steps-area {
    display: grid;
    width: 100%;
    flex: 1;
  }

  .steps-area > :global(.step-wrap) {
    grid-area: 1 / 1;
  }

  /* ── Success ── */
  .success-wrap {
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
  .success-card {
    text-align: center;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .success-heart {
    font-size: 3.5rem;
    animation: hb 1.4s ease-in-out infinite;
  }
  @keyframes hb {
    0%,
    100% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.15);
    }
    60% {
      transform: scale(1.06);
    }
  }
  .success-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #c8860a;
    line-height: 1.3;
  }
  .success-name {
    font-size: 1.2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #daa520, #e91e8c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .success-sub {
    font-size: 0.9rem;
    color: #8b6914;
    font-style: italic;
  }
  .contact-link {
    margin-top: 12px;
    padding: 10px 24px;
    border-radius: 99px;
    background: linear-gradient(135deg, #daa520, #e91e8c);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(218, 165, 32, 0.32);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }
  .contact-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(218, 165, 32, 0.48);
  }

  /* ── Responsive ── */
  @media (max-width: 520px) {
    .glass-stage {
      width: 98vw;
      border-radius: 18px;
    }
    .journey-strip {
      width: 96vw;
      padding: 7px 10px;
      gap: 7px;
    }
    .brain-svg {
      width: 36px;
      height: 36px;
    }
    .tab-label {
      display: none;
    }
    .tab-btn {
      padding: 5px 9px;
      font-size: 0.65rem;
    }
    .step-wrap {
      min-height: 300px;
    }
    .j-key-rider svg {
      width: 40px;
      height: 18px;
    }
  }
</style>
