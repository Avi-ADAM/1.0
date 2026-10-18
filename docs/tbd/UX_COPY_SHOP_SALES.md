# UX COPY — מסך המכירות: השכבה הפשוטה וניהול המכירות

> **מצב: טיוטה, לפני קוד.** נכתב 2026-10-18 כמפרט טקסטים ל-S4 (עורך המוכר) ו-S5
> (מסך המכירות) של [PLAN_SHOP_CUSTOMER_EXPERIENCE](../inprogress/PLAN_SHOP_CUSTOMER_EXPERIENCE.md)
> §7.3. המפתחות כתובים כפי שייכנסו ל-`src/lib/translations/<locale>/shop.json`
> (namespace `shop`, ב-`ROUTED` לנתיבי `sales/*` בלבד). עברית היא המקור; האנגלית
> כאן כדי שהמתרגמים יבינו את הכוונה — הנחיות לערבית, ספרדית ורוסית ב-§9.
>
> **המטרה:** מוכר שמחזיק את הטלפון ביד אחת, ליד ערימת חבילות, צריך לדעת בשנייה
> אחת *מה מחכה לו* ולעשות את זה בלחיצה אחת. כל טקסט כאן נבחן מול השאלה הזו.

---

## 0. חמש החלטות שכל השאר נשען עליהן

1. **הרשימה פותחת במה שצריך לעשות, לא בסטטוס.** הלשונית הראשונה של ההזמנות
   היא "לשליחה", לא "שולמה". מוכר לא חושב "אילו הזמנות במצב paid" — הוא חושב
   "מה אני צריך לארוז". (§3)
2. **מכירת-יתר אינה שגיאה.** הקונה כבר שילם. הטקסט אומר כמה חסר ומה אפשר
   לעשות — לא "אזהרה" ולא אדום. (§3.4)
3. **מחיר שממתין לאישור הוא הצלחה חלקית, לא כישלון.** אחרי שמירה במוצר של
   רקמה, הטקסט אומר שההצעה הוגשה, מה הקונים רואים עד אז, ומתי זה יאושר בשתיקה.
   (§4.3, עיקרון 6 בתכנית)
4. **"ביטול" שמור לביטול הזמנה.** חזרה מפעולה = "החזרה"; סגירת חלון = "סגירה".
   מילה אחת לא יכולה להיות גם "בטלו לי את הפעולה האחרונה" וגם "החזירו לקונה את
   הכסף". (§8)
5. **אף פעם לא מספר טכני.** `-1` הוא "ללא הגבלה", `orderRef` הוא "הזמנה 1042",
   `api` הוא "מהאתר". המוכר לא רואה שום מזהה שהוא לא הקליד בעצמו.

---

## 1. אוצר המילים — מונח אחד לכל דבר

| מושג | עברית | English | לא להשתמש | למה |
|---|---|---|---|---|
| Order | **הזמנה** | order | — | ראו הערה מתחת לטבלה |
| Option (ציר) | **אפשרות** (מידה, צבע) | option | ציר, מאפיין | "ציר" הוא מילה של מפתחים |
| Variant | **וריאציה** / וריאציות | variant | גרסה, סוג, וריאנט | ראו §1.1 |
| SKU | **מק״ט** | SKU | קוד מוצר | המונח שכל מחסן בארץ מכיר |
| Stock | **מלאי** | stock | כמות, יתרה | "יתרה" כבר תפוסה ע"י הכסף |
| Unlimited (`-1`) | **ללא הגבלה** | unlimited | ∞, ‎-1 | |
| Oversold | **חסר במלאי** + מספר | short on stock | מכירת יתר, oversold | מתאר מה צריך לעשות, לא מה השתבש |
| Channel `api` / `ui` | **מהאתר** / **ידני** | from your site / manual | API, UI | |
| Holder | **אצל מי הכסף** | who holds the money | מחזיק | קיים כבר ב-`project.json`/`revenue.json` |
| Pending split | **ממתין לחלוקה** | waiting to be split | | קיים (`awaitingSplit`) |
| Buyer | **קונה** | buyer | לקוח | "לקוח" כבר משמש את הלקוח של עסקת משאלה (C-19) — קונה אנונימי מהאתר הוא דבר אחר |
| Rikma | **רקמה** | rikma | פרויקט, קבוצה | CLAUDE.md |

**"הזמנה" בעברית היא גם invitation.** בתוך מסך המכירות אין בלבול. **מחוצה לו** —
בהתראות, בכרטיס בעמוד הלב, במייל — תמיד **"הזמנה מהאתר"** או **"הזמנה חדשה
ב{{shop}}"**, אף פעם לא "הזמנה חדשה" לבד: עמוד הלב כבר מציג "הזמנה מאת {{who}}"
להצטרפות לרקמה.

### 1.1 למה "וריאציה"

| אפשרות | נוסח | בעד | נגד |
|---|---|---|---|
| **A (מומלץ)** | וריאציה | המונח של מערכות המכירות; מי שעובר משופיפיי מכיר אותו | מילה לועזית |
| B | גרסה | עברית | **תפוס**: "גרסה" היא הגרסה שעל השולחן בכל מו״מ ברקמה ("הגרסה האחרונה מאושרת בשתיקה") |
| C | סוג | קצר | **תפוס**: מתבלבל עם קטגוריה ("סוג מוצר") |

