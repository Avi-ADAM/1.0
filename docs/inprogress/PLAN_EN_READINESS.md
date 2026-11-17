# מוכנות ללקוחות באנגלית: רשימת תיקונים

> **סטטוס: inprogress, שלב 1 הושלם.** נכתב 2026-11-17, אחרי מיזוג `main` (`b23abef`). המסמך מסכם
> סריקה של טקסט עברי שנכתב ישירות בקוד, כלומר לא דרך `$t()`. לקוח שהממשק שלו
> באנגלית רואה את הטקסט הזה בעברית. הבדיקות האוטומטיות לא תופסות את זה, כי
> `check:i18n` בודק רק מפתחות קיימים.

## מצב הבדיקות האוטומטיות (עוברות)

| בדיקה | תוצאה |
|---|---|
| `npm run check:i18n` | ✓ 84 קבצי תרגום × 5 שפות. אזהרה: אף מסך לא משתמש ב־`ask` ו־`nuti` |
| `npm run check:script` | ✓ אין מילים שמערבבות אותיות משתי שפות |
| `npm run check:translatable` | ✓ |
| התאמה בין `he` ל־`en` | ✓ אין מפתח חסר ואין טקסט עברי בקבצי `en`. `offerings.storefront.empty` ריק בכל השפות, וזה מכוון |

## מה כבר תוקן ✅

- **`/signup`:** כל המסך עבר ל־`$t('reg.signup.…')`.
- **`/signup/check-email`:** המסך עבר ל־`$t()`.
- **שגיאות ההרשמה:** `+page.server.js` מחזיר `errorKey`, והמסך מתרגם אותו. הטקסט
  העברי שנשאר בשדה `error` משמש רק כשאין מפתח.
- **`JourneyStrip`:** כל המסכים שמשתמשים בו מעבירים `label` מתורגם, כך שברירת
  המחדל העברית לא מוצגת לאף אחד.
- **בוט הטלגרם:** הטקסטים עברו ל־`src/lib/server/telegram/botTexts.js` ב־5 שפות.
- **כרטיסי הלב:** `missionInProgress`, `haluka`, `inpro` ו־`halukaask` תורגמו
  חלקית. מה שנשאר מופיע בשלב 3 בהמשך.

## מה נשאר לתקן

השיטה בכל השלבים: מעבירים כל מחרוזת למפתח JSON בכל 5 השפות, ב־namespace שנטען
בנתיב של המסך. מילון מקומי מהסוג `$lang === 'he' ? {…} : {…}` הוא רגרסיה לפי
ה־CLAUDE.md. אחרי כל שלב מריצים `npm run check:i18n` ו־`npm run check:script`.

### שלב 1: מה שלקוח חדש פוגש ראשון (P0) — ✅ תוקן (2026-11-17)

| # | קובץ | מה היה בעברית | סטטוס |
|---|---|---|---|
| 1.1 | `src/routes/(reg)/concierge/+page.svelte` | שמות החודשים, סטטוסים, "לפני X", ראשי התיבות `'מש'`, `alt="פרופיל"` | ✅ עבר ל־`$t()`: `concierge.status_short.*` ו־`concierge.event.*` חדשים, ומפתחות הזמן הקיימים. תאריכים דרך `toLocaleDateString($lang)` |
| 1.2 | `src/routes/(reg)/concierge/[id]/+page.svelte` | כ־180 שורות: תגיות, "לפני X", הכרוניקה, toasts, שגיאות, כל ה־markup והחלונות | ✅ 0 שורות עברית. `concierge.wp.*` (כ־110 מפתחות). משתנה מקומי `t` ששיבש את `$t` שונה ל־`tgt` |
| 1.3 | `src/routes/(regandnon)/wish/[id]/+page.svelte` | דף **ציבורי**: חודשים, "פורסמה לפני", כותרת ותיאור SEO, הודעת שיתוף, כל ה־markup | ✅ `concierge.pub.*`. נשארו רק נתוני הדמו `MOCK_*` ו־`SUPPORTERS` |
| 1.4 | `src/routes/(regandnon)/wish/[id]/+page.server.ts` | `'משתמש/ת'`, `'מש'`, 404/403, `'(ללא שם)'` | ✅ דרך `serverTranslator(locals.lang)`. מפתחות `common.someone`, `common.someoneInitials`, `common.wishNotFound`, `common.wishNotPublic`, `common.untitled` |
| 1.5 | `src/lib/components/concierge/AcceptWishOffer.svelte` | מילון `{he, en}` מקומי, ובגרסה האנגלית המונח הפסול "weave" | ✅ `deals.acceptOffer.*` ב־5 שפות. "weave" הוחלף ב־"rikma" |
| 1.6 | `src/routes/(reg)/moach/[projectId]/wishes/+page.svelte` | מסננים, תאריכים, כותרות, מצבים ריקים, ו־`dir="rtl"` קבוע | ✅ `moach.wishes.*`. `dir` לפי `$isRtl` |

