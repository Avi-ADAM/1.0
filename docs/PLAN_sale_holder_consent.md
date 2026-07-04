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
מצבו הכספי של משתמש אחר חייבת הסכמה שלו.

### עקרון — עידוד הסכמה, לא וטו

> **אין כפתור "לא" מוחלט.** דחייה חד-צדדית עוצרת שיחה; המערכת מעודדת
> הסכמה ודיון. במקום אישור/דחייה, למחזיק-הנטען יש שלוש דרכים:
> **אישור** · **צ'אט** (בירור; דיון מעמיק — באתר קונסנזוס הנפרד) ·
> **משא-ומתן** — העלאת טענה מקבילה מדויקת יותר, שחוזרת פינג-פונג למדווח
> עד שמגיעים לגרסה ששני הצדדים חתומים עליה.
>
> **שתיקה היא הסכמה, בקצב הריקמה**: כל טענה עומדת פתוחה למשך ה-`restime`
> של הפרויקט (למשל 72 שעות, דרך `timegrama`). לא הגבת בזמן — הגרסה
> האחרונה שעל השולחן מאושרת אוטומטית. טענה נגדית מאפסת את השעון.
>
> **לא ממציאים מודל הצבעה חדש**: קולקציית `Decision` כבר מנהלת סוגי
> החלטות רבים בפרויקט והיא מחווטת לכל מה שצריך — `votes` (עם `order`
> לסבבים), components של נגו, `timegrama`, `forums` (צ'אט), וזרימת עמוד
> הלב. מוסיפים `kind` חדש ורוכבים על הקיים.

> דיווח "הכסף אצלי" = אירוע חתום של המדווח, סופי מיידית.
> דיווח "הכסף אצל X" = `Decision` מסוג `saleClaim` (סבב 1) שמבשיל לאישור
> באחת משלוש דרכים: X מאשר; X מדייק בסבב נגדי והמדווח מאשר (או ההפך,
> בפינג-פונג); או שה-restime עובר בלי תגובה והגרסה העומדת מאושרת אוטומטית.
> עד ההבשלה המכירה לא נספרת באף חישוב כספי ולא ניתנת לצירוף ל-tosplit.

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

### תשתיות קיימות שהתכנית נשענת עליהן

**מודל ההחלטה (Decision) — התשתית המרכזית:**
- קולקציית `decision`: `kind` enum (`pic, pubdes, prides, name, vallueadd,
  vallueles, newFlink, newWlink, timtoM, pendMatana` — מוסיפים `saleClaim`),
  `votes` (oneToMany → vote), `vots` component, `negodes` component,
  `timegrama` (oneToOne), `forums` (manyToMany — צ'אט מובנה!), `matanot`,
  `archived`.
- קולקציית `vote`: `what(bool), why, order(int), users_permissions_user,
  decision(manyToOne)` — **הכול כבר מקושר**; ה-`order` = מספר הסבב.
- `voteOnDecision.ts` + `getDecisionDetails.ts` — actions קיימים עם לוגיקת
  קונסנזוס per-kind.
- `addVote` עם `type:'decision'` כבר ממופה ב-`specs/addVote.ts` לאירוע
  consent בשם `decision.vote`.
- זרימת עמוד הלב קיימת: `decisionMaking.svelte` + קלף `hachlata.svelte`
  + extractors ב-lev pipeline.
- component קיים `ComponentDesisionNegom` (`desision.negom`): `hm, price,
  kindOf, sqadualed, sqadualedf, name, descrip...` — בדיוק השדות של סבב
  נגדי על מכירה (משמש היום את pendm/askm).

**הסכמה חתומה (באמצע יישום — PLAN_user_sovereign_consent):**
- `src/lib/consent/event.ts` — `ConsentEvent` + טבלת `ACTIONS`
  (כולל `proposal.counter` ו-`consensus.timeout` שכבר מוגדרים!).
- `src/lib/consent/policy.ts`, `specs/addVote.ts` (תקדים `ConsentSpec`),
  `src/lib/client/shadowSign.ts` (`shadowSignFromCookie`),
  `publish.ts` + `/api/consent/events`.

**משא-ומתן (UI):**
- `src/lib/components/prPr/negoPend.svelte` — ה-UI לעריכת שדה-שדה של
  הצעה (רכיבי `src/lib/components/conf/`: `text`, `number`, `dateNego`,
  `kindOfnego`, `barb`/TotalBar) שמפיק `newValues`/`originalValues`,
  מנהל `ordern` (סבב) ו-`timegramaId` (איפוס שעון) — התבנית למודל
  הדיוק של saleClaim.

**restime / timegrama:**
- `Project.restime` (enum שעות) + `src/lib/func/calcX.svelte` (המרה ל-ms).
- קולקציית `timegrama`: `date`, `whatami`, `done` + relation ליעד —
  **relation ל-decision כבר קיים**, וה-cron השעתי
  (`/api/timegrama/+server.js`) כבר שולף אותו בשאילתה; חסר רק ענף
  dispatch + handler (`decision.svelte`).
- בצד השרשרת החתומה: PLAN_restime_in_signed_chain (אירוע `consensus.timeout`).

**קלף עמוד-הלב הדו-צדדי:** `didiget.svelte` (haluka) — התבנית הוויזואלית
(progress ring, לב/צ'אט, hover hints, drawer cards).

---

## מודל האירועים החתומים

הרחבת `ACTIONS` ב-`src/lib/consent/event.ts` — **חדש אחד בלבד**:

```ts
saleRecord: 'sale.record'   // המדווח חותם על הטענה המקורית (סבב 1)
// קיימים שמקבלים שימוש חדש:
// 'decision.vote'     — הסכמה לסבב: predicate { what: true, order }
//                       (כבר ממופה ב-addVoteConsentSpec ל-type:'decision')
// 'proposal.counter'  — טענה נגדית: predicate { order, newValues, why? }
// 'consensus.timeout' — הבשלה בשתיקה לפי PLAN_restime_in_signed_chain
```

- `sale.record` — actor = המדווח. `subject = { type: 'sale', id: <saleId> }`
  (חתימה אחרי שהשרת מחזיר id, כמו בהצבעות). predicate: הטענה המלאה
  `{ productId, projectId, holder, total, quantity, saleDate, kindOf,
  startDate?, finishDate?, note?, decisionId?, order: 1 }`.
  - כשהמדווח = המחזיק: self-report ריבוני — האירוע לבדו סוגר את המכירה.
- `decision.vote` — הסכמה לגרסה העומדת: `subject { type:'decision', id }`,
  `predicate { what: true, order }`, `parents` = האירוע שפתח את הסבב.
- `proposal.counter` — actor = הצד שמדייק, `subject` = ה-decision,
  `parents` = האירוע האחרון בסבב הקודם. פותח סבב `order+1`.
- **כלל ההבשלה** (כדוגמת המשתמש): בסבב הגבוה ביותר N קיימות הסכמות של
  **שני** הצדדים (הצעת המציע נחשבת הסכמתו ל-N) → קונסנזוס בגרסת סבב N.
  order הגבוה 2 + הצבעות של שניים ב-2 → אושר בסבב 2; order גבוה 2 עם
  הצבעה אחת ב-1 ואחת ב-2 → עדיין פתוח.

**Policy** (`policy.ts`): כולם `NOT_REQUIRED` לקוורום — הסכמה דו-צדדית
בין שני אנשים ספציפיים, לא הכרעת קבוצה (בשונה מ-decision רגיל של כל
חברי הריקמה — ההבחנה לפי `kind` ב-predicate/subject).

**Reducers** (פאזה 4): `saleRecord.ts` חדש + הרחבת
`proposalCounter.ts`/`consensusTimeout.ts` ו-reducer ל-`decision.vote`
על subject מסוג decision→sale; `ProjectState.sales` עם
`status: 'self' | 'open' | 'confirmed'` והגרסה העומדת של כל סבב.

---

## מודל הנתונים (Strapi — שינוי מינימלי בצד ה-backend)

לא יוצרים מודל חדש — רוכבים על `Decision`. השינויים:

**Decision:**
```
kind      += 'saleClaim'                          // ערך enum חדש
sale      relation oneToOne → sale                // ההחלטה שייכת למכירה
negom     component desision.negom (repeatable)   // סבבי הדיוק — component
                                                  // קיים, רק לחבר ל-Decision
```
(ל-`negom` הקיים יש כבר `hm, price, kindOf, sqadualed, sqadualedf` —
מספיק לטענת מכירה; `in`/total נגזר. אם יוחלט שחסר שדה total מפורש —
תוספת קטנה ל-component.)

**Sale:**
```
reporter        relation manyToOne → users-permissions.user  // מי דיווח
holderStatus    enum: self | open | confirmed                 // null = legacy (קאש לסינון זול)
confirmedBy     enum: vote | timeout                          // איך הבשיל
holderDecidedAt datetime
decision        relation oneToOne ← decision.sale             // הצד השני של הקשר
```

**Vote / Timegrama / Forum:** ללא שינוי — `vote.decision`,
`timegrama.decision` ו-`decision.forums` כבר קיימים ומחווטים.

- `holderStatus = null` (מכירות קיימות) = **legacy**: נספרות בחישובים כמו
  היום (grandfathering — לא שוברים יתרות קיימות), אבל יוצגו "לא מאומת",
  כמו tosplits ישנים בתכנית הריבונות.
- אין מצב `declined` — אין דחייה מוחלטת. מי שטוען "לא קיבלתי כלום" מדייק
  לכמות/סכום 0; אם המדווח לא מגיב תוך restime, גרסת האפס מאושרת והמלאי
  מושב. הכול נשאר בתוך אותה מכניקה אחת.
- אחרי השינויים: codegen ל-`src/generated/graphql.ts`,
  `STRAPI_SCHEMA_REFERENCE.md`, `src/lib/generated/contentTypes.d.ts`.

---

## פאזות יישום

### פאזה 1 — פיצול המסלול ב-createSale + אירוע חתום (shadow)

**שרת — `src/lib/server/actions/configs/createSale.ts`:**
- השוואת `params.userId` (המחזיק הנבחר) מול `context.userId` (המדווח):
  - שווים → `holderStatus: 'self'`, `reporter: context.userId`.
  - שונים → אימות שהמחזיק הנטען חבר בריקמה, ואז:
    1. `holderStatus: 'open'`, `reporter: context.userId`.
    2. יצירת `Decision` `{ kind: 'saleClaim', sale, projects: [projectId],
       decisionName: <שם המוצר+סכום> }`.
    3. `vote` של המדווח על ה-decision: `{ what: true, order: 1 }` —
       הטענה המקורית היא הסכמתו לסבב 1.
    4. `timegrama` `{ whatami: 'decision', decision, date: now +
       calcX(project.restime) }` (שליפת restime כמו ב-`whowhat.svelte`).
    5. notification ממוקד למחזיק בלבד (`specificUsers` על `userId`,
       channels `socket`+`push`, `metadata.url: 'lev'`) — "X מדווח
       שמסר לך ___ ₪ ממכירת ___; אפשר לאשר, לדייק או לברר".
- הרחבת qids `createSaleRecord` בשדות החדשים + מוטציות decision/vote/timegrama.
- החזרת `holderStatus` + `decisionId` ב-result.
- `consentSpec` חדש ב-`src/lib/consent/specs/createSale.ts` (משותף
  שרת/לקוח, לפי תקדים `addVote.ts`): action `'sale.record'`,
  `subjectType: 'sale'`, `subjectIdParam: 'saleId'`.

**לקוח — `SaleComponent.svelte`:**
- אחרי הצלחה: `shadowSignFromCookie(createSaleConsentSpec,
  { ...actionParams, saleId, decisionId })` (לא חוסם).
- אם `holderStatus === 'open'`: טוסט "הדיווח ממתין להסכמת {username} —
  יאושר אוטומטית בתוך {restime} אם לא תגיע תגובה", והעברת הדגל ב-`onDone`.

**מלאי**: הכמות יורדת מיידית כמו היום (שריון מלאי); אם הגרסה שתבשיל שונה
בכמות — התאמת דלתא (פאזות 2–3). Monter נוצר כרגיל אבל צריכתו נגזרת
מהסטטוס (פאזה 3).

**ניקוי**: `salesService.createSale` (מוטציה ישירה ב-
`src/lib/services/salesService.js`) — ללא שימוש חי; לסמן deprecated או
למחוק כדי שלא יהפוך לעקיפת-שער.

**Exit**: דיווח "כסף אצלי" נשמר `self` + `sale.record` חתום במראה;
דיווח "כסף אצל אחר" יוצר Decision `saleClaim` עם vote סבב 1 ו-timegrama
רץ, והמחזיק מקבל התראה.

### פאזה 2 — אישור ומשא-ומתן על ה-Decision + קלף בעמוד הלב

**הרחבת `voteOnDecision.ts` בענף `kind === 'saleClaim'`** (יש תקדים —
הלוגיקה שם כבר מפוצלת per-kind):
```
agree (הצבעה):
  משתתפי הקונסנזוס = reporter + holder בלבד (לא כל חברי הריקמה —
  בשונה משאר ה-kinds). מותר להצביע רק לצד שעוד לא חתום על הסבב
  העומד (max order).
  יצירת vote { what: true, order: <הסבב העומד> } דרך addVote
  type:'decision' הקיים (כבר עם consent mapping!).
  כששני הצדדים חתומים על אותו order:
    archived: true על ה-Decision, timegrama.done: true,
    החלת גרסת ה-negom של הסבב על ה-Sale (in/unit/date/start/finish),
    holderStatus: 'confirmed', confirmedBy: 'vote',
    התאמת דלתא מלאי אם הכמות השתנתה, notification לשני הצדדים.

counter (סבב נגדי) — action חדש קטן `counterSaleClaim`
  (`src/lib/server/actions/configs/counterSaleClaim.ts`, לפי תבנית
  submitNegoMash):
  params: { decisionId, projectId, order, newValues, why? }
  מוסיף entry ל-negom component עם ערכי הדיוק,
  vote { what: true, order: N+1 } של המדייק (הצעתו = הסכמתו לסבב החדש),
  timegrama ישן done + חדש ב-now + calcX(restime)  ← איפוס שעון,
  notification לצד השני "התקבל דיוק, תורך".
  consentSpec: 'proposal.counter', subjectType 'decision',
  predicate { order, newValues, why }.
```
רישום ב-`configs/index.ts` + `ActionKey` ב-`actionClient.ts`.

**עמוד הלב** — הרחבת זרימת ההחלטות הקיימת (`decisionMaking.svelte` /
extractors), לא בניית צינור חדש:
- qids: הרחבת סליית ההחלטות כך שתכלול `kind:'saleClaim'` שבהן אני צד
  (holder או reporter) **ואני עוד לא חתום על הסבב העומד**; שליפת
  ה-negom, votes+order וה-Sale המקושר.
- `levDataExtractors.ts` — הרחבת extractor ההחלטות (או
  `extractOpenSaleClaims` ייעודי) + store ב-`levStores.ts` (הסבב העומד,
  גרסה מקורית מול מדויקת, מי הציע, זמן שנותר).
- קלף `src/lib/components/lev/saleClaim.svelte` לפי תבנית
  `didiget.svelte`, שלושת הכפתורים:
  - **לב** = מסכים לגרסה העומדת (`addVote type:'decision'` +
    `voteOnDecision` + חתימת-צל — הצינור הקיים).
  - **צ'אט** = בירור מול הצד השני דרך `decision.forums` הקיים (Diun);
    דיון מעמיק — קישור לאתר קונסנזוס.
  - **משא-ומתן** (אייקון כף-מאזניים, במקום כפתור ה"דחייה") = מודל בסגנון
    `negoPend.svelte` עם רכיבי `conf` (NumberField לכמות/מחיר/סכום,
    DateNego לתאריכים, TotalBar) prefilled בגרסה העומדת; שליחה =
    `counterSaleClaim`. הגרסה הקודמת מוצגת כ-reference ליד כל שדה
    (כמו `candidateRound` ב-negoPend).
  - progress ring של 2 משתתפים + מונה זמן שנותר עד אישור אוטומטי.
- `levSocketHandler.ts` — ההתראות מרעננות את הסלייס בזמן אמת.
- כרטיס מקביל במצב cards (כמו `didigetCard.svelte`).

**Exit**: פינג-פונג מלא בשני דפדפנים — A מדווח שהכסף אצל B; B מדייק
כמות; A רואה קלף "תורך", מאשר; המכירה `confirmed` בגרסת B, המלאי הותאם.

### פאזה 3 — timegrama: שתיקה כהסכמה + צרכנים מכבדים סטטוס

**Handler חדש `src/routes/api/timegrama/decision.svelte`** + ענף
`whatami === 'decision'` ב-dispatch של `/api/timegrama/+server.js`
(השאילתה שם כבר שולפת `decision{data{id}}` — חסר רק הענף; מועיל לכל
סוגי ההחלטות בעתיד):
- לפי `kind` של ה-Decision; עבור `saleClaim`: אם כבר `archived` — רק
  `done: true`. אחרת: הגרסה העומדת (negom של הסבב הגבוה, או המקור אם אין)
  מאושרת אוטומטית — החלת ערכים על ה-Sale, `holderStatus: 'confirmed'`,
  `confirmedBy: 'timeout'`, התאמת מלאי, archived על ה-Decision,
  `done: true`, notification לשני הצדדים ("אושר אוטומטית בתום {restime}").
- בצד השרשרת: רישום `consensus.timeout` לפי PLAN_restime_in_signed_chain
  (בשלב ה-shadow — mirror בלבד; אכיפה בפאזה 4 לפי ההכרעות שם).

**צרכנים** — מכירה נספרת רק כשהיא **effective**:
`holderStatus IN ('self','confirmed') OR holderStatus IS NULL` (legacy):
- `getProjectFinancials` (qids) — הוספת `holderStatus` וסינון/סימון.
- `whowhat.svelte` — לא לצרף ל-tosplit מכירות `open` (גם בבנייה ידנית
  וגם באיסוף האוטומטי); בדיקת הגנה מקבילה בצד שרת.
- `hamatanot.svelte` + `moach/[projectId]/sales/[saleId]` — chip סטטוס
  (בהסכמה מול {שם}, סבב {N} / אושר / אושר בשתיקה / legacy-לא מאומת).
- `sales-center` — אינדיקציה למדווח על טענות פתוחות ותורות שממתינים לו.
- מנויים (Monter): הכנסה מחזורית של מכירה שאינה effective לא נצברת.

**Exit**: מכירת `open` לא מופיעה באף יתרה/חלוקה; אי-תגובה תוך restime
מאשרת אוטומטית את הגרסה העומדת, כולל גרסת-אפס שמשיבה מלאי.

### פאזה 4 — אכיפה קריפטוגרפית (מתיישר עם Phase 3+ של תכנית הריבונות)

- `createSale` עם מחזיק-אחר **דוחה** בקשה בלי `sale.record` חתום תקף;
  `voteOnDecision`/`counterSaleClaim` על saleClaim דוחים בלי
  `decision.vote`/`proposal.counter` חתום. (אימות צד-שרת דרך
  `src/lib/crypto/verify.ts`, שכבר רץ ב-`/api/consent/events`.)
- Reducers (סעיף מודל האירועים) + עדכון `projection.ts`; מצב מכירה נקרא
  מה-projection, שדות ה-Strapi הופכים קאש.
- `consensus.timeout` על saleClaim מאומת לפי כללי
  PLAN_restime_in_signed_chain (חלון, tolerance, היעדר counter).
- `ConsentBadge` ליד מכירה בכל התצוגות; מכירות legacy מסומנות "לא מאומת".

---

## החלטות ונקודות פתוחות

1. **אין דחייה מוחלטת** — הוחלט (עקרון-על, נרשם ב-CLAUDE.md):
   רק אישור / צ'אט / דיוק נגדי. "לא קיבלתי" = דיוק לכמות 0.
2. **רכיבה על Decision** — הוחלט (עקרון-על, נרשם ב-CLAUDE.md): לא
   יוצרים מודל הצבעה חדש; `kind: 'saleClaim'` + relation ל-Sale.
   הקונסנזוס ל-kind הזה הוא דו-צדדי (reporter+holder) ולא כלל-ריקמתי.
3. **שתיקה כהסכמה** — הוחלט: restime של הריקמה דרך timegrama, איפוס שעון
   בכל סבב דיוק. עקרון-על שחל על כל flow הסכמה חדש (נרשם ב-CLAUDE.md).
4. **עיתוי הורדת מלאי** — מיידי בעת הדיווח (שריון), התאמת דלתא כשהגרסה
   הסופית שונה. חלופה (להוריד רק בהבשלה) פותחת חלון מכירה-כפולה.
5. **מי רשאי לדייק** — שני הצדדים בלבד (holder/reporter), בתורות: מגיב
   רק מי שלא חתום על הסבב העומד. שאר חברי הריקמה רואים סטטוס בלבד.
6. **גרסת מובייל/צ'אט** — מכוסה אוטומטית כי הכול עובר ב-SaleComponent.

---

## תכנית אימות

### Unit (Vitest)
- `createSale`: self → `'self'`; other-holder → `'open'` + Decision
  saleClaim + vote order 1 + timegrama; other-holder שאינו חבר ריקמה → נדחה.
- `voteOnDecision` (ענף saleClaim): agree של המחזיק בסבב 1 → `confirmed`
  + archived; הצבעה של צד שכבר חתום על הסבב העומד → נדחית; הצבעה של חבר
  ריקמה שאינו צד → נדחית (בשונה משאר ה-kinds!).
- `counterSaleClaim`: negom + vote order 2 + timegrama חדש וישן done;
  agree של המדווח על סבב 2 → Sale מעודכן בגרסת ה-negom + דלתא מלאי;
  דיוק לכמות 0 שמבשיל → מלאי מושב במלואו.
- handler `timegrama/decision` (saleClaim): מבשיל את הגרסה העומדת
  (`confirmedBy:'timeout'`), לא נוגע ב-Decision שכבר archived.
- `deriveConsentEventFromAction`: agree → `decision.vote` (המיפוי הקיים),
  counter → `proposal.counter`, predicate נכון.
- extractor הלב: ממפה רק saleClaims פתוחים שבהם תורי להגיב.

### Integration
- happy path: create (open) → agree → effective ב-getProjectFinancials.
- nego path: create → counter (הכמות יורדת מ-7 ל-5) → agree → ה-Sale
  מעודכן, דלתא מלאי הוחזרה, Decision archived, timegrama done.
- timeout path: create → (דמיית פקיעת timegrama) → confirmed by timeout.
- אירועי `sale.record`/`decision.vote`/`proposal.counter` נקלטים ב-
  `/api/consent/events` וחתימה מזויפת נדחית.

### Manual (שני דפדפנים)
1. Chrome (A) מדווח ב-sales-center: 7 יחידות × 500 ₪, הכסף אצל B →
   טוסט "ממתין להסכמת B".
2. Firefox (B) — קלף בעמוד הלב עם ring כחול ושעון restime; לוחץ
   משא-ומתן, מדייק ל-5 יחידות (מודל negoPend עם reference לגרסת A), שולח.
3. Chrome (A) — הקלף חוזר אליו "B מדייק: 5×500"; מאשר בלב → המכירה
   confirmed בגרסת B, מלאי הותאם (+2), badge ירוק,
   `sale.record`+`proposal.counter`+`decision.vote` נראים ב-
   `/api/consent/events?subject=decision:<id>`.
4. סבב עם שתיקה: A מדווח, B לא מגיב; אחרי פקיעת ה-timegrama המכירה
   מאושרת אוטומטית ("אושר בשתיקה") ונספרת ביתרות.
5. דיווח "כסף אצלי" → מאושר מיידית, בלי קלף אצל אף אחד.