ברוב המסך המילה בכלל לא מופיעה: שורה של וריאציה נקראת בשם הצירוף — **"M · אדום"**.
המילה נדרשת רק בכותרות ובספירות ("12 וריאציות").

---

## 2. השכבה הפשוטה — `/moach/[projectId]/sales`

הדף נשאר כמו היום; נוספים לו פס אחד וכפתור אחד. כותרת הדף עוברת ל-`$t()`
(היום `$lang === 'he' ? …`).

| מפתח | עברית | English | הערה |
|---|---|---|---|
| `shop.page.title` | מכירות | Sales | ל-`<title>` |
| `shop.banner.toShip` | {{count}} הזמנות מחכות למשלוח | {{count}} orders waiting to ship | |
| `shop.banner.toShipOne` | הזמנה אחת מחכה למשלוח | 1 order waiting to ship | מוסכמת `xxxOne` של הפרויקט |
| `shop.banner.short` | {{count}} הזמנות חסרות במלאי | {{count}} orders are short on stock | מוצג **במקום** הקודם כשיש, באותו פס |
| `shop.banner.shortOne` | הזמנה אחת חסרה במלאי | 1 order is short on stock | |
| `shop.banner.cta` | לטיפול | Handle | כל הפס לחיץ; החץ ← הוא עיצוב, לא טקסט |
| `shop.manage.cta` | ניהול מכירות | Manage sales | הכפתור למסך המתקדם |
| `shop.manage.hint` | הזמנות, מוצרים, מלאי וייצוא | Orders, products, stock and export | שורת משנה מתחת לכפתור |

**הכפתור למסך המתקדם — חלופות:**

| אפשרות | נוסח | טון | מתי |
|---|---|---|---|
| **A (מומלץ)** | ניהול מכירות | עניני | מתאים גם לרקמה בלי אתר — היא נכנסת לשם בשביל טבלת המכירות והייצוא |
| B | מסך מכירות מתקדם | טכני | הנוסח בתכנית. "מתקדם" מרתיע את מי שהכי צריך אותו |
| C | ניהול החנות | מסחרי | רק אם המסך יוצג אך ורק לרקמות עם חנות מחוברת |

---

## 3. ניהול מכירות — `/sales/manage`

### 3.1 הלשוניות

בטלפון (375px) חמש לשוניות לא נכנסות ברוסית ובספרדית — **הפס נגלל אופקית**,
והלשונית הפעילה נגללת לתוך התצוגה. בעברית כל תווית ≤ 7 תווים.

| מפתח | עברית | English |
|---|---|---|
| `shop.tabs.orders` | הזמנות | Orders |
| `shop.tabs.products` | מוצרים | Products |
| `shop.tabs.stock` | מלאי | Stock |
| `shop.tabs.sales` | מכירות | Sales |
| `shop.tabs.connect` | חיבורים | Connect |
| `shop.tabs.buyers` | קונים (אחרי ה-MVP) | Buyers |

מונה על לשונית ("הזמנות 3") סופר רק את מה שמחכה למוכר — הזמנות לשליחה + חסרות
במלאי. מונה שסופר הכל הופך לרעש אחרי שבוע.

### 3.2 סינון ההזמנות — לפי מה שצריך לעשות

| מפתח | עברית | English | אילו סטטוסים |
|---|---|---|---|
| `shop.orders.filter.toShip` | לשליחה | To ship | `paid`, משלוח |
| `shop.orders.filter.toHandOver` | למסירה | To hand over | `paid`, איסוף / דיגיטלי |
| `shop.orders.filter.shipped` | נשלחו | Shipped | `shipped` |
| `shop.orders.filter.done` | הושלמו | Completed | `fulfilled` |
| `shop.orders.filter.cancelled` | בוטלו | Cancelled | `cancelled` |
| `shop.orders.filter.all` | הכל | All | |
| `shop.orders.filter.channel` | מקור | Source | |
| `shop.orders.filter.dates` | תאריכים | Dates | |
| `shop.orders.search` | חיפוש לפי שם, טלפון או מספר הזמנה | Search by name, phone or order number | placeholder |

ברירת המחדל: **"לשליחה"** אם יש בה משהו, אחרת **"הכל"**.

### 3.3 כרטיס הזמנה ברשימה

שלוש שורות, כי זה מה שנכנס בטלפון בלי לחתוך:

```
הזמנה 1042 · דנה כהן                     ‏₪660
[לשליחה]  לפני 3 שעות
2 פריטים · משלוח לנתניה           [סימון כנשלחה]
```

| מפתח | עברית | English | הערה |
|---|---|---|---|
| `shop.order.number` | הזמנה {{number}} | Order {{number}} | `displayNumber` של האתר, ואם אין — ה-`id`. עטוף ב-`<bdi>` |
| `shop.order.items` | {{count}} פריטים | {{count}} items | סכום הכמויות, לא מספר השורות |
| `shop.order.itemsOne` | פריט אחד | 1 item | |
| `shop.order.deliverTo` | משלוח ל{{city}} | Delivery to {{city}} | |
| `shop.order.pickup` | איסוף עצמי | Pickup | |
| `shop.order.digital` | דיגיטלי | Digital | |
| `shop.order.fromSite` | מהאתר | From your site | תג ערוץ, רק בתצוגת "הכל" |
| `shop.order.manual` | ידני | Manual | |

