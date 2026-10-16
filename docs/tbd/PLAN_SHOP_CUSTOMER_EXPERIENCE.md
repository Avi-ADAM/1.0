# PLAN — חנות לקונים: וריאנטים, גלריה, זמינות ובקשת רכש — דרך ה-API

> **מצב: תכנית + מפרט סכמה.**
> נכתב 2026-10-16, אחרי קריאת הקוד (`apiPublic/*`, `qids.js`, `contentTypes.d.ts`,
> `/gift/[id]`, `createSheirutpend`) ולא אחרי הנחות.
>
> **מה כבר בנוי (S2, 2026-10-16):** שכבת הקריאה ירדה לקוד — `shop.ts` הטהור,
> ה-DTO המורחב, פרמטרי החנות ב-`query.ts`, `GET /options`, וחמשת ה-qids
> (`rikmaApiShopSchema`, `rikmaApiShopAttrs`, `rikmaApiShopVariants`,
> `rikmaApiShopAxes`, `rikmaApiOptions`). **הסכמה עצמה טרם נוצרה ב-`1.0b`**:
> עד שהיא שם, ה-API מזהה זאת בעצמו (`shopSchemaLive`) ומחזיר בדיוק את מה
> שהחזיר לפני התוכנית. פירוט ב-§7.2.
>
> **משלים:**
> [PLAN_HEADLESS_PRODUCTS_API](./PLAN_HEADLESS_PRODUCTS_API.md) — החוזה והמסלול
> שנבנה (Phase 0/1/1b). המסמך הזה הוא **המשך שלו**: סעיף §4.7 (וריאנטים),
> §4.8 (הזמנות), §4.9 (אקסטרביליות) ו-Phase 3 הופכים כאן למפרט.
> [PLAN_MONEY_RAILS](./PLAN_MONEY_RAILS.md) — למה **אין** סליקה כאן (החלטה M2).
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
> 3. **בקשת רכש, לא סליקה.** "קנה" ⇒ הזמנה שנכנסת לרקמה כמו `/gift/[id]` היום
>    (Sheirutpend + צ'אט). הכסף לא עובר דרכנו (PLAN_MONEY_RAILS §D-M2).
> 4. **מודל אחד, שני משטחים.** אותה סכמה ואותו DTO גם לחנות בתוך 1lev1 וגם
>    ל-API. ה-API קודם; הפרונט הפנימי נגזר ממנו.

---

## 0. תקציר — מה נבנה בסוף

הרקמה מגדירה **אפשרויות** (מידה, צבע, נפח…). מכל צירוף נוצר **וריאנט** עם
מחיר, מלאי, מק"ט ותמונות משלו. המוצר מציג **גלריה** (עד 12 תמונות), וכל וריאנט
יכול להציג גלריה משלו. הקונה (באתר חיצוני או אצלנו) רואה מחיר שמתעדכן לפי
הבחירה, "נותרו 3", ובוחר כמות; הוא שולח **בקשת רכש** עם כמה שורות, פרטי קשר
והעדפת אספקה, והבקשה נולדת **בתוך** הרקמה — אותו צינור בדיוק שמטפל היום
ב-`/gift/[id]`: Sheirutpend, צ'אט תמחור, אישור, ביצוע.

שלוש שכבות, ובכוונה:

| שכבה | מה | למה |
|---|---|---|
| **סכמה (1.0b)** | `product-option`, `product-variant`, `order`, `order-line` + שדות על `matanot`/`category`/`sheirutpend`/`api-key` | הרשימה המלאה ב-**§6**. זה מה שצריך ליצור ב-Strapi |
| **API (1.0)** | DTO מורחב (`variants`, `images[]`, `priceRange`, `options`, `unit`, `delivery`), סינון/מיון על וריאנטים, `GET /options`, `POST /orders`, `GET /orders/{ref}`, webhooks | §5 |
| **פרונט** | עורך וריאנטים/גלריה למוכר, ואז עמוד מוצר עם בורר וריאנטים ועגלת בקשות | §4 + Phase 2/3 |

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
לא.** תשע מתוך שתים-עשרה שורות נגעת ב-`Matanot` או בקולקציה חדשה.

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
| Order (בקשת רכש) | `order` + `order-line` (**חדש**) | מה שהקונה שלח |
| ה-thread שמתמחר | `Sheirutpend` | **קיים** — הצ'אט, ההצעה, האישור |
| מכירה מדווחת | `Sale` | **קיים** — נוצרת אצלנו כמו היום |

### 2.2 למה קולקציות ולא JSON על `Matanot`

אפשר היה לשים `variants: json` על המוצר ולחסוך שתי קולקציות. זה נכשל בארבעה
מקומות, וכולם מופיעים בדיוק כשהחנות חיה:

1. **מלאי מתחרה.** שני קונים שקוראים-כותבים את אותו JSON מחליפים זה את מלאי
   זה (read-modify-write). שורה עצמאית לווריאנט נכתבת ב-`update` נקודתי.
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

**הכלל שמחזיק אותם ישרים:** הם **נכתבים רק ע"י פעולה אחת** (השמירה של
וריאנטים, §7) ולעולם לא נערכים ידנית. `priceMin` מחושב **תמיד** —
גם למוצר בלי וריאנטים, כשהוא שווה ל-`price`. כך שאילתות שמסתכלות על
`priceMin` נכונות לשני סוגי המוצרים, ואין "ענף ישן" לזכור.

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

