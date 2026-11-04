# PLAN_RESOURCE_ASSIGNMENT — מי מביא את המשאב

**מצב:** בנוי, ממתין ל-deploy ולבדיקת עשן עם שני משתמשים (2026-11-04).

## הבעיה

ביצירת משאב אפשר היה לשייך אותו לעצמך רק ברקמת יחיד, או (מאז ה-backfill) במשאב
חוזר. במשימה יש שלוש דרכים — לעצמי, לחבר/ה אחר/ת, או הזמנה מבחוץ — ובמשאב לא.

## מה נבנה

| מי מביא | רקמת יחיד | רקמה שמצביעה |
|---|---|---|
| **אני** | כמו קודם: OpenMashaabim + Sp + Maap/Rikmash, או מנוע חוזר מיד | **פתוח עכשיו לכל משאב** (לא רק חוזר): Pmash `isSelfProposal` + Askm `pendingMainVote` — הצבעה כפולה, גם על המשאב וגם עליי כמביא/ה. בוחרים Sp קיים או יוצרים חדש כבר בטופס. |
| **חבר/ה אחר/ת** | — | **חדש:** `createResource({ assignedUserId })` → OpenMashaabim `archived:true` + Askm על שם החבר/ה **בלי Sp** + timegrama. כרטיס אחד, כמו משימה משויכת (createMission branch 2): החברים מצביעים על המשאב, והחבר/ה עונה על עצמו/ה. |
| **מבחוץ** | ההזמנה הקיימת (PLAN_INVITE_PARTNER_TO_MISSION): המשאב נשאר פתוח, הקישור נשלח מיד | אותה הזמנה, נשלחת כשה-pmash מבשיל. המוזמן/ת מגיע/ה ל-`/availiableResorce/[id]` ושם בוחר/ת משאב משלו/ה או יוצר/ת חדש (`ensureSpId`) — בלי משאב אין הצעה. |

## הכלל: Askm בלי Sp = הוצע ולא נענה

`src/lib/server/nego/askmAssigned.ts`. כל Askm אחר נוצר על ידי המועמד עם ה-Sp שלו
(createMashaabimRequest, proposeOnOpenMashaabim, nominateSelfResource, ההצעה העצמית),
ולכן "אין Sp" מסמן בדיוק את ההצעות לחבר — בלי שדה חדש ב-Strapi ובלי מיגרציה.

- `takerApplied: false` ל-`computeNegoGate` / `evaluateCandidacyVote` — ה-yes של היוצר/ת
  אינו של החבר/ה; **שתיקה שלו/ה אינה הסכמה** (`finalizeAskmAcceptance`, `api/timegrama/askm`).
- בלי Sp אין מה לרשום: `canMaterialize` דורש Sp, וה-timegrama סוגר בלי לרשום.
- ה-yes הרגיל של החבר/ה נדחה עם הפניה ל-`provideAssignedResource`.

## אישרור בלב

`provideAssignedResource` (רק מי שהמשאב הוצע לו/ה, רק Sp שלו/ה): בוחר Sp קיים
(`spId`) או יוצר חדש מתנאי הבקשה (`create: { myp }`), שם אותו על ה-Askm, וקורא
ל-`finalizeAskmAcceptance` — אותו שער של כל yes. נרשם כשכל החברים אמרו כן, או
בשתיקת restime אחרי שהחבר/ה כבר ענה/תה.

ממשק: `reqtom` / `rektom` מקבלים `assignedOffer` + `awaitingMyResource`; לחבר/ה
כפתור "בחירת משאב ואישור" פותח את `ProvideAssignedResource.svelte` (המשאבים שלו/ה
לפי תבנית ה-mashaabim — `open_mashaabim.mashaabim` נוסף ל-qids 83/87/getAskmForVote —
או יצירה חדשה). אין לו/ה כפתור "דחייה" — יש שיחה; לשאר החברים הכרטיס אומר למי ממתינים.

### התשובות האחרות של החבר/ה ("אפשרויות נוספות" בכרטיס, `AssignedOfferOptions.svelte`)

- **לדייק תנאים** — `candidateCounterOnAskm`, סבב של המועמד/ת. הבחירה במשאב נשארת
  האישור שלו/ה גם אחרי הסבב (`processAskedResources` משאיר את הכרטיס פתוח לו/ה).
  נוסף ל-action בדיקה שרק המועמד/ת עצמו/ה יכול/ה להוסיף סבב — קודם כל משתמש מחובר יכול היה.
- **להעביר לחבר/ה אחר/ת** — `releaseAssignedResource({ mode: 'reassign', toUserId })`:
  ה-Askm נסגר ונפתח חדש על שם החבר/ה, בלי Sp. ההצבעה מתחילה מחדש (הוצבע על *מי*
  מביא), וה-yes היחיד שעובר הוא של המעביר/ה כחבר/ה. סבבי תנאים קודמים לא עוברים.
- **לוותר על המועמדות** — `mode: 'withdraw'`: ה-Askm נסגר וה-OpenMashaabim נפתח לכולם
  (`archived:false` + התאמות). זה לא וטו — רק הסרה של התחייבות מעצמך.

שני המצבים אפשריים רק כל עוד לא נבחר משאב; אחרי הבחירה, נסיגה היא `proposeObjectArchive`.

## עבודה פתוחה

- `ResourceCreator` מקבל `members` רק מ-`moach/[projectId]/create`; קונסיירז' לא מציג את האפשרות.
- בדיקת עשן: חבר 1 יוצר משאב לחבר 2 → חבר 2 בוחר/יוצר בלב → חבר 3 מאשר → Maap על שם 2.
