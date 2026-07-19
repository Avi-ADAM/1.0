# PLAN: קישור לקוח↔מכירה דרך Sheirut (Sale Customer Link)

> משלים את `docs/PLAN_RECURRING_SALES.md` (מכירה מתחדשת ודיווח חודשי).

## העיקרון

בפלטפורמה **לקוח מקושר למכירה דרך אובייקט ביניים — `Sheirut`**, לא בקשר ישיר.
ה-Sheirut הוא רשומת הרכישה/השירות של הלקוח: הוא זה שמופיע בעמוד העסקאות של
הלקוח (`/deals` → "הרכישות שלי", דרך `dealsQueries`), נושא את מנגנון זרימת
הכסף הקיים (`iTransferMoney` / `iTransferedTo` / `iGotMoney` /
`moneyTransfered`) ואת הקשרים ל-matanot, לריקמה ול-sales.

```
User (לקוח) ──users_permissions_users──▶ Sheirut ◀──sales──▶ Sale
                                            │
                                            ├─▶ Matanot (המוצר)
                                            └─▶ Project (הריקמה)
```

בנוסף קיים על `Sale` שדה `customer` — **מצביע דנורמליזציה בלבד** לצורך
שאילתות מהירות של מחזורי הדיווח החודשיים (מי הלקוח של המחזור הזה). מקור
האמת לקשר הוא ה-Sheirut.

## מה ממומש היום

### 1. ציון לקוח בדיווח מכירה (כל סוגי המכירה)

ב-`SaleComponent` אפשר לציין לקוח (שם משתמש או אימייל **מדויק** של משתמש
רשום — נפתר ל-user אמיתי ב-qid `mrsFindCustomer`; זיהוי שלא נמצא נכשל עם
שגיאה ברורה). `createSale` אז:

1. יוצר את ה-Sale כרגיל (כולל הסכמת מחזיק-הכסף אם המדווח ≠ האוחז).
2. יוצר **Sheirut** דרך `87createSheirut`: `users_permissions_users:
   [customer]`, `matanot`, `project`, `sales: [sale]`, `name`/`price`/
   `quant`/`total` מנתוני המכירה, `isApruved: true`.
3. מסמן `Sale.customer` (הדנורמליזציה).

### 2. מכירה רגילה — רק בסטטוס "שולם"

כרגע ציון לקוח על מכירה רגילה (חד-פעמית / total) אפשרי **רק כשהכסף כבר
עבר**: דיווח מכירה הוא ממילא רישום של כסף שנכנס. לכן ה-Sheirut נוצר עם
`moneyTransfered: true` ו-`oneTime: true`, **ואין צורך באשרור מצד הלקוח** —
הרכישה פשוט מופיעה אצלו בעמוד העסקאות כתיעוד.

### 3. מכירה מתחדשת (הוראת קבע)

ה-Sheirut של המנוע נוצר עם `oneTime: false` ו-`moneyTransfered: false` —
הוא רשומת הוראת הקבע המתמשכת, ומצב התשלום מוסדר **פר מחזור חודשי** (ראו
PLAN_RECURRING_SALES): ה-monther מקשר כל Sale-מחזור גם ל-Sheirut של המנוע
(`sheiruts`), הלקוח מדווח כמה העביר והאוחז מאשרר "התקבל".

## עבודה עתידית — מכירה *ללא* סטטוס "שולם" (בקשת תשלום)

מטרה: לאפשר לדווח מכירה ללקוח **לפני שהכסף עבר**. בפועל זו לא "מכירה" אלא
**יצירת שירות + בקשת תשלום מהלקוח, שהלקוח צריך לאשרר**. השלד המוצע, רכוב
כולו על המנגנונים הקיימים:

1. **יצירה** — המוכר מדווח "מכירה ממתינה לתשלום" ללקוח מזוהה. נוצרים:
   - `Sheirut` כמו היום אבל `moneyTransfered: false` (וסימון בקשת תשלום —
     אפשר בשדה קיים `productExepted`/`iGotIt` או שדה חדש `paymentRequested`).
   - `Sale` עם `pending: true` + `holderStatus: 'open'` — **לא נספר** במאזנים
     ובחלוקות עד אשרור (בדיוק הסמנטיקה של מחזור חודשי לפני דיווח).
2. **אשרור הלקוח** — כרטיס בעמוד העסקאות של הלקוח (אותו `RecurringCycleCard`
   בהכללה, או כרטיס ייעודי): "שילמת X עבור Y?" עם אפשרות לאשר את הסכום, לדייק
   סכום אחר (counter — לא וטו, לפי "אין לא מוחלט"), או לשוחח.
   טכנית: `customerAmount`/`customerReportedAt` שכבר קיימים על Sale, או
   זרימת `iTransferMoney`/`iGotMoney` של ה-Sheirut.
3. **אשרור "התקבל"** — האוחז מאשר שהכסף הגיע ⇒ `Sale.pending: false`,
   `holderStatus: 'self'`, `receivedConfirmedAt`, `Sheirut.moneyTransfered:
   true` — והמכירה זורמת לחלוקות.
4. **שתיקה במסגרת ה-restime** — לפי עקרון "שתיקה היא הסכמה": לפתוח `Decision`
   בילטרלי (בסגנון `saleClaim`, אבל בין מוכר ללקוח שאינו חבר ריקמה) עם
   `timegrama`; בתום זמן התגובה הגרסה העומדת מאושררת אוטומטית. דורש הרחבת
   scope של `saleClaim` (או `kind` חדש, למשל `paymentRequest`) למשתתף שאינו
   חבר ריקמה — זו הנקודה היחידה שדורשת עבודת עומק.
5. **תזכורות** — timegrama + מיילים כמו במחזורים החודשיים.

### מה כבר מוכן לקראת זה

- Sale תומך ב-`pending` + `holderStatus:'open'` שלא נספרים.
- `customerAmount`/`customerReportedAt`/`receivedConfirmedAt` על Sale.
- פעולות עם בדיקת ישות ללקוח שאינו חבר ריקמה
  (`customerReportRecurringSaleCycle` היא התבנית).
- כרטיסי לקוח בעמוד העסקאות (`RecurringCycleCard` role='customer').

### מה חסר

- `kind` חדש ל-Decision (או הרחבת `saleClaim`) לצד שאינו חבר ריקמה +
  timegrama finalizer מתאים.
- פעולת `requestPaymentFromCustomer` (יצירת השילוש Sheirut+Sale+Decision).
- UI ב-SaleComponent: מתג "טרם שולם — לשלוח בקשת תשלום".
