# המיגרציה ל-Unified Action System לאור התכנית המבוזרת — להמשיך, לעצור, או לכוון מחדש?

> נספח אסטרטגי למסמכים: [PLAN_serverless_p2p_data.md](./PLAN_serverless_p2p_data.md),
> [PLAN_user_sovereign_consent.md](./PLAN_user_sovereign_consent.md),
> [PLAN_PROXY_SECURITY.md](./PLAN_PROXY_SECURITY.md),
> [AGENT_ACTION_MIGRATION_GUIDE.md](./AGENT_ACTION_MIGRATION_GUIDE.md).
>
> השאלה: אם בעתיד הקרוב הנתונים עוברים לקצוות (P2P, Spaces מוצפנים, השרת
> יורד לתפקיד גיבוי), האם להמשיך את המיגרציה שמרכזת את הלוגיקה בשרת?
>
> **התשובה הקצרה: כן, אבל לא בדיוק כפי שמתואר היום.** המיגרציה היא לא
> ההפך מ-P2P — היא **התפר שמאפשר את P2P**. עם זה, חלק מהרשימה צריך
> רה-תיעדוף אגרסיבי, חלק להישאר בדיוק כפי שהוא, וחלק לעצור.

---

## 1. למה זה נראה כסתירה — והאבחנה שמפזרת אותה

על פניו, יש סתירה: המיגרציה אומרת "כל הלוגיקה רצה בשרת"; ה-P2P אומר
"כל הלוגיקה רצה בלקוח ומסונכרנת בין עמיתים".

המבנה הזה מטעה כי הוא ממקם את ה-Action System ב**מקום הלא נכון בארכיטקטורה**.
ה-Action System הוא לא "השרת" — הוא **חוזה הצהרתי שמגדיר מה זו פעולה**:

```
ActionConfig {
  key, paramSchema, authRules, graphqlOperation, notification, updateStrategy
}
```

קרא את זה שוב, רק בעברית של P2P:

```
ConsentEventSpec {
  action,                  ← key
  predicateSchema,         ← paramSchema
  invariants,              ← authRules → תנאים על ה-projection
  reducer,                 ← graphqlOperation → reducer על ConsentEvent
  notification,            ← אותו דבר (push/email נשאר שרתי לנצח)
  projectionInvalidation   ← updateStrategy → לאיזה projection קוראים אחרי
}
```

**אותו חוזה. רק שני מימושים שונים** (Strapi mutation מול signed event + reducer).

המיגרציה הקיימת מוציאה לוגיקה מקופצת ב-39 קומפוננטות ומרכזת אותה
ל-spec יחיד פר-פעולה. ברגע שה-spec קיים, להחליף את ה-backend מאחוריו
(Strapi → ConsentEvent DAG) זה החלפת מימוש, לא ארכיטקטורה מחדש.
**בלי המיגרציה, לעבור ל-P2P מחייב לגעת ב-39 קומפוננטות במקום ב-קובץ config אחד פר-action.**

---

## 2. שלוש שאלות מתחבאות בשאלה אחת

צריך לפצל את השאלה כדי שתהיה ניתנת למענה:

### שאלה א: האם המיגרציה ל-API proxy (`/api/send`, `/api/action`, `/api/auth`) רלוונטית ל-P2P?
**תשובה: כן בלי תנאי.** היא **חיונית** ל-P2P:
- בכל שלב של סולם ההדחה (S0–S5), הלקוח עדיין מדבר עם השרת ב-HTTPS עם JWT
  ב-HttpOnly. גם כש-Strapi מוחלף ב-relay מוצפן, ה-proxy SvelteKit נשאר.
- ה-`/api/action` הוא בדיוק המקום ש-`/api/consent/events` חי בו (כבר
  הוטמע ב-Phase 0). הקוד שמאמת JWT, מנהל cookies, מתעד metrics — כולו
  משותף.

### שאלה ב: האם החזרת ה-business logic מ-Strapi resolvers ל-action configs בצד שרת רלוונטית ל-P2P?
**תשובה: כן, אבל המשמעות משתנה.**
- היום: action config מתאר "השרת מבצע X על Strapi עבור הלקוח".
- ב-P2P: אותו action config מתאר "הלקוח חותם אירוע X; המראה מאמת
  ומשקף; reducers מפעילים את התוצאה על projection". **השדות זהים; ההצמדה למימוש שונה.**