**הסטטוסים — צד המוכר וצד הקונה:**

| סטטוס | תג אצל המוכר | מה הקונה רואה באתר (תבנית הפתיחה) |
|---|---|---|
| `paid` + משלוח | **לשליחה** | ההזמנה התקבלה |
| `paid` + איסוף/דיגיטלי | **למסירה** | ההזמנה התקבלה |
| `shipped` | **נשלחה** | ההזמנה בדרך |
| `fulfilled` | **הושלמה** | ההזמנה נמסרה |
| `cancelled` | **בוטלה** | ההזמנה בוטלה |

מפתחות: `shop.status.toShip`, `toHandOver`, `shipped`, `done`, `cancelled`.
התג של המוכר הוא **מה שנשאר לעשות**; הטקסט של הקונה הוא **מה שקרה**.

### 3.4 חסר במלאי (`oversold`)

| מפתח | עברית | English |
|---|---|---|
| `shop.short.tag` | חסרות {{count}} יח׳ | {{count}} short |
| `shop.short.tagOne` | חסרה יחידה אחת | 1 short |
| `shop.short.title` | הקונה שילם על יותר ממה שיש במלאי | The buyer paid for more than you have in stock |
| `shop.short.body` | חסרות {{count}} יחידות של {{item}}. אפשר להכין אותן ולעדכן את המלאי, או לתאם עם הקונה מועד אחר. | {{count}} units of {{item}} are missing. You can make them and update the stock, or agree a later date with the buyer. |
| `shop.short.updateStock` | עדכון מלאי | Update stock |
| `shop.short.contactBuyer` | פרטי הקונה | Buyer details |

**חלופות לתג:**

| אפשרות | נוסח | טון | למה לא / למה כן |
|---|---|---|---|
| **A (מומלץ)** | חסרות 2 יח׳ | עובדתי | אומר בדיוק כמה לייצר; נכנס בתג |
| B | נמכר מעבר למלאי | טכני | מתאר תקלה של המערכת, לא משימה של המוכר |
| C | ⚠ מלאי | מאיים | צבע אזהרה על כסף שכבר נכנס — מעורר בהלה במקום פעולה |

צבע התג: רקע ענבר עם טקסט כהה (לא טוקן זוהר כצבע טקסט — הם לא עוברים AA),
**לא** אדום. אדום שמור לפעולה שנכשלה.

### 3.5 עמוד הזמנה

בטלפון: פרטים בגלילה, **פס פעולה דביק בתחתית** עם פעולה ראשית אחת.

| מפתח | עברית | English | הערה |
|---|---|---|---|
| `shop.order.items.title` | מה הוזמן | What was ordered | |
| `shop.order.buyer.title` | הקונה | Buyer | |
| `shop.order.buyer.private` | גלוי רק לחברי הרקמה | Visible to rikma members only | שורת משנה, אפור |
| `shop.order.delivery.title` | משלוח | Delivery | |
| `shop.order.note.title` | הערת הקונה | Buyer's note | מוצג רק אם יש |
| `shop.order.payment.title` | תשלום | Payment | |
| `shop.order.payment.paid` | שולם {{amount}} באתר | {{amount}} paid on your site | |
| `shop.order.payment.ref` | מספר עסקה | Payment reference | `paymentRef`, בגופן קבוע, `<bdi>` |
| `shop.order.holder` | הכסף אצל {{name}} · נספר לחלוקה | {{name}} holds the money · counted for the split | מסביר למה אין כאן אישור |
| `shop.order.holderYou` | הכסף אצלך · נספר לחלוקה | You hold the money · counted for the split | |
| `shop.order.call` | חיוג | Call | `tel:` |
| `shop.order.email` | מייל | Email | `mailto:` |
| `shop.order.copyAddress` | העתקת הכתובת | Copy address | |
| `shop.order.print` | הדפסת תעודת משלוח | Print delivery note | |
| `shop.order.timeline` | היסטוריה | History | |
| `shop.order.timeline.paid` | שולמה באתר | Paid on the site | |
| `shop.order.timeline.shipped` | סומנה כנשלחה · {{name}} | Marked as shipped · {{name}} | |
| `shop.order.timeline.done` | סומנה כהושלמה · {{name}} | Marked as completed · {{name}} | |

**הפעולה הראשית — לפי סוג המשלוח:**

| מצב | מפתח | עברית | English |
|---|---|---|---|
| משלוח, `paid` | `shop.action.markShipped` | סימון כנשלחה | Mark as shipped |
| משלוח, `shipped` | `shop.action.markDelivered` | סימון כנמסרה | Mark as delivered |
| איסוף, `paid` | `shop.action.markPickedUp` | סימון כנאספה | Mark as picked up |
| דיגיטלי, `paid` | `shop.action.markDelivered` | סימון כנמסרה | Mark as delivered |

