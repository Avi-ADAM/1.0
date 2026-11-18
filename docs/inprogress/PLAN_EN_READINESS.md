# מוכנות ללקוחות באנגלית: רשימת תיקונים

> **סטטוס: שלבים 1–5 הושלמו, ממתין לפריסה.** נכתב 2026-11-17, עודכן 2026-11-18,
> אחרי מיזוג `main` (`b23abef`). המסמך מסכם סריקה של טקסט עברי שנכתב ישירות
> בקוד, כלומר לא דרך `$t()`. לקוח שהממשק שלו באנגלית רואה את הטקסט הזה בעברית.
> הבדיקות האוטומטיות לא תופסות את זה, כי `check:i18n` בודק רק מפתחות קיימים.

## מצב הבדיקות האוטומטיות (עוברות)

| בדיקה | תוצאה |
|---|---|
| `npm run check:i18n` | ✓ 87 קבצי תרגום × 5 שפות, 184 נקודות כניסה, 50 מנותבים, בלי אזהרות יתומים |
| `npm run check:script` | ✓ אין מילים שמערבבות אותיות משתי שפות — 3409 קבצים נסרקו |
| `npm run check:translatable` | ✓ 20 שדות ב־8 ישויות תואמים לסכימה שנוצרה |
| `npm run check:ui-hebrew` | ✓ אין עברית ב־markup — 177 רכיבים ב־20 תיקיות + רכיב יחיד (`tikunolam`) |
| התאמה בין כל 5 השפות | ✓ אין מפתח חסר, פלייסהולדר חסר או עברית מחוץ ל־`he` ב־`server`, `about`, `tikunolam`, `shop.order.note`, `bot.card` |
| `npm test` | ✓ 7301 עברו; 54 כישלונות זהים לריצת הבסיס על אותם קבצים ב־`HEAD` הנקי (קיימים מראש), 2 דולגו |

`npm run check` המלא נופל ב־OOM בסביבת הסנדבוק בגלל גודל הריפו (גם עם
`--max-old-space-size=3200`). לכן הורצו `svelte-check` ממוקדים לכל התיקיות
והקבצים שנגענו בהם: `src/lib/chat`, `src/routes/about`,
`src/lib/components/shop`, `src/routes/signup` ו־`tikunolam.svelte` — כולם
החזירו 0 שגיאות. `npm run build` מגיע לשלב ה־postbuild ודורש סודות פריסה
(`ADMINMONTHER`, מפתח AI, טוקן טלגרם); בסנדבוק אין אותם.

## מה כבר תוקן ✅

- **`/signup`:** כל המסך עבר ל־`$t('reg.signup.…')`.
- **`/signup/check-email`:** המסך עבר ל־`$t()`.
- **שגיאות ההרשמה:** `+page.server.js` מחזיר `errorKey`, והמסך מתרגם אותו. בשלב 4
  הוסר גם שדה `error` הגולמי: הודעות JS/Strapi נרשמות רק בלוג.
- **`JourneyStrip`:** כל המסכים שמשתמשים בו מעבירים `label` מתורגם, כך שברירת
  המחדל העברית לא מוצגת לאף אחד.
- **בוט הטלגרם:** הטקסטים עברו ל־`src/lib/server/telegram/botTexts.js` ב־5 שפות.
- **כרטיסי הלב:** `missionInProgress`, `haluka`, `inpro` ו־`halukaask` תורגמו
  חלקית. מה שנשאר מופיע בשלב 3 בהמשך.

## מה נשאר אחרי שלבים 4–5

בשלבים 4–5 לא נשאר טקסט פלטפורמה עברי שמגיע למסך או להודעת שרת בלי תרגום
לחמש השפות הנתמכות. השיטה שבה נעשה שימוש: מעבירים כל מחרוזת למפתח JSON בכל
5 השפות, ב־namespace שנטען בנתיב של המסך. מילון מקומי מהסוג
`$lang === 'he' ? {…} : {…}` הוא רגרסיה לפי ה־CLAUDE.md; יוצאי הדופן הם
payload-ים של התראות שנשלחות לפי שפת הנמען, ומוסברים בשלב 4. אחרי כל שלב
הורצו `npm run check:i18n` ו־`npm run check:script`.

