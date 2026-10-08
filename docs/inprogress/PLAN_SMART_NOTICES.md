# התראות חכמות — משפט אחד במקום קלף שלם (hub + קונסיירז')

> **סטטוס: טיוטה, עוד לא התחיל בקוד.** נכתב 2026-10-04; הכרעות §8 נסגרו
> 2026-10-05 — **מתחילים מהקונסיירז'** (ו-deals), ה-hub אחריו.
>
> היום כל דבר שמחכה למשתמש מוצג כקלף מלא: לוגו, טבלת פרטים, מונה זמן,
> הצבעות, צ'אט. ב-hub יש רק `ActionFeed` (חמישה פריטים: אייקון + שם + קישור
> ל-`/lev`), ובקונסיירז' יש פעמון שאומר רק "יש N הצעות למשאלה Z".
>
> **ההצעה:** שכבה אחת של **התראות** (notices) — משפט טבעי אחד לכל דבר שמחכה
> לך, עם שלושה כפתורים:
>
> > בקשה מ**דנה**: להוסיף **5 שעות** למשימה **"עיצוב לוגו"** ברקמה **"סטודיו גפן"**
> > `[ ▸ הרחבה ]` `[ אישור ]` `[ הסתרה ]`
>
> - **הרחבה** — הכפתור **הגדול** (ראשי). פותח את הקלף המלא הקיים (`LevSheet` / העמוד של המשאלה).
> - **אישור** — משני, קטן יותר. אותה פעולה בדיוק שהקלף המלא מבצע, בלי לפתוח אותו.
> - **הסתרה** — מוריד מההתראות. **לא דחייה** (ר׳ §6).
>
> **הטענה המרכזית: המשפט נבנה מתבנית, לא מ-AI.** כל הנתונים כבר מגיעים
> מובנים (מי, כמה, מה, איפה) — `cardKinds.js` כבר מוציא לכל `ani` כותרת,
> תת-כותרת ועד שלוש מספרים לתצוגת הרשימה. התראה היא הצעד הבא של אותו מודול:
> משפט אחד במקום שלוש שורות. AI נשאר אופציה צרה מאוד ומוגבלת (§5).
>
> מסמכים משיקים: [`PLAN_DAILY_DIGEST.md`](../inprogress/PLAN_DAILY_DIGEST.md)
> (הבריף מסכם את אותם פריטים — אותו בונה משפטים צריך לשרת את שניהם),
> [`TIMEGRAMA_REMINDERS.md`](../tbd/TIMEGRAMA_REMINDERS.md),
> [`PLAN_UGC_TRANSLATION.md`](../inprogress/PLAN_UGC_TRANSLATION.md) (שמות
> שמשתמשים כתבו), [`QA_CONCIERGE_E2E_2026-10.md`](../inprogress/QA_CONCIERGE_E2E_2026-10.md).

---

## 0. תקציר

| | |
|---|---|
| **מה נבנה** | מודול טהור `src/lib/notices/` שהופך פריט (DisplayItem של הלב, או הצעה על משאלה) ל-`Notice`: משפט (`$t` key + params), פעולת אישור אופציונלית, יעד הרחבה, מפתח הסתרה. רכיב `NoticeRow.svelte` אחד שמציג אותו. |
| **איפה מוצג** | (1) **ראשון:** הפעמון של הקונסיירז' (`ConciergeBell`, מחליף את "N הצעות") והפעמון המושבת ב-`AppHeader` של deals. (2) hub — מחליף את `ActionFeed`. (3) בהמשך: מצב תצוגה רביעי בלב (`levView: 'notices'`), ופוש/טלגרם/הבריף. |
| **מאיפה הנתונים** | **אין טבלת התראות חדשה בשלב הראשון.** התראה היא *תצוגה של מצב פתוח*, לא יומן אירועים — לכן היא לא יכולה להתיישן. הלב: אותם DisplayItems ש-`initializeLevData` כבר בונה (ה-hub כבר מחמם אותם ב-idle). קונסיירז': `106listMyRatsons`. |
| **מה נשמר** | הסתרות + העדפות סינון (ה-`milon`), בשתי קולקציות חדשות ב-Strapi של **1.0b** (§4.1). |
| **AI** | לא בנתיב הקריאה. רק אם יתברר שחסר משהו שתבנית לא יכולה — ואז נוצר פעם אחת לכל (גרסת תוכן × שפה) ונשמר לפי hash, באותו דפוס של מטמון התרגום (§5). |
| **הכלל החשוב ביותר** | **"אישור" בלחיצה אחת חותם רק על מה שהמשפט הראה.** השרת כבר קורא את הסבב הנוכחי בעצמו — אבל חותם עליו גם אם המשתמש ראה סבב קודם. ההתראה שולחת `expectRound`, והשרת מסרב כשהסבב התקדם (§3.3). |

---

## 1. מה כבר קיים — ממנו בונים

| רכיב | איפה | מה הוא נותן לנו |
|---|---|---|
| `rowContent / rowKindKey / rowCtaKey` | `src/lib/components/lev/cards/cardKinds.js` | בונה לכל אחד מ-~30 ה-`ani` כותרת/תת-כותרת/מספרים כ-`{text}` או `{key, params}` — בדיוק הצורה שהתראה צריכה. ה-builders כבר יודעים לאיזה שדה כל processor שם את השם (`volunteerName`, `recipientName`, `sendname`…). |
| `isCardVisible` + `milon` | `cardKinds.js`, `levStores.ts` | סינון לפי סוג שכבר קיים — ה-"השתק את כל ההתראות מהסוג הזה" כבר בנוי. |
| `rowIsActionable` / `PRIORITY_BAND` | `cardKinds.js`, `levProcessors.ts` | מה עוד מחכה לי (`pl < 700`) ומה כבר הצבעתי עליו. |
| `LevRow` + `LevSheet` | `src/lib/components/lev/list/`, `lev/LevSheet.svelte` | שורה דחוסה + פתיחת הקלף המלא כגיליון. "הרחבה" = `LevSheet`, כבר עובד. |
| `processHubSummary` / `compareFeedItems` | `src/lib/digest/hubSummary.ts` | מה דחוף (`isUrgent`) ובאיזה סדר. |
| `notificationItems` / `ConciergeBell` | `src/lib/concierge/summary.js`, `components/concierge/ConciergeBell.svelte` | הפעמון הקיים — שורה לכל משאלה עם הצעות שמחכות. |
| פעולות הסכמה | `src/lib/server/actions/configs/` | `voteOnPendm`, `voteOnPmash`, `voteOnAskm`, `voteOnMaap`, `voteOnDecision`, `approveHaluka`, `approveSheirutpend`, `acceptRatsonProposal`, `acceptWishOffer`… — "אישור" לא מוסיף אף פעולת שרת חדשה. |
| `NotificationOrchestrator` | `src/lib/server/notifications/` | ערוצי מייל/טלגרם/פוש/socket. היום התבניות שלהם הן `{he, en}` קשיחים לכל action — שלב 6 מאחד אותן עם בונה המשפטים. |
| `ensureVoteForum` + פורומים | actions | "שיחה" על פריט כבר קיימת — אפשר להוסיף כפתור רביעי בעתיד בלי עבודה חדשה. |

**מה חסר באמת:** (א) משפט אחד במקום כותרת+תת-כותרת; (ב) מיפוי `ani → פעולת אישור`
שיוצא *מתוך* הקלפים; (ג) הסתרה שנשמרת בין מכשירים; (ד) צד הקונסיירז' (הצעות
על משאלה) באותה צורה.

---

## 2. המודל — `Notice`

