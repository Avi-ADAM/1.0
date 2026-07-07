# תכנית: אפליקציית אנדרואיד עם Tauri v2 מאותו ענף קוד

מטרה: אותו codebase ואותו ענף משמשים לשלושה יעדים, כשמשתנה סביבה אחד בזמן build מכריע:

| יעד | פקודה | אדפטר | הערות |
|---|---|---|---|
| Node (שרת רגיל) | `npm run build` | adapter-node | ברירת המחדל, ללא שינוי |
| Vercel | `ADAPTER=vercel npm run build` | adapter-vercel | ללא שינוי |
| מובייל (Tauri v2) | `npm run build:mobile` | adapter-static במצב SPA | חדש ועובד ✅. `VITE_TAURI=1` מודלק אוטומטית |

עיקרון מנחה: **האפליקציה היא SPA "רזה" שמדברת עם השרת הקיים** (Vercel/Node) דרך `VITE_URL`. אין SvelteKit server בתוך האפליקציה — כל ~75 קבצי ה־`+server.js`/`+page.server.js` ממשיכים לרוץ רק בפריסת הווב.

---

## שלב 0 — שלד (בוצע כבר בענף הזה ✅)

מה שכבר קיים ואומת (`cargo check` ירוק על src-tauri; ‏`npm run build:mobile` ירוק; ה-SPA נבדק בדפדפן):

- `src-tauri/` — פרויקט Tauri v2 מינימלי: `tauri.conf.json` (identifier: `world.1lev1.app`, `frontendDist: ../build`), `Cargo.toml`, `lib.rs` עם `mobile_entry_point`, capability בסיסי, אייקוני placeholder.
- `svelte.config.js` — ענף `ADAPTER === 'mobile'`: adapter-static עם `fallback: 'index.html'`, `strict: false`.
- `scripts/build-mobile.mjs` — מגדיר `ADAPTER=mobile` + `VITE_TAURI=1` בצורה חוצת־פלטפורמות (עובד גם ב-Windows), ומזרים ערכי דמה למשתני `$env/static/private` חסרים (ה-bundle של השרת נבנה ונזרק ב-adapter-static — הסודות לא נכנסים לאפליקציה).
- `src/lib/platform/index.js` — `isTauri`, `isMobileBuild`, `apiUrl()`, ו-`installMobileFetchPatch()` שמפנה `fetch('/api/...')` יחסי אל `VITE_URL`. כך ~80 קבצים שקוראים ל-API בנתיב יחסי עובדים ללא שינוי.
- `src/routes/+layout.js` — `ssr = false` רק ב-build מובייל; שפה נופלת ל-cookie/עברית כשאין `+layout.server.js`.
- `vite.config.js` — תמיכה ב-`TAURI_DEV_HOST` (נדרש ל-`tauri android dev` על מכשיר אמיתי).
- `package.json` — סקריפטים: `tauri`, `android:init`, `android:dev`, `android:build`, `build:mobile`; תלויות: `@tauri-apps/cli`, `@tauri-apps/api`.
- `scripts/gen-placeholder-icons.mjs` — אייקונים זמניים. **להחליף** עם הלוגו האמיתי: `npm run tauri icon path/to/logo-1024.png`.

---

## שלב 1 — להביא את `npm run build:mobile` לירוק ואת ה-SPA לעלות

**סטטוס: הושלם ברובו בענף הזה ✅** — ‏`npm run build:mobile` ירוק, וה-SPA אומת בדפדפן: דף הבית עולה במלואו (עברית, תרגומים, ניווט) בלי שום שרת מאחור. מה שנשאר מסומן למטה.

### 1.1 נטרול `+layout.server.js` במובייל — בוצע ✅
`build-mobile.mjs` מעביר זמנית את `src/routes/+layout.server.js` הצידה בזמן ה-build (try/finally, משוחזר תמיד), כך שה-SPA לא מנסה למשוך `__data.json` בזמן boot. `+layout.js` כבר עמיד להיעדר הנתונים.