נשארו שני סוגי שיירים שאינם טקסט חדש על המסך: הערות הזמנה ישנות שנשמרו
כטקסט עברי נשארות כפי שנכתבו (רק הערות חדשות נשמרות כמרקרים), וקוד ישן שאיננו
מחובר — שלושת קבצי השירות עם מפות `{ he, en }` ושם ברירת המחדל
ב־`dealDue.ts`, כמתואר בסוף שלב 3.

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
- ~~**"Brains" בתפריט:**~~ ✅ אוחד בשלב 2: `concierge.moach` עודכן ב־5 שפות (`Rikmas` / `الريكمات` / `Рикмы` / `Rikmas`).
- ~~**ריבוי באנגלית:**~~ ✅ (2026-11-18) ~178 מחרוזות `en` שנשאו מונה (`{{count}} missions`, `{{hours}} hours`, `{{value}} partners`…) נכתבו מחדש בתחביר ה־modifier של ה־parser: `{{count; 1:{{count}} mission; default:{{count}} missions;}}`, כולל התאמת פועל היכן שהמשפט דורש (`1 order is` / `2 orders are`, `1 part still has`). נשארו בכוונה: מספרים סודרים (`Participant {{count}} adds…`) ו־`harmony_hint` ("all N parties", תמיד ≥2).
  - **שרת:** `serverTranslator` (`src/lib/server/notices/translate.ts`) מפעיל עכשיו את אותו `@sveltekit-i18n/parser-default` שהדפים מפעילים (במקום regex של `{{name}}`), כך ש־modifier ב־`notices`/`lev`/`common`/`server`/`shop` לא מגיע גולמי ל־MCP / push / צ׳אט. בדיקה: `translate.test.ts`.
  - **`plural`:** modifier משותף ב־`src/lib/translations/modifiers.js` (רשום גם בקונפיג של הדפים וגם בשרת) שבוחר צורה לפי `Intl.PluralRules` — `{{count:plural; one:…; few:…; many:…; other:…;}}`.
  - **רוסית:** 27 מחרוזות גלויות שהיו `{{count}} <שם עצם ברבים גניטיב>` (`{{value}} партнёров`, `Минимум {{count}} символов`, `каждые {{count}} лет`…) עברו ל־`:plural` עם 1 / 2-4 / 5+. רוב שאר המחרוזות הרוסיות כבר עוקפות ריבוי בתבנית `Существительное: N` או בקיצור (`ч.`, `дн.`, `мин.`) ונשארו.
  - **עדיין פתוח:** ערבית (0/1/2/3-10/11+) — עוד לא הוסבה; ה־`:plural` מוכן לה. ספרדית: אותו מבנה כמו אנגלית (`1:` / `default:`), לא הוסבה. רכיבים שמרכיבים מספר + `$t('…missions')` בקוד (לא במחרוזת אחת) לא נסרקו.
  - `npm run check:i18n` בודק עכשיו גם תקינות בלוקי modifier (`;}}` חסר, `:` שני בתוך ערך, modifier לא מוכר, שם קצר מ־2 תווים בראש בלוק).

### שלב 2: הלב והמוח, איפה שחברי רקמה עובדים כל יום (P1) — ✅ תוקן (2026-11-17)