```ts
// src/lib/notices/types.ts
export interface Notice {
  /** יציב ומשתנה כשהתוכן שנחתם משתנה: `${ani}:${id}:v${round}` */
  key: string;
  /** מאיזה עולם: 'lev' | 'wish' */
  source: 'lev' | 'wish';
  ani: string;                       // לסינון milon, לאייקון ולצבע (kindAccent)
  sentence: { key: string; params: Record<string, string | number> };
  /** ההקשר: "ברקמה X" / "במשאלה Y" — חלק מהמשפט, גם משמש לקיבוץ */
  where: { kind: 'rikma' | 'wish'; id: string; name: string };
  deadline: string | null;           // timegrama — אם יש, ההתראה מציגה "עוד 2 ימים"
  urgent: boolean;
  /** null = אין אישור בלחיצה אחת; רק הרחבה */
  approve: ApproveSpec | null;
  expand: { kind: 'sheet'; item: any } | { kind: 'href'; href: string };
  /** silence-is-consent: האם השעון ימשיך לרוץ גם אם יוסתר */
  clockRuns: boolean;
}

export interface ApproveSpec {
  actionKey: string;                 // מפתח מה-registry, לא קוד חדש
  params: Record<string, unknown>;   // בדיוק מה שהקלף שולח
  /** כל המספרים שנחתמים — חייבים להופיע במשפט (§3.3) */
  terms: Record<string, number | string>;
}
```

**מפתח ההסתרה כולל את הסבב.** כשמישהו שולח הצעה נגדית, `standingOrder`
עולה, המפתח משתנה — וההתראה חוזרת. הסתרתי את "בקשה מדנה: 5 שעות"; אם עכשיו
היא מבקשת 8, זה דבר חדש שאני צריך לראות. (אותו עיקרון כמו מטמון התרגום:
תוכן חדש = מפתח חדש, אין קוד ביטול.)

---

## 3. בניית המשפט — תבניות, לא AI

### 3.1 בונה אחד לכל `ani`, ליד `ROW_CONTENT`

`src/lib/notices/sentence.js` — טהור, בלי store, כמו `cardKinds.js`. כל builder
מקבל את ה-DisplayItem ומחזיר `{ key, params }`:

```js
askedcoin: (b) => ({
  key: 'notices.askedcoin',             // "בקשה מ{{who}}: להצטרף ל{{mission}} · {{hours}} שעות × {{rate}}"
  params: { who: b.username, mission: b.openName, hours: b.nhours, rate: b.perhour }
}),
archObject: (b) => b.archive?.kind === 'editObject'
  ? { key: 'notices.editObject.hours', params: { who: …, delta: …, target: b.archive.targetName } }
  : { key: 'notices.archObject', params: { … } },
```

- **ה-fallback הוא `rowContent`:** `ani` בלי builder מקבל "{{title}} — {{subtitle}}".
  כך אין יום שבו סוג חדש בלב נעלם מההתראות. (מבחן כמו `cardKinds.test.ts`
  שעובר על `RENDERABLE_ANIS` ומוודא שלכל אחד יש משפט לא-ריק.)
- **ההבדלים בתוך אותו `ani`** (editObject מול archive, saleClaim מול decision
  רגילה, שינוי שעות מול שינוי תעריף) — נקבעים בהשוואת הגרסה העומדת לגרסה
  הקודמת: `delta = standing.hours − previous.hours`. **זה חישוב, לא הבנת שפה**
  — ולכן לא צריך AI כדי לכתוב "בקשה להוסיף 3 שעות" במקום "בקשה ל-8 שעות".

### 3.2 שפה — חמש שפות, בלי מגדר

- הכול ב-`src/lib/translations/<locale>/notices.json` דרך `$t()`, עם `{{name}}`
  בלבד (לא `{name}`, לא שמות של תו אחד — ר׳ CLAUDE.md §i18n). `npm run check:i18n`
  אחרי הוספת כל namespace/route.
- **אין שדה מגדר ב-User — ולכן ניסוח לא-מגדרי, בלי לוכסנים** (הוכרע 2026-10-05).
  לא "ביקש/ה" ולא "ביקשה"; לא פועל עבר עם נושא. כללי הכתיבה של `notices.json`:

  | במקום | כותבים |
  |---|---|
  | "דנה ביקשה להוסיף 5 שעות" | "בקשה מדנה: להוסיף 5 שעות…" |
  | "אבי הציע לקחת את 'הובלה'" | "הצעה מאבי: לקחת את 'הובלה'…" |
  | "אתה צריך לאשר" / "את מתבקשת" | "מחכה לך" · "לאישורך" · "בשבילך" |
  | "הוא אישר את הגרסה שלך" | "הגרסה שלך אושרה" (סביל) |
  | "התקבל/ה" | "יש הסכמה" / "נחתם" |

  - **מושא ותיאור במקום נושא ופועל:** שם עצם (בקשה, הצעה, אישור, עדכון) +
    מקור (להוסיף, לקחת) + "לך/שלך" — כתובים זהה לזכר ולנקבה בלי ניקוד.
  - **ערבית:** אותו כלל — `طلب من دانا: إضافة 5 ساعات…`, `لك`/`بانتظارك` (זהים בכתיב
    בלי תשכיל). **רוסית:** עבר ממוגדר (`попросил/а`) → `Запрос от Даны: добавить…`.
    **ספרדית/אנגלית:** "Solicitud de Dana: añadir…" / "Dana's request: add…".
  - מבחן: רשימה שחורה של צורות ממוגדרות נפוצות (`ביקש`, `הציע`, `אישר`, `/ה`,
    `попросил`, `предложил`, `طلبت`…) על כל ערכי `notices.json` בחמש השפות.
- שמות שמשתמשים כתבו (שם משימה, שם רקמה, שם משאלה) עוברים דרך שכבת T3
  (`pageTranslations` / `<Translated>`) רק אם המשטח מוגדר ב-`TRANSLATE_SURFACES`.
  אם יוסיפו משטח `notices` — הוא צריך גם שורה ב-`backfillSources.ts`, והמחרוזת
  שנגזרת חייבת להיות **בדיוק** מה שהשם בקלף. (בפועל: שם → אותו hash שהקלף כבר
  משתמש בו; לא מקצרים בנפרד.)
- `npm run check:script` אחרי כל עריכה המונית של התבניות.

### 3.3 כלל ההסכמה: מה שנחתם — כתוב

"אישור" מתוך שורה הוא חתימה. לפי עקרונות-העל, חתימה היא על **הגרסה העומדת**
(standing version) של סבב המו"מ. לכן:

1. `ApproveSpec.terms` מפרט כל מספר שהפעולה חותמת עליו (שעות, תעריף, כמות,
   סכום, אחוז).
2. מבחן יחידה: לכל builder שמחזיר `approve`, כל ערך ב-`terms` מופיע ב-`params`
   של המשפט. builder שלא עומד בזה — נכשל ב-CI.
3. **מה נבדק (2026-10-05):** כמעט כל פעולות ההסכמה **קוראות את המצב הנוכחי
   מהשרת** ולא סומכות על הלקוח — הזיכרון נכון:

   | פעולה | איך נקבע הסבב |
   |---|---|
   | `voteOnPendm`, `voteOnPmash`, `voteOnMaap` | `orderon` = ה-order הגבוה ביותר בהצבעות שב-DB |
   | `voteOnDecision` (saleClaim / archive / edit / stipend) | `standingOrder(claim)` מה-DB; מסרב לחתימה כפולה |
   | `finalizeAskmAcceptance` (בדיקת ההסכמה) | `L` = ה-`ordern` המקסימלי ב-`nego_mashes` מה-DB |
   | `finalizeAskAcceptance` | מממש את הסבב האחרון (`negopendmissions` לפי `ordern:desc`) |
   | `acceptRatsonProposal`, `acceptWishOffer`, `counterRatsonProposal` | `standing(...)` / `isTurnOf` מה-DB |

   **אבל זה פותר רק חצי.** כולן חותמות על *הסבב הנוכחי* — גם אם המשתמש ראה סבב
   קודם. הקלף המלא מתרענן ב-socket ולכן הפער קטן; התראה בפעמון יכולה להיות פתוחה
   שעה. אם בינתיים נשלחה נגדית מ-5 ל-8 שעות, "אישור" על "5 שעות" יחתום על 8.
   - **התיקון (שלב 3, קטן ותוספתי):** פרמטר אופציונלי `expectRound` בכל פעולה
     ברשימה. אם נשלח והוא שונה מהסבב שהשרת חישב → שגיאה מסוג `roundMoved` עם
     הגרסה החדשה, וה-UI מחליף את המשפט במקום ("עודכן: עכשיו 8 שעות") בלי לחתום.
     קלפים קיימים לא שולחים אותו → אותה התנהגות כמו היום.
   - `ApproveSpec.params` **תמיד** כולל `expectRound`; מבחן יחידה אוכף זאת.
