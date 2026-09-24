# PLAN — עוזר AI מתמשך: ייבוא ספקים, הרשמה דרך סוכן, אונבורדינג וקונסיירז' בשיחה

> נכתב: 2026-09-24 · עודכן באותו יום אחרי החלטות (§0.1) · סטטוס: **תכנית**
> (אין עדיין קוד בצד ה-frontend). הסכמות כבר נוספו ב-`1.0b` על הענף
> `claude/ai-signup-concierge-97frwr` (§8).
> ממשיך ולא מחליף: [PLAN_ONBOARDING](./PLAN_ONBOARDING.md) ·
> [PLAN_PROJECT_PLANNING_BOARDS](./PLAN_PROJECT_PLANNING_BOARDS.md) ·
> [PLAN_CONCIERGE](./PLAN_CONCIERGE.md) (פער 3) · [PLAN_MCP_OAUTH](./PLAN_MCP_OAUTH.md) ·
> [PLAN_MCP_TOOLS_V2](./PLAN_MCP_TOOLS_V2.md) · [PLAN_MATCH_SUGGESTIONS](./PLAN_MATCH_SUGGESTIONS.md) ·
> [PLAN_PROXY_SECURITY](./PLAN_PROXY_SECURITY.md).

---

## 0. בקצרה

ארבעה חסרים, לפי סדר העדיפות:

| # | מה יש היום | מה רוצים |
|---|---|---|
| **1. ייבוא ספקים** (עדיפות עליונה) | `/onboard/business` מנתח אתר/פסקה לשדות הרקמה + לוחות תכנון כהצעות. כל שורה בלוח נפתחת **לבד** בטופס שלה; שורת מוצר פותחת את `newmatana` עם שם/תיאור/מחיר/כמות בלבד. מ-Claude אפשר להכין קישור ליצירת רקמה (`createProjectTool`) ולוח (`createPlanBoardTool`) — אבל רק לרקמה שכבר קיימת, ובלי מוצרים ברצף. | מתוך שיחה עם Claude (או אתר העסק) ← **שרטוט רקמה** (blueprint): הרקמה, **המוצרים** (הכי חשוב), המשימות והמשאבים ← תצוגה מקדימה איך זה ייראה ב-1lev1 ← **מסך אישור אחד** שיוצר הכול ← המוצרים זמינים לקונסיירז'. שלושה מסלולים: בעל עסק, שותפות קיימת (הדגמה), יזם (פירוק רעיון + גיוס שותפים). |
| **2. הרשמה דרך סוכן** | `/hascama` ← `/signup` ← מייל ← `/onboard`. סוכן לא יכול לעזור לפני שיש חשבון. | Claude מציע ← **הקפצה אחת**: ההסכמה ממולאת מראש + סיסמה באותו מסך ← אישור מהמייל ← נוחתים ישר במה שהוכן בשיחה (מסך הייבוא / האונבורדינג / המשאלה). |
| **3. אונבורדינג בשיחה** | ניתוח חד-פעמי ← צ'יפים ← שמירה. | "זה בסדר, את זה לא, תוסיף…" ← רשימה מעודכנת, גם אחרי ימים, מהאתר ומ-Claude. |
| **4. קונסיירז' בשיחה** | חילוץ חי + עריכה ידנית ב-`/concierge/[id]`; ב-MCP `previewWish`/`draftWish` בלבד. | דיוקים בטקסט חופשי ← טיוטה/רשימה מעודכנת. |

**המנגנון המשותף:** "רשימה חיה אחת, שני ערוצים". כל תהליך הוא שורה אחת ב-collection
`assistant-session`; הצ'אט באתר ו-Claude ב-MCP קוראים וכותבים לאותה שורה. ה-AI לא
משכתב את הרשימה אלא מחזיר *פעולות* קטנות שקוד טהור ובדוק מחיל. כש-Claude הוא הסוכן,
**הוא עושה את הפירוק בעצמו** (הוא כבר קרא את האתר ושמע את המשתמש) ושולח מבנה מוכן —
בלי קריאת Gemini שלנו, ובדרך כלל באיכות טובה יותר.

### 0.1 החלטות (2026-09-24)

| נושא | החלטה |
|---|---|
| עריכת **פרופיל** (כישורים, תפקידים, ערכים, דרכי עבודה, משימות שאני יודע, משאבים אישיים) | נשמרת **ישר מהצ'אט** — באתר או דרך Claude. |
| **משאלה בטיוטה** | כמו פרופיל — מאושרת מתוך הצ'אט. |
| כל מה ש**נוגע באנשים אחרים** בקונסיירז' (שורה שספק נענה עליה, פנייה לספק, פרסום) | נשלח ל**מסך אישור באתר**. |
| יצירה/עריכה של **רקמה, משימה, מוצר, משאב** | **מסך אישור ממולא מראש** באתר. מהצ'אט רק מכינים. |
| הצעות ברשימת ה"רקמות-משימות" | גם רקמות **בלי** משימה פתוחה תואמת (לפי ערכים/תחום), עם "הציעו את עצמכם" (§6.2). |
| כניסה אוטומטית מקישור אישור המייל | מאושר — **רק דרך `api.1lev1.com`** (§1.2, §4.5). |

---

## 1. מגבלות תשתית — חובה לכל שורת קוד בתכנית

### 1.1 שני מופעים

| מופע | מה רץ שם | גישה ל-Strapi |
|---|---|---|
| `www.1lev1.com` (Vercel, `ADAPTER=vercel`) | דפים, loaders, form actions | **אין.** כל `fetch('/api/…')` בצד השרת מנותב ע"י `handleFetch` (`src/hooks.server.js`) ל-`SSR_API_BASE` = `https://api.1lev1.com`, עם העוגיות וה-internal secret (`src/lib/server/ssrApiBase.js`). בדפדפן, `src/lib/platform/index.js` מנתב `/api/*` ל-`VITE_API_BASE`. |
| `api.1lev1.com` (VPS, adapter-node) | כל `/api/*`: `/api/action`, `/api/send`, `/api/mcp`, `/api/auth/*`, `/api/analyze-*` | **רק הוא.** Strapi נעול לעולם החיצון. |