| # | קובץ | מה היה בעברית | סטטוס |
|---|---|---|---|
| 2.1 | `src/lib/utils/levProcessors.ts`, `src/lib/stores/levDerived.ts` | הודעות פיד ההחלטות/הצבעות/משא ומתן ותגיות מקור (קונסירג׳, מאגד ביקוש) ב־7 מעבדים | ✅ `TranslateFn` מועבר ריאקטיבית מ־`levDerived.ts` (`$t`). מפתחות `lev.feed.*` + `mash.*` ב־5 שפות, בריחת HTML (`escHtml`), תיקון באג `vote.what === false` ב־`processPmashes`, ובדיקת יחידה `levProcessors.i18n.test.ts` לכל 5 השפות |
| 2.2 | `src/lib/components/prPr/pendsM.svelte` | כותרת הטבלה, כל עמודות הטבלה וכותרות כפתורים/SVG | ✅ `moach.tables.*` ו־`common.hours` ב־5 שפות, `dir={$isRtl ? 'rtl' : 'ltr'}`, תאריכים לפי `$lang`, שינוי שם משתנה לולאה `t` ל־`idx` |
| 2.3 | `src/lib/components/prPr/openM.svelte` | `'פעולה פתוחה'`/`'פעולות פתוחות'`, עמודות הטבלה וכותרות כפתורים | ✅ `moach.tables.*` ב־5 שפות, `dir` לפי `$isRtl` |
| 2.4 | `src/lib/components/prPr/mashmam.svelte` | `'משאבים נדרשים שפורסמו'`, כותרות עמודות, סוגי משאב ויחידות חיוב | ✅ `moach.tables.*` + `mash.*` ב־5 שפות, `dir` לפי `$isRtl` |
| 2.5 | `src/lib/components/lev/cards/pma.svelte` | השוואת משא ומתן, תדירות/מיקום, כותרות, טיימר, הערות hover, פירוט מחיר/שווי, ספירת הצבעות | ✅ `lev.cards.pma.*` + מפתחות גלובליים קיימים ב־5 שפות, `changes` עבר ל־`$derived`, חץ וצל לפי `$isRtl` |
| 2.6 | `src/lib/components/lev/cards/haluka.svelte` | `'בעד'`, `'טרם'`, `'נגד'` וטולטיפי hover | ✅ `lev.cards.voteCard.*`, `lev.cards.common.against`, `vots.{totalin,totalno}`, צל לפי `$isRtl` |
| 2.7 | `src/lib/components/lev/cards/inpro.svelte` | `'הפסקה'` / `'התחלה'` במילון מקומי לפי `$lang === 'he'` | ✅ `lev.cards.inpro.{pause,start}` ב־5 שפות, צל לפי `$isRtl` |
| 2.8 | `src/lib/components/lev/halukaask.svelte` | `alert('מינימום 20 תווים')` | ✅ `$t('lev.diun.minChars', { count: 20 })` ב־5 שפות |
| 2.9 | `src/lib/components/lev/missionInProgress.svelte` | התראות טיימר (`10%`, `5%`, `5 דק׳`, `1 דק׳`, עצירה), שגיאות אימות/העלאה, וברירת מחדל `'לביצוע'` | ✅ `lev.missionInProgress.*`, `moach.progress.uploadFailed`, `lev.cards.inpro.taskLink` ב־5 שפות |
| 2.10 | `src/lib/components/timers/TimersCalendar.svelte` | `'משימה ללא שם'`, כותרות, סטטיסטיקות, מקרא, טולטיפ ומודאל פרטים, ו־`locale: 'he'` קבוע | ✅ `timers.cal.*` ב־5 שפות, `locale: $lang` ו־`direction` ריאקטיבי לפי `$isRtl`, בריחת HTML בטולטיפ |

**תפיסות ובאגים נוספים שתוקנו על הדרך ב־לב, מוח, `prPr` וטיימרים (0 עברית חשופה בסריקה חוזרת):**

