# PLAN_MCP_APPS — תצוגות אינטראקטיביות בתוך השיחה (MCP Apps)

> **מצב:** שלב 1 (טיימר) בנוי, נבדק ביחידה, בפרוטוקול ובדפדפן — **ממתין ל-deploy ולבדיקה ב-claude.ai**.
> שלבים 2–3 לא התחילו.

## למה

אנשים שמחברים את 1lev1 לסוכן שלהם (Claude, ChatGPT…) שואלים אם הסוכן יכול "לפתוח" בשיחה
טיימר, רשימה מסודרת או גרף חלוקה. בלי שום דבר מצדנו הסוכן יכול לצייר מהנתונים שלנו
גרף או טבלה בעצמו — אבל אין לנו שליטה על המראה, וטיימר כזה הוא שעון מצויר: הוא לא
מחובר לטיימר האמיתי של המשימה ולא רושם שעות.

**MCP Apps** (הרחבה רשמית של הפרוטוקול, SEP-1865, `io.modelcontextprotocol/ui`) נותנת
לשרת לשלוח ממשק משלו: כלי מצביע על משאב `ui://…` מסוג `text/html;profile=mcp-app`,
והמארח (claude.ai, אפליקציית Claude, ChatGPT, VS Code, Goose…) מצייר אותו ב-iframe
מבודד בתוך השיחה ומעביר לו את תוצאת הכלי. התצוגה יכולה לקרוא שוב לכלים של אותו שרת
(`tools/call`) — כלומר כפתור "עצור" שבאמת עוצר.

## איך זה בנוי

| קובץ | מה |
|---|---|
| `src/lib/server/mcp/apps/timerApp.ts` | התצוגה עצמה: דף HTML אחד בלי שום משאב חיצוני, והמחרוזות שלה בחמש שפות |
| `src/lib/server/mcp/apps/index.ts` | `MCP_APP_URIS`, `mcpAppResources(lang)` (ה-`appResources` של `MCPServer`), `mcpUiMeta(uri)` |
| `src/lib/server/mcp/toolManifest.ts` | שדה `ui` חדש ברשומת כלי — הכלי שמציג את התצוגה |
| `src/lib/server/mcp/guard.ts` | `wrapMcpTool` מעביר `mcp._meta` (קודם העביר רק annotations, וה-`_meta` היה נבלע) |
| `src/routes/api/mcp/+server.ts` | מעביר `meta: mcpUiMeta(entry.ui)` לכל כלי, ו-`appResources` רק למשתמש מחובר |
| `src/mastra/tools/missionTimers.ts` | `getActiveTimersTool` מחזיר גם `sessionStart` (תחילת הקטע הפתוח — ממנו השעון סופר) ו-`totalHours`. תוספת בלבד |

`@mastra/mcp` 1.7.0 (המותקן) תומך בזה מובנה: `appResources` ב-`MCPServer`, ו-`mcp._meta`
של כלי עובר ל-`tools/list`. השרת מכריז על ההרחבה ב-capabilities לבד.

### כללים שהתצוגה שומרת

- **לא מדברת עם 1lev1 ישירות.** אין `fetch`, אין דומיין ב-CSP. כל קריאה וכל עצירה עוברות
  דרך המארח כ-`tools/call` לשרת הזה — אז ה-guard (תחום המפתח, חברות, rate limit, audit)
  רואה לחיצה בתצוגה בדיוק כמו קריאה של המודל.
- **טקסט של חברים הוא נתון.** שם משימה ושם רקמה נכנסים רק דרך `textContent`; בדיקה נכשלת
  על `innerHTML` וחבריו.
- **הטקסט למודל לא משתנה.** כל כלי עם תצוגה ממשיך להחזיר את כל התוצאה כטקסט, כך שמארח בלי
  MCP Apps לא מפסיד כלום.
- **שפה:** ה-iframe לא מגיע ל-`$t()`, אז התצוגה נושאת את המחרוזות של שפת המקבל — שפה אחת,
  שנבחרת בשרת לפי `ctx.lang` של הבקשה (אותו דפוס כמו payload של התראות). עברית וערבית
  מקבלות `dir="rtl"`.
- **אין אישורים בתצוגה.** "עצור" על הטיימר של עצמך הוא `selfWrite` — הפעולה של המשתמש על
  העבודה שלו. הצבעה, חלוקת רווחים, אישור מכירה וכל מה שמטיל משהו על חבר אחר — התצוגה רק
  מציגה ומקשרת לאתר (`ui/open-link`). זה אותו כלל שב-instructions של השרת.
