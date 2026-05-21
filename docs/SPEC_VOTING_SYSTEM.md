# אפיון — מערכת הצבעה אחידה

> **שאלת המפתח:** האם כדאי לנהל את תהליך ההצבעה בצורה אחת בכל המקומות?  
> **תשובה:** כן — אבל בצורה גמישה עם סוגי הצבעה שונים על אותה תשתית.

---

## 1. מצב נוכחי — כאוס הצבעה

### 1.1 סוגי הצבעה הקיימים (ב-addVote.ts)
```
1. pend          — הצבעה על הצעות (ישות pend ב-Strapi)
2. sheirutpend   — הצבעה על בקשות שירות
3. ask           — שאלות/הצבעות כלליות בפרויקט
4. decision      — החלטות פרויקט
5. weFinnish     — אישור סיום משימה (TODO — לא מיושם!)
```

### 1.2 בעיות קיימות
- **קוד ספגטי ב-addVote.ts** (413 שורות, switch case ענק)
- **לוגיקת consensus קשיחה** — `unanimous` בלבד (אחידות מלאה)
  ```javascript
  // שורה 228+ ב-addVote.ts
  if (positiveMemberVotes.length >= totalMembers) {
    // הצליח — unanimous בלבד!
  }
  ```
- **weFinnish לא ממומש** — TODO בקוד
- **לא ניתן לשנות threshold** בלי לשנות קוד
- **לא ניתן להגדיר per-project rules** — כולם unanimous
- **אין היסטוריה מרכזית** של הצבעות
- **אין תמיכה ב-abstain** (הימנעות)

---

## 2. ארכיטקטורה מוצעת

### 2.1 עקרון — ישות `vote` מרכזית

**הגדרת vote (Strapi schema — חדש):**
```typescript
interface Vote {
  id: string;
  
  // מה הצביעו
  what: 'yes' | 'no' | 'abstain';  // הרחבה מ-boolean
  zman: string;                      // ISO timestamp
  
  // מי הצביע
  voter: User;
  ide: number;                       // numeric user ID (לcomponents)
  order: number;
  
  // על מה (polymorphic relation)
  subjectType: 'pend' | 'sheirutpend' | 'ask' | 'decision' | 'weFinnish' | 'mission';
  subjectId: string;
  
  // הקשר
  projectId?: string;
  forumId?: string;
}
```

### 2.2 הגדרת VoteSession (חדש — לשמירת state)
```typescript
interface VoteSession {
  id: string;
  subjectType: string;
  subjectId: string;
  projectId: string;
  
  // כללי consensus
  consensusRule: 'unanimous' | 'majority' | 'threshold' | 'weighted' | 'agreers_only';
  consensusThreshold?: number;  // 0-1, לדוגמה 0.66 = 66%
  
  // קהל מצביעים
  eligibleVoters: string[];     // user IDs שמורשים להצביע
  voterSource: 'projectMembers' | 'specificUsers' | 'invited';
  
  // זמן
  expiresAt?: string;           // הצבעה עם deadline
  
  // תוצאות
  status: 'open' | 'passed' | 'rejected' | 'expired' | 'cancelled';
  resolvedAt?: string;
  resolvedBy?: string;          // 'system' | userId
  
  // הצבעות בפועל
  votes: Vote[];
}
```

---

## 3. לוגיקת Consensus — קטלוג

### 3.1 `unanimous` — פה אחד (ברירת מחדל)
```typescript
// עובר כש: כולם הצביעו ✓, ואין אחד שהצביע ✗
const passed = 
  positiveVotes === eligibleVoters.length &&
  negativeVotes === 0;
```
**שימוש:** pend בפרויקטים (הצבעת ריקמה)

### 3.2 `majority` — רוב פשוט
```typescript
// עובר כש: >50% מהמצביעים הצביעו ✓
const passed = positiveVotes > totalVoted / 2;
// ✓ לא מחכים לכולם — מספיק רוב מהמצביעים
```
**שימוש:** החלטות שוטפות

### 3.3 `threshold` — סף מינימלי
```typescript
// עובר כש: X% מהמצביעים הצביעו ✓ (X = consensusThreshold)
const passed = positiveVotes / totalVoted >= threshold;
// למשל 66% = רוב מיוחס
```
**שימוש:** החלטות גדולות שלא דורשות פה אחד

### 3.4 `weighted` — הצבעה משוקללת (עתידי)
```typescript
// לכל מצביע משקל שונה (לפי role/stake/ownership %)
const passed = weightedPositive / totalWeight >= threshold;
```
**שימוש:** שיתוף בעלות, הצבעות עם שותפים

### 3.5 `agreers_only` — רק המסכימים
```typescript
// עובר כש: כל מי שהצביע (לא חייב כולם) הצביע ✓
const passed = negativeVotes === 0 && positiveVotes > 0;
// מי שלא הצביע = לא מונע אישור
```
**שימוש:** הצטרפות ל-group purchase (ratson-share)

---

## 4. תכנית יישום ב-addVote Action

### 4.1 הפרד ל-subHandlers לפי סוג
```typescript
// configs/addVote.ts — ארכיטקטורה חדשה

graphqlOperation: async (params, context, { strapi }) => {
  const { voteType, subjectId, what } = params;
  
  const handler = voteHandlers[voteType];
  if (!handler) throw new Error(`Unknown vote type: ${voteType}`);
  
  return handler(params, context, strapi);
}

const voteHandlers: Record<string, VoteHandler> = {
  pend: handlePendVote,
  sheirutpend: handleSheirutPendVote,
  ask: handleAskVote,
  decision: handleDecisionVote,
  weFinnish: handleWeFinnishVote,  // ← implement!
  mission: handleMissionApprovalVote,
};
```