4. **שלב 0 — אומת ותוקן (2026-10-05).** ר׳ §7.1 לפירוט. בקצרה: כל נתיבי
   ההצבעה על מועמדות (Ask / Askm) כתבו את רשימת ההצבעות מהעותק של הקלף, וחלקם
   בלי `order`; ו"כולם הצביעו" (`variant:'allVoted'`) היה חישוב של הקלף שהשרת
   קיבל כמו שהוא. עכשיו `src/lib/server/nego/candidacyVote.ts` מחשב הכול מה-DB,
   ו-`expectRound` קיים בכל חמש הפעולות.

### 3.4 מתי *אין* כפתור אישור

| מצב | למה | מה מוצג |
|---|---|---|
| חלוקת רווח (`haluk`) עם כמה שורות | יותר תנאים ממה שמשפט נושא | "הרחבה" בלבד |
| כסף שעובר בעולם האמיתי — "שילמתי" (`stipendpay`, `sitesharepay`, `vidu` צד שולח) | הצהרה על מעשה, לא הסכמה | "הרחבה" |
| "קיבלתי את הכסף" (`stipendconfirm`, `sale` holder) | תביעה על מצב כספי — כן אפשר, **אבל** רק כשהסכום במשפט | אישור + סכום |
| בקשת הצטרפות לרקמה (`walcomen`, `reqtojoin`) | שותף חדש = דילול לכולם | **אישור מותר** (הוכרע) — המשפט כולל את השעות/התעריף, ו"הרחבה" כרגיל הכפתור הגדול |
| `saleClaim`, `stipendProgram` | ההחלטה מציגה לכל מצביע את האחוז *שלו* לפני/אחרי | אפשר — אם האחוז נכנס למשפט |

**ואין כפתור "דחייה" בכלל.** אין "לא" מוחלט. הכפתורים הם הרחבה · אישור ·
הסתרה; "הצעה נגדית" ו"שיחה" חיים בתוך ההרחבה.

### 3.5 היררכיית הכפתורים (הוכרע)

- **הרחבה = הכפתור הראשי והגדול.** מלא, ברוחב שנשאר, ראשון בסדר הקריאה (ימין ב-RTL).
  זה מה שאנחנו רוצים שרוב האנשים ילחצו — לקרוא לפני שחותמים.
- **אישור = משני.** מסגרת בלבד (outline), קטן יותר, אבל לא פחות מ-44px גובה
  (WCAG 2.5.8; זיכרון "lev coin view — older members"). מופיע רק כש-`approve != null`.
- **הסתרה = שלישי.** אייקון בלבד (עין חצויה / ✕), עם `aria-label`, בקצה השורה.
- אחרי אישור השורה לא נעלמת: היא מתחלפת ב"נחתם ✓ · מחכה לשאר" ונשארת עד
  הטעינה הבאה, כדי שלא ייראה כאילו משהו נעלם. אין "ביטול" — לחתימה אין ביטול
  בצד השרת, ומי שרוצה לשנות פותח את ההרחבה ושולח נגדית.

---

## 4. הסתרה — מה זה כן ומה זה לא

1. **הסתרה ≠ דחייה.** היא לא כותבת כלום על הפריט עצמו, לא הצבעה, לא
   `hidden_by_wisher`. היא כותבת רק שורה על *התצוגה שלי*.
   - שימו לב להתנגשות שם: `hideRatsonProposal` (169.8) מסתיר **הצעה מתוך
     המשאלה**. זה דבר אחר — נשאר בעמוד המשאלה, לא בהתראה.
2. **השתיקה ממשיכה להיות הסכמה.** אם `clockRuns` — הסתרה מציגה שורה אחת לפני
   שמבצעים: "ההסתרה לא עוצרת את השעון: אם לא תגיב/י עד יום ג׳, זה יאושר."
   אחרת הסתרה הופכת בשקט ל"אישור בלי לקרוא" — בדיוק הפוך מהכוונה.
3. **שלוש עוצמות:**
   - הסתר את זה (עד גרסה חדשה — ר׳ המפתח ב-§2);
   - הסתר לשבוע (`until`);
   - השתק את כל הסוג הזה → **זה ה-`milon` הקיים**, לא מנגנון חדש.
4. "הצג מוסתרים" — קישור קטן בתחתית הרשימה. שום דבר לא נעלם בלי דרך חזרה.

### 4.1 אחסון ב-Strapi (1.0b, על המחשב הזה) — הוכרע

**היום ה-`milon` לא נשמר בכלל** — `writable({...})` ב-`levStores.ts:859` בלי
localStorage. כל רענון מחזיר את כל המסננים ל-`true`. כלומר המעבר לשרת לא
"מעביר" כלום, הוא נותן לסינון זיכרון בפעם הראשונה.

שתי קולקציות ב-`../1.0b/src/api/`, באותו דפוס של `forum-last-seen` (שורה לכל
משתמש × דבר, `draftAndPublish:false`):

```jsonc
// notice-dismissal — שורה לכל התראה שהוסתרה
{ "noticeKey": "string",          // `${ani}:${id}:v${round}` (unique עם המשתמש)
  "until":     "datetime",        // null = עד גרסה חדשה
  "users_permissions_user": manyToOne → user }

// notice-pref — שורה אחת למשתמש
{ "milon":   "json",              // { hachla:true, fiap:false, … } — אותו מבנה כמו היום
  "mutedProjects": "json",        // [projectId] — "השתק את הרקמה הזאת" (בהמשך)
  "users_permissions_user": oneToOne → user }
```

- **שתי הרשאות** לכל קולקציה (Authenticated + ה-API token) — זיכרון
  "new collection needs 2 grants". `validate:qids` לא תופס query שגוי, רק mutations.
- **אסור לסנן על שדה private** (זיכרון "no filtering on private fields") — אף
  שדה כאן לא private.
- actions חדשים: `dismissNotice`, `restoreNotice`, `saveNoticePrefs` — כולם
  `{type:'self'}` + `access` ב-manifest. qid קריאה אחד שמחזיר את שתיהן.
- ה-`milon` נטען מהשרת פעם אחת לכניסה, נשמר ב-debounce; עד שהוא נטען —
  ברירת המחדל של היום (הכול `true`). localStorage כמטמון בלבד.
- **ניקוי:** שורת הסתרה שהמפתח שלה לא מופיע באף פריט פתוח, או שה-`until` שלה
  עבר — נמחקת בקרון היומי של ה-digest. אין קוד invalidation בנתיב החם.
- **סדר פריסה:** 1.0b קודם (`deploy.ps1`), ואז `npm run types:update` כאן, ואז
  הקוד. קוד שקורא קולקציה שלא קיימת → נופל חזרה לברירת המחדל בלי שגיאה למשתמש.

---

## 5. AI — רק אם צריך, ורק פעם אחת

**ההערכה: בשלב 1–4 לא צריך AI בכלל.** כל משפט נבנה ממספרים ושמות שכבר
מובנים. המקומות היחידים שתבנית מתקשה בהם:

| מקום | אפשר בלי AI? | אם בכל זאת AI |
|---|---|---|
| הצעה נגדית ששינתה כמה תנאים | כן — diff של שדות: "העלתה תעריף ל-60 והורידה ל-4 שעות" | — |
| הערה חופשית שמישהו צירף להצעה (`note`) | מציגים 80 תווים ראשונים במרכאות | תמצית של שורה אחת |
| קיבוץ ("3 הצעות חדשות על המשאלה Z, הזולה 400₪") | כן — אגרגציה | — |
| תיאור משאלה ארוך בבריף | `excerpt()` קיים | תמצית |

**אם יוחלט על AI לתמצית (שלב 7, אופציונלי):**

- מפתח מטמון = `hashSource(normalizeForHash(text))` + שפה + `purpose:'noticeGist'`
  — **בדיוק** הדפוס של מטמון התרגום. טקסט שלא השתנה לא נשלח פעמיים, אף פעם.
- נוצר **בכתיבה** (כשההצעה נוצרת — ה-action של היצירה מזמין תמצית), לא בקריאה.
  דף שנטען לא מפעיל מודל לעולם.
- עובר דרך ה-governor הקיים של התרגום (מכסה יומית, `TRANSLATE_STATE_DIR`) — לא
  מנגנון מכסות שני.
