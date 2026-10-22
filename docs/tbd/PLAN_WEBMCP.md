# תכנית — WebMCP: האתר עצמו כספק כלים לסוכנים בדפדפן

> נכתב: 2026-10-22. **שום דבר מזה לא בנוי.** תחום שמשתנה מחודש לחודש, ולכן §1
> מתעד מה נבדק ומתי, וכל שלב נפתח בבדיקה מחדש של המפרט.
> משלים את [PLAN_MCP_TOOLS_V2.md](../inprogress/PLAN_MCP_TOOLS_V2.md) (השרת המרוחק
> `/api/mcp`), [PLAN_MCP_OAUTH.md](../done/PLAN_MCP_OAUTH.md),
> [PLAN_CHAT_MEMORY.md](../done/PLAN_CHAT_MEMORY.md) ו-
> [PLAN_CONCIERGE_EXTERNAL_SOURCES.md](../inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md).

---

## 0. בשורה אחת

יש לנו כבר שרת MCP מרוחק (`api.1lev1.com/api/mcp`) שבנוי על כלי Mastra, עם מניפסט,
שכבות "רדיוס פגיעה", שער חברות, הגבלת קצב ו-audit. WebMCP הוא **אותו רעיון בתוך
הדף**: הדף הפתוח רושם כלים ב-`document.modelContext`, וסוכן שרץ בדפדפן (Gemini in
Chrome, תוסף, ובהמשך גם הבוט שלנו) קורא להם **בתוך הסשן של המשתמש**, בלי מפתח API
ובלי לנחש כפתורים מצילום מסך.

התכנית: **לא לכתוב כלים חדשים.** לחשוף בדפדפן תת-קבוצה מצומצמת, לפי מסלול, של
אותם כלי Mastra מאותו `MCP_TOOL_MANIFEST`, דרך נקודת קצה אחת שעוברת באותו
`wrapMcpTool`. בנוסף — כמה כלי UI מקומיים (מילוי טופס, ניווט) שקיימים רק בדף.

---

## 1. מה נבדק ברשת (2026-10-22)

