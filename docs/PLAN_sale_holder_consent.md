# הסכמת מחזיק-הכסף בדיווח מכירה (Sale Holder Consent)

## Context — למה זה נבנה

כשמשתמש מדווח על מכירה הוא בוחר "אצל מי הכסף" (MultiSelect ב-
`SaleComponent.svelte`). יש שני מקרים שונים מהותית:

1. **הכסף אצלי** — דיווח ריבוני על עצמי. במודל היעד
   (PLAN_user_sovereign_consent) זה אירוע חתום שתקף מיידית: אני מעיד על
   עצמי שאני מחזיק בכסף, ואין צד אחר שצריך להסכים.
2. **הכסף אצל מישהו אחר** — היום זה נשמר בלי שום שער: כל חבר ריקמה יכול
   ליצור `Sale` שבו `users_permissions_user` מצביע על חבר אחר, ומאותו רגע
   אותו חבר "מחזיק כסף של הריקמה" לצורך חישובי מי-חייב-למי
   (`whowhat.svelte`), חלוקות (tosplit→haluka) ו-hervachti — בלי שאישר,
   בלי שנשאל, ובלי חתימה של אף אחד.

זה בדיוק סוג המוטציה ש-PLAN_user_sovereign_consent בא לסגור: קביעה על
מצבו הכספי של משתמש אחר חייבת הסכמה שלו. התקדים הקיים במערכת הוא ה-Haluka:
`senderconf` (הנותן אישר שהעביר) + `confirmed` (המקבל אישר שקיבל), עם
action `confirmHaluka` וקלף `didiget.svelte` בעמוד הלב. התכנית כאן משכפלת
את הדפוס הזה לדיווח מכירה, ומחברת אותו לשרשרת האירועים החתומים.

### עקרון

> דיווח "הכסף אצלי" = אירוע חתום של המדווח, סופי מיידית.
> דיווח "הכסף אצל X" = טענה (claim) שממתינה עד ש-X חותם שאכן קיבל.
> עד אז המכירה לא נספרת באף חישוב כספי ולא ניתנת לצירוף ל-tosplit.

---

## מיפוי המצב הקיים

### נקודת חנק אחת בצד שרת

כל דיווחי המכירה ב-UI מתנקזים ל-**`SaleComponent.svelte`**
(`src/lib/components/sales/SaleComponent.svelte`) שקורא
`executeAction('createSale')` → `src/lib/server/actions/configs/createSale.ts`
→ qids `createSaleRecord`. נקודות הקריאה:

| מקום | קובץ | הערות |
|------|------|-------|
| מרכז מכירות | `src/routes/(reg)/sales-center/+page.svelte` | הדף שהוזכר במשימה |
| דף ריקמה (מוח) | `src/lib/components/prPr/sale.svelte` | עטיפה דקה ל-SaleComponent |
| רשימת מוצרים בריקמה | `src/lib/components/prPr/hamatanot.svelte` | |
| דף מתנה ציבורי | `src/routes/(regandnon)/gift/[id]/+page.svelte` | עם `defaultHolder` |
| צ'אט AI | `src/lib/chat/components/ProductList.svelte` (מוזן מ-`src/mastra/tools/saleActionTool.ts`) | הסוכן רק שולף מוצרים; הדיווח עצמו עובר ב-SaleComponent |

כלומר: **שינוי ב-`createSale.ts` + ב-`SaleComponent.svelte` מכסה את כל
האתר בבת אחת.** אין call-site שעוקף את ה-action (ה-`salesService.js`
הישן עדיין מכיל מוטציה ישירה — ראו "ניקוי" בפאזה 1).

**חריג מכוון**: `createPlatformSale.ts` (הכנסת site-share לריקמת הפלטפורמה)
נשאר מחוץ לתכנית — לפי SITE_SHARE_TRANSFER_SPEC ההכנסה הזו auto-approved,
וההעברה הפיזית שלה כבר מאושרת דו-צדדית דרך transfer-Halukas.

### צרכני ה-Sale שצריכים לכבד סטטוס

- `getProjectFinancials` (qids) + `whowhat.svelte` — בניית חלוקה מצרפת
  מכירות ומסמנת אותן `pending: true` (בתוך tosplit) ואז `splited: true`
  (`71updateSaleSplited`, `80updateSale` דרך `approveHaluka`).
- `src/routes/(reg)/moach/[projectId]/sales/[saleId]/+page.svelte` — דף מכירה.
- `hamatanot.svelte` — תצוגת מכירות של מוצר.