מוצר **בלי** וריאנטים ממשיך להתנהג כמו היום (`Matanot.quant`); `stockTotal`
שלו נכתב כסכום/העברה. אין שני חוקים — יש רמה אחת שמאכילה את השנייה.

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
- **פעולה**: `buyUrl` — כתובת בקשת הרכש. באתר חיצוני: `POST /orders`.

### 3.3 בקשת רכש (הכפתור שהקונה לוחץ)

הבקשה יכולה להכיל **כמה שורות** — זו העגלה, בלי סליקה:

```json
{
  "externalId": "web-2026-8811",
  "buyer": { "name": "דנה", "email": "dana@example.com", "phone": "050-…" },
  "delivery": { "preference": "delivery", "address": { "city": "נתניה" } },
  "note": "אם אפשר בלי פלסטיק",
  "lines": [
    { "productId": "1842", "variantId": "77", "quantity": 2 },
    { "productId": "1901", "quantity": 1 }
  ]
}
```

מה שקורה מאחורי הקלעים: נכתבת **`order` עם שורות**, נוצר **`Sheirutpend`**
אחד עם הקשר ל-`matanots` ולצ'אט (`forum`), והרקמה מקבלת התראה — *בדיוק כמו
היום* כשלקוח שולח בקשה מ-`/gift/[id]`. ההבדל: הבקשה נושאת שורות, וריאנטים
ופרטי קשר, והצ'אט נפתח עם מה שהקונה ביקש.

התשובה נותנת לקונה את מה שהוא צריך: `orderRef` (למעקב), `chatUrl`,
`status`, ו-`total: null` כשהמחיר בהצעה.

### 3.4 אחרי השליחה

| שלב | מי | מה הקונה רואה באתר החיצוני |
|---|---|---|
| `sent` | הקונה שלח | "הבקשה נשלחה" |
| `priced` | הרקמה תמחרה בצ'אט | `total` מתמלא (webhook `order.statusChanged`) |
| `accepted` | הקונה אישר | "מאושר, בהכנה" |
| `fulfilled` | הביצוע נמסר (`SheirutFulfillment` §11.ב) | "נמסר" |
| `cancelled` | אחד מהצדדים | "בוטל" |

הסטטוס **נגזר** ולא מנוהל ידנית: `order.status` מתעדכן מהפעולה הפנימית
שמזיזה את ה-`Sheirutpend`, ולכן אין שני מקורות אמת.

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
POST /api/v1/r/{rikma}/orders                  # בקשת רכש (scope orders:create)
GET  /api/v1/r/{rikma}/orders/{ref}            # מעקב (scope orders:read)
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

### 5.4 `POST /orders` — בקשת הרכש

**בקשה** — כמו §3.3. שדות חובה: `lines[]` עם `productId` ו-`quantity>0`,
ו-`buyer.name` **או** `buyer.phone` (רקמה חייבת לדעת למי לחזור).

**ולידציות בעלות משמעות** (בשרת, לפני כל כתיבה):

| מצב | תשובה |
|---|---|
| מוצר לא של הרקמה / טיוטה / בארכיון | `404 PRODUCT_NOT_FOUND` |
| מוצר עם וריאנטים ושורה בלי `variantId` | `409 VARIANT_REQUIRED` |
| וריאנט שלא שייך למוצר, או `active=false` | `404 VARIANT_NOT_FOUND` |
| `quantity` > מלאי (כשאינו `-1`), או מחוץ ל-`minOrder`/`maxOrder` | `409 OUT_OF_STOCK` / `400 QUANTITY_LIMIT` |
| `externalId` שחזר על עצמו באותה רקמה | `200` עם `duplicated: true` |
| `acceptAllLines=false` ובשורה אחת יש בעיה | `400` עם `details.lines[]` — אטומי, בלי חצי הזמנה |

