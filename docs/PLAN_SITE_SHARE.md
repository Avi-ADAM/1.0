# חלק האתר בעסקאות — האתר כשותף נותן־שירות (Site Share)

> תכנית בלבד — בלי קוד. בנוי על התשתית הקיימת של Tosplit/Haluka/Hervachti, ומשלים את
> [PLAN_CONCIERGE.md](../PLAN_CONCIERGE.md) ו‑[PLAN_SHARED_PURCHASE.md](./PLAN_SHARED_PURCHASE.md).
> נכתב: 2026-06-02

---

## 0. העיקרון המנחה

יש שתי נקודות שבהן **כסף עובר מיד ליד** במערכת, ובשתיהן אנחנו רוצים שגם האתר יקבל חלק —
אבל **לא כעמלה גנרית** ("האתר לוקח 1%"), אלא כי **גם האתר הוא נותן שירות** והוא נכנס
לחבילה כמו כל שותף אחר:

| מסלול | היכן | השירות שהאתר נתן |
|---|---|---|
| **A. חלוקת רווחים בשותפות** | מכירה הוזנה ידנית דרך עמוד moach (`/moach/[projectId]/sales`) ואז חלוקה (`/split`) | **ניהול הפרויקט והשותפות** (חישוב חלוקה, הצבעות, מעקב, פורומים) |
| **B. התאמת קונסיירז' → מכירה** | קונסיירז' מצא התאמה בין לקוח לנותן שירות, הייתה מכירה, כסף עבר לקוח→ספק | **התאמה ומציאת לקוחות/מוכרים** (matching, ratson-proposal, חיבור הצדדים) |

> **המהות ה"מחוקמת":** הרקמה הראשית (הפרויקט הראשי של האתר) נכנסת כ‑**משתתף נוסף**
> במנגנון החלוקה הקיים — מקבלת שורת `hervachti` ו‑`Haluka` כמו כל שותף. אנחנו לא מוסיפים
> מנגנון תשלום נפרד; אנחנו "אורגים" את האתר לתוך אותה רקמה.

עיקרון שני, נגזר מערכי האתר (קונצנזוס, כלכלת נתינה): **חלק האתר הוא סכום מוצע, לא סכום
כפוי.** המשלם יכול לבקש הנחה (לשלם פחות) או להציע לשלם יותר, עם נימוק — ושני הכיוונים
**מאושררים אוטומטית** מצד האתר. לא ממתינים להחלטה; הסיבה נשמרת לתיעוד והחלטות עתידיות.

---

## 1. תמונת מצב — מה קיים, מה חסר

### קיים (אומת בקוד)

| שכבה | ישות/קובץ | תפקיד |
|---|---|---|
| מכירה | `api::sale.sale` — `in`, `unit`, `splited`, `pending`, `tosplits[]`, `matanot`, `project`, `users_permissions_user` | רישום מכירה ידנית |
| חלוקה | `api::tosplit.tosplit` — `prectentage`, `finished`, `halukas[]`, `hervachti[]`, `vots[]`, `sales[]`, `ratson_proposal`, `split_origin` | הצעת חלוקת רווחים |
| העברה | `api::haluka.haluka` — `usersend`→`userrecive`, `amount`, `matbea`, `confirmed`, `senderconf`, `ushar`, `tosplit`, `sheirut`, `ratson_share`, `forum` | העברה בודדת מיד ליד |
| breakdown | component `projects.hervachti` — `users_permissions_user`, `amount`, `matbea`, `noten` (נותן), `mekabel` (מקבל), `nirsham` | חלק כל משתתף ברווח |
| יתרת רווחים | `User.hervachti` (Decimal, default 0) | ספר־חשבון הרווחים של כל משתמש |
| Actions | `createTosplit.ts`, `createHaluka.ts`, `confirmHaluka.ts`, `approveHaluka.ts` | יצירה/אישור חלוקה |
| מסלול קונסיירז' | `acceptRatsonProposal.ts`, `createSheirutpend.ts`, `createSheirutFromPending.ts`; `Tosplit.ratson_proposal`, `Haluka.ratson_share` | מהצעה → Sheirut + חלוקה |
| UI חלוקה ב‑moach | `/moach/[projectId]/split`, `/splits/[splitId]`; `prPr/hachcal.svelte`, `prPr/whowhat.svelte` | מחשבון + אישור חלוקה |

מנגנון ההזרמה (אומת ב‑`confirmHaluka.ts:85-103`): כש‑receiver מאשר את ה‑Haluka האחרונה
ב‑Tosplit, השרת רץ על `hervachti[]` ומוסיף לכל משתתף (`noten || mekabel`) את `amount` שלו
ל‑`User.hervachti` — **השרת קורא את היתרה הנוכחית מה‑DB ולא סומך על ערך מהלקוח.**

