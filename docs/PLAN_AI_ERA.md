# PLAN — המעבר לעידן ה-AI: איפה אנחנו, מה אפשר להשיג, ואיך

מסמך-על שממפה את כל תשתית ה-AI הקיימת בפלטפורמה, את הפערים, ותכנית מדורגת
להשלמת המעבר: קונטקסט פר-פרויקט, סוכנים חיצוניים דרך MCP עם אישור אנושי,
BYO API key, סיכום יומי חכם והצעות פרואקטיביות.

מסמכים קשורים: [`PLAN_MISSION_AI.md`](PLAN_MISSION_AI.md),
[`MOACH_AI_AGENT_GUIDE.md`](../MOACH_AI_AGENT_GUIDE.md),
[`PLAN_CONCIERGE.md`](../PLAN_CONCIERGE.md),
[`SPEC_SOCKET_REALTIME.md`](SPEC_SOCKET_REALTIME.md).

---

## חלק א' — Where are we: מיפוי המצב הקיים

### 1. Mastra — הליבה (`src/mastra/`)

| רכיב | קבצים | מצב |
|------|-------|-----|
| אינסטנס גלובלי | `src/mastra/index.ts` | עובד, אבל: storage הוא `:memory:` (שום דבר לא נשמר), והסוכנים נרשמים עם placeholders — `createNavigationAgent('apiKey','language','useId')` |
| סוכנים | `agents/`: intent, navigation, timer, help, sale, reg-bot, nonreg-bot, weather | ראוטינג לפי כוונה עובד; כל הקונטקסט הוא `SITE_CONTEXT` סטטי + userId + שפה. אין זיכרון בין שיחות |
| Workflows | `chat-workflow.ts` (intent→agent), `analyze-cv.ts` (extract→match) | עובדים |
| כלים (Tools) | ~20 ב-`tools/`: טיימרים, משימות, פרויקטים, ניווט, page context | קריאה בעיקר; יצירה: `createProjectTool` (prefill URL — דפוס האישור האנושי!), `createTaskTool` + `createMissionTool` (יצירה ישירה דרך ActionService) |
| מודלים | `lib/createModel.ts` | Google/Groq/NVIDIA/OpenAI עם fallback chain — אבל מפתחות מ-env בלבד. אין BYO key |

### 2. צ'אט (`/chat` + `/api/chat`)

- משתמש רשום → `chatWorkflow` (intent → סוכן ייעודי); לא רשום → `nonreg-bot` ישיר.
- מחזיר rich components: ניווט, `timer_edit` (אמיתי, מ-Strapi), אבל
  `detectRenderComponents` מחזיר **דאטה דמו קשיח** (שותפויות/הצבעות מומצאות) —
  חוב שצריך להחליף בדאטה אמיתי.
- קונטקסט = ההודעות האחרונות + `currentPath`. אין קונטקסט פרויקט, אין זיכרון.

### 3. MCP Server (`/api/mcp`)

- `src/routes/api/mcp/+server.ts`: אימות Bearer עם API key, מצב לא-מאומת עם
  `getPlatformInfo`/`howToConnect` בלבד, מצב מאומת חושף את כל הסוכנים,
  ה-workflows ו-15 כלים. `[apiKey]` בנתיב — legacy, כדאי להוציא משימוש (מפתח ב-URL נשמר בלוגים).
- זהות פר-בקשה: `mcpContext.ts` עם AsyncLocalStorage — תקין ובטוח.
- מפתחות API: `apiKeys.ts` — HMAC-SHA256 עם NONCE, userId מקודד במפתח, cache
  5 דקות, אחסון hash בלבד ב-Strapi. UI: `/api/api-keys` + זרימת `mcp-connect`
  עם callback ל-`npx 1lev1-mcp`. **זו תשתית טובה שכבר עובדת.**
- חסר: scopes למפתח (read-only / write), תפוגה, rate limiting, ביטול מרוכז.

### 4. מערכת הפעולות — הנכס הגדול ביותר (`src/lib/server/actions/`)

