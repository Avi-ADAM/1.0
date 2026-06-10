# מפת הדרכים — מ-8 תכניות לקוד עובד

> **תפקיד המסמך**: מסמך-על שמרכז את 8 התכניות, מתעד את ההחלטות שכבר
> ננקטו, מעלה את ההחלטות שעדיין פתוחות, ומגדיר רצף עבודה קונקרטי.
>
> **לא מסמך תכנון נוסף.** קצר במכוון; הפנייה לתכניות לעומק.

---

## 1. אינדקס התכניות (סדר תלות)

| # | מסמך | סטטוס | פרישת ימים |
|---|---|---|---|
| 1 | [PLAN_user_sovereign_consent](./PLAN_user_sovereign_consent.md) | Phase 0 ✅ shipped (PR #28); Phases 1–5 → | חתימות + DAG + שיקוף |
| 2 | [PLAN_serverless_p2p_data](./PLAN_serverless_p2p_data.md) | תכנון; S0 מצב היום, S1–S5 → | שרת ↘ פוסט-שרת |
| 3 | [PLAN_concierge_in_p2p](./PLAN_concierge_in_p2p.md) | תכנון | חלוקת קונסיירז' לקבוצתי/ציבורי |
| 4 | [PLAN_action_migration_vs_p2p](./PLAN_action_migration_vs_p2p.md) | תכנון + רה-תיעדוף | המיגרציה כתפר ל-P2P |
| 5 | [PLAN_SITE_SHARE](./PLAN_SITE_SHARE.md) | R0/R1 ✅ shipped; R1.5–R4 → | האתר כשותף |
| 6 | [PLAN_central_rikma_definition](./PLAN_central_rikma_definition.md) | תכנון; **החלטת מודל ✅** (§3 כאן) | הרקמה כקואופ אמיתי |
| 7 | [PLAN_rikma_as_state_machine](./PLAN_rikma_as_state_machine.md) | תכנון; חלק מ-Phase 1.5 | שווי מתמטית מאומת |
| 8 | [PLAN_restime_in_signed_chain](./PLAN_restime_in_signed_chain.md) | תכנון | שתיקה חתומה |

---

## 2. החלטות שכבר ננקטו (אין צורך לחזור)

| מספר | החלטה | סוגיה | היכן מתועד |
|---|---|---|---|
| D-01 | Ed25519 (fallback ECDSA-P256) | אלגוריתם חתימה | consent #1 |
| D-02 | WebAuthn / Passkey כשער-חתימה | זהות | consent #1 |
| D-03 | אירוע = DAG (parents), לא chain | מבנה | consent #1 |
| D-04 | RFC 8785 JCS לקנוניזציה | סריאליזציה | consent #1 |
| D-05 | Service Worker = בעלים יחיד של המפתח | אבטחה | consent #1 |
| D-06 | מודל ה-spaces המוצפנים per-project, epoch keys, רוטציה בהסרת חבר | P2P #2 | P2P #2 §4 |
| D-07 | לא לחזור לאחור — המשך מיגרציית הפרוקסי, ברה-תיעדוף | אסטרטגיה | migration #4 |
| D-08 | **קואופ-תורמים (אופציה ג)** ברקמה המרכזית — חברות מבוססת על משימות מאושרות, לא על מינוי | מודל ארגוני | **central_rikma #6 §2** (החלטת המשתמש) |
| D-09 | התקרה (§2.5 SITE_SHARE) = תצוגתית, לא דרישה | UX | SITE_SHARE §0 |
| D-10 | ה-`paramSchema` של action חדש מותאם 1-ל-1 ל-`predicate` של אירוע חתום | API | migration #4 §6.1 |
| D-11 | Strapi נשאר mirror; הוא לא הסמכות | סנכרון | consent #1 §0 |
| D-12 | **כל ערך כספי = `bigint` של אגורות** (×100). לא Decimal/float | מודל מספרים | state-machine #7 §8.5 |
| D-13 | **משקל חבר לקונסנזוס = `Σ FinnishedMission.total + Σ Rikmash.total`** של אותו משתמש, ב-bigint של אגורות. בדיוק מה ש-`hachcal.svelte` מחשב היום (`fmiData[].total + rikmashes[].total`) | קונסנזוס משוקלל | central_rikma #6, מבוסס Q-A של המשתמש |
| D-14 | **כלל ברירת מחדל ל-rikmas = `weighted-unanimous-positive`**: כל חבר עם משקל > 0 חייב לאשר; חברי-0 (שאושרו אך לא ביצעו עדיין) **לא יכולים לחסום**, אבל גם לא מוכרחים להצביע | קונסנזוס משוקלל | מבוסס Q-B של המשתמש |
| D-15 | **לרקמה המרכזית בהווה** (2 תורמים מתוך 10 שאושרו) — D-14 חל אוטומטית: 2 התורמים = ה-quorum האפקטיבי. 8 שאושרו אך לא ביצעו = חברים, ללא משקל הצבעה | יישום מיידי | central_rikma #6 §3 |

החלטות D-08, D-13, D-14, D-15 נעולות ע"י המשתמש בהודעות בסשן זה ומשפיעות על כל מה שלהלן.

---

## 3. החלטות שעדיין פתוחות (חוסמות פאזה ספציפית)

הסדר = חשיבות. הראשונות חוסמות פאזה כבר עכשיו; האחרונות נדחות.

### חוסמות מיידי
- ~~**O-A: מהי "משימה מאושרת" ברקמה המרכזית?**~~ **✅ נסגר ע"י המשתמש**:
  בדיוק כמו כל רקמה — `FinnishedMission` (`noofhours × perhour = total`)
  ו-`Rikmash` (משאב שהושלם, `total`). ראה D-13.
- ~~**O-B: גודל הקוורום הפנימי**~~ **✅ נסגר ע"י המשתמש**: כמו כל רקמה,
  עם הסתייגות שמי שאושר אך לא ביצע משימה (משקל 0) **לא יכול לחסום**.
  מומש כ-`weighted-unanimous-positive` (D-14).
- **O-C: ניסוח החוקה** (constitutionHash) — חוסם C2 בלבד. לא קוד.

### חוסמות בעוד שלב-שניים
- **O-D: שיעור inner/outer** ב-hervachti של הרקמה המרכזית (central_rikma §9).
  הצעה ברירת-מחדל 75/25, דינמי. **חוסם C3**.
- **O-E: מקור מספר הצרכנים** (denominator לתקרה, SITE_SHARE §11).
  המלצה: משתמשים ייחודיים עם ≥1 Sheirut סגור.
- **O-F: בסיס מודל החישוב הסופי** (SITE_SHARE §3.1). פתוח.

### חוסמות פאזה רחוקה
- **O-G: שחזור מאיבוד מכשירים** — נדחה ל-PLAN_user_sovereign_consent Phase 2.
- **O-H: כללי טווח חופשה** (`member.away` — restime §8.5).

---

## 4. רצף הפאזות — היכן כל תכנית נכנסת

```
                   shipped         ────►   ──────►   ──────►   ──────►
   Phase 0     Phase 1         Phase 1.5    Phase 2   Phase 3      Phase 4+
   חתימות     shadow signing    state-       pairing   אכיפה        הרחבה
   (PR #28)    על tosplit       commitments  + UX      ב-tosplit    לפעולות נוספות
                + consent-spec  + money       + revoke +הסרת dual-
                ב-actions       bigint                   write
   ─────────────────────────────────────────────────────────────────────────
   ✅          ⬅ אנחנו כאן                                                
                                                                          
   במקביל:                                                                
                C0  ─────────►  C1 ─────►  C2 ─────►  C3 ─────►  C5      
                tag inner ring  tag outer  הצגת חוקה  credit ל-  Ratsons  
                                  ring                outer       פנימיים  
                                                                          
                                                      C4 (חיבור mission   
                                                       events ל-BOM)      
                                                                          
                R1.5 (ceiling)  R2 (adjust)  R3 (קונסיירז')  R4 (audit)   
                                                                          
                                            S2 הוסף relay מוצפן           
                                            (P2P #2)         S3 →   S4 →  
```

---

## 5. הצעדים הקונקרטיים הבאים (סדר עבודה לשבועות הקרובים)

### צעד 1 — תשתית מספרים-בטוחה (Phase 1.5 ⟶ ה-foundation לכל ה-state-machine)
- `src/lib/crypto/money.ts` — bigint של אגורות עם המרות בטוחות. **חובה לבצע ראשון** (D-12).
- טסטים: round-trip, חיבור/חיסור, חלוקה עם שאריות, פורמט תצוגה.

### צעד 2 — `consentSpec` על `ActionConfig`
- `src/lib/server/actions/types.ts` — שדה אופציונלי (לא breaking).
- ל-`/api/action` מחובר אוטומטית: אם קיים `consentSpec` — שיקוף אירוע חתום ל-`/api/consent/events`.
- מאפשר את כל ה-actions שכבר הוגרו לשרת אירוע חתום בלי לגעת בקלייאנט.

### צעד 3 — `QuorumProof` verifier
- `src/lib/consent/quorum.ts` — verifier טהור שמקבל `{ rule, evidence }` ומחזיר `{ ok, reachingActor? }`.
- תומך ב-`unanimous`, `majority`, `k-of-n`, `timeout` (placeholder לפאזה הבאה).
- מתוקשר ב-9 reducers בעתיד.

### צעד 4 — הרחבת `ConsentEvent` עם השדות החדשים (אופציונליים בלבד)
- `parentStateRoots?: string[]`
- `stateRoot?: string`
- `delta?: Delta[]`
- `quorum?: QuorumProof`
- אופציונליים = backward-compatible עם ה-Phase 0.

### צעד 5 — shadow signing על tosplit ראשון
- `src/lib/server/actions/configs/voteOnTosplit.ts` (חדש או הרחבה ל-addVote) — מוסיף `consentSpec` ראשון.
- ה-handler מקבל `signedEvent` אופציונלי מהלקוח; אם קיים — מאמת ושומר; אחרת — fallback ל-flow הישן.
- `ConsentBadge.svelte` ירוק/אפור ב-`/moach/[id]/split`.

### צעד 6 — `proposal.counter` + `consensus.timeout` reducers (skeleton)
- שני reducers חדשים שמטפלים בחישוב `currentRound` ו-`roundStart`.
- לא מחוברים ל-actions קיימים עדיין — רק התשתית, מוכנה לחיבור.

### צעד 7 — Merkle root טהור על `ProjectState`
- `src/lib/consent/stateRoot.ts` — חישוב hash דטרמיניסטי על ה-state.
- בהתחלה: לא ב-events חדשים, רק לוואלידציה צד.
- מאפשר Phase 1.5 כשמוכנים.

### צעד 8 — Central Rikma C0
- שדה `User.platformRing` (`'inner' | 'outer' | null`).
- קוד שמסמן `inner` למייסדים הקיימים, `outer` לכל onboarding חדש.
- אין שינוי תפעולי — תיוג בלבד.

---

## 6. מה כבר נבנה (Phase 1.5 foundations + הרחבת קונסנזוס משוקלל)

צעדים 1–4 בקומיט הראשון (146):
- `src/lib/crypto/money.ts` + טסטים — bigint של אגורות, distribute הוגן
- `src/lib/consent/quorum.ts` + טסטים — verifier ל-5 כללים
- `ConsentEvent` הורחב עם 4 שדות אופציונליים
- `ActionConfig.consentSpec` — שער ל-shadow signing

הרחבה (קומיט 146.1, אחרי הבהרת המשתמש על Q-A/Q-B):
- `src/lib/consent/memberWeight.ts` — חישוב משקל מ-FinnishedMission+Rikmash totals
- `quorum.ts` הורחב עם 2 כללים: `weighted-unanimous-positive`, `weighted-threshold`
- 12 טסטים חדשים שמייצגים את התרחיש של הרקמה המרכזית (2 תורמים מתוך 10)
- D-13, D-14, D-15 — החלטות נעולות לקונסנזוס משוקלל

**סה"כ 82 טסטים עוברים**, TS נקי בקבצים החדשים, backward-compat מלא.

## 7. השלב הבא

### ✅ צעד 5 — `consentSpec` ל-`addVote` + ConsentBadge (קומיט 146.2)
- `ConsentSpec.action`/`subjectType` הורחבו לתמוך בפונקציה (poly-action dispatch).
- `addVote` קיבל `consentSpec` שמנתב 6 ענפים:
  - `type='tosplit'` → `tosplit.vote`
  - `type='pend'` → `pendm.vote`
  - `type='sheirutpend'` → `sheirutpend.vote`
  - `type='ask'` → `ask.vote`
  - `type='decision'` → `decision.vote`
  - `type='weFinnish'` → `mission.approve.vote`
- `src/lib/client/shadowSign.ts` — orchestrator עם `deriveConsentEventFromAction`
  (טהור) ו-`signActionShadow` (browser-only, lazy-imports `signAndPublish`).
- `src/lib/components/consent/ConsentBadge.svelte` — Svelte 5 runes, 4 מצבים
  (signed/pending/unsigned/unverified), עוטף את ה-eventId לאודיט.
- 17 טסטים חדשים על ה-derivation, כולל poly-dispatch ו-skip-on-unknown.

### ✅ צעד 6 — `proposal.counter` + `consensus.timeout` reducers (קומיט 146.3)
- `ProjectState.rounds: Map<SubjectKey, SubjectRound>` עם `current`/`start`/`closed?`.
- 2 reducers + עדכון `tosplit.create` שיפתח round 0.
- 11 טסטים שמכסים את כל מטריצת ה-race של PLAN_restime §5:
  counter clears closed, stale timeout no-op, DAG-ancestry handles
  ordering, subject isolation.

### ✅ צעד 7 — `stateRoot` Merkle commitment (קומיט 146.4)
- `src/lib/consent/stateRoot.ts` — `normalizeState`, `computeStateRoot`.
- SHA-256 על canonical-JSON של ה-state. b64url.
- `STATE_ROOT_VERSION = 1` קבוע — שינוי עתידי ישבור בקול.
- 9 טסטים: commutativity, sensitivity (1ms שינוי = root אחר),
  round state משתתף ב-root.

### ✅ צעד 8 — Central Rikma C0: `platformRing` projection (קומיט 146.5)
- `src/lib/consent/platformRing.ts` — projection טהורה
  `events → Map<userId, 'inner' | 'outer'>`.
- Inner = יש לפחות `mission.approve` אחד שהם payee.
- Outer = `project.join` בלי הסכמת משימה.
- `mission.approve` auto-joins את ה-payee (אישור מבטא חברות).
- 11 טסטים, כולל **התרחיש המדויק שתיארת**: 2 inner (avi+dana),
  8 outer (committed-but-not-delivered).

## כל הצעדים 1–8 הושלמו. סה"כ 130 / 130 טסטים עוברים.

---

## 7. רשימת כל ה-actions שיהפכו לאירועים חתומים (קליפ)

על-בסיס סקירת `src/lib/server/actions/configs/`:

**עדיפות גבוהה (פעולות הסכמה — `consentSpec` חובה)**:
- `addVote` (ענפי tosplit, ask, pendm, pmash, sheirutpend, matanotpend, decision)
- `approveHaluka`, `confirmHaluka`
- `acceptRatsonProposal`, `rejectRatsonProposal`
- `joinRatson`, `leaveRatson`
- `voteOnPendm`, `voteOnPmash`
- `completeMission`, `endMission`
- `lockRatson` (חדש מ-PLAN_SHARED_PURCHASE)

**עדיפות בינונית (פעולות תפעוליות — `consentSpec` רצוי)**:
- `createTosplit`, `createHaluka`, `createSheirutHaluka`
- `createSheirutpend`, `createSheirutFromPending`
- `applyToMission`, `declineMissionRequest`
- `createMashaabimRequest`
- `updateTask`, `timerStart`, `timerStop`

**עדיפות נמוכה (תפעוליות פשוטות — לא חובה)**:
- `updateUserProfile`, `updateProject`
- `attachEntityToProcess`, `createProcess`
- שאר ה-CRUD.

זה לוקח-בית-מקום ~30 actions שיקבלו `consentSpec` ב-3-4 גלי-מיגרציה.

---

## 8. מה הקובץ הזה לא מחליף

הקובץ לא מחליף שום אחד מ-8 התכניות. הוא **אינדקס + מצפן + רשימת מטלות**.
לעומק על נושא ספציפי → המסמך הייעודי.

עדכון: כשמתקבלת החלטה (O-X), לעדכן כאן את §2/§3, ולסמן בשורה ב-§5 שהיא
"unblocked → ready". המסמך הזה הוא ה-source of truth לתעדוף.
