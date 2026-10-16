# PLAN — מוצרים כ-API: מה חסר כדי שרקמה תנהל קטלוג ותצרוך אותו מהאתר שלה

> **מצב: תכנית בלבד — אין קוד במסמך הזה.** נכתב 2026-10-16 אחרי סקירת קוד,
> לא אחרי הנחות.
>
> משלים: [PLAN_EXTERNAL_SALES_API](../done/PLAN_EXTERNAL_SALES_API.md) (דיווח מכירות פנימה),
> [PLAN_EXTERNAL_TASKS_API](../done/PLAN_EXTERNAL_TASKS_API.md) (משימות פנימה),
> [PLAN_COMPLEX_PRODUCTS](../done/PLAN_COMPLEX_PRODUCTS.md) (מה מוצר יודע להיות),
> [PLAN_USER_OFFERINGS](../done/PLAN_USER_OFFERINGS.md) (מוצר של ספק יחיד),
> [PLAN_RIKMA_SUBDOMAINS](../inprogress/PLAN_RIKMA_SUBDOMAINS.md) (הדף הציבורי והמראה),
> [PLAN_UGC_TRANSLATION](../inprogress/PLAN_UGC_TRANSLATION.md) (תרגום תוכן משתמשים),
> [PLAN_MULTI_CURRENCY](../done/PLAN_MULTI_CURRENCY.md), ו-[PLAN_MONEY_RAILS](./PLAN_MONEY_RAILS.md).
>
> **הבנצ'מרק:** Payload CMS v3 (השוואה בסעיף 3). הבנצ'מרק הוא כלי השוואה, לא
> יעד חיקוי — סעיף 7 מפרט מה במכוון **לא** להעתיק.
>
> **מודעות לפני MVP:** שני דברים שמיוחדים ל-1lev1 — המחיר אינו סופי (מתכון,
> `quote`, צריכה בפועל) ומכירה מייצרת עבודה לחברי הרקמה — מתועדים ב-**§11**
> כנספח מודעות בלבד. הם **אינם** דורשים דבר ב-Phase 0/1, אבל אסור לחוזה
> להבטיח ללקוח הבטחות שהמודל עוד לא נותן.
>
> **סבב תיקונים 2026-10-16 (אחרי סקירה מול הקוד):** תשעה תיקונים — מיפוי
> `status`, משמעות `hideFromDiscovery` (ובעקבותיו הסרת `exposeToApi`), מטמון
> למפתחות, הפניות על כתיבה, מפתחות ברמת משתמש, תרגום, qids, HTML וסתירות
> נתיבים. **סוכן שממשיך מכאן — קרא קודם את §12**: הוא אומר מה השתנה, למה,
> ואילו הנחות קודמות במסמך כבר אינן תקפות.

---

## 0. תקציר — השורה התחתונה

1lev1 כבר **יודעת לנהל מוצר** ברמה עמוקה יותר מכל CMS גנרי: מוצר (Matanot) יושב
ברקמה, נבנה ממתכון של משימות ומשאבים, נמכר, מפחית מלאי, מפוצל לרווחים, מתורגם
לחמש שפות, וכל שינוי בו עובר **הצעת שינוי בהסכמה** ולא "שמור". זה היתרון — והוא
לא הולך לשום מקום.

מה שחסר הוא **הצד השני של המטבע**: המערכת יודעת *לקבל* נתונים מבחוץ (דיווח
מכירות, משימות, מכירות מ-API) אבל **לא יודעת לתת אותם החוצה**. אין היום שום
endpoint שקריאה לו מחזירה קטלוג מוצרים. אתר של רקמה יכול להצטלם לדף ה-1lev1
הציבורי (`/gift`, `/r/<slug>`), אבל הוא לא יכול *לקרוא* את המוצרים, לתרגם, לסנן,
למיין, לעמוד על שינוי, ולבנות מהם חנות משלו.

במונחים של Payload: יש לנו עולם תוכן עשיר, **ואין Delivery API**.

### הפער בחמש שורות