⚠️ **השדה `pending` הקיים על Sale תפוס** — משמעותו היום "מצורפת ל-tosplit
שממתין להצבעות". אסור למחזר אותו לסטטוס אישור המחזיק; צריך שדות חדשים.

### תשתית ההסכמה שכבר קיימת (באמצע יישום)

- `src/lib/consent/event.ts` — `ConsentEvent` + טבלת `ACTIONS`.
- `src/lib/consent/policy.ts` — אילו actions דורשים QuorumProof.
- `src/lib/consent/specs/addVote.ts` — התקדים ל-`ConsentSpec` משותף
  שרת/לקוח (`ActionConfig.consentSpec`).
- `src/lib/client/shadowSign.ts` — `shadowSignFromCookie(spec, params)`
  לחתימת-צל אחרי הצלחת action (Phase 1 של תכנית הריבונות: לא חוסם).
- `src/lib/consent/publish.ts` + `/api/consent/events` — חתימה ושיקוף למראה.
- `src/lib/consent/reducers/` + `projection.ts` — event sourcing.
- `ConsentBadge.svelte` — תווית "מאומת".

---

## מודל האירועים החדש

הרחבת `ACTIONS` ב-`src/lib/consent/event.ts`:

```ts
saleRecord:  'sale.record',   // המדווח חותם על עצם הדיווח (תמיד)
saleConfirm: 'sale.confirm'   // המחזיק-הנטען חותם: predicate { what: true|false, why? }
```

- `sale.record` — actor = המדווח. `subject = { type: 'sale', id: <saleId> }`
  (החתימה מתבצעת אחרי שהשרת מחזיר id, כמו בהצבעות). predicate:
  `{ productId, projectId, holder, total, quantity, saleDate, kindOf,
  startDate?, finishDate?, note? }`.
  - כשהמדווח = המחזיק: זהו self-report ריבוני — האירוע לבדו סוגר את המכירה.
  - כשהמחזיק אחר: האירוע פותח שיחה, לא סוגר אותה.
- `sale.confirm` — actor = המחזיק הנטען בלבד. `parents = [sale.record.id]`
  (קצה DAG: ערעור הדיווח פוסל את האישור). `what: false` = דחייה, עם `why`.

**Policy** (`policy.ts`): שניהם `NOT_REQUIRED` לקוורום — זו הסכמה
דו-צדדית בין שני אנשים ספציפיים, לא הכרעת קבוצה. הכלל: המכירה "מאושרת"
כשקיים `sale.confirm` תקף עם `what: true` מהמחזיק, או כש-actor של
`sale.record` הוא-הוא המחזיק. (מקביל ל-special-case של project.leave על
עצמך ב-commitment.ts.)

**Reducers** (פאזה 4): `saleRecord.ts`, `saleConfirm.ts` — מוסיפים
`sales` ל-`ProjectState` עם `status: 'self' | 'awaiting' | 'confirmed' | 'declined'`.

---

## מודל הנתונים (Strapi — שינוי בצד ה-backend)