**216 קונפיגורציות פעולה** (`configs/`) עם ולידציה, הרשאות (jwt / projectMember /
custom), ביצוע GraphQL, ו-NotificationOrchestrator (socket / email / telegram /
push). כל פעולה עסקית בפלטפורמה — הצבעות, חלוקות, משאבים, משמרות, מכירות,
תהליכים — כבר מוגדרת פה בצורה מוכנה-למכונה.

**רק ~3 מתוכן חשופות כיום ל-AI.** זה הפער הכי גדול וגם ההזדמנות הכי זולה:
`paramSchema` שם כמעט זהה ל-zod schema שכלי Mastra צריך.

### 5. תשתיות תומכות שכבר קיימות

| תשתית | קבצים | רלוונטיות ל-AI |
|-------|-------|----------------|
| Embeddings + Pinecone | `src/lib/embed/` (matcher, pinecone, gemini-embeddings) — namespaces: skills/roles/work_ways/missions/vallues | הבסיס ל-RAG פר-פרויקט ולהצעות חכמות |
| NotificationOrchestrator | `src/lib/server/notifications/` — email, push, telegram, socket | ערוץ ההפצה של הסיכום היומי וההצעות |
| חוזה ישויות ל-agents | `MOACH_AI_AGENT_GUIDE.md` — meta tags + JSON-LD בכל דף ישות, מפת URL מלאה | סוכן חיצוני יודע לאן לנווט את המשתמש לאישור |
| Concierge | `src/lib/server/ai/conciergeAgent.ts`, `extractWish.ts`, `enrichWish.ts` | דפוס extract→match→prefill קיים |
| Socket server | `socket-server/` | דחיפת עדכונים חיים ל-UI כשסוכן פועל |

### 6. סיכום הפערים

1. **קונטקסט קטן** — הבוט לא מכיר את הפרויקט שהמשתמש בתוכו: חברים, הצבעות
   פתוחות, משימות בתהליך, דיונים.
2. **אין זיכרון** — LibSQL בזיכרון; כל שיחה מתחילה מאפס.
3. **216 פעולות, 3 כלים** — רוב הפלטפורמה לא נגישה לסוכנים.
4. **אין דפוס אישור אחיד** — `createProjectTool` עושה prefill-URL (מצוין),
   `createTaskTool` יוצר ישירות עם admin token (מסוכן כברירת מחדל).
5. **אין BYO key** — משתמש לא יכול להביא מפתח Gemini/OpenAI משלו.
6. **אין שכבה פרואקטיבית** — אין סיכום יומי, אין הצעות, אין cron.
7. **חוב קטן**: placeholders ב-`mastra/index.ts`, דאטה דמו ב-`/api/chat`,
   נתיב `[apiKey]` legacy.

---

## חלק ב' — What we can achieve and how: חמישה שלבים

### שלב 1 — מנוע קונטקסט פר-פרויקט (התשתית לכל השאר)

**מטרה:** כשמשתמש ב-`/moach/[projectId]/*` שואל "מה קורה?", הבוט יודע בדיוק
מה קורה — ולא רק שם הדף.

1. **`buildProjectContext(projectId, userId)`** — `src/lib/server/ai/projectContext.ts`:
   שאילתת GraphQL אחת (או שתיים) שמחזירה: שם+תיאור+ערכים, חברים ותפקידים,
   משימות בתהליך (+טיימרים חיים), הצבעות פתוחות והאם המשתמש כבר הצביע,
   חלוקות ממתינות, 10 רשומות הפורום האחרונות. Cache ל-2–5 דקות (בדומה ל-`KEY_CACHE`).
2. **`getProjectContextTool`** — כלי חדש שקורא לזה; נחשף לסוכנים הפנימיים
   **וגם** ב-MCP (מוגבל לפרויקטים שהמשתמש חבר בהם — בדיקת membership כמו
   `isMissionMember`).