- **טופס יצירת משימה ברוסית וספרדית (`prPr/mission.svelte`):** `missionByLang` כלל רק `{ he, en, ar }` ונפל חזרה לעברית ב־`ru`/`es`. נוספו `ruMission` ו־`esMission`.
- **טבלאות ורכיבי `prPr` נוספים:** `betaha.svelte` (טבלת פעולות בביצוע), `negoM.svelte` ו־`negoPend.svelte` (שדות גשר המו״מ), `chosNed.svelte`, `tasks/Myacts.svelte`, `tasks/taskModal.svelte`, `tasks/chooseM.svelte`, `choosMission.svelte`, `gantt/gant.svelte`, `sheirut/sheirutShow.svelte`, ותיקון ג׳יבריש קידוד (`'—'`) ב־`Kanbanboard.svelte`.
- **כרטיסים ורכיבי הלב הנוספים:** `welcomTo.svelte` (הסרת טקסט תועה `שי` בתחילת הקובץ), `lev/+page.svelte`, `cards/{CardHeader,VoteStatusDisplay,SaleCard,CustomerSaleCard,SheirutHalukaCard,hachlata,fini,rektom}.svelte`, `{diun,didiget,mesima,pandingMesima,pmas,fiappru,mashsuggest,reqtojoin,weget,projectSuggestor,sv}.svelte`.
- **צ׳אט וסטורים:** `celim/messeges.svelte` (זמנים יחסיים עברו ממילון `{he,en,ar}` ל־`common.chat.*` ב־5 שפות ו־`dir="auto"`), `stores/pendMisMes.js` (כותרות העברה/מכירה בצ׳אט) ו־`stores/pgishot.js` (`common.chat.meetingCreated`).
- **טיימרים:** `timers/timer.svelte` (`aria-label` של הפעלה/עצירה/עריכה ותצוגת שעות — כולל תיקון היפוך מונה/מכנה באנגלית דרך `timers.proHoursOf`) וכותרת `routes/(reg)/timers/+page.svelte`.
- **נתיבי המוח ודפי הזדמנויות:** 15 תגיות `<title>` ב־`moach/[projectId]/**` עברו ל־`moach.layout.*`, סטטוסי מחזיק כסף ב־`sales/[saleId]`, שגיאות וחץ RTL ב־`chains/[chainId]`, `ProcessCreator.svelte`, `object/[type]` (תאריכים ב־`$lang`), `moach/[projectId]/wishes/+page.server.ts` (`serverTranslator`), ותגיות מאגד ביקוש / קונסירג׳ ב־`availableMission/[id]` ו־`availiableResorce/[id]`.

### שלב 3: עסקאות, מוצרים ותהליכים (P1) — ✅ תוקן (2026-11-17)

| # | קובץ | מה היה בעברית | סטטוס |
|---|---|---|---|
| 3.1 | `src/routes/deals/request/[id]/+page.svelte` | סוגי התשלום (`'מינוי חודשי'`…), כל ה־toast, תגי הסטטוס, כרטיסי הפרטים, `dir="rtl"` קבוע, ותאריך בפורמט `d.m.y` | ✅ `deals.request.*`; סוגי התשלום קוראים ל־`deals.kind*` הקיימים; תאריכים דרך `toLocaleDateString($lang)`; `dir` לפי `$isRtl` |
| 3.2 | `src/routes/deals/[id]/+page.svelte` | `STATUS_LABEL`, שני ה־toast, הודעות „לא נמצאה”, תגי קונה/מוכר, תאריכי התחלה וסיום ושלושת מדדי הכותרת | ✅ ממופה ל־`deals.statusInProgress` / `statusCoordination` / `pendingApproval` / `statusDone` הקיימים, ונוספו `deals.dealPage.*` |
| 3.3 | `src/lib/services/dealsService.ts` | סוגי תשלום, ציר הזמן, שמות הצדדים, „אתה”/„לקוח”, וכותרות האישורים הממתינים | ✅ מקבל `TranslateFn` (`$t`) כמו מעבדי הלב בשלב 2, עם `identityT` כברירת מחדל; `/deals` ו־`/deals/[id]` מעבירים `$t` ריאקטיבית. המפתחות: `deals.service.*` |
| 3.4 | `src/routes/negotiation/+layout.svelte`, `[id]/+page.svelte` | כותרת הדף, מטא־תגיות השיתוף, תוכן קורא־המסך, תוויות הלשוניות, צירי הספקטרום, מצבי הריק והכפתורים העליונים; `dir="rtl"` בכל ששת השורשים | ✅ `negotiation.layout.*` ו־`negotiation.view.*`; השאר משתמש במפתחות הקיימים (`spectrum`, `add_position`, `overall_consensus`…); `onMount` שהוסיף `document.title` הוחלף ב־`<title>` ב־`svelte:head` |
| 3.5 | `src/lib/components/products/MatanotPublicView.svelte`, `MissionPickerList.svelte`, `ResourcePickerList.svelte`, `MissionDetailsModal.svelte`, `ResourceDetailsModal.svelte` | חמישה מילונים מקומיים `$lang === 'he' ? … : …` — קורא ב־`ar`/`ru`/`es` קיבל אנגלית | ✅ namespace חדש `products` (101 מפתחות × 5 שפות): `view.*`, `mission.*`, `resource.*`, `missionDetails.*`, `resourceDetails.*`. נשמר ב־`routes.js` ל־`/lev`, `/gift`, `/deals`, `/moach/<project>` |
| 3.6 | `src/lib/components/process/lifecycle/{ProcessLifecycle,SaleLifecycle}.svelte`, `process/chain/{MissionChainRow,ResourceChainRow}.svelte` | מילוני `{he, en, ar}` מקומיים (בלי `ru`/`es`) + טרנרים `lang === 'he' ? 'ארכיון' : 'Archived'` בכל תג | ✅ `moach.lifecycle.*`, `moach.saleLife.*`, `moach.chainMission.*`, `moach.chainResource.*`; ריבוי „הצעה אחת/הצעות” דרך `offersOne`/`offersMany` במקום „1 offers” |