- בלי מכסה / בלי מפתח / כשל → ה-fallback הוא 80 התווים. אין מצב שהתראה לא
  מוצגת כי מודל לא ענה.
- מודל: Gemini Flash (המפתח הקיים) — זו תמצית של משפט, לא grounding.

---

## 6. המשטחים — לפי סדר הבנייה

### 6.1 הקונסיירז' (ראשון — שלבים 2–3)

הפעמון כבר קיים ב**ארבעה** מקומות — `concierge/+page.svelte`,
`concierge/[id]/+page.svelte`, `WishForm.svelte` (שמשרת את `concierge/new` ואת
`wish/new`) — וכל מה שהוא יודע להגיד הוא "N הצעות למשאלה Z" + קישור. זה המקום
שבו הכי מעט עבודה נותנת הכי הרבה, ובדיוק המשטח שנמצא ב-QA לפני השקה.

שני כיוונים, שני קהלים:

| מי | התראות | אישור בלחיצה |
|---|---|---|
| **מבקש/ת המשאלה** | הצעה חדשה · הצעה נגדית · "החלק התקבל" · שעון השתיקה עומד להבשיל | `acceptRatsonProposal` על הגרסה העומדת + `expectRound` |
| **מציע/ה (ספק/מתנדב)** | ההצעה שלך אושרה · הצעה נגדית · המשאלה התממשה | `acceptWishOffer` על הגרסה של הצד השני + `expectRound` |

- `notificationItems` ב-`summary.js` נשאר **מקור האמת לספירה** (הבאדג' בפרופיל
  ובפעמון חייבים להסכים — זה כבר תנאי במבחן הקיים). לצידו `wishNotices(nodes, uid)`
  שבונה `Notice[]` מאותם nodes של `106listMyRatsons` — בלי שאילתה נוספת. אם
  חסרים שדות (`ratson_willingness_entry`, הגרסה העומדת) — מוסיפים אותם ל-qid 106,
  לא qid חדש.
- `ConciergeBell` מקבל `Notice[]` ומציג `NoticeRow`; הפאנל נשאר באותו מקום
  ובאותו עיצוב (`--cg-*` tokens, זיכרון "Concierge palette").
- הצעות כפולות מאותו מציע על אותה משאלה → שורה אחת עם הגרסה האחרונה.
- "הסתרה" כאן ≠ `hideRatsonProposal` (ר׳ §4, סעיף 1).

### 6.2 deals — הפעמון המושבת (שלב 3)

`AppHeader.svelte:38` — כפתור התראות מוכן עם `notif-dot`, **בהערה**, עם
`TODO: re-enable once the notifications button actually does something`. הוא
מוצג רק ב-`/deals/*` (`deals/+layout.svelte`). מחברים אותו לאותו `NoticeList`:

| התראה | מקור קיים | אישור |
|---|---|---|
| מועמד/ת לחלק פתוח בעסקה שלך — מחכה לחתימתך (C-19, `negoGate.clientIds`) | `417dealOpenOffers` / `readDealOffers` | כן, על הגרסה העומדת |
| שינוי מוצע בעסקה | `400dealEdits` | כן |
| תשלום שמגיע ממך | `loadDealDue` | **לא** — תשלום בעולם האמיתי, רק הרחבה |
| ספק/ית מחכה לאישור שקיבלת את החלק | `confirmDealPartReceived` | כן — הסכום במשפט |

- היום הקריאות האלה רצות **לכל עסקה בנפרד** ב-`deals/[id]/+page.server.ts`.
  לפעמון צריך אותן לכל העסקאות הפתוחות של המשתמש: `deals/+layout.server.ts`
  מחזיר promise מוזרם (`streamed.notices`) שמריץ אותן על העסקאות הפתוחות; אם
  זה יותר מכמה קריאות — qid מאוחד אחד (`dealNotices`), לא N קריאות לכל ניווט.
- הפעמון של deals והפעמון של הקונסיירז' הם **אותו רכיב** (`NoticeBell`) עם
  מקורות שונים. כשמשתמש/ת גם מבקש/ת משאלות וגם קונה/ה — שני הפעמונים מציגים
  את שני המקורות (משאלה ועסקה הן אותו דבר מצד הלקוח אחרי `materializeWish`).

### 6.3 hub (שלב 4)

- `ActionFeed` (חמישה פריטים עם אייקון) → `NoticeList`: כל מה שמחכה לך,
  ממוין לפי `compareFeedItems` (דחוף → דדליין קרוב → מחכה הכי הרבה זמן),
  מקובץ לפי רקמה/משאלה כשיש יותר מ-2 מאותו מקום. כולל גם את התראות המשאלות
  והעסקאות מ-6.1/6.2.
- **מקור הנתונים:** היום ה-hub טוען `85levHubSummary` (ספירות + מזהים) ובמקביל
  מחמם את נתוני הלב ב-idle (`initializeLevData`). ההתראות נבנות מאותם
  DisplayItems ברגע שהם מוכנים; עד אז — ה-`topFive` הקיים כ-skeleton.
  **לא מוסיפים שאילתה שלישית.** אם ההמתנה ל-query 83 ארוכה מדי ב-hub, אז (ורק
  אז) מוסיפים qid רזה שמחזיר רק את השדות שהמשפטים צריכים.
- KPI, הבריף היומי, מפת הביקוש — נשארים.
- בדסקטופ: הרשימה בעמודה הראשית; "הרחבה" פותחת את `LevSheet` בצד (Portal ל-body —
  זיכרון "lev overlays must Portal").

### 6.4 הלב (שלב 5)