- לכן: action configs שכבר הוגרו = חצי מעבודת Phase 1 כבר נעשתה.

### שאלה ג: האם להמשיך את המיגרציה של 39 הקומפוננטות מ-GraphQL ישיר ל-`sendToSer`/`executeAction`?
**תשובה: כן, אבל ברה-תיעדוף.** חלק נותן ערך מורכב (אבטחה היום + P2P מחר),
חלק רק היום, וחלק קטן נכון לדחות. ראה §5.

---

## 3. מה מהמיגרציה **מצטבר** עם ה-P2P (לעשות ללא היסוס)

מה שכבר נעשה — לא לבטל. מה שעוד לא נעשה — לעשות.

| רכיב במיגרציה | למה הוא מצטבר ל-P2P |
|---|---|
| `/api/auth` proxy ו-cookies httpOnly | ה-JWT הופך לא-רלוונטי לאימות בתוכן (חתימה היא האימות) — אבל **כן** רלוונטי כ-rate-limit gate על ה-relay. בלעדיו השרת חשוף לספאם |
| הסרת 4 נקודות החשיפה ב-`page.data.tok/.jwt` (§2.1) | בלי קשר ל-P2P — דליפת טוקן זה באג קריטי שצריך לסגור |
| נעילת Strapi ל-`127.0.0.1` (§5) | מודל ה-relay מחייב את זה: הלקוח לא יוצר חיבור ישיר. הופך חובה ב-S3 |
| `/api/action` registry + AuthorizationEngine | זה **בדיוק** המקום ש-`verifyConsentEvent` מתחבר אליו (כבר חיווט ב-Phase 0). ה-`authRules` הופכים ל-pre-flight check לפני קבלת אירוע חתום ל-mirror |
| `paramSchema` של כל action | הופך ל-`predicateSchema` של ה-consent event. validators לא נזרקים |
| `NotificationOrchestrator` (push/email/telegram/socket) | לעולם לא מתבזר. push דורש שרת VAPID, email דורש SMTP. נשאר בלי שינוי |
| הגנת CI נגד `page.data.jwt` / direct GraphQL (§3.4) | תוסיף שורה ל-CI שגם `fetch('https://api.openai...')` לא ירוץ בלקוח. החזית מתרחבת אבל אותה גישה |
| סגירת raw-query bypass ב-`/api/send` (§4.1) | חוסר זה chasm אבטחתי שלא קשור ל-P2P. תקן עכשיו |

**המסקנה לקבוצה הזו**: לבצע כפי שמתואר, בלי כיוונון.

---

## 4. מה מהמיגרציה **מצטבר חלקית** — להמשיך בלי להשקיע יותר מהנדרש

חלקים שיהפכו לחציים-מיותרים ב-P2P. אין סיבה לבטל אותם, אבל אסור להשקיע בהם מעבר ל"מה שהיום נדרש":

### 4.1 רוב ה-`updateStrategy` (`partialUpdate`, `optimistic`, `fullRefresh`)
היום: השרת אומר ללקוח "תרענן את המפתחות האלה".
ב-P2P: ה-projection מתעדכן אוטומטית כשאירוע חדש נכנס ללוג; אין מי שיגיד
"רענן".

**מעשית**: להמשיך להשתמש ב-`partialUpdate` בקוד החדש (זה אומר משהו פשוט
ונדרש היום). אך **לא להשקיע** ב-`optimistic update functions`
מפותחות — projection הוא optimistic מטבעו. כל פונקציה אופטימית מורכבת
שתכתוב היום, תהפוך למת ב-S2.

### 4.2 חלק מה-QIDs
היום: לכל מוטציה GraphQL יש queId ייעודי.
ב-P2P: כתיבות הופכות לאירועים חתומים — לא צריך queId חדש לכל וריאציה.
קריאות (reads) ימשיכו דרך qids עד S2b ואז יזרמו לרובן מ-projection.

**מעשית**: אל תוסיף queId חדש למוטציה אם תוכל לבטא אותה כ-action config
מהיום הראשון. **כל mutation חדשה צריכה להיות action, לא query.** זה
ישאיר את `qids.js` לקוראים בלבד — שהם הקבוצה היחידה שאמורה לשרוד את
המעבר.

### 4.3 הקבצים שמגרסים תפעול שיוגר ל-projection
דוגמאות: `me/+page.svelte` מגרס balance/scores שב-S2b יבואו מ-projection.