**נשאר לביצוע**:
1. ליצור endpoint חדש `src/routes/api/auth/me/+server.js` שמחזיר בדיוק את מה שה-layout.server מחזיר היום: `{ loggedIn, uid, un, email, lang }` — נקרא מה-cookie (`jwt`, `id`, `un`, `email`) **או** מ-header ‏`Authorization: Bearer` (ראו שלב 2.2). חשוב: לא להחזיר את ה-JWT עצמו, רק דגל `loggedIn` — בדיוק כמו היום.
2. ב-`+layout.js`: כאשר `isMobileBuild`, לקרוא ל-`/api/auth/me` (דרך ה-fetch patch זה יגיע לשרת המרוחק) ולמלא את אותם שדות שה-layout מחזיר היום (`email, uid, un, id, loggedIn, lang, isDesktop`).
3. אותו טיפול יידרש ל-`src/routes/(reg)/+layout.server.js` (ה-layout של אזור lev) — להוסיף אותו ל-`SERVER_FILES_TO_HIDE` ב-`build-mobile.mjs` ולהעביר את הנתונים שלו ל-load אוניברסלי שנשען על ה-API.

### 1.2 Guards בצד לקוח
`hooks.server.js` עושה היום redirect: `/` → `/lev` כשמחוברים, `/lev*` → `/` כשלא. במובייל אין hooks server. לממש ב-`+layout.js` (או `+layout.svelte`) — אם `isMobileBuild`: אחרי קבלת `loggedIn` מ-`/api/auth/me`, `goto('/lev')` או `goto('/')` בהתאם. עטוף ב-`if (isMobileBuild)` כדי לא לשנות ווב.

### 1.3 ניקוי כשלי prerender/import
להריץ `npm run build:mobile` ולתקן איטרטיבית:
- ייבוא של `$lib/server/*` מתוך קוד client (אם קיים) — לפצל.
- דפים עם `+page.server.js` שהאפליקציה **צריכה** (בעיקר תחת `(reg)/lev`, `login`, `signup`, `chat`) — להעביר את ה-load שלהם ל-`+page.js` אוניברסלי שקורא ל-API, או לוודא שהם נטענים מנתוני layout. דפים שהאפליקציה לא צריכה (sitemap, migration-dashboard, דפי test*) — להשאיר; `strict:false` מדלג עליהם וה-nav במובייל פשוט לא יוביל אליהם.
- `@vercel/analytics` כבר מנוטרל במובייל ב-`+layout.js`.
- `src/service-worker.js` — לוודא שהוא לא נרשם בתוך Tauri (לעטוף רישום ב-`if (!isTauri)`); בתוך WebView הוא מיותר ועלול להפריע.

### קריטריון קבלה לשלב 1
`npm run build:mobile` ירוק ✅, מסך הבית עולה ✅ (אומת עם Chromium מול `http-server build -s`), מעבר שפות עובד, וניווט למסכים עיקריים (כולל lev אחרי התחברות) לא מתרסק — נשאר לאמת אחרי 1.1‑1.3.

---

## שלב 2 — רשת ואותנטיקציה מול השרת הקיים

הבעיה: האותנטיקציה היום היא HttpOnly cookie ‏(`jwt`) same-origin. ב-Tauri ה-origin הוא `http://tauri.localhost` (אנדרואיד) — cookies חוצי-origin לא אמינים ב-WebView. הפתרון: מסלול token מקביל.

### 2.1 CORS בשרת
ב-`hooks.server.js` (פונקציית `handle`): עבור בקשות `/api/*` עם `Origin` השייך לאפליקציה — להחזיר:
- `Access-Control-Allow-Origin: <origin>` רק אם הוא ברשימה: `tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`.
- טיפול ב-`OPTIONS` preflight (מחזיר 204 עם `Access-Control-Allow-Headers: content-type, authorization`).

