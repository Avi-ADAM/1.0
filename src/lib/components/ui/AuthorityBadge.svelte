<script>
  let {
    logoSrc = '',
    projectName = '',
    memberCount = 0,
    size = 200,
    goldColor = '#FFD700',
    darkGoldColor = '#B8860B',
    pinkGlow = true
  } = $props();
  
  const isRTL = $derived(/[\u0590-\u05FF]/.test(projectName));
  
  const baseFontSize = $derived(Math.max(14, Math.min(34, Math.sqrt(size) * 2.2)));
  const logoSize = $derived(size * 0.58); 
  const radius = 78;
  const circumference = 2 * Math.PI * radius; 

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
</script>

<div 
  class="authority-badge" 
  class:pink-glow={pinkGlow}
  style="
    --size: {size}px; 
    --gold: {goldColor}; 
    --dark-gold: {darkGoldColor}; 
    --font-size: {finalState.fontSize}px; 
    --logo-size: {logoSize}px;
  "
>
  <div class="badge-container">
    <div class="outer-ring"></div>
    
    <div class="inner-circle">
      {#if logoSrc}
        <img src={logoSrc} alt="Project Logo" class="logo"/>
      {:else}
        <span class="text-4xl">✨</span>
      {/if}
    </div>
    
    <svg class="text-circle" viewBox="0 0 200 200">
      <defs>
        <!-- 
           תיקון קריטי: הזזת נקודת ההתחלה (M) ללמטה (100, 178)
           כך שה"תפר" של המעגל יהיה בשעה 6.
        -->
        <path id="circle-path" d="M 100, 178 a 78,78 0 1,1 0,-156 a 78,78 0 1,1 0,156" />
      </defs>
      
      <text 
        class="curved-text" 
        class:rtl={isRTL}
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
          href="#circle-path" 
          startOffset="50%" 
          text-anchor="middle"
        >
          {finalState.text}
        </textPath>
      </text>
    </svg>
    
    {#if memberCount > 0}
      <div class="member-badge">
        <span class="count">{memberCount}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* שום דבר לא השתנה בסטייל */
  .authority-badge {
    display: flex; justify-content: center; align-items: center;
    width: var(--size); height: var(--size);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative; z-index: 10;
  }
  .authority-badge:hover { transform: scale(1.05); }

  .pink-glow .outer-ring {
    box-shadow: 0 0 15px var(--gold), 0 0 30px rgba(255, 0, 174, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .badge-container { position: relative; width: 100%; height: 100%; }
  
  .outer-ring {
    position: absolute; inset: 0; border-radius: 50%;
    background: linear-gradient(135deg, #fbbf24, #d97706, #78350f);
    border: 2px solid rgba(255,255,255,0.2);
  }
  
  .inner-circle {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: var(--logo-size); height: var(--logo-size);
    border-radius: 50%; background: #000; overflow: hidden;
    border: 4px solid var(--gold); box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
    z-index: 2; display: flex; justify-content: center; align-items: center;
  }
  
  .logo { width: 100%; height: 100%; object-fit: cover; }
  .text-circle { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }

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

  .animate-spin-slow {
    animation: rotateText 25s linear infinite;
  }

  @keyframes rotateText {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .member-badge {
    position: absolute; bottom: -5%; left: 50%; transform: translateX(-50%);
    background: linear-gradient(to right, #be185d, #ec4899); color: white;
    padding: 4px 12px; border-radius: 20px; border: 2px solid var(--gold);
    font-size: 0.8rem; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    z-index: 5; display: flex; flex-direction: column; align-items: center; line-height: 1;
  }
  .member-badge .count { font-size: 1.1rem; }
  .member-badge .label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px;}
</style>