**מעשית**: להמשיך את ההגירה (כדי שיוסר `page.data.tok` בלקוח), אבל
**להשתמש ב-`sendToSer` קיים ולא ליצור pattern חדש**. שכבת ה-`sendToSer`
תהפוך ב-S2b ל"bootstrap fallback" (כש-projection לא טעון עדיין) — לא
ייזרק, רק יותר חסום בשימוש.

---

## 5. מה ב-`PROXY_SECURITY.md` כדאי **לרה-תעדף** או לדחות

הרשימה ב-`PROXY_SECURITY.md §3.5` כוללת 39 קומפוננטות בלי דירוג. עם
ה-P2P באופק, יש סדר עדיפויות חדש שמכפיל את ה-ROI:

### 5.1 קומפוננטות בעדיפות גבוהה (כפליים ערך — אבטחה היום + Phase 1 מחר)
כל קומפוננטה שמבצעת **פעולת הסכמה** — vote, approve, join, leave, create-something-with-consensus, ratify, decide:

- `halukaask.svelte` (כבר נעשה ✅) — דוגמת זהב
- `prPr/hachcal.svelte` (חישוב Tosplit)
- `lev/halukaask.svelte`
- `lev/decisionMaking.svelte`
- `lev/missionInProgress.svelte` (החלטה על השלמה)
- `lev/reqtosherut.svelte` (חוץ מ-chat)
- `addnew/newIwant.svelte` (יצירת Ratson — תהליך הקונסיירז')
- כל פתח/קבל/דחה של pendm/pmash/sheirutpend/matanotpend

**למה כפליים**: כל אחת מהן עוברת ב-Phase 1 שוב — כשהיא הופכת לאירוע
חתום במקביל. כשמיגרת אותן ל-action config עכשיו, את חוסכת את הגיבוש של
`predicateSchema` בעוד חודש. **תכנן את ה-paramSchema כבר היום כך
שיתקשר 1-ל-1 ל-`ConsentEvent.predicate`** — שמות שדות תואמים, טיפוסים תואמים.

### 5.2 קומפוננטות בעדיפות בינונית (ערך אבטחה היום, ערך פחות מצטבר ל-P2P)
פעולות "operational" שלא נושאות הסכמה: עדכון פרופיל, העלאת תמונה, שינוי הגדרות.

- `userPr/edit*` — פרופיל אישי
- `me` (settings)
- `userPr/newsp` (יצירת sp)
- העלאות תמונה ישירות

**הגישה**: לבצע מיגרציה רגילה, בלי לתכנן ל-predicate. אלה הופכים
ל-`personal.update` events בקטגוריה ב' של תכנית ה-P2P (פירוט נתונים
אישיים) — אבל המודל שלהם פשוט יותר ולא דורש תכנון מקדים.

