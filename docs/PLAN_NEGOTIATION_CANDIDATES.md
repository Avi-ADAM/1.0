# תכנית: משא ומתן בין מועמדים לחברי פרויקט (openMission / openMashaabim)

מסמך מעקב למימוש מו"מ על תנאי שותפות בהצעות הפתוחות של הריקמה, במקביל למו"מ
הפנימי הקיים (pendm / pmash).

עודכן לאחרונה: 2026-06-23 · ענף: `main`

---

## 1. רקע ומודל

במו"מ הפנימי (`pendm`/`pmash`) בעלי-הזכות מנהלים מו"מ זה עם זה, וההצעה החדשה
**דורסת** את הישות (מותר — זה פנימי). כאן המצב שונה:

- המו"מ הוא בין **מועמד** (חיצוני או חבר-ריקמה) ל**פרויקט קיים** (ריקמה).
- ל־openMission/openMashaabim אחד יכולים להיות **כמה מועמדים במקביל**, כל אחד
  עם הצעה משלו → **אסור לדרוס** את ההצעה הפתוחה.
- לכל מועמד יש `Ask`/`Askm` משלו. ההצעה המתוקנת של המועמד נשמרת כ**סבב**
  (`Negopendmission` למשימה, `NegoMash` למשאב) **המקושר ל־Ask/Askm**. ה־
  openMission/openMashaabim נשאר נקי כעוגן בסיס.
- המו"מ **דו-צדדי לסירוגין**: מועמד מציע → בעלי-הזכות מצביעים או מציעים הצעת
  ביניים → המועמד מכריע, וחוזר חלילה.
- מצב המו"מ (סבב נוכחי, של מי התור, סטטוס) **נגזר מהסבבים** — אין שדות מצב
  סקלריים על Ask/Askm.

### מסלול isRishon (הצעה-עצמית, נפרד מ-4 המסלולים)
כשחבר ריקמה **יוצר הצעה ישירה** (`isSelfProposal`/`isRishon`) — זה זהה למו"מ
הפנימי הקיים (`submitNegoMash`/`submitNegoMission` על pmash/pendm). נשמר כמסלול
נפרד ואינו חלק ממכונת-המצבים שלהלן.

---

## A. מכונת המצבים המאוחדת — 4 מסלולים × 2 צדדים

| צד | ישות-מועמד | סבב | מימוש | timegrama.whatami |
|----|-----------|-----|-------|-------------------|
| משימה | `Ask` | `Negopendmission` | `Mesimabetahalich` | `"ask"` |
| משאב | `Askm` | `NegoMash` | `Maap` | `"askm"` |

### A.1 העיקרון המלכד (timegrama + שער דו-צדדי)

1. **יצירת timegrama** — נוצר **ברגע שקיימת הצבעת-בעד ראשונה של חבר-ריקמה**
   על ה-Ask/Askm. למבקש שהוא **חבר** — קורה מיד (כי הצבעתו נכנסת בעת הבקשה).
   למבקש **חיצוני** — נדחה עד שחבר ריקמה מצביע בעד / מגיב.
