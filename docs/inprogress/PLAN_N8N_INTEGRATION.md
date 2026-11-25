# PLAN_N8N_INTEGRATION — 1lev1 בתוך n8n, כדי שיראו אותנו שם

**סטטוס (2026-11-24):** N0.1, N0.2 ו-N0.4 בנויים (ראו "נבנה" תחת N0), ממתינים
ל-deploy. פתוח: N0.3, שדורש פרודקשן וחשבון n8n Cloud. N1–N4 לא התחילו.

נכתב 2026-11-22 אחרי סקירה של שרת ה-MCP,
ה-OAuth, ה-REST הציבורי (`/api/v1/r/{rikma}/…`) וה-webhooks היוצאים, ושל כללי
ה-community nodes של n8n כפי שהם היום.

נשען על [PLAN_MCP_PARTNER_INTEGRATION](../inprogress/PLAN_MCP_PARTNER_INTEGRATION.md),
[PLAN_MCP_TOOLS_V2](../inprogress/PLAN_MCP_TOOLS_V2.md),
[PLAN_MCP_OAUTH](../done/PLAN_MCP_OAUTH.md) ו-PLAN_EXTERNAL_TASKS_API.

## 1. למה, ומה בכלל נחשב "חשיפה" ב-n8n

ב-n8n יש ארבעה מקומות שמשתמש פוגש אינטגרציה, מהחזק לחלש:

| ערוץ | מה המשתמש רואה | מה זה דורש מאיתנו |
| --- | --- | --- |
| **Verified community node** | הצומת "1lev1" מופיע בחיפוש בפאנל הצמתים, גם ב-n8n Cloud, ומתקין בלחיצה. דף ב-n8n.io/integrations | חבילת npm שעוברת ביקורת של n8n |
| **Workflow templates** (n8n.io/workflows) | תבניות מוכנות עם הצומת שלנו, שמגיעות מחיפוש באתר ומגוגל | חשבון Creator והגשת תבניות |
| **MCP Client Tool** (מובנה) | שום דבר עם השם שלנו. המשתמש מדביק URL | אפס עבודה, אבל אפס חשיפה |
| פורום / בלוג / יוטיוב | פוסט "how to" | תוכן |

**המסקנה:** חשיפה אמיתית היא צומת מאומת + תבניות. חיבור דרך MCP Client
Tool עובד כבר היום ושווה תיעוד, אבל הוא לא מביא אף אחד.

## 2. מה כבר יש (נבדק בקוד)

| מה | מצב | איפה |
| --- | --- | --- |
| שרת MCP, streamable HTTP | חי, `https://api.1lev1.com/api/mcp`, 75 כלים במניפסט | `src/routes/api/mcp/+server.ts`, `src/lib/server/mcp/toolManifest.ts` |
| OAuth (RFC 9728 + 7591 + PKCE) | חי. n8n תומך ב-dynamic client registration כברירת מחדל | `src/routes/oauth/*` |
| Redirect allowlist | **n8n לא ברשימה.** ההערה עצמה כבר מזכירה את זה | `src/lib/server/oauth/redirects.ts:13` |
| מפתח API לרקמה + scopes | חי, נוצר בהגדרות הרקמה | `src/routes/api/api-keys/+server.ts` |
| REST ציבורי לרקמה | tasks, orders, leads, products, sales, events, promotions, shipping, cart | `src/routes/api/v1/r/[rikma]/*` |
| Webhooks יוצאים חתומים | `task.*`, `order.*`, `lead.*`, `promotion.*`, ניסיונות חוזרים, חתימת HMAC | `src/lib/server/webhooks/dispatch.ts`, `secret.ts` |
| מגבלה: callback אחד למפתח | `callback_url` נקבע **ביצירת המפתח** בלבד, אין API להרשמה/ביטול | `src/routes/api/api-keys/+server.ts:131-218`, `webhooks/targets.ts` |
| אזכור n8n ב-UI | דף החיבור כבר כותב "n8n, Zapier או סוכן שכתבת" | `src/lib/translations/*/mcp.json` |

