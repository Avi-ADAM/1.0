# PLAN — עוזר AI מתמשך: הרשמה דרך סוכן, אונבורדינג בשיחה, קונסיירז' בשיחה

> נכתב: 2026-09-24 · סטטוס: **תכנית** (אין עדיין קוד בצד ה-frontend).
> ה-collection החדש כבר נוסף ב-`1.0b` על הענף `claude/ai-signup-concierge-97frwr`
> (§6). מה שהתכנית ממשיכה ולא מחליפה:
> [PLAN_ONBOARDING](./PLAN_ONBOARDING.md) · [PLAN_CONCIERGE](./PLAN_CONCIERGE.md)
> (פער 3: "רוויזיה מה-AI עם בקשה טקסטואלית") · [PLAN_MCP_OAUTH](./PLAN_MCP_OAUTH.md) ·
> [PLAN_MCP_TOOLS_V2](./PLAN_MCP_TOOLS_V2.md) · [PLAN_MATCH_SUGGESTIONS](./PLAN_MATCH_SUGGESTIONS.md).

---

## 0. בקצרה

שני חסרים, ופתרון אחד משותף לשניהם:

| # | מה יש היום | מה רוצים |
|---|---|---|
| **א** | הרשמה = `/hascama` (טופס הסכמה, `amana.svelte`) ← `/signup` (מייל+סיסמה) ← מייל אישור ← `/onboard`. סוכן חיצוני (Claude דרך הקונקטור/MCP) לא יכול לעזור בכלום לפני שיש חשבון. | Claude מציע להירשם ← **מסך אחד** נפתח: טופס ההסכמה ממולא מראש בפרטים שהסוכן כבר יודע ← האדם קורא, חותם ובוחר סיסמה ← מאשר מהמייל ← ממשיך ישר לאונבורדינג בשיחה. |
| **ב** | אונבורדינג: כותבים פעם אחת על עצמך/העסק (`/onboard/provider/describe`, `/onboard/business/describe`) ← מקבלים פעם אחת הצעות (כישורים, תפקידים, ערכים, דרכי עבודה, משימות, משאבים / רקמה+תכנית) ← בוחרים צ'יפים ← שומרים. | **שיחה מתמשכת**: "זה בסדר, את זה לא, תוסיף שאני גם מלמד" ← רשימה מעודכנת, שוב ושוב, גם אחרי ימים, גם מ-Claude וגם מהאתר. |
| **ג** | קונסיירז': כותבים משאלה ← חילוץ חי (`/api/concierge-extract`) ← במסך `/concierge/[id]` עריכה **ידנית** של השורות. דרך MCP: `previewWish` (בלי שמירה) ו-`draftWish` (יצירה בלבד). | דיוקים **טקסטואליים** ("בלי צלם, תוסיף DJ, התקציב 5,000") ← טיוטה/רשימה מעודכנת. גם באתר וגם דרך MCP. |

**הרעיון המרכזי:** "רשימה חיה אחת, שני ערוצים". כל תהליך דיוק הוא שורה אחת
ב-collection חדש `assistant-session`. הצ'אט באתר וסוכן חיצוני ב-MCP קוראים
וכותבים **לאותה שורה**, כך שתיקון שנאמר ל-Claude מופיע באתר ולהפך. ה-AI **לא
משכתב** את הרשימה — הוא מחזיר *פעולות* קטנות (`keep`/`drop`/`add`/`rename`…)
שקוד דטרמיניסטי ובדוק מחיל. כשהסוכן החיצוני הוא Claude, הוא כבר הבין את המשתמש
בעצמו ושולח את הפעולות ישירות — בלי לשלם על קריאת Gemini נוספת.

---

## 1. מה כבר קיים ומנוצל (לא בונים מחדש)