2. **שער האישור האוטומטי (בפקיעת הזמן)** — אישור רק כשהסבב האחרון **מוסכם
   על שני הצדדים**. מוערך מתוך הסבבים + ה-vots:

   ```
   latest  = הסבב עם ה-ordern הגבוה ביותר (אם קיים)
   L       = latest?.ordern  (בלי סבב — בסיס: אין שער-סבב)
   takerId = ask.users_permissions_user        // מי שעתיד להתקבל
   votesAtL = vots עם (order ?? 0) >= L
   hasPMyes = יש חבר-ריקמה שהצביע what:true ב-votesAtL
   hasNo    = יש what:false ב-votesAtL
   takerYes = latest.proposedBy === 'candidate'      // המועמד-יוצר הסבב → הסכמה מובלעת
              || !latest                              // בסיס (Path A/C) → הבקשה = הסכמה
              || taker הצביע what:true ב-votesAtL     // המועמד אישר סבב project
   approvable = hasPMyes && takerYes && !hasNo
   ```

   - **Path A/C** (אין סבב): נדרשת הצבעת-בעד אחת של חבר + העדר `false`.
   - **Path B1** (חבר אומר כן להצעת המועמד): הסבב האחרון `candidate` →
     `takerYes` מובלע; הצבעת החבר נותנת `hasPMyes` → מאושר.
   - **Path B2** (חבר מגיב בהצעה נגדית): הסבב האחרון `project` → `takerYes`
     **שקר** עד שהמועמד מצביע בעד ב-`order ≥ L`. **חוסם** אישור אוטומטי.
   - **מועמד מעלה סבב נגדי** (`candidate`, `ordern+1`): `hasPMyes` ב-`order ≥ L`
     נעלם → **חוסם** עד שחבר מצביע/מגיב מחדש. כלומר ההצעה הנגדית **מבטלת
     בפועל** את האישור-האוטומטי הקודם.
   - **Path D** (חבר מתאים אישית): הסבב `project`, אבל ה-taker הוא אותו חבר
     שיצר אותו והצביע בעד → `takerYes` אמת → מאושר בתנאים שקבע.

### A.2 פירוט 4 המסלולים

| מסלול | מי | פעולה | מה נוצר | timegrama | אישור בפקיעה |
|------|----|------|---------|-----------|--------------|
| **A** | מועמד חיצוני, "לב" בתנאים רגילים | `applyToMission` / `createMashaabimRequest` | Ask/Askm + הצבעת המבקש, **ללא** סבב | נוצר בהצבעת-בעד ראשונה של חבר | כן, אם אין `false` |
| **B** | מועמד חיצוני, הצעה מותאמת | `proposeOnOpenMission` / `proposeOnOpenMashaabim` | Ask/Askm + סבב-0 `candidate` | נוצר בהצבעת/תגובת חבר | — |
| **B1** | חבר אומר "כן" להצעת המועמד | `finalize…Acceptance` variant=`partial` | הצבעת חבר | נוצר בהצבעה הראשונה | כן (כמו A) |
| **B2** | חבר מגיב בהצעה נגדית | `counterOnAsk` / `counterOnAskm` | סבב `project` (`ordern+1`) + הצבעת החבר | נוצר/מתאפס מרגע ההצעה הנגדית | **לא** עד שהמועמד מאשר |
| **— ** | מועמד מאשר הצעה נגדית | `acceptCounterOnAsk` / `acceptCounterOnAskm` (**חדש**) | הצבעת-בעד של ה-taker ב-`order ≥ L` | קיים | כן |
| **— ** | מועמד מעלה סבב נגדי | `proposeOnOpenMission/Mashaabim` (סבב נוסף) | סבב `candidate` (`ordern+1`) | **מתבטל/מתאפס** | — (חוזר להמתנה לחבר) |
| **C** | חבר-ריקמה, בתנאים רגילים | `applyToMission` / `createMashaabimRequest` (requester=member) | Ask/Askm + הצבעת החבר | נוצר מיד | כן, אם אין `false` |
| **D** | חבר-ריקמה, התאמה אישית | `customizeOpenMission` / `customizeOpenMashaabim` (**חדש**) | Ask/Askm + סבב `project` + הצבעת החבר | נוצר מיד | כן, בתנאים שקבע |

> **החלטה (מסלול D):** התנאים המותאמים של החבר נשמרים כ**סבב `project` על ה-Ask/Askm
> של החבר עצמו** — לא דורסים את ה-OpenMission/OpenMashaabim המשותף (בטוח למועמדים
> מקבילים, עקבי עם B). "עריכת ההצעה" היא חוויית-UI בלבד.

---

## 2. סטטוס סכמת Strapi — ✅ הושלם

נוסף ואומת מול `src/generated/STRAPI_SCHEMA_REFERENCE.md`:

| טבלה | שדות שנוספו |
|------|-------------|
| `nego-mash` | `open_mashaabim` (m2o), `askm` (m2o), `ordern` (Int), `proposedBy` (enum candidate/project), `status` (enum proposed/accepted/countered/rejected/withdrawn) |
| `negopendmission` | `ask` (m2o), `ordern` (Int), `proposedBy` (enum), `status` (enum) |
| `askm` | `nego_mashes` (o2m → nego-mash) |
| `ask` | `negopendmissions` (o2m → negopendmission) |