## 3. כללי n8n שמכתיבים את העיצוב

מתוך [Submit community nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/)
ו-[Verification guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/):

1. **אין runtime dependencies.** `n8n-workflow` רק כ-peer. כלומר אסור
   `@modelcontextprotocol/sdk` בתוך החבילה — הצומת מדבר HTTP רגיל (`this.helpers.httpRequestWithAuthentication`).
2. **פרסום מ-GitHub Actions עם npm provenance** (חובה מאז 2026-05-01). פרסום
   מהמחשב נדחה.
3. **חבילה אחת = שירות אחד**, בלי צמתי לוגיקה/flow, ובלי מה שמתחרה בפיצ'ר בתשלום של n8n.
4. שם `n8n-nodes-1lev1` (או `@1lev1/n8n-nodes-1lev1`), keyword
   `n8n-community-node-package`, רישיון MIT, נבנה עם `@n8n/node-cli`
   (`npm create @n8n/node`) ועובר את ה-lint/scan שלהם.
5. ה-README בחבילה הוא התיעוד שהם בודקים.

**השלכה עיצובית:** הצומת **לא** עוטף את MCP. הוא צומת REST רגיל מעל
`/api/v1/r/{rikma}/…`, עם `usableAsTool: true` — כך הוא גם צומת רגיל בזרימה
וגם כלי ל-AI Agent של n8n. עטיפת MCP בתוך צומת הייתה גם נדחית (dependency)
וגם מיותרת (ה-MCP Client Tool כבר עושה את זה).

## 4. שלבים

### N0 — חיבור MCP עובד ומתועד (ימים, בלי חבילה)

- **N0.1** להוסיף ל-`DEFAULT_HOSTS` ב-`redirects.ts` את `*.app.n8n.cloud`
  (n8n Cloud, callback `https://<tenant>.app.n8n.cloud/rest/oauth2-credential/callback`).
  wildcard של תווית אחת בלבד — כבר נאכף ב-`hostMatches`. בדיקה ב-`redirects.test`.
  self-hosted לא נכנס לרשימה: הם מתחברים במפתח (N0.2), או מוסיפים את ה-host
  שלהם דרך `MCP_OAUTH_REDIRECT_HOSTS` אם זו התקנה שלנו.
- **N0.2** דף `/mcp`: סעיף n8n — MCP Client Tool → Transport: HTTP Streamable →
  URL → Authentication: MCP OAuth2 (Cloud) או Bearer header עם `1lev1_…` (self-hosted).
  חמש שפות דרך `mcp.json`.
- **N0.3** בדיקה ידנית מול n8n Cloud אמיתי: OAuth מלא, `tools/list`, קריאה אחת
  (`getMyUpdatesTool`), כתיבה אחת שנעצרת ב-consent. לרשום ב-QA.
- **N0.4** לוודא ש-`instructions.ts` נכנס ל-system prompt של ה-AI Agent ב-n8n (MCP
  Client Tool לא תמיד מעביר instructions). אם לא — כלל הבית "אף פעם לא לאשר
  במקום המשתמש" צריך לשבת גם בתיאור הכלים עצמם, לא רק ב-instructions.

**נבנה (2026-11-24):**
- N0.1 — `*.app.n8n.cloud` ב-`DEFAULT_HOSTS` (`src/lib/server/oauth/redirects.ts`),
  ובדיקה ב-`defaultHosts.test.ts`: workspace בתווית אחת מתקבל; `app.n8n.cloud` חשוף,
  שתי תוויות, lookalike ו-http נדחים. **אזהרה ל-deploy:** אם ב-VPS מוגדר
  `MCP_OAUTH_REDIRECT_HOSTS`, הוא *מחליף* את הרשימה ואז צריך להוסיף לו את
  `*.app.n8n.cloud` ידנית.
- N0.2 — שורת n8n ברשימת "סוכנים אחרים" של `McpGuide.svelte` (מופיעה גם ב-`/mcp`
  וגם ב-`/me/settings/mcp`), עוגן `/mcp#n8n`, חמש שפות (`other_n8n_*`).
  `other_anyMcp_name` כבר לא מזכיר את n8n.