**שכבות נוספות שנוקו בדרך (0 עברית חשופה ב־markup בכל התיקיות האלה):**

- **מסך מרכז המכירות** (`routes/deals/sales-center/+page.svelte`): תשעה טרנרים `$lang === 'he' ? … : …`
  (toast של מכירה, שיתוף מוצר, העתקת קישור, רענון, שם פרויקט לא מזוהה, ושני באנרים של דיווחים
  ממתינים) — `pages.salesCenter.*` + `deals.cycles.*`. הריבוי עבר למפתחות `claimsMineOne/Many`
  ו־`claimsWaitingOne/Many`, כי `דיווח/דיווחים` ו־`report/reports` אינם אותו דבר.
- **`routes/deals/+page.svelte`**: כותרת והסבר של „הוראות קבע” — `deals.cycles.titleCustomer` / `subCustomer`.
- **`src/lib/components/sales/SaleComponent.svelte`**: ארבע שורות של „לקוח (אופציונלי)” נכתבו
  ב־`$lang === 'en' ? … : עברית`, כלומר `ar`/`ru`/`es` קיבלו עברית. הן עברו למפתחות
  `sales.shopSkin.*` **שכבר היו קיימים** ולא היו מחוברים.
- **`src/lib/components/process/ProcessChainView.svelte`, `chain/{ActsGroup,AsksNode,ChainConnector}.svelte`,
  `lifecycle/LifecycleStation.svelte`, `VoteRounds.svelte`**: אותה משפחת מילונים; עברו ל־`moach.chainView.*`,
  `moach.actsGroup.*`, `moach.asksNode.*`, `moach.voteRounds.*`, וחץ המחבר + כיווניות לפי `$isRtl`.
  תאריכים ומספרים לפי `$lang` במקום `en-GB`/`en-US` קבועים.
- **`src/routes/negotiation/[id]/+page.server.js` + `[id]/+page.svelte`**: שני מסרי שגיאה בעברית
  הוחלפו ב־`errorKey` (`discussion_not_found`, `error_loading`), **והמסך מחובר אליהם** —
  `serverError` נגזר מה־`data.errorKey` ומוצג ב־toast השגיאה הקיים (אפשר לסגור אותו).
- **`src/lib/negotiation/RoundFeedback.svelte`**: `יח'` — `negotiation.unitsShort` בחמש שפות.
- **שלושת העמודים הציבוריים** (`gift/[id]`, `availableMission/[id]`, `availiableResorce/[id]`):
  „כבר שלחת בקשת רכישה”, „עריכת BOM / מוצר”, `'he' === $lang ? 'לצפיה במשאלה' : 'See the wish'`,
  הודעות ה־toast של שליחת בקשה/הצעה, `aria-label="סגירה"`, טולטיפ „הערות”, כותרת `error | שגיאה`
  שהציגה אנגלית ועברית יחד, ו־`toLocaleString('en-US')` על מספרים — `offerings.page.*` ו־`pages.avail{Resource,Mission}.*`.