### 2.2 מסלול Bearer token
1. ב-endpoint ההתחברות הקיים (תחת `src/routes/api/auth/` או `login`): כשהבקשה מגיעה עם header ‏`x-client: tauri` — להחזיר את ה-JWT גם בגוף התשובה (לא רק Set-Cookie).
2. בצד האפליקציה: לשמור את הטוקן עם `tauri-plugin-store` (או Stronghold אם רוצים הצפנה): להוסיף את הפלאגין ל-`Cargo.toml`, ל-`lib.rs` (`.plugin(tauri_plugin_store::Builder::default().build())`), ל-capabilities, ול-`package.json` (‏`@tauri-apps/plugin-store`).
3. להרחיב את `installMobileFetchPatch` ב-`$lib/platform`: להוסיף `Authorization: Bearer <token>` לכל בקשה שמופנית ל-`API_ORIGIN` (הטוקן נטען פעם אחת מה-store לזיכרון).
4. בשרת, בכל מקום שקורא `cookies.get('jwt')` בנתיב `/api/*` (בעיקר `/api/send` ו-`/api/action` — שער ה-GraphQL המרכזי): fallback ל-`Authorization` header. לרכז את זה בפונקציה אחת `getAuthToken(event)` ב-`$lib/server` ולהחליף את הקריאות.

### 2.3 Socket.io
`src/lib/stores/socketClient.ts` כבר תומך ב-`VITE_SOCKET_URL`. לוודא ש-socket-server מקבל auth גם מ-token (יש כבר `/api/socket-auth` — לוודא שעובד עם Bearer) ושה-CORS שלו כולל את origins של Tauri.

### 2.4 משתני סביבה ל-build מובייל
ליצור `.env.mobile` (לא בגיט) או להזריק ב-CI: `VITE_URL=https://1lev1.com`, `VITE_SOCKET_URL=https://socket.1lev1.com` (הערכים האמיתיים של הפרודקשן). `build-mobile.mjs` יטען אותו אם קיים (`dotenv`).

### קריטריון קבלה לשלב 2
התחברות מלאה מתוך `npm run tauri dev`, טעינת lev, פעולה שכותבת נתונים (למשל יצירת משימה), וקבלת עדכון socket — הכול מול שרת הפרודקשן/סטייג'ינג.

---

## שלב 3 — אנדרואיד בפועל

דרישות סביבה מקומית (חד־פעמי): Rust + ‏Android Studio ‏(SDK, NDK, JDK 17), משתני סביבה `ANDROID_HOME`, `NDK_HOME`.

1. `npm run android:init` — מייצר `src-tauri/gen/android` (פרויקט Gradle). **לקומיט את `gen/android`** (בלי `gen/schemas` שכבר ב-gitignore).
2. אייקונים אמיתיים: `npm run tauri icon <לוגו-1024x1024.png>` — מעדכן גם את res של אנדרואיד.
3. פיתוח על מכשיר: `npm run android:dev` (ה-`TAURI_DEV_HOST` כבר מטופל ב-vite.config).
4. חתימה ל-release: ליצור keystore, להגדיר `src-tauri/gen/android/keystore.properties` (לא בגיט!) לפי התיעוד של Tauri v2 ל-signing.
5. build חתום: `npm run android:build -- --apk` (לבדיקה) / `--aab` (ל-Play Store).
6. **הסרת Capacitor** אחרי שה-APK של Tauri עובד: למחוק `android/`, `capacitor.config.ts`, ואת תלויות `@capacitor/*` מ-package.json (לא לפני!).

### קריטריון קבלה
APK מותקן על מכשיר אמיתי: התחברות, lev, צ'אט וסושיאל-פלואו מרכזי עובדים.

---

## שלב 4 — CI, התראות ושיפורים

### 4.1 GitHub Actions ל-APK
`.github/workflows/android-build.yml` (להתחיל עם `workflow_dispatch` בלבד):

```yaml
name: Android APK (Tauri)
on: workflow_dispatch
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - uses: dtolnay/rust-toolchain@stable
        with: { targets: aarch64-linux-android,armv7-linux-androideabi }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - uses: android-actions/setup-android@v3
      - run: sdkmanager "ndk;27.0.11902837"
      - run: npm ci
      - run: npm run tauri android build -- --apk
        env:
          NDK_HOME: ${{ env.ANDROID_HOME }}/ndk/27.0.11902837
          VITE_URL: ${{ vars.VITE_URL }}
          VITE_SOCKET_URL: ${{ vars.VITE_SOCKET_URL }}
      - uses: actions/upload-artifact@v4
        with:
          name: app-apk
          path: src-tauri/gen/android/app/build/outputs/apk/**/*.apk
```
(חתימה ב-CI: להזריק את ה-keystore כ-secret base64 ולפענח לקובץ לפני ה-build.)