3. **הזרקה אוטומטית**: ב-`/api/chat`, כש-`currentPath` מתחיל ב-`/moach/`,
   לחלץ projectId ולהזריק תקציר קונטקסט (מכווץ, ~1–2K טוקנים) ל-instructions
   של הסוכן. הדאטה כבר יש — זה חיבור, לא בנייה.
4. **זיכרון**: להחליף את `LibSQLStore(':memory:')` בקובץ/Postgres, ולהוסיף
   Mastra Memory עם thread לפי `userId:projectId` — שיחה נמשכת גם מחר.
5. **RAG (שלב 1.5)**: namespace חדש ב-Pinecone (`project-content`), אינדוקס
   תיאורי משימות/דיונים/החלטות עם metadata של projectId, וכלי
   `searchProjectKnowledgeTool`. כל צנרת ה-embeddings כבר קיימת ב-`src/lib/embed/`.

**מאמץ:** 1–2 שבועות. **תלות:** אין. זה הבסיס לשלבים 4–5.

### שלב 2 — גשר פעולות→כלים + דפוס אישור אחיד

**מטרה:** להפוך את 216 הפעולות לכלי AI — בבטחה.

1. **מפעל כלים גנרי** — `src/mastra/lib/actionToTool.ts`:
   `actionConfigToTool(config, options)` שממיר `paramSchema` ל-zod, מריץ דרך
   `actionService.executeAction` עם `getMcpContext()`. ה-authRules כבר נאכפים
   בתוך ActionService — לא צריך לשכפל.
2. **סיווג לפי סיכון** (allowlist מפורש, לא חשיפה עיוורת):
   - **קריאה** (getDecisionDetails, loadCatalog, getSiteShareArchive…) → חשיפה ישירה.
   - **כתיבה קלה** (addDiunEntry, chat, joinMeeting…) → ביצוע ישיר + הודעת אישור בתשובה.
   - **כתיבה כבדה** (addVote, createHaluka, acceptCounterOnAsk, decideSiteShare…) →
     **מצב הצעה בלבד** (סעיף 3).
3. **דפוס "הצעה + ניווט לאישור"** — הכללה של `createProjectTool` לכל פעולה כבדה:
   - הכלי לא מבצע; הוא מחזיר `{ proposal, reviewUrl }` כאשר
     `reviewUrl = /moach/[projectId]/votes/[voteId]?action=proposeX&...params`.
   - דפי הישות (שכבר ממופים ב-`MOACH_AI_AGENT_GUIDE.md`) מקבלים consumer של
     `?action=` שממלא את הטופס — בדיוק כמו ש-`/me` צורך `action=createproject` היום.
   - המשתמש רואה את הטופס המלא **באתר**, בודק, ולוחץ אישור. הפעולה עצמה רצה
     ב-JWT של המשתמש, לא ב-admin token.
   - זה בדיוק ה-flow שביקשת: "יצירה של ריקמה ומשימות ישירות מסוכן עם ניווט
     לתצוגה באתר כדי שהמשתמש יוודא לפני שהוא מאשר".
4. **תיקון `createTaskTool`/`createMissionTool`**: ברירת מחדל = מצב הצעה;
   ביצוע ישיר רק אם המשתמש סימן במפורש mode מתירני למפתח (ראה scopes בשלב 3).
5. **התחלה מדורגת**: 10 פעולות קריאה + 5 הצעה בגל ראשון (addVote,
   createMission, createHaluka, addDiunEntry, offerWishHelp), ואז להרחיב.

**מאמץ:** המפעל + consumer גנרי של `?action=` — שבוע; כל גל פעולות — ימים.

### שלב 3 — BYO API key וסוכנים חיצוניים

**מטרה בשני כיוונים:** (א) המשתמש מביא מפתח מודל משלו לבוט של האתר;
(ב) המשתמש מחבר את הסוכן שלו (Claude, Cursor, ChatGPT…) לאתר דרך MCP.

