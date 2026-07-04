# סקירת מוכנות לפרודקשן — 1💗1

> תאריך: 2026-07-04 · ענף: `claude/production-readiness-review-1t63qg`
> היקף הסקירה: אבטחה, UI/UX, והיגיינת ריפו לקראת עלייה לאוויר.
> סטאק: SvelteKit (adapter-node/vercel/static) · Mastra AI · Strapi (GraphQL) · Socket.IO · Capacitor.

הסקירה בוצעה על בסיס קריאת קוד סטטית. הממצאים ממוינים לפי חומרה, עם הפניות ל`קובץ:שורה` וכיוון פעולה. **לא בוצע שינוי קוד** — זהו מסמך המלצות בלבד.

---

## 🎯 תקציר מנהלים

הארכיטקטורה בנויה נכון בליבה: יש **פרוקסי אבטחה** מחושב היטב (`/api/send`, `/api/action`) עם whitelist של שאילתות (`qids`), JWT ב-httpOnly cookie שלא נחשף ללקוח, וסוד פנימי (`x-internal-secret`) שמונע זיוף של דגל `isSer` מהדפדפן. זו תשתית טובה.

עם זאת, **לפני עלייה לאוויר יש לסגור מספר פערים קריטיים** — בעיקר דליפת סודות ללוגים/באנדל, מצב גלובלי משותף בין בקשות מקבילות, והיעדר Rate-Limiting על נקודות קצה ציבוריות ויקרות (AI/מייל/דיווח).

| קטגוריה | 🔴 קריטי | 🟠 גבוה | 🟡 בינוני |
|---|---|---|---|
| אבטחה | 3 | 5 | 5 |
| UI/UX | 0 | 2 | 3 |
| היגיינה/Build | 0 | 1 | 3 |

**המלצה: לא לעלות לפרודקשן לפני סגירת כל סעיפי 🔴 ורוב סעיפי 🟠.**

---

## 🔒 אבטחה

### 🔴 קריטי — חובה לסגור לפני עלייה

#### 1. דליפת JWT וטוקן אדמין ללוגים
- `src/routes/api/api-keys/+server.ts:15` — `console.log(jwt, userIdStr)` מדפיס את ה-JWT המלא של המשתמש.
- `src/lib/jobs/sync-vocabulary.ts:111` — `console.log('STRAPI_TOKEN:', STRAPI_TOKEN)` מדפיס את טוקן האדמין המלא של Strapi.
- `src/lib/server/apiKeys.ts:130` — מדפיס תחילית של הטוקן (חמור פחות, אך מיותר).

**סיכון:** מי שיש לו גישה ללוגים (Vercel/Docker/ניטור) מקבל טוקן פעיל להתחזות מלאה. **פעולה:** להסיר לחלוטין. לעולם לא ללגג ערכי אימות.

#### 2. סודות עם תחילית ציבורית `VITE_`
משתני סביבה עם תחילית `VITE_` נחשבים ציבוריים ב-Vite ועלולים להיכלל בבאנדל הלקוח. בשימוש כיום כסודות:
- `VITE_TELEGRAM_BOT_TOKEN`, `VITE_TELEGRAM_CHAT_ID` — `src/routes/api/cron/+server.js:23-24`
- `VITE_HOOK` — webhook לפריסה מחדש (`api/cron`) — הפעלה שלו ע"י גורם עוין = טריגר פריסות/DoS.
- `VITE_GOOGLE_API`

**פעולה:** לשנות שם לסודות צד-שרת בלבד (בלי `VITE_`), ולקרוא דרך `$env/static/private` / `$env/dynamic/private`. להשאיר `VITE_` רק לערכים שבאמת ציבוריים (למשל `VITE_URL`, `VITE_SOCKET_URL`).