**בדיקה חדשה שמונעת רגרסיה ✅:** `npm run check:ui-hebrew` (`scripts/check-ui-hebrew.mjs`) קורא רק את
חצי ה־markup של `.svelte` (מחרוזת עברית בתוך `<script>` היא השוואת נתונים או ערך לפי שפת הנמען,
וזה מותר), מסיר הערות, ונכשל על כל אות עברית שנשארה. הוא מכסה 153 רכיבים ב־17 תיקיות: מסכי
שלבים 1–3 (`concierge`, `wish`, `moach`, `lev`, `timers`, `deals`, `negotiation`), שלושת
העמודים הציבוריים (`gift`, `availableMission`, `availiableResorce`), והרכיבים שלהם.
ה־allowlist היחיד הוא שם של שפה בתצוגת התרגום של AI (`עברית:`), כי שם של שפה אינו מתורגם.
תיקייה חדשה מתווספת ל־`ROOTS` אחרי שהיא מתורגמת — ומאותו רגע אי אפשר להחזיר לשם עברית.

**מה שנשאר פתוח בשלב הזה (ולא שייך למסך):**

- **`src/lib/sheirut/dealDue.ts:347`**: שם חלופי לשורת משימה — `` `${productName} - משימה` ``.
  `buildDealLines` לא נקרא בפרודקשן (רק בבדיקות), ולכן לא הוחלף: שינוי השם החלופי עלול לשבש
  את התאמת השורות לפי שם. אם וכאשר הוא יחובר, לתת לו `TranslateFn` כמו ל־`dealsService`.
- **`src/lib/services/{salesService,projectMembershipService}.js`** ו־`src/lib/utils/errorHandling.js`:
  מפות `{ he, en }` ל־`getErrorMessage`. אין להן קוראים בקוד היום, ולכן הן לא מגיעות למסך; אם
  יחוברו, צריך להעביר אותן למפתחות `$t()` (שלוש השפות הנוספות חסרות בהן).

### שלב 4: הודעות מהשרת שמגיעות למשתמש (P1) — ✅ תוקן (2026-11-18)

| # | קובץ | מה תוקן |
|---|---|---|
| 4.1 | `src/lib/server/actions/configs/*.ts` | `actionTranslator(context.lang)` מחליף את כל ה־`ActionError`/`Error` בעברית. namespace חדש `server.json` ב־5 שפות; סיבות מודרציה עוברות דרך `server.moderation.*`. טוסטים של פגישות/תרומות/יבוא ושמות רשומה שנכתבים ל־Strapi עברו אף הם ל־`server.*`, כולל `ru`/`es` שקודם קיבלו עברית כברירת מחדל. |
| 4.2 | `ordersApi.ts`, `shop/orderShipping.ts`, `createPaidOrder.ts`, `confirmOrderPayment.ts` | הערות מערכת נשמרות כמרקר נייטרלי `[[order.note.<name>|…]]` (`src/lib/shop/orderNotes.ts`). המילים ב־`shop.order.note.*` ב־5 שפות; `OrderDetail.svelte` ו־`DeliveryNote.svelte` קוראים אותן דרך `renderOrderNote($t, $locale)`. הערת חבר/ת שנכתבה ידנית נשארת טקסט חופשי לצד המרקר, וסכומים מעוצבים לפי שפת הקורא/ת. |
| 4.3 | `src/routes/signup/+page.server.js` | `linkEventSignup` מקבל `locals?.lang \|\| cookies.get('lang') \|\| 'he'` במקום `lang: 'he'` קבוע. |
| 4.4 | `src/routes/signup/+page.server.js` | כל השגיאות מחזירות `errorKey` בלבד; הודעת JS/Strapi הגולמית נרשמת בלוג ולא מוצגת. המסך מציג `reg.signup.err.*` ב־5 שפות. |