| נכס | מיקום | תפקיד בתכנית |
|---|---|---|
| טופס ההסכמה | `src/lib/components/main/amana.svelte`, `src/routes/hascama/` | מקבל מצב `prefill` (§3.3) |
| יצירת חוזה (chezin) + קוקיז ההרשמה | `src/routes/api/chezin/+server.ts` (qid `280createChezin`) | אותו נתיב, רק מקשר גם את ה-session |
| הרשמה | `src/routes/signup/+page.server.js` ← `/api/auth/local/register` | הופך לשלב שני **באותו מסך** |
| אישור מייל | `src/routes/confirm-email/+page.server.ts` | מנתב ל-`/onboard/assistant` כשיש session ממתין |
| כוונת קונסיירז' בהרשמה | `src/lib/concierge/regIntent.js` | intent `order` של הסוכן = אותה כוונה |
| OAuth ל-MCP (claude.ai) | `src/routes/oauth/*`, `src/routes/mcp-connect/`, `src/lib/server/oauth/` | נתיב ההרשמה מתוך חלון ה-OAuth (§3.2); מפתח ה-AEAD לטוקן ה-prefill |
| שרת MCP + מניפסט כלים | `src/routes/api/mcp/+server.ts`, `src/lib/server/mcp/toolManifest.ts`, `guard.ts` | כלים חדשים (§8), כולל כלי ציבורי אחד |
| ניתוח טקסט/CV ← כישורים/תפקידים/ערכים/משימות/משאבים + התאמה לאוצר המילים | `src/mastra/workflows/analyze-cv.ts` (שלב `match-to-existing`), `/api/analyze-cv` | החילוץ הראשוני של session מסוג `profile`; שלב ההתאמה מוצא לפונקציה משותפת |
| ניתוח עסק ← רקמה + תכנית פתיחה | `/api/analyze-business`, `src/lib/server/planning/seedPlan.ts` | החילוץ הראשוני של session מסוג `business` |
| שמירת הבחירה לפרופיל | `src/routes/api/onboard/save/+server.ts` | מוצא ל-`applyProfileSelection()` משותף (§7.2) |
| חילוץ משאלה | `src/lib/server/ai/extractWish.ts`, `conciergeAgent.ts`, `enrichWish.ts` | החילוץ הראשוני של session מסוג `wish` |
| עדכון משאלה | actions `updateRatsonDraft`, `updateRatsonExtraction`, `refreshWishMatches`, `ensureRatsonProposalForum` | ה-apply של session מסוג `wish` |
| הצעות התאמה (משימות פתוחות/משאבים ברקמות) | `src/lib/server/matching/engine.ts` (`matchUserToOpenEntities`, `dismissSuggestion`), qid `209levMatchSuggestions` | רשימת ה"רקמות-משימות" שמוצגת בשיחה ומתעדכנת אחרי apply |
| תמלול קולי | `/api/concierge-transcribe` | כפתור מיקרופון בפאנל הצ'אט |

---

## 2. העיקרון: session אחד, פעולות קטנות, גרסה

### 2.1 מבנה ה-state (JSON בשדה `state`)

```ts
type ItemStatus =
  | 'proposed'  // ה-AI הציע, עוד לא נאמר עליו כלום
  | 'kept'      // "זה בסדר"
  | 'dropped'   // "לא עכשיו" — ניתן לשחזור, לא נמחק כלום באוצר המילים
  | 'applied';  // כבר בפרופיל / כבר בשורות המשאלה

type Item = {
  key: string;            // יציב לאורך כל ה-session (למשל 's7'), ה-AI מפנה רק אליו
  group: 'skills' | 'roles' | 'methods' | 'vallues' | 'missions' | 'resources'   // profile
       | 'wishMissions' | 'wishResources' | 'planItems';                            // wish / business
  label: string;
  existingId?: string;    // id אמיתי אחרי התאמה לאוצר המילים / לטמפלט
  status: ItemStatus;
  origin: 'extract' | 'revision' | 'manual' | 'profile';
  why?: string;           // משפט קצר: למה הוצע ("כתבת שאת מלמדת יוגה")
  importance?: 'must' | 'nice';  // wish
  hoursEst?: number;              // wish
  committed?: { proposalId?: string; bomRowId?: string }; // wish: יש ספק שכבר נענה (§5.3)
};

type SessionState = {
  items: Item[];
  fields?: Record<string, unknown>;  // business: name/desc/details/vals · wish: title + details (תאריכים/תקציב/מקום…)
  questions?: string[];              // שאלות הבהרה פתוחות מה-AI
};
```

### 2.2 פעולות (ops) — מה ה-AI (או Claude) מחזיר

```ts
type Op =
  | { op: 'keep' | 'drop' | 'restore'; key: string }
  | { op: 'add'; group: Item['group']; label: string; why?: string; importance?: 'must' | 'nice' }
  | { op: 'rename'; key: string; label: string }
  | { op: 'setImportance'; key: string; importance: 'must' | 'nice' }
  | { op: 'setHours'; key: string; hoursEst: number }
  | { op: 'setField'; field: string; value: unknown };
```

- `applyOps(state, ops)` — **פונקציה טהורה** ב-`src/lib/assistant/applyOps.ts`, עם בדיקות
  (כולל property-based ב-fast-check: אין op שמייצר key כפול, `restore(drop(x)) = x`,
  key לא קיים = נדחה ולא "מומצא").
- `add` עובר את אותה התאמה לאוצר המילים שה-CV עובר היום (`match-to-existing`), כך
  ש"מורה ליוגה" נקשר ל-`tafkidim` הקיים ולא יוצר כפילות. פריט שלא נמצא לו התאמה
  נשאר `existingId: undefined` ונוצר רק ב-apply — בדיוק כמו `newItems` היום.
- ה-AI מחזיר `{ ops, say, questions }` — `say` הוא משפט-שניים לתצוגה בצ'אט. ה-state
  המוצג תמיד מחושב מה-ops, **אף פעם** לא מהטקסט החופשי של המודל.

### 2.3 גרסה והיסטוריה

- `version` עולה בכל כתיבה. כל פעולת כתיבה מקבלת `expectedVersion`; אי-התאמה ⇒
  מוחזר ה-state העדכני במקום שגיאה ("בינתיים עדכנת מהאתר — הנה הרשימה הנוכחית").
  זה מה שמאפשר לשני הערוצים לעבוד על אותה רשימה בלי לדרוס זה את זה.