### 4.2 Consensus Engine — קוד מרכזי
```typescript
// lib/server/voting/consensusEngine.ts (קובץ חדש)

export function evaluateConsensus(
  voteSession: VoteSession,
  newVote: Vote
): ConsensusResult {
  const allVotes = [...voteSession.votes, newVote];
  const positive = allVotes.filter(v => v.what === 'yes').length;
  const negative = allVotes.filter(v => v.what === 'no').length;
  const total = voteSession.eligibleVoters.length;
  const voted = allVotes.length;
  
  switch (voteSession.consensusRule) {
    case 'unanimous':
      if (negative > 0) return { status: 'rejected', reason: 'negative_vote' };
      if (positive >= total) return { status: 'passed' };
      return { status: 'pending', progress: positive / total };
      
    case 'majority':
      if (positive > total / 2) return { status: 'passed' };
      if (negative > total / 2) return { status: 'rejected' };
      return { status: 'pending', progress: positive / voted };
      
    case 'threshold':
      const threshold = voteSession.consensusThreshold ?? 0.66;
      if (voted === total) {  // כולם הצביעו
        return positive / voted >= threshold
          ? { status: 'passed' }
          : { status: 'rejected' };
      }
      return { status: 'pending', progress: positive / total };
      
    case 'agreers_only':
      if (negative > 0) return { status: 'rejected', reason: 'negative_vote' };
      if (positive > 0) return { status: 'passed' };
      return { status: 'pending', progress: 0 };
  }
}
```

---

## 5. חוויית משתמש — UI אחיד

### 5.1 קומפוננט `<VotePanel>` מאוחד
```svelte
<!-- lib/components/voting/VotePanel.svelte -->
<script>
  let { 
    voteType,        // 'pend' | 'ask' | 'decision' | 'weFinnish'
    subjectId,
    projectId,
    voteSession,     // VoteSession object
    currentUserId
  } = $props();
</script>

<!-- תצוגה אחידה לכל סוגי ההצבעה -->
<div class="vote-panel">
  <VoteProgress {voteSession} />
  <VoteButtons 
    onVote={(what) => executeAction('addVote', { voteType, subjectId, what, projectId })}
    hasVoted={userHasVoted(voteSession, currentUserId)}
  />
  <VotersList {voteSession} />
  {#if voteSession.expiresAt}
    <CountdownTimer expiresAt={voteSession.expiresAt} />
  {/if}
</div>
```

### 5.2 אינדיקטורים ויזואליים
- **פרוגרס בר** — X/Y הצביעו, כמה נדרש
- **avatar chips** — מי הצביע ✓/✗/⏳
- **countdown** — כשיש deadline
- **consensus label** — "נדרש פה אחד" / "נדרש 66%" / "רוב"

---

## 6. מיגרציה שלבית

### שלב 1: Consensus Engine (3 ימים)
- צור `src/lib/server/voting/consensusEngine.ts`
- הפרד logic מ-addVote.ts לפונקציות טהורות
- כתוב unit tests לכל סוג consensus

### שלב 2: Refactor addVote.ts (2 ימים)
- פרוס ל-handler per vote type
- השתמש ב-ConsensusEngine
- ממש `weFinnish` (בוצע TODO)

### שלב 3: VoteSession ב-Strapi (2 ימים)
- צור Content Type `vote-session` בStrapi
- שדה `consensusRule` עם enum
- שדה `eligibleVoters` relation
- שדה `expiresAt` datetime

### שלב 4: UI מאוחד (3 ימים)
- צור קומפוננט `<VotePanel>` 
- עדכן את כל המסכים שמשתמשים בהצבעה

### שלב 5: Notifications (1 יום)
- `voteOpened` → הודע למצביעים
- `votePassed` → הודע לכולם
- `voteRejected` → הודע לכולם
- `voteExpired` → cron job

---

## 7. הצבעות ולתהליכים — Per-Project Config

**הגדרות ברמת פרויקט (להוסיף ל-Project entity):**
```typescript
interface ProjectVotingConfig {
  defaultConsensusRule: 'unanimous' | 'majority' | 'threshold';
  defaultThreshold?: number;
  pendExpirationDays?: number;   // כמה ימים לפני פקיעת הצבעה
  allowAbstain: boolean;          // אפשר הימנעות
  requireAllVoters: boolean;      // לחכות לכולם?
}
```

---

## 8. שאלות פתוחות

1. **מה עם הצבעות ישנות?** — migration script לשמירת היסטוריה?
2. **חד-פעמי vs מתמשך** — pend הוא חד-פעמי; ask הוא מתמשך (שאלות חוזרות)?
3. **ביטול הצבעה** — האם מותר לשנות הצבעה? בתוך כמה זמן?
4. **anonymous voting** — האם יש צורך בהצבעה אנונימית?
5. **delegation** — האם מותר לאחד להצביע בשם אחר? (proxy voting)

---

## 9. שלבי ה-weFinnish (לממש)

`weFinnish` = אישור קולקטיבי שמשימה הסתיימה.

**תהליך:**
1. בעל משימה לוחץ "סיימתי" → יוצר `weFinnish vote session`
2. כל חברי הפרויקט מקבלים notification לאשר
3. לפי consensus rule → משימה מסומנת כ-`completed`
4. אם נדחה → בעל המשימה מקבל פידבק

**Action:**
```typescript
// completeMission.ts ← כבר קיים
// צריך להוסיף: יצירת weFinnish VoteSession
// addVote.ts ← להוסיף: handleWeFinnishVote
```
