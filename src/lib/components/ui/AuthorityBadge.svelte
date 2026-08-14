<script>
  import { onMount } from 'svelte';
  import { isWebkitTextPathBidiBug, toVisualRtl } from '$lib/utils/rtlTextPath.js';

  let {
    logoSrc = '',
    projectName = '',
    memberCount = 0,
    size = 200,
    goldColor = '#FFD700',
    darkGoldColor = '#B8860B',
    pinkGlow = true
  } = $props();

  /*
   * שני מראות, DOM אחד.
   *
   * personal — הטבעת הזהובה הקיימת, בלי שינוי.
   * business — חותם רשמי: שדה נייבי עמוק, שני קווי חריטה מקיפים, כוכב
   *            בשעה 6 וטקסט לבן במרווח אותיות רחב, בלי סיבוב ובלי זוהר.
   *
   * ההחלפה נעשית ב-CSS בלבד (`:global(html.business)`), בדיוק כמו שאר שכבת
   * ה-appearance ב-app.postcss. חשוב שכך: את הקלאס על <html> מטביע
   * hooks.server.js כבר ב-SSR, ואילו סניף ב-JS על סמך ה-store היה מצייר
   * בשרת את הערכת ברירת המחדל (personal) וקופץ אחרי ה-hydration.
   * לכן רכיבי החותם קיימים תמיד ב-DOM ורק מוסתרים ב-personal.
   */

  const isRTL = $derived(/[\u0590-\u05FF\u0600-\u06FF]/.test(projectName));

  // WebKit (Safari / all iOS browsers) ignores bidi on <textPath>, rendering
  // RTL names reversed. Detect it after mount and reorder the text ourselves.
  let webkitBidiBug = $state(false);
  onMount(() => {
    webkitBidiBug = isWebkitTextPathBidiBug();
  });
  const needsManualRtl = $derived(isRTL && webkitBidiBug);

  // מזהה ייחודי לכל מופע: בעמוד lev יש כמה תגים יחד, ו-id קבוע היה יוצר
  // כפילות מזהים ומפנה את כולם ל-<path> של הראשון.
  const uid = $props.id();
  const pathId = `authority-arc-${uid}`;

  const baseFontSize = $derived(Math.max(14, Math.min(34, Math.sqrt(size) * 2.2)));
  const logoSize = $derived(size * 0.58);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;

  // האות הראשונה של שם הרשת — משמשת כמונוגרמה כשאין לוגו במראה העסקי.
  const monogram = $derived([...projectName.trim()][0] ?? '');

  let finalState = $derived.by(() => {
    if (!projectName) return { text: '', fontSize: baseFontSize, animate: false };

    const charWidthEstimate = baseFontSize * 0.6;
    const estimatedTextLen = projectName.length * charWidthEstimate;
    const staticThreshold = circumference * 0.49;

    // --- מצב 1: טקסט קצר וסטטי ---
    if (estimatedTextLen <= staticThreshold) {
      return {
        text: projectName,
        fontSize: baseFontSize,
        animate: false
      };
    }

    // --- בדיקה לשיכפול ---
    const spacer = " • ";
    const spacerLen = baseFontSize * 2;
    const singleUnitLen = estimatedTextLen + spacerLen;
    const copies = Math.floor(circumference / singleUnitLen);

    // --- מצב 2: שיכפול (נכנסים 2+) ---
    if (copies >= 2) {
       const repeatedText = new Array(copies).fill(projectName).join(spacer) + spacer;
       return {
         text: repeatedText,
         fontSize: baseFontSize,
         animate: true
       };
    }

    // --- מצב 3: עותק בודד ארוך + אנימציה ---
    let currentFontSize = baseFontSize;
    // הקטנה קלה רק אם זה ממש חורג מהמעגל כולו
    if (estimatedTextLen > circumference * 0.95) {
       const shrinkFactor = (circumference * 0.95) / projectName.length;
       currentFontSize = Math.max(12, Math.min(baseFontSize, shrinkFactor * 1.6));
    }

    return {
      text: projectName,
      fontSize: currentFontSize,
      animate: true
    };
  });

  // On WebKit, feed the text in visual order and render it LTR; everywhere else
  // keep the logical string and let the browser's bidi engine reorder it.
  const displayText = $derived(
    needsManualRtl ? toVisualRtl(finalState.text) : finalState.text
  );
</script>

<div
  class="authority-badge"
  class:pink-glow={pinkGlow}
  style="
    --size: {size}px;
    --badge-gold: {goldColor};
    --badge-gold-dark: {darkGoldColor};
    --font-size: {finalState.fontSize}px;
    --logo-size: {logoSize}px;
  "