### חסר (זה מה שהתכנית מוסיפה)

1. **אין "רקמה ראשית"** — אין Project שמייצג את האתר.
2. **אין מושג חלק לאתר** — כל החלוקה היא peer‑to‑peer בלבד, 100% לחברי הפרויקט.
3. **אין הזרקה אוטומטית** של שורת־האתר לתוך Tosplit (בשני המסלולים).
4. **אין אלמנט "הצעת סכום אחר"** (הנחה / לשלם יותר + נימוק) ואין מנגנון אישרור אוטומטי.

---

## 2. ישות "הרקמה הראשית" (Platform Project)

הרקמה הראשית היא **Project רגיל** — כך כל התשתית (hervachti ledger, halukas, פורומים,
התראות) עובדת עליה ללא שינוי.

### 2.1 סימון

- שדה חדש `api::project.project` → `isPlatform` Boolean (default false). בדיוק רקמה אחת מסומנת.
- env `PLATFORM_PROJECT_ID` — fallback מהיר לזיהוי בלי query (מומלץ להחזיק את שניהם).
- helper `src/lib/server/revenue/platformProject.ts` → `getPlatformProject()` (cache).

### 2.2 מי "מקבל" את הכסף ב‑Haluka

`Haluka` היום הוא `user → user`. לאתר צריך נמען. שתי אפשרויות:

- **(א) Treasury user** — משתמש־מערכת ייעודי שמשויך ל‑platform project. `Haluka.userrecive = treasuryUser`.
  אפס שינוי סכמה, מתממש מיד. **מומלץ ל‑R0–R3.**
- **(ב) הרחבת Haluka** — `recive_project` (manyToOne → project, nullable). חלוקה ישירה לרקמה
  במקום ליחיד. נקי יותר סמנטית, דורש שינוי סכמה + טיפול ב‑`confirmHaluka`. **R4+.**

ה‑`hervachti` entry של האתר ישתמש ב‑`users_permissions_user = treasuryUser` (אופציה א),
כך שההזרמה הקיימת ב‑`confirmHaluka.ts` תזכה אוטומטית את יתרת ה‑treasury.

---

## 3. מודל חישוב חלק האתר

לא אחוז קשיח גלובלי, אלא **שורת־שירות (service line)** מוגדרת, שקופה וניתנת להתאמה.

### 3.1 קונפיגורציה (על הרקמה הראשית / config)

| שדה | סוג | תיאור |
|---|---|---|
| `siteShareBasis` | enum `['transaction_value','margin','provider_earnings']` | על מה מחושב החלק |
| `siteShareSuggestedPct` | Decimal | אחוז ברירת המחדל המוצע (לכל basis) |
| `siteShareMin` / `siteShareMax` | Decimal nullable | רצפה/תקרה לסכום המוצע |
| `siteShareModelByKind` | JSON | override פר‑סוג עסקה (A מול B, פר‑קטגוריה) |

> `siteShareSuggestedPct` הוא **מוצע** בלבד — המספר הסופי ש"לב" משלם נקבע ב‑§4 (אפשר פחות/יותר).
> ערכי ברירת המחדל הסופיים הם **החלטה פתוחה** (ראה §9.1).

### 3.2 פונקציית החישוב המשותפת

`src/lib/server/revenue/computeSiteShare.ts` — פונקציה **טהורה**, נקראת משני המסלולים (DRY):

```
computeSiteShare({ basis, baseAmount, matbea, model, projectOverrides })
  → { siteAmount, matbea, basis, suggestedPct, line: { he, en } }
```

- `transaction_value`: `siteAmount = clamp(baseAmount × pct, min, max)`
- `margin`: על בסיס `matanot.marginPct` / `estimatedPrice` (למוצרים `pricingMode!='fixed'`)
- `provider_earnings`: אחוז מתוך מה שהספק מרוויח בפועל (לא מהמחיר ללקוח)

הפלט `line` הוא תיאור מילולי להצגה ("שירות ניהול ושותפות של 1lev1 — מוצע: ₪Y"), כדי
שהמשתמש יבין שזו **שורה בחבילה**, לא "מס".

---

## 4. רכיב "הצעת סכום אחר" (Payer Adjustment)

בכל מקום שבו מציגים ל"לב" כמה לשלם (כולל חלק האתר), נוסיף אלמנט תשלום עם שלוש אפשרויות:

```
שירות 1lev1 — מוצע: ₪Y
  ( ) משלם כפי שמוצע
  ( ) אשמח להנחה — אשלם פחות   →  [ סכום ] [ סיבה (חובה) ]
  ( ) ארצה לשלם יותר          →  [ סכום ] [ סיבה (אופציונלי) ]
```

### 4.1 סכמה

תיעוד ההתאמה על ה‑Haluka של האתר (שדות חדשים ב‑`api::haluka.haluka`):