- `revisions` (JSON, 30 האחרונות) = **התמליל של השיחה**:
  `{ v, at, via: 'site' | 'agent', instruction, say, ops }`. אין צורך ב-thread נפרד של
  Mastra Memory — ההיסטוריה שהמודל צריך היא ההחלטות, לא הפטפוט, והיא חייבת להיות
  גלויה לשני הערוצים. "בטל את האחרון" = החלת ה-ops ההפוכים של הרוויזיה האחרונה.

### 2.4 "אין לא מוחלט" — איך זה נראה כאן

- ברשימה **של עצמי** (הפרופיל שלי, המשאלה שלי) `dropped` הוא "לא עכשיו" — ריבוני,
  הפיך, ובממשק כתוב "לא עכשיו", לא "דחייה".
- בהצעות התאמה (רקמות/משימות פתוחות) "לא רלוונטי" = `dismissSuggestion` הקיים —
  לא תשובה לאף אחד, רק סינון של מה שאני רואה.
- שורת משאלה **שספק כבר נענה עליה** לא נמחקת מהצ'אט — ראו §5.3.

---

## 3. חלק א' — הרשמה דרך סוכן

### 3.1 מסלול 1: סוכן לא מחובר (Claude Code / Desktop / כל לקוח MCP בלי מפתח)

זה המצב הציבורי שכבר קיים ב-`/api/mcp` (`getPlatformInfo`, `howToConnect`,
`createNewApiKey`). מוסיפים לו כלי אחד: **`prepareSignup`**.

```
משתמש ב-Claude: "תרשום אותי ל-1lev1, אני מעצבת UX, רוצה פרויקטים בצד"
    │
    ▼
Claude → prepareSignup({ name, email, countries, lang, intent:'join',
                         aboutText: "מעצבת UX 8 שנים, ..." })
    │   שרת: יוצר assistant-session  status='pending', startedVia='agent',
    │         kind='profile', sourceText=aboutText, claimEmail=email, claimExpiresAt=+14d
    │   מחזיר: url = https://www.1lev1.com/hascama?agent=<טוקן חתום+מוצפן>
    ▼
Claude: "הנה הקישור — קראי את ההסכמה, חתמי ובחרי סיסמה. את הסיסמה רק את מקלידה."
    │
    ▼  ← הקפצה אחת בדפדפן
/hascama?agent=…   (מסך אחד — §3.3)
    ├─ ההסכמה, עם שם/מייל/מדינות כבר ממולאים (ניתנים לעריכה)
    ├─ חתימה  → /api/chezin create  (+ session.chezin = chezinId)
    └─ באותו כרטיס: שדה סיסמה → register (chezin: fpval)
    ▼
"בדקי את המייל"  →  לחיצה על הקישור  →  /confirm-email
    ▼
/onboard/assistant   ← ה-session נתבע (claim), החילוץ רץ על aboutText,
                        והצ'אט נפתח עם רשימה מוכנה — בלי לכתוב שוב על עצמך
    ▼
כרטיס "חברי את העוזר שלך": claude.ai → הוספת קונקטור (OAuth, קליק אחד — כבר מחוברת)
                           Claude Code → npx 1lev1-mcp
    ▼
Claude (עכשיו מחובר) → getAssistant({ kind:'profile' }) → ממשיך את אותה שיחה
```

**intent** קובע לאן ממשיכים אחרי האישור:

| intent | session | נחיתה אחרי אישור |
|---|---|---|
| `join` | `profile` מ-`aboutText` | `/onboard/assistant` |
| `business` | `business` מ-`aboutText` (או `url`) | `/onboard/assistant?kind=business` |
| `order` | `wish` — טיוטת משאלה מ-`wishText` | `/concierge/<draftId>` (כמו `CONCIERGE_LANDING` היום, רק עם הטיוטה כבר בשרת ולא ב-`localStorage`) |

### 3.2 מסלול 2: claude.ai עם OAuth (הקונקטור בדפדפן)

כש-`MCP_OAUTH_ENABLED=true`, לקוח לא מחובר מקבל 401 ישר ב-connect, ולכן אין
שלב שבו Claude יכול לקרוא ל-`prepareSignup`. כאן **חלון ה-OAuth עצמו הוא ההקפצה
האחת**:

1. `/oauth/authorize` לאורח מנתב היום ל-`/login?redirect=/mcp-connect?oauth=…`.
   בדף הלוגין מוסיפים "אין לך חשבון? הרשמה" שנושא את ה-`redirect` הלאה.
2. `/hascama` שומר את היעד בקוקי `reg_next` (בדיוק כמו `reg_intent` — שרשרת
   שחוצה redirect, goto, form post וקישור ממייל; ראו ההערה ב-`regIntent.js`).
   רק יעד פנימי שעובר `safeRedirectTarget`.
3. `/confirm-email` מכבד את `reg_next`. בקשת ה-OAuth חתומה ל-15 דק'
   (`REQUEST_TTL_MS` ב-`authreq.ts`); אם פגה — הדף אומר "חזרי ל-Claude ולחצי Connect
   שוב — את כבר מחוברת, זה קליק אחד". **לא** מאריכים את ה-TTL: זו בקשה ש-claude.ai
   כבר נטש.
