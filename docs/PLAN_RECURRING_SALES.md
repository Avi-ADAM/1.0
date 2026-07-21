# PLAN: מכירה מתחדשת — דיווח חודשי (Recurring Sales)

> צד Strapi: `1.0b/docs/PLAN_RECURRING_SALES_BACKEND.md` (שדות חדשים על `sale`
> ועל ה-User extension). אחרי דיפלוי הסכמה יש להריץ `npm run types:update`.

## Context — למה

מכירה חודשית פתוחה (הוראת קבע, ריטיינר, מנוי) היא הכנסה **שמשתנה ויכולה
להתבטל**. עד עכשיו נרשמה פעם אחת (Sale עם `kindOf: monthly` + `startDate` בלי
`finishDate` + Monter) ולא קרה איתה כלום. הפיצ'ר משכפל את דפוס **המשאב
המתחדש** (`mashabetahalich.recurring` → מחזור `Maap` חודשי דרך ה-monther) אל
צד ההכנסות:

- כל חודש נפתח **כרטיס דיווח**: כמה נכנס בפועל החודש? (0 = לא נכנס — סכום,
  לא וטו, לפי עקרון "אין לא מוחלט").
- תזכורת במייל לאחראי; אם יש **לקוח** בתמונה — גם הלקוח מקבל כרטיס ומעדכן
  כמה העביר, והמוכר מאשרר "התקבל".

## המודל — על מה רוכבים

**אין מודל חדש.** מחזור חודשי של מכירה הוא בעצמו `Sale`, כך שהוא זורם
לחלוקות (tosplits) כמו כל מכירה ברגע שהוא אפקטיבי:

| תפקיד | מימוש |
|---|---|
| מנוע (הוראת הקבע) | ה-Sale המקורי: `recurring:true` + `isMonterActive:true`, `in` = הסכום הצפוי לחודש |
| מחזור חודשי | Sale בת: `recurringSource` → המנוע, `cycleStart`/`cycleEnd`, `pending:true`, `holderStatus:'open'` |
| דיווח האוחז | `in` = הסכום בפועל, `pending:false`, `holderStatus:'self'` (PLAN_sale_holder_consent: נספר רק כשאפקטיבי) |
| דיווח הלקוח | `customerAmount` + `customerReportedAt` על המחזור (לא נספר בשום מקום לבדו) |
| "התקבל" | דיווח האוחז על אותו הסכום שהלקוח דיווח ⇒ `receivedConfirmedAt` |
| ביטול הוראת קבע | `closeEngine` בדיווח ⇒ מנוע `isMonterActive:false` + `finishDate` |

## הזרימה

1. **יצירה** — `createSale` (SaleComponent במרכז המכירות / moach / gift):
   מכירה חודשית/שנתית עם תאריך התחלה ובלי תאריך סיום מסומנת אוטומטית כמנוע
   (`recurring:true`). אפשר לציין **לקוח** בשם משתמש/אימייל מדויק
   (`customerIdentifier`, נפתר ב-qid `mrsFindCustomer`; חייב להיות משתמש
   רשום). הקישור הקנוני ללקוח הוא **Sheirut** שנוצר עבור הוראת הקבע
   (ראו `docs/PLAN_SALE_CUSTOMER_LINK.md`); `Sale.customer` הוא דנורמליזציה
   לשאילתות המחזורים בלבד.
2. **ה-monther** — `/api/monthi` (`runRecurringSaleCycles`): פעם בחודש, לכל
   מנוע חי שבחלון הפעילות שלו, נפתחת Sale-בת למחזור הנוכחי (אם עוד לא נפתחה —
   בדיקת כפילות לפי חודש `cycleStart`, כמו maap), המקושרת גם ל-Sheirut של
   המנוע. מנוע שעבר את `finishDate` נסגר. מיילים: לאוחז (`role:'holder'` →
   מרכז המכירות) וללקוח (`role:'customer'` → עמוד העסקאות) —
   `monthlyRecurringSale.svelte`.
3. **דיווח האוחז** — מרכז המכירות (`/deals/sales-center`), סקשן "מכירות
   מתחדשות — דיווח חודשי" (`RecurringCycleCard`, `role='holder'`): פעולת
   `reportRecurringSaleCycle` (jwt + בדיקת ישות: האוחז בלבד). אם הסכום זהה
   לדיווח הלקוח — הכפתור הופך ל"אישור שהתקבל" וגם חותם `receivedConfirmedAt`.
   צ'קבוקס "לסגור את הוראת הקבע" מבטל מחזורים עתידיים.
4. **דיווח הלקוח** — עמוד העסקאות (`/deals`), סקשן "הוראות קבע — עדכון
   חודשי" (`role='customer'`): פעולת `customerReportRecurringSaleCycle`
   (jwt + בדיקת ישות: הלקוח בלבד; **בכוונה בלי projectMember** — הלקוח בדרך
   כלל אינו חבר ריקמה). מותר לעדכן שוב כל עוד המחזור pending; האוחז מקבל
   נוטיפיקציה לאשרר.

## קבצים

- **Actions:** `src/lib/server/actions/configs/reportRecurringSaleCycle.ts`,
  `customerReportRecurringSaleCycle.ts`; הרחבת `createSale.ts`.
- **qids:** `mrsListRecurringSaleEngines`, `mrsCreateCycleSale`,
  `mrsCloseRecurringSale`, `mrsGetCycleForReport`, `mrsReportCycleSale`,
  `mrsCustomerReportCycle`, `saleCenterPendingCycles`,
  `dealsCustomerPendingCycles`, `mrsFindCustomer` (+ qidsAccess).
- **Cron:** `src/routes/api/monthi/+server.js` (`runRecurringSaleCycles`).
- **UI:** `src/lib/components/sales/RecurringCycleCard.svelte`;
  סקשנים ב-`/deals/sales-center` (אוחז) וב-`/deals` (לקוח); שדה לקוח
  ב-`SaleComponent.svelte`.
- **מייל:** `src/lib/components/mail/monthlyRecurringSale.svelte`.

## עקרונות שנשמרו

- **נספר רק כשאפקטיבי:** מחזור נפתח `holderStatus:'open'` ⇒ לא נכנס למאזנים
  עד דיווח האוחז (`'self'`).
- **אין לא מוחלט:** "לא נכנס החודש" = דיווח 0; ביטול = סגירת המנוע, שגם היא
  נעשית דרך דיווח (אפשר 0 + סגירה).
- **דיווח הלקוח אינו כסף:** `customerAmount` הוא טענת הלקוח בלבד; רק דיווח
  האוחז יוצר מכירה אפקטיבית.

## עבודה עתידית (לא בשלב זה)

- **שתיקה כהסכמה על טענת לקוח:** כשהלקוח דיווח והאוחז שותק — לפתוח Decision
  בילטרלי (`kind` בסגנון `saleClaim`) עם timegrama שמאשרר את סכום הלקוח בתום
  ה-restime, במקום שהמחזור יישאר pending לעד. דורש התאמת saleClaim ללקוח
  שאינו חבר ריקמה.
- מו"מ מלא (counter ping-pong) בין לקוח לאוחז על סכום המחזור.
- תצוגת היסטוריית מחזורים על המנוע (ארכיון חודשי) ב-hamatanot / moach sales.