### 4.2 Push notifications
`web-push` (הקיים היום) לא עובד בתוך WebView של Tauri. אפשרויות לפי סדר מאמץ:
1. בלי push בגרסה ראשונה — הסתמכות על socket כשהאפליקציה פתוחה.
2. FCM דרך פלאגין קהילתי / קוד Kotlin ב-`gen/android` + endpoint רישום device-token בשרת (`/api/pusher` הקיים כנקודת התחלה).

### 4.3 UX מובייל
- כפתור Back של אנדרואיד: ברירת המחדל של Tauri v2 מנווטת אחורה ב-WebView; לוודא התנהגות סבירה ולחסום יציאה בטעות ממסך הבית.
- Deep links (`tauri-plugin-deep-link`) לקישורי הזמנה/שיתוף.
- `viewport-fit=cover` + safe-area ב-CSS למסכים עם notch.

---

## אינטגרציה עם השכבה המבוזרת (docs/HANDOFF_DISTRIBUTED_DB.md §7)

שכבת ה-Space (סנכרון local-first) היא קוד לקוח טהור ורצה בתוך ה-WebView
כמו-שהיא — והיא משלימה את המובייל (טעינה מיידית מ-IndexedDB, offline).
שלוש דרישות הדדיות:

1. **שלב 2.2 (getAuthToken)** חייב לכסות גם את `/api/relay/[spaceId]`
   ואת `/api/consent/keys/*` — הרפליקה קוראת אליהם ב-fetch יחסי שה-patch
   מפנה לשרת, והם צריכים לקבל Bearer כמו כל ה-API.
2. **ה-relay לא יכול לחיות על Vercel serverless** במצבו הנוכחי (יומן
   in-memory, אין זיכרון משותף בין invocations ⇒ סנכרון-מ-0 תמידי).
   לפני שהאפליקציה מדליקה `SPACE_SYNC_ENABLED` מול פרודקשן: או משימת T3
   (התמדה ב-Strapi) סגורה, או ה-relay מוצמד לפריסת Node יציבה.
3. **מובייל מקדים את T7 (זיווג מכשירים)**: אפליקציה + ווב = שני מכשירים
   לכל משתמש כמצב רגיל; בלי DeviceCert אלה שתי זהויות זרות.

וגם: מודל ה-push של השכבה המבוזרת ("צלצול ריק" — ping אטום, התוכן נמשך
ומפוענח מקומית) הוא הדרך הנכונה לממש FCM בשלב 4.2.

## סיכונים / הערות

- **`ADAPTER=static` הישן** ב-svelte.config מכיל `prerender: { default: true }` — אופציה שלא קיימת ב-SvelteKit 2 (ה-build ייכשל). הענף החדש `mobile` הוא המחליף; אפשר למחוק את ענף `static` כשנוח.
- שני lockfiles בריפו (npm + yarn). העדכונים כאן נעשו ב-`package-lock.json` (npm). כדאי למחוק את `yarn.lock` או להתמיד ב-npm.
- ה-fetch patch הוא פתרון גורף; קריאות שמייצרות URL אבסולוטי ידנית עם `VITE_URL` ימשיכו לעבוד כרגיל (הן כבר אבסולוטיות).
- SSR כבוי במובייל ⇒ אין SEO באפליקציה — לא רלוונטי; הווב לא מושפע.
- י18n: קבצי התרגום נטענים דרך `sveltekit-i18n` בצד לקוח — עובד ב-SPA.

## סדר עבודה מומלץ ל-Sonnet

1. שלב 1.1–1.3 עד build ירוק + בדיקת `tauri dev` בדסקטופ (מהיר יותר מאנדרואיד לאיטרציות).
2. שלב 2 (CORS + Bearer) — לבדוק מול סטייג'ינג.
3. שלב 3 מקומית (דורש Android SDK — לא זמין ב-CI של Claude).
4. שלב 4.

בכל שלב: לא לשנות התנהגות ווב — כל שינוי עטוף ב-`isMobileBuild`/`ADAPTER`. להריץ `npm run build` (node) אחרי כל שלב כרגרסיה.