| # | מה חסר | למה זה חוסם |
|---|---|---|
| 1 | `GET /api/v1/r/{rikma}/products` (+`/{id}`, קטגוריות, פרופיל רקמה, חיפוש, סינון, מיון, פאג'ינציה, `locale`, `fields`) | בלי זה אין headless. היום `/gift` שולף 200 מוצרים ומסנן **בדפדפן** |
| 2 | scope לקריאה (`products:read`) + מפתחות פר-אתר (test/live, פקיעה, רוטציה) | הפאנל מוציא מפתחות ל-tasks ול-sales בלבד |
| 3 | חוזה "פרסום": `status` אחד מוסכם + `?draft=` + תצוגה מקדימה מוחתמת | המצב מפוזר על `status_of_voting`, `lifecycle`, `archived` ו-`hideFromDiscovery` (ו-`appruved` שאיש לא מדליק — §4.3), עם NULL-ים של מורשת — ומפתח API לא יודע להבדיל |
| 4 | Webhooks למוצרים ולמכירות (`product.published`, `product.updated`, `sale.created`…) | אתר הלקוח לא יכול לבנות מחדש / לרענן cache כשמוצר משתנה |
| 5 | חוזה caching ו-CDN (`Cache-Control`, `ETag`, `s-maxage`, purge) | חנות עם תנועה תפיל את Strapi — היום כל בקשה היא שאילתה |
| 6 | תיעוד למפתחים: OpenAPI + דף `/docs/api` + SDK/Zod-types + סביבת בדיקה | יש snippets חכמים בפאנל, אבל אין חוזה מכונה שאיש חיצוני יכול לבנות מולו |
| 7 | עומק קטלוג: variants/מאפיינים, זמינות, גלריה מדיה, דירוג/חיפוש | מוצר הוא "מחיר + כמות + תמונה אחת". ל"מכירה אמיתית" חסר SKU/מידה/צבע/מלאי פר-וריאנט |
| 8 | "הזמנות" לצרכן חיצוני (או החלטה מפורשת שלא) | היום יש רק `POST /api/v1/sales` (דיווח *אחרי* ששילמו אצל הלקוח) — אין `orders`/claims API. ואגב אותו endpoint: הוא עוד לא נושא רקמה בכתובת, ואנחנו שולטים בכל צרכניו ⇒ מיושר ב-§5.8 |

### העיקרון המארגן: **הכתובת היא הרקמה, לא פילטר**

הרקמה היא ה-tenant, ה-scope של המפתח, היחידה שמנהלת מוצרים, וזו שמופיעה
בכתובת הציבורית (`/r/<slug>`). לכן משטח ה-delivery הוא **תחת הרקמה**:

```
GET /api/v1/r/{rikma}/products      ← כך נראית החנות של רקמה
```

ולא `GET /api/v1/products?rikma=57` (פילטר על אוסף גלובלי). הנימוקים בסעיף 5.0.

### המסלול הקצר (2–4 שבועות) לסגירת 80% מהערך

`products:read` + `GET /api/v1/r/{rikma}/products` ו-`/api/v1/r/{rikma}/products/{id}`
+ projector ל-DTO ציבורי + `Cache-Control`/`ETag` + checkbox בפאנל המפתחות הקיים
+ snippet וסעיף תיעוד. **אין צורך בשינוי סכמה ב-Strapi למסלול הזה** — כל השדות קיימים.
(זה נכון רק משום שאין `exposeToApi` — §4.3/§12. `expiresAt` ו-test/live של
מפתחות **הם** שינוי סכמה ב-`1.0b`, ולכן הם מחוץ למסלול הקצר.)
באותו חלון גם מיישרים את `sales`/`tasks` לכתובת הרקמה (§5.8) — כי הצרכנים
בשליטתנו עכשיו, ולא תהיה הזדמנות זולה יותר.

---

## 1. היעד שהצבת — שלושה שימושים שונים, לא אחד

| # | מי | מה הוא רוצה | מה זה דורש |
|---|---|---|---|
| A | **חבר רקמה** | לנהל קטלוג: ליצור, לערוך, לתמחר, להסתיר, לארכב, לראות מה נמכר | UI ניהול + ממשל (קיים ברובו) |
| B | **רקמה כישות** | להציג את המוצרים **באתר שלה** (Next/Astro/וורדפרס/דף נחיתה), בלי לשכפל נתונים | Delivery API לקריאה + caching + webhooks |
| C | **המפתח/הסוכן שלה** | לקבל חוזה, דוגמאות, מפתח, ופרומפט שמייצר אינטגרציה | OpenAPI + snippets + סביבת בדיקה + SDK |
| D | **לקוח קונה** (מתפתח מ-A/C) | לקנות באתר של הרקמה, כשהכסף ממשיך לזרום לפי כללי 1lev1 | מסלול "הזמנה/בקשה" או דיווח מכירה (ראה §4.8) |

הערה חשובה: השימושים A–C **אינם** "לבנות CMS גנרי". הם "לתת לקטלוג קיים של
רקמה לצאת החוצה". כל המלצה במסמך נמדדת בזה.

ומכאן נגזרת כל הארכיטקטורה: **B ו-C הם פר-רקמה** — כל אחד מהם שואל "מה יש
לרקמה הזו למכור", אף אחד מהם לא שואל "מה יש לכולם". גם D: קונה נכנס לאתר של
**רקמה אחת**. לכן הכתובת של ה-API נושאת את הרקמה (§5.0), ולכן הרשימה
הכלל-אתרית (`/gift` — כל המוצרים בפלטפורמה) היא משטח **נפרד ומשני**,
לא ברירת המחדל של הצרכן החיצוני.

---

## 2. מה קיים היום — עם ראיות

### 2.1 מודל המוצר (עשיר מאוד)

`Matanot` (`src/generated/STRAPI_SCHEMA_REFERENCE.md` §Matanot) מכיל, בין השאר:

- **זיהוי ותוכן:** `name`, `desc` (JSON/rich text), `pic` (UploadFile), `locale` +
  `localizations` (i18n של Strapi), `origin` (`personal` \| `project` \| `wish`),
  `owner_user` (מוצר של ספק יחיד — PLAN_USER_OFFERINGS).
- **מסחר:** `price`, `currency` (Matbea), `pricingMode`
  (`fixed` \| `estimated` \| `quote`), `fixPrice`, `estimatedPrice`, `marginPct`,
  `quant`, `kindOf` (`daily` \| `monthly` \| `yearly` \| `total` \| `unlimited`),
  `startDate`, `finnishDate`, `maxsaleyearone/sec`, `minsaleyear*`.
- **חלוקה ומטבע:** `entryCurrency`, `entryRate` (מטבע המקור מול מטבע הרקמה),
  `sale` (rel), `sales` (מונה), `sheiruts`/`sheirutpends` (בקשות רכש שנולדו
  מהמוצר), `sp` (קישור למוצר-העל).
- **מלאי-מתכון:** `matanot_recipe_missions`, `matanot_recipe_resources` — כל שורה
  מגדירה שעות/תעריף/כמות-ליחידה/costShape (`createComplexMatanot.ts`, `ComposeProduct.svelte`).
- **חשיפה:** `hideFromDiscovery`, `discoveryKeywords` (נכתבים ב-`createComplexMatanot`),
  `lat`/`lng`/`radius`/`location`, `categories` (qid `375setMatanotCategories`).
- **ממשל ופרסום:** `appruved`, `archived`, `lifecycle` (`active` \| `archiveProposed` \|
  `archived` \| `released`), `status_of_voting` (`draft` \| `voting` \| `active` \| `archived`),
  `publishedAt` (הדגל של Strapi), `archiveEffectiveFrom`, `archive_decisions`,
  `decision`, `matanotpend`, `ratson*`, `timegrama`.
  **בפועל:** היצירה קובעת רק `status_of_voting` (`'active'`, או `'voting'`
  למוצר מורכב ברקמה מרובת חברים — `createComplexMatanot.ts:277`;
  `createPersonalMatanot` ⇒ `'active'`). `appruved` נכתב רק ב-`approveMatanot`,
  שאין לו אף קורא ב-UI — כלומר ברוב השורות הוא NULL. ראה §4.3.

### 2.2 ניהול מוצרים במוח

| יכולת | איפה | הערה |
|---|---|---|
| יצירת מוצר פשוט | `prPr/newmatana.svelte` → action `createComplexMatanot` | כולל העלאת תמונה דרך `/api/upload` |
| יצירת מוצר מורכב (מתכון) | `products/ComposeProduct.svelte` (904 שורות) + `MissionPickerList`/`ResourcePickerList` | בורר משימות/משאבים/חברים/תבניות |
| יצירת מוצר אישי | `createPersonalMatanot`, `publishUserResourceAsProduct`, `offerings/CreateProductFlow.svelte` | שכבות "פרסום אישי / עסקה רקמתית" |
| מסך המוצרים והמכירות | `(reg)/moach/[projectId]/sales` → `prPr/hamatanot.svelte` (1461 שורות) | רשימת מוצרים, כפתור discovery, רישום מכירה (`sell` → `createSale`), ייצוא CSV, גרפים |
| אישור מוצר (MVP) | action `approveMatanot` | חבר רקמה בלבד; מהפך `status_of_voting='active'` + `appruved=true`. **רשום ב-registry אך אין לו קורא ב-UI** — לכן `appruved` אינו אות אמין |
| הסתרה/discovery | action `setMatanotDiscovery` | toggle יחיד. מוציא את המוצר **רק מספריית `/gift`** — הוא נשאר גלוי ב-`/gift/[id]`, בדף הרקמה ובזרימות המכירה (ההערה מעל qid `282discoverProducts`) |
| עריכת מוצר **אחרי** יצירתו | action `proposeObjectEdit` (`targetKind:'matanot'`) | דרך Decision עם הצבעות ו-`restime` |
| ארכוב מוצר | `proposeObjectArchive` + `archive/targets.ts` (`'matanot'` ב-`TARGET_KINDS`) | כולל ארכוב מתוזמן דרך `timegrama` |

**עד כמה העריכה חלקית — בפועל (חשוב לתכנון):** ב-`archive/apply.ts` שדות
השינוי הנתמכים ל-`matanot` הם **רק**:
`name`, `desc`, `quant`, `price`, `startDate`, `finnishDate`.
אין מסלול מבוסס-הסכמה לשינוי **תמונה, קטגוריות, מטבע, pricingMode, סוג כמות
(`kindOf`), או הרכב המתכון** — כלומר ניהול המוצר *כן* קיים אך אינו שלם. בנוסף,
`proposeObjectEdit` מתיר **הצעה פתוחה אחת בלבד** לאובייקט, וברקמה של חבר אחד
שינוי מוחל מיידית.

### 2.3 משטחים ציבוריים (HTML, לא JSON)

| משטח | קובץ | מה יש בו |
|---|---|---|
| ספריית המוצרים `/gift` | `(regandnon)/gift/+page.server.js` | qid `282discoverProducts` — `pagination:{limit:200}`, סינון `archived`/`lifecycle`/`hideFromDiscovery`, ואז סינון **בדפדפן** (`search`, `filter` ב-`+page.svelte`) |
| עמוד מוצר `/gift/[id]` | `(regandnon)/gift/[id]/+page.server.js` | qid `48GetServiceById` + `266getMatanotSellerMeta` (מוכר אישי), כפתור "קנה" → `createSheirutpend` |
| דף הרקמה `/r/<slug>` | `rikmaPublic/loadRikmaPage.js`, `RikmaPage.svelte` | מקטע מוצרים `matanotofs`, מראה (look) דרך `RikmaSkin` |
| מפת הדיסקברי (JSON!) | `routes/api/map-data/+server.ts` | **כן מחזיר JSON פומבי** עם `cache-control: public, max-age=60` — התקדים הקרוב ביותר ל-API קריאה |
| sitemap | `routes/sitemap.xml/+server.js` | `/gift` כרשומה סטטית אחת; **אין** רשומות פר-מוצר |

### 2.4 מה שכבר יוצא החוצה — API של כתיבה בלבד

| Endpoint | קובץ | מה הוא עושה |
|---|---|---|
| `POST /api/v1/sales` → **`/api/v1/r/{rikma}/sales`** (§5.8) | `routes/api/v1/sales/+server.ts` | דיווח מכירה חיצוני. מפתח scoped לרקמה, אידמפוטנטיות `externalId`, עובר ב-`createSale` (הסכמת מחזיק-הכסף, מלאי, monter) |
| `POST /api/v1/tasks` + `GET /api/v1/tasks/{externalId}` → **`/api/v1/r/{rikma}/tasks…`** (§5.8) | `routes/api/v1/tasks/*` | יצירת מטלה חיצונית + **קריאה אחת** (סטטוס לפי `externalId`) |
| `POST /api/v1/actions` | `routes/api/v1/actions/+server.ts` | whitelist היסטורי (`createTask`) — **לסגירה** (§5.8, §9.13) |
| Webhooks יוצאים | `lib/server/webhooks/{dispatch,targets,secret}.ts` | **למשימות בלבד**: `task.created\|accepted\|assigned\|progress\|done`, חתימת HMAC `X-1lev1-Signature`, `X-1lev1-Delivery`, 3 ניסיונות עם backoff, 4xx לא מנוסה |
| MCP | `lib/server/mcp/toolManifest.ts`, `/mcp` | כלי קריאה (incl. `searchCatalog`) — אבל דורשים התחברות, ומיועדים לסוכן, לא לאתר |

**אין** endpoint קריאה ל: מוצרים, קטגוריות, רקמות, מלאי, מחירים, מכירות.

### 2.5 מפתחות ו-Rate limit — התשתית הטובה שקיימת

`lib/server/apiKeys.ts`:
- פורמט `1lev1_{user}{36}_...`, **HMAC-SHA256** עם `API_KEY_NONCE` (≥32 תווים),
  רק ה-hash נשמר, ה-raw מוצג פעם אחת.
- `verifyApiKeyDetailed` מחזיר `project`, `scopes`, `revoked`, `allowedOrigins`,
  `lastUsedAt`, עם cache של 5 דקות; `assertScope`, `touchLastUsed`.
- `scopes` תומך בשני מודלים: מערך שטוח (`['sales:report']`) או `{projects, ops}`.
- ממשק: `routes/api/api-keys/+server.ts` — תומך במפתחות **בעלי שם** פר רקמה
  (`{projectId,name,scopes[],callbackUrl}`; יצירה חוזרת באותו שם מחליפה, ויש
  DELETE לרוטציה) — `userPr/api-keys.svelte`, ו-`prPr/api/RikmaApiPanel.svelte`
  שכבר עושה **בדיוק** את שלושת הדברים הנכונים: מפיק מפתח עם היכולות שסומנו,
  מציג את ה-**IDs האמיתיים**, ומייצר snippet+טבלת שדות+**פרומפט לסוכן AI**.
  ה-`ALL_SCOPES` שם היום: `['tasks:create','tasks:read','sales:report']`.
- Rate limit: **in-memory per-process** (`sales/+server.ts`, `tasks/+server.ts`),
  60/דקה למפתח. אין Redis, אין quotas, אין מטריקות פר-מפתח.

### 2.6 תשתיות רוחביות שהן נקודת פתיחה חזקה

- **הרשאות:** `lib/server/authz/{principal,authorize,types}.ts` + `/api/permissions`
  (PLAN_API_PERMISSIONS) — "מי × מה מותר" עם deny-by-default.
- **פעולות:** Unified Action System (`actionService.executeAction`, `authRules`,
  ValidationEngine, notifier) — כל mutation חדשה חייבת לעבור שם.
- **תרגום תוכן משתמשים:** `lib/server/translation/*` — cache ב-Strapi
  (`text-translation`), governor/quota, backfill יומי, `<Translated>`, 5 שפות.
  לפי PLAN_UGC_TRANSLATION, משטח המוצרים מכוסה (ספרייה + כרטיסים), ו-`/gift/[id]`
  **לא** — כלומר יש תשתית לתרגום שהצרכן החיצוני עוד לא נהנה ממנה.
- **מטבע:** `/api/fx` **ציבורי** עם `cache-control: public, max-age=3600`,
  `lib/money/*`, תיעוד `entryCurrency`/`entryRate`.
- **מדיה:** `/api/upload` (JWT, whitelist MIME + גודל ב-`lib/uploads/policy`),
  Strapi מייצר `formats` (thumbnail/small/…) — `picUrlOf` בוחר `small`.
- **DTO-ים קיימים:** `lib/server/discovery/normalizeCards.ts` כבר אוכף את
  העיקרון הנכון — "רק כרטיסים שטוחים יוצאים מהשרת" (`ProductCard`, `excerptOf`,
  `picUrlOf`). זה בדיוק ה-projector ש-API ציבורי צריך, ויש לו גם בדיקות.
- **כסף:** PLAN_MONEY_RAILS — **אין** סליקה בפלטפורמה (escrow-by-proof, מסילות
  "משעממות"): זו החלטה מוצרית מכוונת, לא פער.

---

## 3. Payload CMS כבנצ'מרק — מה משווים ומה יוצא

### 3.1 מה Payload נותן שרלוונטי בדיוק לשאלה שלך

- **Schema as code** (`payload.config.ts`): קולקציות, globals, 20+ סוגי שדות,
  blocks/arrays, קשרים דו-כיווניים, ולידציה חוצת-שדות.
- **שלושה APIs מאותו config:** REST אוטומטי לכל קולקציה עם `where`, `sort`,
  `limit`/`page`, `depth` (populate), `locale`/`fallbackLocale`, `draft`,
  `select` (sparse fieldsets), `populate`/`joins`; **GraphQL** אוטומטי כולל
  `where`, `locale`, `draft`, `version(s)`, `restoreVersion`; **Local API**
  (קריאה בקוד שרת בלי HTTP, טיפוסים מלאים).
- **Access control כפונקציה** — ברמת קולקציה, **שדה** ו**שורה** (הפונקציה מחזירה
  `where` query, כלומר "לקרוא רק מה שמותר לו").
- **Versions/Drafts/Autosave/Live Preview** — `versions: {drafts:true, maxPerDoc}`,
  `_status`, `?draft=true`, שחזור גרסה, preview מוחתם.
- **Localization ברמת השדה** — אותו מסמך, ערכים פר-לוקאל.
- **Media** — sizes/focal point/adapters (S3, R2, …), ספריית מדיה.
- **Hooks + Webhooks** — `beforeChange`/`afterChange`/`afterRead`, ופלאגין webhooks
  עם retry; **Jobs Queue** עם תזמון (scheduled publish).
- **Auth + API keys** מובנים; **multi-tenant plugin** (בידוד לקוחות במופע אחד).
- **טיפוסים ו-SDK:** `payload-types` נוצר מה-config; `@payloadcms/sdk`; MCP plugin.
- **Ecommerce plugin** (בבטא): Products, Variants, Variant Types/Options, Carts,
  Orders, Transactions, Addresses + Stripe adapter.

### 3.2 טבלת השוואה ישירה

| יכולת | Payload | 1lev1 היום | פער |
|---|---|---|---|
| REST לקריאה (list+one+filters+pagination+sort+depth) | אוטומטי לכל קולקציה | **אין** (רק HTML SSR) | 🔴 P0 |
| Delivery פר-tenant בכתובת | multi-tenant plugin; `/api/{collection}` + `where: {tenant}` | **אין API**, אבל `/r/<slug>` נותן תקדים מושלם לפתרון הכתובת | 🔴 P0 (§5.0) |
| GraphQL ציבורי | אוטומטי | אין (GraphQL פנימי דרך qids) | 🟡 P2 |
| "Local API" (קריאה בשרת בלי HTTP) | `payload.find()` | **יש** — `strapiClient.execute(qid)` / `sendToSer` בכל loader | ✅ שקול |
| API keys + scopes | Auth + access functions | תשתית מפתחות/scopes טובה, אך scopes ל-tasks/sales בלבד | 🟡 P0 |
| הרשאת שדה/שורה לקריאה | `access.read` מחזיר `where` + field-level | authz פר-*פעולה*; אין projection ל-DTO ציבורי | 🔴 P0 (פרטיות!) |
| Drafts / פרסום / autosave | `_status`, `?draft`, autosave | `appruved`/`status_of_voting`/`lifecycle`/`archived`/`hideFromDiscovery` — חמישה דגלים, אין חוזה אחיד, אין preview | 🔴 P0 |
| Versions / היסטוריה / שחזור | `versions`, `restoreVersion` | הצעות-שינוי (Decisions) משמשות *ממשל*; אין snapshot, אין שחזור, אין API היסטוריה | 🟡 P1 |
| Localization (ברמת שדה) | ✔ + `locale` בכל שאילתה | `locale`/`localizations` ב-Strapi + מנוע תרגום UGC ל-5 שפות | 🟡 P1 (לא חשוף ב-API) |
| Media library + sizes + adapters | ✔ | `/api/upload`→Strapi + `formats`; תמונה אחת למוצר; אין CDN/מפרט גדלים/URL API | 🟡 P1 |
| Webhooks | פלאגין + hooks | **קיים וחתום — למשימות בלבד** | 🔴 P0 (מוצרים/מכירות) |
| Jobs / scheduled publish | Jobs Queue | cron/scheduler קיימים; `startDate`/`finnishDate` קיימים אך אינם "פרסום" | 🟡 P1 |
| Multi-tenant | plugin (`tenant` + access functions) | **הרקמה היא ה-tenant** — אך ה-tenant חייב להופיע גם בכתובת וגם במפתח, לא רק באחד מהם | 🟡 P0 (§5.0, §5.1) |
| Admin UI | React, ניתן להרחבה ע"י הלקוח | Moach — עשיר מאוד, **לא** ניתן להרחבה ע"י הרקמה | 🟡 תלוי מוצר |
| Search | Search plugin | Pinecone/matching פנימי + qids; אין endpoint חיפוש לצרכן | 🔴 P1 |
| Ecommerce (variants/carts/orders/Stripe) | פלאגין בבטא | מכירה מדווחת מבחוץ; `sheirutpend` כבקשת רכש; אין variants/orders API | 🔴/🟡 P1–P2 (החלטה) |
| טיפוסים/SDK/OpenAPI | `payload-types` + SDK + MCP | טיפוסים פנימיים מלאים; אין SDK/OpenAPI/typed client לחוץ | 🔴 P0 |
| Extensibility: קולקציה חדשה | כמה שורות config | **אין** — הסכמה קבועה (Strapi) + אוצר מילים מבוקר | 🔴 מבני (§4.9) |

### 3.3 מה הטבלה אומרת בעצם

- **אין פער ב"ניהול תוכן"** — יש פער ב**חשיפה**. 1lev1 חזקה מ-Payload בדיוק
  במקום שבו Payload ריקה: הסכמה, חלוקת רווחים, הסכמת מחזיק-הכסף, תרגום UGC,
  קונצנזוס. הפער הוא שכבה אחת — Delivery.
- **הפער המסוכן ביותר אינו טכני אלא פרטיותי:** ב-Payload ה-access control הוא
  מה שמגן על שדות; אצלנו *אין* שכבת projection, ולכן ברגע שפותחים קריאה יש
  סיכון אמיתי שדברים פנימיים ידלפו (§6).
- **הפער היחיד שהוא באמת "מבני"** הוא Extensibility: אצל Payload הרקמה מגדירה
  לעצמה קולקציות; אצלנו הסכמה קבועה. צריך להחליט מה עושים עם זה (§4.9) ולא
  "לפתור" אותו בטעות.

---

## 4. הפערים — ממוינים, עם מה לבנות ואומדן

### P0 — בלעדיהם אין "headless"

#### 4.1 API קריאה למוצרים (list + one)

**מה חסר:** endpoint אחד שמחזיר קטלוג JSON עם סינון, מיון, פאג'ינציה,
sparse fieldsets ובחירת locale.

**ראיה:** אין קובץ תחת `src/routes/api/v1/` שמחזיר קטלוג; qid `282discoverProducts`
מגביל ל-200 ומחזיר גלם-למחצה (`attributes`), והסינון נעשה בדפדפן
(`gift/+page.svelte` שורות 26–47). אתר של רקמה עם 500 מוצרים לא יכול לעבוד כך.
בנוסף, אין נתיב API שהוא *בתוך* רקמה: `/gift` הוא אוסף על-רקמתי עם סינון
`projectcreates` בתוכו — בדיוק ההפך מהכתובת שהצרכן צריך.

**מה לבנות:**
- `src/routes/api/v1/r/[rikma]/products/+server.ts` (GET, OPTIONS),
  `.../products/[id]/+server.ts`, `.../+server.ts` (פרופיל הרקמה),
  `.../categories/+server.ts`, `.../changes/+server.ts` — לפי התבנית של
  `v1/tasks/+server.ts` (אותה סמכות: `verifyApiKeyDetailed` → `assertScope` →
  rate limit → `allowedOrigins` → ולידציה → `strapiClient.execute`).
- **פתרון הכתובת ב-route** לפי `(regandnon)/r/[slug]/+page.server.js` — בדיוק
  אותם כללים: `slugFromPath` (301 על איות שונה), `findBySlug` שמחזיר גם
  `former`, ו-404. אותו קוד, ולכן אי אפשר שדף ואותו API ייפתרו לשתי רקמות.
- qids חדשים ב-`routes/api/send/qids.js` **append-only**, לפי הקונבנציה
  **המספרית** (`<המספר הפנוי הבא><camelName>`, כמו `282discoverProducts`) —
  למשל `3xxRikmaApiProducts`, `3xxRikmaApiProduct`, `3xxRikmaApiCategories`,
  `3xxRikmaApiChanges`; המספר נקבע בזמן המימוש (`npm run validate:qids`).
- **כל qid חדש מקבל שורה ב-`routes/api/send/qidsAccess.js`** (למשל
  `{ allow: ['serviceAdmin'] }` — ה-route קורא בשם השירות, לא בשם הגולש).
  `AUTHZ_MODE` הוא `enforce` כברירת מחדל, כך ש-qid בלי שורה ייחסם. להריץ גם
  `npm run check:proxy`.
- **Projector ציבורי** ב-`src/lib/server/apiPublic/` — להרחיב את התבנית של
  `discovery/normalizeCards.ts` ל-DTO מלא (ראה §5.3). זה המקום היחיד שקובע
  מה יוצא — לא ה-GraphQL.
- פרמטרים: `limit` (≤100), `page`/cursor, `sort`, `q`, `seller`, `category`,
  `minPrice`/`maxPrice`, `currency`, `available`, `kindOf`,
  `lat`/`lng`/`radius`, `locale`, `fields`, `expand`, **`updatedSince`** (sync
  אינקרמנטלי). כל אלה **בתוך** רקמה — אין `rikma=` בפרמטרים.
- כותרות: `Cache-Control`, `ETag` (+`If-None-Match` → 304), `X-1lev1-Api-Version`,
  `RateLimit-*`; CORS כמו sales/tasks.
- **מטמון שרת קצר** (30–60 ש') מעל הקריאה ל-Strapi: בלי זה, חנות עם תנועה
  תחסל את ה-backend.

**אומדן:** 5–7 ימים (כולל בדיקות בסגנון `salesApi.test.ts`).

#### 4.2 scope לקריאה, פקיעה, סביבות ומכסות

**מה כבר יש (טוב):** `/api/api-keys` תומך ב-**מפתחות בעלי שם** פר רקמה —
`{projectId, name, scopes[], callbackUrl}` — כך שלרקמה יכולים להיות כמה
מפתחות (אתר, אתר ישן, אוטומציה), כל אחד עם scopes משלו, ויצירה חוזרת באותו שם
מחליפה במקום לצבור; יש גם מחיקה (רוטציה) ו-`callback_url` ל-webhooks.

**מה חסר:** `products:read` (ואופציונלית `products:read:draft`), `expiresAt`,
הבחנה **test/live**, ומכסה/שימוש פר-מפתח.

**ראיה:** `RikmaApiPanel.svelte` `ALL_SCOPES = ['tasks:create','tasks:read','sales:report']`
— אין scope קריאה לקטלוג; ובסכמת `api-key` אין שדה פקיעה.

**מה לבנות:** הוספת ה-scope ל-`ALL_SCOPES` ולפאנל (checkbox + snippet + סעיף
בפרומפט הסוכן — התבנית כבר קיימת), `expiresAt`, הבחנת test/live (אותו מפתח עם
תחילית/רקמת בדיקה, או דגל על הרשומה), ומכסה מדווחת. **אומדן:** 2–3 ימים
(UI+שרת), בהנחה שסכמת `api-key` כבר נושאת `scopes` (היא נושאת).

> **פיצול לפי שינוי סכמה:** הוספת `products:read` ל-`ALL_SCOPES` ול-
> `GRANTABLE_SCOPES` היא **בלי** שינוי סכמה (scopes הוא JSON) ⇒ Phase 1.
> `expiresAt` ו-test/live הם שדות חדשים בסכמת `api-key` ב-`1.0b` ⇒ Phase 2,
> לא חוסמים את המסלול הקצר.
>
> **מפתחות ברמת משתמש קיימים.** `/api/api-keys` מפיק מפתח **בלי** `projectId`
> כשהבקשה לא נושאת אחד (`userPr/editBasic.svelte`), ויש גם מפתחות MCP/OAuth.
> אלה אינם מפתחות רקמה, ו-sales כבר דוחה אותם (`403 'API key is not scoped to
> a rikma'`). הכלל ל-API הרקמה — §5.1.

#### 4.3 חוזה "פרסום" אחד + preview

**מה חסר:** מושג `status` מוסכם ל-DTO, פילטר `?status=`, `?draft=true` עם מפתח
מורשה, ותצוגה מקדימה מוחתמת (טוקן קצר-חיים) שאפשר לשלוח למעצב או ללקוח.

**ראיה:** הדגלים מפוזרים — `status_of_voting`, `lifecycle`, `archived`,
`hideFromDiscovery`, ו-`appruved` — ונאכפים במקומות שונים (`NOT_ARCHIVED`
ב-qids, `archived` ב-loader). **`appruved` אינו אות אמין:** רק `approveMatanot`
כותב אותו, ואין לו קורא ב-UI; היצירה קובעת `status_of_voting` בלבד (§2.1).

**מה לבנות (זול — בלי שינוי סכמה):** מיפוי נגזר ומתועד ב-projector, עם מגיני
NULL של מורשת בכל ענף:

| `status` ב-DTO | התנאי (על השורה ב-Strapi) |
|---|---|
| `archived` | `archived = true` **או** `lifecycle ∈ {'archived','released'}` **או** `status_of_voting = 'archived'` |
| `draft` | לא archived, ו-`status_of_voting ∈ {'draft','voting'}` |
| `published` | כל השאר: `status_of_voting ∈ {'active', NULL}` ו-`lifecycle ∈ {NULL,'active','archiveProposed'}` |

- `lifecycle = NULL` הוא מורשת = `active` (CLAUDE.md) — פילטר תמיד
  `or: [{lifecycle:{null:true}}, {lifecycle:{notIn:["archived","released"]}}]`,
  אף פעם לא `ne`/`notIn` לבד. (`released` הוא מצב סופי — כך גם
  `archive/membership.ts` `LIVE` ו-`dormancyClock.ts`; ה-`NOT_ARCHIVED` של qid 282
  מחריג רק `archived`, והפער הזה לא מועתק ל-API.)
- `archived = NULL` = לא בארכיון (אותו מגן כמו ב-qid 282).
- `archiveProposed` נשאר **published**: הצעת הסרה פתוחה אינה הסרה, ו"שתיקה היא
  הסכמה" עוד לא הבשילה.
- **`appruved` אינו משתתף במיפוי.** אם בעתיד `approveMatanot` יחובר לזרימה, הוא
  כבר כותב גם `status_of_voting='active'` — כלומר המיפוי לא ישתנה.
- **`hideFromDiscovery` אינו status** — ראה להלן.

פילטר `?status=` למפתחות; `?draft=true` דורש scope; preview = JWT קצר
(`productId`,`rikmaId`,`exp`) שנבדק בכל בקשת מוצר בודד.
**אומדן:** 3–5 ימים.

> ⚠️ **`hideFromDiscovery` — מה הוא באמת אומר (תוקן, §12):** הדגל מוציא מוצר
> **רק מספריית `/gift`**. לפי ההערה מעל qid `282discoverProducts`, מוצר מוסתר
> *"stays reachable everywhere else: /gift/[id], the project page and the sales
> flows"* — כלומר הוא כבר פומבי היום, ב-HTML, בדף הרקמה.
>
> מכאן הכלל לשתי העדשות:
> - **חנות** (`/api/v1/r/{rikma}/products`) — מחזירה מוצרים מוסתרים, בדיוק כמו
>   דף הרקמה `/r/<slug>`. ה-JSON חושף את מה שה-HTML כבר חושף, לא יותר.
> - **שוק** (`/api/v1/discover/products`) — מחריג אותם, בדיוק כמו `/gift`.
>
> לכן **אין `exposeToApi`** (הוצע בגרסה הקודמת ובוטל): הוא היה שינוי סכמה
> שסותר את "אין שינוי סכמה במסלול הקצר", ועם ברירת מחדל `false` ה-API היה
> חוזר ריק ביום ההשקה — בלי להגן על שום דבר שאינו פומבי כבר. אם יתברר שרקמות
> משתמשות ב-`hideFromDiscovery` כ"לחברים בלבד" (ההערה ב-qid מזכירה מקרה כזה),
> הפתרון הוא דגל פרטיות אמיתי שחל **גם על דף הרקמה** — החלטה נפרדת, §9.11.

#### 4.4 Webhooks למוצרים ולמכירות

**מה חסר:** אירועים `product.created|updated|published|archived`,
`inventory.updated`, `sale.created`, `sale.holderConfirmed`; ויומן משלוחים.

**ראיה:** `webhooks/dispatch.ts` — `WEBHOOK_ACTIONS = new Set(['createTask','updateTask'])`,
ו-`eventForAction` מכיר רק `task.*`. כלומר הצנרת (חתימה, retry, timeout, `wants()`)
**כבר בנויה**, וחסר רק לחבר אליה את `createSale`/`applyObjectChange`/`approveMatanot`.

**מה לבנות:** הרחבת `dispatch.ts` (רשימת אירועים + `eventForAction` לכל action),
payload אחיד `{event, deliveryId, occurredAt, rikmaId, data:<DTO ציבורי>}`,
ורשומת אירועים פר-מפתח (`webhookEvents`). **מומלץ P1:** טבלת delivery-log +
"שלח שוב" בפאנל — זה מה שהופך webhooks מ"מקווים שעבד" ל"אפשר לדבג".
**אומדן:** 3–4 ימים.

#### 4.5 חוזה caching ו-CDN

**מה חסר:** כותרות מטמון על נתוני מוצר, `ETag`/`Last-Modified`, ומסלול purge.

**ראיה:** `/api/fx` (שעה) ו-`/api/map-data` (דקה) הם התקדימים היחידים לכותרות
ציבוריות; `/gift` הוא SSR בלי חוזה מטמון. הצרכן (Next/Astro/Vercel) ירצה
`revalidateTag` — כלומר **תלוי ב-4.4**.

**מה לבנות:**

| סוג הבקשה | `Cache-Control` | למה |
|---|---|---|
| **אנונימית** (בלי `Authorization`) | `public, s-maxage=60, stale-while-revalidate=300` | אותו תוכן לכל גולש — בדיוק מה שדף הרקמה מציג |
| **עם מפתח** (כל scope) | `private, no-cache` (מותר `ETag`/`304`) | תשובה עם מפתח יכולה לכלול טיוטות (`products:read:draft`), `fields`, `updatedSince` — אסור ש-CDN ישמור אותה ויגיש לגולש אנונימי |

- תמיד `Vary: Authorization`; וכשה-CORS משקף Origin לפי `allowedOrigins` של
  המפתח — גם `Vary: Origin`. בלי זה CDN עלול להגיש תשובה של מפתח אחד לאחר.
- `ETag` למוצר בודד = `hash(id+updatedAt+locale)`; **לרשימה** =
  `hash(rikmaId + query מנורמל + max(updatedAt) + total + locale)`.
  `304` על `If-None-Match`.
- **מטמון-על בשרת** ממופתח לפי `(rikmaId, query מנורמל, locale, מעמד-הקורא)`,
  כאשר מעמד-הקורא ∈ `anon` / `key` / `key+draft`. **אף פעם** לא לחלוק רשומה בין
  `key+draft` לאנונימי.
- תיעוד "איך מרעננים": webhook → purge/revalidate אצל הלקוח.

**אומדן:** 2–3 ימים.

#### 4.6 תיעוד וחוזה מכונה למפתחים

**מה חסר:** OpenAPI, דף `/docs/api` ציבורי, דוגמאות ב-3 שפות, טבלת שגיאות,
changelog, Zod/TS types ל-DTO, וסביבת בדיקה (key + דאטה לדוגמה).

**ראיה:** `/mcp` הוא דף תיעוד ציבורי לכלי MCP — התבנית קיימת. ה-snippets
ב-`RikmaApiPanel.svelte`/`SalesApiIntegration.svelte` הם התבנית לתוכן.
`PLAN_EXTERNAL_SALES_API` §Phase 3 מסמן "דף תיעוד ציבורי קצר" כפתוח.

**מה לבנות:** `docs/tbd/api/rikma-v1.openapi.yaml` (טיוטה מצורפת למסמך זה,
עברה ולידציה OpenAPI 3.1) כמקור אמת → דף `/docs/api` שמוגש ממנו
+ `npm run openapi:types` + קליינט דק (`@1lev1/api` או קובץ להדבקה) + collection
ל-Postman. **אומדן:** 3–5 ימים.

### P1 — מה שהופך "API" ל"חנות"

#### 4.7 עומק קטלוג: וריאנטים, מאפיינים, זמינות
אין variants/SKU; `quant` עם `-1 = ללא הגבלה` (ראיה: `hamatanot.svelte:656`);
אין API זמינות; אין "נגמר" מדווח החוצה. **המלצה:** להתחיל ב-`attributes` (JSON
עם סכימה מבוקרת פר-רקמה: מפתחות, טיפוסים, מספר שדות מוגבל, בלי HTML) ולא ב-variants
מלאים — ואת `availability` להחזיר כבר עכשיו כ-`{unlimited:true}` /
`{quantity:n}` כדי לא לשבור צרכנים אחר כך. **אומדן:** 3–5 ימים ל-attributes,
10–15 ימים ל-variants מלאים עם מלאי פר-וריאנט.

#### 4.8 "הזמנות" מצרכן חיצוני — החלטה לפני קוד
היום: הלקוח משלם **אצלו**, ואז מדווח ל-`POST /api/v1/sales` (שלא נושאת רקמה
בנתיב — היא נגזרת מהמפתח). In-app יש `createSheirutpend` (בקשת רכש) מ-`/gift/[id]`.
אין נתיב הזמנות. **המלצה:** לא לבנות סליקה (PLAN_MONEY_RAILS); כן לחשוף
"בקשת רכש" כ-`POST /api/v1/r/{rikma}/orders` → `createSheirutpend` עם
`externalId` לאידמפוטנטיות והחזרת סטטוס, כדי שחנות חיצונית תוכל להציע "רכישה
דרך 1lev1" בלי כספית — וכך ההזמנה נולדת **בתוך** הרקמה שאליה היא שייכת.
**אומדן:** 5–8 ימים.

#### 4.9 אקסטרביליות: איך רקמה מוסיפה שדות שאין לנו
זה הפער המבני היחיד (§3.3). שלוש אפשרויות:
(א) `attributes` JSON מבוקר (זול, ממליץ כשלב ראשון);
(ב) "מילון מורחב" — Categories/Sp/Mashaabim קיימים כבר כשדות-על;
(ג) קולקציות דינמיות פר-רקמה — **לא**, זה שובר UAS/authz/qids ואת המשמעות של
המוצר. **המלצה:** (א) + מסך עריכת סכימה ברקמה, P2.

#### 4.10 שאר ה-P1
- **Media pipeline:** גדלים מפורשים (thumb/card/hero) + CDN + `focalPoint`;
  היום `formats` של Strapi ו-`picUrlOf` שמעדיף `small`. 3–5 ימים.
- **`?locale=` ב-API:** לחבר ל-cache התרגום הקיים (`translation/store.ts`)
  ולהחזיר `{value, translated:true|false, sourceLocale}`. 2–4 ימים.
  זה **משטח תרגום חדש**, ולפי CLAUDE.md (T3) הוא לא גמור כשה-route קורא מה-cache:
  - `SurfaceKey` חדש (למשל `rikmaApiProducts`) + ערך ב-`TRANSLATE_SURFACES`;
  - **שורה ב-`src/lib/server/translation/backfillSources.ts`** — בלעדיה אף אחד
    לא ימלא את ה-cache, ויש בדיקה שנכשלת על `SurfaceKey` בלי walker;
  - ה-walker חייב לגבב **בדיוק** את המחרוזת שה-API מחזיר (אותו flatten, אותו
    קיצור) — הכי בטוח: walker ו-projector קוראים לאותה פונקציה. עדיף שזו תהיה
    הפונקציה של דף הרקמה, כדי ששני המשטחים יחלקו שורות cache;
  - `translated` נגזר **רק** מ-`isRealTranslation` (`src/lib/translation/hits.js`).
    שורת `identity` (שפת המקור = שפת הקורא) היא hit אבל **לא** תרגום —
    `!!hit.text` הוא הבאג.
  - שים לב: היום `/gift/[id]` עדיין אינו משטח (`backfillSources.ts:196`, "the
    product page is not a surface yet"), כך שתיאור מלא של מוצר בודד לא ממולא בשום מקום.
- **היסטוריה/שחזור:** `GET /api/v1/r/{rikma}/products/{id}/history` מהצעות השינוי
  הקיימות (`archive/*`) — בלי סכמה חדשה; שחזור אמיתי ידרוש טבלת versions. 7–10 ימים.
- **חיפוש ופאסטות:** `q` + facets על קטגוריה/מחיר/רקמה/מרחק (יש lat/lng/radius). 3–5 ימים.
- **מטריקות ומכסות פר-מפתח:** דף "שימוש" בפאנל + rate limit ב-Redis
  (in-memory מתפצל בין מופעים). 4–6 ימים.
- **Batch/`updatedSince`/conditional GET:** לחיבור אתרי קטלוג גדולים. 2–3 ימים.
- **`look` API:** להחזיר לרקמה את פלטת המראה שלה (`rikmaLook/tokens.ts`) כדי
  שאתר חיצוני ייראה אותו דבר. 1–2 ימים (יקר בערך, זול לקוד).

### P2 — בגרות
Deprecation policy וגרסאות API, JSON-LD/sitemap פר-רקמה, סכמת שדות מותאמת (§4.9),
Job מתוזמן ל"פרסום מתוזמן", import מוצרים (CSV/JSON), "שלח טיוטה לאישור" מ-API.

---

## 5. חוזה ה-API המוצע (v1)

### 5.0 רקמה-תחילה: למה הכתובת נושאת את הרקמה ולא הפרמטר

`GET /api/v1/r/haohel/products` — הרקמה היא **המשאב**, והמוצרים הם אוסף שבתוכו.
זה ההבדל בין "חנות" ל"קטלוג".

| # | הנימוק | למה `?rikma=57` נכשל כאן |
|---|---|---|
| 1 | **מפתח מטמון נכון.** כתובת אחת = רקמה אחת = רשומה אחת ב-CDN. ניקוי אחרי שינוי (`purge /api/v1/r/haohel/*`) הוא פעולה מדויקת | כל וריאציה של סדר פרמטרים או כינוי מייצרת מפתח אחר; purge הופך ל"נקה הכל" |
| 2 | **אכיפה כפולה של ה-tenant.** המפתח נושא רקמה, וגם הנתיב נושא רקמה — אי-התאמה ⇒ `403`. שני מקורות בלתי-תלויים לאותו גבול | מקור אחד. טעות בקוד הפילטר = דליפה בין רקמות |
| 3 | **מוכן לכתובות של הרקמה.** `PLAN_RIKMA_SUBDOMAINS` כבר קיים: `/r/<slug>` היום, `<slug>.1lev1.com` ב-S2 | פילטר לא הופך ל-subdomain; הנתיב כן (`{slug}.1lev1.com/api/v1/products`) |
| 4 | **דומיין משלו של הלקוח.** רקמה שרוצה `shop.haohel.co.il` מפנה ל-`/api/v1/r/haohel/*` (או משכפלת בפרוקסי). הכלל "כל בקשה תחת הקידומת הזו היא שלי" | דורש שכתוב פרמטרים בכל ערוץ |
| 5 | **מכסות, מדידה והתראות פר-רקמה.** "הרקמה הזו שולפת 50k/יום" היא שאילתה טריוויאלית | צריך לפרק את ה-Query String בכל בקשה |
| 6 | **`ETag`/`updatedSince` קטנים ומדויקים.** האוסף הוא של רקמה אחת, לא של כל הפלטפורמה | ראו 1 |
| 7 | **מודל מנטלי נכון למי שבונה.** חבר/מפתח לא מחפש "איך לסנן"; הוא מחפש **"מה הכתובת של החנות שלי"** — ומקבל מחרוזת אחת להעתיק | צריך להסביר מה זה `rikma` ואם הוא בכלל רלוונטי |

מסקנה מעשית: **`rikma` אינו פרמטר אלא קידומת.** הפרמטרים נשארים *בתוך* הרקמה
(חיפוש, מיון, קטגוריה, מחיר, מלאי, מיקום) — שם הם באמת סינון.

#### שני עדשות, בשמות מפורשים

| עדשה | כתובת | מי | מה היא נותנת |
|---|---|---|---|
| **חנות (ראשית)** | `/api/v1/r/{rikma}/…` | האתר של הרקמה, הלקוח שלה, הסוכן | המוצרים של הרקמה הזו. כתובת יציבה, נשמרת ב-cache, מוגנת ב-tenant |
| **שוק (משנית)** | `/api/v1/discover/products` | עמוד ה-`/gift` הציבורי, כלי חיפוש, קונסיירז' | כל המוצרים המפורסמים בפלטפורמה, עם `rikma` כתוצאה (`rikma:{id,slug,name}`), לא כקלט |

ההפרדה בשם היא החלטה מוצרית: מי שמעתיק snippet מריץ "חנות", ומי שבונה שוק
יודע שהוא בונה שוק. אף אחד מהם לא מגלה בדיעבד שקיבל את השני.

#### שלוש צורות כתובת לאותה רקמה

| צורה | דוגמה | מתי |
|---|---|---|
| slug | `/api/v1/r/haohel/products` | ברירת המחדל; יציב כי **slug קודם לא משתחרר אף פעם** (`formerSlugs`, PLAN_RIKMA_SUBDOMAINS) |
| מזהה | `/api/v1/r/57/products` | לרקמה בלי כתובת עדיין (`rikmaPath` נופל ל-`/project/<id>`) ולכלים פנימיים |
| subdomain (S2) | `haohel.1lev1.com/api/v1/products` | אותה תשובה, הקידומת נעלמת; `RESERVED_SLUGS` כבר מגן על `api`/`app`/`cdn` |

בכל תשובה מוחזרים `rikma.id`, `rikma.slug` (nullable), `rikma.url` ו-
`rikma.canonicalPath`, כך שצרכן ששמר כתובת נושנה יכול לתקן את עצמו לבד.

#### התנהגות בקצוות (לפי הדף, לא לפי ניחוש)

| מצב | התשובה | לפי |
|---|---|---|
| **GET**, slug עם איות שונה (`/r/Bees`) | `301` ל-`/r/bees` | `(regandnon)/r/[slug]/+page.server.js` |
| **GET**, slug **קודם** של רקמה | `301` לכתובת הנוכחית + `X-1lev1-Rikma-Canonical` | `findBySlug` → `former` |
| **POST** (sales/tasks/orders), איות שונה או slug קודם **של רקמת המפתח** | **לא מפנים** — מגישים כרגיל, ומחזירים `X-1lev1-Rikma-Canonical` + `Link: <…>; rel="canonical"` | `301`/`302` הופכים POST ל-GET בדפדפנים וב-fetch, והגוף אובד. ה-tenant כבר ודאי מהמפתח, אז אין עמימות |
| בקשה **עם מפתח**, והנתיב אינו אחד מהשמות של רקמת המפתח (id / slug / `formerSlugs`) | `403 RIKMA_MISMATCH` — **לפני** כל חיפוש של הנתיב, ולכן גם כשהרקמה בנתיב לא קיימת | כך התשובה לא מגלה אם רקמה קיימת. ההשוואה היא מול הזהות של רקמת המפתח (`readIdentity(key.project.id)`), לא מול `findBySlug(path)` |
| בקשה **אנונימית** לרקמה שלא קיימת | `404` | הדף |
| מוצר שקיים אבל לא שייך לרקמה בנתיב | `404` | §5.3 |
| רקמה בלי slug | עובד דרך המזהה | `rikmaPath` |

### 5.1 אימות ו-scopes

| Consumer | אימות | scope | הערות |
|---|---|---|---|
| אתר לקוח (ציבורי) | ללא | — | רק מוצרים `published` (כולל `hideFromDiscovery` — כמו דף הרקמה, §4.3); DTO ציבורי; rate limit לפי IP; הרקמה מגיעה תמיד מהנתיב |
| אתר לקוח (מורחב) | `Authorization: Bearer 1lev1_...` | `products:read` | quota גבוה, `updatedSince`, `fields`, bulk; הנתיב **חייב** להיות הרקמה של המפתח |
| אתר לקוח (טיוטות) | אותו מפתח | `products:read:draft` | רואה גם `draft` (`status_of_voting ∈ {draft, voting}`); תשובה `private` בלבד (§4.5) |
| אינטגרציית מכירות | מפתח | `sales:report` | כמו היום |
| סוכן/אוטומציה | MCP / key | `tasks:*` | כמו היום |

**כלל ה-tenant (שני מקורות בלתי-תלויים):** `projectId` נגזר מהמפתח (כמו
ב-sales/tasks) **וגם** מהנתיב. מפתח של רקמה שפונה לרקמה אחרת ⇒ `403` —
גם אם המשתמש חבר בשתי הרקמות.

**מפתח ברמת משתמש (בלי רקמה) — כן קיים, והכלל מפורש (תוקן, §12):**
`/api/api-keys` מפיק מפתח בלי `projectId` מדף הפרופיל (`userPr/editBasic.svelte`),
ויש גם מפתחות MCP ו-OAuth. בכל `/api/v1/r/{rikma}/…`:
- מפתח כזה ⇒ `403 KEY_NOT_RIKMA_SCOPED` עם הודעה מפורשת ("הוצא מפתח ברמת רקמה
  במוח") — **גם** ב-GET שהיה עובד אנונימית. מי ששולח מפתח מצהיר על זהות; להוריד
  אותו בשקט לאנונימי מסתיר באג אצל הלקוח (הוא יחשוב שיש לו quota וטיוטות).
- אותו כלל כבר קיים ב-`sales/+server.ts` (`'API key is not scoped to a rikma'`) —
  כאן הוא רק מוכלל ומקבל קוד שגיאה.
- `GET /api/v1/me` **כן** מקבל מפתח משתמש ומחזיר `rikma:null` — כדי שהסוכן יבין
  לבד למה הוא מקבל 403.

**מוצר אישי (`origin:'personal'`) אינו חריג לכלל.** לפי PLAN_USER_OFFERINGS,
מוצר של ספק יחיד מתארח על **רקמת הבית** שלו (רקמה רגילה לגמרי, שנוצרת בהסכמה
בפרסום הראשון) — ולכן `/api/v1/r/{homeRikma}/products` מחזיר אותו עם
`seller.type='person'`. המשמעות: חבר לא צריך לדעת שיש לו "רקמת בית" כדי
להשתמש ב-API; הפאנל מציג את הכתובת שלו, לא את המזהה הפנימי. (עדשה נפרדת
לעמוד המוכר — `/api/v1/sellers/{userId}/products` — P2, לפי `UserStorefront`.)

### 5.2 Endpoints

**החנות של רקמה (הראשי).** `{rikma}` = slug או מזהה.

```
GET  /api/v1/r/{rikma}                        # הרקמה: שם, slug, תיאור ציבורי, מיקום, look, מונה מוצרים
GET  /api/v1/r/{rikma}/products               # הקטלוג שלה + סינון/מיון/עמודים
GET  /api/v1/r/{rikma}/products/{productId}   # מוצר (404 אם אינו של הרקמה)
GET  /api/v1/r/{rikma}/categories             # הקטגוריות שיש להן מוצרים כאן
GET  /api/v1/r/{rikma}/changes?since=ISO      # מה השתנה — sync למטמון של הלקוח
POST /api/v1/r/{rikma}/orders                 # אופציונלי (P1) → createSheirutpend
```

**השוק (המשני).**

```
GET  /api/v1/discover/products   # כל המוצרים המפורסמים (מקביל ל-/gift); rikma = שדה בתוצאה
GET  /api/v1/sellers/{userId}/products   # עדשת מוכר אישי (P2, לפי UserStorefront)
```

**שירותים על-רקמתיים (לא קטלוג).**

```
GET  /api/v1/me                 # הזהות של המפתח: user, rikma{id,slug}, scopes, quota
GET  /api/v1/webhooks/deliveries (P1) # יומן משלוחים פר-מפתח
```

`GET /api/v1/me` הוא התוספת הקטנה שהופכת את החוזה לשימושי: הסוכן של הלקוח
פותח בכתובת אחת, מקבל את ה-slug של הרקמה, ה-scopes והמכסה — ובונה משם את כל
השאר. בלי זה, כל אינטגרציה מתחילה ב"תגיד לי מה מזהה הרקמה שלי".

#### ה-endpoints הקיימים (sales / tasks) — עוברים לכתובת הרקמה

`POST /api/v1/sales`, `POST /api/v1/tasks` ו-`GET /api/v1/tasks/{externalId}`
כבר רצים — אבל **בשליטה מלאה על כל הצרכנים שלהם** (מעט אינטגרציות שלנו, לא
לקוחות זרים). ולכן אין שום סיבה לשמר אותם כחריג לכלל:

```
POST /api/v1/r/{rikma}/sales                ← היה /api/v1/sales
POST /api/v1/r/{rikma}/tasks                ← היה /api/v1/tasks
GET  /api/v1/r/{rikma}/tasks/{externalId}   ← היה /api/v1/tasks/{externalId}
```

הפונקציונליות זהה — **רק הכתובת משתנה**, ולכן ההגירה זולה. המסלול המלא §5.8.

> `/api/v1/sales` ו-`/api/v1/tasks` הם היום ה-endpoints היחידים ב-`v1` שאינם
> נושאים רקמה בכתובת. זו הייתה **ברירת מחדל של זמן**, לא החלטה. אחרי §5.8
> כל משטח ה-API של רקמה נראה אותו דבר — קריאה וכתיבה.

### 5.3 DTO ציבורי — ומה שאסור שייצא

| יוצא ל-API | נשאר פנימי (חובה) |
|---|---|
| `id`, `name`, `descriptionHtml` (מחוטא — ראה להלן), `descriptionText`, `status` (`draft`\|`published`\|`archived`) | `marginPct`, `estimatedPrice`, `maxsaleyear*`/`minsaleyear*` |
| `price`, `currency`, `pricingMode` (quote ⇒ `price:null`) | `entryCurrency`/`entryRate` (חישוב פנימי) |
| `availability: {unlimited|quantity}` | **המתכון** `matanot_recipe_*` (שעות/תעריפים/חברים משויכים = עלות) |
| `categories[]`, `images[] {url,width,height,alt}` | `tosplits`, `holderStatus`, `sale`/`sales` מצרפי, `monter` |
| `seller {type: person\|rikma, id, name, url, picUrl}` | `ratson*`, `nego*`, `matanotpend`, `decision`, `timegrama` |
| `rikma {id, slug, name, canonicalPath, url, look?}` | `hideFromDiscovery`, `appruved`, `status_of_voting`, `discoveryKeywords`, `formerSlugs` |
| `geo {lat,lng,radius,hint,isOnline}` | `users_permissions_user` פנימי, מיילים, טלפונים, `owner_user` מעבר ל-`seller` |
| `dates {startDate, finnishDate}`, `updatedAt`, `url`, `buyUrl` | `oneForeProject`, `process`, קישורי Decision |
| `externalKey` (P2 — מפתח URL ידידותי שנבחר ע"י הרקמה, §9.10) | מזהי Decision/Sheirutpend והקישורים אליהם |

> העיקרון: **whitelist, לא blacklist** — ה-projector בונה מחדש אובייקט, לא מסנן
> אחד שהגיע מ-Strapi. כל שדה חדש ב-Strapi נשאר פנימי עד שמוסיפים אותו במפורש.
>
> `rikma.look` יוצא רק ב-`GET /api/v1/r/{rikma}` (פרופיל הרקמה), ולא בכל שורה
> ברשימה — הוא זהה לכל השורות ומייקר את ה-payload.

> **`descriptionHtml` — HTML שאנחנו מייצרים, לא שאנחנו מעבירים (תוקן, §12).**
> `desc` הוא rich text ב-JSON. אתרי הלקוחות יעשו לו `innerHTML` /
> `dangerouslySetInnerHTML`, ולכן כל מה שיוצא הוא משטח XSS אצלם:
> - ה-HTML נבנה ע"י **serializer שלנו** מתוך ה-JSON, עם whitelist של תגיות
>   (`p, br, strong, em, ul, ol, li, h2–h4, blockquote, a`) ו-whitelist של
>   מאפיינים (`href` בלבד, `http(s):`/`mailto:` בלבד, ומוסיפים
>   `rel="noopener nofollow ugc"`). אין העברה של HTML גולמי, אין `style`, אין
>   `on*`, אין `javascript:`.
> - בדיקת יחידה עם payload-ים זדוניים ידועים (תגית `script`, `img onerror`,
>   `javascript:` ב-href) שחייבים לצאת נקיים.
> - `descriptionText` (טקסט שטוח) הוא ברירת המחדל בתיעוד; ה-HTML מתועד כ"מחוטא
>   אצלנו, אבל התייחס אליו כתוכן משתמש".

### 5.4 דוגמת תשובה — `GET /api/v1/r/haohel/products`

```json
{
  "rikma": { "id": "57", "slug": "haohel", "name": "רקמת האוכל", "canonicalPath": "/api/v1/r/haohel" },
  "data": [
    {
      "id": "1842",
      "name": "סדנת בישול ל-8",
      "descriptionHtml": "<p>...</p>",
      "status": "published",
      "price": 320, "currency": "ILS", "pricingMode": "fixed",
      "availability": { "unlimited": false, "quantity": 6 },
      "kindOf": "total",
      "categories": [{ "id": "12", "name": "סדנאות" }],
      "images": [{ "url": "https://…/small.jpg", "width": 500, "height": 375, "alt": null }],
      "seller": { "type": "rikma", "id": "57", "name": "רקמת האוכל", "url": "/r/haohel" },
      "geo": { "lat": 31.89, "lng": 34.81, "radius": 15000, "hint": "רחובות", "isOnline": false },
      "dates": { "startDate": null, "finnishDate": null },
      "locale": "he",
      "updatedAt": "2026-10-14T08:12:00.000Z",
      "url": "https://www.1lev1.com/gift/1842",
      "buyUrl": "https://www.1lev1.com/gift/1842"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 137, "pages": 7 },
    "locale": "he",
    "generatedAt": "2026-10-16T10:00:00.000Z"
  },
  "links": {
    "self": "/api/v1/r/haohel/products?limit=20",
    "next": "/api/v1/r/haohel/products?limit=20&page=2"
  }
}
```

הרקמה מופיעה **פעם אחת, בראש התשובה** — לא בכל שורה. `seller` נשאר פר-שורה,
כי ברקמה עם מוכרים אישיים הוא באמת שונה משורה לשורה.

כותרות בתשובה (לבקשה **אנונימית**; בקשה עם מפתח מקבלת
`Cache-Control: private, no-cache` — §4.5):

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
Vary: Authorization, Origin
ETag: W/"rikma-57-6f3a…"
X-1lev1-Api-Version: 2026-10-16
X-1lev1-Rikma-Canonical: /api/v1/r/haohel        # רק כשהייתה הפניה/שם קודם
RateLimit-Limit: 600
RateLimit-Remaining: 597
```

### 5.5 פרמטרים **בתוך** הרקמה

כל הפרמטרים כאן משמשים לסינון *בתוך* הקטלוג של הרקמה שבנתיב. אין ביניהם
`rikma` — הרקמה היא המשאב, לא פילטר (§5.0). ל-`/api/v1/discover/products`
אותו סט **ועוד** `rikma` — שם הוא באמת פילטר, כי האוסף הוא על-רקמתי. (וגם
ההבדל היחיד בתוכן: `discover` מחריג `hideFromDiscovery`, החנות לא — §4.3.)

| פרמטר | דוגמה | הערה |
|---|---|---|
| `limit`, `page` | `?limit=50&page=2` | ברירת מחדל 20, תקרה 100 |
| `sort` | `?sort=-updatedAt` | `price`, `createdAt`, `name` |
| `q` | `?q=סדנה` | `name` + `discoveryKeywords` + קטגוריה (כבר קיים) |
| `seller` | `?seller=person:88` / `?seller=rikma:57` | מסנן את המוצרים האישיים של מוכר בתוך הרקמה |
| `category` | `?category=12` | id או שם; ניתן לחזור |
| `minPrice`, `maxPrice`, `currency` | `?minPrice=100&maxPrice=500` | |
| `available` | `?available=true` | `quant != 0` (ו-`-1` = ללא הגבלה) |
| `kindOf` | `?kindOf=monthly` | |
| `lat`,`lng`,`radius` | `?lat=31.89&lng=34.81&radius=15000` | משתמש במודל המיקום הקיים |
| `locale`, `fallbackLocale` | `?locale=en` | דרך שכבת התרגום |
| `fields` | `?fields=id,name,price,currency` | sparse fieldset |
| `expand` | `?expand=categories` | ברירת מחדל: שטוח |
| `status`, `updatedSince` | `?status=published&updatedSince=2026-10-01T00:00:00Z` | דורש מפתח; `status` ∈ `published`\|`draft`\|`archived` (`draft` דורש `products:read:draft`) |
| `draft` | `?draft=true` | דורש `products:read:draft` |

### 5.6 שגיאות (אחיד, כמו sales/tasks)

```json
{ "error": { "code": "SCOPE_MISSING", "message": "API key is missing the \"products:read\" scope", "details": {} } }
```

`400` ולידציה · `401` מפתח חסר/פגום · `403` scope/Origin/**רקמה לא תואמת**
(`RIKMA_MISMATCH`)/**מפתח ברמת משתמש** (`KEY_NOT_RIKMA_SCOPED`) ·
`404` מוצר לא נמצא או לא של הרקמה שבנתיב · `409` התנגשות `externalId`
(ב-`orders` בלבד) · `429` + `Retry-After` · `5xx` כשל Strapi
(עם `X-1lev1-Trace` לדיבוג).

### 5.7 Webhooks יוצאים (הרחבה של הקיים)

```
product.created | product.updated | product.published | product.archived
inventory.updated   (data.changed = ["quant"])
sale.created | sale.holderConfirmed | sale.claimed
```

```json
{
  "event": "product.updated",
  "deliveryId": "dlv_01J…",
  "occurredAt": "2026-10-16T10:02:11.000Z",
  "rikmaId": "57",
  "data": { "…": "אותו DTO ציבורי, כדי שלא צריך קריאה נוספת" },
  "changed": ["price", "quant"]
}
```

חתימה זהה להיום: `X-1lev1-Signature: sha256=<hmac>` על ה-body הגולמי,
`X-1lev1-Event`, `X-1lev1-Delivery`; 3 ניסיונות, 4xx לא מנוסה.
**תוספת מומלצת:** `GET /api/v1/webhooks/deliveries` + כפתור "שלח שוב" בפאנל.

### 5.8 נדידת sales/tasks לכתובת הרקמה — למה עכשיו ואיך

**ההנחה שהשתנתה (2026-10-16):** יש לנו **שליטה מלאה במעט הצרכנים** של ה-API.
לכן שינוי כתובת אינו אירוע חיצוני שמחייב תאימות-לאחור-לנצח, אלא **תחזוקה**.
חלון הזמן הנכון לסגור את זה הוא **עכשיו** — לפני שנכתבים snippets, דף תיעוד,
SDK, ו-OAuth/MCP שמעגנים שני מודלים במקביל. כל שבוע שעובר מייקר את זה.

**מה משתנה: רק ה-URL.** ה-payload, ה-headers, קודי השגיאה, האידמפוטנטיות
(`externalId`), הסכמת מחזיק-הכסף (`saleClaim`), ה-CORS וה-webhooks נשארים
בדיוק כפי שהם. לכל צרכן זה diff של שורה אחת:

```diff
- await fetch('https://www.1lev1.com/api/v1/sales',   …
+ await fetch('https://www.1lev1.com/api/v1/r/haohel/sales',   …
```

**מה מרוויחים מזה מעבר ל"אחידות":**

| # | הרווח | למה זה לא קוסמטי |
|---|---|---|
| 1 | **אכיפת tenant כפולה בכל ה-API** — גם המפתח וגם הנתיב | ב-`sales` זה מהותי: הדיווח **יוצר** Sale על רקמה ומזיז מלאי וכסף. אי-התאמה בין המפתח לנתיב חייבת להיכשל בקול (`403 RIKMA_MISMATCH`) ולא "להיגזר בשקט מהמפתח" |
| 2 | **לוג/מכסה/מדידה פר-רקמה אחידים** | "הרקמה הזו שולחת 50k דיווחים ביום" הופך לשאילתה אחת, לא לפרסור Query String |
| 3 | **subdomain מוכן מראש** | `{slug}.1lev1.com/api/v1/sales` הוא rewrite בודד ל-`/api/v1/r/{slug}/sales` — בלי טבלת מיפויים |
| 4 | **spec אחד לכל משטח הרקמה** | OpenAPI אחד ⇒ types, SDK, `/docs/api` — לצרכן יש מסמך אחד לכל מה שהוא עושה |
| 5 | **ה-webhooks כבר פר-רקמה ממילא** | `invalidateWebhookTargets(projectId)`; מעכשיו גם ה-endpoints |
| 6 | **סדר פעולות אחד לצרכן** | צרכן של sales **וגם** tasks ממפה slug פעם אחת — לא פעם אחת "אין רקמה" ופעם שנייה "יש" |
| 7 | **הכנה ל-`orders`/`fulfillment`** | הזמנה, ביצוע ומכירה הם אותו עולם; בלעדיהם היינו נאלצים להמציא חריג לכל אחד מהם |

**מה לבנות, בסדר הזה:**

| # | צעד | פירוט |
|---|---|---|
| 1 | **מיצוי handler משותף** | `src/lib/server/apiPublic/` — להוציא את הלוגיקה מ-`routes/api/v1/sales/+server.ts` ו-`routes/api/v1/tasks/*` למודולי handler (ולידציה + build + execute). **אפס שינוי התנהגות** — ואז כל נתיב, ישן וחדש, הוא 3–5 שורות wrapper סביב אותו handler. אסור שיהיו שני מימושים |
| 2 | **הנתיבים החדשים** | `routes/api/v1/r/[rikma]/sales/+server.ts`, `.../tasks/+server.ts`, `.../tasks/[externalId]/+server.ts` |
| 3 | **שני מקורות ל-tenant** | הנתיב מושווה לזהות של `key.project` (id / slug / `formerSlugs`) ⇒ תואם, אחרת `403 RIKMA_MISMATCH` — **לפני** חיפוש הנתיב ולפני פענוח ה-payload. מפתח בלי project ⇒ `403 KEY_NOT_RIKMA_SCOPED` עם הודעה מפורשת ("הוצא מפתח ברמת רקמה במוח"). **אין הפניה (301) על POST**: איות שונה או slug קודם של רקמת המפתח מוגשים כרגיל עם `X-1lev1-Rikma-Canonical` (§5.0) |
| 4 | **ה-snippets וה-prompts — הצעד החשוב ביותר** | `prPr/SalesApiIntegration.svelte` (שם יש היום `/api/v1/sales` בשלושה מקומות, כולל פרומפט הסוכן) ו-`prPr/api/RikmaApiPanel.svelte` (`/api/v1/tasks` בשלושה מקומות) — מעדכנים **מיד** ל-URL החדש, עם ה-slug האמיתי של הרקמה. זה המשטח שממנו נולדות כל האינטגרציות: בלי זה כל לקוח חדש ייטמע מפתח בכתובת שתיסגר |
| 5 | **alias של מורשת** | הנתיבים הישנים נשארים כ-wrapper דק שמריץ את **אותו** handler, ומחזיר בכל תשובה `Deprecation: true`, `Sunset: <תאריך>`, `Link: </api/v1/r/{slug}/sales>; rel="successor-version"`, ורושם לוג `[api-legacy]` עם מפתח+רקמה+IP. **לא 301/308** — POST לא בהכרח מלווה redirect, וה-wrapper צריך להגיש בפועל |
| 6 | **העברת הצרכנים** | רשימה קצרה (אינטגרציות שלנו). לכל אחד: diff של שורה + אימות בסביבה. אחרי ההעברה — לאמת אפס תעבורה ב-`[api-legacy]` למשך שבוע |
| 7 | **סגירה** | אחרי החלון: `410 Gone` עם אותו `Link` (עדיף על 404 שקט — הוא אומר לצרכן בדיוק מה קרה), ואז הסרת ה-wrapper |
| 8 | **`/api/v1/actions`** | רשימת-ההיתר ההיסטורית (`createTask` בלבד) — **המלצה: לסגור יחד עם המעבר.** אין לה תפקיד אחרי ש-`tasks` עומדת בפני עצמה, ו-MCP מכסה סוכנים. יש לאמת אפס שימוש אמיתי לפני סגירה |

**חלון ההתיישנות:** מוסר כשכל הצרכנים הועברו — ולא יאוחר מ-**90 יום** מתאריך
ההשקה. שני התנאים יחד מונעים גם "alias נצחי" וגם סגירה מוקדמת מדי.

**בדיקות מחייבות:**

- **זהות מלאה בין הנתיבים**: אותו payload ⇒ אותם params בדיוק ל-`actionService`
  (assert על ה-params, לא על התשובה) — זה מה שמונע סטייה עתידית בין הישן לחדש.
- alias מחזיר את כותרות ההתיישנות; אחרי הסגירה — `410` + `Link`.
- `403 RIKMA_MISMATCH` על אי-התאמת רקמה (גם כשהמפתח תקף), **וגם** כשהרקמה
  בנתיב לא קיימת כלל — לפני כל פענוח payload (בלי אורקל קיום).
- `403 KEY_NOT_RIKMA_SCOPED` על מפתח בלי project.
- POST לאיות שונה / slug קודם של רקמת המפתח ⇒ `201` (לא `301`) +
  `X-1lev1-Rikma-Canonical`; המכירה נרשמת פעם אחת.
- אין qid כפול, אין ולידציה כפולה, ואין ענף קוד שמטפל בישן בנפרד.

**העדכון הדוקומנטרי הנלווה:** `PLAN_EXTERNAL_SALES_API` ו-`PLAN_EXTERNAL_TASKS_API`
(שניהם ב-`done/`) הם תיעוד היסטורי של מה שנבנה — **לא** משכתבים אותם, אלא
מוסיפים בראשם הפניה לסעיף הזה, כדי שמי שקורא אותם לא יעתיק כתובת שתיסגר.

---

## 6. סיכוני אבטחה ופרטיות ברגע שפותחים קריאה

1. **דליפת כלכלה פנימית.** המתכון (`matanot_recipe_*`) הוא עלות אמיתית של
   הרקמה (שעות × תעריף, `stepCapacity`, `costShape`, `assignedMember`) —
   חשיפה שלו = חשיפת הרווח. גם `marginPct`/`estimatedPrice`/`maxsaleyear*`.
   ⇒ whitelist projector + בדיקת snapshot על ה-DTO (test שנכשל כששדה חדש נכנס).
2. **ה-API לא יחשוף יותר ממה שה-HTML כבר חושף (תוקן, §12).** הכלל: עדשת
   החנות = דף הרקמה, עדשת השוק = `/gift`. `hideFromDiscovery` מוציא רק מהספרייה
   (מוצר מוסתר גלוי היום ב-`/gift/[id]` ובדף הרקמה), ולכן החנות מחזירה אותו
   והשוק לא. **טיוטות** (`status_of_voting ∈ {draft, voting}`) לא יוצאות בלי
   `products:read:draft`, ואז רק בתשובה `private`. בדיקת חוזה: לכל רקמה בבדיקה,
   קבוצת ה-ids בחנות האנונימית == קבוצת המוצרים שדף הרקמה מציג.
   (ההצעה הקודמת, `exposeToApi`, בוטלה — §4.3.)
2א. **מטמון שמדליף טיוטות.** תשובה עם מפתח לעולם אינה `public` (§4.5), ומטמון
   השרת לא חולק רשומות בין אנונימי למפתח-טיוטות.
2ב. **XSS אצל הלקוח.** `descriptionHtml` נבנה ע"י serializer עם whitelist (§5.3).
3. **מוצר אישי = אדם.** ב-`Seller` אסור לחשוף מייל/טלפון/מיקום מדויק מעבר
   למה ש-`/gift` מציג היום. וגם: `/api/v1/r/{homeRikma}/products` של רקמת-בית
   אישית חושף את **כל** המוצרים האישיים של אותו אדם — מותר (זו החנות שלו),
   אבל אסור שמפתח של אתר אחד יראה את מוצריו האישיים ברקמה אחרת, ולכן
   ה-tenant rule (§5.1) הוא גם בקרת פרטיות בין-אדם, לא רק בין-רקמה.
4. **מגבלות מפתח בקצוות:** `revoked`, `allowedOrigins`, פקיעה — כבר בקוד;
   חסר אכיפה של quota פר-רקמה ופר-IP, וחסר סימן לחריגה חריגה ("המפתח הזה
   שולף 10k בקשות/דקה").
5. **עומס על Strapi.** היום כל בקשה ציבורית = שאילתות. לפני פתיחת API:
   מטמון-על בשרת + `s-maxage` + בדיקת עומס. ה-rate limit הקיים הוא per-process
   ולא מגן על ה-backend.
6. **`X-1lev1-Api-Version` + policy:** לשמור תאימות לאחור; שינוי DTO = גרסה חדשה
   עם תקופת חפיפה, לא שינוי שקט.

---

## 7. מה במכוון **לא** להעתיק מ-Payload

| Payload | למה אצלנו זה שגוי |
|---|---|
| CRUD אוטומטי (POST/PATCH/DELETE לכל קולקציה) | כל שינוי במוצר הוא **הסכמה**. כתיבה חופשית דרך API תעקוף `proposeObjectEdit`, את ההצבעות ואת `restime` |
| Local API כעיקרון ארכיטקטוני | כבר יש שקול (`strapiClient.execute` + loaders) — אין מה לבנות |
| קולקציות דינמיות פר-לקוח | שובר qids/authz/UAS ואת הקוהרנטיות של המוצר (§4.9) |
| GraphQL ציבורי בשלב הזה | qids מגנים מפני שאילתות שרירותיות ל-Strapi; `?fields`+`expand` מספיקים לחנות. לשקול רק אם יופיע צרכן אמיתי שביקש |
| מנוע סליקה (Stripe adapter) | PLAN_MONEY_RAILS: הכסף לא עובר דרכנו |
| Admin panel פר-לקוח | ה-Moach הוא המוצר; הרחבה פר-לקוח = דווקא סכמת `attributes` מבוקרת |
| מערכת migrations/adapters | Strapi כבר בצד השני |

**ובמה אנחנו חזקים יותר:** חתימה והסכמה על כל שינוי, `saleClaim` (הכסף לא נספר
בלי הסכמת המחזיק), חלוקת רווחים מובנית, תרגום UGC ל-5 שפות, MCP עם tiers,
מפתחות scoped לרקמה, קונצנזוס על ארכוב/עריכה. אף אחת מהן לא קיימת ב-Payload.

---

## 8. תוכנית ביצוע מדורגת

### Phase 0 — הכנה (2–3 ימים, ריפו `1.0` בלבד)
- [ ] `apiPublic/` — projector ציבורי + בדיקת whitelist (שלא נשפך `marginPct`/מתכון).
- [ ] `resolveRikmaFromPath()` — פונקציה אחת שמאחדת את היגיון `(regandnon)/r/[slug]`
      (איות, `former`, 404) לשימוש גם ב-route של ה-API. **לא לשכפל.**
- [ ] qids חדשים (append-only, קידומת מספרית) + שורה לכל אחד ב-`qidsAccess.js`
      + `npm run validate:qids` + `npm run check:proxy`.
- [ ] מיפוי `status` נגזר מ-`status_of_voting`/`lifecycle`/`archived` עם מגיני NULL
      (§4.3) — **לא** מ-`appruved`. בדיקת יחידה לכל שורה בטבלה, כולל NULL-ים.
- [ ] serializer מחוטא ל-`descriptionHtml` + בדיקות payload זדוני (§5.3).
- [ ] החלטות §9 סגורות.

### Phase 1 — API קריאה, רקמה-תחילה (שבוע–שבועיים, `1.0`)
- [ ] `GET /api/v1/r/{rikma}` + `/products` + `/products/{id}` + `/categories`
      + `GET /api/v1/me`.
- [ ] אכיפת tenant כפולה: מפתח ↔ נתיב ⇒ `403`; מוצר מחוץ לרקמה ⇒ `404`.
- [ ] scope `products:read` + checkbox בפאנל + snippet שמציג את **הכתובת של
      הרקמה הזו** (אין placeholder של `rikma`).
- [ ] caching: `public` לאנונימי בלבד, `private, no-cache` לכל בקשה עם מפתח,
      `Vary: Authorization, Origin`, `ETag`/מטמון-על לפי מעמד-קורא (§4.5);
      rate limit לפי IP למפתח-less.
- [ ] בדיקות: 301 על איות/שם קודם (GET), 403 על רקמה אחרת **ועל רקמה לא קיימת
      עם מפתח**, 403 על מפתח ברמת משתמש, 404 על מוצר זר, 404 אנונימי על רקמה
      לא קיימת, עבודה דרך מזהה לרקמה בלי slug, whitelist, 304, **מוצר עם
      `hideFromDiscovery` מופיע בחנות ולא ב-discover**, **מוצר `voting` לא מופיע
      בלי scope טיוטות**, **תשובה עם מפתח אינה `public`**.
- [ ] **אין שינוי סכמה ב-`1.0b`** — זו הסיבה שזה השלב הראשון.

### Phase 1b — נדידת sales/tasks לכתובת הרקמה (§5.8)
> **נכנס ל-Phase 1, לא אחריו.** הסיבה: כל עוד ה-snippets מצביעים על הנתיב
> הישן, כל אינטגרציה חדשה נולדת עם חוב. השליטה המלאה בצרכנים קיימת **עכשיו**.

- [ ] מיצוי handler משותף ל-`sales` ול-`tasks` ב-`apiPublic/` (אפס שינוי התנהגות).
- [ ] `/api/v1/r/{rikma}/sales`, `/api/v1/r/{rikma}/tasks`, `.../tasks/{externalId}`.
- [ ] אכיפת tenant כפולה + `403 RIKMA_MISMATCH`; מפתח בלי project ⇒ `403`.
- [ ] עדכון ה-snippets/פרומפטים ב-`SalesApiIntegration.svelte` ו-`RikmaApiPanel.svelte`.
- [ ] alias מורשת: `Deprecation`/`Sunset`/`Link` + לוג `[api-legacy]`; מוסר אחרי
      ההעברה, ולא יאוחר מ-90 יום ⇒ `410 Gone`.
- [ ] העברת הצרכנים (diff של שורה) + אימות אפס תעבורה ב-`[api-legacy]`.
- [ ] `GET /api/v1/me` כולל את הכתובות החדשות ב-`endpoints`.

### Phase 2 — עדכון בזמן אמת ללקוח (שבוע)
- [ ] webhooks `product.*`/`sale.*` — ה-delivery target כבר פר-רקמה
      (`invalidateWebhookTargets(projectId)`), ולכן ה-payload נושא `rikma` ראשון.
- [ ] delivery-log + "שלח שוב" בפאנל.
- [ ] `expiresAt` + test/live למפתחות (שינוי סכמה ב-`1.0b`, §4.2).
- [ ] דף `/docs/api` מ-OpenAPI + SDK דק + collection.
- [ ] `updatedSince`/`changes` + `?draft` + preview token.

### Phase 3 — עומק קטלוג (2–4 שבועות, כולל `1.0b`)
- [ ] `attributes` (סכמה מבוקרת פר-רקמה) + `availability` מחושב + `?locale=`
      (כולל `SurfaceKey`, שורה ב-`backfillSources.ts`, `isRealTranslation` — §4.10).
- [ ] `externalKey` לכתובת מוצר ידידותית (§9.10) — אופציונלי, לא חוסם.
- [ ] מדיה: גדלים מפורשים + CDN + גלריה.
- [ ] היסטוריית מוצר מ-Decisions; ואם צריך — טבלת versions + שחזור.
- [ ] חיפוש/פאסטות, מטריקות שימוש, Redis rate limit.
- [ ] `/api/v1/discover/products` (השוק) + `/api/v1/sellers/{id}/products`.
- [ ] `POST /api/v1/r/{rikma}/orders` (בקשת רכש) — לפי החלטה §9.4.

### Phase 4 — בגרות
- [ ] `look` API, JSON-LD/sitemap פר-רקמה, import מוצרים, scheduled publish,
      deprecation policy.
- [ ] **S2 של PLAN_RIKMA_SUBDOMAINS**: `{slug}.1lev1.com/api/v1/products`
      (בנתיב-על אחד — ראה §5.0).

---

## 9. החלטות פתוחות (עם המלצה)

| # | שאלה | המלצה |
|---|---|---|
| 9.1 | API ציבורי לגמרי או מפתח לכולם? | **היברידי**: GET ציבורי ל-`/api/v1/r/{rikma}/products` עבור מוצרים `published` (כמו `/gift` היום, אחרת אין חנות אנונימית) עם rate limit לפי IP; מפתח ל-quota גבוה, `?fields`, `updatedSince`, `draft`, טיוטות וכל מה שאינו ציבורי |
| 9.2 | האם לאפשר כתיבה ב-API? | **לא CRUD.** כתיבה = `proposeObjectEdit` (הצעה) או מוצר **אישי** בבעלות בעל המפתח בלבד. אחרת ההסכמה נעקפת |
| 9.3 | וריאנטים? | להתחיל ב-`attributes` + `availability`; variants מלאים רק כשיש לקוח שדורש |
| 9.4 | הזמנות? | לא סליקה. כן `POST /api/v1/r/{rikma}/orders` → `createSheirutpend` (עם `externalId`), אם יש ביקוש; אחרת להסתפק ב-`buyUrl` + `/api/v1/r/{rikma}/sales` |
| 9.5 | סמנטיקת locale | `?locale=` על בסיס מטמון התרגום הקיים + Strapi `localizations`; להחזיר `translated:true\|false` לכל מחרוזת, לא להתחזות לתרגום שאין |
| 9.6 | מטבע בתשובה | להחזיר `price`+`currency` כמקור, ואופציונלית `converted {amount, currency, rate, asOf}` מ-`/api/fx`; לא להסתיר את המקור |
| 9.7 | האם לחשוף מוצרים אישיים? | כן, באותו endpoint, עם `seller.type='person'` ורמה זהה למה ש-`/gift/[id]` חושף |
| 9.8 | האם לחשוף את המתכון (BOM) כתוכן שיווקי? | לא אוטומטית. אם רקמה תרצה — שדה `includes` נפרד ורשות-פרסום, לא המתכון עם העלויות |
| 9.9 | מי הבעלים של ה-contract? | OpenAPI כמקור אמת, נבדק ב-CI מול ה-projector; שינוי DTO ⇒ bump ל-`X-1lev1-Api-Version` |
| 9.10 | איך נראית כתובת מוצר בודד? | היום רק מזהה מספרי (`/r/haohel/products/1842`). מזהה עובד אבל לא קריא ולא מוכן ל-SEO. **המלצה:** לא לגעת בשדה `name`/במערכת הכתובות של הרקמה; להוסיף `externalKey` אופציונלי שנבחר ע"י הרקמה (באותו אופן שבו נבחר slug לרקמה) ולחשוף `/r/{rikma}/products/{idOrKey}`. שינוי כתובת של מוצר **קיים** הוא שינוי במוצר ⇒ עובר בהסכמה (`proposeObjectEdit`), לא "שמור" |
| 9.11 | ~~מי רשאי לשנות את `exposeToApi`?~~ → **האם צריך מוצר "לחברים בלבד"?** (שונה, §12) | `exposeToApi` בוטל: ה-API מחזיר בדיוק מה שדף הרקמה מחזיר, ו-`hideFromDiscovery` מוציא רק מהשוק. אם יתברר שרקמות צריכות מוצר שלא יופיע **בשום** משטח ציבורי — זה דגל פרטיות חדש שחל על דף הרקמה, `/gift/[id]` וה-API יחד, לא דגל API נפרד. לא חוסם MVP |
| 9.12 | **האם לשבור את `/api/v1/sales` ו-`/api/v1/tasks`?** | **כן — עכשיו.** יש שליטה מלאה במעט הצרכנים, כך שהמעבר הוא תחזוקה ולא אירוע חיצוני. **רק ה-URL משתנה**; payload/התנהגות זהים. alias עם `Deprecation`/`Sunset` ל-90 יום ⇒ `410 Gone`. הדחייה היחידה שמתקבלת היא "עד סוף Phase 1" — לא מעבר לזה, כי כל שבוע מוסיף snippets ותיעוד שנכתבים על הכתובת הישנה (§5.8) |
| 9.13 | האם לסגור את `/api/v1/actions`? | **כן, יחד עם §5.8** — אחרי ש-`tasks` עומדת בפני עצמה אין לה תפקיד, ו-MCP מכסה סוכנים. יש לאמת אפס שימוש אמיתי לפני הסגירה |
| 9.14 | מה קורה למפתח ברמת משתמש (בלי רקמה) ב-`/api/v1/r/{rikma}/…`? (נוסף, §12) | **`403 KEY_NOT_RIKMA_SCOPED`**, גם ב-GET שעובד אנונימית — מפתח שנשלח הוא הצהרת זהות, ולהוריד אותו בשקט לאנונימי מסתיר באג. `GET /api/v1/me` מקבל אותו ומחזיר `rikma:null` |

---

## 10. נספח — מפת הראיות בקוד

| נושא | קבצים |
|---|---|
| סכמת מוצר/מכירה | `src/generated/STRAPI_SCHEMA_REFERENCE.md` (§Matanot, §Sale, §Category), `src/lib/generated/contentTypes.d.ts` |
| יצירת/עריכת מוצר | `src/lib/components/prPr/newmatana.svelte`, `src/lib/components/products/ComposeProduct.svelte`, `src/lib/server/actions/configs/{createComplexMatanot,createPersonalMatanot,publishUserResourceAsProduct,proposeObjectEdit,approveMatanot,setMatanotDiscovery}.ts` |
| ממשל/ארכוב | `src/lib/server/archive/{targets,apply,decision}.ts`, `src/lib/server/actions/configs/proposeObjectArchive.ts` |
| מסך הניהול | `src/routes/(reg)/moach/[projectId]/sales/+page.svelte`, `src/lib/components/prPr/hamatanot.svelte` |
| ספרייה ציבורית | `src/routes/(regandnon)/gift/+page.server.js` (qid 282), `+page.svelte`, `src/routes/(regandnon)/gift/[id]/*`, `src/lib/server/discovery/normalizeCards.ts` |
| דף רקמה ומראה | `src/lib/server/rikmaPublic/loadRikmaPage.js`, `src/lib/components/rikmaPublic/RikmaPage.svelte`, `src/lib/rikmaLook/*` |
| **כתובת הרקמה (הבסיס ל-API)** | `src/routes/(regandnon)/r/[slug]/+page.server.js` (איות, `former`, 404), `src/lib/rikmaAddress/{rikmaUrl,slug,reserved}.js` (`rikmaPath`, `RESERVED_SLUGS`), `src/lib/server/rikmaIdentity/identity.js` (`findBySlug`, `readIdentity`), `docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md` |
| API של כתיבה | `src/routes/api/v1/{sales,tasks,actions}/**`, `src/lib/server/{salesApi,tasksApi}.ts` |
| מפתחות/scopes | `src/lib/server/apiKeys.ts`, `src/routes/api/api-keys/+server.ts`, `src/lib/components/prPr/api/RikmaApiPanel.svelte`, `src/lib/components/userPr/api-keys.svelte` |
| Webhooks | `src/lib/server/webhooks/{dispatch,targets,secret}.ts` |
| הרשאות | `src/lib/server/authz/*`, `src/routes/api/permissions/+server.ts` |
| תרגום | `src/lib/server/translation/*`, `docs/inprogress/PLAN_UGC_TRANSLATION.md` |
| מטבע/מחירים | `src/routes/api/fx/+server.ts`, `src/lib/money/*`, `docs/done/PLAN_MULTI_CURRENCY.md` |
| מדיה | `src/routes/api/upload/+server.ts`, `src/lib/uploads/policy.js` |
| MCP כתבנית תיעוד | `src/routes/mcp/*`, `src/lib/server/mcp/toolManifest.ts` |
| **מכירה שמייצרת עבודה** | `src/lib/server/actions/configs/createSheirutFromPending.ts` (§4a — Mesimabetahalich + Act + Maap), `createSale.ts` (מלאי, monter, saleClaim) |
| **ביצוע ותמחור בפועל** | `src/generated/STRAPI_SCHEMA_REFERENCE.md` (§SheirutFulfillment, §MatanotRecipeMission, §MatanotRecipeResource), `src/lib/pooling/priceCurve.ts`, `docs/inprogress/PLAN_POOL_PRODUCT.md`, `docs/done/PLAN_COMPLEX_PRODUCTS.md` |
| קונבנציות | `AGENTS.md`, `CLAUDE.md`, `docs/AGENT_ACTION_MIGRATION_GUIDE.md`, `docs/done/PLAN_PROXY_SECURITY.md` |

---

## 11. נספח — שני דברים שמיוחדים ל-1lev1, וצרכן חיצוני חייב לדעת שהם מגיעים

> **מצב: מודעות בלבד. שום דבר כאן לא נדרש ל-MVP ולא נכנס ל-Phase 0/1.**
> הסעיף קיים כדי שלא נבנה — לא אנחנו ולא הלקוח — חוזה שמניח חנות רגילה, ואז
> נצטרך לשבור אותו. הכלל שמחזיק את זה: **השדות של היום נכונים; אסור להבטיח
> ללקוח הבטחות שהמודל עוד לא נותן.** שני השדות היחידים שנדרשים היום כדי לא
> להיכנס למלכודת הם `pricingMode` (קיים ב-DTO מ-§5.3) ו-`status`.

### 11.א המחיר אינו סופי — הוא נקבע בהתאמה ובצריכה בפועל

מוצר אצלנו **אינו** "מחיר + כמות". שלוש שכבות קיימות בקוד, וכולן משפיעות על
מה שאומרים לצרכן:

| שכבה | מה קיים בפועל | המשמעות לצרכן חיצוני |
|---|---|---|
| **מצב תמחור** | `Matanot.pricingMode` = `fixed` \| `estimated` \| `quote` (enum). ב-`quote` הקונה **לא ממלא מחיר** — הוא מבקש הצעה (דוגמה בקוד: סל קניות, `/gift/[id]` מטפל ב"priced by quote") | `price` יכול להיות **null או לא-מחייב**. אסור להציג אותו כ"מחיר סופי" או להזרים אותו לסליקה חיצונית בלי אזהרה |
| **מתכון (BOM)** | `matanot_recipe_missions`: `hoursPerUnit`, `ratePerHour`, `unitsPerProduct`, `stepCapacity`, `costShape` = `perUnit` \| `shared` \| `stepped`, `mode` = `createNew` \| `consumeExisting`. `matanot_recipe_resources`: `pricePerUnit`, `quantityPerUnit`, `priceMode` = `fixed` \| `atCost`, `mode` = `createNew` \| `consumeExisting` \| `reuseSp` | המחיר הוא **נגזרת של הרכב**, ולא מספר שנקבע ידנית. קלט כמו "כמה יחידות נצרכו בפועל" משנה אותו |
| **צריכה בפועל** | `SheirutFulfillment`: `agreedPrice` (מה שסוכם), `atCostEntries` (הוצאות בפועל עם קבלות), `consumedMissionHours`, `consumedOpenMU`, `cmdm` (משאבים שנמסרו), `status_process` = `pending` \| `active` \| `delivered` \| `completed` | יש **מושג של "אחרי"**: מה שסוכם מול מה שנצרך. `atCostEntries` הוא **החזר הוצאה**, לא הכנסה — ולכן גם לא נכנס לשווי, ל-`tosplit` או לאחוזי שותפות (PLAN_POOL_PRODUCT §C4) |

בנוסף, במוצר מאגד המחיר הוא **צף באמת**: עקומת מחיר (`src/lib/pooling/priceCurve.ts`
— `lineCostAt`/`costAt`/`priceAt`, `stepped` בלי `stepCapacity>1` מתנהג כ-`perUnit`),
תקרה אישית לכל משתתפת, וחלון "לא מתאים" במקום מחיר חתום (PLAN_POOL_PRODUCT).

**מה זה אומר לחוזה, ולמה זה לא חוסם היום:**

| היום (MVP) | בהמשך | ההבטחה שאסור להבטיח בינתיים |
|---|---|---|
| `price` + `currency` + `pricingMode`; `quote` ⇒ `price:null` | `finalPrice` / `priceBreakdown` / `fulfillment:{status, agreedPrice, atCost}` (P3, אחרי החלטה) | "המחיר הזה סופי", "אפשר לחייב לפי השדה הזה", "המלאי מדויק" |
| `pricingMode:'fixed'` ⇒ המחיר סופי | webhook `product.priceChanged` / `sale.priceFinalized` | שאתר של צרכן יכול לחשב לבד את המחיר הסופי מהמתכון |

### 11.ב מכירה אינה שורה — היא **מייצרת עבודה לחברי הרקמה**

זה החלק שהכי קל לפספס מבחוץ. כשבקשת רכש מאושרת
(`createSheirutFromPending`, שלב 4a), הרקמה **מייצרת עבודה אמיתית**:

- לכל שורת מתכון של משימה נוצרת `Mesimabetahalich` (משימה בביצוע) עם השעות
  והתעריף שבמתכון, והיא **משויכת למוכר** שיצר את ההתחייבות — `pendm.rishon.data.id`,
  ולא לקונה.
- מיד אחריה נוצר `Act` — התראה אישית: *"יש לך מוצר ליצור – <שם המוצר>"* /
  *"נדרשת לבצע משימה …"* (`isAssigned:true`, `my: sellerId`).
- לכל שורת מתכון של משאב נוצר `Maap` (רישום הוצאה/מסירה של משאב) — למעט
  `mode:'consumeExisting'`, שחי בגלגול MaapCycle/reservedQuantity (PLAN_POOL_PRODUCT).
- וברמת המכירה עצמה, `createSale` מפחית מלאי (`quant`, לפי `kindOf` ו-`monter`),
  מפעיל `saleClaim` כשהכסף אצל חבר אחר, ומטפל במנויים.

**הדוגמאות שבאמת קורות אצלנו** (הן לא אובייקטים מיוחדים — הן אותו מנגנון):

| דוגמה | איך היא ממומשת |
|---|---|
| "תוציאו מהמחסן" | שורת מתכון של **משאב** ⇒ `Maap`/`Mashabetahalich` + `Act` לחבר שמחזיק אותו |
| "משימה למשלוחן" | שורת מתכון של **משימה** ⇒ `Mesimabetahalich` + `Act` אישי לחבר שאחראי |
| "הבקשה אושרה" ללקוח ולספקים | `notification` על `createSheirutFromPending` (`specificUsers`, מתוך `recipientIds`) |

מכאן, למשמעות מול API: **`POST /api/v1/r/{rikma}/sales` (וגם "הזמנה" עתידית) איננו
"רישום מכירה" — הוא טריגר לביצוע.** מי שמדווח מכירה מבחוץ צריך לדעת שמשהו
מתחיל לקרות בתוך הרקמה, ומי שבונה סנכרון צריך להאזין לכך:

- Webhooks שיתווספו ב-P3: `fulfillment.created` / `fulfillment.delivered` /
  `fulfillment.completed` / `inventory.updated` — לצד `product.*`.
- ב-DTO, כשנחליט: `fulfillment: { statusProcess, agreedPrice, consumedHours? }`.
- **מה שאסור**: לחשוף את המתכון עצמו (`matanot_recipe_*`) — זה עלות של הרקמה
  (§5.3). מה שמותר לתאר החוצה הוא *זמן אספקה/מצב ביצוע*, לא עלות פנימית.

### 11.ג למה זה לא סותר את הבנצ'מרק

פלאגין ה-Ecommerce של Payload מניח מחיר קבוע, וריאנטים, וסל. אצלנו "מוצר"
הוא התחייבות של רקמה, שיכולה להתייחס בעתיד להתייקר או להזדכות לפי צריכה.
זה לא חוסר — זו הסיבה ש-1lev1 לא זקוקה למנוע של חנות גנרי, ואין להכפיף את
המודל לדרישות של אחד (§7). המודעות הזו היא בדיוק מה שמונע מאיתנו לכתוב חוזה
שאומר "מחיר סופי" ומגלה אחר כך שהוא לא.

---

## 12. יומן תיקונים — מה שונה אחרי הסקירה מול הקוד (2026-10-16)

> **לסוכן שממשיך מכאן:** הטבלה הזו היא המקור לשאלה "מה תקף". כל שורה אומרת
> מה המסמך טען קודם, מה נכון בקוד (עם ראיה), ומה השתנה ואיפה. אם גרסה קודמת
> של המסמך, טיוטת OpenAPI ישנה, או זיכרון משיחה קודמת אומרים אחרת — השורה כאן
> גוברת. אל תחזיר אף אחת מההנחות שבעמודה "נטען קודם".

### 12.1 התיקונים

| # | חומרה | נטען קודם | מה נכון בקוד (ראיה) | מה השתנה במסמך |
|---|---|---|---|---|
| 1 | 🔴 | `status` נגזר מ-`appruved`: `draft = !appruved`, `published = appruved ∧ …` | `appruved` נכתב רק ב-`approveMatanot`, שרשום ב-`configs/index.ts` ואין לו קורא ב-UI. היצירה קובעת `status_of_voting` בלבד (`createComplexMatanot.ts:277` — `'active'`/`'voting'`; `createPersonalMatanot` — `'active'`). ⇒ לפי המיפוי הישן כמעט כל מוצר הוא טיוטה והחנות ריקה | מיפוי חדש מ-`status_of_voting` + `lifecycle` + `archived`, עם מגיני NULL; `released` נספר כ-archived; `archiveProposed` נשאר published. §2.1, §2.2, §4.3, §5.3, §5.5, Phase 0, OpenAPI `Status` |
| 2 | 🔴 | `hideFromDiscovery` = "מוסתר"; ה-API יחשוף רטרואקטיבית מוצרים מוסתרים ⇒ צריך `exposeToApi` (ברירת מחדל false); `products:read:draft` רואה `draft + hidden` | ההערה מעל qid `282discoverProducts` (`qids.js` ~14725): מוצר מוסתר *"stays reachable everywhere else: /gift/[id], the project page and the sales flows"*. הדגל מוציא רק מהספרייה `/gift` | **`exposeToApi` בוטל.** חנות = דף הרקמה (כולל מוסתרים); שוק = `/gift` (בלי מוסתרים). `hidden` הוסר מ-enum ה-`status`. זה גם מבטל שתי סתירות: "אין שינוי סכמה" מול שדה חדש, ו-`exposeToApi` פר-מוצר (§4.3/§6) מול הגדרת רקמה (§9.11). §0, §4.3, §5.1, §5.5, §6.2, §9.11, Phase 0 |
| 3 | 🔴 | `Cache-Control: public, s-maxage=60` על כל GET | תשובה עם מפתח יכולה לכלול טיוטות ו-`fields`; `allowedOrigins` משתנה לפי מפתח ⇒ CDN עלול להגיש טיוטה לאנונימי או תשובה של מפתח אחד לאחר | `public` לאנונימי בלבד; `private, no-cache` לכל בקשה עם מפתח; `Vary: Authorization, Origin`; ETag לרשימה מוגדר; מטמון שרת ממופתח לפי מעמד-קורא. §4.5, §5.4, §6.2א, Phase 1, OpenAPI |
| 4 | 🔴 | `resolveRikmaFromPath` מחזיר `301` על איות/slug קודם — גם בנתיבי sales/tasks | `301`/`302` הופכים POST ל-GET (fetch ודפדפנים) והגוף אובד | **אין הפניה על POST.** איות/slug קודם של רקמת המפתח מוגשים כרגיל + `X-1lev1-Rikma-Canonical`. GET נשאר `301`. §5.0, §5.8 צעד 3 ובדיקות, OpenAPI `Rikma` |
| 5 | 🟡 | "מפתח ללא רקמה לא קיים בפועל" (§5.1) | `/api/api-keys` מפיק מפתח בלי `projectId` (`userPr/editBasic.svelte`), ויש מפתחות MCP/OAuth. `sales/+server.ts` כבר דוחה (`'API key is not scoped to a rikma'`) | כלל מפורש: `403 KEY_NOT_RIKMA_SCOPED` בכל `/api/v1/r/{rikma}/…` גם ב-GET; `/api/v1/me` מחזיר `rikma:null`. §4.2, §5.1, §5.6, §9.14 (חדש) |
| 6 | 🟡 | `?locale=` = "לחבר ל-cache התרגום" | CLAUDE.md T3: משטח חדש צריך `SurfaceKey` + שורה ב-`backfillSources.ts` (בדיקה נכשלת בלעדיה), hash זהה בייט-לבייט, ו-`isRealTranslation` (שורת `identity` אינה תרגום). `/gift/[id]` עדיין אינו משטח (`backfillSources.ts:196`) | נוספו כל הדרישות. §4.10, Phase 3 |
| 7 | 🟡 | qids בשם `rikmaApiProducts` וכו'; אין אזכור להרשאה | הקונבנציה מספרית (`282discoverProducts`); כל qid צריך שורה ב-`qidsAccess.js`, ו-`AUTHZ_MODE=enforce` כברירת מחדל חוסם qid בלי שורה | שמות עם קידומת מספרית; שורה ב-`qidsAccess.js` + `check:proxy`. §4.1, Phase 0 |
| 8 | 🟡 | `descriptionHtml` יוצא בלי הגדרה | `desc` הוא rich text ב-JSON; אתרי לקוחות יזריקו אותו כ-HTML ⇒ XSS | serializer שלנו עם whitelist תגיות/מאפיינים + בדיקות payload זדוני; `descriptionText` ברירת המחדל בתיעוד. §5.3, §6.2ב, Phase 0, OpenAPI |
| 9 | ⚪ | (א) §9.4 `POST /api/v1/orders`; (ב) §11.ב `POST /api/v1/sales`; (ג) §5.0 "403 לפני החיפוש" מול §5.8 "404 לרקמה לא קיימת" | סתירות פנימיות | (א)+(ב) ⇒ `/api/v1/r/{rikma}/…`. (ג) הוכרע: **בקשה עם מפתח** — הנתיב מושווה לזהות של רקמת המפתח (id/slug/`formerSlugs`), ואי-התאמה **או** רקמה לא קיימת ⇒ `403 RIKMA_MISMATCH` לפני כל חיפוש (בלי אורקל קיום); **אנונימית** ⇒ `404`. §5.0, §5.6, §5.8, §9.4, §11.ב |

### 12.2 מה **לא** השתנה (אומת מול הקוד ונשאר כמו שהוא)

- שדות העריכה בהסכמה ל-`matanot` (`archive/apply.ts:166`): `name`, `desc`, `quant`, `price`, `startDate`, `finnishDate`.
- `webhooks/dispatch.ts:28` — `WEBHOOK_ACTIONS = {createTask, updateTask}` בלבד.
- `RikmaApiPanel.svelte:30` — `ALL_SCOPES = ['tasks:create','tasks:read','sales:report']`.
- qid `282discoverProducts` — `pagination:{limit:200}`, סינון בדפדפן.
- `/r/[slug]/+page.server.js` — `slugFromPath` (301 על איות), `findBySlug` → `former` (301), 404.
- `sales/+server.ts` — `projectId` נגזר מהמפתח בלבד, ו-403 למפתח בלי רקמה.
- העקרונות: הכתובת היא הרקמה; projector שבונה רשימה מפורשת של שדות (whitelist); אין CRUD; נדידת sales/tasks עם alias ⇒ `410`; §11 מודעות בלבד.

### 12.3 השלכות על האומדנים

- **Phase 0 קטן ב-~1 יום** (אין `exposeToApi`, אין מסך "מה מפורסם") וגדל ב-~1 יום
  (serializer מחוטא + בדיקות מיפוי status). בסך הכול ללא שינוי: 2–3 ימים.
- **המסלול הקצר נשאר בלי שינוי סכמה ב-`1.0b`** — עכשיו זה נכון באמת. `expiresAt`
  ו-test/live עברו ל-Phase 2.