**הסימון לא הפיך בשרת.** `markOrderShipped`/`markOrderFulfilled` לא חוזרים
אחורה (חותמות הזמן היו משקרות), והקונה מקבל את הסטטוס ב-webhook. לחיצה בטעות
בטלפון צריכה דרך חזרה, ולכן **ההשהיה היא בצד הלקוח**: הטוסט מופיע מיד עם
"החזרה", והפעולה נשלחת לשרת רק אחרי 5 שניות. "החזרה" בתוך החלון מבטלת את השליחה
— לא את הסטטוס.

| מפתח | עברית | English |
|---|---|---|
| `shop.toast.shipping` | מסמנים את הזמנה {{number}} כנשלחה… | Marking order {{number}} as shipped… |
| `shop.toast.completing` | מסמנים את הזמנה {{number}} כהושלמה… | Marking order {{number}} as completed… |
| `shop.toast.undo` | החזרה | Undo |
| `shop.toast.shipped` | הזמנה {{number}} סומנה כנשלחה | Order {{number}} marked as shipped |
| `shop.toast.done` | הזמנה {{number}} הושלמה | Order {{number}} completed |
| `shop.toast.failed` | הסימון לא נשמר. בדקו את החיבור ונסו שוב. | That didn't save. Check your connection and try again. |
| `shop.toast.retry` | ניסיון חוזר | Try again |

### 3.6 ביטול הזמנה — רק מי שהכסף אצלו (הוכרע 2026-10-18)

`cancelOrder` (`orderLifecycle.ts`) מרשה ביטול **רק לחבר שהכסף אצלו** — רק הוא
יכול לתקן דיווח על הכסף שלו. במסלול ה-MVP אין לקונה ערוץ אצלנו: הקשר איתו נשאר
באתר, וגם החזר הכסף קורה שם. הביטול כאן **רושם** החזר שכבר סוכם. מה שהפעולה
עושה, וזה מה שהטקסט צריך לומר:
- המכירות שלו שעוד לא נכנסו לחלוקה **מתאפסות**.
- מכירה שכבר בחלוקה **נשארת כמו שהיא**, והרקמה מקבלת הודעה לסכם יחד איך
  מיישבים.
- המלאי חוזר כברירת מחדל **רק אם ההזמנה עוד לא נשלחה**.

| מפתח | עברית | English |
|---|---|---|
| `shop.cancel.action` | ביטול ההזמנה | Cancel order |
| `shop.cancel.title` | לבטל את הזמנה {{number}}? | Cancel order {{number}}? |
| `shop.cancel.body` | עשו את זה אחרי שסיכמתם עם הקונה והחזרתם לו את הכסף דרך האתר. המכירות של ההזמנה יתאפסו. | Do this once you've agreed with the buyer and refunded them through your site. The order's sales will be reset. |
| `shop.cancel.inSplit` | {{count}} מכירות כבר נכנסו לחלוקה. הן לא ישתנו, והרקמה תקבל הודעה כדי לסכם יחד איך מיישבים את ההחזר. | {{count}} sales are already in a split. They won't change, and the rikma will be told so you can settle the refund together. |
| `shop.cancel.inSplitOne` | מכירה אחת כבר נכנסה לחלוקה. היא לא תשתנה, והרקמה תקבל הודעה כדי לסכם יחד איך מיישבים את ההחזר. | 1 sale is already in a split. It won't change, and the rikma will be told so you can settle the refund together. |
| `shop.cancel.restock` | להחזיר את הפריטים למלאי | Return the items to stock |
| `shop.cancel.restockHint` | מסומן מראש כשההזמנה עוד לא נשלחה | On by default when the order hasn't shipped |
| `shop.cancel.reason` | מה סוכם עם הקונה? | What did you agree with the buyer? |
| `shop.cancel.confirm` | ביטול ההזמנה | Cancel order |
| `shop.cancel.keep` | השארת ההזמנה | Keep order |
| `shop.cancel.holderOnly` | רק {{name}} יכול/ה לבטל — הכסף אצלו/ה | Only {{name}} can cancel — they hold the money |
| `shop.toast.cancelled` | הזמנה {{number}} בוטלה | Order {{number}} cancelled |

הכפתור **אינו** הפעולה הראשית ואינו בפס הדביק — הוא בתפריט "עוד" (⋯), ומוצג
**רק** למי שהכסף אצלו. שאר החברים רואים במקומו את `shop.cancel.holderOnly`, כדי
שיידעו למי לפנות. `shop.cancel.inSplit` מוצג רק כשיש מכירה כזו. אחרי ביטול אין
"החזרה": הפעולה סופית.

---

## 4. מוצרים — הרשימה והעורך (S4)

### 4.1 רשימת המוצרים

בטלפון זו רשימה, לא טבלה: תמונה · שם · מחיר · מלאי, ועריכה בלחיצה על המחיר או
המלאי (sheet מלמטה). בדסקטופ — טבלה עם עריכה בשורה.