> הערה: **לא** נוספו `currentRound`/`turn`/`negotiationStatus` על Ask/Askm —
> ובכוונה. המצב נגזר מהסבבים (סעיף A.1).

---

## 3. מה כבר קיים בקוד

### 3.1 צד המשאבים (openMashaabim)
- `qids.js` (`negoQids`): `negoCreateNegoMashRound`, `getAskmNegoRounds`
  (כולל `vots{what order users…}` + סבבים `ordern:desc`), `applyRoundToOpenMashaabim`.
- `proposeOnOpenMashaabim.ts` — מועמד יוצר Askm + סבב-0 `candidate`.
- `counterOnAskm.ts` — חבר מוסיף סבב `project` + הצבעתו.
- `createMashaabimRequest.ts` — מסלול A/C; solo מאשר אוטומטית.
- `runResourceAskmAcceptance.ts` — מחיל את הסבב האחרון על ה-OpenMashaabim לפני
  `createMaap`+ארכוב.
- `finalizeAskmAcceptance.ts` — variant `partial` יוצר timegrama ב-`isFirstVote`.

### 3.2 צד המשימות (openMission)
- `qids.js`: `negoCreateNegopendmissionRound`, `getAskNegoRounds`,
  `applyRoundToOpenMission`, `82createTimegramaForAsk` (`whatami:"ask"`).
- `proposeOnOpenMission.ts` — מועמד יוצר Ask + סבב-0 `candidate`.
- `submitNegoMission.ts` — מסלול OpenMission (`isAsk !== 0`) יוצר סבב `candidate`
  (לא דורס) + מעדכן vots.
- `applyToMission.ts` — מסלול A/C; solo מאשר ישירות.
- `finalizeAskAcceptance.ts` — מחיל את הסבב האחרון לפני `createMesimabetahalich`.

### 3.3 פקיעת הזמן (cron)
- `src/routes/api/timegrama/+server.js` — `x()` מנתב לפי `whatami`:
  `ask`→`ask.svelte`, `pendm`→`pend.svelte`, `pmash`→`pendM.svelte`,
  `finiapruval`→`finiapp.svelte`.
- `ask.svelte` — מאשר כש-`vots.length>0` ואין `false`, ואז יוצר
  `Mesimabetahalich` + מארכב OpenMission/Ask/asks אחרים.

---

## 4. הפערים שיש לסגור (⏳)

### 4.1 חסר finalizer ל-`askm` (קריטי — צד המשאב מת בפקיעה)
`+server.js` `x()` **אינו מטפל ב-`whatami:"askm"`**. timegrama של משאב נשלף אך
לא קורה כלום → אין אישור אוטומטי בצד המשאב.
- **לבנות** `src/routes/api/timegrama/askm.svelte` (מקביל ל-`ask.svelte`) שמריץ
  את לוגיקת השער (A.1) וקורא ל-`runResourceAskmAcceptance` (דרך endpoint/פעולה).
- **להוסיף** ענף `askm` ב-`x()` של `+server.js`.

### 4.2 שער דו-צדדי + חישוב מתוך הסבבים
`ask.svelte` (וה-`askm.svelte` החדש) מאשרים כיום על-בסיס vots בלבד. להחליף
בלוגיקת `approvable` מסעיף A.1:
- לשלוף סבבים (`getAskNegoRounds` / `getAskmNegoRounds`) + `vots` + `taker`.
- לחשב `latest`, `L`, `hasPMyes`, `hasNo`, `takerYes`.
- אם `!approvable` → **לא** לאשר; לסמן timegrama `done:true` בלי מימוש (וייווצר
  מחדש בהצבעה/הצעה הבאה). אם `approvable` → להמשיך למימוש (כולל החלת הסבב האחרון
  שכבר קיימת ב-`finalize…`/`runResourceAskmAcceptance`).

