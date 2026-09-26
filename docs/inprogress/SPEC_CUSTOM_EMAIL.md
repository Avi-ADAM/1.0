# אפיון — מערכת Email מותאם אישית

> **בעיה מרכזית:** מערכת ה-Notifications הקיימת שולחת רק תבנית `SimpleNuti` (כותרת + גוף).  
> יש תבניות email מותאמות (`PendJustCreated`, `HalukaApproved`, `ComeVoteJoin`, `NonReg`)  
> שנשלחות **ישירות** מ-API endpoints ישנים ולא דרך מנגנון ה-Notifications.  
> המטרה: **לאחד הכל** כך שכל email עובר דרך `NotificationOrchestrator`.

---

## 1. מצב נוכחי — הבעיות

### 1.1 קבצי תבניות Email קיימים
```
src/lib/components/mail/
├── simpleNuti.svelte        ← משמש EmailService (מאוחד)
├── pendJustCreated.svelte   ← נשלח ישיר מ-/api/nuti (ישן!)
├── HalukaApproved.svelte    ← נשלח ישיר מ-??? (ישן!)
├── comeVoteJoin.svelte      ← נשלח ישיר מ-??? (ישן!)
├── nonreg.svelte            ← משתמש לא רשום (ישן!)
└── mail.svelte              ← generic base
```

### 1.2 שולחי Email ישירים (צריכים מיגרציה)
| קובץ | תבנית בשימוש | מתי נשלח | בעיה |
|------|-------------|----------|------|
| `routes/api/nuti/+server.js` | `PendJustCreated` | הצבעה על pend | לא עובר דרך NotificationOrchestrator |
| `routes/api/nutiUser/+server.js` | `SimpleNuti` | notification כללית | יש לו push + telegram אבל ישן |
| `routes/api/nutifyPm/+server.js` | ??? | PM notifications | לא מאוחד |

### 1.3 מה `SimpleNuti` מכיל כיום
```
כותרת (head) 
גוף (body text)
כפתור CTA (אופציונלי)
לוגו + footer
```
**חסר:** פרטים עשירים (שם שולח, תמונה, פרטי עסקה, סכום, קישור לפרויקט...)

---

## 2. ארכיטקטורה מוצעת

### 2.1 עקרון מנחה
**כל email יוצא דרך `EmailService.sendBulk()` שנמצא תחת `NotificationOrchestrator`.**  
אין שליחה ישירה מ-endpoint.

### 2.2 תבניות Email — מפה מלאה

#### תבנית: `SimpleNuti` (קיימת)
- **מתי:** כל notification כללית (עדכון task, הודעת צ'אט, וכו')
- **פרמטרים:** `head`, `body`, `ctaUrl`, `ctaText`, `lang`

#### תבנית: `PendJustCreated` (קיימת — צריך לאחד)
- **מתי:** נוצר pend חדש שדורש הצבעה
- **פרמטרים:**
  ```typescript
  {
    un: string,         // שם המשתמש שיצר
    username: string,   // username
    pl: string,         // project logo URL
    pn: string,         // project name
    kind: string,       // "finiappmi" | "suggestion" | ...
    rishon: boolean,    // האם הצבעה ראשונה?
    name: string,       // שם ה-pend
    lang: 'he' | 'en',
    restime: string     // זמן תגובה נדרש
  }
  ```

#### תבנית: `HalukaApproved` (קיימת — צריך לאחד)
- **מתי:** העברת כסף אושרה
- **פרמטרים:**
  ```typescript
  {
    senderName: string,
    recipientName: string,
    amount: number,
    currency: string,
    projectName: string,
    approvalDate: string,
    lang: 'he' | 'en'
  }
  ```

#### תבנית: `ComeVoteJoin` (קיימת — צריך לאחד)
- **מתי:** הזמנה להצטרף להצבעה (join request)
- **פרמטרים:** להגדיר לפי הקוד הקיים

#### תבניות חדשות נדרשות:
| תבנית | מתי | פרמטרים עיקריים |
|-------|-----|-----------------|
| `MeetingInvite` | הזמנה לפגישה | מארח, זמן, קישור |
| `TaskAssigned` | משימה הוקצתה | שם משימה, מועד, פרויקט |
| `SheirutUpdate` | עדכון בקשת שירות | סטטוס, שם מבקש, שם ספק |
| `WelcomeUser` | הרשמה ראשונה | שם משתמש, לינקים |
| `ProcessMilestone` | הגעה לאבן דרך ב-process | שם process, שלב, נקודות |

---

## 3. שינויים נדרשים ב-EmailService

### 3.1 הרחבת `loadTemplate()`
```typescript
// EmailService.ts - loadTemplate method
private async loadTemplate(templateName: string): Promise<any> {
  const templates: Record<string, () => Promise<any>> = {
    'SimpleNuti': () => import('$lib/components/mail/simpleNuti.svelte'),
    'PendJustCreated': () => import('$lib/components/mail/pendJustCreated.svelte'),
    'HalukaApproved': () => import('$lib/components/mail/HalukaApproved.svelte'),
    'ComeVoteJoin': () => import('$lib/components/mail/comeVoteJoin.svelte'),
    'MeetingInvite': () => import('$lib/components/mail/meetingInvite.svelte'),
    'TaskAssigned': () => import('$lib/components/mail/taskAssigned.svelte'),
    // ...
  };

  const loader = templates[templateName];
  if (!loader) throw new Error(`Email template '${templateName}' not found`);
  
  const module = await loader();
  return module.default;
}
```

### 3.2 הוספת `templateData` ל-NotificationConfig

