# PLAN — חנות לקונים: וריאנטים, גלריה, זמינות והזמנות — דרך ה-API

> **מצב: בנוי חלקית.**
> נכתב 2026-10-16, אחרי קריאת הקוד (`apiPublic/*`, `qids.js`, `contentTypes.d.ts`,
> `/gift/[id]`, `createSheirutpend`) ולא אחרי הנחות. עודכן 2026-10-17 אחרי
> סקירה מול הקוד ומול הסכמה שנפרסה ב-`1.0b`.
>
> **מה כבר בנוי (S2, 2026-10-16):** שכבת הקריאה ירדה לקוד — `shop.ts` הטהור,
> ה-DTO המורחב, פרמטרי החנות ב-`query.ts`, `GET /options`, וחמשת ה-qids
> (`rikmaApiShopSchema`, `rikmaApiShopAttrs`, `rikmaApiShopVariants`,
> `rikmaApiShopAxes`, `rikmaApiOptions`). עד שהסכמה חיה, ה-API מזהה זאת בעצמו
> (`shopSchemaLive`) ומחזיר בדיוק את מה שהחזיר לפני התוכנית. פירוט ב-§7.2.
> **S2 נסגר (2026-10-18):** השדה `checkout` ב-DTO (`checkoutOf` ב-`shop.ts`),
> ו-`rikma-v1.openapi.yaml` עבר למודל ההזמנה ששולמה (§5.4).
> **S3 — חלק ראשון בנוי (2026-10-18):** `POST /orders`, `GET /orders/{ref}`,
> הפעולה `createPaidOrder`, `variantId`/`orderId` ב-`createSale`, ה-scopes
> `orders:*`. נשאר מ-S3: ביטול + איפוס מכירה `self`, `markOrderShipped`/
> `Fulfilled`, ו-webhooks. פירוט ומה צריך לפני שזה עולה: **§7.5**.
>
> **הסכמה (S1) נפרסה ב-`1.0b`** (`shabab`, 2026-10-16). הסקירה מצאה בה שבעה
> תיקונים — כולם בענף `ccr-21b574f2-p5actf` של `1.0b`, ממתינים למיזוג
> ולפריסה. הרשימה, וההרשאות שצריך לסמן אחרי הפריסה: **§6.9**.
>
> **משלים:**
> [PLAN_HEADLESS_PRODUCTS_API](../tbd/PLAN_HEADLESS_PRODUCTS_API.md) — החוזה והמסלול
> שנבנה (Phase 0/1/1b). המסמך הזה הוא **המשך שלו**: סעיף §4.7 (וריאנטים),
> §4.8 (הזמנות), §4.9 (אקסטרביליות) ו-Phase 3 הופכים כאן למפרט.
> [PLAN_MONEY_RAILS](../tbd/PLAN_MONEY_RAILS.md) — למה **אין** סליקה כאן (החלטה M2).
> [PLAN_COMPLEX_PRODUCTS](../done/PLAN_COMPLEX_PRODUCTS.md) (המתכון/ה-BOM),
> [PLAN_USER_OFFERINGS](../done/PLAN_USER_OFFERINGS.md) (מוצר של ספק יחיד),
> [PLAN_POOL_PRODUCT](./PLAN_POOL_PRODUCT.md) (מחיר צף),
> [PLAN_RIKMA_SUBDOMAINS](./PLAN_RIKMA_SUBDOMAINS.md) (הדף הציבורי).
>
> **ההחלטות שהתקבלו בסבב הזה (2026-10-16):**
> 1. **הלקוח במרכז הוא מי שצורך אותנו כבקאנד.** לא מכריחים אף אחד להשתמש
>    ב-1lev1 כפרונט: ה-API חייב לתת לחנות חיצונית מעוצבת את **כל** מה שצריך —
>    קטלוג, קטגוריות, זמינות, וריאנטים, גלריה, חיפוש ובקשת רכש.
> 2. **וריאנטים מלאים (SKU).** לכל וריאנט מחיר משלו, מלאי משלו ותמונות משלו.
> 3. **בקשת רכש, לא סליקה.** *(דויק בהחלטה 5: הסליקה באתר החיצוני, ואצלנו
>    נרשמת הזמנה ששולמה.)* "קנה" ⇒ הזמנה שנכנסת לרקמה כמו `/gift/[id]` היום
>    (Sheirutpend + צ'אט). הכסף לא עובר דרכנו (PLAN_MONEY_RAILS §D-M2).
> 4. **מודל אחד, שני משטחים.** אותה סכמה ואותו DTO גם לחנות בתוך 1lev1 וגם
>    ל-API. ה-API קודם; הפרונט הפנימי נגזר ממנו.
>
> **ההחלטות שהתקבלו בסבב השני (2026-10-17):**
> 5. **ה-MVP הוא מוצר במחיר קבוע שנמכר לקונה אנונימי, והסליקה באתר החיצוני.**
>    1lev1 לא מתמחר ולא מנהל משא ומתן במסלול הזה — הוא מקבל **הזמנה ששולמה**
>    (§3.3). בקשת רכש למוצר `quote` (עם Sheirutpend וצ'אט) היא S3b, אחרי ה-MVP.
> 6. **ההזמנה מדווחת מהשרת של האתר, לא מהדפדפן.** האתר (SvelteKit או כל
>    framework עם פונקציית שרת) קורא ל-`POST /orders` רק אחרי שספק התשלום שלו
>    אישר. כך אין משטח כתיבה ציבורי ואין אישור ידני לכל מכירה (§3.3, §5.4).
>    "מחליפים בקאנד" = הלקוח לא מנהל מסד נתונים, מלאי, הזמנות או פאנל ניהול;
>    נשארת לו פונקציה אחת, ותבנית פתיחה עושה אותה בשבילו (§7.4).
>    אתר סטטי בלי שרת — מסלול עם אישור ידני, אחרי ה-MVP (§3.5).
> 7. **וריאנטים הם חובה ל-MVP** — כולל העורך למוכר, שאין לו היום שום מסלול כתיבה.
> 8. **מסך המכירות במוח בשתי שכבות** (§7.3): הפשוטה נשארת ברירת המחדל ("כמה
>    כסף ממתין לחלוקה"); "מסך מכירות מתקדם" מוביל להזמנות, מוצרים, מלאי
>    ומכירות ברמה של תוכנת מכירות.

---

## 0. תקציר — מה נבנה בסוף

הרקמה מגדירה **אפשרויות** (מידה, צבע, נפח…). מכל צירוף נוצר **וריאנט** עם
מחיר, מלאי, מק"ט ותמונות משלו. המוצר מציג **גלריה** (עד 12 תמונות), וכל וריאנט
יכול להציג גלריה משלו. הקונה (באתר חיצוני או אצלנו) רואה מחיר שמתעדכן לפי
הבחירה, "נותרו 3", ובוחר כמות; הוא משלם **באתר החיצוני**, והשרת של האתר
מדווח **הזמנה ששולמה** עם השורות ופרטי המשלוח. ההזמנה נולדת בתוך הרקמה:
מכירה לכל שורה, המלאי יורד, והרקמה רואה אותה במסך ההזמנות כדי לשלוח.

(בקשת רכש למוצר שהמחיר שלו בהצעה — Sheirutpend, צ'אט תמחור, אישור — היא
אותו צינור של `/gift/[id]` היום, ונבנית אחרי ה-MVP: S3b, §3.5.)

שלוש שכבות, ובכוונה:

| שכבה | מה | למה |
|---|---|---|
| **סכמה (1.0b)** | `product-option`, `product-variant`, `order`, `order-line` + שדות על `matanot`/`category`/`sheirutpend`/`api-key` | הרשימה המלאה ב-**§6**. זה מה שצריך ליצור ב-Strapi |
| **API (1.0)** | DTO מורחב (`variants`, `images[]`, `priceRange`, `options`, `unit`, `delivery`), סינון/מיון על וריאנטים, `GET /options`, `POST /orders` (הזמנה ששולמה, מהשרת), `GET /orders/{ref}`, webhooks | §5 |
| **פרונט** | עורך וריאנטים/גלריה למוכר, מסך מכירות מתקדם במוח, ואז עמוד מוצר עם בורר וריאנטים | §7.3 + §8 |
| **תבנית פתיחה** | ריפו SvelteKit מוכן: קטלוג, בורר וריאנטים, עגלה, תשלום, ודיווח ההזמנה מהשרת | §7.4 |

**ומה לא נשבר:** ה-DTO של היום נשאר בתוקף. כל התוספות **additive** —
`images` היום הוא מערך עם תמונה אחת, ומחר הוא מערך עם שתים עשרה. צרכן קיים
שקורא `price`/`quant` ימשיך לעבוד, כי `price` נשאר מחיר הבסיס ו-`quant` נשאר
סמנטיקת המלאי (כולל `-1`).

---

## 1. מה "מערכת מכירות" דורשת — ומה יש היום

| # | מה שחנות צריכה | מה יש היום | פער | ראיה |
|---|---|---|---|---|
| 1 | **מחיר פר-וריאנט** (מידה/צבע) | `Matanot.price` — מספר אחד + `pricingMode` | 🔴 אין וריאנטים בכלל | `dto.ts` `ApiProduct`, `contentTypes.d.ts` `ApiMatanotMatanot` |
| 2 | **מלאי פר-וריאנט** | `Matanot.quant` (`-1` = ללא הגבלה) | 🔴 מלאי אחד לכל המוצר | `hamatanot.svelte:656`, `availabilityOf()` |
| 3 | **גלריה** | `Matanot.pic` — תמונה **אחת** (Media) | 🔴 שדות מרובי-מדיה קיימים בפלטפורמה (`Sp.pics`) אבל לא במוצר | `contentTypes.d.ts` (ApiSpSp) |
| 4 | **תמונות פר-וריאנט** | — | 🔴 | — |
| 5 | **קטגוריות עם נתיב/סדר/תמונה** | `Category.name` בלבד | 🟡 מספיק לסינון בסיסי, לא לתפריט חנות | `contentTypes.d.ts` (ApiCategoryCategory) |
| 6 | **זמינות מדווחת** ("נותרו 3") | `quant` יוצא כ-`availability` | 🟢 קיים, יתעדכן לסכימה על וריאנטים | `dto.ts` `availabilityOf` |
| 7 | **חיפוש, סינון, מיון** | `q`, `category`, `minPrice/maxPrice`, `sort` | 🟡 קיים על מחיר/מלאי **ברמת המוצר**; חסר סינון לפי וריאנט | `query.ts` `SORT_KEYS` |
| 8 | **יחידת מכירה וכמויות** (יח'/ק"ג, מינימום) | — | 🔴 `Sp` כבר יודע `unit`/`granularity`; `Matanot` לא | `contentTypes.d.ts` (ApiSpSp) |
| 9 | **בקשת רכש עם כמה מוצרים** | `Sheirutpend` עם `matanots` רבים אבל `quant`/`price` **אחדים** | 🔴 אין שורות הזמנה ⇒ אין סל | `contentTypes.d.ts` (ApiSheirutpendSheirutpend) |
| 10 | **מעקב סטטוס לקונה** | `/deals/request/[id]` — צ'אט פנימי | 🟡 יש לאדם רשום, אין ל-API | `gift/[id]/+page.svelte:121` |
| 11 | **webhooks על שינוי מלאי/הזמנה** | `WEBHOOK_ACTIONS = {createTask, updateTask}` | 🔴 אין `product.*`/`order.*` | `webhooks/dispatch.ts:28` |
| 12 | **מזהה מוצר ידידותי ל-URL** | `/r/<rikma>/products/1842` | 🟡 `externalKey` תוכנן (§9.10) ולא נבנה | PLAN_HEADLESS §9.10 |

השורה התחתונה: **הצד של המוכר (A) והצד של המפתח (C) קיימים; הצד של הקונה (D)
לא.** תשע מתוך שתים-עשרה שורות נוגעות ב-`Matanot` או בקולקציה חדשה.

---

## 2. המודל — משפת חנות לשפת 1lev1

### 2.1 אוצר המילים

| מושג בחנות | אצלנו | הערה |
|---|---|---|
| Product | `Matanot` | נשאר כמו שהוא, כולל המתכון |
| Option (ציר) | `product-option` (**חדש**) | "מידה" / "צבע" — ברמת **הרקמה**, לא ברמת המוצר |
| Option value | component `shop.option-value` | `size=m`, `color=red` + תווית מתורגמת |
| Variant (SKU) | `product-variant` (**חדש**) | צירוף של ערכי אפשרויות + מחיר + מלאי + תמונות |
| Availability | `product-variant.quant` / `Matanot.quant` | אותה סמנטיקה: `-1` = ללא הגבלה |
| Order (הזמנה) | `order` + `order-line` (**חדש**) | מה שהקונה קנה (MVP: ששולם) או ביקש (S3b) |
| ה-thread שמתמחר | `Sheirutpend` | **קיים** — הצ'אט, ההצעה, האישור |
| מכירה מדווחת | `Sale` | **קיים** — נוצרת אצלנו כמו היום |

### 2.2 למה קולקציות ולא JSON על `Matanot`

אפשר היה לשים `variants: json` על המוצר ולחסוך שתי קולקציות. זה נכשל בארבעה
מקומות, וכולם מופיעים בדיוק כשהחנות חיה:

1. **מלאי מתחרה.** שני קונים שקוראים-כותבים את אותו JSON מחליפים זה את מלאי
   כל **הווריאנטים האחרים** של המוצר (read-modify-write על כל המערך). שורה
   עצמאית מצמצמת את ההתנגשות לווריאנט עצמו — אבל **לא מבטלת אותה**: ב-Strapi
   GraphQL אין הפחתה אטומית, ו-`createSale` מחשב היום `newQuant` מ-
   `availableQuantity` שהקורא שולח. הפעולה החדשה קוראת את המלאי מהשרת לפני
   הכתיבה; התנגשות שנשארת מסומנת כמכירת-יתר (§5.4), לא נבלעת.
2. **סינון.** `?option.size=m` ו-`?available=true` הם שאילתות SQL. `json` לא
   ניתן לאינדוקס ב-Strapi/Postgres כמו עמודה.
3. **תרגום.** שם הציר והערכים מתורגמים לחמש שפות; לתרגום יש מחזור חיים משלו.
4. **קישור.** תמונה של וריאנט היא `UploadFile` — relation, לא מחרוזת ב-JSON.

המחיר: שתי קולקציות, שני `schema.json`, ו-qid אחד נוסף. זול מול שלוש התקלות
שלמעלה.

### 2.3 מה **נשאר** ברמת המוצר — ולמה אסור לגעת בו

המתכון (`matanot_recipe_missions` / `matanot_recipe_resources`), `marginPct`,
`estimatedPrice`, `entryCurrency`/`entryRate` — **כולם נשארים על `Matanot`,
אף אחד מהם לא יורד לוריאנט ולא מתווסף לו**. הסיבה אינה טכנית:

- הווריאנט הוא **מה שהקונה רואה**; המתכון הוא **מה שזה עולה לרקמה**
  (PLAN_HEADLESS §6.1). ערבוב ביניהם = דליפת עלות.
- **וריאנט לא מכפיל את עלות ההכנה.** "מידה M" ו"מידה L" של אותו מוצר חולקים
  את אותה משימה (`stepCapacity`, `costShape='stepped'`, `assignedMember`). אם
  המתכון היה ברמת הווריאנט, רקמה הייתה צריכה לנהל עשרים מתכונים לאותו מוצר —
  וזה בדיוק מה ש-PLAN_COMPLEX_PRODUCTS בנה כדי למנוע.
- המשמעות המעשית: **המלאי שמשפיע על הביצוע (`quant`) הוא סכום הווריאנטים;
  העלות היא של המוצר.** כשנמכר וריאנט, ה-`createSale` הקיים יוריד את המלאי של
  **הווריאנט** ואת זה של המוצר (השדה הנגזר), והביצוע נשאר כמו שהוא.

### 2.4 השדות הנגזרים — ההחלטה שמונעת join בכל בקשה

ל-`matanot` מתווספים ארבעה שדות **נגזרים** שנכתבים ע"י השרת בכל שמירת וריאנט:

| שדה | תוכן | למה זה ולא חישוב בזמן-קריאה |
|---|---|---|
| `hasVariants` | boolean | הסתעפות זולה בסינון (`?hasVariants=true`) |
| `priceMin` / `priceMax` | decimal | `sort=price` ו-`minPrice/maxPrice`. בלעדיהם כל מיון הוא join ＋ sort בזיכרון |
| `stockTotal` | decimal (`-1` = ללא הגבלה) | `?available=true` — היום זה `quant`, ומחר זה לא |
| `variantAxes` | json — `[{key,name,values:[{value,label}]}]` | שהרשימה תחזיר "יש M/L" בלי לשלוף עשרים וריאנטים לכל שורה |

**הכלל שמחזיק אותם ישרים (תוקן 2026-10-17): הם נכתבים ב-Strapi, ב-lifecycle,
לא באפליקציה.** `priceMin` נשאר מחושב **תמיד** — גם למוצר בלי וריאנטים, כשהוא
שווה ל-`price` — כי `sort=price` ממופה ל-`priceMin` (`query.ts`
`sortColumnOf`), ומוצר רגיל עם `null` היה נדחק לסוף כל מיון בקטלוג מעורב.

הנוסח הקודם הבטיח שהשדות "נכתבים רק ע"י פעולה אחת", וזה לא נכון:
`Matanot.quant` נכתב היום מ-`createSale`, מ-`updateMatanotQuant`, ממוטציה
גולמית ב-`src/routes/api/timegrama/decision.svelte` (התאמה בהבשלה), ו-`price`
מטפסי העריכה ומ-`editObject`. כל נתיב שלא יזכור לעדכן נגזר היה משאיר את המיון
והסינון משקרים בשקט. המקום היחיד שכל הנתיבים האלה עוברים בו הוא ה-DB, ולכן:

| lifecycle ב-`1.0b` | מה הוא עושה |
|---|---|
| `matanot` `beforeCreate`/`beforeUpdate` | כש-`hasVariants` אינו `true`: `priceMin = priceMax = price`, `stockTotal = quant`. כשהעדכון לא נוגע ב-`price`/`quant` — לא נוגע בנגזרים |
| `product-variant` `afterCreate`/`afterUpdate`/`afterDelete` | מחשב מחדש את ארבעת הנגזרים של המוצר מכל הווריאנטים **הפעילים** (`active=true`) ומדליק `hasVariants` |

החישוב עצמו (מינימום, סכום עם `-1`, תקציר הצירים) הוא אותה לוגיקה של
`shop.ts`, מועתקת ל-lifecycle עם בדיקות זהות. **ומכירה של מוצר עם וריאנטים
בלי `variantId` נדחית** (§5.4), כדי ש-`createSale` הישן לא יוריד את
`Matanot.quant` בלי וריאנט.

עד שה-lifecycle עולה, שורה שהנגזרים שלה ריקים נקראת דרך הענף הישן
(`legacyPriceBranch`, וענף ה-`stockTotal: { null: true }` של `available`),
כך ששום מוצר לא נעלם — רק המיון לפי מחיר בקטלוג מעורב לא מדויק.

> **מה אם השדות הנגזרים שגויים** (מישהו כתב מלאי ישירות ב-Strapi Admin):
> ה-DTO **לא סומך עליהם לתצוגה**. בקריאת פרט נטענים הווריאנטים עצמם
> והזמינות מחושבת מהם; השדות הנגזרים משמשים רק ל**סינון ולמיון** ב-SQL.
> זו אותה הפרדה של §12.4: הפילטר הוא קו ראשון, וה-JS מאמת אחריו.

### 2.5 מלאי: אותה סמנטיקה, עכשיו בשלוש רמות

| מצב | `quant` בווריאנט | מה שהקונה רואה |
|---|---|---|
| מלאי רגיל | `7` | "נותרו 7" |
| אזל | `0` | "אזל" + הווריאנט לא נבחר כברירת מחדל |
| ללא הגבלה | `-1` | "זמין" (בלי מספר) |
| הזמנה מראש | `0` + `Matanot.leadTimeHours` | "זמן אספקה: 3 שבועות" (Phase 3) |

מוצר **בלי** וריאנטים ממשיך להתנהג כמו היום (`Matanot.quant`), ו-`stockTotal`
שלו הוא העתק שה-lifecycle כותב (§2.4). אין שני חוקים — יש רמה אחת שמאכילה את
השנייה.

**הזמנה מראש:** מלאי `0` עם `leadTimeHours` אינו "אזל". הזמנה עליו מתקבלת
(§5.4), והמלאי יורד מתחת לאפס — זה מספר ההזמנות שממתינות לייצור.

---

## 3. חוויית הקונה — איך זה נראה בפועל

> זה מה שהצרכן בונה מולו. כל שורה כאן ממופה לסעיף ב-§5 (החוזה) או §6 (הסכמה).

### 3.1 רשימת המוצרים (החנות)

- כרטיס: תמונת שער, שם, **מחיר מ-`priceRange.min`** (או `price` בודד),
  תג "יש וריאנטים"/"אזל", קטגוריה, מוכר.
- באתר חיצוני: `GET /api/v1/r/haohel/products?limit=24&sort=-updatedAt`
  ⇒ לכל שורה `images[0]`, `priceRange`, `hasVariants`, `availability`, `url`,
  `buyUrl`. אין צורך בקריאה שנייה לכל כרטיס.

### 3.2 עמוד מוצר

- **גלריה**: `images[]` — 12 תמונות, `images[0]` היא השער. כל תמונה עם
  `width`/`height` כדי שהאתר ימנע קפיצת פריסה.
- **בורר וריאנטים**: `options[]` (צירים וערכים), ו-`variants[]` —
  לכל וריאנט `optionValues`, `price`, `availability`, `images`.
  **כל שינוי בחירה מעדכן מחיר, מלאי ותמונות — הכל כבר בתשובה אחת.**
- **יחידה וכמויות**: `unit` ("ק\"ג"), `minOrder`, `maxOrder`.
- **אספקה**: `leadTimeHours`, `delivery[]` (איסוף/משלוח/דיגיטלי + הערה).
- **פעולה**: `checkout` — `true` רק למוצר `pricingMode:'fixed'` שאינו בארכיון:
  זה מה שמותר למכור בקופה של האתר. מוצר `quote`/`estimated` או pool (מחיר צף)
  לא נמכר בקופה — האתר מפנה ל-`buyUrl` (בקשת רכש אצלנו).
  באתר חיצוני, אחרי תשלום: `POST /orders` מהשרת (§3.3).

### 3.3 הזמנה ששולמה — מסלול ה-MVP

הקונה בוחר וריאנטים וכמויות באתר, משלם **אצל ספק התשלום של האתר**, ורק
אחרי שספק התשלום אישר (webhook / IPN) — **השרת של האתר** מדווח:

```http
POST /api/v1/r/haohel/orders
Authorization: Bearer 1lev1_…            # מפתח orders:create — בשרת בלבד
```

```json
{
  "externalId": "pi_3Q8x…",
  "paymentRef": "pi_3Q8x…", "paymentMethod": "card",
  "amount": 660, "currency": "ILS",
  "buyer": { "name": "דנה", "email": "dana@example.com", "phone": "050-…" },
  "delivery": { "preference": "delivery",
                "address": { "city": "נתניה", "street": "הרצל 1" } },
  "note": "אם אפשר בלי פלסטיק",
  "lines": [
    { "productId": "1842", "variantId": "77", "quantity": 2, "unitPrice": 310 },
    { "productId": "1901", "quantity": 1, "unitPrice": 40 }
  ]
}
```

מה שקורה אצלנו, בפעולה אחת (`createPaidOrder`, §7):

1. נכתבת `order` בסטטוס `paid` עם `order-line` לכל שורה (כולל snapshot של
   שם, וריאנט, SKU ותמונה), ופרטי הקונה והמשלוח.
2. נוצרת `Sale` **לכל שורה** דרך `createSale` הקיים — עם `product_variant`,
   `order`, `source:'api'`, `externalId` של השורה (`<externalId>:<n>`), והסכום
   **ששולם בפועל** (`unitPrice × quantity`; קופון או הנחה של האתר הם עניין שלו).
3. המלאי יורד — של הווריאנט ושל המוצר. **הזמנה ששולמה לא נדחית בגלל מלאי**:
   הכסף כבר נגבה. אם המלאי לא הספיק, ההזמנה מסומנת `oversold` והרקמה מקבלת
   התראה.
4. הרקמה מקבלת התראה על הזמנה חדשה, וההזמנה מופיעה במסך ההזמנות (§7.3).

**מי מחזיק בכסף:** `holder` של ההזמנה, ו-`holderUserId` של כל מכירה, הוא בעל
המפתח — החבר שחשבון הסליקה שלו. זה דיווח עצמי ריבוני ("הכסף אצלי"), ולכן
המכירה `holderStatus:'self'` ונספרת מיד, **בלי אישור ידני**. אם הסליקה נכנסת
לחשבון של חבר אחר, מפתח נפרד שלו — לא `holderUserId` אחר בגוף הבקשה (שהיה
פותח `saleClaim` לכל מכירה).

**למה מהשרת ולא מהדפדפן:** מפתח שיושב ב-JavaScript של הדפדפן גלוי לכל אחד,
ו-`allowed_origins` לא מגן מחוץ לדפדפן. מי שמחזיק `orders:create` יכול לייצר
מכירות שמשנות יתרות ואחוזים של שותפים. אישור ספק התשלום מגיע ממילא לשרת —
ושם, ורק שם, הדיווח קורה. תבנית הפתיחה (§7.4) עושה את זה בשביל הלקוח.

### 3.4 אחרי ההזמנה

| סטטוס | מי | מה הקונה רואה באתר |
|---|---|---|
| `paid` | נוצר עם ההזמנה | "ההזמנה התקבלה" |
| `shipped` | חבר ברקמה, במסך ההזמנות | "נשלח" (+ `shippedAt`) |
| `fulfilled` | חבר ברקמה, או איסוף | "נמסר" (+ `fulfilledAt`) |
| `cancelled` | הקונה (דרך האתר) או הרקמה בהסכמת הקונה | "בוטל" — והמכירות מקבלות הצעה נגדית לסכום 0 (§5.4) |

האתר קורא את הסטטוס ב-`GET /orders/{ref}` (מהשרת), או מקבל אותו ב-webhook
`order.statusChanged` (§5.6). אין לקונה צ'אט במסלול הזה — הקשר איתו נשאר אצל
האתר.

### 3.5 מה בא אחרי ה-MVP

- **אתר סטטי, בלי שרת** — `POST /checkout` עם מפתח ציבורי (`checkout:create`,
  `allowed_origins`, rate limit לפי IP) יוצר הזמנה ב-`pendingPayment` ומחזיר
  מזהה ללינק תשלום (ביט לעסקים, PayBox, דף ספק). המכירה נוצרת רק כשמחזיק
  הכסף מאשר "התשלום התקבל" במסך ההזמנות. זה אישור ידני, אבל הוא בא עם כל
  פרטי המשלוח, אז הוא חלק טבעי מהטיפול בהזמנה. **הזמנה כזו לא מבשילה
  בשתיקה** — אחרת ספאם היה הופך למכירות. מה שלא אושר פג (`expiresAt`).
- **אישור תשלום אוטומטי** — 1lev1 מקבל בעצמו את ה-webhook של ספק תשלום
  נתמך (PLAN_MONEY_RAILS M1, אחרי בחירת הספק ב-O-M1).
- **בקשת רכש למוצר `quote` (S3b)** — הזמנה ב-`sent` שנולד ממנה `Sheirutpend`
  עם צ'אט תמחור, כמו `/gift/[id]` היום. כאן הקונה חייב חשבון (או טוקן קונה)
  כדי להשתתף בצ'אט ולאשר את המחיר; שתיקה שלו אינה "כן" (C-19), ותשובת
  הרקמה היא אישור / צ'אט / הצעה נגדית — לא דחייה.

---

## 4. עקרונות שאין לשבור במימוש

1. **whitelist, לא blacklist** (PLAN_HEADLESS §5.3) — כל שדה חדש נכנס ל-DTO
   **במפורש**, כולל `variants`. וריאנט נושא `price`/`quant`/`images` — ולא
   `assignedMember`/`stepCapacity`, כי אלה של המתכון.
2. **ברירת מחדל שמרנית ב-API.** וריאנטים נכנסים ל-`GET /products/{id}`
   ורק עם `?expand=variants` לרשימה. רשימה עם 24 מוצרים × 12 וריאנטים היא
   payload שמישהו ישלם עליו בחשבון הסלולרי.
3. **אין מחיקה, יש ארכיון.** וריאנט שנימכר בעבר נשאר לקריאה (הזמנות ישנות
   מפנות אליו) ומסומן `active=false`. `DELETE` הוא מסלול שובר-היסטוריה.
4. **ה-tenant נשאר כפול** (מפתח + נתיב, §5.1 ב-PLAN_HEADLESS) — גם
   לווריאנטים: `variants` של מוצר אחר לא נכנסים, גם אם שוגרו ids.
5. **הסטיות מותרות, ההפתעות לא.** `?minPrice` עובר לעבוד על טווח המחירים
   (`priceMax >= minPrice ∧ priceMin <= maxPrice`); זה מתועד, לא מתגלה.
6. **שינוי מחיר הוא שינוי תנאי המוצר.** מוצר של רקמה נולד ב-`matanotpend`
   ונערך ב-`editObject` (PLAN_OBJECT_ARCHIVAL). אותו דבר לווריאנטים:
   - **תפעולי, מיידי:** מלאי, תמונות, סדר, `active`, `compareAtPrice`.
   - **תנאים, דרך `editObject`:** וריאנט חדש, שינוי `price` של וריאנט או של
     המוצר. במסך זה מוצג כ"ממתין לאישור הרקמה" — לא כשמירה שנכשלה.
   - **מוצר אישי** (`origin:'personal'`) נשאר ריבוני ומיידי.
7. **מכירה ששולמה לא נדחית.** כשהכסף כבר נגבה באתר, אין `409` על מלאי או על
   מגבלת כמות — רושמים, מסמנים, ומודיעים לרקמה (§5.4).
8. **כל כתיבה דרך פעולה.** `saveProductVariants`, `createPaidOrder`,
   `markOrderShipped` — לא qids ישירים מהקומפוננטה. רק כך יש authz, הסכמה,
   ו-webhooks (`WEBHOOK_ACTIONS` ב-`webhooks/dispatch.ts` יורה רק מפעולות).

---

## 5. חוזה ה-API (v1.1 — תוספת בלבד)

### 5.1 ה-DTO המורחב

```jsonc
{
  "id": "1842",
  "name": "סדנת קרמיקה",
  "status": "published",
  "price": 280, "currency": "ILS", "pricingMode": "fixed",
  "priceRange": { "min": 280, "max": 420, "currency": "ILS" },   // חדש; null ב-quote
  "hasVariants": true,                                            // חדש
  "checkout": true,                                               // חדש — מותר למכור בקופה (§3.2)
  "availability": { "unlimited": false, "quantity": 17 },         // מסוכם מהווריאנטים
  "unit": "מקום", "minOrder": 1, "maxOrder": 8,                   // חדש
  "leadTimeHours": 168,                                           // חדש
  "attributes": { "material": "חרס", "audience": "מבוגרים" },      // חדש (§4.9)
  "delivery": [                                                   // חדש
    { "kind": "pickup",   "note": "בסטודיו, תיאום מראש", "fee": 0, "currency": "ILS" },
    { "kind": "delivery", "note": "עד 5 ק\"מ",           "fee": 40, "currency": "ILS" }
  ],
  "images": [ /* גלריה — images[0] הוא השער */ ],
  "options": [                                                    // חדש
    { "key": "size",  "name": "מידה", "values": [ { "value": "m", "label": "M" }, … ] },
    { "key": "color", "name": "צבע",  "values": [ { "value": "red", "label": "אדום", "hex": "#c33" }, … ] }
  ],
  "variants": [                                                   // חדש — בפרט תמיד, ברשימה רק ב-expand
    {
      "id": "77", "sku": "KER-S-M-RED", "name": "M / אדום",
      "optionValues": [ { "key": "size", "value": "m", "label": "M" },
                        { "key": "color", "value": "red", "label": "אדום" } ],
      "price": 310, "compareAtPrice": 360,
      "availability": { "unlimited": false, "quantity": 3 },
      "images": [], "active": true, "externalKey": "m-red"
    }
  ],
  "seller": { }, "geo": { }, "categories": [ ], "dates": { },
  "locale": "he", "translated": false, "updatedAt": "…",
  "url": "https://www.1lev1.com/gift/1842",
  "buyUrl": "https://www.1lev1.com/gift/1842#request"
}
```

**כלל הזמינות:** כש-`variants` נטענים, `availability` ו-`priceRange`
מחושבים **מהם**; כשלא, מ-`stockTotal`/`priceMin`/`priceMax`
(הנגזרים, §2.4); ואם גם אלה חסרים — מ-`quant`/`price` כמו היום.
שלוש שכבות, סדר עדיפויות ברור, ואף פעם לא מספר מומצא.

### 5.2 פרמטרים חדשים

| פרמטר | דוגמה | מה זה עושה |
|---|---|---|
| `hasVariants` | `?hasVariants=true` | רק מוצרים עם וריאנטים |
| `available` | `?available=true` | קיים; עובר לסכם וריאנטים (`stockTotal`), עם נפילה ל-`quant` |
| `option.<key>` | `?option.size=m&option.color=red` | סינון לפי ציר — `variants.axisKey contains "\|size:m\|"` |
| `minPrice`/`maxPrice` | `?minPrice=100&maxPrice=400` | **טווח** מול `priceMin`/`priceMax` |
| `expand` | `?expand=variants,rikma` | `variants` חדש; `rikma` קיים |
| `inStock` | `?inStock=true` | כינוי ל-`available=true` (נוחות; מתועד) |
| `sku` | `?sku=KER-S-M-RED` | מוצר שמכיל את ה-SKU (לתמיכה ולקונסיירז') |

`sort=price` ממשיך לעבוד — הוא ממופה ל-`priceMin` (§2.4), כך שהוא נכון גם
למוצר עם וריאנטים. `?sort=` מקבל גם `priceMax`.

**ולידציה כמו היום:** פרמטר לא מוכר ⇒ `400`. `?option.` בלי ערך ⇒ `400`
(בלי "סינון שקט" שלא סינן).

### 5.3 endpoints חדשים

```
GET  /api/v1/r/{rikma}/options                 # צירי הרקמה + הערכים + מונה מוצרים לכל ערך
POST /api/v1/r/{rikma}/orders                  # הזמנה ששולמה — מהשרת (scope orders:create)
POST /api/v1/r/{rikma}/orders/{ref}/cancel     # ביטול / החזר (scope orders:create)
GET  /api/v1/r/{rikma}/orders/{ref}            # מעקב (scope orders:read)
POST /api/v1/r/{rikma}/checkout                # אחרי ה-MVP — אתר סטטי (scope checkout:create, §3.5)
GET  /api/v1/r/{rikma}/changes?since=ISO       # Phase 2 — sync אינקרמנטלי למטמון הלקוח
```

`GET /options`:

```json
{ "rikma": { "id": "57", "slug": "haohel" },
  "options": [
    { "key": "size", "name": "מידה",
      "values": [ { "value": "s", "label": "S", "products": 12 },
                  { "value": "m", "label": "M", "products": 9 } ] }
  ] }
```

המונים מחושבים מאותו `buildCatalogFilters` של הקטלוג — כלומר מחריגים טיוטות
וארכיון לאנונימי, בדיוק כמו הרשימה. **מונה הוא הדלפה** אם הוא נספר משורה
שהמסנן היה אמור להפיל (אותה שיטה של `fetchCategories`).

שני כללים שנקבעו במימוש (`catalog.ts` `fetchOptions`):

- **ערך עם `products: 0` לא מוחזר, וציר בלי ערכים לא מוחזר.** סינון שמוביל
  לחנות ריקה הוא סינון שבור — כמו קטגוריה בלי מוצרים.
- **המונה נספר משורות הווריאנטים עצמן**, לא מהשדה הנגזר `variantAxes`:
  הערך שהקונה לוחץ עליו חייב להחזיר בדיוק את המספר שהראה. וריאנט `active:false`
  לא נספר (וגם לא נספר במוצר אחר — הספירה היא של מוצרים, לא של וריאנטים).
- **אין פרמטרים** ב-`GET /options`: זו ניווט, לא משטח חיפוש. סינון *בתוך*
  ציר הוא `?option.<key>=<value>` על `/products`.

### 5.4 `POST /orders` — הזמנה ששולמה (MVP)

**בקשה** — כמו §3.3. מהשרת בלבד, scope `orders:create`.

| שדה | חובה | הערות |
|---|---|---|
| `externalId` | ✔ | מזהה העסקה אצל ספק התשלום. **מפתח האידמפוטנטיות** (יחד עם הרקמה) |
| `lines[]` | ✔ | `productId`, `quantity>0`, `unitPrice` (מה שנגבה בפועל ליחידה); `variantId` חובה למוצר עם וריאנטים |
| `currency` | | ברירת מחדל: מטבע הרקמה. אותו כלל של `sales` (PLAN_MULTI_CURRENCY) |
| `amount` | | סכום כולל שנגבה. אם נשלח ואינו שווה לסכום השורות + משלוח — נרשם כפי שנשלח, והפער נכתב ל-`note` של ההזמנה |
| `buyer` | | `name` / `email` / `phone`. לפחות `email` **או** `phone` כשיש משלוח — אחרת אין למי לחזור |
| `delivery` | | `preference` (`pickup`·`delivery`·`digital`·`contact`), `address`, `fee` |
| `paymentRef`, `paymentMethod`, `note` | | חופשי, לתצוגה במסך ההזמנות |

**ולידציות** (בשרת, לפני כל כתיבה, ואטומי — שורה אחת פסולה ⇒ שום דבר לא נכתב):

| מצב | תשובה |
|---|---|
| מוצר לא של הרקמה / טיוטה / בארכיון | `404 PRODUCT_NOT_FOUND` |
| מוצר שאינו `checkout` (`quote`/pool) | `409 NOT_CHECKOUTABLE` |
| מוצר עם וריאנטים ושורה בלי `variantId` | `409 VARIANT_REQUIRED` |
| וריאנט שלא שייך למוצר | `404 VARIANT_NOT_FOUND` |
| אותו `externalId`, **אותו** גוף | `200` עם `duplicated: true` ואותה הזמנה |
| אותו `externalId`, גוף **שונה** | `409 EXTERNAL_ID_CONFLICT` |
| שגיאות שדה | `400` עם `details.lines[]` |

**מה במכוון לא נדחה** (עיקרון 7 ב-§4): מלאי שלא הספיק, וריאנט `active=false`,
כמות מחוץ ל-`minOrder`/`maxOrder`. כל אלה כבר שולמו — ההזמנה נרשמת עם
`oversold: true` ו/או הערה, והרקמה מקבלת התראה. המלאי יכול לרדת מתחת לאפס.

**תשובה** `201`:

```json
{ "success": true, "duplicated": false,
  "orderRef": "57:pi_3Q8x…", "status": "paid", "oversold": false,
  "total": 660, "currency": "ILS",
  "lines": [ { "productId": "1842", "variantId": "77", "quantity": 2,
               "name": "סדנת קרמיקה", "optionLabel": "M / אדום",
               "unitPrice": 310, "saleId": "5521" } ] }
```

**ביטול / החזר:** `POST /orders/{ref}/cancel` (scope `orders:create`) — ההזמנה
עוברת ל-`cancelled`, המלאי חוזר, וכל מכירה מקבלת **הצעה נגדית לסכום 0**
("לא קיבלתי כלום" — לא מחיקה; PLAN_sale_holder_consent). מכירה שכבר נכנסה
לחלוקה לא נפתחת מחדש בשקט: הרקמה מקבלת התראה על החזר אחרי חלוקה.
**חסר בקוד:** `counterSaleClaim` עובד היום רק על `saleClaim` פתוח; למכירה
`self` אין עדיין מסלול איפוס. בונים אותו ב-S3 — אחרת אין דרך לדווח על החזר.

### 5.5 scopes

| scope | למי | הערה |
|---|---|---|
| `products:read` | אתר הלקוח | קיים |
| `products:read:draft` | בונה האתר | קיים |
| **`orders:create`** | **השרת** של האתר | חדש — הזמנה ששולמה וביטול. **אסור בדפדפן**: הפאנל מציג את זה ליד הצ'קבוקס, ומפתח עם scope זה ו-`allowed_origins` מקבל אזהרה |
| **`orders:read`** | השרת של האתר | חדש — `GET /orders/{ref}` (סטטוס, שורות, בלי פרטי הקונה) |
| `checkout:create` | הדפדפן (אתר סטטי) | **אחרי ה-MVP** (§3.5) — מפתח ציבורי שיוצר רק `pendingPayment` |
| `sales:report` / `tasks:*` | אינטגרציות | קיימים |

`GRANTABLE_SCOPES` ב-`src/routes/api/api-keys/+server.ts` + צ'קבוקסים
ב-`RikmaApiPanel.svelte`. **בלי שינוי סכמה** — `scopes` הוא JSON.

### 5.6 webhooks

ל-MVP (על `api-key.webhook_events` הקיים):

```
order.paid           order.statusChanged   (data.status: shipped | fulfilled | cancelled)
order.oversold       variant.stockChanged  (data.changed=["quant"], data.quant)
```

אחר כך: `product.created | product.updated | product.archived`,
`variant.created | variant.updated`.

**התנאי:** webhooks יורים רק מפעולות (`WEBHOOK_ACTIONS`). לכן כל אחד מהם מחייב
שהשינוי יעבור דרך פעולה (עיקרון 8 ב-§4) — מלאי שמשתנה ב-qid ישיר לא ייצא החוצה.

ה-payload נושא את ה-DTO הציבורי. **פרטי הקונה** (שם, טלפון, מייל, כתובת) **לא
נשלחים ב-webhook** ולא ב-`GET /orders/{ref}`: האתר כבר יודע אותם, והם נשארים
גלויים רק לחברי הרקמה. חתימה כמו היום (§5.7 ב-PLAN_HEADLESS).

### 5.7 קודי שגיאה חדשים

`409 VARIANT_REQUIRED` · `404 VARIANT_NOT_FOUND` · `409 NOT_CHECKOUTABLE` ·
`409 EXTERNAL_ID_CONFLICT` · `409 DUPLICATE_VARIANT` (עורך הווריאנטים: אותו
צירוף פעמיים) · `409 DUPLICATE_SKU` (אותו SKU פעמיים ברקמה) ·
`403 SCOPE_MISSING` עם `orders:create`.

(`OUT_OF_STOCK` ו-`QUANTITY_LIMIT` שהיו כאן ירדו: במסלול של הזמנה ששולמה אין
להם מקום. הם יחזרו ב-`POST /checkout` של §3.5, שם עוד לא נגבה כסף.)

### 5.8 גרסה

`X-1lev1-Api-Version` עולה ל-**`2026-11-01`** כשהשדות החדשים נכנסים לתשובה
הראשונה (§6.6 ב-PLAN_HEADLESS). צרכן שלא קורא אותם לא מושפע; צרכן שכן —
מקבל `variants` ריק כל עוד אין דאטה.

---

## 6. סכמת Strapi (1.0b)

> **מצב (2026-10-17):** כל הישויות בסעיף הזה **נפרסו** ב-`shabab`. הטבלאות
> למטה הן המפרט המקורי; מה שהסקירה מצאה בהן, ומה שתוקן, ב-**§6.9** — היא
> הגוברת כשיש סתירה.

> **איפה:** ריפו `1.0b`, ענף מבוסס `shabab` (Strapi 4.20), כפי שנעשה בכל
> שינוי סכמה קודם (`PLAN_EXTERNAL_TASKS_API` Phase 0, `PLAN_MULTI_CURRENCY` §3).
> **איך:** Content-Type Builder או `schema.json` ישירות; אחרי המיזוג והפריסה —
> הרשאות, ואז `npm run types:update` בריפו הזה.
>
> **המקור לאימות הוא ה-Strapi החי.** `src/lib/generated/contentTypes.d.ts`
> בריפו הזה מפגר אחרי המציאות (למשל `api-key` שם בלי `project`/`scopes`/
> `revoked` — שקיימים בקוד ובמסד). לכן: מה שכתוב כאן נכון ל-2026-10-16 וכל
> שדה צריך אימות מול המסד החי לפני יצירה.

### 6.0 סיכום הישויות

| # | ישות | סוג | מה |
|---|---|---|---|
| 1 | `product-option` | קולקציה חדשה | צירי וריאציה של הרקמה |
| 2 | `shop.option-value` | קומפוננט חדש | ערך בציר (M / אדום) |
| 3 | `product-variant` | קולקציה חדשה | ה-SKU: מחיר, מלאי, תמונות |
| 4 | `order` | קולקציה חדשה | הזמנה של הקונה — ששולמה (MVP) או בקשת רכש (S3b) |
| 5 | `order-line` | קולקציה חדשה | שורה בהזמנה (מוצר + וריאנט + כמות) |
| 6 | `matanot` | תוספות | גלריה, נגזרים, יחידה, אספקה, attributes |
| 7 | `category` | תוספות | slug, אב, סדר, תמונה, בעלים |
| 8 | `sheirutpend` | תוספות | `order`, פרטי קונה, `source` |
| 9 | `api-key` | תוספות | `expiresAt`, `env`, `quotaPerDay` (מ-§4.2) |

---

### 6.1 `product-option` — ציר וריאציה

**api::product-option.product-option** · `draftAndPublish: false` (§6.9 #7) ·
`i18n.localized: true`

| שדה | טיפוס | חובה | ברירת מחדל | הערות |
|---|---|---|---|---|
| `name` | string | ✔ | — | "מידה" — מתורגם (5 שפות) |
| `key` | string (slug) | ✔ | — | `size`, `color`, `volume` — לא מתורגם |
| `project` | relation manyToOne → `project` | ✔ | — | ה-tenant. ציר שייך לרקמה |
| `values` | component `shop.option-value`, repeatable | ✔ | — | |
| `position` | integer | | `0` | סדר הצגת הצירים |
| `active` | boolean | | `true` | כיבוי בלי לשבור היסטוריה |
| `archived` | boolean | | `false` | |

**ייחודיות:** `(project, key)` — נאכף בפעולה (Strapi לא תומך ב-unique מורכב
ב-GUI; ראו §6.8).

**component `shop.option-value`** (`shop.option-value`):

| שדה | טיפוס | חובה | הערות |
|---|---|---|---|
| `value` | string | ✔ | `m`, `red` — המזהה שבסינון (`?option.size=m`) וב-`axisKey`. **תמיד באותיות קטנות**: זו הצורה שנכתבת לווריאנטים, וההשוואה במונה ובסינון היא אחרי `trim().toLowerCase()` (הבדיקה ב-`shop.ts`) |
| `label` | string | | "M" / "אדום" — מתורגם; ריק ⇒ נופל ל-`value` |
| `position` | integer | | סדר ההצגה בחנות |
| `hex` | string | | `#c33` — ריבוע צבע בתצוגה |
| `image` | media (single) | | תמונת דוגמית ל-Swatch |

---

### 6.2 `product-variant` — ה-SKU

**api::product-variant.product-variant** · `draftAndPublish: false` ·
**לא מתורגם** (`i18n.localized: false`)

| שדה | טיפוס | חובה | ברירת מחדל | הערות |
|---|---|---|---|---|
| `matanot` | relation manyToOne → `matanot` | ✔ | — | ההורה |
| `project` | relation manyToOne → `project` | ✔ | — | **דנורמליזציה** כמו ב-`Sale`: סינון tenant ו-webhooks בלי join |
| `sku` | string | ✔ | — | `KER-S-M-RED` — ייחודי **פר-רקמה**, נאכף בפעולה (§6.9 #1) |
| `name` | string | | — | "M / אדום" — נגזר מהערכים, לעריכה חופשית |
| `axisKey` | string | ✔ | — | `\|size:m\|color:red\|` — ממופתח לפי `key`, עם `\|` בהתחלה ובסוף. **זה מה שמאפשר `?option.size=m`** |
| `optionValues` | json | ✔ | — | `[{"key":"size","value":"m","label":"M"}]` — תמונת מצב להצגה |
| `price` | decimal | | `null` | `null` ⇒ מחיר המוצר (`Matanot.price`) |
| `compareAtPrice` | decimal | | `null` | מחיר "לפני" — תצוגת מבצע בלבד |
| `quant` | decimal | | `0` | `-1` = ללא הגבלה (אותה סמנטיקה) |
| `pics` | media (multiple) | | — | גלריה של הווריאנט (0 ⇒ גלריה של המוצר) |
| `barcode` | string | | — | |
| `weightGrams` | integer | | — | למשלוח עתידי |
| `active` | boolean | | `true` | `false` ⇒ לא נבחר ולא נמכר, נשאר בהיסטוריה |
| `position` | integer | | `0` | סדר בבורר |
| `externalKey` | string | | — | מפתח URL ידידותי (§9.10) |

**ייחודיות:** `(project, sku)` ו-`(matanot, axisKey)` — שתיהן נאכפות בפעולה:
וריאנט שני לאותו צירוף היה "מידה M פעמיים בכלוב".

**למה לא מתורגם:** מלאי ומחיר הם **מספרים ומלאי פיזי**, לא תוכן. תרגום היה
יוצר ספירת מלאי כפולה לכל שפה — באג מלאי, לא פיצ'ר. התוויות מתורגמות ב-
`product-option` (וה-`label` שנלווה לווריאנט נגזר ממנו).

---

### 6.3 `order` + `order-line` — בקשת הרכש

**api::order.order** · `draftAndPublish: false` · לא מתורגם

| שדה | טיפוס | חובה | ברירת מחדל | הערות |
|---|---|---|---|---|
| `ref` | string, **unique** | ✔ | — | `57:web-2026-8811` — המזהה החוצה (`/orders/{ref}`) |
| `externalId` | string | | — | מהצרכן. אידמפוטנטיות |
| `project` | relation manyToOne → `project` | ✔ | — | הרקמה שמקבלת את הבקשה |
| `status` | enum `sent・seen・priced・accepted・pendingPayment・paid・shipped・fulfilled・cancelled` | | `sent` | MVP: נוצר ב-`paid` (§3.3); `sent…accepted` ל-S3b. שאר השדות שנוספו: §6.9 #6 |
| `source` | enum `ui・api` | | `ui` | "מאיפה הגיע" — כמו `Act.source` |
| `buyerName` | string | | — | |
| `buyerEmail` | email | | — | |
| `buyerPhone` | string | | — | **רגיש** — לא יוצא ב-API ציבורי, לא ב-webhook |
| `buyer_user` | relation manyToOne → `users-permissions.user` | | — | ריק ⇒ קונה אנונימי. **בדיוק בשביל זה הצעת רכש לא דורשת חשבון** |
| `note` | text | | — | "בלי בצל" |
| `deliveryPreference` | enum `pickup・delivery・digital・contact` | | `contact` | |
| `deliveryAddress` | json | | — | `{city, street, zip, notes}` |
| `requestedDate` | datetime | | — | "אני צריכה את זה עד…" |
| `currencyCode` | string (ISO) | | ממטבע הרקמה | `ILS` — PLAN_MULTI_CURRENCY |
| `total` | decimal | | `null` | `null` = טרם תומחר (quote) |
| `locale` | string | | — | שפת הבקשה |
| `sheirutpends` | relation oneToMany → `sheirutpend` | | — | ה-thread הפנימי שמתמחר ומבצע |
| `archived` | boolean | | `false` | |

**api::order-line.order-line** (או component — ראו ההערה בסוף הסעיף) ·
`draftAndPublish: false` · לא מתורגם

| שדה | טיפוס | חובה | הערות |
|---|---|---|---|
| `order` | relation manyToOne → `order` | ✔ | |
| `matanot` | relation manyToOne → `matanot` | ✔ | |
| `variant` | relation manyToOne → `product-variant` | | ריק ⇒ מוצר בלי וריאנטים |
| `nameSnapshot` | string | | מה שהקונה ראה |
| `optionLabelSnapshot` | string | | "M / אדום" |
| `skuSnapshot` | string | | |
| `imageUrlSnapshot` | string | | תמונת השעה — שלא תלויה במחיקה עתידית |
| `quantity` | decimal | ✔ | `1` |
| `unitPrice` | decimal | | `null` = בהצעה |
| `currencyCode` | string | | |
| `lineTotal` | decimal | | `unitPrice × quantity` |
| `note` | string | | "בלי הקדשה" |
| `position` | integer | | סדר השורות |

> **למה קולקציה ולא component** (`shop.order-line`): קומפוננט לא מקבל יחסים
> נקיים ל-`matanot` ולמוצר-וריאנט בשתי שכבות (`component` בתוך `component`),
> ואי אפשר לשלוף ממנו "כל ההזמנות של המוצר הזה" בלי לפתוח כל הזמנה. שתי
> קולקציות = שאילתה אחת. **החריג היחיד** היכן ש-component מתאים:
> `shop.option-value` (§6.1), כי הוא באמת מוטבע ואין לו חיים עצמאיים.

---

### 6.4 שדות שנוספים ל-`matanot`

| שדה | טיפוס | i18n | ברירת מחדל | הערות |
|---|---|---|---|---|
| `pics` | **media (multiple)** | localized | — | הגלריה. `pic` נשאר השער |
| `hasVariants` | boolean | לא | `false` | **נגזר** (§2.4) |
| `priceMin` | decimal | localized | — | **נגזר** — מחיר הבסיס כשאין וריאנטים |
| `priceMax` | decimal | localized | — | **נגזר** |
| `stockTotal` | decimal | localized | — | **נגזר** — `-1` = ללא הגבלה |
| `variantAxes` | json | localized | — | **נגזר** — תקציר לצרכן הרשימה |
| `options` | relation manyToMany → `product-option` | — | — | הצירים שהמוצר משתמש בהם |
| `variants` | relation oneToMany → `product-variant` | לא | — | **הצד השני של היחס** — בלעדיו אי אפשר לשלוף וריאנטים של מוצר (`GET /options` נשען עליו), ובעורך הווריאנטים הוא מה שמציג "הווריאנטים שלי". ב-Content-Type Builder: כשמוסיפים את השדה `matanot` בקולקציית הווריאנט, שם השדה ההפוך הוא `variants` |
| `externalKey` | string | localized | — | כתובת ידידותית (§9.10) |
| `unit` | string | localized | — | "יח'", "ק\"ג", "מקום" |
| `minOrder` | decimal | localized | `1` | מינימום להזמנה |
| `maxOrder` | decimal | localized | — | מקסימום להזמנה |
| `leadTimeHours` | integer | לא | — | זמן אספקה ב-שעות |
| `attributes` | json | localized | — | §4.9 — מבוקר, בלי HTML |
| `deliveryOptions` | json | localized | — | `[{kind,note,fee,currency}]` |
| `shopNote` | string | localized | — | הערה חופשית לתצוגה בחנות |

**מה במכוון לא כאן:** `variantCount` (נספר בשאילתה), `sku` ברמת המוצר
(`variant.sku`), `seoTitle`/`seoDescription` (P2), `videoUrl` (P2).

---

### 6.5 `category` — תוספות

| שדה | טיפוס | הערות |
|---|---|---|
| `slug` | string (slug) | `keramics` — לתפריט ולכתובת. ייחודי |
| `parent` | relation manyToOne → `category` | תת-קטגוריות |
| `position` | integer (`0`) | סדר בתפריט |
| `image` | media (single) | כרטיס קטגוריה |
| `description` | text | |
| `project` | relation manyToOne → `project` | **ריק = קטגוריה גלובלית** (מה שיש היום); מלא = קטגוריה של רקמה |
| `active` | boolean (`true`) | הסתרה בלי מחיקה |

**תאימות לאחור:** כל הקטגוריות הקיימות נשארות גלובליות (`project = null`),
וה-`/categories` מחזיר גם אותן. אין נדידת נתונים — יש שדה אופציונלי.

---

### 6.6 `sheirutpend` — תוספות

| שדה | טיפוס | הערות |
|---|---|---|
| `order` | relation manyToOne → `order` | הבקשה שממנה נולד. ריק = בקשה פנימית |
| `buyerName` / `buyerEmail` / `buyerPhone` | string / email / string | קונה בלי חשבון |
| `source` | enum `ui・api` | |

`matanots` (manyToMany) כבר קיים — בקשה יכולה להתייחס לכמה מוצרים.
`quant`/`price`/`total` נשארים כ**סיכום** לבקשה כולה; הפירוט יושב ב-`order-line`
(עבור בקשות שהגיעו מ-API/חנות). בקשה שנוצרת ב-`/gift/[id]` נשארת בדיוק כמו
היום — בלי `order` ובלי שורות.

### 6.7 `api-key` — תוספות (מ-PLAN_HEADLESS §4.2)

| שדה | טיפוס | הערות |
|---|---|---|
| `expiresAt` | datetime | `null` = לא פג. הצ'קבוקס בפאנל מציג |
| `env` | enum `test・live・both` (`both`) | מפתח בדיקה לדאטה אמיתי-למחצה |
| `quotaPerDay` | integer | מכסה מדווחת (האכיפה ב-Phase 4) |

### 6.8 מדיה, הרשאות, qids, סדר פריסה

**מדיה (`1.0b/config/plugins.js`, `upload`):**

```js
breakpoints: {
  thumbnail: 156, small: 300, xsmall: 300, medium: 600,
  card: 900, large: 1000, hero: 1600, og: 1200
}
```
גלריה של 12 תמונות בגודל מקורי היא חשבון Cloudinary של הרקמה. ארבע מידות
מפורשות (300/600/900/1600) מספיקות ל-`srcset` אמיתי, והצרכן מקבל
`width`/`height` לכל תמונה (§5.1). **ה-`og` נשאר 1200×630** לשיתופים.

**הרשאות:** אין צורך בפתיחת הרשאות ל-Public. ה-API קורא דרך `strapiClient`
עם טוקן שירות (`serviceAdmin`), בדיוק כמו היום. **אבל** העורך למוכר ומסך
ההזמנות כותבים עם ה-JWT של המשתמש, ולכן לקולקציות החדשות צריך לסמן הרשאות
ל-Authenticated (§6.9) — אחרת 403 על סכמה שנפרסה.

**qids חדשים (append-only) + שורה ב-`qidsAccess.js` (`serviceAdmin` בלבד):**

| qid | מה | מצב |
|---|---|---|
| `rikmaApiShopSchema` | בדיקת קיום הסכמה (`hasVariants` כשדה בודק) | ✅ |
| `rikmaApiShopAttrs` | `pics` + השדות הנגזרים + הצירים + יחידה/אספקה של מוצרי העמוד (במקום להכניס אותם לשאילתת הקטלוג — §7.1) | ✅ |
| `rikmaApiShopVariants` | שורות הווריאנטים של מוצרי העמוד | ✅ |
| `rikmaApiShopAxes` | זוגות האפשרויות פר-מוצר (דרך יחס `variants` של המוצר) — למונה ב-`/options` | ✅ |
| `rikmaApiOptions` | הצירים והערכים של הרקמה | ✅ |
| `rikmaApiOrderCreate` / `rikmaApiOrderLineCreate` | כתיבת `order` + `order-line` | ✅ |
| `rikmaApiOrderByRef` | הזמנה עם שורות ומכירות — מעקב, אידמפוטנטיות והמשך כתיבה שנקטעה | ✅ |
| `ordersApiProject` / `ordersApiProducts` / `ordersApiVariants` | מה ש-`planOrder` מחליט לפיו, מגודר לרקמה בשאילתה | ✅ |
| `saleProductHasVariants` / `saleVariantInfo` / `saleLinkShop` | `createSale`: השומר, המלאי של הווריאנט, הקישור מכירה↔וריאנט/הזמנה | ✅ |
| `rikmaApiOrderSetStatus` | `shipped` / `fulfilled` / `cancelled` + חותמות זמן | ⛔ S3 |
| `rikmaApiVariantQuant` | עדכון מלאי של וריאנט | ✅ |
| `shopVariantsSave` / `shopOptionsSave` | העורך למוכר (יצירה/עדכון וריאנטים וצירים) | ⛔ S4 |
| `moachOrders` | רשימת ההזמנות למסך ההזמנות, עם שורות ופרטי קונה | ⛔ S5 |
| `rikmaApiOrderLink` | קישור ה-`Sheirutpend`/פורום להזמנה | ⛔ S3b (אחרי ה-MVP) |

**סדר הפריסה — Strapi קודם, תמיד:**
1. ליצור את הסכמה ב-`1.0b` ולפרוס.
2. `npm run types:update` כאן (codegen) — `contentTypes.d.ts` ו-`graphql.ts`.
3. לפרוס את `1.0`. **עד שהסכמה לא חיה, הקוד לא שואל את השדות החדשים**:
   הם נשלפים ב-qid נפרד עם `try/catch` (§7), כך שגם אם קוד עולה לפניהם —
   החנות עובדת, רק בלי וריאנטים, והלוג אומר למה.

**ייחודיות מורכבת (`(project, key)`, `(matanot, axisKey)`):** נאכפת בפעולה
השומרת, לא במסד. Strapi לא חושף unique מורכב ב-Content-Type Builder; אילוץ
אמיתי ידרוש migration ידני (`ALTER TABLE … ADD CONSTRAINT`). **ההמלצה:**
להתחיל באכיפה בפעולה (עם `409 DUPLICATE_VARIANT` ברור), ולהוסיף את האילוץ
בבסיס הנתונים כשיהיה נפח שמצדיק זאת.

### 6.9 מה נפרס — והתיקונים (סקירה 2026-10-17)

נבדק ישירות מול `1.0b@shabab` (`src/api/*/content-types/*/schema.json`).

**תקין כפי שנפרס:**
- `order.sheirutpends` ↔ `sheirutpend.order` ו-`matanot.variants` ↔
  `product-variant.matanot` — יחס אחד כל אחד, שני הצדדים מסונכרנים.
- `stockTotal`, `minOrder`, `maxOrder`, `leadTimeHours`, `hasVariants`,
  `externalKey` על `matanot` — `localized: false`.
- `api-key`: `expiresAt`, `env`, `quotaPerDay` קיימים.
- `upload.breakpoints` מוגדרים; GraphQL `defaultLimit: 250` — יחסים מקוננים בלי
  `pagination` (`rikmaApiShopAxes`, `pics`) לא נחתכים ב-10.

**תוקן — ענף `ccr-21b574f2-p5actf` ב-`1.0b`, מוזג ל-`shabab` (PR #17); הפריסה לא אומתה מכאן:**

| # | איפה | מה | למה |
|---|---|---|---|
| 1 | `product-variant.sku` | הוסר `unique` | הוא היה גלובלי לכל הרקמות. ייחודי **פר-רקמה**, נאכף ב-`saveProductVariants` (`409 DUPLICATE_SKU`) |
| 2 | `sale.product_variant` | חדש, manyToOne ↔ `product-variant.sales` | בלעדיו מכירה לא יודעת איזה וריאנט נמכר, ואין ממה להוריד מלאי |
| 3 | `sale.order` | חדש, manyToOne ↔ `order.sales` | מכירה לכל שורה, וכולן קשורות להזמנה |
| 4 | `order-line.order` | `inversedBy: "lines"` (+ `order.lines`) | קריאת הזמנה עם שורותיה בשאילתה אחת |
| 5 | `order.status` | + `pendingPayment`, `paid`, `shipped`; הוסר `declined` | הסטטוסים תיארו רק משא ומתן; "אין לא מוחלט" |
| 6 | `order` | + `holder` (↔ `User.orders_held`), `paymentRef`, `paymentMethod`, `paidAt`, `shippedAt`, `fulfilledAt`, `expiresAt`, `publicTokenHash`, `oversold` | מה שהזמנה ששולמה ומסך ההזמנות צריכים |
| 7 | `product-option` | `draftAndPublish: false` | `active` כבר מסתיר ציר; קריאה בלי `publicationState` לא ראתה ציר שלא פורסם. הטבלה ריקה — אין טיוטות שיאבדו |

**אחרי הפריסה — חובה:**
1. Settings → Users & Permissions → Roles → **Authenticated**: `find`,
   `findOne`, `create`, `update` על `order`, `order-line`, `product-variant`,
   `product-option` (CLAUDE.md של `1.0b`: קולקציה חדשה נפרסת בלי אף הרשאה).
2. `npm run types:update` בריפו הזה.

**לא דחוף (לא חוסם את ה-MVP):**
- `pics`, `priceMin`, `priceMax`, `variantAxes` על `matanot` הם `localized: true`.
  בפועל אין למוצרים שורות לוקליזציה (אין `createMatanotLocalization` בקוד),
  כך שהיום זה לא מזיק. אם יופיעו — גלריה ומחיר יתפצלו לפי שפה.
- `product-option.name` ו-`option-value.label` מתורגמים ב-i18n של Strapi. לפי
  CLAUDE.md, טקסט שחבר הקליד שייך ל-T3 (`fields.js` + `backfillSources.ts`).
  כנ"ל `unit`, `shopNote`, `attributes`, והערות ב-`deliveryOptions`. עד
  המעבר: לכתוב ולקרוא רק בשפת ברירת המחדל.
- `category.slug` מתורגם ועם D&P — רלוונטי רק לקטגוריות פר-רקמה (לא ב-MVP).
- ה-lifecycle שכותב את השדות הנגזרים (§2.4) — קוד ב-`1.0b`, לא סכמה. נדרש
  לפני שמיון לפי מחיר בקטלוג מעורב נכון.

---

## 7. מה נדרש בקוד (`1.0`) — מיפוי קבצים

| שכבה | קובץ | מה | מצב |
|---|---|---|---|
| **טהור** | `src/lib/server/apiPublic/shop.ts` (חדש) | `galleryOf`, `variantsOf`, `optionsOf`, `optionAxesOf`, `priceRangeOf`, `checkoutOf`, `axisKeyOf`, `availabilityOf`, `attributesOf`, `deliveryOf`, `buyingUnitOf` — כל חישובי החנות, בלי Strapi | ✅ בנוי + 32 בדיקות |
| **קריאה** | `src/lib/server/apiPublic/catalog.ts` | `shopSchemaLive()`, `fetchShopRows()`, `fetchVariantRows()`, `fetchOptions()` — qids נפרדים + דירוג + cache; מיזוג לתשובה | ✅ בנוי |
| **הטלה** | `src/lib/server/apiPublic/dto.ts` | `ApiVariant`, `ApiOption`, `ApiPriceRange`, `ApiDelivery`, `ApiShop`; `toApiProduct(node, rikma, shop?)` דרך `toApiShop()` | ✅ בנוי |
| **שאילתה** | `src/lib/server/apiPublic/query.ts` | `hasVariants`, `available`/`inStock`, `option.<key>`, `expand=variants`, `sku`, `priceMax`; `price` → `priceMin`; `matchesNothing` | ✅ בנוי |
| **כתיבה** | `src/lib/server/apiPublic/writeApi.ts` + `src/lib/server/ordersApi.ts` (חדש) | ולידציה (`validateOrderPayload`) + החלטות (`planOrder`) + אידמפוטנטיות (`sameOrder`/`canResume`) + תצוגה בלי הקונה (`toOrderView`) — אותה תבנית של `salesApi.ts`/`tasksApi.ts` | ✅ + 30 בדיקות |
| **route** | `src/routes/api/v1/r/[rikma]/{options,orders,orders/[ref],orders/[ref]/cancel}/+server.ts` | דקים; כל הלוגיקה ב-`apiPublic/`. `options`, `orders`, `orders/[ref]` ✅; `cancel` ⛔ | חלקי + 17 בדיקות |
| **פעולה** | `src/lib/server/actions/configs/createPaidOrder.ts` (חדש) | כותב `order` (`paid`) + שורות, וקורא ל-`createSale` לכל שורה עם `variantId` + `orderId`; מסמן `oversold`; התראה לרקמה. webhook `order.paid` — ⛔ | ✅ + 11 בדיקות |
| **פעולה** | `createSale.ts` (קיים) | + `variantId`/`orderId`; דוחה מוצר עם וריאנטים בלי `variantId`; מוריד את מלאי הווריאנט (נקרא מהשרת) | ✅ |
| **פעולות** | `markOrderShipped` / `markOrderFulfilled` / `cancelOrder` (חדשות) | `projectMember`; `cancelOrder` מאפס את המכירות (הצעה נגדית ל-0 — המסלול ל-`self` חסר, §5.4) ומחזיר מלאי | ⛔ S3 |
| **פעולה** | `saveProductVariants` / `saveProductOptions` (חדשות) | העורך למוכר. מלאי/תמונות/`active` מיידי; וריאנט חדש או מחיר ⇒ `editObject` במוצר של רקמה (§4 עיקרון 6); ייחודיות `(project, sku)` ו-`(matanot, axisKey)` | ⛔ S4 |
| **lifecycle** | `1.0b`: `src/api/matanot/…/lifecycles.js`, `src/api/product-variant/…/lifecycles.js` | השדות הנגזרים (§2.4) | ⛔ S4 |
| **עורך למוכר** | `src/lib/components/products/` | העלאת גלריה (סדר, alt, שער), מחולל מטריצת וריאנטים, עריכה מרוכזת של מחיר/מלאי, תמונות לווריאנט | ⛔ S4 |
| **מסך מכירות** | `src/routes/(reg)/moach/[projectId]/sales/` + `sales/manage/` (חדש) | שתי שכבות — §7.3 | ⛔ S5 |
| **תבנית פתיחה** | ריפו נפרד (`1lev1-shop-starter`) | §7.4 | ⛔ S6 |
| **שוק/חנות פנימית** | `src/lib/components/products/MatanotPublicView.svelte`, `/gift/[id]` | גלריה + בורר וריאנטים + כמות | ⛔ אחרי ה-MVP |
| **תרגומים** | `src/lib/translations/{he,en,es,ar,ru}/` | בורר, זמינות, שגיאות, מסך ההזמנות והמסך המתקדם + `check:i18n` | עם כל שלב |
| **OpenAPI** | `docs/tbd/api/rikma-v1.openapi.yaml` | `ApiVariant`, `ApiOption`, `checkout`, `/options`, `/orders`, `/orders/{ref}/cancel`, פרמטרים חדשים | ✅ (החוזה; `/orders` ימומש ב-S3) |
| **qids** | `src/routes/api/send/qids.js`, `qidsAccess.js` | §6.8 |

**הכלל שמחזיק את זה:** כל שדה חדש מגיע ל-DTO דרך `shop.ts`, וכל חישוב
(מחיר מינימום, זמינות מסוכמת, `axisKey`) הוא פונקציה טהורה עם בדיקה —
כך שמי שישנה וריאנטים בעתיד יראה מיד מה נשבר, בלי לחכות ל-Strapi.

### 7.1 איך הקריאה עובדת היום — שלוש שאילתות נפרדות, ובכוונה

`rikmaApiProducts` **לא** שואל שדות של חנות. שדה שלא קיים בסכמה הוא שגיאת
ולידציה של GraphQL שמפילה את **כל** השאילתה, ולכן הקוד מריץ לפניה שתי
שאילתות אופציונליות, כל אחת עם `try/catch` משלה:

| qid | מתי | אם הוא נכשל |
|---|---|---|
| `rikmaApiShopSchema` | פעם בעשר דקות לפרוסס (`hasVariants` כשדה בודק) | "הסכמה עוד לא חיה" ⇒ כל השדות החדשים ריקים, והתשובה זהה למה שהיה לפני התוכנית |
| `rikmaApiShopAttrs` | לכל עמוד/פרט — גלריה, נגזרים, צירים, יחידה, אספקה | התשובה ממשיכה בלעדיהם (`pic` בודד, `quant`) |
| `rikmaApiShopVariants` | **רק** בפרט מוצר או `expand=variants` | הרשימה לא מחזירה וריאנטים; הפרט מדרדר ל-`stockTotal`/`price` |

מסקנה תפעולית: **מותר לפרוס את `1.0` לפני `1.0b`.** ברגע שהסכמה תהיה שם,
הבדיקה תתפוס זאת לבד בעשר הדקות הבאות בלי דיפלוי מחדש.

### 7.2 מה נשאר ל-S2 שהסתיים

`GET /options` בנוי (`fetchOptions` + `optionAxesOf` + route + 6 בדיקות), עם
כלל אחד שהוכרע כאן: **ערך בלי מוצר מאחוריו לא מוצג** — כמו קטגוריה ריקה
(`fetchCategories`). המונים נספרים משורות הווריאנטים עצמן ולא מהשדה הנגזר
`variantAxes`, מאותה סיבה שהסינון קורא לווריאנטים: מונה וסינון שלא מסכימים
גרועים מאין מונה.

**נסגר ב-2026-10-18:**

- **`checkout`** (§3.2, §5.1) — `checkoutOf` ב-`shop.ts`: `true` רק למוצר
  `published`, `pricingMode:'fixed'`, עם `price` שאינו `null` (`0` הוא מחיר).
  מאגד ביקוש (PLAN_POOL_PRODUCT) הוא `maagad-offer` ולא שורת מוצר, ולכן אינו
  מגיע לקטלוג ואין לו ענף כאן.
- **דליפה שנסגרה בדרך:** `priceRangeOf` בדק את `price === null` (מוצר `quote`)
  רק *אחרי* השדות הנגזרים. ה-lifecycle (§2.4) כותב `priceMin = price` בלי קשר
  ל-`pricingMode`, כך שמוצר `quote` עם `price` שנשאר בשורה היה מפרסם דרך
  `priceRange` את המספר ש-`price: null` מסתיר. הבדיקה עלתה לראש הפונקציה.
- **OpenAPI** — `checkout` ב-`Product`; `/orders` עבר מ"בקשת רכש" להזמנה
  ששולמה (`OrderRequest` עם `externalId`/`unitPrice`/`amount`, `OrderAccepted`
  עם `orderRef`/`oversold`, `Order`, `OrderStatus`); נוסף
  `POST /orders/{ref}/cancel`; קודי השגיאה `OUT_OF_STOCK`/`QUANTITY_LIMIT`
  הוחלפו ב-`NOT_CHECKOUTABLE`/`EXTERNAL_ID_CONFLICT` (§5.7); `Variant.price`
  מתואר כפי שהקוד מחזיר אותו (כבר עם נפילה למחיר המוצר).

### 7.3 מסך המכירות במוח — שתי שכבות

היום `/moach/[projectId]/sales` מציג את `hamatanot.svelte` (כרטיסי מוצרים,
סכומים, טבלת מכירות במודאל) ואת `SalesApiIntegration`. רוב חברי הרקמה רוצים
ממנו דבר אחד — כמה כסף ממתין לחלוקה — ומוכר עם חנות חיה צריך תוכנת מכירות.
מסך אחד לא יכול להיות שניהם בלי לסבך את הראשונים.

**שכבה פשוטה — ברירת המחדל, `/moach/[projectId]/sales`** (כמעט כמו היום):
- **כמה ממתין לחלוקה**, וכפתור "חלק" — הדבר הראשון בעמוד.
- המכירות האחרונות, "דווח מכירה".
- **פס אחד** כשיש הזמנות שמחכות למשלוח או מכירת-יתר: "3 הזמנות ממתינות
  למשלוח →". בלי זה ההזמנות מהאתר נעלמות ממי שלא נכנס למסך המתקדם.
- כפתור **"מסך מכירות מתקדם"**.

**שכבה מתקדמת — `/moach/[projectId]/sales/manage`**, לשוניות בנוסח Shopify:

| לשונית | מה יש בה | שלב |
|---|---|---|
| **הזמנות** | רשימה עם סינון (סטטוס, תאריך, ערוץ `ui`/`api`), פרטי קונה ומשלוח, "נשלח" / "נמסר" / ביטול, הדפסת תעודת משלוח, תג `oversold` | MVP |
| **מוצרים** | טבלה עם עריכה בשורה של מחיר ומלאי, מטריצת וריאנטים, גלריה, עריכה מרוכזת. שינוי מחיר במוצר של רקמה מוצג כ"ממתין לאישור הרקמה" (§4 עיקרון 6) | MVP |
| **מלאי** | לפי וריאנט, התראת מלאי נמוך, מכירות-יתר | MVP |
| **מכירות** | טבלה מלאה: מוצר / וריאנט / ערוץ / מחזיק / סטטוס חלוקה, טווח תאריכים, ייצוא CSV | MVP |
| **חיבורים** | מפתחות API ו-scopes, webhooks וה-delivery log שלהם, קישור לתבנית הפתיחה (`SalesApiIntegration` עובר לכאן) | MVP |
| **לקוחות** | קונים חוזרים לפי מייל/טלפון | אחרי |

**"תואם לכל תוכנת מכירות":** ייבוא וייצוא מוצרים ב-**CSV בפורמט Shopify**
(`Handle`, `Title`, `Option1 Name`/`Option1 Value`…, `Variant SKU`,
`Variant Price`, `Variant Inventory Qty`, `Image Src`). זה הפורמט שכל מערכת
מכירות מכירה — מעבר אלינו בלי הקלדה מחדש, ויציאה בלי נעילה. ייצוא ב-MVP,
ייבוא אחריו (ייבוא של מחירים במוצר של רקמה עובר `editObject` כמו כל עריכה).

**עקרונות למסך המתקדם:**
- כל פעולה בו היא action (§4 עיקרון 8) — לא qid ישיר מהקומפוננטה.
- הנתונים של הלשוניות נטענים רק כשנכנסים אליהן; השכבה הפשוטה לא משלמת עליהן.
- פרטי הקונה גלויים לחברי הרקמה בלבד (`projectMember`), ולא נטענים ב-SSR
  של דף ציבורי כלשהו.
- הטקסטים ב-`$t()` (namespace `shop`, ב-`ROUTED` רק לנתיבי `sales/*`).
  כותרת הדף ב-`sales/+page.svelte` היא היום `$lang === 'he' ? …` — לתקן לאותו
  namespace כשנוגעים בקובץ.

### 7.4 תבנית פתיחה — "Deploy to Vercel" במקום בקאנד

כדי ש"צריך שרת" לא יהיה מחסום, 1lev1 מספק ריפו SvelteKit מוכן
(`1lev1-shop-starter`), שעולה ל-Vercel/Netlify בלחיצה:

- **קטלוג:** רשימה (`GET /products`), סינון לפי קטגוריה וציר (`?option.size=m`),
  עמוד מוצר עם גלריה ובורר וריאנטים — מחיר, מלאי ותמונות מתעדכנים לפי הבחירה.
- **עגלה** ב-`localStorage`, בלי חשבון.
- **תשלום:** מעבר לדף התשלום של ספק נתמך (מתאם אחד ל-MVP — Stripe Checkout
  או ספק ישראלי לפי O-M1), עם `externalId` של העסקה.
- **פונקציית שרת אחת:** מקבלת את ה-webhook של ספק התשלום, מאמתת את החתימה,
  וקוראת ל-`POST /orders`. זה המקום היחיד שבו `orders:create` יושב (משתנה סביבה).
- **דף "ההזמנה התקבלה"** שקורא את הסטטוס מהשרת (`GET /orders/{ref}`).
- כל הטקסטים בקובץ אחד, RTL כברירת מחדל, עיצוב שקל להחליף.

הלקוח מגדיר שלושה משתני סביבה (כתובת הרקמה, מפתח קריאה, מפתח `orders:create`)
וסוד ה-webhook של ספק התשלום — וזה כל ה"בקאנד" שלו.


### 7.5 S3 — מה נבנה, מה הוכרע בדרך, ומה צריך לפני שזה עולה

**נבנה (2026-10-18):** `POST /api/v1/r/{rikma}/orders`, `GET …/orders/{ref}`,
`createPaidOrder`, `variantId`/`orderId` ב-`createSale`, ה-scopes
`orders:create`/`orders:read` (`GRANTABLE_SCOPES` + `RikmaApiPanel` עם הערת
"שרת בלבד" בחמש שפות).

**הוכרע במימוש:**

- **"מהשרת בלבד" נאכף, לא רק נכתב.** בקשה עם כותרת `Origin` נדחית ב-`403
  ORIGIN_NOT_ALLOWED` — דפדפן שולח אותה תמיד ב-POST חוצה-אתרים, `fetch` של
  שרת לא. ל-endpoints של ההזמנות אין CORS ואין `OPTIONS`.
- **אטומיות = הכל מוחלט לפני הכתיבה הראשונה, והמשך אחרי נפילה.** `planOrder`
  מחליט כל שורה (404/409) לפני שנכתב משהו. אם הכתיבה נקטעת באמצע, ה-retry של
  ספק התשלום מוצא את ההזמנה לפי `ref` וכותב רק את מה שחסר. המכירה של כל שורה
  נמצאת לפי ה-`externalId` שלה (`pi_x:n`), כך שמכירה שהקישור שלה להזמנה לא
  נקלט מאומצת (והקישור מתוקן) ולא נרשמת פעמיים. `canResume` מוודא שזו אותה
  הזמנה: השורות שכבר נכתבו תואמות במקומן, וה-`total` שנכתב ראשון תואם — מה
  שתופס retry ש*הוסיף* שורה.
- **"אותו גוף" (`sameOrder`)** = השורות (מוצר, וריאנט, כמות, מחיר ליחידה,
  בסדר) והמטבע. תיקון טלפון של הקונה הוא אותה הזמנה; שינוי כמות הוא `409`.
- **מכירה של וריאנט לא נוגעת ב-`Matanot.quant`.** המלאי שזז הוא של הווריאנט
  (נקרא מהשרת ברגע המכירה). סך המוצר הוא `stockTotal`, שה-lifecycle של
  `product-variant` גוזר (§2.4) — **עד S4 הוא לא מתעדכן**, ולכן `?available=`
  ברשימה יכול לפגר אחרי מכירת וריאנט; הפרט מחשב מהווריאנטים ונכון.
- **השומר ב-`createSale`** (`hasVariants` בלי `variantId` ⇒ `VARIANT_REQUIRED`)
  לא חוסם מכירה כשהבדיקה עצמה נכשלת — בסכמה בלי העמודה אין מוצרים עם וריאנטים.
- **הקישור מכירה↔וריאנט/הזמנה הוא מוטציה נפרדת** (`saleLinkShop`), כך
  ש-`createSaleRecord` ממשיך לעבוד בפריסה שאין בה את העמודות. הוא best-effort
  ורץ אחרי שהמלאי זז; הזמנה שהקישור שלה חסר משלימה אותו ב-retry.
- **התראה לחברי הרקמה** פעם אחת (לא ב-retry), `intent: 'review'` כשיש מכירת-יתר.
- **מטבע:** הזמנה במטבע הרקמה לא מועברת כ-`entryCurrency` (אין מה להמיר, ואין
  קריאה למטבע הרקמה בכל שורה).

**לפני שזה עולה — חובה:**

1. לוודא ש-`1.0b@shabab` (כולל PR #17, תיקוני §6.9) **נפרס**.
2. הרשאות ב-Strapi לקולקציות החדשות, **בשני המקומות** (קולקציה חדשה נפרסת בלי
   אף הרשאה): ה-**API token** של השרת (`ADMINMONTHER`) — `find`/`findOne`/
   `create`/`update` על `order`, `order-line`, `product-variant`; ו-`update` על
   `sale` עם השדות `order`/`product_variant`. וה-**Authenticated** (§6.9) —
   ל-`createSale` מהממשק כשיעביר `variantId` (S4/S9).
3. `npm run types:update`. `validate:qids` עובר כבר היום, אבל מול הסכמה
   הישנה שב-`src/generated/`.
4. אין צורך בסדר פריסה מיוחד: עד שהסכמה חיה, `/orders` עונה `503
   SHOP_NOT_READY` (אותה בדיקת `shopSchemaLive` של הקטלוג).

**נשאר מ-S3:** `POST /orders/{ref}/cancel` + מסלול איפוס למכירה `self`
(§5.4), `markOrderShipped`/`markOrderFulfilled` (`rikmaApiOrderSetStatus`),
webhooks `order.*`/`variant.stockChanged` (היום `WEBHOOK_ACTIONS` מכיר רק
מטלות — זה הרחבה של `webhooks/dispatch.ts`).

---

## 8. פאזות ואומדנים

| פאזה | תכולה | תלות | אומדן |
|---|---|---|---|
| **S0** | המסמך + מפרט הסכמה (§6) | — | ✅ |
| **S1** | הסכמה ב-`1.0b` + פריסה + `types:update` | S0 | ✅ נפרסה 2026-10-16. **תיקוני §6.9** — ענף מוכן, ממתין למיזוג, פריסה והרשאות Authenticated |
| **S2** | **קריאה:** `shop.ts` + `shopAttrs` + DTO + פרמטרים + `/options` + `checkout` + OpenAPI | S1 | ✅ (2026-10-18) |
| **S3** | **הזמנה ששולמה:** `POST /orders` + `/orders/{ref}` + `/cancel` + `createPaidOrder` + `variantId` ב-`createSale` + איפוס מכירה `self` + scopes `orders:*` + webhooks `order.*`/`variant.stockChanged` | §6.9 | 🟡 חלק ראשון ✅ (2026-10-18, §7.5). נשאר: `/cancel` + איפוס `self`, `markOrder*`, webhooks |
| **S4** | **עורך למוכר:** גלריה + צירים + מחולל וריאנטים + עריכת מחיר/מלאי + `editObject` למחירים + lifecycle של הנגזרים ב-`1.0b` | §6.9 | 6–8 ימים |
| **S5** | **מסך מכירות:** השכבה הפשוטה (פס הזמנות ממתינות) + המסך המתקדם (הזמנות, מוצרים, מלאי, מכירות, חיבורים) + ייצוא CSV | S3, S4 | 6–8 ימים |
| **S6** | **תבנית פתיחה** (§7.4) עם מתאם ספק תשלום אחד | S3 | 3–5 ימים |
| — | **כאן ה-MVP שלם** | | |
| S7 | אתר סטטי: `POST /checkout` + אישור ידני של מחזיק הכסף (§3.5) | S5 | 3–4 ימים |
| S8 | ייבוא CSV, מייל אישור לקונה, `changes?since`, delivery-log | S5 | 4–6 ימים |
| S9 | חנות פנימית: גלריה ובורר וריאנטים ב-`/gift/[id]` | S4 | 4–6 ימים |
| S3b | בקשת רכש למוצר `quote` (Sheirutpend + צ'אט + טוקן קונה) | S3 | 5–7 ימים |
| — | אישור תשלום אוטומטי אצלנו (PLAN_MONEY_RAILS M1) | O-M1 | — |

**המסלול ל-MVP (§6.9 → S3 → S4 → S5 → S6):** ~4–5 שבועות. בסופו רקמה מנהלת
מוצרים עם וריאנטים וגלריה במסך המתקדם, מעלה את תבנית הפתיחה, ואתר חיצוני
מוכר לקונה אנונימי במחיר קבוע — הקונה משלם באתר, ההזמנה נכנסת לרקמה עם
פרטי המשלוח, המכירות נספרות לחלוקה בלי אישור ידני, והמלאי יורד. S3 ו-S4
יכולים לרוץ במקביל.

---

## 9. סיכונים

1. **השדות הנגזרים נשכחים.** `quant` ו-`price` נכתבים היום מכמה נתיבים
   (§2.4), וכל נתיב שלא מעדכן נגזר משאיר את המיון והסינון משקרים בשקט.
   **מיטיגציה:** הם נכתבים ב-lifecycle של Strapi — המקום היחיד שכל הנתיבים
   עוברים בו — ולא באפליקציה. והתצוגה לא נשענת עליהם (§2.4).
2. **פיצוץ payload.** 24 מוצרים × 12 וריאנטים × 3 תמונות = מגה-בייט.
   **מיטיגציה:** `variants` ברשימה רק ב-`expand`, גלריה מלאה רק בפרט,
   `fields` נשאר.
3. **מלאי כפול.** `Matanot.quant` ו-`variant.quant` יכולים להתפצל.
   **מיטיגציה:** `EFFECTIVE_STOCK = Σ variants` כשקיימים וריאנטים,
   ו-`Matanot.quant` נכתב כנגזר. מכירה מורידה את שניהם באותה פעולה.
4. **עלות שנדבקת לווריאנט.** מישהו יוסיף `costPerUnit` לוריאנט "כי זה נוח".
   **מיטיגציה:** §2.3 מנומק, וה-whitelist של §4.1 חוסם יציאה החוצה.
5. **Redundant עם `Sp`.** ל-`Sp` יש `pics`, `unit`, `granularity`.
   **לא מאחדים** — `Sp` הוא היצע של ספק, `Matanot` הוא מוצר. אבל
   **מאמצים את שמות השדות שלו** (`unit`, `leadTimeHours`) כדי שכולם ילמדו פעם אחת.
6. **פער `draftAndPublish`.** `product-variant` בלי פרסום ⇒ וריאנט "טיוטה"
   הוא מושג חדש. **מיטיגציה:** `active` מחליף אותו, והנראות נגזרת מהמוצר.
7. **סטטוס הזמנה שונה מהמציאות** (S3b בלבד). במסלול ה-MVP הסטטוס נקבע
   ישירות ע"י פעולות (`paid` → `shipped` → `fulfilled`). ב-S3b הוא נגזר
   מה-`Sheirutpend`, ושם צריך טבלת מיפוי מפורשת (מה ב-Sheirutpend קובע `seen`,
   `priced`, `accepted`) לפני שבונים — ו-`GET /orders/{ref}` מחזיר את הגרוע
   מבין השניים, ולעולם לא "מאושר" כשהבקשה הפנימית פתוחה.
8. **פרטים אישיים בהזמנה.** ללקוח בלי בקאנד אין איפה אחר לשמור כתובת משלוח,
   ולכן היא נשמרת אצלנו. **מיטיגציה:** פרטי הקונה לא נכנסים לשום DTO ציבורי,
   ל-`GET /orders/{ref}` או ל-webhook; גלויים רק לחברי הרקמה במסך ההזמנות.
9. **מפתח `orders:create` שדלף.** מי שמחזיק בו יכול לייצר מכירות שמשנות
   אחוזים. **מיטיגציה:** האזהרה בפאנל (§5.5), `revoked` מיידי, מכירות API
   מסומנות `source:'api'` ונראות ככאלה במסך המכירות, והביטול מאפס אותן.
   ולא מתעדפים מפתח ציבורי לכתיבה לפני ש-S7 בנוי עם rate limit.
10. **מכירת-יתר.** מלאי שנבדק באתר והתרוקן לפני הדיווח. **מיטיגציה:** לא
   דוחים (הכסף נגבה), מסמנים `oversold`, ומודיעים — הרקמה מחליטה אם להחזיר
   או לייצר. שמירת מלאי לפני תשלום (hold) — אחרי ה-MVP.
11. **מוצר שאין לו מחיר נמכר בקופה.** `quote`/pool בקופה של האתר הוא מחיר
   שהרקמה לא קבעה. **מיטיגציה:** `checkout:false` ב-DTO ו-`409
   NOT_CHECKOUTABLE` ב-`POST /orders`.
---

## 10. מה במכוון **לא**

| לא | למה |
|---|---|
| סליקה אצלנו | PLAN_MONEY_RAILS D-M5: אין custody ואין ארנק. הקונה משלם באתר, לספק התשלום של חבר ברקמה; אנחנו מקבלים דיווח על הזמנה ששולמה |
| קולקציות דינמיות פר-רקמה | שובר qids/authz ואת משמעות המוצר (PLAN_HEADLESS §4.9) |
| GraphQL ציבורי | qids מגנים; `?fields`+`expand` מספיקים לחנות |
| מחירון נפרד לכל וריאנט עם מתכון משלו | §2.3 — עלות היא של המוצר |
| "וריאנט" כאקסה גלובלית של הפלטפורמה | ציר הוא של הרקמה; "מידה" של קרמיקה ו"מידה" של נגרות אינן אותו דבר |
| שינוי `price`/`quant` הקיימים ל-null | צרכן קיים (ותבניות) נשבר. הם נשארים, ומקבלים משמעות "רמת בסיס" |
| מחיקת וריאנט | היסטוריה. `active=false` |

---

## 11. נספח — דוגמת תשובה מלאה (חנות חיה)

```bash
curl 'https://www.1lev1.com/api/v1/r/haohel/products/1842?expand=variants&locale=he'
```

```jsonc
{
  "data": {
    "id": "1842",
    "name": "סדנת קרמיקה",
    "descriptionText": "…",
    "status": "published",
    "price": 280, "currency": "ILS", "pricingMode": "fixed",
    "priceRange": { "min": 280, "max": 420, "currency": "ILS" },
    "hasVariants": true, "checkout": true,
    "availability": { "unlimited": false, "quantity": 17 },
    "unit": "מקום", "minOrder": 1, "maxOrder": 8, "leadTimeHours": 168,
    "attributes": { "material": "חרס" },
    "delivery": [ { "kind": "pickup", "note": "בסטודיו", "fee": 0, "currency": "ILS" } ],
    "images": [
      { "url": "https://…/ceramics-1.jpg", "width": 1600, "height": 1200, "alt": "סדנה" },
      { "url": "https://…/ceramics-2.jpg", "width": 1600, "height": 1200, "alt": null }
    ],
    "options": [
      { "key": "size", "name": "מידה",
        "values": [ { "value": "m", "label": "M" }, { "value": "l", "label": "L" } ] },
      { "key": "color", "name": "צבע",
        "values": [ { "value": "red", "label": "אדום", "hex": "#c33" } ] }
    ],
    "variants": [
      { "id": "77", "sku": "KER-M-RED", "name": "M / אדום",
        "optionValues": [ { "key": "size", "value": "m", "label": "M" },
                          { "key": "color", "value": "red", "label": "אדום" } ],
        "price": 310, "compareAtPrice": null,
        "availability": { "unlimited": false, "quantity": 3 },
        "images": [], "active": true, "externalKey": "m-red" }
    ],
    "seller": { "type": "rikma", "id": "57", "name": "האוהל", "url": "…", "picUrl": null },
    "categories": [ { "id": "12", "name": "קרמיקה" } ],
    "geo": { "lat": null, "lng": null, "radius": null, "hint": null, "isOnline": false },
    "dates": { "startDate": null, "finnishDate": null },
    "locale": "he", "translated": false,
    "updatedAt": "2026-10-16T09:00:00.000Z",
    "url": "https://www.1lev1.com/gift/1842",
    "buyUrl": "https://www.1lev1.com/gift/1842#request"
  },
  "rikma": { "id": "57", "slug": "haohel", "name": "האוהל",
             "canonicalPath": "/api/v1/r/haohel" }
}
```

והזמנה ששולמה — מהשרת של האתר, אחרי אישור ספק התשלום:

```bash
curl -X POST https://www.1lev1.com/api/v1/r/haohel/orders \
  -H 'Authorization: Bearer 1lev1_…' -H 'Content-Type: application/json' \
  -d '{"externalId":"pi_3Q8x","paymentMethod":"card","currency":"ILS",
       "buyer":{"name":"דנה","phone":"050-0000000"},
       "delivery":{"preference":"pickup"},
       "lines":[{"productId":"1842","variantId":"77","quantity":2,"unitPrice":310}]}'
# → 201 {"success":true,"duplicated":false,"orderRef":"57:pi_3Q8x",
#        "status":"paid","oversold":false,"total":620,"currency":"ILS", …}
```

ההזמנה נראית עכשיו לרקמה בפס "הזמנות ממתינות" במסך המכירות, ובמסך המתקדם
עם השורות, הווריאנטים והטלפון. המכירה כבר נספרת בסכום שממתין לחלוקה, ומלאי
"M / אדום" ירד מ-3 ל-1.