### 4.3 דחיית יצירת ה-timegrama למועמד חיצוני
לפי A.1 ה-timegrama נוצר בהצבעת-בעד ראשונה של חבר, לא בעת הבקשה. לעדכן:
- `applyToMission.ts` — ליצור timegrama **רק** אם `memberIds.includes(requester)`
  (Path C). למועמד חיצוני (Path A) — לא ליצור.
- `proposeOnOpenMission.ts` / `proposeOnOpenMashaabim.ts` — להסיר את יצירת
  ה-timegrama בעת ההצעה (Path B).
- `createMashaabimRequest.ts` — ליצור timegrama רק כש-`isProjectMember`
  (כיום נוצר תמיד ב-Step 4).
- **יצירה בהצבעה הראשונה** כבר קיימת ב-`finalizeAskmAcceptance` (`partial`+
  `isFirstVote`). לוודא מקבילה בצד המשימה: ה-action שמוסיף הצבעת חבר ל-Ask
  (`addVote`/equivalent) חייב ליצור timegrama `whatami:"ask"` ב-`isFirstVote`.
  *(לבדוק איזה action מצביע על Ask בצד המשימה ולהוסיף שם את ה-`isFirstVote`.)*

### 4.4 counter יוצר/מאפס timegrama
`counterOnAsk` / `counterOnAskm` (Path B2): בעת הוספת סבב `project` — אם אין
timegrama פעיל, ליצור; אם יש, להאריך/לאפס את ה-date לפי restime (חלון חדש
למועמד להגיב). השער (4.2) כבר ימנע אישור עד הסכמת המועמד.

### 4.5 פעולת "מועמד מאשר הצעה נגדית" (חדש)
`acceptCounterOnAsk` / `acceptCounterOnAskm`:
- מוסיף הצבעת-בעד של ה-taker ב-`order = L` (הסבב האחרון של project) → `takerYes`
  אמת → השער נפתח, ה-timegrama הקיים יממש בפקיעה.
- אופציה: לסמן `status:'accepted'` בסבב.

### 4.6 פעולת מסלול D (חדש)
`customizeOpenMission` / `customizeOpenMashaabim`:
- כמו `applyToMission`/`createMashaabimRequest` אך יוצר גם **סבב `project`**
  עם התנאים המותאמים של החבר + הצבעת החבר ב-`order` של הסבב, ויוצר timegrama מיד.
- ה-taker = החבר → השער נפתח עצמונית; אישור אוטומטי בתנאיו אם אין התנגדות.

### 4.7 מועמד מעלה סבב נגדי (משתמש בקיים)
המועמד משתמש שוב ב-`proposeOnOpenMission/Mashaabim` (או וריאנט) ליצירת סבב
`candidate` נוסף. **חדש:** לאתר את ה-timegrama הקיים ולאפס/לבטל אותו (השער ימילא
את החסם ממילא, אך איפוס מונע מימוש מוקדם).

---

## 5. משימות UI (⏳)

0. **שעון עצר ל-timegrama — ✅ בוצע.** רכיב `cards/timetToTimegrama.svelte`
   (שופר ל-tick של שנייה + `onDestroy` + `onHover` אופציונלי) מוצג בכרטיסי
   המועמדות `reqtom`/`reqtojoin` וב-`weget`, כש-`timegramaDate` קיים ו-`!timegramaDone`.
   ה-`done` נטען על ה-asks/askms ב-`83levMainUserQuery` וממופה ב-extractors
   (`timegramaDone`). כרטיסי pendm/finiapruval/maap/decision כבר הציגו שעון.

1. **טעינת תנאי המועמד לכרטיס בעל-הזכות** — שאילתות ה-askm/ask בעמוד הלב טוענות
   רק את בסיס ה-open_mashaabim/open_mission. להוסיף `nego_mashes`/`negopendmissions`
   (ordern:desc) כדי ש-`reqtom`/`reqtojoin` יציגו את ההצעה האחרונה.
2. **חישוב סבב/תור בצד הלקוח** — helper משותף שגוזר `currentRound=max(ordern)`,
   `turn` מ-`proposedBy` של הסבב האחרון, ו-`approvable` (אותה נוסחה כמו השרת,
   A.1) — לשימוש חוזר בכרטיסים ובפקיעה.
