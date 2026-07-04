# סקירת מוכנות לפרודקשן — 1💗1

> תאריך: 2026-07-04 · ענף: `claude/production-readiness-review-1t63qg`
> היקף הסקירה: אבטחה, UI/UX, והיגיינת ריפו לקראת עלייה לאוויר.
> סטאק: SvelteKit (adapter-node/vercel/static) · Mastra AI · Strapi (GraphQL) · Socket.IO · Capacitor.

הסקירה בוצעה על בסיס קריאת קוד סטטית. הממצאים ממוינים לפי חומרה, עם הפניות ל`קובץ:שורה` וכיוון פעולה.

> **עדכון (סבב תיקונים #1):** חלק מהממצאים כבר תוקנו בקוד בענף זה. ראה סעיף [**מה בוצע בסבב זה**](#-מה-בוצע-בסבב-זה) ואת [**בדיקות UI חובה לפני מיזוג ל-main**](#-בדיקות-ui-חובה-לפני-מיזוג-ל-main). כל ממצא שתוקן מסומן ✅ בגוף המסמך.

---

## ✅ מה בוצע בסבב זה

תיקונים בטוחים ובעלי ביטחון גבוה, שאומתו ב-`svelte-check` (לא הוכנסו שגיאות טיפוסים חדשות; השגיאות הקיימות בקבצים אלו הן pre-existing):

| # | ממצא | מה בוצע | קבצים |
|---|---|---|---|
| 1 | דליפת JWT/טוקן ללוגים | הוסרו כל ההדפסות של JWT ו-`STRAPI_TOKEN` | `api-keys/+server.ts`, `jobs/sync-vocabulary.ts`, `server/apiKeys.ts` |
| 2 | סודות עם תחילית `VITE_` | הקוד קורא כעת מ-`process.env` צד-שרת, עם fallback ל-`VITE_` הישן (לא שובר פריסה קיימת) | `api/cron/+server.js`, `mastra/agents/weather-agent.ts` |
| 3 | `global.botContext` משותף בין בקשות | הוחלף ב-`AsyncLocalStorage` (בידוד per-request). מוגר המצב הגלובלי המשותף — כל בקשה מקבלת קונטקסט מבודד | `lib/server/mcpContext.ts` + 18 קבצים (workflow, service, 4 routes, 12 tools) |
| 5 | כותרות אבטחה | נוספו `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, ו-`HSTS` (ב-https) לכל תגובה | `hooks.server.js` |
| 7 | Upload ללא ולידציה | נוספה אכיפת גודל (15MB) ו-whitelist של MIME לפני העברה ל-Strapi | `api/upload/+server.ts` |
| 10 | לוג לכל בקשה | הוסר `console.log(lang, pathname)` מה-hook | `hooks.server.js` |
| 20 | ארטיפקטים ב-Git | הוסרו מ-tracking (`.embed-cache/`, `dev_output.log`, `test-results/`, `vite timestamp`) + עודכן `.gitignore` | `.gitignore` |

**נותר להשלמה (דורש החלטה/תשתית — לא תוקן אוטומטית):** ר' סעיפים 4, 6, 8, 11 למטה. הסיבה שלא בוצעו אוטומטית: הם דורשים החלטת תשתית (Rate-Limit store), או תלות חדשה (DOMPurify) שעלולה לשנות רינדור קיים. מומלץ לבצע בסבב ייעודי עם בדיקה.

> ⚠️ **סעיף 3 — אימות runtime חובה:** המעבר ל-`AsyncLocalStorage` אומת סטטית (0 שגיאות טיפוסים חדשות), אך **הקשר בין-async חייב אימות בזמן ריצה**: יש לוודא שכלי ה-AI (טיימרים, ניווט, חיפוש משימות) עדיין מקבלים את זהות המשתמש בפועל דרך ה-UI. בדיקה קריטית: **שני משתמשים שונים בו-זמנית** — לוודא שאין ערבוב זהויות (זה בדיוק הבאג שתוקן).

> ⚠️ **פעולת דיפלוי נדרשת לסעיף 2:** לאחר המיזוג, יש להגדיר בסביבת הפרודקשן את המשתנים **בלי** תחילית `VITE_`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `DEPLOY_HOOK`, `GOOGLE_GENERATIVE_AI_API_KEY` (או `GEMINI_API_KEY`). לאחר אימות שהם עובדים — **למחוק** את `VITE_TELEGRAM_BOT_TOKEN`, `VITE_TELEGRAM_CHAT_ID`, `VITE_HOOK`, `VITE_GOOGLE_API` כדי לסגור סופית את הדליפה.

---

## 🧪 בדיקות UI חובה לפני מיזוג ל-main

התיקונים אומתו סטטית (type-check). את הבאים חובה לבדוק ידנית דרך ה-UI/דפדפן לפני מיזוג:

- [ ] **כותרות אבטחה (סעיף 5) — הכי חשוב לבדוק:** לגלוש באתר ולוודא שהכל נטען תקין (Network tab ללא חסימות). במיוחד:
  - מפות **MapLibre**, תמונות **Cloudinary**, וידאו, גרפים (d3/layercake), מודלי 3D (Threlte).
  - התחברות/הרשמה, socket realtime (`socket.1lev1.com`).
  - `X-Frame-Options: SAMEORIGIN` — אם האתר מוטמע ב-iframe במקום כלשהו (למשל אפליקציית Capacitor/עמוד שיתוף), לוודא שלא נשבר.
  - לוודא בכלי הפיתוח → Network → Response Headers שהכותרות אכן מופיעות.
- [ ] **העלאת קבצים (סעיף 7):** להעלות תמונת פרופיל/קובץ תקין (JPG/PNG/PDF) — עובד. לנסות קובץ >15MB או סוג לא-נתמך — נדחה עם הודעה ברורה (413/415), וה-UI מציג שגיאה ידידותית ולא קורס.
- [ ] **Cron / התראות Telegram (סעיף 2):** לוודא ש-`/api/cron` עדיין שולח התראת Telegram (הודעת "השרת נפל") ושה-webhook לפריסה עובד — לאחר הגדרת המשתנים החדשים.
- [ ] **AI Chat (סעיף 2):** לוודא שהצ'אט (`/chat`, רשום ולא-רשום) עדיין מקבל תשובות מ-Gemini (המפתח נקרא כעת מ-`process.env` תחילה).
- [ ] **מפתחות API (סעיף 1):** יצירה/מחיקה/צפייה במפתחות API בעמוד הפרופיל — עדיין עובד (רק ההדפסה ללוג הוסרה).
- [ ] **🔴 כלי AI / botContext (סעיף 3) — קריטי:** דרך הצ'אט, כמשתמש **רשום**, לבצע פעולות שמשתמשות בכלים: "כמה שעות עבדתי", "התחל טיימר", "מצא משימה X", ניווט. לוודא שהתשובות מתייחסות **למשתמש הנכון** (הזהות מגיעה מ-`getMcpContext()`).
- [ ] **🔴 בידוד בין בקשות (סעיף 3) — קריטי:** לפתוח שני משתמשים שונים (שני דפדפנים/מכשירים) ולשלוח פקודות טיימר/שעות **במקביל** — לוודא שכל אחד מקבל את הנתונים שלו בלבד ואין דליפת זהות. וכן נתיב ה-**MCP** (מפתח API חיצוני) — פעולה עדיין מזוהה נכון.
- [ ] **בנייה נקייה:** להריץ `npm run build` עם ה-adapter של הפרודקשן ולוודא שאין שגיאות בנייה (ה-`.embed-cache` שהוסר לא נדרש בזמן ריצה — הוא נוצר מחדש ע"י job הסנכרון בלבד).

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

#### 1. דליפת JWT וטוקן אדמין ללוגים — ✅ תוקן
- `src/routes/api/api-keys/+server.ts:15` — `console.log(jwt, userIdStr)` מדפיס את ה-JWT המלא של המשתמש.
- `src/lib/jobs/sync-vocabulary.ts:111` — `console.log('STRAPI_TOKEN:', STRAPI_TOKEN)` מדפיס את טוקן האדמין המלא של Strapi.
- `src/lib/server/apiKeys.ts:130` — מדפיס תחילית של הטוקן (חמור פחות, אך מיותר).

**סיכון:** מי שיש לו גישה ללוגים (Vercel/Docker/ניטור) מקבל טוקן פעיל להתחזות מלאה. **פעולה:** להסיר לחלוטין. לעולם לא ללגג ערכי אימות.

#### 2. סודות עם תחילית ציבורית `VITE_` — ✅ תוקן בקוד (דורש פעולת דיפלוי)
משתני סביבה עם תחילית `VITE_` נחשבים ציבוריים ב-Vite ועלולים להיכלל בבאנדל הלקוח. בשימוש כיום כסודות:
- `VITE_TELEGRAM_BOT_TOKEN`, `VITE_TELEGRAM_CHAT_ID` — `src/routes/api/cron/+server.js:23-24`
- `VITE_HOOK` — webhook לפריסה מחדש (`api/cron`) — הפעלה שלו ע"י גורם עוין = טריגר פריסות/DoS.
- `VITE_GOOGLE_API`

**פעולה:** לשנות שם לסודות צד-שרת בלבד (בלי `VITE_`), ולקרוא דרך `$env/static/private` / `$env/dynamic/private`. להשאיר `VITE_` רק לערכים שבאמת ציבוריים (למשל `VITE_URL`, `VITE_SOCKET_URL`).

#### 3. מצב גלובלי משותף בין בקשות — `global.botContext` — ✅ תוקן (דורש אימות runtime)
היו 31 שימושים ב-`global.botContext`. בשרת Node שמשרת בקשות במקביל, אובייקט גלובלי יחיד הוחלף (race) בין משתמשים בו-זמנית — כולל `userId`, `fetchInstance`, ו-`isInternalBot`.

**סיכון (היה):** נזילת הקשר/הרשאות בין משתמשים (בקשה של משתמש א' רצה עם הקונטקסט של משתמש ב'), ובאגים לא-דטרמיניסטיים.

**בוצע:** ה-abstraction הקיים (`getMcpContext`/`setMcpContext` ב-`src/lib/server/mcpContext.ts`) גובה כעת ב-**`AsyncLocalStorage`** במקום ב-`global`. כל בקשה נכנסת לקונטקסט מבודד משלה (`enterWith`) שמתפשט אוטומטית לאורך שרשרת ה-async (workflow → agent → tools) בלי דליפה בין בקשות. **כל 34 האתרים** שנגעו ישירות ב-`global.botContext` הומרו לשימוש ב-abstraction:
- כותבים: `chat/+server.ts`, `chat-workflow.ts`, `chat-service.ts`, `mastra/+server.js`, `mastra-v2/+server.js`, `mcp/[apiKey]/+server.ts`, `missionTimers.ts`.
- קוראים: 12 כלים (`missionTimers`, `basicTimerTools`, `findMissionTool`, `findUserProjectsTool`, `timerAnalytics`, `delegateToAgentTool`, `getChatHistoryTool`, ואלה שכבר השתמשו ב-abstraction).
- ניקוי: `delete global.botContext` → `clearMcpContext()`.

**נבחר `enterWith` (ולא `als.run()` עוטף)** כדי לשמור על מבנה הקוד הקיים (set בראש ה-handler, read בהמשך) — diff מינימלי וסיכון נמוך. אומת ב-`svelte-check`: **0 שגיאות טיפוסים חדשות** (סה"כ נשאר 1428, זהה ל-baseline).

**עדיין נדרש — אימות runtime:** ההתפשטות בין-async חייבת אימות בפועל דרך ה-UI (ר' [בדיקות UI](#-בדיקות-ui-חובה-לפני-מיזוג-ל-main), סעיפים המסומנים 🔴). זה קוד שרץ בזמן ריצה ולא ניתן לוודא במלואו סטטית.

---

### 🟠 גבוה

#### 4. אין Rate-Limiting על נקודות קצה ציבוריות ויקרות
- `POST /api/chat` — ציבורי (משתמש לא-רשום), קורא ל-Gemini בכל בקשה → עלות/ניצול.
- `POST /api/report` — ציבורי, יוצר רשומות ב-Strapi + מציף Telegram → ספאם.
- `POST /api/analyze-cv`, `POST /api/upload`, `POST /api/analyze-business` — יקרים/כבדים.

**פעולה:** Rate-limit לפי IP/משתמש (בזיכרון/Redis/Upstash), + CAPTCHA/הוכחת-אנוש על טפסים ציבוריים.

#### 5. כותרות אבטחה — ✅ כותרות בסיס נוספו · CSP מלא עדיין נדרש
**בוצע:** נוספו ב-`hooks.server.js` הכותרות `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, ו-`Strict-Transport-Security` (רק ב-https).

**עדיין נדרש:** **Content-Security-Policy מלא** לא הוגדר בכוונה — הוא דורש סבב ייעודי ובדיקה כדי לאשר (whitelist) את כל המקורות החיצוניים (Cloudinary, MapLibre, Google, Telegram, fonts, socket). CSP חשוב במיוחד לצד השימוש ב-`{@html}` (ר' סעיף 6). לבדוק את הכותרות שנוספו דרך ה-UI (ר' [בדיקות UI](#-בדיקות-ui-חובה-לפני-מיזוג-ל-main)).

#### 6. `{@html}` על תוכן שמקורו במשתמש (XSS)
34 שימושי `{@html}`. חלקם על מפתחות תרגום (`$t(...)`) — סביר. אך אלה מרנדרים תוכן שמקורו במשתמשים:
- `src/routes/(regandnon)/meeting/+page.svelte:786` — `pend.attributes.pgisha.data.attributes.desc`
- `src/lib/components/prPr/tasks/taskModal.svelte:453` — `act.des`
- `src/lib/celim/messeges.svelte:153` — `message`
- `src/lib/celim/tile.svelte:153`, `src/lib/components/lev/mid.svelte:2581`, `coinui.svelte:170`

**פעולה:** לחטא (sanitize) כל HTML שמקורו במשתמש עם DOMPurify לפני רינדור, או להחליף ב-טקסט רגיל.

#### 7. Upload ללא ולידציה — ✅ תוקן
`src/routes/api/upload/+server.ts` מוודא JWT אך **מעביר את הקובץ ל-Strapi ללא בדיקת גודל/סוג MIME**.

**פעולה:** לאכוף מגבלת גודל, whitelist של סוגי MIME, ולדחות מוקדם. אחרת — DoS/העלאת קבצים זדוניים.

#### 8. בניית GraphQL ע"י שרשור מחרוזות + sanitize ידני
`src/routes/api/onboard/save/+server.ts:61,117-118` בונה שאילתות ע"י אינטרפולציה (`"${sanitize(v)}"`). `sanitize` רק בורח ממרכאות וחותך ל-200 תווים — שביר.

**פעולה:** להשתמש ב-GraphQL **variables** (כמו ב-`/api/send`) במקום שרשור מחרוזות, בכל נקודות הקצה.

#### 9. `Access-Control-Allow-Origin: '*'` ב-socket-server
`socket-server/src/index.ts:179` על נתיב ה-HTTP (בעוד ש-Socket.IO עצמו מגביל origin ב-`:47`). מומלץ ליישר קו ולהגביל גם את נתיב ה-HTTP.

---

### 🟡 בינוני

#### 10. ~1,166 קריאות `console.log` ב-`src` — 🟡 חלקי
רעש, פגיעה בביצועים, ודליפת מידע פוטנציאלית בפרודקשן.
**בוצע:** הוסר הלוג-לכל-בקשה מ-`hooks.server.js` (`console.log(lang, pathname)`).
**עדיין נדרש:** שאר ~1,165 ההדפסות — להחליף ב-logger עם רמות (debug/info/error) שמושתק בפרוד, או strip ב-build.

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

#### 20. קבצי cache/לוג/ארטיפקטים ב-Git — ✅ תוקן
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
- [x] ✅ הסרת כל לוגי ה-JWT/טוקנים (סעיף 1)
- [x] ✅ שינוי שם סודות מ-`VITE_` לסודות צד-שרת בקוד (סעיף 2) — ⚠️ נותרה פעולת דיפלוי (הגדרת המשתנים החדשים + מחיקת הישנים)
- [x] ✅ החלפת `global.botContext` ב-`AsyncLocalStorage` (סעיף 3) — ⚠️ נדרש אימות runtime דרך ה-UI

**נדרש מאוד (🟠):**
- [ ] Rate-limiting על `/api/chat`, `/api/report`, `/api/upload`, `/api/analyze-*` (סעיף 4)
- [x] ✅ כותרות אבטחה בסיסיות (סעיף 5) · ⬜ CSP מלא עדיין נדרש
- [ ] Sanitization ל-`{@html}` על תוכן משתמש (סעיף 6)
- [x] ✅ ולידציית גודל/MIME ב-upload (סעיף 7)
- [ ] GraphQL variables במקום שרשור מחרוזות (סעיף 8)
- [ ] נגישות: `alt` לתמונות (סעיף 15)
- [ ] אופטימיזציית נכסים כבדים (סעיף 16)
- [x] ✅ ניקוי cache/logs מ-Git (סעיף 20)

**מומלץ לפני/מיד אחרי עלייה (🟡):**
- [ ] הפעלת Sentry (סעיף 11)
- [~] logger מדורג במקום `console.log` (סעיף 10) — הוסר הלוג-לכל-בקשה; השאר פתוח
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