### 5.3 קומפוננטות שאפשר **לדחות**
- **כל מה שהוא chat** (sidequest §3.6 ב-PROXY_SECURITY) — הסיבה הראויה
  ביותר לדחות:
  - הסכמה הנוכחית של `chat` כ-component משובץ ב-entity היא לא רק "ארכאית" — היא
    **תיהפך חסרת-משמעות**. ב-P2P, פורומים הם cluster של אירועי `chat.message`
    בתוך ה-Space. החיווט ל-`createMessage` + relation עתידי לשרת Strapi
    הוא **חוב טכני שייהפך לקוד מת תוך חודשים**.
  - חלופה: השאר את 3 הקבצים `mashsuggest`/`reqtom`/`reqtosherut` עם
    הפנייה הישירה לעוד שלב ביניים (איטר זמני "להפעיל chat דרך action חדש
    שלא משתמש ב-forum entity" — או פשוט להמתין).
- **`projectSuggestornew`** — מסומן "לא בשימוש" ב-checklist; אין סיבה לגעת.

### 5.4 קומפוננטות שצריך **מחדש לתכנן** (קטן)
- **`me/+page.svelte` עם הגדרת `showGuide`** (דוגמה ב-AGENT_ACTION_MIGRATION_GUIDE §3א).
  זה תפעולי טהור, לא הסכמתי. אבל **שדה ב-User entity = נתונים אישיים = קטגוריה ב'**.
  המיגרציה ל-action היום סבירה, אבל לסמן: בעתיד ה-`User.showGuide` ייצא
  מ-Strapi וייכנס ללוג אישי של המשתמש.

---

## 6. חמישה כיוונים מעשיים שמרוויחים את שני העולמות

טיפים קטנים שגוררים את המיגרציה לכיוון שמתקשר עם ה-P2P, בלי לעכב את
ההשקה ובלי לדרוש תכנון מחדש.

### 6.1 `paramSchema` = `predicateSchema` של מחר
כשאת מגרה action חדש, ארגן את ה-params כך שיתקבלו כ-payload לאירוע חתום:

```ts
// במקום
paramSchema: { halukaId, userId, approved, notes }

// תכנן ל:
paramSchema: {
  subject_id: string,      // halukaId
  what: boolean,           // approved
  notes: string | null,
  // userId מובא מ-context.userId (ה-actor של האירוע)
}
```

`subject_id`, `what`, ו-`order` (מהדפוס שתיכננתי ב-event.ts) יסתדרו
ישירות ל-`subject.id`, `predicate.what`, `predicate.order`.

### 6.2 `authRules` שמתאימים ל-projection
`projectMember`/`forumParticipant` הופכים ב-P2P לאינוואריאנטים על
ה-projection ("ה-actor חייב להיות חבר בזמן האירוע"). שמירה על הדפוס
ההצהרתי שלהם (בלי custom code) תאפשר ב-Phase 2 להריץ את אותו האימות
**גם בלקוח** מעל ה-projection — אותה פונקציה, שני קונטקסטים.

### 6.3 כל action חדש מקבל `consentSpec` אופציונלי
הוסף שדה לא-מחייב:
```ts
type ActionConfig = {
  // ...existing...
  consentSpec?: {
    action: ActionName;           // 'haluka.approve'
    subjectType: string;          // 'haluka'
    subjectIdParam: string;       // 'halukaId'  → ConsentEvent.subject.id
    predicateFromParams?: (params) => Record<string, unknown>;
    parentsFromParams?: (params) => string[];
  }
}
```

כש-`consentSpec` קיים, ה-`/api/action` יכול לחתום-בצללית (Phase 1
shadow signing) בלי שינוי בקלייאנט. כך מקבלים shadow signing **בחינם**
לכל action שכבר הוגר.

### 6.4 `updateStrategy: 'projection'` כסוג חדש
תוסיף סוג ל-`UpdateStrategy`:
```ts
{ type: 'projection', config: { projectionKey: 'tosplit' | 'haluka' | ... } }
```
היום זה מתנהג זהה ל-`partialUpdate`. ב-S2b הוא יזהה ש-projection מקומי
זמין ולא יקרא לרשת בכלל. **שורה אחת היום, חיסכון של 80% מהקריאות בעתיד.**

### 6.5 לוג הקריאות של ה-Action System = ה-pre-DAG שלך
ההיסטוריה ב-`MIGRATION_TRACKING.md` של איזה actions יש = רשימת המוצאים
לכל ה-reducers. **השתמש בה כ-source of truth להגדרת ה-action namespaces**:

| action key היום | action name ב-P2P |
|---|---|
| `addVote` (ענף tosplit) | `tosplit.vote` |
| `addVote` (ענף ask) | `ask.vote` |
| `approveHaluka` | `haluka.approve` |
| `createTosplit` | `tosplit.create` |
| `joinRatson` | `ratson.join` |
| `voteOnPendm` | `pendm.vote` |
| ... | ... |

**אפסון**: ב-registry, הוסף שדה optional `actionName` (כמו `consentSpec.action`).
זה הופך את ה-registry ל-canonical source גם לעולם החדש.

---

## 7. נושא חוצה — Action System ↔ MCP

ה-AGENT_ACTION_MIGRATION_GUIDE §1 מזכיר "MCP bot עתידי" כסיבה למיגרציה.
ב-P2P זה רק מתחזק:

- MCP bot ב-P2P = **agent עם זוג מפתחות משלו**.
- כל פעולה שלו = אירוע חתום ב-DAG.
- מודל ההרשאה (`authRules`) הופך לדינמי — המשתמש חותם "אני מאפשר לבוט
  הזה לבצע actions מסוג X" (כמו OAuth scope, רק חתום מקומית).
- זה מתממש כ-`device.cert` עם `capabilities: ['mission.update', 'forum.message']`
  במקום `capabilities: ['sign', 'admin']`.

**מעשית**: ה-Action Registry הופך לטבלת capabilities. AI agents
יקבלו certs מוגבלים ויפעלו דרך אותו endpoint. הקרקע למוצר MCP אמיתי
נבנית כצד-תועלת.

---

## 8. הסיכון של "המיגרציה מחזיקה אותנו אחורה"

ראויה הצגת הצד השני בכנות. שלושה סיכונים אמיתיים:

1. **תכנון יתר של action configs** — אם כל action חדש דורש 3 שעות
   לתכנן את ה-`consentSpec` בנוסף ל-`paramSchema`, יש בלימה.
   **הקלה**: `consentSpec` אופציונלי (§6.3); רק actions של הסכמה דורשים אותו.

2. **קוד `optimistic update` יורד לטמיון ב-S2** — אם בונים אותם בכבד.
   **הקלה**: אל תבנה אותם בכבד (§4.1).

3. **המיגרציה מעמיקה תלות ב-Strapi resolvers ספציפיים** — `addVote.ts:181-250`
   הוא כבר 70 שורות של לוגיקה ספציפית-ל-Strapi. ככל שתסבך, ההחלפה ל-reducer
   תכאב יותר.
   **הקלה**: שמרו את ה-logic ב-pure-function (ללא Strapi) שמופעלת בתוך
   ה-action ולא חלק ממנה. אותה פונקציה תרוץ ב-reducer ב-P2P. זה מה
   ש-`evaluateRatsonConsensus` כבר מתכנן (PLAN_SHARED_PURCHASE §5) —
   נכון לפעולות נוספות גם.

---

## 9. המלצה תמציתית

| תת-משימה | המלצה |
|---|---|
| `/api/auth` proxy + סגירת 4 דליפות JWT | **לסיים השבוע**. אבטחה קריטית, חסרה-תלות ב-P2P |
| `/api/action` בסיסי + AuthorizationEngine | **כבר נעשה** ✅ — לא לגעת |
| נעילת Strapi ל-`127.0.0.1` | **לבצע כשמסיימים את הקומפוננטות בעדיפות גבוהה** (§5.1). חסרון יחיד: עצירה של pure-frontend pull request workflows |
| ראש-קונסיירז' חלוקת `concierge-extract` לפי אורקל (§5.1 ב-CONCIERGE_IN_P2P) | **לקדם** — תיפר תלות גידולית מסוכנת ב-Gemini |
| סגירת raw-query bypass | **השבוע**, לא קשור לרצף |
| מיגרציית כלל הקומפוננטות לפי הרשימה הקיימת | **לרה-תעדף לפי §5**. עדיפות 1 (הסכמתיות) מקבלת תכנון `consentSpec`; עדיפות 2 (תפעוליות) מהיר וקל; דחה sidequest chat |
| מיגרציית chat sidequest (§3.6) | **לדחות** עד S2 או לקחת מסלול עוקף (Yjs / direct event log) |
| `partialUpdate`/`optimistic` complex functions | **לא להעמיק**. השתמש בקיים, אל תרחיב |
| תוספת `consentSpec` ל-`ActionConfig` type | **להוסיף עכשיו** (לא-מחייב); מאפשר shadow signing אוטומטי ב-Phase 1 |
| הוספת `updateStrategy: 'projection'` | **להוסיף עכשיו** (מתנהג כ-partialUpdate היום; הופך לחכם בעתיד) |
| תכנון `paramSchema` למוטציות חדשות | **מהיום**: שמות שדות שמתורגמים ישירות ל-`subject.id` + `predicate.*` |

---

## 10. אבחנה אחת אחרונה

ראיתי הרבה פרויקטים שהפסיקו מיגרציה באמצע "כי תכנון חדש בדרך". זה
תמיד גרם נזק — כי הקוד המעורבב (חצי-הוגר, חצי-לא) מקשה גם על הגירת
המחר וגם על תחזוקת ההיום.

ב-FreeMates המצב הזה לא קיים: המיגרציה הקיימת בונה את אותם abstractions
שה-P2P זקוק להם. **אם אסיים אותה לפי §5–§6, תכנית ה-P2P שלי בקובץ
הראשון תתחיל עם 60% מהעבודה כבר עשויה.** אם אעצור עכשיו, תכנית ה-P2P
תידרש לעשות **קודם** את כל מה שהמיגרציה הזו עושה — וזה אומר עיכוב של
חודשים.

**לא צעד אחורה — כן צעד הצידה. המגירה הזו צריכה להיות פתוחה לכיוון
שבחרת, לא לכיוון שהתחלת איתו.**