`levView` מקבל ערך רביעי `'notices'` לצד `list | cards | coins`. אותו
`LevCard` dispatch להרחבה; `cardKinds.js` הוא עדיין החוזה. (זיכרון "Lev view
modes": סוג חדש ⇒ גם `cardKinds.js`.)

### 6.5 רענון חי

ה-socket כבר מחובר לכל משתמש מחובר (`+layout.svelte`, `socketClient.onNotification`).
התראה שמגיעה ב-socket על פריט שמוצג → מסמנים את השורה "עודכן" ומרעננים רק את
המקור שלה (`invalidate` של ה-loader הרלוונטי). זה מקטין את חלון ה"סבב זז" עוד
לפני ש-`expectRound` צריך לתפוס אותו.

### 6.6 ערוצים חיצוניים (שלב 6)

אותו `sentence.js` מרנדר בשרת בשפת **הנמען** (טוען את ה-JSON של השפה שלו —
זה המקרה המותר ל-multi-locale בשרת). מחליף את ה-`templates: {he, en}` הקשיחים
ב-`NotificationConfig` בהדרגה, action אחרי action:

```ts
notification: { notice: { ani: 'askedcoin', fromParams: … }, channels: ['push', 'telegram'] }
```

- פוש/טלגרם: "אישור" שולח deep-link חתום (`/n/<token>`) שפותח את האתר עם השורה
  מסומנת — **לא** מאשר מתוך הטלגרם. חתימה צריכה סשן.
- הבריף היומי מציג את חמשת המשפטים הראשונים במקום כותרות.

---

## 7. שלבים

| שלב | מה | קבצים עיקריים | בדיקה |
|---|---|---|---|
| **0** ✅ | **תיקוני שרת שלא תלויים בהתראות** (בוצע, §7.1): אימות החשד ב-`finalizeAskmAcceptance` (`partial` בלי `order`) ו-lost update ב-`voteOnAskm`; תיקון אם מאומת. | `configs/finalizeAskmAcceptance.ts`, `configs/voteOnAskm.ts` | מבחן: הצבעה של חבר אחר בין טעינה ללחיצה נשמרת; `order` נשמר |
| **1** ✅ | (בוצע, §7.2) המודול הטהור: `Notice`, `sentence.js` — קודם סוגי המשאלה והעסקה (`wishProposal`, `wishCounter`, `wishOffer`, `dealOffer`, `dealEdit`, `dealPart`, `dealDue`), ואז שמונת סוגי הלב הנפוצים + fallback. `notices.json` ב-5 שפות בניסוח לא-מגדרי. | `src/lib/notices/*`, `translations/*/notices.json`, `translations/index.js` (route gate: concierge, wish, deals, hub, lev) | "כל `RENDERABLE_ANIS` מקבל משפט לא-ריק"; `terms ⊆ params`; רשימה שחורה של צורות ממוגדרות; `check:i18n`, `check:script` |
| **2** ✅ | (בוצע, §7.3 — בלי וידוא בדפדפן) קונסיירז': `wishNotices()`, `NoticeRow`/`NoticeBell` בארבעת מקומות הפעמון — **הרחבה בלבד**. | `concierge/summary.js`, `components/notices/*`, `ConciergeBell.svelte` | `ConciergeBell.svelte.test.ts` מורחב; וידוא בדפדפן RTL/LTR |
| **3** ✅ | (בוצע, §7.4 — ממתין לפריסת 1.0b) **אישור + הסתרה + deals:** `expectRound` בפעולות של §3.3; `approveSpec.js` שגם הקלפים משתמשים בו; 1.0b: `notice-dismissal` + `notice-pref`; actions `dismissNotice`/`restoreNotice`/`saveNoticePrefs`; הפעמון ב-`AppHeader` חוזר לחיים. | `configs/*`, `notices/approveSpec.js`, `../1.0b/src/api/notice-*`, `AppHeader.svelte`, `deals/+layout.server.ts` | אותם params כמו הקלף; סבב ישן ⇒ `roundMoved`; QA C-19 |
| **4** ✅ | (בוצע, §7.5) hub: `NoticeList` במקום `ActionFeed`, משלב לב + משאלות + עסקאות. | `hub/+page.svelte`, `components/notices/*` | וידוא בדפדפן, מצב כהה, דסקטופ |
| **5** ✅ | (בוצע, §7.6 — בלי שמירת milon) `levView: 'notices'` בלב; `milon` נקרא מ-`notice-pref`. | `levStores.ts`, `LevViewSwitch.svelte`, `lev/+page.svelte` | `cards.svelte.test.ts` |
| **6** | ערוצים: בונה המשפטים בשרת, `NotificationConfig.notice`, deep-link חתום, הבריף. | `server/notifications/*`, `digest/compose.ts` | מבחני orchestrator |
| **7** *(אופציונלי)* | תמצית AI להערות חופשיות, cached לפי hash, דרך ה-governor. | `server/notices/gist.ts` | אותו טקסט ⇒ קריאה אחת למודל |

שלבים 1–2 לבד כבר נותנים פעמון קריא בקונסיירז', בלי שום שינוי בשרת או ב-Strapi.

### 7.1 שלב 0 — מה נמצא ומה תוקן (2026-10-05)

| # | איפה | מה היה | השפעה | תיקון |
|---|---|---|---|---|
| 1 | `voteOnAskm` | `order` + `existingVotes` מהלקוח, נכתב כרשימה שלמה | הצבעה של חבר אחר מאז הטעינה **נמחקה**; "לא" נרשם בסבב שהקלף חשב | קורא `getAskmForFinalize`, סבב עומד מה-DB |
| 2 | `finalizeAskmAcceptance` (`partial`) | `vots` מ-`existingVotes` **בלי `order`** | אחרי הצעה נגדית **כל** ההצבעות ירדו לסבב 0, מתחת ל-`L` שהשער סופר ממנו | `evaluateCandidacyVote` |
| 3 | `finalizeAskmAcceptance` (`solo`/`allVoted`) + `finalizeAskAcceptance` + `finalizeJoinAcceptance` | "כולם הצביעו" = `noofpu === noofusersOk` של הקלף | מימוש מיידי על סמך ספירה של הלקוח — קלף ישן, או קריאה ישירה ל-API, עוקפים את ה-restime של שאר החברים | השרת בודק `allMembersYes` (כל חבר מלבד המועמד אמר כן לסבב העומד, ואין "לא"); אחרת — נרשמת הצבעה והשעון רץ |
| 4 | `runResourceAskmAcceptance.normalizeVotes` | ארכוב עם `vots` בלי `order`/`ide`/`zman` | תיעוד "מי חתם על איזו גרסה" נמחק ברגע הסגירה | שומר את כל השדות; לא מוסיף את המאשר פעמיים |
| 5 | `addVote` (`type:'ask'`) | רשימה מהקלף; ה-"כן" החדש **בלי `order`** | "כן" על תנאים שעברו מו"מ נרשם בסבב 0 ולא נספר | DB + סבב עומד; בודק שה-ask שייך ל-`projectId` |
| 6 | `finalizeJoinAcceptance` | `user_1s` נכתב מ-`existingMemberIds` של הקלף | חבר שהצטרף מאז שהקלף נטען **הוסר מהרקמה** | רשימת החברים מה-DB |

נוסף:

- `expectRound` (אופציונלי) ב-`voteOnAskm`, `finalizeAskmAcceptance`,
  `finalizeAskAcceptance`, `finalizeJoinAcceptance`, `addVote(ask)` →
  `ActionError('ROUND_MOVED', …, { expected, standing })`. **הקלפים הקיימים לא
  שולחים אותו** בכוונה: ה-`orderon` שלהם הוא ה-`order` המקסימלי בהצבעות, לא ה-
  `ordern` של הסבבים, ובשורות שהבאג (2) כבר שיטח הם שונים. ההתראות (שלב 3) ישלחו
  את `L` האמיתי.
- `ActionError` עבר ל-`src/lib/server/actions/errors.ts` כדי ש-config יוכל לזרוק
  אותו (מ-`ActionService` זה היה import מעגלי). שגיאה רגילה מגיעה ללקוח בפרודקשן
  כ-`INTERNAL_ERROR` בלי הודעה; עכשיו יש `ROUND_MOVED`, `ALREADY_RESOLVED`, `FORBIDDEN`.
- **סוקט:** פעולות ה-askm מחזירות `updateStrategy: refetchScope` על
  `askedResources` של הרקמה, כך שהקלפים הפתוחים אצל שאר החברים נטענים מחדש ברגע
  שמישהו מצביע — במקום להישאר עם העותק הישן ולחתום עליו. (`refetchScope` היה
  מטופל ב-`levSocketHandler` אבל לא היה קיים בטיפוס של השרת ואף פעולה לא
  השתמשה בו.) צד המשימות (`asked`) עוד בלי qid לפרוסה — נשאר `fullRefresh` /
  `appendVote`, עכשיו עם ה-`order` הנכון.
- `reqtom.svelte`: הצבעה "חלקית" יכולה עכשיו להשלים את ההסכמה (אם כולם אישרו
  מאז הטעינה) — הקלף קורא `materialized` מהתשובה.
- מבחנים: `nego/candidacyVote.test.ts`, `configs/finalizeAskmAcceptance.test.ts`.

**לא נגעתי:** `signDealOffer` (משתמש ב-`allowed`/`gate` כמו קודם — המשמעות של
`allowed` לא השתנתה, `allMembersYes` הוא שדה נפרד); נתיב השתיקה
(`api/timegrama/ask|askm`) — רץ לבד ולא דרך הפעולות האלה.

**לבדוק בשטח:** שורות askm שכבר נפגעו מ-(2) — `order` שלהן 0 למרות שנחתמו על
סבב מאוחר. אין להן תיקון אוטומטי (אי אפשר לדעת על איזה סבב נחתמו); ההשפעה היא
שהן לא נספרות עד שמישהו מצביע שוב — כלומר הסכמה נדחית, לא נכפית.

---

### 7.2 שלב 1 — מה נבנה (2026-10-05)

`src/lib/notices/` — טהור, בלי `$t()` ובלי store:

| קובץ | מה |
|---|---|
| `types.ts` | `Notice`, `ApproveSpec`, `NoticeTerm`; `termKey` (מספרים דרך `lev.list.fact.*` כשיש, אחרת `notices.term.*`); `ROUND_GUARDED_ACTIONS` |
| `wish.ts` | `wishNotice(s)` — מקבל את `negotiationView` שהקונסיירז' כבר מחשב. סוגים: `wishOffer`, `wishCounter`, `wishInvite`, `wishProduct` |
| `deal.ts` | `dealNotices` — מ-`readDealOffers`, `readDealEdits`, `loadDealDue`, `PartsView`. סוגים: `dealOffer`, `dealEdit`, `dealDue`, `dealPart` |
| `lev.ts` | `levNotice(s)` — משפט ל-`pends`, `pmashes`, `askedcoin`, `askedm`, `fiapp`, `wegets`, `wishoffer`, `hachla`, `archObject`; כל השאר דרך `rowContent` |
| `index.ts` | `compareNotices` (הסדר של `compareFeedItems`), `mergeNotices` |
| `notices.test.ts` | 24 מבחנים |

הכרעות שנפלו תוך כדי:

- **"בקשה להוסיף N שעות"** הוא חשבון: `standingChanges(archive)` כבר מחשב את ההפרש
  בין הסבב העומד לאובייקט. שינוי של שעות משימה בלבד → `addHours` / `removeHours`
  (+ `One` לשעה אחת, כי "1 שעות" שגוי בכל השפות); יותר משדה אחד → "בקשה לשנות" + הערכים החדשים.
- **`subject`** (שדה חדש): על מה ההתראה, בלי קשר לגרסה ולמקור — `proposal:<id>` גם
  מהקונסיירז' וגם מ-`wishoffer` בלב, `candidacy:ask|askm:<id>` גם מהלב וגם מהעסקה.
  `mergeNotices(wish, deal, lev)` משאיר אחד, מהמקור העשיר (הלב לא יודע סבב ותור).
- **אישור משאלה תמיד דרך `acceptRatsonProposal`** — היא מעבירה בעצמה ל-`acceptWishOffer`
  במסלולים הנכונים, ו-`WishOfferCard` כבר עושה כך.
- **שתיקת לקוחה אינה הסכמה** — לאף התראת עסקה אין `clockRuns`, גם כשיש לה דדליין
  (שעון החברים, להקשר בלבד).
- **בלי מספרים — בלי אישור בלחיצה.** אם המשפט לא מראה מה נחתם, `approve: null`.
- **מה שהכרטיס שלו רק "צפייה"** (`rowCtaKey === view`: טיימר פעיל, ברוכים הבאים,
  צבירת מלגה) — לא התראה. אותו קו שהכפתור של השורה כבר מותח.
- **רוסית: השם ראשון** — "{{who}}: запрос — …". אחרי "от" שם צריך יחסת genitive
  ("от Даны"), והשמות מה-DB לא מוטים.
- המרחב `notices` מוגבל ל-`/concierge`, `/wish`, `/deals`, `/hub`, `/lev`.

**פתוח לשלב 3:** `expectRound` כבר נשלח ב-`ApproveSpec.params` של משאלות ועסקאות,
אבל `acceptRatsonProposal`, `signDealEdit`, `signDealOffer`, `confirmDealPartReceived`
עוד לא בודקות אותו (פרמטר לא מוכר פשוט מתעלמים ממנו). לפני שמציגים כפתור אישור —
להוסיף להן את `assertStandingRound` ולהכניס ל-`ROUND_GUARDED_ACTIONS`. ל-candidacy
של עסקה אין מונה סבבים ב-view; המפתח שלה משתמש בערכים עצמם (`figuresStamp`).
אישור מהלב (`approve` בהתראות `lev`) — שלב 3, דרך `approveSpec` שגם הקלף ישתמש בו.

---

### 7.3 שלב 2 — מה נבנה (2026-10-05)

| קובץ | מה |
|---|---|
| qid `421myWishNotices` | כל הצעה פתוחה (`suggested`/`viewed`) שהמשתמשת צד בה — `asWisher` (בעלת המשאלה) ו-`asProvider` (מציעה). `$idL` נקשר למשתמשת המחוברת ב-/api/send. במקום להרחיב את 106 (60 משאלות × 100 הצעות). |
| qid `422wishRestimes` | הקצב (`restime`) של כמה משאלות בבת אחת — בנפרד, כמו 388: backend בלי השדה שובר את הדדליין (ברירת מחדל 48ש׳), לא את השורות. |
| `src/lib/server/concierge/notices.ts` | `loadWishNotices` — 421 + 394 (מה שהוסתר) + 422 → `negotiationView` → `wishNotices`. `toWishNoticeInputs` טהור ונבדק. **כשל ⇒ `null`, לא `[]`**: "אין כלום בשבילך" ו"לא הצלחנו לבדוק" הם שני דברים. |
| `src/lib/notices/render.ts` | `resolveNoticeText` (כולל תוויות מקוננות ומספרים בשפת הקוראת), `resolveTerm`, `formatDeadline` |
| `components/notices/NoticeRow.svelte` | משפט · פרטים · מספרים · "ללא תגובה — יאושר אוטומטית: …" · **הרחבה** (הכפתור הראשי, מילוי ה-metal של `.btn-jewel`, ≥44px) |
| `ConciergeBell.svelte` | prop `notices`. מערך → שורות התראה; `null` → חוזר לספירות לפי משאלה (הקיים). הנקודה: לפי ההתראות כשיש. |
| 4 loaders + 4 עמודים | `/concierge`, `/concierge/[id]`, `/concierge/new`, `/wish/new` (ו-`WishForm`) — מתחיל ראשון, נאסף אחרון, במקביל ל-`loadBell` |

מבחנים: `server/concierge/notices.test.ts` (8), `notices/render.test.ts` (8),
`ConciergeBell.svelte.test.ts` (+4). `check:proxy`, `check:i18n` עוברים; אין
שגיאות טיפוסים בקבצים שנגעתי בהם.

**אומת ב-Chrome מול נתונים אמיתיים (2026-10-05).** ה-Strapi נעול ונפתח רק עם
מפתח ייעודי, שתוסף ב-Chrome מוסיף — לכן קריאה ישירה מהמחשב (סקריפט, curl,
חלונית הדפדפן של האפליקציה) נגמרת ב-timeout, ובדיקה חיה עוברת דרך Chrome.
ב-`/concierge`: 421 החזירה שורות (אין שדה שגוי), הפעמון מציג שלוש התראות
אמיתיות — הצעה נגדית עם "2 שעות · מחיר 100" ו"ללא תגובה — יאושר אוטומטית: יום ב׳
20:47", ושתי הצעות מוצר. "הרחבה" מנווטת ל-`/concierge/9#proposal-10`.
מה שהבדיקה גילתה ותוקן:
- **"Asus :"** — שם הרקמה שמור עם רווח בסוף, ושם לטיני במשפט עברי משך את
  הנקודתיים לצד הלא נכון. `render.ts` חותך ועוטף כל מילה של אדם ב-FSI…PDI.
- **העוגן לא היה קיים** — לכרטיס ההצעה בעמוד המשאלה נוסף `id="proposal-<id>"`,
  `scroll-margin-top` ומסגרת `:target`; ו-`$effect` שגולל אליו ברגע שהוא קיים
  (הכרטיסים נבנים אחרי הגלילה של SvelteKit ל-hash).
- **לא אומת:** הגלילה עצמה — הלשונית של Chrome הייתה ברקע (`visibilityState: hidden`),
  ושם אפילו `window.scrollTo` לא זז. הניווט והכרטיס הנכון (`:target`) כן אומתו.

**פער ידוע:** `ConciergeBadge` (בפרופיל) עדיין סופר כל הצעה פתוחה, והפעמון מראה
רק את מה שהתור בו שלך. הצעה שהגשת עליה נגדית — הבאדג' סופר, הפעמון שקט. ליישר
את הבאדג' להתראות (שלב 3).

---

### 7.4 שלב 3 — מה נבנה (2026-10-05)

**הבדיקה שהתנאים לא זזו — בכל פעולה שהתראה יכולה לאשר:**

| פעולה | מה נבדק | שגיאה |
|---|---|---|
| `acceptWishOffer`, `acceptRatsonProposal` (מסלול מתנדב) | `expectRound` מול `standing(...).round` | `ROUND_MOVED` |
| `signDealEdit` (דרך `signObjectChange`, פרמטר חדש) | `expectRound` מול `standingOrder(decision)` | `ROUND_MOVED` |
| `signDealOffer` | `expectRound` מול `L` (נוסף `round` ל-`DealCandidacyView`) | `ROUND_MOVED` |
| `confirmDealPartReceived` — אין סבבים | `expectAmount` מול החלק שלה (`mine.due`) | `AMOUNT_MOVED` |

`ROUND_GUARDED_ACTIONS` מכיל עכשיו את כל עשר הפעולות; מבחן אוכף שכל `approve` של
התראה הולך דרך אחת מהן **ונושא** `expectRound`/`expectAmount`.

**כפתורים ב-`NoticeRow`:** הרחבה (ראשי, רחב) · אישור (מסגרת, משני — רק כשיש
`approve` מוגן) · הסתרה (אייקון). אחרי אישור: "נחתם ✓ — מחכה לשאר", והעמוד נטען
מחדש אחרי 2.5ש׳. `ROUND_MOVED`/`AMOUNT_MOVED` → "התנאים השתנו מאז — כדאי לפתוח…",
לא חתימה. הסתרה של התראה עם שעון רץ שואלת קודם: "ההסתרה לא עוצרת את השעון: ללא
תגובה, זה יאושר אוטומטית: …". מוסתרות — שורה מקוצרת עם "החזרה", מאחורי "הצגת מוסתרות (N)".

**הסתרה והעדפות:**
- 1.0b: `src/api/notice-dismissal` (`noticeKey`, `until`, user) ו-`src/api/notice-pref`
  (`milon`, `mutedProjects`, `lastSeenAt`, user) — קשרים חד-כיווניים כמו
  `decision.archMember`, בלי לגעת בסכמת ה-user. **לא מחויב ולא נפרס.**
- qids 423 (קריאה, `$idL`) ו-424–427 (כתיבה, שרת בלבד).
- actions: `dismissNotice`, `restoreNotice`, `saveNoticePrefs` (`noticePrefs.ts`) —
  המשתמשת תמיד `context.userId`, מחיקה רק של שורות שנקראו כשלה.
- `applyDismissals` (טהור) + `loadNoticePrefs` (שרת, אף פעם לא נכשל — בלי הקולקציות:
  "שום דבר לא מוסתר").

**הפעמון של deals:** `AppHeader` — הכפתור שהיה בהערה הוא עכשיו `ConciergeBell` עם
`loadDealNotices`: `fetchActiveDealRefs` (רק 123) → 8 העסקאות האחרונות →
`readDealPieces` לכל אחת. **`readDealPieces` הוא עכשיו גם מה שעמוד העסקה קורא**
(`deals/[id]/+page.server.ts` שוכתב עליו) — הפעמון והעמוד לא יכולים לחלוק על מה פתוח.
המחרוזות של הפעמון עברו ל-`notices.bell.*` (ה-namespace `concierge` לא נטען ב-/deals).

**הבאדג' בפרופיל:** `withNoticeUpdates` — "עדכונים" = התראות משאלה גלויות (התור שלך,
לא מוסתרות); כשל בהתראות → הספירה הישנה.