| מפתח | עברית | English | הערה |
|---|---|---|---|
| `shop.products.add` | הוספת מוצר | Add product | |
| `shop.products.search` | חיפוש מוצר או מק״ט | Search products or SKU | |
| `shop.products.priceFrom` | מ-{{price}} | From {{price}} | כשיש טווח |
| `shop.products.variants` | {{count}} וריאציות | {{count}} variants | |
| `shop.products.variantsOne` | וריאציה אחת | 1 variant | |
| `shop.products.inStock` | {{count}} במלאי | {{count}} in stock | |
| `shop.products.unlimited` | ללא הגבלה | Unlimited | |
| `shop.products.soldOut` | אזל | Sold out | קיים `outOfStock: "אזל מהמלאי"` — בתג "אזל" מספיק |
| `shop.products.lowStock` | נותרו {{count}} | {{count}} left | |
| `shop.products.hidden` | מוסתר מהחנות | Hidden from shop | |
| `shop.products.selected` | {{count}} נבחרו | {{count}} selected | עריכה מרוכזת |
| `shop.products.bulkStock` | עדכון מלאי | Update stock | |
| `shop.products.bulkHide` | הסתרה מהחנות | Hide from shop | |
| `shop.products.export` | ייצוא CSV | Export CSV | |
| `shop.products.exportHint` | בפורמט של Shopify — נפתח בכל מערכת מכירות ובאקסל | Shopify format — opens in any sales system and in Excel | |

### 4.2 גלריה

| מפתח | עברית | English |
|---|---|---|
| `shop.gallery.title` | תמונות ({{count}}/12) | Photos ({{count}}/12) |
| `shop.gallery.add` | הוספת תמונות | Add photos |
| `shop.gallery.coverHint` | התמונה הראשונה היא תמונת השער | The first photo is the cover |
| `shop.gallery.makeCover` | הפיכה לתמונת שער | Make cover |
| `shop.gallery.moveEarlier` | הזזה קדימה | Move earlier |
| `shop.gallery.moveLater` | הזזה אחורה | Move later |
| `shop.gallery.remove` | הסרת התמונה | Remove photo |
| `shop.gallery.full` | הגעתם ל-12 תמונות. כדי להוסיף, הסירו אחת. | You've reached 12 photos. Remove one to add another. |
| `shop.gallery.uploadFailed` | {{name}} לא עלתה. נסו שוב, או בחרו קובץ קטן יותר. | {{name}} didn't upload. Try again, or pick a smaller file. |

בטלפון אין "גררו": כפתורי הזזה מופיעים בלחיצה על תמונה. גרירה היא תוספת בדסקטופ.

### 4.3 אפשרויות ווריאציות

| מפתח | עברית | English | הערה |
|---|---|---|---|
| `shop.options.title` | אפשרויות | Options | |
| `shop.options.hint` | למשל מידה או צבע. מכל צירוף נוצרת וריאציה עם מחיר ומלאי משלה. | For example size or colour. Each combination becomes a variant with its own price and stock. | |
| `shop.options.add` | הוספת אפשרות | Add option | |
| `shop.options.name` | שם האפשרות | Option name | placeholder: `מידה` |
| `shop.options.values` | ערכים | Values | placeholder: `S, M, L` |
| `shop.options.addValue` | הוספת ערך | Add value | |
| `shop.options.reuse` | בשימוש גם ב-{{count}} מוצרים | Also used by {{count}} products | האפשרויות הן ברמת הרקמה |
| `shop.variants.generate` | יצירת {{count}} וריאציות | Create {{count}} variants | המספר בכפתור — אין הפתעות |
| `shop.variants.title` | וריאציות | Variants | |
| `shop.variants.col.price` | מחיר | Price | |
| `shop.variants.col.stock` | מלאי | Stock | |
| `shop.variants.col.sku` | מק״ט | SKU | |
| `shop.variants.col.shown` | בחנות | In shop | מתג |
| `shop.variants.samePrice` | אותו מחיר לכולן | Same price for all | |
| `shop.variants.unlimited` | ללא הגבלה | Unlimited | מתג ליד המלאי — `-1` לא מוצג לעולם |
| `shop.variants.photos` | תמונות לוריאציה הזו | Photos for this variant | |
| `shop.variants.photosHint` | בלי תמונות משלה, מוצגות תמונות המוצר | Without its own photos, the product photos are shown | |
| `shop.variants.hiddenHint` | וריאציה שנמכרה בעבר לא נמחקת — היא מוסתרת, וההזמנות הקודמות נשמרות. | A variant that has sold is never deleted — it's hidden, and past orders keep it. | מסביר למה אין "מחיקה" |

**הסרת אפשרות שיש לה וריאציות:**

| מפתח | עברית | English |
|---|---|---|
| `shop.options.removeTitle` | להסיר את "{{name}}"? | Remove "{{name}}"? |
| `shop.options.removeBody` | {{count}} וריאציות יוסתרו מהחנות. הזמנות קודמות נשמרות כמו שהן. | {{count}} variants will be hidden from the shop. Past orders stay as they are. |
| `shop.options.removeConfirm` | הסרת {{name}} | Remove {{name}} |
| `shop.options.removeKeep` | השארה | Keep it |

**שגיאות שמגיעות מהשרת:**

