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

### עיקרון שלישי — האתר הוא **מוצר לא־מתכלה** שכל הצרכנים חולקים

זו ההבנה שמאחדת את חלק־האתר עם שתי התכניות הקיימות:
[PLAN_COMPLEX_PRODUCTS.md](../PLAN_COMPLEX_PRODUCTS.md) (BOM — מוצר = מתכון של משימות×שעות +
משאבים) ו‑[PLAN_SHARED_PURCHASE.md](./PLAN_SHARED_PURCHASE.md) (מוצר אחד שנצרך יחד ע"י רבים).

**1lev1 עצמה היא מוצר**, וכל הלקוחות יחד הם הצרכנים — בדיוק כמו רכישה משותפת אחת ענקית.
אבל זה מוצר מיוחד: **הוא לא מתבלה משימוש.** כל צרכן נוסף שמצטרף לא מגדיל את עלות המוצר
אלא בתוספת זניחה — מדובר במוצר "ללא הגבלה". המשימות שהושקעו בפיתוח ימשיכו לשרת אותנו גם
בעתיד, ולכן אין כאן בלאי שצריך לכסות שוב ושוב.

מההכרה הזו נגזר מודל תשלום עם **שלושה גבהים** שמוצגים ל"לב", ולא מספר יחיד:

```
        רצפה            הצעה                            תקרה (רף עליון)
   (הנחה/לשלם פחות)   (מה שראוי לתת)            (ההשקעה בפיתוח ÷ כל הצרכנים)
        │                 │                                    │
   ─────┼─────────────────┼────────────────────────────────────┼────►  (אפשר גם לעבור)
        ▼                 ▼                                    ▼
   נימוק חובה        ברירת המחדל              תצוגתי בלבד — "ראו כמה הושקע כאן"
                  (מחושב מהרווח/ההוצאה שלך)        לא ביקוש, רק כבוד להשקעה
```

- **התקרה** (§2.5) = **כל ההשקעה בפיתוח האתר חלקי כל הצרכנים**. ההשקעה נמדדת כ‑BOM של
  המוצר הראשי (שעות פיתוח × תעריף + משאבים, בדיוק כמו מוצר מורכב). מכיוון שאין בלאי
  והמכנה (מספר הצרכנים) רק גדל, **התקרה יורדת עם הזמן**. היא **תצוגתית בלבד**: נועדה
  להראות "הושקעו פה הרבה כסף ומאמץ", **לא** סכום שאנחנו מבקשים. כמובן שמותר לעבור אותה.
- **ההצעה** (§3) = מה שאנחנו חושבים שראוי לתת. את זה אנחנו **לא** גוזרים מההשקעה שלנו אלא
  **מהרווח/ההוצאה שלך**: "עשית עסקה בשווי X, הרווחת Y — נשמח לתמורה כזו". זו ברירת המחדל.
- **הרצפה** (§4) = הנחה / לשלם פחות, עם נימוק. גם היא מאושררת אוטומטית.

> הקישור למוצר הוא העיקר: כבר קיים באתר מוצר כזה. נסמן אותו ב‑Strapi כ**מוצר הראשי**
> (`Matanot.isMainProduct`, §2.5), וה‑BOM שלו הוא מקור ההשקעה לחישוב התקרה.

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

1. **אין "רקמה ראשית"** — אין Project שמייצג את האתר. *(נסגר — `isPlatform` בסכמה)*
2. **אין מושג חלק לאתר** — כל החלוקה היא peer‑to‑peer בלבד, 100% לחברי הפרויקט.
3. **אין הזרקה אוטומטית** של שורת־האתר לתוך Tosplit (בשני המסלולים).
4. **אין אלמנט "הצעת סכום אחר"** (הנחה / לשלם יותר + נימוק) ואין מנגנון אישרור אוטומטי.
5. **אין "מוצר ראשי"** — אין Matanot מסומן שמ‑BOM שלו נגזרת ההשקעה (התקרה).
6. **אין חישוב תקרה** (השקעה ÷ צרכנים) ואין הצגת הטווח רצפה→הצעה→תקרה ל"לב".

---

## 2. ישות "הרקמה הראשית" (Platform Project)

הרקמה הראשית היא **Project רגיל** — כך כל התשתית (hervachti ledger, halukas, פורומים,
התראות) עובדת עליה ללא שינוי.

### 2.1 סימון — ✅ מיושם בסכמה

- שדה `api::project.project` → **`isPlatform` Boolean — נוסף לסכמה ב‑main.** בדיוק רקמה אחת מסומנת `true`.
- env `PLATFORM_PROJECT_ID` — override/קיצור אופציונלי לזיהוי בלי query.
- helper `src/lib/server/revenue/platformProject.ts` → `resolvePlatformProject()`
  (override סטטי, אחרת query על `isPlatform=true`). action קריאה `getPlatformProject`
  (qid `205getPlatformProject`) חושף אותו ללקוח.

### 2.2 מי "מקבל" את הכסף ב‑Haluka

`Haluka` הוא `user → user`, ולפלטפורמה אין משתמש‑אוצר ייעודי בסכמה. מכיוון ש‑`isPlatform`
יושם על **Project**, נמען ה‑Haluka של האתר = **החבר הראשון של הרקמה הראשית** (`user_1s[0]`),
נפתר בזמן ריצה דרך `getPlatformProject`. שדה `hervachti` של האתר משתמש ב‑אותו
`users_permissions_user`, כך שההזרמה הקיימת ב‑`confirmHaluka.ts` מזכה אותו אוטומטית.

- **override**: אפשר לקבע משתמש‑אוצר ספציפי דרך `PLATFORM_TREASURY_USER_ID` (env) או
  `SITE_SHARE_TREASURY_USER_ID` (config).
- **אינטרלוק בטיחות**: אם אין חבר ברקמה הראשית / אין override → `configured=false` → לא מוזרק כלום.
- **(עתידי R4)** הרחבת `Haluka.recive_project` לחלוקה ישירה לרקמה במקום ליחיד.

### 2.5 המוצר הראשי וההשקעה (Platform-as-Product) — מקור התקרה

הרקמה הראשית (§2.1) היא הצד שמקבל את הכסף; **המוצר הראשי** הוא הצד שמסביר *כמה הושקע*.
לפי [PLAN_COMPLEX_PRODUCTS.md](../PLAN_COMPLEX_PRODUCTS.md), מוצר מורכב = BOM: סכום של
(משימות × שעות × תעריף) + (משאבים × כמות × מחיר). **כבר קיים מוצר כזה** המייצג את האתר;
נסמן אותו ובכך נחשוף את ההשקעה הכוללת ל‑UI.

#### 2.5.1 סימון בסכמה

- שדה `api::matanot.matanot` → **`isMainProduct` Boolean** (חדש). בדיוק מתנה אחת `true`,
  ושייכת לרקמה הראשית (`project = isPlatform project`). אינטרלוק: אם אין מוצר ראשי →
  אין תקרה, מציגים רק הצעה (§3). זהו degrade בטוח.
- אופציונלי: `Matanot.investmentCache` (Decimal) — cache של ההשקעה הכוללת המחושבת מה‑BOM,
  שמתעדכן ב‑hook (כמו `estimatedPrice` במוצר מורכב), כדי לא לחשב BOM מלא בכל בקשה.

#### 2.5.2 חישוב ההשקעה (numerator)

```
investment = Σ(recipeMission.hoursPerUnit × ratePerHour × unitsPerProduct)
           + Σ(recipeResource.quantityPerUnit × pricePerUnit)
```

זהו בדיוק `estimatedPrice` של המוצר הראשי לפי מודל ה‑BOM — סך כל שעות הפיתוח והמשאבים
שהושקעו באתר. כל עוד תכנית המוצרים המורכבים לא יושמה במלואה, אפשר לזמן זאת משדה
`investmentCache` יחיד שמוזן ידנית (seed) — ולשדרג ל‑BOM חי כשהמוצר הראשי יהפוך למוצר
מורכב אמיתי.

#### 2.5.3 חישוב התקרה (denominator) — "מוצר לא־מתכלה"

```
consumers     = מספר הצרכנים הייחודיים שעברו עסקה דרך האתר (lev-ים פעילים)
ceilingPerLev = investment / max(consumers, 1)
```

- **המכנה** = כל הצרכנים יחד (מודל הרכישה המשותפת מ‑PLAN_SHARED_PURCHASE — האתר הוא
  "רכישה משותפת" אחת ענקית). מקור הספירה: count על משתמשים פעילים / על Sheirut-ים שנסגרו.
- מכיוון שהמוצר **לא מתבלה** (כל צרכן נוסף ≈ עלות אפסית), המכנה רק גדל ⇒ **התקרה יורדת
  עם הזמן.** זה רצוי: ככל שיותר אנשים נהנים, הנטל הסמלי על כל אחד קטֵן.
- **התקרה תצוגתית בלבד.** היא לא נכנסת ל‑Haluka כסכום ברירת־מחדל. היא מוצגת לצד ההצעה
  כדי לתת פרספקטיבה ("הושקעו פה ₪N על פני M צרכנים → תקרה סמלית של ₪K"). מותר לעבור אותה.

#### 2.5.4 פונקציה טהורה חדשה

`src/lib/server/revenue/computePlatformCeiling.ts`:

```
computePlatformCeiling({ investment, consumers })
  → { ceilingPerLev, investment, consumers, line: { he, en } }
```

נקראת לצד `computeSiteShare` (§3). הפלט `line` הוא הסבר תצוגתי, לא דרישה.

---

## 3. מודל חישוב חלק האתר — **ההצעה** (אמצע הטווח)

`computeSiteShare` מחשבת את **ההצעה** — האמצע בין הרצפה (§4) לתקרה (§2.5). זה מה שאנחנו
חושבים שראוי לתת, ובמכוון **לא** נגזר מההשקעה שלנו (זו התקרה) אלא **מהרווח/ההוצאה של
המשלם.** לא אחוז קשיח גלובלי, אלא **שורת־שירות (service line)** מוגדרת, שקופה וניתנת
להתאמה.

### 3.0 ✅ החלטת מוצר — בסיס לפי תפקיד (role-based)

**הבסיס נקבע לפי הצד המשלם, לא אחיד:**

| הצד | בסיס | פירוש |
|---|---|---|
| **ספק / מוכר** | `provider_earnings` | אחוז מ**הרווח שהספק הרוויח** בעסקה (לא מהמחיר ללקוח) |
| **לקוח / קונה** | `transaction_value` | אחוז מ**ההוצאה של הלקוח** (הסכום ששילם) |

> כלומר שני הצדדים תורמים לאתר, כל אחד על בסיס משלו: הספק נותן חלק מהרווח, הלקוח חלק
> מההוצאה. ב‑`computeSiteShare` הבסיס נבחר אוטומטית לפי `payerRole`.

### 3.1 קונפיגורציה (על הרקמה הראשית / config)

| שדה | סוג | תיאור |
|---|---|---|
| `siteSharePctProvider` | Decimal | אחוז מהרווח שמשלם **ספק** |
| `siteSharePctCustomer` | Decimal | אחוז מההוצאה שמשלם **לקוח** |
| `siteShareMin` / `siteShareMax` | Decimal nullable | רצפה/תקרה לסכום המוצע |
| `siteShareModelByKind` | JSON | override פר‑סוג עסקה / קטגוריה |

> האחוזים הם **מוצעים** בלבד — המספר הסופי ש"לב" משלם נקבע ב‑§4 (אפשר פחות/יותר).
> ערכי ברירת המחדל המספריים נשארים פרמטר קונפיג (לא hard-coded).

### 3.2 פונקציית החישוב המשותפת

`src/lib/server/revenue/computeSiteShare.ts` — פונקציה **טהורה**, נקראת משני המסלולים (DRY):

```
computeSiteShare({ payerRole, baseAmount, matbea, config, projectOverrides })
  → { siteAmount, matbea, basis, suggestedPct, line: { he, en } }
```

- `payerRole='customer'` → basis `transaction_value`: `siteAmount = clamp(baseAmount × pctCustomer, min, max)` (`baseAmount` = הוצאת הלקוח)
- `payerRole='provider'` → basis `provider_earnings`: `siteAmount = clamp(baseAmount × pctProvider, min, max)` (`baseAmount` = רווח הספק)

הפלט `line` הוא תיאור מילולי להצגה ("שירות ניהול ושותפות של 1lev1 — מוצע: ₪Y"), כדי
שהמשתמש יבין שזו **שורה בחבילה**, לא "מס".

> ב‑UI, ההצעה (`siteAmount`) מוצגת תמיד לצד התקרה התצוגתית מ‑`computePlatformCeiling`
> (§2.5): "מוצע ₪Y · בפיתוח הושקעו ₪N על פני M צרכנים (תקרה סמלית ₪K)". כך ההצעה
> ממוסגרת ביחס למוצר ולהשקעה — לא כמספר מנותק.

---

## 4. רכיב "הצעת סכום אחר" (Payer Adjustment)

בכל מקום שבו מציגים ל"לב" כמה לשלם (כולל חלק האתר), נוסיף אלמנט תשלום שממקם את המשלם על
הטווח רצפה→הצעה→תקרה (§0, עיקרון שלישי) עם שלוש אפשרויות:

```
שירות 1lev1 — מוצע: ₪Y
בפיתוח האתר הושקעו ₪N על פני M צרכנים → תקרה סמלית ₪K (אפשר גם לעבור)
  ( ) משלם כפי שמוצע
  ( ) אשמח להנחה — אשלם פחות   →  [ סכום ] [ סיבה (חובה) ]
  ( ) ארצה לשלם יותר          →  [ סכום ] [ סיבה (אופציונלי) ]
```

> התקרה מוצגת כהקשר תצוגתי בלבד (§2.5) — לא חוסמת. "ארצה לשלם יותר" מותר גם מעבר לתקרה.

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

- `api::project.project`: `isPlatform` Boolean. *(✅ קיים)*
- `api::matanot.matanot`: `isMainProduct` Boolean (§2.5) + `investmentCache` Decimal אופציונלי.
- `api::haluka.haluka`: `proposedAmount`, `adjustDirection`, `adjustReason`, `autoApproved` (+ `recive_project` ב‑R4).
- treasury user — נתון seed, לא שינוי סכמה (אופציה א).
- מקור מספר הצרכנים (denominator של התקרה) — count קיים על משתמשים/Sheirut, ללא שדה חדש.
- config — שדות `siteShare*` על הרקמה הראשית או ב‑settings entity.

---

## 8. קבצים שייגעו (best estimate)

### חדשים — Server
- `src/lib/server/revenue/computeSiteShare.ts` (חישוב טהור — ההצעה) *(✅ קיים)*
- `src/lib/server/revenue/computePlatformCeiling.ts` (חישוב טהור — התקרה, §2.5)
- `src/lib/server/revenue/platformProject.ts` (`getPlatformProject`, treasury) *(✅ קיים)*
- `src/lib/server/actions/configs/getMainProduct.ts` (read — מוצר ראשי + השקעה, §2.5)
- `src/lib/server/actions/configs/adjustSiteShare.ts`
- `src/lib/server/actions/configs/injectSiteShare.ts` (helper להזרקת hervachti+haluka)

### חדשים — Components
- `src/lib/components/revenue/SiteShareLine.svelte` (מציג הצעה + תקרה תצוגתית זה לצד זה)
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
| R0 | רקמה ראשית (`isPlatform` + treasury + `PLATFORM_PROJECT_ID`) + `computeSiteShare` + config. בלי UI. | תשתית חישוב + ישות. | – *(✅ מיושם)* |
| R1 | הזרקה במסלול A (moach split): שורת hervachti + Haluka לאתר, auto‑confirm. | חלוקה ידנית כוללת חלק לאתר. | `siteShare.manualSplit=on` *(✅ מיושם)* |
| R1.5 | מוצר ראשי (`isMainProduct`) + `computePlatformCeiling` + הצגת הטווח הצעה/תקרה ב‑`SiteShareLine`. | "ראו כמה הושקע" — תקרה תצוגתית לצד ההצעה. | `siteShare.ceiling=on` |
| R2 | אלמנט "הצעת סכום אחר" (less/more + סיבה) + אישרור אוטומטי. | המשלם מתאים את חלק האתר על הטווח; נרשם. | `siteShare.adjust=on` |
| R3 | הזרקה במסלול B (קונסיירז'/shared purchase). | התאמת קונסיירז' מזרימה חלק לאתר. | `siteShare.concierge=on` |
| R4 | דוחות/audit, `Haluka.recive_project`, BOM חי למוצר הראשי, multi‑currency, override פר‑קטגוריה. | בשלות + שקיפות. | `siteShare.reports=on` |

> R0–R1 הם הליבה (מיושמים). R1.5 מוסיף את מסגור־המוצר התצוגתי. ברירת מחדל של כל ה‑flags
> = off ⇒ אפס רגרסיה לחלוקה הקיימת.

---

## 10. תרחיש End‑to‑End (אחרי R2)

> שותפות "תפירה ירוקה" הזינה מכירה של ₪1,000 ב‑moach ולחצה "חלוקה".

1. המחשבון מחלק ₪1,000 בין 3 השותפים לפי תרומתם.
2. `computeSiteShare({basis:'transaction_value', baseAmount:1000})` → מוצע ₪50 ("שירות ניהול 1lev1").
2a. `computePlatformCeiling()` → בפיתוח הושקעו ₪900,000 על פני 6,000 צרכנים → תקרה סמלית ₪150. ה‑UI מציג: "מוצע ₪50 · תקרה ₪150 (אפשר גם לעבור)".
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
8. **התקרה כ‑anchoring** (§2.5) — הצגת מספר השקעה גדול עלולה "לעגן" מעלה ולפעול כלחץ.
   mitigation: ניסוח מפורש "תצוגתי, לא ביקוש", התקרה לעולם לא נכנסת כסכום ברירת־מחדל
   ל‑Haluka, וההצעה (§3) נשארת ברירת המחדל היחידה.
9. **מקור מספר הצרכנים** — איזה count מגדיר "צרכן" (משתמש רשום? עסקה שנסגרה?) משפיע ישירות
   על התקרה. החלטת מוצר; ברירת מחדל מוצעת = משתמשים ייחודיים עם לפחות Sheirut אחד שנסגר.
10. **השקעה לפני BOM חי** — עד שהמוצר הראשי יהפוך למוצר מורכב אמיתי, ההשקעה מגיעה מ‑seed
    (`investmentCache`). זה קביל ל‑R1.5; ה‑BOM החי הוא R4.