**תשובה** `201`:

```json
{ "success": true, "duplicated": false,
  "orderRef": "57:web-2026-8811", "status": "sent",
  "chatUrl": "https://www.1lev1.com/deals/request/991",
  "total": null, "currency": "ILS",
  "lines": [ { "productId": "1842", "variantId": "77", "quantity": 2,
               "name": "סדנת קרמיקה", "optionLabel": "M / אדום",
               "unitPrice": null } ] }
```

**אידמפוטנטיות:** `externalId` + הרקמה = המפתח. שליחה חוזרת מחזירה את אותה
הזמנה ואינה יוצרת `Sheirutpend` נוסף (אותה התנהגות של `sales`/`tasks` —
`duplicated: true`). בלעדיו בקשת רכש חוזרת היא בקשה כפולה.

### 5.5 scopes

| scope | למי | הערה |
|---|---|---|
| `products:read` | אתר הלקוח | קיים |
| `products:read:draft` | בונה האתר | קיים |
| **`orders:create`** | אתר הלקוח | חדש — ה-scope שמאפשר בקשת רכש |
| **`orders:read`** | אתר הלקוח | חדש — מעקב סטטוס |
| `sales:report` / `tasks:*` | אינטגרציות | קיימים |

`GRANTABLE_SCOPES` ב-`src/routes/api/api-keys/+server.ts` + צ'קבוקסים
ב-`RikmaApiPanel.svelte`. **בלי שינוי סכמה** — `scopes` הוא JSON.

### 5.6 webhooks

```
product.created | product.updated | product.published | product.archived
variant.created | variant.updated | variant.stockChanged   (data.changed=["quant"])
order.created   | order.statusChanged                      (data.status)
inventory.updated
```

ה-payload נושא את ה-DTO הציבורי (`order.created` נושא את גוף הבקשה שאושר,
בלי פרטי קשר מלאים — טלפון/מייל **לא** נשלחים ב-webhook; הם נשארים ב-`order`
עם `private`-יות בהמשך). חתימה כמו היום (§5.7 ב-PLAN_HEADLESS).

### 5.7 קודי שגיאה חדשים

`409 VARIANT_REQUIRED` · `404 VARIANT_NOT_FOUND` · `409 OUT_OF_STOCK` ·
`400 QUANTITY_LIMIT` · `409 EXTERNAL_ID_CONFLICT` (רק כשהצרכן מבקש `strict`) ·
`403 SCOPE_MISSING` עם `orders:create`.

### 5.8 גרסה

`X-1lev1-Api-Version` עולה ל-**`2026-11-01`** כשהשדות החדשים נכנסים לתשובה
הראשונה (§6.6 ב-PLAN_HEADLESS). צרכן שלא קורא אותם לא מושפע; צרכן שכן —
מקבל `variants` ריק כל עוד אין דאטה.

---

## 6. סכמת Strapi (1.0b) — **הרשימה ליצירה**

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
| 4 | `order` | קולקציה חדשה | בקשת רכש של הקונה |
| 5 | `order-line` | קולקציה חדשה | שורה בהזמנה (מוצר + וריאנט + כמות) |
| 6 | `matanot` | תוספות | גלריה, נגזרים, יחידה, אספקה, attributes |
| 7 | `category` | תוספות | slug, אב, סדר, תמונה, בעלים |
| 8 | `sheirutpend` | תוספות | `order`, פרטי קונה, `source` |
| 9 | `api-key` | תוספות | `expiresAt`, `env`, `quotaPerDay` (מ-§4.2) |

---

### 6.1 `product-option` — ציר וריאציה

**api::product-option.product-option** · `draftAndPublish: true` ·
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
| `sku` | string, **unique** | ✔ | — | `KER-S-M-RED` |
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

**ייחודיות:** `sku` — unique ברמת הטבלה. `(matanot, axisKey)` — נאכף בפעולה:
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
| `status` | enum `sent・seen・priced・accepted・declined・fulfilled・cancelled` | | `sent` | נגזר מהפעולה הפנימית (§3.4) |
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
עם טוקן שירות (`serviceAdmin`), בדיוק כמו היום.