| שדה | סוג | תיאור |
|---|---|---|
| `proposedAmount` | Decimal | הסכום שהמערכת חישבה (`computeSiteShare`) |
| `adjustDirection` | enum `['as_is','less','more']` | בחירת המשלם |
| `adjustReason` | Text nullable | נימוק (חובה ל‑`less`, אופציונלי ל‑`more`) |
| `autoApproved` | Boolean | true — אושרר אוטומטית מצד האתר |

> `amount` נשאר הסכום הסופי בפועל (אחרי ההתאמה); `proposedAmount` שומר את ההצעה המקורית
> לצורך audit ודוחות.

### 4.2 רכיבי UI

- `src/lib/components/revenue/SiteShareLine.svelte` — מציג את שורת השירות + סכום מוצע.
- `src/lib/components/revenue/SiteShareAdjust.svelte` — שלוש האפשרויות + סכום + סיבה.
- שילוב ב‑moach split (`prPr/whowhat.svelte`) וב‑שלב התשלום של קונסיירז'/דיל. רכיב משותף → אין כפילות.

---

## 5. מנגנון האישור האוטומטי

היום `Haluka` דורש `senderconf` (שולח) + `confirmed` (מקבל). הרקמה הראשית כ‑מקבלת —
**אישורה אוטומטי**, בשני הכיוונים (פחות *וגם* יותר). לא חוסמים, לא ממתינים.

- Action חדש `adjustSiteShare.ts`: מקבל `{ halukaId, adjustDirection, amount, reason }`, מעדכן את
  שדות ה‑§4.1, מסמן `autoApproved=true`, ומיד מסמן `confirmed=true` על ה‑Haluka של האתר (במקום
  להמתין לאישור ידני של ה‑treasury).
- לחלופין דגל ב‑`confirmHaluka.ts`: אם `userrecive` הוא ה‑treasury / `recive_project` הוא ה‑platform →
  לדלג על דרישת האישור הידני ולסמן `confirmed=true` אוטומטית.
- **השלכה על ה‑spCheck:** מכיוון שה‑Haluka של האתר מאושרר מיד, הוא לא חוסם את הזרמת ה‑hervachti
  לשאר השותפים ב‑`confirmHaluka.ts:72-103`.
- **Audit:** כל התאמה (כיוון + סכום + סיבה) נרשמת; דוח תקופתי על הנחות/תוספות (R4).

---

## 6. נקודות ההזרקה (Injection Points)

### 6.1 מסלול A — חלוקה ידנית ב‑moach

לפני יצירת ה‑Tosplit (ב‑flow של `prPr/hachcal.svelte` → `createTosplit`):
1. לקרוא ל‑`computeSiteShare` עם `baseAmount` = סך המכירות שמתחלקות.
2. להוסיף שורת `hervachti` עבור הרקמה הראשית (`users_permissions_user = treasuryUser`, `mekabel=true`).
3. להוסיף `Haluka` תואמת (מהמשלם/מהקופה → treasury) עם שדות ה‑§4.
4. הרקמה הראשית נכנסת ל‑`vots` כמשתתפת, אך הצבעתה/אישורה אוטומטיים (§5) — לא מעכבת את החלוקה.

### 6.2 מסלול B — קונסיירז' / shared purchase

ב‑`acceptRatsonProposal.ts` / `confirmRatsonExecution` (PLAN_SHARED_PURCHASE §5.7), בעת יצירת
ה‑`Sheirutpend` + `Tosplit` + `Haluka`:
1. אותה קריאה ל‑`computeSiteShare` (basis אפשרי שונה — למשל `provider_earnings`).
2. הזרקת שורת־אתר זהה דרך `Tosplit.ratson_proposal` הקיים — האתר הוא צד שלישי בפיצול לקוח↔ספק.

> שני המסלולים עוברים דרך **אותה** `computeSiteShare` ואותו רכיב UI — נקודת אמת אחת.

---

## 7. שינויי סכמה (מרוכז)

- `api::project.project`: `isPlatform` Boolean.
- `api::haluka.haluka`: `proposedAmount`, `adjustDirection`, `adjustReason`, `autoApproved` (+ `recive_project` ב‑R4).
- treasury user — נתון seed, לא שינוי סכמה (אופציה א).
- config — שדות `siteShare*` על הרקמה הראשית או ב‑settings entity.

---

## 8. קבצים שייגעו (best estimate)

### חדשים — Server
- `src/lib/server/revenue/computeSiteShare.ts` (חישוב טהור)
- `src/lib/server/revenue/platformProject.ts` (`getPlatformProject`, treasury)
- `src/lib/server/actions/configs/adjustSiteShare.ts`
- `src/lib/server/actions/configs/injectSiteShare.ts` (helper להזרקת hervachti+haluka)