**אומת ב-Chrome:** בפעמון הקונסיירז' "אישור" מופיע רק על ההצעה הנגדית (יש מספרים
וסבב), לא על הצעות המוצר; הסתרה שואלת עם האזהרה, וביטול לא מסתיר. בפעמון deals:
`dealNotices` חזר `[]` (קריאה הצליחה) — תואם "ממתין לאישורך 0" בעמוד. עמוד עסקה
(`/deals/7`) נטען אחרי השכתוב. **לא לחצתי "אישור"** — זו חתימה אמיתית בחשבון.

**לפני שזה עובד בפרודקשן:**
1. 1.0b: commit + `deploy.ps1`.
2. Strapi admin → **Roles → Authenticated**: `find`, `create`, `update`, `delete` על
   `notice-dismissal`; `find`, `create`, `update` על `notice-pref`.
3. **API Tokens → הטוקן של השרת**: אותן הרשאות.
4. כאן: `npm run types:update` — עד אז `validate:qids` מתריע על 424/426/427 (אזהרה, לא שגיאה).

עד שלב 1–3 של הרשימה: הסתרה מחזירה שגיאה (toast), וכל השאר עובד.

**לא נעשה (נדחה לשלב 4/5):** אישור מתוך התראות הלב (`approveSpec` שהקלפים ישתמשו בו) —
התראות הלב עוד לא מוצגות בשום מקום.