**qids חדשים (append-only) + שורה ב-`qidsAccess.js` (`serviceAdmin` בלבד):**

| qid | מה | מצב |
|---|---|---|
| `rikmaApiShopSchema` | בדיקת קיום הסכמה (`hasVariants` כשדה בודק) | ✅ |
| `rikmaApiShopAttrs` | `pics` + השדות הנגזרים + הצירים + יחידה/אספקה של מוצרי העמוד (במקום להכניס אותם לשאילתת הקטלוג — §7.1) | ✅ |
| `rikmaApiShopVariants` | שורות הווריאנטים של מוצרי העמוד | ✅ |
| `rikmaApiShopAxes` | זוגות האפשרויות פר-מוצר (דרך יחס `variants` של המוצר) — למונה ב-`/options` | ✅ |
| `rikmaApiOptions` | הצירים והערכים של הרקמה | ✅ |
| `rikmaApiOrderCreate` | כתיבת `order` + `order-line` | ⛔ S3 |
| `rikmaApiOrderByRef` | קריאת הזמנה במעקב | ⛔ S3 |
| `rikmaApiOrderLink` | קישור ה-`Sheirutpend`/פורום להזמנה | ⛔ S3 |

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

---

## 7. מה נדרש בקוד (`1.0`) — מיפוי קבצים

| שכבה | קובץ | מה | מצב |
|---|---|---|---|
| **טהור** | `src/lib/server/apiPublic/shop.ts` (חדש) | `galleryOf`, `variantsOf`, `optionsOf`, `optionAxesOf`, `priceRangeOf`, `axisKeyOf`, `availabilityOf`, `attributesOf`, `deliveryOf`, `buyingUnitOf` — כל חישובי החנות, בלי Strapi | ✅ בנוי + 32 בדיקות |
| **קריאה** | `src/lib/server/apiPublic/catalog.ts` | `shopSchemaLive()`, `fetchShopRows()`, `fetchVariantRows()`, `fetchOptions()` — qids נפרדים + דירוג + cache; מיזוג לתשובה | ✅ בנוי |
| **הטלה** | `src/lib/server/apiPublic/dto.ts` | `ApiVariant`, `ApiOption`, `ApiPriceRange`, `ApiDelivery`, `ApiShop`; `toApiProduct(node, rikma, shop?)` דרך `toApiShop()` | ✅ בנוי |
| **שאילתה** | `src/lib/server/apiPublic/query.ts` | `hasVariants`, `available`/`inStock`, `option.<key>`, `expand=variants`, `sku`, `priceMax`; `price` → `priceMin`; `matchesNothing` | ✅ בנוי |
| **כתיבה** | `src/lib/server/apiPublic/orders.ts` (חדש) | ולידציה (`validateOrderPayload`) + בנייה (`buildOrderParams`) + אידמפוטנטיות — אותה תבנית של `salesApi.ts`/`tasksApi.ts` | ⛔ S3 |
| **route** | `src/routes/api/v1/r/[rikma]/{options,orders,orders/[ref]}/+server.ts` | דקים; כל הלוגיקה ב-`apiPublic/`. `options` ✅, `orders` ⛔ S3 | חלקי |
| **פעולה** | `src/lib/server/actions/configs/createOrder.ts` (חדש) | כותב `order` + שורות, ויוצר `Sheirutpend` (qid 71, כמו `materializeWish`) עם `matanots` + `source:'api'` + פרטי קונה. **לא עוקף** את הצינור הקיים |
| **עורך למוכר** | `src/lib/components/products/` | העלאת גלריה (סדר, alt, שער), מחולל מטריצת וריאנטים, עריכה מרוכזת של מחיר/מלאי, תמונות לווריאנט, וחישוב השדות הנגזרים (§2.4) |
| **שוק/חנות פנימית** | `src/lib/components/products/MatanotPublicView.svelte`, `/gift/[id]` | גלריה + בורר וריאנטים + כמות + בקשת רכש מרובת-שורות |
| **תרגומים** | `src/lib/translations/{he,en,es,ar,ru}/` | ~40 מפתחות (בורר, זמינות, שגיאות, עגלה) + `check:i18n` |
| **OpenAPI** | `docs/tbd/api/rikma-v1.openapi.yaml` | `ApiVariant`, `ApiOption`, `/options`, `/orders`, פרמטרים חדשים |
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