>
  <div class="badge-container">
    <div class="outer-ring"></div>

    <div class="inner-circle">
      {#if logoSrc}
        <img src={logoSrc} alt={projectName} class="logo"/>
      {:else}
        <span class="fallback-spark text-4xl">✨</span>
        <span class="fallback-monogram" aria-hidden="true">{monogram}</span>
      {/if}
    </div>

    <svg class="text-circle" viewBox="0 0 200 200">
      <defs>
        <!--
           תיקון קריטי: הזזת נקודת ההתחלה (M) ללמטה (100, 178)
           כך שה"תפר" של המעגל יהיה בשעה 6.
        -->
        <path id={pathId} d="M 100, 178 a 78,78 0 1,1 0,-156 a 78,78 0 1,1 0,156" />
      </defs>

      <!--
         קווי החריטה של החותם. נצבעים רק במראה העסקי (ב-personal הם
         display:none). non-scaling-stroke שומר על קו חד גם בתג של 80px.
      -->
      <g class="seal-rules" fill="none">
        <circle cx="100" cy="100" r="96" stroke-width="1" vector-effect="non-scaling-stroke" />
        <circle
          class="rule-strong"
          cx="100" cy="100" r="91"
          stroke-width="2" vector-effect="non-scaling-stroke"
        />
        <circle cx="100" cy="100" r="63.5" stroke-width="1" vector-effect="non-scaling-stroke" />
      </g>

      <text
        class="curved-text"
        class:rtl={isRTL && !needsManualRtl}
        class:animate-spin-slow={finalState.animate}
        dominant-baseline="middle"
        style="transform-origin: center;"
      >
        <!--
           תיקון קריטי: startOffset="50%"
           מכיוון שהמסלול מתחיל למטה (0%), ה-50% זה בדיוק למעלה (שעה 12).
           זה נותן לטקסט מקום להימתח לשני הצדדים בלי להיחתך.
        -->
        <textPath
          href="#{pathId}"
          startOffset="50%"
          text-anchor="middle"
        >
          {displayText}
        </textPath>
      </text>

      <!-- הכוכב יושב על תפר הטקסט בשעה 6: רק כששם הרשת קצר ולא מגיע לשם,
           ורק כשיש לו מקום — מונה החברים בגודל קבוע ומכסה אותו בתגים קטנים. -->
      {#if !finalState.animate && (memberCount <= 0 || size >= 160)}
        <g class="seal-star" transform="translate(100 177.5)">
          <path
            d="M0,-8.5 L2.06,-2.83 L8.08,-2.63 L3.33,1.08 L4.99,6.88
               L0,3.5 L-4.99,6.88 L-3.33,1.08 L-8.08,-2.63 L-2.06,-2.83 Z"
          />
        </g>
      {/if}
    </svg>

    {#if memberCount > 0}
      <div class="member-badge">
        <span class="count">{memberCount}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* ===================== משותף ===================== */
  .authority-badge {
    display: flex; justify-content: center; align-items: center;
    width: var(--size); height: var(--size);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative; z-index: 10;
  }
  .authority-badge:hover { transform: scale(1.05); }

  .badge-container { position: relative; width: 100%; height: 100%; }

  .logo { width: 100%; height: 100%; object-fit: cover; }
  .text-circle { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }

  .animate-spin-slow {
    animation: rotateText 25s linear infinite;
  }

  @keyframes rotateText {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ===================== המראה האישי (ללא שינוי) ===================== */
  .pink-glow .outer-ring {
    box-shadow: 0 0 15px var(--badge-gold), 0 0 30px rgba(255, 0, 174, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .outer-ring {
    position: absolute; inset: 0; border-radius: 50%;
    background: linear-gradient(135deg, #fbbf24, #d97706, #78350f);
    border: 2px solid rgba(255,255,255,0.2);
  }

  .inner-circle {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: var(--logo-size); height: var(--logo-size);
    border-radius: 50%; background: #000; overflow: hidden;
    border: 4px solid var(--badge-gold); box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
    z-index: 2; display: flex; justify-content: center; align-items: center;
  }

  .curved-text {
    fill: #fffbeb;
    font-weight: bold;
    font-family: sans-serif;
    font-size: var(--font-size);
    text-shadow: 0px 2px 4px rgba(0,0,0,0.8);
    letter-spacing: 1.5px;
    transform-box: view-box;
  }

  .curved-text.rtl { direction: rtl; }

  .member-badge {
    position: absolute; bottom: -5%; left: 50%; transform: translateX(-50%);
    background: linear-gradient(to right, #be185d, #ec4899); color: white;
    padding: 4px 12px; border-radius: 20px; border: 2px solid var(--badge-gold);
    font-size: 0.8rem; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    z-index: 5; display: flex; flex-direction: column; align-items: center; line-height: 1;
  }
  .member-badge .count { font-size: 1.1rem; }

  /* חלקי החותם קיימים ב-DOM תמיד, אבל נראים רק במראה העסקי. */
  .seal-rules,
  .seal-star,
  .fallback-monogram { display: none; }

  /* ===================== המראה העסקי — חותם רשמי ===================== */
  :global(html.business) .authority-badge {
    --seal-field: linear-gradient(160deg, #21467d 0%, #16325f 48%, #0e2247 100%);
    --seal-ink: #eef4ff;
    --seal-rule: rgb(226 236 255 / 0.42);
    --seal-rule-strong: rgb(226 236 255 / 0.82);
    --seal-edge: rgb(15 23 42 / 0.45);
    --seal-disc: #ffffff;
    --seal-disc-ink: #16325f;
  }

  /* בלילה השדה נשאר זהה — חותם הוא זהות קבועה — ורק השפה שלו מתבהרת
     כדי שיינתק מרקע הדף הכהה (--bg: #0b1220). */
  :global(html.business.dark) .authority-badge {
    --seal-edge: rgb(147 197 253 / 0.38);
    --seal-disc: #f1f5fb;
  }

  :global(html.business) .authority-badge:hover { transform: scale(1.02); }

  /* שתי הבחירות יחד: הכלל של pink-glow ספציפי יותר, אז הוא נכלל כאן במפורש. */
  :global(html.business) .outer-ring,
  :global(html.business) .pink-glow .outer-ring {
    background: var(--seal-field);
    border: 1px solid var(--seal-edge);
    box-shadow:
      0 1px 3px rgb(15 23 42 / 0.18),
      0 8px 20px rgb(15 23 42 / 0.12);
  }

  :global(html.business) .seal-rules {
    display: block;
    stroke: var(--seal-rule);
  }
  :global(html.business) .seal-rules .rule-strong { stroke: var(--seal-rule-strong); }

  :global(html.business) .seal-star {
    display: block;
    fill: var(--seal-rule-strong);
  }

  :global(html.business) .inner-circle {
    background: var(--seal-disc);
    border: 2px solid var(--seal-rule-strong);
    box-shadow: 0 0 0 1px rgb(15 23 42 / 0.22);
  }

  :global(html.business) .fallback-spark { display: none; }
  :global(html.business) .fallback-monogram {
    display: block;
    color: var(--seal-disc-ink);
    font-family: ui-sans-serif, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 700;
    font-size: calc(var(--logo-size) * 0.42);
    line-height: 1;
    letter-spacing: 0.02em;
  }

  /* רישיות + מרווח רחב הם החתימה של חותם רשמי. ה-0.92 מקזז את הרוחב
     שהרישיות מוסיפה, כי הערכת הרוחב ב-JS נעשית על הטקסט המקורי. */
  :global(html.business) .curved-text {
    fill: var(--seal-ink);
    font-family: ui-sans-serif, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 600;
    font-size: calc(var(--font-size) * 0.92);
    letter-spacing: 2px;
    text-transform: uppercase;
    text-shadow: none;
  }

  /* אותה מדיניות של html.business ב-app.postcss: בלי תנועה דקורטיבית.
     שום מידע לא אובד — הטקסט נכתב ממילא על כל היקף הטבעת. */
  :global(html.business) .animate-spin-slow { animation: none; }

  /* המונה גדל עם התג במקום להישאר בגודל קבוע — בתג של 80px (כרטיס lev
     בנייד) שלט קבוע כזה תופס כשליש מהחותם. */
  :global(html.business) .member-badge {
    background: #16325f;
    color: #f8fafc;
    border: 1px solid var(--seal-rule-strong);
    border-radius: var(--radius-theme, 0.25rem);
    padding: 2px max(6px, calc(var(--size) * 0.05));
    box-shadow: 0 1px 3px rgb(15 23 42 / 0.25);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
  }
  :global(html.business) .member-badge .count {
    font-size: max(0.6rem, calc(var(--size) * 0.075));
  }

  /* ===================== נגישות ===================== */
  @media (prefers-reduced-motion: reduce) {
    .animate-spin-slow { animation: none; }
    .authority-badge,
    .authority-badge:hover { transition: none; transform: none; }
  }
</style>