#### 3. מצב גלובלי משותף בין בקשות — `global.botContext`
31 שימושים ב-`global.botContext` (למשל `src/routes/api/chat/+server.ts:63,135`). בשרת Node שמשרת בקשות במקביל, אובייקט גלובלי יחיד מוחלף (race) בין משתמשים בו-זמנית — כולל `userId`, `fetchInstance`, ו-`isInternalBot`.

**סיכון:** נזילת הקשר/הרשאות בין משתמשים (בקשה של משתמש א' עלולה לרוץ עם הקונטקסט של משתמש ב'), ובאגים לא-דטרמיניסטיים. **פעולה:** להעביר את הקונטקסט כפרמטר מפורש בכל שרשרת הקריאה, או להשתמש ב-`AsyncLocalStorage`. אין להסתמך על `global`.

---

### 🟠 גבוה

#### 4. אין Rate-Limiting על נקודות קצה ציבוריות ויקרות
- `POST /api/chat` — ציבורי (משתמש לא-רשום), קורא ל-Gemini בכל בקשה → עלות/ניצול.
- `POST /api/report` — ציבורי, יוצר רשומות ב-Strapi + מציף Telegram → ספאם.
- `POST /api/analyze-cv`, `POST /api/upload`, `POST /api/analyze-business` — יקרים/כבדים.

**פעולה:** Rate-limit לפי IP/משתמש (בזיכרון/Redis/Upstash), + CAPTCHA/הוכחת-אנוש על טפסים ציבוריים.