| קוד | מפתח | עברית | English |
|---|---|---|---|
| `DUPLICATE_VARIANT` | `shop.err.dupVariant` | הצירוף {{combo}} כבר קיים. שנו את אחד הערכים. | {{combo}} already exists. Change one of the values. |
| `DUPLICATE_SKU` | `shop.err.dupSku` | המק״ט {{sku}} כבר שייך ל{{product}}. כל מק״ט ברקמה צריך להיות ייחודי. | SKU {{sku}} already belongs to {{product}}. Each SKU in the rikma must be unique. |
| רשת | `shop.err.saveFailed` | השינויים לא נשמרו. הם עדיין כאן — נסו לשמור שוב. | Your changes weren't saved. They're still here — try saving again. |

השגיאה מוצגת **ליד השורה**, לא בטוסט. "הם עדיין כאן" חשוב: מוכר שהקליד 20 מחירים
בטלפון צריך לדעת שלא איבד אותם.

### 4.4 שינוי מחיר במוצר של רקמה (`editObject`)

זה המקום שבו הטקסט הכי קובע: השמירה **הצליחה**, אבל המחיר עוד לא חל.

| מפתח | עברית | English |
|---|---|---|
| `shop.price.proposeHint` | שינוי מחיר במוצר של הרקמה עובר לאישור השותפים | A price change on a rikma product goes to the partners for approval |
| `shop.price.save` | הצעת המחיר לרקמה | Propose price to the rikma |
| `shop.price.pending` | ממתין לאישור הרקמה | Waiting for the rikma's approval |
| `shop.price.pendingBody` | הצעת {{newPrice}}. עד שיאושר, הקונים רואים {{oldPrice}}. | You proposed {{newPrice}}. Until it's approved, buyers see {{oldPrice}}. |
| `shop.price.silence` | אם אף אחד לא יגיב, יאושר בעוד {{time}} | If nobody responds, it's approved in {{time}} |
| `shop.price.openVote` | להצבעה | Open the vote |
| `shop.price.savedPersonal` | המחיר עודכן | Price updated |

**חלופות לתווית הממתינה:**

| אפשרות | נוסח | טון | הערה |
|---|---|---|---|
| **A (מומלץ)** | ממתין לאישור הרקמה | רגוע | הנוסח של התכנית; מסביר מי מחזיק את ההחלטה |
| B | הוצע לשותפים | פעיל | טוב כטוסט, פחות כתג קבוע |
| C | לא נשמר — דורש אישור | שלילי | **לא**: נשמע כמו כישלון, והמוכר ינסה לשמור שוב |

הכפתור משנה את התווית שלו לפי סוג המוצר: במוצר אישי `shop.price.save` מוחלף
ב-"שמירה" — אין טעם לומר "הצעה" כשאין למי.

---

## 5. מלאי

| מפתח | עברית | English | הערה |
|---|---|---|---|
| `shop.stock.filter.low` | מלאי נמוך | Low stock | |
| `shop.stock.filter.out` | אזל | Sold out | |
| `shop.stock.filter.short` | חסר להזמנות | Short for orders | מלאי שלילי = הזמנות שממתינות לייצור |
| `shop.stock.filter.all` | הכל | All | |
| `shop.stock.waiting` | {{count}} הזמנות מחכות ליחידות האלה | {{count}} orders are waiting for these units | במקום "‎-2" |
| `shop.stock.preorder` | הזמנה מראש · אספקה תוך {{time}} | Pre-order · ships within {{time}} | `leadTimeHours` |
| `shop.stock.adjust` | עדכון מלאי | Update stock | |
| `shop.stock.set` | יש במלאי | In stock now | שדה: המספר הנוכחי |
| `shop.stock.add` | נוספו | Add | שדה: כמה הגיעו (למי שסופר משלוח שנכנס) |
| `shop.stock.saved` | המלאי עודכן | Stock updated | |
| `shop.stock.lowAt` | מלאי נמוך מתחת ל- | Low stock below | שדה בעורך המוצר (`lowStockAt`) |
| `shop.stock.lowAtHint` | כשנשארות כמה יחידות להזמין עוד? חל על כל וריאציה בנפרד. | How many units left before you restock? Applies to each variant separately. | |
| `shop.stock.lowAtUnit` | {{unit}} | {{unit}} | יחידת המוצר (`unit`) — "ק״ג", "יח׳" |
| `shop.stock.noThreshold` | לא הוגדר סף למלאי נמוך באף מוצר. מגדירים אותו בעמוד המוצר. | No product has a low-stock level yet. Set one on the product page. | מצב ריק של סינון "מלאי נמוך" |

**סף למלאי נמוך — לכל מוצר (הוכרע 2026-10-18).** סף קבוע לא עובד ברקמה שמוכרת
גם רגלי שולחן וגם גבינה בקילו: 3 יחידות זה הרבה רגליים ומעט מאוד גבינה. השדה
`lowStockAt` יושב על המוצר, וכל וריאציה נבדקת מולו בנפרד. **ריק = אין סימון**:
מוצר בלי סף לא נצבע "נמוך" על סמך מספר שאף אחד לא בחר. ב-MVP הסימון מופיע רק
במסך (תג, סינון, מונה) — לכן התווית "מלאי נמוך מתחת ל-" ולא "התראה כש…": התראה
שנשלחת היא הבטחה שעוד לא בנינו.

**"יש במלאי" או "נוספו":** שני מצבים בעדכון, כי לאנשים יש שתי שאלות שונות —
"ספרתי את המדף" ו"הגיעה סחורה". מכריחים את השני לחשב בראש = טעויות.