- N0.4 — נסגר בלי קוד: הכלל מובטח במבנה ולא בטקסט. אין כלי שמצביע, חותם על חלוקה
  או מאשר הצעה (`toolManifest.ts`), כך שגם סוכן שלא קיבל את ה-instructions לא יכול
  לאשר במקום המשתמש. כלי `consentWrite` כבר אומרים בתיאור שלהם שהחברים מאשרים.
  כדאי עדיין לבדוק ב-N0.3 אם n8n מעביר instructions.

### N1 — Webhook subscriptions (צד שרת, תנאי ל-Trigger node)

Trigger node של n8n צריך `webhookMethods.{checkExists,create,delete}`: כשמפעילים
זרימה הוא נרשם, כשמכבים — מבטל. היום יש URL אחד, קבוע, למפתח.

- **N1.1** אוסף Strapi חדש `webhook-subscription` (`api_key`, `url`, `events[]`,
  `createdAt`, `archived`+`archivedAt` — [לא מוחקים](../../CLAUDE.md), ביטול = ארכוב).
  דורש deploy ל-1.0b ו**שתי הרשאות** (Authenticated + API token).
- **N1.2** `POST / GET / DELETE /api/v1/r/{rikma}/webhooks` (DELETE מארכב). scope
  `webhooks:manage`; מפתח רואה רק את המנויים שלו. URL חייב https, בלי hosts פרטיים
  (SSRF: לחסום localhost/10.x/169.254.x אחרי DNS).
- **N1.3** `targets.ts` מאחד: `callback_url` הישן של המפתח + המנויים הפעילים.
  המטמון לרקמה נשאר, `invalidateWebhookTargets` נקרא ביצירה/ביטול.
- **N1.4** אותה חתימה (`signWebhookBody`) ואותו סוד למפתח, כדי שהצומת יאמת.
- **N1.5** מגבלה: עד 20 מנויים למפתח.

### N2 — החבילה `n8n-nodes-1lev1` (ריפו נפרד)

ריפו ציבורי חדש (MIT), נוצר מ-`npm create @n8n/node`.

**Credentials**
- `OneLev1Api` — מפתח רקמה `1lev1_…` + base URL (ברירת מחדל `https://api.1lev1.com`),
  עם `test` שקורא ל-`/api/v1/me`.
- `OneLev1OAuth2Api` — שלב ב' (N4), כשנחליט שמפתח-משתמש דרך OAuth שווה את זה
  לצומת REST. ל-MCP Client Tool ה-OAuth כבר עובד מ-N0.

**צומת 1lev1 (action, `usableAsTool: true`)** — Resource → Operation:

| Resource | Operations | Endpoint |
| --- | --- | --- |
| Task | Create, Get status | `/tasks`, `/tasks/{externalId}` |
| Lead | Create, Update status, Log activity | `/leads` |
| Order | Get, List, Update status | `/orders` |
| Product | List, Get, Update stock | `/products`, `/shop stock` |
| Sale | Report | `/sales` |
| Event | List (polling) | `/events` |

עיקרון: רק מה שה-REST כבר מאפשר למפתח רקמה, ואותם כללי בית — שום operation
שמאשרת הצבעה, חלוקה או מכירה של מישהו אחר. תיאורי ה-operations (שה-AI Agent
קורא) כתובים כמו תיאורי הכלים ב-`toolManifest.ts`.

**צומת 1lev1 Trigger** — בוחרים events (`task.done`, `order.paid`, `lead.created`…),
נרשם דרך N1, מאמת חתימה, מבטל בכיבוי. בלי N1 אין Trigger — לא משחררים גרסה
עם "תדביק את ה-URL בהגדרות המפתח".

**CI** — GitHub Actions: lint (`n8n-node lint`), build, בדיקות, ופרסום
`npm publish --provenance` על tag בלבד.