3. **כפתורי מסלול D** — בכרטיסי בעל-הזכות (`reqtom`/`reqtojoin`/`reqtosherut`):
   "הצעה מקבילה" → `counterOnAsk(m)` (B2) מול חבר; "התאמה אישית" → `customizeOpen…`
   (D) כשהחבר עצמו לוקח.
4. **כפתורי מועמד** — בכרטיס המועמד: כשהסבב האחרון `project`, להציג "אשר הצעה
   נגדית" (`acceptCounterOn…`) ו"הצע משהו אחר" (`proposeOnOpen…` סבב נוסף).
5. **תיקון pendId ל-isRishon ב-reqtom** — במסלול הפנימי מועבר `pendId={id}` (Askm)
   במקום `pmashId`. ב-isRishon להעביר `pmashId`.
6. **כפתורי "הצעה מקבילה" בדפים הקבועים** —
   `(regandnon)/availiableResorce/[id]`, `(regandnon)/availableMission/[id]`,
   ודף ה-openmashaabim הקבוע.

---

## 6. רשימת תיוג

### בוצע
- [x] סכמת Strapi (rounds + relations)
- [x] משאבים: proposeOnOpenMashaabim + counterOnAskm + מימוש + UI בסיסי
- [x] משימות: submitNegoMission לא דורס → סבב מקושר ל-Ask
- [x] משימות: proposeOnOpenMission + counterOnAsk + שאילתות
- [x] מימוש מחיל את הסבב האחרון (runResourceAskmAcceptance / finalizeAskAcceptance)

### לביצוע — מנגנון הליבה (4 המסלולים)
- [x] **4.1** `askm.svelte` + ענף `askm` ב-`+server.js` (finalizer שהיה חסר). משתמש
       ב-`StrapiClient` + `runResourceAskmAcceptance`. + qids `getAskmForFinalize`,
       `archiveAskmSimple`.
- [x] **4.2** שער דו-צדדי משותף `src/lib/server/nego/negoGate.ts` (`computeNegoGate`),
       מחובר ב-`ask.svelte` (נכתב מחדש, כולל החלת הסבב האחרון) וב-`askm.svelte`.
- [x] **4.3** דחיית יצירת timegrama למועמד חיצוני (`applyToMission`,
       `proposeOnOpenMission`, `proposeOnOpenMashaabim`, `createMashaabimRequest`)
       + יצירה בהצבעת-חבר ראשונה: `addVote` (ask) דרך `ensureCandidacyTimegrama`;
       משאב כבר ב-`finalizeAskmAcceptance` (partial+isFirstVote).
- [x] **4.4** `counterOnAsk`/`counterOnAskm` יוצרים/מאפסים timegrama
       (`ensureCandidacyTimegrama` reset). עזר: `src/lib/server/nego/timegrama.ts`
       + qids `getActiveTimegramaForAsk(m)`, `getAskProjectRestime`/`getAskmProjectRestime`.
- [x] **4.5** `acceptCounterOnAsk` / `acceptCounterOnAskm` — מועמד מאשר הצעה נגדית
       (הצבעת taker ב-`order=L` + הפעלת/איפוס timegrama).
- [x] **4.6** `customizeOpenMission` / `customizeOpenMashaabim` (מסלול D) — חבר לוקח
       בתנאים מותאמים כסבב `project` על ה-Ask/Askm שלו; solo משאב מתממש מיד,
       solo משימה מתאשרר בפקיעה.
- [x] **4.7** `candidateCounterOnAsk` / `candidateCounterOnAskm` — מועמד מעלה סבב
       נגדי על Ask/Askm קיים (`ordern+1`, proposedBy=candidate) + ביטול ה-timegrama
       (`cancelCandidacyTimegrama`); הצבעת חבר עוקבת תיצור חדש.
- [x] רישום ב-`configs/index.ts` + טייפים ב-`client/actionClient.ts` ל-6 הפעולות.

