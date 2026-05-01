<script>
  let {
    username,
    avatarUrl,
    crownContent,
    buttonsContent,
    diamondContent,
    wreathSvgUrl = 'https://res.cloudinary.com/love1/image/upload/v1640438986/goldenP_bz4wu5.svg'
  } = $props();
</script>

<div class="badge-container">
  <svg
    viewBox="0 0 500 700"
    style="overflow: visible;"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <clipPath id="avatar-clip">
        <circle cx="250" cy="200" r="165" />
      </clipPath>

      <!-- קשת הטקסט -->
      <path id="text-arc" d="M 110,400 Q 250,345 390,400" fill="none" />
    </defs>

    <!-- תמונה -->
    <image
      href={avatarUrl}
      x="85"
      y="45"
      width="330"
      height="330"
      clip-path="url(#avatar-clip)"
      preserveAspectRatio="xMidYMid slice"
    />

    <!-- מסגרת הזהב (הזר) -->
    <image href={wreathSvgUrl} x="0" y="0" width="500" height="500" />

    <!-- טקסט -->
    <text
      direction="rtl"
      fill="#ff00ae"
      font-size="30"
      font-weight="bold"
      style="text-shadow: 1px 1px 2px rgba(63, 56, 18, 0.8);"
    >
      <textPath href="#text-arc" startOffset="50%" text-anchor="middle">
        {username}
      </textPath>
    </text>

    <!-- הכתר -->
    <foreignObject
      x="175"
      y="-20"
      width="150"
      height="100"
      style="overflow: visible;"
    >
      <div class="center-content">
        {@render crownContent?.()}
      </div>
    </foreignObject>

    <!-- הכפתורים (הורדתי אותם טיפה ל-450 כדי שיתרחקו מהטקסט) -->
    <foreignObject
      x="100"
      y="450"
      width="300"
      height="80"
      style="overflow: visible;"
    >
      <div class="flex items-center justify-center gap-6">
        {@render buttonsContent?.()}
      </div>
    </foreignObject>

    <!-- היהלום (ממוקם למטה ב-y=530) -->
    <foreignObject
      x="50"
      y="530"
      width="400"
      height="170"
      style="overflow: visible;"
    >
      <div class="center-content">
        {@render diamondContent?.()}
      </div>
    </foreignObject>
  </svg>
</div>

<style>
  .badge-container {
    position: absolute;
    /* מירכוז מושלם לאמצע המסך */
    top: 48%;
    left: 50%;
    transform: translate(-50%, -50%);

    /* === הגדרות למובייל (ברירת מחדל) === */
    /* הגבלת הרוחב ל-33% מרוחב המסך (vw) כדי שלא יעלה על הכרטיסיות */
    width: 100%;
    max-width: 33vw;
    height: auto; /* הגובה יחושב אוטומטית לפי הרוחב כדי לשמור על פרופורציות */

    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* ה-SVG מתאים את עצמו לקופסה המכילה אותו */
  svg {
    width: 100%;
    height: auto;
  }

  /* === הגדרות לטאבלט ומחשב === */
  @media (min-width: 768px) {
    .badge-container {
      /* במחשב אנחנו מבטלים את הגבלת ה-33% ועוברים לשליטה לפי גובה (85vh) שעבדה לך מושלם */
      width: auto;
      max-width: none;
      height: 76vh;
    }

    svg {
      width: auto;
      height: 100%;
    }
  }
</style>
