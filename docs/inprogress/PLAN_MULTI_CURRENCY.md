# ריבוי מטבעות — "אני רושם במטבע שלי, כל אחד רואה במטבע שלו"

> ממשיך את D-M1 ב-[PLAN_MONEY_RAILS.md](../tbd/PLAN_MONEY_RAILS.md) ("שקל בלבד בשלב
> ראשון; ה-Money type כבר יודע code ליום שנרצה"). היום הזה הגיע: רקמות עם
> שותפים מכמה מדינות צריכות לנהל כסף יחד, וכל אחד צריך לראות את הערכים במטבע
> שלו.

## 0. המצב לפני

- ברוב המקומות "כסף" הוא מספר (`decimal`) בלי מטבע. `₪` מודבק ב-325 מקומות
  ב-120 קבצים.
- קיים `Matbea` בסטראפי (`name`, `simbol`, לוקליזציה) ויחסים אליו מ-13
  אוספים — אבל כולם כותבים `matbea: '2'` (שקל) קשיח. אין קוד ISO, אין המרה.
- `src/lib/crypto/money.ts` כבר מחזיק `Money = { amount: bigint, code }` —
  הצ'יין מוכן, התצוגה לא.

## 1. העיקרון המנחה

1. **כותבים במטבע שלך.** כל שדה קלט כספי מציג בורר מטבע, ברירת מחדל = המטבע
   של הכותב.
2. **הרקמה סופרת במטבע אחד.** לכל רקמה יש `Project.currencyCode` — מטבע
   החשבונאות שלה. כל סכום נשמר ב-`amount` **במטבע הרקמה** (כך שכל המתמטיקה
   הקיימת — tosplit, haluka, equity, site-share, stipend — ממשיכה לעבוד בלי שינוי),
   וליד השורה נשמר מה הכותב הקליד: `entryCurrency` + `entryRate`
   (כמה יחידות מטבע-רקמה שווה יחידת מטבע-כתיבה, **ביום הרישום**).
   - מקור = `amount / entryRate` במטבע `entryCurrency`.
   - השער קפוא ברגע הרישום ⇒ יתרות ואחוזים לא "זזים" עם שוק המט"ח. זה מה
     שרואה-חשבון היה עושה, וזה מה ששומר על ההוכחות החתומות יציבות.
3. **כל אחד רואה במטבע שלו.** `User.currency` (ברירת מחדל: ניחוש מה-
   `Accept-Language`, אחרת ILS). כל סכום מוצג מומר למטבע הצופה בשער היציג
   היומי, עם סימון `≈` כשהוא מומר, והמקור במרחק נגיעה — אותו עיקרון כמו
   `<Translated>`: אומרים שזה תרגום, והמקור תמיד זמין.
4. **null = legacy.** `currencyCode` ריק ברקמה ⇒ ILS. `entryCurrency` ריק ⇒
   נרשם במטבע הרקמה. אפס מיגרציה: כל שורה קיימת ממשיכה להיות שקלים.

## 2. החלטות (D-C)

| # | החלטה | נימוק |
|---|---|---|
| D-C1 | זהות מטבע = קוד ISO-4217 (`ILS`, `USD`, `EUR`…) כמחרוזת | `Intl.NumberFormat` יודע לעצב כל קוד בכל שפה; אין תלות ברשומת Matbea מתורגמת |
| D-C2 | `amount` תמיד במטבע הרקמה; המקור ב-`entryCurrency`+`entryRate` | אפס שינוי בחשבון הקיים; זוג שדות אחד לרשומה, לא לכל שדה כסף |
| D-C3 | תצוגה בשער **של היום**, חשבונאות בשער **של יום הרישום** | הצופה רוצה "כמה זה בערך אצלי עכשיו"; הרקמה צריכה מספרים שלא זזים |
| D-C4 | שערים: open.er-api.com → fawazahmed0 (jsDelivr) → Frankfurter (ECB); כולם חינמיים ללא מפתח, יומיים | שלוש שכבות גיבוי; עדכון יומי מספיק (נבדק 2026-09-19 — שלושתם עונים) |
| D-C5 | cache: זיכרון (6 שעות) → שורה יומית באוסף Strapi `fx-rate` → ספק | שרת קר לא פונה לספק; יש היסטוריה לשער-יום-רישום; ספק נופל ⇒ השער האחרון הידוע |
| D-C6 | הדפדפן לא פונה לספק. השערים מגיעים ב-root layout (טבלה קטנה) | בלי CORS, בלי מפתחות, בלי 30 דפדפנים שפונים לספק |
| D-C7 | `Matbea` מקבל `code` (ISO); היחס הישן נקרא דרכו (id 2 ⇒ ILS) | קוד ישן שכותב `matbea:'2'` ממשיך לעבוד |
| D-C8 | שינוי מטבע רקמה מותר רק כשאין עדיין רשומות כסף | שינוי אחרי = הפיכת כל ה-`amount`-ים; עתידי: Decision kind `rebaseCurrency` |
| D-C9 | העדפת המטבע של הצופה: localStorage + cookie + `User.currency` | אותו דפוס כמו `autoTranslate` — הצביעה הראשונה כבר יודעת, גם ב-SSR |

## 3. שינויי Strapi (1.0b)

- `Matbea.code` — string, לא מתורגם.
- `Project.currencyCode` — string (ISO), null = ILS.
- `User.currency` — string (ISO), null = לא נבחר.
- אוסף חדש `fx-rate`: `date` (string YYYY-MM-DD, unique), `base` (`USD`),
  `rates` (json), `source` (string), `fetchedAt` (datetime).
- `entryCurrency` (string) + `entryRate` (decimal) על האוספים שבהם אנשים
  מקלידים כסף: `sale`, `matanot`, `open-mission`, `pendm`,
  `mesimabetahalich`, `mission-offer`, `open-mashaabim`, `pmash`,
  `mashabetahalich`, `haluka`, `sheirut`, `ratson`, `ratson-proposal`,
  `stipend-pledge`, `stipend-program`, `stipend-payment`.

## 4. קוד (1.0main)

| שכבה | קבצים |
|---|---|
| טהור | `src/lib/money/currencies.ts` (רשימה נתמכת + ספרות עשרוניות), `convert.ts` (המרה בין מטבעות דרך USD, `toEntry`/`fromEntry`), `format.ts` (`formatMoney` עם Intl), `guess.ts` (Accept-Language ⇒ מטבע), `resolve.ts` (מטבע של רשומה/רקמה) |
| שרת | `src/lib/server/fx/providers.ts`, `rates.ts` (`getRates()` עם שלוש שכבות cache), `GET /api/fx` |
| לקוח | `src/lib/stores/currency.js` (העדפת צופה, כמו autoTranslate), `src/lib/stores/fxRates.js`, `<Money>` + `<MoneyInput>` ב-`src/lib/components/money/` |
| כתיבה | `src/lib/server/money/normalizeEntry.ts` — action מקבל `{amount, entryCurrency}` ⇒ שומר `amount` במטבע הרקמה + `entryCurrency/entryRate` |
| הגדרות | בורר מטבע ב-`/me/settings`; מטבע רקמה בהגדרות moach + ביצירת רקמה |

## 5. פאזות

| פאזה | תכולה | סטטוס |
|---|---|---|
| **C0** | המסמך הזה + סכמות Strapi + טיפוסים | ✅ |
| **C1** | `src/lib/money/` טהור + 23 טסטים | ✅ |
| **C2** | שירות שערים בשרת + `fx-rate` + `/api/fx` + 11 טסטים | ✅ |
| **C3** | העדפת צופה (hooks/cookie/פרופיל) + שערים ב-layout + בורר ב-`/me/settings` | ✅ |
| **C4** | `<Money>` + `CurrencySymbol` + החלפת ~100 מופעי `₪` בתצוגה; מפת מטבע-לרקמה ב-lev/hub | ✅ |
| **C5** | `<MoneyInput>` + `normalizeEntry` ב-`createSale` (+API חיצוני), `createMission`, `createComplexMatanot`, `createResource` | ✅ |
| **C6** | מטבע רקמה: `setRikmaCurrency` (עם נעילת D-C8), בחירה ביצירת רקמה, שורה בהגדרות | ✅ |
| **C7** | מחרוזות i18n (26 מפתחות × 5 שפות) + הודעות שרת ⇒ סכום מעוצב | ✅ חלקי — ראה §6 |
| **C8** | תצוגה: כל סכום שמוצג כמספר ערום ⇒ `<Money>` | 🔶 מנה 1 (המוח) ✅ `67ef3d3c`; מנה 2 (הלב) כמעט גמורה — עדיין לא בקומיט, נשארו 4 פריטים; מנה 3 לא התחילה — §6.1, [checklist](./currency-sweep-plan.md) |
| **C9** | מקור מטבע: `<Money>` מחוץ ל-moach שנופל בשקט לשקל | ⏳ לא התחיל — §6.2 |
| **C10** | תוויות `(₪)` / `₪ לשעה` בקבצי ה-JSON ⇒ סמל המטבע ליד השדה | ⏳ לא התחיל — §6.3 |
| **C11** | הודעות שרת, מיילים, בוט טלגרם | ⏳ לא התחיל — §6.4 |
| **C12** | קלט במטבע אחר גם במשא-ומתן ובשאר הטפסים (`<MoneyInput>` + `normalizeEntry`) | ⏳ לא התחיל — §6.5, **לא לסוכן זול** |

## 5.1 סדר פריסה — **קודם Strapi**

השינויים ב-1.0main קוראים וכותבים שדות חדשים. שאילתת GraphQL ששואלת שדה
שאינו קיים נכשלת **כולה** (`GRAPHQL_VALIDATION_FAILED`, ו-`/api/send` מחזיר
200 עם `errors`), ולכן:

1. לפרוס את **1.0b** (סכמות + האוסף `fx-rate`).
2. להעניק הרשאות ל-`fx-rate`: גם ל-Authenticated וגם ל-API token של השרת
   (find/create) — אחרת השערים פשוט לא נשמרים ליום, והשירות פונה לספק פעם
   לכל תהליך.
3. ואז לפרוס את הפרונט.

בכיוון ההפוך (פרונט קודם) דף המוח כולו נשבר, כי `getProjectBaseInfoWithAuth`
שואל `currencyCode`.

## 5.2 מה נגמר בפועל

- **שרת:** `src/lib/server/fx/` (ספקים + cache תלת-שכבתי + `/api/fx`),
  `src/lib/server/money/normalizeEntry.ts` (המרה בכתיבה) ו-`notifyMoney.ts`
  (סכום בתוך הודעה, במטבע הרקמה ובשפת הנמען).
- **לקוח:** `src/lib/money/` (טהור) + `context.svelte.ts` (מצב לכל בקשה, לא
  store גלובלי — כדי שמטבע של גולש אחד לא ידלוף לאחר ב-SSR),
  `<Money>` / `<MoneyInput>` / `<CurrencyPicker>` / `<CurrencySymbol>`.
- **טסטים:** 23 (ספרייה טהורה) + 11 (שערים) + 7 (נרמול כתיבה) + 10 (`<Money>`)
  + 3 (API מכירות) — כולם עוברים; אין כשל חדש בסוויטה המלאה.

## 6. מה נשאר — מצב בשטח (נבדק מול הקוד 2026-11-19)

התשתית (C0–C6) בנויה ועובדת, אבל **היא נכנסה רק לחלק מהמסכים**. §5 סימן את
C4 כ"החלפת ~100 מופעי ₪" — זה נכון, אבל רוב המסכים לא הציגו ₪ מלכתחילה: הם
מציגים `{perhour}` / `{price}` / `{total}` כמספר ערום, ולכן הסריקה של ₪ לא
ראתה אותם. אף פריט כאן לא שובר חישוב — `amount` תמיד במטבע הרקמה — אבל ברקמה
שסופרת בדולרים המסכים האלה מראים מספר בלי מטבע, או שקל במקום דולר.

ההנחיות לביצוע, עם רשימות הקבצים: [CURRENCY_SWEEP_BRIEF.md](./CURRENCY_SWEEP_BRIEF.md).

### 6.1 C8 — מספר ערום במקום `<Money>`

סריקה של ה-markup מצאה כ-60 קומפוננטות שמציגות שדה כסף (`perhour`, `price`,
`total`, `myp`, `agprice`, `amount`, `in`, `totalBounti`) בלי `<Money>` /
`fmt`. הריכוזים:

- **קלפי הלב** — 🔶 תוקנו ב-2026-11-19 (מנה 2, לא בקומיט), כולל `negoM`,
  `negoPend` ו-`NegotiationHistory`. נשארו `WishOfferCard`, `pending`,
  `MissionStipendOffer` ו-`BlueprintReview`. הרשימה המקורית: (`src/lib/components/lev/` ו-`lev/cards/`) — `reqtojoin`,
  `sugestmi`, `sugestma`, `mashsuggest`, `pandingMesima`, `pmas`, `pending`,
  `projectSuggestor`, `reqtom`, `rektom`, `pma`, `mesima`, `missionInProgress`,
  `didiget`, `newcoinui`, `weget`, `negoArchive`, `ProductRequestCoin`,
  `SaleCard`, `CustomerSaleCard`, `SheirutHalukaCard`, `SiteShareIncomeCard`,
  `haluka`. 22 מתוך ~45 הקלפים לא מייבאים שום דבר מ-`$lib/money`.
- **טבלאות המוח הישנות** (`src/lib/components/prPr/`) — ✅ תוקנו ב-2026-11-19
  (`67ef3d3c`): `pendsM`, `openM`, `newOpn`, `mashmam`, `finisin`,
  `process/lifecycle/*`, `assistant/RikmaPreview`, עמודי מכירה/חלוקה/מבצעים במוח.
  **נשארו**, כי מתברר שהן מוצגות גם מחוץ למוח וצריכות prop של מטבע: `negoM`,
  `negoPend`, `ui/NegotiationHistory` (מנה 2), `open/OpenMissionCard`,
  `open/OpenResourceCard` (מנה 3). נדחה: `missionForm/MissionSummary`, שמקבל
  מחרוזת שכבר מעוצבת במטבע הנכון.
- **מסכים ציבוריים** — `availableMission`, `availiableResorce` (+`[id]`),
  `gift` (+`[id]`), `maagad/[id]`, `user/[id]`, `rikmaPublic/RikmaPage`,
  `offerings/UserStorefront`, `MyProductsSection`, `MyResourcesEditor`,
  `main/ProductPeek`.
- **שונות במוח** — `sales/[saleId]`, `splits/[splitId]`, `sales/manage/promotions`,
  `process/lifecycle/SaleLifecycle`, `ProcessLifecycle`, `products/ProductChangesPanel`,
  `assistant/RikmaPreview`, `deals/sales-center` (`pages.salesCenter.shekel`).

### 6.2 C9 — `<Money>` בלי מקור מטבע

`provideRikmaCurrency` קיים רק ב-moach layout ובדף התמיכה; `provideProjectCurrencies`
רק בלב וב-hub. כל `<Money amount={x} />` בלי `currency` / `projectId` מחוץ
לשם נופל **בשקט** ל-ILS. נמצאו כ-50 קבצים כאלה. רובם תקינים כי הם רצים בתוך
moach (`hamatanot`, `ProductForm`, `betaha`…), אבל אלה לא:

- כל `src/routes/deals/**` ו-`src/lib/components/deals/*` — אין ספק הקשר.
- `src/routes/(reg)/concierge/[id]` (11 מופעים) ו-`concierge/+page` (`fmtBudget` ⇒
  `fmtMoney(+n)` בלי מטבע), `offer/[key]`, `project/[id]/join`.
- קלפי לב שמשתמשים ב-`<Money>` בלי `projectId`: `CustomerPayment`, `CustomerSaleCard`,
  `dowegeot`, `weget`, `sugestma`, `rektom`, `hachlata`, `pma`, `StipendDecisionCard`,
  `WishOfferCard`, `decisionMaking`.

### 6.3 C10 — הסימן בתוך הטקסט המתורגם

מפתחות שה-₪ כתוב בתוכם, בעברית ובמקבילות בארבע השפות האחרות:
`stipend.json` (rate, monthlyCap, totalCap, revenueTrigger, howMuchArrived),
`pages.json` (mPerhour, rPrice, shekel), `consensus.json` (perHourUnit,
perHourLabel), `concierge.json` (budgetLabel, fixedAmount, atCostAmount),
`revenue.json` (amount, amountOpt), `project.json` (currency), `server.json`
(stipend, stipendWithBudget). דוגמאות בתוך טקסט הסבר (`shop.zonesEmptyBody`,
`consensus.initialNote`, `shopPage.p3`, `home.*`) נשארות — הן דוגמה, לא נתון.

### 6.4 C11 — שרת, מיילים, טלגרם

- **הודעות שרת**: `proposeStipendProgram.ts` (שורות 215–362), `publishStipendFundingRequest.ts`
  (`nis()`), `requestDonation.ts`, `notifications/maturedNotices.ts` (550, 562).
  הדפוס: `rikmaMoneyText(projectId, jwt, fetch)` מ-`$lib/server/money/notifyMoney`.
- **מיילים**: `mail/HalukaApproved.svelte`, `monthlyRecurringSale.svelte`,
  `monthlyResourceActive.svelte` — צריכים prop `currency` מהשולח.
- **טלגרם**: `botTexts.js` (`salePricePrompt` × 5 שפות), `api/newTelegram/+server.js` (321, 326).
- **תיאורי פרמטרים ל-AI** (`"₪ per month"` ב-`proposeStipendPledge`,
  `publishStipendFundingRequest`) — להחליף ב-"in the rikma's currency".
- **לא נוגעים**: הערות קוד, `quorum/copy.js`, `/api/chat`, `externalOffers.ts`
  (מפענח סימנים, לא מציג), מחשבון דף הבית (מטבע הצופה, כבר דרך `money.format`).

### 6.5 C12 — קלט במטבע אחר בכל מקום (לא לסוכן זול)

`<MoneyInput>` לא בשימוש באף טופס. הבחירה במטבע קיימת רק בטופס משימה,
יצירת משאב וטופס מוצר (`CurrencyPicker` ישיר), ו-`normalizeEntry` רק ב-4
actions. שאר הטפסים — הצעות נגד (`submitNegoMission/Mash`, `counterOnAsk*`,
`counterSaleClaim`), מכירה ידנית ב-`sale.svelte`, קצבאות, משאלות (`createRatson`),
הצעות ליד, מבצעים, משלוח — כותבים במטבע הרקמה. **זה תקין** (null = מטבע הרקמה),
בתנאי שה-UI אומר באיזה מטבע מקלידים — וזה בדיוק C8/C10. הרחבת הקלט למטבע אחר
דורשת החלטה לכל זרם (גרסה חתומה במשא-ומתן חייבת להיות באותו מטבע לשני הצדדים)
ולכן נשארת מחוץ לסוויפ.

משאלה (`ratson`) לא שייכת לרקמה — המטבע שלה הוא של מי שפתחה אותה. צריך
`ratson.entryCurrency` כמקור (השדה קיים), לא ILS.

## 7. קושיות פתוחות

- **O-C1** מטבע רקמה משתנה אחרי שיש כסף — Decision `rebaseCurrency` (רקמה-רחב,
  כמו כל שינוי שמזיז ערכים). לא בסקופ.
- **O-C2** מטבעות בלי שער בספקים (מטבעות מקומיים/קהילתיים מ-Matbea) — מוצגים
  כמו שהם, בלי המרה, ובלי `≈`.
- **O-C3** site-share בין רקמות עם מטבעות שונים — ההעברה נרשמת במטבע המקבלת
  עם `entryCurrency` של השולחת. דורש בדיקה כשיהיה מקרה אמיתי.