- [x] **ניתוב צד-שרת לפי חברות** (עיקרון: כל אימות בפעולה עצמה) — 
       `proposeOnOpenMission`/`proposeOnOpenMashaabim` בודקים חברות בשרת וקובעים את
       המסלול: חבר → סבב `project` + timegrama מיד (+ solo משאב מתממש מיד); לא-חבר →
       סבב `candidate` + timegrama נדחה. `customizeOpen*` חולקים את אותו handler
       (`openMissionProposalHandler`/`openMashaabimProposalHandler`) — מפתח הפעולה
       סמנטי בלבד. הלקוחות (mashsuggest/projectSuggestor) קוראים תמיד ל-`proposeOn*`.

> כל מנגנון השרת ל-4 המסלולים הושלם ועובר typecheck. נותר רק UI (סעיף 5).

### לביצוע — UI
- [x] **שעון עצר** ל-timegrama פעיל (`timetToTimegrama` ב-reqtom/reqtojoin/weget) — ר' §5.0.
- [x] **טעינת הסבבים** לכרטיסי בעל-הזכות — `nego_mashes`/`negopendmissions`
       (+`done` על ה-timegrama) נוספו ל-`83levMainUserQuery` (project-scoped asks/askms),
       וממופים ב-extractors ל-`negopendmissions`/`orderon`/`timegramaDone`.
- [x] **מסלול D — ניתוב לפי חברות** ב-`mashsuggest`/`projectSuggestor`: חבר-ריקמה →
       `customizeOpen…` (התאמה אישית); לא-חבר → `proposeOnOpen…` (הצעה מקבילה).
       זיהוי חברות: `getProjectData(projectId,'uids')` + `$userId`.
- [x] **תגובת מועמד (B2)** — `acceptCounterOn…`/`candidateCounterOn…` בכרטיסי
       ההצעה (`projectSuggestor`/`mashsuggest`). באנר "הריקמה הציעה הצעה נגדית"
       עם [אשר]/[הצע אחר] כשהסבב האחרון `proposedBy=project`.
       - הסבבים+vots(order) של הבקשה-של-המועמד נטענים ב-`83levMainUserQuery`
         (user-scoped asks/askms) וממופים ב-extractors ל-`myRoundProposedBy`/
         `myOrdern`/`myAskUsers`/`myAskId` (cross-ref askm לפי open_mashaabim).
       - **עדיפות**: הצעה שקיבלה counter קופצת ל-`PRIORITY_BAND.VOTE_PENDING`
         (processSuggestions/processResourceSuggestions).
       - **נוטיפיקציה למועמד**: `counterOnAsk(m)` עברו ל-`specificUsers`
         (חברים + ה-`candidateUserId`), מועבר מ-`reqtom`/`reqtojoin`.
- [x] **תיקון pendId ל-isRishon ב-reqtom** — `pendId={isRishon ? (pmashId ?? id) : id}`
       (Nego/submitNegoMash משתמש ב-pendId כ-pmash id במסלול הפנימי). pmashId כבר
       ממופה ב-extractor; נוסף מעבר ב-cards.svelte + הצהרה ב-typedef.
- [x] **כפתור B/D בדף הקבוע למשימה** (`availableMission/[id]`) — כפתור "להציע
       תנאים אחרים" פותח `<NegoM>` ושולח `proposeOnOpenMission`; הניתוב חבר/לא-חבר
       קורה בשרת (לכן אין צורך בזיהוי חברות בצד הלקוח — נפתר החוסם הקודם).
- [x] **כפתור B/D בדף הקבוע למשאב** (`availiableResorce/[id]`) — חולץ `ensureSpId`
       (בוחר SP קיים או יוצר חדש מסוג המשאב, כפי שהמשתמש תיאר); כפתור "להציע תנאים
       אחרים" בשני המסלולים (יצירה/בחירה) → פותח `<Nego>` → `proposeOnOpenMashaabim`
       עם ה-spId (השרת מנתב חבר/לא-חבר).
- [ ] helper משותף לחישוב סבב/תור/approvable (אופציונלי — השרת כבר מכריע).
- [ ] כפתורים בדפים הקבועים