**כיום ב-types.ts:**
```typescript
notification: {
  channels: ['email'],
  emailTemplate: 'SimpleNuti',
  // ...
}
```

**המצב הרצוי:**
```typescript
notification: {
  channels: ['email'],
  emailTemplate: 'PendJustCreated',
  
  // פרמטרים ספציפיים לתבנית זו
  emailTemplateData: {
    // keys ← מה לקחת מה-params של ה-action
    // values ← param names מה-ActionParams
    un: 'senderName',       // senderName ← מה-context
    pn: 'projectName',      // projectName ← מה-Strapi query
    kind: 'pendKind',       // pendKind ← מה-params
    restime: 'responseTime' // responseTime ← מה-params
  }
}
```

### 3.3 הרחבת `sendToUser()` ב-EmailService
```typescript
private async sendToUser(
  user: UserProfile,
  notification: NotificationData,
  template: any,
  render: any,
  context: ActionContext,
  templateData?: Record<string, any>  // ← חדש
): Promise<void> {
  const lang = this.selectLanguage(user.lang, context.lang);
  
  const emailHtml = await render(template, {
    // שדות קיימים (SimpleNuti)
    head: notification.title[lang] || notification.title.he,
    body: notification.body[lang] || notification.body.he,
    lang,
    
    // שדות מותאמים לתבנית ← חדש
    ...templateData
  });
  
  // ... שליחה ...
}
```

---

## 4. מיגרציה של `/api/nuti`

**לפני:**
```javascript
// routes/api/nuti/+server.js
async function sendMail(restime, pid, pl, pn, un, kind, name, email, ...) {
  const transporter = nodemailer.createTransport({ /* Zoho config */ });
  const emailHtml = await render(PendJustCreated, { un, pl, pn, kind, ... });
  transporter.sendMail({ from, to: email, subject, html: emailHtml });
}
```

**אחרי (ב-addVote action config):**
```typescript
notification: {
  recipients: {
    type: 'projectMembers',
    config: { projectIdParam: 'projectId', excludeSender: true }
  },
  templates: {
    title: { he: 'הצבעה חדשה נדרשת', en: 'Vote required' },
    body: { he: '{{senderName}} יצר הצבעה חדשה', en: '{{senderName}} created a new vote' }
  },
  channels: ['email', 'push', 'socket'],
  emailTemplate: 'PendJustCreated',
  emailTemplateData: {
    un: '{{senderName}}',
    pn: '{{projectName}}',
    kind: '{{pendKind}}',
    restime: '{{responseTime}}'
  }
}
```

---

## 5. ניהול הגדרות Email של משתמש

### 5.1 שדות קיימים (Strapi User)
- `noMail: boolean` — ביטול כל emailsנ
- `lang: 'he' | 'en'` — שפה לתבניות

### 5.2 שדות חסרים (להוסיף ל-Strapi)
```typescript
interface UserEmailPreferences {
  noMail: boolean;                    // קיים
  emailDigest: 'instant' | 'daily' | 'weekly' | 'never';  // ← חדש
  emailCategories: {
    votes: boolean;          // הצבעות
    taskUpdates: boolean;    // עדכוני משימות
    financials: boolean;     // פיננסים (הלוקות)
    meetings: boolean;       // פגישות
    marketing: boolean;      // שיווק/עדכוני מוצר
  };
}
```

### 5.3 Unsubscribe Link
כל email חייב לכלול קישור unsubscribe (GDPR).  
**מנגנון:** token חד-פעמי → `/api/email/unsubscribe?token=xxx`

---

## 6. תשתית שליחה

### 6.1 ספק נוכחי
- ZOHO SMTP (`smtp.zoho.com:465`)
- כתובת: `notifications@1lev1.com`

### 6.2 Rate Limits & Queue
**בעיה:** אין queue — 100 emails יישלחו בו-זמנית → SMTP throttle

**פתרון:**
```typescript
// EmailService - batch sending with delay
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

async sendBulk(recipients, ...) {
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(user => this.sendToUser(user, ...)));
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }
}
```

---

## 7. תכנית יישום

### שלב 1: הגדרת `emailTemplateData` ב-types (½ יום)
- הוסף `emailTemplateData?: Record<string, string>` ל-`NotificationConfig`
- עדכן `EmailService.sendBulk()` לקבל ולהעביר את הנתונים

### שלב 2: עדכון `loadTemplate()` ב-EmailService (1 יום)
- הוסף את כל התבניות הקיימות
- בדוק שכולן עובדות עם `svelty-email render`

### שלב 3: הוסף `emailTemplateData` ל-addVote.ts (½ יום)
- מגיר את `/api/nuti` לתוך ה-action
- בדוק שהמיילים נשלחים נכון

### שלב 4: מגיר `/api/nutiUser` ו-`/api/nutifyPm` (1 יום)
- כל ה-notification logic עובר ל-NotificationOrchestrator

### שלב 5: תבניות חדשות (2-3 ימים)
- `MeetingInvite`, `TaskAssigned`, `SheirutUpdate`

### שלב 6: Email Preferences בממשק (2 ימים)
- הוסף UI ב-`/me` לניהול העדפות
- הוסף שדות ל-Strapi User schema

---

## 8. בדיקות

| תרחיש | ציפייה |
|-------|--------|
| addVote → email PendJustCreated | email מגיע עם כל הפרטים |
| noMail=true | email לא נשלח |
| lang=en | email באנגלית |
| 50 recipients | batch sending, לא crash |
| תבנית לא קיימת | שגיאה ברורה ב-log, לא crash |
