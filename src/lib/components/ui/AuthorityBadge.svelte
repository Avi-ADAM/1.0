<script>
  let {
    logoSrc = '',
    projectName = '',
    memberCount = 0,
    size = 200, // גודל ברירת מחדל
    goldColor = '#FFD700',
    darkGoldColor = '#B8860B'
  } = $props();
  
  let textElement = $state();
  
  // בדיקה אם הטקסט בעברית
  const isRTL = $derived(/[\u0590-\u05FF]/.test(projectName));
  
  // חישוב גודל הפונט בהתאם לגודל הכללי - הטקסט יתפוס 30% מהגודל
  const fontSize = $derived(Math.max(10, size * 0.08));
  const logoSize = $derived(size * 0.6); // הלוגו 60%
  const strokeWidth = $derived(size * 0.01);
  
  // אנימציה לטקסט ארוך
  const shouldAnimate = $derived.by(() => {
    if (textElement && projectName) {
      const textLength = projectName.length;
      return textLength > 36;
    }
    return false;
  });
</script>

<div 
  class="authority-badge" 
  style="--size: {size}px; --gold: {goldColor}; --dark-gold: {darkGoldColor}; --font-size: {fontSize}px; --logo-size: {logoSize}px; --stroke-width: {strokeWidth}px;"
>
  <div class="badge-container">
    <!-- העיגול החיצוני -->
    <div class="outer-ring"></div>
    
    <!-- העיגול הפנימי עם הלוגו -->
    <div class="inner-circle">
      {#if logoSrc}
        <img 
          src={logoSrc} 
          alt="Project Logo" 
          class="logo"
        />
      {/if}
    </div>
    
  
    <!-- הטקסט המעוגל - קטן יותר וקרוב לעיגול הפנימי -->
    <svg class="text-circle" class:animate-text-move={shouldAnimate} viewBox="0 0 200 200">
      <defs>
        <path 
          id="circle-path" 
          d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
        />
      </defs>
      
      <text 
        bind:this={textElement}
        class="curved-text"
        class:rtl={isRTL}
        direction={isRTL ? 'rtl' : 'ltr'}
        fill="#92400e"
        font-size={fontSize}
        font-weight="bold"
        font-family="Arial, sans-serif"
      >
        <textPath 
          href="#circle-path" 
          startOffset="25%" 
          text-anchor="middle"
        >
          {projectName}
        </textPath>
      </text>
    </svg>
    
    <!-- מספר החברים -->
    {#if memberCount > 0}
      <div class="member-count">
        <span class="count-number">{memberCount}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .authority-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: var(--size);
    height: var(--size);
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  
  .authority-badge:hover {
    transform: scale(1.05);
  }
  
  .badge-container {
    position: relative;
    width: var(--size);
    height: var(--size);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .outer-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #92400e 75%, #451a03 100%);
    box-shadow: 
      0 0 20px rgba(251, 191, 36, 0.4),
      inset 0 0 20px rgba(0, 0, 0, 0.1),
      0 4px 15px rgba(217, 119, 6, 0.3);
    transition: box-shadow 0.3s ease;
  }
  
  .authority-badge:hover .outer-ring {
    box-shadow: 
      0 0 30px rgba(251, 191, 36, 0.6),
      inset 0 0 20px rgba(0, 0, 0, 0.1),
      0 6px 20px rgba(217, 119, 6, 0.4);
  }
  
  .inner-circle {
    position: absolute;
    width: 60%;
    height: 60%;
    border-radius: 50%;
    background: radial-gradient(circle at center, #fbbf24 0%, #f59e0b 30%, #d97706 70%, #92400e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 15px rgba(146, 64, 14, 0.3);
    z-index: 3;
  }
  
  .frame-decorations {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
  }
  
  .decoration {
    position: absolute;
    width: 8px;
    height: 8px;
    background: linear-gradient(45deg, #fbbf24, #f59e0b);
    border-radius: 50%;
    box-shadow: 
      0 0 8px rgba(251, 191, 36, 0.6),
      inset 0 1px 2px rgba(255, 255, 255, 0.3);
  }
  
  .decoration-1 {
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .decoration-2 {
    top: 50%;
    right: 10%;
    transform: translateY(-50%);
  }
  
  .decoration-3 {
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .decoration-4 {
    top: 50%;
    left: 10%;
    transform: translateY(-50%);
  }
  
  .logo {
    width: var(--logo-size);
    height: var(--logo-size);
    border-radius: 50%;
    object-fit: cover;
  }
  
  .text-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
    top: 0;
    left: 0;
  }
  
   .text-circle.can-animate {
    animation: textPathMove 10s linear infinite;
    transform-origin: center;
  }
  
  .curved-text {
    /* הסטיילים מועברים ל-inline כדי לעבוד עם SVG */
  }
  
  .rtl {
    direction: rtl;
    unicode-bidi: bidi-override;
  }
  
 
  
  .member-count {
    position: absolute;
    bottom: 0%;
    left: 50%;
    transform: translateX(-50%);
    background: 
      radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
      linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #d97706 60%, #92400e 100%);
    color: #2d1b0e;
    padding: 10px 14px;
    border-radius: 50%;
    font-size: calc(var(--font-size) * 0.8);
    font-weight: 900;
    font-family: 'Georgia', 'Times New Roman', serif;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.4),
      inset 0 -2px 4px rgba(146, 64, 14, 0.6),
      0 0 0 2px #92400e,
      0 0 0 4px rgba(251, 191, 36, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-width: 45px;
    min-height: 45px;
    justify-content: center;
    z-index: 4;
    border: 1px solid rgba(146, 64, 14, 0.8);
    overflow: hidden;
  }
  
  .member-count::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 60%;
    height: 30%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%);
    border-radius: 50%;
    filter: blur(2px);
    z-index: -1;
  }
  
  .count-decoration {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 2px;
  }
  
  .count-number {
    font-size: 1em;
    line-height: 1;
    font-variant-numeric: lining-nums;
    font-feature-settings: "lnum" 1;
    text-shadow: 
      0 1px 0 rgba(255, 255, 255, 0.8),
      0 -1px 0 rgba(146, 64, 14, 0.8),
      1px 0 0 rgba(146, 64, 14, 0.6),
      -1px 0 0 rgba(146, 64, 14, 0.6),
      0 2px 3px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 2;
    letter-spacing: 0.5px;
  }
  
  /* תמיכה בדפדפנים שונים */
  @supports not (text-orientation: mixed) {
    .curved-text.rtl textPath {
      direction: rtl;
    }
  }
  
  /* אנימציה חלקה יותר בדפדפנים מודרניים */
  @media (prefers-reduced-motion: no-preference) {
    .curved-text.animate {
      animation-timing-function: ease-in-out;
    }
  }
  
  /* הפחתת אנימציה למי שמעדיף */
  @media (prefers-reduced-motion: reduce) {
    .curved-text.animate {
      animation: none;
    }
  }
</style>