**באגים שנמצאו ותוקנו בדרך:**

- **פיד קהילה מזויף:** ב־`/concierge`, כשפיד הקהילה היה ריק, הוצגו לכל משתמש משאלות
  דמו בעברית. עכשיו הדמו מוצג רק כשהשאילתה נכשלה (`queryOk.public === false`),
  כמו ברשימה "המשאלות שלי".
- **חלקים, משאבים וערכים מומצאים:** ב־`/wish/[id]`, משאלה אמיתית בלי משימות, משאבים או
  ערכים הציגה במקומם "בייביסיטר", "טיפול ספא" וכו'. עכשיו הדמו מוצג רק כשאין משאלה בכלל.
- **"כבר עמך" מזויף:** ב־`/wish/[id]`, הפאנל הציג אנשים מומצאים ("נועה גולן"…) בכל
  משאלה ציבורית. עכשיו הוא מוצג רק בדמו.
- **קישור שבור:** ב־`/wish/[id]`, כפתור "הצטרפות" הוביל ל־`/register`, שלא קיים
  (404). עכשיו הוא מוביל ל־`/signup`.
- **בדיקה:** ה־mock של `$t` ב־`concierge/[id]/page.svelte.test.ts` פענח רק מפתחות
  ברמה העליונה. עכשיו הוא הולך לפי נתיב, וממשיך לבדוק מול הטקסט העברי האמיתי.

**נתוני הדמו בכל השפות ✅:** `MOCK_MINE`, `MOCK_PUBLIC` ו־`LEV_TIPS` ב־`/concierge`,
ו־`MOCK_WISH`, `MOCK_MISSIONS`, `MOCK_RESOURCES`, `MOCK_VALUES` ו־`SUPPORTERS`
ב־`/wish/[id]`, נבנים עכשיו ב־`$derived` מתוך `concierge.demo.*`, כ־63 מפתחות ב־5 שפות.
- **שמות:** תועתקו לכל שפה, וראשי התיבות מחושבים מהשם המתורגם.
- **תאריכים:** נבנים מ־`toLocaleDateString` על ימים קבועים, שהיום בשבוע שלהם תואם
  לסיפור (חמישי, ראשון, שישי).
- **תקציבים:** עוברים דרך `fmtMoney`, כך שהם מוצגים במטבע של הקורא.
- **אימות:** רינדור זמני של שני הדפים עם מילון האנגלית: אין עברית ואין מפתחות חסרים.

**סטטוס ההצעה ב־`/wish/[id]` ✅:** `{p.status}` הגולמי ממופה ל־`concierge.pub.status.*`
עבור חמשת ערכי ה־enum (`suggested`, `viewed`, `accepted`, `rejected`, `expired`).
`rejected` מוצג למציע כ"לא נבחרה", לפי עיקרון "אין לא מוחלט".

**נמצא בדרך, עדיין פתוח:**
- **"Brains" בתפריט:** ב־`/concierge`, הכפתור שמוביל ל־`/moach` מוצג באנגלית
  כ־"Brains" (`concierge.moach`), ואילו `concierge.new.nav.moach` הוא "Rikmas". צריך לאחד.