#### 5. אין Content-Security-Policy אמיתי וכותרות אבטחה
קיים רק `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">` (`src/app.html:80`). חסר CSP מלא, `X-Frame-Options`/`frame-ancestors`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`.

**פעולה:** להוסיף כותרות ב-`handle` (hooks.server.js) או דרך ה-adapter/nginx. CSP חשוב במיוחד לצד השימוש ב-`{@html}` (ר' סעיף 6).

#### 6. `{@html}` על תוכן שמקורו במשתמש (XSS)
34 שימושי `{@html}`. חלקם על מפתחות תרגום (`$t(...)`) — סביר. אך אלה מרנדרים תוכן שמקורו במשתמשים:
- `src/routes/(regandnon)/meeting/+page.svelte:786` — `pend.attributes.pgisha.data.attributes.desc`
- `src/lib/components/prPr/tasks/taskModal.svelte:453` — `act.des`
- `src/lib/celim/messeges.svelte:153` — `message`
- `src/lib/celim/tile.svelte:153`, `src/lib/components/lev/mid.svelte:2581`, `coinui.svelte:170`

**פעולה:** לחטא (sanitize) כל HTML שמקורו במשתמש עם DOMPurify לפני רינדור, או להחליף ב-טקסט רגיל.

#### 7. Upload ללא ולידציה
`src/routes/api/upload/+server.ts` מוודא JWT אך **מעביר את הקובץ ל-Strapi ללא בדיקת גודל/סוג MIME**.

**פעולה:** לאכוף מגבלת גודל, whitelist של סוגי MIME, ולדחות מוקדם. אחרת — DoS/העלאת קבצים זדוניים.

#### 8. בניית GraphQL ע"י שרשור מחרוזות + sanitize ידני
`src/routes/api/onboard/save/+server.ts:61,117-118` בונה שאילתות ע"י אינטרפולציה (`"${sanitize(v)}"`). `sanitize` רק בורח ממרכאות וחותך ל-200 תווים — שביר.

**פעולה:** להשתמש ב-GraphQL **variables** (כמו ב-`/api/send`) במקום שרשור מחרוזות, בכל נקודות הקצה.

#### 9. `Access-Control-Allow-Origin: '*'` ב-socket-server
`socket-server/src/index.ts:179` על נתיב ה-HTTP (בעוד ש-Socket.IO עצמו מגביל origin ב-`:47`). מומלץ ליישר קו ולהגביל גם את נתיב ה-HTTP.

---

### 🟡 בינוני

#### 10. ~1,166 קריאות `console.log` ב-`src`
רעש, פגיעה בביצועים, ודליפת מידע פוטנציאלית בפרודקשן. כולל לוג לכל בקשה (`src/hooks.server.js:102` — `console.log(lang, pathname)`) ו-`console.log('ok')/'problema'` ב-cron.
**פעולה:** logger עם רמות (debug/info/error) שמושתק בפרוד, או strip ב-build.

#### 11. אין ניטור שגיאות בפרודקשן
Sentry מותקן (`@sentry/sveltekit`) אך **מנוטרל בהערות** (`src/hooks.server.js:25-35`). ללא ניטור לא תדעו על שגיאות בפרוד.
**פעולה:** להפעיל Sentry (או חלופה) עם DSN מהסביבה.

#### 12. redirect ידני ב-hooks
`handle()` מחזיר `new Response(..., {status:303})` במקום `redirect()` של SvelteKit (`hooks.server.js:110,143-152`). עובד, אך עוקף את מנגנון ה-SvelteKit ומקשה על תחזוקה.

#### 13. עקביות נירמול סודות
לוגיקת `normalizeSecret`/`normalize` משוכפלת (`internalSecret.js`, `send/+server.js`). לאחד למקום אחד כדי למנוע סטייה.

#### 14. אימות קלט ורידקציה כללית
לוודא שכל נקודת קצה מאמתת קלט (schema/yup — כבר בשימוש בפרויקט) ולא מחזירה הודעות שגיאה עם פרטים פנימיים (כמה מקומות מחזירים `e.message` ללקוח).

---

## 🎨 UI / UX

### 🟠 גבוה

#### 15. נגישות — תמונות ללא `alt`
מתוך 244 תגי `<img>`, **~158 ללא `alt`** (WCAG 1.1.1). קיים בסיס טוב של 298 שימושי `aria-*`, אך פער התמונות משמעותי.
**פעולה:** להוסיף `alt` תיאורי לתמונות תוכן, ו-`alt=""` לתמונות דקורטיביות. לבדוק גם 4 `<div>` עם `on:click` ללא תפקיד מקלדת/`role`.

#### 16. ביצועים — נכסים כבדים ולא-אופטימליים
- מודלי 3D: `static/3d/11.glb` (13MB), `withlev.glb` (11MB).
- תמונות: `deals logo.png` (1.9MB), `botlogo.png` (1.8MB), `cover.png` (1.6MB), `logo-concierge.png` (1.4MB).

פוגע ב-LCP ובחוויית מובייל. **פעולה:** להמיר תמונות ל-WebP/AVIF + responsive `srcset`, lazy-load למודלי 3D (טעינה על-פי-דרישה, לא ב-first paint), ו-CDN.

### 🟡 בינוני

#### 17. גבול שגיאות — קיים ✅
`src/routes/+error.svelte` עם `ErrorScreen`/`NotFoundScreen` — טוב. לוודא שהם מציגים הודעה ידידותית וכפתור חזרה, ולא message גולמי מהשרת.

#### 18. עקביות RTL ורב-לשוניות
האפליקציה עברית-ראשית עם he/en/ar/ru. לבדוק כיסוי מלא של מפתחות i18n (למנוע מפתחות חשופים), עקביות RTL/LTR במעברי שפה, ו-`dir` נכון לכל שפה.

#### 19. מצבי טעינה/ריק
לוודא skeletons/spinners ומצבי-ריק (empty states) בכל מסך שתלוי בנתונים א-סינכרוניים (chat, deals, missions), כדי למנוע "קפיצות" פריסה.

---

## 🧹 היגיינת ריפו & Build

### 🟠 גבוה

#### 20. קבצי cache/לוג/ארטיפקטים ב-Git
צריכים להיות ב-`.gitignore` (מנפחים את הריפו ולעיתים מכילים נתונים):
- `.embed-cache/*.json` (~26MB: `skills.json` 11MB, `missions.json` 6MB, `roles.json` 4.7MB…)
- `dev_output.log`, `test-results/.last-run.json`, `vite.config.js.timestamp-*.mjs`
- קבצים גדולים ב-root: `1lev1 Onboarding Flow.html` (1.7MB), `onboard_final_check.png` (647KB)

**פעולה:** להסיר מ-tracking (`git rm --cached`) ולהוסיף ל-`.gitignore`.

#### 20א. פגיעויות בתלויות (Dependabot)
GitHub מדווח על **157 פגיעויות** בענף הראשי: **9 קריטיות, 52 גבוהות, 78 בינוניות, 18 נמוכות**.
**פעולה:** להריץ `npm audit`, לעדכן/להצמיד גרסאות (במיוחד הקריטיות), ולהפעיל Dependabot alerts+PRs. חובה לסקור לפני עלייה — ראה `https://github.com/Avi-ADAM/1.0/security/dependabot`.

### 🟡 בינוני

#### 21. תיעוד משתני סביבה
אין `.env.example` ב-root (רק ב-`socket-server`). לתעד את כל המשתנים הנדרשים (`ADMINMONTHER`, `GEMINI_API_KEY`, `STRAPI_URL`, `CONSENSUS_*`, ועוד) לפריסה חוזרת נקייה.

#### 22. בחירת adapter לפרודקשן
`svelte.config.js` תומך ב-3 adapters (node/vercel/static) לפי `ADAPTER`. לוודא שיעד הפרודקשן מקובע ומתועד, ושה-runtime תואם (`engines.node: 22.x` בעוד adapter-vercel מוגדר `nodejs20.x`).

#### 23. חוב טכני
38 הערות `TODO/FIXME/HACK`. 50 קבצי בדיקה קיימים (בסיס סביר). מומלץ להריץ `npm run check` (svelte-check) ו-`npm test` ב-CI כתנאי-סף למיזוג.

---

## ✅ צ'קליסט Go-Live

**חוסמים (🔴):**
- [ ] הסרת כל לוגי ה-JWT/טוקנים (סעיף 1)
- [ ] שינוי שם סודות מ-`VITE_` לסודות צד-שרת (סעיף 2)
- [ ] החלפת `global.botContext` בהעברת קונטקסט מפורשת / `AsyncLocalStorage` (סעיף 3)

**נדרש מאוד (🟠):**
- [ ] Rate-limiting על `/api/chat`, `/api/report`, `/api/upload`, `/api/analyze-*` (סעיף 4)
- [ ] כותרות אבטחה + CSP (סעיף 5)
- [ ] Sanitization ל-`{@html}` על תוכן משתמש (סעיף 6)
- [ ] ולידציית גודל/MIME ב-upload (סעיף 7)
- [ ] GraphQL variables במקום שרשור מחרוזות (סעיף 8)
- [ ] נגישות: `alt` לתמונות (סעיף 15)
- [ ] אופטימיזציית נכסים כבדים (סעיף 16)
- [ ] ניקוי cache/logs מ-Git (סעיף 20)

**מומלץ לפני/מיד אחרי עלייה (🟡):**
- [ ] הפעלת Sentry (סעיף 11)
- [ ] logger מדורג במקום `console.log` (סעיף 10)
- [ ] `.env.example` בשורש + קיבוע adapter/runtime (סעיפים 21-22)
- [ ] `npm run check` + `npm test` ב-CI (סעיף 23)

---

### מה כבר טוב (לשימור)
- פרוקסי `qids` עם whitelist ואיסור GraphQL גולמי בפרוד (`api/send`).
- JWT ב-httpOnly cookie, לא נחשף ללקוח (`api/auth`).
- סוד פנימי דרך `handleFetch` שמונע זיוף `isSer` מהדפדפן.
- אכיפת בעלות בצד השרת (עריכת clause/position, בדיקות idempotency בהצבעות).
- timeouts (AbortController) על קריאות יוצאות.
- גבול שגיאות + מסכי 404/error ייעודיים.