### 1.2 הכללים שנגזרים מזה

1. **כל** הלוגיקה החדשה (session, revise, materialize, טוקנים, תצוגה מקדימה,
   `prepareSignup`) יושבת ב-`src/lib/server/**` ונחשפת **רק** דרך נתיבי `/api/*`
   (actions ב-`/api/action` או נתיבים חדשים תחת `/api/assistant/*`) — כך היא רצה
   ב-VPS.
2. `+page.server.*` חדש (`/hascama`, `/onboard/assistant`, `/moach/import/*`,
   `/preview/rikma/*`, `/confirm-email`) קורא **רק** ל-`fetch('/api/…')`. אסור לייבא
   אליו `$lib/server/assistant/*`, `strapiClient`, `STRAPI_URL` או `actionService`.
   (בדיקה: להוסיף את התבנית ל-`npm run check:proxy`.)
3. סודות (מפתח ה-AEAD של טוקן ההרשמה) קיימים **רק** ב-env של ה-VPS. לכן `/hascama`
   לא מפענח טוקן בעצמו — הוא קורא ל-`/api/assistant/signup-token`.
4. כל URL שכלי MCP מחזיר מצביע ל-`www` (הדפים), וכל פעולה שהדף מבצע חוזרת ל-`api`.
5. עוגיות שחוצות בין השניים (`reg_intent`, `reg_next`, ה-JWT) — `domain=.1lev1.com`
   (`signupCookieOptions`, `buildCookieOptions` כבר עושים את זה).

---

## 2. מה כבר קיים ומנוצל