נשאר לקראת S3: `orders.ts` + `/orders` + `/orders/{ref}` + הפעולה, וה-OpenAPI
(`ApiVariant`, `ApiOption`, `/options`, `/orders`).

---

## 8. פאזות ואומדנים

| פאזה | תכולה | תלות | אומדן |
|---|---|---|---|
| **S0** | המסמך + מפרט הסכמה (§6) — **מה שצריך ליצור ב-1.0b** | — | ✅ המסמך הזה |
| **S1** | הסכמה ב-`1.0b` + פריסה + `types:update` | S0 | 2–3 ימים (רובו Content-Type Builder) — ⛔ **הרשימה ב-§6 ממתינה** |
| **S2** | **קריאה:** `shop.ts` + `shopAttrs` + DTO + פרמטרים + `/options` + OpenAPI | S1 | 4–6 ימים — **הקוד ✅ (147+ בדיקות), OpenAPI ⛔** |
| **S3** | **כתיבה:** `orders.ts` + `/orders` + `/orders/{ref}` + הפעולה + scopes + webhooks | S2 | 4–6 ימים |
| **S4** | **עורך למוכר:** גלריה + מחולל וריאנטים + שדות נגזרים + תרגומים | S1 | 5–7 ימים |
| **S5** | **חנות פנימית:** עמוד מוצר עם גלריה/וריאנטים + עגלת בקשות ב-`/gift/[id]` | S3, S4 | 4–6 ימים |
| **S6** | מעקב סטטוס לקונה + `changes` + delivery-log ל-webhooks | S3 | 3–4 ימים |

**המסלול הקצר לחנות חיה (S1→S3):** ~2–3 שבועות, ובסופו אתר חיצוני יכול
להציג גלריה, לבחור וריאנט, לסנן לפי מידה, ולשלוח בקשת רכש אמיתית —
**בלי שנוגעים בפרונט שלנו בכלל**. זה בדיוק סדר העדיפויות שנקבע.

---

## 9. סיכונים

1. **השדות הנגזרים נשכחים.** אם פעולה כותבת וריאנט בלי `priceMin`/`stockTotal`
   — המיון והסינון משקרים בשקט. **מיטיגציה:** הם נכתבים רק במקום אחד
   (`shop.ts` מספק את החישוב), ובדיקה שמוודאת שכל נתיב שמירה קורא לו.
   וכן: הדוח לתצוגה לא נשען עליהם (§2.4).
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
7. **סטטוס הזמנה שונה מהמציאות.** `order.status` נגזר מהפעולה הפנימית; אם
   הפעולה לא עודכנה (למשל ה-`Sheirutpend` נסגר בדרך אחרת) הסטטוס נתקע.
   **מיטיגציה:** `GET /orders/{ref}` קורא **גם** את מצב ה-`Sheirutpend`
   ומחזיר את הגרוע מבין השניים, ולעולם לא "מאושר" כשהבקשה הפנימית פתוחה.
8. **PII בהזמנה.** טלפון/מייל של קונים שאינם משתמשים. **מיטיגציה:**
   `buyerPhone` לא נכנס לשום DTO ציבורי ולא ל-webhook; גישה פנימית בלבד
   (חברי הרקמה), ומועדפת — לתעדף בהמשך עם מנגנון הפרטיות הקיים.

---

## 10. מה במכוון **לא**

| לא | למה |
|---|---|
| סליקה, סל, checkout עם כרטיס | PLAN_MONEY_RAILS D-M5: אין custody ואין ארנק. בקשה נכנסת לרקמה, והכסף זורם במסלולים הקיימים |
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
    "hasVariants": true,
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

ובקשה:

```bash
curl -X POST https://www.1lev1.com/api/v1/r/haohel/orders \
  -H 'Authorization: Bearer 1lev1_…' -H 'Content-Type: application/json' \
  -d '{"externalId":"web-8811","buyer":{"name":"דנה","phone":"050-0000000"},
       "lines":[{"productId":"1842","variantId":"77","quantity":2}]}'
# → 201 {"success":true,"duplicated":false,"orderRef":"57:web-8811",
#        "status":"sent","chatUrl":"https://www.1lev1.com/deals/request/991",
#        "total":null,"currency":"ILS", …}
```

הבקשה נראית עכשיו לרקמה ב-`moach → מכירות → בקשות`, עם השורות, הווריאנטים
והטלפון. המשך הדרך — תמחור, אישור, ביצוע — זהה לחלוטין לבקשה שהגיעה
מ-`/gift/[id]`.