---

## 6. מכירות

| מפתח | עברית | English |
|---|---|---|
| `shop.sales.col.product` | מוצר | Product |
| `shop.sales.col.variant` | וריאציה | Variant |
| `shop.sales.col.source` | מקור | Source |
| `shop.sales.col.holder` | אצל מי הכסף | Who holds it |
| `shop.sales.col.split` | חלוקה | Split |
| `shop.sales.split.waiting` | ממתין לחלוקה | Waiting to split |
| `shop.sales.split.inSplit` | בחלוקה | In a split |
| `shop.sales.split.claimOpen` | ממתין להסכמה | Waiting for consent |
| `shop.sales.range` | טווח תאריכים | Date range |
| `shop.sales.export` | ייצוא CSV | Export CSV |
| `shop.sales.total` | סה״כ בטווח: {{amount}} | Total in range: {{amount}} |

---

## 7. חיבורים ותבנית הפתיחה

הלשונית מארחת את `RikmaApiPanel` כמו שהוא (`rikmaApi.json` נשאר המקור לטקסט
המפתחות). נוסף כרטיס אחד מעליו:

| מפתח | עברית | English |
|---|---|---|
| `shop.starter.title` | חנות מוכנה לאתר שלכם | A ready-made shop for your site |
| `shop.starter.body` | תבנית שעולה בלחיצה: קטלוג, עגלה ותשלום. ההזמנות נכנסות לכאן לבד, עם פרטי המשלוח. | A template you deploy in one click: catalogue, cart and checkout. Orders arrive here on their own, with delivery details. |
| `shop.starter.cta` | הקמת החנות | Set up the shop |
| `shop.starter.needs` | תצטרכו: חשבון ב-Vercel וחשבון אצל ספק תשלום | You'll need: a Vercel account and a payment provider account |
| `shop.connect.status.live` | מחובר · הזמנה אחרונה לפני {{time}} | Connected · last order {{time}} ago |
| `shop.connect.status.none` | עוד לא חובר אתר | No site connected yet |

---

## 8. מצבים ריקים, טעינה ושגיאות כלליות

| מפתח | עברית | English |
|---|---|---|
| `shop.empty.orders` | עוד אין הזמנות | No orders yet |
| `shop.empty.ordersBody` | הזמנות מגיעות לכאן מהאתר שלכם אחרי שהקונה שילם. | Orders arrive here from your site once the buyer has paid. |
| `shop.empty.ordersCta` | חיבור אתר | Connect a site |
| `shop.empty.toShip` | הכל נשלח | Everything's shipped |
| `shop.empty.toShipBody` | הזמנה חדשה תופיע כאן, ותקבלו עליה התראה. | A new order will show up here, and you'll be notified. |
| `shop.empty.products` | עוד אין מוצרים ברקמה | No products in this rikma yet |
| `shop.empty.productsBody` | מוצר חדש עובר אישור של השותפים לפני שהוא עולה לחנות. | A new product goes to the partners for approval before it reaches the shop. |
| `shop.empty.filtered` | אין תוצאות לסינון הזה | Nothing matches this filter |
| `shop.empty.clearFilter` | ניקוי הסינון | Clear filter |
| `shop.empty.sales` | אין מכירות בטווח הזה | No sales in this range |
| `shop.loading.orders` | טוען הזמנות… | Loading orders… |
| `shop.err.load` | לא הצלחנו לטעון את {{what}}. נסו לרענן. | We couldn't load {{what}}. Try refreshing. |
| `shop.err.notReady` | החנות עוד לא פעילה ברקמה הזו | The shop isn't active for this rikma yet (`503 SHOP_NOT_READY`) |

**מילים שמורות** (§0 החלטה 4):

| מילה | משמעות יחידה |
|---|---|
| ביטול | ביטול הזמנה |
| החזרה | עצירת פעולה שעוד לא נשלחה לשרת (undo בחלון ההשהיה, §3.5) |
| סגירה | סגירת חלון / sheet |
| הסתרה | `active=false` — אף פעם לא "מחיקה" |
| הצעה | שינוי שעובר אישור הרקמה |
| שמירה | שינוי שחל מיד |

---

## 9. הערות לוקליזציה

**עברית**
- **כפתורים בשם פעולה** ("סימון כנשלחה", "הוספת מוצר") — זו המוסכמה הקיימת
  (`addSale`, `editorOpenFull`) והיא פותרת את המגדר. **גוף הטקסט ברבים** ("נסו",
  "תקבלו"), כמו `rikmaApi.json`. לא לערבב ציווי יחיד ("צור", "בטל") — הוא קיים
  בפאנל ה-API ולא כדאי להעתיק אותו.
- "הזמנה" נקבה: נשלח**ה**, הושלמ**ה**, בוטל**ה**. התגים מתייחסים להזמנה, לא
  לפריט.
- מספרים, מק״טים, טלפונים ומחירים בתוך RTL — ב-`<bdi>`. "הזמנה 1042" עם ‎#‎
  מתהפך בלי זה.
- `מק״ט` עם גרשיים (״) ולא מירכאות ASCII — מירכאות שוברות את ה-JSON; `יח׳` עם גרש (׳).