**README** — מה זה רקמה (בטרמינולוגיה של [CLAUDE.md](../../CLAUDE.md): rikma, לא
project/weave), איך יוצרים מפתח, כל operation עם דוגמה, ושלוש התבניות מ-N3.

### N3 — תבניות (כאן החשיפה מתחילה באמת)

חשבון Creator ב-n8n, והגשת 4–5 תבניות שמשתמשות בצומת. כל תבנית פותרת בעיה
שאנשים כבר מחפשים, ו-1lev1 הוא החלק שמחלק את הבעלות:

1. **GitHub issue / Linear / Jira → משימת רקמה**, ו-`task.done` סוגר את הכרטיס.
2. **טופס (Typeform/Tally/Google Forms) → ליד ברקמה**, ושליחת הודעת Telegram/Slack לצוות.
3. **`order.paid` → חשבונית / גיליון / משלוח** (Shopify-style fulfillment לרקמה).
4. **AI Agent עם 1lev1 כ-tool** — "מה מחכה לי השבוע בכל הרקמות שלי" ששולח סיכום בוקר.
5. **Stripe/PayPal payment → דיווח מכירה ברקמה** (המכירה נכנסת לחלוקה רק כשהיא effective — לכתוב את זה בתבנית).

כל תבנית: אנגלית, צילום מסך, sticky notes שמסבירים את הצעדים, ונתונים בלי פרטים
של משתמשים אמיתיים.

### N4 — הגשה לאימות וקידום

- **N4.1** הגשה ב-Creator Portal אחרי ש-N2 על npm עם provenance ו-N3 מוכנות.
- **N4.2** פוסט ב-community.n8n.io (קטגוריית Built with n8n) + הסרטון הקצר
  מצנרת [הטוטוריאלים](../../video-tutorials) (זרימה 1 או 4).
- **N4.3** דף `/integrations/n8n` אצלנו (SEO, חמש שפות), שמקשר לחבילה ולתבניות.
- **N4.4** אחרי אימות: OAuth2 credential (N2), ושקילת `n8n-nodes-1lev1` גם ב-Make/Zapier
  באותו REST — אותו עבודת צד שרת.

## 5. סדר וזמנים (הערכה)

| שלב | תלוי ב | גודל | deploy |
| --- | --- | --- | --- |
| N0 | — | 1–2 ימים | Vercel + VPS API (redirects הוא צד שרת) |
| N1 | 1.0b (אוסף חדש) | 3–4 ימים | 1.0b + VPS API |
| N2 | N1 ל-Trigger; action node יכול לצאת לפני | 4–6 ימים | ריפו נפרד, npm |
| N3 | N2 על npm | 2–3 ימים | — |
| N4 | N2+N3 | ביקורת של n8n: שבועות, לא בשליטתנו | — |

אפשר לשחרר את צומת ה-action לבד (כ-unverified community node) כבר אחרי N2,
ולהגיש לאימות רק כשה-Trigger מוכן — כדי לא להיבדק פעמיים.

## 6. שאלות פתוחות

1. **שם ו-scope ב-npm:** `n8n-nodes-1lev1` לא ממוקף או `@1lev1/n8n-nodes-1lev1`
   (דורש org ב-npm). ממוקף נראה רשמי יותר.
2. **מפתח רקמה מול מפתח משתמש:** ה-REST בנוי סביב מפתח רקמה. סוכן "של אדם"
   שעובד על כמה רקמות שייך ל-MCP, לא לצומת. מסכימים להשאיר את החלוקה כך?
3. **בעלות על הריפו:** אותו GitHub org של 1.0main? (ה-provenance קושר את החבילה לריפו.)
4. **"מתחרה בפיצ'ר בתשלום"** — לא רלוונטי לנו כרגע, אבל אם נוסיף צומת "AI
   assistant" שמריץ את Gemini שלנו, זה עלול להיתפס ככזה. להשאיר AI מחוץ לצומת.
5. **Self-hosted ו-OAuth:** להשאיר אותם על מפתח, או להוסיף מנגנון רישום host
   מאומת (בעל ההתקנה מוכיח בעלות)? ברירת מחדל: מפתח.