---

### 7.5 שלב 4 — ה-hub (2026-10-05)

- **`HubNotices.svelte`** במקום `ActionFeed`, מיד אחרי ה-KPI (גם בדסקטופ וגם בטלפון),
  **וגם במסלול "משתמש חדש"** — לקוחת קונסיירז' נחשבת "חדשה" ב-hub ועדיין יכולות לחכות
  לה הצעות.
- **שלושה מקורות, רשימה אחת:** הקונסיירז' והעסקאות מהשרת (`streamed.notices`,
  מתחיל אחרי ה-summary כמו הבריף, וההעדפות נקראות פעם אחת לשלושתם); הלב — בדפדפן,
  מ-`finalSwiperArray`, שה-hub ממילא מחמם ל-/lev (אין שאילתה נוספת). `mergeNotices(wish,
  deal, lev)` → `groupNotices`. מסונן לפי ה-`milon` השמור של המשתמשת.
- **עד שנתוני הלב מגיעים** — ה-`ActionFeed` הישן מוצג במקומם (fallback).
- התראת לב "הרחבה" מחוץ ללב → `/lev?focus=<ani>&project=<id>` (ה-deep link הקיים);
  `onexpand` נשאר לפתיחה במקום, בלב עצמו (שלב 5).
- **`groupNotices`** — שורות זהות (אותו משפט, מספרים ומקום) מתקפלות לשורה אחת עם
  "×N"; הסתרה מסתירה את כולן. מה שיש עליו אישור לא מתקפל לעולם.
- 6 שורות ואז "עוד N".
- ה-promise של השרת נקרא ל-state ב-`$effect`, לא ב-`{#await}` (אחרי אישור הוא מתחלף).