### חדשים — Components
- `src/lib/components/revenue/SiteShareLine.svelte`
- `src/lib/components/revenue/SiteShareAdjust.svelte`

### עריכה
- `src/lib/components/prPr/hachcal.svelte`, `prPr/whowhat.svelte` — שילוב שורת־האתר במחשבון/אישור.
- `src/lib/server/actions/configs/createTosplit.ts` — קבלת שורת־אתר אופציונלית.
- `src/lib/server/actions/configs/confirmHaluka.ts` — auto‑confirm ל‑Haluka של האתר.
- `src/lib/server/actions/configs/acceptRatsonProposal.ts` — הזרקה במסלול B.
- `src/routes/api/send/qids.js` — QIDs חדשים (`adjustSiteShare`, עדכון Haluka עם שדות חדשים).
- `src/lib/server/actions/configs/index.ts` — registration.
- `src/lib/translations/*` — מחרוזות שורת השירות + אלמנט ההתאמה.
- `src/lib/types.ts` — `SiteShare`, `SiteShareAdjustment`.

---

## 9. Milestones

| # | מטרה | תוצר | flag |
|---|---|---|---|
| R0 | רקמה ראשית (`isPlatform` + treasury + `PLATFORM_PROJECT_ID`) + `computeSiteShare` + config. בלי UI. | תשתית חישוב + ישות. | – |
| R1 | הזרקה במסלול A (moach split): שורת hervachti + Haluka לאתר, auto‑confirm. | חלוקה ידנית כוללת חלק לאתר. | `siteShare.manualSplit=on` |
| R2 | אלמנט "הצעת סכום אחר" (less/more + סיבה) + אישרור אוטומטי. | המשלם מתאים את חלק האתר; נרשם. | `siteShare.adjust=on` |
| R3 | הזרקה במסלול B (קונסיירז'/shared purchase). | התאמת קונסיירז' מזרימה חלק לאתר. | `siteShare.concierge=on` |
| R4 | דוחות/audit, `Haluka.recive_project`, multi‑currency, override פר‑קטגוריה. | בשלות + שקיפות. | `siteShare.reports=on` |

> R0–R1 הם הליבה. ברירת מחדל של כל ה‑flags = off ⇒ אפס רגרסיה לחלוקה הקיימת.

---

## 10. תרחיש End‑to‑End (אחרי R2)

> שותפות "תפירה ירוקה" הזינה מכירה של ₪1,000 ב‑moach ולחצה "חלוקה".

1. המחשבון מחלק ₪1,000 בין 3 השותפים לפי תרומתם.
2. `computeSiteShare({basis:'transaction_value', baseAmount:1000})` → מוצע ₪50 ("שירות ניהול 1lev1").
3. `SiteShareAdjust` מוצג: השותף המשלם בוחר "ארצה לשלם יותר" → ₪70, סיבה: "תודה על המערכת".
4. נוצר Tosplit עם 3 hervachti לשותפים + 1 hervachti לאתר (₪70), ו‑Haluka מתאימה (`proposedAmount=50`, `amount=70`, `adjustDirection='more'`, `autoApproved=true`, `confirmed=true`).
5. כל השותפים מאשרים את ה‑Halukas שלהם; ה‑Haluka של האתר כבר מאושרת → לא חוסמת.
6. `confirmHaluka` מזרים hervachti לכולם כולל ל‑treasury של האתר. `approveHaluka` סוגר: Tosplit `finished`, Sale `splited`.

---

## 11. סיכונים ועניינים פתוחים

1. **מודל החישוב הסופי (§3.1)** — basis ואחוז ברירת מחדל. **החלטת מוצר נדרשת.** התכנית תומכת בכל basis; צריך לבחור ברירות מחדל.
2. **Haluka user→user מול project** — אופציה א (treasury) מהירה אך "מסתירה" את האתר מאחורי משתמש; אופציה ב נקייה יותר. מתחילים מ‑א.
3. **משפטי/מיסוי** — חשוב שהשורה תתועד כ**שירות** ולא כעמלה; ניסוח ה‑`line` והקבלות צריך לשקף זאת.
4. **שקיפות מול לחץ** — הצגת "מוצע" + אפשרות הנחה חופשית שומרת על ערכי הנתינה; להימנע מ‑dark patterns.
5. **multi‑currency** — `matbea` קיים בכל הישויות; חישוב חוצה‑מטבעות (basis בפרויקט אחד, חלק אתר באחר) → R4.
6. **תאימות אחורה** — flags off = החלוקה הקיימת לא משתנה. בדיקות רגרסיה ל‑`confirmHaluka`/`approveHaluka` לפני merge.
7. **שורת־אתר על מכירות עבר** — לא רטרואקטיבי; חל רק על Tosplit חדשים אחרי הפעלת ה‑flag.