| נכס | מיקום | תפקיד |
|---|---|---|
| יצירת רקמה | action `createWeave` (נקרא מ-`baci.svelte`) | שלב 1 של ה-materialize |
| יצירת מוצר (פשוט או עם מתכון BOM) | action `createComplexMatanot` — `recipeMissions`/`recipeResources`, מיקום, מטבע. פשוט ⇒ `status_of_voting:'active'` מיד; מורכב ברקמה מרובת חברים ⇒ `voting` | יצירת המוצרים — הצבעה נשמרת כשצריך |
| מוצר אישי בלי רקמה | `createPersonalMatanot`, `publishUserResourceAsProduct` | פרילנסר שלא רוצה רקמה |
| משימות / משאבים | `createMission` (4 ענפים, כולל משימה פתוחה ⇒ `matchOpenMissionToUsers` + מיילים), `createMashaabim`, `createMashaabimRequest` | משימות/משאבים מהשרטוט; משימה פתוחה = גיוס שותפים |
| לוחות תכנון + שורות `product` | `project-plan-board`/`-item`, `seedPlan.ts`, `seedPlanBoards`, `resolveRowVocabulary`, `createPlanBoardFromItems` | שורות שלא אושרו נשמרות כהצעות, ולא הולכות לאיבוד |
| ניתוח עסק | `/api/analyze-business` (+ `fetchSiteSummary` מוגן SSRF) | מקור שרטוט כשאין Claude |
| גילוי מוצרים | qid `203findMatanotByText` (הקונסיירז', `enrichWish.ts`), qid 282 (ספריית `/gift`), `setMatanotDiscovery` | היעד של בעל העסק |
| הצעה עצמית למשימה | `nominateSelfMission` ([PLAN_SELF_NOMINATION](./PLAN_SELF_NOMINATION.md)) | "הציעו את עצמכם" לרקמה בלי משימה פתוחה |
| הסכמה + הרשמה + אישור מייל | `amana.svelte`, `/api/chezin`, `/signup`, `/confirm-email`, `regIntent.js` | ההקפצה האחת |
| MCP + OAuth | `/api/mcp`, `toolManifest.ts`, `guard.ts`, `/oauth/*`, `/mcp-connect` | הכלים החדשים |
| ניתוח CV/טקסט + התאמה לאוצר המילים | `analyze-cv.ts` (`match-to-existing`), `/api/onboard/save`, `matching/engine.ts` | אונבורדינג בשיחה |
| חילוץ/עדכון משאלה | `extractWish`, `updateRatsonDraft`, `updateRatsonExtraction`, `refreshWishMatches`, `ensureRatsonProposalForum` | קונסיירז' בשיחה |

---

## 3. העיקרון: session, פעולות, גרסה

### 3.1 ה-state

```ts
type ItemStatus = 'proposed' | 'kept' | 'dropped' | 'applied';

type Item = {
  key: string;             // יציב לכל אורך ה-session ('p3'); ה-AI ו-Claude מפנים רק אליו
  group:
    | 'skills' | 'roles' | 'methods' | 'vallues' | 'missions' | 'resources'   // profile
    | 'products' | 'rikmaMissions' | 'rikmaResources' | 'partners'           // rikma
    | 'wishMissions' | 'wishResources';                                       // wish
  label: string;
  existingId?: string;     // אחרי התאמה לאוצר המילים / לטמפלט / למוצר קיים
  status: ItemStatus;
  origin: 'extract' | 'agent' | 'revision' | 'manual' | 'profile' | 'project';
  why?: string;            // "באתר מופיע 'סדנת אפייה — 180 ₪'"
  spec?: Record<string, unknown>;   // מחיר, kindOf, שעות, כישורים, holder, מתכון… (§5.2)
  committed?: { proposalId?: string; bomRowId?: string };  // wish: ספק כבר נענה
  createdRef?: { type: string; id: string };               // rikma: נוצר ב-materialize
};

type SessionState = {
  items: Item[];
  fields?: Record<string, unknown>;  // rikma: פרטי הרקמה · wish: כותרת, תאריכים, תקציב, מקום
  questions?: string[];
};
```

### 3.2 פעולות

```ts
type Op =
  | { op: 'keep' | 'drop' | 'restore'; key: string }
  | { op: 'add'; group: Item['group']; label: string; why?: string; spec?: Record<string, unknown> }
  | { op: 'rename'; key: string; label: string }
  | { op: 'setSpec'; key: string; spec: Record<string, unknown> }       // merge
  | { op: 'link'; productKey: string; missionKeys?: string[]; resourceKeys?: string[] }  // מתכון
  | { op: 'setField'; field: string; value: unknown };
```

- `applyOps` — טהור, ב-`src/lib/assistant/applyOps.ts`, עם בדיקות רגילות ו-fast-check
  (אין key כפול; `restore∘drop = id`; key לא קיים ⇒ נדחה ומוחזר ב-`rejected`, לא מומצא;
  `link` רק בין keys קיימים מהקבוצות הנכונות).
- `add` עובר התאמה לאוצר המילים (`match-to-existing` / `resolveRowVocabulary`) — לא
  נוצרת כפילות.
- ה-AI מחזיר `{ ops, say, questions }`; מה שמוצג תמיד מחושב מה-ops שהוחלו בפועל.

### 3.3 גרסה והיסטוריה

- `version` עולה בכל כתיבה; כל כתיבה מקבלת `expectedVersion`. אי-התאמה ⇒ מוחזר
  ה-state העדכני + `conflict:true` ("בינתיים עדכנת מהאתר — הנה הרשימה").
- `revisions` (30 אחרונות) = תמליל השיחה: `{ v, at, via:'site'|'agent', instruction, say, ops }`.
  אין צורך ב-thread של Mastra Memory: ההיסטוריה הרלוונטית היא ההחלטות, והיא צריכה
  להיות גלויה בשני הערוצים. "בטל אחרון" = היפוך ה-ops של הרוויזיה האחרונה.

### 3.4 "אין לא מוחלט"

- ברשימה **שלי** `dropped` = "לא עכשיו" — הפיך, ובממשק לא כתוב "דחייה".
- "לא רלוונטי" על הצעת התאמה = `dismissSuggestion` הקיים — סינון, לא תשובה לאף אחד.
- שורת משאלה שספק נענה עליה לא נמחקת מהצ'אט (§7.3).

---

## 4. ייבוא ספקים — רקמה, מוצרים, משימות, משאבים (עדיפות עליונה)

### 4.1 שלושה מסלולים, שרטוט אחד (`kind:'rikma'`)

| מסלול (`fields.track`) | מי | קלט | מה חשוב לו | הסוף |
|---|---|---|---|---|
| `business` | בעל עסק / נותן שירות | כתובת אתר, או מה שסיפר ל-Claude | **שהמוצרים שלו יימצאו** ע"י הקונסיירז' | רקמה (לרוב חבר יחיד) + מוצרים פעילים + מיקום |
| `partnership` | שותפות קיימת | מי השותפים, מה כל אחד מביא, מה מוכרים | **לראות** איך השותפות תיראה ב-1lev1 לפני שמחליטים | קישור תצוגה מקדימה לשותפים ← יצירה + הזמנת השותפים |
| `idea` | יזם | הרעיון במילים שלו | פירוק למשימות, משאבים ומוצרים, ו**גיוס שותפים** | רקמה + משימות ומשאבים **פתוחים** ⇒ מנוע ההתאמה שולח מיילים למתאימים |

אותו מבנה משמש גם להוספה ל**רקמה קיימת** (`assistant-session.project` מוגדר):
"תוסיף לרקמה שלי את שלוש הסדנאות כמוצרים".

### 4.2 מבנה השרטוט

`fields` = פרטי הרקמה: `{ track, name, publicDescription, descripFor, linkToWebsite,
vals[], location{lat,lng,radius,isOnline,hint}, currency, restime }` — בדיוק
הפרמטרים של `createWeave` (+ מיקום).

`items`:

| group | `spec` | נוצר ב-materialize ע"י |
|---|---|---|
| `products` | `desc, pricingMode ('fixed'\|'estimate'), price, currency, kindOf, quant, unlimited, isOnline, location, keywords[]` + מתכון דרך `link` | `createComplexMatanot` (+ `discoveryKeywords`) |
| `rikmaMissions` | `descrip, skills[], roles[], hours, ratePerHour, recurring, holder: 'me' \| 'partner:<key>' \| 'open'` | `createMission` — `open` ⇒ משימה פתוחה (גיוס) |
| `rikmaResources` | `descrip, kindOf, price, quantity, holder` | `createMashaabim` / `createMashaabimRequest` |
| `partners` | `name, email?, brings: key[]` | הזמנה לרקמה (שם + מייל), השותף חותם בעצמו |

**מוצרים קודם.** הפרומפט (שלנו) וההנחיה ל-Claude (ב-`MCP_INSTRUCTIONS` ובתיאור הכלי)
אומרים במפורש: כל הצעה נפרדת שהעסק מוכר = מוצר, עם מחיר אם הוא מופיע; משימות ומשאבים
רק כשהם מרכיבים של מוצר (מתכון) או כשצריך מישהו שעוד אין.

### 4.3 מאיפה בא הפירוק

1. **Claude בעצמו — הדרך המועדפת.** Claude קורא את אתר העסק (web fetch שלו) או מסכם
   את השיחה, וקורא ל-`proposeRikmaBlueprint` עם המבנה המלא. השרת: מאמת (zod), מתרגם
   כישורים/תפקידים/ערכים למזהים (`resolveRowVocabulary`), מזהה מוצרים שכבר קיימים
   ברקמות של המשתמש (לא ליצור פעמיים), ושומר. **אין עלות מודל אצלנו.**
2. **המודל שלנו** — באתר (`/onboard/business`) או לסוכן שמעדיף: `/api/analyze-business`
   מורחב להחזיר שרטוט. היום הוא מחזיר שדות רקמה + לוחות `seedPlan` (שכבר כוללים שורות
   `product`); ממירים את הלוחות לשרטוט ומשפרים את הפרומפט: מוצרים עם מחיר/`kindOf`/
   `keywords` כשדות מלאים, לא שורה עם שם.
3. **רקמה קיימת** — `startAssistant({ kind:'rikma', projectId })` זורע מפרטי הרקמה
   (כולל המוצרים שכבר יש, `origin:'project'`, `status:'applied'`), ואז מוסיפים.

### 4.4 תצוגה מקדימה — "ככה תיראה השותפות שלכם" (הדגמה)

- נתיב `www`: `/preview/rikma/[shareKey]`. ה-loader קורא ל-`/api/assistant/preview?k=`
  (ב-VPS) שמחזיר הקרנה **קריאה בלבד** של השרטוט.
- הרינדור משתמש באותם רכיבים של דף הרקמה הציבורי: מוציאים מ-
  `src/routes/(regandnon)/project/[id]/+page.svelte` רכיב `RikmaPublicView` שמקבל
  props פשוטים, ו-`blueprintToRikmaView()` ממפה אליו את השרטוט — כך ההדגמה נראית
  **בדיוק** כמו הרקמה האמיתית. מעל: פס "תצוגה מקדימה — עוד לא נוצר כלום".
- מוצג: המוצרים (כרטיסים כמו ב-`/gift`), המשימות הפתוחות, המשאבים, השותפים ומה כל
  אחד מביא, ודוגמת חלוקה (אותן פונקציות טהורות של
  [PLAN_MISSION_EQUITY_PREVIEW](./PLAN_MISSION_EQUITY_PREVIEW.md), לא חישוב חדש).
- `shareKey` אקראי (שדה private), `shareExpiresAt` = 30 יום, `noindex`, סיבוב המפתח
  מבטל את הקישור. מי שמקבל את הקישור רואה, לא עורך.
- כפתור בתחתית: "ככה? ליצירה" ← מסך האישור (§4.5), או ← הרשמה (§5) למי שאין חשבון.

### 4.5 מסך אישור אחד (ההחלטה: רקמה/משימה/מוצר ⇒ מסך ממולא מראש)

- נתיבים: `/moach/import/[sessionId]` (רקמה חדשה), `/moach/[projectId]/import/[sessionId]`
  (רקמה קיימת).
- הכול בדף אחד, בקבוצות, **מוצרים ראשונים**. כל שורה ממולאת ועריכה inline (שם, מחיר,
  תיאור, `kindOf`); תיבת סימון לכל שורה. כפתור אחד: "ליצור".
- השרת (`materializeRikmaBlueprint`, ב-VPS) מריץ **את אותן actions** שהטפסים מריצים —
  כך כל ענף הסכמה נשמר (ברקמה מרובת חברים מוצר מורכב/משימה עוברים להצבעה כרגיל):
  1. `createWeave` (אם חדשה);
  2. כל מוצר מסומן ← `createComplexMatanot` (+ `discoveryKeywords`, מיקום);
  3. משימות ← `createMission` (`holder:'me'` משויכת אליי, `open` ⇒ פתוחה);
  4. משאבים ← `createMashaabim` / `createMashaabimRequest`;
  5. שותפים ← הזמנות;
  6. שורות **לא** מסומנות ← `seedPlanBoards` כהצעות, כדי שלא יאבדו.
- **אידמפוטנטי:** כל שורה שנוצרה מקבלת `createdRef` ב-state. כשל באמצע ⇒ ריצה חוזרת
  ממשיכה מהשורה הבאה, לא יוצרת כפילויות.
- **אותו מנגנון ללוחות הקיימים:** ב-`PlanBoard.svelte` כפתור "ליצור את כל המסומנים"
  שמריץ את שלבים 2–4 על שורות הלוח. זה החסר שתיארת — היום שורת `product` כבר נפתחת
  ב-`newmatana` ממולא, אבל **אחת-אחת**, ורק עם שם/תיאור/מחיר/כמות (בלי מתכון, מיקום,
  מטבע או מילות חיפוש).

### 4.6 גילוי ע"י הקונסיירז' — מה חייב להשתנות כדי שבעל העסק באמת יימצא

היום מוצר עולה בהעשרה של משאלה רק דרך qid 203: `name containsi <מונח>` על **מונח
אחד** מהמשימות/המשאבים שחולצו מהמשאלה. "קייטרינג לאירוע" לא ימצא מוצר בשם "מגש
ארוחת בוקר זוגית". לכן:

1. **שדה חדש `matanot.discoveryKeywords`** (text, נוסף ב-`1.0b`): מילים נרדפות
   ותחומי הצורך שהמוצר עונה עליו, בעברית ובאנגלית. נכתב ב-materialize מתוך
   `spec.keywords`, וניתן לעריכה במסך האישור.
2. qid 203: `or: [{ name: { containsi } }, { discoveryKeywords: { containsi } }]`.
3. qid 203 **לא מסנן `hideFromDiscovery`** — מוצר שהמוכר הסתיר מהספרייה עדיין מוצע
   ע"י הקונסיירז'. להוסיף את הסינון (null = false, כמו ב-282).
4. מיקום מהאתר/השיחה ⇒ `location` על המוצר, כדי שההתאמה המקומית
   ([PLAN_CONCIERGE_LOCAL_PROVIDERS](./PLAN_CONCIERGE_LOCAL_PROVIDERS.md)) תעבוד.
5. **ספק חדש ⇒ משאלות פתוחות:** אחרי materialize, `refreshWishMatches` על משאלות
   פתוחות שהמונחים שלהן פוגשים את מילות החיפוש של המוצרים החדשים — בעל המשאלה מקבל
   "נמצא ספק חדש", ובעל העסק רואה ערך תוך דקות (M10 ב-PLAN_ONBOARDING).
6. בעתיד: embedding (Pinecone) למוצרים, כמו שכבר יש ל-missions ו-providers.

### 4.7 גיוס שותפים (מסלול `idea`)

- משימות ומשאבים `holder:'open'` נוצרים פתוחים ⇒ `matchOpenMissionToUsers` /
  `matchOpenMashaabimToUsers` כבר שולחים מיילים למתאימים ומציגים בלב.
- ערכת שיתוף: קישור התצוגה המקדימה + דף הרקמה הציבורי + טקסט מוכן לוואטסאפ/לינקדאין
  (Claude כותב אותו בשיחה; באתר — תבנית ב-i18n).
- צורך בכסף ⇒ משאב מסוג כסף פתוח, או `publishStipendFundingRequest` כשזה מימון מחיה.

### 4.8 איך זה נראה מ-Claude — בעל עסק, מקצה לקצה

```
משתמש: "תוסיף את העסק שלי ל-1lev1 כדי שיזמינו ממני — www.my-cafe.co.il"
Claude: [קורא את האתר] → proposeRikmaBlueprint({ track:'business', fields:{…},
          items:[ 3 מוצרים עם מחירים ומילות חיפוש, משאב 'מטבח' holder:'me' ] })
        ← { previewUrl, reviewUrl, items }
Claude: מציג בשיחה את הרשימה. "סדנת האפייה היא 180 ₪ לאדם?"
משתמש: "כן, ותוריד את הקייטרינג, אנחנו כבר לא עושים"
Claude → setAssistantItems([{op:'setSpec', key:'p2', spec:{price:180, kindOf:'perUnit'}},
                            {op:'drop', key:'p3'}])
Claude: "מוכן. לחיצה אחת כאן ויוצרים: <reviewUrl>"
משתמש: לוחץ "ליצור" במסך האישור → 2 מוצרים פעילים, זמינים לקונסיירז' ול-/gift
```

משתמש בלי חשבון: אותו דבר, רק ש-`prepareSignup` מקבל גם את השרטוט (§5.1), ואחרי
אישור המייל הנחיתה היא **מסך האישור עצמו**. כלומר: הקפצה אחת (הסכמה+סיסמה) ← קליק
במייל ← קליק "ליצור".

---

## 5. הרשמה דרך סוכן

### 5.1 מסלול 1: סוכן לא מחובר (Claude Code / Desktop / לקוח MCP בלי מפתח)

מוסיפים למצב הציבורי של `/api/mcp` כלי אחד: **`prepareSignup`**.

```
Claude → prepareSignup({ name, email, countries, lang,
                         intent: 'join' | 'business' | 'partnership' | 'idea' | 'order',
                         aboutText?, wishText?, blueprint? })
   שרת (VPS): assistant-session status='pending', startedVia='agent',
              kind לפי intent, sourceText / state מהשרטוט, claimEmail, claimExpiresAt=+14d
   ← { signupUrl: https://www.1lev1.com/hascama?agent=<טוקן>,
       previewUrl?: /preview/rikma/<shareKey>   (כשהגיע שרטוט) }
Claude: "ככה זה ייראה: <previewUrl>. כדי ליצור — חתמו ובחרו סיסמה: <signupUrl>"
   ▼
/hascama?agent=…  — מסך אחד (§5.3)
   ▼
מייל ← /confirm-email (כניסה אוטומטית, §5.5) ← claim ← נחיתה לפי intent:
   join ⇒ /onboard/assistant · business/partnership/idea ⇒ /moach/import/<sid>
   order ⇒ /concierge/<draftId>
   ▼
כרטיס "חברו את העוזר שלכם": claude.ai ⇒ Connect (OAuth, כבר מחוברים — קליק אחד)
                            Claude Code ⇒ npx 1lev1-mcp
```

### 5.2 מסלול 2: claude.ai עם OAuth

כש-`MCP_OAUTH_ENABLED=true` לקוח לא מחובר מקבל 401 כבר ב-connect, ואין שלב שבו
Claude יכול לקרוא ל-`prepareSignup`. **חלון ה-OAuth הוא ההקפצה האחת**:

1. בדף `/login` (אליו `/oauth/authorize` מפנה אורח) — "אין לכם חשבון? הרשמה", שנושא
   את ה-`redirect`.
2. `/hascama` שומר את היעד בעוגייה `reg_next` (כמו `reg_intent`), רק יעד שעובר
   `safeRedirectTarget`.
3. `/confirm-email` ממשיך ל-`reg_next`. בקשת ה-OAuth חתומה ל-15 דק' (`authreq.ts`);
   אם פגה — "חזרו ל-Claude ולחצו Connect — אתם כבר מחוברים". לא מאריכים את ה-TTL.
4. אחרי ה-connect Claude ממשיך כרגיל (`proposeRikmaBlueprint` / `startAssistant`).

### 5.3 המסך האחד — `/hascama?agent=`

- ה-load (www) קורא ל-`/api/assistant/signup-token?t=` (VPS, שם המפתח) ומקבל `prefill`.
  טוקן פג/פגום ⇒ ההסכמה הרגילה (אף פעם לא מסך שגיאה).
- `amana.svelte` מקבל prop `prefill`: שדות ממולאים וניתנים לעריכה, ופס "הפרטים מולאו
  ע"י העוזר שלכם — בדקו אותם". אחרי חתימה — **אותו כרטיס** עובר לשלב הסיסמה (במקום
  `goto('/signup')`) ושולח לאותו action של `/signup`, עם הטוקן בשדה נסתר.
- chezin קיים למייל הזה ⇒ "כבר חתמתם — התחברו", והסוכן ממשיך אחרי connect.

### 5.4 claim

- לפי ה-**chezin** שנוצר דרך אותו טוקן (`session.chezin = user.chezin`), לא לפי מייל
  בלבד — טקסט ששתל מישהו אחר עם המייל שלכם לא נקשר אליכם.
- action `claimAssistantSession` (VPS), נקרא מה-load של דף הנחיתה ב-`fetch('/api/action')`
  ⇒ עובד גם ממכשיר אחר. רק ב-claim רץ חילוץ AI (אם צריך) — עלות רק למי שנרשם.
- pending שלא נתבע עד `claimExpiresAt` נמחק ב-cron.

### 5.5 כניסה אוטומטית מקישור האישור (מאושר)

המסלול, כולו דרך `api.1lev1.com`:

```
דפדפן → POST www/confirm-email?/continue   (כפתור "המשך" — לא GET: סורקי מייל
                                            עושים GET ושורפים את הטוקן החד-פעמי)
www action → fetch('/api/auth/email-confirmation-login')   ← handleFetch מנתב ל-api
api: /api/auth/[...path] (ALLOWED, setsSession:true) → Strapi (localhost בלבד)
      POST /api/auth/email-confirmation-login  — route מותאם ב-1.0b:
      מאשר, ומחזיר { jwt, user } (plugin.services.jwt.issue)
api → www: ה-jwt בגוף התשובה, כי הקורא פנימי (בדיוק כמו register ב-/signup)
www action: עוגיית httpOnly על .1lev1.com → redirect ליעד
```

Strapi נשאר נעול; ה-route החדש נגיש רק מה-proxy. ה-JWT לא מגיע לדפדפן אלא כעוגייה.

### 5.6 מה הסוכן **לא** עושה

לא נוגע בסיסמה, לא חותם, לא מאשר מייל, לא יוצר רקמה/מוצר/משימה (רק מכין). הטוקן:
AES-256-GCM (מנגנון `codes.ts`, מפתח נגזר עם תווית אחרת), 24 שעות, נושא רק
`{ sid, name, email, countryIds, intent, lang, exp }`. `prepareSignup` ציבורי ⇒
rate-limit לפי IP ומכסה יומית, בלי קריאת AI, שרטוט ≤ 60 שורות.

---

## 6. אונבורדינג בשיחה (`kind:'profile'`)

### 6.1 מחזור החיים

1. **start** — מהאתר (`/onboard/provider/describe`, `/cv` יוצרים session במקום `cvDraft`),
   מ-MCP (`startAssistant`), מ-claim, או מ-`/me` ("לדייק את הפרופיל בשיחה") — אז
   ה-session נזרע מהפרופיל הקיים (`origin:'profile'`, `status:'applied'`).
2. **revise / set** — טקסט ← ops (AI), או לחיצה / Claude ← ops (בלי AI).
3. **apply — ישר מהצ'אט** (החלטה): `kept`+`proposed` שסומנו ← connect; `dropped` שהיו
   `applied` ← disconnect (`updateUserRelation`); משאבים ← `sp`. אחר כך
   `matchUserToOpenEntities(userId,'profileUpdated')`. ה-session נשאר `active`.

### 6.2 הצעות "רקמות-משימות" (החלטה ב')

שתי שכבות, מוצגות כקבוצה נפרדת ולא נשמרות ב-state:

| שכבה | מקור | פעולה |
|---|---|---|
| משימות ומשאבים פתוחים שמתאימים | `match-suggestion` (qid 209) | "לא רלוונטי" ← `dismissSuggestion`; "להציע" ← הדף |
| **רקמות קרובות** — אין משימה פתוחה תואמת | חדש: רקמות פעילות לפי חפיפת ערכים (`vallues`), כישורים של חברים ומשימות שבוצעו, ותחום | "להציע את עצמי" ← `nominateSelfMission` (נוחת על הרקמה ⇒ מסך אישור באתר, והרקמה מחליטה) |

השכבה השנייה מחושבת בשרת (`src/lib/server/matching/nearbyRikmas.ts`, טהור + בדיקות),
מוגבלת ל-5, ולכל שורה `why` ("3 ערכים משותפים; שני חברים עם UX").

---

## 7. קונסיירז' בשיחה (`kind:'wish'`)

### 7.1 ה-state

`fields` = `{ title, dateFrom, dateTo, budget, currency, place, online, groupKind }`;
`items` = `wishMissions` + `wishResources` (`importance`, `hoursEst`) — שיקוף של
`extracted_missions` / `extracted_resources`.

### 7.2 מתי זה נכתב (לפי ההחלטות)

| מצב | מהצ'אט | במסך אישור באתר |
|---|---|---|
| **טיוטה** | כמו פרופיל: כל revise נכתב ישר (`updateRatsonDraft` בלי `publish`) | פרסום לקהילה |
| **פורסמה** | שינוי תוכן **שלי** (שורה בלי ספק): `updateRatsonExtraction` + `refreshWishMatches` | — |
| **נוגע בספק** (שורה עם `committed`, פנייה לספק, שינוי תנאים לספק שענה) | לא מבוצע — מוחזר קישור | `ensureRatsonProposalForum` / `requestWishMission` / `acceptRatsonProposal` בדפים הקיימים |

"על הצילום כבר ענה יוסי — לפתוח איתו שיחה?" ← כפתור למסך. אותו עיקרון של
`archiveObject`: מה שנכנס בהסכמה יוצא בהסכמה.

### 7.3 איפה

- **אתר:** פאנל "לדייק עם לב" ב-`/concierge/[id]` (סוגר את פער 3 ב-PLAN_CONCIERGE).
- **MCP:** `startAssistant({ kind:'wish', text })` או `({ kind:'wish', ratsonId })`;
  `previewWish`/`draftWish` נשארים לתאימות.

---

## 8. Strapi (`1.0b`, ענף `claude/ai-signup-concierge-97frwr`)

### 8.1 `api::assistant-session.assistant-session` (חדש)

| שדה | סוג | הערה |
|---|---|---|
| `user` | manyToOne → user (`assistant_sessions`) | ריק כל עוד `pending` |
| `kind` | enum `profile \| rikma \| wish` | |
| `status` | enum `pending \| active \| applied \| closed` | ברירת מחדל `active` |
| `ratson` | manyToOne → ratson (`assistant_sessions`) | `wish` |
| `project` | manyToOne → project (`assistant_sessions`) | `rikma` על רקמה קיימת / אחרי יצירה |
| `chezin` | manyToOne → chezin (`assistant_sessions`) | ה-claim (§5.4) |
| `startedVia` | enum `site \| agent` | |
| `sourceText` | text | |
| `lang` | string(3) | |
| `state` | json | §3.1 |
| `revisions` | json | §3.3 |
| `version` | integer | §3.3 |
| `claimEmail` | email, **private** | |
| `claimExpiresAt` | datetime | |
| `shareKey` | string, **private** | תצוגה מקדימה (§4.4) |
| `shareExpiresAt` | datetime | |
| `appliedAt` | datetime | |

### 8.2 שדה חדש: `matanot.discoveryKeywords` (text) — §4.6.

### 8.3 הרשאות — בכוונה בלי לסמן Authenticated

כל הגישה ל-`assistant-session` ב-service token מתוך actions שבודקים בעלות — שורות
`pending` לא שייכות עדיין לאף אחד ו-`sourceText` אישי. `discoveryKeywords` הוא שדה
בקולקציה קיימת ולא דורש שינוי הרשאות. אחרי ה-deploy: `npm run types:update` ב-`1.0`.

### 8.4 route מותאם (M7): `POST /api/auth/email-confirmation-login` —
`src/extensions/users-permissions/strapi-server.js` (§5.5). עוד לא נכתב.

---

## 9. Server (`1.0`) — הכול ב-VPS

### 9.1 מודולים

| קובץ | מה |
|---|---|
| `src/lib/assistant/{types,applyOps}.ts` (+ בדיקות) | טהור: טיפוסים, zod, `applyOps`, `invertOps`, `diffForDisplay` |
| `src/lib/assistant/blueprint.ts` (+ בדיקות) | טהור: סכימת השרטוט, `blueprintToRikmaView`, `validateRecipeLinks` |
| `src/lib/server/assistant/session.ts` | load/save עם `expectedVersion`, claim, trim ל-30 |
| `src/lib/server/assistant/seed.ts` | חילוץ ראשוני: analyze-cv / analyze-business (שרטוט) / extractWish; זריעה מפרופיל / רקמה / רטסון |
| `src/lib/server/assistant/revise.ts` | Gemini (fallback Groq): state דחוס + 6 רוויזיות + הוראה ← `{ops,say,questions}` |
| `src/lib/server/assistant/materialize.ts` | §4.5 — מריץ actions קיימים, אידמפוטנטי |
| `src/lib/server/assistant/prepareSignup.ts` + `signupToken.ts` | §5.1, §5.6 |
| `src/lib/server/onboard/applyProfileSelection.ts` | הלוגיקה של `/api/onboard/save` מוצאת לכאן; הנתיב הישן קורא לה |
| `src/lib/server/matching/nearbyRikmas.ts` | §6.2 |

### 9.2 Actions

| action | authRules | הערה |
|---|---|---|
| `startAssistantSession` | `jwt` | `{ kind, text?, url?, projectId?, ratsonId?, fromProfile? }` |
| `proposeRikmaBlueprint` | `jwt` (+ `projectMember` כשיש `projectId`) | שרטוט מוכן מסוכן, בלי AI |
| `reviseAssistantSession` | `jwt` + בעלות | AI |
| `setAssistantItems` | `jwt` + בעלות | בלי AI |
| `undoAssistantRevision` | `jwt` + בעלות | |
| `applyAssistantSession` | `jwt` + בעלות | profile / wish טיוטה / שינוי שלי במשאלה. **לא** rikma |
| `materializeRikmaBlueprint` | `jwt` + בעלות (+ `projectMember`) | רק ממסך האישור |
| `shareRikmaPreview` | `jwt` + בעלות | יוצר/מסובב `shareKey` |
| `claimAssistantSession` | `jwt` | |

`prepareSignup` ו-`/api/assistant/preview` אינם actions (ה-authz דוחה `anonymous` בכל
action, ובצדק): הם נתיבי `/api/assistant/*` ציבוריים, עם rate-limit, שכותבים דרך
`sendToSer` — אותו דפוס של `/api/chezin`.

### 9.3 QIDs (service בלבד, `qidsAccess.js`)

`363createAssistantSession` · `364getAssistantSession` · `365updateAssistantSession` ·
`366findMyAssistantSessions` · `367findPendingAssistantByChezin` ·
`368getAssistantByShareKey` · `369deleteExpiredAssistantSessions` · עדכון
`203findMatanotByText` (§4.6). אחר כך `npm run validate:qids`.

---

## 10. כלי MCP (מאחורי `ASSISTANT_MCP_ENABLED`)

| כלי | tier | ai | מה |
|---|---|---|---|
| `prepareSignup` | ציבורי (לא-מאומת בלבד) | לא | §5.1 ← `signupUrl` (+ `previewUrl`) |
| `proposeRikmaBlueprint` | `prepare` | לא | **הכלי המרכזי לייבוא ספקים.** Claude שולח שרטוט מלא ← `{ sessionId, items, previewUrl, reviewUrl }` |
| `startAssistant` | `selfWrite` | כן | כשהסוכן מעדיף שנפרק אנחנו (`profile`/`rikma` מ-`url`/`text`/`wish`) |
| `getAssistant` | `read` | לא | ה-session הפעיל לפי `kind`: רשימה, שאלות, 5 רוויזיות, והצעות (§6.2) |
| `setAssistantItems` | `selfWrite` | לא | ops ישירות — הדרך המועדפת ל-Claude |
| `reviseAssistant` | `selfWrite` | כן | הוראה חופשית ← ops |
| `applyAssistant` | `selfWrite` | לא | profile, משאלה בטיוטה ושינוי שלי במשאלה ⇒ מבוצע. rikma או משהו שנוגע בספק ⇒ **מוחזר `reviewUrl`**, לא מבוצע |
| `shareRikmaPreview` | `prepare` | לא | קישור ההדגמה לשיתוף עם שותפים |
| `dismissOffer` | `selfWrite` | לא | `dismissSuggestion` |

- `MCP_INSTRUCTIONS` מקבל סעיף: "משתמש שרוצה להוסיף עסק / להראות לשותפים / לפרק רעיון —
  קרא את האתר או סכם את השיחה, בנה שרטוט עם **מוצרים קודם**, `proposeRikmaBlueprint`,
  הצג, דייק ב-`setAssistantItems`, ותן את `reviewUrl`. משתמש לא רשום — `prepareSignup`".
  סעיף 3 הקיים ("A new wish is opened by the person at /concierge/new") מתעדכן.
- כתיבות `selfWrite` נוגעות רק ברשימה/פרופיל/טיוטה של המשתמש עצמו. כל מה שנוחת על רקמה
  או על אדם אחר — `reviewUrl` בלבד.

---

## 11. UI

- **`src/lib/components/assistant/AssistantPanel.svelte`** — לכל ה-kinds: הרשימה בקבוצות
  (צ'יפים הוצע / ✓ / "לא עכשיו", הדגשת מה שהשתנה), טקסט + מיקרופון
  (`/api/concierge-transcribe`), היסטוריה, "בטל אחרון", apply (רק היכן שמותר, §0.1).
  תג "עודכן דרך Claude" על `via:'agent'`. סנכרון ב-focus לפי `version`.
- **`BlueprintReview.svelte`** — מסך האישור (§4.5); משמש גם את "ליצור את כל המסומנים"
  ב-`PlanBoard.svelte`.
- **`RikmaPublicView.svelte`** — מוצא מדף הרקמה הציבורי; מוזן מ-Strapi או משרטוט (§4.4).
- **נתיבים חדשים (www, loaders קוראים רק ל-`/api`):** `/onboard/assistant`,
  `/moach/import/[sessionId]`, `/moach/[projectId]/import/[sessionId]`,
  `/preview/rikma/[shareKey]`.
- **נתיבים שמשתנים:** `/hascama` (agent), `/signup`, `/login` (קישור הרשמה),
  `/confirm-email` (כפתור "המשך" + `reg_next`), `/onboard/business*` (שרטוט במקום
  `seedPlanHandoff` בלבד), `/onboard/provider/review` + `/me` (פאנל), `/concierge/[id]` (פאנל).
- **i18n:** namespaces `assistant`, `rikmaImport` (he/en/ar/ru/es) + `home.amana.agent`,
  `signup.agent`. הקבוצה היא "רקמה"/`rikma` בכל השפות. אחרי ההוספה: `npm run check:i18n`,
  `npm run check:script`.

---

## 12. אבני דרך (מסודרות לפי "להוסיף ספקים" קודם)

| # | מה | תוצר |
|---|---|---|
| **M0** | Deploy של הסכמות (`1.0b`) + `types:update` + QIDs 363–369 | בסיס |
| **M1** | `applyOps`, `blueprint.ts`, `session.ts` + בדיקות | ליבה בדוקה |
| **M2** | `proposeRikmaBlueprint` (action) + `analyze-business` ⇒ שרטוט עם מוצרים מלאים | שרטוט מ-Claude ומהאתר |
| **M3** | `materialize.ts` + `BlueprintReview` + `/moach/import/*` + "ליצור את כל המסומנים" בלוחות | **יצירה בקליק אחד** |
| **M4** | `discoveryKeywords` נכתב + qid 203 (מילות חיפוש + `hideFromDiscovery`) + מיקום | **בעל העסק באמת נמצא** |
| **M5** | כלי MCP לרקמה: `proposeRikmaBlueprint`, `getAssistant`, `setAssistantItems`, `applyAssistant`⇒`reviewUrl` + `MCP_INSTRUCTIONS` | **בעל עסק מ-Claude** |
| **M6** | תצוגה מקדימה: `RikmaPublicView`, `/preview/rikma/*`, `shareRikmaPreview` | **הדגמה לשותפויות** |
| **M7** | `prepareSignup` + טוקן + `/hascama` agent + סיסמה באותו מסך + claim + נחיתה למסך הייבוא | ספק חדש בלי חשבון |
| **M8** | `email-confirmation-login` (`1.0b` + proxy + כפתור "המשך") | בלי הקלדת סיסמה שנייה |
| **M9** | ספק חדש ⇒ `refreshWishMatches` למשאלות פתוחות | ערך מיידי לשני הצדדים |
| **M10** | אונבורדינג בשיחה: `revise`, `apply`, פאנל, הצעות + רקמות קרובות | חסר 3 |
| **M11** | קונסיירז' בשיחה | חסר 4 |
| **M12** | הרשמה מתוך חלון ה-OAuth (`/login` ← `reg_next`) | claude.ai לחדשים |
| **M13** | cron ניקוי, מכסות, אנליטיקס (`startedVia`, מסלול, זמן עד מוצר ראשון) | תפעול |

המסלול הקריטי לספקים: M0 → M1 → M2 → M3 → M4 → M5. אחרי M5 בעל עסק רשום יכול להיכנס
לגילוי מתוך שיחה עם Claude + קליק אחד. M6–M9 מרחיבים לשותפויות, לחדשים ולערך המיידי.

---

## 13. סיכונים ושאלות פתוחות

1. **הזיות בפירוק אתר** — מחיר שלא מופיע באתר, מוצר שכבר לא נמכר. מקל: כל שורה נושאת
   `why` (מאיפה זה נלקח), מחיר בלי מקור מסומן "להשלמה", ומסך האישור הוא חובה.
2. **כפילויות** — ייבוא חוזר של אותו אתר: זיהוי מוצרים קיימים ברקמות המשתמש (§4.3),
   ו-`createdRef` מונע יצירה כפולה בריצה חוזרת.
3. **זיהום אוצר המילים** — `add` וכישורי השרטוט עוברים התאמה; חדש נוצר רק ב-materialize.
4. **הזרקת הוראות** — טקסט אתר ושיחה נכנסים למודל כנתונים מתוחמים; ops מאומתים בסכימה.
5. **ספאם של תצוגות מקדימות אנונימיות** — rate-limit, `noindex`, TTL, בלי AI, ≤ 60 שורות.
6. **עלות AI** — Claude מפרק בעצמו; המודל שלנו רק באתר ולמי שבחר בו.
7. **שאלות להחלטה:**
   - **רקמה חדשה שרק אני חבר בה, עם מוצרים בלבד** — להשאיר קליק אחד במסך האישור (ההמלצה:
     זה גם הרגע שבו רואים מטבע וזמן תגובה ברירת מחדל), או לאפשר ל-Claude ליצור ישירות
     מהצ'אט, כי זה לא נוגע באף אחד אחר?
   - **שותפים במסלול `partnership`** — הזמנה במייל מתוך מסך האישור (כל שותף חותם על
     ההסכמה בעצמו)? או רק קישור לשיתוף?
   - **`hideFromDiscovery` בקונסיירז'** — מוצר שהוסתר מהספרייה: ההמלצה היא שגם הקונסיירז'
     לא יציע אותו (§4.6.3). מסכים?