- **ריבוי באנגלית:** מופיע למשל "1 Missions", כי המפתחות הקיימים לא מבחינים בין יחיד לרבים.

### שלב 2: הלב והמוח, איפה שחברי רקמה עובדים כל יום (P1)

| # | קובץ | מה מופיע בעברית |
|---|---|---|
| 2.1 | `src/lib/utils/levProcessors.ts:254-346` | הודעות פיד ההחלטות: `'בעד'`/`'נגד'`, `'גרסה ישנה'`, `'ביצע משא ומתן'`, `` `X שעות במקום Y` ``, `'לפי שעה'`, `'סה"כ'`, `'שם … במקום'`, `'תיאור … במקום'`. ה־HTML נבנה כמחרוזת, ולכן צריך להעביר לפונקציה את `t` מבחוץ |
| 2.2 | `src/lib/components/prPr/pendsM.svelte` | כל כותרות הטבלה: `'שם'`, `'תיאור'`, `'כישורים נדרשים'`, `'סוג משימה'`… (נטען מ־`moach/ActionModal` ומ־`MissionModal`) |
| 2.3 | `src/lib/components/prPr/openM.svelte` | `'פעולה פתוחה'`/`'פעולות פתוחות'` וכותרות הטבלה |
| 2.4 | `src/lib/components/prPr/mashmam.svelte` | `'משאבים נדרשים שפורסמו'` וכותרות הטבלה |
| 2.5 | `src/lib/components/lev/cards/pma.svelte` | תוויות ההשוואה במשא ומתן על משאב: `'שם'`, `'תיאור'`, `'מחיר'`, `'שווי מוצע'`, `'כמות'`, `'מיקום'`, `'משאב חוזר'`/`'חד פעמי'` |
| 2.6 | `src/lib/components/lev/cards/haluka.svelte:781-794` | `'בעד'`, `'טרם'`, `'נגד'`, `'סך ההצבעות בעד'`, `'לא הצביעו'` |
| 2.7 | `src/lib/components/lev/cards/inpro.svelte:470-473` | `'הפסקה'`, `'התחלה'` |
| 2.8 | `src/lib/components/lev/halukaask.svelte:333` | `alert('מינימום 20 תווים')` |
| 2.9 | `src/lib/components/lev/missionInProgress.svelte:226` | ההודעה "הטיימר נעצר מפני שמכסת השעות…" שנשלחת לחבר |
| 2.10 | `src/lib/components/timers/TimersCalendar.svelte` | `'משימה ללא שם'` ועוד |

### שלב 3: עסקאות, מוצרים ותהליכים (P1)

| # | קובץ | מה מופיע בעברית |
|---|---|---|
| 3.1 | `src/routes/deals/request/[id]/+page.svelte` | סוגי התשלום (`'מינוי חודשי'`…) וכל הודעות ה־toast (`'הבקשה אושרה'`, `'שגיאה באישור הבקשה'`…) |
| 3.2 | `src/routes/deals/[id]/+page.svelte` | סטטוסים: `'בביצוע'`, `'ממתין לאישור'`… |
| 3.3 | `src/lib/services/dealsService.ts` | אותן תוויות סוגי תשלום. כדאי לאחד ל־`$t()` אחד עם 3.1 |
| 3.4 | `src/routes/negotiation/+layout.svelte`, `src/routes/negotiation/[id]/+page.svelte` | תוויות לשוניות (`'ספקטרום'`, `'הוסף עמדה'`) |
| 3.5 | `src/lib/components/products/MatanotPublicView.svelte`, `MissionPickerList.svelte`, `ResourcePickerList.svelte`, `MissionDetailsModal.svelte`, `ResourceDetailsModal.svelte` | **מוצגים באנגלית** דרך `$lang === 'he' ? … : …`, אבל זה מילון מקומי. אם השפה היא `ar`, `ru` או `es`, הקורא מקבל אנגלית. להעביר ל־JSON |
| 3.6 | `src/lib/components/process/lifecycle/ProcessLifecycle.svelte`, `SaleLifecycle.svelte`, `process/chain/MissionChainRow.svelte`, `ResourceChainRow.svelte` | אותו דפוס בדיוק: מילון `{he, en}` מקומי |