**הרחבות באותו שלב:** כרטיסי העזר של הבוט (`src/lib/chat/**`) היו מילוני
`{ he, en }` ופקודות עבריות שנשלחות חזרה לסוכן. הועברו ל־`bot.card.*` ב־5 שפות,
אפשרויות ההצבעה הפכו לקודים (`for`/`against`/`abstain`), ופיקודי הטיימר משתמשים
במפתחות `bot.*TimerCommand` הקיימים. `scripts/check-i18n-routes.mjs` מזהה מעתה
גם `get(t)('ns.…')`, ו־`check-ui-hebrew` נועל את `src/lib/chat`,
`src/lib/components/shop`, `src/routes/about` ואת `tikunolam.svelte`.

**בדיקות חדשות:** `orderNotes.test.ts`, `actionErrors.test.ts`,
`localisation.test.ts` ו־`siteLang.test.js` בודקות סימון נייטרלי, רינדור ב־5 שפות,
אי־הופעת עברית מחוץ ל־`he`, פלייסהולדרים, והעדפת שפת הדפדפן.

### שלב 5: דפים משניים ותשתית (P2) — ✅ תוקן (2026-11-18)

| # | קובץ / נושא | מה תוקן |
|---|---|---|
| 5.1 | `src/routes/about/+page.svelte` | כל הפרוזה, ה־`title`, ה־`alt` ותוויות הקישורים עברו ל־`about.*` ב־5 שפות; הכיוון מ־`$isRtl`; `ROUTED.about = at('/about')`. |
| 5.2 | `src/lib/components/main/tikunolam.svelte` | חמש ההצהרות, התוויות והכפתור ב־`tikunolam.*` ב־5 שפות. ברירות המחדל הן `$derived`, כך שהחלפת שפה לפני החתימה מחליפה אותן; אחרי עריכה נשארים המילים של החבר/ה. |
| 5.3 | `src/hooks.server.js`, `src/lib/server/mcp/lang.ts` | מפענח משותף `localeFromAcceptLanguage` לפי `q`-order ו־`getLanguage` טהור: `?lang` > נתיב לוקאל > cookie מאומת > `Accept-Language` > `en`/`he`. `en-US,en;q=0.9,he;q=0.8` כבר לא מקבל עברית; `ar`/`ru`/`es` מקבלים את שפתם. |
| 5.4 | `src/mastra/agents/*` | `src/mastra/lib/agentLanguage.ts` מספק שם שפה והנחיית „ענה בשפת המשתמש” ב־5 שפות, ומחובר ל־9 סוכנים. תוקן גם ג'יבריש קידוד ב־`navigation-agent`. `weather-agent` ו־`reportIssueTool` הם כלי עזר באנגלית ללא פרמטר שפה; `chatMemory` נשאר עם הוראות זיכרון he/en אחרי הנחיית השפה. |
| 5.5 | `ask.json` / `nuti.json` | `nuti.json` נמחק ב־5 השפות (אין קוראים). `ask.json` נשאר: `love.svelte`, `peace.svelte` ו־`levMessageProcessors.js` כן קוראים לו דרך `get(t)`; הבודק הורחב לזהות את הצורה הזאת, והאזהרה נעלמה. |

**תשתית נוספת:** `serverTranslator` קורא מעתה גם את `server.json` ו־`shop.json`,
כך שגם שרת בלי דף ו־store משתמש באותם קבצי תרגום כמו המסכים.

### סריקה של כל הריפו אחרי שלבים 4–5 — ✅ (2026-11-18)

`check:ui-hebrew` סורק רק את מה שננעל, ולכן הורצה אותה בדיקה על כל `src/`,
יחד עם סריקה של מחרוזות בתוך `<script>` ושל שגיאות שרת. מה שקורא באנגלית ראה
ותוקן:

- **דף 404** (`NotFoundScreen.svelte`), ו־404 של המאגד (`maagad/[id]`) דרך `serverTranslator`.
- **`/api/analyze-cv`** (העלאת קו״ח בהצטרפות): שבע שגיאות עבריות עברו ל־`server.cv.*`.
  הודעת workflow טכנית נרשמת בלוג ולא מוצגת. `ru`/`es` מקבלים ניתוח באנגלית במקום בעברית,
  כי ה־workflow כותב רק he/en/ar.