4. אחרי ה-connect, Claude קורא `startAssistant({ kind:'profile', text })` עם מה
   שהמשתמשת סיפרה לו בשיחה, והרשימה נולדת.

### 3.3 המסך האחד — `hascama` במצב `agent`

- `+page.server.js`: מפענח את הטוקן (`openAgentSignupToken`), מחזיר `prefill`
  (`name`, `email`, `countryIds`, `intent`, `lang`). טוקן פג/פגום ⇒ ההסכמה הרגילה
  בלי prefill (לעולם לא מסך שגיאה — האדם עדיין יכול להירשם).
- `amana.svelte` מקבל prop `prefill`: ממלא את השדות, מציג פס "הפרטים מולאו על ידי
  העוזר שלך — בדקי אותם", והשדות **ניתנים לעריכה**. אחרי חתימה מוצלחת, במקום
  `goto('/signup')` — אותו כרטיס מתחלף לשלב הסיסמה (מבחינת המשתמשת: מסך אחד,
  שני לחיצות: "חותמת" ו"פתיחת 1💗1").
- שלב הסיסמה שולח לאותו action של `/signup` (אין שכפול לוגיקה). הטוקן עובר בשדה
  נסתר כדי שה-action יקשר `session.chezin`.
- כבר קיים chezin למייל הזה (השדה `unique`) ⇒ "כבר חתמת בעבר — התחברי", והסוכן
  ימשיך אחרי connect.
- כל הטקסטים ב-`home.amana.agent.*` ו-`signup.agent.*` בחמש השפות.

### 3.4 אישור מייל ו-claim

- ה-claim **לא לפי מייל** אלא לפי ה-chezin שנוצר דרך אותו טוקן: session
  `status='pending'` שה-`chezin` שלו = `user.chezin`. כך טקסט שמישהו אחר שתל עם
  המייל שלך לא נקשר אליך — רק מה שנחתם בפועל דרך הקישור. `claimEmail` נשאר כבדיקה
  משנית ולשיוך במקרה של chezin ישן.
- ה-claim קורה ב-load הראשון של `/onboard/assistant` (או `/concierge/<id>`) אחרי
  שיש JWT, ולכן **עובד גם ממכשיר אחר** — בניגוד ל-`wishDraft` שב-`localStorage`.
- ב-claim: `user` נקבע, `status='active'`, ורק **אז** רץ החילוץ (עלות Gemini רק
  למי שבאמת נרשם).
- session `pending` שלא נתבע עד `claimExpiresAt` נמחק ע"י cron הניקוי.

### 3.5 (מומלץ, שלב נפרד) כניסה אוטומטית מקישור האישור — `1.0b`

היום `/confirm-email` לא יכול ליצור session ("Strapi's endpoint returns no JWT"),
ולכן מי שאישר נשלח ללוגין ומקליד שוב את הסיסמה. זה החור האחרון ב"הקפצה אחת".
הצעה: route מותאם ב-`src/extensions/users-permissions/strapi-server.js`,
`POST /auth/email-confirmation-login { confirmation }`, שמאשר ומחזיר
`{ jwt, user }` (`plugin.services.jwt.issue`). שני תנאים:

- **POST בלבד**, מכפתור "המשך" בדף `/confirm-email` — סורקי קישורים במייל עושים
  GET, והם כבר היום "שורפים" את הטוקן החד-פעמי (ראו התיעוד בראש הקובץ).
- נכנס ל-`ALLOWED` של `/api/auth/[...path]` עם `setsSession: true` — ה-JWT לא מגיע
  לדפדפן, רק קוקי httpOnly.

### 3.6 אבטחה ופרטיות — מה הסוכן **לא** עושה

- לא נוגע בסיסמה, לא חותם על ההסכמה, לא מאשר מייל. שלושתם פעולות של האדם.
- הטוקן: AES-256-GCM (אותו מנגנון של `codes.ts`, מפתח נגזר עם תווית אחרת),
  TTL 24 שעות, נושא רק `{ sid, name, email, countryIds, intent, lang, exp }` —
  הטקסט על עצמך נשאר בשרת, לא בקישור (קישור קצר, ולא נשמר בלוגים של אף אחד).
- `prepareSignup` הוא כלי **ציבורי** ⇒ rate-limit לפי IP (5 לשעה) ומכסה יומית,
  `aboutText` ≤ 4000 תווים, ובלי קריאת AI (החילוץ רץ רק אחרי claim).
- מייל של מישהו אחר ⇒ מקסימום נשלח לו מייל אישור רגיל, כמו בהרשמה ידנית; ה-session
  לא נקשר אליו בלי שחתם דרך הקישור (§3.4).

---

## 4. חלק ב' — אונבורדינג כשיחה מתמשכת

### 4.1 איך זה מרגיש