שדות חדשים על `Sale` (השדות `pending`/`splited` תפוסים ע"י מסלול ה-tosplit):

```
reporter        relation manyToOne → users-permissions.user   // מי דיווח
holderStatus    enum: self | awaiting | confirmed | declined  // ברירת מחדל אין (null = legacy)
holderDecidedAt datetime
declineReason   string
```

- `holderStatus = null` (מכירות קיימות) = **legacy**: נספרות בחישובים כמו
  היום (grandfathering — לא שוברים יתרות קיימות), אבל מוצגות "לא מאומת"
  בהמשך, כמו tosplits ישנים בתכנית הריבונות.
- אחרי הוספת השדות: ריצת codegen לעדכון `src/generated/graphql.ts`,
  `STRAPI_SCHEMA_REFERENCE.md`, `src/lib/generated/contentTypes.d.ts`.

---

## פאזות יישום

### פאזה 1 — פיצול המסלול ב-createSale + אירוע חתום (shadow)

**שרת — `src/lib/server/actions/configs/createSale.ts`:**
- השוואת `params.userId` (המחזיק הנבחר) מול `context.userId` (המדווח):
  - שווים → `holderStatus: 'self'`, `reporter: context.userId`.
  - שונים → אימות שהמחזיק הנטען חבר בריקמה, `holderStatus: 'awaiting'`,
    `reporter: context.userId`, ו-notification ממוקד למחזיק בלבד
    (`recipients: specificUsers` על `userIdsParam: 'userId'`,
    channels `socket`+`push`, `metadata.url: 'lev'`) — "X מדווח שמסר לך
    ___ ₪ ממכירת ___, נדרש אישורך".
- הרחבת qids `createSaleRecord` בשדות החדשים.
- החזרת `holderStatus` ב-result כדי שה-UI ידע להציג "ממתין לאישור".
- `consentSpec` חדש ב-`src/lib/consent/specs/createSale.ts` (משותף
  שרת/לקוח, לפי תקדים `addVote.ts`): action `'sale.record'`,
  `subjectType: 'sale'`, `subjectIdParam: 'saleId'`.

**לקוח — `SaleComponent.svelte`:**
- אחרי הצלחת `executeAction('createSale')`:
  `shadowSignFromCookie(createSaleConsentSpec, { ...actionParams, saleId: result.data.saleId })`
  (לא חוסם — Phase 1 של תכנית הריבונות).
- אם `holderStatus === 'awaiting'`: טוסט שונה — "הדיווח נשלח לאישור של
  {username}" במקום "המכירה בוצעה", והעברת הדגל ב-`onDone` כדי שדפים
  מארחים (sales-center וכו') יציגו נכון.

**מלאי**: הכמות יורדת מיידית כמו היום (שריון מלאי מונע מכירה כפולה),
ומושבת חזרה בדחייה (פאזה 2). ה-Monter למנויים מתמשכים נוצר כרגיל אבל
צריכתו נגזרת מהסטטוס (פאזה 3).

**ניקוי**: `salesService.createSale` (מוטציה ישירה ל-GraphQL ב-
`src/lib/services/salesService.js`) — ללא שימוש חי; לסמן deprecated או
למחוק כדי שלא יהפוך לעקיפת-שער.

**Exit**: דיווח "כסף אצלי" נשמר `self` + אירוע `sale.record` חתום במראה;
דיווח "כסף אצל אחר" נשמר `awaiting` והמחזיק מקבל התראה.

### פאזה 2 — פעולת אישור/דחייה + קלף בעמוד הלב

**Action חדש — `src/lib/server/actions/configs/confirmSaleHolding.ts`:**
```
params: { saleId, projectId, decision: 'confirm' | 'decline', reason? }
auth:   jwt + projectMember
handler: טוען את ה-Sale; דורש context.userId === users_permissions_user.id
         ו-holderStatus === 'awaiting';
  confirm → holderStatus: 'confirmed', holderDecidedAt: now
  decline → holderStatus: 'declined', declineReason (מינ' 20 תווים,
            כמו התקדים ב-didiget), השבת quant למוצר (אם unit>0 ולא
            unlimited), notification למדווח.
consentSpec: action 'sale.confirm', subjectIdParam 'saleId',
             predicate { what: decision === 'confirm', why: reason }
```
רישום ב-`configs/index.ts` + `ActionKey` ב-`actionClient.ts`.

**עמוד הלב** (בהתאמה לצורת העבודה שם — ה-lev pipeline):
- qids: הרחבת שאילתת הלב בסליית `salesAwaitingMyConfirmation` — sales
  שבהם `users_permissions_user = me` וגם `holderStatus = 'awaiting'`
  (דרך `levSliceRegistry.ts`/`levSliceLoader.ts`).
- `src/lib/utils/levDataExtractors.ts` — extractor חדש
  `extractPendingSaleConfirmations` + store ב-`levStores.ts`.
- קלף/מטבע חדש `src/lib/components/lev/saleConfirm.svelte` לפי התבנית של
  `didiget.svelte` (kind='receive'): לב = אישרתי שקיבלתי
  (`confirmSaleHolding` + חתימת-צל `sale.confirm`), צ'אט = בירור מול
  המדווח, מינוס = דחייה עם נימוק. progress ring של 2 משתתפים כמו שם.
- `levSocketHandler.ts` — ה-notification מפאזה 1 מרענן את הסלייס בזמן אמת.
- כרטיס מקביל במצב cards (כמו `didigetCard.svelte`).

**Exit**: זרימה מלאה בשני דפדפנים — A מדווח שהכסף אצל B, B רואה קלף בלב,
מאשר, הסטטוס הופך `confirmed`; דחייה מחזירה מלאי ומודיעה ל-A.

### פאזה 3 — צרכנים מכבדים סטטוס

מכירה נספרת רק כשהיא **effective**: `holderStatus IN ('self','confirmed')
OR holderStatus IS NULL` (legacy):
- `getProjectFinancials` (qids) — להוסיף `holderStatus` לשדות ולסנן/לסמן.
- `whowhat.svelte` — לא לצרף ל-tosplit מכירות `awaiting`/`declined`
  (גם בבנייה ידנית וגם באיסוף האוטומטי); בדיקת הגנה מקבילה בצד שרת אם
  צירוף המכירות עובר דרך action.
- `hamatanot.svelte` + `moach/[projectId]/sales/[saleId]` — chip סטטוס
  (ממתין לאישור {שם} / אושר / נדחה: {נימוק} / legacy-לא מאומת).
- `sales-center` — אינדיקציה על מכירות ממתינות של המשתמש (המדווח רואה
  מה עוד לא אושר).
- מנויים (Monter): הכנסה מחזורית של מכירה שאינה effective לא נצברת.

**Exit**: מכירת `awaiting` לא מופיעה באף יתרה, חלוקה או hervachti.

### פאזה 4 — אכיפה קריפטוגרפית (מתיישר עם Phase 3+ של תכנית הריבונות)

- `createSale` עם מחזיק-אחר **דוחה** בקשה בלי `sale.record` חתום תקף;
  `confirmSaleHolding` דוחה בלי `sale.confirm` חתום. (אימות צד-שרת דרך
  `src/lib/crypto/verify.ts`, שכבר רץ ב-`/api/consent/events`; מעבר
  מחתימת-צל שאחרי-הפעולה לחתימה שמצורפת לבקשה — לפי אותו מנגנון שייקבע
  לאכיפת tosplit ב-Phase 3 של התכנית הראשית.)
- Reducers `saleRecord`/`saleConfirm` + עדכון `projection.ts`; מצב מכירה
  נקרא מה-projection, שדות ה-Strapi הופכים קאש.
- `ConsentBadge` ליד מכירה בכל התצוגות; מכירות legacy מסומנות "לא מאומת".

---

## החלטות ונקודות פתוחות

1. **עיתוי הורדת מלאי** — הוחלט (מומלץ): מיידי בעת הדיווח, השבה בדחייה.
   חלופה (להוריד רק באישור) פותחת חלון של מכירה-כפולה.
2. **דחייה** — הרשומה נשמרת (`declined` + נימוק) לאודיט; לא נמחקת.
3. **דיווח בלי בחירת מחזיק** — נשאר חובה כמו היום (`noSelectedE`).
4. **מחזיק שלא מגיב** — אין timeout בשלב זה; המכירה פשוט לא נספרת.
   אפשר בעתיד לחבר ל-restime/`consensus.timeout` הקיימים — מחוץ לסקופ.
5. **גרסת מובייל/צ'אט** — מכוסה אוטומטית כי הכול עובר ב-SaleComponent.

---

## תכנית אימות

### Unit (Vitest)
- `createSale`: self → `holderStatus:'self'`; other-holder → `'awaiting'`
  + reporter נשמר; other-holder שאינו חבר ריקמה → נדחה.
- `confirmSaleHolding`: רק המחזיק הנטען מורשה; decline משיב מלאי
  (וגם: unlimited לא משתנה); קריאה כפולה על סטטוס לא-`awaiting` נדחית.
- `deriveConsentEventFromAction` עם ה-spec החדש: subject/predicate נכונים.
- extractor הלב: ממפה רק `awaiting` שלי.

### Integration
- happy path: create (awaiting) → confirm → effective ב-getProjectFinancials.
- decline path: create → decline → מלאי הושב, לא מופיע ביתרות.
- אירועי `sale.record`/`sale.confirm` נקלטים ב-`/api/consent/events`
  וחתימה מזויפת נדחית.

### Manual (שני דפדפנים)
1. Chrome (משתמש A) מדווח ב-sales-center שהכסף אצל B → טוסט "נשלח לאישור".
2. Firefox (משתמש B) — קלף חדש בעמוד הלב עם ring כחול; IndexedDB מציג
   `sale.record` של A במראה.
3. B מאשר בלב → אצל A המכירה הופכת מאושרת; `sale.confirm` חתום נראה
   ב-`/api/consent/events?subject=sale:<id>`.
4. סבב שני עם דחייה + נימוק → מלאי חוזר, A מקבל התראה.
5. דיווח "כסף אצלי" → מאושר מיידית, badge ירוק, בלי קלף אצל אף אחד.