- **המודל יודע מה קרה.** אחרי עצירה התצוגה שולחת `ui/update-model-context`, כך שהתור הבא
  של הסוכן יודע שהטיימר נעצר מהתצוגה.

## שלבים

### שלב 1 — טיימר ✅ בנוי

`getActiveTimersTool` ו-`timerActionTool` מציגים את `ui://1lev1/timer.html`: לכל טיימר פעיל —
שם המשימה, הרקמה, שעון חי של הסשן הנוכחי וכפתור "עצירה". אחרי עצירה (או כש-`timerActionTool`
רץ מהצ'אט) התצוגה קוראת שוב ל-`getActiveTimersTool` ומציגה את המצב החי. כפתורי "רענון"
ו"פתיחה ב-1lev1" (`/timers`).

**נבדק:**
- `src/lib/server/mcp/apps/apps.test.ts` (15) — מחרוזות זהות בכל השפות, RTL, בלי משאב
  חיצוני, בלי `innerHTML`, התצוגה קוראת רק לכלים שמקושרים אליה, כל `ui` במניפסט רשום,
  ובפרוטוקול עצמו (SDK client על InMemoryTransport): ההרחבה מוכרזת, `tools/list` נושא
  `_meta.ui.resourceUri`, `resources/read` מחזיר `text/html;profile=mcp-app` בשפת המשתמש,
  והתשובה למודל עדיין טקסט.
- ידנית ב-Chromium מול מארח מדומה: `ui/initialize` → תוצאת כלי → שעון רץ → "עצירה" →
  `tools/call timerActionTool {action:'stop', missionId}` → `ui/update-model-context` →
  `tools/call getActiveTimersTool` → "אין טיימר פעיל כרגע". בעברית ובאנגלית, בלי שגיאות.

**נשאר:**
1. deploy, ואז לחבר את הקונקטור ב-claude.ai ולבקש "מה הטיימרים שלי?" — לוודא שהתצוגה
   עולה, שהלחיצה עוברת את ה-guard, ושגובה ה-iframe מתעדכן.
2. אותו דבר ב-ChatGPT (Apps SDK מדבר את אותו פרוטוקול).
3. בדיקת ערכת צבעים כהה מול המשתנים שהמארח שולח (`hostContext.styles.variables`).

### שלב 2 — התחלת טיימר מהתצוגה

היום מתחילים טיימר רק מהצ'אט. כדי לאפשר "התחל" בתצוגה, `getActiveTimersTool` (או כלי
חדש, `app`-only לפי `_meta.ui.visibility`) צריך להחזיר גם את המשימות בתהליך שאין עליהן
טיימר. שאילתה `8getMissionsOnProgress` כבר מביאה אותן.

### שלב 3 — רשימה וגרף

| תצוגה | כלי | מה מציגה |
|---|---|---|
| "מה מחכה לי" | `getMyUpdatesTool` | רשימה לפי דחיפות, ספירה לאחור עד שהשתיקה תאשר כל פריט, קישור לפעולה באתר |
| חלוקה | `getMyStakeTool` / `getRikmaLedgerTool` | עוגה של חלקי השותפים, ופירוט כל חלוקת רווחים |

אותו מנגנון: קובץ ב-`apps/`, URI ב-`MCP_APP_URIS`, `ui:` ברשומת המניפסט. גרף נכתב ב-SVG
בתוך הדף (בלי ספריית תרשימים מ-CDN, כדי להישאר בלי דומיינים ב-CSP).

## סיכונים

- **מארחים שונים, תמיכה חלקית.** חלק מהמארחים לא שולחים `hostContext.styles`, או לא תומכים
  ב-`ui/update-model-context`. התצוגה עובדת בלי שניהם (ערכי ברירת מחדל, `catch`).
- **גרסת הפרוטוקול.** התצוגה מדברת `2026-01-26` (`LATEST_PROTOCOL_VERSION` של
  `@modelcontextprotocol/ext-apps` 1.7.1). כשהגרסה תתקדם — לעדכן את
  `MCP_APPS_PROTOCOL_VERSION` ב-`timerApp.ts`.
- **Rate limit.** כל לחיצה וכל רענון הם קריאת כלי שנספרת בדלי של המפתח. אין רענון אוטומטי
  מחזורי — השעון רץ מקומית מ-`sessionStart`.