```
את:   אני מעצבת UX, 8 שנים, בעיקר אפליקציות. גם מלמדת פיגמה.
לב:   הנה מה שהבנתי (12 פריטים). שאלה: את עובדת גם על מחקר משתמשים?
      [כישורים] Figma ✓ · UX ✓ · אפיון · Wireframes · User Research?
      [תפקידים] מעצבת UX · מרצה
      [משימות שאני יודעת] עיצוב מסכי אפליקציה · סדנת פיגמה
את:   מחקר כן. "מרצה" לא — זה משהו קטן. ותוסיף שיש לי iPad Pro.
לב:   עודכן: User Research ✓, מרצה — לא עכשיו, נוסף משאב "iPad Pro".
את:   שמרי.
לב:   נשמר לפרופיל. יש 3 רקמות שמחפשות מעצבת UX ← [רשימה]
את:   השנייה לא רלוונטית, היא בחיפה.
לב:   הוסרה מההצעות שלך.
```

שבוע אחר כך, מ-Claude: "תוסיף לפרופיל שלי ב-1lev1 שאני עושה גם אנימציה" ←
`getAssistant` ← `setAssistantItems([{op:'add', group:'skills', label:'אנימציה'}])` ←
`applyAssistant` (אחרי אישור בשיחה) ← הרשימה המעודכנת מופיעה גם באתר.

### 4.2 מחזור החיים