- **ברירות מחדל לשגיאות** ב־`cvupload` ובשלושת דפי `onboard/*/describe|url`: `common.errorStatus` / `errorTryAgain` / `unexpectedError`.
- **`/me`** (באנר אופליין, שגיאת חיבור, אישור מחיקת משאב: `me.page.*`, ו־`dir` לפי `$isRtl`),
  **`/hub`** (שגיאת טעינה), **`/forum`** (כותרת), **דף ההצטרפות לרקמה** (כותרת, תיאור, שגיאת שליחה),
  **`switch.svelte`** ו־**`amana.svelte`** (`alt`/`aria-label`/שגיאה).
- כל אלה נוספו ל־`FILES` ב־`check-ui-hebrew` (184 רכיבים, 8 קבצים בודדים).

**נמצא ולא תוקן, כי לא מוצג:** `userPr/api-keys.svelte`, `front/mobile.svelte`,
`main/beinang.svelte` ו־`registration/vidValDate.svelte` לא מרונדרים בשום מקום.
`SpaceProjectionShadow` כבוי עד `SPACE_SYNC_ENABLED`.

**עדיין פתוח:**
- **ריבוי:** כ־126 מחרוזות באנגלית בצורה `{{count}} <noun>s` מציגות "1 missions".
  הפרסר תומך ב־`{{count; 1:…; default:…}}`, אבל `serverTranslator` מחליף רק `{{name}}`,
  ולכן ב־`notices`/`lev`/`common`/`server`/`shop` צריך קודם להוסיף לו תמיכה במודיפיירים.
- **תוכן שחברים כתבו** (T3) מוצג במקור עד ש־`TRANSLATE_SURFACES`/`TRANSLATE_WRITE`
  מודלקים וה־backfill ממלא את המטמון.

## איך מודדים התקדמות

הסקריפט שאיתו נמצאה הרשימה סופר שורות עם 2 אותיות עבריות ומעלה בקבצי
`.svelte/.js/.ts` שמחוץ ל־`translations/`, `generated/` ו־`mail/`, אחרי הסרת
הערות. בשורה התחתונה: 207 קבצי ממשק ו־213 קבצי שרת. הרוב שייכים לקבצים
שאינם בעיה: נתוני דמו (`newobj.js`, `oldobj.js`, `mockDeals.ts`), שמות מדינות
(`signupCountries.js`), פרומפטים של AI, ומילונים מסוג `{ he, en }` לפי שפת
הנמען, שה־CLAUDE.md מתיר. הרשימה שלמעלה היא מה שמגיע בפועל למסך של קורא
באנגלית.

~~כדאי להוסיף לבדיקות בדיקה בסגנון `check:script` שנכשלת על טקסט עברי ב־markup
של `.svelte`~~ ✅ **נוסף בשלב 3 והורחב בשלבים 4–5:** `npm run check:ui-hebrew`
עבר מ־153 רכיבים ב־17 תיקיות ל־177 רכיבים ב־20 תיקיות, בתוספת מנגנון `FILES`
לרכיב בודד בתיקייה שעדיין לא נוקתה כולה (`tikunolam.svelte`). הבדיקה עדיין
סורקת רק תיקיות שתורגמו, ולא את כל הריפו — זו הבחירה הנכונה: בדיקה על כולו
הייתה נכשלת על מסכים ישנים שטרם טופלו, ומדליקה אזהרה שכולם לומדים להתעלם
ממנה. סיום שלב 4 או 5 = הוספת התיקייה ל־`ROOTS`, וזה כל מה שצריך כדי לנעול אותה.

**מעטפת הבדיקות שנוספה:** `check:i18n` מזהה `get(t)('ns.…')`; טסטי תרגום
בודקים מפתחות/פלייסהולדרים/עברית ב־5 השפות; טסטי שרת בודקים סדר עדיפויות של
`Accept-Language`, הוראות שפה לסוכנים, מרקרי הערות הזמנה ושגיאות פעולה. כל
אלה נוספו כדי ש„אין עברית שלא תורגמה” לא יישאר רק סריקה ידנית.