**(א) מפתחות מודל של המשתמש:**
1. טבלת Strapi `user-model-keys`: provider (google/openai/groq/anthropic),
   מפתח מוצפן (AES-256-GCM עם secret בסביבה — לא plaintext), ברירת מחדל.
2. UI בפרופיל ליד ניהול מפתחות ה-MCP הקיים.
3. `createModel.ts`: סדר resolution חדש — מפתח משתמש → מפתח פלטפורמה.
   ב-`/api/chat` שולפים את מפתח המשתמש (עם cache) ומעבירים ל-workflow —
   הפרמטר `apiKey` כבר קיים בכל השרשרת, רק צריך למלא אותו בערך אמיתי.
4. בונוס: מסיר את תקרת העלות מהפלטפורמה — משתמשי power משלמים על עצמם.

**(ב) הקשחת והשלמת ה-MCP:**
1. **Scopes למפתח**: שדה `scopes` ב-api-keys (`read`, `propose`, `write`);
   `/api/mcp` מסנן את רשימת הכלים לפי scope. ברירת מחדל: `read+propose`.
2. הוצאת `/api/mcp/[apiKey]` משימוש (redirect להוראות Bearer).
3. Rate limiting פר-מפתח + עמודת `last_used_at` לניראות.
4. תקציר `getProjectContextTool` + כלי החיפוש מ-שלב 1 נחשפים גם פה — סוכן
   חיצוני מקבל את אותו קונטקסט כמו הבוט הפנימי.
5. תיעוד ציבורי קצר: "חבר את Claude/Cursor ל-1lev1 בשתי דקות" — הזרימה
   (`mcp-connect` + `npx 1lev1-mcp`) כבר בנויה, חסר רק התיעוד והליטוש.

**מאמץ:** (א) 3–4 ימים; (ב) 3–4 ימים.

### שלב 4 — סיכום יומי חכם והצעות פרואקטיביות

**מטרה:** "יש לך הצבעה X בפרויקט Z — רוצה להציע Y?"

1. **יומן אירועים**: ActionService כבר עובר בנקודה אחת — להוסיף כתיבת שורת
   audit (`user, action, entity, projectId, timestamp`) לטבלת `activity-log`
   ב-Strapi (או לקובץ LibSQL של Mastra). בלי זה אין ממה לסכם.
2. **Digest workflow** — `src/mastra/workflows/daily-digest.ts`:
   - לכל משתמש פעיל: אירועי 24 שעות בפרויקטים שלו + מצב פתוח (הצבעות שלא
     הצביע, משימות תקועות, חלוקות ממתינות, טיימרים שנשכחו) — הכול משאילתות
     שכבר קיימות ב-QIDS/configs.
   - סיכום עם Gemini Flash (זול; או מפתח המשתמש משלב 3) בשפת המשתמש,
     עם deep-links לפי מפת ה-URL של `MOACH_AI_AGENT_GUIDE.md`.
   - הפצה דרך `NotificationOrchestrator` הקיים — email / push / telegram
     לפי העדפת משתמש. אפשרות opt-out פר-ערוץ.
3. **טריגר**: endpoint פנימי `POST /api/cron/daily-digest` (מוגן ב-secret —
   יש כבר `internalSecret.js`) שמופעל מ-cron חיצוני או מה-socket-server
   (process קבוע שכבר רץ — הכי פשוט להוסיף שם `node-cron`).
4. **הצעות חכמות — מדורג:**
   - **גל 1 (דטרמיניסטי, זול, מדויק):** חוקים — הצבעה פתוחה בלי קול שלך;
     משימה בתהליך בלי טיימר שבוע; משאב שהתקבל בלי אישור. ה-LLM רק מנסח,
     לא מחליט. אלה ההצעות עם ה-precision הגבוה ביותר.
   - **גל 2 (סמנטי):** matcher הקיים — הכישורים שלך מול משימות פתוחות
     בריקמות אחרות ("המשימה 'עיצוב לוגו' בריקמה Y מתאימה לכישורי העיצוב שלך").
   - **גל 3 (מלא):** הסוכן מקבל את הקונטקסט משלב 1 ומייצר הצעת פעולה
     קונקרטית ("רוצה שאכין טיוטת הצעה Y להצבעה X?") — שנוחתת כ-proposal
     של שלב 2, עם אישור אנושי באתר.