### שלב 4: הודעות מהשרת שמגיעות למשתמש (P1)

| # | קובץ | מה מופיע בעברית |
|---|---|---|
| 4.1 | `src/lib/server/actions/configs/createPersonalMatanot.ts` | `ActionError` בעברית בלבד: `'נדרש מחיר גדול מאפס'`, `'רק חבר רקמה יכול ליצור בה מוצר'`, `'יצירת הרקמה נכשלה'`… להשתמש ב־`context.lang` |
| 4.2 | `src/lib/server/ordersApi.ts:631-717` | הערות על שורות הזמנה (`'שורה N: הווריאנט כבוי'`, `'מכירת-יתר'`, `'דמי המשלוח…'`) |
| 4.3 | `src/routes/signup/+page.server.js:191` | `linkEventSignup` נקרא עם `lang: 'he'` קבוע. צריך להעביר את `locals.lang` |
| 4.4 | `src/routes/signup/+page.server.js:205` | כשיש `err.message`, הודעת JS גולמית מוצגת למשתמש (באנגלית טכנית). עדיף להציג תמיד `errorKey: 'unknown'` ולרשום את ההודעה בלוג |

### שלב 5: דפים משניים ותשתית (P2)

| # | קובץ / נושא | מה צריך לעשות |
|---|---|---|
| 5.1 | `src/routes/about/+page.svelte` | כל הדף בעברית, כולל `<title>`. לתרגם או להסתיר מקוראים שאינם דוברי עברית |
| 5.2 | `src/lib/components/main/tikunolam.svelte` | טקסט ההצהרה כתוב ישירות בקוד |
| 5.3 | `src/hooks.server.js:218`, `getLanguage` | `userAgent.includes('he')` בודק אם המחרוזת מכילה "he". לכן `en-US,en;q=0.9,he;q=0.8` מקבל עברית, ודובר `ar`/`ru`/`es` מקבל `en` במקום השפה שלו. להחליף בפענוח של `Accept-Language` לפי סדר ה־`q` מול `SUPPORTED_LANGS` |
| 5.4 | `src/mastra/agents/*` (`navigation`, `intent`, `timer`, `help`, `sale`) | ההנחיות לסוכנים בעברית. לוודא שיש הוראה מפורשת לענות בשפת המשתמש, ולבדוק שיחה באנגלית |
| 5.5 | `src/lib/translations/{he,en,…}/ask.json`, `nuti.json` | אף מסך לא משתמש בהם. למחוק או לחבר |

## איך מודדים התקדמות

הסקריפט שאיתו נמצאה הרשימה סופר שורות עם 2 אותיות עבריות ומעלה בקבצי
`.svelte/.js/.ts` שמחוץ ל־`translations/`, `generated/` ו־`mail/`, אחרי הסרת
הערות. בשורה התחתונה: 207 קבצי ממשק ו־213 קבצי שרת. הרוב שייכים לקבצים
שאינם בעיה: נתוני דמו (`newobj.js`, `oldobj.js`, `mockDeals.ts`), שמות מדינות
(`signupCountries.js`), פרומפטים של AI, ומילונים מסוג `{ he, en }` לפי שפת
הנמען, שה־CLAUDE.md מתיר. הרשימה שלמעלה היא מה שמגיע בפועל למסך של קורא
באנגלית.

כדאי להוסיף לבדיקות בדיקה בסגנון `check:script` שנכשלת על טקסט עברי ב־markup
של `.svelte` בתוך `src/routes` ו־`src/lib/components`, עם allowlist לקבצים
שמוחרגים בכוונה. כך אי אפשר להכניס רגרסיות חדשות.