| נושא | מצב | מקור |
|---|---|---|
| מעמד המפרט | Draft Community Group Report של W3C Web Machine Learning CG, **לא** במסלול תקינה. טיוטה אחרונה: 20 באוקטובר 2026 | [webmachinelearning.github.io/webmcp](https://webmachinelearning.github.io/webmcp/) |
| איפה ה-API | `document.modelContext` (הועבר מ-`navigator` בטיוטה של 2026). Chrome 150 השאיר את `navigator.modelContext` ככינוי מיושן | המפרט; [mywrittenword](https://mywrittenword.com/2026/05/02/webmcp-chrome-navigator-modelcontext-not-mcp-mechanism/); [dev.to](https://dev.to/ai-agent-economy/webmcp-in-2026-which-browsers-support-navigatormodelcontext-complete-compatibility-status-1oe4) |
| IDL נוכחי | `registerTool(tool, {signal, exposedTo})`, `getTools({fromOrigins})`, `executeTool(...)`; ביטול רישום = `abort()` על ה-signal (**אין** יותר `unregisterTool`/`provideContext`). אירועים `toolchange`/`toolactivated`/`toolcancel` | המפרט |
| שדות כלי | `name` (≤128 תווים), `title`, `description`, `inputSchema` (JSON Schema), `execute`, `annotations: { readOnlyHint, untrustedContentHint, consequentialHint }` | המפרט |
| הרשאה | Permissions-Policy feature בשם `tools`, ברירת מחדל `'self'`. iframe חוצה-מקור צריך `allow="tools"` | המפרט; [developer.chrome.com/docs/ai/webmcp](https://developer.chrome.com/docs/ai/webmcp) |
| API הצהרתי | `<form toolname tooldescription [toolautosubmit]>`, `toolparamdescription` על שדות; `SubmitEvent.agentInvoked` + `respondWith()`; `:tool-form-active`. בלי `toolautosubmit` — הדפדפן ממלא ומפקס על כפתור השליחה, **האדם שולח** | [declarative explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md) |
| Chrome | Origin trial מ-Chrome 149 עד 156; מקומית: `chrome://flags/#enable-webmcp-testing`. Lighthouse מזהיר מעל **40 כלים** בדף | [Lighthouse audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools); [dev.to](https://dev.to/thousand_miles_ai/webmcp-in-chrome-149-web-pages-get-a-tool-api-for-ai-agents-bfi) |
| דפדפנים אחרים | Firefox/Safari לא התחייבו; Edge — דיווחים סותרים (ניסיוני מאחורי דגל) | [dev.to](https://dev.to/ai-agent-economy/webmcp-in-2026-which-browsers-support-navigatormodelcontext-complete-compatibility-status-1oe4) |
| מי צורך כלים היום | Gemini in Chrome (הוכרז ב-I/O 2026, מתגלגל); Chrome DevTools MCP (`list_webmcp_tools`, `execute_webmcp_tool`); תוספי בדיקה. **לא מצאתי אישור ש-Claude in Chrome צורך WebMCP** | [dev.to](https://dev.to/r0bertini/gemini-in-chrome-is-about-to-call-webmcp-the-no-agent-uses-it-yet-excuse-just-got-an-expiry-date-51be); [chrome-devtools-mcp](https://www.danilchenko.dev/posts/chrome-devtools-mcp/) |
| Mastra | `@mastra/agent-browser` מקבל WebMCP: PR [#25660](https://github.com/mastra-ai/mastra/pull/25660) (opt-in `webmcp: { enabled, allowedOrigins, toolPrefix:'page_', protocols:['w3c','mcpb'], toolDiscovery }`) — **פתוח, לא ב-main**; PR [#25833](https://github.com/mastra-ai/mastra/pull/25833) (גילוי כלים באמצע ריצה דרך `prepareStep`) מוזג לענף הפיצ'ר בלבד. בצד הלקוח: Mastra `clientTools` ב-`generate/stream` מריץ כלי בדפדפן | PRs; [Mastra client docs](https://mastra.ai/docs/server/mastra-client) |
| polyfill | `@mcp-b/global` (polyfill לא רשמי של `modelContext`) ו-`@mcp-b/transports` (`TabServerTransport` מעל postMessage) | [lobehub](https://lobehub.com/mcp/webmcp-org-npm-packages) |
| אבטחה לפי המפרט | prompt injection דרך metadata/תוצאות/UGC; כוונה מוסתרת ("כלי שקונה"); over-parameterization (איסוף מידע אישי). ההינטים הם **אותות, לא ערובות** | המפרט §6 |

**מסקנה:** ה-API זז (navigator→document, unregister→signal) והצרכן היחיד הממשי הוא
Chrome/Gemini. לכן: שכבת התאמה דקה אחת שלנו, הכל מאחורי דגל, ואף כלי שלא היה בטוח
גם בלי WebMCP.

---

## 2. מה כבר יש אצלנו ומה עובר כמו שהוא

| קיים | איפה | שימוש ב-WebMCP |
|---|---|---|
| ~60 כלי Mastra עם `inputSchema` ב-zod 4 | `src/mastra/tools/` | אותו קוד מבצע את הקריאה בשרת |
| מניפסט עם tier, `project`/`mission` guard, `ai`, `enabled` | `src/lib/server/mcp/toolManifest.ts` | מקור האמת היחיד לרשימה ולשכבה |
| `wrapMcpTool` — קצב, שער חברות, audit, refusal כתוצאה | `src/lib/server/mcp/guard.ts` | עוטף גם קריאות WebMCP |
| `mcpAnnotations` (readOnly/destructive) | toolManifest | ממופה ל-`readOnlyHint`/`consequentialHint` |
| zod → JSON Schema (`z.toJSONSchema(..., {io:'input'})`) | `src/routes/mcp/+page.server.ts` (`inputsOf`) | לחלץ לפונקציה משותפת |
| זהות מה-cookie בלבד | `src/lib/server/chatIdentity.ts` | אותו דפוס לנקודת הקצה |
| Permissions-Policy גלובלי | `src/hooks.server.js:262` | להוסיף `tools=(self)` |
| הבוט באתר (Mastra, `/api/chat`) | `src/routes/api/chat/+server.ts`, `src/mastra/agents/reg-bot.ts` | צרכן שני של אותו רישום (§5 שלב W4) |

**הבדל אחד מהבוט שלנו שאסור לפספס:** `/api/chat` רץ עם `isInternalBot: true`, כלומר
בדיקות החברות מדולגות כי "המשתמש הוא שכתב את ההודעה". ב-WebMCP **סוכן זר** מחליט
מה לקרוא, והוא עלול להיות מוזרק מתוכן של אתר אחר בלשונית אחרת. לכן קריאות WebMCP
רצות **כמו מפתח MCP חיצוני** (`isInternalBot` לא מוגדר) — עם שער חברות והגבלת קצב —
גם כשהזהות מגיעה מה-cookie.

---

## 3. ארכיטקטורה

```
 דף ב-1lev1.com                                     שרת SvelteKit
 ┌─────────────────────────────────────┐            ┌────────────────────────────────────┐
 │ +layout.svelte                       │  load()    │ webmcpSurface(route, user)          │
 │   registerWebMcp(data.webmcp) ───────┼────────────┤  → [{name,title,description,        │
 │     document.modelContext            │            │      inputSchema, hints}]  (≤ 25)   │
 │       .registerTool({ execute:       │            │                                     │
 │          (input) => fetch(           │  POST      │ /api/webmcp/call                    │
 │            '/api/webmcp/call', …) }) ├────────────►  same-origin + cookie → userId      │
 │   + כלי UI מקומיים (מילוי טופס)       │            │  setMcpContext({channel:'webmcp'})  │
 │   + <form toolname=…> הצהרתי          │            │  MCP_TOOL_MANIFEST[name] →          │
 └───────────────▲──────────────────────┘            │    wrapMcpTool(tool, policy).execute│
                 │                                    └────────────────────────────────────┘
   Gemini in Chrome / תוסף / הבוט שלנו (clientTools)
```

### 3.1 בחירת הכלים: `WEBMCP_SURFACES`

קובץ חדש `src/lib/server/webmcp/surfaces.ts`: מסלול → שמות כלים מהמניפסט. לא כל
המניפסט בכל דף (המגבלה של Chrome היא 40, ויותר כלים = בחירה גרועה של הסוכן):

| מסלול | כלים (דוגמה ראשונית) |
|---|---|
| כל דף, אורח | `getPlatformInfo`, `getSitePages`, `searchCatalog` |
| כל דף, מחובר | + `getMyUpdates`, `findUserProjects`, `getActiveTimers`, `listUserMissions`, `navigateToPage` |
| `/moach/*`, `/project/[id]` | + `getProjectDetails`, `getProjectMembers`, `listProjectResources`, `listRikmaProcesses`, `prepareMission`, `planProjectWork` |
| `/lev` | + `timerAction`, `getMissionDetails`, `listMyConversations` |
| `/concierge/*` | + `listMyWishes`, `getWishDetails`, `listMyWishOffers`, `previewWish` |
| דפי חנות של רקמה | + `listRikmaProducts`, `getRikmaProduct`, `quoteShipping` |

`projectId` שמופיע ב-URL מוזרק כברירת מחדל לקלט (הסוכן לא צריך לנחש אותו), אבל
עדיין עובר את `assertProjectAccess`.

### 3.2 תקרת שכבה (tier ceiling)

| tier | ב-WebMCP | הינט |
|---|---|---|
| `read`, `prepare` | כן | `readOnlyHint: true` |
| `selfWrite` | כן | `consequentialHint: true` אם `destructive` |
| `consentWrite`, `communicate` | כן, **עם אישור בדף**: ה-`execute` בצד הלקוח פותח דיאלוג שלנו ("הסוכן רוצה לשלוח הודעה לרקמה X בשמך: …") וממשיך רק בלחיצה. `consequentialHint: true` | |
| `sharedWrite` | **לא**. רק הגרסה `prepare` שלו (URL ממולא) | — |
| כסף, הצבעה, אישור הצעה, חלוקה | **לעולם לא** — כמו ב-MCP. הסוכן מכין קישור, אדם לוחץ (עקרון "Silence is consent" שייך לבני אדם) | — |

בדיקה (`surfaces.test.ts`) נכשלת כש: כלי במשטח לא קיים במניפסט; כלי `sharedWrite`
במשטח; מסלול כלשהו עובר 25 כלים (מרווח מתחת ל-40); כלי שמחזיר UGC בלי
`untrustedContentHint`.

### 3.3 נקודת הקצה `/api/webmcp/call`

- **POST בלבד, JSON, same-origin בלבד.** דוחה כש-`Sec-Fetch-Site` אינו `same-origin`
  או `Origin` אינו המקור של האתר. הנתיב מוחרג מ-`applyCorsHeaders` ב-`hooks.server.js`
  (אחרת `allowedCorsOrigins` הופך אותו לנקודה עם credentials חוצת-מקור).
- זהות: `locals.uid` בלבד (הדפוס של `resolveChatIdentity`). אורח → רק כלים
  `noAccountTools`.
- `setMcpContext({ userId, fetchInstance, channel: 'webmcp' })` — בלי `isInternalBot`,
  בלי `keyId`. דלי הקצב: `webmcp:user:<id>` (דלי נפרד, כדי שסוכן דפדפן לא ירוקן את
  המכסה של מפתח ה-MCP של אותו משתמש).
- הכלי חייב להיות במשטח של **המסלול שממנו נקרא** (הלקוח שולח `route`; השרת מאמת
  מול `WEBMCP_SURFACES`). כך דף שלא רשם כלי לא יכול לקרוא לו.
- `audit()` מקבל `channel: 'webmcp'` — כדי שנראה ב-Axiom אם מישהו משתמש בזה בכלל.
- שגיאות: אותו `strapiErrors` של MCP (בלי `error.message` גולמי).

### 3.4 בצד הלקוח: `src/lib/webmcp/`

- `modelContext.ts` — שכבת ההתאמה היחידה: `document.modelContext ?? navigator.modelContext`,
  ו-`register(tool)` שמחזיר `AbortController` (עם fallback ל-`unregisterTool` אם
  קיים במימוש ישן). **אין שום קריאה ל-API מחוץ לקובץ הזה** — כשהמפרט זז, משנים קובץ אחד.
- `registerWebMcp.svelte.ts` — נקרא מ-`+layout.svelte`; ב-`afterNavigate` מבטל את כל
  הרישומים (abort) ורושם את המשטח החדש מ-`data.webmcp`. רק כש-`browser` ו-feature קיים.
- `confirmGate.svelte.ts` + `WebMcpConfirm.svelte` — הדיאלוג לשכבות consent/communicate.
  טקסט דרך `$t('webmcp.…')` (namespace חדש, 5 שפות, `npm run check:i18n`).
- `pageTools.ts` — כלי UI שלא קיימים בשרת: `fill_wish_form` ב-`/concierge/new`,
  `open_mission_drawer`, `focus_timer`. הם רק ממלאים/מנווטים — לא שולחים.
- **לא** טוענים polyfill (`@mcp-b/global`) לכולם. אולי בשלב W4, רק לבוט שלנו (§4).

### 3.5 טפסים הצהרתיים

`toolname`/`tooldescription`/`toolparamdescription` על טפסים קיימים, **בלי**
`toolautosubmit`: יצירת משאלה (`/concierge/new`), יצירה מהירה (`PLAN_QUICK_CREATE`),
חיפוש. ב-handler של `submit` בודקים `event.agentInvoked` ומתעדים ב-audit.
**אסור** על: התחברות/הרשמה, מפתחות API, תשלום, הצבעה, אישור הצעה/מכירה.
`:tool-form-active` מקבל מסגרת בולטת כדי שהמשתמש יראה שהסוכן מילא.

### 3.6 Headers

- `Permissions-Policy: …, tools=(self)` ב-`hooks.server.js`. iframes של צד שלישי
  (מפות, וידאו) לא מקבלים `allow="tools"`.
- Origin trial: `<meta http-equiv="origin-trial" content="%WEBMCP_OT_TOKEN%">` רק
  כשהמשתנה מוגדר.

### 3.7 דגל

`WEBMCP = off | read | on` (ברירת מחדל **off**, כמו כל פיצ'ר AI אצלנו). `read` =
רק `read`/`prepare` וכלי UI; `on` = עד תקרת §3.2. השרת מחזיר משטח ריק כש-off,
ונקודת הקצה מחזירה 404.

---

## 4. Mastra כצרכן — שני כיוונים

### 4.1 הבוט שלנו קורא לכלי הדף (W4)

הרישום מ-§3.4 הוא גם רשימת כלים לבוט שבאתר. כשהמשתמש כותב בצ'אט, הלקוח שולח
ל-`/api/chat` את הגדרות הכלים הרשומים (שם/תיאור/סכמה, בלי execute) כ-**Mastra
`clientTools`**; הסוכן קורא לכלי, הקריאה חוזרת ללקוח, הלקוח מריץ אותה (כלי שרת —
דרך `/api/webmcp/call`; כלי UI — מקומית) ומחזיר תוצאה. תוצאה: "מלא לי את הטופס
הזה" עובד בבוט שלנו בכל דפדפן, גם בלי תמיכה מקורית ב-WebMCP.

- כלי שרת שכבר יש לבוט ב-Mastra **לא** נשלחים שוב כ-clientTools (כפילות).
- spike חובה לפני: לוודא ש-`clientTools` עובד עם הגרסה שלנו (`@mastra/core ^1.24`)
  ועם ה-workflow של reg-bot (`agent-response.ts`, `maxSteps`), כולל זיכרון (PLAN_CHAT_MEMORY).
  אם לא — לשדרג Mastra קודם, בענף נפרד.

### 4.2 סוכן שרת שגולש לאתרים אחרים (W5, ממתין ל-upstream)

`@mastra/agent-browser` עם `webmcp.enabled` יאפשר לסוכן הקונסיירז' לקרוא לכלים של
**אתרי ספקים** (מלאי, הצעת מחיר) במקום לגרד HTML — המשך טבעי של
PLAN_CONCIERGE_EXTERNAL_SOURCES (E4). תנאים: #25660 מוזג ל-main ושוחרר; `allowedOrigins`
מפורש (אף פעם לא ריק = כל מקור); `toolDiscovery:'manual'`; רק כלים עם `readOnlyHint`;
כל תוצאה עטופה `{ untrusted: true }` ועוברת את "כלל הזהב" של E (בלי מקור — לא מוצג).
לא מתחילים לפני שהחבילה יציבה.

---

## 5. שלבים

| # | מה | בדיקה |
|---|---|---|
| W0 | spike: דף בדיקה מאחורי דגל עם כלי `read` אחד, Chrome עם flag, קריאה דרך Chrome DevTools MCP (`execute_webmcp_tool`). לאמת את ה-IDL בפועל מול §1 | ידני; תיעוד הסטיות כאן |
| W1 | `toolJsonSchema()` משותף (מ-`inputsOf`), `surfaces.ts` + בדיקות, `/api/webmcp/call` + `server.test.ts` (same-origin, אורח, כלי מחוץ למשטח, sharedWrite נדחה, member guard), `channel` ב-audit | `npm test`, `npm run check` |
| W2 | `src/lib/webmcp/` (adapter, register, confirm), layout, header, OT meta, `webmcp.json` ×5, דגל | `check:i18n`, `check:script`; Playwright עם stub של `document.modelContext` |
| W3 | טפסים הצהרתיים (§3.5) + Lighthouse "Registered WebMCP tools" / "WebMCP schema validity" נקיים | Lighthouse |
| W4 | הבוט כצרכן (§4.1) | spike → בדיקת אינטגרציה של clientTools |
| W5 | agent-browser לקונסיירז' (§4.2) | אחרי שחרור upstream |

---

## 6. נקודות החלטה

- **D1 — consentWrite/communicate ב-WebMCP בכלל?** המלצה: כן, אבל רק עם הדיאלוג
  שלנו בדף. הינט `consequentialHint` לבדו לא מספיק — המפרט עצמו אומר שאתר/סוכן
  יכולים להתעלם ממנו.
- **D2 — אורחים.** המלצה: כן ל-`getPlatformInfo`/`searchCatalog`/`getSitePages` —
  זה הצד ה-SEO-י (סוכן שמחפש "מי מציע X" מגיע לקטלוג שלנו). כלי `prepareSignup` לא.
- **D3 — polyfill לכולם?** המלצה: לא. מוסיף JS לכל דף בשביל צרכנים שלא קיימים;
  הבוט שלנו לא צריך אותו (§4.1 עובד מול הרישום שלנו ישירות).
- **D4 — `exposedTo` / iframes.** המלצה: אין חשיפה למקורות אחרים. גם
  `rikma.1lev1.com` (PLAN_RIKMA_SUBDOMAINS) נרשם בנפרד ולא דרך `exposedTo`.

---

## 7. סיכונים

- **הזרקת הנחיות מ-UGC.** תיאורי רקמות והודעות פורום חוזרים לסוכן. כבר עטופים
  `{untrusted:true}` ב-MCP (PLAN_MCP_TOOLS_V2 §1.6); ב-WebMCP מוסיפים
  `untrustedContentHint`. סוכן מוזרק שמנסה לכתוב — נעצר בתקרה של §3.2 ובדיאלוג.
- **CSRF.** נקודת קצה עם cookie שכותבת. same-origin + `Sec-Fetch-Site` + JSON בלבד +
  החרגה מ-CORS. בדיקה מפורשת שבקשה מ-`Origin` אחר נדחית.
- **שינויי API.** מבודד ל-`modelContext.ts`; W0 חוזר בכל גרסת Chrome עד 156.
- **עלות AI.** כלים עם `ai: true` (`planProjectWork`, `scanProjectDirections`) בדלי
  `ai` הקטן, כמו ב-MCP.
- **אין צרכנים.** סביר שבחודשים הראשונים התנועה תהיה כמעט אפס. לכן W1–W2 קטנים,
  מאחורי דגל, ומדידה ב-audit לפני W3+.