1. **start** — מהאתר (`/onboard/provider/describe` ו-`/cv` יוצרים session במקום
   `cvDraft` ב-`sessionStorage`), מ-MCP (`startAssistant`), או מ-claim (§3.4).
   משתמש קיים שנכנס ל"לדייק את הפרופיל בשיחה" ב-`/me` מקבל session שזרוע
   **בפרופיל הנוכחי** (`origin:'profile'`, `status:'applied'`) — כך "תוריד את X"
   עובד גם על מה שכבר שמור (ההערה בסוף PLAN_ONBOARDING: "תומכים בזה שחלק מהמאפיינים
   כבר מגיעים מלאים").
2. **revise** — טקסט חופשי ← `reviseAssistant` (Gemini) ← ops ← `applyOps`.
3. **set** — לחיצה על צ'יפ באתר, או סוכן חיצוני שכבר הבין ← `setAssistantItems`
   (בלי AI).
4. **apply** — "שמרי" ← `applyAssistantSession`:
   - `kept` + `proposed` שסומנו לשמירה ← connect לפרופיל (ו-create לאוצר המילים
     למה שאין לו `existingId`, כמו היום);
   - `dropped` שהיו `applied` ← disconnect (`updateUserRelation`);
   - `resources` ← `sp` (כמו `/api/onboard/save`);
   - אחר כך `matchUserToOpenEntities(userId, 'profileUpdated')` — ורשימת ההצעות
     (qid 209) מתרעננת.
   ה-session לא נסגר ב-apply: `status` נשאר `active`, והשיחה ממשיכה מאותה נקודה.
5. **offers** — לא נשמר ב-state; מחושב בכל קריאה מ-`match-suggestion` (qid 209)
   ומוצג כקבוצה נוספת. "לא רלוונטי" ← `dismissSuggestion` הקיים; "ספר לי עוד" ←
   קישור לדף המשימה/הרקמה.

### 4.3 מסלול בעל עסק (`kind:'business'`)

- ה-state: `fields` = `{ name, desc, details, vals }` מ-`/api/analyze-business`,
  `items` בקבוצה `planItems` = התכנית מ-`seedPlan` (לוחות, מוצרים, משימות, משאבים).
- revise: "השם צריך להיות 'השקד', ובלי סדנת אפייה" ← `setField` + `drop`.
- apply = **המסלול הקיים**, לא עוקף אותו: prefill ל-`/me?action=createproject` +
  `seedPlanHandoff`. את הרקמה יוצר האדם בלחיצה (סדר האישורים ב-PLAN_ONBOARDING
  §1.3 נשמר). אחרי שהרקמה קיימת, דיוקי התכנית ממשיכים בכלים שכבר יש
  (`planProjectWorkTool`, `createPlanBoardTool` — הצעות בלבד), וה-session נסגר
  (`status:'applied'`).

---

## 5. חלק ג' — קונסיירז' בשיחה

### 5.1 ה-state של משאלה

`fields` = `{ title, dateFrom, dateTo, budget, currency, place, online, groupKind }`
(אותם שדות של `extraction.details`), `items` = `wishMissions` + `wishResources` עם
`importance` ו-`hoursEst` — שיקוף של `extracted_missions` / `extracted_resources`.

### 5.2 מתי זה נכתב לרטסון

| מצב המשאלה | אחרי כל revise | apply |
|---|---|---|
| **טיוטה** (`status_ratson:'draft'`) | **אוטומטית** — הרטסון עצמו הוא הטיוטה, ולכן "לקבל בטיוטה" = הטיוטה מתעדכנת. `updateRatsonDraft` בלי `publish`. | פרסום נשאר לחיצה של האדם (החלטה D2 ב-`draftWish`). |
| **פורסמה** | נשמר רק ב-session ("יש 3 שינויים שלא עודכנו") — ספקים והתאמות רואים את המשאלה, אז לא מטלטלים אותה בכל משפט. | `updateRatsonExtraction` + `refreshWishMatches`. |

### 5.3 שורה שספק כבר נענה עליה

אם לשורה יש `ratson-proposal` פעיל או שורת BOM משובצת (`requestWishMission` /
`acceptWishOffer`), `drop` **לא מוחל**. ה-AI מקבל את `committed` ב-state ויודע לענות:
"על הצילום כבר ענה יוסי. לפתוח איתו שיחה?" ← כפתור שקורא ל-
`ensureRatsonProposalForum`. זה אותו עיקרון של `archiveObject`: מה שנכנס בהסכמה
יוצא בהסכמה. `rename`/`setHours` על שורה כזו — אותו דבר (שינוי תנאים = שיחה).

### 5.4 איפה

- **אתר:** ב-`/concierge/[id]` פאנל "לדייק עם לב" לצד `PLAN_ROWS` — זה סוגר את
  פער 3 ב-PLAN_CONCIERGE ("בקשת רוויזיה מה-AI עם כל המידע שנצבר + בקשה
  טקסטואלית"). `/concierge/new` נשאר עם החילוץ החי; כשהטיוטה נשמרת נוצר גם session.
- **MCP:** `startAssistant({ kind:'wish', text })` מחליף את הצמד `previewWish` +
  `draftWish` (שני אלה נשארים, לתאימות); `startAssistant({ kind:'wish', ratsonId })`
  פותח session על משאלה קיימת.

---

## 6. Strapi — `api::assistant-session.assistant-session` (נוסף ב-`1.0b`)

| שדה | סוג | הערה |
|---|---|---|
| `user` | manyToOne → user (`assistant_sessions`) | ריק כל עוד `pending` |
| `kind` | enum `profile \| business \| wish` | חובה |
| `status` | enum `pending \| active \| applied \| closed` | ברירת מחדל `active` |
| `ratson` | manyToOne → ratson (`assistant_sessions`) | ל-`wish` |
| `chezin` | manyToOne → chezin (`assistant_sessions`) | הקישור שעליו נעשה ה-claim (§3.4) |
| `startedVia` | enum `site \| agent` | אנליטיקס |
| `sourceText` | text | הטקסט המקורי (על עצמי / המשאלה) |
| `lang` | string(3) | |
| `state` | json | §2.1 |
| `revisions` | json | §2.3, עד 30 |
| `version` | integer, default 0 | §2.3 |
| `claimEmail` | email, **private** | לא יוצא ב-API |
| `claimExpiresAt` | datetime | ניקוי pending |
| `appliedAt` | datetime | apply אחרון |

קבצים: `src/api/assistant-session/**` (boilerplate של `ratson-proposal`) +
הצד ההפוך ב-`User/schema.json`, `ratson/schema.json`, `chezin/schema.json`.

> **הרשאות — בכוונה בלי לסמן את Authenticated.** כל הגישה ל-collection הזה עוברת
> ב-service token (`isSer`) מתוך actions שבודקים בעלות בעצמם — שורות `pending`
> שייכות לאף אחד עדיין, ו-`sourceText` הוא טקסט אישי. זה בניגוד ל-archive, שרץ
> ב-JWT של המשתמש (ההערה ב-`1.0b/CLAUDE.md`): כאן אין מה לסמן אחרי ה-deploy, וגם
> לא צריך. אחרי ה-deploy: `npm run types:update` ב-`1.0`.

---

## 7. Server (frontend repo)

### 7.1 מודולים

| קובץ | מה |
|---|---|
| `src/lib/assistant/applyOps.ts` (+ `.test.ts`, `.pbt.test.ts`) | טהור: `applyOps`, `invertOps`, `diffForDisplay` |
| `src/lib/assistant/types.ts` | `Item`, `Op`, `SessionState` + סכימות zod |
| `src/lib/server/assistant/session.ts` | load / save עם `expectedVersion`, claim, trim ל-30 רוויזיות |
| `src/lib/server/assistant/seed.ts` | חילוץ ראשוני לפי kind: analyze-cv (טקסט) / analyze-business / extractWish; זריעה מפרופיל קיים או מרטסון קיים |
| `src/lib/server/assistant/revise.ts` | קריאת Gemini (`createGoogleModel`, fallback ל-Groq כמו `conciergeAgent`): state דחוס + 6 רוויזיות אחרונות + ההוראה ← `{ ops, say, questions }`, מאומת ב-zod. טקסט המשתמש = נתונים, לא הוראות מערכת |
| `src/lib/server/assistant/vocabMatch.ts` | שלב `match-to-existing` של `analyze-cv.ts` מוצא לפונקציה, משמש גם את `add` |
| `src/lib/server/onboard/applyProfileSelection.ts` | הלוגיקה של `/api/onboard/save` מוצאת לכאן; הנתיב הישן קורא לה (בלי שינוי התנהגות) |
| `src/lib/server/assistant/signupToken.ts` | `sealAgentSignupToken` / `openAgentSignupToken` (AES-GCM, `oauth/secret.ts`) |

### 7.2 Actions (Unified Action System, `configs/`)

| action | authRules | מה |
|---|---|---|
| `startAssistantSession` | `jwt` | `{ kind, text?, url?, ratsonId?, fromProfile? }` ← session + חילוץ |
| `reviseAssistantSession` | `jwt` + בעלות | `{ sessionId, instruction, expectedVersion, via }` ← AI ← ops |
| `setAssistantItems` | `jwt` + בעלות | `{ sessionId, ops, expectedVersion, via }` — בלי AI |
| `undoAssistantRevision` | `jwt` + בעלות | היפוך הרוויזיה האחרונה |
| `applyAssistantSession` | `jwt` + בעלות | §4.2 / §4.3 / §5.2 |
| `claimAssistantSession` | `jwt` | נקרא מה-load של `/onboard/assistant` |

בעלות = `session.user.id === context.userId` (rule `custom`), ולמשאלה גם
`ratson.users_permissions_users ∋ userId`.

`prepareSignup` **אינו** action: שכבת ה-authz דוחה `anonymous` בכל פעולה, ובצדק.
הוא פונקציית שרת (`src/lib/server/assistant/prepareSignup.ts`) שהכלי הציבורי של
ה-MCP קורא לה, וכותבת דרך `sendToSer` (isSer) — אותו דפוס של `/api/chezin`, שגם
הוא רץ לפני שיש חשבון.

### 7.3 QIDs (ב-`qids.js` + `qidsAccess.js`, service בלבד)

`363createAssistantSession` · `364getAssistantSession` · `365updateAssistantSession` ·
`366findMyAssistantSessions` (user + kind + status) · `367findPendingAssistantByChezin` ·
`368deleteExpiredAssistantSessions`. אחרי ההוספה: `npm run validate:qids`.

---

## 8. כלי MCP

| כלי | tier | ai | מה |
|---|---|---|---|
| `prepareSignup` | ציבורי (במצב הלא-מאומת בלבד) | לא | §3.1. מחזיר `url` + הנחיה: "תני לאדם את הקישור; הוא חותם ובוחר סיסמה בעצמו" |
| `startAssistant` | `selfWrite` | כן | פותח session (`profile`/`business`/`wish`), מחזיר רשימה + `url` באתר |
| `getAssistant` | `read` | לא | ה-session הפעיל לפי `kind` (או `sessionId`): רשימה, שאלות פתוחות, 5 רוויזיות אחרונות, ו-`offers` |
| `reviseAssistant` | `selfWrite` | כן | הוראה בשפה חופשית ← ops. לסוכן שלא רוצה לפרש בעצמו |
| `setAssistantItems` | `selfWrite` | לא | **הדרך המועדפת ל-Claude**: הוא כבר הבין את המשתמש, שולח ops ישירות |
| `applyAssistant` | `selfWrite` | לא | profile: שמירה לפרופיל (אחרי שהמשתמש אמר "שמור" בשיחה). wish טיוטה: עדכון תוכן — **פרסום נשאר קליק באתר**, מוחזר `url`. business: מוחזר `url` ליצירת הרקמה |
| `dismissOffer` | `selfWrite` | לא | `dismissSuggestion` על הצעת התאמה |

- כל הכתיבות הן על **הרשימה/הפרופיל/המשאלה של המשתמש עצמו** — שום דבר לא נוחת
  על חבר אחר, ולכן `selfWrite` ולא `consentWrite`. משאלה עם ספק שנענה (§5.3) היא
  המקום היחיד שנוגע באחר, והוא מחזיר קישור לשיחה במקום לפעול.
- `setAssistantItems` מקבל `expectedVersion`; על אי-התאמה מחזיר את ה-state העדכני
  ו-`conflict: true`, והסוכן מציג למשתמש מה השתנה.
- `MCP_INSTRUCTIONS` מקבל סעיף קצר: "כשמשתמש לא רשום רוצה להצטרף — `prepareSignup`;
  כשמשתמש מספר על עצמו / מדייק משאלה — `getAssistant` ואז `setAssistantItems`".
  סעיף 3 הנוכחי ("A new wish is opened by the person at /concierge/new") מתעדכן.
- מאחורי env `ASSISTANT_MCP_ENABLED` (כמו `CONCIERGE_MCP_WRITE`), כבוי כברירת מחדל.

---

## 9. UI

- **`src/lib/components/assistant/AssistantPanel.svelte`** — רכיב אחד לשלושת ה-kinds:
  הרשימה בקבוצות (צ'יפים: הוצע / נשמר ✓ / לא עכשיו, עם הדגשה של מה שהשתנה ברוויזיה
  האחרונה), שורת טקסט + מיקרופון (`/api/concierge-transcribe`), ההיסטוריה (הוראה ←
  `say`), "בטל אחרון", וכפתור ה-apply. לחיצה על צ'יפ = `setAssistantItems`.
  תג קטן "עודכן דרך Claude" על רוויזיה עם `via:'agent'`.
- **סנכרון בין ערוצים:** רענון ב-`visibilitychange`/focus לפי `version`; אופציונלי —
  אירוע `assistant:updated` לחדר המשתמש בשרת הסוקטים.
- **נתיבים:**
  - חדש `src/routes/(reg)/onboard/assistant/+page.svelte` (+ `.server.js` ל-claim).
  - `/onboard/provider/review` — קורא מה-session במקום `cvDraft`, והפאנל לצידו.
    הצ'יפים הקיימים נשארים; הטקסט מתחתם הוא התוספת.
  - `/me` — "לדייק את הפרופיל בשיחה" (`fromProfile: true`).
  - `/concierge/[id]` — "לדייק עם לב" (§5.4).
  - `/hascama` — מצב `agent` (§3.3); `/login` — קישור הרשמה ששומר `redirect` (§3.2);
    `/confirm-email` — `reg_next` + (בשלב 3.5) כפתור "המשך".
- **i18n:** namespace חדש `assistant` (he/en/ar/ru/es) + מפתחות ב-`home.amana.agent`,
  `signup.agent`, `onboard.assistant`. הקבוצה היא "רקמה" / `rikma` בכל השפות (לא `ריקמה`, לא `weave`), ראו CLAUDE.md.
  אחרי ההוספה: `npm run check:i18n`, `npm run check:script`.

---

## 10. אבני דרך

| # | מה | תוצר | תלוי |
|---|---|---|---|
| **M0** | Deploy של ה-schema (`1.0b`) + `types:update` + QIDs 363–368 | ה-collection חי | — |
| **M1** | `applyOps` + סכימות + בדיקות; `session.ts`; חילוץ `applyProfileSelection` מ-`/api/onboard/save` | ליבה בדוקה, בלי UI | M0 |
| **M2** | `revise.ts` + `vocabMatch.ts` + actions start/revise/set/undo/apply (profile) | שיחה על פרופיל דרך `/api/action` | M1 |
| **M3** | `AssistantPanel` על `/onboard/provider/review` + `/me` + `offers` | **חסר ב' סגור באתר** | M2 |
| **M4** | kind `wish`: seed מרטסון, §5.2, §5.3, פאנל ב-`/concierge/[id]` | **חסר ג' סגור באתר** (+ פער 3 ב-PLAN_CONCIERGE) | M2 |
| **M5** | כלי MCP (§8) מאחורי `ASSISTANT_MCP_ENABLED` + עדכון `MCP_INSTRUCTIONS` | ב' ו-ג' דרך Claude | M3, M4 |
| **M6** | `prepareSignup` + טוקן + `hascama` במצב agent + שלב סיסמה באותו מסך + claim | **חסר א' — מסלול 1** | M2 |
| **M7** | קישור הרשמה מ-`/login` + `reg_next` + הודעת "פג — Connect שוב" | **חסר א' — מסלול 2 (claude.ai)** | M6 |
| **M8** | `email-confirmation-login` ב-`1.0b` + כפתור "המשך" | בלי הקלדת סיסמה שנייה | M6 |
| **M9** | kind `business` (§4.3) | בעל עסק בשיחה | M2 |
| **M10** | cron ניקוי pending, מכסות, אנליטיקס (`startedVia`) | תפעול | M6 |

סדר מומלץ: M0 → M1 → M2 → M3 (הערך הגדול באתר) → M4 → M5 → M6/M7 → M8.
M6 לפני M5 רק אם ההרשמה דרך Claude היא העדיפות העסקית.

---

## 11. סיכונים ושאלות פתוחות

1. **עלות AI בשיחה ארוכה** — כל revise הוא קריאת Gemini. מקל: state דחוס (keys +
   labels בלבד), 6 רוויזיות בהקשר, ו-Claude עובד דרך `setAssistantItems` בחינם.
   מכסה יומית לכל משתמש ב-`guard` (`ai: true`).
2. **המודל ממציא key** — `applyOps` דוחה op על key לא קיים ומחזיר אותו ב-`rejected`,
   `say` נבנה מחדש מה-ops שהוחלו בפועל.
3. **זיהום אוצר המילים** — `add` עובר קודם התאמה; פריט חדש נוצר רק ב-apply, כמו
   `newItems` היום.
4. **הזרקת הוראות** — `sourceText` והוראות המשתמש נכנסים למודל כנתונים מסומנים;
   ה-ops מאומתים בסכימה, ואין op שנוגע במשהו מחוץ ל-session.
5. **שני ערוצים בו-זמנית** — `expectedVersion` (§2.3).
6. **שאלות להחלטה שלך:**
   - apply לפרופיל — כמו בתכנית (שמירה מפורשת, "שמרי"), או כל "זה בסדר" נשמר מיד?
   - האם ה-AI רשאי *להציע* ברשימת ה-offers גם רקמות שאין להן משימה פתוחה תואמת
     (על בסיס ערכים/תחום), או רק את מה שמנוע ההתאמה כבר מחזיר?
   - M8 (כניסה אוטומטית מקישור המייל) — מקובל אבטחתית? בלעדיו זה עובד, רק עם הקלדת
     סיסמה נוספת אחרי האישור.