**אומת ב-Chrome מול נתונים אמיתיים:** 56 התראות → 49 אחרי קיפול (×4 "דיווח מאת Asus על
מסירת 'עלות שרת'", ×2 נוסף); ההצעה הנגדית מהקונסיירז' ראשונה עם "אישור"; התראות לב
כמו "בקשה מאת יענקלה מהשוק - טסט להצטרף למשימה '…' ברקמה '1💗1'" · 500 שעות · 550 לשעה.
בטעינה אחת query 83 של הלב נכשלה ב-500 מהשרת ("fetch failed" ל-Strapi) — ה-fallback
הציג את הפיד הישן כמתוכנן, וההתראות מהקונסיירז' הגיעו בכל זאת.

**שים לב:** 49 התראות הן הרבה — רובן דיווחי מסירה ישנים של משאבים שמחכים להצבעה שלך
בלב. ה-hub מראה את מה שהלב מראה; אם רוצים פחות, זה סינון של הלב (milon) או ניקוי של
פריטים ישנים, לא של ההתראות.

---

### 7.6 שלב 5 — תצוגת התראות בלב (2026-10-05)

- **`levView` מקבל `'notices'`** (רביעי ב-`LevViewSwitch`, אייקון בועת דיבור,
  `lev.list.toNotices` ב-5 שפות; נשמר ב-localStorage כמו שאר התצוגות).
- **מצב של `LevList`, לא רכיב חדש** — `variant: 'rows' | 'notices'`: אותם פריטים, אותו
  סינון (milon/רקמה/focus), אותו `LevSheet`. "הרחבה" פותחת את הקלף של הפריט במקום;
  מקופלות ×N; מוסתרות מאחורי "הצגת מוסתרות". שורת התראה בגובה טבעי (לא `--lev-row-h`).
- ההסתרות נקראות בדפדפן (qid 423 דרך `sendToSer`; כשל = "שום דבר לא מוסתר").
  `readNoticePrefs` עבר ל-`$lib/notices/prefs.ts` (טהור) כדי שגם הדפדפן יקרא אותו.

**הוכרע תוך כדי — ה-milon לא נשמר בשרת.** התכנית (§4.1) אמרה להעביר אותו לשרת. בפועל
ה-milon הוא **סינון רגעי**: "הצג רק X" מכבה כל סוג אחר (`filterShowonly`). לשמור אותו
כמו שהוא = חברה שסיננה פעם "רק הצבעות" רואה, בכל מכשיר ובכל ביקור מעכשיו, רק הצבעות —
בלב וגם ב-hub — בלי שום סימן שמשהו מסונן. זה בדיוק "משהו נעלם בלי דרך חזרה". לכן:
השדה `notice-pref.milon` שמור ל**השתקה מכוונת** של סוג ("לא להציג לי יותר X"), כשתהיה
פעולה כזו בממשק; ה-hub כבר מכבד אותו. הסינון הרגעי נשאר מקומי.

**אומת ב-Chrome:** רשימה→התראות, מטבעות→התראות, וכניסה ישירה ללב כשהתצוגה השמורה היא
התראות — 48 שורות בכל אחד; "הרחבה" פותחת את הקלף ("אישור העברת כספים — העברה 41").
**לא שוחזר:** בניסיון הראשון הלשונית נתקעה (>45ש׳) מיד אחרי המעבר להתראות, ולשונית
נוספת נתקעה בטעינה. אחרי זה — אותם מעברים בדיוק עברו בלי תקיעה, והפונקציות עצמן על
145 הפריטים האמיתיים: 1ms; 48 `NoticeRow` נטענו ב-26ms; `LevList` במצב התראות ב-48ms.
ההשערה: הטעינה הראשונה אחרי הרבה שינויים בקבצים (Vite מקמפל/מבצע אופטימיזציה מחדש)
יחד עם query 83 בלשונית ברקע. **אם זה קורה לך — לא להתעלם**: לפתוח DevTools → Performance
ולשלוח לי.

---

### 7.7 כלי "מה ממתין לי" — MCP והצ'אט (2026-10-06)

בקשת המשתמש: שאלות כמו "מה חדש היום", "מה ממתין לי", "מה קורה ברקמה X" — בצ'אט של האתר
ובכל לקוח MCP.

- **`getMyUpdatesTool`** (`src/mastra/tools/myUpdatesTool.ts`, ב-`toolManifest`:
  `tier: 'read'`, `project: 'scope'`, `scopedOutput: ['waiting']`). מחזיר:
  - `waiting` — כל פריט **משפט מוכן בשפת המשתמש** + מספרים מנוסחים, איפה, דדליין,
    `silenceApproves`, ×N, וקישור מלא לענות בו. אותם משפטים כמו ה-hub והפעמונים.
  - `work` (משימות, משימות לפני רדימות, מטלות פתוחות/באיחור), `whatsNew` (חדש ברקמות מאתמול),
    `suggestions`, `hiddenCount`, `unavailable` (מה שלא נקרא — "לא נבדק", לא "ריק").
  - סינון: `projectId`, או `rikma` = חלק משם הרקמה.
- **המנוע:** `src/lib/server/notices/updates.ts` — `loadMyUpdates`. אין חישוב חדש:
  קריאות הבריף היומי (`startDigestReads`: הצבעות ב-feed של 85, עבודה, חדש, התאמות) +
  `loadWishNotices` + `loadDealNotices` → `mergeNotices` → `groupNotices`.
  - **הצבעות הרקמה** מגיעות מה-feed של 85 (`src/lib/notices/hub.ts`, `hubFeedNotice`) —
    query 83 של הלב היא הכבדה באתר ורק עמוד דפדפן מריץ אותה. המשפט קצר יותר ("מועמדות
    למשימה: 'X' ברקמה 'Y'") מזה של הלב.
  - **מתורגמן שרת** (`src/lib/server/notices/translate.ts`) — אותם JSON של העמודים,
    `{{name}}`, נפילה לעברית, לעולם לא מפתח גולמי.
- **"דלת"** (`src/lib/server/notices/door.ts`): הצ'אט של האתר רץ על הסשן (`$idL` נקשר
  לעוגייה); מפתח MCP אין לו סשן, ו-/api/send קושר `$idL` לסשן גם בטוקן השירות — לכן
  תאומי `$uid` (qids 428–431, `serviceTwin`, serviceAdmin בלבד) של 421/394/423/123.
  כל ה-loaders קיבלו `door` אופציונלי (ברירת מחדל `session` — שום דבר קיים לא השתנה).
- **הצ'אט:** סוג כוונה חדש `updates` ב-`intent-agent` (דוגמאות בעברית ובאנגלית) ובכל
  ה-`z.enum` של `chat-workflow`; `updates-agent.ts` (הכלי + `findUserProjectsTool`,
  הוראות: להעביר את המשפטים כמו שהם, דחוף קודם, לומר בקול מה השתיקה תאשר ומתי, קישור,
  אין "דחייה"); גיבוי מילות מפתח כשהכוונה לא מתפענחת ("מה חדש", "ממתין לי", "what's new"…).
  גם `reg-bot` קיבל את הכלי.
- **מבחנים:** `notices/updates.test.ts` (11 — הדלת, המתרגם, השורות, הסינון, הסתרה),
  `myUpdatesTool.test.ts` (4 — דלת לפי סוג הקורא, צמצום לפי מפתח מוגבל).

**לא אומת חי:** בבדיקה ב-Chrome הצ'אט החזיר שגיאה — `Gemini: "This model is currently
experiencing high demand"` (פעמיים) — עומס אצל המודל, לפני הכלי. לנסות שוב.

**נמצא בדרך (מחוץ להיקף, נפתחה משימה נפרדת):** `/api/chat` לוקח את `userId` מגוף
הבקשה ולא מ-`locals.uid`, ומריץ את הכלים כ-`isInternalBot` (בדיקות בעלות מרוככות). הכלי
החדש מוגן — קורא דרך דלת הסשן, ש-/api/send קושר לעוגייה — אבל כלים אחרים שמשתמשים
ב-`uid: ctx.userId` עלולים לפעול בשם משתמש שהשולח רק כתב.

**פער קטן:** מפתח ההתראה של הצבעה מה-hub הוא `v0`, ושל אותו פריט בלב — הסבב האמיתי.
הסתרה מתוך תצוגת ההתראות בלב (`…:v2`) לא תסתיר אותו בתשובת הכלי (`…:v0`). ליישר כשה-feed
של 85 יכלול את הסבב.

---

## 8. הכרעות (2026-10-05)

1. **סבב ישן** — נבדק (§3.3): השרת קורא את הסבב הנוכחי בעצמו, אבל חותם עליו
   גם אם המשתמש ראה סבב קודם. `expectRound` נוסף; שלב 0 מצא ותיקן שישה
   נתיבים שכתבו הצבעות מהעותק של הקלף (§7.1).
2. **ניסוח** — לא-מגדרי, בלי לוכסנים: שם עצם + מקור + "לך/שלך" (§3.2).
3. **הצטרפות שותף חדש** — אישור מותר; "הרחבה" תמיד הכפתור הגדול (§3.5).
4. **ה-milon וההסתרות** — לשרת, ב-Strapi של 1.0b (§4.1). היום ה-milon לא נשמר בכלל.
5. **סדר** — קונסיירז' ו-deals קודם (שני פעמונים שכבר קיימים ולא מנוצלים), ה-hub אחריהם.

נשאר פתוח: האם "חדשות שאינן מחכות לך" ("ההצעה שלך אושרה") צריכות יומן קטן,
או שמספיק לגזור אותן מהמצב (סטטוס `accepted` שעוד לא נראה, לפי `forum-last-seen`-style
`lastSeenAt`). ההמלצה: הגזירה, עם `lastSeenAt` אחד ב-`notice-pref`.

---

## 9. מה לא עושים

- **לא** טבלת "notifications" שנכתבת בכל action ונקראת ב-hub. יומן אירועים
  מתיישן, מכפיל כל פריט, ודורש סנכרון "נקרא/לא נקרא" עם המצב האמיתי. התראה כאן
  היא *שאלה* על מצב פתוח — כשהמצב נסגר, ההתראה נעלמת מעצמה. (חדשות שאינן
  מחכות לך — "ההצעה שלך התקבלה" — הן חריג שייתכן שיצטרך יומן קטן בשלב 4/6;
  נחליט כשנגיע.)
- **לא** כפתור "דחה". בשום שורה.
- **לא** AI בנתיב הקריאה, ולא AI למשפט שאפשר לחשב.
- **לא** מסלול `$t` חלופי לטקסט של הפלטפורמה דרך שכבת T3.
- **לא** להעתיק את ה-params של פעולה לתוך `NoticeRow` — רק דרך `approveSpec.js`
  שהקלף עצמו גם משתמש בו.