**ערבית** — שם פעולה (مصدر) בכפתורים מאותה סיבה. Order = `طلب`; variant =
`متغيّر`/`متغيّرات`; option = `خيار`. רקמה = `ريكما`, נקבה. `نفد` לאזל.
**ספרדית** — order = `pedido` (לא `orden`); variant = `variante`; option =
`opción`; `la rikma`. כפתורים באינפיניטיב ("Marcar como enviado"). התארכות ~25%.
**רוסית** — order = `заказ`; variant = `вариант`; option = `параметр`; SKU =
`артикул`. כפתורים בשם עצם / אינפיניטיב ("Отметить отправленным"). התארכות
~35% — הלשוניות נגללות (§3.1), והפס הדביק מכיל כפתור אחד בלבד.

**כל השפות**
- רבים עם `{{count}}`, ויחיד במפתח `…One` נפרד (מוסכמת הפרויקט: `seatsLeftOne`,
  `viewersOne`). לא `{{n}}` — שם בן תו אחד לא מוחלף (CLAUDE.md).
- סכומים דרך הפורמטר של ריבוי המטבעות — לא `₪` קבוע בטקסט.
- אחרי הוספת ה-namespace: `npm run check:i18n` ו-`npm run check:script`.

---

## 10. הכרעות (2026-10-18)

| # | שאלה | הוכרע | מה זה דורש |
|---|---|---|---|
| 1 | מספר הזמנה לתצוגה | **המספר של האתר; אם אין — ה-`id`** | ✅ בנוי (ממתין לפריסת `1.0b`): `order.displayNumber`, פרמטר ב-`POST /orders`, `orderId`+`displayNumber` בתשובות, `orderNumberOf` ב-`ordersApi.ts`. ההתראות של `createPaidOrder`/`cancelOrder` כבר עברו למספר ולנוסח של §10.1 |
| 2 | ביטול מצד הרקמה | **כפתור למי שהכסף אצלו בלבד** | כבר נאכף ב-`cancelOrder`. במסך: הכפתור רק אצלו, ושאר החברים רואים `shop.cancel.holderOnly` (§3.6) |
| 3 | סף "מלאי נמוך" | **שדה לכל מוצר** | `matanot.lowStockAt` (decimal, ריק = אין סימון) — ✅ בסכמה של `1.0b`. נשאר: שדה בעורך המוצר (S4), נבדק מול כל וריאציה (§5) |
| 4 | איך החברים שומעים על הזמנה | **ב-MVP: התראה + הפס במסך המכירות, בלי כרטיס בעמוד הלב** | ההתראה כבר נשלחת מ-`createPaidOrder`; הנוסח שלה מתוקן ב-§10.1. **אחרי ה-MVP:** כרטיס בעמוד הלב, והזמנה לשליחה שנפתחת כמטלה ברקמה |

**למה ההחלטה הרביעית היא שלב ולא סוף:** הזמנה לשליחה היא עבודה של מישהו ברקמה,
והמקום הטבעי שלה הוא איפה שהעבודה כבר חיה — עמוד הלב והמטלות. ב-MVP מספיקים
ההתראה והפס, כי מי שמטפל בהזמנות נכנס למסך המכירות בכל מקרה.

### 10.1 נוסח ההתראה על הזמנה חדשה

היום `createPaidOrder.ts` שולח `הזמנה ${ref} ב-${amount} (${count} שורות)`. יש
בזה שלוש בעיות: ה-`ref` הגולמי (`57:pi_3Q8x`), "שורות" (מונח של מסד נתונים),
ו"הזמנה" בלי הקשר. ההתראה היא אובייקט `{ he, en }` לפי שפת **הנמען**, וזו אחת
החריגות המותרות ל-`$t()` (CLAUDE.md), ולכן הנוסח נשאר שם:

| מצב | עברית | English |
|---|---|---|
| כותרת | 🛒 הזמנה חדשה מהאתר | 🛒 New order from your site |
| כותרת, חסר במלאי | 🛒 הזמנה מהאתר — חסר במלאי | 🛒 Order from your site — short on stock |
| גוף | הזמנה {{number}} ב-{{amount}}, {{items}} פריטים, שולמה באתר של "{{rikma}}". | Order {{number}} for {{amount}}, {{items}} items, was paid on "{{rikma}}"'s site. |
| תוספת לחסר במלאי | חסרות {{short}} יחידות. אפשר להכין אותן או לתאם עם הקונה מועד אחר. | {{short}} units are missing. You can make them or agree a later date with the buyer. |

`{{items}}` הוא סכום הכמויות, לא מספר השורות. בתוספת לחסר במלאי ירדה ההצעה
"להחזיר" כפעולה ראשונה: ביטול הוא החלטה של מי שהכסף אצלו (§3.6), לא הצעת ברירת
מחדל לכל הרקמה.

> **בנוי (2026-10-18):** `createPaidOrder.ts` שולח את הנוסח הזה. גם `cancelOrder`
> (`orderLifecycle.ts`) והערת ההחזר על המכירה (`refundNoteOf`) קוראים להזמנה לפי
> המספר. כשמספר היחידות אינו שלם (מוצר בקילו), `{{items}}` סופר שורות.