**מאמץ:** יומן + digest + גל 1 — שבוע–שבועיים. תלוי בשלב 1 (קונטקסט) ו-2 (proposals).

### שלב 5 — קופיילוט בכל האתר + ניקוי חוב

1. **החלפת הדמו בדאטה אמיתי**: `detectRenderComponents` ב-`/api/chat` מחזיר
   שותפויות/הצבעות מומצאות — להחליף בקומפוננטות שנבנות מ-`buildProjectContext`
   (סיכום אחזקות אמיתי, הצבעות פתוחות אמיתיות עם כפתור הצבעה שפותח את דף הישות).
2. **Generative UI**: הרחבת מנגנון ה-components כך שכלים מחזירים
   `component: { type, props }` והצ'אט מרנדר — mission_list, vote_card,
   proposal_review — במקום זיהוי regex על טקסט המשתמש.
3. **השלמות חכמות בטפסים** — מימוש [`PLAN_MISSION_AI.md`](PLAN_MISSION_AI.md)
   (resolveMissionSpec + הצעות חיות ב-mission.svelte); אותו מנוע משרת את
   המסלול האוטונומי של שלב 2.
4. **ניקוי**: תיקון ה-placeholders ב-`mastra/index.ts`; איחוד
   `createMissionTool`/`prepareMissionTool` סביב resolveMissionSpec;
   בדיקות לכלים החדשים (יש כבר תשתית vitest עם 109 בדיקות ב-actions).

---

## חלק ג' — עקרונות רוחב

### אבטחה (חוצה את כל השלבים)
- **Human-in-the-loop כברירת מחדל**: כל פעולה משנת-מצב מסוכן חיצוני → proposal
  + אישור באתר. ביצוע ישיר רק ב-scope מפורש.
- **לצמצם את ה-admin token**: היום `createTaskTool` רץ עם `ADMINMONTHER`;
  היעד — ביצוע ב-JWT של המשתמש (במסלול proposal זה קורה מעצמו, כי המשתמש
  מאשר מתוך session מחובר).
- **Scopes + תפוגה + ביטול** למפתחות MCP; לוג `last_used_at`.
- **Prompt injection**: תוכן פרויקט (דיונים, תיאורים) שנכנס לקונטקסט הוא
  קלט לא-מהימן — לתחום אותו בבירור ב-prompt ולא לתת לו לשנות הוראות כלים.

### סדר ביצוע מומלץ (מסלול קריטי)
```
שלב 1 (קונטקסט+זיכרון) ──► שלב 4 (digest+הצעות)
שלב 2 (actions→tools+proposals) ──► שלב 4 גל 3, שלב 5
שלב 3 (BYO key, scopes) — עצמאי, אפשר במקביל
```

### Quick wins לשבוע הראשון
1. אחסון Mastra מתמיד במקום `:memory:` (שורה אחת + קובץ db).
2. `buildProjectContext` + הזרקה ל-`/api/chat` — האפקט המורגש ביותר למשתמש.
3. `actionConfigToTool` + 10 פעולות קריאה ראשונות ב-MCP.
4. תיקון placeholders ב-`mastra/index.ts` והחלפת דאטה הדמו בצ'אט.
5. שדה scopes למפתחות API (ברירת מחדל read+propose).

### מדדי הצלחה
- % שיחות צ'אט שמסתיימות בפעולה שהושלמה (עם אישור) — לא רק תשובה.
- מספר משתמשים עם מפתח MCP פעיל (last_used_at < שבוע).
- CTR על הצעות ה-digest (כמה deep-links נפתחים).
- זמן יצירת ריקמה/משימה מלאה: יעד — מתחת לדקה מרגע הבקשה בצ'אט/סוכן.
